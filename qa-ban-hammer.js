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
check('the ban SFX played once for the swing', sfxFired === 1, sfxFired + ' times');

// The effect must NOT fire on a swing that connects with nothing, or every
// wave at empty air would spam red text and the ban sting.
const sfxBeforeWhiff = sfxFired;
g.monsters.length = 0;
g.particles.damageTexts.length = 0;
g.attackCooldown = 0;
g.handleLeftClick();
check('a swing at nothing is silent', sfxFired === sfxBeforeWhiff, sfxFired + ' times');
check('a swing at nothing leaves no stamp',
  g.particles.damageTexts.filter(t => t.isBan).length === 0);

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
step('5. The ban stamp and SFX are actually wired up');
check('addBanStamp exists', typeof g.particles.addBanStamp === 'function');
check('playBanHammer exists', typeof g.sound.playBanHammer === 'function');
check('the screen overlay is gone', typeof g.showBanOverlay === 'undefined');
const html = fs.readFileSync('terraria.html', 'utf8');
check('terraria.html no longer carries the screen overlay', !html.includes('ban-overlay'));
check('particles.js draws the on-mob stamp', /isBan/.test(fs.readFileSync('particles.js', 'utf8')));

// The stamp must be attached to each VICTIM, not drawn once over the screen, so
// one swing through a group produces one stamp per mob hit.
g.monsters.length = 0;
g.particles.damageTexts.length = 0;
g.inventory[0] = { id: 'ban_hammer', count: 1 };
const stampRing = plantRing();
g.attackCooldown = 0;
g.handleLeftClick();
const stamps = g.particles.damageTexts.filter(t => t.isBan);
check('one swing stamps every mob it hit',
  stamps.length === stampRing.length,
  stamps.length + ' stamps for ' + stampRing.length + ' mobs');
check('the stamp text is !!BANNED!!', stamps.length > 0 && stamps[0].text === '!!BANNED!!',
  stamps.length && stamps[0].text);
check('the stamp is red', stamps.length > 0 && stamps[0].color === '#ff1a1a',
  stamps.length && stamps[0].color);
g.monsters.length = 0;
g.sound.playBanHammer = realSfx;

// ══════════════════════════════════════════════════════════════════════════
step('6. The hammer one-shots anything, including the Sovereign');
check('the hammer deals ten million', hammer.damage === 10000000, hammer.damage);
{
  const victim = new global.Monster(g.player.x + 60, g.player.y, 'zombie');
  g.monsters.push(victim);
  g.attackCooldown = 0;
  g.handleLeftClick();
  check('a trash mob dies outright', victim.dead, 'hp=' + victim.hp);
  g.monsters.length = 0;
}
{
  const dragon = new global.SkeletonDragonBoss(g);
  g.boss = dragon;
  dragon.x = g.player.x + 80; dragon.y = g.player.y;
  g.attackCooldown = 0;
  g.handleLeftClick();
  check('the 100,000 HP Sovereign dies to one swing', dragon.dead, 'hp=' + Math.round(dragon.hp));
  g.boss = null;
}

// ══════════════════════════════════════════════════════════════════════════
step('7. Trash mobs cannot chunk a heavily-armoured player');
// The report was "some mobs do so much damage even though it's just a natural
// spawn and not a boss, even in OP armour". Asserted against the REAL runtime
// path (Game.damagePlayer -> the ceiling -> Player.takeDamage) rather than a
// re-derivation of the armour maths, so it cannot drift from the shipping code.
const worstRaw = 46; // bone_serpent, the hardest natural underworld spawn
const cap = g.trashDamageCeiling(worstRaw, false);
check('a trash hit is capped', cap < worstRaw, worstRaw + ' -> ' + cap);
check('the cap is a sane slice of max HP (' + cap + ' of ' + g.player.maxHp + ')',
  cap <= Math.max(8, Math.ceil(g.player.maxHp * 0.14)));
check('a boss is never capped', g.trashDamageCeiling(worstRaw, true) === worstRaw);

// And the end-to-end version: with the best plate worn, one trash hit must not
// exceed the ceiling even after the raw 46-damage bite.
g.player.hp = g.player.maxHp;
g.player.invulnerableTime = 0;
g.equipArmor('ossuary_armor');
const before = g.player.hp;
g.damagePlayer(worstRaw, g.player.x + 10, 'test');
const realLoss = before - g.player.hp;
check('wearing the best plate, a trash hit costs <= ' + cap + ' HP (' + realLoss + ')',
  realLoss <= cap, realLoss + ' HP');

// An elite must no longer be a damage multiplier that rivals a boss.
{
  const e = new global.Monster(0, 0, 'zombie');
  const base = e.damage;
  e.makeElite();
  check('an elite bumps damage only slightly (' + base + ' -> ' + e.damage + ')',
    e.damage <= Math.round(base * 1.15), e.damage);
  check('an elite is still much tankier', e.maxHp > base * 1.5, e.maxHp);
}

// And spawning must never embed a mob in rock.
check('findOpenSpawn exists', typeof g.findOpenSpawn === 'function');
{
  // Find a genuinely solid tile and prove the helper refuses to place a mob there.
  let solidSpot = null;
  const wx = Math.floor(g.player.x / 24) + 6;
  for (let ty = 4; ty < 200; ty++) {
    if (g.world.isSolid(wx, ty) && g.world.isSolid(wx, ty + 1) && g.world.isSolid(wx, ty + 2)) {
      solidSpot = { x: wx * 24, y: ty * 24 }; break;
    }
  }
  if (solidSpot) {
    const deep = { x: solidSpot.x, y: solidSpot.y - 60 };
    const s = g.findOpenSpawn(deep.x, deep.y);
    if (s) {
      check('a relocated spawn is not inside solid rock',
        !g.world.isSolid(Math.floor(s.x / 24), Math.floor(s.y / 24)));
      check('...and has a floor under it',
        g.world.isSolid(Math.floor(s.x / 24), Math.floor((s.y + 34) / 24)));
    } else {
      check('deep rock refuses to spawn anything', true);
    }
  } else {
    check('could not locate solid rock to test against', false);
  }
}


// ══════════════════════════════════════════════════════════════════════════
step('8. A boss skill projectile is NOT trash-capped');
// Report: "the Skeleton Dragon's skills only do 4 damage — it's too easy."
// Root cause: the hostile-projectile hit branch called damagePlayer() without
// isBoss, so a 60-92 damage boss shard was clipped to the trash ceiling
// (~14) BEFORE armour, and the best plate then shredded what was left.
// Asserted through the REAL runtime path — spawn -> g.update() -> the hit
// branch -> trashDamageCeiling -> Player.takeDamage — with a negative
// CONTROL: the same raw damage from an UNFLAGGED hostile projectile must
// still be capped, so this cannot pass if the fromBoss flag is ignored.
g.titleScreenOpen = false;
g.paused = false;
g.monsters.length = 0;
g.boss = null;
g.equipArmor('ossuary_armor'); // best plate in the game: armour cannot explain the gap
const skillRaw = 92; // phase-3 bone volley shard
const skillCap = g.trashDamageCeiling(skillRaw, false);
function hostileShotLoss(dmg, fromBoss) {
  g.player.hp = g.player.maxHp;
  g.player.invulnerableTime = 0;
  const p = new global.Projectile(
    g.player.x + g.player.width / 2, g.player.y + g.player.height / 2,
    0, 0, 'bone_shard', dmg, true, 4.4, 70);
  if (fromBoss) p.fromBoss = true;
  g.projectiles.push(p);
  const before = g.player.hp;
  g.update(1 / 60);
  return before - g.player.hp;
}
const skillLoss = hostileShotLoss(skillRaw, true);
check('a flagged boss skill lands at full force (' + skillLoss + ' of raw ' + skillRaw + ')',
  skillLoss > skillCap, 'trash cap would be ' + skillCap);
const controlLoss = hostileShotLoss(skillRaw, false);
check('...an unflagged hostile shot is STILL capped (' + controlLoss + ' <= ' + skillCap + ')',
  controlLoss > 0 && controlLoss <= skillCap, controlLoss + ' HP');
check('the gap is real: boss skills out-hit trash shots (' + skillLoss + ' vs ' + controlLoss + ')',
  skillLoss > controlLoss, skillLoss + ' vs ' + controlLoss);
g.projectiles.length = 0;

console.log('\n' + (failures === 0
  ? 'BAN HAMMER QA: all checks passed'
  : 'BAN HAMMER QA: ' + failures + ' FAILED'));
process.exit(failures === 0 ? 0 : 1);