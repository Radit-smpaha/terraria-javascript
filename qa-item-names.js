// qa-item-names.js - regression test for the two item-name readouts.
//
//   1. Hovering an item anywhere in the UI shows its name at the cursor
//      (bag, shared stash, chests, creative menu).
//   2. The HOTBAR is deliberately excluded from (1). Instead, switching the
//      selected slot flashes the name above the hotbar, Minecraft-style.
//
// Usage: node qa-item-names.js [dir]
const fs = require('fs');
const vm = require('vm');
const path = require('path');

const dir = process.argv[2] || '.';
const SCRIPTS = [
  'audio.js', 'particles.js', 'world.js', 'weather.js', 'entities.js',
  'underworld.js', 'space.js', 'juice.js', 'npcs.js', 'journey.js', 'terraria.js'
];

const results = [];
function check(name, ok, detail) {
  results.push({ name, ok });
  console.log((ok ? '  PASS  ' : '  FAIL  ') + name + (detail ? '   [' + detail + ']' : ''));
}

function makeCtx() {
  const noop = () => {};
  return new Proxy({
    canvas: { width: 1280, height: 720 },
    measureText: () => ({ width: 10 }),
    createLinearGradient: () => ({ addColorStop: noop }),
    createRadialGradient: () => ({ addColorStop: noop }),
    createPattern: () => null,
    getImageData: () => ({ data: new Uint8ClampedArray(4) }),
    save: noop, restore: noop
  }, { get: (t, k) => (k in t ? t[k] : noop), set: (t, k, v) => { t[k] = v; return true; } });
}

// Elements need a parent chain plus closest/contains/dispatch so the delegated
// mouse handlers in Game#setupItemTooltips can actually be exercised.
function makeEl(tag) {
  const el = {
    tagName: (tag || 'div').toUpperCase(),
    // Real elements always have nodeType 1, and Game#setupItemTooltips guards
    // on it before calling closest(). A stub without this silently fails that
    // guard and the tooltip never appears.
    nodeType: 1,
    style: {}, dataset: {}, children: [], _classes: new Set(), _listeners: {},
    parentNode: null,
    width: 1280, height: 720, clientWidth: 1280, clientHeight: 720,
    offsetWidth: 140, offsetHeight: 26, hidden: false,
    disabled: false, className: '', textContent: '', value: '',
    classList: {
      add: (c) => el._classes.add(c),
      remove: (c) => el._classes.delete(c),
      contains: (c) => el._classes.has(c),
      toggle: (c, force) => {
        const want = force === undefined ? !el._classes.has(c) : !!force;
        if (want) el._classes.add(c); else el._classes.delete(c);
        return want;
      }
    },
    appendChild(c) { c.parentNode = el; el.children.push(c); return c; },
    removeChild(c) { return c; },
    setAttribute() {}, getAttribute: () => null, removeAttribute() {},
    remove() {},
    addEventListener(type, fn) { (el._listeners[type] = el._listeners[type] || []).push(fn); },
    removeEventListener() {},
    contains(node) { let p = el; while (p) { if (p === node) return true; p = p.parentNode; } return false; },
    closest(sel) {
      // dataset keys are camelCase, so [data-tip] must be matched as `tip`.
      const attr = /^\[data-([a-zA-Z-]+)\]$/.exec(sel);
      let p = el;
      while (p) {
        if (attr && p.dataset && attr[1] in p.dataset) return p;
        p = p.parentNode;
      }
      return null;
    },
    querySelector: () => null, querySelectorAll: () => [],
    getBoundingClientRect: () => ({ left: 0, top: 0, width: 1280, height: 720, right: 1280, bottom: 720 }),
    focus() {}, blur() {}, click() {}, scrollIntoView: () => {},
    getContext: () => makeCtx()
  };
  // Bubbling dispatch: walks parentNode so a cell's event reaches #ui-layer.
  el.dispatch = (type, event) => {
    const e = Object.assign({
      type, target: el, relatedTarget: null, clientX: 0, clientY: 0,
      preventDefault() {}, stopPropagation() {}
    }, event || {});
    e.target = event && event.target ? event.target : el;
    let node = el;
    while (node) {
      for (const fn of (node._listeners[type] || [])) fn(e);
      node = node.parentNode;
    }
  };
  let inner = '';
  Object.defineProperty(el, 'innerHTML', {
    get: () => inner,
    set: (v) => {
      inner = v;
      for (const c of el.children) c.parentNode = null;
      el.children.length = 0;
    }
  });
  return el;
}

const elements = new Map();
const document = {
  readyState: 'complete',
  getElementById: (id) => {
    if (!elements.has(id)) elements.set(id, makeEl('div'));
    return elements.get(id);
  },
  createElement: (t) => makeEl(t),
  querySelector: () => null, querySelectorAll: () => [],
  addEventListener: () => {}, removeEventListener: () => {},
  body: makeEl('body'), documentElement: makeEl('html')
};

const store = new Map();
const localStorage = {
  getItem: (k) => (store.has(k) ? store.get(k) : null),
  setItem: (k, v) => { store.set(k, String(v)); },
  removeItem: (k) => { store.delete(k); }
};

const errors = [];
const win = {
  console, document, localStorage,
  Math, JSON, Date, Object, Array, String, Number, Boolean, Error,
  Uint8ClampedArray, Uint8Array, Float32Array, Set, Map, Promise, Proxy, Reflect,
  isNaN, parseInt, parseFloat, isFinite,
  setTimeout: (fn) => { try { fn(); } catch (e) { errors.push(e); } return 0; },
  setInterval: () => 0, clearTimeout: () => {}, clearInterval: () => {},
  requestAnimationFrame: () => 0, cancelAnimationFrame: () => {},
  addEventListener: () => {}, removeEventListener: () => {},
  innerWidth: 1280, innerHeight: 720, devicePixelRatio: 1,
  location: { href: 'http://localhost/', search: '', hash: '', reload: () => {} },
  navigator: { userAgent: 'node' },
  performance: { now: () => 0 },
  Audio: function () { return { play: () => {}, close: () => {} }; },
  AudioContext: function () { return { createOscillator: () => ({ connect() {}, start() {}, stop() {}, frequency: { value: 0 }, type: '' }), createGain: () => ({ connect() {}, gain: { value: 0 } }), createBuffer: () => ({ getChannelData: () => new Float32Array(1) }), createBufferSource: () => ({ connect() {}, start() {}, stop() {}, buffer: null, loop: false }), destination: {}, currentTime: 0, sampleRate: 44100, resume() {}, state: 'running' }; },
  Image: function () { return { src: '', onload: null, width: 0, height: 0 }; },
  OffscreenCanvas: function () { return { getContext: () => makeCtx(), width: 0, height: 0 }; }
};
win.window = win; win.self = win; win.globalThis = win;

const ctxv = vm.createContext(win);
console.log('=== item names: ' + dir + ' ===');
for (const f of SCRIPTS) {
  const p = path.join(dir, f);
  if (!fs.existsSync(p)) { console.log('  MISSING  ' + f); process.exit(1); }
  try {
    vm.runInContext(fs.readFileSync(p, 'utf8'), ctxv, { filename: f });
  } catch (e) {
    console.log('  THREW    ' + f + ' -> ' + e.message);
    console.log((e.stack || '').split('\n').slice(0, 8).join('\n'));
    process.exit(1);
  }
}

const g = win.game;
const tooltip = document.getElementById('item-tooltip');
const popup = document.getElementById('item-name-popup');
const layer = document.getElementById('ui-layer');
const hotbar = document.getElementById('hotbar');
const invGrid = document.getElementById('inventory-grid');

check('Game boots with the item-name readouts', !!g);
check('both readout elements exist', !!tooltip && !!popup);
check('the cursor tooltip is wired to the game', g._itemTooltip === tooltip);

// The stub DOM hands back unrelated roots, so link the two grids into the UI
// layer by hand - otherwise delegated events have nothing to bubble to.
invGrid.parentNode = layer;
hotbar.parentNode = layer;

// Real items, so the names under test are the ones the player really sees.
const ids = Object.keys(win.ITEMS);
const weaponId = ids.find((id) => win.ITEMS[id].type === 'weapon') || ids[0];
const blockId = ids.find((id) => win.ITEMS[id].type !== 'weapon' && id !== weaponId) || ids[1];
g.inventory[0] = { id: weaponId, count: 3 };
g.inventory[1] = { id: blockId, count: 12 };
g.renderInventoryGrid();
g.renderHotbarUI();

const weaponName = win.ITEMS[weaponId].name;
const blockName = win.ITEMS[blockId].name;

check('bag cells carry the item name', invGrid.children[0].dataset.tip.indexOf(weaponName) === 0,
  invGrid.children[0].dataset.tip);
check('hotbar slots carry NO hover tooltip', hotbar.children.every((s) => !('tip' in s.dataset)));

tooltip.hidden = true;
invGrid.children[0].dispatch('mouseover', { clientX: 300, clientY: 300 });
check('hovering a bag item shows the tooltip',
  tooltip.hidden === false && tooltip.textContent.indexOf(weaponName) !== -1, tooltip.textContent);
check('the tooltip is positioned at the cursor', tooltip.style.left !== '', tooltip.style.left);

invGrid.children[0].dispatch('mouseout', {});
check('leaving the item hides the tooltip', tooltip.hidden === true);

hotbar.children[0].dispatch('mouseover', { clientX: 300, clientY: 500 });
check('hovering the HOTBAR raises no tooltip', tooltip.hidden === true);

// ---- the hotbar switch flash ------------------------------------------
popup.classList.remove('show');
popup.textContent = '';
g._lastHotbarSlot = undefined;
g.watchHotbarSelection();
check('boot does not flash an item name', popup.textContent === '');

g.player.selectedSlot = 1;
g.watchHotbarSelection();
check('switching slots flashes the name above the hotbar',
  popup.textContent === blockName + ' x12' && popup._classes.has('show'), popup.textContent);

popup.classList.remove('show');
g.watchHotbarSelection();
check('re-selecting the same slot stays quiet', !popup._classes.has('show'));

g.player.selectedSlot = 8;
g.watchHotbarSelection();
check('an empty slot shows no popup',
  popup.textContent === '' && !popup._classes.has('show'), JSON.stringify(popup.textContent));

// ---- edge behaviour ----------------------------------------------------
tooltip.hidden = false;
tooltip.textContent = 'probe';
g.moveItemTooltip(1270, 300);
check('the tooltip flips side near the right edge', parseFloat(tooltip.style.left) < 1270,
  tooltip.style.left);

// ---- static checks -----------------------------------------------------
const html = fs.readFileSync(path.join(dir, 'terraria.html'), 'utf8');
const css = fs.readFileSync(path.join(dir, 'terraria.css'), 'utf8');
check('the readouts are in the markup',
  /id="item-tooltip"/.test(html) && /id="item-name-popup"/.test(html));
check('the popup is anchored inside the hotbar wrapper',
  /class="hotbar-wrapper">[\s\S]*?id="item-name-popup"[\s\S]*?id="hotbar"/.test(html));
check('the tooltip never eats clicks', /\.item-tooltip \{[^}]*pointer-events: none/.test(css));
check('the flash animation ships', css.includes('@keyframes item-name-flash'));
check('the hotbar wrapper is the popup anchor',
  /\.hotbar-wrapper \{ position: relative/.test(css));
// This request was "put the new UI back to the old one" - guard against the
// Terraria skin creeping back in.
check('the Terraria UI skin is gone',
  !css.includes('--terra-panel') && !css.includes('TERRARIA OVERHAUL'));

if (errors.length) {
  console.log('\nerrors captured: ' + errors.length);
  for (const e of errors.slice(0, 5)) console.log('  ' + (e && e.message));
}
const failed = results.filter((r) => !r.ok);
console.log('\n' + (results.length - failed.length) + '/' + results.length + ' checks passed');
if (failed.length) {
  console.log('FAILED: ' + failed.map((r) => r.name).join(' | '));
  process.exit(1);
}
console.log('RESULT: item name readouts OK');