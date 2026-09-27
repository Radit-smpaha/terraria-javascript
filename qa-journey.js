// Focused regression test for the persistent Journey progression layer.
const fs = require('fs');
const vm = require('vm');

let fail = 0;
const check = (condition, message) => {
  if (condition) console.log('OK: ' + message);
  else { console.log('FAIL: ' + message); fail = 1; }
};

const sandbox = {
  console,
  TILE_SIZE: 24,
  document: { getElementById: () => null }
};
sandbox.window = sandbox;
vm.createContext(sandbox);
vm.runInContext(fs.readFileSync('journey.js', 'utf8'), sandbox, { filename: 'journey.js' });

const game = {
  stats: { blocksMined: 0, itemsCrafted: 0, blocksPlaced: 0, kills: 0, bossKills: 0, woodCollected: 0, playTime: 0 },
  player: { x: 3000, y: 1000, width: 18, height: 42 },
  world: { width: 440, surfaceHeights: Array(440).fill(40), getBiomeAtX: () => 'forest', isNight: () => false },
  inventory: [],
  monsters: [],
  boss: null,
  fishCaught: 0,
  chestsOpened: 0,
  particles: { texts: [], magicSparkle() {}, addDamageText(...args) { this.texts.push(args); } },
  feel: { heal() {} },
  discoveries: [],
  countItem() { return 0; },
  logDiscovery(id, label, points) { this.discoveries.push({ id, label, points }); return true; },
  showAnnouncement() {},
  showToast() {},
  scoreBreakdown() { return { total: this.stats.blocksMined + this.stats.kills * 10 + this.discoveries.length * 70 }; }
};

const journey = new sandbox.JourneySystem(game);
check(sandbox.JOURNEY_STAGES.length === 12, 'twelve journey stages are defined');
journey.update(0.016);
check(journey.biomes.has('forest'), 'starting forest is recorded without a noisy first-visit announcement');

game.stats.woodCollected = 12;
check(journey.evaluateCurrentStage() && journey.currentStage().id === 'mining', 'wood objective advances to mining');
game.stats.blocksMined = 20;
game.stats.itemsCrafted = 3;
game.stats.blocksPlaced = 12;
game.stats.kills = 5;
game.stats.bossKills = 1;
game.fishCaught = 3;
game.chestsOpened = 1;
journey.biomes.add('snow');
journey.biomes.add('swamp');
journey.maxDepth = 45;
journey.discoverUnderworld();
journey.discoverDungeon();
while (journey.currentStage()) journey.evaluateCurrentStage();
check(journey.completed.size === 12 && !journey.currentStage(), 'all objective types can complete in sequence');
check(journey.rankIndex() > 0, 'completed activity raises the explorer rank');
check(journey.getJournalHTML().includes('JOURNEYS'), 'journal includes a journey checklist');

const saved = journey.toSave();
const restored = new sandbox.JourneySystem(game);
check(restored.fromSave(saved), 'valid journey save loads');
check(restored.completed.size === 12 && restored.maxDepth === 45 && restored.bestCombo === journey.bestCombo,
  'journey save round-trips goals, depth, and records');
check(restored.fromSave({ currentIndex: 999, completed: ['wood', 'HACK'], biomes: ['forest', 'HACK'], maxDepth: -5, flags: { hacked: true, dungeonFound: true } }),
  'malformed journey save is accepted defensively');
check(restored.currentIndex === 1 && restored.maxDepth === 0 && !restored.flags.hacked && restored.flags.dungeonFound,
  'malformed journey fields are stripped, bounded, or recomputed from valid goals');

console.log(fail ? 'JOURNEY VALIDATION FAILED' : 'ALL JOURNEY CHECKS PASSED');
process.exit(fail);
