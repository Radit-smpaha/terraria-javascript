// ============================================================================
// bake-mega-pack.js -- bake the production Megalodon sprite pack.
//
// The game is fully procedural: there is no image pipeline in it (no
// `new Image`, no `drawImage` of an external PNG anywhere in the runtime).
// So instead of "extracting" the presentation sheet, this tool renders the
// REAL boss class -- the same code the game runs -- frame by frame into
// transparent RGBA PNGs through the mini-canvas rasteriser, one clip per
// animation named on the reference sheet, and writes:
//
//   assets/bosses/megalodon/<clip>.png      (horizontal spritesheets)
//   assets/bosses/megalodon/manifest.json   (verified dimensions + flags)
//
// Shark clips are baked from Megalodon.render() itself, so the pack and the
// game can never drift apart. Effect clips (splash, shockwave, transitions,
// warning lane, ...) are drawn procedurally here and are reported in the
// manifest as "reconstructed".
//
//   usage: powershell -File tools/run-node.ps1 tools/bake-mega-pack.js
// ============================================================================
'use strict';
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const mini = require('./mini-canvas.js');
const P = require('./png-rgba.js');

const ROOT = path.join(__dirname, '..');
process.chdir(ROOT);
const OUT = 'assets/bosses/megalodon';

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
try { global.navigator = { userAgent: 'node' }; } catch (e) { /* electron */ }

for (const f of ['audio.js', 'particles.js', 'world.js', 'weather.js', 'entities.js',
  'underworld.js', 'juice.js', 'npcs.js', 'journey.js', 'multiplayer.js', 'space.js',
  'ocean.js']) {
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

const boss = new global.Kraken(arena.bossX, arena.arenaCY, game);
const PROBE_W = 980, PROBE_H = 620;      // generous: the whole animal + FX fits

// ---------------------------------------------------------------- helpers
/** Render one boss frame twice (black + white plate) and return a tight RGBA. */
function shootBossFrame() {
  const cb = mini.createCtx(PROBE_W, PROBE_H, 1);   // plate: transparent black
  const cw = mini.createCtx(PROBE_W, PROBE_H, 1);
  cw.fillStyle = '#ffffff'; cw.fillRect(0, 0, PROBE_W, PROBE_H);
  const cam = {
    x: boss.x + boss.width / 2 - PROBE_W / 2,
    y: boss.y + boss.height / 2 - PROBE_H / 2
  };
  boss.render(cb, cam);
  boss.render(cw, cam);
  const rgba = P.extractRGBA(cb, cw);
  const box = P.bboxRGBA(PROBE_W, PROBE_H, rgba);
  if (!box) return null;
  return { rgba: P.cropRGBA(PROBE_W, PROBE_H, rgba, box), ox: box.x, oy: box.y, w: box.w, h: box.h };
}

/** Neutralise everything that would draw outside the animal or decay away. */
function calmBoss() {
  boss.stainPools.length = 0;
  boss.trail.length = 0;
  boss.pending = null;
  boss.hunt = null;
  boss.rushLeft = 0;
  boss.apexLane = null;
  boss.hitFlash = 0;
  boss.phaseFlash = 0;
  boss.skillGlow = 0;
  boss.dash = null;
  boss.dead = false;
  boss.deadT = 0;
  boss.vanishT = 0;
  boss.exhaustT = 0;
  boss.tornadoT = 0;
  boss.depthDive = 0;
  boss.suctionT = 0;
  boss.frenzy = 0;
  boss.jawTarget = 0.14;
  boss.faceDir = 1;
}

/**
 * Bake one shark clip: `drive(b, i)` runs before each frame (after the fixed
 * simulation step) so the clip can pin the pose it is supposed to show.
 */
function bakeSharkClip(clip) {
  calmBoss();
  boss.phase = clip.phase;
  boss.hp = boss.maxHp * (clip.hp01 == null ? 1 : clip.hp01);
  boss.swimPhase = clip.swimPhase == null ? 1.4 : clip.swimPhase;
  boss.animT = 6.2;
  if (clip.setup) clip.setup(boss);
  // prime the springs so frame 0 is mid-motion, not at boot
  for (let i = 0; i < 60; i++) {
    if (clip.prime) clip.prime(boss, 1 / 60);
    boss.update(1 / 60, game.player, game.projectiles, null, game.particles);
  }
  if (clip.setup) clip.setup(boss);

  const frames = [];
  let wide = null;
  for (let i = 0; i < clip.frames; i++) {
    // Simulate in fixed 1/60 steps and only SAMPLE at the clip's spacing: the
    // boss's jaw/squash/recoil springs are unstable at large dt, and a sheet
    // must never contain a frame the game itself could produce.
    const substeps = Math.max(1, Math.round((clip.dt || 1 / 60) * 60));
    for (let s = 0; s < substeps; s++) {
      if (clip.drive) clip.drive(boss, i);
      boss.update(1 / 60, game.player, game.projectiles, null, game.particles);
    }
    if (clip.drive) clip.drive(boss, i);
    // hold it in the cell: the animal swims on the spot, like a sheet frame
    boss.x = PROBE_W / 2 - boss.width / 2;
    boss.y = PROBE_H / 2 - boss.height / 2;
    boss.vx = clip.vx == null ? 0 : clip.vx(boss, i);
    boss.vy = clip.vy == null ? 0 : clip.vy(boss, i);
    const f = shootBossFrame();
    if (!f) throw new Error('clip ' + clip.file + ' frame ' + i + ' rendered empty');
    frames.push(f);
    // A frame that fills the probe means a spring went unstable at this dt.
    if (f.w > PROBE_W * 0.98 || f.h > PROBE_H * 0.98) wide = i;
  }
  const info = P.writeSheetPNG(path.join(OUT, clip.file + '.png'), frames, clip.frames, 6, [PROBE_W / 2, PROBE_H / 2]);
  console.log(clip.file + '.png  ' + info.cellW + 'x' + info.cellH + ' x' + clip.frames +
    '  origin=(' + info.originX + ',' + info.originY + ')' +
    (wide != null ? '  !! FRAME ' + wide + ' OVERFLOWED THE PROBE' : ''));
  return info;
}

// ==========================================================================
// THE CLIPS -- one entry per animation named on the reference sheet.
// dt = seconds of simulated game time between two sampled frames.
// ==========================================================================
const SHARK_CLIPS = [
  {
    file: 'idle', phase: 1, frames: 8, dt: 0.48, fps: 8, loop: true, once: false,
    swimPhase: 0.6, vx: () => 0, vy: () => 0,
    note: 'Resting drift: no velocity, so the tail beat is a slow 0.55-amplitude wave.'
  },
  {
    file: 'swim', phase: 1, frames: 8, dt: 0.19, fps: 10, loop: true, once: false,
    swimPhase: 1.1, vx: () => 300, vy: () => 0,
    note: 'Default cruise at ~300 u/s; sampled across one full swim cycle (1.55 s).'
  },
  {
    file: 'fast_swim', phase: 1, frames: 8, dt: 0.11, fps: 16, loop: true, once: false,
    swimPhase: 2.0, vx: () => 900, vy: () => 0,
    note: 'High-speed cruise: 1.35x wave amplitude at 1.9x beat rate, body streamlined.'
  },
  {
    file: 'turn', phase: 1, frames: 8, dt: 0.12, fps: 12, loop: true, once: false,
    swimPhase: 1.6, vx: () => 0, vy: () => -180,
    drive: (b) => { b.poseMode = 'turn'; b.roll = 0.5; b.yaw = 0.4; },
    note: 'Banking reversal: +18% pre-coiled spine, roll/yaw cheat and a slow fin beat.'
  },
  {
    file: 'bite', phase: 1, frames: 8, dt: 0.06, fps: 14, loop: false, once: true,
    swimPhase: 1.2, vx: () => 0, vy: () => 0,
    drive: (b, i) => { b.jawTarget = i < 4 ? 1 : 0.1; },
    note: 'Jaw spring snap: closed, unhinged (ja ~0.74 rad), throat lit, then shut.'
  },
  {
    file: 'tail_sweep', phase: 1, frames: 8, dt: 0.05, fps: 14, loop: false, once: true,
    swimPhase: 1.3, vx: () => 0, vy: () => 0,
    drive: (b, i) => {
      b.poseMode = 'tail_sweep';
      b.tailBend = -0.30 * Math.sin((i / 7) * Math.PI);
      b.tailSwing = 30 + 12 * Math.sin((i / 7) * Math.PI);
    },
    note: 'Caudal sweep tail coil, crescent trail receding through the attack arc.'
  },
  {
    file: 'hurt', phase: 1, frames: 6, dt: 0.05, fps: 12, loop: false, once: true,
    swimPhase: 1.0, vx: () => 0, vy: () => 0,
    drive: (b, i) => { b.hitFlash = 0.25; b.recoil = -0.35 + i * 0.05; b.jawTarget = 0.5; },
    note: 'Damage reaction: recoil kick, white flash bloom, gape and a hard blink.'
  },
  {
    file: 'death', phase: 3, frames: 10, dt: 0.14, fps: 8, loop: false, once: true,
    swimPhase: 0.8, hp01: 0, vx: () => 0, vy: () => 0,
    drive: (b) => { b.dead = true; b.hp = 0; b.jawTarget = 0.4; },
    note: 'Sagging, sinking wreck: droop 1, tail gone slack, alpha fading out.'
  },
  {
    file: 'frenzy_rush', phase: 2, frames: 8, dt: 0.09, fps: 16, loop: true, once: false,
    swimPhase: 2.2, hp01: 0.5,
    vx: () => 1350, vy: () => 90,
    drive: (b) => { b.dash = { vx: 1350, vy: 90, t: 0.4, dur: 0.4, dmg: 120, kind: 'frenzy', hit: true }; b.jawTarget = 0.6; },
    note: 'Blood Frenzy charge: 1.15x wave, 1.6x rate, straight spine, spray off the flanks.'
  },
  {
    file: 'sharknado', phase: 2, frames: 8, dt: 0.06, fps: 20, loop: true, once: false,
    swimPhase: 3.0, hp01: 0.5, vx: () => 0, vy: () => 0,
    drive: (b, i) => {
      b.tornadoT = 1; b.poseMode = 'sharknado';
      b.roll = 0.85; b.tailBend = 0.30 * Math.sin(b.swimPhase * 6);
      b.jawTarget = 0.8;
      b.swimPhase += 0.42 * (i % 2 ? 1 : -1);
    },
    note: 'Sharknado spin: 2.1x wave amplitude, rolled 0.85 rad, vortex water wrap.'
  },
  {
    file: 'tooth_barrage', phase: 2, frames: 6, dt: 0.1, fps: 10, loop: true, once: false,
    swimPhase: 1.8, hp01: 0.5, vx: () => 0, vy: () => 0,
    drive: (b, i) => { b.poseMode = 'tooth_barrage'; b.jawTarget = 0.65 + 0.3 * Math.sin(i * 1.1); b.skillGlow = 0.6; },
    note: 'Repeating head shakes while teeth are spat; gullet glow pulsing at 2x.'
  },
  {
    file: 'feeding_frenzy', phase: 2, frames: 8, dt: 0.08, fps: 14, loop: true, once: false,
    swimPhase: 2.0, hp01: 0.45, vx: () => 160, vy: () => 0,
    drive: (b) => { b.frenzy = 3; b.jawTarget = 0.9; b.poseMode = 'feeding_frenzy'; },
    note: 'Frenzy stacks up: jape held at 0.9, hide wash lit, gills bleeding red light.'
  },
  {
    file: 'apex_execution', phase: 3, frames: 8, dt: 0.07, fps: 14, loop: true, once: false,
    swimPhase: 2.4, hp01: 0.18, vx: () => 0, vy: () => 0,
    drive: (b, i) => {
      b.poseMode = 'apex_execution';
      b.vanishT = i < 4 ? 0.85 - i * 0.2 : (i - 4) * 0.2;
      b.jawTarget = 1;
    },
    note: 'Vanishing ghost phase materialising into the charge (alpha ghost ripple).'
  },
  {
    file: 'depth_charge', phase: 3, frames: 8, dt: 0.07, fps: 12, loop: false, once: true,
    swimPhase: 1.4, hp01: 0.18, vx: () => 0, vy: () => 0,
    drive: (b, i) => { b.poseMode = 'depth_charge'; b.depthDive = 0.5; b.pitch = -0.32 + i * 0.02; b.jawTarget = 0.9; },
    note: 'Depth-charge dive: pitched nose-over, tail coiled, gullet lit from below.'
  },
  {
    file: 'devouring_maw', phase: 3, frames: 8, dt: 0.07, fps: 14, loop: false, once: true,
    swimPhase: 1.6, hp01: 0.18, vx: () => 0, vy: () => 0,
    drive: (b, i) => { b.poseMode = 'devouring_maw'; b.suctionT = 0.6; b.jawTarget = i < 6 ? 1 : 0.35; },
    note: 'Devouring maw: suction cycles with the gape; breath tears out of the hinge.'
  },
  {
    file: 'extinction_hunt', phase: 3, frames: 10, dt: 0.07, fps: 16, loop: true, once: false,
    swimPhase: 2.6, hp01: 0.2, vx: () => 1300, vy: () => -90,
    drive: (b, i) => {
      b.poseMode = 'extinction_hunt';
      b.dash = { vx: 1300 * (i % 2 ? 1 : -1), vy: -90, t: 0.4, dur: 0.4, dmg: 160, kind: 'hunt_dash', hit: true };
      b.faceDir = i % 2 ? 1 : -1;
      b.jawTarget = 1;
    },
    note: 'Extinction Hunt chain: alternating hunt dashes, spine straight, jaws locked.'
  },
  {
    file: 'exhausted', phase: 3, frames: 8, dt: 0.16, fps: 6, loop: true, once: false,
    swimPhase: 0.7, hp01: 0.12, vx: () => 0, vy: () => 0,
    drive: (b) => { b.exhaustT = 3; b.jawTarget = 0.65; b.droop = 1; b.vx = 0; b.vy = 0; },
    note: 'Post-hunt damage window: every fin sags, half-lidded eye, tremble in the water.'
  }
];

// ==========================================================================
// EFFECT CLIPS -- procedural, drawn here (reported as reconstructed).
// `draw(ctx, f, n)` paints one frame of the effect; f = 0..1 across the clip.
// ==========================================================================
const FX = [
  {
    file: 'water_splash', frames: 6, fps: 14, loop: false, once: true, size: 160,
    draw(c, f) {
      const n = 9, cx = 80, cy = 96;
      for (let i = 0; i < n; i++) {
        const a = (i / n) * Math.PI * 2;
        const t = Math.min(1, f * 1.4);
        const r = 14 + t * 58 + (i % 3) * 5;
        const x = cx + Math.cos(a) * r, y = cy - Math.abs(Math.sin(a)) * r * 0.75;
        c.fillStyle = 'rgba(224, 242, 254, ' + (0.85 * (1 - t)).toFixed(2) + ')';
        c.beginPath(); c.arc(x, y, 3 + (1 - t) * 4, 0, Math.PI * 2); c.fill();
      }
      c.strokeStyle = 'rgba(186, 230, 253, ' + (0.7 * (1 - f)).toFixed(2) + ')';
      c.lineWidth = 3;
      c.beginPath(); c.arc(cx, cy, 16 + f * 66, Math.PI * 1.06, Math.PI * 1.94); c.stroke();
    }
  },
  {
    file: 'water_wave', frames: 6, fps: 10, loop: true, once: false, size: 192,
    draw(c, f) {
      const cy = 96;
      // trough + crest: a travelling swell, hard-edged like the rest of the pack
      for (let row = 0; row < 4; row++) {
        const off = (f + row * 0.06) % 1;
        c.fillStyle = 'rgba(56, 189, 248, ' + (0.55 - row * 0.12).toFixed(2) + ')';
        c.beginPath();
        c.moveTo(0, 192);
        for (let x = 0; x <= 192; x += 8) {
          const p = (x / 192 + off) * Math.PI * 2;
          c.lineTo(x, cy + Math.sin(p) * 16 - row * 9);
        }
        c.lineTo(192, 192); c.closePath(); c.fill();
      }
      c.fillStyle = 'rgba(186, 230, 253, 0.75)';
      c.beginPath();
      for (let x = 0; x <= 192; x += 8) {
        const p = (x / 192 + f) * Math.PI * 2;
        c.lineTo(x, cy + Math.sin(p) * 16 - 22);
      }
      for (let x = 192; x >= 0; x -= 8) {
        const p = (x / 192 + f) * Math.PI * 2;
        c.lineTo(x, cy + Math.sin(p) * 16 - 13);
      }
      c.closePath(); c.fill();
    }
  },
  {
    file: 'turbulent_current', frames: 6, fps: 10, loop: true, once: false, size: 160,
    draw(c, f) {
      const cx = 80, cy = 80;
      // two counter-rotating eddies of hard streaks
      for (let e = 0; e < 2; e++) {
        const dir = e ? -1 : 1;
        const sp = f + e * 0.5;
        for (let i = 0; i < 7; i++) {
          const a0 = sp * Math.PI * 2 * dir + (i / 7) * Math.PI * 2;
          const rr = 16 + (i % 3) * 16;
          const x0 = cx + Math.cos(a0) * rr, y0 = cy + Math.sin(a0) * rr * 0.8;
          const x1 = cx + Math.cos(a0 + 0.7 * dir) * (rr - 12), y1 = cy + Math.sin(a0 + 0.7 * dir) * (rr - 12) * 0.8;
          c.strokeStyle = 'rgba(125, 211, 252, ' + (0.20 + (i % 3) * 0.16).toFixed(2) + ')';
          c.lineWidth = 3 + (i % 2);
          c.beginPath(); c.moveTo(x0, y0); c.lineTo(x1, y1); c.stroke();
        }
      }
      c.strokeStyle = 'rgba(186, 230, 253, 0.35)';
      c.lineWidth = 2;
      c.beginPath(); c.ellipse(cx, cy, 66, 52, 0, 0, Math.PI * 2); c.stroke();
    }
  },
  {
    file: 'bite_shockwave', frames: 5, fps: 14, loop: false, once: true, size: 192,
    draw(c, f) {
      const cx = 96, cy = 96, r = 18 + f * 70;
      // the jaw-burst ring: a notched red arc with tooth spikes
      for (let i = 0; i < 10; i++) {
        const a0 = (i / 10) * Math.PI * 2 + f * 0.6;
        const a1 = a0 + (Math.PI * 2 / 10) * 0.55;
        c.strokeStyle = 'rgba(239, 68, 68, ' + (0.9 * (1 - f * 0.8)).toFixed(2) + ')';
        c.lineWidth = 5 * (1 - f * 0.5);
        c.beginPath(); c.arc(cx, cy, r, a0, a1); c.stroke();
      }
      c.fillStyle = 'rgba(254, 226, 226, ' + (0.8 * (1 - f)).toFixed(2) + ')';
      for (let i = 0; i < 10; i++) {
        const a = (i / 10) * Math.PI * 2 + f * 0.6 + 0.1;
        const x = cx + Math.cos(a) * r, y = cy + Math.sin(a) * r;
        c.beginPath();
        c.moveTo(x - Math.cos(a) * 7, y - Math.sin(a) * 7);
        c.lineTo(x + Math.cos(a) * 9, y + Math.sin(a) * 9);
        c.lineTo(x - Math.sin(a) * 5, y + Math.cos(a) * 5);
        c.closePath(); c.fill();
      }
      c.fillStyle = 'rgba(127, 29, 29, ' + (0.6 * (1 - f)).toFixed(2) + ')';
      c.beginPath(); c.arc(cx, cy, 24 * (1 - f * 0.6), 0, Math.PI * 2); c.fill();
    }
  },
  {
    file: 'tooth_projectile', frames: 4, fps: 8, loop: false, once: true, size: 96,
    draw(c, f) {
      const cx = 48, cy = 48, a = 0.5 + f * 1.6;
      c.save(); c.translate(cx, cy); c.rotate(a);
      c.fillStyle = '#f3f6fb';
      c.strokeStyle = '#060a14'; c.lineWidth = 3;
      c.beginPath();
      c.moveTo(-20, -9); c.lineTo(16, -5); c.lineTo(24, 0); c.lineTo(16, 5); c.lineTo(-20, 9);
      c.closePath(); c.fill(); c.stroke();
      c.fillStyle = 'rgba(6, 10, 20, 0.5)';
      c.fillRect(-14, -3, 26, 2);
      c.restore();
      // motion streaks trailing the tooth
      c.strokeStyle = 'rgba(186, 230, 253, 0.4)';
      c.lineWidth = 3;
      for (let i = 0; i < 3; i++) {
        c.beginPath();
        c.moveTo(cx - Math.cos(a) * (26 + i * 8), cy - Math.sin(a) * (26 + i * 8));
        c.lineTo(cx - Math.cos(a) * (40 + i * 10), cy - Math.sin(a) * (40 + i * 10));
        c.stroke();
      }
    }
  },
  {
    file: 'blood_effect', frames: 6, fps: 12, loop: true, once: false, size: 128,
    draw(c, f) {
      const cx = 64, cy = 64;
      c.fillStyle = 'rgba(127, 29, 29, ' + (0.55 * (1 - f * 0.7)).toFixed(2) + ')';
      c.beginPath(); c.arc(cx, cy, 12 + f * 26, 0, Math.PI * 2); c.fill();
      for (let i = 0; i < 11; i++) {
        const a = (i / 11) * Math.PI * 2 + 0.4;
        const sp = 0.35 + (i % 3) * 0.2;
        const r = 10 + ((f + i * 0.07) % 1) * 44;
        const x = cx + Math.cos(a) * r, y = cy + Math.sin(a) * r - ((f * 30) % 30) * 0.4;
        c.fillStyle = 'rgba(190, 24, 44, ' + (0.85 * (1 - r / 56)).toFixed(2) + ')';
        c.beginPath(); c.ellipse(x, y, 3.2 + (i % 2) * 2.2, 2.4 + (i % 3), a, 0, Math.PI * 2); c.fill();
      }
      c.strokeStyle = 'rgba(248, 113, 113, 0.5)';
      c.lineWidth = 2;
      c.beginPath(); c.arc(cx, cy, 10 + f * 26, 0, Math.PI * 2); c.stroke();
    }
  },
  {
    file: 'impact_effect', frames: 5, fps: 16, loop: false, once: true, size: 128,
    draw(c, f) {
      const cx = 64, cy = 64;
      c.fillStyle = 'rgba(254, 242, 242, ' + (0.9 * (1 - f)).toFixed(2) + ')';
      c.beginPath(); c.arc(cx, cy, 34 * (1 - f * 0.55), 0, Math.PI * 2); c.fill();
      for (let i = 0; i < 8; i++) {
        const a = (i / 8) * Math.PI * 2 + 0.2;
        const l = 16 + f * 44;
        c.strokeStyle = 'rgba(248, 113, 113, ' + (0.95 * (1 - f)).toFixed(2) + ')';
        c.lineWidth = 5 * (1 - f * 0.6);
        c.beginPath();
        c.moveTo(cx + Math.cos(a) * 12, cy + Math.sin(a) * 12);
        c.lineTo(cx + Math.cos(a) * l, cy + Math.sin(a) * l);
        c.stroke();
      }
      c.strokeStyle = 'rgba(254, 226, 226, ' + (0.8 * (1 - f * 0.7)).toFixed(2) + ')';
      c.lineWidth = 4 * (1 - f);
      c.beginPath(); c.arc(cx, cy, 20 + f * 46, 0, Math.PI * 2); c.stroke();
    }
  },
  {
    file: 'phase2_transition', frames: 8, fps: 12, loop: false, once: true, size: 256,
    draw(c, f) {
      const cx = 128, cy = 128;
      // spiralling in, then the shock ring snapping out
      const t = f;
      for (let i = 0; i < 26; i++) {
        const a = (i / 26) * Math.PI * 3.4 + t * 7;
        const r = 130 - t * 104;
        const x = cx + Math.cos(a) * r, y = cy + Math.sin(a) * r * 0.72;
        c.fillStyle = 'rgba(248, 113, 113, ' + (0.16 + 0.5 * (1 - t)).toFixed(2) + ')';
        c.beginPath(); c.arc(x, y, 3 + t * 6, 0, Math.PI * 2); c.fill();
      }
      c.strokeStyle = 'rgba(239, 68, 68, ' + (0.75 * Math.max(0, 1 - t * 1.2)).toFixed(2) + ')';
      c.lineWidth = 5;
      c.beginPath(); c.ellipse(cx, cy, 120 * (0.3 + t * 0.7), 86 * (0.3 + t * 0.7), 0, 0, Math.PI * 2); c.stroke();
      c.fillStyle = 'rgba(127, 29, 29, ' + (0.5 * t * (1 - t * 0.6)).toFixed(2) + ')';
      c.beginPath(); c.ellipse(cx, cy, 60 * t, 44 * t, 0, 0, Math.PI * 2); c.fill();
    }
  },
  {
    file: 'phase3_transition', frames: 8, fps: 12, loop: false, once: true, size: 256,
    draw(c, f) {
      const cx = 128, cy = 128;
      // torn crimson shards + a violent snap ring
      for (let i = 0; i < 16; i++) {
        const a = (i / 16) * Math.PI * 2 + 0.15;
        const r0 = 40 + f * 60, r1 = r0 + 26 + (i % 3) * 14;
        const w = 0.09 + (i % 2) * 0.05;
        c.fillStyle = 'rgba(190, 24, 44, ' + (0.55 * (1 - f * 0.7)).toFixed(2) + ')';
        c.beginPath();
        c.moveTo(cx + Math.cos(a - w) * r0, cy + Math.sin(a - w) * r0 * 0.8);
        c.lineTo(cx + Math.cos(a) * r1, cy + Math.sin(a) * r1 * 0.8);
        c.lineTo(cx + Math.cos(a + w) * r0, cy + Math.sin(a + w) * r0 * 0.8);
        c.closePath(); c.fill();
      }
      c.strokeStyle = 'rgba(239, 68, 68, ' + (0.85 * (1 - f)).toFixed(2) + ')';
      c.lineWidth = 6 * (1 - f * 0.5);
      c.beginPath(); c.ellipse(cx, cy, 130 + f * 60, 96 + f * 44, 0, 0, Math.PI * 2); c.stroke();
      c.fillStyle = 'rgba(254, 226, 226, ' + (0.55 * (1 - f) * (1 - f)).toFixed(2) + ')';
      c.beginPath(); c.ellipse(cx, cy, 40 * (1 - f), 30 * (1 - f), 0, 0, Math.PI * 2); c.fill();
    }
  },
  {
    file: 'apex_warning_indicator', frames: 4, fps: 8, loop: true, once: false, size: 256,
    draw(c, f) {
      const cy = 128;
      // the telegraph lane + chevrons the game already draws, as a sheet
      c.fillStyle = 'rgba(239, 68, 68, 0.16)';
      c.fillRect(0, cy - 26, 256, 52);
      c.fillStyle = 'rgba(239, 68, 68, ' + (0.55 + 0.35 * Math.sin(f * Math.PI)).toFixed(2) + ')';
      c.fillRect(0, cy - 3, 256, 6);
      for (let i = 0; i < 5; i++) {
        const x = ((f * 64 + i * 58) % 300) - 20;
        c.fillStyle = 'rgba(254, 226, 226, ' + (0.85 - (i % 2) * 0.3).toFixed(2) + ')';
        c.beginPath();
        c.moveTo(x, cy - 26); c.lineTo(x + 22, cy); c.lineTo(x, cy + 26); c.lineTo(x + 8, cy);
        c.closePath(); c.fill();
      }
      c.strokeStyle = 'rgba(239, 68, 68, 0.8)';
      c.lineWidth = 4;
      c.beginPath(); c.moveTo(0, cy - 30); c.lineTo(256, cy - 30);
      c.moveTo(0, cy + 30); c.lineTo(256, cy + 30); c.stroke();
    }
  }
];

// ==========================================================================
// DRIVE
// ==========================================================================
const manifest = {
  $schema: './manifest.schema.json',
  name: 'Megalodon pixel-art boss asset pack',
  generatedBy: 'tools/bake-mega-pack.js (renders the real Megalodon class)',
  paletteNote: 'Phase 1 dark navy; Phase 2 Blood Frenzy red energy; Phase 3 Apex battle damage',
  cellConvention: 'One animation = one horizontal spritesheet. Frame cells are ' +
    'the union of every frame bounding box plus a 6px margin, so the animal ' +
    'never jumps inside its cell.',
  originConvention: 'origin = the animal centre (the point the game keeps at ' +
    'boss.x + width/2, boss.y + height/2) expressed in cell pixels.',
  background: 'transparent RGBA (alpha recovered by a black/white two-pass un-blend)',
  assets: []
};

if (!fs.existsSync(OUT)) fs.mkdirSync(OUT, { recursive: true });
console.log('baking ' + SHARK_CLIPS.length + ' shark clips + ' + FX.length + ' effect clips -> ' + OUT);

for (const clip of SHARK_CLIPS) {
  const info = bakeSharkClip(clip);
  manifest.assets.push({
    file: clip.file + '.png',
    animation: clip.file,
    group: clip.phase === 1 ? 'base' : 'phase' + clip.phase,
    phase: clip.phase,
    frames: clip.frames,
    columns: clip.frames, rows: 1,
    frameWidth: info.cellW, frameHeight: info.cellH,
    sheetWidth: info.sheetW, sheetHeight: info.sheetH,
    origin: { x: info.originX, y: info.originY },
    fps: clip.fps,
    loop: clip.loop, once: clip.once,
    source: 'extracted',       // baked out of Megalodon.render() itself
    rigChannel: 'boss.poseMode="' + clip.file + '"',
    notes: [clip.note]
  });
}

// ---- effect clips --------------------------------------------------------
function bakeFxClip(clip) {
  const size = clip.size;
  const frames = [];
  for (let i = 0; i < clip.frames; i++) {
    const cb = mini.createCtx(size, size, 1);
    const cw = mini.createCtx(size, size, 1);
    cw.fillStyle = '#ffffff'; cw.fillRect(0, 0, size, size);
    clip.draw(cb, i / clip.frames);
    clip.draw(cw, i / clip.frames);
    const rgba = P.extractRGBA(cb, cw);
    const box = P.bboxRGBA(size, size, rgba);
    if (!box) throw new Error('fx ' + clip.file + ' frame ' + i + ' empty');
    frames.push({ rgba: P.cropRGBA(size, size, rgba, box), ox: box.x, oy: box.y, w: box.w, h: box.h });
  }
  const info = P.writeSheetPNG(path.join(OUT, clip.file + '.png'), frames, clip.frames, 4, 'bbox');
  console.log(clip.file + '.png  ' + info.cellW + 'x' + info.cellH + ' x' + clip.frames);
  return info;
}

for (const clip of FX) {
  const info = bakeFxClip(clip);
  manifest.assets.push({
    file: clip.file + '.png',
    animation: clip.file,
    group: 'effects',
    phase: 0,
    frames: clip.frames,
    columns: clip.frames, rows: 1,
    frameWidth: info.cellW, frameHeight: info.cellH,
    sheetWidth: info.sheetW, sheetHeight: info.sheetH,
    origin: { x: info.originX, y: info.originY },
    fps: clip.fps,
    loop: clip.loop, once: clip.once,
    source: 'reconstructed',
    notes: ['Drawn procedurally by tools/bake-mega-pack.js in the pack palette; ' +
      'replace with hand-drawn frames if you have sheet art for it.']
  });
}

fs.writeFileSync(path.join(OUT, 'manifest.json'), JSON.stringify(manifest, null, 2) + '\n');
const total = manifest.assets.length;
console.log('manifest.json written: ' + total + ' assets, ' +
  manifest.assets.reduce((s, a) => s + a.frames, 0) + ' frames total');
