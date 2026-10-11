// qa-worldgen-shape.js - a new world must have a living spawn area and ore a
// new player can actually reach.
//
// Two complaints drove this:
//   1. "the spawn and the terrain around it is just flat" - the spawn sat on a
//      57-tile pancake of dead-level ground.
//   2. "little to no ores on the surface" - every interesting tile was hidden
//      behind six solid rows of dirt and only started at depth 15+.
//
// This generates several worlds and asserts on the SHAPE of the result:
// relief around spawn, and the amount of ore within the first ~20 tiles below
// the surface, which is the band a new player actually digs through.
//
// Usage: node qa-worldgen-shape.js
const fs = require('fs');
const vm = require('vm');

let failures = 0;
const check = (label, ok, detail = '') => {
  if (!ok) failures++;
  console.log((ok ? '  PASS ' : '  FAIL ') + label + (!ok && detail ? '  - ' + detail : ''));
};

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
function makeEl(id) {
  return {
    id, width: 800, height: 600, textContent: '', innerHTML: '',
    style: {}, dataset: {}, offsetHeight: 100,
    classList: (() => {
      const s = new Set();
      return { add: (c) => s.add(c), remove: (c) => s.delete(c), contains: (c) => s.has(c), toggle() {} };
    })(),
    getContext: () => makeCtx(),
    addEventListener() {}, removeEventListener() {},
    appendChild() {}, querySelector: () => null, querySelectorAll: () => [],
    closest: () => null, remove() {}, parentNode: { removeChild() {} },
    setAttribute() {}, getAttribute: () => null, className: '', value: ''
  };
}
const els = {};
global.document = {
  readyState: 'complete', scripts: [],
  getElementById: (id) => (els[id] ||= makeEl(id)),
  createElement: (tag) => makeEl(tag),
  addEventListener() {}, removeEventListener() {},
  querySelector: () => null, querySelectorAll: () => [],
  body: makeEl('body')
};
global.window = global;
global.innerWidth = 1280; global.innerHeight = 720; global.devicePixelRatio = 1;
global.addEventListener = () => {};
global.performance = { now: () => 1000 };
global.requestAnimationFrame = () => 0;
global.cancelAnimationFrame = () => {};
global.localStorage = { getItem: () => null, setItem() {}, removeItem() {} };

const files = ['audio.js', 'particles.js', 'world.js', 'weather.js', 'entities.js',
  'underworld.js', 'space.js', 'ocean.js', 'juice.js', 'npcs.js', 'journey.js', 'multiplayer.js', 'terraria.js'];
const ctx = vm.createContext(global);
for (const f of files) {
  try { vm.runInContext(fs.readFileSync(f, 'utf8'), ctx, { filename: f }); }
  catch (e) { console.log('EVAL FAIL ' + f + ': ' + (e.stack || e.message)); process.exit(1); }
}
const { World, TILES, TILE_SIZE } = global;

// Which tiles count as "ore" a player would care about.
const ORE = new Set([
  TILES.IRON_ORE, TILES.GOLD_ORE, TILES.DIAMOND_ORE, TILES.CRYSTAL,
  TILES.RAINBOW_ORE, TILES.HELLSTONE, TILES.OBSIDIAN,
].filter((v) => v !== undefined && v !== null));

const TRIALS = 5;
let reliefMin = Infinity, reliefSum = 0, nearOreMin = Infinity, nearOreSum = 0;
let outcropWorlds = 0;

for (let trial = 0; trial < TRIALS; trial++) {
  // A fresh seed each trial: terrainPhase reads the world seed.
  const seed = 1000 + trial * 733;
  let w;
  // World(width, height, seed)
  try { w = new World(300, 140, seed); } catch (e) { console.log('World ctor failed: ' + e.message); process.exit(1); }
  if (!w.tiles || !w.surfaceHeights) { console.log('world shape unexpected'); process.exit(1); }

  const cx = Math.floor(w.width / 2);

  // --- Relief around spawn: how much does the ground move over ±40 tiles? ---
  let lo = Infinity, hi = -Infinity;
  for (let x = Math.max(1, cx - 40); x <= Math.min(w.width - 2, cx + 40); x++) {
    const h = w.surfaceHeights[x];
    if (h < lo) lo = h;
    if (h > hi) hi = h;
  }
  const relief = hi - lo;
  reliefMin = Math.min(reliefMin, relief);
  reliefSum += relief;

  // --- Ore in the reachable band: rows 2..20 below the surface, ±80 tiles ---
  let nearOre = 0, outcrops = 0;
  for (let x = Math.max(1, cx - 80); x <= Math.min(w.width - 2, cx + 80); x++) {
    const surf = w.surfaceHeights[x];
    for (let d = 2; d <= 20; d++) {
      const t = w.tiles[(surf + d) * w.width + x];
      if (ORE.has(t)) nearOre++;
    }
    // An outcrop: ore in the first three rows under the surface cap.
    for (let d = 1; d <= 3; d++) {
      if (ORE.has(w.tiles[(surf + d) * w.width + x])) { outcrops++; break; }
    }
  }
  if (outcrops > 0) outcropWorlds++;
  nearOreMin = Math.min(nearOreMin, nearOre);
  nearOreSum += nearOre;

  console.log('  world seed ' + seed + ': relief=' + relief + ' tiles, near-surface ore=' +
    nearOre + ', outcrop columns=' + outcrops +
    ', spawn=' + w.surfaceHeights[cx]);
}

const avgRelief = reliefSum / TRIALS;
const avgOre = nearOreSum / TRIALS;
console.log('\n  averages over ' + TRIALS + ' worlds: relief=' + avgRelief.toFixed(1) +
  ' tiles, near-surface ore=' + avgOre.toFixed(1) + ' tiles\n');

check('spawn area is no longer a flat pancake (relief >= 3 tiles)', avgRelief >= 3,
  'avg relief ' + avgRelief.toFixed(1));
check('every sampled world has real relief around spawn', reliefMin >= 2,
  'worst world ' + reliefMin);
check('near-surface ore is plentiful (>= 40 tiles in the reachable band)', avgOre >= 40,
  'avg ' + avgOre.toFixed(1));
check('every sampled world has near-surface ore', nearOreMin >= 12, 'worst ' + nearOreMin);
check('surface outcrops exist in every world', outcropWorlds === TRIALS,
  outcropWorlds + '/' + TRIALS + ' worlds');

console.log(failures ? '\nFAILING CHECKS: ' + failures : '\nWORLD GEN SHAPE OK');
process.exit(failures ? 1 : 0);
