// qa-fps-speed.js - the game must run at the same speed on any refresh rate.
//
// Every movement constant here is a PER-FRAME amount tuned for 60Hz (gravity
// 0.38, speed 4.2, accel 0.6). The loop used to call update(realDt) once per
// rAF, so a 144Hz monitor integrated the physics 2.4x more often per second and
// literally moved, fell and attacked faster. That is the bug this pins down:
// walk a fixed wall-clock span at 30/60/144 FPS and require the ground covered
// to land within a few percent, because the simulation now runs on a fixed
// 1/60s step regardless of how often the browser paints.
//
// Usage: node qa-fps-speed.js
const fs = require('fs');
const vm = require('vm');
const path = require('path');

let failures = 0;
function check(name, ok, detail) {
  console.log((ok ? '  ok   ' : '  FAIL ') + name + (detail ? '  [' + detail + ']' : ''));
  if (!ok) failures += 1;
}

// ---- Minimal DOM stub -----------------------------------------------------
function makeCtx() {
  const noop = () => {};
  const transform = { a: 1, d: 1 };
  return new Proxy({
    canvas: { width: 1280, height: 720 },
    measureText: () => ({ width: 10 }),
    createLinearGradient: () => ({ addColorStop: noop }),
    createRadialGradient: () => ({ addColorStop: noop }),
    createPattern: () => null,
    getImageData: () => ({ data: new Uint8ClampedArray(4) }),
    setTransform(a, b, c, d) {
      if (a && typeof a === 'object') {
        transform.a = a.a;
        transform.d = a.d;
      } else {
        transform.a = a;
        transform.d = d;
      }
    },
    getTransform: () => ({ a: transform.a, d: transform.d }),
    save: noop, restore: noop
  }, {
    get: (t, k) => (k in t ? t[k] : noop),
    set: (t, k, v) => { t[k] = v; return true; }
  });
}
function makeEl() {
  const el = {
    style: {}, dataset: {}, children: [], _classes: new Set(),
    classList: {
      add: (c) => el._classes.add(c),
      remove: (c) => el._classes.delete(c),
      contains: (c) => el._classes.has(c),
      toggle: (c, f) => { const w = f === undefined ? !el._classes.has(c) : !!f; w ? el._classes.add(c) : el._classes.delete(c); }
    },
    width: 1280, height: 720, clientWidth: 1280, clientHeight: 720,
    innerHTML: '', textContent: '', value: '', hidden: false, disabled: false,
    appendChild(c) { el.children.push(c); return c; },
    removeChild(c) { return c; }, remove() {},
    setAttribute() {}, getAttribute: () => null, removeAttribute() {},
    addEventListener() {}, removeEventListener() {},
    querySelector: () => null, querySelectorAll: () => [],
    getBoundingClientRect: () => ({ left: 0, top: 0, width: 1280, height: 720, right: 1280, bottom: 720 }),
    focus() {}, blur() {}, click() {}, scrollIntoView() {},
    getContext: () => makeCtx()
  };
  return el;
}

const els = new Map();
const rafQueue = [];
let nowStamp = 0;
const win = {
  console, Math, JSON, Date, Object, Array, String, Number, Boolean, Error,
  Uint8ClampedArray, Uint8Array, Float32Array, Set, Map, WeakMap, Promise, Proxy, Reflect,
  isNaN, parseInt, parseFloat, isFinite, Infinity, NaN,
  document: {
    readyState: 'complete',
    getElementById: (id) => { if (!els.has(id)) els.set(id, makeEl()); return els.get(id); },
    createElement: () => makeEl(),
    querySelector: () => null, querySelectorAll: () => [],
    addEventListener() {}, removeEventListener() {},
    body: makeEl(), documentElement: makeEl()
  },
  localStorage: { getItem: () => null, setItem() {}, removeItem() {} },
  requestAnimationFrame: (fn) => { rafQueue.push(fn); return rafQueue.length; },
  cancelAnimationFrame() {},
  addEventListener() {}, removeEventListener() {},
  innerWidth: 1280, innerHeight: 720, devicePixelRatio: 1,
  location: { href: 'http://localhost/', search: '', hash: '' },
  navigator: { userAgent: 'node' },
  performance: { now: () => nowStamp },
  setTimeout: (fn) => { try { fn(); } catch (_) {} return 0; },
  setInterval: () => 0, clearTimeout() {}, clearInterval() {}
};
win.window = win; win.self = win; win.globalThis = win;

const SCRIPTS = [
  'audio.js', 'particles.js', 'world.js', 'weather.js', 'entities.js',
  'underworld.js', 'space.js', 'ocean.js', 'juice.js', 'npcs.js', 'journey.js', 'multiplayer.js', 'terraria.js'
];
const ctx = vm.createContext(win);
for (const f of SCRIPTS) vm.runInContext(fs.readFileSync(path.join('.', f), 'utf8'), ctx, { filename: f });

const g = win.game;
check('game booted for the speed probe', !!g);
if (!g) process.exit(1);

// Freeze everything that could add noise: no monsters, no weather, no death.
g.paused = false;
g.titleScreenOpen = false;
g.monsters.length = 0;
g.boss = null;
g.weather.setWeather(win.WEATHER_TYPES.CLEAR, 0, 'CLEAR', g);
g.player.hp = g.player.maxHp = 100000;   // survive the flat walk

// A flat runway with no walls so velocity is the only thing being measured.
const startTileY = 12;
for (let x = 2; x < 200; x++) {
  for (let y = 0; y < startTileY - 1; y++) g.world.setTile(x, y, win.TILES.AIR);
  g.world.setTile(x, startTileY, win.TILES.STONE);
  g.world.setTile(x, startTileY + 1, win.TILES.STONE);
}

// Walk right for one second of wall-clock time at a given refresh rate.
// `loop()` is driven exactly as rAF would drive it: once per frame, with the
// frame's timestamp, over a fixed 1000ms span.
function walkForOneSecond(fps) {
  g.player.x = 3 * win.TILE_SIZE;
  g.player.y = (startTileY - 2) * win.TILE_SIZE;
  g.player.vx = 0; g.player.vy = 0;
  g.player.onGround = true;
  g._stepAccum = 0;
  g.input.keys = { KeyD: true };
  g.input.mouseDown = false;
  const frames = fps;
  const startTime = 100000 + fps; // fresh window each run
  g.lastTime = startTime;
  nowStamp = startTime;
  // Seed the queue with the real loop; each run drives exactly `fps` frames.
  rafQueue.length = 0;
  rafQueue.push((t) => g.loop(t));
  for (let i = 1; i <= frames; i++) {
    const t = startTime + (i * 1000) / fps;
    nowStamp = t;
    const fn = rafQueue.shift();
    if (!fn) break;
    fn(t);
  }
  rafQueue.length = 0;
  const walked = g.player.x - 3 * win.TILE_SIZE;
  g.input.keys = {};
  return walked;
}

const w30 = walkForOneSecond(30);
const w60 = walkForOneSecond(60);
const w144 = walkForOneSecond(144);
const w240 = walkForOneSecond(240);
console.log('  walked in 1s: 30fps=' + w30.toFixed(1) + 'px  60fps=' + w60.toFixed(1) +
  'px  144fps=' + w144.toFixed(1) + 'px  240fps=' + w240.toFixed(1) + 'px');

check('a full second of walking covers real ground', w60 > 30, w60.toFixed(1) + 'px at 60fps');
// Within 12% across the whole range - the fixed step makes these identical up
// to the sub-step remainder each loop carries.
const spread = Math.max(w30, w60, w144, w240) - Math.min(w30, w60, w144, w240);
const rel = spread / Math.max(1, w60);
check('walk speed does not depend on refresh rate', rel < 0.12,
  'spread=' + rel.toFixed(3) + ' of the 60fps distance');

// A 144Hz machine must not cover the ground far faster than a 60Hz one (the
// old bug made it ~2.4x). Guard the specific regression directly.
check('144fps is not the old 2.4x speed-up', w144 < w60 * 1.4,
  '144/60 = ' + (w144 / Math.max(1, w60)).toFixed(2) + 'x');

// Reduced render resolution must not shrink the camera viewport or leave the
// scene drawn at full resolution into a smaller buffer (the old visual zoom).
const originalQuality = g.settings.quality;
const viewport = [g.camera.viewportWidth, g.camera.viewportHeight];
let renderScaleOk = true;
for (const mode of ['high', 'balanced', 'low']) {
  g.applyQualityMode(mode, false);
  g.render();
  const scale = g.renderScale;
  const transform = g.pixelCtx.getTransform();
  renderScaleOk = renderScaleOk &&
    g.camera.viewportWidth === viewport[0] &&
    g.camera.viewportHeight === viewport[1] &&
    g.pixelCanvas.width === Math.floor(viewport[0] * scale) &&
    g.pixelCanvas.height === Math.floor(viewport[1] * scale) &&
    Math.abs(transform.a - scale) < 0.01 &&
    Math.abs(transform.d - scale) < 0.01;
}
g.applyQualityMode(originalQuality, false);
check('lower render quality keeps the same camera view without zooming', renderScaleOk);

console.log(failures ? 'FAILING CHECKS: ' + failures : 'FPS-INDEPENDENCE OK');
process.exit(failures ? 1 : 0);
