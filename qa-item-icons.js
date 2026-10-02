// qa-item-icons.js — the painted item art actually reaches the DOM.
//
// The bug this exists to prevent: item art was applied as a background-image on
// elements (.slot-icon, .recipe-icon, .creative-cell-icon) that are sized ONLY
// by their text. Replacing the emoji with an empty string collapsed them to 0x0,
// so the background had nothing to paint into and every item in the hotbar,
// bag, creative grid and forge rendered as a blank tile — while every other
// suite stayed green, because none of them look at the DOM.
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

// ---------------------------------------------------------------- 1. the DOM
const hotbarSlot = makeEl('slot-icon');
const painted = applyItemIcon(hotbarSlot, 'void_star_blade', 36);
check('applyItemIcon reports success', painted === true);
const canvas = hotbarSlot.querySelector('canvas.item-icon-canvas');
check('a canvas child is inserted', !!canvas,
  'children=' + hotbarSlot.children.length);
check('the canvas has real dimensions', !!canvas && canvas.width === 36 && canvas.height === 36,
  canvas ? canvas.width + 'x' + canvas.height : 'none');
check('the canvas is styled to those dimensions',
  !!canvas && canvas.style.width === '36px' && canvas.style.height === '36px',
  canvas ? canvas.style.width : 'none');
check('the emoji text is cleared', hotbarSlot.textContent === '',
  'text=' + JSON.stringify(hotbarSlot.textContent));
check('no background-image is relied on', !hotbarSlot.style.backgroundImage,
  'bg=' + hotbarSlot.style.backgroundImage);

// Re-rendering must REPLACE, never stack.
applyItemIcon(hotbarSlot, 'dragonbone', 36);
check('a re-render replaces the icon instead of stacking',
  hotbarSlot.children.length === 1,
  'children=' + hotbarSlot.children.length);

// An unknown id must still render something rather than nothing.
const unknown = makeEl('slot-icon');
const okUnknown = applyItemIcon(unknown, 'not_a_real_item', 36);
check('an unknown id still produces an icon', okUnknown === true,
  'painted=' + okUnknown);
check('an unknown id is not left blank',
  !!unknown.querySelector('canvas.item-icon-canvas') || unknown.textContent !== '');

// Every real item in the game must paint — no blanks hiding behind a fallback.
const unmapped = Object.keys(global.ITEMS).filter(id => {
  const el = makeEl('probe');
  if (!applyItemIcon(el, id, 32)) return true;
  return !el.querySelector('canvas.item-icon-canvas');
});
check('every item in the game paints a real icon', unmapped.length === 0,
  unmapped.length ? 'unpainted: ' + unmapped.slice(0, 8).join(', ') : Object.keys(global.ITEMS).length + ' items');

// ------------------------------------------------------------------- 2. CSS
// The regression guard: these classes were sized by their text alone, so any
// future change back to a font-sized box re-creates the blank-tile bug.
const css = fs.readFileSync('terraria.css', 'utf8');
for (const sel of ['.slot-icon', '.recipe-icon', '.creative-cell-icon']) {
  // '.' must be escaped so it matches a literal class, not any character.
  const block = css.match(new RegExp('\\' + sel + '\\s*\\{([^}]*)\\}'));
  const hasBox = !!block && /\bwidth\s*:/.test(block[1]) && /\bheight\s*:/.test(block[1]);
  const isFlexBox = !!block && /display\s*:\s*flex/.test(block[1]);
  check(sel + ' is explicitly sized (or a flex box)',
    hasBox || isFlexBox,
    block ? block[1].trim().slice(0, 60) : 'no rule found');
}
check('.item-icon-canvas cancels the creative greyscale',
  /\.item-icon-canvas\s*\{[^}]*filter\s*:\s*none/.test(css));

console.log('\n' + '─'.repeat(62));
console.log(failures
  ? '✗ ' + failures + ' ITEM-ICON CHECK(S) FAILED'
  : '✓ ALL ITEM-ICON CHECKS PASSED');
process.exit(failures ? 1 : 0);