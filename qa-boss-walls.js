// qa-boss-walls.js - bosses cannot be hit through a solid wall.
//
// The melee arc used to test only distance and angle, so a player could stand
// on the far side of solid rock and beat a boss to death through it. This
// asserts BOTH directions with a negative control: the same swing with a clear
// line of sight must still connect, so the test cannot pass by disabling the
// weapon entirely.
//
// Usage: node qa-boss-walls.js
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
        toggle: (c, on) => { const w = on === undefined ? !set.has(c) : !!on; w ? set.add(c) : set.delete(c); return w; }
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
const { ITEMS, TILES, TILE_SIZE } = global;
if (!g) { console.log('BOOT FAIL: no game'); process.exit(1); }

// ---- helpers ---------------------------------------------------------------
function equipSword(id) {
  g.inventory[0] = { id, count: 1 };
  g.player.selectedSlot = 0;
  g.attackCooldown = 0;
}
/** Clear a wide box to AIR so we control exactly where walls are. */
function clearAir(x0, y0, x1, y1) {
  for (let x = x0; x <= x1; x++) for (let y = y0; y <= y1; y++) g.world.setTile(x, y, TILES.AIR);
}

const sword = 'cursed_edge'; // a strong, plain melee weapon (no hitsAll)
check('test sword exists and is melee', !!(ITEMS[sword] && ITEMS[sword].weaponType === 'melee'));

// Place the player and boss on a flat clear stretch, then optionally wall it.
function setup({ wall }) {
  const px = 60, py = 20;                 // tiles
  clearAir(px - 6, py - 6, px + 20, py + 6);
  g.player.x = px * TILE_SIZE;
  g.player.y = py * TILE_SIZE;
  g.player.vx = 0; g.player.vy = 0;
  g.player.hp = g.player.maxHp = 100000;
  g.player.facing = 1;

  // The boss sits 2 tiles to the right - CLOSE enough for the melee arc to reach
  // it (the sword's reach is ~3.4 tiles), so the only thing that can stop the
  // hit is the wall. Anything further and a failure would prove nothing.
  const bx = px + 2;
  const boss = new global.Monster(g.player.x + 9999, g.player.y, 'zombie');
  boss.x = bx * TILE_SIZE;
  boss.y = py * TILE_SIZE;
  boss.hp = boss.maxHp = 100000;          // survives so we can read the damage
  g.boss = boss;

  if (wall) {
    // A full-height solid wall between player and boss.
    for (let y = py - 8; y <= py + 8; y++) g.world.setTile(px + 1, y, TILES.STONE);
  }

  // Aim straight at the boss's centre and swing.
  g.input.mouseX = (boss.x + boss.width / 2) - g.camera.x;
  g.input.mouseY = (boss.y + boss.height / 2) - g.camera.y;
  const before = boss.hp;
  g.attackCooldown = 0;
  const pMidX = g.player.x + g.player.width / 2;
  const pMidY = g.player.y + g.player.height / 2;
  const bMidX = boss.x + boss.width / 2;
  const bMidY = boss.y + boss.height / 2;
  const held = g.inventory[g.player.selectedSlot];
  const info = {
    held: held && held.id,
    reach: held && ITEMS[held.id] && ITEMS[held.id].range,
    dist: Math.hypot(bMidX - pMidX, bMidY - pMidY)
  };
  g.handleLeftClick();
  const dealt = before - boss.hp;
  g.boss = null;
  return { dealt, info };
}

console.log('\n== no wall: the swing must connect (negative control) ==');
equipSword(sword);
const openResult = setup({ wall: false });
check('a clear-line swing damages the boss (negative control)', openResult.dealt > 0,
  'dealt=' + openResult.dealt + ' at ' + Math.round(openResult.info.dist) + 'px, reach ' + openResult.info.reach);

console.log('\n== with a solid wall between: no damage ==');
equipSword(sword);
const wallResult = setup({ wall: true });
check('a swing through a solid wall does NOT damage the boss', wallResult.dealt === 0,
  'dealt=' + wallResult.dealt + ' at the same ' + Math.round(wallResult.info.dist) + 'px distance');

// ---- projectiles must respect the same cover ----------------------------
// An arrow that dies against the near face of a wall must not splash the boss
// on the far face. Fire straight at the boss through the wall and require the
// boss to walk away unhurt (the arrow itself dies on the rock either way).
console.log('\n== with a solid wall between: arrows do not splash through ==');
equipSword(sword);
{
  const px = 60, py = 20;
  clearAir(px - 6, py - 6, px + 20, py + 6);
  g.player.x = px * TILE_SIZE;
  g.player.y = py * TILE_SIZE;
  g.player.vx = 0; g.player.vy = 0;
  g.player.hp = g.player.maxHp = 100000;
  g.player.facing = 1;
  const bx = px + 4;
  const boss = new global.Monster(g.player.x + 9999, g.player.y, 'zombie');
  boss.x = bx * TILE_SIZE;
  boss.y = py * TILE_SIZE;
  boss.hp = boss.maxHp = 100000;
  g.boss = boss;
  // Full-height solid wall between the shooter and the boss.
  for (let y = py - 8; y <= py + 8; y++) g.world.setTile(px + 2, y, TILES.STONE);
  const before = boss.hp;
  // A fast arrow aimed dead at the boss's centre: several frames of travel so
  // it genuinely meets the wall, then the game loop resolves the hit.
  g.projectiles.length = 0;
  const sMidX = g.player.x + g.player.width / 2;
  const sMidY = g.player.y + g.player.height / 2;
  const bMidX = boss.x + boss.width / 2;
  const bMidY = boss.y + boss.height / 2;
  const dx = bMidX - sMidX, dy = bMidY - sMidY;
  const len = Math.hypot(dx, dy) || 1;
  g.projectiles.push(new global.Projectile(sMidX, sMidY,
    (dx / len) * 12, (dy / len) * 12, 'arrow', 40, false, 3.0));
  for (let f = 0; f < 30 && g.projectiles.length; f++) {
    try { g.update(1 / 60); } catch (_) { break; }
  }
  const dealt = before - g.boss.hp;
  check('an arrow through a solid wall does NOT damage the boss', dealt === 0,
    'dealt=' + dealt);
  g.boss = null;
  g.projectiles.length = 0;
  // Leave the arena clean for the line-of-sight probes below.
  clearAir(px - 6, py - 6, px + 20, py + 6);
}

// ---- bombs must respect the same cover -----------------------------------
// A blast aimed at a wall face the thrower cannot see past must not leak
// through to the boss behind it.
console.log('\n== with a solid wall between: bombs do not leak through ==');
equipSword(sword);
{
  const px = 60, py = 20;
  clearAir(px - 6, py - 6, px + 20, py + 6);
  g.player.x = px * TILE_SIZE;
  g.player.y = py * TILE_SIZE;
  g.player.vx = 0; g.player.vy = 0;
  g.player.hp = g.player.maxHp = 100000;
  g.player.facing = 1;
  const boss = new global.Monster(g.player.x + 9999, g.player.y, 'zombie');
  boss.x = (px + 3) * TILE_SIZE;
  boss.y = py * TILE_SIZE;
  boss.hp = boss.maxHp = 100000;
  g.boss = boss;
  for (let y = py - 8; y <= py + 8; y++) g.world.setTile(px + 2, y, TILES.STONE);
  g.inventory[g.player.selectedSlot] = { id: 'bomb', count: 1 };
  // Aim the blast AT the boss: dead-centre, well within the 105px radius, but
  // with the wall squarely between the thrower and the target.
  g.input.mouseX = (boss.x + boss.width / 2) - g.camera.x;
  g.input.mouseY = (boss.y + boss.height / 2) - g.camera.y;
  g.attackCooldown = 0;
  const before = boss.hp;
  try { g.useBomb(); } catch (_) {}
  const dealt = before - boss.hp;
  check('a bomb through a solid wall does NOT damage the boss', dealt === 0,
    'dealt=' + dealt);
  g.boss = null;
  clearAir(px - 6, py - 6, px + 20, py + 6);
  equipSword(sword);
}

console.log('\n== bossLineOfSight itself ==');
const w = g.world;
const cx = 300, cy = 20 * TILE_SIZE;
clearAir(8, 12, 30, 28);
w.setTile(14, 20, TILES.AIR);
check('clear air is line of sight', g.bossLineOfSight(10 * TILE_SIZE, 20 * TILE_SIZE, 18 * TILE_SIZE, 20 * TILE_SIZE) === true);
w.setTile(14, 20, TILES.STONE);
check('a solid tile blocks line of sight', g.bossLineOfSight(10 * TILE_SIZE, 20 * TILE_SIZE, 18 * TILE_SIZE, 20 * TILE_SIZE) === false);
w.setTile(14, 20, TILES.WOOD_PLATFORM);
check('a walk-through platform is NOT cover', g.bossLineOfSight(10 * TILE_SIZE, 20 * TILE_SIZE, 18 * TILE_SIZE, 20 * TILE_SIZE) === true);
w.setTile(14, 20, TILES.AIR);

console.log(failures ? '\nFAILING CHECKS: ' + failures : '\nBOSS-WALL CHECK PASSED');
process.exit(failures ? 1 : 0);
