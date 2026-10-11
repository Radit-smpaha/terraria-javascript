// ===== PATCH G: re-apply anything missing, idempotently ====================
const fs = require('fs');
let src = fs.readFileSync('ocean.js', 'utf8');
const EOL = src.includes('\r\n') ? '\r\n' : '\n';
src = src.replace(/\r\n/g, '\n');
let applied = 0, skipped = 0;
function apply(label, marker, oldText, newText) {
  if (src.indexOf(marker) !== -1) { console.log('  skip (already) ' + label); skipped++; return; }
  oldText = oldText.replace(/\r\n/g, '\n');
  newText = newText.replace(/\r\n/g, '\n');
  if (src.indexOf(oldText) === -1) { console.log('  MISSING TEXT: ' + label); return; }
  src = src.replace(oldText, newText);
  applied++;
  console.log('  ok  ' + label);
}

// --- seabed dunes + higher floor ---
apply('dunes', 'duneFloor',
`  const seaY = Math.max(24, Math.floor(this.height * 0.24));
  const floorY = this.height - 18;
  this.surfaceHeights.fill(floorY);`,
`  const seaY = Math.max(24, Math.floor(this.height * 0.30));
  const floorY = this.height - 34;
  const duneFloor = new Int16Array(this.width);
  for (let x = 0; x < this.width; x++) {
    duneFloor[x] = floorY - 4 + Math.round(
      Math.sin(x * 0.09) * 3 + Math.sin(x * 0.031 + 1.7) * 4);
  }
  this.surfaceHeights.fill(floorY);`);

// --- plateau profile ---
apply('plateau profile', 'fraction of width that is flat',
`  const groundHeight = new Int16Array(this.width);
  for (let x = 0; x < this.width; x++) {
    let ground = floorY;
    for (const island of allIslands) {
      const d = Math.abs(x - island.cx);
      if (d > island.halfWidth) continue;
      const t = d / island.halfWidth;
      const bump = Math.cos((t * Math.PI) / 2);
      const surf = Math.round(floorY - (floorY - (seaY - island.height)) * bump);
      if (surf < ground) ground = surf;
    }
    groundHeight[x] = ground;
  }`,
`  const groundHeight = new Int16Array(this.width);
  for (let x = 0; x < this.width; x++) {
    let ground = duneFloor[x];
    for (const island of allIslands) {
      const d = Math.abs(x - island.cx);
      if (d > island.halfWidth) continue;
      const t = d / island.halfWidth;
      const flat = island.flat ? 0.58 : 0.42;
      const crown = seaY - island.height;
      let surf;
      if (t < flat) {
        surf = crown;
      } else {
        const k = (t - flat) / (1 - flat);
        const eased = 1 - k * k * (3 - 2 * k);
        surf = Math.round(crown + (duneFloor[x] - crown) * (1 - eased));
      }
      if (surf < ground) ground = surf;
    }
    groundHeight[x] = ground;
  }`);

// --- water tile: remove the banding bar ---
apply('water tile', 'No bright bar across the top',
`    tile.fillStyle = '#062b43';
    tile.fillRect(0, 0, TILE_SIZE, TILE_SIZE);
    tile.fillStyle = '#0c4a6e';
    tile.fillRect(0, 0, TILE_SIZE, 4);
    tile.fillStyle = '#0e7490';
    tile.fillRect(2, 8 + ripple, 7, 2);
    tile.fillRect(13, 15 - ripple, 8, 2);
    tile.fillStyle = 'rgba(103,232,249,0.55)';
    tile.fillRect(5, 1, 3, 2);`,
`    tile.fillStyle = '#062b43';
    tile.fillRect(0, 0, TILE_SIZE, TILE_SIZE);
    tile.fillStyle = 'rgba(56, 189, 248, 0.10)';
    tile.fillRect(1, 7 + ripple, 9, 2);
    tile.fillRect(14, 13 - ripple, 6, 2);
    tile.fillStyle = 'rgba(165, 243, 252, 0.08)';
    tile.fillRect(6, 2 + ripple, 5, 1);
    tile.fillRect(10, 18 - ripple, 7, 1);
    tile.fillStyle = 'rgba(226, 232, 240, 0.10)';
    tile.fillRect(3, 9 + (ripple > 2 ? 3 : 0), 1, 1);
    tile.fillRect(17, 16 - (ripple > 2 ? 4 : 0), 1, 1);`);

// --- ocean seabed tile overrides ---
apply('seabed overrides', 'Abyssal seabed overrides',
`  const pulse = 0.65 + Math.sin(Date.now() * 0.003 + tx * 0.7 + ty) * 0.2;
  if (tile === OCEAN_TILES.PEARL) {`,
`  const pulse = 0.65 + Math.sin(Date.now() * 0.003 + tx * 0.7 + ty) * 0.2;
  const inOceanDim = this.isInOcean();
  if (inOceanDim && tile === TILES.SAND) {
    ctx.fillStyle = '#3b2f1e';
    ctx.fillRect(sx, sy, TILE_SIZE, TILE_SIZE);
    if (exposedTop) {
      ctx.fillStyle = '#57452c';
      ctx.fillRect(sx, sy, TILE_SIZE, 4);
      ctx.fillStyle = 'rgba(123, 101, 64, 0.5)';
      ctx.fillRect(sx + 2, sy + 6, 8, 1);
      ctx.fillRect(sx + 11, sy + 11, 8, 1);
      ctx.fillRect(sx + 5, sy + 17, 7, 1);
    }
    ctx.fillStyle = 'rgba(216, 197, 155, 0.5)';
    ctx.fillRect(sx + (tx * 7 + ty * 5) % 16, sy + (tx * 3 + ty * 11) % 18, 2, 2);
    ctx.fillStyle = 'rgba(240, 230, 210, 0.35)';
    ctx.fillRect(sx + (tx * 11 + ty * 3) % 14, sy + (tx * 5 + ty * 7) % 16, 3, 2);
    return;
  }
  if (inOceanDim && tile === TILES.SANDSTONE) {
    ctx.fillStyle = '#4a3b26';
    ctx.fillRect(sx, sy, TILE_SIZE, TILE_SIZE);
    ctx.fillStyle = '#5c4a30';
    ctx.fillRect(sx, sy + 2, TILE_SIZE, 3);
    ctx.fillRect(sx, sy + 11, TILE_SIZE, 3);
    ctx.fillStyle = '#3a2e1e';
    ctx.fillRect(sx, sy + 8, TILE_SIZE, 2);
    ctx.fillRect(sx, sy + 19, TILE_SIZE, 2);
    ctx.fillStyle = 'rgba(216, 197, 155, 0.35)';
    ctx.fillRect(sx + (tx * 5 + ty * 13) % 15, sy + (tx * 9 + ty * 3) % 17, 2, 1);
    return;
  }
  if (inOceanDim && tile === TILES.STONE) {
    ctx.fillStyle = '#141d26';
    ctx.fillRect(sx, sy, TILE_SIZE, TILE_SIZE);
    if (exposedTop) {
      ctx.fillStyle = '#1f2c38';
      ctx.fillRect(sx, sy, TILE_SIZE, 3);
    }
    ctx.fillStyle = 'rgba(226, 232, 240, 0.07)';
    ctx.fillRect(sx + (tx * 7 + ty * 11) % 17, sy + (tx * 3 + ty * 5) % 19, 3, 1);
    ctx.fillStyle = 'rgba(148, 197, 226, 0.06)';
    ctx.fillRect(sx + (tx * 13 + ty * 7) % 14, sy + (tx * 5 + ty * 3) % 17, 4, 1);
    return;
  }
  if (inOceanDim && tile === TILES.DIRT) {
    ctx.fillStyle = '#2b2318';
    ctx.fillRect(sx, sy, TILE_SIZE, TILE_SIZE);
    ctx.fillStyle = 'rgba(123, 101, 64, 0.4)';
    ctx.fillRect(sx + (tx * 9 + ty * 3) % 15, sy + (tx * 3 + ty * 9) % 18, 6, 1);
    ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
    ctx.fillRect(sx + (tx * 5 + ty * 13) % 12, sy + (tx * 7 + ty * 5) % 16, 4, 2);
    return;
  }
  if (tile === OCEAN_TILES.PEARL) {`);

// --- kraken water clamp ---
apply('kraken water clamp', 'never breach the surface',
`      if (world) {
        this.x = Math.max(0, Math.min(world.pixelWidth - this.width, this.x));
        this.y = Math.max(0, Math.min(world.pixelHeight - this.height, this.y));
      }`,
`      if (world) {
        this.x = Math.max(0, Math.min(world.pixelWidth - this.width, this.x));
        // A kraken is a sea creature, not a balloon: keep the body in the
        // water. The mantle top must stay at-or-below the waterline (a small
        // crown breach is allowed) and the skirt must stay above the floor.
        const seaTop = (world.oceanArena ? world.oceanArena.seaY : 12) * TILE_SIZE;
        const floorTop = world.pixelHeight || world.height * TILE_SIZE;
        this.y = Math.max(seaTop - this.height * 0.10,
          Math.min(floorTop - this.height * 1.25, this.y));
      }`);

// --- symmetric identical eyes ---
apply('symmetric eyes', 'eyeSpread',
`    // Two eyes set symmetrically across the head, near the front.
    drawEye(ex, ey, 1, true);
    drawEye(cx - (ex - cx), ey + 2, 0.72, false);`,
`    // Two eyes, perfectly mirrored about the head's centre line and identical
    // in every respect: same radius, same row, same pupil, same glint. Only
    // the primary carries the pulsing target ring, and that ring is drawn
    // OUTSIDE the orb so it can never make one eye look bigger than the other.
    const eyeSpread = this.width * 0.11;
    drawEye(cx - eyeSpread, ey, 1, false);
    drawEye(cx + eyeSpread, ey, 1, true);`);

if (EOL === '\r\n') src = src.replace(/\n/g, '\r\n');
fs.writeFileSync('ocean.js', src, 'utf8');
console.log('\nPATCH G APPLIED (' + applied + ' edits, ' + skipped + ' already present)');
