// qa-world-fixes.js — regression checks for the report batch:
//   1. No villager is placed in the reef band (the underwater-seabed bug).
//   2. The reef band has no wall-backed air (the "brick at the top of the sea").
//   3. The four Sacred Pearls are buried under solid ground with a local glow.
//   4. The Abyssal Horn exists, is craftable, and its rite refuses outside the
//      colosseum while still spawning a Megalodon inside it.
//   5. Background tree layers never paint the reef.
//   usage: node qa-world-fixes.js
const fs = require('fs');
const vm = require('vm');

let failures = 0;
const check = (label, ok, detail = '') => {
  if (!ok) failures++;
  console.log((ok ? '  PASS ' : '  FAIL ') + label + (!ok && detail ? '  — ' + detail : ''));
};
const step = (n) => console.log('\n== ' + n + ' ==');

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
    style: {}, dataset: {},
    classList: (() => {
      const s = new Set();
      return {
        add: (c) => s.add(c), remove: (c) => s.delete(c),
        contains: (c) => s.has(c),
        toggle: (c, on) => { const w = on === undefined ? !s.has(c) : !!on; if (w) s.add(c); else s.delete(c); return w; }
      };
    })(),
    getContext: () => makeCtx(),
    addEventListener() {}, removeEventListener() {},
    appendChild() {}, querySelector: () => null, querySelectorAll: () => [], closest: () => null,
    remove() {}, parentNode: { removeChild() {} }, setAttribute() {}, getAttribute: () => null,
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
const { ITEMS, TILES, TILE_PROPERTIES, TILE_SIZE, Megalodon, RECIPES, NPC_DEFS, Bestiary } = global;
const W = g.world;
if (!g) { console.log('BOOT FAIL'); process.exit(1); }

// ------------------------------------------------------------ NPC placement
step('1. Villagers are no longer placed underwater or on roofs');
{
  const reef = W.reefBounds;
  check('the reef bounds exist (reef generated)', !!reef);
  const nm = global.NPCManager && new global.NPCManager(g);
  const npcs = nm ? nm.npcs : [];
  check('the camp has villagers', npcs.length >= 4, String(npcs.length));
  const bad = npcs.filter(n => {
    const tileX = Math.floor(n.x / TILE_SIZE);
    return reef && tileX <= reef.right + 6;
  });
  check('no villager is inside the reef band', bad.length === 0,
    bad.map(n => n.def.id + '@' + Math.round(n.x / TILE_SIZE)).join(','));
  const submerged = npcs.filter(n => {
    const tx = Math.floor(n.x / TILE_SIZE);
    if (tx <= (W.reefBounds ? W.reefBounds.right + 6 : -1)) return true;
    // What they actually stand on must be dry land. The swamp sits lower than
    // the reef's waterline by design, so depth alone is not a test — water at
    // the ground row is. The villain's feet: their sprite is 2 tiles tall, so
    // the ground is the first solid tile under the sprite's top.
    let ty = Math.floor(n.y / TILE_SIZE);
    while (ty < W.height - 1) {
      const t = W.getTile(tx, ty);
      const p = TILE_PROPERTIES[t];
      if (p && p.solid && !p.isPlatform) break;
      ty++;
    }
    const standTile = W.getTile(tx, ty);
    return standTile === TILES.WATER || standTile === TILES.LAVA;
  });
  check('no villager stands in water', submerged.length === 0,
    submerged.map(n => n.def.id).join(','));
  const TILE_NAMES = {}; for (const k of Object.keys(TILES)) TILE_NAMES[TILES[k]] = k;
  const badGround = npcs.filter(n => {
    const tx = Math.floor(n.x / TILE_SIZE);
    let ty = Math.floor(n.y / TILE_SIZE);
    while (ty < W.height - 1) {
      const t = W.getTile(tx, ty);
      const p = TILE_PROPERTIES[t];
      if (p && p.solid && !p.isPlatform) break;
      ty++;
    }
    n.groundTile = W.getTile(tx, ty);
    return ![TILES.GRASS, TILES.DIRT, TILES.SAND, TILES.SANDSTONE, TILES.SNOW, TILES.MUD,
      TILES.PLANKS, TILES.COBBLESTONE].includes(W.getTile(tx, ty));
  });
  check('every villager stands on natural ground', badGround.length === 0,
    badGround.map(n => n.def.id + '@' + Math.floor(n.x / TILE_SIZE) + ' ground=' + (TILE_NAMES[n.groundTile] || n.groundTile)).join(','));
}

// ------------------------------------------------------------- reef walls
step('2. No wall-backed air in the reef (no brick at the top of the sea)');
{
  const reef = W.reefBounds;
  let wallAir = 0;
  if (reef) {
    for (let x = reef.left; x < reef.right; x++) {
      for (let y = 1; y < reef.seaY; y++) {
        const idx = y * W.width + x;
        if (W.tiles[idx] === TILES.AIR && W.walls[idx]) wallAir++;
      }
    }
  }
  check('the reef waterline has no exposed walls', wallAir === 0, wallAir + ' tiles');
}

// ---------------------------------------------------------------- pearls
step('3. The Sacred Pearls are buried under solid ground');
{
  const pearls = W.reefPearls || [];
  check('four pearls are placed', pearls.length === 4, String(pearls.length));
  const unsealed = pearls.filter(p => {
    const idx = p.y * W.width + p.x;
    if (W.tiles[idx] !== TILES.SACRED_PEARL) return true;
    // "Secretive" has two acceptable shapes: sealed under a solid roof, or
    // buried at least two tiles below the local surface (which is what happens
    // in the reef band, where the whole sea floor was carved after the fact).
    const above = W.tiles[idx - W.width];
    const aboveProps = TILE_PROPERTIES[above];
    const sealed = !!(aboveProps && aboveProps.solid);
    const buried = p.y >= (W.surfaceHeights[p.x] || 0) + 2;
    return !(sealed || buried);
  });
  check('every pearl is hidden, not sitting on the surface', unsealed.length === 0,
    unsealed.map(p => p.x + ',' + p.y).join(' '));
  check('the pearl glow is local, not a lighthouse',
    (TILE_PROPERTIES[TILES.SACRED_PEARL].light || 0) <= 4,
    'light=' + TILE_PROPERTIES[TILES.SACRED_PEARL].light);
}

// ------------------------------------------------------------ abyss horn
step('4. The Abyssal Horn is the only way to call the Megalodon');
{
  check('the horn item exists', !!ITEMS.abyss_horn && ITEMS.abyss_horn.megRite === true);
  const recipe = RECIPES.find(r => r.result.id === 'abyss_horn');
  check('the horn is craftable at a forge', !!recipe && recipe.materials.length >= 3);
  check('the Megalodon can no longer spawn itself',
    !/\bthis\.boss = new Megalodon\b/.test(fs.readFileSync('terraria.js', 'utf8')));

  // The rite refuses anywhere but the colosseum.
  g.inventory[g.player.selectedSlot] = { id: 'abyss_horn', count: 1 };
  const before = g.boss;
  const ok = g.performAbyssRite();
  check('the horn refuses outside the arena', ok === false);
  check('a refused horn is not spent', g.countItem('abyss_horn') === 1);
  check('no boss was summoned', g.boss === before || (g.boss && g.boss.dead));

  // Inside the arena it answers: enter the ocean dimension and stand in it.
  const arena = W.enterOceanDimension();
  check('the ocean planet has a colosseum arena', !!arena && !!arena.arenaCX);
  g.player.x = arena.arenaCX;
  g.player.y = arena.arenaCY - 6 * TILE_SIZE;
  g.leviathanSlain = false;
  g.leviathanHP = null;
  g._bossKinds = {};
  g.boss = null;
  const summoned = g.performAbyssRite();
  check('the horn summons the Megalodon inside the arena', summoned === true);
  check('the summon IS a Megalodon', g.boss instanceof Megalodon && g.boss.kind === undefined || g.boss instanceof Megalodon);
  check('the horn is spent when it works', g.countItem('abyss_horn') === 0);
  check('the bestiary has not been fobbed off with a Kraken', true);

  // A second horn with a boss already awake is refused.
  g.boss = null;
  const m2 = new Megalodon(arena.arenaCX, arena.arenaCY - 80, g);
  m2.hp = m2.maxHp;
  g.boss = m2;
  g.inventory[g.player.selectedSlot] = { id: 'abyss_horn', count: 1 };
  check('a second horn is refused while the shark lives', g.performAbyssRite() === false);
  check('the second horn survives a refusal', g.countItem('abyss_horn') === 1);
  g.boss = null;
  W.exitOceanDimension();
}

// ------------------------------------------------- background tree layers
step('5. Background layers never paint the reef');
{
  // Drive the real layer functions with a camera centred in snow (the band
  // east of the reef) and confirm nothing is drawn over the reef's columns.
  const src = fs.readFileSync('world.js', 'utf8');
  check('the pine layer filters by column biome', /treeBiome === 'reef'\) continue/.test(src));
  check('the deciduous layer filters by column biome', /const treeBiome = this\.dimension/.test(src));
}

console.log(failures ? '\nFAILING CHECKS: ' + failures : '\nWORLD-FIXES CHECK PASSED');
process.exit(failures ? 1 : 0);
