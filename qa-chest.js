// Chest regression suite — the storage panel, the craftable chest, and the
// promise that a chest's contents live in the WORLD: they survive reloads,
// spill onto the ground when the chest is broken, and only a sealed world
// chest ever rolls loot (a chest the player places starts empty).
//
// Modelled on qa-reload.js: boot the game headlessly in a stub DOM, drive the
// same API paths the panel's buttons use, then reload the page twice to prove
// the save carries the contents and that a pre-feature save still loads.
const fs = require('fs');
const vm = require('vm');

const files = ['audio.js', 'particles.js', 'world.js', 'weather.js', 'entities.js', 'underworld.js', 'space.js', 'juice.js', 'npcs.js', 'journey.js', 'terraria.js'];

function makeCtx() {
  return new Proxy({}, {
    get(t, p) {
      if (p === 'canvas') return {};
      if (p === 'createRadialGradient' || p === 'createLinearGradient')
        return () => ({ addColorStop() {} });
      if (p === 'getImageData') return () => ({ data: new Uint8ClampedArray(4) });
      if (p === 'measureText') return () => ({ width: 10 });
      if (typeof p === 'string') return () => undefined;
      return undefined;
    },
    set() { return true; }
  });
}

function makeEl(id) {
  const classes = new Set();
  return {
    id, width: 800, height: 600, textContent: '', innerHTML: '',
    style: {}, dataset: {}, children: [], className: '', value: '',
    classList: {
      add: (c) => classes.add(c),
      remove: (c) => classes.delete(c),
      contains: (c) => classes.has(c),
      toggle: (c, on) => (on ? classes.add(c) : classes.delete(c))
    },
    getContext: () => makeCtx(),
    addEventListener() {}, removeEventListener() {}, appendChild(child) { this.children.push(child); },
    querySelector: () => null, querySelectorAll: () => [], closest: () => null,
    remove() {}, parentNode: { removeChild() {} }, setAttribute() {}, getAttribute: () => null,
  };
}

// One localStorage shared by all "page loads" (a browser keeps it across F5).
const store = new Map();

function bootPage() {
  const els = {};
  const sandbox = {
    console,
    performance: { now: () => 1000 },
    requestAnimationFrame: () => 0,
    setTimeout, clearTimeout, setInterval, clearInterval,
    innerWidth: 1280, innerHeight: 720, devicePixelRatio: 1,
    addEventListener: () => {}, removeEventListener: () => {},
    location: { reload() {}, href: 'http://localhost/' },
    localStorage: {
      getItem: (k) => (store.has(k) ? store.get(k) : null),
      setItem: (k, v) => { store.set(k, String(v)); },
      removeItem: (k) => { store.delete(k); },
    },
    document: {
      readyState: 'complete',
      scripts: [],
      getElementById: (id) => (els[id] ||= makeEl(id)),
      createElement: (tag) => makeEl(tag),
      addEventListener() {},
      querySelector: () => null,
      querySelectorAll: () => [],
      body: makeEl('body'),
    },
  };
  sandbox.window = sandbox;
  sandbox.globalThis = sandbox;
  const context = vm.createContext(sandbox);
  for (const f of files) {
    vm.runInContext(fs.readFileSync(f, 'utf8'), context, { filename: f });
  }
  // Top-level const/class bindings live in the context's lexical scope, not on
  // the sandbox object — evaluate in-context to reach TILES/ITEMS/etc.
  const run = (code) => vm.runInContext(code, context);
  return { sandbox, g: sandbox.game, els, run };
}

let fail = 0;
const check = (label, ok, detail = '') => {
  console.log((ok ? 'OK:   ' : 'FAIL: ') + label + (detail ? ' (' + detail + ')' : ''));
  if (!ok) fail = 1;
};

// ------------------------------------------------------------ page load #1
const page1 = bootPage();
const g1 = page1.g;
const { TILES, ITEMS, RECIPES, TILE_SIZE, TILE_PROPERTIES } =
  page1.run('({ TILES, ITEMS, RECIPES, TILE_SIZE, TILE_PROPERTIES })');

// ---- Chests are craftable -------------------------------------------------
check('chest item exists and places the chest tile',
  !!(ITEMS.chest && ITEMS.chest.type === 'tile' && ITEMS.chest.tile === TILES.CHEST),
  ITEMS.chest ? ITEMS.chest.id : 'missing');

const chestRecipe = RECIPES.find(r => r.result && r.result.id === 'chest');
check('chest has a crafting recipe', !!chestRecipe,
  chestRecipe ? JSON.stringify(chestRecipe.materials) : 'missing');
if (chestRecipe) {
  for (const m of chestRecipe.materials) g1.addItem(m.id, m.count);
  check('the recipe is craftable once the materials are in the bag',
    g1.canCraftRecipe(chestRecipe));
  const chestsBefore = g1.countItem('chest');
  g1.craftRecipe(chestRecipe);
  check('crafting yields a chest',
    g1.countItem('chest') === chestsBefore + 1,
    `had ${chestsBefore}, now ${g1.countItem('chest')}`);
}

// ---- Placement: a player-placed chest starts EMPTY -------------------------
const pTx = Math.floor((g1.player.x + g1.player.width / 2) / TILE_SIZE);
const pTy = Math.floor((g1.player.y + g1.player.height / 2) / TILE_SIZE);
const pL = Math.floor(g1.player.x / TILE_SIZE);
const pR = Math.floor((g1.player.x + g1.player.width) / TILE_SIZE);
const pT = Math.floor(g1.player.y / TILE_SIZE);
const pB = Math.floor((g1.player.y + g1.player.height) / TILE_SIZE);

// Inside the 6.5-tile reach so placement AND the later interaction both hit.
let placeX = -1, placeY = -1;
for (let dx = -6; dx <= 6 && placeX < 0; dx++) {
  for (let dy = -6; dy <= 6 && placeX < 0; dy++) {
    const tx = pTx + dx, ty = pTy + dy;
    if (g1.world.getTile(tx, ty) !== TILES.AIR) continue;
    if (tx >= pL && tx <= pR && ty >= pT && ty <= pB) continue;
    if (Math.hypot(tx - pTx, ty - pTy) > 6.5) continue;
    placeX = tx; placeY = ty;
  }
}
check('found a legal spot to place a chest', placeX >= 0, `(${placeX},${placeY})`);

const placeKey = `${placeX},${placeY}`;
const slot0 = g1.inventory[0];
g1.inventory[0] = { id: 'chest', count: 1 };
g1.player.selectedSlot = 0;
// Aim the right-click handler: mouse coords are screen-relative, so the
// camera position picks the tile under a mouse sitting at (12, 12).
g1.camera.x = placeX * TILE_SIZE;
g1.camera.y = placeY * TILE_SIZE;
g1.input.mouseX = 12;
g1.input.mouseY = 12;
g1.handleRightClick();
g1.inventory[0] = slot0;

check('right-click places the chest tile',
  g1.world.getTile(placeX, placeY) === TILES.CHEST,
  'tile=' + g1.world.getTile(placeX, placeY));
check('a placed chest pre-registers an EMPTY grid (no free loot roll)',
  Array.isArray(g1.chestStorage[placeKey]) &&
  g1.chestStorage[placeKey].length === 18 &&
  g1.chestStorage[placeKey].every(s => s.id === 'empty'));

// ---- The placed chest opens its own panel, empty ---------------------------
g1.openChestUI(placeX, placeY);
check('placed chest opens with no loot roll',
  g1.chestStorage[placeKey].every(s => s.id === 'empty') &&
  g1.world.getTile(placeX, placeY) === TILES.CHEST_OPEN,
  'tile=' + g1.world.getTile(placeX, placeY));
check('the chest panel is on screen and tracked',
  !!g1.openChest && g1.openChest.x === placeX && g1.openChest.y === placeY &&
  !page1.els['chest-modal'].classList.contains('hidden'));

// ---- Deposit / withdraw ----------------------------------------------------
g1.addItem('crystal', 7);
const crystalTotal = () => g1.countItem('crystal');
const chestCrystal = (slots) => slots.reduce((n, s) => (s.id === 'crystal' ? n + s.count : n), 0);
const slots = g1.chestStorage[placeKey];
const before = crystalTotal();

g1.moveToChest(g1.inventory.findIndex(s => s.id === 'crystal'), true);
check('click deposits the whole stack into the chest',
  crystalTotal() < before && chestCrystal(slots) === before - crystalTotal(),
  `bag ${before} -> ${crystalTotal()}, chest ${chestCrystal(slots)}`);
g1.takeFromChest(slots.findIndex(s => s.id === 'crystal'), true);
check('click takes the whole stack back out',
  crystalTotal() === before && chestCrystal(slots) === 0,
  `bag=${crystalTotal()} chest=${chestCrystal(slots)}`);

// Shift means one at a time, in both directions.
g1.moveToChest(g1.inventory.findIndex(s => s.id === 'crystal'), false);
check('shift+click moves exactly one item in',
  crystalTotal() === before - 1, `bag=${crystalTotal()}`);
g1.takeFromChest(slots.findIndex(s => s.id === 'crystal'), false);
check('shift+click moves exactly one item out',
  crystalTotal() === before, `bag=${crystalTotal()}`);

// ---- Quick deposit / Take all ---------------------------------------------
g1.addItem('wood', 5);
const woodBefore = g1.countItem('wood');
g1.chestQuickDeposit();
check('quick deposit empties the bag stacks into the chest',
  g1.countItem('wood') === 0 &&
  slots.some(s => s.id === 'wood' && s.count === woodBefore),
  `bag wood=${g1.countItem('wood')}, wood in chest=${slots.filter(s => s.id === 'wood').map(s => s.count).join('+')}`);
g1.chestTakeAll();
check('take all returns everything to the bag',
  g1.countItem('wood') === woodBefore && slots.every(s => s.id === 'empty'),
  `bag wood=${g1.countItem('wood')}`);

// ---- Pickaxe swings through, bare hand opens -------------------------------
const withHeld = (id, fn) => {
  const sel = g1.player.selectedSlot;
  const saved = g1.inventory[sel];
  g1.inventory[sel] = { id, count: id === 'empty' ? 0 : 1 };
  try { return fn(); } finally { g1.inventory[sel] = saved; }
};
const toolResult = withHeld('copper_pickaxe', () => g1.interactWithSpecialTile(placeX, placeY));
check('click with a pickaxe falls through to mining (returns false)',
  toolResult === false, 'result=' + toolResult);
const handResult = withHeld('empty', () => g1.interactWithSpecialTile(placeX, placeY));
check('click with a bare hand opens the chest panel',
  handResult === true && !!g1.openChest &&
  !page1.els['chest-modal'].classList.contains('hidden'),
  'result=' + handResult);
g1.closeChestUI();
check('closing the panel hides it', g1.openChest === null &&
  page1.els['chest-modal'].classList.contains('hidden'));

// ---- A sealed world chest rolls its loot INTO the storage ------------------
let wTx = pTx - 3, wTy = pTy - 4;
if (wTx === placeX && wTy === placeY) wTx -= 1;
const worldKey = `${wTx},${wTy}`;
g1.world.setTile(wTx, wTy, TILES.CHEST);
delete g1.chestStorage[worldKey];
const openedBefore = g1.chestsOpened || 0;
g1.openChestUI(wTx, wTy);
const worldSlots = g1.chestStorage[worldKey];
const lootIn = worldSlots ? worldSlots.filter(s => s.id !== 'empty') : [];
check('a sealed world chest seeds two loot stacks on first open',
  lootIn.length === 2, JSON.stringify(lootIn));
check('first open flips the tile to the opened chest',
  g1.world.getTile(wTx, wTy) === TILES.CHEST_OPEN,
  'tile=' + g1.world.getTile(wTx, wTy));
check('first-chest bookkeeping still fires',
  (g1.chestsOpened || 0) === openedBefore + 1,
  `${openedBefore} -> ${g1.chestsOpened}`);
const snapshot = JSON.stringify(g1.chestStorage[worldKey]);
g1.closeChestUI();
g1.openChestUI(wTx, wTy);
check('reopening does not re-roll the loot',
  JSON.stringify(g1.chestStorage[worldKey]) === snapshot &&
  (g1.chestsOpened || 0) === openedBefore + 1);
g1.closeChestUI();

// ---- Breaking a chest spills its contents ----------------------------------
const pSlots = g1.getChestSlots(placeX, placeY);
pSlots[0] = { id: 'stone', count: 12 };
const dropsBefore = g1.drops.length;
g1.spillChestContents(placeX, placeY);
const last = g1.drops[g1.drops.length - 1];
check('breaking a chest spills its stacks into the world',
  g1.drops.length === dropsBefore + 1 && last && last.id === 'stone' && last.count === 12 &&
  !(placeKey in g1.chestStorage),
  `drops +${g1.drops.length - dropsBefore}, last=${last ? last.id : 'none'}`);
check('the chest tiles themselves drop a chest item back',
  TILE_PROPERTIES[TILES.CHEST].drops && TILE_PROPERTIES[TILES.CHEST].drops.id === 'chest' &&
  TILE_PROPERTIES[TILES.CHEST_OPEN].drops && TILE_PROPERTIES[TILES.CHEST_OPEN].drops.id === 'chest');
// The click-to-mine path has to call the spill — a structural check, since the
// interact fall-through above is what lets the mining branch run at all.
const terrariaSrc = fs.readFileSync('terraria.js', 'utf8');
check('the mining path wires the spill in',
  /tile === TILES\.CHEST \|\| tile === TILES\.CHEST_OPEN\) this\.spillChestContents\(tileX, tileY\)/.test(terrariaSrc));

// ------------------------------------------------------------ save / reload
g1.chestStorage[placeKey] = g1.makeEmptyChestSlots();
g1.chestStorage[placeKey][0] = { id: 'wood', count: 9 };
g1.closeChestUI();
g1.saveGame(true);

const payload = JSON.parse(store.get('terracraft-world-slot-1'));
check('the save carries chest storage',
  !!(payload.chests && payload.chests[placeKey] &&
     payload.chests[placeKey][0] && payload.chests[placeKey][0].id === 'wood' &&
     payload.chests[placeKey][0].count === 9),
  JSON.stringify(payload.chests && payload.chests[placeKey] && payload.chests[placeKey][0]));

// ------------------------------------------------------------ page load #2
const page2 = bootPage();
const g2 = page2.g;
check('reload restores the chest contents',
  !!(g2.chestStorage[placeKey] &&
     g2.chestStorage[placeKey].some(s => s.id === 'wood' && s.count === 9)));
check('reload never resurrects an open chest panel',
  g2.openChest === null && page2.els['chest-modal'].classList.contains('hidden'));

// A save written before the feature (no chests key) must still load.
const legacy = JSON.parse(store.get('terracraft-world-slot-1'));
delete legacy.chests;
store.set('terracraft-world-slot-1', JSON.stringify(legacy));

// ------------------------------------------------------------ page load #3
const page3 = bootPage();
const g3 = page3.g;
check('a save without the chests key still loads',
  !!g3.chestStorage && Object.keys(g3.chestStorage).length === 0 && g3.openChest === null);

console.log(fail ? 'CHEST CHECK FAILED' : 'CHEST CHECK PASSED');
process.exit(fail);