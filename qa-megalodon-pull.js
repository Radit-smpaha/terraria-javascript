// qa-megalodon-pull.js — the Megalodon's suction can never embed the player
// in solid rock or drag them outside the map.
//
// The vortex (SHARKNADO), the devouring-maw suction and the phase-2 turbulent
// currents all used to write target.x/target.y directly. Those raw writes
// bypassed the physics solver, so the pulls shoved the player straight through
// arena benches, reef walls and the world border: stuck inside blocks with no
// velocity left to resolve, or outside the map where the camera could never
// follow. Every pull now goes through Megalodon._pullTarget, and the player
// physics has an unstick safety net; this test drives the real boss update
// against a walled stage and asserts the invariants every frame, with a
// negative control proving the suction still pulls when unobstructed.
//
// Usage: node qa-megalodon-pull.js
const fs = require('fs');
const vm = require('vm');

let failures = 0;
const check = (label, ok, detail = '') => {
  if (!ok) failures++;
  console.log((ok ? '  PASS ' : '  FAIL ') + label + (!ok && detail ? '  — ' + detail : ''));
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
      const set = new Set();
      return {
        add: (c) => set.add(c), remove: (c) => set.delete(c),
        contains: (c) => set.has(c),
        toggle: (c, on) => { const w = on === undefined ? !set.has(c) : !!on; if (w) set.add(c); else set.delete(c); return w; }
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
const store = new Map();
global.localStorage = {
  getItem: (k) => (store.has(k) ? store.get(k) : null),
  setItem: (k, v) => store.set(k, String(v)),
  removeItem: (k) => store.delete(k),
  clear: () => store.clear()
};

const files = ['audio.js', 'particles.js', 'world.js', 'weather.js', 'entities.js',
  'underworld.js', 'space.js', 'ocean.js', 'juice.js', 'npcs.js', 'journey.js', 'multiplayer.js', 'terraria.js'];
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
const { ITEMS, TILES, TILE_SIZE, Megalodon } = global;
if (!g) { console.log('BOOT FAIL: no game'); process.exit(1); }
if (typeof Megalodon !== 'function') { console.log('BOOT FAIL: no Megalodon'); process.exit(1); }

// ---- stage helpers ----------------------------------------------------------
const W = g.world;
/** True when any tile the player AABB overlaps is solid rock. */
function embedded(player) {
  const x0 = Math.floor(player.x / TILE_SIZE), x1 = Math.floor((player.x + player.width - 1) / TILE_SIZE);
  const y0 = Math.floor(player.y / TILE_SIZE), y1 = Math.floor((player.y + player.height - 1) / TILE_SIZE);
  for (let ty = y0; ty <= y1; ty++)
    for (let tx = x0; tx <= x1; tx++)
      if (W.isSolid(tx, ty)) return true;
  return false;
}
function outOfBounds(player) {
  return player.x < 0 || player.y < 0 ||
    player.x + player.width > W.pixelWidth || player.y + player.height > W.pixelHeight;
}
/** A walled test box in open air, with optional solid walls on each side. */
function buildStage({ px, py, wallLeft = 0, wallRight = 0 }) {
  for (let x = px - 10; x <= px + 12; x++)
    for (let y = py - 8; y <= py + 8; y++) W.setTile(x, y, TILES.AIR);
  for (let y = py - 8; y <= py + 8; y++) {
    for (let i = 1; i <= wallRight; i++) W.setTile(px + i, y, TILES.STONE);
    for (let i = 1; i <= wallLeft; i++) W.setTile(px - i, y, TILES.STONE);
  }
}
function freshPlayer(px, py) {
  const p = g.player;
  p.x = px * TILE_SIZE;
  p.y = py * TILE_SIZE;
  p.vx = 0; p.vy = 0;
  p.hp = p.maxHp = 1000000;
  p.invulnerableTime = 0;
  return p;
}
function newShark(px, py) {
  const m = new Megalodon(px * TILE_SIZE, py * TILE_SIZE, g);
  m.hp = m.maxHp = 1000000;
  m.dash = null;
  m.pending = null;
  m.hunt = null;
  m.rushLeft = 0;
  return m;
}

const DT = 1 / 60;

// ---- 1. SHARKNADO vortex against a wall -------------------------------------
console.log('\n== vortex pulls INTO a solid wall ==');
{
  const px = 60, py = 20;
  buildStage({ px, py, wallRight: 3 });
  const p = freshPlayer(px, py);
  // The shark spins on the far side of the wall: every pull points INTO rock.
  const m = newShark(px + 6, py);
  let worst = 0, oob = false;
  for (let f = 0; f < 180; f++) {
    m.tornadoT = 1;                    // keep the spin alive across the run
    m.update(DT, p, g.projectiles, g.sound, g.particles);
    if (embedded(p)) worst++;
    if (outOfBounds(p)) oob = true;
  }
  check('vortex never embeds the player in the wall', worst === 0, worst + ' embedded frames');
  check('vortex never leaves the player outside the map', !oob);
  m.tornadoT = 0;
  g.boss = null;
}

// ---- 2. Devouring-maw suction against a wall --------------------------------
console.log('\n== devouring-maw suction INTO a solid wall ==');
{
  const px = 60, py = 20;
  buildStage({ px, py, wallRight: 3 });
  const p = freshPlayer(px, py);
  const m = newShark(px + 6, py);
  // Arm the maw wind-up on the far side of the wall, suction live for 0.9s.
  m.pending = {
    type: 'devouring_maw',
    x: (px + 6) * TILE_SIZE, y: py * TILE_SIZE,
    radius: 200, timer: 0.9, total: 0.9
  };
  let worst = 0;
  for (let f = 0; f < 90; f++) {
    if (!m.pending) m.pending = {
      type: 'devouring_maw',
      x: (px + 6) * TILE_SIZE, y: py * TILE_SIZE,
      radius: 200, timer: 0.9, total: 0.9
    };
    m.update(DT, p, g.projectiles, g.sound, g.particles);
    if (embedded(p)) worst++;
    if (outOfBounds(p)) worst++;
  }
  check('maw suction never embeds the player in the wall', worst === 0, worst + ' bad frames');
  m.pending = null;
  g.boss = null;
}

// ---- 3. Pull at the world edge cannot leave the map -------------------------
console.log('\n== vortex at the world edge keeps the player inside the map ==');
{
  // Stand the player against the last column of the world, shark outside-left
  // of them against the border so the pull drags toward the edge.
  const px = W.width - 3, py = 20;
  buildStage({ px, py, wallLeft: 2 });
  const p = freshPlayer(px, py);
  const m = newShark(px - 5, py);
  m.x = Math.min(m.x, W.pixelWidth - m.width - TILE_SIZE);
  let oob = 0;
  for (let f = 0; f < 180; f++) {
    m.tornadoT = 1;
    m.update(DT, p, g.projectiles, g.sound, g.particles);
    if (outOfBounds(p)) oob++;
    if (embedded(p)) oob++;
  }
  check('edge-of-map vortex keeps the player in bounds', oob === 0, oob + ' out-of-bounds frames');
  m.tornadoT = 0;
  g.boss = null;
}

// ---- 4. Unstick safety net for any direct position write --------------------
console.log('\n== physics unstick net ==');
{
  const px = 60, py = 20;
  buildStage({ px, py, wallRight: 3 });
  const p = freshPlayer(px, py);
  // Simulate the worst case: something shoved the player INSIDE solid rock.
  p.x = (px + 1) * TILE_SIZE;
  p.y = py * TILE_SIZE;
  check('player starts embedded inside stone', embedded(p));
  p.resolveWorldCollisions(W, false);
  check('one physics step frees the embedded player', !embedded(p) && !outOfBounds(p));

  // Outside the map entirely.
  p.x = -80; p.y = py * TILE_SIZE;
  p.resolveWorldCollisions(W, false);
  check('a player outside the map is clamped back in', !outOfBounds(p) && !embedded(p));

  // Standing on flat ground must NOT be disturbed by the unstick check.
  buildStage({ px, py });
  W.setTile(px, py + 1, TILES.GRASS);
  // Feet flush on top of the grass tile: exactly where the solver parks a
  // standing player, one pixel clear of the block.
  const restX = px * TILE_SIZE, restY = (py + 1) * TILE_SIZE - p.height;
  freshPlayer(px, py);
  p.y = restY;
  p.vx = 0; p.vy = 0;
  p.resolveWorldCollisions(W, false);
  check('a normally standing player is never moved by the net',
    Math.abs(p.x - restX) < 0.001 && Math.abs(p.y - restY) < 0.001,
    'moved to ' + p.x + ',' + p.y);
}

// ---- 5. Negative control: the suction still pulls in open water -------------
console.log('\n== suction still pulls in open water (negative control) ==');
{
  const px = 60, py = 20;
  buildStage({ px, py });
  const p = freshPlayer(px, py);
  // Shark 200px to the RIGHT of the player, nothing between them.
  const m = newShark(px + Math.round(200 / TILE_SIZE), py);
  const startX = p.x, startY = p.y;
  for (let f = 0; f < 90; f++) {
    m.tornadoT = 1;
    m.update(DT, p, g.projectiles, g.sound, g.particles);
  }
  const moved = Math.hypot(p.x - startX, p.y - startY);
  const towardShark = p.x > startX;   // shark sits to the RIGHT of the player
  m.tornadoT = 0;
  check('open-water vortex drags the player toward the shark', moved > 40 && towardShark,
    'moved ' + Math.round(moved) + 'px ' + (towardShark ? 'right' : 'LEFT (away!)'));
  check('open-water vortex still never embeds the player', !embedded(p) && !outOfBounds(p));
  g.boss = null;
}

console.log(failures ? '\nFAILING CHECKS: ' + failures : '\nMEGALODON-PULL CHECK PASSED');
process.exit(failures ? 1 : 0);
