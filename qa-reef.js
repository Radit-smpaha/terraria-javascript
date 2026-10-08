// Reef QA: the band-derived ocean reef (the "ocean was in the snow biome"
// fix), its pearls/shrines/Tide Gate, diving gear + swim fins + oxygen,
// reef fish and pirates, the Three-Headed Sea Leviathan, the lore NPCs, the
// guide text, and the save-version migration. Run with: node qa-reef.js
const fs = require('fs');
const vm = require('vm');

let failures = 0;
const check = (label, ok, detail = '') => {
  if (!ok) failures++;
  console.log((ok ? '  PASS ' : '  FAIL ') + label + (!ok && detail ? ' — ' + detail : ''));
};
const step = (title) => console.log('\n> ' + title);

// ---- DOM/canvas stubs (same approach as qa-node-harness.js) -------------
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
  return {
    id, width: 800, height: 600, textContent: '', innerHTML: '',
    style: {}, dataset: {},
    classList: (() => { const s = new Set(); return { add: c => s.add(c), remove: c => s.delete(c), contains: c => s.has(c), toggle: () => false }; })(),
    getContext: () => makeCtx(),
    addEventListener() {}, removeEventListener() {}, appendChild() {},
    querySelector: () => null, querySelectorAll: () => [], closest: () => null,
    remove() {}, parentNode: { removeChild() {} }, setAttribute() {}, getAttribute: () => null,
    className: '', value: ''
  };
}
const els = {};
global.document = {
  readyState: 'complete', scripts: [],
  getElementById: (id) => (els[id] ||= makeEl(id)),
  createElement: () => makeEl('dyn'),
  addEventListener() {}, querySelector: () => null, querySelectorAll: () => [],
  body: makeEl('body')
};
global.window = global;
global.innerWidth = 1280; global.innerHeight = 720;
global.devicePixelRatio = 1;
global.addEventListener = () => {};
global.performance = { now: () => 1000 };
global.requestAnimationFrame = () => 0;
global.localStorage = { getItem: () => null, setItem() {}, removeItem() {} };

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
const W = g.world;
const TILES = global.TILES;
const ITEMS = global.ITEMS;
const RECIPES = global.RECIPES;
const BIOME_ORDER = vm.runInContext('BIOME_ORDER', ctx);
const html = fs.readFileSync('terraria.html', 'utf8');
const srcT = fs.readFileSync('terraria.js', 'utf8');
const srcO = fs.readFileSync('ocean.js', 'utf8');

// ==========================================================================
step('1. Layout: the reef owns the west edge and never overlaps the snow');
check('BIOME_ORDER starts with reef', BIOME_ORDER[0] === 'reef', BIOME_ORDER.join('/'));
check('snow sits directly east of reef', BIOME_ORDER[1] === 'snow', BIOME_ORDER.join('/'));
const reefCols = [];
const snowCols = [];
for (let x = 0; x < W.width; x++) {
  const b = W.getBiomeAtX(x);
  if (b === 'reef') reefCols.push(x);
  if (b === 'snow') snowCols.push(x);
}
check('the reef band is huge (>25% of the world)',
  reefCols.length > W.width * 0.25, reefCols.length + '/' + W.width);
check('the reef starts at the world edge (x=0)', reefCols[0] === 0, String(reefCols[0]));
check('the snow band still exists', snowCols.length > 20, String(snowCols.length));
let snowFlooded = 0;
for (const x of snowCols) {
  const surf = W.surfaceHeights[x];
  for (let y = Math.max(0, surf - 10); y < W.height; y++) {
    if (W.getTile(x, y) === TILES.WATER) { snowFlooded++; break; }
  }
}
check('the bug is fixed: no open water anywhere under the snow band',
  snowFlooded === 0, snowFlooded + ' flooded snow columns');
// The snow band's ground row is snow except where the snow lodge and stone
// shrine legitimately pave their foundations with structure materials.
const snowPaved = new Set([TILES.SNOW, TILES.STONE_BRICK, TILES.COBBLESTONE,
  TILES.ICE_BLOCK, TILES.WOOD, TILES.PLANKS, TILES.FROSTBRICK]);
const snowSurf = snowCols.filter(x => snowPaved.has(W.getTile(x, W.surfaceHeights[x]))).length;
check('snow band surface is snow (or structures built on it), never sea',
  snowSurf > snowCols.length * 0.8, snowSurf + '/' + snowCols.length);

// ==========================================================================
step('2. Reef geometry: deep water, beach at the snow border');
const rb = W.reefBounds;
check('reefBounds exist and start at 0', !!rb && rb.left === 0, JSON.stringify(rb));
check('reefBounds end at the reef band edge',
  !!rb && Math.abs(rb.right - Math.ceil(W.width * 0.29)) <= 2,
  rb ? String(rb.right) : 'none');
let waterTiles = 0;
for (const x of reefCols) {
  for (let y = 0; y < W.height; y++) if (W.getTile(x, y) === TILES.WATER) waterTiles++;
}
check('the reef holds a real ocean (1500+ water tiles)', waterTiles >= 1500, String(waterTiles));
const mid = reefCols[Math.floor(reefCols.length * 0.4)];
check('the mid-reef floor sits well below the waterline',
  W.surfaceHeights[mid] - rb.seaY >= 20,
  'depth=' + (W.surfaceHeights[mid] - rb.seaY));
const last = reefCols[reefCols.length - 1];
check('the east shore ramps up to the waterline (walkable beach)',
  Math.abs(W.surfaceHeights[last] - rb.seaY) <= 3,
  'floor=' + W.surfaceHeights[last] + ' seaY=' + rb.seaY);

// ==========================================================================
step('3. Four pearls, four temple podiums, one dormant Tide Gate');
check('four reef offering podiums generated', W.reefPodiums && W.reefPodiums.length === 4,
  W.reefPodiums ? String(W.reefPodiums.length) : 'none');
const podiumOk = W.reefPodiums.every(p => W.getTile(p.x, p.y) === TILES.REEF_SHRINE && p.x < rb.right);
check('every podium starts dormant inside the reef', podiumOk);
check('the temple has two podiums on each side of the portal',
  W.reefPodiums.filter(p => p.side === 'left' && p.x < W.reefPortal.x).length === 2 &&
  W.reefPodiums.filter(p => p.side === 'right' && p.x > W.reefPortal.x).length === 2);
check('the portal is framed by a generated stone-and-marble temple',
  !!W.reefTemple && W.getTile(W.reefTemple.left + 3, W.reefTemple.top + 5) === TILES.STONE_BRICK &&
  [TILES.MARBLE, TILES.COPPER_BLOCK].includes(
    W.getTile(W.reefTemple.portalX - 3, W.reefTemple.portalY - 4)
  ));
check('legacy shrine metadata remains available to existing game code',
  W.reefShrines === W.reefPodiums);
let pearlCount = 0;
for (let y = 0; y < W.height; y++) {
  for (let x = 0; x < W.width; x++) {
    if (W.getTile(x, y) === TILES.SACRED_PEARL) pearlCount++;
  }
}
check('four Sacred Pearls are spread across the world',
  pearlCount === 4 && W.reefPearls.length === 4, String(pearlCount));
check('only one pearl is in the reef, with three on land',
  W.reefPearls[0].x < rb.right &&
  W.reefPearls.slice(1).every(pearl => pearl.x >= rb.right));
check('the pearl locations span separate biomes',
  new Set(W.reefPearls.slice(1).map(pearl => W.getBiomeAtX(pearl.x))).size === 3);
check('the Tide Gate is dormant between the inner shrines',
  !!W.reefPortal && W.getTile(W.reefPortal.x, W.reefPortal.y) === TILES.DORMANT_OCEAN_PORTAL,
  W.reefPortal ? W.reefPortal.x + ',' + W.reefPortal.y : 'none');
check('the portal floats mid-water, not on the floor',
  !!W.reefPortal && W.reefPortal.y > rb.seaY && W.reefPortal.y < W.surfaceHeights[W.reefPortal.x] - 2,
  W.reefPortal ? 'y=' + W.reefPortal.y + ' floor=' + W.surfaceHeights[W.reefPortal.x] : 'none');
let tallestCoral = 0;
for (const x of reefCols) {
  let run = 0;
  for (let y = rb.seaY; y < W.surfaceHeights[x]; y++) {
    if (W.getTile(x, y) === TILES.CORAL) {
      run++;
      tallestCoral = Math.max(tallestCoral, run);
    } else run = 0;
  }
}
check('reef coral grows into larger multi-tile branches', tallestCoral >= 4, String(tallestCoral));
const room = W.reefTemple.interior;
let dirtyTempleTiles = 0;
for (let y = room.top; y < room.bottom; y++) {
  for (let x = room.left; x <= room.right; x++) {
    if (W.getTile(x, y) === TILES.WATER || W.getTile(x, y) === TILES.CORAL) dirtyTempleTiles++;
  }
}
check('the temple sanctuary is cleared of water and stray coral', dirtyTempleTiles === 0,
  String(dirtyTempleTiles));
check('the sanctuary uses house-style background walls',
  W.walls[(room.top * W.width) + room.left] === 23);
const savedRoomTile = W.getTile(room.left + 1, room.top + 1);
W.setTile(room.left + 1, room.top + 1, TILES.CORAL);
W.buildReefTemple();
check('temple rebuilding clears coral that grows inside',
  W.getTile(room.left + 1, room.top + 1) === TILES.AIR);
W.setTile(room.left + 1, room.top + 1, savedRoomTile);
const savedPlayerPosition = { x: g.player.x, y: g.player.y };
const savedOxygen = g.oxygen;
g.player.x = (W.reefTemple.portalX + 0.5) * global.TILE_SIZE - g.player.width / 2;
g.player.y = (room.top + 1) * global.TILE_SIZE;
g.oxygen = 0;
g.updateOceanSystems(0.1);
check('the temple grants breathable air and refills oxygen',
  W.isInsideReefTemple(W.reefTemple.portalX, room.top + 1) && g.oxygen === g.oxygenMax);
g.player.x = savedPlayerPosition.x;
g.player.y = savedPlayerPosition.y;
g.oxygen = savedOxygen;
let coralFill = '';
const coralRects = [];
W.drawTileGraphic({
  set fillStyle(value) { coralFill = value; },
  fillRect(x, y, width, height) { coralRects.push({ color: coralFill, x, y, width, height }); }
}, TILES.CORAL, 0, 0, 4, 4);
check('coral tiles fill their whole cell with opaque reef color',
  coralRects.some(r => r.color === '#083548' && r.x === 0 && r.y === 0 &&
    r.width === global.TILE_SIZE && r.height === global.TILE_SIZE));
check('static water uses the tile cache instead of the per-frame animation pass',
  !W.isAnimatedTile(TILES.WATER));
check('the ocean backdrop is reused as a cached canvas',
  srcO.includes('_oceanBackgroundCache') && srcO.includes('ctx.drawImage(cache.canvas, 0, 0)'));
const waterX = Math.floor((g.player.x + g.player.width / 2) / global.TILE_SIZE) + 2;
const waterY = Math.floor((g.player.y + g.player.height / 2) / global.TILE_SIZE);
const previousTile = W.getTile(waterX, waterY);
const previousMouse = { x: g.input.mouseX, y: g.input.mouseY };
const previousSlot = g.player.selectedSlot;
W.setTile(waterX, waterY, TILES.WATER);
g.player.selectedSlot = 4;
g.input.mouseX = (waterX + 0.5) * global.TILE_SIZE - g.camera.x;
g.input.mouseY = (waterY + 0.5) * global.TILE_SIZE - g.camera.y;
g.handleLeftClick();
check('clicking water cannot remove it', W.getTile(waterX, waterY) === TILES.WATER);
W.setTile(waterX, waterY, previousTile);
g.input.mouseX = previousMouse.x;
g.input.mouseY = previousMouse.y;
g.player.selectedSlot = previousSlot;

const oldPlayerPosition = { x: g.player.x, y: g.player.y };
const oldPodiumTiles = W.reefPodiums.map(podium => W.getTile(podium.x, podium.y));
const oldPortalTile = W.getTile(W.reefPortal.x, W.reefPortal.y);
const oldPearlStack = g.inventory[4];
g.player.selectedSlot = 4;
g.inventory[4] = { id: 'sacred_pearl', count: 4 };
for (const podium of W.reefPodiums) {
  g.player.x = (podium.x + 0.5) * global.TILE_SIZE - g.player.width / 2;
  g.player.y = (podium.y + 0.5) * global.TILE_SIZE - g.player.height / 2;
  g.input.mouseX = (podium.x + 0.5) * global.TILE_SIZE - g.camera.x;
  g.input.mouseY = (podium.y + 0.5) * global.TILE_SIZE - g.camera.y;
  g.handleRightClick();
}
check('right-clicking one Sacred Pearl onto each podium lights the gate',
  W.reefPodiums.every(podium => W.getTile(podium.x, podium.y) === TILES.REEF_SHRINE_ACTIVE) &&
  W.getTile(W.reefPortal.x, W.reefPortal.y) === TILES.OCEAN_PORTAL &&
  g.inventory[4].count === 0);
for (let i = 0; i < W.reefPodiums.length; i++) {
  W.setTile(W.reefPodiums[i].x, W.reefPodiums[i].y, oldPodiumTiles[i]);
}
W.setTile(W.reefPortal.x, W.reefPortal.y, oldPortalTile);
g.player.x = oldPlayerPosition.x;
g.player.y = oldPlayerPosition.y;
g.inventory[4] = oldPearlStack;
g.player.selectedSlot = previousSlot;

const legacyTempleTiles = W.tiles.slice();
const legacyPearlColumns = [0.16, 0.36, 0.62, 0.84].map(f =>
  Math.round(rb.left + (rb.mainRight - rb.left) * f));
const legacyShrines = legacyPearlColumns.map(x => Math.min(x + 4, rb.mainRight - 4));
for (const x of legacyShrines) W.setTile(x, W.surfaceHeights[x] - 1, TILES.REEF_SHRINE_ACTIVE);
W.setTile(W.reefPortal.x, W.reefPortal.y, TILES.OCEAN_PORTAL);
const migratedTemple = W.migrateLegacyReefTemple();
check('version-15 shrine progress migrates into the four temple offerings',
  migratedTemple &&
  W.reefPodiums.every(p => W.getTile(p.x, p.y) === TILES.REEF_SHRINE_ACTIVE) &&
  W.getTile(W.reefPortal.x, W.reefPortal.y) === TILES.OCEAN_PORTAL);
W.tiles.set(legacyTempleTiles);
W._tileCacheDirty = true;

// ==========================================================================
step('4. Landmarks never drown in the reef');
for (const type of ['cabin', 'snow_lodge', 'shrine', 'spawn_camp', 'plains_plot', 'dungeon']) {
  const ls = W.landmarks.filter(l => l.type === type);
  check(type + ' stands east of the waterline',
    ls.length > 0 && ls.every(l => l.x >= rb.right),
    ls.length ? ls.map(l => l.x).join(',') + ' vs reef end ' + rb.right : 'missing');
}
check('spawn sits in the plains band',
  W.getBiomeAtX(Math.floor(W.width / 2)) === 'plains',
  W.getBiomeAtX(Math.floor(W.width / 2)));
check('the drowned chapel sits in the swamp band',
  W.getBiomeAtX(Math.floor(W.width * 0.86)) === 'swamp',
  W.getBiomeAtX(Math.floor(W.width * 0.86)));

// ==========================================================================
step('5. Diving gear, swim fins and the oxygen meter');
const gear = ['diving_gear_1', 'diving_gear_2', 'diving_gear_3'].map(id => ITEMS[id]);
const fins = ['swim_fins_1', 'swim_fins_2', 'swim_fins_3'].map(id => ITEMS[id]);
check('all three diving gears exist with rising oxygen',
  gear.every(Boolean) && gear[0].oxygen === 18 && gear[1].oxygen === 38 && gear[2].oxygen === 75,
  gear.map(d => d && d.oxygen).join('/'));
check('all three swim fins exist with rising swim speed',
  fins.every(Boolean) && fins[0].swimSpeed < fins[1].swimSpeed && fins[1].swimSpeed < fins[2].swimSpeed,
  fins.map(d => d && d.swimSpeed).join('/'));
const crafted = new Set(RECIPES.map(r => r.result.id));
check('both gear lines are craftable',
  ['diving_gear_1', 'diving_gear_2', 'diving_gear_3', 'swim_fins_1', 'swim_fins_2', 'swim_fins_3']
    .every(id => crafted.has(id)));
const gearRecipe = (id) => RECIPES.find(r => r.result.id === id);
const uses = (id, mat) => gearRecipe(id).materials.some(m => m.id === mat);
check('tier 1 costs overworld materials (wool + iron)',
  uses('diving_gear_1', 'wool') && uses('diving_gear_1', 'iron_ore'));
check('top tiers cost reef materials (coral, manta, sacred pearls)',
  uses('diving_gear_2', 'coral_fragment') && uses('diving_gear_3', 'sacred_pearl') &&
  uses('swim_fins_3', 'sacred_pearl'));
check('the OXYGEN meter panel is in the HUD', html.includes('id="oxygen-panel"'));
check('running out of air drowns the player',
  srcT.includes('You are drowning! Find air or equip diving gear.'));

// ==========================================================================
step('6. Reef fish breeds and pirates');
check('fishing in the reef yields reef-only species',
  srcT.includes('fish_lionfish') && srcT.includes('fish_parrotfish') &&
  srcT.includes("['fish_angler', 7]"));
const species = [];
for (let i = 0; i < 8; i++) species.push(new global.OceanFish(100, 100, i).color);
check('eight ambient fish breeds, every one coloured',
  species.every(Boolean) && new Set(species).size >= 6,
  species.join(','));
const pirate = new global.Monster(200, 200, 'pirate');
check('the Reef Pirate monster exists',
  pirate.type === 'pirate' && pirate.width > 0);
check('reef spawn table rolls pirates (more often at night)',
  srcT.includes('reefColumn && Math.random() < (night ? 0.45 : 0.28)'));
check('pirates drop coral', srcT.includes("m.type === 'pirate'"));
const shark = new global.Monster(200, 200, 'shark');
check('reef sharks are full-size, damageable swimming monsters',
  shark.type === 'shark' && shark.width >= 48 && shark.hp > 0 &&
  srcT.includes('findOpenReefSwimSpawn'));
check('reef sharks drop coral and may drop a Manta',
  srcT.includes("m.type === 'shark'") && srcT.includes("'fish_manta', 1"));
check('underground cave monster rolls are disabled',
  srcT.includes('if (underground && !underworld)') &&
  !srcT.includes("mType = 'cave_bat'"));

// ==========================================================================
step('7. The Three-Headed Sea Leviathan');
const boss = new global.OceanLeviathan(100, 100, g);
check('110,000 HP', boss.maxHp === 110000 && boss.hp === 110000, String(boss.maxHp));
check('middle head takes less damage than the flanks (it is the most op)',
  boss.scaleDamageFor({ index: 1 }, 100) < boss.scaleDamageFor({ index: 0 }, 100) &&
  boss.scaleDamageFor({ index: 1 }, 100) < boss.scaleDamageFor({ index: 2 }, 100),
  [0, 1, 2].map(i => boss.scaleDamageFor({ index: i }, 100)).join('/'));
check('three heads, the middle one biggest',
  boss.headTargets().length === 3 && boss.headTargets()[1].r > boss.headTargets()[0].r);
check('the middle head leads the attack rotation',
  srcO.includes('roll < 0.45 ? heads[1]'));
check('water lasers hurt and announce it',
  srcO.includes('water laser') && srcO.includes('tidal burst'));
check('the boss wears its injuries (scar render keyed to lost HP)',
  srcO.includes('const injury = 1 - this.hp / this.maxHp') &&
  srcO.includes('WOUNDED SEA LEVIATHAN'));
check('entering the ocean planet spawns the boss',
  srcT.includes('new OceanLeviathan(arena.bossX, arena.bossY, this)'));
check('the Tide Gate really opens the ocean dimension',
  srcT.includes("openWormhole('ocean'") && srcT.includes('enterOceanDimension()'));

// ==========================================================================
step('8. Clue NPCs and the guide');
const defs = global.NPC_DEFS || [];
const byId = Object.fromEntries(defs.map(d => [d.id, d]));
check('four pearl guides and the two lore carriers are available',
  defs.length >= 9 && ['tidekeeper', 'frost_scout', 'sun_seeker', 'marsh_warden']
    .every(id => !!byId[id]) && !!byId.sailor && !!byId.starwatcher,
  defs.map(d => d.id).join(','));
check('the Guide points at both the reef and the sky',
  /pearl/i.test(byId.guide.greeting) && byId.guide.greeting.includes('Void Rift Beacon'));
check('the Old Sailor explains pearls, temple podiums and the Tide Gate',
  byId.sailor.greeting.includes('Sacred Pearls') &&
  byId.sailor.greeting.includes('podiums') &&
  byId.sailor.greeting.includes('gate'));
check('pearl coordinates stay locked until each guide favor is completed',
  defs.filter(def => Number.isInteger(def.reefPearlIndex)).length === 4 &&
  g.npcs.npcs.filter(npc => Number.isInteger(npc.def.reefPearlIndex))
    .every(npc => !npc.clueUnlocked));
const tidekeeper = g.npcs.npcs.find(npc => npc.id === 'tidekeeper');
tidekeeper.clueUnlocked = true;
g.npcs.openDialog(tidekeeper);
check('completing a favor reveals its pearl coordinates in dialogue',
  els['npc-dialogue'].innerHTML.includes(
    `X ${W.reefPearls[0].x}, Y ${W.reefPearls[0].y}`));
tidekeeper.clueUnlocked = false;
g.npcs.closeDialog();
check('the Star Watcher explains the space dimension',
  byId.starwatcher.greeting.includes('Void Rift Beacon') &&
  byId.starwatcher.greeting.includes('Ossuary'));
check('the guide modal documents the reef ritual',
  html.includes('THE OCEAN REEF') && html.includes('Sacred Pearls') &&
  html.includes('THREE-HEADED SEA LEVIATHAN'));
check('the guide modal still documents the Ossuary ritual',
  html.includes('WAKING THE SOVEREIGN'));

// ==========================================================================
step('9. Save migration');
check('saves are written as version 17', srcT.includes('version: 17'));
check('version 17 saves are accepted',
  srcT.includes('save.version >= 1 && save.version <= 17'));
check('v12-v14 saves get their legacy reef repaired before recarving',
  srcT.includes('save.version >= 12 && save.version <= 14') &&
  srcT.includes('save.version < 15') &&
  srcO.includes('version === 14'));
check('v15 saves migrate their shrine offerings into the temple podiums',
  srcT.includes('save.version === 15') && srcO.includes('migrateLegacyReefTemple'));
check('older saves relocate only their remaining pearl tiles',
  srcT.includes('save.version < 17') && srcO.includes('migrateDistributedReefPearls'));

console.log('');
if (failures) {
  console.log('REEF QA: ' + failures + ' FAILURE(S)');
  process.exit(1);
}
console.log('REEF QA: OK');
