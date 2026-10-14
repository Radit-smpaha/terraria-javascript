// ══════════════════════════════════════════════════════════════════════════
// Functional QA for the Abyssal Gate crossing (node qa-abyssal-gate.js)
//
// The Tide Gate to the Abyssal Planet must play its OWN animation
// (AbyssalGateFX in ocean.js) instead of the space dimension's WormholeFX.
// Boots the real game with DOM/canvas stubs, then runs a full maelstrom
// crossing head-to-head and asserts Game.openWormhole picks it for both
// Tide Gate legs while the Void Rift keeps its wormhole.
// ══════════════════════════════════════════════════════════════════════════
const fs = require('fs');
const vm = require('vm');

let failures = 0;
const check = (label, ok, detail = '') => {
  if (!ok) failures++;
  console.log((ok ? '  PASS ' : '  FAIL ') + label + (!ok && detail ? ' — ' + detail : ''));
};
const step = (title) => console.log('\n▸ ' + title);

// ---- DOM / canvas stubs (same shape as qa-node-harness.js) ---------------
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
    classList: { add() {}, remove() {}, contains: () => false, toggle() {} },
    getContext: () => makeCtx(),
    addEventListener() {}, removeEventListener() {},
    appendChild() {}, querySelector: () => null, querySelectorAll: () => [], closest: () => null,
    remove() {}, parentNode: { removeChild() {} },
    setAttribute() {}, getAttribute: () => null, className: '', value: ''
  };
}
const els = {};
global.document = {
  readyState: 'complete', scripts: [],
  getElementById: (id) => (els[id] ||= makeEl(id)),
  createElement: (tag) => makeEl(tag),
  addEventListener() {}, querySelector: () => null, querySelectorAll: () => [],
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
  'underworld.js', 'space.js', 'ocean.js', 'juice.js', 'npcs.js', 'journey.js',
  'multiplayer.js', 'terraria.js'];
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
if (!g) { console.log('BOOT FAIL: no game'); process.exit(1); }

step('1. The class exists and is exported');
check('AbyssalGateFX defined + exported on window',
  typeof global.AbyssalGateFX === 'function',
  typeof global.AbyssalGateFX);
check('WormholeFX still exists for the space rift',
  typeof global.WormholeFX === 'function');
check('shares the WormholeFX contract (phase/playerScale/playerSpin/3 methods)',
  (() => {
    const fx = new global.AbyssalGateFX(100, 100, {});
    return fx.phase === 'open' && typeof fx.playerScale === 'number' &&
      typeof fx.playerSpin === 'number' && typeof fx.update === 'function' &&
      typeof fx.render === 'function' && typeof fx.renderScreenOverlay === 'function';
  })());

step('2. A full crossing plays out and pulls the player in');
{
  const fx = new global.AbyssalGateFX(600, 400, { maxRadius: 190 });
  const player = { x: 600 - 520, y: 400 + 180, width: 20, height: 40, vx: 0, vy: 0 };
  const startDist = Math.hypot(600 - (player.x + 10), 400 - (player.y + 20));
  let particles = 0;
  const ps = { addParticle() { particles++; } };
  const cam = { x: 0, y: 0 };
  const out = makeCtx();
  let done = null;
  let frames = 0;
  let maxRipples = 0;
  let maxBubbles = 0;
  let threw = null;
  const dt = 1 / 60;
  while (done !== 'done' && frames < 60 * 8) {
    try {
      done = fx.update(dt, player, ps);
      fx.render(makeCtx(), cam);
      fx.renderScreenOverlay(out, 800, 600);
    } catch (e) {
      threw = e;
      break;
    }
    maxRipples = Math.max(maxRipples, fx.ripples.length);
    maxBubbles = Math.max(maxBubbles, fx.bubbles.length);
    frames++;
  }
  const endDist = Math.hypot(600 - (player.x + 10), 400 - (player.y + 20));
  check('draw passes never throw', !threw, threw ? threw.stack : '');
  check("reaches 'done' inside its own totalDuration + slack",
    done === 'done' && frames * dt <= fx.totalDuration + 0.5,
    `done=${done} took=${(frames * dt).toFixed(2)}s total=${fx.totalDuration}`);
  check('player is hauled most of the way into the mouth',
    endDist < startDist * 0.45, `start=${startDist.toFixed(0)} end=${endDist.toFixed(0)}`);
  check('player visibly shrinks for the transform pass', fx.playerScale < 0.3,
    String(fx.playerScale));
  check('outward foam ripples spawned', maxRipples > 0, String(maxRipples));
  check('bubbles climbed out of the gate', maxBubbles > 0, String(maxBubbles));
  check('water/foam particles emitted', particles > 20, String(particles));
}

step('3. Game.openWormhole picks the maelstrom for the Tide Gate');
{
  const x = 300, y = 300;
  const savedDim = g.world.dimension;
  const savedWormhole = g.wormhole;
  const savedIntent = g.wormholeIntent;

  g.wormhole = null; g.wormholeIntent = null;
  g.openWormhole('ocean', x, y);
  check("entering the Tide Gate ('ocean') runs AbyssalGateFX",
    g.wormhole instanceof global.AbyssalGateFX,
    g.wormhole ? g.wormhole.constructor.name : 'null');
  check('and not the space wormhole', !(g.wormhole instanceof global.WormholeFX));

  g.wormhole = null; g.wormholeIntent = null;
  g.world.dimension = 'ocean';
  g.openWormhole('overworld', x, y, true);
  check("leaving the Abyssal Planet ('overworld' while in ocean) runs AbyssalGateFX",
    g.wormhole instanceof global.AbyssalGateFX,
    g.wormhole ? g.wormhole.constructor.name : 'null');
  g.world.dimension = savedDim;

  g.wormhole = null; g.wormholeIntent = null;
  g.openWormhole('space', x, y);
  check("the Void Rift ('space') still runs WormholeFX",
    g.wormhole instanceof global.WormholeFX,
    g.wormhole ? g.wormhole.constructor.name : 'null');

  g.wormhole = null; g.wormholeIntent = null;
  g.openWormhole('overworld', x, y);
  check("the rift gate home ('overworld' in the overworld) still runs WormholeFX",
    g.wormhole instanceof global.WormholeFX,
    g.wormhole ? g.wormhole.constructor.name : 'null');

  g.wormhole = savedWormhole;
  g.wormholeIntent = savedIntent;
}

step('4. Source wiring');
{
  const t = fs.readFileSync('terraria.js', 'utf8');
  const oc = fs.readFileSync('ocean.js', 'utf8');
  check('openWormhole branches to AbyssalGateFX',
    /AbyssalGateFX/.test(t) && /tideGate/.test(t));
  check('ocean.js declares + exports the class',
    /class AbyssalGateFX/.test(oc) && /window\.AbyssalGateFX = AbyssalGateFX/.test(oc));
}

console.log('');
if (failures > 0) {
  console.log(`ABYSSAL GATE QA: ${failures} FAILURE(S)`);
  process.exit(1);
}
console.log('ABYSSAL GATE QA: ALL CHECKS PASSED');