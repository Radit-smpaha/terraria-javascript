// ============================================================================
// mini-canvas.js â€” a tiny in-process Canvas2D recorder + rasterizer.
//
// The Megalodon is pure Canvas2D art. To iterate on its MODEL and ANIMATION
// without a browser (and without node on PATH), this implements just enough of
// the 2D context to *draw* the real render() and rasterize it to a PNG:
//   - affine transform stack (translate/scale/rotate/transform/setTransform)
//   - paths: moveTo/lineTo/closePath/rect/arc/ellipse/quadraticCurveTo/
//     bezierCurveTo, beginPath, and clip()
//   - fill (nonzero), stroke (round joins/caps), fillRect/strokeRect/clearRect
//   - globalAlpha, fillStyle/strokeStyle (#hex, rgb(), rgba())
// Flat colors only (gradients fall back to their first stop) â€” which is fine,
// the Megalodon is deliberately flat-shaded Terraria-style art.
// Rasterizes at supersample factor SS (default 2) into an RGBA buffer and
// writes a real PNG with zlib, so it can be opened like any screenshot.
// ============================================================================
'use strict';
const zlib = require('zlib');

// ---------------------------------------------------------------- utilities
const MUL = '@@mul@@';
function matMul(m, n) { // m after n: point' = m * (n * p)
  return [
    m[0] * n[0] + m[2] * n[1],
    m[1] * n[0] + m[3] * n[1],
    m[0] * n[2] + m[2] * n[3],
    m[1] * n[2] + m[3] * n[3],
    m[0] * n[4] + m[2] * n[5] + m[4],
    m[1] * n[4] + m[3] * n[5] + m[5]
  ];
}
const IDENT = () => [1, 0, 0, 1, 0, 0];
function apply(m, x, y) { return [m[0] * x + m[2] * y + m[4], m[1] * x + m[3] * y + m[5]]; }
function det(m) { return m[0] * m[3] - m[1] * m[2]; }

function parseColor(c) {
  if (c == null) return null;
  if (typeof c !== 'string') {
    if (c && c.__stops) return parseColor(c.__stops[0]);
    return null;
  }
  let m = /^#([0-9a-f]{3})$/i.exec(c.trim());
  if (m) {
    const h = m[1];
    return [parseInt(h[0] + h[0], 16), parseInt(h[1] + h[1], 16), parseInt(h[2] + h[2], 16), 1];
  }
  m = /^#([0-9a-f]{6})$/i.exec(c.trim());
  if (m) {
    const h = m[1];
    return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16), 1];
  }
  m = /^rgba?\(([^)]+)\)$/i.exec(c.trim());
  if (m) {
    const p = m[1].split(',').map(s => parseFloat(s));
    return [p[0] | 0, p[1] | 0, p[2] | 0, p.length > 3 ? p[3] : 1];
  }
  return null; // gradient object, named color we do not know, ...
}
function mixOver(dst, src) { // source-over: src*a + dst*(1-a); buffer stays opaque
  const a = src[3];
  if (a <= 0) return;
  const ia = 1 - a;
  dst[0] = src[0] * a + dst[0] * ia;
  dst[1] = src[1] * a + dst[1] * ia;
  dst[2] = src[2] * a + dst[2] * ia;
  dst[3] = 1;
}

// ------------------------------------------------------------- geometry ops
// Clip a polygon (array of [x,y]) to a half-plane side of the line through
// (x0,y0)-(x1,y1) with the given inward normal sign. Simple and exact for the
// convex-ish outlines we clip with.
function clipEdge(pts, x0, y0, x1, y1) {
  const out = [];
  const dx = x1 - x0, dy = y1 - y0;
  const len = Math.hypot(dx, dy) || 1;
  // inward normal (assume clip polygon is clockwise in screen space)
  const nx = dy / len, ny = -dx / len;
  for (let i = 0; i < pts.length; i++) {
    const cur = pts[i], prev = pts[(i + pts.length - 1) % pts.length];
    const sc = (cur[0] - x0) * nx + (cur[1] - y0) * ny;
    const sp = (prev[0] - x0) * nx + (prev[1] - y0) * ny;
    if (sc >= 0) {
      if (sp < 0) {
        const t = sp / (sp - sc);
        out.push([prev[0] + (cur[0] - prev[0]) * t, prev[1] + (cur[1] - prev[1]) * t]);
      }
      out.push(cur.slice());
    } else if (sp >= 0) {
      const t = sp / (sp - sc);
      out.push([prev[0] + (cur[0] - prev[0]) * t, prev[1] + (cur[1] - prev[1]) * t]);
    }
  }
  return out;
}
function clipToConvex(pts, clip) {
  let p = pts;
  for (let i = 0; i < clip.length && p.length; i++) {
    const a = clip[i], b = clip[(i + 1) % clip.length];
    p = clipEdge(p, a[0], a[1], b[0], b[1]);
  }
  return p;
}

// ------------------------------------------------------------------ raster
class Canvas {
  constructor(width, height, ss = 2) {
    this.width = width; this.height = height; this.ss = Math.max(1, ss | 0);
    this.W = width * this.ss; this.H = height * this.ss;
    this.buf = new Float32Array(this.W * this.H * 4);
    this.state = {
      m: IDENT(), fill: [0, 0, 0, 1], stroke: [0, 0, 0, 1],
      lw: 1, alpha: 1, clip: null, cap: 'butt', join: 'miter'
    };
    this.stack = [];
    this.path = null;
    this.errors = [];
  }
  save() { this.stack.push(Object.assign({}, this.state)); }
  restore() {
    const s = this.stack.pop();
    if (!s) { this.errors.push('unbalanced restore'); return; }
    this.state = s;
  }
  beginPath() { this.path = [[]]; }
  /** The current subpath: the last one, started by moveTo/rect/ellipse. */
  _cur() {
    if (!this.path) this.path = [[]];
    if (!this.path.length) this.path.push([]);
    return this.path[this.path.length - 1];
  }
  _startSub() { if (!this.path) this.path = []; this.path.push([]); }
  moveTo(x, y) { this._startSub(); this._cur().push(apply(this.state.m, x, y)); }
  lineTo(x, y) { this._cur().push(apply(this.state.m, x, y)); }
  closePath() {
    const p = this._cur();
    if (p.length > 1) p.push(p[0].slice());
  }
  rect(x, y, w, h) {
    this._startSub();
    const p = this._cur();
    const m = this.state.m;
    p.push(apply(m, x, y), apply(m, x + w, y), apply(m, x + w, y + h), apply(m, x, y + h));
    p.push(apply(m, x, y));
  }
  _bez(p0, p1, p2, p3, n) {
    const out = [];
    for (let i = 1; i <= n; i++) {
      const t = i / n, u = 1 - t;
      out.push([
        u * u * u * p0[0] + 3 * u * u * t * p1[0] + 3 * u * t * t * p2[0] + t * t * t * p3[0],
        u * u * u * p0[1] + 3 * u * u * t * p1[1] + 3 * u * t * t * p2[1] + t * t * t * p3[1]
      ]);
    }
    return out;
  }
  _quad(p0, p1, p2, n) {
    const out = [];
    for (let i = 1; i <= n; i++) {
      const t = i / n, u = 1 - t;
      out.push([u * u * p0[0] + 2 * u * t * p1[0] + t * t * p2[0],
        u * u * p0[1] + 2 * u * t * p1[1] + t * t * p2[1]]);
    }
    return out;
  }
  bezierCurveTo(x1, y1, x2, y2, x3, y3) {
    const p = this._cur();
    const p0 = p.length ? p[p.length - 1] : apply(this.state.m, 0, 0);
    const p1 = apply(this.state.m, x1, y1), p2 = apply(this.state.m, x2, y2), p3 = apply(this.state.m, x3, y3);
    for (const q of this._bez(p0, p1, p2, p3, 18)) p.push(q);
  }
  quadraticCurveTo(x1, y1, x2, y2) {
    const p = this._cur();
    const p0 = p.length ? p[p.length - 1] : apply(this.state.m, 0, 0);
    const p1 = apply(this.state.m, x1, y1), p2 = apply(this.state.m, x2, y2);
    for (const q of this._quad(p0, p1, p2, 16)) p.push(q);
  }
  arc(x, y, r, a0, a1, ccw) {
    this._ellipsePath(x, y, r, r, 0, a0, a1, !!ccw);
  }
  ellipse(x, y, rx, ry, rot, a0, a1, ccw) {
    this._ellipsePath(x, y, rx, ry, rot, a0, a1, !!ccw);
  }
  _ellipsePath(x, y, rx, ry, rot, a0, a1, ccw) {
    const p = this._cur();
    const m = this.state.m;
    const cos = Math.cos(rot), sin = Math.sin(rot);
    let da = a1 - a0;
    if (!ccw && da < 0) da += Math.PI * 2;
    if (ccw && da > 0) da -= Math.PI * 2;
    const n = Math.max(8, Math.ceil(Math.abs(da) / 0.18));
    for (let i = 0; i <= n; i++) {
      const a = a0 + da * i / n;
      const ex = Math.cos(a) * rx, ey = Math.sin(a) * ry;
      const px = x + ex * cos - ey * sin, py = y + ex * sin + ey * cos;
      p.push(apply(m, px, py));
    }
  }
  translate(x, y) { const t = [1, 0, 0, 1, x, y]; this.state.m = matMul(this.state.m, t); }
  scale(sx, sy) { const s = [sx, 0, 0, sy, 0, 0]; this.state.m = matMul(this.state.m, s); }
  rotate(a) { const c = Math.cos(a), s = Math.sin(a); this.state.m = matMul(this.state.m, [c, s, -s, c, 0, 0]); }
  transform(a, b, c, d, e, f) { this.state.m = matMul(this.state.m, [a, b, c, d, e, f]); }
  setTransform(a, b, c, d, e, f) { this.state.m = [a, b, c, d, e, f]; }
  resetTransform() { this.state.m = IDENT(); }
  clip() {
    const loops = this.path;
    if (!loops || !loops.length) return;
    const base = this.state.clip || [[[-1e6, -1e6], [1e6, -1e6], [1e6, 1e6], [-1e6, 1e6]]];
    const clipped = [];
    for (const loop of loops) if (loop.length > 2) {
      let p = loop;
      for (const c of base) p = clipToConvex(p, c);
      if (p.length > 2) clipped.push(p);
    }
    this.state.clip = clipped;
  }
  // ------- paint ops -------
  _scanFill(polys, color, alpha) {
    if (!polys.length || !color || alpha <= 0.001) return;
    const ss = this.ss;
    // bucket edges by subsample row
    const edges = [];
    let ymin = Infinity, ymax = -Infinity;
    for (const poly of polys) {
      for (let i = 0; i < poly.length; i++) {
        const a = poly[i], b = poly[(i + 1) % poly.length];
        const ax = a[0] * ss, ay = a[1] * ss, bx = b[0] * ss, by = b[1] * ss;
        const y0 = Math.min(ay, by), y1 = Math.max(ay, by);
        if (Math.abs(y1 - y0) < 1e-9) continue;
        const dir = by > ay ? 1 : -1;
        edges.push({
          y0, y1, dir,
          xa: ax, ya: ay, xi: (bx - ax) / (by - ay)
        });
        ymin = Math.min(ymin, y0); ymax = Math.max(ymax, y1);
      }
    }
    if (!edges.length) return;
    edges.sort((p, q) => p.y0 - q.y0);
    let row = Math.max(0, Math.floor(ymin));
    let ei = 0;
    const active = [];
    const r0 = [color[0], color[1], color[2], color[3] * alpha];
    while (row <= Math.min(this.H - 1, Math.ceil(ymax))) {
      // Activate against the sampled centre (row + 0.5), NOT the integer row:
      // an edge whose top lands at y = 155.3 IS live at row 155 (yc = 155.5),
      // and comparing to the row alone dropped that scanline, which showed up
      // as 1px transparent slits along the top of every shading band.
      while (ei < edges.length && edges[ei].y0 <= row + 0.5) active.push(edges[ei++]);
      for (let i = active.length - 1; i >= 0; i--) if (active[i].y1 < row) active.splice(i, 1);
      const yc = row + 0.5;
      const xs = [];
      for (const e of active) {
        if (yc < e.y0 || yc >= e.y1) continue;
        xs.push({ x: e.xa + (yc - e.ya) * e.xi, dir: e.dir });
      }
      xs.sort((p, q) => p.x - q.x);
      let wind = 0;
      for (let i = 0; i < xs.length; i++) {
        wind += xs[i].dir;
        if (i + 1 < xs.length && wind !== 0) {
          const x0 = Math.max(0, Math.ceil(xs[i].x - 0.5));
          const x1 = Math.min(this.W - 1, Math.floor(xs[i + 1].x - 0.5));
          for (let x = x0; x <= x1; x++) {
            const o = (row * this.W + x) * 4;
            mixOver(this.buf.subarray(o, o + 4), r0);
          }
        }
      }
      row++;
    }
  }
  _strokePolys(loops) {
    const lw = this.state.lw;
    const r = lw / 2;
    const polys = [];
    for (const loop of loops) {
      if (loop.length < 2) continue;
      for (let i = 0; i < loop.length - 1; i++) {
        const a = loop[i], b = loop[i + 1];
        const dx = b[0] - a[0], dy = b[1] - a[1];
        const len = Math.hypot(dx, dy);
        if (len < 1e-9) continue;
        const nx = -dy / len * r, ny = dx / len * r;
        polys.push([
          [a[0] + nx, a[1] + ny], [b[0] + nx, b[1] + ny],
          [b[0] - nx, b[1] - ny], [a[0] - nx, a[1] - ny]
        ]);
      }
      // round joins: a disc at every vertex
      if (this.state.join !== 'miter') {
        for (const v of loop) polys.push(this._disc(v[0], v[1], r, 10));
      }
      if (this.state.cap !== 'butt') {
        polys.push(this._disc(loop[0][0], loop[0][1], r, 10));
        polys.push(this._disc(loop[loop.length - 1][0], loop[loop.length - 1][1], r, 10));
      }
    }
    return polys;
  }
  _disc(cx, cy, r, n) {
    const out = [];
    for (let i = 0; i < n; i++) {
      const a = i / n * Math.PI * 2;
      out.push([cx + Math.cos(a) * r, cy + Math.sin(a) * r]);
    }
    return out;
  }
  _loops() {
    if (!this.path) return [];
    // >= 2 points, not > 2: a bare moveTo/lineTo line has exactly two, and a
    // real canvas DOES stroke it. Filtering at > 2 silently swallowed every
    // straight-line stroke in the game art (fin rays, scar strokes, seams).
    return this.path.filter(l => l.length > 1);
  }
  _clipApply(polys) {
    const clip = this.state.clip;
    if (!clip) return polys;
    const out = [];
    for (const p of polys) {
      let q = p;
      for (const c of clip) { q = clipToConvex(q, c); if (!q.length) break; }
      if (q.length > 2) out.push(q);
    }
    return out;
  }
  fill() {
    const polys = this._clipApply(this._loops());
    for (const p of polys) for (const pt of p) if (!Number.isFinite(pt[0]) || !Number.isFinite(pt[1])) {
      this.errors.push('NaN in fill path'); return;
    }
    this._scanFill(polys, this.state.fill, this.state.alpha);
  }
  stroke() {
    const polys = this._clipApply(this._strokePolys(this._loops()));
    this._scanFill(polys, this.state.stroke, this.state.alpha);
  }
  fillRect(x, y, w, h) {
    if (this.state.fill) {
      const pts = [apply(this.state.m, x, y), apply(this.state.m, x + w, y),
        apply(this.state.m, x + w, y + h), apply(this.state.m, x, y + h)];
      this._scanFill(this._clipApply([pts]), this.state.fill, this.state.alpha);
    }
  }
  clearRect() { /* no-op for our purposes */ }
  // ------------------------------------------------------------- PNG output
  toPNG() {
    const w = this.width, h = this.height, ss = this.ss;
    const rgba = Buffer.alloc(w * h * 4);
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        let r = 0, g = 0, b = 0, a = 0;
        for (let sy = 0; sy < ss; sy++) for (let sx = 0; sx < ss; sx++) {
          const o = ((y * ss + sy) * this.W + (x * ss + sx)) * 4;
          r += this.buf[o]; g += this.buf[o + 1]; b += this.buf[o + 2]; a += this.buf[o + 3];
        }
        const n = ss * ss;
        const o = (y * w + x) * 4;
        const ao = a / n, ai = 1 - ao;
        rgba[o] = Math.round(r / n + 24 * ai);
        rgba[o + 1] = Math.round(g / n + 32 * ai);
        rgba[o + 2] = Math.round(b / n + 44 * ai);
        rgba[o + 3] = 255;
      }
    }
    const raw = Buffer.alloc((w * 4 + 1) * h);
    for (let y = 0; y < h; y++) {
      raw[y * (w * 4 + 1)] = 0;
      rgba.copy(raw, y * (w * 4 + 1) + 1, y * w * 4, (y + 1) * w * 4);
    }
    const idat = zlib.deflateSync(raw, { level: 6 });
    const chunk = (type, data) => {
      const len = Buffer.alloc(4); len.writeUInt32BE(data.length);
      const t = Buffer.from(type, 'ascii');
      const crcBuf = Buffer.concat([t, data]);
      const crc = Buffer.alloc(4);
      const c = crc32(crcBuf);
      crc.writeUInt32BE(c, 0);
      return Buffer.concat([len, t, data, crc]);
    };
    const ihdr = Buffer.alloc(13);
    ihdr.writeUInt32BE(w, 0); ihdr.writeUInt32BE(h, 4);
    ihdr[8] = 8; ihdr[9] = 6; ihdr[10] = 0; ihdr[11] = 0; ihdr[12] = 0;
    return Buffer.concat([
      Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
      chunk('IHDR', ihdr), chunk('IDAT', idat), chunk('IEND', Buffer.alloc(0))
    ]);
  }
}
let CRC_TABLE = null;
function crc32(buf) {
  if (!CRC_TABLE) {
    CRC_TABLE = new Uint32Array(256);
    for (let n = 0; n < 256; n++) {
      let c = n;
      for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
      CRC_TABLE[n] = c >>> 0;
    }
  }
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

// ------------------------------------------------------------- public API
function createCtx(width, height, ss = 2) {
  const cv = new Canvas(width, height, ss);
  const target = {
    canvas: { width, height, __cv: cv },
    get errors() { return cv.errors; },
    save() { cv.save(); }, restore() { cv.restore(); },
    beginPath() { cv.beginPath(); }, closePath() { cv.closePath(); },
    moveTo(x, y) { cv.moveTo(x, y); }, lineTo(x, y) { cv.lineTo(x, y); },
    rect(x, y, w, h) { cv.rect(x, y, w, h); },
    quadraticCurveTo(a, b, c, d) { cv.quadraticCurveTo(a, b, c, d); },
    bezierCurveTo(a, b, c, d, e, f) { cv.bezierCurveTo(a, b, c, d, e, f); },
    arc(a, b, c, d, e, f) { cv.arc(a, b, c, d, e, f); },
    ellipse(a, b, c, d, e, f, g, h) { cv.ellipse(a, b, c, d, e, f, g, h); },
    fill() { cv.fill(); }, stroke() { cv.stroke(); },
    clip() { cv.clip(); },
    fillRect(x, y, w, h) { cv.fillRect(x, y, w, h); },
    strokeRect(x, y, w, h) { const p = cv._loops(); cv.rect(x, y, w, h); cv.stroke(); cv.path = p; },
    clearRect() { cv.clearRect(); },
    translate(x, y) { cv.translate(x, y); }, scale(x, y) { cv.scale(x, y); },
    rotate(a) { cv.rotate(a); },
    transform(a, b, c, d, e, f) { cv.transform(a, b, c, d, e, f); },
    setTransform(a, b, c, d, e, f) { cv.setTransform(a, b, c, d, e, f); },
    resetTransform() { cv.resetTransform(); },
    createLinearGradient() { return { __stops: ['#000000'], addColorStop(o, c) { this.__stops[0] = c; } }; },
    createRadialGradient() { return { __stops: ['#000000'], addColorStop(o, c) { this.__stops[0] = c; } }; },
    createPattern() { return null; },
    measureText() { return { width: 10 }; },
    getImageData() { return { data: new Uint8ClampedArray(4) }; },
    putImageData() {}, drawImage() {},
  };
  const props = {
    lineWidth: v => { cv.state.lw = v; }, lineCap: v => { cv.state.cap = v; },
    lineJoin: v => { cv.state.join = v; },
    fillStyle: v => { const c = parseColor(v); if (c) cv.state.fill = c; else cv.state.fill = null; },
    strokeStyle: v => { const c = parseColor(v); if (c) cv.state.stroke = c; else cv.state.stroke = null; },
    globalAlpha: v => { cv.state.alpha = v; },
    globalCompositeOperation() {}, filter() {}, shadowBlur() {}, shadowColor() {},
    shadowOffsetX() {}, shadowOffsetY() {}, font() {}, textAlign() {}, textBaseline() {},
    imageSmoothingEnabled() {}, imageSmoothingQuality() {}, lineDashOffset() {},
  };
  return new Proxy(target, {
    get(t, p) {
      if (p in t) return t[p];
      if (p in props) return props[p];
      // writes to unknown props: accept silently (noop getter)
      return (...a) => undefined;
    },
    set(t, p, v) {
      if (p in props) { props[p](v); return true; }
      t[p] = v; return true;
    }
  });
}
function writePNG(ctx, path, ssOverride) {
  const cv = ctx.canvas.__cv;
  const fs = require('fs');
  fs.writeFileSync(path, cv.toPNG());
  return cv.errors.slice();
}
module.exports = { createCtx, writePNG, Canvas };
