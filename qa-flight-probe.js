// Scratch probe: does the fuel/cooldown loop hold up when driven through the
// REAL Game.update() (gear sync included), not a bare Player instance?
const fs = require('fs');
const vm = require('vm');
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
    classList: (() => { const s = new Set(); return { add: c => s.add(c), remove: c => s.delete(c), contains: c => s.has(c), toggle: (c, on) => { const w = on === undefined ? !s.has(c) : !!on; if (w) s.add(c); else s.delete(c); return w; } }; })(),
    getContext: () => makeCtx(), addEventListener() {}, removeEventListener() {},
    appendChild() {}, querySelector: () => null, querySelectorAll: () => [],
    closest: () => null, remove() {}, parentNode: { removeChild() {} },
    setAttribute() {}, getAttribute: () => null, className: '', value: ''
  };
}
const els = {};
global.document = {
  readyState: 'complete', scripts: [],
  getElementById: (id) => (els[id] ||= makeEl(id)),
  createElement: (t) => makeEl(t), addEventListener() {},
  querySelector: () => null, querySelectorAll: () => [], body: makeEl('body')
};
global.window = global;
global.innerWidth = 1280; global.innerHeight = 720; global.devicePixelRatio = 1;
global.addEventListener = () => {};
global.performance = { now: () => 1000 };
global.requestAnimationFrame = () => 0;
global.cancelAnimationFrame = () => {};
const store = new Map();
global.localStorage = { getItem: k => (store.has(k) ? store.get(k) : null), setItem: (k, v) => store.set(k, String(v)), removeItem: k => store.delete(k), clear: () => store.clear() };
const ctx = vm.createContext(global);
for (const f of ['audio.js', 'particles.js', 'world.js', 'weather.js', 'entities.js', 'underworld.js', 'space.js', 'juice.js', 'npcs.js', 'journey.js', 'terraria.js']) {
  vm.runInContext(fs.readFileSync(f, 'utf8'), ctx, { filename: f });
}
const g = global.game;
const p = g.player;

// Drop the player onto the surface under open sky, give them wings, equip them.
const cx = Math.floor(g.world.width / 2);
const ground = g.world.surfaceHeights[cx];
p.x = cx * 16 + 4;
p.y = (ground - 3) * 16;
p.hp = p.maxHp = 400;
g.addItem('angel_wings', 1);
g.equippedAccessoryId = 'angel_wings';
p.setWings(global.ITEMS.angel_wings);
g.update(1 / 60);
console.log('worn=' + g.equippedAccessoryId + ' hasWings=' + p.hasWings +
  ' tank=' + p.maxFlightFuel + ' cd=' + p.maxFlightCooldown + ' wingsUsed=' + p.wingsUsed);

const startY = p.y;
g.input.keys['Space'] = true;
let peak = p.y;
for (let i = 0; i < 60 * 45; i++) {
  g.update(1 / 60);
  p.hp = p.maxHp;
  peak = Math.min(peak, p.y);
  if (i % 180 === 0) {
    console.log(`t=${(i / 60).toFixed(1)}s fuel=${p.flightFuel.toFixed(2)} cd=${p.flightCooldown.toFixed(2)} ` +
      `flying=${p.isFlying} ground=${p.onGround} y=${p.y.toFixed(0)} rose=${(startY - peak).toFixed(0)}px`);
  }
}
g.input.keys['Space'] = false;
console.log('\nAFTER 45s of holding jump (angel wings = 30s tank, 30s cooldown):');
console.log('  fuel      =', p.flightFuel.toFixed(2));
console.log('  cooldown  =', p.flightCooldown.toFixed(2));
console.log('  total rise=', (startY - peak).toFixed(0), 'px  (30s of flapping is ~7500px at 4.2px/frame)');
console.log('  wingsUsed =', p.wingsUsed, ' hasWings =', p.hasWings);

// ══════════════════════════════════════════════════════════════════════════
// Scenario 2 — the bug this probe was really written for: a dry tank with no
// lock-out armed. The old code only started the cooldown when the fuel crossed
// zero *mid-flap*, so land holding the last of it, or release jump a frame early,
// or wear a wing that declares no cooldown, and the wings sat at 0 fuel / 0
// cooldown forever — no recharge, no countdown, nothing to wait for. The player
// saw "wings spent" with a timer that never appeared.
console.log('\n──────── the desync: dry tank, cooldown not armed ────────');
p.setWings(global.ITEMS.angel_wings);
p.flightFuel = 0;
p.flightCooldown = 0;
p.onGround = true;
console.log(`before: fuel=${p.flightFuel.toFixed(2)} cd=${p.flightCooldown.toFixed(2)} — nothing counting down`);
for (let i = 0; i < 60 * 40; i++) {
  p.onGround = true;                 // stand still and wait, like a player would
  p.update(1 / 60, g.input, g.world, g.sound, g.particles);
}
console.log(`after 40s standing: fuel=${p.flightFuel.toFixed(2)} cd=${p.flightCooldown.toFixed(2)} (tank is ${p.maxFlightFuel})`);
console.log(p.flightFuel === p.maxFlightFuel && p.flightCooldown === 0
  ? 'RESULT: RECOVERED — a spent tank always arms its price and re-arms.'
  : 'RESULT: STILL STUCK — the wings are dead with nothing left to wait for.');

// Scenario 3 — a wing that forgets to declare its price must still pay one, or it
// can strand itself in exactly that state on its own.
p.setWings({ id: 'orphan_wings', grantsFlight: true, flightTime: 10 });
console.log('\norphan wing (no flightCooldown declared): lock-out =', p.maxFlightCooldown + 's');
console.log(p.maxFlightCooldown > 0
  ? 'RESULT: PRICED — every flight-granting item pays for the sky.'
  : 'RESULT: FREE — a wing can freeze itself out of existence again.');
p.setWings(global.ITEMS.angel_wings);
