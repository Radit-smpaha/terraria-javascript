// ══════════════════════════════════════════════════════════════════════════
// Functional QA for the Sovereign's death show (node qa-dragon-finale.js)
//
// Fells the Ossuary Sovereign and asserts that the finale behaves: it is
// built from the boss's own spine, it chain-detonates toward the skull, it
// blows the skull, it lights the arena, it survives real render frames, and
// it cleans itself up — and, the part a player actually notices, it holds the
// victory screen back until the spectacle is over.
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
    classList: (() => {
      const set = new Set();
      return {
        add: (c) => set.add(c),
        remove: (c) => set.delete(c),
        contains: (c) => set.has(c),
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
const store = new Map();
global.localStorage = {
  getItem: (k) => (store.has(k) ? store.get(k) : null),
  setItem: (k, v) => store.set(k, String(v)),
  removeItem: (k) => store.delete(k),
  clear: () => store.clear()
};

const files = ['audio.js', 'particles.js', 'world.js', 'weather.js', 'entities.js',
  'underworld.js', 'space.js', 'juice.js', 'npcs.js', 'journey.js', 'terraria.js'];
let ctx = vm.createContext(global);
for (const f of files) {
  try {
    vm.runInContext(fs.readFileSync(f, 'utf8'), ctx, { filename: f });
  } catch (e) {
    console.log('EVAL FAIL ' + f + ': ' + (e.stack || e.message));
    process.exit(1);
  }
}
const g = global.game;
// The main menu boots the simulation paused; start the game the way picking a
// world does so update() actually ticks.
g.titleScreenOpen = false;
g.paused = false;
// The victory screen is born hidden, exactly as terraria.html ships it.
document.getElementById('victory-screen').classList.add('hidden');
if (!g) { console.log('BOOT FAIL: no game'); process.exit(1); }

// Frames that update AND render every step: this suite is mostly interested
// in whether the show survives a real frame, so a stub-canvas throw is a fail.
function frames(n) {
  for (let i = 0; i < n; i++) {
    try { g.update(1 / 60); } catch (e) { console.log('UPDATE THROW frame ' + i + ': ' + e.stack); failures++; return false; }
    try { g.render(); } catch (e) { console.log('RENDER THROW frame ' + i + ': ' + e.stack); failures++; return false; }
  }
  return true;
}
const victoryShown = () => !document.getElementById('victory-screen').classList.contains('hidden');
// Immortal: the dragon is still around for the first frames and hits hard.
g.player.maxHp = 100000; g.player.hp = 100000;
step('1. The class ships and is reachable from the page');
check('space.js exposes DragonFinale', typeof global.DragonFinale === 'function');
check('the Game has somewhere to hang it',
  g.dragonFinale === null && g.victoryDelay === 0, 'finale=' + !!g.dragonFinale);

step('2. Felling the Sovereign builds the show');
// Stand a real dragon up on the player and kill it outright.
const bx = Math.floor(g.player.x / 24) * 24 + 240;
const by = Math.floor(g.player.y / 24) * 24 - 96;
g.boss = new SkeletonDragonBoss(bx, by, g);
g.boss.hp = 500;
const spineCount = g.boss.segments.length;
g.boss.takeDamage(9999, g.sound, g.particles, false);
check('the dragon is dead before any frame runs', g.boss.dead === true);
frames(2);
check('the boss object is gone, as the reward path demands', g.boss === null);
check('a finale was built in its place',
  !!g.dragonFinale && g.dragonFinale instanceof global.DragonFinale);
check('the finale snapshotted the whole spine',
  g.dragonFinale && g.dragonFinale.chain.length === spineCount,
  g.dragonFinale && g.dragonFinale.chain.length + ' of ' + spineCount);
check('the skull is the last beat, not the first',
  g.dragonFinale && g.dragonFinale.skullAt > g.dragonFinale.chain[g.dragonFinale.chain.length - 1].at);
check('the kill is still permanent', g.dragonSlain === true && g.dragonHP === null);
check('the loot still lands with the show',
  g.drops.some(d => d.id === 'dragon_trophy') && g.drops.some(d => d.id === 'void_star_blade'));

step('3. The curtain waits for the spectacle');
check('the victory screen is still hidden', !victoryShown());
check('and a hold timer is running', g.victoryDelay > 0, 'delay=' + g.victoryDelay);
frames(30);   // ~0.5s in: the chain is mid-spine
check('still hidden half a second in', !victoryShown());
check('the chain is detonating', g.dragonFinale && g.dragonFinale.chain.filter(s => s.popped).length >= 3,
  g.dragonFinale && g.dragonFinale.chain.filter(s => s.popped).length + ' popped');
check('shockwave rings are live', g.dragonFinale && g.dragonFinale.rings.length > 0);

step('4. The skull blows');
frames(70);   // ~1.2s + into the skull window
check('the skull went nova', g.dragonFinale && g.dragonFinale.skullPopped === true);
check('a soul pillar went up with it', g.dragonFinale && g.dragonFinale.pillar > 0,
  'pillar=' + (g.dragonFinale && g.dragonFinale.pillar.toFixed(2)));
check('the arena is lit by the corpse',
  g.dragonFinale && Number.isFinite(g.dragonFinale.lightRadius) && g.dragonFinale.lightRadius > 0 &&
  Number.isFinite(g.dragonFinale.x) && Number.isFinite(g.dragonFinale.y),
  'radius=' + (g.dragonFinale && Math.round(g.dragonFinale.lightRadius)));
check('the curtain is STILL down', !victoryShown());

step('5. It cleans itself up');
frames(400);  // past skullAt + 5.5s
check('the show has finished', g.dragonFinale === null);
check('and the victory screen finally rises', victoryShown());
check('the held timer is spent', g.victoryDelay === 0);

step('6. A second Sovereign, abandoned mid-show');
g.dragonFinale = null;
g.victoryDelay = 0;
document.getElementById('victory-screen').classList.add('hidden');
g.boss = new SkeletonDragonBoss(bx, by, g);
g.boss.hp = 500;
g.boss.takeDamage(9999, g.sound, g.particles, false);
frames(2);
check('a second show is running', !!g.dragonFinale);
g.returnToOverworld();
check('leaving the Ossuary ends the show', g.dragonFinale === null);
check('but the kill still gets its curtain', g.victoryDelay > 0);

step('7. A reload mid-show drops the whole thing');
g.dragonFinale = null; g.victoryDelay = 0;
g.boss = new SkeletonDragonBoss(bx, by, g);
g.boss.hp = 500;
g.boss.takeDamage(9999, g.sound, g.particles, false);
frames(2);
check('a third show is running', !!g.dragonFinale);
g.saveGame(true);
g.loadGame(true);
check('reloading clears the finale', g.dragonFinale === null);
check('and cancels the held curtain', g.victoryDelay === 0);

console.log('\n──────────────────────────────────────────');
console.log(failures === 0 ? '✔ ALL DRAGON-FINALE CHECKS PASSED' : '✖ ' + failures + ' CHECK(S) FAILED');
const code = failures === 0 ? 0 : 1;
const leave = () => process.exit(code);
process.stdout.write('', leave);
setTimeout(leave, 1000);