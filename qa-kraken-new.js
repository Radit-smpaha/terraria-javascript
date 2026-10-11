// Focused QA for the Kraken overhaul + bigger ocean. Boots the game harness
// (same DOM stubs as qa-reef.js), then drives update() for many frames with a
// player present, forces render() through a stub ctx, and checks the new
// behaviour (whole-body motion, hide/lash cycle, bigger archipelago).
const fs = require('fs');
const vm = require('vm');

let failures = 0;
const check = (label, ok, detail = '') => {
  if (!ok) failures++;
  console.log((ok ? '  PASS ' : '  FAIL ') + label + (!ok && detail ? ' — ' + detail : ''));
};
const step = (t) => console.log('\n> ' + t);

function makeCtx() {
  const calls = { fill: 0, stroke: 0, ellipse: 0, arc: 0 };
  return new Proxy({}, {
    get(t, p) {
      if (p === 'canvas') return {};
      if (p === 'createRadialGradient' || p === 'createLinearGradient')
        return () => ({ addColorStop() {} });
      if (p === 'getImageData') return () => ({ data: new Uint8ClampedArray(4) });
      if (p === 'measureText') return () => ({ width: 10 });
      if (p === 'transform') return (...args) => {
        if (args.length !== 6) throw new TypeError('transform requires six arguments');
      };
      if (p === 'fill' || p === 'stroke' || p === 'ellipse' || p === 'arc')
        return () => { calls[p]++; };
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
    addEventListener() {}, removeEventListener() {}, appendChild() {},
    querySelector: () => null, querySelectorAll: () => [], closest: () => null,
    remove() {}, parentNode: { removeChild() {} }, setAttribute() {}, getAttribute: () => null,
    className: '', value: ''
  };
}
const els = {};
global.document = {
  getElementById: (id) => els[id] || (els[id] = makeEl(id)),
  querySelector: () => null, querySelectorAll: () => [],
  createElement: (tag) => makeEl(tag),
  addEventListener() {}, removeEventListener() {},
  body: makeEl('body'), documentElement: makeEl('html')
};
global.window = global;
global.localStorage = { getItem: () => null, setItem() {}, removeItem() {} };
global.requestAnimationFrame = () => 0;
global.cancelAnimationFrame = () => {};
global.performance = { now: () => Date.now() };
global.Image = class { set src(v) {} };
global.navigator = { userAgent: 'node' };

// Only the world + ocean layers: this QA exercises World.generateOceanPlanet
// and the Kraken class, which both live in ocean.js. Loading terraria.js would
// auto-boot the whole Game (and need a full canvas/DOM), so it is skipped.
const scripts = ['audio.js', 'particles.js', 'world.js', 'weather.js', 'entities.js',
  'underworld.js', 'juice.js', 'npcs.js', 'journey.js', 'multiplayer.js', 'space.js',
  'ocean.js'];
for (const f of scripts) {
  const code = fs.readFileSync(f, 'utf8');
  vm.runInThisContext(code, { filename: f });
}

// Minimal game object the Kraken needs to tick.
const g = {
  world: new global.World(440, 175, 12345),
  player: { x: 2000, y: 400, width: 24, height: 40 },
  projectiles: [],
  particles: null,
  sound: null,
  feel: null,
  buffs: { add() {} },
  damagePlayer() {}
};

step('1. The ocean is a bigger archipelago');
const arena = g.world.enterOceanPlanet ? g.world.enterOceanPlanet() : g.world.generateOceanPlanet();
// Count dry columns (ground above waterline) = land area.
let dryCols = 0;
for (let x = 0; x < g.world.width; x++) {
  if (g.world.surfaceHeights[x] < arena.seaY) dryCols++;
}
check('many islands now rise above the waterline', dryCols > 40, dryCols + ' dry columns');
check('the arena records the island list', Array.isArray(arena.islands) && arena.islands.length >= 8,
  (arena.islands || []).length + ' islands');

step('2. The Kraken has whole-body motion + hide/lash state');
const boss = new global.Kraken(arena.bossX, arena.bossY, g);
check('widened body (360x250)', boss.width === 360 && boss.height === 250, boss.width + 'x' + boss.height);
check('motion fields exist', 'bob' in boss && 'sway' in boss && 'lean' in boss && 'surge' in boss && 'faceDir' in boss);
check('hide/lash fields exist', 'hideAlpha' in boss && 'lashPhase' in boss && 'hideCooldown' in boss);

step('3. Drives many frames without throwing; body actually moves');
const before = { x: boss.x, y: boss.y };
let minBob = Infinity, maxBob = -Infinity, minSway = Infinity, maxSway = -Infinity;
let sawHidden = false, sawLash = false;
let threw = null;
try {
  for (let i = 0; i < 60 * 40; i++) {   // 40 seconds at 60fps
    boss.update(1 / 60, g.player, g.projectiles, null, null);
    if (typeof boss.render === 'function') boss.render(makeCtx(), { x: 0, y: 0 });
    minBob = Math.min(minBob, boss.bob); maxBob = Math.max(maxBob, boss.bob);
    minSway = Math.min(minSway, boss.sway); maxSway = Math.max(maxSway, boss.sway);
    if (boss.hideAlpha < 0.3) sawHidden = true;
    if (boss.lashPhase > 0.9) sawLash = true;
  }
} catch (e) { threw = e; }
check('update+render over 40s never throws', !threw, threw ? String(threw) : '');
check('the mantle bob actually oscillates (not a frozen PNG)', maxBob - minBob > 8,
  (maxBob - minBob).toFixed(1) + 'px');
check('the mantle sways side to side', maxSway - minSway > 8, (maxSway - minSway).toFixed(1) + 'px');
check('the kraken hides at some point', sawHidden);
check('the kraken lashes out at some point', sawLash);
check('the boss moved across the arena', Math.hypot(boss.x - before.x, boss.y - before.y) > 20,
  Math.hypot(boss.x - before.x, boss.y - before.y).toFixed(1) + 'px');

step('4. Render emits the Terraria-styled art');
const ctx = makeCtx();
boss.dead = false; boss.hideAlpha = 1; boss.lashPhase = 0.5;
let renderError = null;
try { boss.render(ctx, { x: 0, y: 0 }); } catch (e) { renderError = e; }
check('render completes with valid Canvas transforms', !renderError,
  renderError ? String(renderError) : '');

console.log('\nKRAKEN QA: ' + (failures ? failures + ' FAILURE(S)' : 'OK'));
process.exit(failures ? 1 : 0);
