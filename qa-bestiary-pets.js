// qa-bestiary-pets.js — verifies the discovery-journal, trophy, pet and NPC
// chatter features actually work end to end: recording unlocks entries with
// lore, the Megalodon drops its own trophy (not the Guardian's), the trophy
// tile places, emits light and mines back to the item, the pet follows the
// player and toggles, and villagers rotate chatter and react to boss wins.
//   usage: node qa-bestiary-pets.js
const fs = require('fs');
const vm = require('vm');

let failures = 0;
const check = (label, ok, detail = '') => {
  if (!ok) failures++;
  console.log((ok ? '  PASS ' : '  FAIL ') + label + (!ok && detail ? '  — ' + detail : ''));
};
const step = (name) => console.log('\n== ' + name + ' ==');

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
  const el = {
    id, width: 800, height: 600, textContent: '', innerHTML: '',
    style: {}, dataset: {}, offsetHeight: 100,
    classList: (() => {
      const set = new Set();
      return {
        add: (c) => set.add(c), remove: (c) => set.delete(c),
        contains: (c) => set.has(c),
        toggle: (c, on) => { const w = on === undefined ? !set.has(c) : !!on; if (w) set.add(c); else set.delete(c); return w; }
      };
    })(),
    getContext: () => makeCtx(),
    addEventListener() {}, removeEventListener() {},
    appendChild() {}, querySelector: () => null, querySelectorAll: () => [], closest: () => null,
    remove() {}, parentNode: { removeChild() {} },
    setAttribute() {}, getAttribute: () => null,
    className: '', value: ''
  };
  return el;
}
const els = {};
global.document = {
  readyState: 'complete', scripts: [],
  getElementById: (id) => (els[id] ||= makeEl(id)),
  createElement: (tag) => makeEl(tag),
  addEventListener() {}, removeEventListener() {},
  querySelector: () => null, querySelectorAll: () => [],
  body: makeEl('body'), documentElement: makeEl('html')
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
  try { vm.runInContext(fs.readFileSync(f, 'utf8'), ctx, { filename: f }); }
  catch (e) { console.log('EVAL FAIL ' + f + ': ' + (e.stack || e.message)); process.exit(1); }
}
const g = global.game;
const { ITEMS, TILES, TILE_PROPERTIES, TILE_SIZE, Bestiary, Pet, NPCManager, Megalodon } = global;
if (!g) { console.log('BOOT FAIL'); process.exit(1); }

// ---------------------------------------------------------------- BESTIARY
step('1. Bestiary records, unlocks lore, and survives a save round trip');
{
  const b = g.bestiary;
  check('the bestiary exists', !!b);
  const before = b.discovered;
  b.record({ kind: 'slime', displayName: 'Green Slime' });
  check('a kill unlocks the entry', b.discovered === before + 1);
  const html = b.render();
  check('the unlocked entry shows its lore', html.includes('Green Slime') && html.includes('first victim'));
  check('locked entries stay silhouettes', html.includes('Undiscovered'));
  // Boss entries only reveal their drops once discovered, like the rest.
  b.recordBoss('leviathan');
  check('discovered boss entries carry their drops', b.render().includes('Kraken Trophy'));
  // Round trip.
  const data = b.serialize();
  const b2 = new Bestiary();
  b2.game = g;
  b2.load(data);
  check('entries survive serialize/load', b2.discovered === b.discovered && b2.entries.slime.kills === 1);
  // Boss recording.
  const killsBefore = (b.entries.kraken || {}).kills || 0;
  b.recordBoss('kraken');
  check('a boss victory is recorded', (b.entries.kraken.kills || 0) === killsBefore + 1);
  // isBossDefeated is the game-side record of the kill, not the journal.
  g._bossKinds = g._bossKinds || {};
  g._bossKinds.kraken = true;
  check('isBossDefeated reads the kill', g.isBossDefeated('kraken') === true);
}

// ---------------------------------------------------------------- TROPHY
step('2. The Megalodon drops its own trophy, and it mounts on a wall');
{
  const T = TILES;
  check('the trophy tile id is above the ocean range', T.MEGALODON_TROPHY > 85,
    'id=' + T.MEGALODON_TROPHY);
  check('the trophy is non-solid (a mount, not a block)',
    TILE_PROPERTIES[T.MEGALODON_TROPHY] && TILE_PROPERTIES[T.MEGALODON_TROPHY].solid === false);
  check('the trophy emits light', (TILE_PROPERTIES[T.MEGALODON_TROPHY].light || 0) > 0);
  check('the trophy item places the tile',
    ITEMS.megalodon_trophy && ITEMS.megalodon_trophy.tile === T.MEGALODON_TROPHY);
  check('mining the mount returns the item',
    TILE_PROPERTIES[T.MEGALODON_TROPHY].drops && TILE_PROPERTIES[T.MEGALODON_TROPHY].drops.id === 'megalodon_trophy');
  // Rendering: draw it and confirm it paints pixels (not a no-op case).
  const mini = { fillStyle: '#000', calls: 0,
    fillRect() { this.calls++; }, save() {}, restore() {},
    beginPath() {}, arc() {}, fill() {}, stroke() {}, moveTo() {}, lineTo() {},
    closePath() {}, ellipse() {}, quadraticCurveTo() {}, lineWopera: 1 };
  const c2 = mini; c2.lineWopera = 1;
  g.world.drawTileGraphic(mini, T.MEGALODON_TROPHY, 0, 0, 5, 5, true);
  check('the trophy renders real pixels', mini.calls > 10, mini.calls + ' fillRects');
}

// ---------------------------------------------------------------- PET
step('3. The reef sprite follows the player and toggles off');
{
  check('the pet item is registered', ITEMS.reef_sprite && ITEMS.reef_sprite.type === 'pet');
  g.player.x = 1000; g.player.y = 500;
  const pet = new Pet(g.player.x, g.player.y, 'reef_sprite');
  // Put the player far away: the pet must chase and never fall behind.
  g.player.x = 1500; g.player.y = 520;
  for (let i = 0; i < 240; i++) pet.update(1 / 60, g.player);
  const d = Math.hypot(pet.x - (g.player.x + 9), pet.y - (g.player.y + 18 - 22));
  check('the pet settles near the player', d < 60, 'distance ' + Math.round(d));
  // It must leave the player alone in combat: no damage fields at all.
  check('the pet cannot damage anything', typeof pet.damage === 'undefined' && pet.dead === false);
  // Celebrate is its reaction hook.
  const before = pet.happy;
  pet.celebrate();
  check('discoveries make the pet celebrate', pet.happy > before);
  // Render must not throw off screen.
  let threw = false;
  try { pet.render({ save() {}, restore() {} }, { x: 0, y: 0, viewportWidth: 1280, viewportHeight: 720 }); }
  catch (e) { threw = true; }
  check('rendering the pet is safe', !threw);
}

// ---------------------------------------------------------------- NPCS
step('4. Villagers have idle chatter and react to boss victories');
{
  const nm = new NPCManager(g);
  check('every villager carries chatter',
    NPC_MANAGER_DEFS().every(d => Array.isArray(d.chatter) && d.chatter.length > 0),
    NPC_MANAGER_DEFS().filter(d => !d.chatter).map(d => d.id).join(','));
  check('every villager reacts to the Megalodon',
    NPC_MANAGER_DEFS().every(d => d.reactions && d.reactions.kraken));

  // Drive a real dialog and confirm the text changes between visits.
  function NPC_MANAGER_DEFS() { return global.NPC_DEFS; }
  const defs = global.NPC_DEFS;
  const guide = defs.find(d => d.id === 'guide');
  const spawned = nm.npcs.find(n => n.def.id === 'guide');
  check('a Guide exists in the camp', !!spawned);

  g.isBossDefeated = () => true;
  nm.openDialog(spawned);
  const dialogue1 = els['npc-dialogue'].textContent || els['npc-dialogue'].innerHTML;
  check('the Guide reacts to the boss victory with a personal line',
    dialogue1.includes('finally quiet'), dialogue1.slice(0, 60));
  nm.closeDialog();

  // Second open: the reaction is spent, so it falls back to idle chatter.
  g.isBossDefeated = () => false;
  const fresh = { def: guide, id: guide.id, icon: guide.icon, name: guide.name, state: 'idle', clueUnlocked: false };
  nm.openDialog(fresh);
  const a = els['npc-dialogue'].innerHTML;
  nm.refreshDialog();
  const b2 = els['npc-dialogue'].innerHTML;
  check('chatter rotates between visits', a !== b2 && !a.includes('finally quiet'));
  nm.closeDialog();
}

// ------------------------------------------------- MEGALODON VICTORY REWARDS
step('5. The Megalodon kill grants trophy + first-kill pet');
{
  // Build a Megalodon in the overworld harness and drive the game's boss-death
  // path by faking the boss the game loop reads.
  const W = g.world;
  const px = 60, py = 20;
  for (let x = px - 10; x <= px + 12; x++)
    for (let y = py - 8; y <= py + 8; y++) W.setTile(x, y, TILES.AIR);
  const p = g.player;
  p.x = px * TILE_SIZE; p.y = py * TILE_SIZE; p.vx = 0; p.vy = 0;
  p.hp = p.maxHp = 1000000; p.invulnerableTime = 0;

  const m = new Megalodon(px * TILE_SIZE, py * TILE_SIZE, g);
  m.kind = 'kraken';                 // what the death path keys on
  m.dash = null; m.pending = null; m.hunt = null; m.rushLeft = 0;
  m.name = 'MEGALODON';
  g.boss = m;
  const dropsBefore = g.drops.length;
  m.takeDamage(m.maxHp, g.sound, g.particles);
  check('the shark dies', m.dead === true);
  // One tick of the game loop runs the boss-death bookkeeping.
  g.paused = false;
  g.titleScreenOpen = false;
  g._bossKinds = {};
  g.update(1 / 60);
  const ids = g.drops.slice(dropsBefore).map(d => d.id);
  check('the Megalodon drops its own trophy', ids.includes('megalodon_trophy'),
    ids.join(','));
  check('the first kill also grants the pet', ids.includes('reef_sprite'));
  check('the Kraken Trophy still drops for the forge recipes', ids.includes('kraken_trophy') || ids.includes('leviathan_trophy'));
  check('the bestiary records the Megalodon', !!(g.bestiary.entries.kraken));
  g.boss = null;
}

console.log(failures ? '\nFAILING CHECKS: ' + failures : '\nBESTIARY-PET-TROPHY CHECK PASSED');
process.exit(failures ? 1 : 0);
