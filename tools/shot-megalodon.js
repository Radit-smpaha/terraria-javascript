// ============================================================================
// shot-megalodon.js — renders the real Megalodon.render() through the
// mini-canvas rasterizer so the MODEL and ANIMATION can be inspected without a
// browser. Produces tools/shots/*.png.
//   usage: powershell -File tools/run-node.ps1 tools/shot-megalodon.js [scenario]
// scenarios: swim bite dash frenzy apex exhaust vanish spine contact
// ============================================================================
'use strict';
const fs = require('fs');
const vm = require('vm');
const mini = require('./mini-canvas.js');

const ROOT = require('path').join(__dirname, '..');
process.chdir(ROOT);

// ---------------------------------------------------------------- DOM stubs
function makeEl(id) {
  return {
    id, width: 800, height: 600, textContent: '', innerHTML: '',
    style: {}, dataset: {},
    classList: (() => { const s = new Set(); return { add: c => s.add(c), remove: c => s.delete(c), contains: c => s.has(c), toggle: () => false }; })(),
    getContext: () => null,
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
try { global.navigator = { userAgent: 'node' }; } catch (e) { /* electron: read-only */ }

const scripts = ['audio.js', 'particles.js', 'world.js', 'weather.js', 'entities.js',
  'underworld.js', 'juice.js', 'npcs.js', 'journey.js', 'multiplayer.js', 'space.js',
  'ocean.js'];
for (const f of scripts) {
  vm.runInThisContext(fs.readFileSync(f, 'utf8'), { filename: f });
}

// ------------------------------------------------------------- fake game
const world = new global.World(440, 175, 12345);
const arena = world.generateOceanPlanet();
const game = {
  world, titleScreenOpen: false, paused: false,
  player: { x: arena.arenaCX + 420, y: arena.arenaCY - 60, width: 24, height: 40, hp: 100 },
  projectiles: [],
  particles: new global.ParticleSystem(),
  sound: null, feel: null, buffs: { add() {} },
  damagePlayer() {}, isDead: false, camera: { x: 0, y: 0 }
};

// ------------------------------------------------------------ scene paint
function paintBackground(ctx, W, H) {
  // Deep-water column, approximated with flat bands plus one light shaft.
  const bands = [
    ['#050b18', 0.00, 0.18], ['#071224', 0.18, 0.42],
    ['#08182c', 0.42, 0.66], ['#0a1e36', 0.66, 0.84], ['#0b2440', 0.84, 1.00]
  ];
  for (const [c, a, b] of bands) {
    ctx.fillStyle = c;
    ctx.fillRect(0, H * a, W, H * (b - a) + 1);
  }
  ctx.globalAlpha = 0.10;
  ctx.fillStyle = '#7dd3fc';
  ctx.beginPath();
  ctx.moveTo(W * 0.16, 0); ctx.lineTo(W * 0.30, 0);
  ctx.lineTo(W * 0.52, H); ctx.lineTo(W * 0.30, H);
  ctx.closePath(); ctx.fill();
  ctx.globalAlpha = 1;
  // Arena floor
  const floorY = H * 0.86;
  ctx.fillStyle = '#1b2a3a';
  ctx.fillRect(0, floorY, W, H - floorY);
  ctx.fillStyle = '#24384c';
  ctx.fillRect(0, floorY, W, 6);
  ctx.fillStyle = 'rgba(125, 211, 252, 0.05)';
  for (let i = 0; i < 26; i++) {
    ctx.fillRect((i * 97) % W, 40 + ((i * 61) % Math.floor(floorY - 60)), 2, 2);
  }
}
function paintPlayer(ctx, px, py, pw, ph) {
  // scale reference: the real player is 24x40 — the shark dwarfs them
  ctx.fillStyle = '#4ade80';
  ctx.fillRect(px, py + ph * 0.42, pw, ph * 0.58);
  ctx.fillStyle = '#facc15';
  ctx.fillRect(px - 1, py + ph * 0.30, pw + 2, ph * 0.16);
  ctx.fillStyle = '#fca5a5';
  ctx.fillRect(px + pw * 0.2, py, pw * 0.6, ph * 0.3);
  ctx.fillStyle = '#1e293b';
  ctx.fillRect(px + pw * 0.55, py + ph * 0.1, 2, 2);
  ctx.strokeStyle = '#94a3b8'; ctx.lineWidth = 1;
  ctx.strokeRect(px - 40, py - 30, pw + 80, ph + 40);
  ctx.fillStyle = '#94a3b8'; ctx.font = '10px monospace';
  ctx.fillText('player 24x40 (real scale)', px - 40, py - 34);
}

const W = 1180, H = 780;
const boss = new global.Kraken(arena.bossX, arena.bossY, game);
const CX = W / 2, CY = H / 2 - 40;

function resetBoss() {
  boss.phase = 1; boss.hp = boss.maxHp; boss.dead = false;
  boss.vanishT = 0; boss.exhaustT = 0; boss.hunt = null; boss.pending = null;
  boss.faceDir = 1; boss.jawTarget = 0.12; boss.stainPools.length = 0;
  boss.hitFlash = 0; boss.phaseFlash = 0; boss.dash = null;
  boss.tailSwing = 22; boss.swimPhase = 2.3; boss.animT = 6.2;
  // Prime every spring to a steady state so shots look mid-motion, not boot.
  for (let i = 0; i < 90; i++) boss.update(1 / 60, game.player, game.projectiles, null, game.particles);
  // THEN pin the pose: update() orbits the hunt around the player, which is
  // pointless for a portrait — the springs stay primed, the body stays framed.
  boss.x = CX - boss.width / 2;
  boss.y = CY - boss.height / 2;
  boss.vx = 260; boss.vy = 40; boss.pitch = 0; boss.lean = 0;
  boss.sway = 0; boss.bob = 0; boss.surge = 0.5; boss.jawOpen = boss.jawTarget || 0.12;
}
function shot(name, mutate, zoom) {
  zoom = zoom || 1;
  resetBoss();
  if (mutate) mutate(boss, game);
  const ctx = mini.createCtx(W, H, 2);
  paintBackground(ctx, W, H);
  const cv = ctx.canvas.__cv;
  const snap = cv.buf.slice();
  if (zoom > 1) {
    // Frame the camera on the head, then blow it up around the canvas centre.
    const headX = boss.x + boss.width * 0.80;
    const headY = boss.y + boss.height * 0.52;
    ctx.save();
    ctx.translate(W / 2, H / 2);
    ctx.scale(zoom, zoom);
    boss.render(ctx, { x: headX, y: headY });
    ctx.restore();
  } else {
    boss.render(ctx, { x: 0, y: 0 });
  }
  // coverage report: where did the boss change pixels?
  let minX = 1e9, minY = 1e9, maxX = -1e9, maxY = -1e9, n = 0;
  for (let y = 0; y < cv.H; y++) for (let x = 0; x < cv.W; x++) {
    const o = (y * cv.W + x) * 4;
    if (Math.abs(cv.buf[o] - snap[o]) > 2 || Math.abs(cv.buf[o + 3] - snap[o + 3]) > 2) {
      n++; if (x < minX) minX = x; if (x > maxX) maxX = x; if (y < minY) minY = y; if (y > maxY) maxY = y;
    }
  }
  console.log(name + ': boss pixels=' + n + ' bbox=(' + (minX / cv.ss | 0) + ',' + (minY / cv.ss | 0) + ')-(' +
    (maxX / cv.ss | 0) + ',' + (maxY / cv.ss | 0) + ') world=(' + (boss.x | 0) + ',' + (boss.y | 0) + ') center=(' +
    ((boss.x + boss.width / 2) | 0) + ',' + ((boss.y + boss.height / 2) | 0) + ')');
  if (game.particles && game.particles.render) game.particles.render(ctx, { x: 0, y: 0 });
  paintPlayer(ctx, CX + 300, CY + 26, 24, 40);
  if (!fs.existsSync('tools/shots')) fs.mkdirSync('tools/shots');
  const errs = mini.writePNG(ctx, 'tools/shots/' + name + '.png');
  console.log(name + '.png  errors=' + (errs.length ? errs.join('|') : 'none'));
}

const scenes = {
  swim(b) { b.phase = 1; },
  bite(b) { b.phase = 1; b.jawTarget = 1; b.jawOpen = 1; b.pending = { type: 'crushing_bite', timer: 0.3, total: 0.7 }; },
  dash(b) { b.phase = 2; b.dash = { vx: 1500, vy: 120, t: 0.3, dmg: 120, kind: 'hunt_dash', hit: true }; b.vx = 1500; b.vy = 120; b.surge = 1; },
  frenzy(b) { b.phase = 2; b.hp = boss.maxHp * 0.5; b.jawTarget = 0.9; b.frenzy = 3; },
  apex(b) { b.phase = 3; b.hp = boss.maxHp * 0.18; b.jawTarget = 0.75; b.skillGlow = 1; },
  exhaust(b) { b.phase = 3; b.hp = boss.maxHp * 0.12; b.exhaustT = 3; b.jawTarget = 0.65; b.vx = 0; b.vy = 0; b.dash = null; },
  vanish(b) { b.phase = 3; b.hp = boss.maxHp * 0.18; b.vanishT = 0.8; b.jawTarget = 1; },
  spine(b) { b.phase = 1; },
  // head close-ups: 3x zoom framed on the snout
  head(b) { b.phase = 1; b.jawTarget = 0.35; b.jawOpen = 0.35; },
  headopen(b) { b.phase = 1; b.jawTarget = 1; b.jawOpen = 1; },
  headapex(b) { b.phase = 3; b.hp = boss.maxHp * 0.15; b.jawTarget = 0.95; b.jawOpen = 0.95; b.skillGlow = 1; },
};
const zoomScenes = { head: 1, headopen: 1, headapex: 1 };
const want = process.argv[2] ? [process.argv[2]] : Object.keys(scenes);
for (const s of want) {
  if (!scenes[s]) { console.log('unknown scene ' + s); continue; }
  if (zoomScenes[s]) shot(s, scenes[s], 3);
  else shot(s, scenes[s], 1);
}
