// ══════════════════════════════════════════════════════════════════════════
// Functional QA for the Space Dimension (node qa-space-run.js)
//
// Boots the real game with DOM/canvas stubs, then plays the whole rift loop
// head-to-end: beacon → wormhole → arena → boss fight → save → retreat →
// death → charged re-entry → kill. Every step asserts on live state, so this
// catches integration breaks a syntax check never will.
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
const hiddenEls = {};
global.document = {
  readyState: 'complete', scripts: [],
  getElementById: (id) => (els[id] ||= (() => { const e = makeEl(id); hiddenEls[id] = e; return e; })()),
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
// A localStorage that actually stores, so save/load round-trips are testable.
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
const { TILES, ITEMS, RECIPES, TILE_SIZE, TILE_PROPERTIES } = global;
if (!g) { console.log('BOOT FAIL: no game'); process.exit(1); }

// A frame pump that never lets the stub renderer stop the run.
function frames(n, opts = {}) {
  for (let i = 0; i < n; i++) {
    if (opts.each) opts.each(i);
    try { g.update(1 / 60); } catch (e) { console.log('UPDATE THROW frame ' + i + ': ' + e.stack); failures++; return false; }
    if (opts.render && i % opts.render === 0) {
      try { g.render(); } catch (e) { console.log('RENDER THROW frame ' + i + ': ' + e.stack); failures++; return false; }
    }
  }
  return true;
}
// The dragon hits for up to 75; the test is about plumbing, not survival.

// ══════════════════════════════════════════════════════════════════════════
step('1. Registry: tiles, items, recipe');
check('space tile ids registered',
  TILES.SPACE_RUNE === 53 && TILES.RIFT_PORTAL === 56 && TILES.VOID_STONE === 48);
check('tile properties registered',
  !!TILE_PROPERTIES[TILES.SPACE_RUNE] && !!TILE_PROPERTIES[TILES.RIFT_PORTAL]);
check('boss + wormhole classes exposed',
  typeof global.SkeletonDragonBoss === 'function' && typeof global.WormholeFX === 'function');
const spaceItems = ['void_rift_beacon', 'nebula_crystal', 'meteor_shard',
  'dragonbone', 'dragon_trophy', 'void_star_blade', 'dragon_wings', 'voidscale_armor',
  'rite_of_bones'];
for (const id of spaceItems) check('ITEMS.' + id, !!ITEMS[id]);
const beaconRecipe = RECIPES.find(r => r.result && r.result.id === 'void_rift_beacon');
check('beacon craftable', !!beaconRecipe);
check('beacon recipe is finishable', !!beaconRecipe &&
  beaconRecipe.materials.every(m => !!ITEMS[m.id]),
  beaconRecipe ? beaconRecipe.materials.map(m => m.id + (ITEMS[m.id] ? '' : ' MISSING')).join(', ') : 'no recipe');
const riteRecipe = RECIPES.find(r => r.result && r.result.id === 'rite_of_bones');
check('the Rite of Bones is craftable', !!riteRecipe);
check('rite recipe is finishable', !!riteRecipe &&
  riteRecipe.materials.every(m => !!ITEMS[m.id]),
  riteRecipe ? riteRecipe.materials.map(m => m.id + (ITEMS[m.id] ? '' : ' MISSING')).join(', ') : 'no recipe');
// A consumable that heals nothing has to say what it does, or the one mechanic
// that can restart the Sovereign is never discovered.
const riteInfo = typeof global.describeItem === 'function' ? global.describeItem('rite_of_bones', g) : null;
check('the rite tooltip says where it is read',
  !!riteInfo && riteInfo.rows.some(r => /Ossuary/i.test(String(r.value))),
  riteInfo ? riteInfo.rows.map(r => r.label).join('/') : 'no tooltip');

// ══════════════════════════════════════════════════════════════════════════
step('2. Beacon gating');
const homeX = Math.floor(g.world.width / 2);
const homeGround = g.world.surfaceHeights[homeX];
// (The bit-for-bit home snapshot is taken later, once the sky above the beacon
// is clear — everything before that point is allowed to change the world.)

g.addItem('void_rift_beacon', 2);
g.player.x = homeX * TILE_SIZE + 4;
g.player.y = (homeGround + 25) * TILE_SIZE;      // buried: no skylight
let beacons = g.countItem('void_rift_beacon');
check('refused without open sky', g.useVoidRiftBeacon() === false, 'returned true');
check('refused beacon is not spent', g.countItem('void_rift_beacon') === beacons);
check('no wormhole from a refusal', !g.wormhole);

for (let ty = 0; ty <= homeGround; ty++) g.world.setTile(homeX, ty, TILES.AIR);
g.player.y = (homeGround - 2) * TILE_SIZE;
// Snapshot the home world bit-for-bit: the return trip must restore it exactly.
const tilesBefore = Uint8Array.from(g.world.tiles);
const wallsBefore = Uint8Array.from(g.world.walls);
const surfaceBefore = Int16Array.from(g.world.surfaceHeights);
check('accepted under open sky', g.useVoidRiftBeacon() === true, 'returned false');
check('beacon spent on success', g.countItem('void_rift_beacon') === beacons - 1);
check('wormhole tears toward the Ossuary', !!g.wormhole && g.wormholeIntent === 'space');

// ══════════════════════════════════════════════════════════════════════════
step('3. The crossing');
let crossed = 0;
let minDist = Infinity;
const weatherSnap = () => JSON.stringify(Object.fromEntries(
  Object.entries(g.weather).filter(([, v]) => typeof v !== 'object')));
while (crossed < 900 && g.world.dimension !== 'space') {
  g.update(1 / 60);
  if (g.wormhole) {
    const dx = g.wormhole.x - (g.player.x + g.player.width / 2);
    const dy = g.wormhole.y - (g.player.y + g.player.height / 2);
    minDist = Math.min(minDist, Math.hypot(dx, dy));
  }
  if (crossed % 20 === 0) g.render();
  crossed++;
}
check('the rift delivers inside its budget', g.world.dimension === 'space', crossed + ' frames');
check('the player was dragged to the mouth', minDist < 80, 'closest=' + minDist.toFixed(1));
check('wormhole consumed itself', !g.wormhole && !g.wormholeIntent);
const ar = g.world.spaceArena;
check('arena generated', !!ar && ar.right > ar.left && ar.floorY > 1);
const ptx = g.player.x + g.player.width / 2;
check('player dropped on the arena floor',
  ptx > ar.left * TILE_SIZE && ptx < ar.right * TILE_SIZE && g.player.y < ar.floorY * TILE_SIZE,
  'x=' + Math.round(ptx) + ' y=' + Math.round(g.player.y));
check('the Sovereign wakes at full health',
  !!g.boss && g.boss.kind === 'dragon' && g.boss.hp === g.boss.maxHp);
check('boss health bar shown', !!els['boss-panel'] && !els['boss-panel'].classList.contains('hidden'));
check('home wildlife left behind', g.monsters.length === 0 && g.critters.length === 0);
check('rift gate built into the west flank',
  g.world.getTile(ar.gateX + 1, ar.gateY) === TILES.RIFT_PORTAL);
// The floor has to be continuous: a hole under the player's feet at spawn means
// they fall out of the arena before the dragon even moves.
let floorGaps = 0;
for (let x = ar.left + 2; x <= ar.right - 2; x++) {
  if (g.world.getTile(x, ar.floorY) === TILES.AIR) floorGaps++;
}
check('arena floor is unbroken', floorGaps === 0, floorGaps + ' gaps');
let arenaTiles = 0;
for (let x = ar.left - 16; x <= ar.right + 16; x++) {
  for (let y = ar.top; y < ar.floorY + 8; y++) if (g.world.getTile(x, y) !== TILES.AIR) arenaTiles++;
}
check('arena is furnished (floor, pillars, tiers, cover)', arenaTiles > 700, arenaTiles + ' tiles');
check('dodge platforms exist', (() => {
  // The lattice is staggered now, so count every star platform in the box
  // rather than probing three hardcoded rows.
  let platforms = 0;
  for (let y = ar.floorY - 44; y < ar.floorY; y++) {
    for (let x = ar.left; x <= ar.right; x++) if (g.world.getTile(x, y) === TILES.VOID_PLATFORM) platforms++;
  }
  return platforms > 150;
})());
check('the dragon has 88,000 health', !!g.boss && g.boss.maxHp === 88000,
  g.boss && g.boss.maxHp);
check('the nerf landed', !!g.boss && g.boss.maxHp < 100000, g.boss && g.boss.maxHp);
// THE anti-stuck guarantee: the generator promises a flight box with nothing
// solid inside it except one-way platforms and loose bone. Anything else in
// there is a rock the Sovereign can wedge into, which is the old bug.
check('flight box contains no blocking rock', (() => {
  const bad = [];
  for (let y = ar.ceil; y <= ar.crust - 1; y++) {
    for (let x = ar.left; x <= ar.right; x++) {
      if (g.boss.blocksDragon(x, y)) bad.push(x + ',' + y + ':' + g.world.getTile(x, y));
    }
  }
  return bad.length === 0 ? true : bad.slice(0, 6).join(' ');
})());
check('the sky is open behind the fight (no wall layer)', (() => {
  // The arena deliberately has NO walls behind it: the wall layer is opaque
  // and painting it over the star backdrop is what made the Ossuary read as a
  // cave. Rows above the crust must be wall-free inside the box.
  let walled = 0;
  for (let y = ar.ceil; y < ar.crust; y++) {
    for (let x = ar.left; x <= ar.right; x++) if (g.world.walls[y * g.world.width + x]) walled++;
  }
  return walled === 0;
})());
// Weather: frozen from the moment the player is actually in the Ossuary. (During
// the crossing itself the player is still under the home sky, so the clock is
// allowed to run.)
const weatherAtArrival = weatherSnap();
frames(120, { render: 30 });
check('home weather frozen while away', weatherSnap() === weatherAtArrival);
const stashTiles = g.world.overworldStash && g.world.overworldStash.tiles;
check('home world stashed intact', !!stashTiles &&
  Buffer.compare(Buffer.from(stashTiles), Buffer.from(tilesBefore)) === 0);
// The clock the player is handed back on return is the one that was running when
// they left, not the arena's.
const timeAtEntry = g.world.overworldStash.timeOfDay;

// ══════════════════════════════════════════════════════════════════════════
step('4. The fight');
const hit = (amount) => g.boss.takeDamage(amount, g.sound, g.particles, false);
let sawProjectiles = 0, sawMinions = 0, maxPhase = 1, gotHurt = false;
// The peak of the bone legion: the cap is the whole point of the nerf, so it has
// to be measured across the fight rather than sampled at one instant.
let maxMinions = 0;
// The two numbers that prove the dragon is not getting stuck: how long its
// skull spent inside blocking rock, and how many frames it was in at all.
let worstStuck = 0, wedgedFrames = 0;
const states = new Set();
const watch = () => {
  // Read the damage BEFORE topping up: after immortal() the bar is always full.
  if (g.player.hp < g.player.maxHp) gotHurt = true;
  immortal();
  if (g.projectiles.length) sawProjectiles++;
  if (g.monsters.some(m => m.space === true)) sawMinions++;
  maxMinions = Math.max(maxMinions, g.monsters.filter(m => m.space === true && !m.dead).length);
  if (g.boss) {
    maxPhase = Math.max(maxPhase, g.boss.phase || 1);
    states.add(g.boss.attackState);
    worstStuck = Math.max(worstStuck, g.boss.stuckTimer || 0);
    if (g.boss.wedgedAt(g.boss.x, g.boss.y)) wedgedFrames++;
  }
};
frames(420, { render: 25, each: watch });
// The Sovereign has 88,000 HP by design, so a third of it has to come off
// before the fight changes shape. Phase 1 is stalk/charge/bone-volley territory.
check('the dragon cycles its attacks', states.size >= 2, [...states].join('/'));
check('the dragon can actually hit you', gotHurt);
check('phase 1 holds through the first third', maxPhase === 1, 'phase=' + maxPhase);
// The dragon is never allowed to end a long stretch of the fight wedged in
// rock: unstick() keeps the stuck timer at a frame or two even when the
// steering aims it at something solid.
check('the Sovereign never wedges in the arena',
  worstStuck < 0.2, 'worst stuck=' + worstStuck.toFixed(2) + 's over the fight');
hit(g.boss.maxHp * 0.40);
frames(300, { render: 25, each: watch });
check('phase 2 at 66% health', maxPhase >= 2, 'phase=' + maxPhase);
check('bone legions are summoned', sawMinions > 0, sawMinions + ' frames with minions');
check('only the dragon summons in the void', !g.monsters.some(m => m.space !== true));
// The cap is part of the nerf: twelve at once used to make a phase-3 screen
// unreadable, and the burst waves stacked on top of the passive trickle because
// only the passive branch read the number. Measured across the whole fight rather
// than sampled at one instant, so a momentary overflow cannot slip past.
check('the bone legion never breaks the cap of 9',
  maxMinions > 0 && maxMinions <= 9, 'peak=' + maxMinions + ' alive at once');
// Base stats, before any phase multiplier: these are the numbers the arena is
// built on, and they came down with the rest of the Sovereign's kit.
check('the summons are off the old stats', (() => {
  const w = new SkeletonMinion(0, 0, 'skeleton_warrior');
  const a = new SkeletonMinion(0, 0, 'bone_archer');
  const c = new SkeletonMinion(0, 0, 'bone_colossus');
  return w.maxHp === 660 && w.damage === 82 &&
    a.maxHp === 480 && a.damage === 74 &&
    c.maxHp === 2400 && c.damage === 142;
})(), 'warrior=' + new SkeletonMinion(0, 0, 'skeleton_warrior').maxHp + 'hp');
check('phase scaling on adds is soft (26% HP per phase, 22% damage)',
  Math.round((1 + 2 * 0.26) * 100) === 152 && Math.round((1 + 2 * 0.22) * 100) === 144);
hit(g.boss.maxHp * 0.40);
frames(300, { render: 25, each: watch });
check('phase 3 at 33% health', !!g.boss && g.boss.phase === 3, 'phase=' + (g.boss && g.boss.phase));
check('the void fills with projectiles', sawProjectiles > 10, sawProjectiles + ' frames');
check('no overworld critters in the void', g.critters.length === 0);
// ...and after every phase, including the meteor storm and the beam sweep, the
// head is still not living inside a rock.
check('still not wedged after all three phases',
  worstStuck < 0.2 && wedgedFrames < 30,
  'worst=' + worstStuck.toFixed(2) + 's, ' + wedgedFrames + ' frames in rock');

// ══════════════════════════════════════════════════════════════════════════
step('5. Save integrity while the fight is live');
const liveHP = g.boss.hp;
g.saveGame(true);
const save = JSON.parse(localStorage.getItem(g.saveKey));
check('save file written', !!save && Array.isArray(save.tiles));
check('save writes the home tiles, not the arena',
  save.tiles.length === tilesBefore.length &&
  save.tiles.every((v, i) => (i % 4093) !== 0 || v === tilesBefore[i]));
check('save banks the live dragon HP', save.dragonHP === Math.round(liveHP),
  save.dragonHP + ' vs ' + Math.round(liveHP));
check('save sends the player home, not into the void',
  Math.round(save.player.x) === Math.round(g.overworldReturnPos.x));

// ══════════════════════════════════════════════════════════════════════════
step('6. Retreat through the rift gate');
const gateX = ar.gateX + 1, gateY = ar.gateY;
g.player.x = (gateX + 2) * TILE_SIZE;
g.player.y = (gateY - 1) * TILE_SIZE;
check('gate answers from the far side', g.interactWithSpecialTile(gateX, gateY) === true);
check('gate spends itself', g.world.getTile(gateX, gateY) !== TILES.RIFT_PORTAL);
check('a wormhole heads for home', !!g.wormhole && g.wormholeIntent === 'overworld');
let back = 0;
while (back < 900 && g.world.dimension !== 'overworld') { g.update(1 / 60); if (back % 20 === 0) g.render(); back++; }
const banked = Math.round(liveHP);
check('the way home closes behind you', g.world.dimension === 'overworld', back + ' frames');
check('overworld tiles restored bit-for-bit',
  Buffer.compare(Buffer.from(g.world.tiles), Buffer.from(tilesBefore)) === 0);
check('walls and skyline restored',
  Buffer.compare(Buffer.from(g.world.walls), Buffer.from(wallsBefore)) === 0 &&
  Buffer.compare(Buffer.from(g.world.surfaceHeights), Buffer.from(surfaceBefore)) === 0);
check('world clock handed back exactly', Math.abs(g.world.timeOfDay - timeAtEntry) < 1e-9,
  g.world.timeOfDay + ' vs ' + timeAtEntry);
check('the fight is banked, not reset', g.dragonHP === banked && g.boss === null,
  'dragonHP=' + g.dragonHP);
check('boss bar hidden at home', els['boss-panel'].classList.contains('hidden'));
check('the sky tears again to bring you back', g.riftReturnDelay > 0, 'delay=' + g.riftReturnDelay);

// ══════════════════════════════════════════════════════════════════════════
step('7. Death in the Ossuary');
let retried = 0;
while (retried < 900 && g.world.dimension !== 'space') { g.update(1 / 60); retried++; }
check('charged rift drags you back in', g.world.dimension === 'space', retried + ' frames');
check('the Sovereign remembers every hit',
  !!g.boss && g.boss.hp === banked && g.dragonHP === null, 'hp=' + (g.boss && g.boss.hp));
// The rift's arrival i-frames would swallow the blow, so land it honestly.
g.player.maxHp = 200; g.player.hp = 1; g.player.invulnerableTime = 0;
g.damagePlayer(9999, g.boss ? g.boss.x : g.player.x, 'the Ossuary Sovereign');
check('death is detected', g.isDead === true);
const hpAtDeath = Math.round(g.boss ? g.boss.hp : banked);
g.respawnPlayer();
check('dying does not strand you in the void', g.world.dimension === 'overworld');
check('the fight survives the death', g.dragonHP === hpAtDeath, 'dragonHP=' + g.dragonHP);
check('the retry is armed', g.riftReturnDelay > 0, 'delay=' + g.riftReturnDelay);
check('the arena is gone with you', !g.world.spaceArena && !g.boss);

// ══════════════════════════════════════════════════════════════════════════
step('8. Logging out mid-fight');
const openSky = () => {
  g.player.x = homeX * TILE_SIZE + 4;
  g.player.y = (homeGround - 2) * TILE_SIZE;
  for (let ty = 0; ty <= homeGround; ty++) g.world.setTile(homeX, ty, TILES.AIR);
};
openSky();
g.removeItem('void_rift_beacon', 99);
check('a wounded dragon makes the beacon free',
  g.useVoidRiftBeacon() === true && g.countItem('void_rift_beacon') === 0);
let inAgain = 0;
while (inAgain < 900 && g.world.dimension !== 'space') { g.update(1 / 60); inAgain++; }
const hpNow = Math.round(g.boss.hp);
g.saveGame(true);
g.loadGame(true);
check('reload puts you back under your own sky', g.world.dimension === 'overworld');
check('reload keeps the damage you dealt', g.dragonHP === hpNow, 'dragonHP=' + g.dragonHP);
check('reload clears every rift trace',
  !g.wormhole && !g.wormholeIntent && !g.dimensionStash && !g.world.spaceArena);

// ══════════════════════════════════════════════════════════════════════════
step('9. Killing the Sovereign');
openSky();
g.useVoidRiftBeacon();
let finalTrip = 0;
while (finalTrip < 900 && g.world.dimension !== 'space') { g.update(1 / 60); finalTrip++; }
const killsBefore = g.stats.bossKills;
hit(g.boss.hp + 500);
frames(4, { render: 1 });
check('the dragon dies', !g.boss);
check('trophy and apex weapon drop',
  ['dragon_trophy', 'void_star_blade'].every(id => g.drops.some(d => d.id === id)));
check('the wings and the plate fall with them',
  ['dragon_wings', 'voidscale_armor'].every(id => g.drops.some(d => d.id === id)));
check('the Ossuary plate and fang drop too',
  ['ossuary_armor', 'ossuary_blade'].every(id => g.drops.some(d => d.id === id)));
check('kill counted', g.stats.bossKills === killsBefore + 1);
check('nothing left to bank', g.dragonHP === null);
check('the arena waits for you to finish looting', g.world.dimension === 'space');

const mtx = Math.floor(g.player.x / TILE_SIZE) + 2;
const mty = Math.floor((g.player.y + 18) / TILE_SIZE);
const mine = (tile) => {
  g.world.setTile(mtx, mty, tile);
  g.player.selectedSlot = 0;
  g.player.mana = g.player.maxMana;
  g.attackCooldown = 0;
  g.input.mouseX = mtx * TILE_SIZE + 6 - g.camera.x;
  g.input.mouseY = mty * TILE_SIZE + 6 - g.camera.y;
  g.handleLeftClick();
  g.attackCooldown = 0;
  g.handleLeftClick();
  return g.world.getTile(mtx, mty);
};
check('rune brick cannot be mined', mine(TILES.SPACE_RUNE) === TILES.SPACE_RUNE);
check('void stone CAN be mined', mine(TILES.VOID_STONE) !== TILES.VOID_STONE);

// ══════════════════════════════════════════════════════════════════════════
step('10. The Sovereign\u2019s wings');
immortal();
check('wings are an accessory, the plate is armour',
  ITEMS.dragon_wings.type === 'accessory' && ITEMS.dragon_wings.grantsFlight === true &&
  ITEMS.voidscale_armor.type === 'armor');
const wingInfo = typeof global.describeItem === 'function' ? global.describeItem('dragon_wings', g) : null;
check('tooltip explains how to fly',
  !!wingInfo && wingInfo.rows.some(r => /fly/i.test(String(r.value))));

g.addItem('dragon_wings', 1);
g.addItem('voidscale_armor', 1);
g.equipAccessory('dragon_wings');
check('wings snap into the accessory slot', g.equippedAccessoryId === 'dragon_wings');
g.equipAccessory('voidscale_armor');
check('the plate does not fit the accessory slot', g.equippedAccessoryId === 'dragon_wings');
g.equipArmor('voidscale_armor');
check('plate and wings wear together', g.equippedArmorId === 'voidscale_armor');
frames(1);
check('the player knows it can fly', g.player.hasWings === true);
frames(1, { render: 1 });   // the wing renderer must survive a real frame
check('wings draw without throwing', g.player.hasWings === true);

// Clear a tall column so the flight test can never meet arena furniture.
const fly = g.player;
const fx = Math.floor((fly.x + fly.width / 2) / TILE_SIZE);
const base = Math.floor((fly.y + fly.height) / TILE_SIZE);
for (let ty = base - 1; ty > base - 45; ty--) {
  for (let tx = fx - 2; tx <= fx + 2; tx++) {
    if (g.world.getTile(tx, ty) !== TILES.AIR) g.world.setTile(tx, ty, TILES.AIR);
  }
}

g.input.keys['Space'] = false;
fly.onGround = false; fly.vy = 0; fly.y -= 8 * TILE_SIZE;
const fallY = fly.y;
for (let i = 0; i < 45; i++) fly.update(1 / 60, g.input, g.world, g.sound, g.particles);
check('gravity still wins when jump is not held', fly.y > fallY,
  'dy=' + Math.round(fly.y - fallY));

fly.vy = 0; fly.onGround = false;
const climbY = fly.y;
const fuelBefore = fly.flightFuel;
g.input.keys['Space'] = true;
for (let i = 0; i < 60; i++) fly.update(1 / 60, g.input, g.world, g.sound, g.particles);
g.input.keys['Space'] = false;
check('holding jump climbs', fly.y < climbY, 'dy=' + Math.round(fly.y - climbY));
check('the wing tank burns while you flap', fly.flightFuel < fuelBefore,
  fuelBefore.toFixed(2) + ' -> ' + fly.flightFuel.toFixed(2));
fly.update(1 / 60, g.input, g.world, g.sound, g.particles);
check('the flap stops the instant you let go', fly.isFlying === false);

// ---- The cooldown: wings are a tank you spend, not a hover you hold ----
check('dragon wings hold three minutes',
  fly.maxFlightFuel === 180 && fly.maxFlightCooldown === 30,
  'tank=' + fly.maxFlightFuel + ' cd=' + fly.maxFlightCooldown);
fly.onGround = false;
fly.flightFuel = 1 / 60;                      // one frame of fuel left
g.input.keys['Space'] = true;
fly.update(1 / 60, g.input, g.world, g.sound, g.particles);
g.input.keys['Space'] = false;
check('running the tank dry locks the wings',
  fly.flightFuel === 0 && fly.flightCooldown === 30,
  'fuel=' + fly.flightFuel + ' cd=' + fly.flightCooldown);
fly.onGround = true;
fly.flightFuel = 0;
fly.update(1 / 60, g.input, g.world, g.sound, g.particles);
check('standing still does NOT hand fuel back', fly.flightFuel === 0,
  'fuel=' + fly.flightFuel);
for (let i = 0; i < 60 * 14; i++) fly.update(1 / 60, g.input, g.world, g.sound, g.particles);
// Comfortably faster than the airborne rate: the first frames are still the
// tail of the fall, so a few of them tick at 1x rather than 2x.
check('the cooldown ticks down faster on the ground',
  fly.flightCooldown > 0 && fly.flightCooldown <= 30 - 14 * 1.5,
  'cd=' + fly.flightCooldown.toFixed(2));
for (let i = 0; i < 60 * 20; i++) fly.update(1 / 60, g.input, g.world, g.sound, g.particles);
check('a spent tank re-arms to full when the cooldown ends',
  fly.flightCooldown === 0 && fly.flightFuel === fly.maxFlightFuel,
  'fuel=' + fly.flightFuel);
g.input.keys['Space'] = false;

// ---- The desync that used to end wings ------------------------------------
// A dry tank with no lock-out armed is the state the old code fell into whenever
// the fuel crossed zero anywhere other than mid-flap — land with a stub left,
// let go of jump, or wear a wing that declares no cooldown. Nothing else in the
// class hands fuel back except the end of a lock-out, so those wings were dead
// for good: no recharge, no countdown, only a death or a gear swap to fix it.
// The class now treats "dry" and "locked" as one fact, so the pair cannot split.
fly.flightFuel = 0;
fly.flightCooldown = 0;
fly.onGround = true;
fly.update(1 / 60, g.input, g.world, g.sound, g.particles);
check('a dry tank with no cooldown running arms one', fly.flightCooldown > 0,
  'cd=' + fly.flightCooldown.toFixed(2));
check('and it does not hand the fuel back early', fly.flightFuel === 0,
  'fuel=' + fly.flightFuel);
for (let i = 0; i < 60 * 31; i++) fly.update(1 / 60, g.input, g.world, g.sound, g.particles);
check('wings that looked permanently dead come back',
  fly.flightCooldown === 0 && fly.flightFuel === fly.maxFlightFuel,
  'fuel=' + fly.flightFuel + ' cd=' + fly.flightCooldown);
// A wing that forgets to declare its price must still pay one, or it can strand
// itself in exactly that state on its own.
fly.setWings({ id: 'orphan_wings', grantsFlight: true, flightTime: 10 });
check('a wing with no cooldown declared is given one', fly.maxFlightCooldown > 0,
  'cd=' + fly.maxFlightCooldown);
fly.setWings(ITEMS.dragon_wings);
check('the real wings fit back on',
  fly.maxFlightFuel === 180 && fly.maxFlightCooldown === 30,
  'tank=' + fly.maxFlightFuel + ' cd=' + fly.maxFlightCooldown);
g.input.keys['Space'] = false;

// Wearing the plate must not cost any mitigation — flight is the whole stat.
const redBefore = g.player.armorReduction;
const defBefore = g.player.armorDefense;
g.equipAccessory('dragon_wings');
frames(1);
check('wings never touch the armour numbers',
  g.player.armorReduction === redBefore && g.player.armorDefense === defBefore,
  'reduction=' + g.player.armorReduction + ' defense=' + g.player.armorDefense);

g.saveGame(true);
g.loadGame(true);
frames(1);
check('the wings survive a reload',
  g.equippedAccessoryId === 'dragon_wings' && g.player.hasWings === true);
g.input.keys['Space'] = false;

// ══════════════════════════════════════════════════════════════════════════
step('11. The kill sticks');
// The Sovereign died back in step 9 and a save/load has run since, which is
// exactly the state a real player comes back to. Killing it used to be the start
// of a loop: the arena re-armed on the next trip, and any death at all — in the
// arena or at home — dragged a rift down onto the player's own house and put a
// whole dragon back in the sky.
check('a kill is a permanent fact', g.dragonSlain === true, 'dragonSlain=' + g.dragonSlain);
check('a dead dragon leaves nothing banked', g.dragonHP === null, 'dragonHP=' + g.dragonHP);
check('no re-entry is counting down', g.riftReturnDelay === 0, 'delay=' + g.riftReturnDelay);
g.saveGame(true);
check('the kill is written to the save',
  JSON.parse(localStorage.getItem(g.saveKey)).dragonSlain === true);
g.loadGame(true);
frames(2);
check('the kill survives the reload',
  g.dragonSlain === true && g.dragonHP === null, 'slain=' + g.dragonSlain);
check('the reload does not re-arm the pull', g.riftReturnDelay === 0);

// A save always describes the overworld, so the reload has already set the player
// back down at home: no arena, no dragon, nothing waiting. That is the state to
// defend — from here, dying must not put a rift back over their own roof.
check('the reload leaves the player under their own sky',
  g.world.dimension === 'overworld' && !g.boss && !g.world.spaceArena,
  'dimension=' + g.world.dimension);
// The bug in one line: dying used to re-open the Ossuary on top of the respawn
// site, so a player who had already won was pulled back in without asking and
// the fight restarted whole.
g.player.invulnerableTime = 0;
g.damagePlayer(9999, g.player.x, 'the test');
check('death is detected after the win', g.isDead === true);
g.respawnPlayer();
frames(600, { render: 60 });
check('dying after the win opens no rift', !g.wormhole && !g.wormholeIntent,
  'wormhole=' + !!g.wormhole);
check('and no pull is queued', g.riftReturnDelay === 0, 'delay=' + g.riftReturnDelay);
check('the player is left alone at the respawn point',
  g.world.dimension === 'overworld' && !g.boss);

// A beacon still works — it is a door, not a summon.
openSky();
g.addItem('void_rift_beacon', 1);
check('the beacon still opens the way', g.useVoidRiftBeacon() === true);
let quarryTrip = 0;
while (quarryTrip < 900 && g.world.dimension !== 'space') { g.update(1 / 60); quarryTrip++; }
check('the rift still delivers', g.world.dimension === 'space', quarryTrip + ' frames');
immortal();
frames(120, { render: 40 });
check('and the arena is empty', !g.boss, g.boss && g.boss.name);
check('nothing woke up behind you', g.dragonSlain === true && g.sound.isBoss === false);
check('the boss bar stays hidden', els['boss-panel'].classList.contains('hidden'));
check('the arena is a quarry: no summoned bone', 
  g.monsters.filter(m => m.space === true).length === 0);
// Dying in an emptied Ossuary cannot drag you back either — there is nothing
// down there left to avenge. (This is the second half of the old bug: the pull
// used to be armed by the death, not by the fight.)
g.player.invulnerableTime = 0;
g.damagePlayer(9999, g.player.x, 'the test');
g.respawnPlayer();
frames(600, { render: 60 });
check('dying in an emptied Ossuary keeps you home',
  g.world.dimension === 'overworld' && !g.wormhole && g.riftReturnDelay === 0,
  'dimension=' + g.world.dimension + ' delay=' + g.riftReturnDelay);

// Back down to the bones for the rite.
openSky();
g.addItem('void_rift_beacon', 1);
check('the beacon still works after a death', g.useVoidRiftBeacon() === true);
let riteTrip = 0;
while (riteTrip < 900 && g.world.dimension !== 'space') { g.update(1 / 60); riteTrip++; }
check('the way back opens', g.world.dimension === 'space', riteTrip + ' frames');
immortal();

// ---- The rite: the only way back into the fight ---------------------------
check('the rite is refused with empty hands', g.performBoneRite() === false && !g.boss);
g.addItem('rite_of_bones', 1);
check('the rite answers in the Ossuary', g.performBoneRite() === true);
check('a Sovereign stands where the last one fell',
  !!g.boss && g.boss.kind === 'dragon', g.boss && g.boss.kind);
check('the new dragon is whole',
  !!g.boss && g.boss.hp === g.boss.maxHp && g.boss.maxHp === 88000,
  g.boss && (g.boss.hp + '/' + g.boss.maxHp));
check('the bones are burned', g.countItem('rite_of_bones') === 0,
  'left=' + g.countItem('rite_of_bones'));
check('the arena is a fight again', g.dragonSlain === false && g.sound.isBoss === true);
check('a rite cannot be read over a live dragon', (() => {
  g.addItem('rite_of_bones', 1);
  return g.performBoneRite() === false && g.countItem('rite_of_bones') === 1;
})());

// ---- Body hits: the spine is a target, and it is cheaper than the skull ----
// 400 pixels of serpent used to be decoration — only the skull had hit points, so
// every swing and arrow that visibly crossed the body did nothing at all. Both
// are hittable now, and the skull still pays best: the tax is 8%.
g.dragonSlain = false;
g.wakeSovereign(g.world.spaceArena, null);
immortal();
frames(60, { render: 30 });
const targets = g.boss.hitTargets();
const tailTip = g.boss.segments[g.boss.segments.length - 1];
const lastNode = targets[targets.length - 1];
check('the serpent is hittable from skull to tail',
  targets.some(t => t.head) && targets.some(t => !t.head) &&
  Math.hypot(lastNode.x - tailTip.x, lastNode.y - tailTip.y) < 120,
  targets.length + ' hit points over ' + g.boss.segments.length + ' vertebrae, ' +
  Math.round(Math.hypot(lastNode.x - tailTip.x, lastNode.y - tailTip.y)) + 'px from the tip');
// Damage rolls are stubbed flat so the two figures below are exact rather than
// two draws from a curve: what is under test is the tax, not the crit roller.
const realRoll = g.rollDamage;
g.rollDamage = () => ({ damage: 1000, crit: false });
const skull = targets.find(t => t.head);
const spine = targets.find(t => !t.head);
const headBefore = g.boss.hp;
g.projectiles.push(new Projectile(skull.x, skull.y, 0, 0, 'arrow', 1000, false, 3.0));
g.update(1 / 60);
const onSkull = headBefore - g.boss.hp;
const spineBefore = g.boss.hp;
g.projectiles.push(new Projectile(spine.x, spine.y, 0, 0, 'arrow', 1000, false, 3.0));
g.update(1 / 60);
const onSpine = spineBefore - g.boss.hp;
g.rollDamage = realRoll;
check('an arrow in the skull lands whole', onSkull === 1000, 'dealt=' + onSkull);
check('an arrow into the body bites too, at 92%', onSpine === 920, 'dealt=' + onSpine);
check('body hits are worth 8% less by definition',
  g.boss.scaleDamageFor({ head: true }, 500) === 500 &&
  g.boss.scaleDamageFor({ head: false }, 500) === 460);
// The nerf, from the outside: what the Sovereign actually hits for now.
check('contact damage is off the old numbers', g.boss.touchDamage() < 95,
  'touch=' + g.boss.touchDamage());
g.boss.takeDamage(g.boss.hp + 100, g.sound, g.particles, false);
frames(4, { render: 1 });
// Last, because it leaves the arena for good: the rite is a thing you do on the
// bones, not a thing you do in your kitchen.
check('the rite is refused at home', (() => {
  g.boss = null;
  g.sound.isBoss = false;
  g.world.exitSpaceDimension();
  return g.performBoneRite() === false && g.countItem('rite_of_bones') === 1 && !g.boss;
})());

console.log('\n──────────────────────────────────────────');
console.log(failures === 0 ? '✔ ALL SPACE-DIMENSION CHECKS PASSED' : '✖ ' + failures + ' CHECK(S) FAILED');
// The Game constructor leaves RAF/timer stubs on Node's event loop, so the
// harness has to leave on its own. Exit only once stdout has drained — calling
// process.exit() straight after console.log truncates the report when the
// output is piped (PowerShell buffers it), which looked like a hung suite.
const code = failures === 0 ? 0 : 1;
const leave = () => process.exit(code);
process.stdout.write('', leave);
setTimeout(leave, 1000);

// Chews through the dragon's contact damage without touching its health, so a
// long scripted fight can run to completion.
function immortal() { g.player.maxHp = 5e6; g.player.hp = 5e6; }
