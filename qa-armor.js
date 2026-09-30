// Verification for the armour damage-reduction ladder.
// Loads entities.js in a VM to get the real Player class (no DOM needed for
// takeDamage), then checks the ladder, the ordering, and the equip wiring.
const fs = require('fs');
const vm = require('vm');

const root = __dirname;
// Read the HTML that actually ships. A stray "terraria (1).html" download used to
// be hardcoded here, which meant this test passed against a stale file locally
// and crashed outright in a fresh clone where that file does not exist.
const htmlFile = ['/terraria.html', '/terraria (1).html']
  .map(p => root + p)
  .find(p => fs.existsSync(p));
const html = fs.readFileSync(htmlFile, 'utf8');
const src = fs.readFileSync(root + '/entities.js', 'utf8');

let pass = 0, fail = 0;
function check(name, cond, extra) {
  if (cond) { pass++; console.log('  PASS  ' + name); }
  else { fail++; console.log('  FAIL  ' + name + (extra ? '  -> ' + extra : '')); }
}

// Pull the armour tables straight out of terraria.js by evaluating just the
// ITEMS/ARMOR_TIERS region, so this test can never drift from the real data.
const terra = fs.readFileSync(root + '/terraria.js', 'utf8');
const tierBlock = terra.match(/const ARMOR_TIERS = \[[\s\S]*?\];/)[0];
const itemsBlock = terra.slice(0, terra.indexOf('Object.assign(ITEMS, NEW_ITEMS);'));
const sandbox = { TILES: new Proxy({}, { get: () => 0 }), console };
sandbox.window = sandbox;
vm.createContext(sandbox);
// The slice stops just before the merge, so re-apply it here to get the
// endgame armors (rainbow / fallen star / charm) into ITEMS too.
vm.runInContext(itemsBlock + '\nObject.assign(ITEMS, NEW_ITEMS);\n' + tierBlock, sandbox);
// `const` in a VM context does not become a sandbox property, so pull the
// values back out with an explicit expression.
const ITEMS = vm.runInContext('ITEMS', sandbox);
const ARMOR_TIERS = vm.runInContext('ARMOR_TIERS', sandbox);

console.log('\n=== HUD chip markup ===');
check('armor-chip element exists in HTML', /id="armor-chip"/.test(html));

console.log('\n=== Every armour tier has reduction data ===');
for (const id of ARMOR_TIERS) {
  const it = ITEMS[id];
  check(id + ' has a reduction', it && typeof it.reduction === 'number' && it.reduction > 0,
    it ? 'reduction=' + it.reduction : 'missing item');
}

console.log('\n=== Requested tier order (1st -> 9th) ===');
// The Ossuary Sovereign's own plate is the new apex: it is pried off the
// hardest fight in the game. Demonplate holds second, the nerfed Voidscale
// third, and the six original plates keep their relative order.
const expected = ['ossuary_armor', 'demon_armor', 'voidscale_armor', 'fallen_star_armor', 'rainbow_armor', 'crystal_armor', 'diamond_armor', 'iron_armor', 'gold_armor'];
check('ARMOR_TIERS lists the plates strongest-first',
  expected.every((id, i) => ARMOR_TIERS[i] === id), ARMOR_TIERS.join(' > '));
for (let i = 1; i < expected.length; i++) {
  const hi = ITEMS[expected[i - 1]], lo = ITEMS[expected[i]];
  check(ITEMS[expected[i - 1]].name + ' > ' + ITEMS[expected[i]].name + ' (reduction)',
    hi.reduction > lo.reduction, hi.reduction + ' vs ' + lo.reduction);
}

console.log('\n=== The Ossuary plate is the apex; Voidscale has been nerfed ===');
const demonArmor = ITEMS.demon_armor;
check('ossuary_armor exists and is armour', ITEMS.ossuary_armor && ITEMS.ossuary_armor.type === 'armor');
check('Skeletal Wyrmplate beats Demonplate on reduction',
  ITEMS.ossuary_armor.reduction > demonArmor.reduction,
  ITEMS.ossuary_armor.reduction + ' vs ' + demonArmor.reduction);
check('Skeletal Wyrmplate beats Demonplate on defense',
  ITEMS.ossuary_armor.defense > demonArmor.defense,
  ITEMS.ossuary_armor.defense + ' vs ' + demonArmor.defense);
check('Skeletal Wyrmplate still cannot reach immunity (<=60%)',
  ITEMS.ossuary_armor.reduction <= 0.60, 'got ' + ITEMS.ossuary_armor.reduction);
check('voidscale_armor exists and is armour', ITEMS.voidscale_armor && ITEMS.voidscale_armor.type === 'armor');
// The point of the nerf, asserted rather than hoped: Voidscale is no longer
// better than Demonplate on either axis, and it is below where it used to be.
check('Voidscale no longer outscales Demonplate on reduction',
  ITEMS.voidscale_armor.reduction < demonArmor.reduction,
  ITEMS.voidscale_armor.reduction + ' vs ' + demonArmor.reduction);
check('Voidscale no longer outscales Demonplate on defense',
  ITEMS.voidscale_armor.defense < demonArmor.defense,
  ITEMS.voidscale_armor.defense + ' vs ' + demonArmor.defense);
check('Voidscale was nerfed from 46%/36 to 43%/24',
  ITEMS.voidscale_armor.reduction === 0.43 && ITEMS.voidscale_armor.defense === 24,
  ITEMS.voidscale_armor.reduction + '/' + ITEMS.voidscale_armor.defense);
check('demon_armor exists and is armour', demonArmor && demonArmor.type === 'armor');
check('beats Fallen Star on reduction', demonArmor.reduction > ITEMS.fallen_star_armor.reduction,
  demonArmor.reduction + ' vs ' + ITEMS.fallen_star_armor.reduction);
check('beats Fallen Star on defense', demonArmor.defense > ITEMS.fallen_star_armor.defense,
  demonArmor.defense + ' vs ' + ITEMS.fallen_star_armor.defense);
check('still cannot reach immunity (<=60%)', demonArmor.reduction <= 0.60, 'got ' + demonArmor.reduction);

console.log('\n=== takeDamage mitigation (real Player class) ===');
const win = { console, Math, window: null };
win.window = win;
win.document = { getElementById: () => null, createElement: () => ({ getContext: () => null }) };
win.requestAnimationFrame = () => {};
vm.createContext(win);
vm.runInContext(src, win);
const Player = win.Player;

const sound = { playPlayerHurt() {}, playJump() {}, playHit() {}, playDoubleJump() {} };
let texts = [];
const parts = { addDamageText: (x, y, t) => texts.push(t), bloodBurst() {}, magicSparkle() {} };

function hitWith(id, incoming) {
  const p = new Player(0, 0);
  const it = id ? ITEMS[id] : null;
  p.armorReduction = it ? it.reduction : 0;
  p.armorDefense = it ? it.defense : 0;
  p.hp = 1000;
  p.invulnerableTime = 0;
  const taken = p.takeDamage(incoming, sound, parts, 0);
  return { taken, absorbed: p.lastAbsorbed };
}

console.log('\n  incoming=14 (small hit)');
for (const id of expected.slice().reverse()) {
  const r = hitWith(id, 14);
  console.log('    ' + ITEMS[id].name.padEnd(22) + ' ' + String(r.taken).padStart(3) + ' HP  (soaked ' + r.absorbed + ')');
}
console.log('\n  incoming=75 (boss slam)');
for (const id of expected.slice().reverse()) {
  const r = hitWith(id, 75);
  console.log('    ' + ITEMS[id].name.padEnd(22) + ' String=' + String(r.taken).padStart(3) + ' HP  (soaked ' + r.absorbed + ')');
}

console.log('\n=== Behavioural guarantees ===');
const naked = hitWith(null, 40);
check('no armour = full damage', naked.taken === 40, 'took ' + naked.taken);

const gold = hitWith('gold_armor', 40);
check('gold armour reduces a 40 hit', gold.taken < 40, 'took ' + gold.taken);
check('gold is not over-tuned (still >50% of hit)', gold.taken > 20, 'took ' + gold.taken);

const best = hitWith('fallen_star_armor', 40);
check('fallen star beats gold', best.taken < gold.taken, best.taken + ' vs ' + gold.taken);
check('fallen star is not OP (still takes >=40% of a 40 hit)', best.taken >= 16, 'took ' + best.taken);

const tiny = hitWith('fallen_star_armor', 3);
check('1 HP floor holds even vs best armour', tiny.taken >= 1, 'took ' + tiny.taken);

// The ladder must stay legible on small hits: every tier must be strictly
// better than the one below it, with no two tiers collapsing onto the same
// number. `expected` runs best -> worst, so damage taken must strictly
// INCREASE down the array.
const small = expected.map(id => hitWith(id, 14).taken);
const smallStrict = small.every((v, i) => i === 0 || v > small[i - 1]);
check('small-hit ladder is strictly monotonic across all seven tiers', smallStrict,
  'ladder (best->worst): ' + small.join(' > '));
check('no tier collapses onto the 1 HP floor on a small hit', small.every(v => v > 1),
  'ladder: ' + small.join(' > '));

const big = expected.map(id => hitWith(id, 75).taken);
check('boss-slam ladder is strictly monotonic across all seven tiers',
  big.every((v, i) => i === 0 || v > big[i - 1]), 'ladder (best->worst): ' + big.join(' > '));
const huge = hitWith('demon_armor', 999);
check('demonplate never fully negates a hit', huge.taken > 0 && huge.taken < 999, 'took ' + huge.taken);

console.log('\n=== Demonplate craft + venom data ===');
const recipeBlock = terra.match(/const RECIPES = \[[\s\S]*?\n\];/)[0];
const rsb = { TILES: new Proxy({}, { get: () => 0 }), console };
rsb.window = rsb; vm.createContext(rsb);
vm.runInContext(recipeBlock, rsb);
const RECIPES = vm.runInContext('RECIPES', rsb);
const demonRecipe = RECIPES.find(r => r.result.id === 'demon_armor');
check('a recipe exists for demon_armor', !!demonRecipe);
check('it costs the Demon Trophy (only the Demon drops it)',
  !!demonRecipe && demonRecipe.materials.some(m => m.id === 'demon_trophy' && m.count >= 1));
check('every material in the recipe is a real item',
  !!demonRecipe && demonRecipe.materials.every(m => !!ITEMS[m.id]),
  demonRecipe ? demonRecipe.materials.filter(m => !ITEMS[m.id]).map(m => m.id).join(',') : '');

console.log('\n=== Hellstone Greatblade venom ===');
const blade = ITEMS.hellstone_greatblade;
check('has a 40% poison chance', blade.poisonChance === 0.40, 'got ' + blade.poisonChance);
check('venom has a duration and a dps', blade.poisonDuration > 0 && blade.poisonDps > 0,
  blade.poisonDuration + 's @ ' + blade.poisonDps);
check('no other item accidentally got venom',
  Object.keys(ITEMS).filter(k => ITEMS[k].poisonChance).join(',') === 'hellstone_greatblade',
  Object.keys(ITEMS).filter(k => ITEMS[k].poisonChance).join(','));

console.log('\n=== i-frames unchanged ===');
const p = new Player(0, 0);
p.armorReduction = 0.4; p.armorDefense = 28;
p.hp = 100; p.invulnerableTime = 0;
const first = p.takeDamage(50, sound, parts, 0);
const second = p.takeDamage(50, sound, parts, 0);
check('first hit lands', first > 0, 'took ' + first);
check('second hit blocked by i-frames', second === 0, 'took ' + second);

console.log('\n=== Flash only when armour earned it ===');
const p2 = new Player(0, 0);
p2.armorReduction = 0; p2.armorDefense = 0; p2.hp = 100; p2.invulnerableTime = 0;
p2.takeDamage(20, sound, parts, 0);
check('unarmoured hit does not flash', p2.armorFlash === 0, 'flash=' + p2.armorFlash);
const p3 = new Player(0, 0);
p3.armorReduction = 0.4; p3.armorDefense = 28; p3.hp = 100; p3.invulnerableTime = 0;
p3.takeDamage(40, sound, parts, 0);
check('armoured hit flashes', p3.armorFlash > 0, 'flash=' + p3.armorFlash);

console.log('\n=== Damage text colour feedback ===');
texts = [];
const p4 = new Player(0, 0);
p4.armorReduction = 0.25; p4.armorDefense = 15; p4.hp = 100; p4.invulnerableTime = 0;
p4.takeDamage(40, sound, parts, 0);
check('armoured hit still reports a number', texts.length === 1 && texts[0] > 0, JSON.stringify(texts));

console.log('\n' + '='.repeat(46));
console.log('  ' + pass + ' passed, ' + fail + ' failed');
console.log('='.repeat(46) + '\n');
process.exit(fail ? 1 : 0);