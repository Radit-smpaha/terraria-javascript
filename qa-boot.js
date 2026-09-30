// Headless boot harness: loads the scripts in the same order the page does,
// inside a jsdom-free stub DOM, and reports the first exception that fires
// while constructing the Game. A black canvas + dead HUD with valid JS almost
// always means the constructor threw, so this is the fastest way to see it.
const fs = require('fs');
const vm = require('vm');
const path = require('path');

const dir = process.argv[2] || '.';
const label = process.argv[3] || dir;

// Load order copied from terraria.html.
const SCRIPTS = [
  'audio.js', 'particles.js', 'world.js', 'weather.js', 'entities.js',
  'underworld.js', 'space.js', 'juice.js', 'npcs.js', 'journey.js', 'terraria.js'
];

// ---- Minimal DOM stub -----------------------------------------------------
function makeEl(tag) {
  const el = {
    tagName: (tag || 'div').toUpperCase(),
    style: {}, dataset: {}, children: [], _classes: new Set(),
    classList: {
      add: (c) => el._classes.add(c),
      remove: (c) => el._classes.delete(c),
      contains: (c) => el._classes.has(c),
      toggle: (c) => { el._classes.has(c) ? el._classes.delete(c) : el._classes.add(c); }
    },
    width: 1280, height: 720,
    clientWidth: 1280, clientHeight: 720,
    innerHTML: '', textContent: '', value: '',
    appendChild(c) { el.children.push(c); return c; },
    removeChild(c) { return c; },
    setAttribute() {}, getAttribute: () => null, removeAttribute() {},
    addEventListener() {}, removeEventListener() {},
    querySelector: () => null, querySelectorAll: () => [],
    getBoundingClientRect: () => ({ left: 0, top: 0, width: 1280, height: 720, right: 1280, bottom: 720 }),
    focus() {}, blur() {}, click() {}, scrollIntoView() {},
    getContext: () => makeCtx()
  };
  return el;
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
  }, {
    get: (t, k) => (k in t ? t[k] : noop),
    set: (t, k, v) => { t[k] = v; return true; }
  });
}

const elements = new Map();
const document = {
  getElementById: (id) => {
    if (!elements.has(id)) elements.set(id, makeEl('div'));
    return elements.get(id);
  },
  createElement: (t) => makeEl(t),
  querySelector: () => null,
  querySelectorAll: () => [],
  addEventListener: () => {},
  removeEventListener: () => {},
  body: makeEl('body'),
  documentElement: makeEl('html')
};

const errors = [];
const win = {
  console,
  document,
  Math, JSON, Date, Object, Array, String, Number, Boolean, Error,
  Uint8ClampedArray, Uint8Array, Float32Array, Set, Map, Promise, Proxy, Reflect,
  isNaN, parseInt, parseFloat, isFinite,
  setTimeout: (fn) => { try { fn(); } catch (e) { errors.push(e); } return 0; },
  setInterval: () => 0,
  clearTimeout: () => {}, clearInterval: () => {},
  requestAnimationFrame: () => 0,
  cancelAnimationFrame: () => {},
  addEventListener: () => {}, removeEventListener: () => {},
  innerWidth: 1280, innerHeight: 720, devicePixelRatio: 1,
  localStorage: { getItem: () => null, setItem: () => {}, removeItem: () => {} },
  location: { href: 'http://localhost/', search: '', hash: '' },
  navigator: { userAgent: 'node' },
  // Browsers expose these globals; the Node context does not, and the Game
  // constructor touches them during boot.
  performance: { now: () => Date.now() },
  Audio: function () { return { play: () => {}, close: () => {} }; },
  AudioContext: function () { return { createOscillator: () => ({ connect() {}, start() {}, stop() {}, frequency: { value: 0 }, type: '' }), createGain: () => ({ connect() {}, gain: { value: 0 } }), createBuffer: () => ({ getChannelData: () => new Float32Array(1) }), createBufferSource: () => ({ connect() {}, start() {}, stop() {}, buffer: null, loop: false }), destination: {}, currentTime: 0, sampleRate: 44100, resume() {}, state: 'running' }; },
  Image: function () { return { src: '', onload: null, width: 0, height: 0 }; },
  OffscreenCanvas: function () { return { getContext: () => makeCtx(), width: 0, height: 0 }; }
};
win.window = win;
win.self = win;
win.globalThis = win;

const ctxv = vm.createContext(win);

console.log('=== booting ' + label + ' ===');

let loadFail = null;
for (const f of SCRIPTS) {
  const p = path.join(dir, f);
  if (!fs.existsSync(p)) { console.log('  MISSING  ' + f); loadFail = f; break; }
  const code = fs.readFileSync(p, 'utf8');
  try {
    vm.runInContext(code, ctxv, { filename: f });
    console.log('  loaded   ' + f);
  } catch (e) {
    console.log('  THREW    ' + f + '  ->  ' + e.message);
    loadFail = f;
    console.log(e.stack.split('\n').slice(0, 6).map(s => '            ' + s.trim()).join('\n'));
    break;
  }
}

if (loadFail) {
  console.log('\nRESULT: script load/parse failed at ' + loadFail);
  process.exit(1);
}

// Now try the actual boot the page performs.
console.log('\n--- constructing Game (what the page does on load) ---');
try {
  const g = new win.Game();
  console.log('  Game constructed OK');
  console.log('  player.hp      = ' + g.player.hp);
  console.log('  inventory slots= ' + (g.inventory ? g.inventory.length : 'n/a'));
  console.log('  world          = ' + (g.world ? 'built' : 'MISSING'));
  console.log('\nRESULT: boot succeeded.');
} catch (e) {
  console.log('  BOOT THREW: ' + e.message);
  console.log(e.stack.split('\n').slice(0, 12).map(s => '    ' + s.trim()).join('\n'));
  console.log('\nRESULT: boot failed -> black canvas, HUD visible, clicks dead.');
  process.exit(1);
}
