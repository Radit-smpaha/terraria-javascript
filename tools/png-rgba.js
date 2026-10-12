// ============================================================================
// png-rgba.js -- true transparent PNG output for the Megalodon asset pack.
//
// tools/mini-canvas.js rasterises into a Float32 buffer whose alpha channel is
// forced to 1 on every write (it composites against black), so its own
// writePNG() can only emit opaque images. This module recovers real coverage by
// rendering the SAME scene twice -- once against an opaque black background and
// once against an opaque white one -- and un-blending:
//
//     dst_black = src * a           dst_white = src * a + (1 - a) * 255
//     a = 1 - (dst_white - dst_black) / 255
//     src = dst_black / a
//
// That is exact for any stack of source-over layers, so anti-aliased edges and
// the shark's own translucent FX keep their real alpha instead of being baked
// onto a dark plate.
//
// Exports: extractRGBA, writeRGBAPNG, sheetPNG, bboxRGBA, placeInto
// ============================================================================
'use strict';
const zlib = require('zlib');

const CHUNK = (type, data) => {
  const len = Buffer.alloc(4); len.writeUInt32BE(data.length);
  const t = Buffer.from(type, 'ascii');
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(Buffer.concat([t, data])), 0);
  return Buffer.concat([len, t, data, crc]);
};
let CRC_TABLE = null;
function crc32(buf) {
  if (!CRC_TABLE) {
    CRC_TABLE = new Uint32Array(256);
    for (let n = 0; n < 256; n++) {
      let c = n;
      for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 8;
      CRC_TABLE[n] = c >>> 0;
    }
  }
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

/** Encode an 8-bit RGBA (non-premultiplied) buffer as a PNG file body. */
function encodePNG(w, h, rgba) {
  const raw = Buffer.alloc((w * 4 + 1) * h);
  for (let y = 0; y < h; y++) {
    raw[y * (w * 4 + 1)] = 0;                       // filter: none
    rgba.copy(raw, y * (w * 4 + 1) + 1, y * w * 4, (y + 1) * w * 4);
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(w, 0); ihdr.writeUInt32BE(h, 4);
  ihdr[8] = 8;    // bit depth
  ihdr[9] = 6;    // colour type: truecolour + alpha
  ihdr[10] = 0; ihdr[11] = 0; ihdr[12] = 0;
  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    CHUNK('IHDR', ihdr),
    CHUNK('IDAT', zlib.deflateSync(raw, { level: 9 })),
    CHUNK('IEND', Buffer.alloc(0))
  ]);
}

/**
 * Un-blend the two background passes into straight-alpha RGBA.
 * blackCtx must have been drawn over an opaque black plate (the mini-canvas
 * buffer already starts as 0,0,0,0, which composites exactly like that), and
 * whiteCtx the same scene over an opaque white plate.
 * Returns an RGBA buffer at the canvas' own raster dimensions (use ss = 1).
 */
function extractRGBA(blackCtx, whiteCtx) {
  const b = blackCtx.canvas.__cv, w = whiteCtx.canvas.__cv;
  const W = b.W, H = b.H;
  const rgba = Buffer.alloc(W * H * 4);
  const cl = (v) => v < 0 ? 0 : v > 255 ? 255 : Math.round(v);
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const o = (y * W + x) * 4;
      const db = b.buf[o], dw = w.buf[o];
      const a = 1 - (dw - db) / 255;
      if (a <= 0.0035) continue;                       // transparent
      const inv = 1 / a;
      rgba[o] = cl(db * inv);
      rgba[o + 1] = cl(b.buf[o + 1] * inv);
      rgba[o + 2] = cl(b.buf[o + 2] * inv);
      rgba[o + 3] = cl(a * 255);
    }
  }
  return rgba;
}

/** Tight bounding box of pixels with meaningful alpha; null when empty. */
function bboxRGBA(w, h, rgba) {
  let x0 = w, y0 = h, x1 = -1, y1 = -1;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      if (rgba[(y * w + x) * 4 + 3] > 8) {
        if (x < x0) x0 = x; if (x > x1) x1 = x;
        if (y < y0) y0 = y; if (y > y1) y1 = y;
      }
    }
  }
  return x1 < 0 ? null : { x: x0, y: y0, w: x1 - x0 + 1, h: y1 - y0 + 1 };
}

/** Copy a sub-rect of one RGBA buffer into a fresh tight RGBA buffer. */
function cropRGBA(w, h, rgba, box) {
  const out = Buffer.alloc(box.w * box.h * 4);
  for (let y = 0; y < box.h; y++) {
    const src = ((box.y + y) * w + box.x) * 4;
    rgba.copy(out, y * box.w * 4, src, src + box.w * 4);
  }
  return out;
}

/** Paste `src` RGBA at (dx,dy) inside a w x h destination RGBA buffer. */
function pasteRGBA(dst, dw, dh, dx, dy, src, sw, sh) {
  for (let y = 0; y < sh; y++) {
    const ty = dy + y;
    if (ty < 0 || ty >= dh) continue;
    for (let x = 0; x < sw; x++) {
      const tx = dx + x;
      if (tx < 0 || tx >= dw) continue;
      const s = (y * sw + x) * 4, d = (ty * dw + tx) * 4;
      dst[d] = src[s]; dst[d + 1] = src[s + 1];
      dst[d + 2] = src[s + 2]; dst[d + 3] = src[s + 3];
    }
  }
}

/**
 * Write one horizontal spritesheet. Each frame is { w, h, rgba, ox, oy } where
 * (ox, oy) is the frame's tight bbox origin inside the shared cell, so every
 * frame lands in the same relative place and nothing drifts. The cell is the
 * union of every frame's bbox plus `margin`. `center` is the anchor point (the
 * animal's centre, or an effect's centre) in pre-crop pixel space; it is
 * returned converted into cell pixels as `origin`.
 */
function writeSheetPNG(path, frames, cols, margin = 6, center = null) {
  let ux = Infinity, uy = Infinity, vx = -Infinity, vy = -Infinity;
  for (const f of frames) {
    ux = Math.min(ux, f.ox); uy = Math.min(uy, f.oy);
    vx = Math.max(vx, f.ox + f.w); vy = Math.max(vy, f.oy + f.h);
  }
  const cellW = (vx - ux) + margin * 2;
  const cellH = (vy - uy) + margin * 2;
  const rows = Math.ceil(frames.length / cols);
  const out = Buffer.alloc(cellW * cols * cellH * rows * 4);
  frames.forEach((f, i) => {
    pasteRGBA(out, cellW * cols, cellH * rows,
      (i % cols) * cellW + (f.ox - ux) + margin,
      Math.floor(i / cols) * cellH + (f.oy - uy) + margin, f.rgba, f.w, f.h);
  });
  require('fs').writeFileSync(path, encodePNG(cellW * cols, cellH * rows, out));
  const ox = center === 'bbox' ? Math.round(cellW / 2) : center ? center[0] - ux + margin : 0;
  const oy = center === 'bbox' ? Math.round(cellH / 2) : center ? center[1] - uy + margin : 0;
  return {
    cellW, cellH, cols, rows, sheetW: cellW * cols, sheetH: cellH * rows,
    originX: ox, originY: oy
  };
}

/** Write a single-frame PNG. */
function writeSinglePNG(path, frame) {
  require('fs').writeFileSync(path, encodePNG(frame.w, frame.h, frame.rgba));
  return { cellW: frame.w, cellH: frame.h, cols: 1, rows: 1, sheetW: frame.w, sheetH: frame.h };
}

module.exports = { encodePNG, extractRGBA, bboxRGBA, cropRGBA, pasteRGBA, writeSheetPNG, writeSinglePNG };
