// Terracraft "juice" layer: game feel (screen shake, hit-stop, slow-mo, hurt vignette),
// timed buffs, the fog-of-war minimap, and shared UI helpers.
// Loaded after world.js (needs TILE_PROPERTIES for map colours) and before terraria.js.

// ============================================================
// GAME FEEL — trauma screen shake, hit-stop, dramatic slow motion
// ============================================================
class GameFeel {
  constructor() {
    this.trauma = 0;        // 0..1.2, decays; shake strength = trauma^2
    this.shakeX = 0;
    this.shakeY = 0;
    this.shakeRot = 0;
    this.hitStop = 0;       // seconds of near-freeze (impact frames)
    this.hitStopScale = 0.06;
    this.slowMo = 0;        // seconds of dramatic slow motion
    this.slowMoScale = 0.35;
    this.hurtFlash = 0;     // 0..1 red screen pulse
    this.healFlash = 0;     // 0..1 green screen pulse
    this.time = 0;
    this.maxShake = 20;     // pixels of shake at full trauma
    this._flashR = 239;
    this._flashG = 68;
    this._flashB = 68;
  }

  /** Add screen shake. Small hits ~0.12, explosions ~0.6, boss slam ~0.9. */
  shake(amount) {
    this.trauma = Math.min(1.2, this.trauma + amount);
  }

  /** Freeze the world for a few frames. Strong hits ~0.06s, crits ~0.09s. */
  stop(seconds, scale = 0.06) {
    if (seconds <= this.hitStop) return;
    this.hitStop = seconds;
    this.hitStopScale = scale;
  }

  /** Bullet-time, used for boss phase transitions and near-death moments. */
  slow(seconds, scale = 0.35) {
    if (seconds <= this.slowMo) return;
    this.slowMo = seconds;
    this.slowMoScale = scale;
  }

  hurt(strength = 0.55) {
    this.hurtFlash = Math.min(1, this.hurtFlash + strength);
    this._flashR = 239; this._flashG = 68; this._flashB = 68;
  }

  heal(strength = 0.4) {
    this.healFlash = Math.min(1, this.healFlash + strength);
    this._flashR = 74; this._flashG = 222; this._flashB = 128;
  }

  /** dt multiplier the game loop should use for simulation. */
  get timeScale() {
    if (this.hitStop > 0) return this.hitStopScale;
    if (this.slowMo > 0) return this.slowMoScale;
    return 1;
  }

  /** True while the world is being deliberately held still. */
  get frozen() {
    return this.hitStop > 0;
  }

  update(dt) {
    this.time += dt;
    if (this.hitStop > 0) this.hitStop = Math.max(0, this.hitStop - dt);
    if (this.slowMo > 0) this.slowMo = Math.max(0, this.slowMo - dt);

    // Trauma decays linearly; intensity is quadratic so small knocks stay subtle.
    this.trauma = Math.max(0, this.trauma - dt * 1.7);
    const intensity = this.trauma * this.trauma;
    if (intensity > 0.00005) {
      const t = this.time;
      this.shakeX = (this._noise(t * 41.7) * 2 - 1) * this.maxShake * intensity;
      this.shakeY = (this._noise(t * 33.1 + 11.2) * 2 - 1) * (this.maxShake * 0.75) * intensity;
      this.shakeRot = (this._noise(t * 19.3 + 5.5) * 2 - 1) * 0.015 * intensity;
    } else {
      this.shakeX = 0; this.shakeY = 0; this.shakeRot = 0;
    }

    this.hurtFlash = Math.max(0, this.hurtFlash - dt * 1.5);
    this.healFlash = Math.max(0, this.healFlash - dt * 1.9);
  }

  /** Camera shake offset for this frame; Game.render() consumes it once per frame. */
  offset() {
    return { x: this.shakeX, y: this.shakeY };
  }

  /** Wipe transient effects (respawn, world load). */
  reset() {
    this.trauma = 0;
    this.hitStop = 0;
    this.slowMo = 0;
    this.hurtFlash = 0;
    this.healFlash = 0;
    this.shakeX = 0; this.shakeY = 0; this.shakeRot = 0;
  }

  /** Cheap deterministic 1D value noise in [0,1). */
  _noise(x) {
    const s = Math.sin(x) * 43758.5453;
    return s - Math.floor(s);
  }

  /** Update the DOM overlays that sell the hits without touching the canvas. */
  renderOverlay(doc) {
    if (!doc) return;
    const red = doc.getElementById('hurt-vignette');
    if (red) red.style.opacity = this.hurtFlash > 0.01 ? (this.hurtFlash * 0.9).toFixed(3) : '0';
    const green = doc.getElementById('heal-vignette');
    if (green) green.style.opacity = this.healFlash > 0.01 ? (this.healFlash * 0.65).toFixed(3) : '0';
  }

  /** CSS colour string for the current flash tint. */
  get flashColor() {
    return `rgba(${this._flashR},${this._flashG},${this._flashB},1)`;
  }
}


// ============================================================
// BUFFS & DEBUFFS — timed modifiers shown in the HUD buff bar
// ============================================================
const BUFF_DEFS = {
  well_fed: {
    name: 'Well Fed', icon: '🍗', color: '#f59e0b', good: true,
    modifiers: { speed: 1.08, damage: 1.05, defense: 2, regenHp: 0.8 }
  },
  campfire: {
    name: 'Cozy Fire', icon: '🔥', color: '#fb923c', good: true,
    modifiers: { regenHp: 1.6, regenMana: 1.2 }
  },
  swiftness: {
    name: 'Swiftness', icon: '🏃', color: '#38bdf8', good: true,
    modifiers: { speed: 1.25 }
  },
  ironskin: {
    name: 'Ironskin', icon: '🛡️', color: '#94a3b8', good: true,
    modifiers: { defense: 8 }
  },
  wrath: {
    name: 'Wrath', icon: '😤', color: '#ef4444', good: true,
    modifiers: { damage: 1.15, crit: 0.08 }
  },
  regeneration: {
    name: 'Regeneration', icon: '💚', color: '#4ade80', good: true,
    modifiers: { regenHp: 1.5 }
  },
  miners_focus: {
    name: "Miner's Focus", icon: '⛏️', color: '#fbbf24', good: true,
    modifiers: { mining: 2.0 }
  },
  potion_sickness: {
    name: 'Potion Sickness', icon: '💊', color: '#a855f7', good: false,
    modifiers: {}
  }
};

class BuffSystem {
  constructor() {
    /** @type {Map<string, number>} buff id -> seconds remaining */
    this.active = new Map();
    this._hudSignature = '';
  }

  /** Add or refresh a buff. Returns true when it was newly applied. */
  add(id, seconds) {
    if (!BUFF_DEFS[id]) return false;
    const isNew = !this.active.has(id);
    const current = this.active.get(id) || 0;
    // Refreshing never shortens an existing buff.
    this.active.set(id, Math.max(current, seconds));
    return isNew;
  }

  has(id) {
    return this.active.has(id);
  }

  timeLeft(id) {
    return this.active.get(id) || 0;
  }

  remove(id) {
    this.active.delete(id);
  }

  clear() {
    this.active.clear();
  }

  update(dt) {
    for (const [id, left] of [...this.active]) {
      const next = left - dt;
      if (next <= 0) this.active.delete(id);
      else this.active.set(id, next);
    }
  }

  /** Multiplicative modifiers stacked from every active buff (1 = no change). */
  multiplier(key) {
    let out = 1;
    for (const id of this.active.keys()) {
      const m = BUFF_DEFS[id] && BUFF_DEFS[id].modifiers;
      if (m && typeof m[key] === 'number') out *= m[key];
    }
    return out;
  }

  /** Additive modifiers stacked from every active buff (0 = no change). */
  bonus(key) {
    let out = 0;
    for (const id of this.active.keys()) {
      const m = BUFF_DEFS[id] && BUFF_DEFS[id].modifiers;
      if (m && typeof m[key] === 'number') out += m[key];
    }
    return out;
  }

  /** Buffs sorted for a stable HUD order. */
  list() {
    const order = Object.keys(BUFF_DEFS);
    return [...this.active.entries()]
      .sort((a, b) => order.indexOf(a[0]) - order.indexOf(b[0]))
      .map(([id, time]) => ({ id, time, def: BUFF_DEFS[id] }));
  }

  toSave() {
    const out = {};
    for (const [id, time] of this.active) out[id] = Math.round(time * 10) / 10;
    return out;
  }

  fromSave(saved) {
    this.clear();
    if (!saved || typeof saved !== 'object') return;
    for (const [id, time] of Object.entries(saved)) {
      if (BUFF_DEFS[id] && Number.isFinite(time) && time > 0) {
        this.active.set(id, Math.min(time, 3600));
      }
    }
  }

  /** Push the buff bar contents into the DOM (only rebuilds when the set changes). */
  renderHUD(doc) {
    const bar = doc && doc.getElementById('buff-bar');
    if (!bar) return;
    const list = this.list();
    const signature = list.map(b => `${b.id}:${Math.ceil(b.time)}`).join('|');
    if (signature === this._hudSignature) return;
    this._hudSignature = signature;
    bar.innerHTML = '';
    for (const buff of list) {
      const el = doc.createElement('div');
      el.className = 'buff-chip' + (buff.def.good ? '' : ' debuff');
      el.style.borderColor = buff.def.color;
      el.title = `${buff.def.name} — ${Math.ceil(buff.time)}s`;
      const icon = doc.createElement('span');
      icon.className = 'buff-icon';
      icon.textContent = buff.def.icon;
      const time = doc.createElement('span');
      time.className = 'buff-time';
      time.textContent = buff.time >= 60
        ? `${Math.floor(buff.time / 60)}m`
        : `${Math.ceil(buff.time)}s`;
      el.appendChild(icon);
      el.appendChild(time);
      bar.appendChild(el);
    }
  }
}

// ============================================================
// MINIMAP — 1px-per-tile cached map, fog of war and live markers
// ============================================================
class Minimap {
  constructor(world) {
    this.world = world;
    this.sizes = [0, 132, 178, 240];   // 0 = hidden, M cycles through these
    this.mode = 1;
    this.visibleTiles = 46;            // how many tiles across the map window shows
    this.canvas = document.getElementById('minimap');
    this.ctx = this.canvas && this.canvas.getContext ? this.canvas.getContext('2d') : null;
    this.label = document.getElementById('minimap-label');

    this.mapCanvas = document.createElement('canvas');
    this.mapCanvas.width = world.width;
    this.mapCanvas.height = world.height;
    this.mapCtx = this.mapCanvas.getContext ? this.mapCanvas.getContext('2d') : null;

    this.imageData = this._makeImageData();
    this.colorTable = this._buildColorTable();
    this.explored = new Uint8Array(world.width * world.height);
    this.pois = [];
    this.poisDirty = true;
    this.revealTimer = 0;
    this.rebuildTimer = 0;
    this.pulse = 0;
    this.lastSize = 0;
    this.boundaryFlash = 0;
    // PERF: rebuilding the 440x175 map image (77,000 pixels) rewrote ~2MB of
    // ImageData, because every sky pixel in a column was recoloured at once.
    // The sky is now written once per column, so only the terrain rows are
    // touched each rebuild — and the rebuild only happens while the map is
    // actually on screen (M hides it).
    this._skyRows = null;
    this._touchRows = null;
    // Flips true once the map texture has been filled in at least once.
    this.mapReady = false;
    this.applyVisibility();
  }

  _makeImageData() {
    if (!this.mapCtx) return null;
    try {
      const img = this.mapCtx.createImageData(this.world.width, this.world.height);
      if (img && img.data && img.data.length === this.world.width * this.world.height * 4) return img;
    } catch (error) {
      console.warn('Terracraft minimap: ImageData unavailable', error);
    }
    return null;
  }

  /** tile id -> [r,g,b] lookup built from TILE_PROPERTIES colours. */
  _buildColorTable() {
    const table = new Uint8Array(256 * 3);
    for (let id = 0; id < 256; id++) {
      const prop = typeof TILE_PROPERTIES !== 'undefined' ? TILE_PROPERTIES[id] : null;
      const rgb = this._hexToRgb(prop && prop.color ? prop.color : '#64748b');
      table[id * 3] = rgb[0];
      table[id * 3 + 1] = rgb[1];
      table[id * 3 + 2] = rgb[2];
    }
    return table;
  }

  _hexToRgb(hex) {
    let h = String(hex).replace('#', '');
    if (h.length === 3) h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2];
    const num = parseInt(h, 16);
    if (!Number.isFinite(num)) return [100, 116, 139];
    return [(num >> 16) & 255, (num >> 8) & 255, num & 255];
  }

  get visible() {
    return this.sizes[this.mode] > 0;
  }

  /** M key: cycle hidden -> small -> medium -> large. */
  cycle() {
    this.mode = (this.mode + 1) % this.sizes.length;
    this.applyVisibility();
    return this.sizes[this.mode];
  }

  applyVisibility() {
    if (this.canvas && this.canvas.classList) {
      if (this.visible) this.canvas.classList.remove('hidden');
      else this.canvas.classList.add('hidden');
    }
    const wrap = document.getElementById('minimap-panel');
    if (wrap && wrap.classList) {
      if (this.visible) wrap.classList.remove('hidden');
      else wrap.classList.add('hidden');
    }
  }

  markDirty() {
    // Mining or placing a tile can change a column's terrain profile, so the
    // cached sky/touch rows are thrown away along with the pixels.
    this._touchRows = null;
    this.rebuildTimer = 0;
    this.poisDirty = true;
  }

  /** Reveal a circular patch of the map around a world position. */
  reveal(worldX, worldY, radiusTiles = 24) {
    const cx = Math.floor(worldX / TILE_SIZE);
    const cy = Math.floor(worldY / TILE_SIZE);
    const r = radiusTiles;
    const w = this.world.width;
    const h = this.world.height;
    const r2 = r * r;
    let changed = 0;
    for (let y = Math.max(0, cy - r); y <= Math.min(h - 1, cy + r); y++) {
      const dy = y - cy;
      const span = Math.floor(Math.sqrt(Math.max(0, r2 - dy * dy)));
      const x0 = Math.max(0, cx - span);
      const x1 = Math.min(w - 1, cx + span);
      const row = y * w;
      for (let x = x0; x <= x1; x++) {
        if (!this.explored[row + x]) { this.explored[row + x] = 1; changed++; }
      }
    }
    // Also map straight up to the sky so you always see the surface band.
    const skyX = Math.max(0, Math.min(w - 1, cx));
    for (let y = Math.max(0, cy - r * 2); y < cy; y++) {
      for (let x = Math.max(0, skyX - 6); x <= Math.min(w - 1, skyX + 6); x++) {
        if (!this.explored[y * w + x]) { this.explored[y * w + x] = 1; changed++; }
      }
    }
    // Only rebuild the map texture when exploration actually advanced —
    // rebuilding every tick is what used to make the minimap shimmer.
    if (changed) this.markDirty();
    return changed;
  }

  update(dt, game) {
    this.pulse += dt;
    this.boundaryFlash = Math.max(0, this.boundaryFlash - dt);
    if (this.rebuildTimer > 0) this.rebuildTimer -= dt;

    // Keep revealing around the player (cheap, throttled).
    this.revealTimer -= dt;
    if (this.revealTimer <= 0 && game && game.player) {
      this.revealTimer = 0.35;
      this.reveal(game.player.x + game.player.width / 2, game.player.y + game.player.height / 2, 24);
    }
    // PERF: bail out while the map is hidden. `reveal()` keeps the fog mask up
    // to date either way, so unhiding just triggers one clean rebuild instead of
    // us paying for a hidden texture 60 times a second.
    //
    // IMPORTANT: this must NOT drop the pending rebuild on the floor. The map
    // texture is a full-world canvas that starts out blank, and render() blits
    // it unconditionally — so skipping the first rebuild after unhiding used to
    // show an empty blue square with only the markers drawn on top ("the minimap
    // has some stuff that dosen't load"). The rebuild stays flagged until it
    // actually happens.
    if (!this.visible) {
      this.rebuildTimer = 0;
      return;
    }
    if (this.poisDirty && this.rebuildTimer <= 0) this.rebuild();
  }

  /** Rewrite the 1px-per-tile map image. Runs at most twice a second. */
  rebuild() {
    this.rebuildTimer = 0.5;
    if (!this.mapCtx) return;
    // If ImageData could not be allocated (blocked canvas, memory pressure),
    // there is no terrain texture to build. Mark it ready anyway so render()
    // draws the normal map chrome around a blank field rather than leaving the
    // player staring at an empty rectangle with no explanation — and so the
    // pending-rebuild flag cannot spin forever.
    if (!this.imageData) {
      this.pois = [];
      this.poisDirty = false;
      this.mapReady = true;
      return;
    }
    const w = this.world.width;
    const h = this.world.height;
    const tiles = this.world.tiles;
    const data = this.imageData.data;
    const table = this.colorTable;
    const explored = this.explored;
    const surface = this.world.surfaceHeights;
    const pois = [];

    // Sky columns and touch rows depend only on the terrain, so derive them
    // once (and again after any edit). Rows above the highest surface are the
    // only ones the clear fast-path above is allowed to touch.
    if (!this._touchRows || this._touchRows.length !== w) {
      this._touchRows = new Int32Array(w);
      this._skyRows = new Int32Array(w);
      for (let x = 0; x < w; x++) {
        const surf = surface ? surface[x] : 0;
        let top = surf;
        for (let y = 0; y <= surf && y < h; y++) {
          if (tiles[y * w + x] !== TILES.AIR) { top = y; break; }
        }
        this._touchRows[x] = top;
        this._skyRows[x] = Math.max(0, surf - top);
      }
      this.topRow = 0;
      for (let x = 0; x < w; x++) {
        if (this._touchRows[x] > this.topRow) this.topRow = this._touchRows[x];
      }
      this._clearNeeded = true;
    }

    // Fog only ever grows, so the already-written sky band only needs its
    // newly explored pixels filled in.
    const skyRows = this._skyRows;
    let clearRow = -1;
    for (let x = 0; x < w; x++) {
      const sr = skyRows[x];
      if (sr <= 0) continue;
      const base = x * 4;
      for (let k = 0; k < sr; k++) {
        const idx = k * w + x;
        if (!explored[idx]) {
          const i = idx * 4 + base;
          data[i + 3] = 0;
        } else if (this._clearNeeded) {
          const i = idx * 4 + base;
          data[i] = 34; data[i + 1] = 52; data[i + 2] = 86; data[i + 3] = 255;
        }
      }
      if (this._clearNeeded && sr > clearRow) clearRow = sr - 1;
    }
    this._clearRow = clearRow;
    // NOTE: _clearNeeded stays true for the row loop below (which needs it to
    // decide whether the guaranteed-air band still has to be filled), and is
    // only cleared once that loop has actually run.

    for (let y = 0; y < h; y++) {
      // PERF: a terrain column never ends above its surface height, so every
      // row above the highest surface in the world is guaranteed air. Clearing
      // it with one write beats scanning (and branching on) width-many pixels.
      if (y < this.topRow) {
        const rowStart = y * w * 4;
        if (this._clearNeeded || this._clearRow !== y) {
          data.fill(0, rowStart, rowStart + w * 4);
        }
        continue;
      }
      for (let x = 0; x < w; x++) {
        const idx = y * w + x;
        const i = idx * 4;
        if (!explored[idx]) {
          data[i + 3] = 0;
          continue;
        }
        const tile = tiles[idx];
        if (tile === TILES.AIR) {
          if (surface && y < surface[x]) {
            data[i] = 34; data[i + 1] = 52; data[i + 2] = 86;
          } else {
            data[i] = 14; data[i + 1] = 17; data[i + 2] = 26;
          }
        } else {
          const c = tile * 3;
          // Terraria-style depth shading: the deeper the tile, the darker it reads.
          const surf = surface ? surface[x] : 0;
          const depth = Math.max(0, y - surf);
          const shade = 1 - Math.min(0.5, (depth / 100) * 0.5);
          data[i] = table[c] * shade;
          data[i + 1] = table[c + 1] * shade;
          data[i + 2] = table[c + 2] * shade;
        }
        data[i + 3] = 255;

        if (tile === TILES.CHEST || tile === TILES.CHEST_OPEN) {
          pois.push({ type: tile === TILES.CHEST ? 'chest' : 'chest_open', x, y });
        } else if (tile === TILES.CAMPFIRE) {
          pois.push({ type: 'campfire', x, y });
        } else if (tile === TILES.BED) {
          pois.push({ type: 'bed', x, y });
        } else if (tile === TILES.LAVA) {
          pois.push({ type: 'lava', x, y });
        }
      }
    }

    try {
      this.mapCtx.putImageData(this.imageData, 0, 0);
    } catch (error) {
      console.warn('Terracraft minimap: putImageData failed', error);
    }
    // Cap markers so the map never turns into confetti.
    this.pois = pois.length > 400 ? pois.slice(0, 400) : pois;
    this.poisDirty = false;
    this._clearNeeded = false;
    // Now the texture genuinely contains the explored world.
    this.mapReady = true;
  }

  /** Viewport rectangle in tiles for the current window size. */
  _viewRect(game) {
    const span = this.visibleTiles;
    const cx = Math.floor((game.player.x + game.player.width / 2) / TILE_SIZE);
    const cy = Math.floor((game.player.y + game.player.height / 2) / TILE_SIZE);
    const left = Math.max(0, Math.min(this.world.width - span, cx - Math.floor(span / 2)));
    const top = Math.max(0, Math.min(this.world.height - span, cy - Math.floor(span / 2)));
    return { left, top, span };
  }

  render(game) {
    const size = this.sizes[this.mode];
    if (!size || !this.ctx || !this.canvas) return;
    // Never present a half-built map. update() runs first and normally clears
    // this flag; if it somehow has not, the honest thing to show is the blank
    // backdrop rather than a stale or empty texture with markers floating on it.
    if (!this.mapReady) {
      this.ctx.setTransform(1, 0, 0, 1, 0, 0);
      this.ctx.fillStyle = 'rgba(9, 13, 26, 0.82)';
      this.ctx.fillRect(0, 0, size, size);
      return;
    }
    if (this.lastSize !== size) {
      this.canvas.width = size;
      this.canvas.height = size;
      this.lastSize = size;
    }
    const ctx = this.ctx;
    const view = this._viewRect(game);
    const px = size / view.span;   // canvas pixels per tile

    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.imageSmoothingEnabled = false;
    ctx.clearRect(0, 0, size, size);
    ctx.fillStyle = 'rgba(4, 7, 14, 0.9)';
    ctx.fillRect(0, 0, size, size);

    ctx.drawImage(this.mapCanvas, view.left, view.top, view.span, view.span, 0, 0, size, size);

    // Night tint — the map dims with the world, like Terraria's.
    if (game.world && game.world.isNight && game.world.isNight()) {
      ctx.fillStyle = 'rgba(26, 32, 84, 0.28)';
      ctx.fillRect(0, 0, size, size);
    }

    // Integer-rounded marker positions kill sub-pixel shimmer while the map scrolls.
    const toScreen = (tx, ty) => ({ x: Math.round((tx - view.left) * px + px / 2), y: Math.round((ty - view.top) * px + px / 2) });
    const inView = (tx, ty) => tx >= view.left && tx < view.left + view.span && ty >= view.top && ty < view.top + view.span;

    // ---- discovered points of interest ----
    for (const poi of this.pois) {
      if (!inView(poi.x, poi.y)) continue;
      if (!this.explored[poi.y * this.world.width + poi.x]) continue;
      const p = toScreen(poi.x, poi.y);
      if (poi.type === 'chest') ctx.fillStyle = '#fbbf24';
      else if (poi.type === 'chest_open') ctx.fillStyle = 'rgba(251,191,36,0.35)';
      else if (poi.type === 'campfire') ctx.fillStyle = '#fb923c';
      else if (poi.type === 'bed') ctx.fillStyle = '#60a5fa';
      else ctx.fillStyle = 'rgba(249,115,22,0.75)';
      ctx.fillRect(p.x - 1.5, p.y - 1.5, 3, 3);
    }
    // ---- live monsters (only where the map has been explored) ----
    if (game.monsters) {
      for (const m of game.monsters) {
        const tx = Math.floor((m.x + m.width / 2) / TILE_SIZE);
        const ty = Math.floor((m.y + m.height / 2) / TILE_SIZE);
        if (!inView(tx, ty)) continue;
        if (!this.explored[ty * this.world.width + tx]) continue;
        const p = toScreen(tx, ty);
        ctx.fillStyle = m.isElite ? '#f472b6' : '#ef4444';
        ctx.fillRect(p.x - 1.5, p.y - 1.5, 3.5, 3.5);
      }
    }

    // ---- quest-giving villagers (yellow ping, "!" when a quest is offered/ready) ----
    if (game.npcs && game.npcs.npcs) {
      for (const npc of game.npcs.npcs) {
        const tx = Math.floor((npc.x + 10) / TILE_SIZE);
        const ty = Math.floor((npc.y + 24) / TILE_SIZE);
        if (!inView(tx, ty)) continue;
        const p = toScreen(tx, ty);
        const hot = game.npcs.isQuestHot && game.npcs.isQuestHot(npc);
        ctx.fillStyle = hot ? '#fde047' : '#facc15';
        ctx.fillRect(p.x - 2, p.y - 2, 4, 4);
        ctx.save();
        ctx.font = "8px 'Press Start 2P', monospace";
        ctx.textAlign = 'center';
        ctx.textBaseline = 'bottom';
        ctx.fillStyle = 'rgba(2, 6, 23, 0.9)';
        ctx.fillText(hot ? '!' : '?', p.x + 1, p.y - 2);
        ctx.fillStyle = hot ? '#fde047' : '#cbd5e1';
        ctx.fillText(hot ? '!' : '?', p.x, p.y - 3);
        ctx.restore();
      }
    }
    // ---- spawn flag (where you respawn) ----
    if (this.world.surfaceHeights) {
      const sx0 = Math.floor(this.world.width / 2);
      const sy0 = this.world.surfaceHeights[sx0] - 2;
      if (inView(sx0, sy0)) {
        const p = toScreen(sx0, sy0);
        ctx.fillStyle = '#4ade80';
        ctx.fillRect(p.x, p.y - 6, 1, 7);
        ctx.beginPath();
        ctx.moveTo(p.x + 1, p.y - 6);
        ctx.lineTo(p.x + 6, p.y - 4);
        ctx.lineTo(p.x + 1, p.y - 2);
        ctx.closePath();
        ctx.fill();
      }
    }
    // ---- boss ping ----
    if (game.boss && !game.boss.dead) {
      const tx = Math.floor((game.boss.x + game.boss.width / 2) / TILE_SIZE);
      const ty = Math.floor((game.boss.y + game.boss.height / 2) / TILE_SIZE);
      if (inView(tx, ty)) {
        const p = toScreen(tx, ty);
        const pulse = 1 + Math.sin(this.pulse * 6) * 0.35;
        ctx.strokeStyle = '#ef4444';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(p.x, p.y, 5 * pulse, 0, Math.PI * 2);
        ctx.stroke();
        ctx.fillStyle = '#ef4444';
        ctx.fillRect(p.x - 2, p.y - 2, 4, 4);
      }
    }

    // ---- player arrow ----
    const ptx = Math.floor((game.player.x + game.player.width / 2) / TILE_SIZE);
    const pty = Math.floor((game.player.y + game.player.height / 2) / TILE_SIZE);
    const pp = toScreen(ptx, pty);
    ctx.save();
    ctx.translate(pp.x, pp.y);
    ctx.fillStyle = '#ffffff';
    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, -4.5);
    ctx.lineTo(4, 4);
    ctx.lineTo(0, 2);
    ctx.lineTo(-4, 4);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.restore();

    // ---- compass ticks (N up), Terraria-map style ----
    ctx.save();
    ctx.font = "7px 'Press Start 2P', monospace";
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = 'rgba(2, 6, 23, 0.9)';
    ctx.fillText('N', size / 2 + 1, 8);
    ctx.fillText('S', size / 2 + 1, size - 6);
    ctx.fillText('W', 8, size / 2 + 1);
    ctx.fillText('E', size - 8, size / 2 + 1);
    ctx.fillStyle = 'rgba(226, 232, 240, 0.9)';
    ctx.fillText('N', size / 2, 7);
    ctx.fillText('S', size / 2, size - 7);
    ctx.fillText('W', 7, size / 2);
    ctx.fillText('E', size - 7, size / 2);
    ctx.restore();

    // Dark Terraria-style frame: black outer edge + soft inner line.
    ctx.strokeStyle = 'rgba(2, 6, 23, 0.9)';
    ctx.lineWidth = 2;
    ctx.strokeRect(1, 1, size - 2, size - 2);
    ctx.strokeStyle = 'rgba(148, 163, 184, 0.55)';
    ctx.lineWidth = 1;
    ctx.strokeRect(2.5, 2.5, size - 5, size - 5);

    if (this.label) {
      const biome = this.world.getBiomeAtX(ptx);
      const depth = Math.floor((game.player.y / TILE_SIZE) - (this.world.surfaceHeights[ptx] || 0));
      const depthText = depth >= 0 ? `${depth}m deep` : `${Math.abs(depth)}m up`;
      // Short, near-fixed-width label: changing text length used to reflow the panel.
      this.label.textContent = `${biome.toUpperCase()} · ${depthText}`;
    }
  }

  /** Run-length encoded fog of war so exploring persists between sessions. */
  exploreToSave() {
    const runs = [];
    let bit = 0;
    let count = 0;
    for (let i = 0; i < this.explored.length; i++) {
      const v = this.explored[i] ? 1 : 0;
      if (v === bit) {
        count++;
      } else {
        runs.push(count.toString(36));
        bit = v;
        count = 1;
      }
    }
    runs.push(count.toString(36));
    return runs.join('');
  }

  exploreFromSave(encoded) {
    if (typeof encoded !== 'string' || !encoded.length) return false;
    // Legacy/simple form: plain "1"/"0" dump, exactly one character per tile.
    if (encoded.length === this.explored.length && /^[01]+$/.test(encoded)) {
      for (let i = 0; i < encoded.length; i++) this.explored[i] = encoded[i] === '1' ? 1 : 0;
      this.markDirty();
      return true;
    }
    // Run-length form: alternating counts written in base36, starting with 0s.
    let cursor = 0;
    let bit = 0;
    let i = 0;
    while (i < encoded.length && cursor < this.explored.length) {
      let j = i;
      while (j < encoded.length && encoded[j] !== undefined) {
        const code = encoded.charCodeAt(j);
        const isRunChar = (code >= 48 && code <= 57) || (code >= 97 && code <= 122);
        if (!isRunChar) break;
        j++;
      }
      if (j === i) break;
      const count = parseInt(encoded.slice(i, j), 36);
      if (!Number.isFinite(count) || count < 0) return false;
      if (bit === 1) {
        for (let k = 0; k < count && cursor < this.explored.length; k++) this.explored[cursor++] = 1;
      } else {
        cursor += count;
      }
      bit = bit === 1 ? 0 : 1;
      i = j;
    }
    this.markDirty();
    return true;
  }
}

// ============================================================
// ITEM DESCRIPTIONS — shared by hotbar tooltips and the inventory
// ============================================================
const ITEM_TYPE_LABELS = {
  tile: 'Placeable Block',
  material: 'Crafting Material',
  consumable: 'Consumable',
  ammo: 'Ammunition',
  tool: 'Tool',
  weapon: 'Weapon',
  armor: 'Armour'
};

const WEAPON_KIND_LABELS = {
  melee: 'Melee',
  ranged: 'Ranged',
  magic: 'Magic'
};

/**
 * Build a structured description for an inventory item.
 * Returns null when the id is empty/unknown so callers can skip rendering.
 */
function describeItem(id, game) {
  const item = (typeof ITEMS !== 'undefined' && ITEMS) ? ITEMS[id] : null;
  if (!item || id === 'empty') return null;

  const rows = [];
  const kind = ITEM_TYPE_LABELS[item.type] || item.type || 'Item';
  if (item.type === 'weapon' && item.weaponType) {
    rows.push({ label: 'Class', value: WEAPON_KIND_LABELS[item.weaponType] || item.weaponType });
  } else {
    rows.push({ label: 'Type', value: kind });
  }

  if (item.damage) {
    const critBase = 0.2;
    const crit = item.critBonus ? critBase + item.critBonus : critBase;
    rows.push({ label: 'Damage', value: `${item.damage}` });
    rows.push({ label: 'Crit', value: `${Math.round(crit * 100)}%` });
  }
  if (item.useTime) {
    const speed = item.useTime > 0 ? (1 / item.useTime) : 0;
    rows.push({ label: 'Use time', value: `${item.useTime.toFixed(2)}s (${speed.toFixed(1)}/s)` });
  }
  if (item.range) rows.push({ label: 'Reach', value: `${item.range}px` });
  if (item.manaCost) rows.push({ label: 'Mana', value: `${item.manaCost}` });
  if (item.toolPower) rows.push({ label: 'Pick power', value: `${item.toolPower}` });
  if (item.defense) rows.push({ label: 'Defense', value: `+${item.defense}` });
  if (item.heal) rows.push({ label: 'Restores', value: `+${item.heal} life` });
  if (item.hunger) rows.push({ label: 'Fills', value: `+${item.hunger} hunger` });
  if (item.mana) rows.push({ label: 'Restores', value: `+${item.mana} mana` });
  if (item.maxHpBonus) rows.push({ label: 'Permanent', value: `+${item.maxHpBonus} max life` });
  if (item.maxManaBonus) rows.push({ label: 'Permanent', value: `+${item.maxManaBonus} max mana` });
  if (item.buff) {
    const def = (typeof BUFF_DEFS !== 'undefined') ? BUFF_DEFS[item.buff] : null;
    if (def) rows.push({ label: 'Grants', value: `${def.icon} ${def.name} (${Math.round(item.buffTime || 0)}s)` });
  }
  if (item.lifesteal) rows.push({ label: 'Life steal', value: `${Math.round(item.lifesteal * 100)}% of damage dealt` });
  if (item.radius) rows.push({ label: 'Blast', value: `${item.radius}px` });
  if (item.type === 'ammo') rows.push({ label: 'Used by', value: 'Bows' });
  if (item.stackMax > 1) rows.push({ label: 'Stacks to', value: `${item.stackMax}` });

  return { id, item, name: item.name, icon: item.icon, kind, rows };
}

/** Tooltip markup for a single item slot. Returns '' for empty slots. */
function buildItemTooltipHTML(id, game) {
  const info = describeItem(id, game);
  if (!info) return '';
  const count = game && game.countItem ? game.countItem(id) : 0;
  const rows = info.rows
    .map(r => `<div class="tt-row"><span>${r.label}</span><strong>${r.value}</strong></div>`)
    .join('');
  const owned = count > 0 ? `<div class="tt-owned">In bag: ${count}</div>` : '';
  return `<div class="tt-head"><span class="tt-icon">${info.icon}</span><span class="tt-name">${info.name}</span></div>${rows}${owned}`;
}

if (typeof window !== 'undefined') {
  window.GameFeel = GameFeel;
  window.BuffSystem = BuffSystem;
  window.BUFF_DEFS = BUFF_DEFS;
  window.Minimap = Minimap;
  window.describeItem = describeItem;
  window.buildItemTooltipHTML = buildItemTooltipHTML;
}

