// ══════════════════════════════════════════════════════════════════════════
// Functional QA for The Ban Hammer (node qa-ban-hammer.js)
//
// Three promises are made to the player about this weapon, and each is the
// kind that is easy to state and easy to quietly break:
//
//   1. It hits ANYTHING — one swing connects with every monster standing
//      around the player, whichever way the mouse points.
//   2. It can ONLY come from the creative menu. Not craftable, not a drop,
//      not from a chest, not from a hand-edited save.
//   3. A landed swing fires the "!!BANNED!!" overlay and the ban SFX.
//
// Promise 2 is the one that rots. "We didn't add a recipe" is not the same as
// "it cannot be obtained", and the day someone wires a drop table it would be
// in the world for good. So this asserts on the enforcement itself: the guard
// in addItem must refuse the item from every non-creative caller and let the
// creative menu through.
//
// Promise 1 gets a NEGATIVE CONTROL — the same swing, same aim, with a plain
// sword — so the test cannot pass if `hitsAll` were quietly ignored.
// ══════════════════════════════════════════════════════════════════════════
const fs = require('fs');
const vm = require('vm');

let failures = 0;
const check = (label, ok, detail = '') => {
  if (!ok) failures++;
  console.log((ok ? '  PASS ' : '  FAIL ') + label + (!ok && detail ? ' — ' + detail : ''));
};
const step = (title) => console.log('\n▸ ' + title);

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
    style: {}, dataset: {}, offsetHeight: 100,
    classList: (() => {
      const set = new Set();
      return {
        add: (c) => set.add(c), remove: (c) => set.delete(c),
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
  'underworld.js', 'space.js', 'juice.js', 'npcs.js', 'journey.js', 'terraria.js'];
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
const { ITEMS, RECIPES } = global;
if (!g) { console.log('BOOT FAIL: no game'); process.exit(1); }

const hammer = ITEMS.ban_hammer;
// ══════════════════════════════════════════════════════════════════════════
step('1. The item exists and is shaped like a melee weapon');
check('ITEMS.ban_hammer exists', !!hammer);
check('it is named The Ban Hammer', hammer && hammer.name === 'The Ban Hammer',
  hammer && hammer.name);
check('it is a weapon', hammer && hammer.type === 'weapon');
check('it swings as melee', hammer && hammer.weaponType === 'melee');
check('it has a positive damage number', hammer && hammer.damage > 0, hammer && hammer.damage);
check('it carries an icon for the slot to draw', !!(hammer && hammer.icon), hammer && hammer.icon);
check('it does not stack', hammer && hammer.stackMax === 1);
check('it is flagged creativeOnly', hammer && hammer.creativeOnly === true);
check('it is flagged hitsAll', hammer && hammer.hitsAll === true);
check('it has a wider ban radius than its swing arc',
  hammer && hammer.banRadius > hammer.range,
  hammer && (hammer.banRadius + ' vs ' + hammer.range));

// ══════════════════════════════════════════════════════════════════════════
step('2. It is unobtainable by every non-creative route');
check('no recipe crafts it', !RECIPES.some(r => r.result && r.result.id === 'ban_hammer'));

let literalHits = 0;
for (const f of ['terraria.js', 'space.js', 'underworld.js', 'entities.js']) {
  literalHits += (fs.readFileSync(f, 'utf8').match(/'ban_hammer'/g) || []).length;
}
// The only quoted occurrences should be the item definition and the guard
// inside addItem — both are the enforcement, not a source of the item.
check('the id is quoted only in its definition and its guard', literalHits <= 2,
  literalHits + ' quoted occurrences in source');

// The real guarantee is the runtime guard, exercised through the exact call
// every grant path uses: addItem(id, count) with the default creative=false is
// what crafting, mining, fishing, chest loot and item pickup all call.
check('addItem refuses it', g.addItem('ban_hammer', 1) === false);
check('...and the bag is still empty', g.countItem('ban_hammer') === 0,
  g.countItem('ban_hammer'));
check('addItem refuses a bulk grant too', g.addItem('ban_hammer', 99) === false);
check('...still empty', g.countItem('ban_hammer') === 0, g.countItem('ban_hammer'));
check('addItem(id, n, false) is refused', g.addItem('ban_hammer', 1, false) === false);
// canAddItem is the advisory half of the same question, and every caller
// (crafting, stack consolidation, the saved-inventory restore) trusts it.
// If it answered "yes, there is room" the caller would go ahead and spend
// materials before addItem refused the result.
check('canAddItem says no', g.canAddItem('ban_hammer', 1) === false);

// A save that lists one must not smuggle it in either. This goes through the
// real save/load round-trip (write localStorage, then loadGame) because the
// restore path builds `inventory` from scratch and never calls addItem — poking
// the array would not have tested anything, and in fact did not catch the hole.
try {
  g.saveGame(true);
  const payload = JSON.parse(localStorage.getItem(g.saveKey));
  payload.inventory = payload.inventory.map(s => (s && s.id ? { id: s.id, count: s.count } : { id: 'empty', count: 0 }));
  payload.inventory.push({ id: 'ban_hammer', count: 1 });
  localStorage.setItem(g.saveKey, JSON.stringify(payload));

  g.loadGame(true);
  check('a save listing it does not smuggle it in', g.countItem('ban_hammer') === 0,
    g.countItem('ban_hammer'));
} catch (e) {
  check('a save listing it does not smuggle it in', false, e.message);
}

// ══════════════════════════════════════════════════════════════════════════
step('3. The creative menu is the one door that opens');
check('the creative menu lists it', Object.values(ITEMS).some(i => i.id === 'ban_hammer'));
const cat = g.creativeCategoryOf ? g.creativeCategoryOf(hammer) : null;
check('it files under a real category chip', cat && cat !== 'misc', cat);

g.giveCreativeItem('ban_hammer', 1);
check('the creative menu can grant it', g.countItem('ban_hammer') === 1,
  g.countItem('ban_hammer'));
check('it is now held and usable', g.inventory.some(s => s.id === 'ban_hammer'));
// ══════════════════════════════════════════════════════════════════════════
step('4. One swing hits EVERYTHING in the room');

// Plant a ring of eight monsters around the player, all inside the ban radius,
// and aim the mouse well away from most of them. A normal melee would connect
// with only the couple inside its ~0.9 rad cone.
function plantRing() {
  const ring = [];
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2;
    const m = new global.Monster(g.player.x + Math.cos(a) * 150, g.player.y + Math.sin(a) * 150, 'zombie');
    m.hp = m.maxHp = 500;
    g.monsters.push(m);
    ring.push(m);
  }
  return ring;
}
const hurtCount = (ring) => ring.filter(m => m.dead || m.hp < m.maxHp).length;

g.player.x = 400; g.player.y = 300;
g.player.hp = g.player.maxHp;
g.camera.x = 0; g.camera.y = 0;
// Aim the mouse well away from most of the ring: a normal melee would connect
// with only the couple inside its ~0.9 rad cone.
g.input.mouseX = g.player.x + 1000;
g.input.mouseY = g.player.y;
g.player.selectedSlot = 0;

g.inventory[0] = { id: 'ban_hammer', count: 1 };
const hammerRing = plantRing();
const overlayEl = document.getElementById('ban-overlay');
let sfxFired = 0;
const realSfx = g.sound.playBanHammer.bind(g.sound);
g.sound.playBanHammer = () => { sfxFired++; };

g.attackCooldown = 0;
g.handleLeftClick();

check('every monster in the ban radius was hit',
  hurtCount(hammerRing) === hammerRing.length,
  hurtCount(hammerRing) + '/' + hammerRing.length + ' hurt');
check('the !!BANNED!! overlay was shown', !!overlayEl.classList.contains('ban-flash'));
check('the ban SFX played once for the swing', sfxFired === 1, sfxFired + ' times');

// The overlay must NOT fire on a swing that connects with nothing, or it
// would sit on screen every time the player waves at empty air.
overlayEl.classList.remove('ban-flash');
g.monsters.length = 0;
g.attackCooldown = 0;
g.handleLeftClick();
check('a swing at nothing shows no banner',
  !overlayEl.classList.contains('ban-flash'));

// Negative control: the SAME ring, the SAME aim, with a plain sword must not
// hit everything. Without this the test could still pass if hitsAll were
// ignored and the cone somehow covered the room.
g.monsters.length = 0;
g.inventory[0] = { id: 'copper_sword', count: 1 };
const swordRing = plantRing();
g.attackCooldown = 0;
g.handleLeftClick();
check('a plain sword hits only part of that same ring (control)',
  hurtCount(swordRing) < 8, hurtCount(swordRing) + '/8 hurt');

g.monsters.length = 0;
g.sound.playBanHammer = realSfx;

// ══════════════════════════════════════════════════════════════════════════
step('5. The overlay and SFX are actually wired up');
check('showBanOverlay exists', typeof g.showBanOverlay === 'function');
check('playBanHammer exists', typeof g.sound.playBanHammer === 'function');

const html = fs.readFileSync('terraria.html', 'utf8');
check('terraria.html carries the overlay markup', html.includes('id="ban-overlay"'));
check('...with the !!BANNED!! wordmark', html.includes('!!BANNED!!'));
const css = fs.readFileSync('terraria.css', 'utf8');
check('terraria.css animates it', css.includes('ban-hit') && css.includes('ban-glitch-sweep'));
check('...in a red hacker palette', /#ff1a1a|#ff0000/.test(css));

// ══════════════════════════════════════════════════════════════════════════
step('6. The Sovereign is a six-figure wall again');
// Raised directly rather than fought to: the point is the value the constructor
// bakes in, not the encounter. A live boss cannot exist here anyway — the save
// round-trip above deliberately ends any encounter.
const dragon = new global.SkeletonDragonBoss(g);
check('the dragon is constructed at 100,000 max HP',
  dragon.maxHp === 100000, dragon.maxHp);
check('it starts whole (hp === maxHp)', dragon.hp === dragon.maxHp,
  dragon.hp + '/' + dragon.maxHp);
check('it is a six-figure pool', dragon.maxHp >= 100000, dragon.maxHp);

console.log('\n' + (failures === 0
  ? 'BAN HAMMER QA: all checks passed'
  : 'BAN HAMMER QA: ' + failures + ' FAILED'));
process.exit(failures === 0 ? 0 : 1);