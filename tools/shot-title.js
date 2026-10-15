// shot-title.js — renders the real title-scene canvas through mini-canvas so
// the main-menu background can be reviewed without a browser. We boot the game,
// build the title screen, then pump its rAF loop by hand with a controllable
// clock so we can pick the time of day.
//   usage: python -m nodejs tools/shot-title.js [phase]
//     phase: 0..1 position in the 104s day cycle (default 0.32 = golden hour)
'use strict';
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const mini = require('./mini-canvas.js');

const ROOT = path.join(__dirname, '..');
process.chdir(ROOT);
const PHASE = Number(process.argv[2] || 0.32);
const DAY_MS = 104000;

function makeEl(id) {
  const el = {
    id, width: 960, height: 540, textContent: '', innerHTML: '',
    style: {}, dataset: {}, offsetHeight: 100,
    classList: (() => { const s = new Set(); return { add: c => s.add(c), remove: c => s.delete(c), contains: c => s.has(c), toggle: () => false }; })(),
    addEventListener() {}, removeEventListener() {}, appendChild() {},
    querySelector: () => null, querySelectorAll: () => [], closest() { return null; },
    remove() {}, parentNode: { removeChild() {} },
    setAttribute() {}, getAttribute: () => null,
    className: '', value: ''
  };
  let ctx = null;
  el.getContext = () => {
    if (!ctx) ctx = mini.createCtx(el.width, el.height, 1);
    return ctx;
  };
  return el;
}
const els = {};
global.document = {
  readyState: 'complete', scripts: [],
  getElementById: (id) => els[id] || (els[id] = makeEl(id)),
  createElement: (t) => makeEl(t),
  addEventListener() {}, removeEventListener() {},
  querySelector: () => null, querySelectorAll: () => [],
  body: makeEl('body'), documentElement: makeEl('html')
};
global.window = global;
global.innerWidth = 1280; global.innerHeight = 720; global.devicePixelRatio = 1;
global.addEventListener = () => {};

// Capture the loop's callback instead of running it immediately.
const rafQueue = [];
global.requestAnimationFrame = (cb) => { rafQueue.push(cb); return rafQueue.length; };
global.cancelAnimationFrame = () => {};
let NOW = 1000;
global.performance = { now: () => NOW };
global.localStorage = { getItem: () => null, setItem() {}, removeItem() {} };

const files = ['audio.js', 'particles.js', 'world.js', 'weather.js', 'entities.js',
  'underworld.js', 'space.js', 'ocean.js', 'juice.js', 'npcs.js', 'journey.js', 'multiplayer.js', 'terraria.js'];
const ctx = vm.createContext(global);
for (const f of files) {
  try { vm.runInContext(fs.readFileSync(f, 'utf8'), ctx, { filename: f }); }
  catch (e) { console.log('EVAL FAIL ' + f + ': ' + e.message); process.exit(1); }
}
const g = global.game;

const scene = els['title-scene'];
scene.width = 960; scene.height = 540;
g.initTitleScreen();

NOW = 1000 + DAY_MS * PHASE;
for (let i = 0; i < 40; i++) {
  const cb = rafQueue.shift();
  if (!cb) break;
  NOW += 16;
  cb(NOW);
}
const c = scene.getContext('2d');
const out = process.argv[3] || 'title-scene';
mini.writePNG(c, 'tools/shots/' + out + '.png');
console.log('wrote tools/shots/' + out + '.png');
