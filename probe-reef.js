// Temporary probe: (a) mountain base colors per biome, (b) tiles floating
// above the reef waterline. Run with: node probe-reef.js
const fs = require('fs');
const vm = require('vm');

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
  return {
    id, width: 800, height: 600, textContent: '', innerHTML: '',
    style: {}, dataset: {},
    classList: (() => { const s = new Set(); return { add: c => s.add(c), remove: c => s.delete(c), contains: c => s.has(c), toggle: () => false }; })(),
    getContext: () => makeCtx(),
    addEventListener() {}, removeEventListener() {}, appendChild() {}, removeChild() {},
    querySelector: () => null, querySelectorAll: () => [], closest: () => null,
    remove() {}, parentNode: { removeChild() {} }, setAttribute() {}, getAttribute: () => null,
    className: '', value: ''
  };
}
const els = {};
global.document = {
  readyState: 'complete', scripts: [],
  getElementById: (id) => (els[id] ||= makeEl(id)),
  createElement: () => makeEl('dyn'),
  addEventListener() {}, querySelector: () => null, querySelectorAll: () => [],
  body: makeEl('body')
};
global.window = global;
global.innerWidth = 1280; global.innerHeight = 720;
global.devicePixelRatio = 1;
global.addEventListener = () => {};
global.performance = { now: () => 1000 };
global.requestAnimationFrame = () => 0;
global.localStorage = { getItem: () => null, setItem() {} };

const files = ['audio.js', 'particles.js', 'world.js', 'weather.js', 'entities.js',
  'underworld.js', 'space.js', 'ocean.js', 'juice.js', 'npcs.js', 'journey.js',
  'multiplayer.js', 'terraria.js'];
const ctx = vm.createContext(global);
for (const f of files) vm.runInContext(fs.readFileSync(f, 'utf8'), ctx, { filename: f });

const g = global.game;
const W = g.world;
const TILES = global.TILES;

// ---- (a) mountain colours per biome, camera INSIDE each band --------------
console.log('=== (a) mountain colours per biome (camera in-band) ===');
vm.runInContext('globalThis.game = new Game()', ctx);
const Wa = global.game.world;
const orig = Wa.renderMountainLayer.bind(Wa);
Wa.renderMountainLayer = (c, cam, speed, baseColor, baseY, amp, snowCap, haze) => {
  console.log(`  speed=${speed} base=${String(baseColor).padEnd(18)} snow=${snowCap}`);
  return orig(c, cam, speed, baseColor, baseY, amp, snowCap, haze);
};
Wa.timeOfDay = 0.3;
console.log('TILE_SIZE =', vm.runInContext('TILE_SIZE', ctx));
const palCalls = [];
const origPal = Wa._blendedBiomePalette.bind(Wa);
Wa._blendedBiomePalette = (tileX) => {
  const p = origPal(tileX);
  palCalls.push({ tileX, ridge: p.ridge });
  return p;
};
const seen = new Set();
for (let x = 0; x < Wa.width; x += 4) {
  const biome = Wa.getBiomeAtX(x);
  if (seen.has(biome)) continue;
  seen.add(biome);
  const camera = { x: x * 24, y: 2000, viewportWidth: 1280, viewportHeight: 720 };
  palCalls.length = 0;
  Wa._bgCache = null;
  const target = makeEl('bg');
  target.width = 1280; target.height = 720;
  Wa._renderBackgroundLayer(target, 1280, 720, camera, biome);
  console.log(`-- biome=${biome} x=${x}: palette calls: ` +
    palCalls.map(c => `${c.tileX.toFixed(0)}→${c.ridge}`).join(', '));
}
Wa._blendedBiomePalette = origPal;
delete Wa.renderMountainLayer;

// ---- (b) tiles floating above the reef waterline --------------------------
console.log('\n=== (b) non-air tiles above the reef waterline ===');
vm.runInContext('globalThis.game = new Game()', ctx);
const W2 = global.game.world;
const rb = W2.reefBounds;
if (!rb) { console.log('  NO reefBounds'); process.exit(1); }
const counts = new Map();
const samples = [];
for (let x = rb.left; x < rb.right; x++) {
  for (let y = 1; y < rb.seaY; y++) {
    const t = W2.getTile(x, y);
    if (t === TILES.AIR) continue;
    // background walls don't count as floating parts
    counts.set(t, (counts.get(t) || 0) + 1);
    if (samples.length < 40) {
      const prop = (global.TILE_PROPERTIES || {})[t];
      samples.push(`x=${x} y=${y} tile=${t} (${prop && prop.name ? prop.name : 'unknown'})`);
    }
  }
}
if (!counts.size) console.log('  clean: no tiles above waterline');
for (const [t, n] of [...counts.entries()].sort((a, b) => b[1] - a[1])) {
  const prop = (global.TILE_PROPERTIES || {})[t];
  console.log(`  tile ${t} (${prop && prop.name ? prop.name : '?'}): ${n}`);
}
console.log('  samples:');
for (const s of samples) console.log('    ' + s);

// ---- (c) biome of every reef column + what backdrop decides ---------------
console.log('\n=== (c) backdrop decision across the reef/snow border ===');
const rbRight = rb.right;
for (const wx of [rbRight - 6, rbRight - 1, rbRight, rbRight + 6]) {
  const biome = W2.getBiomeAtX(wx);
  const isReef = W2.isReefAtX(wx);
  console.log(`  x=${wx} biome=${biome} isReefAtX=${isReef}`);
}

// ---- (d) coral size distribution ------------------------------------------
console.log('\n=== (d) coral column heights (short coral check) ===');
const coralDist = new Map();
let tallCols = 0;
let tallest = 0;
for (let x = rb.left; x < rb.mainRight; x++) {
  let coralRun = 0, colMax = 0, tallRun = 0, tallMax = 0;
  for (let y = rb.seaY; y < W2.surfaceHeights[x]; y++) {
    const t = W2.getTile(x, y);
    if (t === TILES.CORAL) { coralRun++; colMax = Math.max(colMax, coralRun); }
    else coralRun = 0;
    if (t === TILES.TALL_CORAL) { tallRun++; tallMax = Math.max(tallMax, tallRun); }
    else tallRun = 0;
  }
  if (colMax) coralDist.set(colMax, (coralDist.get(colMax) || 0) + 1);
  if (tallMax) { tallCols++; tallest = Math.max(tallest, tallMax); }
}
for (const h of [...coralDist.keys()].sort((a, b) => a - b)) {
  console.log(`  regular coral height ${h}: ${coralDist.get(h)} columns`);
}
console.log(`  tall coral: ${tallCols} columns, tallest=${tallest}`);
const shortCols = [...coralDist.entries()].filter(([h]) => h <= 4).reduce((n, [, c]) => n + c, 0);
console.log(`  short (<=4 tile) columns: ${shortCols} ${shortCols > 0 ? 'OK' : 'FAIL: no short coral'}`);
