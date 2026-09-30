// Integration probe for the Space Dimension work (run: node qa-space-integration.js)
const fs = require('fs');
const t = fs.readFileSync('terraria.js', 'utf8');
const sp = fs.readFileSync('space.js', 'utf8');
const html = fs.readFileSync('terraria.html', 'utf8');
const css = fs.readFileSync('terraria.css', 'utf8');

// NOTE: String.match without /g returns only the first hit, which silently
// turned every count(...) >= 2 probe into "found once is enough". Counting
// occurrences the honest way.
const count = (src, re) => {
  const flags = re.flags.includes('g') ? re.flags : re.flags + 'g';
  return (src.match(new RegExp(re.source, flags)) || []).length;
};

const has = (src, re) => re.test(src);
const probes = [
  ['space.js loaded before terraria.js', html.indexOf('space.js?v') > -1 && html.indexOf('space.js?v') < html.indexOf('terraria.js?v')],
  ['HUD badge exists', has(html, /id="dimension-badge"/)],
  ['.dimension-badge styled', has(css, /\.dimension-badge/)],
  ['beacon flagged in item registry', has(t, /riftBeacon:\s*true/)],
  ['beacon intercepted in use path', has(t, /itemData\.riftBeacon/)],
  ['useVoidRiftBeacon defined', has(t, /useVoidRiftBeacon\(\) \{/)],
  ['openWormhole defined', has(t, /openWormhole\(intent, x, y/)],
  ['updateWormhole defined', has(t, /updateWormhole\(dt\) \{/)],
  ['updateWormhole called from loop', has(t, /this\.updateWormhole\(dt\)/)],
  ['player physics suspended in rift', has(t, /if \(!inRift\) this\.player\.update/)],
  ['enterSpaceDimension (Game)', has(t, /enterSpaceDimension\(\) \{/)],
  ['returnToOverworld', has(t, /returnToOverworld\(\) \{/)],
  ['rift gate interaction', has(t, /tile === TILES\.RIFT_PORTAL/)],
  ['rune/gate mining guard', has(t, /tile === TILES\.SPACE_RUNE \|\| tile === TILES\.RIFT_PORTAL/)],
  ['space background swap', has(t, /renderSpaceBackground\(ctx/)],
  ['telegraph rendered', has(t, /renderTelegraph\(ctx/)],
  ['wormhole rendered', has(t, /this\.wormhole\.render\(ctx/)],
  ['wormhole screen overlay', has(t, /renderScreenOverlay\(/)],
  ['weather suppressed in space', count(t, /this\.weather && !this\.world\.isInSpace\(\)/) >= 2],
  ['critter spawn guarded', has(t, /!this\.world\.isInSpace\(\) && !this\.world\.isNight\(\)/)],
  ['monster spawn guarded', has(t, /this\.world\.isInSpace\(\) \|\| Math\.random\(\) > darkChance/)],
  ['dragon motes', has(t, /kind === 'dragon' \? \(this\.boss\.phase === 3/)],
  ['dragon touch damage', has(t, /this\.boss\.touchDamage\(\)/)],
  ['dragon defeat branch', has(t, /defeatedDragon/) && has(t, /this\.onDragonDefeated\(\)/)],
  ['respawn handles space death', has(t, /isInSpace\(\)\) \{\s*\n?\s*this\.returnToOverworld\(\)/)],
  ['save uses persistTiles', has(t, /persistTiles\(\)/)],
  ['save uses persistWalls', has(t, /persistWalls\(\)/)],
  ['save stores dragonHP', has(t, /dragonHP:/)],
  ['load restores dragonHP', has(t, /save\.dragonHP/)],
  ['load clears dimension state', has(t, /exitSpaceDimension\(\)/)],
  ['HUD badge toggled', has(t, /dimension-badge/)],
  ['state vars initialised', has(t, /this\.riftReturnDelay = 0/)],
  ['dragon loot ids registered', ['dragonbone', 'meteor_shard', 'nebula_crystal', 'dragon_trophy', 'void_star_blade', 'void_rift_beacon', 'dragon_wings', 'voidscale_armor'].every(id => new RegExp(`\\bid: '${id}'`).test(t))],
  ['dragon drops its wings and plate', has(t, /drops\.push\(new DropItem\(this\.boss\.x - 14, this\.boss\.y - 18, 'dragon_wings'/) && has(t, /drops\.push\(new DropItem\(this\.boss\.x \+ 2, this\.boss\.y - 34, 'voidscale_armor'/)],
  ['wings use their own equip slot', has(t, /equippedAccessoryId/) && has(t, /equipAccessory\(id\)/)],
  ['space.js exposes boss', has(sp, /window\.SkeletonDragonBoss/)],
  ['space.js registers tile ids', has(sp, /TILES\[name\] = id/)]
];
let bad = 0;
for (const [label, ok] of probes) {
  if (!ok) bad++;
  console.log((ok ? 'OK    ' : 'MISS  ') + label);
}
console.log('\n' + (bad === 0 ? 'ALL INTEGRATION HOOKS PRESENT' : bad + ' hook(s) missing'));
