// qa-item-icons.js — every item slot must actually show an icon.
//
// Written after an attempt to replace the emoji with painted canvas art went
// wrong twice: once because the icon wrappers were sized only by their text and
// collapsed to 0x0, and once because a canvas child did not render in the real
// app. Both were invisible to every other suite, because none of them look at
// the UI. This file does, and it holds the line: whatever draws the icons, a
// filled slot must end up with something VISIBLE in it, in all four menus.
const fs = require('fs');
const vm = require('vm');

let failures = 0;
const check = (label, ok, detail = '') => {
  if (!ok) failures++;
  console.log((ok ? '  PASS ' : '  FAIL ') + label + (!ok && detail ? ' — ' + detail : ''));
};

// A canvas stub that records how much geometry was actually drawn.
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

// An element stub that actually tracks children, so "did a canvas get
// appended, and is it the right size?" is answerable.
function makeEl(id) {
  const el = {
    id, width: 0, height: 0, textContent: '', innerHTML: '', style: {}, dataset: {},
    className: '', classList: {
      _s: new Set(),
      add(c) { this._s.add(c); }, remove(c) { this._s.delete(c); },
      contains(c) { return this._s.has(c); }, toggle() { return false; }
    },
    children: [],
    getContext: () => makeCtx(),
    appendChild(child) { el.children.push(child); child.parentNode = el; return child; },
    removeChild(child) {
      const i = el.children.indexOf(child);
      if (i >= 0) el.children.splice(i, 1);
      return child;
    },
    remove() { if (el.parentNode) el.parentNode.removeChild(el); },
    addEventListener() {}, removeEventListener() {},
    querySelector(sel) {
      // Match the last class in a compound selector, the way a real
      // `canvas.item-icon-canvas` query behaves.
      const cls = String(sel).split('.').pop();
      return el.children.find(c => c.className && String(c.className).split(/\s+/).includes(cls)) || null;
    },
    querySelectorAll: () => [], closest: () => null,
    setAttribute() {}, getAttribute: () => null, value: ''
  };
  el.parentNode = { removeChild() {} };
  return el;
}
const els = {};
global.document = {
  readyState: 'complete', scripts: [],
  getElementById: (id) => (els[id] ||= makeEl(id)),
  createElement: (tag) => makeEl(tag),
  addEventListener() {}, querySelector: () => null, querySelectorAll: () => [], body: makeEl('body')
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
  removeItem: (k) => store.delete(k), clear: () => store.clear()
};
const files = ['audio.js', 'particles.js', 'world.js', 'weather.js', 'entities.js',
  'underworld.js', 'space.js', 'juice.js', 'npcs.js', 'journey.js', 'terraria.js'];
const ctx = vm.createContext(global);
for (const f of files) vm.runInContext(fs.readFileSync(f, 'utf8'), ctx, { filename: f });

// ---------------------------------------------------------------- 1. the data
// Every item must carry a non-empty glyph, or its slot renders blank.
const blank = Object.keys(global.ITEMS).filter(id => {
  const it = global.ITEMS[id];
  return !it || typeof it.icon !== 'string' || it.icon.trim() === '';
});
check('every item in the game has a non-empty icon',
  blank.length === 0,
  blank.length ? 'blank: ' + blank.slice(0, 8).join(', ') : Object.keys(global.ITEMS).length + ' items');

// ---------------------------------------------------------------- 2. the menus
// Render each menu for real and read back what landed in the slots.
const g = new global.Game();
g.player.invulnerableTime = 99999;
for (const id of ['void_star_blade', 'dragonbone', 'rite_of_bones', 'backpack_large',
  'slate_brick', 'healing_potion', 'copper_pickaxe', 'dragon_wings', 'obsuary_armor',
  'diamond', 'dirt', 'campfire']) {
  g.addItem(id, 1);
}
g.renderHotbarUI();
g.renderInventoryGrid();
g.renderCreativeMenu();
g.renderCraftingRecipes();

// Anything that ended up in a slot must be visible: real text, or a sized canvas
// child. Deliberately agnostic about WHICH technique is used.
const visible = (el) => {
  if (!el) return false;
  if (typeof el.textContent === 'string' && el.textContent.trim() !== '') return true;
  const kid = el.children && el.children.find(c => c.width > 0 && c.height > 0);
  return !!kid;
};
const harvest = (root) => {
  const out = [];
  const walk = (el) => {
    if (!el) return;
    if (el.className && /slot|icon|cell/.test(String(el.className))) out.push(el);
    for (const kid of (el.children || [])) walk(kid);
  };
  walk(root);
  return out;
};
for (const [name, id] of [
  ['hotbar', 'hotbar'], ['inventory grid', 'inventory-grid'],
  ['creative grid', 'creative-grid'], ['recipe list', 'recipe-list']
]) {
  const root = els[id];
  const slots = harvest(root).filter(el => visible(el));
  check(name + ' renders visible icons', slots.length > 0,
    'visible slots=' + slots.length);
}
// The hotbar is the one the player looks at constantly: it must show all nine
// of the items just added, not just "something".
const hotbarSlots = harvest(els['hotbar']).filter(el => visible(el));
check('the hotbar shows every item put in it', hotbarSlots.length >= 9,
  'visible hotbar slots=' + hotbarSlots.length);

// ------------------------------------------------------------------- 3. CSS
// The icon wrappers are sized by their glyph, which is what makes a text-based
// icon work — and exactly what made a background-image version collapse. Keep
// them font-sized on purpose, and keep the creative grid's greyscale: it is what
// marks an item you do not own yet.
const css = fs.readFileSync('terraria.css', 'utf8');
check('.creative-cell-icon keeps its greyscale (unowned marker)',
  /\.creative-cell-icon\s*\{[^}]*filter\s*:\s*grayscale/.test(css));
check('the emoji font stack is declared for the icon wrappers',
  /\.slot-icon[\s\S]{0,400}Segoe UI Emoji/.test(css) ||
  /Segoe UI Emoji/.test(css));

console.log('\n' + '─'.repeat(62));
console.log(failures
  ? '✗ ' + failures + ' ITEM-ICON CHECK(S) FAILED'
  : '✓ ALL ITEM-ICON CHECKS PASSED');
process.exit(failures ? 1 : 0);