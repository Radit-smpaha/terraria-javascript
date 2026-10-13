// ============================================================================
// shot-mega-rig.js -- rasterize the REAL Megalodon render() headlessly to PNGs
// so visual work can be inspected without a browser.
//
//   usage: node tools\shot-mega-rig.js
//
// Writes out/mega-<name>.png for a slate of poses, and (for skill review) draws
// the boss AND its renderTelegraph overlay together, exactly as terraria.js does.
// ============================================================================
'use strict';
const fs = require('fs');
const path = require('path');
const vm = require('vm');
process.chdir(path.join(__dirname, '..'));

function makeEl(id) {
  return {
    id, width: 800, height: 600, textContent: '', innerHTML: '', style: {}, dataset: {},
    classList: { add() {}, remove() {}, contains: () => false, toggle: () => false },
    getContext: () => null,
    addEventListener() {}, removeEventListener() {}, appendChild() {},
    querySelector: () => null, querySelectorAll: () => [], closest: () => null, remove() {},
    parentNode: { removeChild() {} }, setAttribute() {}, getAttribute: () => null,
    className: '', value: ''
  };
}
const els = {};
global.document = {
  getElementById: (id) => els[id] || (els[id] = makeEl(id)),
  querySelector: () => null, querySelectorAll: () => [],
  createElement: (t) => makeEl(t),
  addEventListener() {}, removeEventListener() {},
  body: makeEl('body'), documentElement: makeEl('html')
};
global.window = global;
global.localStorage = { getItem: () => null, setItem() {}, removeItem() {} };
global.requestAnimationFrame = () => 0;
global.cancelAnimationFrame = () => {};
global.performance = { now: () => Date.now() };
global.Image = class { set src(v) {} };
try { global.navigator = { userAgent: 'node' }; } catch (e) { /* electron: read-only */ }

const SCRIPTS = ['audio.js', 'particles.js', 'world.js', 'weather.js', 'entities.js',
  'underworld.js', 'juice.js', 'npcs.js', 'journey.js', 'multiplayer.js', 'space.js', 'ocean.js'];
for (const f of SCRIPTS) vm.runInThisContext(fs.readFileSync(f, 'utf8'), { filename: f });

const mini = require('./mini-canvas.js');
const world = new global.World(440, 175, 12345);
const arena = world.generateOceanPlanet();
const particles = new global.ParticleSystem();
let _rng = 0x2f6e2b1;
Math.random = () => {
  _rng ^= _rng << 13; _rng ^= _rng >>> 17; _rng ^= _rng << 5;
  return ((_rng >>> 0) % 1000000) / 1000000;
};
const player = { x: arena.arenaCX + 300, y: arena.arenaCY - 40, width: 24, height: 40, hp: 100, vx: 0, vy: 0 };
const game = {
  world, player, projectiles: [], particles, sound: null, feel: null,
  buffs: { add() {} }, damagePlayer() {}, isDead: false, camera: { x: 0, y: 0 }
};

const OUT = 'out';
if (!fs.existsSync(OUT)) fs.mkdirSync(OUT);

const W = 900, H = 560;
function shoot(name, setup, opts) {
  opts = opts || {};
  const b = new global.Kraken(arena.bossX, arena.arenaCY, game);
  b.phase = opts.phase || 1;
  b.hp = b.maxHp * (b.phase === 3 ? 0.15 : b.phase === 2 ? 0.5 : 1);
  b.faceDir = 1; b.flipSmooth = 1; b.vx = 240; b.vy = 40;
  b.swimPhase = 2.4; b.tailSwing = 22; b.finKick = 0.3; b.gillFlare = 0.6; b.animT = 6.2;
  setup(b);
  const ctx = mini.createCtx(W, H, 2);
  // background so the silhouette is judged against dark water, like the game
  ctx.fillStyle = '#0a1a2e';
  ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = '#0d2136';
  ctx.fillRect(0, 0, W, 120);
  const cam = { x: b.x + b.width / 2 - W / 2, y: b.y + b.height / 2 - H / 2 };
  if (opts.telegraph && typeof b.renderTelegraph === 'function') b.renderTelegraph(ctx, cam);
  b.render(ctx, cam);
  const errs = mini.writePNG(ctx, path.join(OUT, 'mega-' + name + '.png'));
  console.log('  wrote out/mega-' + name + '.png' + (errs.length ? '  ERRORS: ' + errs.join('|') : ''));
  return errs;
}

console.log('Rendering Megalodon poses...');
shoot('p1-swim', (b) => { b.poseMode = 'swim'; });
shoot('p1-bite', (b) => { b.poseMode = 'bite'; b.jawOpen = 0.9; b.jawTarget = 1; });
shoot('p2-rush', (b) => { b.poseMode = 'frenzy_rush'; b.jawOpen = 0.7; }, { phase: 2 });
shoot('p2-frenzy', (b) => { b.poseMode = 'feeding_frenzy'; b.frenzy = 3; b.jawOpen = 0.8; b.skillGlow = 0.8; }, { phase: 2 });
shoot('p3-apex', (b) => { b.poseMode = 'apex_execution'; b.jawOpen = 0.85; }, { phase: 3 });
shoot('p3-charge', (b) => {
  b.poseMode = 'extinction_hunt'; b.jawOpen = 0.9; b.dash = { vx: 1800, vy: 0, t: 0.2, dmg: 100, kind: 'rush', hit: false };
  b.skillGlow = 1; b.trail = [{ x: b.x - 40, y: b.y + 6, sway: 0, bob: 0, faceDir: 1, st: b._spineState() },
    { x: b.x - 90, y: b.y + 12, sway: 0, bob: 0, faceDir: 1, st: b._spineState() }];
}, { phase: 3 });

console.log('Rendering skill telegraphs (overlay + boss together)...');
shoot('tel-dash', (b) => {
  b.poseMode = 'fast_swim'; b.jawOpen = 0.6; b.animT = 6;
  b.pending = { type: 'predator_dash', x: player.x, y: player.y, radius: 120, timer: 0.4, total: 1.0, target: { x: player.x, y: player.y } };
}, { telegraph: true });
shoot('tel-bite', (b) => {
  b.poseMode = 'bite'; b.jawOpen = 0.85; b.skillGlow = 0.8;
  b.pending = { type: 'crushing_bite', x: player.x, y: player.y, radius: 170, timer: 0.35, total: 0.7, angle: 0.2, target: { x: player.x, y: player.y } };
}, { telegraph: true, phase: 2 });
shoot('tel-maw', (b) => {
  b.poseMode = 'devouring_maw'; b.jawOpen = 0.9; b.skillGlow = 0.9;
  b.pending = { type: 'devouring_maw', x: b.x + b.width * 0.5, y: b.y + b.height * 0.5, radius: 420 * 2.25, timer: 0.4, total: 0.9, angle: 0.1, target: { x: player.x, y: player.y } };
}, { telegraph: true, phase: 3 });
// The same suction at the very end of the windup (k -> 1: everything closes).
shoot('tel-maw-late', (b) => {
  b.poseMode = 'devouring_maw'; b.jawOpen = 0.9; b.skillGlow = 1;
  b.pending = { type: 'devouring_maw', x: b.x + b.width * 0.5, y: b.y + b.height * 0.5, radius: 420 * 2.25, timer: 0.05, total: 0.9, angle: 0.1, target: { x: player.x, y: player.y } };
}, { telegraph: true, phase: 3 });
shoot('tel-sweep', (b) => {
  b.poseMode = 'tail_sweep';
  b.pending = { type: 'tail_sweep', x: b.x + b.width * 0.5, y: b.y + b.height * 0.5, radius: 240, angle: 0.3, timer: 0.4, total: 0.8 };
}, { telegraph: true, phase: 2 });
shoot('tel-spin', (b) => {
  b.poseMode = 'sharknado';
  b.pending = { type: 'sharknado', x: b.x + b.width * 0.5, y: b.y + b.height * 0.5, radius: 260, timer: 0.4, total: 0.9 };
}, { telegraph: true, phase: 2 });
shoot('tel-teeth', (b) => {
  b.poseMode = 'tooth_barrage'; b.jawOpen = 0.9;
  b.pending = { type: 'tooth_barrage', x: b.x + b.width * 0.5, y: b.y + b.height * 0.5, radius: 120, timer: 0.3, total: 0.7, target: { x: player.x, y: player.y } };
}, { telegraph: true, phase: 2 });
shoot('tel-rush', (b) => {
  b.poseMode = 'extinction_hunt'; b.apexLane = { x0: b.x + 120, y0: b.y + 60, x1: b.x + 760, y1: b.y + 60, t: 0.7 };
  b.pending = { type: 'apex_execution', x: b.x + 700, y: b.y + 60, radius: 120, timer: 0.3, total: 0.6, target: { x: player.x, y: player.y } };
}, { telegraph: true, phase: 3 });
shoot('tel-depth', (b) => {
  b.poseMode = 'depth_charge';
  b.pending = { type: 'depth_warning', x: b.x + 40, y: b.y + 150, radius: 130, timer: 0.4, total: 0.8, target: { x: player.x, y: player.y } };
}, { telegraph: true, phase: 3 });
shoot('tel-call', (b) => {
  b.poseMode = 'swim';
  b.pending = { type: 'hunt_call', x: b.x + b.width * 0.5, y: b.y + b.height * 0.5, radius: 140, timer: 0.3, total: 0.6 };
}, { telegraph: true, phase: 3 });

console.log('Rendering pooled execution + aftermath VFX...');
// The release half: what the telegrams above pay off into.
shoot('fx-burst', (b) => {
  b.poseMode = 'bite'; b.jawOpen = 1;
  b.fx = []; b._fxPool = [];
  b._fxSpawn('burst', b.x + b.width / 2 + 150, b.y + b.height / 2, { r0: 18, r1: 120, life: 0.14, ang: 0.2 });
}, { phase: 3 });
shoot('fx-ring', (b) => {
  b.fx = []; b._fxPool = [];
  b._fxSpawn('ring', b.x + b.width / 2, b.y + b.height / 2, { r0: 40, r1: 180, life: 0.22 });
}, { phase: 2 });
shoot('fx-collapse', (b) => {
  b.poseMode = 'devouring_maw'; b.jawOpen = 1;
  b.fx = []; b._fxPool = [];
  b._fxSpawn('collapse', b.x + b.width / 2, b.y + b.height / 2, { r0: 60, r1: 260, life: 0.16 });
}, { phase: 3 });
shoot('fx-arc', (b) => {
  b.fx = []; b._fxPool = [];
  b._fxSpawn('arc', b.x + b.width / 2, b.y + b.height / 2, { r0: 100, r1: 240, wide: 1.15, ang: 0.3, life: 0.18 });
}, { phase: 2 });
shoot('fx-wake', (b) => {
  b.poseMode = 'extinction_hunt'; b.jawOpen = 1;
  b.fx = []; b._fxPool = [];
  // three wakes in a curve, the way a real charge leaves them
  b._fxSpawn('wake', b.x + b.width / 2, b.y + b.height / 2, { r0: 78, r1: 340, ang: 0.05, life: 0.08 });
  b._fxSpawn('wake', b.x + b.width / 2 - 40, b.y + b.height / 2 + 12, { r0: 74, r1: 300, ang: 0.02, life: 0.18 });
  b._fxSpawn('wake', b.x + b.width / 2 - 80, b.y + b.height / 2 + 24, { r0: 70, r1: 260, ang: -0.02, life: 0.28 });
}, { phase: 3 });

console.log('done.');
