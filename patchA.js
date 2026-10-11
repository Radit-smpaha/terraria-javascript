// ===== PATCH A: ocean terrain + kraken + coral ============================
// 1. Raise the seabed and give it rolling relief (flat bottom -> dunes).
// 2. Replace the coral "pole" blobs with flat low growth.
// 3. Islets become elevated flat floating islands (plateaus), not poles.
const fs = require('fs');
const FILE = 'ocean.js';
let src = fs.readFileSync(FILE, 'utf8');
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

// --------------------------------------------------------------------------
// 1. Seabed: higher + rolling dunes instead of one flat line 18 tiles up.
// --------------------------------------------------------------------------
apply('seabed height + dunes',
  `  const seaY = Math.max(24, Math.floor(this.height * 0.24));
  const floorY = this.height - 18;
  this.surfaceHeights.fill(floorY);`,
  `  // The seabed sits much closer to the surface than it used to (a flat line
  // 18 tiles above the map floor was a dizzying void), and it is no longer
  // dead flat: a deterministic dune profile rolls it up and down, which is
  // what makes a sea floor read as a real sea floor instead of a tank bottom.
  const seaY = Math.max(24, Math.floor(this.height * 0.30));
  const floorY = this.height - 34;
  // Dune profile: two overlapping sine waves, per-column, in tile units. The
  // amplitude is small enough that the seabed never rises above the waterline
  // or dips into the underground band.
  const duneFloor = new Int16Array(this.width);
  for (let x = 0; x < this.width; x++) {
    duneFloor[x] = floorY - 4 + Math.round(
      Math.sin(x * 0.09) * 3 + Math.sin(x * 0.031 + 1.7) * 4);
  }
  this.surfaceHeights.fill(floorY);`);

// --------------------------------------------------------------------------
// 2. Islands: keep them (they are the land), but islets become plateaus.
// --------------------------------------------------------------------------
apply('islet plateau profile',
  `  const islets = [];
  for (let i = 0; i + 1 < islands.length; i++) {
    const a = islands[i], b = islands[i + 1];
    const gap = b.cx - a.cx;
    if (gap < 44) continue;
    const mid = (a.cx + b.cx) / 2;
    const spots = gap > 96 ? [mid - gap * 0.16, mid + gap * 0.16] : [mid];
    for (const sx of spots) {
      const cx = Math.round(sx);
      if (cx < margin || cx > this.width - margin - 1) continue;
      if (islands.some(o => Math.abs(o.cx - cx) < 18)) continue;
      if (islets.some(o => Math.abs(o.cx - cx) < 12)) continue;
      islets.push({ cx, halfWidth: 2 + Math.floor(Math.random() * 3),
        height: 3 + Math.floor(Math.random() * 3), islet: true });
    }
  }`,
  `  // Islets are ELEVATED FLAT SHOALS, not thin poles: a wide plateau whose top
  // sits just under the waterline, floating on the water rather than spearing
  // up from the seabed. ` + '`' + `height` + '`' + ` here means how far the crown rises
  // ABOVE the waterline, so a shallow shelf of water still laps around it.
  const islets = [];
  for (let i = 0; i + 1 < islands.length; i++) {
    const a = islands[i], b = islands[i + 1];
    const gap = b.cx - a.cx;
    if (gap < 44) continue;
    const mid = (a.cx + b.cx) / 2;
    const spots = gap > 96 ? [mid - gap * 0.16, mid + gap * 0.16] : [mid];
    for (const sx of spots) {
      const cx = Math.round(sx);
      if (cx < margin || cx > this.width - margin - 1) continue;
      if (islands.some(o => Math.abs(o.cx - cx) < 18)) continue;
      if (islets.some(o => Math.abs(o.cx - cx) < 12)) continue;
      // Wide flat top (6-9 tiles) that rises 3-5 tiles above the sea, so you
      // can walk across and fight on it, instead of a 2-tile spike.
      islets.push({ cx, halfWidth: 4 + Math.floor(Math.random() * 4),
        height: 3 + Math.floor(Math.random() * 3), islet: true, flat: true });
    }
  }`);

// --------------------------------------------------------------------------
// 3. The height profile: plateaus instead of cosine spikes for islets, and
//    everything sits on the dune floor rather than spearing to the seabed.
// --------------------------------------------------------------------------
apply('plateau height profile',
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
    let ground = duneFloor[x];                 // dunes, not a flat line
    for (const island of allIslands) {
      const d = Math.abs(x - island.cx);
      if (d > island.halfWidth) continue;
      const t = d / island.halfWidth;
      // A plateau profile: a broad flat crown with soft rounded shoulders, so
      // an island is a table of land you can build and fight on, never a spike
      // or a pole. The islets get an even wider flat top.
      const flat = island.flat ? 0.58 : 0.42;   // fraction of width that is flat
      const crown = seaY - island.height;
      let surf;
      if (t < flat) {
        surf = crown;                           // the flat table
      } else {
        // Rounded shoulder easing from the crown down to the dune floor.
        const k = (t - flat) / (1 - flat);
        const eased = 1 - k * k * (3 - 2 * k);   // smoothstep
        surf = Math.round(crown + (duneFloor[x] - crown) * (1 - eased));
      }
      if (surf < ground) ground = surf;
    }
    groundHeight[x] = ground;
  }`);

// --------------------------------------------------------------------------
// 4. Coral: kill the tall poles. A 1-2 tile flat crust only.
// --------------------------------------------------------------------------
apply('coral crust',
  `    // Coral gardens still dress the deep reef, but never inside an island.
    if (!islandColumn && x % 13 === 0) {
      for (let k = 1; k <= 1 + (x % 3); k++) {
        if (this.getTile(x, ground - k) === TILES.WATER) this.setTile(x, ground - k, TILES.CORAL);
      }
    }`,
  `    // A flat crust of coral on the dune floor — 1 tile, never a column. The
    // tall coral poles that used to spear to the surface are gone entirely:
    // they read as coloured lines across the whole ocean, not as a reef.
    if (!islandColumn && ground >= seaY + 2) {
      const crustRoll = (x * 2654435761 % 97) / 97;   // deterministic scatter
      if (crustRoll < 0.34 &&
          this.getTile(x, ground - 1) === TILES.WATER) {
        this.setTile(x, ground - 1, TILES.CORAL);
      }
    }`);

if (EOL === '\r\n') src = src.replace(/\n/g, '\r\n');
fs.writeFileSync(FILE, src, 'utf8');
console.log('\nPATCH A APPLIED (' + applied + ' edits)');
