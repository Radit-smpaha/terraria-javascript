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
    greeting: 'Welcome, traveller! The forest bites back at night — let me toughen you up.',
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
    quests: [
      { type: 'collect', items: [{ id: 'wood', count: 20 }], desc: 'Bring 20 Wood', reward: [{ id: 'campfire', count: 1 }, { id: 'apple', count: 2 }] },
      { type: 'collect', items: [{ id: 'stone', count: 25 }], desc: 'Bring 25 Stone', reward: [{ id: 'miners_potion', count: 1 }, { id: 'bomb', count: 2 }] },
      { type: 'collect', items: [{ id: 'wool', count: 6 }], desc: 'Bring 6 Soft Wool', reward: [{ id: 'regeneration_potion', count: 1 }] }
    ]
  }
];

class NPCManager {
  constructor(game) {
    this.game = game;
    const world = game.world;
    const cx = Math.floor(world.width / 2);
    this.npcs = NPC_DEFS.map(def => {
      const spot = this.findStandableSpot(cx + def.dx);
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
        progress: 0
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
    for (let d = 0; d < 30; d++) {
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
    let html = `<span class="q-name">${npc.def.greeting}</span>`;

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
    for (const npc of this.npcs) {
      const sx = Math.round(npc.x - camera.x);
      const sy = Math.round(npc.y - camera.y);
      if (sx < -60 || sy < -60 || sx > camera.viewportWidth + 60 || sy > camera.viewportHeight + 60) continue;

      ctx.save();
      // Simple pixel villager: head, tunic, legs.
      ctx.fillStyle = '#fcd9b8';
      ctx.fillRect(sx + 4, sy + 2, 12, 10);
      ctx.fillStyle = npc.id === 'guide' ? '#38b764' : npc.id === 'prospector' ? '#f59e0b' : '#a855f7';
      ctx.fillRect(sx + 2, sy + 12, 16, 20);
      ctx.fillStyle = '#334155';
      ctx.fillRect(sx + 4, sy + 32, 5, 14);
      ctx.fillRect(sx + 11, sy + 32, 5, 14);
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(sx + 12, sy + 5, 2, 2);

      // Portrait icon floating above the head.
      ctx.textAlign = 'center';
      ctx.textBaseline = 'bottom';
      ctx.font = "13px 'Segoe UI Emoji','Apple Color Emoji','Noto Color Emoji',sans-serif";
      ctx.fillText(npc.icon, sx + 10, sy - 4);

      // Quest state marker above the icon.
      if (npc.state === 'active') {
        ctx.font = "9px 'Press Start 2P', monospace";
        ctx.fillStyle = '#94a3b8';
        ctx.fillText('...', sx + 10, sy - 22);
      } else if (this.isQuestHot(npc)) {
        ctx.font = "bold 12px 'Press Start 2P', monospace";
        ctx.fillStyle = 'rgba(2, 6, 23, 0.9)';
        ctx.fillText('!', sx + 11, sy - 21);
        ctx.fillStyle = npc.state === 'ready' ? '#fde047' : '#facc15';
        ctx.fillText('!', sx + 10, sy - 22);
      }
      ctx.restore();
    }
  }

  // ----------------------------------------------------------------- save
  toSave() {
    const out = {};
    for (const npc of this.npcs) {
      out[npc.id] = { qi: npc.questIndex, st: npc.state, pr: npc.progress };
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
    }
    this._trackerSig = null;
    this.renderTracker(true);
  }
}

if (typeof window !== 'undefined') {
  window.NPCManager = NPCManager;
  window.NPC_DEFS = NPC_DEFS;
}
