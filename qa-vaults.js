// ══════════════════════════════════════════════════════════════════════════
// Functional QA for buried vaults (node qa-vaults.js)
//
// A vault is a promise: dig far enough down, anywhere in the world, and you
// will break into a sealed brick room with a chest and a torch in it. This
// suite boots the real game and asserts that promise on the real generated
// world, not on a mock:
//   1. every world buries 3-5 of them, inside the map
//   2. each one is a real room — brick shell, air inside, brick backing,
//      chest and torch on the floor, buried well below the surface
//   3. the layout is seed-stable: the same seed always buries the same vaults
// ══════════════════════════════════════════════════════════════════════════
const fs = require('fs');
const vm = require('vm');

let failures = 0;
const check = (label, ok, detail = '') => {
  if (!ok) failures++;
  console.log((ok ? '  PASS ' : '  FAIL ') + label + (!ok && detail ? ' — ' + detail : ''));
};
const step = (title) => console.log('\n▸ ' + title);
const info = (label) => console.log('    · ' + label);

function makeEl(id) {
  return {
    id, width: 800, height: 600, textContent: '', innerHTML: '', style: {}, dataset: {},
    classList: (() => {
      const set = new Set();
      return { add: (c) => set.add(c), remove: (c) => set.delete(c), contains: (c) => set.has(c), toggle: () => false };
    })(),
    getContext: () => new Proxy({}, {
      get(t, p) {
        if (p === 'canvas') return {};
        if (p === 'createRadialGradient' || p === 'createLinearGradient') return () => ({ addColorStop() {} });
        if (p === 'getImageData') return () => ({ data: new Uint8ClampedArray(4) });
        if (p === 'measureText') return () => ({ width: 10 });
        if (typeof p === 'string') return () => undefined;
        return undefined;
      },
      set() { return true; }
    }),
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
  removeItem: (k) => store.delete(k),
  clear: () => store.clear()
};

const files = ['audio.js', 'particles.js', 'world.js', 'weather.js', 'entities.js',
  'underworld.js', 'space.js', 'juice.js', 'npcs.js', 'journey.js', 'terraria.js'];
const ctx = vm.createContext(global);
for (const f of files) {
  try {
    vm.runInContext(fs.readFileSync(f, 'utf8'), ctx, { filename: f });
  } catch (e) {
    console.log('EVAL FAIL ' + f + ': ' + (e.stack || e.message));
    process.exit(1);
  }
}
const g = global.game;
const { TILES } = global;
const WorldRef = global.World || vm.runInContext('World', ctx);
if (!g) { console.log('BOOT FAIL: no game'); process.exit(1); }
g.titleScreenOpen = false;
g.paused = false;
const W = g.world;

// ══════════════════════════════════════════════════════════════════════════
step('1. The world buries 3-5 vaults, and the landmarks are honest');
const vaults = W.landmarks.filter((l) => l.type === 'vault');
check('3 to 5 vaults exist', vaults.length >= 3 && vaults.length <= 5, vaults.length + ' vaults');
check('every vault landmark is inside the map',
  vaults.every((l) => l.x - 4 >= 0 && l.x + 4 < W.width && l.y - 4 >= 0 && l.y + 2 < W.height),
  vaults.map((l) => l.x + ',' + l.y).join(' | '));
info(vaults.map((l) => '(' + l.x + ',' + l.y + ')').join(' '));

// The landmark stores the room's middle row as y, so the floor row is y + 2.
const floorYOf = (l) => l.y + 2;

// ══════════════════════════════════════════════════════════════════════════
step('2. Each vault is a real sealed brick room, not a label');
const shellTiles = (l) => {
  const tiles = [];
  for (let dx = -4; dx <= 4; dx++) {
    tiles.push([l.x + dx, floorYOf(l) - 4], [l.x + dx, floorYOf(l)]);
  }
  for (let y = floorYOf(l) - 3; y <= floorYOf(l) - 1; y++) {
    tiles.push([l.x - 4, y], [l.x + 4, y]);
  }
  return tiles;
};
check('the floor and ceiling rows are solid stone brick',
  vaults.every((l) => shellTiles(l).every(([x, y]) => W.getTile(x, y) === TILES.STONE_BRICK)));
check('the room is sealed — every shell tile is solid',
  vaults.every((l) => shellTiles(l).every(([x, y]) => W.isSolid(x, y))));

const insideTiles = (l) => {
  const tiles = [];
  for (let y = floorYOf(l) - 3; y <= floorYOf(l) - 1; y++) {
    for (let dx = -3; dx <= 3; dx++) {
      if (y === floorYOf(l) - 1 && (dx === 0 || dx === -3)) continue; // chest + torch
      tiles.push([l.x + dx, y]);
    }
  }
  return tiles;
};
check('the room itself is 7x3 of open air',
  vaults.every((l) => insideTiles(l).every(([x, y]) => W.getTile(x, y) === TILES.AIR)));
check('the room is backed by brick, so it reads as built, not natural',
  vaults.every((l) => insideTiles(l).every(([x, y]) => W.walls[y * W.width + x] === TILES.STONE_BRICK)));
check('the chest stands on the floor',
  vaults.every((l) => W.getTile(l.x, floorYOf(l) - 1) === TILES.CHEST &&
    W.isSolid(l.x, floorYOf(l))));
check('the torch is on the floor by the wall',
  vaults.every((l) => W.getTile(l.x - 3, floorYOf(l) - 1) === TILES.TORCH &&
    W.isSolid(l.x - 3, floorYOf(l))));

const depths = vaults.map((l) => floorYOf(l) - W.surfaceHeights[l.x]);
check('every vault is buried at least 20 tiles down',
  depths.every((d) => d >= 20), 'depths: ' + depths.join(', '));
info('depths below the surface: ' + depths.join(', '));

// ══════════════════════════════════════════════════════════════════════════
step('3. Same seed, same vaults — reloading never reshuffles the dig');
const vaultMapOf = (width, height, seed) => {
  const w = new WorldRef(width, height, seed);
  return w.landmarks.filter((l) => l.type === 'vault').map((l) => l.x + ',' + l.y);
};
const first = vaultMapOf(220, 90, 4242);
const second = vaultMapOf(220, 90, 4242);
check('a seed reproduces its vaults exactly',
  JSON.stringify(first) === JSON.stringify(second),
  first.join(' | ') + ' vs ' + second.join(' | '));
check('the small world still buried 3-5 vaults',
  first.length >= 3 && first.length <= 5, first.length + ' vaults');
const inBounds = (s) => {
  const [x, y] = s.split(',').map(Number);
  return x - 4 >= 0 && x + 4 < 220 && y - 4 >= 0 && y + 2 < 90;
};
check('small-world vault landmarks stay inside the map', first.every(inBounds), first.join(' | '));

// ══════════════════════════════════════════════════════════════════════════
console.log('\n' + '─'.repeat(62));
console.log(failures
  ? '✗ ' + failures + ' VAULT CHECK(S) FAILED'
  : '✓ ALL VAULT CHECKS PASSED');
process.exit(failures ? 1 : 0);
