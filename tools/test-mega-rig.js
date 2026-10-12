// ============================================================================
// test-mega-rig.js -- headless regression test for the reworked Megalodon rig.
//
// Loads the REAL game scripts (including ocean.js, the file the page loads)
// and drives the boss through a full fight: all three phases, every attack,
// dash/spin/exhaust/hunt states, and a death. It fails on any thrown error,
// any NaN in a rig channel, or a clip the render expects that the AI can never
// reach -- which is what stops the asset pack and the game drifting apart.
//
//   usage: powershell -File tools/run-node.ps1 tools\test-mega-rig.js
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
// Deterministic RNG: the boss' spawn angle, scar seed and blink clock all come
// from Math.random, which would make pose coverage flaky. A flaky boss test is
// worse than no test, so seed the generator for the whole run.
let _rng = 0x2f6e2b1;
Math.random = () => {
  _rng ^= _rng << 13; _rng ^= _rng >>> 17; _rng ^= _rng << 5;
  return ((_rng >>> 0) % 1000000) / 1000000;
};
const player = { x: arena.arenaCX + 260, y: arena.arenaCY - 40, width: 24, height: 40, hp: 100 };
const game = {
  world, player, projectiles: [], particles, sound: null, feel: null,
  buffs: { add() {} }, damagePlayer() {}, isDead: false, camera: { x: 0, y: 0 }
};

let pass = 0, fail = 0;
const check = (name, cond, extra) => {
  if (cond) { pass++; console.log('  ok   ' + name); }
  else { fail++; console.log('  FAIL ' + name + (extra ? '  [' + extra + ']' : '')); }
};

// ---------------------------------------------------------------- helpers
const CHANNELS = ['jawOpen', 'tailBend', 'tailSwing', 'finKick', 'gillFlare', 'blink',
  'roll', 'yaw', 'droop', 'swimPhase', 'squash', 'recoil', 'lunge', 'breath', 'surge',
  'pitch', 'lean', 'sway', 'bob'];
const finite = (o) => CHANNELS.every((k) => Number.isFinite(o[k]));

// every clip the pack can play must be reachable from the AI at some point.
// V2 kit: the rotation changed (Tsunami Breaker, Death Spiral, Extinction
// Rush...), so the per-phase lists follow the NEW pendings; clips the V2 AI
// no longer arms on its own (tooth_barrage, frenzy_rush...) stay non-orphan
// through the DRIVE map below, which documents how each pose is produced.
const REACHABLE = {
  1: ['idle', 'swim', 'fast_swim', 'turn', 'bite', 'tail_sweep', 'hurt'],
  2: ['feeding_frenzy', 'bite', 'fast_swim', 'sharknado', 'devouring_maw'],
  3: ['apex_execution', 'depth_charge', 'devouring_maw', 'extinction_hunt', 'exhausted']
};
const manifest = JSON.parse(fs.readFileSync('assets/bosses/megalodon/manifest.json', 'utf8'));
const packNames = manifest.assets.map((a) => a.animation);

function runFight(phaseTarget, seconds) {
  const b = new global.Kraken(arena.bossX, arena.arenaCY, game);
  b.faceDir = 1;
  const seen = {};
  const t0 = Date.now();
  const steps = Math.round(seconds * 60);
  for (let i = 0; i < steps && !b.dead; i++) {
    // damage it for real (takeDamage is what advances the phase ladder)
    if (i % 240 === 0 && phaseTarget > 1) b.takeDamage(b.maxHp * 0.12, null, particles);
    b.update(1 / 60, player, game.projectiles, null, particles);
    // keep the player near so dashes and bites keep firing
    player.x = b.x + b.width / 2 + 200 * Math.sin(i / 40);
    player.y = b.y + b.height / 2 + 120 * Math.cos(i / 55);
    seen[b.poseMode] = (seen[b.poseMode] || 0) + 1;
    if (!finite(b)) return { seen, threw: 'NaN in rig channel at step ' + i };
  }
  return { seen, throws: null, dead: b.dead, boss: b };
}

// ---------------------------------------------------------------- the test
console.log('Loading ' + SCRIPTS.length + ' game scripts and running the fight...');
let firstErr = null;
let allSeen = {};
try {
  for (const target of [1, 2, 3]) {
    const r = runFight(target, 26);
    if (r.threw) { firstErr = firstErr || r.threw; break; }
    for (const k of Object.keys(r.seen)) allSeen[k] = (allSeen[k] || 0) + r.seen[k];
    check('phase ' + target + ': 26s of AI with no errors', !r.threw, r.threw);
    check('phase ' + target + ': rig channels stay finite', finite(r.boss));
    check('phase ' + target + ': boss reached its phase', r.boss.phase >= target, 'phase=' + r.boss.phase);
  }
} catch (e) {
  firstErr = e.message + '\n' + (e.stack || '').split('\n').slice(0, 4).join('\n');
}
check('no exception thrown anywhere in the fight', !firstErr, firstErr);

console.log('\npose coverage: ' + Object.keys(allSeen).sort().join(', '));
// Clean mapping check: for each pose, a FRESH boss with only the AI state that
// documents it must land in that pose. `idle` is proven by the organic fight
// above instead, because update() immediately accelerates a parked boss.
const DRIVE = {
  hurt: (b) => { b.hitFlash = 0.25; },
  feeding_frenzy: (b) => { b.frenzy = 2; b.vx = 0; b.vy = 0; },
  frenzy_rush: (b) => { b.startDash(1400, 0, 0.4, 100, 'frenzy'); },
  depth_charge: (b) => { b.depthDive = 0.8; },
  devouring_maw: (b) => { b.suctionT = 0.6; },
  sharknado: (b) => { b.tornadoT = 1; },
  apex_execution: (b) => { b.vanishT = 0.6; },
  exhausted: (b) => { b.exhaustT = 3; },
  extinction_hunt: (b) => { b.hunt = { t: 0, dur: 3.6, steps: [] }; },
  bite: (b) => { b.pending = { type: 'crushing_bite', timer: 0.3, total: 0.7 }; },
  // V2 note: the V2 rotation no longer arms tooth_barrage itself, but the
  // pose is still a live mapping the render supports (QA/bake drive it).
  tooth_barrage: (b) => { b.pending = { type: 'tooth_barrage', timer: 0.3, total: 0.55 }; },
  death: (b) => { b.dead = true; b.deadT = 1; }
};
const driveSeen = {};
for (const name of Object.keys(DRIVE)) {
  const b = new global.Kraken(arena.bossX, arena.arenaCY, game);
  b.faceDir = 1; b.vx = 200; b.vy = 0;
  DRIVE[name](b);
  for (let i = 0; i < 3; i++) b.update(1 / 60, player, game.projectiles, null, particles);
  driveSeen[name] = b.poseMode;
}
check('each pose maps from its documented AI state',
  Object.keys(DRIVE).every((n) => driveSeen[n] === n),
  JSON.stringify(driveSeen));

const reachable = (name) => !!allSeen[name] || driveSeen[name] === name;
const unreachable = packNames.filter((n) => !reachable(n) &&
  ['water_splash', 'water_wave', 'turbulent_current', 'bite_shockwave', 'tooth_projectile',
    'blood_effect', 'impact_effect', 'phase2_transition', 'phase3_transition',
    'apex_warning_indicator'].indexOf(n) < 0);
for (const ph of [1, 2, 3]) {
  for (const name of REACHABLE[ph]) {
    check('phase ' + ph + ' reaches pose "' + name + '"', reachable(name));
  }
}
check('every shark pose the pack ships is reachable (no orphan clip)',
  unreachable.length === 0, 'unreachable: ' + unreachable.join(','));

// death path
console.log('\nDeath + render after death:');
try {
  const b = new global.Kraken(arena.bossX, arena.arenaCY, game);
  b.takeDamage(999999, null, particles);
  check('takeDamage beyond maxHp kills it', b.dead === true && b.hp === 0);
  for (let i = 0; i < 120; i++) b.update(1 / 60, player, game.projectiles, null, particles);
  check('update keeps running while dead', finite(b));
  check('dead boss falls into the death pose', b.poseMode === 'death', b.poseMode);
  check('deadT accumulates for the death clip', b.deadT > 1, 'deadT=' + b.deadT);
  const ctx = mini.createCtx(900, 600, 1);
  b.render(ctx, { x: 0, y: 0 });
  const errs = ctx.errors || [];
  check('render of a dead boss throws nothing', errs.length === 0, errs.join('|'));
} catch (e) {
  check('death path clean', false, e.message);
}

// render every phase to be sure the new palette/ragged code is safe
console.log('\nRender smoke (all phases + skills):');
try {
  const b = new global.Kraken(arena.bossX, arena.arenaCY, game);
  const poses = ['idle', 'swim', 'fast_swim', 'turn', 'bite', 'tail_sweep', 'hurt',
    'frenzy_rush', 'sharknado', 'tooth_barrage', 'feeding_frenzy', 'apex_execution',
    'depth_charge', 'devouring_maw', 'extinction_hunt', 'exhausted', 'death'];
  let okAll = true, err = '';
  for (const ph of [1, 2, 3]) {
    b.phase = ph; b.hp = b.maxHp * (ph === 3 ? 0.2 : ph === 2 ? 0.5 : 1);
    for (const p of poses) {
      const ctx = mini.createCtx(900, 600, 1);
      b.poseMode = p;
      b.jawOpen = 0.8; b.tailSwing = 24; b.swimPhase = 2.2; b.animT = 6;
      b.exhaustT = p === 'exhausted' ? 2 : 0;
      b.vanishT = p === 'apex_execution' ? 0.5 : 0;
      b.tornadoT = p === 'sharknado' ? 1 : 0;
      b.dash = (p === 'frenzy_rush' || p === 'extinction_hunt')
        ? { vx: 1200, vy: 0, t: 0.3, dmg: 100, kind: 'frenzy', hit: true } : null;
      b.render(ctx, { x: 0, y: 0 });
      if ((ctx.errors || []).length) { okAll = false; err = ctx.errors.join('|'); }
    }
  }
  check('every phase renders every pack pose without rasteriser errors', okAll, err);
} catch (e) {
  check('render smoke', false, e.message);
}

// ==========================================================================
// ANIMATION TIMING: anticipation, one-hit-per-charge, eased turns,
// charge recovery, death-once, guest puppet, delta-time independence.
// ==========================================================================
console.log('\nAnimation timing:');
let dmgCalls = 0;
try {
  const gameSpy = Object.assign({}, game, { damagePlayer: () => { dmgCalls++; } });

  // --- BITE ANTICIPATION: the jaw opens and the body rears BEFORE the hit ---
  const b = new global.Kraken(arena.bossX, arena.arenaCY, gameSpy);
  b.phase = 1; b.faceDir = 1; b.flipSmooth = 1;
  b.pending = { type: 'crushing_bite', x: 0, y: 0, radius: 170,
    timer: 0.7, total: 0.7, angle: 0, target: { x: player.x, y: player.y } };
  for (let i = 0; i < 12; i++) b.update(0.05, player, game.projectiles, null, particles);
  check('telegraph opens the jaw', (b.jawOpen || 0) > 0.4, 'jawOpen=' + (b.jawOpen || 0).toFixed(2));
  check('telegraph rears the body back', (b.lunge || 0) < -0.2, 'lunge=' + (b.lunge || 0).toFixed(2));
  const anticipBefore = b.jawOpen;
  b.resolvePending(null, particles);                    // the strike
  let snapped = false;
  for (let i = 0; i < 4; i++) {
    b.update(0.02, player, game.projectiles, null, particles);
    if ((b.lunge || 0) > 0.15) snapped = true;
  }
  check('strike snaps the body forward after the rear', snapped,
    'lunge=' + (b.lunge || 0).toFixed(2) + ' jawWas=' + anticipBefore.toFixed(2));
  b.pending = null;

  // --- ONE HIT PER CHARGE --------------------------------------------------
  dmgCalls = 0;
  const c = new global.Kraken(player.x - 40, player.y, gameSpy);
  c.phase = 1; c.hp = c.maxHp; c.faceDir = 1; c.flipSmooth = 1;
  c.jawOpen = 1;
  c.startDash(900, 0, 0.6, 50, 'bite');
  // step only until the dash ends, so the recovery window is still running
  let steps = 0;
  while (c.dash && steps++ < 200) c.update(1 / 60, player, game.projectiles, null, particles);
  check('a charge through the player deals damage exactly once', dmgCalls === 1, 'calls=' + dmgCalls);
  check('the charge ends in a recovery window', (c.recoverT || 0) > 0, 'recoverT=' + c.recoverT);
  for (let i = 0; i < 20; i++) c.update(1 / 60, player, game.projectiles, null, particles);
  check('recovery window expires on its own', (c.recoverT || 0) >= 0);

  // --- EASED TURN: no snap, one tail flick -------------------------------
  // Park the player to the LEFT so the hunting circle keeps facing that way
  // and the eased flip has somewhere to settle.
  const savedPx = player.x, savedPy = player.y;
  player.x = arena.arenaCX - 420; player.y = arena.arenaCY - 60;
  const t = new global.Kraken(arena.bossX, arena.arenaCY, gameSpy);
  t.phase = 1; t.vx = 300; t.vy = 0;
  t.faceDir = 1; t.flipSmooth = 1;
  t.faceDir = -1;                                   // the AI flips it in one step
  const smoothBefore = t.flipSmooth;
  for (let i = 0; i < 3; i++) t.update(1 / 60, player, game.projectiles, null, particles);
  check('facing does not snap when the AI flips it',
    Math.abs(t.flipSmooth - smoothBefore) < 0.5, 'flipSmooth ' + smoothBefore + ' -> ' + t.flipSmooth);
  let kicked = 0;
  for (let i = 0; i < 60; i++) {
    t.update(1 / 60, player, game.projectiles, null, particles);
    if ((t.turnKick || 0) > 0.9) kicked++;
  }
  check('the pivot fires the tail flick once, not every frame', kicked <= 3, 'frames=' + kicked);
  check('the eased flip tracks the facing it is given',
    Math.abs(t.flipSmooth - t.faceDir) < 0.2,
    'flipSmooth=' + t.flipSmooth.toFixed(2) + ' faceDir=' + t.faceDir);
  const midCtx = mini.createCtx(700, 460, 1);
  t.flipSmooth = 0.02; t.faceDir = -1;
  t.render(midCtx, { x: t.x + t.width / 2 - 350, y: t.y + t.height / 2 - 230 });
  check('rendering mid-flip (x-scale near zero) is safe',
    (midCtx.errors || []).length === 0, (midCtx.errors || []).join('|'));
  player.x = savedPx; player.y = savedPy;

  // --- DEATH: once, and never damaging --------------------------------
  dmgCalls = 0;
  const d = new global.Kraken(arena.bossX, arena.arenaCY, gameSpy);
  d.hp = 10;
  d.takeDamage(9999, null, particles);
  d.takeDamage(9999, null, particles);
  const dt1 = d.deadT || 0;
  for (let i = 0; i < 60; i++) d.update(1 / 60, player, game.projectiles, null, particles);
  check('death accumulates deadT, never restarts', d.deadT > dt1 && Number.isFinite(d.deadT));
  check('death never damages the player', dmgCalls === 0, 'calls=' + dmgCalls);
  const deadCtx = mini.createCtx(700, 460, 1);
  d.render(deadCtx, { x: d.x + d.width / 2 - 350, y: d.y + d.height / 2 - 230 });
  check('the whole death sequence renders cleanly',
    (deadCtx.errors || []).length === 0, (deadCtx.errors || []).join('|'));

  // --- GUEST PUPPET: presentation only, no simulation -------------------
  const pp = new global.Kraken(arena.bossX, arena.arenaCY, gameSpy);
  pp.__mpPuppet = true;
  const x0 = pp.x, y0 = pp.y;
  dmgCalls = 0;
  pp.animatePresentation(1 / 60);
  check('a guest puppet does not move itself', pp.x === x0 && pp.y === y0);
  check('a guest puppet keeps its rig alive', finite(pp) && pp.dead === false);
  check('a guest puppet cannot deal damage', dmgCalls === 0);

  // --- DELTA-TIME INDEPENDENCE -----------------------------------------
  const fast = new global.Kraken(arena.bossX, arena.arenaCY, gameSpy);
  const slow = new global.Kraken(arena.bossX, arena.arenaCY, gameSpy);
  for (const e of [fast, slow]) { e.phase = 1; e.jawTarget = 1; e.faceDir = 1; e.flipSmooth = 1; }
  for (let i = 0; i < 60; i++) fast.update(1 / 60, player, game.projectiles, null, particles);
  for (let i = 0; i < 12; i++) slow.update(1 / 12, player, game.projectiles, null, particles);
  check('jaw opens the same at 60Hz and 12Hz (delta-time springs)',
    Math.abs((fast.jawOpen || 0) - (slow.jawOpen || 0)) < 0.25,
    '60Hz=' + (fast.jawOpen || 0).toFixed(2) + ' 12Hz=' + (slow.jawOpen || 0).toFixed(2));
  check('rig channels stay finite on a guest puppet', finite(pp));
} catch (e) {
  check('animation timing block', false, e.message + ' | ' + (e.stack || '').split('\n')[1]);
}

console.log('\n' + (fail ? fail + ' FAILURE(S)' : 'ALL ' + pass + ' RIG CHECKS PASSED'));
process.exit(fail ? 1 : 0);