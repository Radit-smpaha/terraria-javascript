// ============================================================
// SPACE DIMENSION — the Void Rift, the Ossuary Sovereign
// ============================================================
// Loaded after world.js / entities.js / underworld.js and before terraria.js,
// so World, Monster and Projectile already exist when the Game builds its world.
//
// The rift is a REAL dimension swap rather than a far-away corner of the map:
// the overworld tile/wall arrays are stashed and the world's own buffers are
// handed to a freshly generated asteroid arena instead. Every system that reads
// `world.tiles` (collision, lighting, bloom, the minimap, mining) therefore
// keeps working untouched, and the player's world comes back bit-for-bit on
// the way home. `world.dimension` is the single flag every other system checks.
//
// Contents:
//   1. Space tiles + their properties
//   2. The dimension swap (generate / enter / leave / save helpers)
//   3. Space backdrop, lighting and bloom
//   4. Projectile behaviour + art for the dragon's attacks
//   5. Skeleton minions (summoned by the dragon)
//   6. SKELETON DRAGON, THE OSSUARY SOVEREIGN (final boss)
//   7. The wormhole the beacon tears open

const SPACE_TILE_IDS = {
  VOID_STONE: 48,      // dark asteroid rock — the arena body
  STARSTONE: 49,       // glowing arena floor
  METEOR_ORE: 50,      // molten seams, drops meteor shards
  NEBULA_CRYSTAL: 51,  // magenta crystal clusters
  SOUL_GLASS: 52,      // translucent panes closing the arena
  SPACE_RUNE: 53,      // indestructible glowing rune brick
  ASTEROID: 54,        // drifting rock islands above the arena
  VOID_PLATFORM: 55,   // one-way star platform
  RIFT_PORTAL: 56,     // the way home
  BONE_PILE: 57        // ossuary debris, drops dragonbone
};

for (const [name, id] of Object.entries(SPACE_TILE_IDS)) TILES[name] = id;

Object.assign(TILE_PROPERTIES, {
  [TILES.VOID_STONE]: { solid: true, light: 0, color: '#241a3d', name: 'Void Stone', drops: { id: 'stone', count: 1 } },
  [TILES.STARSTONE]: { solid: true, light: 6, color: '#2a3550', name: 'Starstone', drops: { id: 'stone', count: 1 } },
  [TILES.METEOR_ORE]: { solid: true, light: 7, color: '#b1501f', name: 'Meteor Ore', drops: { id: 'meteor_shard', count: 1 } },
  [TILES.NEBULA_CRYSTAL]: { solid: true, light: 9, color: '#a21caf', name: 'Nebula Crystal', drops: { id: 'nebula_crystal', count: 1 } },
  [TILES.SOUL_GLASS]: { solid: true, light: 3, color: '#5eead4', name: 'Soul Glass', drops: { id: 'glass_block', count: 1 } },
  [TILES.SPACE_RUNE]: { solid: true, light: 10, color: '#7c3aed', name: 'Rune Brick', drops: null },
  [TILES.ASTEROID]: { solid: true, light: 0, color: '#3b3355', name: 'Asteroid Rock', drops: { id: 'stone', count: 1 } },
  [TILES.VOID_PLATFORM]: { solid: true, isPlatform: true, light: 4, color: '#818cf8', name: 'Star Platform', drops: { id: 'star_platform', count: 1 } },
  [TILES.RIFT_PORTAL]: { solid: false, light: 15, color: '#22d3ee', name: 'Rift Gate', drops: null },
  [TILES.BONE_PILE]: { solid: true, light: 1, color: '#d6d3d1', name: 'Bone Pile', drops: { id: 'dragonbone', count: 1 } }
});

// Glowing accents are drawn live on top of the baked tile cache so they pulse.
const BASE_IS_ANIMATED_TILE = World.prototype.isAnimatedTile;
World.prototype.isAnimatedTile = function(tile) {
  if (tile === TILES.METEOR_ORE || tile === TILES.NEBULA_CRYSTAL ||
      tile === TILES.SPACE_RUNE || tile === TILES.RIFT_PORTAL) return true;
  return BASE_IS_ANIMATED_TILE.call(this, tile);
};


// ============================================================
// 2. THE DIMENSION SWAP
// ============================================================

/** True while the player is standing inside the rift arena. */
World.prototype.isInSpace = function() {
  return this.dimension === 'space';
};

/**
 * Carve the arena the final fight happens in — the Ossuary in the sky.
 *
 * Two rules make this arena work, and both exist because of problems players
 * could actually feel:
 *
 *   1. NOTHING SOLID IS EVER GENERATED INSIDE THE FLIGHT BOX (the rows between
 *      the floor and the ceiling). Asteroid islands hang ABOVE the ceiling or
 *      OUTSIDE the rune flanks, where they read as scenery but the Sovereign
 *      can never fly into them. Islands used to drift straight through the
 *      middle of the arena, which is why the dragon snagged and stalled.
 *   2. NO WALL LAYER BEHIND THE FIGHT. The wall layer is opaque and is painted
 *      over the star backdrop, so filling it turned "deep space" into a dark
 *      cave. The sky now shows straight through the arena.
 *
 * Everything else is a dodge route: six one-way star tiers in a staggered
 * herringbone (platforms are air to the dragon, a jump-up for you), bone piles
 * on the floor for cover, and every mineable seam UNDER the crust so mining the
 * arena apart can never sprinkle rock into the flight path. The layout is
 * seeded rather than random, so it reads as designed architecture — twice.
 */
World.prototype.generateSpaceArena = function() {
  const w = this.width;
  const h = this.height;
  this.tiles.fill(TILES.AIR);
  this.walls.fill(0);

  // Deterministic little RNG (xorshift32): a composed arena, and the SAME arena
  // every time the rift opens, rather than a different cave each trip.
  let rs = 0x9e3779b9;
  const rng = () => {
    rs ^= rs << 13; rs ^= rs >>> 17; rs ^= rs << 5;
    return (rs >>> 0) / 4294967296;
  };

  const arenaCX = Math.floor(w / 2);
  const halfW = 56;                       // 112 tiles of duelling ground
  const floorY = h - 26;                  // arena floor row
  const left = Math.max(3, arenaCX - halfW);
  const right = Math.min(w - 4, arenaCX + halfW);
  const span = right - left;
  const ceilY = floorY - 46;              // ceiling of the fight box

  // ---- The floor: a starstone crust over a mined-out ore body ----
  // Every seam sits BELOW the crust on purpose: mining the arena for meteor
  // shards and nebula crystals is the reward for exploring it, and rock can
  // never end up standing in the dragon's lane because of it.
  for (let x = left; x <= right; x++) {
    for (let y = floorY; y <= floorY + 9; y++) {
      const depth = y - floorY;
      const seam = Math.sin((x - left) * 0.31) + Math.cos(x * 0.11 + depth * 0.9);
      let tile = TILES.VOID_STONE;
      if (depth === 0) tile = TILES.STARSTONE;
      else if (depth === 1) tile = rng() < 0.20 ? TILES.METEOR_ORE : TILES.STARSTONE;
      else if (seam > 1.5) tile = TILES.METEOR_ORE;
      else if (seam < -1.55) tile = TILES.NEBULA_CRYSTAL;
      else if (depth >= 5 && rng() < 0.18) tile = TILES.SOUL_GLASS;
      else if (rng() < 0.05) tile = TILES.BONE_PILE;
      this.setTile(x, y, tile);
    }
  }

  // ---- Rune pillars on both flanks (indestructible; they frame the arena) ----
  // They stand one tile OUTSIDE the boss clamp and their capitals lean away
  // from the fight, so no rune brick can ever sit in the lane the serpent
  // flies down. The double-width base is where the player can safely stand.
  for (const inward of [1, -1]) {
    const x = inward === 1 ? left : right;
    for (let y = floorY - 30; y <= floorY; y++) {
      this.setTile(x, y, TILES.SPACE_RUNE);
      if (y > floorY - 4) this.setTile(x + inward, y, TILES.SPACE_RUNE);
    }
    for (let k = 1; k <= 4; k++) {
      this.setTile(x - inward * k, floorY - 31, TILES.SPACE_RUNE);
      this.setTile(x - inward * k, floorY - 32, TILES.SPACE_RUNE);
    }
  }

  // ---- The dodge lattice: six one-way tiers in a staggered herringbone ----
  // Spans are fractions of the arena width, offset tier to tier: wherever you
  // are standing there is a platform one jump up and a gap to drop through.
  // They are platforms, which means the dragon reads them as air (see
  // SkeletonDragonBoss.blocksDragon) while they stay real cover for you.
  const lattice = [
    [-6, [[0.05, 0.32], [0.41, 0.59], [0.68, 0.95]]],
    [-13, [[0.13, 0.38], [0.50, 0.66], [0.77, 0.93]]],
    [-20, [[0.04, 0.21], [0.30, 0.51], [0.61, 0.82], [0.90, 0.97]]],
    [-27, [[0.16, 0.36], [0.45, 0.67], [0.76, 0.90]]],
    [-34, [[0.06, 0.25], [0.37, 0.63], [0.73, 0.94]]],
    [-41, [[0.26, 0.44], [0.56, 0.74]]]
  ];
  for (const [dy, runs] of lattice) {
    for (const [a, b] of runs) {
      const x0 = Math.round(left + a * span);
      const x1 = Math.round(left + b * span);
      for (let x = x0; x <= x1; x++) {
        // Never let a tier touch a flank: the lanes in and out must stay open.
        if (x <= left + 1 || x >= right - 1) continue;
        this.setTile(x, floorY + dy, TILES.VOID_PLATFORM);
      }
    }
  }

  // ---- Cover: bone piles along the floor ----
  // Line-of-sight breaks, something to hide behind during a Grave Ring, and
  // the dragonbone farm the Sovereign's gear is forged from. They sit on the
  // crust only — the dragon's floor clamp keeps its skull above them.
  for (let i = 0; i < 16; i++) {
    const x = Math.round(left + 5 + rng() * (span - 10));
    const stack = 1 + (rng() < 0.3 ? 1 : 0);
    for (let k = 0; k < stack; k++) this.setTile(x + k, floorY - 1, TILES.BONE_PILE);
  }

  // ---- Drifting asteroid islands, always OUTSIDE the flight box ----
  // Either above the ceiling (visible when the dragon rears up, and reachable
  // once you can fly) or beyond the rune flanks. Keeping every one of them out
  // of the clamp box is the change that stops the Sovereign wedging into rock.
  for (let i = 0; i < 16; i++) {
    const overhead = i % 4 !== 3;
    const cx = overhead
      ? Math.round(left - 20 + rng() * (span + 40))
      : (rng() < 0.5
        ? Math.round(left - 18 - rng() * 14)
        : Math.round(right + 18 + rng() * 14));
    const cy = overhead
      ? ceilY - 6 - Math.round(rng() * 20)
      : floorY - 4 - Math.round(rng() * 34);
    const rx = 3 + Math.round(rng() * 5);
    const ry = 2 + Math.round(rng() * 2);
    for (let y = cy - ry; y <= cy + ry; y++) {
      for (let x = cx - rx; x <= cx + rx; x++) {
        if (x < 1 || x >= w - 1 || y < 1 || y >= h - 1) continue;
        const norm = ((x - cx) ** 2) / (rx ** 2) + ((y - cy) ** 2) / (ry ** 2);
        if (norm > 1) continue;
        const roll = rng();
        this.setTile(x, y, roll < 0.12 ? TILES.NEBULA_CRYSTAL
          : roll < 0.24 ? TILES.METEOR_ORE : TILES.ASTEROID);
      }
    }
  }

  // ---- The rift gate home, standing on the left flank of the arena ----
  const gateX = left + 4;
  for (let x = gateX; x < gateX + 3; x++) {
    for (let y = floorY - 5; y < floorY; y++) this.setTile(x, y, TILES.RIFT_PORTAL);
  }

  // ---- Sane world metadata for this dimension ----
  // surfaceHeights is read by weather, the minimap, the journal's depth maths
  // and the overworld spawn fallback, so it has to describe the arena floor
  // rather than staying at the overworld skyline.
  for (let x = 0; x < w; x++) this.surfaceHeights[x] = floorY;
  // Nothing here is the Underworld, and there is no buried chapel to find.

  this.underworldStart = h + 1000;
  this.underworld = null;
  this.dungeon = null;
  this.landmarks = [];
  this.lightSources = [];

  this.spaceArena = {
    left: left + 2,
    right: right - 2,
    floorY,
    top: ceilY,
    // Rows the dragon is allowed to occupy. `ceil` and `crust` are the
    // guaranteed-empty band: the generator promises no solid tile other than
    // one-way platforms and loose bone piles lives between them.
    ceil: ceilY,
    crust: floorY,
    cx: arenaCX,
    gateX,
    gateY: floorY - 3,
    spawnX: (arenaCX + 12) * TILE_SIZE,
    spawnY: (floorY - 6) * TILE_SIZE
  };
  this._tileCacheDirty = true;
  return this.spaceArena;
};
/**
 * Swap the world's tile buffers for the arena's.
 *
 * Everything that could be disturbed by the trip is stashed, not reset: the
 * tiles, the walls, the surface profile, the landmarks, the dungeon and the
 * Underworld descriptor. The overworld arrays are kept alive by reference, so
 * a return trip is an exact restoration even after hundreds of blocks were
 * mined or placed before leaving.
 */
World.prototype.enterSpaceDimension = function() {
  if (this.dimension === 'space') return this.spaceArena || this.generateSpaceArena();

  this.overworldStash = {
    tiles: this.tiles,
    walls: this.walls,
    surfaceHeights: this.surfaceHeights,
    underworldStart: this.underworldStart,
    underworld: this.underworld,
    dungeon: this.dungeon,
    landmarks: this.landmarks,
    lightSources: this.lightSources,
    timeOfDay: this.timeOfDay,
    rainbowSeeded: this.rainbowSeeded
  };
  // A fresh pair of buffers: genuinely empty space rather than the overworld
  // carved into nothing, so nothing from home can bleed into the fight.
  this.tiles = new Uint8Array(this.width * this.height);
  this.walls = new Uint8Array(this.width * this.height);
  this.surfaceHeights = new Int16Array(this.width);
  this.dimension = 'space';
  const arena = this.generateSpaceArena();
  // The old tile cache describes the overworld; drop it entirely.
  this._tileCache = null;
  this._tileCacheDirty = true;
  this._spaceBgCache = null;
  return arena;
};

/** Put the overworld back exactly as it was. */
World.prototype.exitSpaceDimension = function() {
  if (this.dimension !== 'space') return false;
  const stash = this.overworldStash;
  if (stash) {
    this.tiles = stash.tiles;
    this.walls = stash.walls;
    this.surfaceHeights = stash.surfaceHeights;
    this.underworldStart = stash.underworldStart;
    this.underworld = stash.underworld;
    this.dungeon = stash.dungeon;
    this.landmarks = stash.landmarks;
    this.lightSources = stash.lightSources;
    this.timeOfDay = stash.timeOfDay;
    this.rainbowSeeded = stash.rainbowSeeded;
  }
  this.overworldStash = null;
  this.dimension = 'overworld';
  this.spaceArena = null;
  this._tileCache = null;
  this._tileCacheDirty = true;
  this._bgCache = null;
  this._spaceBgCache = null;
  return true;
};

// ---- Save helpers -------------------------------------------------------
// Autosave keeps firing while the player is mid-fight, so the save file must
// always describe the OVERWORLD. These two accessors are what saveGame() reads.

/** The tile array that should be written to disk (never the arena's). */
World.prototype.persistTiles = function() {
  const stash = this.overworldStash;
  return (this.dimension === 'space' && stash) ? stash.tiles : this.tiles;
};

/** Same, for the background wall layer. */
World.prototype.persistWalls = function() {
  const stash = this.overworldStash;
  return (this.dimension === 'space' && stash) ? stash.walls : this.walls;
};

/** True when a block sits inside the arena's playable box. */
World.prototype.inArena = function(x, y) {
  const a = this.spaceArena;
  if (!a) return false;
  const tx = Math.floor(x / TILE_SIZE);
  const ty = Math.floor(y / TILE_SIZE);
  return tx >= a.left && tx <= a.right && ty >= a.top && ty <= a.floorY + 1;
};


// ============================================================
// 3. SPACE BACKDROP, LIGHTING AND BLOOM
// ============================================================

/**
 * Deterministic 2D hash — the starfield has to look identical from one frame to
 * the next, so stars are derived from their index instead of Math.random().
 */
function spaceHash(x, y) {
  const n = Math.sin(x * 127.1 + y * 311.7) * 43758.5453;
  return n - Math.floor(n);
}

/**
 * The rift sky: starfield, nebulae, a ringed gas giant and aurora ribbons.
 *
 * Bypasses the overworld's parallax painter entirely (and keeps its own cache)
 * rather than layering over it — the forest backdrop's cache key has no notion
 * of dimension, so sharing it let a stale daylight sky show up in deep space
 * after a return trip.
 */
World.prototype.renderSpaceBackground = function(ctx, camera) {
  const w = camera.viewportWidth;
  const h = camera.viewportHeight;
  const key = [
    Math.floor(camera.x / 6),
    Math.floor(camera.y / 6),
    Math.floor(Date.now() / 1500)
  ].join('|');

  if (!this._spaceBgCache || this._spaceBgCache.key !== key || !this._spaceBgCanvas) {
    if (!this._spaceBgCanvas) this._spaceBgCanvas = document.createElement('canvas');
    if (this._paintSpaceBackdrop(this._spaceBgCanvas, w, h, camera)) {
      this._spaceBgCache = { key, w, h };
    }
  }
  if (this._spaceBgCanvas) ctx.drawImage(this._spaceBgCanvas, 0, 0);

  // The cached sky only repaints every 1.5s — cheap, but frozen. The things
  // that should actually MOVE (dust drifting past, a comet falling, stars
  // twinkling) are painted live on top, so deep space never reads as a
  // wallpaper the player is standing in front of.
  this._paintSpaceLive(ctx, w, h, camera, Date.now() * 0.001);
};

World.prototype._paintSpaceBackdrop = function(target, w, h, camera) {
  target.width = w;
  target.height = h;
  const ctx = target.getContext && target.getContext('2d');
  if (!ctx) return false;

  // ---- Deep space base: not black. Real sky has colour in it. ----
  const base = ctx.createLinearGradient(0, 0, w * 0.3, h);
  base.addColorStop(0, '#02000a');
  base.addColorStop(0.42, '#080420');
  base.addColorStop(0.74, '#150a33');
  base.addColorStop(1, '#22103f');
  ctx.fillStyle = base;
  ctx.fillRect(0, 0, w, h);

  // ---- Nebulae: soft additive cells with slow parallax so they feel far ----
  const px = camera.x * 0.05;
  const py = camera.y * 0.05;
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  const nebulae = [
    [0.22, 0.28, 0.55, '#4c1d95'], [0.72, 0.18, 0.42, '#0e7490'],
    [0.55, 0.72, 0.60, '#7e22ce'], [0.12, 0.78, 0.38, '#1d4ed8'],
    [0.88, 0.62, 0.34, '#9d174d'], [0.40, 0.44, 0.46, '#0f766e']
  ];
  for (let i = 0; i < nebulae.length; i++) {
    const [nx, ny, nr, color] = nebulae[i];
    const cx = ((nx * w - px * (1 + i * 0.35)) % (w + 600) + w + 600) % (w + 600) - 300;
    const cy = ((ny * h - py * (1 + i * 0.25)) % (h + 400) + h + 400) % (h + 400) - 200;
    const rad = nr * Math.max(w, h) * 0.7;
    const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, rad);
    grad.addColorStop(0, color);
    grad.addColorStop(0.45, 'rgba(20,8,48,0.35)');
    grad.addColorStop(1, 'rgba(4,1,15,0)');
    ctx.globalAlpha = 0.26;
    ctx.fillStyle = grad;
    ctx.fillRect(cx - rad, cy - rad, rad * 2, rad * 2);

    // Filaments: thin bright arcs draped across the cell. This is what makes
    // a nebula look like gas instead of a blurred circle.
    ctx.globalAlpha = 0.13;
    ctx.strokeStyle = color;
    for (let f = 0; f < 7; f++) {
      const fr = rad * (0.24 + spaceHash(f * 3.7 + i, i * 2.3) * 0.62);
      const a0 = spaceHash(f * 1.9 + i * 4.1, i * 0.7) * Math.PI * 2;
      ctx.lineWidth = 2 + spaceHash(f * 5.3, i * 1.7) * 7;
      ctx.beginPath();
      ctx.arc(cx, cy, fr, a0, a0 + 0.9 + spaceHash(f * 2.2, i * 3.3) * 1.7);
      ctx.stroke();
    }
  }

  // ---- The Milky Way: a diagonal band of unresolved starlight ----
  // The single cheapest "this is space" cue there is, and it was missing.
  const milky = ctx.createLinearGradient(0, h * 0.92, w, h * 0.02);
  milky.addColorStop(0, 'rgba(99,102,241,0)');
  milky.addColorStop(0.35, 'rgba(165,180,252,0.16)');
  milky.addColorStop(0.55, 'rgba(226,232,240,0.20)');
  milky.addColorStop(0.72, 'rgba(196,181,253,0.13)');
  milky.addColorStop(1, 'rgba(56,189,248,0)');
  ctx.globalAlpha = 1;
  ctx.fillStyle = milky;
  ctx.save();
  ctx.translate(w / 2, h / 2);
  ctx.rotate(-0.42);
  ctx.fillRect(-w * 1.2, -h * 0.13, w * 2.4, h * 0.26);
  ctx.restore();

  // Dust lane: the dark ribbon that cuts the band in half, so it is not just
  // a glow. Absorbing light is what gives a galaxy its shape.
  ctx.globalCompositeOperation = 'source-over';
  const lane = ctx.createLinearGradient(0, h * 0.9, w, h * 0.05);
  lane.addColorStop(0, 'rgba(2,0,10,0)');
  lane.addColorStop(0.5, 'rgba(2,0,10,0.55)');
  lane.addColorStop(1, 'rgba(2,0,10,0)');
  ctx.fillStyle = lane;
  ctx.save();
  ctx.translate(w / 2, h / 2);
  ctx.rotate(-0.42);
  ctx.fillRect(-w * 1.2, -h * 0.035, w * 2.4, h * 0.07);
  ctx.restore();
  ctx.globalCompositeOperation = 'lighter';

  // Dense faint stars packed along that band — the unresolved billions.
  for (let i = 0; i < 520; i++) {
    const t = spaceHash(i * 1.3, 7.7);
    const off = (spaceHash(i * 2.9, 3.1) - 0.5) * h * 0.24;
    const sx = ((t * (w + 400) - camera.x * 0.06) % (w + 400) + w + 400) % (w + 400) - 200;
    const along = (sx / w - 0.5) * Math.tan(-0.42) * w;
    const sy = h * 0.5 + along + off - camera.y * 0.05;
    if (sy < -4 || sy > h + 4) continue;
    ctx.globalAlpha = 0.16 + spaceHash(i * 4.4, 1.1) * 0.3;
    ctx.fillStyle = '#e2e8f0';
    ctx.fillRect(sx, sy, 1, 1);
  }
  ctx.restore();

  // ---- Starfield: four parallax layers, brighter and rarer as they come ----
  const layers = [
    { factor: 0.08, count: 320, size: 1, alpha: 0.55 },
    { factor: 0.18, count: 190, size: 1.4, alpha: 0.8 },
    { factor: 0.34, count: 95, size: 2, alpha: 1 },
    { factor: 0.52, count: 34, size: 2.8, alpha: 1 }
  ];
  for (let li = 0; li < layers.length; li++) {
    const layer = layers[li];
    ctx.save();
    for (let i = 0; i < layer.count; i++) {
      const hx = spaceHash(i * 1.7 + li * 13.3, li * 7.7);
      const hy = spaceHash(i * 3.1 + li * 5.1, li * 11.9 + 3.3);
      const sx = ((hx * w * 1.2 - camera.x * layer.factor) % w + w) % w;
      const sy = ((hy * h * 1.2 - camera.y * layer.factor) % h + h) % h;
      const tintRoll = spaceHash(i * 2.3, li * 4.4);
      ctx.fillStyle = tintRoll < 0.58 ? '#f8fafc' : tintRoll < 0.76 ? '#bae6fd' : tintRoll < 0.9 ? '#fde68a' : '#f0abfc';
      ctx.globalAlpha = layer.alpha * (0.55 + spaceHash(i * 0.9, li * 2.2) * 0.45);
      ctx.fillRect(sx, sy, layer.size, layer.size);
      // The bright layers get a cross flare and a halo: point-source
      // diffraction is what makes a starfield look photographed rather than
      // sprinkled.
      if (li >= 2) {
        ctx.globalAlpha *= 0.4;
        ctx.fillRect(sx - 2, sy + 0.5, 5 + li, 1);
        ctx.fillRect(sx + 0.5, sy - 2, 1, 5 + li);
        if (li === 3) {
          ctx.globalAlpha *= 0.22;
          ctx.beginPath();
          ctx.arc(sx + 0.5, sy + 0.5, 5, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    }
    ctx.restore();
  }

  // ---- A spiral galaxy, far off in the corner of the sky ----
  {
    const galX = w * 0.2 - camera.x * 0.02;
    const galY = h * 0.16 - camera.y * 0.02;
    const gr = Math.min(w, h) * 0.11;
    ctx.save();
    ctx.translate(galX, galY);
    ctx.rotate(0.7);
    ctx.scale(1, 0.38);
    ctx.globalCompositeOperation = 'lighter';
    const core = ctx.createRadialGradient(0, 0, 0, 0, 0, gr);
    core.addColorStop(0, 'rgba(255,244,214,0.85)');
    core.addColorStop(0.28, 'rgba(196,181,253,0.32)');
    core.addColorStop(1, 'rgba(30,27,75,0)');
    ctx.globalAlpha = 0.8;
    ctx.fillStyle = core;
    ctx.beginPath();
    ctx.arc(0, 0, gr, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = 'rgba(224,231,255,0.5)';
    for (let arm = 0; arm < 2; arm++) {
      ctx.lineWidth = gr * 0.1;
      ctx.beginPath();
      for (let s = 0; s <= 40; s++) {
        const t = s / 40;
        const a = arm * Math.PI + t * 3.4;
        const r = gr * (0.18 + t * 0.86);
        const px2 = Math.cos(a) * r;
        const py2 = Math.sin(a) * r;
        if (s === 0) ctx.moveTo(px2, py2); else ctx.lineTo(px2, py2);
      }
      ctx.stroke();
    }
    ctx.restore();
  }

  // ---- A ringed gas giant, hanging in the upper right ----
  const gx = w * 0.76 - camera.x * 0.03;
  const gy = h * 0.24 - camera.y * 0.03;
  const gr = Math.min(w, h) * 0.17;
  ctx.save();
  ctx.globalAlpha = 0.9;
  const body = ctx.createRadialGradient(gx - gr * 0.35, gy - gr * 0.35, gr * 0.1, gx, gy, gr);
  body.addColorStop(0, '#f5d0fe');
  body.addColorStop(0.5, '#a855f7');
  body.addColorStop(1, '#3b0764');
  ctx.fillStyle = body;
  ctx.beginPath();
  ctx.arc(gx, gy, gr, 0, Math.PI * 2);
  ctx.fill();
  // Banding: three translucent strips across the disc.
  ctx.save();
  ctx.beginPath();
  ctx.arc(gx, gy, gr, 0, Math.PI * 2);
  ctx.clip();
  ctx.globalAlpha = 0.22;
  ctx.fillStyle = '#f0abfc';
  ctx.fillRect(gx - gr, gy - gr * 0.42, gr * 2, gr * 0.16);
  ctx.fillRect(gx - gr, gy + gr * 0.06, gr * 2, gr * 0.22);
  ctx.fillStyle = '#1e1b4b';
  ctx.fillRect(gx - gr, gy + gr * 0.52, gr * 2, gr * 0.3);
  ctx.restore();
  // The rings, drawn as squashed ellipses in front and behind.
  ctx.strokeStyle = '#e9d5ff';
  for (const [rw, lw, a] of [[1.55, 6, 0.5], [1.9, 3, 0.35], [2.2, 2, 0.22]]) {
    ctx.globalAlpha = a;
    ctx.lineWidth = lw;
    ctx.beginPath();
    ctx.ellipse(gx, gy, gr * rw, gr * 0.26, -0.28, 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.restore();

  // ---- A cratered moon in the opposite corner, with a day/night terminator --
  {
    const mx = w * 0.12 - camera.x * 0.05;
    const my = h * 0.72 - camera.y * 0.05;
    const mr = Math.min(w, h) * 0.075;
    ctx.save();
    const moon = ctx.createRadialGradient(mx - mr * 0.4, my - mr * 0.4, mr * 0.1, mx, my, mr);
    moon.addColorStop(0, '#e2e8f0');
    moon.addColorStop(0.6, '#94a3b8');
    moon.addColorStop(1, '#1e293b');
    ctx.globalAlpha = 0.92;
    ctx.fillStyle = moon;
    ctx.beginPath();
    ctx.arc(mx, my, mr, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(mx, my, mr, 0, Math.PI * 2);
    ctx.clip();
    ctx.fillStyle = 'rgba(51,65,85,0.55)';
    for (let c = 0; c < 9; c++) {
      const ca = spaceHash(c * 3.1, 5.5) * Math.PI * 2;
      const cd = spaceHash(c * 7.3, 2.2) * mr * 0.8;
      ctx.beginPath();
      ctx.arc(mx + Math.cos(ca) * cd, my + Math.sin(ca) * cd,
        mr * (0.06 + spaceHash(c * 1.7, 9.1) * 0.15), 0, Math.PI * 2);
      ctx.fill();
    }
    // The terminator: a lit sphere rather than a grey disc.
    const night = ctx.createLinearGradient(mx - mr, my - mr, mx + mr, my + mr);
    night.addColorStop(0, 'rgba(2,0,10,0)');
    night.addColorStop(0.55, 'rgba(2,0,10,0.35)');
    night.addColorStop(1, 'rgba(2,0,10,0.92)');
    ctx.fillStyle = night;
    ctx.fillRect(mx - mr, my - mr, mr * 2, mr * 2);
    ctx.restore();
  }

  // ---- Aurora ribbons: additive sine bands near the top ----
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  for (let band = 0; band < 3; band++) {
    ctx.globalAlpha = 0.11;
    ctx.fillStyle = ['#22d3ee', '#a855f7', '#4ade80'][band];
    ctx.beginPath();
    ctx.moveTo(0, h * 0.06 + band * 22);
    for (let x = 0; x <= w; x += 24) {
      const y = h * 0.06 + band * 22 +
        Math.sin((x + camera.x * 0.12) * 0.004 + band) * 22 +
        Math.sin((x + camera.x * 0.2) * 0.011 + band * 2) * 8;
      ctx.lineTo(x, y);
    }
    ctx.lineTo(w, h * 0.06 + band * 22 + 60);
    for (let x = w; x >= 0; x -= 24) {
      const y = h * 0.06 + band * 22 + 46 +
        Math.sin((x + camera.x * 0.1) * 0.005 + band * 1.4) * 18;
      ctx.lineTo(x, y);
    }
    ctx.closePath();
    ctx.fill();
  }
  ctx.restore();

  // ---- Distant comets drawn as short bright streaks ----
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  for (let i = 0; i < 2; i++) {
    const cx = w * (0.2 + i * 0.45) - camera.x * 0.07;
    const cy = h * (0.6 - i * 0.18) - camera.y * 0.07;
    const grad = ctx.createLinearGradient(cx, cy, cx + 90, cy - 40);
    grad.addColorStop(0, 'rgba(255,255,255,0.75)');
    grad.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.strokeStyle = grad;
    ctx.lineWidth = 2.4;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(cx + 90, cy - 40);
    ctx.stroke();
  }
  ctx.globalCompositeOperation = 'source-over';
  return true;
};

/**
 * The live half of the sky: dust drifting past, a handful of twinkling
 * beacons, and comets that fall on a schedule.
 *
 * The cached backdrop only repaints every 1.5 seconds, which is perfect for
 * nebulae and useless for anything meant to be moving. This layer is small,
 * cheap and drawn every frame, and it is the difference between "space" and a
 * photograph of space taped behind the arena.
 */
World.prototype._paintSpaceLive = function(ctx, w, h, camera, t) {
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';

  // Dust: fine motes on a fast parallax, so flying left/right has a feel.
  for (let i = 0; i < 46; i++) {
    const hx = spaceHash(i * 5.7, 2.9);
    const hy = spaceHash(i * 8.3, 6.1);
    const spd = 6 + spaceHash(i * 1.3, 4.4) * 22;
    const sx = ((hx * w + t * spd - camera.x * 0.8) % w + w) % w;
    const sy = ((hy * h + Math.sin(t * 0.5 + i) * 14 - camera.y * 0.8) % h + h) % h;
    ctx.globalAlpha = 0.05 + spaceHash(i * 2.2, 7.3) * 0.12;
    ctx.fillStyle = '#dbeafe';
    ctx.fillRect(sx, sy, 1.5, 1.5);
  }

  // Twinkle: the brightest stars breathing on their own clocks.
  for (let i = 0; i < 30; i++) {
    const sx = ((spaceHash(i * 12.7, 3.3) * w - camera.x * 0.34) % w + w) % w;
    const sy = ((spaceHash(i * 9.1, 8.8) * h - camera.y * 0.34) % h + h) % h;
    const breathe = 0.5 + 0.5 * Math.sin(t * (1.1 + spaceHash(i * 3.7, 1.9) * 2.4) + i);
    ctx.globalAlpha = 0.25 + breathe * 0.6;
    ctx.fillStyle = i % 3 === 0 ? '#bae6fd' : '#f8fafc';
    const s = 1.5 + breathe * 1.5;
    ctx.fillRect(sx - s / 2, sy - s / 2, s, s);
    ctx.globalAlpha *= 0.35;
    ctx.fillRect(sx - 4, sy - 0.5, 8, 1);
    ctx.fillRect(sx - 0.5, sy - 4, 1, 8);
  }

  // Comets: three slots on long unsynchronised periods, so a streak crosses
  // now and then without the game having to carry any state for it.
  for (let i = 0; i < 3; i++) {
    const period = 14 + i * 9;
    const phase = (t / period + spaceHash(i * 4.4, 6.6)) % 1;
    if (phase > 0.16) continue;
    const p = phase / 0.16;
    const x0 = w * (0.05 + spaceHash(i * 2.7, 9.4) * 0.9);
    const y0 = h * (0.04 + spaceHash(i * 6.1, 3.7) * 0.5);
    const cx = x0 + p * w * 0.36;
    const cy = y0 + p * h * 0.2;
    const tail = 90 + p * 60;
    const fade = Math.sin(p * Math.PI);
    const grad = ctx.createLinearGradient(cx, cy, cx - tail * 0.86, cy - tail * 0.48);
    grad.addColorStop(0, 'rgba(255,255,255,0.9)');
    grad.addColorStop(0.35, 'rgba(186,230,253,0.35)');
    grad.addColorStop(1, 'rgba(147,197,253,0)');
    ctx.globalAlpha = 0.85 * fade;
    ctx.strokeStyle = grad;
    ctx.lineWidth = 2.2;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(cx - tail * 0.86, cy - tail * 0.48);
    ctx.stroke();
    ctx.globalAlpha = fade;
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(cx - 1.5, cy - 1.5, 3, 3);
  }
  ctx.restore();
};

/**
 * Space lighting: near-black with hard practical lights, exactly like the
 * Underworld pass but colder and centred on the arena's own light sources.
 */
const BASE_RENDER_LIGHTING = World.prototype.renderLighting;
World.prototype.renderLighting = function(lightCtx, camera, player, entities) {
  if (!this.isInSpace()) return BASE_RENDER_LIGHTING.call(this, lightCtx, camera, player, entities);
  BASE_RENDER_LIGHTING.call(this, lightCtx, camera, player, entities);

  const minX = Math.max(0, Math.floor(camera.x / TILE_SIZE) - 2);
  const maxX = Math.min(this.width - 1, Math.ceil((camera.x + camera.viewportWidth) / TILE_SIZE) + 2);
  const minY = Math.max(0, Math.floor(camera.y / TILE_SIZE) - 2);
  const maxY = Math.min(this.height - 1, Math.ceil((camera.y + camera.viewportHeight) / TILE_SIZE) + 2);

  lightCtx.save();
  lightCtx.globalCompositeOperation = 'source-over';
  // Only a light veil. The old 0.55 crushes the star backdrop into a cave
  // wall, which is most of why the Ossuary did not read as "space": the sky
  // was being painted, then immediately dimmed by more than half.
  lightCtx.fillStyle = 'rgba(3, 1, 14, 0.30)';
  lightCtx.fillRect(0, 0, camera.viewportWidth, camera.viewportHeight);
  lightCtx.globalCompositeOperation = 'destination-out';
  this.carveLightCircle(lightCtx, player.x + player.width / 2 - camera.x,
    player.y + player.height / 2 - camera.y, 165, 0.85);
  for (let y = minY; y <= maxY; y++) {
    for (let x = minX; x <= maxX; x++) {
      const tile = this.getTile(x, y);
      const radius = tile === TILES.METEOR_ORE ? 120
        : tile === TILES.NEBULA_CRYSTAL ? 150
          : tile === TILES.SPACE_RUNE ? 135
            : tile === TILES.RIFT_PORTAL ? 210
              : tile === TILES.STARSTONE ? 55
                : tile === TILES.TORCH ? 150
                  : tile === TILES.CAMPFIRE ? 165 : 0;
      if (radius) {
        this.carveLightCircle(lightCtx, x * TILE_SIZE + 12 - camera.x, y * TILE_SIZE + 12 - camera.y,
          radius, tile === TILES.RIFT_PORTAL ? 0.98 : 0.72);
      }
    }
  }
  for (const ent of entities || []) {
    if (ent.lightRadius) {

      this.carveLightCircle(lightCtx, ent.x + (ent.width || 0) / 2 - camera.x,
        ent.y + (ent.height || 0) / 2 - camera.y, ent.lightRadius, 0.74);
    }
  }
  lightCtx.restore();
};
/** Bloom pass: rune bricks, crystals, meteors and the rift gate all bleed light. */
const BASE_RENDER_GLOW = World.prototype.renderGlow;
World.prototype.renderGlow = function(glowCtx, camera, player, entities = []) {
  BASE_RENDER_GLOW.call(this, glowCtx, camera, player, entities);
  if ((this.glowScale ?? 1) <= 0 || !this.isInSpace()) return;

  const t = Date.now() * 0.001;
  const minX = Math.max(0, Math.floor(camera.x / TILE_SIZE) - 2);
  const maxX = Math.min(this.width - 1, Math.ceil((camera.x + camera.viewportWidth) / TILE_SIZE) + 2);
  const minY = Math.max(0, Math.floor(camera.y / TILE_SIZE) - 2);
  const maxY = Math.min(this.height - 1, Math.ceil((camera.y + camera.viewportHeight) / TILE_SIZE) + 2);

  for (let y = minY; y <= maxY; y++) {
    for (let x = minX; x <= maxX; x++) {
      const tile = this.tiles[y * this.width + x];
      if (tile !== TILES.METEOR_ORE && tile !== TILES.NEBULA_CRYSTAL &&
          tile !== TILES.SPACE_RUNE && tile !== TILES.RIFT_PORTAL &&
          tile !== TILES.STARSTONE && tile !== TILES.SOUL_GLASS) continue;
      const pulse = 0.78 + Math.sin(t * 2.6 + x * 0.6 + y * 0.9) * 0.2;
      const sx = x * TILE_SIZE + 12 - camera.x;
      const sy = y * TILE_SIZE + 12 - camera.y;
      if (tile === TILES.METEOR_ORE) this.glowBlob(glowCtx, sx, sy, 62 * pulse, 255, 120, 40, 0.42);
      else if (tile === TILES.NEBULA_CRYSTAL) this.glowBlob(glowCtx, sx, sy, 74 * pulse, 217, 70, 239, 0.42);
      else if (tile === TILES.SPACE_RUNE) this.glowBlob(glowCtx, sx, sy, 52 * pulse, 139, 92, 246, 0.32);
      else if (tile === TILES.RIFT_PORTAL) this.glowBlob(glowCtx, sx, sy, 120 * pulse, 34, 211, 238, 0.55);
      else if (tile === TILES.SOUL_GLASS) this.glowBlob(glowCtx, sx, sy, 34 * pulse, 94, 234, 212, 0.2);
      else this.glowBlob(glowCtx, sx, sy, 34 * pulse, 96, 165, 250, 0.14);
    }
  }
};

// ============================================================
// 3b. SPACE TILE ART
// ============================================================

const BASE_DRAW_TILE_GRAPHIC = World.prototype.drawTileGraphic;
World.prototype.drawTileGraphic = function(ctx, tile, sx, sy, tx, ty, exposedTop = false) {
  const t = Date.now() * 0.001;
  switch (tile) {
    case TILES.VOID_STONE: {
      ctx.fillStyle = '#241a3d';
      ctx.fillRect(sx, sy, TILE_SIZE, TILE_SIZE);
      // Speckled regolith with a faint cold sheen on top faces.
      for (let i = 0; i < 5; i++) {
        const hx = spaceHash(tx * 3 + i, ty * 5 + i * 2);
        const hy = spaceHash(tx * 7 + i * 3, ty * 2 + i);
        ctx.fillStyle = hx < 0.5 ? '#2e2350' : '#1b1230';
        ctx.fillRect(sx + Math.floor(hx * 20) + 1, sy + Math.floor(hy * 20) + 1, 3, 3);
      }
      if (exposedTop) {
        ctx.fillStyle = '#3b2d63';
        ctx.fillRect(sx, sy, TILE_SIZE, 3);
      }
      break;
    }
    case TILES.STARSTONE: {
      ctx.fillStyle = '#25304d';
      ctx.fillRect(sx, sy, TILE_SIZE, TILE_SIZE);
      ctx.fillStyle = '#334066';
      ctx.fillRect(sx, sy, TILE_SIZE, 4);
      // Inlaid star sigil that catches the arena light.
      const cx = sx + 12;
      const cy = sy + 13;
      ctx.fillStyle = '#93c5fd';
      ctx.fillRect(cx - 1, cy - 5, 2, 10);
      ctx.fillRect(cx - 5, cy - 1, 10, 2);
      ctx.fillStyle = '#e0e7ff';
      ctx.fillRect(cx - 1, cy - 1, 2, 2);
      break;
    }
    case TILES.METEOR_ORE: {
      const heat = 0.55 + Math.sin(t * 3 + tx * 0.7 + ty) * 0.45;
      ctx.fillStyle = '#2b2338';
      ctx.fillRect(sx, sy, TILE_SIZE, TILE_SIZE);
      ctx.fillStyle = '#4b3b52';
      ctx.fillRect(sx + 2, sy + 2, 20, 20);
      for (let i = 0; i < 4; i++) {
        const hx = spaceHash(tx * 5 + i * 3, ty * 4 + i);
        const hy = spaceHash(tx * 2 + i, ty * 9 + i * 3);
        ctx.fillStyle = i % 2 ? '#f97316' : '#fb923c';
        ctx.globalAlpha = 0.6 + heat * 0.4;
        ctx.fillRect(sx + 3 + Math.floor(hx * 16), sy + 3 + Math.floor(hy * 16), 5, 5);
        ctx.globalAlpha = 1;
        ctx.fillStyle = '#fef3c7';
        ctx.fillRect(sx + 5 + Math.floor(hx * 16), sy + 5 + Math.floor(hy * 16), 2, 2);
      }
      break;
    }
    case TILES.NEBULA_CRYSTAL: {
      const pulse = 0.7 + Math.sin(t * 2.2 + tx + ty * 0.5) * 0.3;
      ctx.fillStyle = '#2a0f3a';
      ctx.fillRect(sx, sy, TILE_SIZE, TILE_SIZE);
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      ctx.globalAlpha = 0.35 + pulse * 0.45;
      ctx.fillStyle = '#e879f9';
      ctx.beginPath();
      ctx.moveTo(sx + 12, sy + 2);
      ctx.lineTo(sx + 20, sy + 12);
      ctx.lineTo(sx + 12, sy + 22);
      ctx.lineTo(sx + 4, sy + 12);
      ctx.closePath();
      ctx.fill();
      ctx.globalAlpha = 0.9;
      ctx.fillStyle = '#fdf4ff';
      ctx.fillRect(sx + 11, sy + 7, 3, 9);
      ctx.restore();
      break;
    }
    case TILES.SOUL_GLASS: {
      ctx.save();
      ctx.globalAlpha = 0.5;
      ctx.fillStyle = '#2dd4bf';
      ctx.fillRect(sx, sy, TILE_SIZE, TILE_SIZE);
      ctx.globalAlpha = 0.9;
      ctx.strokeStyle = '#99f6e4';
      ctx.lineWidth = 1;
      ctx.strokeRect(sx + 0.5, sy + 0.5, TILE_SIZE - 1, TILE_SIZE - 1);
      ctx.fillStyle = 'rgba(255,255,255,0.5)';
      ctx.fillRect(sx + 3, sy + 3, 4, TILE_SIZE - 8);
      ctx.restore();
      break;
    }
    case TILES.SPACE_RUNE: {
      const pulse = 0.6 + Math.sin(t * 1.8 + tx * 0.4 + ty * 0.7) * 0.4;
      ctx.fillStyle = '#1c1334';
      ctx.fillRect(sx, sy, TILE_SIZE, TILE_SIZE);
      ctx.fillStyle = '#2b1d4d';
      ctx.fillRect(sx + 1, sy + 1, TILE_SIZE - 2, TILE_SIZE - 2);
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      // A carved angular rune; the same glyph tiles the whole arena wall.
      ctx.globalAlpha = 0.4 + pulse * 0.5;
      ctx.fillStyle = '#a78bfa';
      ctx.fillRect(sx + 6, sy + 5, 12, 3);
      ctx.fillRect(sx + 10, sy + 6, 3, 12);
      ctx.fillRect(sx + 6, sy + 17, 12, 2);
      ctx.globalAlpha = 0.85;
      ctx.fillStyle = '#ede9fe';
      ctx.fillRect(sx + 11, sy + 11, 2, 2);
      ctx.restore();
      break;
    }
    case TILES.ASTEROID: {
      ctx.fillStyle = '#3b3355';
      ctx.fillRect(sx, sy, TILE_SIZE, TILE_SIZE);
      for (let i = 0; i < 6; i++) {
        const hx = spaceHash(tx * 4 + i * 7, ty * 6 + i * 3);
        const hy = spaceHash(tx * 8 + i, ty * 3 + i * 5);
        ctx.fillStyle = hx < 0.5 ? '#4a4169' : '#2c2542';
        ctx.fillRect(sx + Math.floor(hx * 19), sy + Math.floor(hy * 19), 4, 4);
      }
      if (exposedTop) {
        ctx.fillStyle = '#5b5182';
        ctx.fillRect(sx, sy, TILE_SIZE, 3);
      }
      break;
    }
    case TILES.VOID_PLATFORM: {
      const pulse = 0.7 + Math.sin(t * 2.6 + tx * 0.6) * 0.3;
      ctx.fillStyle = '#312e81';
      ctx.fillRect(sx, sy, TILE_SIZE, 8);
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      ctx.globalAlpha = 0.5 + pulse * 0.4;
      ctx.fillStyle = '#a5b4fc';
      ctx.fillRect(sx, sy, TILE_SIZE, 3);
      ctx.fillRect(sx + 2, sy + 6, TILE_SIZE - 4, 1);
      ctx.restore();
      ctx.fillStyle = '#e0e7ff';
      ctx.fillRect(sx + 2, sy + 2, 3, 2);
      ctx.fillRect(sx + TILE_SIZE - 6, sy + 2, 3, 2);
      break;
    }
    case TILES.RIFT_PORTAL: {
      const pulse = 0.65 + Math.sin(t * 2.4 + ty * 0.5) * 0.35;
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      ctx.globalAlpha = 0.18 + pulse * 0.22;
      ctx.fillStyle = '#22d3ee';
      ctx.fillRect(sx - 6, sy - 6, TILE_SIZE + 12, TILE_SIZE + 12);
      ctx.globalAlpha = 0.85;
      for (let i = 0; i < 3; i++) {
        const r = 4 + i * 4 + Math.sin(t * 3 + i + ty) * 1.5;
        ctx.strokeStyle = ['#a5f3fc', '#67e8f9', '#0e7490'][i];
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.ellipse(sx + 12, sy + 12, r, r * 1.5, 0, 0, Math.PI * 2);
        ctx.stroke();
      }
      ctx.globalAlpha = 1;
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(sx + 8, sy + 8, 8, 8);
      ctx.restore();
      break;
    }
    case TILES.BONE_PILE: {
      ctx.fillStyle = '#a8a29e';
      ctx.fillRect(sx + 1, sy + 12, 22, 10);
      ctx.fillStyle = '#e7e5e4';
      ctx.fillRect(sx + 3, sy + 8, 7, 7);
      ctx.fillRect(sx + 13, sy + 10, 6, 6);
      ctx.fillStyle = '#78716c';
      ctx.fillRect(sx + 5, sy + 10, 2, 2);
      ctx.fillRect(sx + 15, sy + 12, 2, 2);
      // A snapped femur leaning on the pile.
      ctx.fillStyle = '#d6d3d1';
      ctx.fillRect(sx + 16, sy + 2, 3, 9);
      ctx.fillRect(sx + 14, sy + 1, 3, 3);
      ctx.fillRect(sx + 18, sy + 1, 3, 3);
      break;
    }
    default:
      return BASE_DRAW_TILE_GRAPHIC.call(this, ctx, tile, sx, sy, tx, ty, exposedTop);
  }
};

// ============================================================
// 4. PROJECTILES THE DRAGON FIRES
// ============================================================
// Bone shards, soul flames, grave orbs, meteors and spectral breath. Two of
// them need behaviour the generic Projectile has no concept of (homing and
// gravity), so update() is wrapped rather than replaced: the base class still
// owns movement, tile collision and lifetime.

const SPACE_PROJECTILE_TYPES = ['bone_shard', 'soul_flame', 'grave_orb', 'meteor', 'dragon_breath'];

const BASE_PROJECTILE_UPDATE = Projectile.prototype.update;
Projectile.prototype.update = function(dt, world, particleSystem) {
  if (!SPACE_PROJECTILE_TYPES.includes(this.type)) {
    return BASE_PROJECTILE_UPDATE.call(this, dt, world, particleSystem);
  }

  if (this.type === 'bone_shard') {
    // Gentle homing: it leans toward the player, but never turns hard enough to
    // be unavoidable, and only while its short homing window is open. Strafing
    // always beats a shard.
    if (this.homing && this.target && this.target.hp > 0) {
      const tx = this.target.x + this.target.width / 2;
      const ty = this.target.y + this.target.height / 2;
      const dist = Math.hypot(tx - this.x, ty - this.y) || 1;
      const speed = Math.hypot(this.vx, this.vy) || 1;
      const wantX = (tx - this.x) / dist;
      const wantY = (ty - this.y) / dist;
      const curX = this.vx / speed;
      const curY = this.vy / speed;
      const steer = this.homingStrength || 0.055;
      const nx = curX + (wantX - curX) * steer;
      const ny = curY + (wantY - curY) * steer;
      const nlen = Math.hypot(nx, ny) || 1;
      this.vx = (nx / nlen) * speed;
      this.vy = (ny / nlen) * speed;
      this.homingTime = (this.homingTime || 0) - dt;
      if (this.homingTime <= 0) this.homing = false;
    }
    this.spin = (this.spin || 0) + dt * 7;
    if (Math.random() < 0.35) {
      particleSystem.addParticle(this.x, this.y,
        -this.vx * 0.12 + (Math.random() - 0.5) * 0.6,
        -this.vy * 0.12 + (Math.random() - 0.5) * 0.6,
        Math.random() < 0.5 ? '#e7e5e4' : '#c4b5fd', 2, 0.24, 0, false);
    }
  } else if (this.type === 'soul_flame' || this.type === 'grave_orb') {
    // Soul fire drifts on a slow sine wander so the rings feel alive rather
    // than like a mechanical expanding circle.
    this.wobble = (this.wobble || 0) + dt * 2.4;
    this.x += Math.cos(this.wobble) * 0.35;
    this.y += Math.sin(this.wobble * 1.3) * 0.35;
    if (Math.random() < 0.6) {
      const tint = this.type === 'soul_flame' ? '#5eead4' : '#c084fc';
      particleSystem.addParticle(this.x + (Math.random() - 0.5) * 6, this.y + (Math.random() - 0.5) * 6,
        -this.vx * 0.08, -this.vy * 0.08 - 0.2, tint, 2.4, 0.4, -0.01, true);
    }
  } else if (this.type === 'meteor') {
    this.vy += 0.2;
    if (this.vy > 16) this.vy = 16;
    this.spin = (this.spin || 0) + dt * 3.2;
    // Fiery re-entry trail: hot embers plus a long smoke plume.
    for (let i = 0; i < 3; i++) {
      particleSystem.addParticle(
        this.x + (Math.random() - 0.5) * 14,
        this.y - this.vy * (i * 0.4),
        (Math.random() - 0.5) * 1.2, -this.vy * 0.12 + (Math.random() - 0.5) * 0.6,
        i === 0 ? '#fef3c7' : i === 1 ? '#f97316' : '#7c2d12',
        2 + Math.random() * 3, 0.5 + i * 0.12, -0.01, i < 2
      );
    }
  } else if (this.type === 'dragon_breath') {
    if (Math.random() < 0.7) {
      particleSystem.addParticle(this.x, this.y, (Math.random() - 0.5) * 1.1, (Math.random() - 0.5) * 1.1,
        Math.random() < 0.5 ? '#a5f3fc' : '#67e8f9', 2.6, 0.3, 0, true);
    }
  }

  const wasDead = this.dead;
  BASE_PROJECTILE_UPDATE.call(this, dt, world, particleSystem);
  // Meteors detonate instead of winking out when they hit the arena.
  if (!wasDead && this.dead && this.type === 'meteor') {
    particleSystem.bloodBurst(this.x, this.y, '#f97316', 26);
    particleSystem.magicSparkle(this.x, this.y, '#fde047', 22);
  }
};

const BASE_PROJECTILE_RENDER = Projectile.prototype.render;
Projectile.prototype.render = function(ctx, camera) {
  if (!SPACE_PROJECTILE_TYPES.includes(this.type)) return BASE_PROJECTILE_RENDER.call(this, ctx, camera);
  const sx = this.x - camera.x;
  const sy = this.y - camera.y;

  if (this.type === 'bone_shard') {
    ctx.save();
    ctx.translate(sx, sy);
    ctx.rotate(this.spin || 0);
    ctx.shadowColor = '#e0e7ff';
    ctx.shadowBlur = 10;
    // A jagged splinter of bone with a hot marrow core.
    ctx.fillStyle = '#57534e';
    ctx.beginPath();
    ctx.moveTo(11, 0); ctx.lineTo(-2, -4); ctx.lineTo(-9, -1);
    ctx.lineTo(-5, 3); ctx.lineTo(2, 4); ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#f5f5f4';
    ctx.beginPath();
    ctx.moveTo(10, 0); ctx.lineTo(-1, -2.4); ctx.lineTo(-6, -0.6);
    ctx.lineTo(-2, 2); ctx.lineTo(3, 2.4); ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#fef3c7';
    ctx.fillRect(-1, -1, 3, 2);
    ctx.restore();
  } else if (this.type === 'soul_flame') {
    const pulse = 1 + Math.sin(Date.now() * 0.02 + this.x * 0.1) * 0.16;
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    ctx.shadowColor = '#2dd4bf';
    ctx.shadowBlur = 16;
    ctx.fillStyle = 'rgba(45, 212, 191, 0.45)';
    ctx.beginPath(); ctx.ellipse(sx, sy, 12 * pulse, 12 * pulse, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#99f6e4';
    ctx.beginPath(); ctx.ellipse(sx, sy, 7 * pulse, 8 * pulse, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#f0fdfa';
    ctx.beginPath(); ctx.ellipse(sx, sy - 1, 3.4, 4.4, 0, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
  } else if (this.type === 'grave_orb') {
    ctx.save();
    ctx.shadowColor = '#a855f7';
    ctx.shadowBlur = 16;
    ctx.fillStyle = '#3b0764';
    ctx.beginPath(); ctx.arc(sx, sy, 9, 0, Math.PI * 2); ctx.fill();
    ctx.globalCompositeOperation = 'lighter';
    ctx.fillStyle = 'rgba(192, 132, 252, 0.75)';
    ctx.beginPath(); ctx.arc(sx, sy, 6, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#fdf4ff';
    ctx.beginPath(); ctx.arc(sx - 1, sy - 1, 2.6, 0, Math.PI * 2); ctx.fill();
    // Two ghost runes orbiting the core.
    ctx.fillStyle = '#e9d5ff';
    for (let i = 0; i < 2; i++) {
      const a = (Date.now() * 0.004) + i * Math.PI;
      ctx.fillRect(sx + Math.cos(a) * 11 - 1.5, sy + Math.sin(a) * 11 - 1.5, 3, 3);
    }
    ctx.restore();
  } else if (this.type === 'meteor') {
    ctx.save();
    ctx.translate(sx, sy);
    ctx.rotate(-(this.spin || 0) * 0.5);
    ctx.shadowColor = '#f97316';
    ctx.shadowBlur = 18;
    ctx.fillStyle = '#3f1d0b';
    ctx.beginPath(); ctx.arc(0, 0, 11, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#7c2d12';
    ctx.beginPath(); ctx.arc(0, 0, 9, 0, Math.PI * 2); ctx.fill();
    ctx.globalCompositeOperation = 'lighter';
    ctx.strokeStyle = '#fb923c';
    ctx.lineWidth = 2.4;
    for (let i = 0; i < 4; i++) {
      const a = i * 1.57 + 0.4;
      ctx.beginPath();
      ctx.moveTo(Math.cos(a) * 2, Math.sin(a) * 2);
      ctx.lineTo(Math.cos(a) * 8, Math.sin(a) * 8);
      ctx.stroke();
    }
    ctx.fillStyle = '#fef3c7';
    ctx.beginPath(); ctx.arc(0, 0, 4, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
  } else {
    // Spectral breath: a tight cyan spear with a white core.
    ctx.save();
    ctx.translate(sx, sy);
    ctx.rotate(Math.atan2(this.vy, this.vx));
    ctx.globalCompositeOperation = 'lighter';
    ctx.shadowColor = '#22d3ee';
    ctx.shadowBlur = 14;
    ctx.fillStyle = 'rgba(34, 211, 238, 0.6)';
    ctx.beginPath();
    ctx.moveTo(14, 0); ctx.lineTo(-8, -6); ctx.lineTo(-16, 0); ctx.lineTo(-8, 6);
    ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(-8, -2, 18, 4);
    ctx.restore();
  }
};

/**
 * Spawn helper used by the dragon and its archers: every space projectile gets
 * a bloom tint and a light radius so it lights the arena as it flies.
 */
function spawnSpaceProjectile(list, x, y, vx, vy, type, damage, life, lightRadius, lightColor) {
  const p = new Projectile(x, y, vx, vy, type, damage, true, life, lightRadius);
  p.lightColor = lightColor;
  list.push(p);
  return p;
}

// ============================================================
// 5. SKELETON MINIONS
// ============================================================
// Summoned in waves by the dragon. They extend Monster so they inherit the
// tested ground AI (chase, hop steps, ledge hesitation) and only the art, the
// stats and the archer's bow are new. `space` marks them so the Game can keep
// them out of the overworld's loot tables and clean them up when the rift
// closes behind the player.
//
// These numbers are the reason the Sovereign's arena stops being a walkover:
// Voidscale plate and lifesteal used to make the adds free XP. Every species
// now survives long enough to demand a real swing, hits hard enough to punish
// standing still, and is scaled AGAIN by the dragon's phase in summonMinions.
const SKELETON_SPECIES = {
  skeleton_warrior: {
    name: 'Ossuary Warrior', width: 20, height: 34, hp: 660, speed: 3.4, damage: 82,
    knockbackResist: 0.42, lightRadius: 55
  },
  bone_archer: {
    name: 'Marrow Archer', width: 20, height: 34, hp: 480, speed: 2.8, damage: 74,
    knockbackResist: 0.34, lightRadius: 60
  },
  bone_colossus: {
    name: 'Bone Colossus', width: 34, height: 48, hp: 2400, speed: 2.0, damage: 142,
    knockbackResist: 0.74, lightRadius: 85
  }
};

// The most bone the arena is allowed to hold at once. Every summon path reads it
// — the passive trickle and the burst waves alike — because a cap that only one
// of them obeys is not a cap: the old 9 lived in the passive branch only, and a
// phase-3 burst of five dropped straight on top of it.
const MINION_CAP = 9;

class SkeletonMinion extends Monster {
  constructor(x, y, species = 'skeleton_warrior', game = null) {
    super(x, y, 'zombie');
    const def = SKELETON_SPECIES[species] || SKELETON_SPECIES.skeleton_warrior;
    this.species = species;
    this.type = species;
    this.space = true;
    this.game = game;
    this.animT = Math.random() * 6;
    this.bowTimer = 1.1 + Math.random() * 1.2;
    this.width = def.width;
    this.height = def.height;
    this.hp = this.maxHp = def.hp;
    this.speed = def.speed;
    this.damage = def.damage;
    this.knockbackResist = def.knockbackResist;
    this.lightRadius = def.lightRadius;
    this.displayName = def.name;
    // Summoned undead are never promoted: an elite wave on top of a phase-3
    // dragon is noise, not difficulty.
    this.canBeElite = false;
    this.exp = 120;
  }

  isGroundType() { return true; }

  update(dt, player, world) {
    this.animT += dt;
    super.update(dt, player, world);

    if (this.species === 'bone_archer' && this.game && !this.dead) {
      const dx = (player.x + player.width / 2) - (this.x + this.width / 2);
      const dy = (player.y + player.height / 2) - (this.y + this.height / 2);
      const dist = Math.hypot(dx, dy);
      // Bows only fire with line of sight: no sniping through the arena walls.
      const blocked = world && !this.hasLineOfSight(player, world);
      this.bowTimer -= dt;
      if (this.bowTimer <= 0 && dist < 720 && !blocked) {
        this.bowTimer = 1.05 + Math.random() * 0.55;
        const a = Math.atan2(dy, dx) + (Math.random() - 0.5) * 0.05;
        spawnSpaceProjectile(this.game.projectiles,
          this.x + this.width / 2, this.y + this.height / 2,
          Math.cos(a) * 8.6, Math.sin(a) * 8.6,
          'bone_shard', this.damage, 3.2, 60, [226, 232, 240]);
        if (this.game.sound) this.game.sound.playBow();
      }
    }
  }

  /** Straight-line tile probe so archers cannot snipe through the arena. */
  hasLineOfSight(player, world) {
    const x0 = this.x + this.width / 2;
    const y0 = this.y + this.height / 2;
    const x1 = player.x + player.width / 2;
    const y1 = player.y + player.height / 2;
    const steps = Math.ceil(Math.hypot(x1 - x0, y1 - y0) / 16);
    for (let i = 1; i < steps; i++) {
      const t = i / steps;
      const tx = Math.floor((x0 + (x1 - x0) * t) / TILE_SIZE);
      const ty = Math.floor((y0 + (y1 - y0) * t) / TILE_SIZE);
      if (world.isSolid(tx, ty)) return false;
    }
    return true;
  }

  die(particleSystem) {
    super.die(particleSystem);
    if (particleSystem) {
      // Bones scatter instead of bleeding.
      particleSystem.bloodBurst(this.x + this.width / 2, this.y + this.height / 2, '#e7e5e4', 18);
      particleSystem.magicSparkle(this.x + this.width / 2, this.y + this.height / 2, '#a5f3fc', 10);
    }
  }

  render(ctx, camera) {
    const sx = this.x - camera.x;
    const sy = this.y - camera.y;
    const t = this.animT;
    const big = this.species === 'bone_colossus';
    const bone = '#e7e5e4';
    const boneDark = '#a8a29e';
    const step = Math.sin(t * 7) * 1.6;

    ctx.save();
    ctx.translate(sx, sy);
    ctx.fillStyle = 'rgba(0,0,0,0.35)';
    ctx.beginPath(); ctx.ellipse(this.width / 2, this.height - 2, this.width * 0.46, 3.5, 0, 0, Math.PI * 2); ctx.fill();
    if (this.facing === -1) { ctx.translate(this.width, 0); ctx.scale(-1, 1); }

    if (big) {
      // ---- Bone Colossus: ribcage battle-plate, horned skull, bone shield ----
      ctx.strokeStyle = bone;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(6, 20 - step); ctx.lineTo(6, this.height - 2);
      ctx.moveTo(this.width - 8, 20 + step); ctx.lineTo(this.width - 8, this.height - 2);
      ctx.stroke();
      ctx.fillStyle = boneDark;
      ctx.fillRect(6, 20, this.width - 12, 20);
      ctx.fillStyle = bone;
      for (let i = 0; i < 4; i++) ctx.fillRect(9, 22 + i * 5, this.width - 18, 2);
      ctx.fillRect(8, 4, 18, 14);
      ctx.fillStyle = '#f5f5f4';
      ctx.fillRect(10, 5, 14, 8);
      // Horns
      ctx.fillStyle = boneDark;
      ctx.beginPath(); ctx.moveTo(9, 5); ctx.lineTo(1, -2); ctx.lineTo(10, 2); ctx.closePath(); ctx.fill();
      ctx.beginPath(); ctx.moveTo(25, 5); ctx.lineTo(33, -2); ctx.lineTo(24, 2); ctx.closePath(); ctx.fill();
      // Soul-lit sockets
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      ctx.fillStyle = '#22d3ee';
      ctx.fillRect(11, 8, 4, 3);
      ctx.fillRect(20, 8, 4, 3);
      ctx.fillStyle = '#a5f3fc';
      ctx.fillRect(12, 9, 2, 1);
      ctx.fillRect(21, 9, 2, 1);
      ctx.restore();
      ctx.fillStyle = '#57534e';
      ctx.fillRect(13, 14, 9, 3);
      // Shield arm
      ctx.fillStyle = boneDark;
      ctx.fillRect(this.width - 4, 18, 7, 18);
      ctx.fillStyle = '#f5f5f4';
      ctx.fillRect(this.width - 3, 20, 5, 6);
    } else {
      // ---- Skeleton: articulated limbs, ribcage, skull, glowing sockets ----
      ctx.strokeStyle = bone;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(6, 20 - step); ctx.lineTo(6, this.height - 3);
      ctx.moveTo(this.width - 8, 20 + step); ctx.lineTo(this.width - 8, this.height - 3);
      ctx.stroke();
      ctx.fillStyle = boneDark;
      ctx.fillRect(5, 18, this.width - 10, 14);
      ctx.fillStyle = bone;
      for (let i = 0; i < 3; i++) ctx.fillRect(7, 19 + i * 4, this.width - 14, 1.6);
      ctx.fillStyle = '#d6d3d1';
      ctx.fillRect(this.width / 2 - 1, 12, 3, 22);
      ctx.fillRect(5, 2, 12, 11);
      ctx.fillStyle = '#f5f5f4';
      ctx.fillRect(6, 3, 10, 6);
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      ctx.fillStyle = this.species === 'bone_archer' ? '#a855f7' : '#22d3ee';
      ctx.fillRect(7, 5, 3, 3);
      ctx.fillRect(12, 5, 3, 3);
      ctx.restore();
      ctx.fillStyle = '#57534e';
      ctx.fillRect(8, 9, 6, 2);
      if (this.species === 'bone_archer') {
        // A bow of fused ribs; the string never sags.
        ctx.strokeStyle = '#d6d3d1';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(this.width - 1, 18, 8, -1.2, 1.2);
        ctx.stroke();
        ctx.strokeStyle = '#f5f5f4';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(this.width + 2, 11);
        ctx.lineTo(this.width + 2, 25);
        ctx.stroke();
      } else {
        // Rusty shortsword, held forward.
        ctx.fillStyle = '#78716c';
        ctx.fillRect(this.width - 4, 14, 14, 3);
        ctx.fillStyle = '#d6d3d1';
        ctx.beginPath();
        ctx.moveTo(this.width + 10, 15.5);
        ctx.lineTo(this.width + 16, 14);
        ctx.lineTo(this.width + 16, 17);
        ctx.closePath();
        ctx.fill();
      }
    }
    if (this.hitFlash > 0) {
      ctx.globalAlpha = Math.min(0.8, this.hitFlash * 6);
      ctx.fillStyle = '#fff';
      ctx.fillRect(-2, -2, this.width + 4, this.height + 4);
    }
    ctx.restore();
    this.renderHealthBar(ctx, sx, sy);
  }

}
// ============================================================
// 6. SKELETON DRAGON, THE OSSUARY SOVEREIGN
// ============================================================
// The final boss. It is a segmented serpent: a skull head that flies, and
// eighteen vertebrae that follow it through the arena. Three phases, seven
// attacks, and every one of them is telegraphed — the fight is meant to be
// brutal but always readable, which is the line between "Terraria hard" and
// "unfair".
//
//   Phase 1 · Ossuary Wake   — bone volleys, grave rings, first skeletons
//   Phase 2 · Grave Storm    — + meteor rain, + diving charges
//   Phase 3 · Withering Star — + triple soul beams, minion pressure, cataclysm

class SkeletonDragonBoss {
  constructor(x, y, game = null) {
    this.kind = 'dragon';
    this.x = x;
    this.y = y;
    this.width = 96;
    this.height = 74;
    this.vx = 0;
    this.vy = 0;
    this.facing = -1;
    // The apex of the game. Everything the world can throw at the player has
    // been practice for this: a six-figure health pool with no i-frames means
    // sustained damage is rewarded, and the fight simply cannot be out-traded.
    // The phases break at 66% and 33%, so each third is a fight in its own
    // right. It used to be 100,000 — full Voidstar Cleaver swings into a
    // fully-soaked plate stretched the last third past the point of being a
    // test of patience rather than a test of reads, so the pool came down 12%.
    this.maxHp = 88000;
    this.hp = 88000;
    this.phase = 1;
    this.name = 'SKELETON DRAGON, THE OSSUARY SOVEREIGN';
    this.dead = false;
    this.lightRadius = 520;
    this.glowRadius = 300;
    this.lightColor = [196, 181, 253];
    this.game = game;
    this.hitFlash = 0;
    this.animT = 0;
    this.attackState = 'stalk';
    this.stateTimer = 1.8;
    this.telegraph = null;
    this.lastAttack = '';
    this.attackHistory = [];
    this.minionTimer = 8;
    this.aura = 0;
    this.trail = [];
    // ---- The serpentine body: head first, then vertebrae that follow it ----
    this.segments = [];
    for (let i = 0; i < 18; i++) this.segments.push({ x: x - i * 22, y, angle: Math.PI });
    // ---- Beam sweep (phase 3) ----
    this.beaming = false;
    this.beamTimer = 0;
    this.beamAngle = 0;
    // ---- Diving charge ----
    this.dashing = false;
    this.dashTimer = 0;
    this.dashDir = { x: -1, y: 0 };
    this.dashHitPlayer = false;
    // How long the skull has been inside rock. See unstick().
    this.stuckTimer = 0;
    // Blows landing on the spine instead of the skull are worth 8% less. The
    // whole serpent is hittable (see hitTargets/nearestHitTarget), but the head
    // is where the killing work happens, so the body must never out-DPS it.
    this.bodyDamageScale = 0.92;
    // ---- Cataclysm ----
    this.cataclysmCooldown = 16;
    // DemonBoss carries its own poison state (it does not extend Monster), and
    // the melee path feature-detects it. Same shape here.
    this.poisonTime = 0;
    this.poisonTick = 0;
    this.poisonDps = 0;
  }

  get phaseName() {
    return this.phase === 3 ? 'PHASE 3 · Withering Star'
      : this.phase === 2 ? 'PHASE 2 · Grave Storm'
        : 'PHASE 1 · Ossuary Wake';
  }

  /** Hellfire Venom on the Sovereign. Same refresh-the-stronger contract. */
  applyPoison(duration, dps, particleSystem) {
    if (this.dead) return false;
    this.poisonTime = Math.max(this.poisonTime, duration);
    this.poisonDps = Math.max(this.poisonDps, dps);
    if (this.poisonTick <= 0) this.poisonTick = 0.5;
    if (particleSystem) particleSystem.magicSparkle(this.x + this.width / 2, this.y + this.height / 2, '#84cc16', 8);
    return true;
  }

  tickPoison(dt, particleSystem) {
    if (this.dead || this.poisonTime <= 0) return 0;
    this.poisonTime = Math.max(0, this.poisonTime - dt);
    this.poisonTick -= dt;
    if (this.poisonTick > 0) return 0;
    this.poisonTick = 0.5;
    const dealt = Math.max(1, Math.round(this.poisonDps * 0.5));
    this.hp -= dealt;
    this.hitFlash = Math.max(this.hitFlash, 0.06);
    if (particleSystem) particleSystem.addDamageText(this.x + this.width / 2, this.y, dealt, '#84cc16', false);
    if (this.poisonTime <= 0) this.poisonDps = 0;
    if (this.hp <= 0) {
      this.hp = 0;
      this.dead = true;
      if (particleSystem) particleSystem.magicSparkle(this.x + this.width / 2, this.y + this.height / 2, '#fde047', 120);
    }
    return dealt;
  }

  takeDamage(amount, soundSystem, particleSystem, isCrit = false) {
    if (this.dead) return 0;
    const dealt = Math.max(1, Math.round(amount));
    this.hp -= dealt;
    this.hitFlash = 0.1;
    if (soundSystem) soundSystem.playHit();
    if (particleSystem) {
      particleSystem.addDamageText(this.x + this.width / 2, this.y + 10, dealt, isCrit ? '#fbbf24' : '#f8fafc', isCrit);
      particleSystem.bloodBurst(this.x + this.width / 2, this.y + this.height / 2, '#d6d3d1', isCrit ? 20 : 12);
    }
    const nextPhase = this.hp <= this.maxHp * 0.33 ? 3 : this.hp <= this.maxHp * 0.66 ? 2 : 1;
    if (nextPhase > this.phase) this.enterPhase(nextPhase, soundSystem, particleSystem);
    if (this.hp <= 0) {
      this.hp = 0;
      this.dead = true;
      if (soundSystem) soundSystem.playExplosion();
      if (this.game && this.game.feel) this.game.feel.shake(2.0);
      if (particleSystem) {
        particleSystem.magicSparkle(this.x + this.width / 2, this.y + this.height / 2, '#fde047', 140);
        // The body comes apart on the spot: bone chips explode out of the
        // skull before the staged DragonFinale takes over on the next frame.
        particleSystem.bloodBurst(this.x + this.width / 2, this.y + this.height / 2, '#e7e5e4', 30);
      }
    }
    return dealt;
  }

  enterPhase(nextPhase, soundSystem, particleSystem) {
    this.phase = nextPhase;
    this.name = nextPhase === 3 ? 'SKELETON DRAGON, THE WITHERING STAR'
      : nextPhase === 2 ? 'SKELETON DRAGON, LORD OF THE GRAVE'
        : 'SKELETON DRAGON, THE OSSUARY SOVEREIGN';
    this.lightRadius = nextPhase === 3 ? 600 : 540;
    this.glowRadius = nextPhase === 3 ? 340 : 300;
    this.aura = 1;
    // Every phase change summons reinforcements: the arena is never quiet.
    this.summonMinions(this.game ? this.game.projectiles : [], soundSystem, particleSystem);
    if (soundSystem) soundSystem.playBossRoar();
    if (this.game && this.game.feel) {
      this.game.feel.stop(0.2, 0.04);
      this.game.feel.slow(1.6, 0.22);
      this.game.feel.shake(1.6);
    }
    if (this.game && this.game.showAnnouncement) {
      this.game.showAnnouncement(nextPhase === 3
        ? '💀 THE SOVEREIGN BECOMES A STAR OF DEATH!'
        : '🦴 THE OSSUARY SOVEREIGN SPLITS ITS BONES!');
    }
    if (particleSystem) particleSystem.magicSparkle(this.x + this.width / 2, this.y + this.height / 2, '#c4b5fd', 90);
  }

  /** The arena box this fight is fenced into (see World.generateSpaceArena). */
  arenaBounds(world) {
    const a = world && world.spaceArena;
    if (!a) return null;
    return {
      left: a.left * TILE_SIZE,
      right: (a.right + 1) * TILE_SIZE - this.width,
      top: (a.top + 3) * TILE_SIZE,
      bottom: (a.floorY + 1) * TILE_SIZE - this.height
    };
  }

  /**
   * Does this tile physically stop the dragon?
   *
   * One-way star platforms and loose bone piles deliberately do NOT. They are
   * the player's dodge route, and counting them as rock is exactly what made
   * the Sovereign claw at its own arena and stall mid-sweep. Everything else —
   * void stone, asteroid, rune brick — is real rock, and generateSpaceArena now
   * keeps every block of it outside the flight box.
   */
  blocksDragon(tx, ty) {
    const world = this.game && this.game.world;
    if (!world || typeof world.getTile !== 'function') return false;
    const tile = world.getTile(tx, ty);
    if (!tile || tile === TILES.AIR) return false;
    const prop = TILE_PROPERTIES[tile];
    if (!prop || !prop.solid) return false;
    if (prop.isPlatform) return false;
    if (tile === TILES.BONE_PILE) return false;   // loose bones: it comes through
    return true;
  }

  /** True when the dragon's skull sits inside rock at this position. */
  wedgedAt(x, y) {
    return this.blocksDragon(
      Math.floor((x + this.width / 2) / TILE_SIZE),
      Math.floor((y + this.height / 2) / TILE_SIZE)
    );
  }

  /**
   * Clamp a candidate position into the arena box.
   *
   * Rock is deliberately no longer nudged out of the way here. The old version
   * lifted the dragon a tile per frame whenever its centre touched anything
   * solid — including its own platforms — which is how it ended up jerking and
   * wedging. Anything still inside rock is handled by unstick() below.
   */
  clampToArena(x, y, world) {
    const b = this.arenaBounds(world);
    if (!b) return { x, y };
    return {
      x: Math.max(b.left, Math.min(b.right, x)),
      y: Math.max(b.top, Math.min(b.bottom, y))
    };
  }

  /**
   * The nearest open position, searched as an expanding ring so the head slides
   * out along the shortest way rather than being yanked. Null only if the whole
   * box is plugged.
   */
  nearestOpenSpot(x, y, world) {
    const b = this.arenaBounds(world);
    if (!b) return { x, y };
    for (let r = 1; r <= 16; r++) {
      for (let i = 0; i < 16; i++) {
        const a = (i / 16) * Math.PI * 2;
        const nx = Math.max(b.left, Math.min(b.right, x + Math.cos(a) * r * TILE_SIZE));
        const ny = Math.max(b.top, Math.min(b.bottom, y + Math.sin(a) * r * TILE_SIZE));
        if (this.wedgedAt(nx, ny)) continue;
        return { x: nx, y: ny };
      }
    }
    return null;
  }

  /**
   * Get unstuck, every frame. The moment the skull is inside rock a timer
   * starts and the head eases toward the nearest open lane at a visible speed;
   * if the rock somehow cannot be left — a player who mined the arena and
   * stacked stone across the lane — the dragon is placed in the open after a
   * second and a half. The fight can never be won by hiding in a tunnel, and
   * the Sovereign can never be stranded inside a rock.
   */
  unstick(dt, world) {
    if (!world) return false;
    if (!this.wedgedAt(this.x, this.y)) { this.stuckTimer = 0; return false; }
    this.stuckTimer = (this.stuckTimer || 0) + dt;
    const target = this.nearestOpenSpot(this.x, this.y, world);
    if (!target) return false;
    const dx = target.x - this.x;
    const dy = target.y - this.y;
    const len = Math.hypot(dx, dy) || 1;
    this.dashing = false;
    if (this.stuckTimer > 1.5) {
      this.x = target.x;
      this.y = target.y;
      this.vx = 0;
      this.vy = 0;
      this.stuckTimer = 0;
      return true;
    }
    const glide = Math.min(len, 2.5 + this.stuckTimer * 9);
    this.x += (dx / len) * glide;
    this.y += (dy / len) * glide;
    return true;
  }

  /**
   * Every hittable point on the dragon: the skull plus a spine node every third
   * vertebra. The Game routes melee swings and player projectiles through this,
   * so the whole serpent is a target instead of just its head — a long boss you
   * can only hurt at the tip is a boss nobody can hit while it flies.
   *
   * Each point carries `head`, and the caller multiplies the blow by
   * `bodyDamageScale` when it is false: the spine is flesh-of-the-skeleton and
   * takes the hit, but the skull is where the killing blows land.
   */
  hitTargets() {
    const list = [{ x: this.x + this.width / 2, y: this.y + this.height / 2, r: this.width / 2, head: true }];
    for (let i = 1; i < this.segments.length; i += 3) {
      const s = this.segments[i];
      list.push({ x: s.x, y: s.y, r: 30, head: false });
    }
    return list;
  }

  /**
   * The hittable point nearest (x, y) that lies within `reach` of it, or null
   * when the dragon is clean out of range. `reach` is the weapon's range for a
   * swing and 0 for a point-in-circle test, so callers can pass whatever their
   * own collision shape implies. The skull wins ties: hit it on purpose.
   */
  nearestHitTarget(x, y, reach = 0) {
    let best = null;
    let bestGap = Infinity;
    for (const t of this.hitTargets()) {
      const gap = Math.hypot(t.x - x, t.y - y) - t.r;
      if (gap > reach) continue;
      if (gap < bestGap - 0.001 || (Math.abs(gap - bestGap) < 0.001 && t.head)) {
        bestGap = gap;
        best = t;
      }
    }
    return best;
  }

  /**
   * What a blow landing on the spine rather than the skull is worth: 8% less
   * (see `bodyDamageScale`, set in the constructor). Body hits are the reward
   * for committing to the serpent instead of dancing under its head, so the tax
   * is small enough to always be worth taking and large enough that sniping the
   * skull still pays best.
   */
  scaleDamageFor(target, amount) {
    if (!target || target.head) return Math.max(1, Math.round(amount));
    return Math.max(1, Math.round(amount * this.bodyDamageScale));
  }

  /** True when any part of the serpent overlaps the player. */
  overlapsPlayer(player) {
    const px = player.x + player.width / 2;
    const py = player.y + player.height / 2;
    const half = (player.width + this.width) / 2;
    if (Math.hypot(px - (this.x + this.width / 2), py - (this.y + this.height / 2)) < half) return true;
    for (const s of this.segments) {
      if (Math.hypot(px - s.x, py - s.y) < 26 + player.width / 2) return true;
    }
    return false;
  }

  /** Contact damage, scaled hard by phase — this is the final boss. */
  touchDamage() {
    return this.dashing
      ? ([0, 128, 158, 188][this.phase] || 128)
      : ([0, 80, 105, 130][this.phase] || 80);
  }

  /** Where minions are allowed to be summoned: the arena floor, spread out. */
  summonSpots(count) {
    const world = this.game && this.game.world;
    const a = world && world.spaceArena;
    const floorY = (a ? a.floorY : Math.floor(this.y / TILE_SIZE) + 6) * TILE_SIZE - 48;
    const spots = [];
    for (let i = 0; i < count; i++) {
      const offset = (i - (count - 1) / 2) * 74;
      const x = this.x + this.width / 2 + offset + (Math.random() - 0.5) * 26;
      spots.push({ x, y: floorY });
    }
    return spots;
  }

  /** 14–26 homing bone shards fanned toward the player. */
  spawnBoneVolley(projectiles, player, soundSystem, particleSystem) {
    const count = this.phase === 1 ? 14 : this.phase === 2 ? 20 : 26;
    const damage = [0, 60, 76, 92][this.phase];
    const spread = this.phase === 1 ? 1.15 : this.phase === 2 ? 1.5 : 1.9;
    const cx = this.x + this.width / 2;
    const cy = this.y + this.height / 2;
    const base = Math.atan2(player.y + player.height / 2 - cy, player.x + player.width / 2 - cx);
    for (let i = 0; i < count; i++) {
      const a = base + (i / (count - 1) - 0.5) * spread;
      const speed = 5.6 + this.phase * 0.5;
      const shard = spawnSpaceProjectile(projectiles, cx, cy,
        Math.cos(a) * speed, Math.sin(a) * speed,
        'bone_shard', damage, 4.4, 70, [226, 232, 240]);
      shard.target = player;
      shard.homing = true;
      shard.homingTime = this.phase === 1 ? 0.5 : this.phase === 2 ? 0.75 : 1.0;
      shard.homingStrength = this.phase === 1 ? 0.04 : 0.055;
    }
    if (soundSystem) soundSystem.playBossLaser();
    if (particleSystem) particleSystem.magicSparkle(cx, cy, '#e7e5e4', 30);
  }

  /**
   * Grave rings: two counter-rotating circles of soul orbs, with a delayed
   * third ring in phase 3. Every ring leaves a moving gap, so the answer is
   * always "walk the gap", never "stand still and tank it".
   */
  spawnGraveRing(projectiles, soundSystem, particleSystem, ringIndex = 0) {
    const count = (this.phase === 1 ? 18 : this.phase === 2 ? 24 : 30) + ringIndex * 4;
    const damage = [0, 54, 69, 84][this.phase];
    const speed = 4.0 + this.phase * 0.45;
    const cx = this.x + this.width / 2;
    const cy = this.y + this.height / 2;
    const spin = ringIndex * 0.22 + this.animT * 0.05;
    for (let i = 0; i < count; i++) {
      const a = (i / count) * Math.PI * 2 + spin * (ringIndex % 2 ? -1 : 1);
      spawnSpaceProjectile(projectiles, cx, cy,
        Math.cos(a) * speed, Math.sin(a) * speed,
        ringIndex % 2 ? 'grave_orb' : 'soul_flame', damage, 6.0, 90,
        ringIndex % 2 ? [192, 132, 252] : [45, 212, 191]);
    }
    if (soundSystem) soundSystem.playBossLaser();
    if (particleSystem) particleSystem.magicSparkle(cx, cy, '#a855f7', 36);
  }

  /**
   * Meteor rain. Meteors fall from the top of the arena onto telegraphed impact
   * columns, and they keep their own gravity, so the danger is positional: the
   * marks tell you exactly which lanes to leave, and the phase decides how many
   * lanes are left.
   */
  spawnMeteorRain(projectiles, player, soundSystem, particleSystem) {
    const count = this.phase === 1 ? 7 : this.phase === 2 ? 11 : 15;
    const damage = [0, 78, 98, 118][this.phase];
    const world = this.game && this.game.world;
    const a = world && world.spaceArena;
    const leftPx = (a ? a.left : 0) * TILE_SIZE;
    const rightPx = (a ? a.right : world ? world.width : 100) * TILE_SIZE;
    const span = Math.max(240, rightPx - leftPx);
    // The first strike aims at the player, the rest spread across the arena.
    for (let i = 0; i < count; i++) {
      const t = count === 1 ? 0.5 : i / (count - 1);
      const aimAtPlayer = i === 0;
      const x = aimAtPlayer
        ? player.x + player.width / 2
        : leftPx + 40 + t * (span - 80) + (Math.random() - 0.5) * 30;
      const meteor = spawnSpaceProjectile(projectiles, x, (a ? a.top - 4 : 0) * TILE_SIZE,
        (Math.random() - 0.5) * 1.2, 3.2 + this.phase * 0.5,
        'meteor', damage, 9.0, 170, [249, 115, 22]);
      meteor.hitRadius = 34;
      meteor.impactX = x;
    }
    if (soundSystem) soundSystem.playBossRoar();
    if (particleSystem) particleSystem.magicSparkle(this.x + this.width / 2, this.y + this.height / 2, '#f97316', 34);
  }

  /**
   * How many skeletons the next wave would actually raise: the phase's wave
   * size clamped by whatever is already standing (never past MINION_CAP).
   *
   * This is the one number both halves of a summon agree on — summonMinions
   * spawns it and renderTelegraph draws exactly that many rise circles —
   * because a telegraph that reads the raw wave over-promises every time the
   * arena is near its cap, and drew the circles in the wrong places too
   * (summonSpots spaces its layout by the count it is given).
   */
  plannedWaveSize() {
    if (!this.game) return 0;
    const alive = this.game.monsters.filter(m => m.space && !m.dead).length;
    return Math.max(0, Math.min(
      this.phase === 1 ? 3 : this.phase === 2 ? 4 : 5,
      MINION_CAP - alive));
  }

  /**
   * Skeleton waves. Phase 1 sends warriors; phase 3 adds archers and a Bone
   * Colossus, which is the real "you cannot ignore the adds any more" moment.
   */
  summonMinions(projectiles, soundSystem, particleSystem) {
    if (!this.game) return 0;
    // A wave is a maximum, not a quota: whatever is already standing in the arena
    // counts against the cap. Clamping here is what makes the number mean
    // something — it used to be read only by the passive summon, so a phase
    // change could park a full wave on top of a full arena.
    const count = this.plannedWaveSize();
    if (count <= 0) {
      // Full house: check again soon rather than on the long phase timer, so the
      // first add to fall is replaced promptly instead of the arena sitting thin.
      this.minionTimer = 2;
      return 0;
    }
    const spots = this.summonSpots(count);
    let summoned = 0;
    for (let i = 0; i < count; i++) {
      const species = this.phase === 1
        ? 'skeleton_warrior'
        : this.phase === 2
          ? (i % 3 === 1 ? 'bone_archer' : 'skeleton_warrior')
          : (i === 0 ? 'bone_colossus' : i % 2 ? 'bone_archer' : 'skeleton_warrior');
      const spot = spots[i];
      const minion = new SkeletonMinion(spot.x, spot.y, species, this.game);
      // Minions scale with the phase on BOTH axes so late adds are a real
      // threat rather than a crowd of speed bumps, and with the player's own
      // progression so the fight does not get easier as the rest of the world
      // does. A phase-3 colossus is meant to be a second, smaller boss — but
      // "smaller" is the keyword: the multipliers used to be 0.35/0.30, which
      // stacked on the already-raised base stats to put a phase-3 warrior above
      // the Demon's own hits while the dragon was still sweeping the arena.
      const phaseScale = 1 + (this.phase - 1) * 0.26;
      minion.damage = Math.round(minion.damage * (1 + (this.phase - 1) * 0.22));
      minion.hp = minion.maxHp = Math.round(minion.maxHp * phaseScale);
      minion.speed = +(minion.speed * (1 + (this.phase - 1) * 0.08)).toFixed(2);
      this.game.monsters.push(minion);
      summoned++;
      if (particleSystem) {
        particleSystem.bloodBurst(minion.x + minion.width / 2, minion.y + minion.height / 2, '#e7e5e4', 16);
        particleSystem.magicSparkle(minion.x + minion.width / 2, minion.y, '#22d3ee', 12);
      }
    }
    if (soundSystem) soundSystem.playBossRoar();
    this.minionTimer = this.phase === 3 ? 6 : this.phase === 2 ? 9 : 12;
    return summoned;
  }

  /** Phase 3: three rotating arms of spectral breath, sweeping the arena. */
  startBeam(projectiles, player, soundSystem, particleSystem) {
    this.beaming = true;
    this.beamTimer = 3.4;
    this.beamAngle = Math.atan2(
      (player.y + player.height / 2) - (this.y + this.height / 2),
      (player.x + player.width / 2) - (this.x + this.width / 2)
    );
    this._beamEmit = 0;
    if (soundSystem) soundSystem.playBossLaser();
    if (particleSystem) particleSystem.magicSparkle(this.x + this.width / 2, this.y + this.height / 2, '#22d3ee', 44);
  }

  updateBeam(dt, projectiles, soundSystem, particleSystem) {
    if (!this.beaming) return;
    this.beamTimer -= dt;
    this.beamAngle += dt * 0.95;
    const cx = this.x + this.width / 2;
    const cy = this.y + this.height / 2;
    this._beamEmit = (this._beamEmit || 0) + dt;
    if (this._beamEmit >= 0.1) {
      this._beamEmit = 0;
      for (const offset of [0, (Math.PI * 2) / 3, (Math.PI * 4) / 3]) {
        const a = this.beamAngle + offset;
        const bolt = spawnSpaceProjectile(projectiles, cx, cy,
          Math.cos(a) * 8.4, Math.sin(a) * 8.4,
          'dragon_breath', 80, 2.6, 80, [34, 211, 238]);
        bolt.hitRadius = 22;
      }
      if (particleSystem && Math.random() < 0.6) particleSystem.magicSparkle(cx, cy, '#67e8f9', 4);
    }
    if (this.beamTimer <= 0) {
      this.beaming = false;
      this.beamTimer = 0;
      if (soundSystem) soundSystem.playBossLaser();
    }
  }

  /**
   * The diving charge. The dragon rears back, locks a lane onto the player, and
   * then rockets down it — the telegraph is long, the punish is huge, and the
   * recovery window is the reward for reading it. While charging it sheds a wall
   * of shards behind it, so following it is the wrong instinct.
   */
  startDash(projectiles, player, soundSystem, particleSystem) {
    const cx = this.x + this.width / 2;
    const cy = this.y + this.height / 2;
    const dx = (player.x + player.width / 2) - cx;
    const dy = (player.y + player.height / 2) - cy;
    const len = Math.hypot(dx, dy) || 1;
    this.dashDir = { x: dx / len, y: dy / len };
    this.dashing = true;
    this.dashTimer = 0.85 + this.phase * 0.08;
    this.dashHitPlayer = false;
    this.dashSpeed = 13 + this.phase * 1.6;
    if (soundSystem) soundSystem.playBossRoar();
    if (particleSystem) particleSystem.magicSparkle(cx, cy, '#f472b6', 40);
  }

  updateDash(dt, world, projectiles, soundSystem, particleSystem) {
    if (!this.dashing) return;
    const cx = this.x + this.width / 2;
    const cy = this.y + this.height / 2;
    const speed = this.dashSpeed;
    // A short wind-up, then the lunge itself.
    if (this.dashTimer > 0.25) {
      this.vx = this.dashDir.x * speed * 0.22;
      this.vy = this.dashDir.y * speed * 0.22;
    } else {
      this.vx = this.dashDir.x * speed;
      this.vy = this.dashDir.y * speed;
      if (particleSystem) {
        for (let i = 0; i < 3; i++) {
          particleSystem.addParticle(
            cx + (Math.random() - 0.5) * 80, cy + (Math.random() - 0.5) * 60,
            (Math.random() - 0.5) * 1.4, (Math.random() - 0.5) * 1.4 - 0.4,
            i === 0 ? '#ffffff' : i === 1 ? '#c4b5fd' : '#7c3aed',
            2 + Math.random() * 4, 0.5, -0.01, true
          );
        }
      }
      // Shards shed along the charge lane.
      this._dashEmit = (this._dashEmit || 0) + dt;
      if (this._dashEmit > 0.22 && projectiles) {
        this._dashEmit = 0;
        const a = Math.atan2(this.dashDir.y, this.dashDir.x) + Math.PI / 2;
        for (const side of [1, -1]) {
          spawnSpaceProjectile(projectiles, cx, cy,
            Math.cos(a) * side * 3.2 - this.dashDir.x * 1.6,
            Math.sin(a) * side * 3.2 - this.dashDir.y * 1.6,
            'bone_shard', 70, 2.4, 60, [226, 232, 240]);
        }
      }
    }
    const next = this.clampToArena(this.x + this.vx, this.y + this.vy, world);
    this.vx = next.x - this.x;
    this.vy = next.y - this.y;
    this.x = next.x;
    this.y = next.y;
    this.dashTimer -= dt;
    if (this.dashTimer <= 0) {
      this.dashing = false;
      const aim = this.game && this.game.player ? this.game.player : { x: this.x, y: this.y, width: 0, height: 0 };
      if (projectiles) this.spawnBoneVolley(projectiles, aim, soundSystem, particleSystem);
    }
  }

  /**
   * CATACLYSM (phase 3): the signature. Everything at once — a grave ring, a
   * meteor storm, a fresh skeleton wave and a beam sweep — behind a long,
   * obvious wind-up. It is survivable only by using the whole arena.
   */
  cataclysm(projectiles, player, soundSystem, particleSystem) {
    this.spawnGraveRing(projectiles, soundSystem, particleSystem, 0);
    this.spawnMeteorRain(projectiles, player, soundSystem, particleSystem);
    this.summonMinions(projectiles, soundSystem, particleSystem);
    this.startBeam(projectiles, player, soundSystem, particleSystem);
    if (particleSystem) {
      particleSystem.magicSparkle(this.x + this.width / 2, this.y + this.height / 2, '#f0abfc', 120);
      for (let i = 0; i < 40; i++) {
        const a = (i / 40) * Math.PI * 2;
        particleSystem.addParticle(
          this.x + this.width / 2, this.y + this.height / 2,
          Math.cos(a) * 4.6, Math.sin(a) * 4.6,
          i % 3 === 0 ? '#ffffff' : i % 3 === 1 ? '#c4b5fd' : '#22d3ee',
          3, 0.9, 0, true
        );
      }
    }
    if (this.game && this.game.feel) {
      this.game.feel.shake(1.7);
      this.game.feel.slow(1.3, 0.2);
    }
    if (this.game && this.game.showAnnouncement) this.game.showAnnouncement('☄️ CATACLYSM — THE STARS FALL!');
  }

  chooseAttack(player) {
    // Phase 3 weights cataclysm heavily and never repeats the same attack back
    // to back, so the fight escalates instead of looping one move.
    const options = this.phase === 1
      ? ['volley', 'ring', 'summon', 'volley']
      : this.phase === 2
        ? ['volley', 'ring', 'meteor', 'dash', 'summon']
        : ['volley', 'ring', 'meteor', 'dash', 'beam', 'cataclysm', 'cataclysm', 'ring'];
    let choice = options[Math.floor(Math.random() * options.length)];
    if (choice === this.lastAttack && options.length > 1) {
      choice = options[(options.indexOf(choice) + 1) % options.length];
    }
    this.lastAttack = choice;
    this.attackHistory.push(choice);
    if (this.attackHistory.length > 6) this.attackHistory.shift();
    const tell = choice === 'dash' ? 0.95
      : choice === 'meteor' ? 0.95
        : choice === 'beam' ? 0.9
          : choice === 'cataclysm' ? 1.5
            : choice === 'summon' ? 0.6 : 0.55;
    this.stateTimer = tell;
    this.telegraph = {
      type: choice === 'dash' ? 'line'
        : choice === 'meteor' ? 'target'
          : choice === 'beam' ? 'sweep'
            : choice === 'summon' ? 'summon'
              : choice === 'cataclysm' ? 'cataclysm' : 'ring',
      timer: tell,
      total: tell,
      x: player.x + player.width / 2,
      y: player.y + player.height / 2
    };
    this.attackState = `tell_${choice}`;
  }

  beginAttack(attack, player, projectiles, soundSystem, particleSystem) {
    if (attack === 'volley') this.spawnBoneVolley(projectiles, player, soundSystem, particleSystem);
    else if (attack === 'ring') this.spawnGraveRing(projectiles, soundSystem, particleSystem, 0);
    else if (attack === 'meteor') this.spawnMeteorRain(projectiles, player, soundSystem, particleSystem);
    else if (attack === 'dash') this.startDash(projectiles, player, soundSystem, particleSystem);
    else if (attack === 'beam') this.startBeam(projectiles, player, soundSystem, particleSystem);
    else if (attack === 'summon') this.summonMinions(projectiles, soundSystem, particleSystem);
    else if (attack === 'cataclysm') this.cataclysm(projectiles, player, soundSystem, particleSystem);
    this.telegraph = null;
    this.attackState = attack;
    this.stateTimer = attack === 'dash' ? 1.2 : attack === 'cataclysm' ? 1.1 : 0.6;
  }

  update(dt, player, projectiles, soundSystem, particleSystem, world) {
    if (this.dead) return;
    this.animT += dt;
    this.hitFlash = Math.max(0, this.hitFlash - dt);
    this.aura = Math.max(0, this.aura - dt * 0.5);
    this.minionTimer -= dt;
    this.cataclysmCooldown -= dt;

    // The sweep and the charge run on their own clocks so they can overlap the
    // stalk/tell state machine instead of serialising every attack.
    this.updateBeam(dt, projectiles, soundSystem, particleSystem);
    this.updateDash(dt, world, projectiles, soundSystem, particleSystem);

    // ---- Never wedge ----
    // The arena is generated with an empty flight box, so this should never
    // fire. It exists for the cases it can still: the player mining the crust
    // and stacking stone across a lane, or a dash aimed into a rune pillar.
    if (this.unstick(dt, world)) {
      this.updateSegments(dt);
      return;
    }

    // Fast afterimages for the dive and the weaving flight.
    const speed = Math.hypot(this.vx, this.vy);
    if (speed > 2.5 || this.dashing) {
      this.trail.push({ x: this.x, y: this.y, facing: this.facing, life: 0.32 });
      if (this.trail.length > 16) this.trail.shift();
    }
    for (let i = this.trail.length - 1; i >= 0; i--) {
      this.trail[i].life -= dt;
      if (this.trail[i].life <= 0) this.trail.splice(i, 1);
    }

    // ---- Passive pressure: the Sovereign never stops summoning ----
    if (this.minionTimer <= 0) {
      // Never more than MINION_CAP alive, or the arena turns into a mosh pit. It
      // used to be 12, which on top of the raised per-minion stats meant a
      // phase-3 screen was unreadable rather than hard. plannedWaveSize clamps
      // to the same number, so this branch is only the early-out.
      if (this.plannedWaveSize() > 0) this.summonMinions(projectiles, soundSystem, particleSystem);
      else this.minionTimer = 4;
    }
    if (this.phase === 3) {
      // A soul nova on its own clock: constant chip damage pressure that forces
      // the player to keep moving even between telegraphed attacks.
      this._novaTimer = (this._novaTimer === undefined ? 8 : this._novaTimer) - dt;
      if (this._novaTimer <= 0) {
        this._novaTimer = 8;
        this.spawnGraveRing(projectiles, soundSystem, particleSystem, 1);
      }
    }

    const px = player.x + player.width / 2;
    const py = player.y + player.height / 2;
    const cx = this.x + this.width / 2;
    const cy = this.y + this.height / 2;
    this.facing = px >= cx ? 1 : -1;
    const prevX = this.x;
    const prevY = this.y;
    this.stateTimer -= dt;

    if (this.attackState === 'stalk') {
      // Weaving flight: the head rides a sine wave above the player, and the
      // body follows it, so the fight reads as a serpent instead of a UFO.
      const targetX = px - this.facing * 210;
      const targetY = py - 200 + Math.sin(this.animT * 2.2) * 50;
      const rate = this.phase === 3 ? 3.4 : this.phase === 2 ? 2.8 : 2.3;
      const desired = this.clampToArena(
        this.x + (targetX - this.x) * Math.min(1, dt * rate),
        this.y + (targetY - this.y) * Math.min(1, dt * 2.2),
        world
      );
      // Hold station rather than grinding into rock: unstick() takes over on
      // the frame after if the holding spot is itself the problem.
      if (!this.wedgedAt(desired.x, desired.y)) {
        this.x = desired.x;
        this.y = desired.y;
      }
      if (this.stateTimer <= 0) this.chooseAttack(player);
    } else if (this.attackState.startsWith('tell_')) {
      if (this.telegraph) this.telegraph.timer = Math.max(0, this.stateTimer);
      if (this.stateTimer <= 0) {
        this.beginAttack(this.attackState.slice(5), player, projectiles, soundSystem, particleSystem);
      }
    } else if (this.stateTimer <= 0) {
      this.attackState = 'stalk';
      this.stateTimer = Math.max(0.55, 1.45 - this.phase * 0.22);
      this.telegraph = null;
    }

    // A scheduled cataclysm once phase 3 settles in, so the "everything at
    // once" moment is guaranteed to happen at least every ~24s.
    if (this.phase === 3 && this.cataclysmCooldown <= 0 && this.attackState === 'stalk') {
      this.cataclysmCooldown = 24;
      this.cataclysm(projectiles, player, soundSystem, particleSystem);
      this.attackState = 'cataclysm';
      this.stateTimer = 1.1;
    }

    // Record the head's own velocity for the afterimage and the aura.
    this.vx = this.x - prevX;
    this.vy = this.y - prevY;
    this.updateSegments(dt);
  }

  /**
   * Follow-the-leader spine. Each vertebra eases toward a point exactly one
   * spacing behind the one in front of it, with the vertical easing deliberately
   * softer than the horizontal — that asymmetry is what makes the body undulate
   * like a real serpent instead of dragging a rigid chain along.
   */
  updateSegments(dt) {
    const spacing = 22;
    let px = this.x + this.width / 2;
    let py = this.y + this.height / 2;
    for (let i = 0; i < this.segments.length; i++) {
      const s = this.segments[i];
      const dx = s.x - px;
      const dy = s.y - py;
      const dist = Math.hypot(dx, dy) || 1;
      const idealX = px + (dx / dist) * spacing;
      const idealY = py + (dy / dist) * spacing;
      s.x += (idealX - s.x) * Math.min(1, dt * 15);
      s.y += (idealY - s.y) * Math.min(1, dt * 9) + Math.sin(this.animT * 3 - i * 0.55) * 0.7;
      s.angle = Math.atan2(s.y - py, s.x - px);
      px = s.x;
      py = s.y;
    }
  }

  /**
   * The live triple beam, drawn as a fading trail of hot spokes under the body
   * so the skull stays readable while it sweeps.
   */
  renderBeam(ctx, camera) {
    if (!this.beaming) return;
    const cx = this.x + this.width / 2 - camera.x;
    const cy = this.y + this.height / 2 - camera.y;
    const fade = Math.max(0, Math.min(1, this.beamTimer / 0.7));
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    ctx.lineCap = 'round';
    for (const offset of [0, (Math.PI * 2) / 3, (Math.PI * 4) / 3]) {
      const a = this.beamAngle + offset;
      for (let i = 0; i < 3; i++) {
        ctx.globalAlpha = [0.5, 0.26, 0.13][i] * fade;
        ctx.lineWidth = [6, 14, 24][i];
        ctx.strokeStyle = ['#ffffff', '#67e8f9', '#0e7490'][i];
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.lineTo(cx + Math.cos(a) * 900, cy + Math.sin(a) * 900);
        ctx.stroke();
      }
    }
    ctx.restore();
  }

  render(ctx, camera) {
    const sx = this.x - camera.x;
    const sy = this.y - camera.y;
    const t = this.animT;
    const p3 = this.phase === 3;
    const edge = p3 ? '#f0abfc' : this.phase === 2 ? '#c4b5fd' : '#a5b4fc';

    this.renderBeam(ctx, camera);

    // ---- Afterimages while charging or weaving fast ----
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    for (const ghost of this.trail) {
      const a = Math.max(0, ghost.life / 0.32) * 0.22;
      ctx.globalAlpha = a;
      ctx.fillStyle = edge;
      ctx.fillRect(ghost.x - camera.x + 18, ghost.y - camera.y + 14, this.width - 36, this.height - 28);
    }
    ctx.restore();

    // ---- The spine: tail to neck, so the head lands on top ----
    for (let i = this.segments.length - 1; i >= 0; i--) {
      const s = this.segments[i];
      const seg = s.x - camera.x;
      const segy = s.y - camera.y;
      // Rib sway keeps the body from looking like a rigid chain of beads.
      const sway = Math.sin(t * 3.4 - i * 0.5) * 2.4;
      ctx.save();
      ctx.translate(seg, segy + sway);
      ctx.rotate(s.angle);
      if (p3) {
        ctx.save();
        ctx.globalCompositeOperation = 'lighter';
        ctx.globalAlpha = 0.16;
        ctx.fillStyle = '#a855f7';
        ctx.fillRect(-22, -24, 44, 46);
        ctx.restore();
      }
      // Vertebra plate
      ctx.fillStyle = '#a8a29e';
      ctx.fillRect(-11, -9, 22, 18);
      ctx.fillStyle = '#e7e5e4';
      ctx.fillRect(-9, -7, 18, 13);
      // Rib prongs (four per vertebra, front and back)
      ctx.fillStyle = '#d6d3d1';
      ctx.fillRect(-4, -14, 3, 6);
      ctx.fillRect(3, -14, 3, 6);
      ctx.fillRect(-4, 8, 3, 6);
      ctx.fillRect(3, 8, 3, 6);
      // Spine notch + a soul-lit vertebral core
      ctx.fillStyle = '#57534e';
      ctx.fillRect(-3, -4, 6, 8);
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      ctx.globalAlpha = 0.75 + Math.sin(t * 4 - i * 0.6) * 0.25;
      ctx.fillStyle = p3 ? '#f0abfc' : '#67e8f9';
      ctx.fillRect(-2, -3, 4, 6);
      ctx.restore();
      ctx.restore();
    }

    // ---- The skull: wings, horns, jaws and a soul-lit stare ----
    ctx.save();
    ctx.translate(sx, sy);
    if (this.facing === -1) { ctx.translate(this.width, 0); ctx.scale(-1, 1); }
    const flap = Math.sin(t * 2.6) * 9;
    const jawOpen = Math.sin(t * 5.2) * 3 + (this.dashing ? 4 : 0);

    // Wings first, so the skull reads on top of them: a bone arm with membrane
    // panels, flapping on a slow sine.
    for (const [dir, phase] of [[1, 0], [-1, 0.6]]) {
      ctx.save();
      ctx.translate(46, 30);
      ctx.scale(dir, 1);
      ctx.globalAlpha = 0.92;
      ctx.fillStyle = '#2f2a49';
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(-26, -18 - flap);
      ctx.lineTo(-8, 20 - flap * 0.4);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = '#443c6b';
      ctx.beginPath();
      ctx.moveTo(0, 4);
      ctx.lineTo(28, -14 - flap * 0.7);
      ctx.lineTo(34, 22 - flap * 0.3);
      ctx.lineTo(4, 26);
      ctx.closePath();
      ctx.fill();
      // Finger bones across the membrane.
      ctx.strokeStyle = '#d6d3d1';
      ctx.lineWidth = 2.4;
      for (const [ex, ey] of [[-22, -16], [-6, 14], [24, -10]]) {
        ctx.beginPath();
        ctx.moveTo(2, 4);
        ctx.lineTo(ex, ey - flap * 0.5 + phase);
        ctx.stroke();
      }
      ctx.restore();
    }

    // Neck ribcage joining the skull to the first vertebra.
    ctx.fillStyle = '#a8a29e';
    ctx.fillRect(-4, 34, 22, 26);
    ctx.fillStyle = '#e7e5e4';
    for (let i = 0; i < 4; i++) ctx.fillRect(-2, 36 + i * 6, 18, 2.6);

    // Horns: swept back over the skull.
    ctx.fillStyle = '#78716c';
    ctx.beginPath();
    ctx.moveTo(30, 16); ctx.lineTo(58, 0); ctx.lineTo(34, 26); ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#a8a29e';
    ctx.beginPath();
    ctx.moveTo(28, 40); ctx.lineTo(54, 54); ctx.lineTo(28, 50); ctx.closePath();
    ctx.fill();

    // Skull plate + brow ridge.
    ctx.fillStyle = '#c7c3bf';
    ctx.beginPath();
    ctx.moveTo(88, 30);
    ctx.lineTo(70, 10);
    ctx.lineTo(34, 12);
    ctx.lineTo(26, 34);
    ctx.lineTo(36, 56);
    ctx.lineTo(72, 60);
    ctx.lineTo(90, 46);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#e7e5e4';
    ctx.fillRect(34, 16, 42, 12);
    ctx.fillStyle = '#a8a29e';
    ctx.fillRect(30, 26, 52, 4);

    // Eye sockets: black pits with a burning core, brighter every phase.
    ctx.fillStyle = '#120b1f';
    ctx.fillRect(58, 28, 20, 13);
    ctx.fillRect(36, 30, 14, 11);
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    const glow = p3 ? 1 : this.phase === 2 ? 0.8 : 0.62;
    ctx.globalAlpha = (0.7 + Math.sin(t * 6) * 0.2) * glow;
    ctx.fillStyle = p3 ? '#f0abfc' : '#67e8f9';
    ctx.fillRect(60, 31, 16, 8);
    ctx.fillRect(38, 33, 10, 6);
    ctx.globalAlpha = 1;
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(62, 33, 5, 4);
    ctx.fillRect(40, 34, 3, 3);
    ctx.restore();

    // Snout, nostrils and a jaw full of teeth that actually opens.
    ctx.fillStyle = '#d6d3d1';
    ctx.fillRect(84, 34, 14, 12);
    ctx.fillStyle = '#57534e';
    ctx.fillRect(92, 37, 4, 3);
    ctx.fillStyle = '#b9b3ad';
    ctx.beginPath();
    ctx.moveTo(30, 54 + jawOpen);
    ctx.lineTo(92, 48 + jawOpen);
    ctx.lineTo(94, 58 + jawOpen);
    ctx.lineTo(32, 64 + jawOpen);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#f5f5f4';
    for (let i = 0; i < 8; i++) {
      const tx = 36 + i * 7.4;
      ctx.beginPath();
      ctx.moveTo(tx, 52 + jawOpen * 0.9);
      ctx.lineTo(tx + 3, 60 + jawOpen);
      ctx.lineTo(tx + 6, 52 + jawOpen * 0.9);
      ctx.closePath();
      ctx.fill();
    }

    // Phase 3: a mane of soul fire cracks off the skull and the spine.
    if (p3) {
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      for (let i = 0; i < 12; i++) {
        const a = t * 2.4 + i * 0.6;
        const lx = 26 - i * 4 + Math.sin(a) * 4;
        const ly = 20 - i * 1.6 - Math.abs(Math.cos(a)) * 14;
        ctx.globalAlpha = 0.4 - i * 0.02;
        ctx.fillStyle = i % 2 ? '#f0abfc' : '#a855f7';
        ctx.beginPath();
        ctx.ellipse(lx, ly, 12 - i * 0.5, 22 - i, 0, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    }
    ctx.restore();

    if (this.hitFlash > 0) {
      ctx.save();
      ctx.globalAlpha = Math.min(0.7, this.hitFlash * 6);
      ctx.fillStyle = '#fff';
      ctx.fillRect(sx - 2, sy - 2, this.width + 4, this.height + 4);
      ctx.restore();
    }

    this.renderTelegraph(ctx, camera);
  }

  /**
   * Attack wind-up markers. Every attack in this fight is announced before it
   * lands — that is the whole contract of a fair bullet-hell boss: nothing is
   * undodgeable, and nothing is unpredictable, it is just fast.
   */
  renderTelegraph(ctx, camera) {
    const tg = this.telegraph;
    if (!tg) return;
    // A summon the cap would swallow entirely has nothing to draw: bone circles
    // on the floor promise skeletons that cannot rise. Promising the raw wave
    // is exactly the mismatch plannedWaveSize exists to kill — return early
    // while the arena is full and draw only what will actually claw out.
    if (tg.type === 'summon' && this.plannedWaveSize() <= 0) return;
    const progress = 1 - Math.max(0, Math.min(1, tg.timer / Math.max(0.001, tg.total)));
    const cx = this.x + this.width / 2 - camera.x;
    const cy = this.y + this.height / 2 - camera.y;
    const pulse = 0.45 + Math.sin(Date.now() * 0.02) * 0.25;

    ctx.save();
    ctx.globalCompositeOperation = 'lighter';

    if (tg.type === 'line') {
      // Dash lane.
      const px = tg.x - camera.x;
      const py = tg.y - camera.y;
      const a = Math.atan2(py - cy, px - cx);
      ctx.globalAlpha = 0.25 + pulse;
      ctx.strokeStyle = '#f472b6';
      ctx.lineWidth = 3;
      ctx.setLineDash([12, 9]);
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(cx + Math.cos(a) * 1200, cy + Math.sin(a) * 1200);
      ctx.stroke();
      ctx.setLineDash([]);
      // Growing charge core.
      ctx.globalAlpha = 0.5 + progress * 0.5;
      ctx.fillStyle = '#fda4af';
      ctx.beginPath();
      ctx.arc(cx, cy, 26 + progress * 40, 0, Math.PI * 2);
      ctx.fill();
    } else if (tg.type === 'target' || tg.type === 'cataclysm') {
      // Meteor impact columns.
      const world = this.game && this.game.world;
      const a = world && world.spaceArena;
      const topY = (a ? a.top : 0) * TILE_SIZE - camera.y;
      const bottomY = (a ? a.floorY : world ? world.height : 100) * TILE_SIZE - camera.y;
      ctx.globalAlpha = 0.2 + pulse * 0.6;
      const columns = tg.type === 'cataclysm' ? 7 : this.phase === 3 ? 5 : 3;
      for (let i = 0; i < columns; i++) {
        const t = columns === 1 ? 0.5 : i / (columns - 1);
        const x = (this.game && this.game.world && this.game.world.spaceArena
          ? (this.game.world.spaceArena.left + 3 + t * (this.game.world.spaceArena.right - this.game.world.spaceArena.left - 6)) * TILE_SIZE
          : tg.x) - camera.x;
        ctx.fillStyle = '#f97316';
        ctx.globalAlpha = (0.12 + pulse * 0.14) * (0.5 + progress);
        ctx.fillRect(x - 14, topY, 28, bottomY - topY);
      }
      // The direct strike on the player is marked in a hotter colour.
      ctx.globalAlpha = 0.3 + progress * 0.5;
      ctx.fillStyle = '#fbbf24';
      ctx.fillRect(tg.x - camera.x - 12, topY, 24, bottomY - topY);
    } else if (tg.type === 'sweep') {
      // The three beams, drawn as thin spokes so the safe gap is obvious.
      ctx.globalAlpha = 0.2 + pulse * 0.4;
      ctx.strokeStyle = '#67e8f9';
      ctx.lineWidth = 2.5;
      for (const offset of [0, (Math.PI * 2) / 3, (Math.PI * 4) / 3]) {
        const a = this.beamAngle + offset;
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.lineTo(cx + Math.cos(a) * 900, cy + Math.sin(a) * 900);
        ctx.stroke();
      }
      ctx.globalAlpha = 0.35 + progress * 0.4;
      ctx.fillStyle = '#22d3ee';
      ctx.beginPath();
      ctx.arc(cx, cy, 20 + progress * 30, 0, Math.PI * 2);
      ctx.fill();
    } else if (tg.type === 'summon') {
      // Bone circles on the floor where the skeletons will rise — exactly as
      // many as summonMinions is about to spawn (same plannedWaveSize, same
      // count), so the promised layout is the risen layout.
      const planned = this.plannedWaveSize();
      const spots = this.summonSpots(planned);
      ctx.globalAlpha = 0.3 + progress * 0.5;
      ctx.strokeStyle = '#67e8f9';
      ctx.lineWidth = 2;
      for (const spot of spots) {
        ctx.beginPath();
        ctx.ellipse(spot.x - camera.x, spot.y - camera.y + 44, 26, 9, 0, 0, Math.PI * 2);
        ctx.stroke();
      }
    }

    if (tg.type === 'ring' || tg.type === 'cataclysm') {
      // Expanding warning rings around the skull.
      ctx.globalAlpha = 0.25 + progress * 0.45;
      ctx.strokeStyle = '#c084fc';
      ctx.lineWidth = 2;
      for (let i = 0; i < 3; i++) {
        const r = 40 + ((i * 60) + progress * 120) % 180;
        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, Math.PI * 2);
        ctx.stroke();
      }
    }
    ctx.restore();
  }
}

// ============================================================
// 7. THE WORMHOLE
// ============================================================
// The rift the beacon tears open. Four acts, driven by a single timer so the
// whole sequence is deterministic and cannot strand the player in a half-state:
//
//   open      1.10s  the tear rips open, debris starts orbiting
//   suck      1.90s  the player is pulled in on a spiral, spinning and shrinking
//   collapse  0.55s  the mouth slams shut on them and whites the screen out
//   (the Game performs the dimension swap inside the white-out, so the player
//    never sees the tile buffers change underneath them)
//
// The pull is applied by the FX itself rather than by the Game, so the motion
// and the art can never disagree about where the mouth is.

class WormholeFX {
  constructor(x, y, opts = {}) {
    this.x = x;
    this.y = y;
    this.radius = 0;
    this.maxRadius = opts.maxRadius || 190;
    this.phase = 'open';
    this.timer = 0;
    this.durations = { open: 1.10, suck: 1.90, collapse: 0.55 };
    this.spinAngle = 0;
    this.pullRadius = 700;
    this.done = false;
    this.flash = 0;
    this.rings = [];
    this.playerSpin = 0;
    this.playerScale = 1;
    this.ringSpin = 0;
    // Charged rifts are the ones the player has opened before: they tear faster
    // and wider, which is what makes "die and jump straight back in" feel instant
    // instead of replaying the full cinematic.
    this.charged = !!opts.charged;
    if (this.charged) {
      this.durations = { open: 0.55, suck: 0.95, collapse: 0.30 };
      this.maxRadius *= 1.1;
    }
  }

  get totalDuration() {
    return this.durations.open + this.durations.suck + this.durations.collapse;
  }

  /**
   * Advance the sequence. Returns 'done' on the frame the mouth closes so the
   * Game can swap dimensions while the screen is still white.
   */
  update(dt, player, particleSystem) {
    this.timer += dt;
    this.spinAngle += dt * (2.2 + (this.phase === 'suck' ? 5.5 : 0));
    this.ringSpin += dt * 1.15;
    this.flash = Math.max(0, this.flash - dt * 2.4);
    this.updateRings(dt, particleSystem);

    if (this.phase === 'open') {
      const t = Math.min(1, this.timer / this.durations.open);
      // Overshoot then settle: a rift should snap open, not inflate politely.
      const eased = 1 - Math.pow(1 - t, 3);
      this.radius = this.maxRadius * (eased + Math.sin(t * Math.PI) * 0.12);
      if (particleSystem) {
        for (let i = 0; i < 3; i++) {
          const a = Math.random() * Math.PI * 2;
          const r = this.radius * (0.6 + Math.random() * 0.7);
          particleSystem.addParticle(
            this.x + Math.cos(a) * r, this.y + Math.sin(a) * r * 0.7,
            -Math.cos(a) * 4, -Math.sin(a) * 2,
            Math.random() < 0.5 ? '#a5f3fc' : '#c4b5fd',
            2 + Math.random() * 2.5, 0.5, 0, true
          );
        }
      }
      if (t >= 1) { this.phase = 'suck'; this.timer = 0; }
      return null;
    }

    if (this.phase === 'suck') {
      this.radius = this.maxRadius * (1 - (this.timer / this.durations.suck) * 0.25);
      this.pull(dt, player, particleSystem);
      if (this.timer / this.durations.suck >= 1) { this.phase = 'collapse'; this.timer = 0; }
      return null;
    }

    // ---- collapse ----
    const t = Math.min(1, this.timer / this.durations.collapse);
    this.radius = this.maxRadius * 0.75 * (1 - t);
    this.flash = Math.max(this.flash, 0.35 + t * 0.65);
    this.playerScale = Math.max(0.03, this.playerScale * (1 - dt * 3.5));
    if (particleSystem) {
      for (let i = 0; i < 6; i++) {
        const a = Math.random() * Math.PI * 2;
        particleSystem.addParticle(
          this.x + Math.cos(a) * this.radius, this.y + Math.sin(a) * this.radius * 0.8,
          Math.cos(a) * 9, Math.sin(a) * 9,
          '#ffffff', 3, 0.4, 0, true
        );
      }
    }
    if (t >= 1) {
      if (this.done) return null;
      this.done = true;
      this.radius = 0;
      return 'done';
    }
    return null;
  }

  /**
   * Haul the player in along a spiral. The straight-line component accelerates,
   * and a tangent component spins them around the mouth so they visibly circle
   * the drain before falling in — straight-line suction reads as a teleport,
   * a spiral reads as being *eaten*.
   */
  pull(dt, player, particleSystem) {
    if (!player) return;
    const px = player.x + player.width / 2;
    const py = player.y + player.height / 2;
    const dx = this.x - px;
    const dy = this.y - py;
    const dist = Math.hypot(dx, dy) || 1;
    const closeness = 1 - Math.max(0, Math.min(1, dist / this.pullRadius));
    const inward = (110 + closeness * closeness * 1500) * dt;
    const tangent = (140 + closeness * 420) * dt;
    const nx = dx / dist;
    const ny = dy / dist;
    // Spiral: inward plus a perpendicular push, both growing as they close in.
    player.x += nx * inward - ny * tangent;
    player.y += ny * inward + nx * tangent;
    player.vx = nx * 6;
    player.vy = ny * 6;
    this.playerSpin += dt * (4 + closeness * 26);
    this.playerScale = Math.max(0.06, Math.min(1, dist / (this.pullRadius * 0.5)));
    if (particleSystem) {
      // The player trails stardust as they are dragged in.
      particleSystem.addParticle(
        px + (Math.random() - 0.5) * 14, py + (Math.random() - 0.5) * 20,
        -nx * 3 + (Math.random() - 0.5), -ny * 3 + (Math.random() - 0.5),
        Math.random() < 0.5 ? '#ffffff' : '#a5f3fc',
        2 + Math.random() * 2, 0.45, 0, true
      );
    }
  }

  /**
   * Infalling debris ring. These streaks are what the eye reads as "space is
   * being pulled into this thing", so they orbit faster the closer they are and
   * are swallowed once they cross the mouth.
   */
  updateRings(dt, particleSystem) {
    if (this.rings.length < 46 && this.phase !== 'collapse') {
      const a = Math.random() * Math.PI * 2;
      const r = this.radius * (1.1 + Math.random() * 2.4);
      this.rings.push({ a, r, speed: 0.6 + Math.random() * 1.9, size: 1 + Math.random() * 2.4, life: 1.6 });
    }
    for (let i = this.rings.length - 1; i >= 0; i--) {
      const ring = this.rings[i];
      ring.a += ring.speed * dt * 2.4;
      ring.r -= (26 + (this.radius * 2.2) / (ring.r + 40)) * dt * (this.phase === 'suck' ? 12 : 6);
      ring.life -= dt;
      if (ring.life <= 0 || ring.r < this.radius * 0.22) {
        if (particleSystem && this.radius > 12) {
          particleSystem.addParticle(
            this.x + Math.cos(ring.a) * Math.max(6, ring.r),
            this.y + Math.sin(ring.a) * Math.max(6, ring.r) * 0.8,
            Math.cos(ring.a + 1.4) * 3, Math.sin(ring.a + 1.4) * 3,
            '#e0f2fe', 2, 0.3, 0, true
          );
        }
        this.rings.splice(i, 1);
      }
    }
  }

  /**
   * The mouth itself, drawn into the world buffer.
   *
   * Layered deliberately: a light-bending halo, three counter-rotating accretion
   * rings, a spiral arm sweep, the infalling debris, and finally a perfectly
   * black core ringed by a razor-bright event horizon. The black core is what
   * sells it — everything additive around a hole in the picture.
   */
  render(ctx, camera) {
    if (this.radius <= 0.5) return;
    const cx = this.x - camera.x;
    const cy = this.y - camera.y;
    const r = this.radius;
    const t = Date.now() * 0.001;

    ctx.save();
    ctx.globalCompositeOperation = 'lighter';

    // 1. Gravitational lensing halo — a wide, faint, cold bloom.
    const halo = ctx.createRadialGradient(cx, cy, r * 0.2, cx, cy, r * 2.6);
    halo.addColorStop(0, 'rgba(165, 243, 252, 0.55)');
    halo.addColorStop(0.35, 'rgba(129, 140, 248, 0.22)');
    halo.addColorStop(1, 'rgba(30, 27, 75, 0)');
    ctx.fillStyle = halo;
    ctx.fillRect(cx - r * 2.6, cy - r * 2.6, r * 5.2, r * 5.2);

    // 2. Accretion rings: three ellipses at different tilts, spins and colours.
    for (let i = 0; i < 3; i++) {
      const rr = r * (1.25 + i * 0.5);
      const squash = 0.34 + i * 0.05;
      const spin = this.spinAngle * (i % 2 ? -1.5 : 2.4) + i;
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(spin * 0.1);
      ctx.globalAlpha = 0.5 - i * 0.12;
      ctx.strokeStyle = ['#e0f2fe', '#a5b4fc', '#7c3aed'][i];
      ctx.lineWidth = 9 - i * 2.4;
      ctx.beginPath();
      ctx.ellipse(0, 0, rr, rr * squash, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }

    // 3. Spiral arms: short arcs marching around the mouth.
    for (let arm = 0; arm < 5; arm++) {
      const base = this.spinAngle * 1.7 + (arm / 5) * Math.PI * 2;
      ctx.globalAlpha = 0.3;
      ctx.strokeStyle = arm % 2 ? '#67e8f9' : '#c4b5fd';
      ctx.lineWidth = 3;
      ctx.beginPath();
      for (let s = 0; s <= 1; s += 0.05) {
        const ang = base + s * 1.5;
        const rad = r * (0.55 + s * 0.95);
        const px = cx + Math.cos(ang) * rad;
        const py = cy + Math.sin(ang) * rad * 0.62;
        if (s === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
      }
      ctx.stroke();
    }

    // 4. Infalling debris, drawn as tangent streaks so motion is implied.
    for (const ring of this.rings) {
      const alpha = Math.max(0, Math.min(1, ring.life / 1.6));
      const px = cx + Math.cos(ring.a) * ring.r;
      const py = cy + Math.sin(ring.a) * ring.r * 0.8;
      ctx.globalAlpha = alpha * 0.9;
      ctx.fillStyle = ring.size > 2.4 ? '#ffffff' : '#bae6fd';
      ctx.save();
      ctx.translate(px, py);
      ctx.rotate(ring.a + Math.PI / 2);
      ctx.fillRect(-1, -ring.size * 3, 2.4, ring.size * 6);
      ctx.restore();
    }

    // 5. The event horizon: a hard black core with a white-hot rim.
    ctx.globalCompositeOperation = 'source-over';
    ctx.globalAlpha = 1;
    ctx.fillStyle = '#05010f';
    ctx.beginPath();
    ctx.ellipse(cx, cy, r, r * 0.86, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.globalCompositeOperation = 'lighter';
    const rimPulse = 0.75 + Math.sin(t * 9) * 0.25;
    ctx.globalAlpha = rimPulse;
    ctx.strokeStyle = '#f8fafc';
    ctx.lineWidth = 3.5;
    ctx.beginPath();
    ctx.ellipse(cx, cy, r, r * 0.86, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.globalAlpha = rimPulse * 0.6;
    ctx.strokeStyle = '#a5f3fc';
    ctx.lineWidth = 9;
    ctx.beginPath();
    ctx.ellipse(cx, cy, r * 1.06, r * 0.92, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }

  /**
   * Full-screen additions drawn on the OUTPUT canvas (crisp, unscaled): the
   * build-up tint, the streaking motion blur and the final white-out that hides
   * the dimension swap.
   */
  renderScreenOverlay(ctx, w, h) {
    const suckT = this.phase === 'suck'
      ? Math.min(1, this.timer / this.durations.suck)
      : (this.phase === 'collapse' ? 1 : 0);
    ctx.save();
    if (this.phase !== 'collapse' && suckT > 0.02) {
      // Deep violet pressure creeping in from the edges.
      const g = ctx.createRadialGradient(w / 2, h / 2, Math.min(w, h) * 0.25, w / 2, h / 2, Math.max(w, h) * 0.75);
      g.addColorStop(0, 'rgba(76, 29, 149, 0)');
      g.addColorStop(1, `rgba(12, 2, 32, ${(0.25 + suckT * 0.5).toFixed(3)})`);
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, w, h);
      // Horizontal streaking as the player accelerates: reads as motion blur.
      ctx.globalCompositeOperation = 'lighter';
      ctx.globalAlpha = 0.05 + suckT * 0.15;
      ctx.fillStyle = '#a5f3fc';
      for (let i = 0; i < 26; i++) {
        const y = ((i * 37) % h) + Math.sin(i) * 6;
        const len = 60 + suckT * 340 * (0.4 + ((i * 13) % 10) / 10);
        ctx.fillRect(w / 2 - len / 2, y, len, 1.5);
      }
    }
    ctx.restore();
    if (this.flash > 0) {
      ctx.save();
      ctx.globalAlpha = Math.min(1, this.flash);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, w, h);
      ctx.restore();
    }
  }
}
// ============================================================
// 8. THE SOVEREIGN'S FALL — the final boss death spectacle
// ============================================================
// The Ossuary Sovereign is the last thing the game asks of the player, so its
// death is a staged show rather than a despawn. The Game builds one of these
// the frame the skull dies — while every vertebra is still on the boss object
// — and snapshots the spine into it, because Game.update nulls this.boss on
// that same frame. From there it plays itself out over ~7 seconds:
//
//   0.0s   white-out; the spine chain-detonates from tail toward the skull
//   ~1.5s  the skull blows: second flash, shockwave rings, bone nova
//   1.5s+  rings breathe outward, a pillar of souls climbs, bone dust falls
//   ~7s    done — the light fades and the arena is just an arena again
//
// Pure presentation: no hitboxes, no drops, no rules. All the Game owes it
// is one tick per update, one world draw and one screen-overlay draw.
class DragonFinale {
  constructor(boss) {
    this.t = 0;
    this.done = false;
    this.x = boss.x + boss.width / 2;
    this.y = boss.y + boss.height / 2;
    this.phase = boss.phase || 1;
    this.soul = this.phase === 3 ? '#f0abfc' : this.phase === 2 ? '#c4b5fd' : '#67e8f9';
    this.soulRGB = this.phase === 3 ? '240,164,252' : this.phase === 2 ? '196,181,253' : '103,232,249';
    // Tail first, so the wave races toward the skull and the skull takes the
    // big blast — the same read as a fuse burning down the spine.
    this.chain = [];
    const segs = boss.segments || [];
    for (let i = segs.length - 1; i >= 0; i--) {
      this.chain.push({ x: segs[i].x, y: segs[i].y, at: 0.08 + this.chain.length * 0.07, popped: false });
    }
    this.skullAt = 0.08 + this.chain.length * 0.07 + 0.18;
    this.skullPopped = false;
    this.rings = [];
    this.flash = 1;
    this.pillar = 0;
    // The lighting/glow passes read these off any entity in their list, so the
    // arena is lit by its own corpse-light while the show runs.
    this.lightRadius = 520;
    this.glowRadius = 360;
    this.lightColor = this.phase === 3 ? [240, 164, 252] : [103, 232, 249];
    this.hitFlash = 0;
  }

  /** One frame of the show. `game` is only used for particles/sound/feel. */
  update(dt, game) {
    if (this.done) return;
    this.t += dt;
    const P = game.particles;
    const S = game.sound;

    // White-out: full the instant the boss dies, gone by ~0.45s, re-triggered
    // by the skull blast.
    this.flash = Math.max(0, this.flash - dt * 2.2);

    // ---- The chain: each vertebra detonates as the wave reaches it ----
    for (const seg of this.chain) {
      if (seg.popped || this.t < seg.at) continue;
      seg.popped = true;
      P.bloodBurst(seg.x, seg.y, '#e7e5e4', 9);      // bone chips, not blood
      P.magicSparkle(seg.x, seg.y, this.soul, 6);
      this.rings.push({ x: seg.x, y: seg.y, maxR: 44 + Math.random() * 24, life: 0.55, maxLife: 0.55, color: this.soul, w: 3 });
      if (S && Math.random() < 0.5) S.playDig(true);  // bone crunch
      if (game.feel) game.feel.shake(0.05);           // the spine stutters
    }

    // ---- The skull: the big one ----
    if (!this.skullPopped && this.t >= this.skullAt) {
      this.skullPopped = true;
      this.flash = 1;
      this.pillar = 1;
      if (S) { S.playExplosion(); S.playBossRoar(); }
      if (game.feel) game.feel.shake(1.1);
      P.bloodBurst(this.x, this.y, '#e7e5e4', 40);
      P.bloodBurst(this.x, this.y, '#d6d3d1', 24);
      P.magicSparkle(this.x, this.y, this.soul, 60);
      P.magicSparkle(this.x, this.y, '#fde047', 30);
      this.rings.push({ x: this.x, y: this.y, maxR: 280, life: 1.1, maxLife: 1.1, color: '#ffffff', w: 7 });
      this.rings.push({ x: this.x, y: this.y, maxR: 200, life: 0.9, maxLife: 0.9, color: this.soul, w: 5 });
      // Bone nova: shrapnel in every direction, gravity pulls it back down.
      for (let i = 0; i < 46; i++) {
        const a = Math.random() * Math.PI * 2;
        const sp = 3 + Math.random() * 7;
        P.addParticle(this.x, this.y, Math.cos(a) * sp, Math.sin(a) * sp - 2,
          i % 3 ? '#e7e5e4' : this.soul, 2 + Math.random() * 3, 1.6 + Math.random(), 0.14, i % 3 === 0);
      }
    }

    // ---- Rings age out here; render() draws them from life/maxLife ----
    for (let i = this.rings.length - 1; i >= 0; i--) {
      this.rings[i].life -= dt;
      if (this.rings[i].life <= 0) this.rings.splice(i, 1);
    }

    // ---- The soul pillar: a geyser of motes climbing out of the corpse ----
    if (this.skullPopped) {
      const since = this.t - this.skullAt;
      this.pillar = Math.max(0, 1 - since / 3.4);
      if (this.pillar > 0 && P) {
        const n = this.pillar > 0.6 ? 3 : 2;
        for (let i = 0; i < n; i++) {
          P.addParticle(this.x + (Math.random() - 0.5) * 70, this.y + 10,
            (Math.random() - 0.5) * 0.7, -1.6 - Math.random() * 2.2,
            Math.random() < 0.7 ? this.soul : '#fde047', 3 + Math.random() * 3,
            1.2 + Math.random() * 0.8, -0.03, true);
        }
      }
      // Light: a blown-out core settling into a dim, breathing soul glow.
      const fade = Math.max(0, 1 - since / 4.5);
      this.lightRadius = 200 + 420 * fade + Math.sin(this.t * 9) * 40 * fade;
      this.glowRadius = 140 + 300 * fade;
      if (since > 5.5) this.done = true;   // ~7s from the killing blow
    }
  }

  /** World-space draw: shockwave rings, the soul pillar, the blast core. */
  render(ctx, camera) {
    const sx = this.x - camera.x;
    const sy = this.y - camera.y;
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';

    // ---- Shockwave rings: ease-out growth, thinning stroke, white edge ----
    for (const r of this.rings) {
      const k = 1 - r.life / r.maxLife;
      const radius = r.maxR * (1 - Math.pow(1 - k, 2.2));
      ctx.globalAlpha = Math.max(0, (1 - k) * 0.85);
      ctx.strokeStyle = r.color;
      ctx.lineWidth = Math.max(0.5, r.w * (1 - k));
      ctx.beginPath();
      ctx.arc(r.x - camera.x, r.y - camera.y, radius, 0, Math.PI * 2);
      ctx.stroke();
      ctx.globalAlpha = Math.max(0, (1 - k) * 0.5);
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = Math.max(0.5, r.w * (1 - k) * 0.35);
      ctx.beginPath();
      ctx.arc(r.x - camera.x, r.y - camera.y, radius * 0.96, 0, Math.PI * 2);
      ctx.stroke();
    }

    // ---- The soul pillar column ----
    if (this.pillar > 0) {
      const w = 46 + Math.sin(this.t * 7) * 8;
      const h = 320 * this.pillar;
      const g = ctx.createLinearGradient(0, sy - h, 0, sy + 30);
      g.addColorStop(0, 'rgba(' + this.soulRGB + ',0)');
      g.addColorStop(1, 'rgba(' + this.soulRGB + ',' + (0.5 * this.pillar).toFixed(3) + ')');
      ctx.globalAlpha = 1;
      ctx.fillStyle = g;
      ctx.fillRect(sx - w / 2, sy - h, w, h + 30);
    }

    // ---- The skull blast core: a white-hot ball that goes nova and dies ----
    if (this.skullPopped && this.t - this.skullAt < 0.8) {
      const k = (this.t - this.skullAt) / 0.8;
      const R = 60 + 260 * k;
      const g = ctx.createRadialGradient(sx, sy, 0, sx, sy, R);
      g.addColorStop(0, 'rgba(255,255,255,' + (0.9 * (1 - k)).toFixed(3) + ')');
      g.addColorStop(0.4, 'rgba(' + this.soulRGB + ',' + (0.55 * (1 - k)).toFixed(3) + ')');
      g.addColorStop(1, 'rgba(' + this.soulRGB + ',0)');
      ctx.globalAlpha = 1;
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(sx, sy, R, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }

  /**
   * Full-screen draw on the OUTPUT canvas (same contract as WormholeFX):
   * the white-out that sells the two big blasts, crisp at any render scale.
   */
  renderScreenOverlay(ctx, w, h) {
    if (this.flash <= 0.01) return;
    ctx.save();
    ctx.globalAlpha = Math.min(1, this.flash);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, w, h);
    ctx.restore();
  }
}
// Expose the new classes the way every other module does, so the page's boot
// watchdog and the headless harnesses can see them.
if (typeof window !== 'undefined') {
  window.SkeletonDragonBoss = SkeletonDragonBoss;
  window.DragonFinale = DragonFinale;
  window.SkeletonMinion = SkeletonMinion;
  window.WormholeFX = WormholeFX;
  window.SPACE_TILE_IDS = SPACE_TILE_IDS;
  window.SPACE_PROJECTILE_TYPES = SPACE_PROJECTILE_TYPES;
  window.spawnSpaceProjectile = spawnSpaceProjectile;
}
