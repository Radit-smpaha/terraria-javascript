// ============================================================================
// bench-mega-fx.js -- measure the Megalodon's frame cost, before vs after.
//
// Runs a scripted phase-3 fight (every skill firing, telegraphs live, FX alive)
// for a fixed number of frames and reports ms/frame for update + render +
// renderTelegraph, at each quality level the game exposes.
//
// Compare the working tree against the committed version:
//   powershell -File tools/run-node.ps1 tools/bench-mega-fx.js            (now)
//   powershell -File tools/run-node.ps1 tools/bench-mega-fx.js --base     (HEAD)
//
// It uses the REAL renderer (tools/mini-canvas.js), so the numbers are real
// rasterisation cost, not a stub.
// ============================================================================
'use strict';
const fs = require('fs');
const path = require('path');
const vm = require('vm');
process.chdir(path.join(__dirname, '..'));

// run-node.ps1 does not forward positional flags reliably on PS 5.1, so the
// baseline is selected with an env var: MEGA_BENCH_BASE=1.
const BASE = process.env.MEGA_BENCH_BASE === '1' || process.argv.includes('--base');
const mini = require('./mini-canvas.js');

// The class lives in ocean.js (the file the page loads), so that is what gets
// benchmarked: --base compares the working tree against the committed blob.
let bossFile = 'ocean.js';
if (BASE) {
  bossFile = 'tools/.bench-base-ocean.js';
  fs.writeFileSync(bossFile, require('child_process').execSync('git show HEAD:ocean.js', { maxBuffer: 1 << 28 }));
  console.log('benchmarking the COMMITTED ocean.js (HEAD)');
} else {
  console.log('benchmarking the WORKING-TREE ocean.js');
}

function makeEl(id) {
  return {
    id, width: 800, height: 600, textContent: '', innerHTML: '', style: {}, dataset: {},
    classList: { add() {}, remove() {}, contains: () => false, toggle: () => false },
    getContext: () => null, addEventListener() {}, removeEventListener() {}, appendChild() {},
    querySelector: () => null, querySelectorAll: () => [], closest: () => null, remove() {},
    parentNode: { removeChild() {} }, setAttribute() {}, getAttribute: () => null,
    className: '', value: ''
  };
}
const els = {};
global.document = {
  getElementById: (id) => els[id] || (els[id] = makeEl(id)),
  querySelector: () => null, querySelectorAll: () => [],
  createElement: (t) => makeEl(t), addEventListener() {}, removeEventListener() {},
  body: makeEl('body'), documentElement: makeEl('html')
};
global.window = global;
global.localStorage = { getItem: () => null, setItem() {}, removeItem() {} };
global.requestAnimationFrame = () => 0;
global.cancelAnimationFrame = () => {};
global.performance = { now: () => Date.now() };
global.Image = class { set src(v) {} };
try { global.navigator = { userAgent: 'node' }; } catch (e) { /* electron */ }

const OTHERS = ['audio.js', 'particles.js', 'world.js', 'weather.js', 'entities.js',
  'underworld.js', 'juice.js', 'npcs.js', 'journey.js', 'multiplayer.js', 'space.js'];
for (const f of OTHERS) vm.runInThisContext(fs.readFileSync(f, 'utf8'), { filename: f });
vm.runInThisContext(fs.readFileSync(bossFile, 'utf8'), { filename: bossFile });

const world = new global.World(440, 175, 12345);
const arena = world.generateOceanPlanet();
const particles = new global.ParticleSystem();
// A deterministic RNG keeps the two benchmark runs comparable.
let _rng = 0x2f6e2b1;
Math.random = () => {
  _rng ^= _rng << 13; _rng ^= _rng >>> 17; _rng ^= _rng << 5;
  return ((_rng >>> 0) % 1000000) / 1000000;
};
let dmgCalls = 0;
const player = { x: arena.arenaCX + 260, y: arena.arenaCY - 30, width: 24, height: 40, hp: 100, vx: 0, vy: 0 };
const game = {
  world, player, projectiles: [], particles, sound: null, feel: null,
  buffs: { add() {} }, damagePlayer() { dmgCalls++; }, isDead: false,
  camera: { x: 0, y: 0 },
  // the two fields the boss reads for quality scaling
  particleScale: 1,
  quality: { lowQuality: false }
};

const W = 900, H = 560;
function bench(label, frames, setupQuality) {
  const b = new global.Kraken(arena.bossX, arena.arenaCY, game);
  b.phase = 3;
  b.hp = b.maxHp * 0.14;
  setupQuality();
  const ctx = mini.createCtx(W, H, 1);
  ctx.fillStyle = '#0a1a2e'; ctx.fillRect(0, 0, W, H);
  const cam = { x: b.x + b.width / 2 - W / 2, y: b.y + b.height / 2 - H / 2 };
  // ---- scripted fight: cycle every skill + FX so all the art is exercised
  const script = ['crushing_bite', 'tail_sweep', 'sharknado', 'tooth_barrage',
    'devouring_maw', 'depth_warning', 'predator_dash', 'hunt_call'];
  let calls = { update: 0, render: 0, telegraph: 0, fx: 0, maxFx: 0 };
  const t0 = Date.now();
  let peakParticles = 0;
  for (let i = 0; i < frames; i++) {
    // Swap telegraph every 60 frames. The interval MUST exceed the telegraph's
    // 0.8s timer (48 frames) or the skill is overwritten before it resolves and
    // nothing is priced.
    if (i % 60 === 0) {
      const type = script[(i / 60) % script.length | 0];
      b.pending = {
        type, x: b.x + b.width * 0.5, y: b.y + b.height * 0.5,
        radius: 420, timer: 0.8, total: 0.9, target: { x: player.x, y: player.y }
      };
    }
    const s = Date.now();
    b.update(1 / 60, player, game.projectiles, null, particles);
    calls.update += Date.now() - s;
    b.x = b.x; // position driven by the AI
    const s2 = Date.now();
    b.render(ctx, cam);
    calls.render += Date.now() - s2;
    const s3 = Date.now();
    if (typeof b.renderTelegraph === 'function') b.renderTelegraph(ctx, cam);
    calls.telegraph += Date.now() - s3;
    if (b.fx) { calls.fx += b.fx.length; if (b.fx.length > calls.maxFx) calls.maxFx = b.fx.length; }
    peakParticles = Math.max(peakParticles, particles.particles.length);
    particles.update(1 / 60, world.pixelWidth, world.pixelHeight);
  }
  const total = Date.now() - t0;
  const q = typeof b._fxDetail === 'function' ? b._fxDetail() : 1;
  ctx.destroy();
  return {
    label, q, msPerFrame: (total / frames),
    update: calls.update / frames, render: calls.render / frames,
    telegraph: calls.telegraph / frames,
    liveFx: (calls.fx / frames).toFixed(1) + ' (peak ' + calls.maxFx + ')',
    peakParticles, dmgCalls
  };
}

const FRAMES = 600;
console.log('\nframes: ' + FRAMES + ' (scripted: 8 skills cycling, phase 3, all FX live)');
console.log('best of 3 trials per setting - the mini-canvas rasteriser is CPU-bound,\n'
  + 'so single runs vary by up to 2x and only the minimum is meaningful.\n');
const pad = (s, n) => String(s).padEnd(n);
// The game exposes three quality levels; each one must remain inside budget.
const SETTINGS = [
  { label: 'HIGH  (full effects)', ps: 1, low: false },
  { label: 'BALANCED (reduced)', ps: 0.65, low: false },
  { label: 'LOW   (minimal)', ps: 0.3, low: true }
];
const rows = SETTINGS.map((s) => {
  const trials = [];
  let r = null;
  for (let t = 0; t < 3; t++) {
    r = bench(s.label, FRAMES, () => {
      game.particleScale = s.ps; game.quality.lowQuality = s.low;
    });
    trials.push(r);
  }
  return { label: s.label, q: r.q, best: Math.min.apply(null, trials.map(t => t.msPerFrame)),
    liveFx: r.liveFx, peakParticles: r.peakParticles, dmgCalls: r.dmgCalls,
    update: r.update, render: r.render, telegraph: r.telegraph };
});
for (const r of rows) {
  console.log(pad(r.label, 22) + pad('quality=' + r.q.toFixed(2), 13)
    + pad(r.best.toFixed(3) + ' ms/frame', 15)
    + 'liveFx=' + r.liveFx + '  peakParticles=' + r.peakParticles
    + ' | update=' + r.update.toFixed(2) + '  render=' + r.render.toFixed(2)
    + '  telegraph=' + r.telegraph.toFixed(2));
}
const budget = 16.7;
for (const r of rows) {
  console.log(pad(r.label, 22) + 'uses ' + ((r.best / budget) * 100).toFixed(1)
    + '% of a 60fps frame budget for the boss alone (CPU rasteriser; the browser is faster)');
}
console.log('\ndamagePlayer calls during the scripted fight: ' + dmgCalls
  + '  (visual FX never deal damage)');

if (BASE) {
  try { fs.unlinkSync(bossFile); } catch (e) { /* ignore */ }
}
