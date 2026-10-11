// Verify the weather batching: with N live particles the front layer must
// issue far fewer than N stroke/fill calls (8 alpha buckets max each), and
// produce no more gradients than the single one-time fog sprite bake.
const fs = require('fs');
const vm = require('vm');
function makeCtx(stats) {
  return new Proxy({}, {
    get(t, p) {
      if (p === 'canvas') return {};
      if (p === 'createRadialGradient' || p === 'createLinearGradient')
        return (...a) => { stats.gradients++; return { addColorStop() {} }; };
      if (p === 'getImageData') return () => ({ data: new Uint8ClampedArray(4) });
      if (typeof p === 'string') return (...a) => { stats[p] = (stats[p] || 0) + 1; };
      return undefined;
    },
    set(t, p, v) {
      // Count style PROPERTY assignments: parsing an rgba() string is the
      // per-particle cost batching exists to remove.
      if (p === 'fillStyle' || p === 'strokeStyle') stats.styleSets = (stats.styleSets || 0) + 1;
      return true;
    }
  });
}
function makeEl(id) {
  const el = {
    id, width: 800, height: 600, stats: { gradients: 0, stroke: 0, fill: 0, fillRect: 0, drawImage: 0, styleSets: 0 },
    style: {}, dataset: {},
    classList: { add() {}, remove() {}, contains: () => false, toggle() {} },
    getContext: () => makeCtx(el.stats),
    addEventListener() {}, removeEventListener() {}, appendChild() {},
    querySelector: () => null, querySelectorAll: () => [], closest: () => null,
    remove() {}, parentNode: { removeChild() {} },
    setAttribute() {}, getAttribute: () => null, className: '', value: '', textContent: '', innerHTML: '',
  };
  return el;
}
const els = {};
global.document = { readyState: 'complete', scripts: [], getElementById: (id) => (els[id] ||= makeEl(id)), createElement: () => makeEl('anon'), addEventListener() {}, querySelector: () => null, querySelectorAll: () => [], body: makeEl('body') };
global.window = global; global.innerWidth = 1280; global.innerHeight = 720;
global.devicePixelRatio = 1; global.addEventListener = () => {};
global.performance = { now: () => Date.now() };
global.requestAnimationFrame = () => 0;
global.localStorage = { getItem: () => null, setItem() {}, removeItem() {} };
const ctx = vm.createContext(global);
for (const f of ['audio.js', 'particles.js', 'world.js', 'weather.js', 'entities.js',
  'underworld.js', 'space.js', 'ocean.js', 'juice.js', 'npcs.js', 'journey.js', 'multiplayer.js', 'terraria.js'])
  vm.runInContext(fs.readFileSync(f, 'utf8'), ctx, { filename: f });

const W = global.WeatherSystem;
const game = { camera: { x: 0, y: 0, viewportWidth: 1280, viewportHeight: 720 }, particleScale: 1, showToast() {} };
const weather = new W(null);
let fails = 0;
for (const [type, kind] of [['RAIN', 'rain'], ['SNOW', 'snow'], ['SAND', 'sand'], ['FOG', 'fog']]) {
  weather.type = global.WEATHER_TYPES[type];
  weather.intensity = 1; weather.targetIntensity = 1;
  weather.particles.length = 0;
  for (let i = 0; i < 200; i++) {
    weather.particles.push({ kind, x: Math.random() * 1280, y: Math.random() * 720,
      vx: 40 + Math.random() * 60, vy: 300, len: 14, size: 6 + Math.random() * 30,
      life: Math.random() * 3, windFactor: 1 });
  }
  const target = makeEl('t'); target.width = 1280; target.height = 720;
  const c = makeCtx(target.stats);
  weather.render(game, c, game.camera, 'front');
  const calls = (target.stats.stroke || 0) + (target.stats.fill || 0) + (target.stats.fillRect || 0) + (target.stats.drawImage || 0);
  const grads = target.stats.gradients;
  const styleSets = target.stats.styleSets || 0;
  // Budgets per kind against 200 live particles:
  //   rain/sand -> batched into <=16 strokes (8 alpha buckets each);
  //   snow      -> rects stay per-particle, but style strings drop to <=8;
  //   fog       -> sprite blits, zero gradients (was 200 gradients).
  const budget = (kind === 'rain' || kind === 'sand') ? calls <= 16 : true;
  const ok = grads === 0 && styleSets <= 10 && budget;
  if (!ok) fails++;
  console.log(`${type.padEnd(5)} particles=200 draw-calls=${calls} styleSets=${styleSets} gradients=${grads} ${ok ? 'OK' : 'FAIL'}`);
}
console.log(fails === 0 ? 'WEATHER BATCHING PASSED' : `WEATHER BATCHING FAILED: ${fails}`);
process.exit(fails === 0 ? 0 : 1);
