// NPCs & QUESTS — Guide, Prospector and Scavenger villagers.
// Walk up to one and press T to talk, accept a quest (kill monsters or
// collect items), then turn it in for rewards drawn from the existing ITEMS
// table. Loaded after juice.js and before terraria.js: Game constructs
// NPCManager itself, and quest state rides along in the normal save file.

const NPC_DEFS = [
  {
    id: 'guide',
    name: 'Guide',
    icon: '🧭',
    // Offsets are a PREFERENCE, not a coordinate: findStandableSpot walks
    // outward until it finds open ground. They are spread well clear of the
    // spawn cottage (spawnX +/- 6) so nobody ends up nose-to-wall.
    dx: -9,
    greeting: 'Welcome, traveller! The reef lies far west: find four glowing pearls and offer them at the Tide Temple podiums. Old sailors say a Void Rift Beacon can tear the sky open, and the dragon beyond remembers every wound.',
    // Idle chatter: what they say when there is no quest to hand. Each line is
    // a small window into the person, and they rotate so a villager you talk
    // to every day does not repeat themselves like a signpost.
    chatter: [
      'I write everything down. Every step of yours is already history to somebody.',
      'Four pearls, four podiums. The gate has waited a long time; it can wait an hour more.',
      'When you have stood where the world ends, come back. The journal is never finished.'
    ],
    // Said once, the first time the player beats each boss.
    reactions: {
      kraken: 'The last predator is gone? …Then the sea is finally quiet. I should write this down properly.',
      dragon: 'You stood in a dragon\'s grave and walked out. I have no words for it — I am writing it down.',
      knight: 'The chapel is safe. He would have wanted that, I think. Eventually.'
    },
    quests: [
      { type: 'kill', desc: 'Slay 5 monsters', target: 5, reward: [{ id: 'healing_potion', count: 2 }] },
      { type: 'kill', desc: 'Slay 10 monsters', target: 10, reward: [{ id: 'arrow', count: 30 }, { id: 'swiftness_potion', count: 1 }] },
      { type: 'kill', desc: 'Slay 15 monsters', target: 15, reward: [{ id: 'life_crystal', count: 1 }] }
    ]
  },
  {
    id: 'prospector',
    name: 'Prospector',
    icon: '⛏️',
    // Was +6, which is exactly the cottage's right-hand wall column.
    dx: 9,
    greeting: 'Ore, ore, ore! Dig deep and bring me the shiny stuff.',
    chatter: [
      'Every time you swing a pick you learn where the good stuff hides. That is the whole secret.',
      'The old dungeon under the east? Full of it. Also full of things that resent visitors.',
      'Copper, iron, gold, crystal — the mountain keeps a running tally, and it is generous.'
    ],
    reactions: {
      kraken: 'A shark that big has swallowed whole reefs. Wonder what it had in its teeth…',
      dragon: 'Meteor shards and dragonbone in one animal. That is a payday with wings.',
      knight: 'Gold in that chapel. You just cleared out the security, friend.'
    },
    quests: [
      { type: 'collect', items: [{ id: 'iron_ore', count: 10 }], desc: 'Bring 10 Iron Ore', reward: [{ id: 'ironskin_potion', count: 1 }, { id: 'apple', count: 3 }] },
      { type: 'collect', items: [{ id: 'gold_ore', count: 6 }], desc: 'Bring 6 Gold Ore', reward: [{ id: 'wrath_potion', count: 1 }, { id: 'torch', count: 20 }] },
      { type: 'collect', items: [{ id: 'crystal', count: 8 }], desc: 'Bring 8 Cave Crystals', reward: [{ id: 'mana_crystal', count: 1 }] }
    ]
  },
  {
    id: 'scavenger',
    name: 'Scavenger',
    icon: '🧺',
    dx: 14,
    greeting: 'A camp is only as good as its supplies. Trade me some goods!',
    chatter: [
      'Build wide, build warm. A bed near a campfire is worth more than any weapon.',
      'Bring back trophies. Put them on the wall. A home should remember what it survived.',
      'Wool, wood, rope — the small things. The small things are what hold a camp together.'
    ],
    reactions: {
      kraken: 'That trophy needs a wall of its own. Bring it home and I will help you hang it.',
      dragon: 'You fought a god and came back with souvenirs. Put them where people can see them.',
      knight: 'The chapel loot will keep this camp in candles for a year.'
    },
    quests: [
      { type: 'collect', items: [{ id: 'wood', count: 20 }], desc: 'Bring 20 Wood', reward: [{ id: 'campfire', count: 1 }, { id: 'apple', count: 2 }] },
      { type: 'collect', items: [{ id: 'stone', count: 25 }], desc: 'Bring 25 Stone', reward: [{ id: 'miners_potion', count: 1 }, { id: 'bomb', count: 2 }] },
      { type: 'collect', items: [{ id: 'wool', count: 6 }], desc: 'Bring 6 Soft Wool', reward: [{ id: 'regeneration_potion', count: 1 }] }
    ]
  },
  // ---- Lore carriers ----------------------------------------------------
  // The reef progression (4 pearls -> 4 temple podiums -> Tide Gate -> Kraken)
  // and the space progression (Void Rift Beacon -> Ossuary Sovereign) both
  // need clues the player can actually find. Two dedicated talkers stand at
  // the spawn camp: the Old Sailor knows the sea, the Star Watcher knows the
  // sky. The Guide's greeting points at both.
  {
    id: 'sailor',
    name: 'Old Sailor',
    icon: '🎣',
    dx: -16,
    greeting: 'The reef? It drowned the whole west edge of the world. Dive it with craft — a Reef Diver Set and swim fins, or you get eight seconds of air. The Sacred Pearls are scattered across the world, and four podiums await inside the Tide Temple. Mind the pirates... and whatever sleeps beyond the gate.',
    chatter: [
      'Forty years I watched that coast. One winter the sea just kept coming and never went back.',
      'The temple builders left the gate for a reason. Nobody wrote down which reason.',
      'You breathe easy down there, do you? Good. The deep does not forgive the careless.'
    ],
    reactions: {
      kraken: 'Last predator, they called it. Every old salt knew that name and none of them laughed.',
      dragon: 'Beyond the gate there is a sky with a grave in it. And you came back. Sit down, have something to drink.',
      knight: 'Drowned bell for a drowned chapel. He was keeping an oath nobody left alive to release.'
    },
    quests: [
      { type: 'collect', items: [{ id: 'fish_clownfish', count: 3 }], desc: 'Bring 3 Reef Clownfish', reward: [{ id: 'healing_potion', count: 2 }] },
      { type: 'collect', items: [{ id: 'coral_fragment', count: 8 }], desc: 'Bring 8 Coral Fragments', reward: [{ id: 'swiftness_potion', count: 1 }, { id: 'apple', count: 2 }] },
      { type: 'collect', items: [{ id: 'sacred_pearl', count: 1 }], desc: 'Show a Sacred Pearl', reward: [{ id: 'life_crystal', count: 1 }] }
    ]
  },
  {
    id: 'starwatcher',
    name: 'Star Watcher',
    icon: '🔭',
    dx: 21,
    greeting: 'Count the stars at night and one of them is a door. Craft a Void Rift Beacon — demon souls, hellstone, crystal and gold — then right-click it under open sky. The sky tears, the Ossuary waits, and the Sovereign beyond remembers every wound you give it. Go armored.',
    chatter: [
      'I was a mapmaker once. I mapped my way out of every country I ever made a map of.',
      'The stars here do not sit where they should. Something heavy is leaning on the sky.',
      'You carry fire and iron and that is the whole reason the sky lets you in.'
    ],
    reactions: {
      kraken: 'A door in the deep, and you used it. There are other doors.',
      dragon: 'The Sovereign was a wound the world kept. It is closed now.',
      knight: 'The chapel bell stopped. I can hear the stars again.'
    },
    quests: [
      { type: 'collect', items: [{ id: 'crystal', count: 5 }], desc: 'Bring 5 Cave Crystals', reward: [{ id: 'mana_crystal', count: 1 }] },
      { type: 'kill', desc: 'Slay 8 monsters', target: 8, reward: [{ id: 'healing_potion', count: 2 }, { id: 'arrow', count: 20 }] }
    ]
  },
  {
    id: 'tidekeeper',
    name: 'Tidekeeper',
    icon: '🐚',
    reefPearlIndex: 0,
    greeting: 'I watch the reef from this shore. Bring me 8 Wood and I will share where a Sacred Pearl sleeps.',
    chatter: [
      'The tide keeps its own time. Learn it and the reef gives you everything.',
      'Pearls do not glow for everyone. It noticed you, apparently.'
    ],
    reactions: {
      kraken: 'The gate is open and the predator beyond it is gone. The reef can rest.',
      dragon: 'Whatever the pearls were for — this was further. Well done.',
      knight: 'The sea does not care for chapels. It does care for courage.'
    },
    quests: [
      { type: 'collect', items: [{ id: 'wood', count: 8 }], desc: 'Bring 8 Wood', reward: [{ id: 'healing_potion', count: 1 }] }
    ]
  },
  {
    id: 'frost_scout',
    name: 'Frost Scout',
    icon: '🧣',
    reefPearlIndex: 1,
    greeting: 'I tracked a blue glow beneath the snow. Bring me 4 Wool and I will mark the spot.',
    chatter: [
      'Snow keeps a record. Everything that crosses it leaves a line, and I read lines.',
      'Do not stand still in the pines. The cold likes a still target.'
    ],
    reactions: {
      kraken: 'You went under the ice-cold water and came back. I have tracked braver; not many.',
      dragon: 'The sky burned and you stood in it. Unbelievable. Write it down somewhere.',
      knight: 'Old stone under the snow. It remembers knights; the snow remembers everything else.'
    },
    quests: [
      { type: 'collect', items: [{ id: 'wool', count: 4 }], desc: 'Bring 4 Wool', reward: [{ id: 'torch', count: 16 }] }
    ]
  },
  {
    id: 'sun_seeker',
    name: 'Sun Seeker',
    icon: '🌞',
    reefPearlIndex: 2,
    greeting: 'A pearl glimmers somewhere in the warm grasslands. Prove your courage by slaying 3 monsters, and I will reveal its trail.',
    chatter: [
      'The grasslands are the friendliest ground in the world. That is why nothing dangerous ever leaves them.',
      'Run east until the wind smells of salt. That is where I grew up.'
    ],
    reactions: {
      kraken: 'Three monsters! You killed three — and then the sea itself. I like the way you count.',
      dragon: 'Everyone in the grasslands will hear about this. Everyone.',
      knight: 'You were not afraid of the dark. The dark noticed.'
    },
    quests: [
      { type: 'kill', desc: 'Slay 3 monsters', target: 3, reward: [{ id: 'healing_potion', count: 1 }] }
    ]
  },
  {
    id: 'marsh_warden',
    name: 'Marsh Warden',
    icon: '🪷',
    reefPearlIndex: 3,
    greeting: 'Something sacred is buried in the marsh. Bring me 12 Stone and I will tell you where.',
    chatter: [
      'The marsh keeps what it is given. It gave me a pearl and I have been grateful ever since.',
      'Walk the reeds slowly. Everything down there is patient, and so am I.'
    ],
    reactions: {
      kraken: 'The marsh felt that. The water went still for a whole minute. Respect.',
      dragon: 'You carry a light now. Even the reeds bow a little.',
      knight: 'The stone remembers the oath. Thank you for ending it.'
    },
    quests: [
      { type: 'collect', items: [{ id: 'stone', count: 12 }], desc: 'Bring 12 Stone', reward: [{ id: 'miners_potion', count: 1 }] }
    ]
  }
];

// Per-villager render palette + hat, so every face in the camp is distinct at a
// glance. The old sprite tinted one tunic by id and gave everyone the same
// blank head; this gives each role a robe, trousers, boots, hair and headgear.
const NPC_LOOK = {
  guide:        { robe: '#38b764', robeShade: '#166534', pants: '#334155', boot: '#1e293b', hair: '#7c2d12', accent: '#facc15', hat: 'cap' },
  prospector:   { robe: '#f59e0b', robeShade: '#92400e', pants: '#44403c', boot: '#292524', hair: '#1f2937', accent: '#fbbf24', hat: 'helmet' },
  scavenger:    { robe: '#a855f7', robeShade: '#6b21a8', pants: '#3f3f46', boot: '#27272a', hair: '#57534e', accent: '#e9d5ff', hat: 'hood' },
  sailor:       { robe: '#0ea5e9', robeShade: '#075985', pants: '#1e3a5f', boot: '#0f172a', hair: '#e5e7eb', accent: '#f8fafc', hat: 'sailor' },
  starwatcher:  { robe: '#6366f1', robeShade: '#3730a3', pants: '#312e81', boot: '#1e1b4b', hair: '#c7d2fe', accent: '#a5b4fc', hat: 'wizard' },
  tidekeeper:   { robe: '#14b8a6', robeShade: '#115e59', pants: '#134e4a', boot: '#042f2e', hair: '#3f3f46', accent: '#5eead4', hat: 'hood' },
  frost_scout:  { robe: '#60a5fa', robeShade: '#1e40af', pants: '#1e3a8a', boot: '#172554', hair: '#78350f', accent: '#bfdbfe', hat: 'beanie' },
  sun_seeker:   { robe: '#f97316', robeShade: '#9a3412', pants: '#7c2d12', boot: '#431407', hair: '#451a03', accent: '#fed7aa', hat: 'cap' },
  marsh_warden: { robe: '#84cc16', robeShade: '#3f6212', pants: '#365314', boot: '#1a2e05', hair: '#14532d', accent: '#d9f99d', hat: 'hood' }
};

class NPCManager {
  constructor(game) {
    this.game = game;
    const world = game.world;
    const cx = Math.floor(world.width / 2);
    this.npcs = NPC_DEFS.map(def => {
      const preferredX = Number.isInteger(def.reefPearlIndex)
        ? (def.reefPearlIndex === 0
          ? world.reefBounds.right + 6
          : world.reefPearls[def.reefPearlIndex].x)
        : cx + def.dx;
      const spot = this.findStandableSpot(preferredX);
      return {
        def,
        id: def.id,
        name: def.name,
        icon: def.icon,
        x: spot.x * TILE_SIZE + 3,
        y: (spot.sy - 2) * TILE_SIZE,
        width: 20,
        height: 48,
        questIndex: 0,
        state: 'offer',   // offer -> active -> ready -> (turn in) -> next quest
        progress: 0,
        clueUnlocked: false
      };
    });
    this.nearby = null;
    this.openNpc = null;
    this._checkTimer = 0;
    this._trackerSig = null;
    this.wireUI();
  }

  /**
   * The nearest column a villager can actually stand in.
   *
   * The old code read surfaceHeights[x] and dropped the villager straight onto
   * it, which put the Prospector inside the spawn cottage's right-hand wall -
   * the house spans spawnX +/- 6 and his offset was exactly +6, so he was
   * standing in solid timber for the whole game.
   *
   * Every candidate is now checked for solid ground underfoot and two clear
   * tiles of body (a villager is 48px = 2 tiles), and the search walks outward
   * from the preferred spot until it finds one. Falling back to a wider sweep
   * means a villager is never embedded in geometry, whatever the map does.
   */
  findStandableSpot(preferredX) {
    const world = this.game.world;
    const start = Math.max(6, Math.min(world.width - 7, Math.round(preferredX)));
    for (let d = 0; d < world.width; d++) {
      const candidates = d === 0 ? [start] : [start - d, start + d];
      for (const x of candidates) {
        if (x < 6 || x > world.width - 7) continue;
        const sy = world.surfaceHeights[x];
        // Footing, and two tiles of clear air for the body and head.
        if (!world.isSolid(x, sy)) continue;
        if (world.getTile(x, sy - 1) !== TILES.AIR) continue;
        if (world.getTile(x, sy - 2) !== TILES.AIR) continue;
        return { x, sy };
      }
    }
    // Last resort: keep them on the map even if nothing nearby qualifies.
    return { x: start, sy: world.surfaceHeights[start] };
  }

  quest(npc) {
    return npc.def.quests[npc.questIndex % npc.def.quests.length];
  }

  /** Yellow "!" ping on the minimap: a fresh offer or a finished quest. */
  isQuestHot(npc) {
    return npc.state === 'offer' || npc.state === 'ready';
  }

  wireUI() {
    const close = document.getElementById('npc-close');
    const bye = document.getElementById('npc-bye');
    const action = document.getElementById('npc-action');
    if (close) close.addEventListener('click', () => this.closeDialog());
    if (bye) bye.addEventListener('click', () => this.closeDialog());
    if (action) action.addEventListener('click', () => this.handleAction());
  }

  // ---------------------------------------------------------------- input
  handleTalkKey() {
    if (this.openNpc) { this.closeDialog(); return; }
    if (this.game.isModalOpen && this.game.isModalOpen()) return;
    if (this.game.paused || this.game.isDead) return;
    if (this.nearby) this.openDialog(this.nearby);
  }

  openDialog(npc) {
    this.openNpc = npc;
    const title = document.getElementById('npc-title');
    const portrait = document.getElementById('npc-portrait');
    if (title) title.textContent = `${npc.icon} ${npc.name.toUpperCase()}`;
    if (portrait) portrait.textContent = npc.icon;
    this.refreshDialog();
    document.getElementById('npc-modal')?.classList.remove('hidden');
  }

  closeDialog() {
    this.openNpc = null;
    document.getElementById('npc-modal')?.classList.add('hidden');
  }

  refreshDialog() {
    const npc = this.openNpc;
    const box = document.getElementById('npc-dialogue');
    const action = document.getElementById('npc-action');
    if (!npc || !box || !action) return;
    // Meeting a villager is itself a discoverable moment.
    this.game.villagersMet = this.game.villagersMet || {};
    if (!this.game.villagersMet[npc.id]) {
      this.game.villagersMet[npc.id] = true;
      this.game.logDiscovery(`meet_${npc.id}`, `🧭 Met ${npc.name}!`, 30);
    }
    const quest = this.quest(npc);
    let greeting = npc.def.greeting;
    if (npc.clueUnlocked && Number.isInteger(npc.def.reefPearlIndex)) {
      const pearl = this.game.world.reefPearls[npc.def.reefPearlIndex];
      greeting = `Favor done! The Sacred Pearl is at world tile X ${pearl.x}, Y ${pearl.y}. Look for its glow.`;
    }
    // A boss this villager has a reaction to, never yet said out loud: the
    // reaction replaces the greeting once, so a victory is a moment between
    // the player and the camp rather than a line they can miss.
    if (!npc.reacted) {
      const reactions = npc.def.reactions || {};
      const beaten = Object.keys(reactions)
        .filter(kind => this.game.isBossDefeated && this.game.isBossDefeated(kind));
      if (beaten.length) {
        greeting = reactions[beaten[0]];
        npc.reacted = true;
      }
    }
    // With no quest pending, they chat: idle colour instead of a signpost.
    const hasQuest = npc.state === 'offer' || npc.state === 'active' || npc.state === 'ready';
    if (!hasQuest && npc.def.chatter && npc.def.chatter.length) {
      const lines = npc.def.chatter;
      greeting = lines[(npc.chatterIndex = ((npc.chatterIndex || 0) + 1)) % lines.length];
    }
    let html = `<span class="q-name">${greeting}</span>`;

    if (npc.state === 'offer') {
      html += `<p>Quest: <strong>${quest.desc}</strong>.</p>`;
      html += this.rewardHTML(quest);
      action.textContent = 'ACCEPT QUEST';
      action.classList.remove('hidden');
    } else if (npc.state === 'active') {
      html += `<p>Quest in progress: <strong>${quest.desc}</strong></p>`;
      html += quest.type === 'kill'
        ? `<span class="q-progress">Kills: ${npc.progress} / ${quest.target}</span>`
        : `<span class="q-progress">${this.collectProgressText(quest)}</span>`;
      action.classList.add('hidden');
    } else if (npc.state === 'ready') {
      html += `<p>⭐ You did it! <strong>${quest.desc}</strong> — complete.</p>`;
      html += this.rewardHTML(quest);
      action.textContent = 'TURN IN';
      action.classList.remove('hidden');
    }
    box.innerHTML = html;
  }

  rewardHTML(quest) {
    const parts = quest.reward
      .map(r => `${ITEMS[r.id] ? ITEMS[r.id].icon : '📦'} ${ITEMS[r.id] ? ITEMS[r.id].name : r.id}${r.count > 1 ? ' x' + r.count : ''}`)
      .join(', ');
    return `<span class="q-reward">Reward: ${parts}</span>`;
  }

  collectProgressText(quest) {
    return quest.items
      .map(it => `${ITEMS[it.id] ? ITEMS[it.id].icon : ''} ${Math.min(this.game.countItem(it.id), it.count)}/${it.count}`)
      .join(' · ');
  }

  // -------------------------------------------------------------- actions
  handleAction() {
    const npc = this.openNpc;
    if (!npc) return;
    const quest = this.quest(npc);

    if (npc.state === 'offer') {
      npc.state = 'active';
      npc.progress = 0;
      this.game.showToast(`📜 Quest accepted: ${quest.desc}`);
      this.refreshDialog();
      this.renderTracker(true);
      return;
    }

    if (npc.state === 'ready') {
      // Make sure the reward fits before anything is handed over.
      const fits = quest.reward.every(r => this.game.canAddItem(r.id, r.count));
      if (!fits) {
        this.game.showToast('🎒 Not enough bag space for the reward.');
        return;
      }
      // Collect quests hand the goods over; kill quests just pay out.
      if (quest.type === 'collect') {
        for (const it of quest.items) this.game.removeItem(it.id, it.count);
      }
      for (const r of quest.reward) {
        if (!this.game.addItem(r.id, r.count) && typeof DropItem !== 'undefined') {
          this.game.drops.push(new DropItem(this.game.player.x, this.game.player.y, r.id, r.count));
        }
      }
      this.game.sound.playCraft();
      this.game.particles.magicSparkle(
        this.game.player.x + this.game.player.width / 2,
        this.game.player.y + this.game.player.height / 2,
        '#fde047', 24
      );
      this.game.showAnnouncement(`⭐ QUEST COMPLETE — thanks, ${npc.name}!`);

      // Journal bookkeeping (see Game.logDiscovery).
      this.game.questsDone = (this.game.questsDone || 0) + 1;
      this.game.logDiscovery(`quest_${npc.id}`, `⭐ Helped ${npc.name} for the first time!`, 80);
      if (Number.isInteger(npc.def.reefPearlIndex)) npc.clueUnlocked = true;

      // Advance to the next quest in this villager's rotation.
      npc.questIndex = (npc.questIndex + 1) % npc.def.quests.length;
      npc.state = 'offer';
      npc.progress = 0;
      this.refreshDialog();
      this.renderTracker(true);
    }
  }

  // ------------------------------------------------------------- progress
  onKill() {
    for (const npc of this.npcs) {
      if (npc.state !== 'active') continue;
      const quest = this.quest(npc);
      if (quest.type !== 'kill') continue;
      npc.progress += 1;
      if (npc.progress >= quest.target) {
        npc.state = 'ready';
        this.game.showAnnouncement(`⭐ Quest ready — talk to the ${npc.name}!`);
      }
    }
  }

  update(dt) {
    // ---- GROUND SNAPPING: the flying-NPC fix ----------------------------
    // Villagers were placed once and then never touched by physics again, so
    // any change to the world under them (a mined block, a regenerated
    // dimension, a save loaded into a differently-shaped world) left them
    // hovering in mid-air permanently. Each tick, find the real ground below
    // each NPC and ease them onto it. Easing (not teleporting) keeps the fix
    // invisible for the 99% of frames where an NPC is already standing right.
    const world = this.game.world;
    if (world && world.surfaceHeights) {
      for (const npc of this.npcs) {
        if (!npc || !npc.width) continue;
        const tx = Math.floor((npc.x + npc.width / 2) / TILE_SIZE);
        if (tx < 0 || tx >= world.surfaceHeights.length) continue;
        const sy = world.surfaceHeights[tx];
        // surfaceHeights only points at the TOP of the terrain — on a world with
        // open water (ocean/abyssal) it is the seabed, far below the island the
        // NPC actually stands on, and on underground caverns it can be a ceiling
        // tile above them. Scan for the real solid footing under the NPC before
        // easing anywhere.
        const tile = world.getTile ? world.getTile(tx, sy) : null;
        let groundY = sy * TILE_SIZE;
        if (tile && world.isSolid(tx, sy)) {
          // Solid at surfaceHeights: fine, that is the ground line.
        } else {
          // Not solid there — look for the first solid tile from below the feet
          // upward (e.g. NPC placed on an island, seabed is far underneath).
          const feetTile = Math.floor((npc.y + npc.height) / TILE_SIZE);
          let found = -1;
          for (let y = Math.min(world.height - 1, feetTile + 1); y >= 1; y--) {
            if (world.isSolid(tx, y)) { found = y; break; }
          }
          if (found >= 0) groundY = found * TILE_SIZE;
        }
        const feet = npc.y + npc.height;
        const off = feet - groundY;
        if (Math.abs(off) > 2) {
          const step = Math.min(6, Math.abs(off));
          npc.y += off > 0 ? -step : step;
          if (npc.vy !== undefined) npc.vy = 0;
        }
      }
    }

    // Nearest-villager prompt.
    const pcx = this.game.player.x + this.game.player.width / 2;
    const pcy = this.game.player.y + this.game.player.height / 2;
    let best = null;
    let bestDist = 80;
    for (const npc of this.npcs) {
      const d = Math.hypot(pcx - (npc.x + npc.width / 2), pcy - (npc.y + npc.height / 2));
      if (d < bestDist) { bestDist = d; best = npc; }
    }
    this.nearby = best;

    const prompt = document.getElementById('npc-prompt');
    if (prompt) {
      const modalOpen = this.game.isModalOpen && this.game.isModalOpen();
      const show = !!best && !this.openNpc && !this.game.paused && !this.game.isDead && !modalOpen;
      if (show) {
        prompt.innerHTML = `Press <kbd>T</kbd> to talk to <b>${best.name}</b>`;
        prompt.classList.remove('hidden');
      } else {
        prompt.classList.add('hidden');
      }
    }

    // Collect quests flip to "ready" once you own the goods.
    this._checkTimer -= dt;
    if (this._checkTimer <= 0) {
      this._checkTimer = 0.4;
      for (const npc of this.npcs) {
        if (npc.state !== 'active') continue;
        const quest = this.quest(npc);
        if (quest.type !== 'collect') continue;
        if (quest.items.every(it => this.game.countItem(it.id) >= it.count)) {
          npc.state = 'ready';
          this.game.showAnnouncement(`⭐ Quest ready — talk to the ${npc.name}!`);
          if (this.openNpc === npc) this.refreshDialog();
        }
      }
    }

    this.renderTracker();
  }

  renderTracker(force = false) {
    const el = document.getElementById('quest-tracker');
    if (!el) return;
    const rows = [];
    for (const npc of this.npcs) {
      if (npc.state === 'offer') continue;
      const quest = this.quest(npc);
      if (npc.state === 'ready') {
        rows.push(`<div class="qt-row"><span>${npc.name}: ${quest.desc}</span><span class="qt-ready">TURN IN!</span></div>`);
      } else {
        const prog = quest.type === 'kill'
          ? `${npc.progress}/${quest.target}`
          : this.collectProgressText(quest);
        rows.push(`<div class="qt-row"><span>${npc.name}: ${quest.desc}</span><strong>${prog}</strong></div>`);
      }
    }
    const sig = rows.join('|');
    if (!force && sig === this._trackerSig) return;
    this._trackerSig = sig;
    if (!rows.length) {
      el.classList.add('hidden');
      return;
    }
    el.innerHTML = `<span class="qt-title">📜 QUESTS</span>${rows.join('')}`;
    el.classList.remove('hidden');
  }

  // ---------------------------------------------------------------- render
  render(ctx, camera) {
    const t = Date.now() * 0.002;
    for (const npc of this.npcs) {
      const sx = Math.round(npc.x - camera.x);
      const sy = Math.round(npc.y - camera.y);
      if (sx < -60 || sy < -80 || sx > camera.viewportWidth + 60 || sy > camera.viewportHeight + 60) continue;

      // GROUND ANCHOR. npc.y + npc.height is exactly the top of the solid tile
      // the villager stands on (see findStandableSpot), so this is the ground
      // line in screen space. The boots and their contact shadow are pinned to
      // it — only the head/hat/icon bob — so a villager can NEVER read as
      // floating no matter what the terrain under them later does.
      const groundY = sy + npc.height;
      const bob = Math.sin(t + npc.x * 0.08);   // -1..1, sub-pixel, upper body only
      const by = sy - Math.round(bob);          // bobbing reference for head/torso

      // Per-villager palette + hat, so every face in the camp is distinct.
      const look = NPC_LOOK[npc.id] || NPC_LOOK.guide;
      const skin = '#fcd9b8';
      const skinShade = '#eec39a';

      ctx.save();

      // ---- Contact shadow: the single thing that grounds the sprite ----
      // Sits exactly on the ground line, widest under the feet.
      ctx.globalAlpha = 0.34;
      ctx.fillStyle = '#000000';
      ctx.beginPath();
      ctx.ellipse(sx + 10, groundY - 1, 10, 3.2, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;

      // ---- Legs + boots, pinned so the boot soles rest ON the ground line ----
      ctx.fillStyle = look.pants;
      ctx.fillRect(sx + 5, groundY - 16, 4, 11);
      ctx.fillRect(sx + 11, groundY - 16, 4, 11);
      ctx.fillStyle = look.boot;
      ctx.fillRect(sx + 4, groundY - 6, 6, 6);
      ctx.fillRect(sx + 10, groundY - 6, 6, 6);

      // ---- Robe / tunic: shoulders, body, belt (bobs with the upper body) ----
      ctx.fillStyle = look.robe;
      ctx.fillRect(sx + 3, by + 17, 14, 17);   // torso
      ctx.fillRect(sx + 2, by + 15, 16, 4);    // shoulders
      ctx.fillStyle = look.robeShade;
      ctx.fillRect(sx + 3, by + 17, 3, 17);    // left shading for volume
      ctx.fillStyle = look.accent;
      ctx.fillRect(sx + 3, by + 29, 14, 3);    // belt
      ctx.fillStyle = '#facc15';
      ctx.fillRect(sx + 9, by + 29, 2, 3);     // buckle

      // ---- Arms + hands ----
      ctx.fillStyle = look.robe;
      ctx.fillRect(sx + 1, by + 18, 3, 11);
      ctx.fillRect(sx + 16, by + 18, 3, 11);
      ctx.fillStyle = skin;
      ctx.fillRect(sx + 1, by + 28, 3, 3);
      ctx.fillRect(sx + 16, by + 28, 3, 3);

      // ---- Head ----
      ctx.fillStyle = skin;
      ctx.fillRect(sx + 5, by + 6, 10, 10);
      ctx.fillStyle = skinShade;
      ctx.fillRect(sx + 5, by + 13, 10, 3);    // jaw shadow
      // Hair
      ctx.fillStyle = look.hair;
      ctx.fillRect(sx + 4, by + 4, 12, 4);
      ctx.fillRect(sx + 4, by + 5, 2, 5);
      ctx.fillRect(sx + 14, by + 5, 2, 5);
      // Eyes (blink occasionally by narrowing to 1px)
      const blink = (Math.sin(t * 0.7 + npc.x) > 0.97) ? 1 : 2;
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(sx + 7, by + 10, 2, blink);
      ctx.fillRect(sx + 11, by + 10, 2, blink);
      // A friendly mouth
      ctx.fillStyle = '#b98a6a';
      ctx.fillRect(sx + 9, by + 13, 2, 1);

      // ---- Hat / accessory, drawn by role ----
      ctx.fillStyle = look.accent;
      switch (look.hat) {
        case 'helmet':
          ctx.fillStyle = '#94a3b8';
          ctx.fillRect(sx + 4, by + 2, 12, 5);
          ctx.fillStyle = '#fde047';
          ctx.fillRect(sx + 9, by + 4, 3, 3);
          break;
        case 'sailor':
          ctx.fillStyle = '#f8fafc';
          ctx.fillRect(sx + 1, by + 4, 18, 2);   // wide brim
          ctx.fillRect(sx + 6, by + 1, 8, 4);    // crown
          break;
        case 'wizard':
          ctx.fillStyle = look.robe;
          ctx.beginPath();
          ctx.moveTo(sx + 10, by - 3);
          ctx.lineTo(sx + 5, by + 5);
          ctx.lineTo(sx + 15, by + 5);
          ctx.closePath();
          ctx.fill();
          ctx.fillStyle = look.accent;
          ctx.fillRect(sx + 3, by + 4, 14, 2);   // hat band
          break;
        case 'beanie':
          ctx.fillStyle = look.accent;
          ctx.fillRect(sx + 4, by + 2, 12, 4);
          ctx.fillRect(sx + 9, by, 2, 2);        // pom
          break;
        case 'hood':
          ctx.fillStyle = look.robeShade;
          ctx.fillRect(sx + 3, by + 1, 14, 9);
          ctx.fillStyle = skinShade;
          ctx.fillRect(sx + 6, by + 5, 8, 7);    // face opening
          ctx.fillStyle = '#0f172a';
          ctx.fillRect(sx + 7, by + 8, 2, blink);
          ctx.fillRect(sx + 11, by + 8, 2, blink);
          break;
        default: // cap
          ctx.fillStyle = look.accent;
          ctx.fillRect(sx + 3, by + 2, 14, 3);
          ctx.fillRect(sx + 2, by + 4, 6, 2);    // brim
      }

      // ---- Portrait icon: a small badge hovering just over the hat ----
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.font = "12px 'Segoe UI Emoji','Apple Color Emoji','Noto Color Emoji',sans-serif";
      ctx.fillText(npc.icon, sx + 10, by - 7);

      // ---- Quest state marker above the icon ----
      if (npc.state === 'active') {
        ctx.font = "9px 'Press Start 2P', monospace";
        ctx.fillStyle = '#94a3b8';
        ctx.fillText('...', sx + 10, by - 20);
      } else if (this.isQuestHot(npc)) {
        ctx.font = "bold 12px 'Press Start 2P', monospace";
        ctx.fillStyle = 'rgba(2, 6, 23, 0.9)';
        ctx.fillText('!', sx + 11, by - 19);
        ctx.fillStyle = npc.state === 'ready' ? '#fde047' : '#facc15';
        ctx.fillText('!', sx + 10, by - 20);
      }
      ctx.restore();
    }
  }

  // ----------------------------------------------------------------- save
  toSave() {
    const out = {};
    for (const npc of this.npcs) {
      out[npc.id] = {
        qi: npc.questIndex,
        st: npc.state,
        pr: npc.progress,
        cl: npc.clueUnlocked
      };
    }
    return out;
  }

  fromSave(saved) {
    if (!saved || typeof saved !== 'object') return;
    for (const npc of this.npcs) {
      const s = saved[npc.id];
      if (!s) continue;
      if (Number.isFinite(s.qi)) npc.questIndex = Math.max(0, s.qi) % npc.def.quests.length;
      if (s.st === 'offer' || s.st === 'active' || s.st === 'ready') npc.state = s.st;
      if (Number.isFinite(s.pr)) npc.progress = Math.max(0, s.pr);
      npc.clueUnlocked = s.cl === true;
    }
    this._trackerSig = null;
    this.renderTracker(true);
  }
}

if (typeof window !== 'undefined') {
  window.NPCManager = NPCManager;
  window.NPC_DEFS = NPC_DEFS;
}
