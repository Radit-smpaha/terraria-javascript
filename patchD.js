// ===== PATCH D: NPC ground snapping (the real flying-NPC fix) ==============
const fs = require('fs');
let npcs = fs.readFileSync('npcs.js', 'utf8');
const EOL = npcs.includes('\r\n') ? '\r\n' : '\n';
npcs = npcs.replace(/\r\n/g, '\n');
let applied = 0;
function apply(label, oldText, newText) {
  oldText = oldText.replace(/\r\n/g, '\n');
  newText = newText.replace(/\r\n/g, '\n');
  if (npcs.indexOf(oldText) === -1) throw new Error('NOT FOUND: ' + label);
  npcs = npcs.replace(oldText, newText);
  applied++;
  console.log('  ok  ' + label);
}

// Snap every villager onto the real terrain each tick. They had NO physics at
// all, so whenever the world changed under them (mining, regen, a dimension
// swap, or simply being placed a row too high) they floated forever.
apply('ground snap in update',
  `  update(dt) {
    // Nearest-villager prompt.
    const pcx = this.game.player.x + this.game.player.width / 2;`,
  `  update(dt) {
    // ---- GROUND SNAPPING: the flying-NPC fix ----------------------------
    // Villagers were placed once and then never touched by physics again, so
    // any change to the world under them (a mined block, a regenerated
    // dimension, a save loaded into a differently-shaped world) left them
    // hovering in mid-air permanently. Each tick, find the real ground below
    // each NPC and ease them onto it. Easing (not teleporting) keeps the fix
    // invisible for the 99% of frames where an NPC is already standing right.
    const world = this.game.world;
    if (world && world.surfaceHeights) {
      for (const npc of this.npcs) {
        if (!npc || !npc.width) continue;
        const tx = Math.floor((npc.x + npc.width / 2) / TILE_SIZE);
        if (tx < 0 || tx >= world.surfaceHeights.length) continue;
        const groundY = world.surfaceHeights[tx] * TILE_SIZE;
        const feet = npc.y + npc.height;
        const off = feet - groundY;
        if (Math.abs(off) > 2) {
          const step = Math.min(6, Math.abs(off));
          npc.y += off > 0 ? -step : step;
          if (npc.vy !== undefined) npc.vy = 0;
        }
      }
    }

    // Nearest-villager prompt.
    const pcx = this.game.player.x + this.game.player.width / 2;`);

if (EOL === '\r\n') npcs = npcs.replace(/\n/g, '\r\n');
fs.writeFileSync('npcs.js', npcs, 'utf8');
console.log('\nPATCH D APPLIED (' + applied + ' edits)');
