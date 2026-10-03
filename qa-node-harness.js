// Node harness: load game scripts with DOM/canvas stubs to verify boot.
const fs = require('fs');
const vm = require('vm');

function makeCtx() {
  return new Proxy({}, {
    get(t, p) {
      if (p === 'canvas') return {};
      if (p === 'createRadialGradient' || p === 'createLinearGradient')
        return () => ({ addColorStop() {} });
      if (p === 'getImageData') return () => ({ data: new Uint8ClampedArray(4) });
      if (p === 'measureText') return () => ({ width: 10 });
      if (typeof p === 'string') return (...a) => undefined;
      return undefined;
    },
    set() { return true; }
  });
}
function makeEl(id) {
  const el = {
    id, width: 800, height: 600, textContent: '', innerHTML: '',
    style: {}, dataset: {},
    classList: { add() {}, remove() {}, contains: () => false, toggle() {} },
    getContext: () => makeCtx(),
    addEventListener() {}, removeEventListener() {},
    appendChild() {}, querySelector: () => null,
    querySelectorAll: () => [], closest: () => null,
    remove() {}, parentNode: { removeChild() {} },
    setAttribute() {}, getAttribute: () => null,
    className: '', value: '',
  };
  return el;
}
const els = {};
global.document = {
  readyState: 'complete',
  scripts: [],
  getElementById: (id) => (els[id] ||= makeEl(id)),
  createElement: (tag) => makeEl(tag),
  addEventListener() {},
  querySelector: () => null,
  querySelectorAll: () => [],
  body: makeEl('body'),
};
global.window = global;
global.innerWidth = 1280; global.innerHeight = 720;
global.devicePixelRatio = 1;
global.addEventListener = () => {};
global.performance = { now: () => 1000 };
let rafCalls = 0;
global.requestAnimationFrame = () => { rafCalls++; return 0; };
global.localStorage = { getItem: () => null, setItem() {}, removeItem() {} };

const files = ['audio.js','particles.js','world.js','weather.js','entities.js','underworld.js','space.js','juice.js','npcs.js','journey.js','terraria.js'];
let ctx = vm.createContext(global);
for (const f of files) {
  const code = fs.readFileSync(f, 'utf8');
  try {
    vm.runInContext(code, ctx, { filename: f });
    console.log(f + ': EVAL OK');
  } catch (e) {
    console.log(f + ': EVAL FAIL: ' + (e.stack || e.message));
    process.exit(1);
  }
}
console.log('typeof game:', typeof global.game, '| Game:', typeof global.Game,
  '| WeatherSystem:', typeof global.WeatherSystem, '| ITEMS:', typeof global.ITEMS,
  '| TILE_SIZE:', typeof global.TILE_SIZE, '| World:', typeof global.World, '| Player:', typeof global.Player);
try {
  const g = global.game;
  console.log('game exists:', !!g, '| renderScale:', g && g.renderScale,
    '| pixel:', g && g.pixelCanvas.width + 'x' + g.pixelCanvas.height,
    '| glow:', g && g.glowCanvas.width + 'x' + g.glowCanvas.height,
    '| viewport:', g && g.camera.viewportWidth + 'x' + g.camera.viewportHeight,
    '| weather:', !!g.weather);
  // Settings quality controls are real and non-destructive.
  g.applyQualityMode('low', false);
  g.settings.effects = 'minimal';
  g.applyQualityMode('low', false);
  const lowRenderOk = (() => {
    try { g.render(); return true; } catch (error) { console.log('low render FAIL: ' + error.stack); return false; }
  })();
  const settingsOk = !g.autoQuality && g.renderScale === 0.6 && g.particleScale === 0.15 && lowRenderOk &&
    g.glowScale === 0.3 && g.world.glowScale === 0.3 &&
    g.canvas.width === Math.floor(global.innerWidth * global.devicePixelRatio) &&
    g.canvas.height === Math.floor(global.innerHeight * global.devicePixelRatio) &&
    g.pixelCanvas.width < g.camera.viewportWidth && g.canvas.style.width === '100%';
  const underworldWeapons = ['hellstone_greatblade', 'soulfire_repeater', 'abyssal_staff'];
  const forgeOk = underworldWeapons.every(id => global.ITEMS[id] && global.RECIPES.some(r => r.result.id === id)) &&
    global.ITEMS.soulfire_repeater.usesAmmo === false;
  g.settings.glow = 'off';
  g.applyGlowMode(false);
  const glowOffOk = g.glowScale === 0 && g.world.glowScale === 0;
  g.settings.glow = 'reduced';
  g.applyGlowMode(false);
  const glowReducedOk = g.glowScale === 0.45;
  g.settings.glow = 'full';
  g.applyGlowMode(false);
  const splitUiOk = typeof g.toggleInventoryModal === 'function' &&
    !!global.document.getElementById('crafting-modal') && !!global.document.getElementById('inventory-modal') &&
    !!global.document.getElementById('recipe-list') && !!global.document.getElementById('inventory-grid');
  g.showFps = true;
  g.renderFpsBadge();
  const badgeOnOk = !!g._fpsBadge;
  g.showFps = false;
  g._fpsBadge?.remove();
  g._fpsBadge = null;
  g.showFps = true;
  g.renderFpsBadge();
  const badgeReattachOk = !!g._fpsBadge && g._fpsBadge !== null;
  console.log('settings quality/effects: ' + (settingsOk ? 'OK' : 'FAIL') + ' | fullscreen composite: ' + (settingsOk ? 'OK' : 'FAIL'));
  console.log('underworld forge: ' + (forgeOk ? 'OK' : 'FAIL'));
  console.log('glow setting: ' + (glowOffOk && glowReducedOk ? 'OK' : 'FAIL'));
  console.log('performance badge reattach: ' + (badgeOnOk && badgeReattachOk ? 'OK' : 'FAIL'));
  console.log('split crafting/inventory UI: ' + (splitUiOk ? 'OK' : 'FAIL'));
  if (!settingsOk || !forgeOk || !glowOffOk || !glowReducedOk || !badgeOnOk || !badgeReattachOk || !splitUiOk) process.exit(1);
  g.settings.effects = 'full';
  g.applyQualityMode('auto', false);

  // exercise weather paths deterministically (no rAF loop)
  const W = global.WEATHER_TYPES;
  for (const t of ['RAIN','STORM','SNOW','SAND','FOG']) {
    g.weather.setWeather(W[t], 30, t, g);
    g.weather.intensity = 1; g.weather.targetIntensity = 1;
    for (let i = 0; i < 5; i++) g.weather.update(0.05, g);
    g.weather.render(g, makeCtx(), g.camera, 'back');
    g.weather.render(g, makeCtx(), g.camera, 'front');
    console.log(t + ': particles=' + g.weather.particles.length + ' label=' + g.weather.label);
  }
  // lightning path
  g.weather.type = W.STORM; g.weather.intensity = 1; g.weather.targetIntensity = 1;
  g.weather.lightningCooldown = 0;
  g.weather.update(0.05, g);
  console.log('lightning: flash=' + g.weather.lightningFlash.toFixed(2) + ' bolt=' + !!g.weather.bolt + ' hp=' + Math.round(g.player.hp));
  // NPC quest system (npcs.js)
  if (!g.npcs) { console.log('npcs MISSING'); process.exit(1); }
  g.npcs.update(0.1);
  const npc0 = g.npcs.npcs[0];
  npc0.state = 'active'; npc0.questIndex = 0; npc0.progress = 4;
  g.npcs.onKill({ type: 'zombie', isElite: false });
  g.npcs.render(makeCtx(), g.camera);
  const questSave = g.npcs.toSave();
  g.npcs.fromSave(questSave);
  console.log('npcs: count=' + g.npcs.npcs.length + ' progress=' + npc0.progress + ' state=' + npc0.state);
  // Secret dungeon + Cursed Knight boss
  if (!g.world.dungeon) { console.log('dungeon MISSING'); process.exit(1); }
  const dun = g.world.dungeon;
  const altarTile = g.world.getTile(dun.altarX, dun.altarY);
  console.log('dungeon: x=' + dun.x + ' entranceY=' + dun.entranceY + ' altar=' + dun.altarX + ',' + dun.altarY +
    ' tile=' + altarTile + ' (ALTAR=' + TILES.ALTAR + ')');
  if (altarTile !== TILES.ALTAR) { console.log('ALTAR TILE WRONG'); process.exit(1); }
  if (typeof global.CursedKnightBoss !== 'function') { console.log('CursedKnightBoss MISSING'); process.exit(1); }
  const kb = new global.CursedKnightBoss((dun.altarX - 4) * TILE_SIZE, dun.roomFloor * TILE_SIZE - 56, g);
  for (let i = 0; i < 60; i++) kb.update(0.05, g.player, g.projectiles, g.sound, g.particles, g.world);
  kb.takeDamage(kb.maxHp * 0.6, g.sound, g.particles, false);
  kb.render(makeCtx(), g.camera);
  console.log('knight: hp=' + Math.round(kb.hp) + ' phase=' + kb.phase + ' state=' + kb.attackState +
    ' onGround=' + kb.onGround + ' proj=' + g.projectiles.length);
  if (kb.phase !== 2) { console.log('KNIGHT PHASE 2 FAILED'); process.exit(1); }

  // Pickaxe regression: mining must succeed on the very click that arms the cooldown.
  g.player.selectedSlot = 0;
  g.attackCooldown = 0;
  const ptx = Math.floor((g.player.x + 9) / TILE_SIZE) + 2;
  const pty = Math.floor((g.player.y + 18) / TILE_SIZE);
  g.world.setTile(ptx, pty, TILES.STONE);
  g.input.mouseX = ptx * TILE_SIZE + 6 - g.camera.x;
  g.input.mouseY = pty * TILE_SIZE + 6 - g.camera.y;
  const minedBefore = g.stats.blocksMined;
  g.handleLeftClick();
  const pickOk = g.stats.blocksMined > minedBefore;
  console.log('pickaxe mine-on-arm-click: ' + (pickOk ? 'OK' : 'FAIL') + ' (cooldown armed: ' + (g.attackCooldown > 0) + ')');
  if (!pickOk) { console.log('PICKAXE REGRESSION'); process.exit(1); }

  // ---- Rainbow ore + OP swords + recipes ----
  const rainbowCount = g.world.countRainbowOre();
  console.log('rainbow ore tiles seeded: ' + rainbowCount);
  if (rainbowCount < 10) { console.log('RAINBOW ORE MISSING'); process.exit(1); }
  ['cursed_edge', 'prismatic_saber', 'aurora_blade'].forEach(id => {
    const it = ITEMS[id];
    if (!it || !it.icon || it.type !== 'weapon' || it.damage < 85) {
      console.log('SWORD NOT OP: ' + id); process.exit(1);
    }
  });
  console.log('OP swords: cursed=' + ITEMS.cursed_edge.damage +
    ' prism=' + ITEMS.prismatic_saber.damage + ' aurora=' + ITEMS.aurora_blade.damage +
    ' (lifesteal ' + (ITEMS.aurora_blade.lifesteal * 100) + '%)');
  const recOk = RECIPES.some(r => r.result.id === 'prismatic_saber') &&
    RECIPES.some(r => r.result.id === 'aurora_blade') &&
    RECIPES.find(r => r.result.id === 'aurora_blade').materials.some(m => m.id === 'rainbow_ore');
  console.log('rainbow recipes: ' + (recOk ? 'OK' : 'FAIL'));
  if (!recOk) process.exit(1);

  // ---- Bed respawn + campfire fallback ----
  // Find the starter bed by SEARCHING for it. It used to be hard-coded as
  // (spawnX + 2, surface - 1), which is the row the house floor sits on - the
  // bed has since moved onto the standing row inside the house, and pinning a
  // coordinate here just meant this check silently tested nothing.
  const sx0 = Math.floor(g.world.width / 2);
  let bedX = -1, bedY = -1;
  for (let y = g.world.surfaceHeights[sx0] - 10; y <= g.world.surfaceHeights[sx0]; y++) {
    for (let x = sx0 - 7; x <= sx0 + 7; x++) {
      if (g.world.getTile(x, y) === TILES.BED) { bedX = x; bedY = y; }
    }
  }
  const bedExists = bedX >= 0;
  const bedRespX = (bedX + 1) * TILE_SIZE + 3;
  const bedRespY = (bedY + 1) * TILE_SIZE - g.player.height;
  g.respawnPoint = { kind: 'bed', bedX, bedY, x: bedRespX, y: bedRespY };
  g.player.x = 9999; g.player.y = 9999;
  g.respawnPlayer();
  const bedOk = bedExists && Math.abs(g.player.x - bedRespX) < 1;
  console.log('bed respawn (bed at ' + bedX + ',' + bedY + '): ' +
    (bedOk ? 'OK' : 'FAIL') + ' x=' + g.player.x);
  if (!bedOk) process.exit(1);
  // Break the bed -> back to the first campfire
  g.world.setTile(bedX, bedY, TILES.STONE);
  g.player.x = 9999;
  g.respawnPlayer();
  const fallOk = Math.abs(g.player.x - sx0 * TILE_SIZE) < 1 && g.respawnPoint === null;
  console.log('campfire fallback after bed broken: ' + (fallOk ? 'OK' : 'FAIL'));
  if (!fallOk) process.exit(1);

  // ---- Awakened day-20 boss variant ----
  g.summonBoss(true);
  const awOk = g.boss && /AWAKENED/.test(g.boss.name) && g.boss.maxHp >= 4500 && g.boss.enraged === true;
  console.log('awakened boss: "' + (g.boss && g.boss.name) + '" maxHp=' + (g.boss && g.boss.maxHp) + ' ' + (awOk ? 'OK' : 'FAIL'));
  if (!awOk) process.exit(1);
  g.boss = null;
  console.log('bossDaysDone=[' + g.bossDaysDone.join(',') + '] dayCount=' + g.world.dayCount);

  // ---- Underworld + demon castle ----
  const uw = g.world.underworld;
  const castleOk = !!uw && uw.start === g.world.underworldStart && Number.isFinite(uw.castleX) &&
    g.world.getTile(uw.gateX, uw.gateY) === TILES.DEMON_GATE &&
    g.world.getTile(uw.gateX, uw.gateY + 1) === TILES.AIR &&
    g.world.getTile(uw.gateX, uw.gateY + 2) === TILES.AIR &&
    g.world.getTile(uw.altarX, uw.altarY) === TILES.DEMON_ALTAR;
  console.log('underworld castle: ' + (castleOk ? 'OK' : 'FAIL') + ' start=' + (uw && uw.start) + ' x=' + (uw && uw.castleX));
  if (!castleOk) process.exit(1);

  const underworldMobs = ['hellhound', 'imp', 'bone_serpent'].map(species => new global.UnderworldMonster(g.player.x, g.player.y, species));
  const mobsOk = underworldMobs.every(mob => mob.underworld && mob.maxHp >= 165 && mob.damage >= 38);
  underworldMobs.forEach(mob => mob.render(makeCtx(), g.camera));
  console.log('underworld mobs: ' + (mobsOk ? 'OK' : 'FAIL'));
  if (!mobsOk) process.exit(1);

  const demon = new global.DemonBoss(g.player.x, g.player.y, g);
  const demonStartOk = demon.kind === 'demon' && demon.maxHp === 38000 && demon.phase === 1;
  demon.x = (uw.castleX + 0.5) * TILE_SIZE - demon.width / 2;
  demon.y = uw.floorY * TILE_SIZE - demon.height;
  const roomBounds = demon.castleBounds(g.world);
  const bounded = demon.safeBossPosition(999999, g.world.underworldStart * TILE_SIZE, g.world);
  const wallX = uw.castleX;
  const wallY = uw.floorY - 6;
  const oldWall = g.world.getTile(wallX, wallY);
  g.world.setTile(wallX, wallY, TILES.CASTLE_BRICK);
  const blocked = demon.safeBossPosition(roomBounds.right + 400, demon.y, g.world);
  g.world.setTile(wallX, wallY, oldWall);
  const wallSafeOk = bounded.x >= roomBounds.left && bounded.x <= roomBounds.right && bounded.y >= roomBounds.top && bounded.y <= roomBounds.bottom && blocked.x === demon.x;
  demon.takeDamage(demon.maxHp * 0.7, g.sound, g.particles, false);
  const demonPhase3Ok = demon.phase === 3 && demon.hp < demon.maxHp * 0.34;
  // The arena fix: the boss stands on floorY, so its body (82px tall) must not
  // intersect any solid tile. It used to spawn inside its own throne dais and
  // the scattered DEMON_BRICK ribs, which left it stuck and trivial to kill.
  // The altar tile itself is legitimately solid (it is the wake-up switch), so
  // the assertion is that the BODY is clear, not that the floor is bare.
  const bodyClear = demon.positionClear(demon.x, demon.y, g.world);
  // And the floor immediately under the boss must be walkable, so it can chase.
  const footTileY = Math.floor((demon.y + demon.height + 2) / TILE_SIZE);
  const footTileX = Math.floor((demon.x + demon.width / 2) / TILE_SIZE);
  const floorRowClear = g.world.isSolid(footTileX, footTileY);
  // The maelstrom sweep must exist, be phase-3 only, and actually emit.
  demon.startSweep([], g.sound, g.particles);
  const sweepShots = [];
  for (let i = 0; i < 40; i++) demon.updateSweep(1 / 60, sweepShots, g.sound, g.particles);
  const sweepOk = demon.sweeping && sweepShots.length > 0 && sweepShots[0].isHostile === true;
  demon.render(makeCtx(), g.camera);
  console.log('demon boss: ' + (demonStartOk && wallSafeOk && demonPhase3Ok ? 'OK' : 'FAIL') +
    ' hp=' + Math.round(demon.hp) + ' phase=' + demon.phase + ' wallSafe=' + wallSafeOk +
    ' spawnClear=' + bodyClear + ' floorClear=' + floorRowClear + ' sweep=' + sweepOk);
  if (!demonStartOk || !wallSafeOk || !demonPhase3Ok) process.exit(1);
  if (!bodyClear) { console.log('FAIL: demon spawns inside a solid tile'); process.exit(1); }
  if (!floorRowClear) { console.log('FAIL: arena floor is blocked at the boss spawn'); process.exit(1); }
  if (!sweepOk) { console.log('FAIL: maelstrom sweep emitted no hostile projectiles'); process.exit(1); }

  // ---- v11 world/progression persistence ----
  g.stats.itemsCrafted = 7;
  g.stats.woodCollected = 19;
  g.chestsOpened = 2;
  g.fishCaught = 4;
  g.questsDone = 3;
  g.villagersMet = { guide: true, prospector: true };
  g.discoveryPoints = 321;
  g._discoveries = new Set(['test_discovery', 'biome_forest']);
  g.discoveryLog = [{ id: 'test_discovery', label: '🧪 Test Discovery', day: 2 }];
  g._bossKinds = { forest: true };
  g.journey.biomes = new Set(['forest', 'snow']);
  g.journey.maxDepth = 47;
  const progressSave = g.progressToSave();
  g.stats.itemsCrafted = 0;
  g.stats.woodCollected = 0;
  g.chestsOpened = 0;
  g.fishCaught = 0;
  g.questsDone = 0;
  g.villagersMet = {};
  g._discoveries = new Set();
  g.discoveryLog = [];
  g._bossKinds = {};
  g.journey.fromSave(null);
  g.restoreProgress(progressSave);
  const progressOk = g.stats.itemsCrafted === 7 && g.stats.woodCollected === 19 &&
    g.chestsOpened === 2 && g.fishCaught === 4 && g.questsDone === 3 &&
    Object.keys(g.villagersMet).length === 2 && g._discoveries.size === 2 &&
    g._bossKinds.forest === true && g.journey.biomes.size === 2 && g.journey.maxDepth === 47;
  console.log('v11 world/progression round-trip: ' + (progressOk ? 'OK' : 'FAIL'));
  if (!progressOk) process.exit(1);

  // one update+render tick
  g.update(0.016); g.render();
  console.log('tick OK. rafCalls=' + rafCalls);
  console.log('ALL CHECKS PASSED');
} catch (e) {
  console.log('RUNTIME FAIL: ' + (e.stack || e.message));
  process.exit(1);
}
