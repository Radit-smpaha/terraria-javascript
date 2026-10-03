// Regression: a page refresh used to resume the fight against the player.
//
// The world save stored the live boss, and loadGame() re-created it at its saved
// coordinates — which is exactly where the player was standing. So refreshing
// mid-fight re-dropped the boss on top of the player and kept crushing them
// (25+ damage per touch, killing a low-health player before the first frame was
// drawn). A load must now always start with a clean slate.
//
// This script simulates two page loads that share one localStorage store, then
// asserts the reloaded world is quiet: no boss and no damage events.
const fs = require('fs');
const vm = require('vm');

const files = ['audio.js', 'particles.js', 'world.js', 'weather.js', 'entities.js', 'underworld.js', 'space.js', 'juice.js', 'npcs.js', 'journey.js', 'terraria.js'];

function makeCtx() {
  return new Proxy({}, {
    get(t, p) {
      if (p === 'canvas') return {};
      if (p === 'createRadialGradient' || p === 'createLinearGradient')
        return () => ({ addColorStop() {} });
      if (p === 'getImageData') return () => ({ data: new Uint8ClampedArray(4) });
      if (p === 'measureText') return () => ({ width: 10 });
      if (typeof p === 'string') return () => undefined;
      return undefined;
    },
    set() { return true; }
  });
}

function makeEl(id) {
  const classes = new Set();
  return {
    id, width: 800, height: 600, textContent: '', innerHTML: '',
    style: {}, dataset: {}, children: [],
    classList: {
      add: (c) => classes.add(c),
      remove: (c) => classes.delete(c),
      contains: (c) => classes.has(c),
      toggle: (c, on) => (on ? classes.add(c) : classes.delete(c))
    },
    getContext: () => makeCtx(),
    addEventListener() {}, removeEventListener() {},
    appendChild(child) { this.children.push(child); },
    querySelector: () => null, querySelectorAll: () => [], closest: () => null,
    remove() {}, parentNode: { removeChild() {} },
    setAttribute() {}, getAttribute: () => null,
    className: '', value: '',
  };
}

// One localStorage for both "page loads" (a browser keeps it across F5).
const store = new Map();

function bootPage() {
  const els = {};
  const sandbox = {
    console,
    performance: { now: () => 1000 },
    requestAnimationFrame: () => 0,
    setTimeout, clearTimeout, setInterval, clearInterval,
    innerWidth: 1280, innerHeight: 720, devicePixelRatio: 1,
    addEventListener: () => {}, removeEventListener: () => {},
    location: { reload() {}, href: 'http://localhost/' },
    localStorage: {
      getItem: (k) => (store.has(k) ? store.get(k) : null),
      setItem: (k, v) => { store.set(k, String(v)); },
      removeItem: (k) => { store.delete(k); },
    },
    document: {
      readyState: 'complete',
      scripts: [],
      getElementById: (id) => (els[id] ||= makeEl(id)),
      createElement: (tag) => makeEl(tag),
      addEventListener() {},
      querySelector: () => null,
      querySelectorAll: () => [],
      body: makeEl('body'),
    },
  };
  sandbox.window = sandbox;
  sandbox.globalThis = sandbox;
  const context = vm.createContext(sandbox);
  for (const f of files) {
    vm.runInContext(fs.readFileSync(f, 'utf8'), context, { filename: f });
  }
  // The main menu boots the simulation paused; this suite drives update()
  // directly, so start the game exactly the way picking a world does.
  if (sandbox.game) {
    sandbox.game.titleScreenOpen = false;
    sandbox.game.paused = false;
  }
  return { sandbox, g: sandbox.game, els };
}

// Records every hit that actually lands (damagePlayer + direct player hits).
function watchDamage(g) {
  const hits = [];
  let insideDamagePlayer = false;
  const origDamagePlayer = g.damagePlayer.bind(g);
  const origPlayerTakeDamage = g.player.takeDamage.bind(g.player);
  g.player.takeDamage = (amount, sound, particles, sourceX) => {
    const taken = origPlayerTakeDamage(amount, sound, particles, sourceX);
    if (taken > 0 && !insideDamagePlayer) hits.push({ taken, cause: '(direct player hit)' });
    return taken;
  };
  g.damagePlayer = (amount, sourceX, cause) => {
    insideDamagePlayer = true;
    const taken = origDamagePlayer(amount, sourceX, cause);
    insideDamagePlayer = false;
    if (taken > 0) hits.push({ taken, cause });
    return taken;
  };
  return hits;
}

let fail = 0;
const check = (label, ok, detail = '') => {
  console.log((ok ? 'OK:   ' : 'FAIL: ') + label + (detail ? ' (' + detail + ')' : ''));
  if (!ok) fail = 1;
};


// ------------------------------------------------------------ page load #1
const page1 = bootPage();
const g1 = page1.g;
const hits1 = watchDamage(g1);

// Mob on top of the player and a boss parked on the same spot: the worst case
// a player can be in when they hit refresh.
const mob = new page1.sandbox.Monster(g1.player.x, g1.player.y, 'zombie');
g1.monsters.push(mob);
g1.summonBoss(false);
g1.boss.x = g1.player.x + 6;
g1.boss.y = g1.player.y;

const hpBefore = g1.player.hp;
for (let i = 0; i < 120; i++) g1.update(1 / 60); // 2s of fighting
check('fighting a mob + boss hurts the player',
  hits1.length > 0 && g1.player.hp < hpBefore,
  `hp ${Math.round(hpBefore)} -> ${Math.round(g1.player.hp)}, ${hits1.length} hits`);

g1.saveGame(true); // the 90s autosave (or the SAVE button) during the fight
const payload = JSON.parse(store.get('terracraft-world-slot-1'));
check('save contains no live battle state',
  payload.boss === null && !/zombie|monsters/.test(JSON.stringify(payload)),
  'boss=' + JSON.stringify(payload.boss));

// Existing saves (written before this fix) still carry a live boss. Put one
// right back on the player's saved position to make sure loading such a save
// abandons the fight instead of resuming it.
payload.boss = { x: payload.player.x + 6, y: payload.player.y, hp: 3000, phase: 1, kind: 'forest' };
store.set('terracraft-world-slot-1', JSON.stringify(payload));

// ------------------------------------------------------------ page load #2 (F5)
const page2 = bootPage();
const g2 = page2.g;
const graceOnBoot = g2.player.invulnerableTime;

check('refresh does not re-create the boss', g2.boss === null,
  'boss=' + (g2.boss ? g2.boss.name : 'none'));
check('refresh clears mobs and projectiles',
  g2.monsters.length === 0 && g2.projectiles.length === 0,
  `monsters=${g2.monsters.length} projectiles=${g2.projectiles.length}`);
check('boss panel is hidden again', page2.els['boss-panel'].classList.contains('hidden'));
check('the player gets spawn grace after a reload', graceOnBoot >= 2.5,
  graceOnBoot.toFixed(2) + 's of i-frames');
check('the boss-fled notice is shown',
  page2.els['toast-container'].children.some(t => /boss has fled/.test(t.textContent)));

const hits2 = watchDamage(g2);
for (let i = 0; i < 300; i++) g2.update(1 / 60); // 5s after the refresh
check('no damage is taken after refreshing', hits2.length === 0,
  hits2.map(h => `-${h.taken} (${h.cause})`).join(', ') || 'no hits');
check('the player is still alive after the reload',
  g2.player.hp > 0 && !g2.isDead,
  'hp=' + Math.round(g2.player.hp) + (g2.isDead ? ' (dead)' : ''));

// ------------------------------------------- the LOAD button, mid-session
g2.summonBoss(false);
const bossWasLive = !!(g2.boss && !g2.boss.dead);
g2.boss.x = g2.player.x;
g2.boss.y = g2.player.y;
const hits3 = watchDamage(g2);
g2.loadGame(true);
check('the LOAD button abandons a live fight too',
  bossWasLive && g2.boss === null && g2.player.invulnerableTime >= 2.5,
  `boss live before load=${bossWasLive}, after=${!!g2.boss}, grace=${g2.player.invulnerableTime.toFixed(2)}s`);
for (let i = 0; i < 120; i++) g2.update(1 / 60); // 2s after loading
check('no damage is taken after pressing LOAD', hits3.length === 0,
  hits3.map(h => `-${h.taken} (${h.cause})`).join(', ') || 'no hits');

console.log(fail ? 'RELOAD CHECK FAILED' : 'RELOAD CHECK PASSED');
process.exit(fail);
