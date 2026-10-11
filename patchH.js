// ===== PATCH H: idempotent, self-verifying re-apply =======================
// Reads ocean.js, applies every missing edit, writes, then re-reads from disk
// and asserts each marker is present. Loops until all markers are on disk or
// three attempts pass, so a partial write can never be silently accepted.
const fs = require('fs');
const MARKERS = {
  'duneFloor': 'dunes',
  'fraction of width that is flat': 'plateau profile',
  'No bright bar across the top': 'water tile fix',
  'Abyssal seabed overrides': 'seabed tile overrides',
  'never breach the surface': 'kraken water clamp',
  'eyeSpread': 'symmetric eyes'
};
// [marker, oldText, newText]
const EDITS = [
  ['duneFloor',
   '  const seaY = Math.max(24, Math.floor(this.height * 0.24));\n  const floorY = this.height - 18;\n  this.surfaceHeights.fill(floorY);',
   '  const seaY = Math.max(24, Math.floor(this.height * 0.30));\n  const floorY = this.height - 34;\n  const duneFloor = new Int16Array(this.width);\n  for (let x = 0; x < this.width; x++) {\n    duneFloor[x] = floorY - 4 + Math.round(\n      Math.sin(x * 0.09) * 3 + Math.sin(x * 0.031 + 1.7) * 4);\n  }\n  this.surfaceHeights.fill(floorY);'],
  ['fraction of width that is flat',
   '  const groundHeight = new Int16Array(this.width);\n  for (let x = 0; x < this.width; x++) {\n    let ground = floorY;\n    for (const island of allIslands) {\n      const d = Math.abs(x - island.cx);\n      if (d > island.halfWidth) continue;\n      const t = d / island.halfWidth;\n      const bump = Math.cos((t * Math.PI) / 2);\n      const surf = Math.round(floorY - (floorY - (seaY - island.height)) * bump);\n      if (surf < ground) ground = surf;\n    }\n    groundHeight[x] = ground;\n  }',
   '  const groundHeight = new Int16Array(this.width);\n  for (let x = 0; x < this.width; x++) {\n    let ground = duneFloor[x];\n    for (const island of allIslands) {\n      const d = Math.abs(x - island.cx);\n      if (d > island.halfWidth) continue;\n      const t = d / island.halfWidth;\n      // A plateau profile: a broad flat crown with soft rounded shoulders, so\n      // an island is a table of land you can build and fight on, never a spike\n      // or a pole. Islets get an even wider flat top.\n      const flat = island.flat ? 0.58 : 0.42;\n      const crown = seaY - island.height;\n      let surf;\n      if (t < flat) {\n        surf = crown;\n      } else {\n        const k = (t - flat) / (1 - flat);\n        const eased = 1 - k * k * (3 - 2 * k);\n        surf = Math.round(crown + (duneFloor[x] - crown) * (1 - eased));\n      }\n      if (surf < ground) ground = surf;\n    }\n    groundHeight[x] = ground;\n  }'],
  ['No bright bar across the top',
   "    tile.fillStyle = '#062b43';\n    tile.fillRect(0, 0, TILE_SIZE, TILE_SIZE);\n    tile.fillStyle = '#0c4a6e';\n    tile.fillRect(0, 0, TILE_SIZE, 4);\n    tile.fillStyle = '#0e7490';\n    tile.fillRect(2, 8 + ripple, 7, 2);\n    tile.fillRect(13, 15 - ripple, 8, 2);\n    tile.fillStyle = 'rgba(103,232,249,0.55)';\n    tile.fillRect(5, 1, 3, 2);",
   "    tile.fillStyle = '#062b43';\n    tile.fillRect(0, 0, TILE_SIZE, TILE_SIZE);\n    // No bright bar across the top: the old 4px strip of #0c4a6e painted a\n    // hard horizontal line at the top of every tile, which read as stripes\n    // covering the entire ocean. Soft caustics and silt motes replace it.\n    tile.fillStyle = 'rgba(56, 189, 248, 0.10)';\n    tile.fillRect(1, 7 + ripple, 9, 2);\n    tile.fillRect(14, 13 - ripple, 6, 2);\n    tile.fillStyle = 'rgba(165, 243, 252, 0.08)';\n    tile.fillRect(6, 2 + ripple, 5, 1);\n    tile.fillRect(10, 18 - ripple, 7, 1);\n    tile.fillStyle = 'rgba(226, 232, 240, 0.10)';\n    tile.fillRect(3, 9 + (ripple > 2 ? 3 : 0), 1, 1);\n    tile.fillRect(17, 16 - (ripple > 2 ? 4 : 0), 1, 1);"],
  ['Abyssal seabed overrides',
   '  const pulse = 0.65 + Math.sin(Date.now() * 0.003 + tx * 0.7 + ty) * 0.2;\n  if (tile === OCEAN_TILES.PEARL) {',
   '  const pulse = 0.65 + Math.sin(Date.now() * 0.003 + tx * 0.7 + ty) * 0.2;\n  // ---- Abyssal seabed overrides -----------------------------------------\n  // The planet used the bright overworld palette, which reads as a desert\n  // under water. In the ocean dimension these tiles are drawn as their wet,\n  // dark, silt-covered abyssal counterparts instead.\n  const inOceanDim = this.isInOcean();\n  if (inOceanDim && tile === TILES.SAND) {\n    ctx.fillStyle = \'#3b2f1e\';\n    ctx.fillRect(sx, sy, TILE_SIZE, TILE_SIZE);\n    if (exposedTop) {\n      ctx.fillStyle = \'#57452c\';\n      ctx.fillRect(sx, sy, TILE_SIZE, 4);\n      ctx.fillStyle = \'rgba(123, 101, 64, 0.5)\';\n      ctx.fillRect(sx + 2, sy + 6, 8, 1);\n      ctx.fillRect(sx + 11, sy + 11, 8, 1);\n      ctx.fillRect(sx + 5, sy + 17, 7, 1);\n    }\n    ctx.fillStyle = \'rgba(216, 197, 155, 0.5)\';\n    ctx.fillRect(sx + (tx * 7 + ty * 5) % 16, sy + (tx * 3 + ty * 11) % 18, 2, 2);\n    ctx.fillStyle = \'rgba(240, 230, 210, 0.35)\';\n    ctx.fillRect(sx + (tx * 11 + ty * 3) % 14, sy + (tx * 5 + ty * 7) % 16, 3, 2);\n    return;\n  }\n  if (inOceanDim && tile === TILES.SANDSTONE) {\n    ctx.fillStyle = \'#4a3b26\';\n    ctx.fillRect(sx, sy, TILE_SIZE, TILE_SIZE);\n    ctx.fillStyle = \'#5c4a30\';\n    ctx.fillRect(sx, sy + 2, TILE_SIZE, 3);\n    ctx.fillRect(sx, sy + 11, TILE_SIZE, 3);\n    ctx.fillStyle = \'#3a2e1e\';\n    ctx.fillRect(sx, sy + 8, TILE_SIZE, 2);\n    ctx.fillRect(sx, sy + 19, TILE_SIZE, 2);\n    ctx.fillStyle = \'rgba(216, 197, 155, 0.35)\';\n    ctx.fillRect(sx + (tx * 5 + ty * 13) % 15, sy + (tx * 9 + ty * 3) % 17, 2, 1);\n    return;\n  }\n  if (inOceanDim && tile === TILES.STONE) {\n    ctx.fillStyle = \'#141d26\';\n    ctx.fillRect(sx, sy, TILE_SIZE, TILE_SIZE);\n    if (exposedTop) {\n      ctx.fillStyle = \'#1f2c38\';\n      ctx.fillRect(sx, sy, TILE_SIZE, 3);\n    }\n    ctx.fillStyle = \'rgba(226, 232, 240, 0.07)\';\n    ctx.fillRect(sx + (tx * 7 + ty * 11) % 17, sy + (tx * 3 + ty * 5) % 19, 3, 1);\n    ctx.fillStyle = \'rgba(148, 197, 226, 0.06)\';\n    ctx.fillRect(sx + (tx * 13 + ty * 7) % 14, sy + (tx * 5 + ty * 3) % 17, 4, 1);\n    return;\n  }\n  if (inOceanDim && tile === TILES.DIRT) {\n    ctx.fillStyle = \'#2b2318\';\n    ctx.fillRect(sx, sy, TILE_SIZE, TILE_SIZE);\n    ctx.fillStyle = \'rgba(123, 101, 64, 0.4)\';\n    ctx.fillRect(sx + (tx * 9 + ty * 3) % 15, sy + (tx * 3 + ty * 9) % 18, 6, 1);\n    ctx.fillStyle = \'rgba(0, 0, 0, 0.35)\';\n    ctx.fillRect(sx + (tx * 5 + ty * 13) % 12, sy + (tx * 7 + ty * 5) % 16, 4, 2);\n    return;\n  }\n  if (tile === OCEAN_TILES.PEARL) {'],
  ['never breach the surface',
   '      if (world) {\n        this.x = Math.max(0, Math.min(world.pixelWidth - this.width, this.x));\n        this.y = Math.max(0, Math.min(world.pixelHeight - this.height, this.y));\n      }',
   '      if (world) {\n        this.x = Math.max(0, Math.min(world.pixelWidth - this.width, this.x));\n        // A kraken is a sea creature, not a balloon: keep the body in the\n        // water. The mantle top must stay at-or-below the waterline (a small\n        // crown breach is allowed) and the skirt must stay above the floor.\n        const seaTop = (world.oceanArena ? world.oceanArena.seaY : 12) * TILE_SIZE;\n        const floorTop = world.pixelHeight || world.height * TILE_SIZE;\n        this.y = Math.max(seaTop - this.height * 0.10,\n          Math.min(floorTop - this.height * 1.25, this.y));\n      }'],
  ['eyeSpread',
   '    // Two eyes set symmetrically across the head, near the front.\n    drawEye(ex, ey, 1, true);\n    drawEye(cx - (ex - cx), ey + 2, 0.72, false);',
   '    // Two eyes, perfectly mirrored about the head\'s centre line and identical\n    // in every respect: same radius, same row, same pupil, same glint. Only\n    // the primary carries the pulsing target ring, and that ring is drawn\n    // OUTSIDE the orb so it can never make one eye look bigger than the other.\n    const eyeSpread = this.width * 0.11;\n    drawEye(cx - eyeSpread, ey, 1, false);\n    drawEye(cx + eyeSpread, ey, 1, true);']
];

let attempt = 0;
while (attempt < 3) {
  attempt++;
  let src = fs.readFileSync('ocean.js', 'utf8');
  let changed = false;
  for (const [marker, oldText, newText] of EDITS) {
    if (src.includes(marker)) continue;
    const ot = oldText, nt = newText;
    if (!src.includes(ot)) { console.log('  TEXT NOT FOUND: ' + MARKERS[marker]); continue; }
    src = src.replace(ot, nt);
    changed = true;
    console.log('  applied ' + MARKERS[marker]);
  }
  if (changed) fs.writeFileSync('ocean.js', src, 'utf8');
  // Verify from a FRESH read.
  const check = fs.readFileSync('ocean.js', 'utf8');
  const missing = EDITS.map(e => e[0]).filter(m => !check.includes(m));
  console.log('attempt ' + attempt + ': missing -> ' + JSON.stringify(missing));
  if (missing.length === 0) { console.log('ALL MARKERS PRESENT'); break; }
}
