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
  const reefRight = this.reefBounds ? this.reefBounds.right : Math.floor(this.width * 0.32);
  return this.dimension !== 'ocean' && tileX >= 0 && tileX < reefRight;
};

World.prototype.generateReef = function() {
  const left = 2;
  const right = Math.max(left + 20, Math.floor(this.width * 0.32));
  const edgeRight = Math.min(this.width - 3, right + 12);
  const seaY = Math.max(24, Math.min(48, Math.floor(this.height * 0.24)));
  const baseFloor = Math.min(this.height - 8, seaY + 48);
  const shrines = [];

  for (let x = left; x < edgeRight; x++) {
    const edge = Math.min(1, (right - x) / 14);
    const floor = x < right
      ? Math.min(this.height - 6,
        baseFloor - Math.floor((1 - edge) * 22) + Math.round(Math.sin(x * 0.11) * 3))
      : Math.min(this.height - 6, seaY + (edgeRight - x) * 2);
    this.surfaceHeights[x] = floor;
    for (let y = seaY; y < floor; y++) this.setTile(x, y, TILES.WATER);
    this.setTile(x, floor, TILES.SANDSTONE);
    for (let y = floor + 1; y < this.height; y++) {
      if (this.getTile(x, y) === TILES.AIR || this.getTile(x, y) === TILES.WATER) {
        this.setTile(x, y, TILES.SANDSTONE);
      }
    }
    if (x > left + 4 && x < right - 5 && x % 3 === 0) {
      this.setTile(x, floor - 1, TILES.CORAL);
      if (x % 9 === 0) this.setTile(x + 1, floor - 2, TILES.CORAL);
    }
  }

  const pearlColumns = [
    Math.floor(right * 0.13),
    Math.floor(right * 0.35),
    Math.floor(right * 0.59),
    Math.floor(right * 0.82)
  ];
  for (let i = 0; i < 4; i++) {
    const x = pearlColumns[i];
    const floor = this.surfaceHeights[x];
    this.setTile(x, floor - 4, OCEAN_TILES.PEARL);
    const shrineX = Math.min(right - 8, x + 6);
    this.setTile(shrineX, this.surfaceHeights[shrineX] - 1, OCEAN_TILES.SHRINE);
    shrines.push({ x: shrineX, y: this.surfaceHeights[shrineX] - 1, pearlIndex: i });
  }

  this.reefShrines = shrines;
  this.reefBounds = { left, right: edgeRight, mainRight: right, seaY };
  this.reefPortal = {
    x: Math.floor(right * 0.51),
    y: this.surfaceHeights[Math.floor(right * 0.51)] - 4
  };
  this.setTile(this.reefPortal.x, this.reefPortal.y, TILES.DORMANT_OCEAN_PORTAL);
  this._tileCacheDirty = true;
  return { left, right: edgeRight, mainRight: right, seaY, floorY: baseFloor, shrines, portal: this.reefPortal };
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
    this.color = ['#f472b6', '#facc15', '#2dd4bf', '#fb923c', '#c084fc', '#e2e8f0'][species];
    this.size = 5 + (species % 3) * 2;
  }

  update(dt, world) {
    this.phase += dt * 2;
    this.x += this.vx * dt * 60;
    this.y += Math.sin(this.phase) * dt * 9;
    const tx = Math.floor(this.x / TILE_SIZE);
    const limit = world.isInOcean() ? world.width
      : world.reefBounds ? world.reefBounds.right : world.width * 0.32;
    if (tx < 2 || tx >= limit || world.getTile(tx, Math.floor(this.y / TILE_SIZE)) !== TILES.WATER) {
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
    return Math.max(1, Math.round(damage * (target && target.index === 1 ? 1 : 0.72)));
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
      const head = this.headTargets()[Math.floor(Math.random() * 3)];
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
