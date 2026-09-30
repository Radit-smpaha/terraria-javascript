// Headless load harness: loads every script tag in terraria.html, in the exact
// order the page uses, inside a stub DOM, and reports which file fails to load
// or evaluate. Mirrors what the browser console shows as
// "X is not defined" / "SyntaxError" during boot.
//
// Usage: node qa-loadcheck.js [dir]
const fs = require('fs');
const vm = require('vm');
const path = require('path');

const dir = process.argv[2] || '.';
const htmlPath = path.join(dir, 'terraria.html');
if (!fs.existsSync(htmlPath)) {
  console.log('MISSING terraria.html in ' + dir);
  process.exit(1);
}

const html = fs.readFileSync(htmlPath, 'utf8');
// Pull the game script tags in document order (ignoring the inline boot
// watchdog) so each file is evaluated in the same order the page uses.
const tags = [...html.matchAll(/<script([^>]*)>([\s\S]*?)<\/script>/gi)];
const srcs = [];
for (const m of tags) {
  const srcMatch = (m[1] || '').match(/src\s*=\s*"([^"]+)"/i);
  if (srcMatch) srcs.push(srcMatch[1].split('?')[0].replace(/^\.\//, ''));
}
if (!srcs.length) {
  console.log('RESULT: no <script src="..."> tags found in ' + htmlPath);
  process.exit(1);
}

// Optional: also check the file the Streamlit embed actually serves, where
// every game script is inlined into one document. A script that loads fine
// here can still die there if inlining corrupts it. Runs after the stub below.
const inlineTarget = process.argv[3] || null;


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

function makeEl(tag) {
  const el = {
    tagName: (tag || 'div').toUpperCase(), style: {}, dataset: {}, children: [],
    _classes: new Set(),
    classList: {
      add: (c) => el._classes.add(c), remove: (c) => el._classes.delete(c),
      contains: (c) => el._classes.has(c),
      toggle: (c) => { el._classes.has(c) ? el._classes.delete(c) : el._classes.add(c); }
    },
    width: 1280, height: 720, clientWidth: 1280, clientHeight: 720,
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

const elements = new Map();
const fakeDocument = {
  getElementById: (id) => { if (!elements.has(id)) elements.set(id, makeEl('div')); return elements.get(id); },
  createElement: (t) => makeEl(t),
  querySelector: () => null, querySelectorAll: () => [],
  addEventListener: () => {}, removeEventListener: () => {},
  body: makeEl('body'), documentElement: makeEl('html')
};

function stubWindow() {
  const win = {
    console, document: fakeDocument, Math, JSON, Date, Object, Array, String, Number, Boolean, Error,
    Uint8ClampedArray, Uint8Array, Float32Array, Set, Map, Promise, Proxy, Reflect,
    isNaN, parseInt, parseFloat, isFinite,
    setTimeout: (fn) => 0, setInterval: () => 0,
    clearTimeout: () => {}, clearInterval: () => {},
    requestAnimationFrame: () => 0, cancelAnimationFrame: () => {},
    addEventListener: () => {}, removeEventListener: () => {},
    innerWidth: 1280, innerHeight: 720, devicePixelRatio: 1,
    localStorage: { getItem: () => null, setItem: () => {}, removeItem: () => {} },
    location: { href: 'http://localhost/', search: '', hash: '' },
    navigator: { userAgent: 'node' },
    performance: { now: () => Date.now() },
    Audio: function () { return { play: () => {}, close: () => {} }; },
    AudioContext: function () {
      return {
        createOscillator: () => ({ connect() {}, start() {}, stop() {}, frequency: { value: 0 }, type: '' }),
        createGain: () => ({ connect() {}, gain: { value: 0 } }),
        createBuffer: () => ({ getChannelData: () => new Float32Array(1) }),
        createBufferSource: () => ({ connect() {}, start() {}, stop() {}, buffer: null, loop: false }),
        destination: {}, currentTime: 0, sampleRate: 44100, resume() {}, state: 'running'
      };
    },
    Image: function () { return { src: '', onload: null, width: 0, height: 0 }; },
    OffscreenCanvas: function () { return { getContext: () => makeCtx(), width: 0, height: 0 }; },
    // The boot watchdog is inlined in the page ahead of the game scripts.
    __terraLoadLog: [],
    __terraNoteScript: () => {},
    __terraShowBootError: () => {}
  };
  win.window = win; win.self = win; win.globalThis = win;
  return win;
}

const win = stubWindow();
const ctxv = vm.createContext(win);

console.log('=== load check: ' + htmlPath + ' ===');
const missing = [];
for (const f of srcs) {
  const p = path.join(dir, f);
  if (!fs.existsSync(p)) { missing.push(f); continue; }
  const code = fs.readFileSync(p, 'utf8');
  try {
    vm.runInContext(code, ctxv, { filename: f });
    console.log('  loaded   ' + f);
  } catch (e) {
    console.log('  THREW    ' + f + '  ->  ' + e.message);
    console.log(e.stack.split('\n').slice(0, 6).map(s => '            ' + s.trim()).join('\n'));
    console.log('\nRESULT: load failed at ' + f);
    process.exit(1);
  }
}

if (missing.length) {
  console.log('  MISSING  ' + missing.join(', '));
  console.log('\nRESULT: terraria.html references file(s) that do not exist.');
  process.exit(1);
}

// The page's own inventory checks (what the boot watchdog prints).
const inspect = [
  'ITEMS', 'TILE_SIZE', 'World', 'WeatherSystem', 'Player', 'Monster',
  'UnderworldMonster', 'GameFeel', 'NPCManager', 'JourneySystem', 'Game'
];
const bad = [];
for (const name of inspect) {
  let t;
  try { t = typeof win[name]; } catch (_) { t = 'undefined'; }
  if (name === 'ITEMS' || name === 'TILE_SIZE') {
    if (t === 'undefined') bad.push(name + '=' + t);
  } else if (t !== 'function') {
    bad.push(name + '=' + t);
  }
}
if (bad.length) {
  console.log('  INVENTORY ' + bad.join(' '));
  console.log('\nRESULT: globals missing after load: ' + bad.join(', '));
  process.exit(1);
}
console.log('\nRESULT: all ' + srcs.length + ' script(s) loaded; required globals present.');

// ---- Optional second pass: check the fully inlined document ---------------
// This is the file the Streamlit embed actually serves (see app.py
// build_inline_html). A script that loads fine from its own <script src> can
// still fail here if inlining corrupts it, and the browser then reports only
// "Player is not defined (about:srcdoc)" with no clue which file died.
if (inlineTarget) {
  const path0 = path.join(dir, inlineTarget);
  if (!fs.existsSync(path0)) {
    console.log('\nRESULT: inline target not found: ' + inlineTarget);
    process.exit(1);
  }
  const doc = fs.readFileSync(path0, 'utf8');
  const blocks = [...doc.matchAll(/<script([^>]*)>([\s\S]*?)<\/script>/gi)];
  console.log('\n=== inline check: ' + inlineTarget + ' (' + blocks.length + ' script blocks) ===');
  const ctxi = vm.createContext(stubWindow());
  let n = 0;
  for (const b of blocks) {
    if (/\bsrc\s*=/i.test(b[1] || '')) continue; // external scripts covered above
    n++;
    const marker = (b[2].match(/^\s*\/\* inlined ([\w.]+) \*\//m) || [])[1] || ('block#' + n);
    try {
      vm.runInContext(b[2], ctxi, { filename: 'inline:' + marker });
      console.log('  loaded   ' + marker);
    } catch (e) {
      console.log('  THREW    ' + marker + '  ->  ' + e.message);
      console.log('            ' + e.stack.split('\n')[1].trim());
      console.log('\nRESULT: inlined block failed at ' + marker);
      process.exit(1);
    }
  }
  console.log('  ' + n + ' inline block(s) evaluated cleanly');
}