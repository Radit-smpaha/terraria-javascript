// qa-dragon-loot.js - the Ossuary loot rules, asserted against the real game.
//
// Three rules came out of a playtest and each one is easy to undo by accident:
//   1. The Skeletal Wyrmplate and the Dragon Wings are NOT craftable at all.
//      They are the first Sovereign's only source in the game.
//   2. Only the FIRST Sovereign drops them. Later dragons drop the trophy, the
//      fang and the ore, and never the plate or the wings again.
//   3. The one Rite of Waking prices itself: cheap the first time, and sharply
//      more expensive from the second craft onward. The count has to survive a
//      reload, or every refresh would hand the player a fresh cheap rite.
//
// Usage: node qa-dragon-loot.js
const fs = require('fs');
const vm = require('vm');

let failures = 0;
const check = (label, ok, detail = '') => {
  if (!ok) failures++;
  console.log((ok ? '  PASS  ' : '  FAIL  ') + label + (!ok && detail ? '   [' + detail + ']' : ''));
};
const step = (t) => console.log('\n▸ ' + t);

// ---- DOM / canvas stubs (same shape as qa-space-run.js) --------------------
function makeCtx() {
  return new Proxy({}, {
    get(t, p) {
      if (p === 'canvas') return {};
      if (p === 'createRadialGradient' || p === 'createLinearGradient') return () => ({ addColorStop() {} });
      if (p === 'getImageData') return () => ({ data: new Uint8ClampedArray(4) });
      if (p === 'measureText') return () => ({ width: 10 });
      if (typeof p === 'string') return () => undefined;
      return undefined;
    },
    set() { return true; }
  });
}
function makeEl(id) {
  return {
    id, width: 800, height: 600, textContent: '', innerHTML: '',
    style: {}, dataset: {},
    classList: (() => {
      const set = new Set();
      return {
        add: (c) => set.add(c), remove: (c) => set.delete(c), contains: (c) => set.has(c),
        toggle: (c, on) => { const want = on === undefined ? !set.has(c) : !!on; if (want) set.add(c); else set.delete(c); return want; }
      };
    })(),
    getContext: () => makeCtx(),
    addEventListener() {}, removeEventListener() {},
    appendChild() {}, querySelector: () => null, querySelectorAll: () => [],
    closest: () => null, remove() {}, parentNode: { removeChild() {} },
    setAttribute() {}, getAttribute: () => null,
    className: '', value: ''
  };
}
const els = {};
global.document = {
  readyState: 'complete', scripts: [],
  getElementById: (id) => (els[id] ||= makeEl(id)),
  createElement: (tag) => makeEl(tag),
  addEventListener() {},
  querySelector: () => null, querySelectorAll: () => [],
  body: makeEl('body')
};
global.window = global;
global.innerWidth = 1280; global.innerHeight = 720; global.devicePixelRatio = 1;
global.addEventListener = () => {};
global.performance = { now: () => 1000 };
global.requestAnimationFrame = () => 0;
global.cancelAnimationFrame = () => {};
const store = new Map();
global.localStorage = {
  getItem: (k) => (store.has(k) ? store.get(k) : null),
  setItem: (k, v) => store.set(k, String(v)),
  removeItem: (k) => store.delete(k),
  clear: () => store.clear()
};

const FILES = ['audio.js', 'particles.js', 'world.js', 'weather.js', 'entities.js',
  'underworld.js', 'space.js', 'juice.js', 'npcs.js', 'journey.js', 'terraria.js'];
const ctx = vm.createContext(global);
for (const f of FILES) {
  try {
    vm.runInContext(fs.readFileSync(f, 'utf8'), ctx, { filename: f });
  } catch (e) {
    console.log('EVAL FAIL ' + f + ': ' + (e.stack || e.message));
    process.exit(1);
  }
}
const g = global.game;
const { ITEMS, RECIPES, TILE_SIZE } = global;
if (!g) { console.log('BOOT FAIL: no game'); process.exit(1); }
// The title menu boots the simulation paused; this suite drives update() itself.
g.titleScreenOpen = false;
g.paused = false;

step('1. The plate and the wings are not craftable');
// A recipe would make them ore. The first Sovereign is the only source.
const ossuaryRecipe = RECIPES.find(r => r.result && r.result.id === 'ossuary_armor');
const wingRecipe = RECIPES.find(r => r.result && r.result.id === 'dragon_wings');
check('no recipe produces the Skeletal Wyrmplate', !ossuaryRecipe,
  ossuaryRecipe ? JSON.stringify(ossuaryRecipe.materials) : 'none');
check('no recipe produces the Dragon Wings', !wingRecipe,
  wingRecipe ? JSON.stringify(wingRecipe.materials) : 'none');
check('both are on the uncraftable list',
  Array.isArray(global.UNCRAFTABLE_RECIPE_IDS) &&
  ['ossuary_armor', 'dragon_wings'].every(id => global.UNCRAFTABLE_RECIPE_IDS.includes(id)),
  JSON.stringify(global.UNCRAFTABLE_RECIPE_IDS));
// Belt and braces: hand the player every material a recipe would want and
// confirm the forge still cannot make them. A recipe hidden from RECIPES but
// reachable through craftRecipe would sail straight past the checks above.
const forgeWith = (id) => {
  const recipe = RECIPES.find(r => r.result && r.result.id === id);
  if (!recipe) return false;
  for (const m of recipe.materials) g.addItem(m.id, m.count);
  return g.craftRecipe(recipe);
};
g.addItem('dragon_trophy', 5);
check('the forge cannot build the plate from a full trophy stack',
  forgeWith('ossuary_armor') === false && g.countItem('ossuary_armor') === 0,
  'in bag=' + g.countItem('ossuary_armor'));
check('the forge cannot build the wings from a full trophy stack',
  forgeWith('dragon_wings') === false && g.countItem('dragon_wings') === 0,
  'in bag=' + g.countItem('dragon_wings'));
// The Sovereign's Fang, by contrast, SHOULD still be rebuildable from ore —
// the point of removing the other two recipes was not to gate everything. The
// bag is emptied first: crafting needs a free slot and everything above has
// filled it.
// craftRecipe reports nothing on success (it just spends, grants and toasts), so
// the evidence is what happened to the bag, not a return value.
check("the Sovereign's Fang is still craftable from ore", (() => {
  g.inventory.fill({ id: 'empty', count: 0 });
  g.savedInventory.fill({ id: 'empty', count: 0 });
  const r = RECIPES.find(x => x.result && x.result.id === 'ossuary_blade');
  if (!r) return false;
  for (const m of r.materials) g.addItem(m.id, m.count);
  if (!g.canCraftRecipe(r)) return false;
  g.craftRecipe(r);
  const made = g.countItem('ossuary_blade');
  g.removeItem('ossuary_blade', made);
  return made === 1;
})());

step('2. Only the FIRST Sovereign drops them');
// The dragon's death goes through the shared boss-bag path, so the loot is read
// off g.drops right after the kill rather than from a hand-written drop table.
const arena = g.world.spaceArena || (g.world.enterSpaceDimension(), g.world.spaceArena);
// A dropped item is spawned by the boss update, not by takeDamage itself, so the
// kill has to be pumped for a few frames before g.drops means anything.
const killDragon = () => {
  g.drops = [];
  g.boss = new global.SkeletonDragonBoss(arena.cx * TILE_SIZE,
    (arena.floorY - 16) * TILE_SIZE, g);
  g.dragonHP = null;
  g.boss.takeDamage(g.boss.hp + 100, g.sound, g.particles, false);
  for (let i = 0; i < 6 && g.boss; i++) g.update(1 / 60);
  return g.drops.map(d => d.id);
};
g.dragonKills = 0;
g.dragonSlain = false;
const firstLoot = killDragon();
check('the first Sovereign drops the Wyrmplate', firstLoot.includes('ossuary_armor'),
  firstLoot.join(','));
check('the first Sovereign drops the wings', firstLoot.includes('dragon_wings'),
  firstLoot.join(','));
check('the first kill is counted', g.dragonKills === 1, 'dragonKills=' + g.dragonKills);
check('the first kill still drops the trophy and the fang',
  firstLoot.includes('dragon_trophy') && firstLoot.includes('ossuary_blade'));

// The second dragon: the SAME code path, with the counter already at 1.
g.drops = [];
g.dragonKills = 1;
const secondLoot = killDragon();
check('a later Sovereign does NOT drop the Wyrmplate', !secondLoot.includes('ossuary_armor'),
  secondLoot.join(','));
check('a later Sovereign does NOT drop the wings', !secondLoot.includes('dragon_wings'),
  secondLoot.join(','));
check('a later Sovereign still drops the trophy and the fang',
  secondLoot.includes('dragon_trophy') && secondLoot.includes('ossuary_blade'),
  secondLoot.join(','));
check('a later Sovereign still drops the ore',
  secondLoot.includes('dragonbone') && secondLoot.includes('meteor_shard'),
  secondLoot.join(','));

// wakeSovereign clears dragonSlain, which is exactly why dragonKills had to be
// its own counter: a cleared arena must never read as "first kill" again.
g.dragonKills = 1;
g.dragonSlain = false;
const afterRearm = killDragon();
check('the first-kill flag survives a re-armed arena',
  !afterRearm.includes('ossuary_armor') && !afterRearm.includes('dragon_wings'),
  afterRearm.join(','));

step('3. The one rite prices itself');
// Cheap the first time, ruinous after. Both lists come from ONE function so the
// recipe card the player reads and the materials actually charged cannot drift.
const firstCost = g.riteOfWakingCost(false);
const repeatCost = g.riteOfWakingCost(true);
check('the first rite costs three materials', firstCost.length === 3,
  firstCost.map(m => m.id + ':' + m.count).join(' '));
check('the repeat rite costs six materials', repeatCost.length === 6,
  repeatCost.map(m => m.id + ':' + m.count).join(' '));
const total = (l) => l.reduce((t, m) => t + m.count, 0);
check('the repeat rite costs more than three times the first',
  total(repeatCost) > total(firstCost) * 3, total(firstCost) + ' -> ' + total(repeatCost));
check('the first rite asks for nothing unobtainable before the arena',
  firstCost.every(m => m.id !== 'life_crystal' && m.id !== 'demon_soul'),
  firstCost.map(m => m.id).join(','));
check('the repeat rite reaches into late-game stock',
  repeatCost.some(m => m.id === 'life_crystal') && repeatCost.some(m => m.id === 'demon_soul'),
  repeatCost.map(m => m.id).join(','));

const riteRecipe = RECIPES.find(r => r.result && r.result.id === 'rite_of_waking');
check('the rite is flagged dynamic', !!riteRecipe && riteRecipe.dynamicRite === true);
check('the card shows the first-time price before anything is crafted',
  g.recipeMaterials(riteRecipe).length === 3,
  g.recipeMaterials(riteRecipe).map(m => m.id).join(','));
check('the card shows the repeat price once one has been crafted', (() => {
  g.ritesCrafted = 1;
  const live = g.recipeMaterials(riteRecipe).length;
  g.ritesCrafted = 0;
  return live === 6;
})());

// End to end: craft it for real, twice, and watch the price move.
g.ritesCrafted = 0;
for (const m of firstCost) g.addItem(m.id, m.count);
check('the first rite is craftable on the first-time materials',
  g.canCraftRecipe(riteRecipe) === true);
g.craftRecipe(riteRecipe);
check('crafting it yields exactly one candle',
  g.countItem('rite_of_waking') === 1, 'candles=' + g.countItem('rite_of_waking'));
check('the craft is counted, so the next one prices as a repeat',
  g.ritesCrafted === 1, 'ritesCrafted=' + g.ritesCrafted);
check('the first-price materials were actually spent',
  g.countItem('dragonbone') < firstCost.find(m => m.id === 'dragonbone').count,
  'dragonbone=' + g.countItem('dragonbone'));

// Now the expensive one: the leftovers from the cheap craft must NOT be enough.
g.removeItem('rite_of_waking', 1);
check('the repeat rite is refused on first-price leftovers alone',
  g.canCraftRecipe(riteRecipe) === false);
for (const m of repeatCost) g.addItem(m.id, m.count);
check('the repeat rite is craftable once the full price is on hand',
  g.canCraftRecipe(riteRecipe) === true);
g.craftRecipe(riteRecipe);
check('the second rite is counted too', g.ritesCrafted === 2, 'ritesCrafted=' + g.ritesCrafted);
// The rite still reads on virgin ground — a single rite must not accidentally
// inherit the old Rite of Bones' "needs a corpse first" refusal.
check('the single rite reads on virgin ground', (() => {
  g.world.dimension = 'space';
  g.wormhole = null;
  g.boss = null;
  g.dragonSlain = false;
  g.dragonHP = null;
  const held = g.countItem('rite_of_waking');
  const woke = g.performBoneRite() === true;
  return woke && g.countItem('rite_of_waking') === held - 1 && !!g.boss;
})());
g.boss = null;

step('4. Both counters survive a reload');
// ritesCrafted drives the price and dragonKills drives the loot. A reload that
// lost either would hand back a cheap rite and a second free plate.
g.saveGame(true);
const saved = JSON.parse(localStorage.getItem(g.saveKey));
check('ritesCrafted is written to the save', saved.ritesCrafted === 2,
  'ritesCrafted=' + saved.ritesCrafted);
check('dragonKills is written to the save', saved.dragonKills >= 1,
  'dragonKills=' + saved.dragonKills);
g.loadGame(true);
check('ritesCrafted survives the reload', g.ritesCrafted === 2, 'ritesCrafted=' + g.ritesCrafted);
check('dragonKills survives the reload', g.dragonKills >= 1, 'dragonKills=' + g.dragonKills);
check('the rite still prices as a repeat after the reload',
  g.recipeMaterials(riteRecipe).length === 6);
g.dragonKills = Math.max(1, g.dragonKills);
const postReloadLoot = killDragon();
check('no plate or wings drop after a reload, ever',
  !postReloadLoot.includes('ossuary_armor') && !postReloadLoot.includes('dragon_wings'),
  postReloadLoot.join(','));

// A save written before either counter existed still has to load cleanly. The
// keys are physically ABSENT, not merely undefined — that is what an old save
// file actually looks like, and it is what the load guard has to survive.
check('an old save with neither field loads as zero', (() => {
  g.ritesCrafted = 7; g.dragonKills = 9; g.dragonSlain = false;
  const legacy = Object.assign({}, saved);
  delete legacy.ritesCrafted;
  delete legacy.dragonKills;
  localStorage.setItem(g.saveKey, JSON.stringify(legacy));
  g.loadGame(true);
  return g.ritesCrafted === 0 && g.dragonKills === 0;
})(), 'ritesCrafted=' + g.ritesCrafted + ' dragonKills=' + g.dragonKills);

step('5. The Ossuary deep is worth digging into');
// The world height is fixed and shared with the overworld, so the only way to
// deepen the mine is to lift the arena's crust and let the rock below it grow.
// This is the "you can mine more" change, asserted so a later tweak to the
// arena height cannot quietly shrink it back. Step 4's reload put the player
// back overworld, so cross the rift again to measure the arena for real.
if (!g.world.isInSpace()) g.world.enterSpaceDimension();
const worldHeight = g.world.height;
const crust = g.world.spaceArena.floorY;
const deepRows = worldHeight - 1 - (crust + 10);
check('the arena sits high enough to leave a real mine under it', deepRows >= 36,
  'crust=' + crust + ' worldFloor=' + (worldHeight - 1) + ' deep rows=' + deepRows);
check('the deep is more than twice the 16 rows it used to be', deepRows > 32,
  'rows=' + deepRows);
// Nothing may be generated inside the boss's flight box, and that promise is
// enforced by the same floorY the deep is measured from.
check('the flight box is still above the crust',
  g.world.spaceArena.ceil < g.world.spaceArena.crust && g.world.spaceArena.crust === crust,
  'ceil=' + g.world.spaceArena.ceil + ' crust=' + g.world.spaceArena.crust);
check('the whole mine is solid rock the player can dig through', (() => {
  let solid = 0, total = 0;
  for (let x = 0; x < g.world.width; x += 7) {
    for (let y = crust + 11; y < worldHeight; y++) {
      total++;
      if (g.world.isSolid(x, y)) solid++;
    }
  }
  return total > 0 && solid / total > 0.5;
})());
check('the deepest band is worth the climb', (() => {
  let ore = 0, total = 0;
  for (let x = 0; x < g.world.width; x += 5) {
    for (let y = crust + 11; y < worldHeight; y++) {
      total++;
      const t = g.world.getTile(x, y);
      if (t === global.TILES.METEOR_ORE || t === global.TILES.NEBULA_CRYSTAL ||
        t === global.TILES.SOUL_GLASS || t === global.TILES.BONE_PILE) ore++;
    }
  }
  return total > 0 && ore / total > 0.05;
})());

console.log('\n' + '─'.repeat(62));
console.log(failures
  ? '✖ ' + failures + ' DRAGON-LOOT CHECK(S) FAILED'
  : '✔ ALL DRAGON-LOOT CHECKS PASSED');
const code = failures === 0 ? 0 : 1;
const leave = () => process.exit(code);
process.stdout.write('', leave);
setTimeout(leave, 1000);