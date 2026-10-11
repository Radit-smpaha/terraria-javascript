// Smoke-test the redesigned backdrop: paint the background layer for every
// biome at several times of day with a recording canvas context, and assert
// that (a) nothing throws, (b) the expected painter calls actually happen
// (smooth curves, gradients, fog), and (c) repaint cost stays sane — the whole
// backdrop lives in a cache, so a repaint must stay well under a frame budget.
const fs = require('fs');
const vm = require('vm');

function makeCtx(stats) {
  return new Proxy({}, {
    get(t, p) {
      if (p === 'canvas') return {};
      if (p === 'createRadialGradient' || p === 'createLinearGradient') {
        return (...a) => { stats.gradients++; return { addColorStop() {} }; };
      }
      if (p === 'getImageData') return () => ({ data: new Uint8ClampedArray(4) });
      if (p === 'measureText') return () => ({ width: 10 });
      if (typeof p === 'string') {
        return (...a) => {
          if (p === 'quadraticCurveTo') stats.curves++;
          if (p === 'fill' || p === 'stroke') stats[p === 'fill' ? 'fills' : 'strokes']++;
          if (p === 'drawImage') stats.drawImage++;
        };
      }
      return undefined;
    },
    set() { return true; }
  });
}
function makeEl(id) {
  const ctxStats = { gradients: 0, curves: 0, fills: 0, strokes: 0, drawImage: 0 };
  const el = {
    id, width: 800, height: 600, textContent: '', innerHTML: '',
    style: {}, dataset: {}, ctxStats,
    classList: { add() {}, remove() {}, contains: () => false, toggle() {} },
    getContext: () => makeCtx(el.ctxStats),
    addEventListener() {}, removeEventListener() {}, appendChild() {},
    querySelector: () => null, querySelectorAll: () => [], closest: () => null,
    remove() {}, parentNode: { removeChild() {} },
    setAttribute() {}, getAttribute: () => null, className: '', value: '',
  };
  return el;
}
const els = {};
global.document = {
  readyState: 'complete',
  scripts: [],
  getElementById: (id) => (els[id] ||= makeEl(id)),
  createElement: () => makeEl('anon'),
  addEventListener() {},
  querySelector: () => null,
  querySelectorAll: () => [],
  body: makeEl('body'),
};
global.window = global;
global.innerWidth = 1280; global.innerHeight = 720;
global.devicePixelRatio = 1;
global.addEventListener = () => {};
global.performance = { now: () => Date.now() };
global.requestAnimationFrame = () => 0;
global.localStorage = { getItem: () => null, setItem() {}, removeItem() {} };

const files = ['audio.js', 'particles.js', 'world.js', 'weather.js', 'entities.js',
  'underworld.js', 'space.js', 'ocean.js', 'juice.js', 'npcs.js', 'journey.js', 'multiplayer.js', 'terraria.js'];
const ctx = vm.createContext(global);
for (const f of files) {
  vm.runInContext(fs.readFileSync(f, 'utf8'), ctx, { filename: f });
}

const world = new global.World(600, 140, 1);
// Surface biome overrides so every palette is exercised regardless of seed.
const biomes = ['forest', 'plains', 'snow', 'savanna', 'swamp'];
const times = [0.05, 0.25, 0.5, 0.72, 0.95];
const camera = {
  x: 4000, y: 2000, viewportWidth: 1280, viewportHeight: 720
};

let fails = 0;
let worstMs = 0;
for (const biome of biomes) {
  world.getBiomeAtX = () => biome;
  for (const tod of times) {
    world.timeOfDay = tod;
    world._bgCache = null;
    world._bgFadeStart = 0;
    const target = makeEl('bg');
    target.width = 1280; target.height = 720;
    const t0 = process.hrtime.bigint();
    let ok = true, err = '';
    try {
      world._renderBackgroundLayer(target, 1280, 720, camera, biome);
    } catch (e) { ok = false; err = (e.stack || e.message).split('\n')[0]; }
    const ms = Number(process.hrtime.bigint() - t0) / 1e6;
    if (ms > worstMs) worstMs = ms;
    const s = target.ctxStats;
    // A real paint must trace curves (smoothed crests) and build gradients
    // (sky, haze band, fog). A flat fill would mean the redesign silently
    // didn't run.
    if (ok && s.curves < 50) { ok = false; err = `only ${s.curves} curve calls`; }
    if (ok && s.gradients < 3) { ok = false; err = `only ${s.gradients} gradients`; }
    if (!ok) fails++;
    console.log(`${biome.padEnd(8)} tod=${tod.toFixed(2)} ${ok ? 'PAINT OK ' : 'FAIL '} ` +
      `${ms.toFixed(1)}ms curves=${s.curves} grad=${s.gradients} fills=${s.fills}${err ? ' ' + err : ''}`);
  }
}
// Exercise the cache/swap path end to end: routine time/camera changes repaint
// without repeatedly restarting a cross-fade, which caused the backdrop to
// remain translucent and blink while walking.
world.getBiomeAtX = () => 'forest';
world.timeOfDay = 0.3;
world._bgCache = null; world._bgCanvas = null; world._bgPrev = null; world._bgFadeStart = 0;
const main = makeEl('main'); main.width = 1280; main.height = 720;
let swapOk = true, swapErr = '';
try {
  for (let i = 0; i < 40; i++) {
    camera.x = 4000 + i * 7; // a key change every frame, like real walking
    world.timeOfDay = 0.3 + i * 0.0005;
    world.renderForestBackground(main.getContext('2d'), camera);
  }
  if (!world._bgCache || !world._bgCanvas || world._bgCanvas.width !== 1280) {
    swapOk = false; swapErr = 'cache/canvas not established';
  }
  if (world._bgFadeStart) { swapOk = false; swapErr = 'routine cache changes restarted a cross-fade'; }
} catch (e) {
  swapOk = false; swapErr = (e.stack || e.message).split('\n').slice(0, 6).join(' | ');
}
if (!swapOk) fails++;
console.log(`\ncache swap walking loop: ${swapOk ? 'OK' : 'FAIL ' + swapErr}`);
world.getBiomeAtX = () => 'snow';
try {
  world.renderForestBackground(main.getContext('2d'), camera);
  if (!world._bgFadeStart) {
    swapOk = false;
    console.log('biome transition: FAIL cross-fade did not start');
    fails++;
  } else {
    console.log('biome transition: OK cross-fade started');
  }
} catch (e) {
  swapOk = false;
  console.log('biome transition: FAIL ' + ((e.stack || e.message).split('\n')[0]));
  fails++;
}

console.log(`worst single repaint: ${worstMs.toFixed(2)}ms`);
if (worstMs > 16) { console.log('FAIL: a repaint exceeds one 60fps frame budget'); fails++; }
console.log(fails === 0 ? 'BG SMOKE PASSED' : `BG SMOKE FAILED: ${fails}`);
process.exit(fails === 0 ? 0 : 1);
