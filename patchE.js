// ===== PATCH E (v2): water tile + ocean seabed tiles + seagrass ============
const fs = require('fs');
let src = fs.readFileSync('ocean.js', 'utf8');
const EOL = src.includes('\r\n') ? '\r\n' : '\n';
src = src.replace(/\r\n/g, '\n');
let applied = 0;
function apply(label, oldText, newText) {
  oldText = oldText.replace(/\r\n/g, '\n');
  newText = newText.replace(/\r\n/g, '\n');
  if (src.indexOf(oldText) === -1) throw new Error('NOT FOUND: ' + label);
  src = src.replace(oldText, newText);
  applied++;
  console.log('  ok  ' + label);
}

// 1. Water tile: kill the hard bright top-bar banding.
apply('water tile rewrite',
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
    // No bright bar across the top: the old 4px strip of #0c4a6e painted a
    // hard horizontal line at the top of every tile, which read as stripes
    // covering the entire ocean. What replaces it is a soft caustic ripple
    // and a couple of drifting silt motes, all at very low alpha.
    tile.fillStyle = 'rgba(56, 189, 248, 0.10)';
    tile.fillRect(1, 7 + ripple, 9, 2);
    tile.fillRect(14, 13 - ripple, 6, 2);
    tile.fillStyle = 'rgba(165, 243, 252, 0.08)';
    tile.fillRect(6, 2 + ripple, 5, 1);
    tile.fillRect(10, 18 - ripple, 7, 1);
    tile.fillStyle = 'rgba(226, 232, 240, 0.10)';
    tile.fillRect(3, 9 + (ripple > 2 ? 3 : 0), 1, 1);
    tile.fillRect(17, 16 - (ripple > 2 ? 4 : 0), 1, 1);`);

// 2. Ocean seabed tiles: dark wet palette instead of bright overworld sand.
apply('ocean seabed tiles',
`  const pulse = 0.65 + Math.sin(Date.now() * 0.003 + tx * 0.7 + ty) * 0.2;
  if (tile === OCEAN_TILES.PEARL) {`,
`  const pulse = 0.65 + Math.sin(Date.now() * 0.003 + tx * 0.7 + ty) * 0.2;
  // ---- Abyssal seabed overrides -----------------------------------------
  // The planet used the bright overworld palette, which reads as a desert
  // under water. In the ocean dimension these tiles are drawn as their wet,
  // dark, silt-covered abyssal counterparts instead.
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

// 3. Sea grass on the dune floor.
apply('seagrass growth',
`    // A flat crust of coral on the dune floor`,
`    // Sea grass: swaying strands rooted in the sand, the single biggest tell
    // that this is a living sea and not a tank of blue. Tall blades in the
    // deep water, short tufts near the shallows.
    if (!islandColumn && ground >= seaY + 3) {
      const grassRoll = (x * 40503) % 101 / 101;
      const depth = ground - seaY;
      if (grassRoll < 0.30) {
        const bladeCount = 2 + (x % 2);
        for (let b = 0; b < bladeCount; b++) {
          const gx = x + (b - (bladeCount - 1) / 2);
          if (gx < 1 || gx >= this.width - 1) continue;
          const maxLen = depth > 18 ? 4 : 2;
          const len = 1 + ((x * 31 + b * 17) % maxLen);
          for (let k = 1; k <= len; k++) {
            if (this.getTile(gx, ground - k) === TILES.WATER) {
              this.setTile(gx, ground - k, TILES.TALL_GRASS);
            }
          }
        }
      }
    }
    // A flat crust of coral on the dune floor`);

if (EOL === '\r\n') src = src.replace(/\n/g, '\r\n');
fs.writeFileSync('ocean.js', src, 'utf8');
console.log('\nPATCH E APPLIED (' + applied + ' edits)');
