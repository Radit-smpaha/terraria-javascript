// Locates the space-item registry entries + save/load surface. Run: node qa-locate.js
const fs = require('fs');
const lines = fs.readFileSync('terraria.js', 'utf8').split(String.fromCharCode(10));
const pats = ['dragonbone', 'meteor_shard', 'nebula_crystal', 'dragon_trophy', 'void_star_blade',
  'voidscale_armor', 'voidstar_platemail', 'star_platform', 'void_rift_beacon', 'riftUses',
  'serialize(', 'decompress(', 'unserialize(', 'localStorage', 'saveVersion', 'dimension-badge',
  'spawnCritter', 'critters.push', 'monsters.push'];
for (const p of pats) {
  const hits = [];
  lines.forEach((l, i) => { if (l.includes(p)) hits.push(i + 1); });
  console.log(p.padEnd(18) + (hits.length ? hits.slice(0, 14).join(', ') : 'NONE'));
}
