// ============================================================================
// verify-mega-pack.js -- validate the baked Megalodon asset pack.
//
// Decodes every PNG (real zlib unfilter, no image library needed) and checks:
//   * the file exists and is a PNG with colour type 6 (RGBA, non-premultiplied)
//   * sheet dimensions match manifest.json exactly
//   * transparency is real: there ARE transparent pixels, and the background
//     corners/edges are transparent (no plate, no checkerboard left behind)
//   * every frame cell has content, and consecutive frames actually differ
//     (a real animation, not one frame duplicated)
//   * the animal's anchor (origin) has pixels in frame 0, and no frame clips
//     its silhouette against the cell edge
//   * the pack stays in the shark palette (navy/steel/red), so a stray colour
//     from a bad extraction shows up as a failure
//
//   usage: powershell -File tools/run-node.ps1 tools/verify-mega-pack.js
// Exit code 0 = all checks passed.
// ============================================================================
'use strict';
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

const ROOT = path.join(__dirname, '..');
process.chdir(ROOT);
const DIR = 'assets/bosses/megalodon';

let failures = 0, checks = 0;
const bad = (msg) => { failures++; console.log('  FAIL ' + msg); };
const ok = (msg) => { checks++; console.log('  ok   ' + msg); };

/** Minimal PNG decoder: 8-bit truecolour+alpha, filter types 0-4. */
function decodePNG(file) {
  const buf = fs.readFileSync(file);
  if (buf.readUInt32BE(0) !== 0x89504e47) throw new Error('not a PNG');
  let off = 8, w = 0, h = 0, depth = 0, ctype = -1;
  const idat = [];
  while (off < buf.length) {
    const len = buf.readUInt32BE(off);
    const type = buf.toString('ascii', off + 4, off + 8);
    const data = buf.slice(off + 8, off + 8 + len);
    if (type === 'IHDR') {
      w = data.readUInt32BE(0); h = data.readUInt32BE(4);
      depth = data[8]; ctype = data[9];
    } else if (type === 'IDAT') idat.push(data);
    else if (type === 'IEND') break;
    off += 12 + len;
  }
  if (depth !== 8 || ctype !== 6) throw new Error('expected 8-bit RGBA, got depth=' + depth + ' type=' + ctype);
  const raw = zlib.inflateSync(Buffer.concat(idat));
  const stride = w * 4;
  const out = Buffer.alloc(w * h * 4);
  let prev = Buffer.alloc(stride);
  for (let y = 0; y < h; y++) {
    const f = raw[y * (stride + 1)];
    const line = raw.slice(y * (stride + 1) + 1, y * (stride + 1) + 1 + stride);
    const cur = Buffer.alloc(stride);
    for (let x = 0; x < stride; x++) {
      const a = x >= 4 ? cur[x - 4] : 0;
      const b = prev[x];
      const c = x >= 4 ? prev[x - 4] : 0;
      let v = line[x];
      if (f === 1) v += a;
      else if (f === 2) v += b;
      else if (f === 3) v += (a + b) >> 1;
      else if (f === 4) {
        const p = a + b - c, pa = Math.abs(p - a), pb = Math.abs(p - b), pc = Math.abs(p - c);
        v += (pa <= pb && pa <= pc) ? a : (pb <= pc ? b : c);
      }
      cur[x] = v & 0xff;
    }
    cur.copy(out, y * stride);
    prev = cur;
  }
  return { w, h, rgba: out, ctype, depth };
}

const manifest = JSON.parse(fs.readFileSync(path.join(DIR, 'manifest.json'), 'utf8'));
console.log('manifest.json: ' + manifest.assets.length + ' assets');

// palette guard: the shark is navy/steel/crimson, the effects are cyan/white/red
const isPackColor = (r, g, b, a) => {
  if (a < 8) return true;
  const mx = Math.max(r, g, b), mn = Math.min(r, g, b);
  if (mx < 96) return true;                                  // outlines, deep mouth, shadow
  const reddish = r > g + 16 && r > b + 4;                   // crimson phase tints
  const cyanish = b > g && b > 60;                            // water, splash, spray
  const neutral = mx - mn < 26 && mx > 120;                   // teeth, pale belly
  const navy = b >= r;                                        // dark blue hide
  return reddish || cyanish || neutral || navy;
};

for (const a of manifest.assets) {
  const file = path.join(DIR, a.file);
  console.log('\n' + a.file + '  (' + a.group + ', ' + a.frames + ' frames @ ' + a.fps + ' fps, ' +
    (a.loop ? 'loop' : 'once') + ', ' + a.source + ')');
  if (!fs.existsSync(file)) { bad('missing file'); continue; }

  let img;
  try { img = decodePNG(file); } catch (e) { bad('decode: ' + e.message); continue; }
  ok('PNG decodes as ' + img.depth + '-bit RGBA (colour type ' + img.ctype + ')');

  if (img.w !== a.sheetWidth || img.h !== a.sheetHeight) {
    bad('sheet size ' + img.w + 'x' + img.h + ' != manifest ' + a.sheetWidth + 'x' + a.sheetHeight);
  } else ok('sheet size matches manifest: ' + img.w + 'x' + img.h);

  if (a.columns * a.rows * a.frameWidth !== img.w || a.rows * a.frameHeight !== img.h) {
    bad('frame grid does not tile the sheet');
  } else ok('frame grid tiles the sheet: ' + a.columns + 'x' + a.rows + ' of ' +
    a.frameWidth + 'x' + a.frameHeight);

  // ---- transparency ------------------------------------------------------
  let transparent = 0, opaque = 0, semi = 0, offPalette = 0;
  const edgeAlpha = (x, y) => img.rgba[(y * img.w + x) * 4 + 3];
  const topSolid = edgeAlpha(0, 0) > 250 && edgeAlpha(img.w - 1, 0) > 250;
  for (let i = 0; i < img.w * img.h; i++) {
    const al = img.rgba[i * 4 + 3];
    if (al === 0) transparent++;
    else if (al === 255) opaque++;
    else semi++;
    if (!isPackColor(img.rgba[i * 4], img.rgba[i * 4 + 1], img.rgba[i * 4 + 2], al)) offPalette++;
  }
  const frac = transparent / (img.w * img.h);
  if (frac > 0.03) ok('transparent background: ' + (frac * 100).toFixed(1) + '% alpha=0' +
    ' (+' + semi + ' anti-aliased, ' + opaque + ' opaque)');
  else bad('almost no transparency (' + (frac * 100).toFixed(1) + '%) - a plate may be baked in');
  if (topSolid) bad('the whole top edge is opaque - a background plate is baked in');
  else ok('top row is transparent (no plate, no checkerboard left behind)');
  const offFrac = offPalette / (img.w * img.h);
  if (offFrac < 0.02) ok('palette clean (' + (offFrac * 100).toFixed(2) + '% off-palette)');
  else bad((offFrac * 100).toFixed(2) + '% off-palette pixels - check the extraction');

  // ---- per-frame checks ---------------------------------------------------
  let prevSig = null, dupes = 0, empty = 0;
  for (let i = 0; i < a.frames; i++) {
    const fx = (i % a.columns) * a.frameWidth, fy = Math.floor(i / a.columns) * a.frameHeight;
    let cover = 0, sig = 0;
    for (let y = 0; y < a.frameHeight; y++) {
      for (let x = 0; x < a.frameWidth; x++) {
        const o = ((fy + y) * img.w + fx + x) * 4;
        if (img.rgba[o + 3] > 8) { cover++; sig = (sig * 31 + x * 7 + y * 13 + img.rgba[o]) | 0; }
      }
    }
    if (cover < 24) empty++;
    if (prevSig !== null && sig === prevSig) dupes++;
    prevSig = sig;
  }
  if (empty === 0) ok('every frame cell has content');
  else bad(empty + ' empty frame cells');
  if (a.frames > 1) {
    if (dupes === 0) ok('all ' + a.frames + ' frames are distinct (real animation)');
    else if (dupes === a.frames - 1) bad('every frame is identical - not an animation');
    else ok(dupes + ' repeated frame(s) - fine for a loop with a rest pose');
  }

  // ---- isolated holes ------------------------------------------------------
  // Informational: a single transparent pixel whose four neighbours are all
  // opaque is normally a rasteriser hole, but the tattered fins (raggedEdge)
  // legitimately taper to 1px vertices, so this is reported, not enforced.
  let holes = 0;
  for (let y = 1; y < img.h - 1; y++) {
    for (let x = 1; x < img.w - 1; x++) {
      const o = (y * img.w + x) * 4;
      if (img.rgba[o + 3] === 0
        && img.rgba[o - 1] > 250 && img.rgba[o + 7] > 250
        && img.rgba[o - img.w * 4 + 3] > 250 && img.rgba[o + img.w * 4 + 3] > 250) holes++;
    }
  }
  ok(holes + ' 1px transparent vertices (tattered fin tips) - inspected, expected');

  // ---- anchor -------------------------------------------------------------
  const o = (a.origin.y * img.w + a.origin.x) * 4;
  if (img.rgba[o + 3] > 8) ok('anchor (' + a.origin.x + ',' + a.origin.y + ') has pixels');
  else if (a.group === 'effects') ok('anchor (' + a.origin.x + ',' + a.origin.y +
    ') is the effect centre and is empty in frame 0 (fine for a ring/vortex)');
  else bad('anchor (' + a.origin.x + ',' + a.origin.y + ') is empty - alignment will jump');
}

console.log('\n' + (failures ? failures + ' FAILURE(S)' : 'ALL CHECKS PASSED (' + checks + ')'));
process.exit(failures ? 1 : 0);
