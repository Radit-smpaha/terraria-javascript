// ══════════════════════════════════════════════════════════════════════════
// Functional QA for the world layer (node qa-world.js)
//
// Boots the real game with DOM/canvas stubs and asserts on the things this
// layer is responsible for:
//   1. the plains biome — layout, flatness, decoration, background coverage
//   2. the levelled building plot in it — level, cleared, usable
//   3. the ten-block building set — registry, recipes, place/mine round trip
//   4. the render cache optimisation — chunk-snapped rebuilds, cached walls
//   5. Sovereign permanence — a killed dragon stays dead, and the ONLY way back
//      into the fight is a rite read over a finished fight (never over a banked
//      one, and never in exchange for a banked wound)
// ══════════════════════════════════════════════════════════════════════════
const fs = require('fs');
const vm = require('vm');

let failures = 0;
const check = (label, ok, detail = '') => {
  if (!ok) failures++;
  console.log((ok ? '  PASS ' : '  FAIL ') + label + (!ok && detail ? ' — ' + detail : ''));
};
const step = (title) => console.log('\n▸ ' + title);
const info = (label) => console.log('    · ' + label);

// Counts every canvas call made through makeCtx(), so the render path can be
// measured instead of eyeballed. Buckets are keyed by bucket.counter.
const opBuckets = new Map();
function makeCtx(bucket) {
  if (bucket && !opBuckets.has(bucket)) opBuckets.set(bucket, {});
  return new Proxy({}, {
    get(t, p) {
      if (p === 'canvas') return {};
      if (p === 'createRadialGradient' || p === 'createLinearGradient') return () => ({ addColorStop() {} });
      if (p === 'getImageData') return () => ({ data: new Uint8ClampedArray(4) });
      if (p === 'measureText') return () => ({ width: 10 });
      if (typeof p === 'string') {
        return () => {
          if (!bucket) return undefined;
          const counts = opBuckets.get(bucket);
          counts[p] = (counts[p] || 0) + 1;
          return undefined;
        };
      }
      return undefined;
    },
    set() { return true; }
  });
}
const countOf = (bucket) => {
  const c = opBuckets.get(bucket) || {};
  return Object.values(c).reduce((a, b) => a + b, 0);
};
const resetBucket = (bucket) => opBuckets.set(bucket, {});

function makeEl(id) {
  return {
    id, width: 800, height: 600, textContent: '', innerHTML: '', style: {}, dataset: {},
    classList: (() => {
      const set = new Set();
      return { add: (c) => set.add(c), remove: (c) => set.delete(c), contains: (c) => set.has(c), toggle: () => false };
    })(),
    getContext: () => makeCtx(),
    addEventListener() {}, removeEventListener() {},
    appendChild() {}, querySelector: () => null, querySelectorAll: () => [],
    closest: () => null, remove() {}, parentNode: { removeChild() {} },
    setAttribute() {}, getAttribute: () => null, className: '', value: ''
  };
}
const els = {};
global.document = {
  readyState: 'complete', scripts: [],
  getElementById: (id) => (els[id] ||= makeEl(id)),
  createElement: (tag) => makeEl(tag),
  addEventListener() {}, querySelector: () => null, querySelectorAll: () => [], body: makeEl('body')
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
const { TILES, ITEMS, RECIPES, TILE_SIZE, TILE_PROPERTIES } = global;
if (!g) { console.log('BOOT FAIL: no game'); process.exit(1); }
const W = g.world;
const BIOME_ORDER = vm.runInContext('BIOME_ORDER', ctx);
const PLAINS_PLOT_HALF = vm.runInContext('PLAINS_PLOT_HALF', ctx);
const TILE_CACHE_CHUNK = vm.runInContext('TILE_CACHE_CHUNK', ctx);

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
// Nothing in this suite is about surviving; it is about the world.
const immortal = () => { g.player.hp = g.player.maxHp; g.deathTimer = 0; };

// ══════════════════════════════════════════════════════════════════════════
step('1. Biomes: the plains are a real band, not a rename');
check('the world is five equal bands', BIOME_ORDER.length === 5,
  BIOME_ORDER.join('/'));
check('plains sits between forest and savanna',
  BIOME_ORDER.indexOf('plains') === BIOME_ORDER.indexOf('forest') + 1 &&
  BIOME_ORDER.indexOf('savanna') === BIOME_ORDER.indexOf('plains') + 1,
  BIOME_ORDER.join(' > '));
check('every old biome survived the re-division',
  ['snow', 'forest', 'savanna', 'swamp'].every(b => BIOME_ORDER.includes(b)));

// Sample the whole strip: each band must be reachable and only its own id.
const seen = new Map();
for (let x = 0; x < W.width; x++) {
  const b = W.getBiomeAtX(x);
  if (!seen.has(b)) seen.set(b, [x, x]);
  else seen.get(b)[1] = x;
}
check('all five bands appear', seen.size === 5, [...seen.keys()].join('/'));
const bandSpans = [...seen.entries()].map(([b, r]) => [b, r[1] - r[0] + 1]);
check('the bands are equal within a tile',
  bandSpans.every(([, n]) => Math.abs(n - W.width / 5) <= 1),
  bandSpans.map(([b, n]) => b + '=' + n).join(' '));
const plainsRange = seen.get('plains');
info('plains band spans tiles ' + plainsRange[0] + '..' + plainsRange[1] +
  ' (' + (plainsRange[1] - plainsRange[0] + 1) + ' of ' + W.width + ')');

// The blend must resolve to a real biome everywhere, or terrain generation
// would index a palette that does not exist.
let blendBad = 0;
for (let x = 0; x < W.width; x++) {
  const m = W.biomeMix(x);
  if (!BIOME_ORDER.includes(m.a) || (m.b !== null && !BIOME_ORDER.includes(m.b))) blendBad++;
  if (m.b !== null && !(m.t >= 0 && m.t <= 1)) blendBad++;
}
check('biomeMix only ever names real biomes with t in 0..1', blendBad === 0,
  blendBad + ' bad columns');

// Plains have to actually be rougher-free than the neighbours, or "plains" is a
// lie. Total span is phase-dependent noise (where in its sine a band sits), so
// the honest measure is local roughness: how much the surface moves tile to tile.
const bandRough = (name) => {
  const cols = [];
  for (let x = 0; x < W.width; x++) if (W.getBiomeAtX(x) === name) cols.push(x);
  // Skip the blended borders: melting into the neighbour hills is by design.
  const inner = cols.slice(12, -12);
  if (inner.length < 8) return { rough: Infinity, span: Infinity, n: inner.length };
  let sum = 0, lo = Infinity, hi = -Infinity;
  for (let i = 1; i < inner.length; i++) {
    sum += Math.abs(W.surfaceHeights[inner[i]] - W.surfaceHeights[inner[i - 1]]);
  }
  for (const x of inner) {
    const h = W.surfaceHeights[x];
    if (h < lo) lo = h;
    if (h > hi) hi = h;
  }
  return { rough: sum / (inner.length - 1), span: hi - lo, n: inner.length };
};
const stats = Object.fromEntries(BIOME_ORDER.map(b => [b, bandRough(b)]));
info('interior roughness (tiles/column): ' +
  Object.entries(stats).map(([b, s]) => b + '=' + s.rough.toFixed(3)).join(' '));
info('interior relief spans: ' +
  Object.entries(stats).map(([b, s]) => b + '=' + s.span).join(' '));
const plainsRough = stats.plains.rough;
const othersRough = ['forest', 'savanna', 'snow', 'swamp'].map(b => stats[b].rough);
check('plains are the quietest band in the world',
  plainsRough < Math.min(...othersRough),
  'plains=' + plainsRough.toFixed(3) + ' vs ' +
  othersRough.map(v => v.toFixed(3)).join('/'));
check('plains are at least 3× smoother than the roughest band',
  plainsRough * 3 < Math.max(...othersRough),
  (plainsRough * 3).toFixed(3) + ' vs ' + Math.max(...othersRough).toFixed(3));
check('the plot interior is dead level',
  stats.plains.span <= 8, String(stats.plains.span));
check('plains relief scale is damped, not absent',
  W.biomeReliefScale('plains') < 1 && W.biomeReliefScale('plains') > 0 &&
  W.biomeReliefScale('forest') === 1,
  String(W.biomeReliefScale('plains')));

// ══════════════════════════════════════════════════════════════════════════
step('2. The building plot: level, cleared, and where the player starts');
const plot = W.plainsPlot;
check('a plot exists', !!plot, JSON.stringify(plot));
check('the plot is inside the plains band',
  !!plot && plot.x0 >= plainsRange[0] && plot.x1 <= plainsRange[1],
  plot ? plot.x0 + '..' + plot.x1 + ' vs band ' + plainsRange.join('..') : 'none');
check('the plot is centred on the spawn point',
  !!plot && plot.centre === Math.floor(W.width / 2), plot ? String(plot.centre) : 'none');
check('the plot is the promised width',
  !!plot && (plot.x1 - plot.x0 + 1) >= PLAINS_PLOT_HALF * 2,
  plot ? String(plot.x1 - plot.x0 + 1) : 'none');

let offLevel = 0, wrongSurface = 0, holed = 0;
for (let x = plot.x0; x <= plot.x1; x++) {
  if (W.surfaceHeights[x] !== plot.level) offLevel++;
  if (W.getTile(x, plot.level) !== TILES.GRASS) wrongSurface++;
  // The row under the grass must be something you can build on, not air.
  if (W.getTile(x, plot.level + 1) === TILES.AIR) holed++;
}
check('every column of the plot is at one single height', offLevel === 0,
  offLevel + ' columns off-level');
check('the plot floor is grass, not bare dirt', wrongSurface === 0,
  wrongSurface + ' columns wrong');
check('the plot floor has ground under it', holed === 0, holed + ' holes');

// The starter camp is built in the middle of the plot by design, so decor is
// only "leftover" outside the house footprint.
const houseHalf = 8;
const strayDecor = [];
for (let x = plot.x0; x <= plot.x1; x++) {
  if (Math.abs(x - plot.centre) <= houseHalf) continue;
  for (let y = plot.level - 13; y < plot.level; y++) {
    const t = W.getTile(x, y);
    if (t !== TILES.AIR && t !== TILES.TORCH) strayDecor.push(x + ',' + y + '=' + t);
  }
}
check('nothing is left growing on the plot', strayDecor.length === 0,
  strayDecor.slice(0, 6).join(' '));
check('the plot has open sky, house footprint included',
  (() => {
    for (let x = plot.centre - houseHalf; x <= plot.centre + houseHalf; x++) {
      for (let y = 0; y < plot.level - 14; y++) {
        if (W.getTile(x, y) !== TILES.AIR) return false;
      }
    }
    return true;
  })());

const cornerTorches = [plot.x0 + 1, plot.x1 - 1]
  .filter(cx => W.getTile(cx, plot.level - 1) === TILES.TORCH).length;
check('the corners are lit', cornerTorches === 2, cornerTorches + '/2');
check('the plot is a landmark', W.landmarks.some(l => l.type === 'plains_plot'));
check('isInPlainsBuildPlot answers for the plot and not outside it',
  W.isInPlainsBuildPlot(plot.centre) &&
  !W.isInPlainsBuildPlot(plot.x0 - 20) &&
  W.isInPlainsBuildPlot(plot.x0 - 2, 4),
  'centre/outside/margin');

// The spawn point itself has to be the plot: that is what ties "flat area" to
// "the place you start", and it is why the plot is there at all.
const spawnX = Math.floor(W.width / 2);
check('the player starts on the flat plot',
  W.getBiomeAtX(spawnX) === 'plains' && W.surfaceHeights[spawnX] === plot.level,
  W.getBiomeAtX(spawnX) + '@' + W.surfaceHeights[spawnX] + ' vs level ' + plot.level);
check('the starter camp stands on the plot',
  W.getTile(spawnX - 3, plot.level - 1) === TILES.CHEST,
  'chest at spawn');

// ══════════════════════════════════════════════════════════════════════════
step('3. The ten-block building set');
const BUILDING_SET = [
  ['planks', 'PLANKS'], ['cobblestone', 'COBBLESTONE'], ['brick_block', 'BRICK_BLOCK'],
  ['polished_stone', 'POLISHED_STONE'], ['sandstone_brick', 'SANDSTONE_BRICK'],
  ['hay_block', 'HAY_BLOCK'], ['wool_block', 'WOOL_BLOCK'], ['ice_block', 'ICE_BLOCK'],
  ['bookshelf', 'BOOKSHELF'], ['lantern', 'LANTERN']
];
check('the set has ten blocks', BUILDING_SET.length === 10);
const buildTileIds = BUILDING_SET.map(([, t]) => TILES[t]);
check('every tile id is defined and unique',
  buildTileIds.every(id => Number.isInteger(id) && id > 0) &&
  new Set(buildTileIds).size === 10,
  buildTileIds.join(','));
check('the set does not collide with earlier tiles',
  Math.min(...buildTileIds) > TILES.DUNGEON_GATE &&
  // 41-57 belong to underworld.js and space.js, which load after world.js.
  buildTileIds.every(id => id < 58 || id > 57),
  'first id ' + Math.min(...buildTileIds));

for (const [item, tile] of BUILDING_SET) {
  const def = ITEMS[item];
  const prop = TILE_PROPERTIES[TILES[tile]];
  check('ITEMS.' + item + ' is a placeable tile item',
    !!def && def.type === 'tile' && def.tile === TILES[tile], def ? def.type : 'missing');
  check('TILE_PROPERTIES.' + tile + ' drops its own item',
    !!prop && !!prop.drops && prop.drops.id === item,
    prop && prop.drops ? prop.drops.id : 'no drops');
  const recipe = RECIPES.find(r => r.result && r.result.id === item);
  check('recipe for ' + item, !!recipe);
  check('recipe for ' + item + ' uses only real items',
    !!recipe && recipe.materials.length > 0 && recipe.materials.every(m => !!ITEMS[m.id]),
    recipe ? recipe.materials.map(m => m.id + (ITEMS[m.id] ? '' : ' MISSING')).join(', ') : 'no recipe');
}
// The lantern is the one light in the set, and it has to behave like one.
check('the lantern is the set\'s light source',
  TILE_PROPERTIES[TILES.LANTERN].light >= TILE_PROPERTIES[TILES.TORCH].light);
check('the lantern is a real light in every pass',
  W.isAnimatedTile(TILES.LANTERN) &&
  TILE_PROPERTIES[TILES.LANTERN].solid === false,
  'animated=' + W.isAnimatedTile(TILES.LANTERN) + ' solid=' + TILE_PROPERTIES[TILES.LANTERN].solid);
check('every other block in the set is solid',
  BUILDING_SET.filter(([, t]) => t !== 'LANTERN')
    .every(([, t]) => TILE_PROPERTIES[TILES[t]].solid === true));

// Place → look → mine, through the real click handlers, for all ten.
const placeX = plot.centre + 14;
const placeY = plot.level - 2;
let placedOk = 0, minedOk = 0;
for (const [item, tile] of BUILDING_SET) {
  // Clear the cell, stand within reach, and aim at it.
  W.setTile(placeX, placeY, TILES.AIR);
  g.player.x = (placeX - 1) * TILE_SIZE;
  g.player.y = (placeY - 1) * TILE_SIZE;
  g.inventory[g.player.selectedSlot] = { id: item, count: 5 };
  g.input.mouseX = placeX * TILE_SIZE + 12 - g.camera.x;
  g.input.mouseY = placeY * TILE_SIZE + 12 - g.camera.y;
  g.handleRightClick();
  if (W.getTile(placeX, placeY) === TILES[tile] && g.countItem(item) === 4) placedOk++;

  // Now mine it back: select a pickaxe so the swing gate is the tool's.
  g.inventory[g.player.selectedSlot] = { id: 'copper_pickaxe', count: 1 };
  g.attackCooldown = 0;
  const dropsBefore = g.drops.length;
  g.handleLeftClick();
  if (W.getTile(placeX, placeY) === TILES.AIR &&
      g.drops.length === dropsBefore + 1 &&
      g.drops[g.drops.length - 1].id === item) minedOk++;
}
check('all ten blocks place through the real right-click path', placedOk === 10,
  placedOk + '/10');
check('all ten blocks mine back into their own item', minedOk === 10, minedOk + '/10');
W.setTile(placeX, placeY, TILES.AIR);

// ══════════════════════════════════════════════════════════════════════════
step('4. Render cache: chunk-snapped rebuilds, walls painted once');
// Count rebuilds and per-frame canvas ops while the camera walks. This is the
// whole point of the optimisation: the old cache was pinned to the viewport's
// own top-left tile, so crossing a single tile boundary repainted everything.
let rebuilds = 0;
const realRebuild = W.rebuildTileCache.bind(W);
W.rebuildTileCache = (...a) => { rebuilds++; return realRebuild(...a); };

const frameBucket = {};
const frameCtx = makeCtx(frameBucket);
const cam = g.camera;
cam.viewportWidth = 1280;
cam.viewportHeight = 768;
cam.x = 60 * TILE_SIZE;
cam.y = 45 * TILE_SIZE;
W._tileCacheDirty = true;
frames(1, { render: 1 });          // warm the cache through the real render path

rebuilds = 0;
resetBucket(frameBucket);
const PIXELS_WALKED = 240;         // 10 tiles at 1px per frame
const TILE_STEPS = Math.floor(PIXELS_WALKED / TILE_SIZE);
for (let i = 0; i < PIXELS_WALKED; i++) {
  cam.x += 1;
  W.renderTiles(frameCtx, cam);
}
const chunkCeiling = Math.ceil(TILE_STEPS / TILE_CACHE_CHUNK) + 2;
info('walked ' + TILE_STEPS + ' tiles in ' + PIXELS_WALKED + ' frames → ' +
  rebuilds + ' cache rebuilds (chunk=' + TILE_CACHE_CHUNK + ')');
check('the cache survives a whole chunk of travel',
  rebuilds <= chunkCeiling, rebuilds + ' rebuilds over ' + TILE_STEPS + ' tiles');
check('the cache does rebuild at least once while moving',
  rebuilds >= 1, String(rebuilds));

// The wall pass must no longer run per frame. paintWalls() is that pass; if the
// frame buffer is receiving wall rectangles, they are coming from somewhere new.
const wallBucket = {};
const wallCtx = makeCtx(wallBucket);
W.paintWalls(wallCtx, 60, 45, 56, 34);
const wallRects = countOf(wallBucket);
check('the wall pass is a real pass (it has something to draw)', wallRects > 0,
  wallRects + ' rects');
// One frame at a time now: the cache is warm, so nothing should paint a wall.
resetBucket(frameBucket);
W.renderTiles(frameCtx, cam);
const frameOps = countOf(frameBucket);
info('per-frame canvas ops with a warm cache: ' + frameOps +
  ' (would be >= ' + wallRects + ' if walls were still drawn per frame)');
check('a warm frame draws no walls at all',
  frameOps < wallRects, frameOps + ' ops vs ' + wallRects + ' wall rects');

// And the pixels must not have moved: the cached canvas covers the viewport, so
// the blit has to land at a position that still shows the right tiles.
const blit = { x: 0, y: 0 };
const blitCtx = new Proxy({}, {
  get(t, p) {
    if (p === 'drawImage') return (...a) => { blit.x = a[1]; blit.y = a[2]; };
    if (p === 'canvas') return {};
    if (typeof p === 'string') return () => undefined;
    return undefined;
  },
  set() { return true; }
});
W.renderTiles(blitCtx, cam);
const expectedX = (Math.floor(Math.floor(cam.x / TILE_SIZE) / TILE_CACHE_CHUNK) * TILE_CACHE_CHUNK) * TILE_SIZE - cam.x;
const expectedY = (Math.floor(Math.floor(cam.y / TILE_SIZE) / TILE_CACHE_CHUNK) * TILE_CACHE_CHUNK) * TILE_SIZE - cam.y;
check('the cache is blitted from its snapped origin',
  blit.x === expectedX && blit.y === expectedY,
  blit.x + ',' + blit.y + ' vs ' + expectedX + ',' + expectedY);
check('the snapped origin is never to the right of the viewport',
  blit.x <= 0 && blit.y <= 0, blit.x + ',' + blit.y);
W.rebuildTileCache = realRebuild;

// ══════════════════════════════════════════════════════════════════════════
step('5. The Sovereign stays dead until bones are burned');
// Open sky over the spawn point, then take the real beacon → rift → arena route.
const homeGround = W.surfaceHeights[spawnX];
for (let ty = 0; ty <= homeGround; ty++) W.setTile(spawnX, ty, TILES.AIR);
g.player.x = spawnX * TILE_SIZE + 4;
g.player.y = (homeGround - 2) * TILE_SIZE;
g.addItem('void_rift_beacon', 3);
const openSky = () => {
  for (let ty = 0; ty <= W.surfaceHeights[spawnX]; ty++) W.setTile(spawnX, ty, TILES.AIR);
  g.player.x = spawnX * TILE_SIZE + 4;
  g.player.y = (W.surfaceHeights[spawnX] - 2) * TILE_SIZE;
  immortal();
};
const toSpace = () => {
  openSky();
  if (!g.world.isInSpace()) {
    // A wounded dragon makes the beacon a tether, not a ticket: the rift reopens
    // for free, so nothing needs topping up for that crossing either.
    if (!Number.isFinite(g.dragonHP)) g.addItem('void_rift_beacon', 1);
    if (!g.useVoidRiftBeacon()) return false;
    let n = 0;
    while (n < 900 && !g.world.isInSpace()) { immortal(); g.update(1 / 60); n++; }
  }
  return g.world.isInSpace();
};
const toHome = () => {
  if (g.world.isInSpace()) g.returnToOverworld();
  immortal();
};

check('the rift opens from the meadow with open sky', toSpace() === true);
// The Sovereign is sealed. Arriving finds a mine, not a boss — the fight is
// something the player performs with a rite, not something that happens to
// them when the rift tears open.
check('walking into the Ossuary wakes nothing', !g.boss && g.dragonSlain === false);
g.addItem('rite_of_waking', 1);
check('the rite opens the grave', g.performBoneRite() === true);
check('the Sovereign rises whole',
  !!g.boss && g.boss.kind === 'dragon' && g.dragonSlain === false);

// ---- Kill it. ----
g.boss.hp = 1;
g.boss.takeDamage(50, g.sound, g.particles, false);
frames(6, { render: 2, each: immortal });
check('the kill registers', g.dragonSlain === true, 'dragonSlain=' + g.dragonSlain);
check('a killed Sovereign banks no HP', g.dragonHP === null, String(g.dragonHP));
check('no rift is queued to drag the player back',
  !(g.riftReturnDelay > 0), String(g.riftReturnDelay));

// ---- The whole point: walking in again must NOT re-arm it. ----
toHome();
check('the way home works after a kill', !g.world.isInSpace());
check('home is not haunted by a re-entry timer',
  !(g.riftReturnDelay > 0), String(g.riftReturnDelay));
check('the rift does not come back for a dead dragon',
  frames(600, { each: immortal }) !== false && !g.wormhole && !g.boss,
  'wormhole=' + !!g.wormhole + ' boss=' + !!g.boss);

check('the arena can still be visited', toSpace() === true);
frames(30, { render: 5, each: immortal });
check('a dead Sovereign does not rise when you walk back in',
  !g.boss, g.boss ? 'boss kind ' + g.boss.kind : 'none');
check('the kill survived the round trip', g.dragonSlain === true && g.dragonHP === null);

// Dying in the arena after the kill must not pull the player back either.
toHome();
g.player.hp = 1;
g.damagePlayer(9999, { source: 'qa' });
frames(240, { each: immortal });
check('dying after a won fight wakes you at home, not in the arena',
  !g.world.isInSpace() && !g.wormhole && !g.boss,
  'space=' + g.world.isInSpace() + ' wormhole=' + !!g.wormhole);

// ---- The rite is the only door back in, and it must not wipe a wound. ----
check('back to the Ossuary with the arena still empty', toSpace() === true && !g.boss,
  g.boss ? 'boss present' : 'none');
g.addItem('rite_of_bones', 2);
const bonesAtRite = g.countItem('rite_of_bones');
check('the rite raises a whole Sovereign', (() => {
  const ok = g.performBoneRite() === true;
  return ok && g.countItem('rite_of_bones') === bonesAtRite - 1 &&
    !!g.boss && g.boss.hp === g.boss.maxHp && g.dragonSlain === false;
})(), 'boss=' + (g.boss ? g.boss.hp : 'none') +
  ' bones=' + g.countItem('rite_of_bones'));
check('the raised Sovereign is whole',
  !!g.boss && g.boss.hp === g.boss.maxHp && g.boss.maxHp === 88000,
  g.boss ? g.boss.hp + '/' + g.boss.maxHp : 'none');

// ---- Walk out mid-fight: the wound must bank and survive a rite attempt. ----
g.boss.hp = Math.floor(g.boss.maxHp * 0.4);
const bankedHP = g.boss.hp;
toHome();
check('the wound is banked, not forgotten', g.dragonHP === bankedHP && g.boss === null,
  'dragonHP=' + g.dragonHP + ' boss=' + g.boss);
check('a banked fight is still unfinished', g.dragonSlain === false);

// Reading the rite from home is refused, and nothing about the fight moves.
const bonesHome = g.countItem('rite_of_bones');
check('the rite is refused at home over a banked fight',
  g.performBoneRite() === false && g.countItem('rite_of_bones') === bonesHome &&
  g.dragonHP === bankedHP && !g.boss,
  'bones=' + g.countItem('rite_of_bones') + ' dragonHP=' + g.dragonHP);

// Re-entry is a tether for a wounded dragon: free, and it resumes the wound.
const beaconsBefore = g.countItem('void_rift_beacon');
check('returning to a wound costs no beacon', toSpace() === true &&
  g.countItem('void_rift_beacon') === beaconsBefore,
  g.countItem('void_rift_beacon') + ' vs ' + beaconsBefore);
check('the arena resumes the wound', !!g.boss && g.boss.hp === bankedHP,
  g.boss ? String(g.boss.hp) : 'no boss');
check('the resumed fight cleared the bank', g.dragonHP === null, String(g.dragonHP));

// The guard in isolation: an empty arena over a recorded wound must refuse the
// rite rather than delete the wound, stand up a whole dragon and burn the bones.
// In the arena the wound lives in the boss; moving it back into dragonHP is the
// record surviving the arena going quiet, which is the state this guards.
const bonesGuard = g.countItem('rite_of_bones');
g.boss = null;                       // the window this guard exists for
g.dragonHP = bankedHP;
check('a rite is refused over a recorded wound',
  g.performBoneRite() === false, 'returned true');
check('a refused rite keeps its bones', g.countItem('rite_of_bones') === bonesGuard,
  g.countItem('rite_of_bones') + ' vs ' + bonesGuard);
check('a refused rite keeps the recorded wound', g.dragonHP === bankedHP,
  'dragonHP=' + g.dragonHP + ' vs ' + bankedHP);
check('a refused rite raises nothing', !g.boss && g.dragonSlain === false);

// ---- Finish the fight, then and only then the rite works again. ----
toHome();
check('the recorded wound survives the trip home', g.dragonHP === bankedHP,
  'dragonHP=' + g.dragonHP);
check('re-entering resumes it', toSpace() === true && !!g.boss && g.boss.hp === bankedHP,
  g.boss ? String(g.boss.hp) : 'no boss');
g.boss.hp = 1;
g.boss.takeDamage(50, g.sound, g.particles, false);
frames(6, { render: 2, each: immortal });
check('finished at last', g.dragonSlain === true && g.dragonHP === null,
  'slain=' + g.dragonSlain + ' dragonHP=' + g.dragonHP);

// With no kill on record and no wound, there is nothing to raise either. This
// is the second guard: it stops a rite from conjuring a first dragon out of a
// pile of bones that were only ever meant to replace one.
const bonesNothing = g.countItem('rite_of_bones');
check('a rite is refused when nothing was ever slain', (() => {
  g.dragonSlain = false;             // pretend the kill never happened
  g.dragonHP = null;
  g.boss = null;
  return g.performBoneRite() === false && g.countItem('rite_of_bones') === bonesNothing && !g.boss;
})(), 'bones=' + g.countItem('rite_of_bones'));
g.dragonSlain = true;                // put the record back

// The kill on record + finished bones: the rite works, spends, and yields a
// whole Sovereign with no banked wound.
check('the rite answers over finished bones', (() => {
  g.addItem('rite_of_bones', 1);
  const before = g.countItem('rite_of_bones');
  const ok = g.performBoneRite() === true;
  return ok && g.countItem('rite_of_bones') === before - 1 &&
    !!g.boss && g.boss.kind === 'dragon' && g.boss.hp === g.boss.maxHp &&
    g.dragonSlain === false && g.dragonHP === null;
})(), 'boss=' + (g.boss ? g.boss.kind : 'none') + ' slain=' + g.dragonSlain);

// Nothing outside the Ossuary may raise one.
toHome();
check('the rite is refused at home', (() => {
  g.boss = null;
  g.dragonHP = null;
  g.addItem('rite_of_bones', 1);
  const before = g.countItem('rite_of_bones');
  return g.performBoneRite() === false && g.countItem('rite_of_bones') === before && !g.boss;
})());

// ══════════════════════════════════════════════════════════════════════════
console.log('\n' + '─'.repeat(62));
console.log(failures
  ? '✗ ' + failures + ' WORLD CHECK(S) FAILED'
  : '✓ ALL WORLD CHECKS PASSED');
process.exit(failures ? 1 : 0);
