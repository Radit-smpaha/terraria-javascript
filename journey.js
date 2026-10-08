// Journey progression: persistent goals, explorer ranks, biome/depth discoveries,
// activity streaks, and the compact always-on objective card.
// Loaded after npcs.js and before terraria.js.

const JOURNEY_VERSION = 1;
const JOURNEY_RANKS = [
  { score: 0, name: 'Wandering Sprout' },
  { score: 800, name: 'Camp Builder' },
  { score: 2500, name: 'Trailblazer' },
  { score: 6000, name: 'Seasoned Adventurer' },
  { score: 12000, name: 'Guardian Slayer' },
  { score: 25000, name: 'Forest Legend' }
];

const JOURNEY_BIOMES = {
  forest: { name: 'Verdant Reach', icon: '🌲', color: '#4ade80' },
  // The huge ocean on the far west edge of the world.
  reef: { name: 'Azure Reef', icon: '🪸', color: '#22d3ee' },
  snow: { name: 'Frostpine Expanse', icon: '❄️', color: '#bae6fd' },
  // The one biome with a levelled building plot in it, so its name says so.
  plains: { name: 'Open Meadow', icon: '🌾', color: '#a3e635' },
  savanna: { name: 'Sunscar Plains', icon: '☀️', color: '#fbbf24' },
  swamp: { name: 'Drowned Marsh', icon: '🌫️', color: '#a7f3d0' }
};

const JOURNEY_STAGES = [
  { id: 'wood', icon: '🪵', title: 'Gather 12 Wood', hint: 'Chop trees, then collect the drops.', goal: 12, metric: 'wood' },
  { id: 'mining', icon: '⛏️', title: 'Mine 20 Blocks', hint: 'Your pickaxe is the key to every shelter.', goal: 20, metric: 'mined' },
  { id: 'crafting', icon: '⚒️', title: 'Craft 3 Items', hint: 'Open the Forge with E and build your toolkit.', goal: 3, metric: 'crafted' },
  { id: 'building', icon: '▦', title: 'Place 12 Blocks', hint: 'Mark a wall, floor, or platform of your own.', goal: 12, metric: 'built' },
  { id: 'hunt', icon: '⚔️', title: 'Slay 5 Monsters', hint: 'Equip a weapon and turn the hostile mobs back.', goal: 5, metric: 'kills' },
  { id: 'biomes', icon: '🧭', title: 'Explore 3 Biomes', hint: 'Travel west and east beyond the starter forest.', goal: 3, metric: 'biomes' },
  { id: 'fishing', icon: '🎣', title: 'Catch 3 Fish', hint: 'Equip the rod; right-click nearby water.', goal: 3, metric: 'fish' },
  { id: 'chest', icon: '🧰', title: 'Open a Treasure Chest', hint: 'Search surface camps and old ruins.', goal: 1, metric: 'chests' },
  { id: 'depth', icon: '⛏️', title: 'Reach 45 Tiles Deep', hint: 'Descend beneath the surface and watch your stamina.', goal: 45, metric: 'depth' },
  { id: 'underworld', icon: '🔥', title: 'Enter the Underworld', hint: 'Keep digging past the blackstone into a sea of fire.', goal: 1, metric: 'underworld' },
  { id: 'boss', icon: '👁️', title: 'Defeat a World Boss', hint: 'Prepare armor, potions, and a room to fight in.', goal: 1, metric: 'bosses' },
  { id: 'dungeon', icon: '🕯️', title: 'Find the Buried Chapel', hint: 'Search the eastern swamp for a forgotten arch.', goal: 1, metric: 'dungeon' }
];

const JOURNEY_ACTIVITY = {
  mine: { icon: '⛏️', label: 'MINING', color: '#fbbf24' },
  build: { icon: '▦', label: 'BUILDING', color: '#4ade80' },
  gather: { icon: '🌿', label: 'GATHERING', color: '#86efac' },
  craft: { icon: '⚒️', label: 'CRAFTING', color: '#67e8f9' },
  hunt: { icon: '⚔️', label: 'HUNTING', color: '#fb7185' },
  fish: { icon: '🎣', label: 'FISHING', color: '#7dd3fc' },
  treasure: { icon: '🧰', label: 'TREASURE', color: '#fde047' }
};

class JourneySystem {
  constructor(game) {
    this.game = game;
    this.completed = new Set();
    this.currentIndex = 0;
    this.biomes = new Set();
    this.flags = {};
    this.maxDepth = 0;
    this.currentBiome = null;
    this.activity = { type: '', count: 0, lastAt: -999 };
    this.bestCombo = 0;
    this.lastRankIndex = 0;
    this.hudTimer = 0;
    this.rankUpTimer = 0;
    this.elements = null;
  }

  currentStage() {
    return JOURNEY_STAGES[this.currentIndex] || null;
  }

  stageMetric(metric) {
    const g = this.game;
    const s = g.stats || {};
    switch (metric) {
      case 'wood': return (s.woodCollected || 0) + (g.inventory ? g.countItem('wood') : 0);
      case 'mined': return s.blocksMined || 0;
      case 'crafted': return s.itemsCrafted || 0;
      case 'built': return s.blocksPlaced || 0;
      case 'kills': return s.kills || 0;
      case 'biomes': return this.biomes.size;
      case 'fish': return g.fishCaught || 0;
      case 'chests': return g.chestsOpened || 0;
      case 'depth': return this.maxDepth;
      case 'underworld': return this.flags.underworldFound ? 1 : 0;
      case 'bosses': return s.bossKills || 0;
      case 'dungeon': return this.flags.dungeonFound ? 1 : 0;
      default: return 0;
    }
  }

  currentProgress() {
    const stage = this.currentStage();
    if (!stage) return 0;
    return Math.max(0, Math.min(stage.goal, Math.floor(this.stageMetric(stage.metric))));
  }

  update(dt) {
    this.hudTimer -= dt;
    this.rankUpTimer = Math.max(0, this.rankUpTimer - dt);
    if (this.hudTimer <= 0) {
      this.hudTimer = 0.2;
      this.evaluateCurrentStage();
    }

    const g = this.game;
    const player = g.player;
    const world = g.world;
    if (!player || !world) return;

    const tileX = Math.floor((player.x + player.width / 2) / TILE_SIZE);
    const tileY = Math.floor((player.y + player.height / 2) / TILE_SIZE);
    const biome = world.getBiomeAtX(tileX);
    const meta = JOURNEY_BIOMES[biome] || JOURNEY_BIOMES.forest;
    if (biome !== this.currentBiome) {
      const firstVisit = this.currentBiome === null;
      this.currentBiome = biome;
      if (!this.biomes.has(biome)) {
        this.biomes.add(biome);
        if (!firstVisit || biome !== 'forest') {
          g.logDiscovery(`biome_${biome}`, `${meta.icon} Discovered ${meta.name}!`, 70);
        }
      }
    }

    const surface = world.surfaceHeights[Math.max(0, Math.min(world.width - 1, tileX))] || tileY;
    const depth = Math.max(0, tileY - surface);
    if (depth > this.maxDepth) {
      this.maxDepth = depth;
      for (const threshold of [20, 45, 70]) {
        if (depth >= threshold && !this.flags[`depth${threshold}`]) {
          this.flags[`depth${threshold}`] = true;
          g.logDiscovery(`depth_${threshold}`, `⛏️ Reached ${threshold} Tiles Below!`, threshold * 5);
        }
      }
    }
    if (Number.isFinite(world.underworldStart) && tileY >= world.underworldStart) this.discoverUnderworld();
  }

  discoverUnderworld() {
    if (this.flags.underworldFound) return false;
    this.flags.underworldFound = true;
    this.game.logDiscovery?.('underworld', '🔥 ENTERED THE UNDERWORLD!', 180);
    this.evaluateCurrentStage();
    return true;
  }

  recordActivity(type, x = 0, y = 0) {
    const def = JOURNEY_ACTIVITY[type];
    if (!def) return;
    const now = this.game.stats?.playTime || 0;
    if (this.activity.type === type && now - this.activity.lastAt < 1.35) {
      this.activity.count += 1;
    } else {
      this.activity.type = type;
      this.activity.count = 1;
    }
    this.activity.lastAt = now;
    this.bestCombo = Math.max(this.bestCombo, this.activity.count);

    if (this.activity.count === 3 || this.activity.count === 5 || (this.activity.count > 5 && this.activity.count % 5 === 0)) {
      this.game.particles?.addDamageText(x, y, `${def.label} x${this.activity.count}`, def.color, this.activity.count >= 5);
    }
    this.evaluateCurrentStage();
  }

  discoverDungeon() {
    if (this.flags.dungeonFound) return false;
    this.flags.dungeonFound = true;
    this.evaluateCurrentStage();
    return true;
  }

  evaluateCurrentStage() {
    const stage = this.currentStage();
    if (!stage) return false;
    if (this.currentProgress() < stage.goal) return false;

    this.completed.add(stage.id);
    this.currentIndex = Math.min(JOURNEY_STAGES.length, this.currentIndex + 1);
    const player = this.game.player;
    if (player) {
      this.game.particles?.magicSparkle(player.x + player.width / 2, player.y + player.height / 2, '#fde047', 26);
    }
    this.game.feel?.heal(0.35);
    this.game.logDiscovery?.(`journey_${stage.id}`, `🏆 JOURNEY COMPLETE: ${stage.title}`, 250);
    this.renderHUD(true);
    return true;
  }

  totalScore() {
    if (typeof this.game.scoreBreakdown !== 'function') return 0;
    return this.game.scoreBreakdown().total;
  }

  rankIndex() {
    const score = this.totalScore();
    let index = 0;
    for (let i = 0; i < JOURNEY_RANKS.length; i++) {
      if (score >= JOURNEY_RANKS[i].score) index = i;
    }
    return index;
  }

  noteDiscovery() {
    const index = this.rankIndex();
    if (index <= this.lastRankIndex) return false;
    this.lastRankIndex = index;
    const rank = JOURNEY_RANKS[index];
    this.game.showAnnouncement?.(`⭐ RANK UP: ${rank.name.toUpperCase()}!`);
    this.game.showToast?.(`⭐ Your journey rank is now ${rank.name}.`);
    this.game.feel?.heal(0.5);
    this.rankUpTimer = 2.4;
    this.renderHUD(true);
    return true;
  }

  syncWorldFlags() {
    if (this.game.world?.dungeon?.found) this.flags.dungeonFound = true;
    this.lastRankIndex = this.rankIndex();
  }

  toSave() {
    return {
      version: JOURNEY_VERSION,
      currentIndex: this.currentIndex,
      completed: [...this.completed],
      biomes: [...this.biomes],
      flags: { ...this.flags },
      maxDepth: this.maxDepth,
      currentBiome: this.currentBiome,
      bestCombo: this.bestCombo,
      lastRankIndex: this.lastRankIndex
    };
  }

  fromSave(saved) {
    this.completed = new Set();
    this.biomes = new Set();
    this.flags = {};
    this.maxDepth = 0;
    this.currentBiome = null;
    this.bestCombo = 0;
    this.lastRankIndex = 0;
    if (!saved || typeof saved !== 'object') return false;

    const validIds = new Set(JOURNEY_STAGES.map(stage => stage.id));
    if (Array.isArray(saved.completed)) {
      this.completed = new Set(saved.completed.filter(id => validIds.has(id)));
    }
    if (Array.isArray(saved.biomes)) {
      this.biomes = new Set(saved.biomes.filter(id => Object.prototype.hasOwnProperty.call(JOURNEY_BIOMES, id)));
    }
    if (saved.flags && typeof saved.flags === 'object') {
      for (const [key, value] of Object.entries(saved.flags)) {
        if (/^(dungeonFound|underworldFound|depth(?:20|45|70))$/.test(key) && value === true) this.flags[key] = true;
      }
    }
    const firstUnfinished = JOURNEY_STAGES.findIndex(stage => !this.completed.has(stage.id));
    this.currentIndex = firstUnfinished === -1 ? JOURNEY_STAGES.length : firstUnfinished;
    this.maxDepth = Number.isFinite(saved.maxDepth) ? Math.max(0, Math.floor(saved.maxDepth)) : 0;
    this.currentBiome = Object.prototype.hasOwnProperty.call(JOURNEY_BIOMES, saved.currentBiome)
      ? saved.currentBiome : null;
    this.bestCombo = Number.isFinite(saved.bestCombo) ? Math.max(0, Math.floor(saved.bestCombo)) : 0;
    return true;
  }

  cacheElements() {
    if (this.elements) return this.elements;
    const ids = [
      'journey-panel', 'journey-rank-icon', 'journey-rank', 'journey-score',
      'journey-location', 'journey-zone', 'journey-step', 'journey-title',
      'journey-hint', 'journey-progress-fill', 'journey-progress-text',
      'journey-streak', 'journey-threat'
    ];
    this.elements = Object.fromEntries(ids.map(id => [id, document.getElementById(id)]));
    return this.elements;
  }

  setText(el, value) {
    if (el && el.textContent !== value) el.textContent = value;
  }

  threatState() {
    const g = this.game;
    if (!g.player || !Array.isArray(g.monsters)) return { text: '', danger: false };
    const px = g.player.x + g.player.width / 2;
    const py = g.player.y + g.player.height / 2;
    let nearest = Infinity;
    for (const monster of g.monsters) {
      if (!monster || monster.dead) continue;
      nearest = Math.min(nearest, Math.hypot(monster.x + monster.width / 2 - px, monster.y + monster.height / 2 - py));
    }
    if (g.boss && !g.boss.dead) return { text: '⚠ BOSS NEARBY', danger: true };
    if (nearest < 180) return { text: '⚠ HOSTILE NEARBY', danger: true };
    if (g.world.isNight()) return { text: '☾ NIGHTFALL', danger: false };
    return { text: '', danger: false };
  }

  renderHUD(force = false) {
    const els = this.cacheElements();
    if (!els['journey-panel']) return;
    const stage = this.currentStage();
    const progress = this.currentProgress();
    const percent = stage ? (progress / stage.goal) * 100 : 100;
    const score = this.totalScore();
    const rankIndex = this.rankIndex();
    const rank = JOURNEY_RANKS[rankIndex];
    const biome = JOURNEY_BIOMES[this.currentBiome] || JOURNEY_BIOMES.forest;
    const depth = Math.max(0, Math.floor(this.maxDepth));
    const zone = depth >= 70 ? 'THE ABYSS' : depth >= 45 ? 'DEEP CAVERNS' : depth >= 20 ? 'THE UNDERWORLD' : depth >= 8 ? 'THE SHALLOWS' : 'SURFACE';
    const threat = this.threatState();
    const now = this.game.stats?.playTime || 0;
    const streakActive = this.activity.count >= 2 && now - this.activity.lastAt < 1.35;
    const activity = JOURNEY_ACTIVITY[this.activity.type];
    const signature = [
      stage?.id || 'done', progress, score, rankIndex, this.currentBiome, depth,
      threat.text, streakActive ? this.activity.count : 0, this.rankUpTimer > 0
    ].join('|');
    if (!force && signature === this._hudSignature) return;
    this._hudSignature = signature;

    this.setText(els['journey-rank-icon'], rankIndex > 0 ? '⭐' : '🧭');
    this.setText(els['journey-rank'], rank.name);
    this.setText(els['journey-score'], `${score.toLocaleString()} PTS`);
    this.setText(els['journey-location'], `${biome.icon} ${biome.name.toUpperCase()}`);
    this.setText(els['journey-zone'], zone);
    this.setText(els['journey-step'], stage ? `JOURNEY ${this.currentIndex + 1} / ${JOURNEY_STAGES.length}` : 'JOURNEY MASTERED');
    this.setText(els['journey-title'], stage ? `${stage.icon} ${stage.title}` : '👑 Wilds Champion');
    this.setText(els['journey-hint'], stage ? stage.hint : 'Every road in the wilds is yours to rediscover.');
    this.setText(els['journey-progress-text'], stage ? `${progress} / ${stage.goal}` : `${JOURNEY_STAGES.length} / ${JOURNEY_STAGES.length}`);
    if (els['journey-progress-fill']) els['journey-progress-fill'].style.width = `${Math.max(0, Math.min(100, percent))}%`;

    const streak = els['journey-streak'];
    if (streak) {
      streak.classList.toggle('hidden', !streakActive);
      this.setText(streak, activity ? `${activity.icon} ${activity.label} STREAK x${this.activity.count}` : '');
    }
    const danger = els['journey-threat'];
    if (danger) {
      danger.classList.toggle('hidden', !threat.text);
      danger.classList.toggle('danger', threat.danger);
      this.setText(danger, threat.text);
    }
    els['journey-panel'].classList.toggle('rank-up', this.rankUpTimer > 0);
    els['journey-panel'].classList.toggle('journey-complete', !stage);
  }

  getJournalHTML() {
    const completed = this.completed.size;
    const stage = this.currentStage();
    const rank = JOURNEY_RANKS[this.rankIndex()];
    const rows = JOURNEY_STAGES.map((entry, index) => {
      const done = this.completed.has(entry.id);
      const current = stage && stage.id === entry.id;
      const value = Math.min(entry.goal, Math.floor(this.stageMetric(entry.metric)));
      const state = done ? 'done' : current ? 'current' : 'locked';
      const status = done ? 'COMPLETE' : current ? `${value}/${entry.goal}` : 'LOCKED';
      return `<div class="journey-journal-row ${state}"><span>${done ? '✓' : current ? '▸' : '•'} ${entry.icon} ${entry.title}</span><strong>${status}</strong></div>`;
    }).join('');
    return `<div class="journal-journey-summary"><span>${rank.icon || '🧭'} ${rank.name}</span><strong>${completed} / ${JOURNEY_STAGES.length} JOURNEYS</strong></div>
      <div class="journal-journey-list">${rows}</div>`;
  }
}

if (typeof window !== 'undefined') {
  window.JourneySystem = JourneySystem;
  window.JOURNEY_STAGES = JOURNEY_STAGES;
  window.JOURNEY_RANKS = JOURNEY_RANKS;
}


