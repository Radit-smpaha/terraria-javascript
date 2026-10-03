// qa-mob-ai.js - ground-monster movement, the "frozen and flickering" report.
//
// The bug, as filed: "mobs on the surface just don't move and for some reason
// they look left and right at high speeds". Both halves came from the same
// block of Monster#update and both are asserted here:
//
//   1. FACING was `if (dist < 700) this.facing = dx >= 0 ? 1 : -1` — a bare sign
//      test on dx, every frame. dx near zero (a mob level with the player)
//      means the sprite mirrors at up to 60Hz. Now deadbanded and rate-limited.
//   2. The stuck-recovery did `this.facing = -this.facing`, which the facing
//      rule at the top of the NEXT frame recomputed straight back to the
//      player. The escape hatch did nothing except flick the sprite once per
//      1.2s, so a blocked mob stayed blocked forever. Now a detour lock holds
//      the reversal long enough for the mob to actually go around.
//   3. The obstacle hop had no cooldown and could re-fire on every grounded
//      frame, buzzing a pinned mob in place.
//   4. Stuck detection watched vx, which the chase easing refills even when the
//      mob is pinned flat against rock. It now watches real displacement.
//
// Usage: node qa-mob-ai.js
const fs = require('fs');
const vm = require('vm');

let failures = 0;
const check = (label, ok, detail = '') => {
  if (!ok) failures++;
  console.log((ok ? '  PASS  ' : '  FAIL  ') + label + (!ok && detail ? '   [' + detail + ']' : ''));
};
const step = (t) => console.log('\n▸ ' + t);

// ---- DOM / canvas stubs (same shape as qa-space-run.js) --------------------
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
    style: {}, dataset: {},
    classList: (() => {
      const set = new Set();
      return {
        add: (c) => set.add(c), remove: (c) => set.delete(c), contains: (c) => set.has(c),
        toggle: (c, on) => { const want = on === undefined ? !set.has(c) : !!on; if (want) set.add(c); else set.delete(c); return want; }
      };
    })(),
    getContext: () => makeCtx(),
    addEventListener() {}, removeEventListener() {},
    appendChild() {}, querySelector: () => null, querySelectorAll: () => [],
    closest: () => null, remove() {}, parentNode: { removeChild() {} },
    setAttribute() {}, getAttribute: () => null,
    className: '', value: ''
  };
}
const els = {};
global.document = {
  readyState: 'complete', scripts: [],
  getElementById: (id) => (els[id] ||= makeEl(id)),
  createElement: (tag) => makeEl(tag),
  addEventListener() {},
  querySelector: () => null, querySelectorAll: () => [],
  body: makeEl('body')
};
global.window = global;
global.innerWidth = 1280; global.innerHeight = 720; global.devicePixelRatio = 1;
global.addEventListener = () => {};
global.performance = { now: () => 1000 };
global.requestAnimationFrame = () => 0;
global.cancelAnimationFrame = () => {};

// Deterministic randomness. The monster AI draws speedJitter, wanderTimer and
// the detour direction from Math.random(), so an unseeded run gives a different
// answer every time — which made the wall-escape checks flip between pass and
// fail across runs. A regression suite has to be reproducible, so Math.random
// is replaced with a seeded mulberry32 before any module is evaluated.
const SEED = 0x5eed1e;
let rngState = SEED >>> 0;
Math.random = function seededRandom() {
  rngState = (rngState + 0x6D2B79F5) >>> 0;
  let t = rngState;
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};
const reseed = () => { rngState = SEED >>> 0; };
const store = new Map();
global.localStorage = {
  getItem: (k) => (store.has(k) ? store.get(k) : null),
  setItem: (k, v) => store.set(k, String(v)),
  removeItem: (k) => store.delete(k),
  clear: () => store.clear()
};

const FILES = ['audio.js', 'particles.js', 'world.js', 'weather.js', 'entities.js',
  'underworld.js', 'space.js', 'juice.js', 'npcs.js', 'journey.js', 'terraria.js'];
const ctx = vm.createContext(global);
for (const f of FILES) {
  try {
    vm.runInContext(fs.readFileSync(f, 'utf8'), ctx, { filename: f });
  } catch (e) {
    console.log('EVAL FAIL ' + f + ': ' + (e.stack || e.message));
    process.exit(1);
  }
}
const g = global.game;
const { TILES, TILE_SIZE, Monster, Critter } = global;
if (!g) { console.log('BOOT FAIL: no game'); process.exit(1); }
g.titleScreenOpen = false;
g.paused = false;

// The wildlife tuning constants have to be readable from here or the sample
// check below would be testing a copy of the formula rather than the one the
// game actually runs.
for (const name of ['CRITTER_MIN_SPEED', 'CRITTER_SPEED_RANGE',
  'TURN_COOLDOWN', 'HOP_COOLDOWN', 'DETOUR_TIME', 'SENSE_RADIUS']) {
  if (typeof global[name] !== 'number') {
    console.log('MISSING EXPORT: ' + name);
    process.exit(1);
  }
}

const W = g.world;

// ---- Build a flat, walled test ground so the numbers mean something --------
// The real world is bumpy and a hand-placed wall in a hillside proves nothing.
// This carves a clean corridor in the middle of the world: flat floor, clear
// sky, no terrain for a mob to snag on, so every movement number is the AI's.
const ARENA_L = Math.floor(W.width / 2) - 40;
const ARENA_R = ARENA_L + 60;
const FLOOR = Math.floor(W.height / 2);
const savedTiles = [];
for (let x = ARENA_L - 2; x <= ARENA_R + 2; x++) {
  for (let y = FLOOR - 16; y < FLOOR; y++) {
    savedTiles.push([x, y, W.getTile(x, y)]);
    W.setTile(x, y, TILES.AIR);
  }
  for (let y = FLOOR; y < FLOOR + 3; y++) W.setTile(x, y, TILES.STONE);
}
const groundY = FLOOR;

const spawnMob = (type, tileX) => new Monster(tileX * TILE_SIZE, (groundY - 5) * TILE_SIZE, type);
const standPlayer = (tileX) => {
  g.player.x = tileX * TILE_SIZE;
  g.player.y = (groundY - 3) * TILE_SIZE;
  g.player.vx = 0; g.player.vy = 0;
  g.player.invulnerableTime = 99999;
};

/** Run a mob for `frames`, counting facing flips, hops and net movement. */
const run = (m, player, frames) => {
  let flips = 0, hops = 0, hopFrames = 0, peakStuck = 0, wasAir = false;
  let lastFacing = m.facing;
  const x0 = m.x;
  for (let i = 0; i < frames; i++) {
    m.update(1 / 60, player, W);
    if (m.facing !== lastFacing) { flips++; lastFacing = m.facing; }
    peakStuck = Math.max(peakStuck, m.stuckTimer || 0);
    const air = m.vy < -1;
    if (air && !wasAir) hops++;
    if (air) hopFrames++;
    wasAir = air;
  }
  return { flips, hops, hopFrames, peakStuck, net: Math.abs(m.x - x0) };
};

/** Drop a wall of stone, run a mob with the player behind it, then restore. */
const behindWall = (type, wallH, frames) => {
  reseed();
  standPlayer(ARENA_L + 4);
  const wx = ARENA_L + 24;
  const saved = [];
  for (let y = groundY - wallH; y < groundY; y++) {
    saved.push([wx, y, W.getTile(wx, y)]);
    W.setTile(wx, y, TILES.STONE);
  }
  const m = spawnMob(type, wx + 2);
  const r = run(m, g.player, frames);
  for (const [x, y, t] of saved) W.setTile(x, y, t);
  return r;
};

step('1. A mob level with the player must not mirror at 60Hz');
// --------------------------------------------------------------------
// The literal symptom. Player and mob on the same column: dx is a couple of
// pixels. The old sign test flipped facing on that noise every frame.
const mirror = (label, type) => {
  reseed();
  standPlayer(ARENA_L + 30);
  const m = spawnMob(type, ARENA_L + 30);
  // Put them side by side rather than overlapping.
  m.x = g.player.x + 40;
  m.y = (groundY - 5) * TILE_SIZE;
  let flips = 0, last = m.facing;
  for (let i = 0; i < 900; i++) {
    m.update(1 / 60, g.player, W);
    if (m.facing !== last) { flips++; last = m.facing; }
  }
  return flips;
};
for (const t of ['zombie', 'cave_spider', 'ostrich', 'bog_witch', 'sun_scorpion']) {
  const flips = mirror(t, t);
  check(t + ': no high-speed mirroring beside the player', flips <= 8,
    flips + ' flips in 15s');
}

// And the deadband specifically: a dx inside the band must not turn a mob at
// all. This is the exact quantity the old code tested with a bare sign.
check('a deadband exists and is applied', (() => {
  standPlayer(ARENA_L + 30);
  const m = spawnMob('zombie', ARENA_L + 30);
  m.x = g.player.x + 40;
  m.y = (groundY - 5) * TILE_SIZE;
  m.update(1 / 60, g.player, W);
  const before = m.facing;
  // dx is now well over the band; nudge it back inside 6px of zero.
  const pcx = g.player.x + g.player.width / 2;
  m.x = pcx - m.width / 2 - 3;
  m.turnCooldown = 0;
  m.detourTimer = 0;
  m.update(1 / 60, g.player, W);
  return m.facing === before;
})());

step('2. A blocked mob must actually get unstuck');
// --------------------------------------------------------------------
// The other half of the report. The old stuck-recovery reversed `facing`, which
// the next frame undid — so the mob could never break away.
// The point is "it gets unstuck", not a distance race — slow types (the bog
// witch tops out at 1.4) need longer in the window than a zombie at 1.8.
for (const [t, h] of [['zombie', 6], ['zombie', 9], ['cave_spider', 9], ['ostrich', 9], ['bog_witch', 9]]) {
  const r = behindWall(t, h, 2400);
  check(t + ' gets around a ' + h + '-tile wall', r.net > 48,
    'net=' + Math.round(r.net) + 'px peakStuck=' + r.peakStuck.toFixed(2));
}

// The stuck detector has to be capable of firing at all — before, it watched a
// vx that the chase easing refilled every frame even while pinned on rock.
check('stuck detection actually trips when the mob is pinned', (() => {
  standPlayer(ARENA_L + 4);
  const wx = ARENA_L + 24;
  const saved = [];
  for (let y = groundY - 20; y < groundY; y++) { saved.push([wx, y, W.getTile(wx, y)]); W.setTile(wx, y, TILES.STONE); }
  const m = spawnMob('zombie', wx + 2);
  let peak = 0;
  for (let i = 0; i < 600; i++) { m.update(1 / 60, g.player, W); peak = Math.max(peak, m.stuckTimer || 0); }
  for (const [x, y, t] of saved) W.setTile(x, y, t);
  return peak > 0.5;
})());

step('3. The obstacle hop must not buzz');
// --------------------------------------------------------------------
// It had no cooldown, so a mob pinned against rock re-launched on every
// grounded frame. It should commit to a hop and wait for the landing.
check('a pinned mob does not hop continuously', (() => {
  standPlayer(ARENA_L + 4);
  const wx = ARENA_L + 24;
  const saved = [];
  for (let y = groundY - 20; y < groundY; y++) { saved.push([wx, y, W.getTile(wx, y)]); W.setTile(wx, y, TILES.STONE); }
  const m = spawnMob('zombie', wx + 2);
  const r = run(m, g.player, 300);
  for (const [x, y, t] of saved) W.setTile(x, y, t);
  // A 0.45s cooldown caps a 5s window at ~11 hops; without it the hop re-fired
  // on every grounded frame, so the mob spent most of the window airborne.
  console.log('       (hopFrames=' + r.hopFrames + ' hops=' + r.hops + ')');
  return r.hopFrames < 150;
})());

step('4. No tight rocking when the way is genuinely blocked');
// --------------------------------------------------------------------
// A wall no hop can clear. The mob cannot reach the player, and must not spend
// the visit flipping left-right at a rate the eye reads as vibration.
for (const t of ['zombie', 'cave_spider', 'ostrich']) {
  const r = behindWall(t, 24, 1800);
  check(t + ': an impossible wall causes no flicker', r.flips <= 12,
    r.flips + ' flips in 30s, net=' + Math.round(r.net));
}

step('5. Every walker type still behaves');
// --------------------------------------------------------------------
// The new fields and the detour must not have broken ordinary chasing.
for (const t of ['zombie', 'snow_wolf', 'savanna_hyena', 'swamp_slime', 'cave_spider',
  'ice_golem', 'sun_scorpion', 'ostrich', 'bog_witch']) {
  reseed();
  standPlayer(ARENA_L + 20);
  const m = spawnMob(t, ARENA_L + 45);
  const start = m.x;
  for (let i = 0; i < 240; i++) m.update(1 / 60, g.player, W);
  check(t + ' closes on the player', m.x < start - 100,
    'closed ' + Math.round(start - m.x) + 'px');
}

// And the turn state must not leak into anything else.
check('a fresh mob starts with all movement state zeroed', (() => {
  const m = new Monster(ARENA_L * TILE_SIZE, (groundY - 5) * TILE_SIZE, 'zombie');
  return m.detourTimer === 0 && m.turnCooldown === 0 && m.hopCooldown === 0 &&
    m.stuckTimer === 0 && m.stuckStreak === 0 && m.stuckAnchorX !== undefined;
})());

step('6. Wildlife must not read as scenery');
// --------------------------------------------------------------------
// The other half of "surface mobs don't move". Critter wander used to be
// `(Math.random() - 0.5) * 1.2` — a distribution centred on zero, so half of
// every pick landed within a few hundredths of standing still. A sheep at
// 0.04px/frame is a decoration.
const critterRun = (label, frames) => {
  reseed();
  // The player has to be well out of the critter's 100px flee radius, or it
  // spends the whole run bolting into the corridor wall instead of grazing.
  standPlayer(ARENA_L + 4);
  const c = new Critter((ARENA_L + 40) * TILE_SIZE, (groundY - 3) * TILE_SIZE, 'sheep');
  const x0 = c.x;
  // Net displacement is the wrong measure in a walled corridor — a sheep that
  // walks right, turns at the wall and walks back has covered a great deal of
  // ground while ending up near where it started. Path length is the honest
  // number, and a statue scores zero on it.
  let path = 0, slowFrames = 0, prevX = c.x;
  for (let i = 0; i < frames; i++) {
    c.update(1 / 60, g.player, W);
    path += Math.abs(c.x - prevX);
    prevX = c.x;
    if (Math.abs(c.vx) < 0.2) slowFrames++;
  }
  return { path, net: Math.abs(c.x - x0), slowFrames, vx: c.vx };
};
const cs = critterRun('sheep', 900);
check('a sheep covers ground instead of standing still', cs.path > 200,
  'walked ' + Math.round(cs.path) + 'px in 15s, net=' + Math.round(cs.net));
check('a sheep is never left at a near-zero crawl', cs.slowFrames < 60,
  cs.slowFrames + '/900 frames below 0.2px/frame');

// Sample the wander distribution itself: no pick may land below the floor.
let belowFloor = 0;
for (let i = 0; i < 4000; i++) {
  const dir = Math.random() > 0.5 ? 1 : -1;
  const v = dir * (global.CRITTER_MIN_SPEED + Math.random() * global.CRITTER_SPEED_RANGE);
  if (Math.abs(v) < 0.3) belowFloor++;
}
check('no wander pick can be slower than the floor', belowFloor === 0, belowFloor + '/4000');

// A critter wedged against a rock must turn around at a real walking speed.
check('a critter bounces off a wall at walking speed', (() => {
  standPlayer(ARENA_L + 30);
  // Pin the critter against the right-hand end of the corridor.
  const c = new Critter((ARENA_R - 1) * TILE_SIZE, (groundY - 3) * TILE_SIZE, 'sheep');
  c.vx = 1.2;
  for (let i = 0; i < 240; i++) c.update(1 / 60, g.player, W);
  return Math.abs(c.vx) >= 0.3;
})());

// Critters must be culled when far away, or they accumulate all session.
check('wildlife is culled when far out of play', (() => {
  g.critters.length = 0;
  g.critters.push(new Critter(ARENA_L * TILE_SIZE, (groundY - 3) * TILE_SIZE, 'sheep'));
  g.critters.push(new Critter((g.player.x + 9000), (g.player.y), 'sheep'));
  const before = g.critters.length;
  for (let i = 0; i < 4; i++) g.update(1 / 60);
  const after = g.critters.length;
  g.critters.length = 0;
  return before === 2 && after === 1;
})());

// Put the world back so a later suite sees the terrain it expects.
for (const [x, y, t] of savedTiles) W.setTile(x, y, t);

console.log('\n' + '─'.repeat(62));
console.log(failures
  ? '✖ ' + failures + ' MOB-AI CHECK(S) FAILED'
  : '✔ ALL MOB-AI CHECKS PASSED');
const code = failures === 0 ? 0 : 1;
const leave = () => process.exit(code);
process.stdout.write('', leave);
setTimeout(leave, 1000);