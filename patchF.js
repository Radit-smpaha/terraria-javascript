// ===== PATCH F: coral poles -> 1-tile crust, plus seagrass =================
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

apply('coral poles to crust + seagrass',
`    // Coral gardens still dress the deep reef, but never inside an island.
    if (!islandColumn && x % 13 === 0) {
      for (let k = 1; k <= 1 + (x % 3); k++) {
        if (this.getTile(x, ground - k) === TILES.WATER) this.setTile(x, ground - k, TILES.CORAL);
      }
    }`,
`    // ---- Living seabed dressing -----------------------------------------
    // The old coral grew as tall vertical columns, which read as thin coloured
    // poles covering the whole ocean. It is now a flat 1-tile crust scattered
    // across the dune floor, plus swaying sea grass: a living sea floor, not
    // a picket fence of coral spikes.
    if (!islandColumn && ground >= seaY + 2) {
      const crustRoll = (x * 2654435761 % 97) / 97;
      if (crustRoll < 0.30 && this.getTile(x, ground - 1) === TILES.WATER) {
        this.setTile(x, ground - 1, TILES.CORAL);
      }
      // Sea grass: the biggest "this is a living ocean" tell. Blades grow up
      // to 4 tiles in the deep water and stay short near the shallows.
      const grassRoll = (x * 40503) % 101 / 101;
      if (grassRoll < 0.34) {
        const depth = ground - seaY;
        const maxLen = depth > 20 ? 4 : 2;
        const len = 1 + ((x * 31) % maxLen);
        for (let k = 1; k <= len; k++) {
          if (this.getTile(x, ground - k) === TILES.WATER) {
            this.setTile(x, ground - k, TILES.TALL_GRASS);
          }
        }
      }
    }`);

if (EOL === '\r\n') src = src.replace(/\n/g, '\r\n');
fs.writeFileSync('ocean.js', src, 'utf8');
console.log('\nPATCH F APPLIED (' + applied + ' edits)');
