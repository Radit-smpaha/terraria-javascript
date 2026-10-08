// Reef progression and the ocean-planet dimension. Loaded after world.js and
// space.js so it can extend World without changing the established biome bands.
const OCEAN_TILES = {
  PEARL: 73,
  SHRINE: 74,
  SHRINE_ACTIVE: 75,
  PORTAL: 76,
  CORAL: 77,
  DORMANT_PORTAL: 78
};
const OCEAN_TILE_SET = new Set(Object.values(OCEAN_TILES));

TILES.SACRED_PEARL = OCEAN_TILES.PEARL;
TILES.REEF_SHRINE = OCEAN_TILES.SHRINE;
TILES.REEF_SHRINE_ACTIVE = OCEAN_TILES.SHRINE_ACTIVE;
TILES.OCEAN_PORTAL = OCEAN_TILES.PORTAL;
TILES.CORAL = OCEAN_TILES.CORAL;
TILES.DORMANT_OCEAN_PORTAL = OCEAN_TILES.DORMANT_PORTAL;

Object.assign(TILE_PROPERTIES, {
  [OCEAN_TILES.PEARL]: { solid: true, light: 11, color: '#67e8f9', name: 'Sacred Pearl', drops: { id: 'sacred_pearl', count: 1 } },
  [OCEAN_TILES.SHRINE]: { solid: true, light: 2, color: '#0e7490', name: 'Dormant Reef Shrine', drops: null },
  [OCEAN_TILES.SHRINE_ACTIVE]: { solid: true, light: 9, color: '#22d3ee', name: 'Awakened Reef Shrine', drops: null },
  [OCEAN_TILES.PORTAL]: { solid: false, light: 15, color: '#22d3ee', name: 'Tide Portal', drops: null },
  [OCEAN_TILES.CORAL]: { solid: false, light: 2, color: '#fb7185', name: 'Reef Coral', drops: { id: 'coral_fragment', count: 1 } },
  [OCEAN_TILES.DORMANT_PORTAL]: { solid: false, light: 2, color: '#475569', name: 'Dormant Tide Gate', drops: null }
});

const OCEAN_BASE_DRAW_TILE = World.prototype.drawTileGraphic;
World.prototype.drawTileGraphic = function(ctx, tile, sx, sy, tx, ty, exposedTop) {
  if (!OCEAN_TILE_SET.has(tile)) {
    return OCEAN_BASE_DRAW_TILE.call(this, ctx, tile, sx, sy, tx, ty, exposedTop);
  }
  const pulse = 0.65 + Math.sin(Date.now() * 0.003 + tx * 0.7 + ty) * 0.2;
  if (tile === OCEAN_TILES.PEARL) {
    ctx.fillStyle = '#0e7490';
    ctx.fillRect(sx, sy, TILE_SIZE, TILE_SIZE);
    ctx.fillStyle = '#a5f3fc';
    ctx.beginPath();
    ctx.arc(sx + 12, sy + 12, 6 + pulse, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(sx + 10, sy + 8, 3, 3);
  } else if (tile === OCEAN_TILES.SHRINE || tile === OCEAN_TILES.SHRINE_ACTIVE) {
    ctx.fillStyle = tile === OCEAN_TILES.SHRINE_ACTIVE ? '#155e75' : '#334155';
    ctx.fillRect(sx + 2, sy + 2, 20, 20);
    ctx.fillStyle = tile === OCEAN_TILES.SHRINE_ACTIVE ? `rgba(103,232,249,${pulse})` : '#64748b';
    ctx.fillRect(sx + 6, sy + 5, 12, 3);
    ctx.fillRect(sx + 9, sy + 8, 6, 9);
    ctx.fillRect(sx + 6, sy + 17, 12, 3);
  } else if (tile === OCEAN_TILES.PORTAL) {
    ctx.fillStyle = `rgba(8,145,178,${0.45 + pulse * 0.25})`;
    ctx.fillRect(sx + 1, sy, 22, 24);
    ctx.strokeStyle = '#a5f3fc';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.ellipse(sx + 12, sy + 12, 6 + pulse * 2, 10, 0, 0, Math.PI * 2);
    ctx.stroke();
  } else if (tile === OCEAN_TILES.DORMANT_PORTAL) {
    ctx.fillStyle = 'rgba(51,65,85,0.65)';
    ctx.fillRect(sx + 4, sy + 2, 16, 20);
    ctx.strokeStyle = '#64748b';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.ellipse(sx + 12, sy + 12, 4, 8, 0, 0, Math.PI * 2);
    ctx.stroke();
  } else {
    ctx.fillStyle = '#fb7185';
    ctx.fillRect(sx + 4, sy + 13, 4, 8);
    ctx.fillRect(sx + 9, sy + 8, 5, 13);
    ctx.fillRect(sx + 15, sy + 11, 5, 10);
    ctx.fillStyle = '#fda4af';
    ctx.fillRect(sx + 6, sy + 10, 2, 3);
    ctx.fillRect(sx + 12, sy + 5, 2, 3);
  }
};

const OCEAN_BASE_ANIMATED_TILE = World.prototype.isAnimatedTile;
World.prototype.isAnimatedTile = function(tile) {
  return OCEAN_BASE_ANIMATED_TILE.call(this, tile) ||
    tile === OCEAN_TILES.PEARL || tile === OCEAN_TILES.SHRINE_ACTIVE ||
    tile === OCEAN_TILES.PORTAL || tile === OCEAN_TILES.DORMANT_PORTAL;
};

World.prototype.isInOcean = function() {
  return this.dimension === 'ocean';
};

World.prototype.isReefAtX = function(tileX) {
  return this.dimension !== 'ocean' && !!this.reefBounds &&
    tileX >= this.reefBounds.left && tileX < this.reefBounds.right;
};

World.prototype.generateReef = function() {
  if (!this.naturalTerrainTiles) this.naturalTerrainTiles = this.tiles.slice();
  if (!this.naturalSurfaceHeights) this.naturalSurfaceHeights = this.surfaceHeights.slice();
  // The reef owns the ENTIRE reef band: the west edge of the world is open
  // sea and the last ~28 columns ramp up into a beach on the snow band's
  // doorstep. Band-derived, so the ocean can never overlap the snow biome —
  // that overlap was the original bug.
  const borders = this.biomeBorders();
  const left = 0;
  const edgeRight = Math.max(left + 40, Math.min(this.width - 3, Math.ceil(borders[0])));
  const mainRight = Math.max(left + 20, edgeRight - 28);
  const seaY = Math.max(24, Math.min(this.height - 45,
    Math.round(this.naturalSurfaceHeights[left])));
  const deepFloor = Math.min(this.height - 8, seaY + 30);
  const shrines = [];
  // Four pearls hang at rising depths through the deep zone, each with its
  // shrine standing on the sea floor four columns to its east, and the dormant
  // Tide Gate floats between the inner pair.
  const deepLen = mainRight - left;
  const pearlColumns = [0.16, 0.36, 0.62, 0.84].map(f => Math.round(left + deepLen * f));
  const shrineColumns = pearlColumns.map(x => Math.min(x + 4, mainRight - 4));
  const portalX = Math.round((shrineColumns[1] + shrineColumns[2]) / 2);

  // Flatten the waterline. Worldgen vegetation and any hill standing above
  // sea level would float once the column is flooded, so they are shaved back
  // to seaY — but ONLY where the tile still matches the natural-generation
  // snapshot, which means player builds survive the save migration intact.
  const veg = new Set([TILES.FLOWER, TILES.TALL_GRASS, TILES.LILY, TILES.CACTUS,
    TILES.SNOWBUSH, TILES.ICICLE, TILES.LEAVES, TILES.SNOW_PINE_LEAVES,
    TILES.ACACIA_LEAVES, TILES.MANGROVE_LEAVES, TILES.WOOD]);
  for (let x = left; x < edgeRight; x++) {
    const natSurf = this.naturalSurfaceHeights[x];
    for (let y = 1; y < seaY; y++) {
      const idx = y * this.width + x;
      const nat = this.naturalTerrainTiles[idx];
      if (this.tiles[idx] !== nat || nat === TILES.AIR) continue;
      if (veg.has(nat) || y >= natSurf) this.tiles[idx] = TILES.AIR;
    }
  }

  for (let x = left; x < edgeRight; x++) {
    let floor;
    if (x < mainRight) {
      floor = Math.round(deepFloor + Math.sin(x * 0.19) * 1.5 + Math.sin(x * 0.07) * 1.5);
    } else {
      // East shore: smooth ramp from the abyss back up to the waterline, so
      // the reef ends in a walkable beach exactly at the snow border.
      const t = (x - mainRight) / Math.max(1, edgeRight - mainRight);
      const smooth = t * t * (3 - 2 * t);
      floor = Math.round(deepFloor + (seaY - deepFloor) * smooth);
    }
    this.surfaceHeights[x] = floor;
    for (let y = seaY; y < floor; y++) this.setTile(x, y, TILES.WATER);
    if (floor >= seaY) this.setTile(x, floor, x % 5 === 0 ? TILES.SANDSTONE : TILES.SAND);
  }

  for (let x = left + 4; x < mainRight - 3; x += 5) {
    const floor = this.surfaceHeights[x];
    const height = 2 + Math.floor((Math.sin(x * 12.9898) * 43758.5453 % 1 + 1) % 1 * 3);
    const waterDepth = floor - seaY;
    if (waterDepth >= height + 1 && !shrineColumns.includes(x)) {
      for (let k = 1; k <= height; k++) this.setTile(x, floor - k, TILES.CORAL);
      if (height >= 3) {
        const branchY = floor - height + 1;
        for (const side of [-1, 1]) {
          const branchX = x + side;
          if (branchX > left && branchX < mainRight && !shrineColumns.includes(branchX) &&
              branchY < this.surfaceHeights[branchX] && branchY > seaY) {
            this.setTile(branchX, branchY, TILES.CORAL);
          }
        }
      }
    }
  }

  for (let i = 0; i < 4; i++) {
    const x = pearlColumns[i];
    const floor = this.surfaceHeights[x];
    const pearlY = seaY + Math.max(1, Math.floor((floor - seaY) * (0.35 + i * 0.08)));
    this.setTile(x, Math.min(floor - 1, pearlY), OCEAN_TILES.PEARL);
    const shrineX = shrineColumns[i];
    this.setTile(shrineX, this.surfaceHeights[shrineX] - 1, OCEAN_TILES.SHRINE);
    shrines.push({ x: shrineX, y: this.surfaceHeights[shrineX] - 1, pearlIndex: i });
  }

  this.reefShrines = shrines;
  this.reefBounds = { left, right: edgeRight, mainRight, seaY };
  this.reefPortal = {
    x: portalX,
    y: seaY + Math.max(1, Math.floor((this.surfaceHeights[portalX] - seaY) * 0.6))
  };
  this.setTile(this.reefPortal.x, this.reefPortal.y, TILES.DORMANT_OCEAN_PORTAL);
  this._tileCacheDirty = true;
  return { left, right: edgeRight, mainRight, seaY, floorY: deepFloor, shrines, portal: this.reefPortal };
};

World.prototype.repairLegacyReef = function(version) {
  if (!this.naturalTerrainTiles || !this.reefBounds) return false;
  if (version === 14) {
    // v14 was the interim forest-band layout: a reef carved from ceil(w/5)
    // east for 80 columns. That stretch held no natural water or sand, so
    // every drop of water, grain of sand and ocean tile in it goes straight
    // back to the freshly generated natural terrain before the band-derived
    // reef is carved over the west edge.
    const left = Math.ceil(this.width / 5);
    const v14Right = Math.min(this.width - 35, left + 52);
    const v14Edge = Math.min(this.width - 3, v14Right + 28);
    for (let x = left; x < v14Edge; x++) {
      for (let y = 0; y < this.height; y++) {
        const idx = y * this.width + x;
        const t = this.tiles[idx];
        if ((t >= OCEAN_TILES.PEARL && t <= OCEAN_TILES.DORMANT_PORTAL) ||
            t === TILES.WATER || t === TILES.SAND || t === TILES.SANDSTONE) {
          this.tiles[idx] = this.naturalTerrainTiles[idx];
        }
      }
    }
    this._tileCacheDirty = true;
    return true;
  }
  const legacyV12 = version === 12;
  const oldRight = legacyV12
    ? Math.max(22, Math.floor(this.width * 0.32))
    : Math.max(54, Math.floor(this.width * 0.14));
  const oldLeft = legacyV12 ? 2 : 0;
  const oldEdgeRight = Math.min(this.width - 3, oldRight + 12);
  const oldSeaY = legacyV12
    ? Math.max(24, Math.min(48, Math.floor(this.height * 0.24)))
    : Math.max(24, Math.min(this.height - 24, this.naturalSurfaceHeights[oldEdgeRight]));
  const oldBaseFloor = Math.min(this.height - 8, oldSeaY + 48);

  for (let x = oldLeft; x < oldEdgeRight; x++) {
    let oldFloor;
    if (legacyV12) {
      const edge = Math.min(1, (oldRight - x) / 14);
      oldFloor = x < oldRight
        ? Math.min(this.height - 6,
          oldBaseFloor - Math.floor((1 - edge) * 22) + Math.round(Math.sin(x * 0.11) * 3))
        : Math.min(this.height - 6, oldSeaY + (oldEdgeRight - x) * 2);
    } else if (x <= oldRight) {
      const t = x / oldRight;
      const smooth = t * t * (3 - 2 * t);
      oldFloor = Math.round(oldSeaY + 12 * (1 - smooth));
    } else {
      const t = (x - oldRight) / (oldEdgeRight - oldRight);
      const smooth = t * t * (3 - 2 * t);
      oldFloor = Math.round(oldSeaY + (this.naturalSurfaceHeights[x] - oldSeaY) * smooth);
    }
    for (let y = 0; y < this.height; y++) {
      const index = y * this.width + x;
      const current = this.tiles[index];
      const natural = this.naturalTerrainTiles[index];
      if (current >= OCEAN_TILES.PEARL && current <= OCEAN_TILES.DORMANT_PORTAL) {
        this.tiles[index] = natural;
      } else if (current === TILES.WATER && natural !== TILES.WATER &&
          y >= oldSeaY && y < oldFloor) {
        this.tiles[index] = natural;
      } else if ((current === TILES.SAND || current === TILES.SANDSTONE) &&
          y === oldFloor && natural !== current) {
        this.tiles[index] = natural;
      } else if (legacyV12 && y > oldFloor && current === TILES.SANDSTONE &&
          (this.naturalTerrainTiles[index] === TILES.AIR || this.naturalTerrainTiles[index] === TILES.WATER)) {
        this.tiles[index] = natural;
      }
    }
  }
  this._tileCacheDirty = true;
  return true;
};

World.prototype.generateOceanPlanet = function() {
  this.tiles.fill(TILES.AIR);
  this.walls.fill(0);
  const seaY = Math.max(24, Math.floor(this.height * 0.24));
  const floorY = this.height - 18;
  this.surfaceHeights.fill(floorY);
  for (let x = 0; x < this.width; x++) {
    for (let y = seaY; y < floorY; y++) this.setTile(x, y, TILES.WATER);
    this.setTile(x, floorY, TILES.SANDSTONE);
    for (let y = floorY + 1; y < this.height; y++) this.setTile(x, y, TILES.STONE);
    if (x % 13 === 0) {
      for (let k = 1; k <= 1 + (x % 3); k++) this.setTile(x, floorY - k, TILES.CORAL);
    }
  }

  const portalX = Math.floor(this.width * 0.33);
  for (let y = floorY - 4; y < floorY; y++) this.setTile(portalX, y, TILES.OCEAN_PORTAL);
  const arena = {
    seaY,
    floorY,
    portalX,
    spawnX: Math.floor(this.width * 0.34) * TILE_SIZE,
    spawnY: (floorY - 7) * TILE_SIZE,
    bossX: Math.floor(this.width * 0.38) * TILE_SIZE,
    bossY: (floorY - 11) * TILE_SIZE
  };
  this.oceanArena = arena;
  this.underworldStart = this.height + 1000;
  this.underworld = null;
  this.dungeon = null;
  this.landmarks = [];
  this.lightSources = [];
  this._tileCache = null;
  this._tileCacheDirty = true;
  this._spaceBgCache = null;
  return arena;
};

World.prototype.renderOceanBackground = function(ctx, camera) {
  const width = camera.viewportWidth;
  const height = camera.viewportHeight;
  const gradient = ctx.createLinearGradient(0, 0, 0, height);
  gradient.addColorStop(0, '#0c4a6e');
  gradient.addColorStop(0.45, '#083344');
  gradient.addColorStop(1, '#020617');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);
  ctx.save();
  ctx.globalAlpha = 0.1;
  ctx.fillStyle = '#67e8f9';
  const drift = (Date.now() * 0.01) % (width + 180);
  for (let i = 0; i < 5; i++) {
    const x = ((i * width / 5 - drift * 0.12 + width) % width);
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x + 65, 0);
    ctx.lineTo(x + 220, height);
    ctx.lineTo(x + 110, height);
    ctx.fill();
  }
  ctx.restore();
};

World.prototype.enterOceanDimension = function() {
  if (this.dimension === 'ocean') return this.oceanArena || this.generateOceanPlanet();
  this.oceanStash = {
    tiles: this.tiles, walls: this.walls, surfaceHeights: this.surfaceHeights,
    underworldStart: this.underworldStart, underworld: this.underworld,
    dungeon: this.dungeon, landmarks: this.landmarks, lightSources: this.lightSources,
    timeOfDay: this.timeOfDay, rainbowSeeded: this.rainbowSeeded
  };
  this.tiles = new Uint8Array(this.width * this.height);
  this.walls = new Uint8Array(this.width * this.height);
  this.surfaceHeights = new Int16Array(this.width);
  this.dimension = 'ocean';
  const arena = this.generateOceanPlanet();
  return arena;
};

World.prototype.exitOceanDimension = function() {
  if (this.dimension !== 'ocean') return false;
  const stash = this.oceanStash;
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
  this.oceanStash = null;
  this.oceanArena = null;
  this.dimension = 'overworld';
  this._tileCache = null;
  this._tileCacheDirty = true;
  this._bgCache = null;
  return true;
};

World.prototype.persistTiles = (function(base) {
  return function() {
    if (this.dimension === 'ocean' && this.oceanStash) return this.oceanStash.tiles;
    return base.call(this);
  };
})(World.prototype.persistTiles);

World.prototype.persistWalls = (function(base) {
  return function() {
    if (this.dimension === 'ocean' && this.oceanStash) return this.oceanStash.walls;
    return base.call(this);
  };
})(World.prototype.persistWalls);

class OceanFish {
  constructor(x, y, species) {
    this.x = x;
    this.y = y;
    this.species = species;
    this.vx = (Math.random() < 0.5 ? -1 : 1) * (0.35 + Math.random() * 0.55);
    this.phase = Math.random() * Math.PI * 2;
    this.color = ['#f472b6', '#facc15', '#2dd4bf', '#fb923c', '#c084fc', '#e2e8f0',
      '#60a5fa', '#f87171'][species % 8];
    this.size = 5 + (species % 3) * 2;
  }

  update(dt, world) {
    this.phase += dt * 2;
    this.x += this.vx * dt * 60;
    this.y += Math.sin(this.phase) * dt * 9;
    const tx = Math.floor(this.x / TILE_SIZE);
    const limit = world.isInOcean() ? world.width
      : world.reefBounds ? world.reefBounds.right : world.width * 0.32;
    if (tx < 1 || tx >= limit || world.getTile(tx, Math.floor(this.y / TILE_SIZE)) !== TILES.WATER) {
      this.vx *= -1;
      this.x += this.vx * dt * 60 * 2;
    }
  }

  render(ctx, camera) {
    const x = this.x - camera.x;
    const y = this.y - camera.y;
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(this.vx < 0 ? -1 : 1, 1);
    ctx.fillStyle = this.color;
    ctx.beginPath();
    ctx.ellipse(0, 0, this.size, this.size * 0.62, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(-this.size + 1, 0);
    ctx.lineTo(-this.size - 4, -3);
    ctx.lineTo(-this.size - 4, 3);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#082f49';
    ctx.fillRect(this.size * 0.38, -1, 1.5, 1.5);
    ctx.restore();
  }
}

class OceanLeviathan {
  constructor(x, y, game) {
    this.kind = 'leviathan';
    this.name = 'THREE-HEADED SEA LEVIATHAN';
    this.x = x;
    this.y = y;
    this.width = 320;
    this.height = 150;
    this.maxHp = 110000;
    this.hp = 110000;
    this.phase = 1;
    this.dead = false;
    this.game = game;
    this.lightRadius = 260;
    this.glowRadius = 150;
    this.lightColor = [34, 211, 238];
    this.animT = 0;
    this.attackTimer = 2.3;
    this.beamTimer = 0;
    this.beam = null;
    this.surgeTimer = 0;
    this.surge = null;
    this.hitFlash = 0;
  }

  headTargets() {
    const cx = this.x + this.width * 0.5;
    return [
      { x: cx - 105, y: this.y + 12 + Math.sin(this.animT * 2) * 8, r: 37, head: true, index: 0 },
      { x: cx, y: this.y - 10 + Math.sin(this.animT * 2.4) * 8, r: 47, head: true, index: 1 },
      { x: cx + 105, y: this.y + 12 + Math.sin(this.animT * 1.8 + 1) * 8, r: 37, head: true, index: 2 }
    ];
  }

  hitTargets() { return this.headTargets(); }

  nearestHitTarget(x, y, reach = 0) {
    let best = null;
    let gap = Infinity;
    for (const target of this.headTargets()) {
      const d = Math.hypot(target.x - x, target.y - y) - target.r;
      if (d <= reach && d < gap) { best = target; gap = d; }
    }
    return best;
  }

  scaleDamageFor(target, damage) {
    // The crowned middle head is the apex of the fight: it shrugs off nearly
    // a third of what the flanks eat, so players break the two side heads
    // first and face the core last. The middle head also lands harder (its
    // beams carry a centre bonus) and attacks far more often.
    return Math.max(1, Math.round(damage * (target && target.index === 1 ? 0.72 : 1)));
  }

  takeDamage(amount, sound, particles, critical = false) {
    if (this.dead) return 0;
    const damage = Math.max(1, Math.round(amount));
    this.hp = Math.max(0, this.hp - damage);
    this.hitFlash = 0.2;
    if (sound) sound.playHit();
    if (particles) {
      particles.addDamageText(this.x + this.width / 2, this.y, damage,
        critical ? '#fef08a' : '#a5f3fc', critical);
      particles.magicSparkle(this.x + this.width / 2, this.y + this.height / 2, '#67e8f9', 5);
    }
    const phase = this.hp <= this.maxHp / 3 ? 3 : this.hp <= this.maxHp * 2 / 3 ? 2 : 1;
    if (phase > this.phase) {
      this.phase = phase;
      this.name = phase === 3 ? 'WOUNDED SEA LEVIATHAN · LAST TIDE'
        : 'INJURED SEA LEVIATHAN · RISING STORM';
      if (sound) sound.playBossRoar();
      if (this.game && this.game.feel) this.game.feel.shake(0.8);
    }
    if (this.hp <= 0) {
      this.dead = true;
      if (sound) sound.playExplosion();
      if (particles) particles.magicSparkle(this.x + this.width / 2, this.y, '#a5f3fc', 100);
    }
    return damage;
  }

  overlapsPlayer(player) {
    const cx = this.x + this.width / 2;
    const cy = this.y + this.height / 2;
    return Math.abs(player.x + player.width / 2 - cx) < (player.width + this.width) / 2 &&
      Math.abs(player.y + player.height / 2 - cy) < (player.height + this.height) / 2;
  }

  touchDamage() { return [0, 38, 55, 72][this.phase]; }

  update(dt, target, projectiles, sound, particles) {
    this.animT += dt;
    this.hitFlash = Math.max(0, this.hitFlash - dt);
    this.attackTimer -= dt;
    if (this.beamTimer > 0) {
      this.beamTimer -= dt;
      if (this.beamTimer <= 0 && this.beam) {
        const player = this.game.player;
        const px = player.x + player.width / 2;
        const py = player.y + player.height / 2;
        const bx = this.beam.x;
        const by = this.beam.y;
        if (Math.abs(py - by) < 27 && px >= bx - 24 && px <= bx + this.beam.length + 24) {
          const centerBonus = this.beam.head === 1 ? 24 : 0;
          this.game.damagePlayer(42 + this.phase * 13 + centerBonus, bx, 'The Leviathan’s water laser struck you!', true, by);
        }
        this.beam = null;
      }
    }
    if (this.surgeTimer > 0) {
      this.surgeTimer -= dt;
      if (this.surgeTimer <= 0 && this.surge) {
        const px = this.game.player.x + this.game.player.width / 2;
        const py = this.game.player.y + this.game.player.height / 2;
        if (Math.hypot(px - this.surge.x, py - this.surge.y) <= this.surge.radius) {
          this.game.damagePlayer(35 + this.phase * 12, this.surge.x, 'A Leviathan tidal burst caught you!', true, this.surge.y);
        }
        this.surge = null;
      }
    }
    if (this.attackTimer <= 0 && target && !this.beam && !this.surge) {
      // Nearly half the attacks come from the middle head — the most op one.
      const heads = this.headTargets();
      const roll = Math.random();
      const head = roll < 0.45 ? heads[1] : roll < 0.725 ? heads[0] : heads[2];
      const px = target.x + target.width / 2;
      const py = target.y + target.height / 2;
      if (Math.random() < 0.32) {
        this.surge = { x: px, y: py, radius: 120 + this.phase * 18, head: head.index };
        this.surgeTimer = 0.85;
      } else {
        const bx = Math.min(head.x, px);
        this.beam = { x: bx, y: py, length: Math.abs(px - head.x), head: head.index };
        this.beamTimer = 0.75;
      }
      this.attackTimer = Math.max(1.6, 3.4 - this.phase * 0.55);
      if (sound) sound.playBossRoar();
    }
  }

  renderTelegraph(ctx, camera) {
    ctx.save();
    if (this.beam && this.beamTimer > 0) {
      ctx.strokeStyle = `rgba(103,232,249,${0.45 + Math.sin(this.animT * 18) * 0.2})`;
      ctx.lineWidth = 5;
      ctx.setLineDash([12, 8]);
      ctx.beginPath();
      ctx.moveTo(this.beam.x - camera.x, this.beam.y - camera.y);
      ctx.lineTo(this.beam.x + this.beam.length - camera.x, this.beam.y - camera.y);
      ctx.stroke();
    }
    if (this.surge && this.surgeTimer > 0) {
      ctx.setLineDash([8, 6]);
      ctx.strokeStyle = `rgba(103,232,249,${0.5 + Math.sin(this.animT * 20) * 0.25})`;
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.arc(this.surge.x - camera.x, this.surge.y - camera.y, this.surge.radius, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.restore();
  }

  render(ctx, camera) {
    const x = this.x - camera.x;
    const y = this.y - camera.y;
    const injury = 1 - this.hp / this.maxHp;
    ctx.save();
    ctx.fillStyle = this.hitFlash > 0 ? '#ffffff' : this.phase === 3 ? '#14532d' : '#0e7490';
    ctx.beginPath();
    ctx.ellipse(x + this.width / 2, y + this.height * 0.68, this.width * 0.46, this.height * 0.31, 0, 0, Math.PI * 2);
    ctx.fill();
    for (let i = 0; i < 3; i++) {
      const head = this.headTargets()[i];
      const hx = head.x - camera.x;
      const hy = head.y - camera.y;
      const size = i === 1 ? 39 : 31;
      ctx.fillStyle = this.phase === 3 ? '#166534' : '#0891b2';
      ctx.beginPath();
      ctx.ellipse(hx, hy, size, size * 0.76, (i - 1) * 0.17, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = i === 1 ? '#facc15' : '#fda4af';
      ctx.beginPath();
      ctx.arc(hx + (i === 0 ? -8 : 8), hy - 4, 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#082f49';
      ctx.fillRect(hx + (i === 0 ? -9 : 7), hy - 6, 2, 3);
      ctx.fillStyle = '#cffafe';
      ctx.fillRect(hx - 8, hy + 9, 16, 3);
      if (injury > 0.2 + i * 0.12) {
        ctx.strokeStyle = '#991b1b';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(hx - 3, hy - 17);
        ctx.lineTo(hx + 2, hy - 4);
        ctx.lineTo(hx - 5, hy + 7);
        ctx.stroke();
      }
    }
    ctx.fillStyle = '#155e75';
    for (let i = 0; i < 7; i++) {
      const px = x + 40 + i * 39;
      ctx.beginPath();
      ctx.moveTo(px, y + this.height * 0.68);
      ctx.lineTo(px + 10, y + this.height * (0.28 + injury * 0.12));
      ctx.lineTo(px + 21, y + this.height * 0.72);
      ctx.fill();
    }
    if (injury > 0.05) {
      ctx.strokeStyle = `rgba(127,29,29,${Math.min(0.85, injury)})`;
      ctx.lineWidth = 3 + injury * 3;
      ctx.beginPath();
      for (let i = 0; i < 5; i++) {
        const px = x + 90 + i * 30;
        const py = y + this.height * (0.55 + (i % 2) * 0.15);
        ctx.moveTo(px, py);
        ctx.lineTo(px + 8, py + 12);
      }
      ctx.stroke();
    }
    ctx.restore();
  }
}

window.OceanLeviathan = OceanLeviathan;
window.OceanFish = OceanFish;
