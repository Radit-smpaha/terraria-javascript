// Focused bug hunt for the "kraken grows forever / blocks go invisible" report.
// Uses a STATEFUL canvas mock that tracks the real transform matrix, scale, and
// globalAlpha so a leaked transform or alpha is caught instead of silently
// passing (the old stub treated save/restore/transform as no-ops).
const fs = require('fs');
const vm = require('vm');

let failures = 0;
const check = (label, ok, detail = '') => {
  if (!ok) failures++;
  console.log((ok ? '  PASS ' : '  FAIL ') + label + (!ok && detail ? ' — ' + detail : ''));
};

function makeCtx() {
  const state = { m: [1, 0, 0, 1, 0, 0], alpha: 1, stack: [], calls: 0 };
  const mul = (m, n) => [
    m[0] * n[0] + m[2] * n[1], m[1] * n[0] + m[3] * n[1],
    m[0] * n[2] + m[2] * n[3], m[1] * n[2] + m[3] * n[3],
    m[0] * n[4] + m[2] * n[5] + m[4], m[1] * n[4] + m[3] * n[5] + m[5],
  ];
  const api = {
    _state: state, canvas: {},
    save() { state.stack.push({ m: state.m.slice(), alpha: state.alpha }); state.calls++; },
    restore() { const s = state.stack.pop(); if (s) { state.m = s.m; state.alpha = s.alpha; } state.calls++; },
    translate(x, y) { state.m = mul(state.m, [1, 0, 0, 1, x, y]); },
    scale(x, y) { state.m = mul(state.m, [x, 0, 0, y, 0, 0]); },
    rotate(a) { state.m = mul(state.m, [Math.cos(a), Math.sin(a), -Math.sin(a), Math.cos(a), 0, 0]); },
    transform(a, b, c, d, e, f) {
      if ([a, b, c, d, e, f].some(v => !Number.isFinite(v))) throw new Error('non-finite transform');
      state.m = mul(state.m, [a, b, c, d, e, f]);
    },
    setTransform(a, b, c, d, e, f) { state.m = [a, b, c, d, e, f]; },
    createRadialGradient() { return { addColorStop() {} }; },
    createLinearGradient() { return { addColorStop() {} }; },
    getImageData() { return { data: new Uint8ClampedArray(4) }; },
    measureText() { return { width: 10 }; },
  };
  return new Proxy(api, {
    get(t, p) { if (p in api) return api[p]; if (typeof p === 'string') return () => { state.calls++; }; return undefined; },
    set(t, p, v) { if (p === 'globalAlpha') state.alpha = v; return true; },
  });
}
const scaleOf = (ctx) => ({ sx: Math.abs(ctx._state.m[0]), sy: Math.abs(ctx._state.m[3]) });
const alphaOf = (ctx) => ctx._state.alpha;
const depthOf = (ctx) => ctx._state.stack.length;


function makeEl(id) {
  return { id, width: 800, height: 600, textContent: '', innerHTML: '', style: {}, dataset: {},
    classList: (() => { const s = new Set(); return { add: c => s.add(c), remove: c => s.delete(c), contains: c => s.has(c), toggle: () => false }; })(),
    getContext: () => makeCtx(), addEventListener() {}, removeEventListener() {}, appendChild() {},
    querySelector: () => null, querySelectorAll: () => [], closest: () => null, remove() {},
    parentNode: { removeChild() {} }, setAttribute() {}, getAttribute: () => null, className: '', value: '' };
}
const els = {};
global.document = { getElementById: (id) => els[id] || (els[id] = makeEl(id)), querySelector: () => null,
  querySelectorAll: () => [], createElement: (tag) => makeEl(tag), addEventListener() {}, removeEventListener() {},
  body: makeEl('body'), documentElement: makeEl('html') };
global.window = global;
global.localStorage = { getItem: () => null, setItem() {}, removeItem() {} };
global.requestAnimationFrame = () => 0;
global.cancelAnimationFrame = () => {};
global.performance = { now: () => Date.now() };
global.Image = class { set src(v) {} };
global.navigator = { userAgent: 'node' };

const scripts = ['audio.js', 'particles.js', 'world.js', 'weather.js', 'entities.js',
  'underworld.js', 'juice.js', 'npcs.js', 'journey.js', 'multiplayer.js', 'space.js', 'ocean.js'];
for (const f of scripts) vm.runInThisContext(fs.readFileSync(f, 'utf8'), { filename: f });

const g = {
  world: new global.World(440, 175, 12345),
  player: { x: 2000, y: 400, width: 24, height: 40 },
  projectiles: [], particles: null, sound: null, feel: null,
  buffs: { add() {} }, damagePlayer() {},
};
const arena = g.world.enterOceanPlanet ? g.world.enterOceanPlanet() : g.world.generateOceanPlanet();
const boss = new global.Kraken(arena.bossX, arena.bossY, g);
g.particles = new global.ParticleSystem();

console.log('\n> A. Render must not leak transform/alpha/save-depth (stateful ctx)');
const ctx = makeCtx();
let leak = null;
try {
  for (let i = 0; i < 60 * 30; i++) {
    boss.update(1 / 60, g.player, g.projectiles, null, g.particles);
    boss.render(ctx, { x: 0, y: 0 });
    boss.renderTelegraph(ctx, { x: 0, y: 0 });
    const s = scaleOf(ctx), a = alphaOf(ctx), d = depthOf(ctx);
    if (Math.abs(s.sx - 1) > 1e-6 || Math.abs(s.sy - 1) > 1e-6) { leak = `frame ${i}: scale drifted to ${s.sx.toFixed(3)}x${s.sy.toFixed(3)}`; break; }
    if (d !== 0) { leak = `frame ${i}: save-stack depth ${d} (unbalanced save/restore)`; break; }
    if (!(a >= 0 && a <= 1)) { leak = `frame ${i}: globalAlpha out of range ${a}`; break; }
  }
} catch (e) { leak = 'threw: ' + e.message; }
check('no transform scale leak over 30s', !leak, leak || '');

console.log('\n> B. Forcing every skill type to resolve keeps state sane');
const types = ['ink_burst', 'slam', 'geyser', 'whirlpool', 'sweep', 'barrage', 'beam', 'ink_spew'];
let bad = null;
for (const ty of types) {
  for (let ph = 1; ph <= 4; ph++) {
    boss.phase = ph; boss.hp = boss.maxHp; boss.dead = false;
    boss.pending = { type: ty, x: boss.x, y: boss.y, radius: 120, timer: 0.01, total: 1,
      angle: 0, width: 1, target: { x: boss.x + 100, y: boss.y }, vents: [-1, 0, 1],
      stabs: [{ x: boss.x, y: boss.y, at: 0, done: false }] };
    boss.resolvePending(null, g.particles);
    boss.render(ctx, { x: 0, y: 0 });
    const s = scaleOf(ctx), d = depthOf(ctx), a = alphaOf(ctx);
    if (Math.abs(s.sx - 1) > 1e-6 || Math.abs(s.sy - 1) > 1e-6) { bad = `${ty} ph${ph}: scale ${s.sx.toFixed(3)}x${s.sy.toFixed(3)}`; break; }
    if (d !== 0) { bad = `${ty} ph${ph}: depth ${d}`; break; }
    if (!(a >= 0 && a <= 1)) { bad = `${ty} ph${ph}: alpha ${a}`; break; }
    for (const f of ['squash', 'recoil', 'lunge', 'breath', 'sway', 'bob', 'lean', 'pitch', 'skew', 'surge', 'pulse']) {
      if (!Number.isFinite(boss[f])) { bad = `${ty} ph${ph}: ${f}=${boss[f]}`; break; }
    }
    if (bad) break;
  }
  if (bad) break;
}
check('all skills x all phases leave clean state + finite motion', !bad, bad || '');

console.log('\n> C. recoil spring stays bounded');
boss.phase = 4;
let maxRecoil = 0, minRecoil = 0;
for (let i = 0; i < 600; i++) {
  boss.pending = { type: 'slam', x: boss.x, y: boss.y, radius: 120, timer: 0.001, total: 1 };
  boss.update(1 / 60, g.player, g.projectiles, null, g.particles);
  maxRecoil = Math.max(maxRecoil, boss.recoil || 0);
  minRecoil = Math.min(minRecoil, boss.recoil || 0);
}
check('recoil stays finite and bounded', Number.isFinite(maxRecoil) && Math.abs(maxRecoil) < 50 && Math.abs(minRecoil) < 50,
  `max=${maxRecoil.toFixed(2)} min=${minRecoil.toFixed(2)}`);

console.log('\n> D. Eyes are symmetric (same radius, ~same row)');
const rec = { arcs: [] };
const recCtx = new Proxy({}, {
  get(t, k) {
    if (k === 'canvas') return {};
    if (k === 'createRadialGradient' || k === 'createLinearGradient') return () => ({ addColorStop() {} });
    if (k === 'arc') return (x, y, r) => { rec.arcs.push({ x, y, r }); };
    if (k === 'transform') return (...a) => { if (a.length !== 6) throw new TypeError('transform arity'); };
    if (typeof k === 'string') return () => undefined;
    return undefined;
  },
  set() { return true; },
});
boss.phase = 2; boss.dead = false; boss.hideAlpha = 1; boss.lashPhase = 0;
boss.render(recCtx, { x: 0, y: 0 });
const big = rec.arcs.filter(a => a.r > 10 && a.r < 20).sort((a, b) => b.r - a.r).slice(0, 2);
if (big.length === 2) {
  const [A, B] = big;
  check('both eyes share one radius', Math.abs(A.r - B.r) < 0.01, `r ${A.r.toFixed(2)}/${B.r.toFixed(2)}`);
  check('both eyes sit on ~one row', Math.abs(A.y - B.y) < 26, `y ${A.y.toFixed(1)}/${B.y.toFixed(1)}`);
} else {
  check('both eyes share one radius', false, 'could not find two eye arcs');
  check('both eyes sit on ~one row', false, 'could not find two eye arcs');
}

console.log('\nKRAKEN BUG QA: ' + (failures ? failures + ' FAILURE(S)' : 'OK'));
process.exit(failures ? 1 : 0);
