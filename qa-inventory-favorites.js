// ══════════════════════════════════════════════════════════════════════════
// Functional QA for inventory favourites (node qa-inventory-favorites.js)
//
// The promise is narrow and absolute: a favourited stack cannot be deleted or
// dropped until it is un-favourited. "We just didn't wire a delete button next
// to it" is not the same as "it cannot be deleted", so this asserts on the
// enforcement itself — every path that removes a stack is exercised, each must
// refuse while the favourite flag is set AND allow once it is cleared (so a
// blanket "refuses everything" bug cannot pass).
// ══════════════════════════════════════════════════════════════════════════
const fs = require('fs');
const vm = require('vm');

let failures = 0;
const check = (label, ok, detail = '') => {
  if (!ok) failures++;
  console.log((ok ? '  PASS ' : '  FAIL ') + label + (!ok && detail ? ' — ' + detail : ''));
};
const step = (title) => console.log('\n▸ ' + title);

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
    style: {}, dataset: {}, offsetHeight: 100,
    classList: (() => {
      const set = new Set();
      return {
        add: (c) => set.add(c), remove: (c) => set.delete(c),
        contains: (c) => set.has(c),
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
  addEventListener() {}, removeEventListener() {},
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

const files = ['audio.js', 'particles.js', 'world.js', 'weather.js', 'entities.js',
  'underworld.js', 'space.js', 'juice.js', 'npcs.js', 'journey.js', 'terraria.js'];
const ctx = vm.createContext(global);
for (const f of files) {
  try {
    vm.runInContext(fs.readFileSync(f, 'utf8'), ctx, { filename: f });
  } catch (e) {
    console.log('EVAL FAIL ' + f + ': ' + (e.stack || e.message));
    process.exit(1);
  }
}
const g = global.game;
const { RECIPES } = global;
if (!g) { console.log('BOOT FAIL: no game'); process.exit(1); }

// A clean, predictable bag to work on.
function freshBag() {
  for (let i = 0; i < g.inventory.length; i++) g.inventory[i] = { id: 'empty', count: 0 };
}
freshBag();

// ══════════════════════════════════════════════════════════════════════════
step('1. The API and the UI exist');
for (const fn of ['isFavorited', 'hasFavoritedStack', 'selectInventorySlot',
  'toggleSelectedFavorite', 'deleteSelectedSlot', 'clearSlotSelection', 'renderSlotManager']) {
  check('Game.' + fn + ' exists', typeof g[fn] === 'function');
}
check('the selection starts empty', g.selectedSlotIndex === null, g.selectedSlotIndex);

const html = fs.readFileSync('terraria.html', 'utf8');
for (const id of ['slot-fav-btn', 'slot-delete-btn', 'slot-clear-btn', 'slot-selected-label']) {
  check('terraria.html has #' + id, html.includes('id="' + id + '"'));
}
const css = fs.readFileSync('terraria.css', 'utf8');
check('terraria.css styles .favorited', css.includes('.inv-slot.favorited'));
check('terraria.css styles the star badge', css.includes('.slot-star'));

// ══════════════════════════════════════════════════════════════════════════
step('2. Selecting a slot');
freshBag();
g.inventory[3] = { id: 'ossuary_armor', count: 1 };
g.selectedSlotIndex = null;
g.selectInventorySlot(3);
check('the slot is selected', g.selectedSlotIndex === 3, g.selectedSlotIndex);
g.selectInventorySlot(3);
check('clicking it again deselects', g.selectedSlotIndex === null, g.selectedSlotIndex);
g.selectInventorySlot(9);
check('an empty slot cannot be selected', g.selectedSlotIndex === null, g.selectedSlotIndex);
g.selectedSlotIndex = null;

// ══════════════════════════════════════════════════════════════════════════
step('3. Favouriting');
freshBag();
g.inventory[3] = { id: 'dragonbone', count: 5 };
g.selectedSlotIndex = 3;
g.toggleSelectedFavorite();
check('the slot is now favourited', g.inventory[3].fav === true, JSON.stringify(g.inventory[3]));
check('isFavorited agrees', g.isFavorited(g.inventory[3]) === true);
check('hasFavoritedStack finds it by id', g.hasFavoritedStack('dragonbone') === true);
check('an unrelated id is not favourited', g.hasFavoritedStack('wood') === false);
g.toggleSelectedFavorite();
check('toggling again un-favourites', g.inventory[3].fav === false);

// ══════════════════════════════════════════════════════════════════════════
step('4. A favourited stack cannot be DELETED');
freshBag();
g.inventory[4] = { id: 'void_star_blade', count: 1 };
g.selectedSlotIndex = 4;
g.toggleSelectedFavorite();
const dropsBefore = g.drops.length;
const deleted = g.deleteSelectedSlot();
check('delete is refused', deleted === false);
check('the item is still in the bag', g.inventory[4].id === 'void_star_blade', g.inventory[4].id);
check('and the count is untouched', g.inventory[4].count === 1, g.inventory[4].count);
check('nothing was dropped on the floor either', g.drops.length === dropsBefore);

// Now un-favourite and prove the same button DOES work — otherwise "refused"
// could just mean the button is broken and refuses forever.
g.toggleSelectedFavorite();
const deleted2 = g.deleteSelectedSlot();
check('after un-favouriting, delete works', deleted2 === true);
check('the slot is emptied', g.inventory[4].id === 'empty', g.inventory[4].id);
check('the selection is cleared', g.selectedSlotIndex === null, g.selectedSlotIndex);

// ══════════════════════════════════════════════════════════════════════════
step('5. A favourited stack cannot be DROPPED');
freshBag();
g.inventory[5] = { id: 'angel_wings', count: 1, fav: true };
g.selectedSlotIndex = null;
const dropsBefore2 = g.drops.length;
g.dropInventoryStack(5);
check('drop is refused', g.drops.length === dropsBefore2,
  'drops ' + dropsBefore2 + ' -> ' + g.drops.length);
check('the item is still in the bag', g.inventory[5].id === 'angel_wings', g.inventory[5].id);

g.inventory[5].fav = false;
g.dropInventoryStack(5);
check('after un-favouriting, drop works', g.drops.length === dropsBefore2 + 1,
  'drops ' + dropsBefore2 + ' -> ' + g.drops.length);
check('and the slot is emptied', g.inventory[5].id === 'empty', g.inventory[5].id);

// ══════════════════════════════════════════════════════════════════════════
step('6. A favourited stack cannot be CONSUMED by crafting');
// Pick a single-material recipe whose RESULT is a different item, otherwise the
// crafted output lands in the very slot we are measuring and the count goes UP.
const simple = RECIPES.find(r => r.materials && r.materials.length === 1 &&
  r.result && r.result.id !== r.materials[0].id);
if (simple) {
  const matId = simple.materials[0].id;
  // Count the item ACROSS the whole bag, not in one slot: crafting empties the
  // material slot and the result may be written straight back into it, so a
  // per-slot reading goes up rather than down.
  const totalOf = () => g.inventory.reduce((n, s) => n + (s && s.id === matId ? s.count : 0), 0);
  freshBag();
  g.inventory[0] = { id: matId, count: simple.materials[0].count, fav: true };
  const held = totalOf();
  g.craftRecipe(simple);
  check('crafting is refused while the material is favourited',
    totalOf() === held, 'held ' + held + ' -> ' + totalOf());
  g.inventory[0].fav = false;
  g.craftRecipe(simple);
  check('after un-favouriting, crafting works',
    totalOf() < held, 'held ' + held + ' -> ' + totalOf());
} else {
  check('found a single-material recipe to test with', false);
}

// ══════════════════════════════════════════════════════════════════════════
step('7. The favourite survives a save/load round-trip');
freshBag();
g.inventory[6] = { id: 'cursed_edge', count: 1, fav: true };
g.saveGame(true);
g.loadGame(true);
const favSlot = g.inventory.find(s => s.id === 'cursed_edge');
check('the item came back', !!favSlot, 'not found');
check('...and it is STILL favourited', !!(favSlot && favSlot.fav === true),
  JSON.stringify(favSlot));
check('the protection is live after reload', g.hasFavoritedStack('cursed_edge') === true);
const dropsAfterReload = g.drops.length;
const idx = g.inventory.findIndex(s => s.id === 'cursed_edge');
g.dropInventoryStack(idx);
check('and it still refuses to drop after reload', g.drops.length === dropsAfterReload);

// ══════════════════════════════════════════════════════════════════════════
step('8. The ban stamp is a full multi-pass treatment');
g.particles.damageTexts.length = 0;
g.particles.addBanStamp(200, 200);
const stamp = g.particles.damageTexts[0];
check('the stamp records maxLife', typeof stamp.maxLife === 'number' && stamp.maxLife > 0, stamp.maxLife);
check('the stamp is marked isBan', stamp.isBan === true);
const src = fs.readFileSync('particles.js', 'utf8');
check('it draws a slab behind the word', /fillRect/.test(src));
check('it jitters the ghosts every frame', /jitter/.test(src));
check('it has a white-hot core pass', /255,190,190/.test(src));

console.log('\n' + (failures === 0
  ? 'INVENTORY FAVORITES QA: all checks passed'
  : 'INVENTORY FAVORITES QA: ' + failures + ' FAILED'));
process.exit(failures === 0 ? 0 : 1);