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
const OCEAN_WATER_TILE_CACHE = [];

function getOceanWaterTile(ripple) {
  if (!OCEAN_WATER_TILE_CACHE[ripple]) {
    const canvas = document.createElement('canvas');
    canvas.width = TILE_SIZE;
    canvas.height = TILE_SIZE;
    const tile = canvas.getContext('2d');
    if (!tile) throw new Error('Could not create the cached reef-water tile.');
    tile.imageSmoothingEnabled = false;
    tile.fillStyle = '#062b43';
    tile.fillRect(0, 0, TILE_SIZE, TILE_SIZE);
    tile.fillStyle = '#0c4a6e';
    tile.fillRect(0, 0, TILE_SIZE, 4);
    tile.fillStyle = '#0e7490';
    tile.fillRect(2, 8 + ripple, 7, 2);
    tile.fillRect(13, 15 - ripple, 8, 2);
    tile.fillStyle = 'rgba(103,232,249,0.55)';
    tile.fillRect(5, 1, 3, 2);
    OCEAN_WATER_TILE_CACHE[ripple] = canvas;
  }
  return OCEAN_WATER_TILE_CACHE[ripple];
}

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
  if (tile === TILES.WATER && (this.isInOcean() || this.isReefAtX(tx))) {
    const ripple = ((tx * 7 + ty * 3) % 5 + 5) % 5;
    ctx.drawImage(getOceanWaterTile(ripple), sx, sy);
    return;
  }
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
    ctx.fillStyle = '#071b2b';
    ctx.fillRect(sx, sy, TILE_SIZE, TILE_SIZE);
    const lit = tile === OCEAN_TILES.SHRINE_ACTIVE;
    const glow = lit ? pulse : 0.34;
    ctx.fillStyle = '#334155';
    ctx.fillRect(sx + 1, sy + 19, 22, 4);
    ctx.fillStyle = '#94a3b8';
    ctx.fillRect(sx + 3, sy + 17, 18, 3);
    ctx.fillStyle = '#475569';
    ctx.fillRect(sx + 5, sy + 12, 14, 5);
    ctx.fillStyle = '#cbd5e1';
    ctx.fillRect(sx + 4, sy + 16, 16, 2);
    ctx.fillStyle = '#0e7490';
    ctx.fillRect(sx + 7, sy + 7, 10, 5);
    ctx.fillStyle = '#fbbf24';
    ctx.fillRect(sx + 6, sy + 8, 2, 3);
    ctx.fillRect(sx + 16, sy + 8, 2, 3);
    ctx.fillStyle = lit ? `rgba(103,232,249,${glow})` : '#67e8f9';
    ctx.beginPath();
    ctx.ellipse(sx + 12, sy + 6, 7, 3, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = lit ? '#ffffff' : '#cffafe';
    ctx.beginPath();
    ctx.arc(sx + 12, sy + 5, 3.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(sx + 11, sy + 3, 2, 2);
    if (tile === OCEAN_TILES.SHRINE_ACTIVE) {
      ctx.fillStyle = `rgba(103,232,249,${pulse * 0.45})`;
      ctx.fillRect(sx + 2, sy + 1, 20, 2);
      ctx.fillRect(sx + 3, sy + 4, 2, 8);
      ctx.fillRect(sx + 19, sy + 4, 2, 8);
    }
  } else if (tile === OCEAN_TILES.PORTAL) {
    ctx.fillStyle = '#071b2b';
    ctx.fillRect(sx, sy, TILE_SIZE, TILE_SIZE);
    ctx.fillStyle = `rgba(8,145,178,${0.68 + pulse * 0.25})`;
    ctx.fillRect(sx + 2, sy, 20, TILE_SIZE);
    ctx.fillStyle = `rgba(34,211,238,${0.2 + pulse * 0.22})`;
    ctx.beginPath();
    ctx.ellipse(sx + 12, sy + 12, 9, 12, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = `rgba(165,243,252,${0.12 + pulse * 0.12})`;
    ctx.beginPath();
    ctx.ellipse(sx + 12, sy + 12, 6, 9, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#fef3c7';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.ellipse(sx + 12, sy + 12, 8 + pulse, 11, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.strokeStyle = `rgba(103,232,249,${0.55 + pulse * 0.4})`;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.ellipse(sx + 12, sy + 12, 4, 8, 0.35, 0, Math.PI * 2);
    ctx.stroke();
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(sx + 11, sy + 4, 3, 4);
    ctx.fillRect(sx + 6, sy + 10, 2, 2);
    ctx.fillRect(sx + 17, sy + 16, 2, 2);
  } else if (tile === OCEAN_TILES.DORMANT_PORTAL) {
    ctx.fillStyle = 'rgba(2,6,23,0.82)';
    ctx.fillRect(sx + 3, sy + 1, 18, 22);
    ctx.strokeStyle = '#94a3b8';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.ellipse(sx + 12, sy + 12, 7, 10, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.strokeStyle = '#0e7490';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.ellipse(sx + 12, sy + 12, 3, 6, 0.35, 0, Math.PI * 2);
    ctx.stroke();
    ctx.fillStyle = '#64748b';
    ctx.fillRect(sx + 3, sy + 4, 2, 2);
    ctx.fillRect(sx + 19, sy + 18, 2, 2);
  } else {
    const coralColors = [
      ['#fb7185', '#f472b6', '#fecdd3'],
      ['#c084fc', '#a78bfa', '#ede9fe'],
      ['#2dd4bf', '#14b8a6', '#99f6e4'],
      ['#f97316', '#facc15', '#ffedd5'],
      ['#38bdf8', '#2563eb', '#bae6fd'],
      ['#f43f5e', '#8b5cf6', '#fda4af']
    ];
    const colony = coralColors[Math.abs(tx * 17 + ty * 31) % coralColors.length];
    const coral = colony[0];
    const branch = colony[1];
    ctx.fillStyle = '#083548';
    ctx.fillRect(sx, sy, TILE_SIZE, TILE_SIZE);
    ctx.fillStyle = '#0b4656';
    ctx.fillRect(sx, sy + 19, TILE_SIZE, 5);
    ctx.fillStyle = '#7f1d3d';
    ctx.fillRect(sx + 9, sy + 1, 6, 23);
    ctx.fillStyle = coral;
    ctx.fillRect(sx + 11, sy, 3, 24);
    if ((tx + ty) % 2 === 0) {
      ctx.fillStyle = branch;
      ctx.fillRect(sx + 4, sy + 5, 8, 4);
      ctx.fillRect(sx + 2, sy + 2, 4, 5);
      ctx.fillRect(sx + 13, sy + 12, 8, 4);
      ctx.fillRect(sx + 18, sy + 9, 4, 6);
    } else {
      ctx.fillStyle = branch;
      ctx.fillRect(sx + 13, sy + 4, 7, 4);
      ctx.fillRect(sx + 17, sy + 1, 4, 5);
      ctx.fillRect(sx + 3, sy + 13, 8, 4);
      ctx.fillRect(sx + 2, sy + 10, 4, 6);
    }
    ctx.fillStyle = colony[2];
    ctx.fillRect(sx + 2, sy + ((tx + ty) % 2 === 0 ? 2 : 10), 3, 3);
    ctx.fillRect(sx + 19, sy + ((tx + ty) % 2 === 0 ? 9 : 1), 3, 3);
    ctx.fillStyle = '#67e8f9';
    ctx.fillRect(sx + 4, sy + 17, 2, 2);
    ctx.fillRect(sx + 18, sy + 20, 2, 2);
  }
};

World.prototype.renderReefTemplePortal = function(ctx, camera) {
  const temple = this.reefTemple;
  if (!temple || this.isInOcean() || this.isInSpace()) return;
  const { x, y } = this.reefPortal;
  const tile = this.getTile(x, y);
  const active = tile === OCEAN_TILES.PORTAL;
  if (!active && tile !== OCEAN_TILES.DORMANT_PORTAL) return;

  const cx = (x + 0.5) * TILE_SIZE - camera.x;
  const cy = (y + 0.5) * TILE_SIZE - camera.y;
  const pulse = 0.72 + Math.sin(Date.now() * 0.003) * 0.18;
  const rx = TILE_SIZE * 1.25;
  const ry = TILE_SIZE * 1.8;
  ctx.save();
  ctx.globalAlpha = active ? 1 : 0.92;
  ctx.fillStyle = '#071b2b';
  ctx.beginPath();
  ctx.moveTo(cx - rx, cy + ry);
  ctx.lineTo(cx - rx, cy - ry * 0.38);
  ctx.quadraticCurveTo(cx - rx, cy - ry, cx, cy - ry);
  ctx.quadraticCurveTo(cx + rx, cy - ry, cx + rx, cy - ry * 0.38);
  ctx.lineTo(cx + rx, cy + ry);
  ctx.closePath();
  ctx.fill();

  const portalGradient = ctx.createLinearGradient(cx - rx, cy, cx + rx, cy);
  if (active) {
    portalGradient.addColorStop(0, '#075985');
    portalGradient.addColorStop(0.5, '#22d3ee');
    portalGradient.addColorStop(1, '#164e63');
  } else {
    portalGradient.addColorStop(0, '#0f172a');
    portalGradient.addColorStop(0.5, '#1e293b');
    portalGradient.addColorStop(1, '#0f172a');
  }
  ctx.fillStyle = portalGradient;
  ctx.beginPath();
  ctx.ellipse(cx, cy, rx * 0.72, ry * 0.82, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.lineWidth = 5;
  ctx.strokeStyle = active ? `rgba(103,232,249,${pulse})` : '#94a3b8';
  ctx.beginPath();
  ctx.moveTo(cx - rx, cy + ry);
  ctx.lineTo(cx - rx, cy - ry * 0.38);
  ctx.quadraticCurveTo(cx - rx, cy - ry, cx, cy - ry);
  ctx.quadraticCurveTo(cx + rx, cy - ry, cx + rx, cy - ry * 0.38);
  ctx.lineTo(cx + rx, cy + ry);
  ctx.stroke();

  ctx.lineWidth = 2;
  ctx.strokeStyle = active ? `rgba(255,255,255,${pulse})` : '#0e7490';
  ctx.beginPath();
  ctx.ellipse(cx, cy, rx * 0.72, ry * 0.82, 0, 0, Math.PI * 2);
  ctx.stroke();
  ctx.fillStyle = active ? '#ffffff' : '#cbd5e1';
  for (const [dx, dy] of [[0, -ry + 8], [-rx + 5, 0], [rx - 5, 0], [0, ry - 6]]) {
    ctx.fillRect(cx + dx - 2, cy + dy - 2, 4, 4);
  }
  if (active) {
    ctx.fillStyle = `rgba(207,250,254,${pulse * 0.55})`;
    ctx.beginPath();
    ctx.ellipse(cx, cy, rx * 0.45, ry * 0.55, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(cx - 2, cy - ry * 0.55, 4, 8);
  }
  ctx.restore();
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

World.prototype.isInsideReefTemple = function(tileX, tileY) {
  const room = this.reefTemple && this.reefTemple.interior;
  return this.dimension !== 'ocean' && this.dimension !== 'space' && !!room &&
    tileX >= room.left && tileX <= room.right &&
    tileY >= room.top && tileY < room.bottom;
};

World.prototype.reefPearlTargets = function() {
  if (!this.reefBounds) return [];
  const { left, mainRight, seaY } = this.reefBounds;
  const deepFloor = this.surfaceHeights[Math.max(left, Math.min(mainRight - 1,
    Math.round(left + (mainRight - left) * 0.36)))];
  const targets = [
    {
      x: Math.round(left + (mainRight - left) * 0.36),
      y: seaY + Math.max(1, Math.floor((deepFloor - seaY) * 0.48))
    },
    { x: Math.round(this.width * 0.33), depth: 7 },
    { x: Math.round(this.width * 0.55), depth: 9 },
    { x: Math.round(this.width * 0.86), depth: 11 }
  ];
  return targets.map((target, index) => {
    const x = Math.max(2, Math.min(this.width - 3, target.x));
    if (index === 0) return { x, y: Math.min(this.surfaceHeights[x] - 1, target.y) };
    return {
      x,
      y: Math.min(this.height - 12, this.surfaceHeights[x] + target.depth)
    };
  });
};

World.prototype.placeDistributedReefPearls = function(count = 4) {
  const targets = this.reefPearlTargets();
  const alreadyPlaced = [];
  for (let y = 0; y < this.height; y++) {
    for (let x = 0; x < this.width; x++) {
      if (this.getTile(x, y) !== OCEAN_TILES.PEARL) continue;
      alreadyPlaced.push({ x, y });
      const index = y * this.width + x;
      this.tiles[index] = this.naturalTerrainTiles
        ? this.naturalTerrainTiles[index] : TILES.AIR;
    }
  }
  const available = [];
  for (let i = 0; i < targets.length; i++) {
    const target = targets[i];
    for (let radius = 0; radius <= 10 && !available[i]; radius++) {
      for (const offset of radius === 0 ? [0] : [radius, -radius]) {
        const x = target.x + offset;
        if (x < 2 || x >= this.width - 2) continue;
        const y = Math.min(this.height - 2, Math.max(2, target.y +
          (i === 0 ? 0 : this.surfaceHeights[x] - this.surfaceHeights[target.x])));
        const index = y * this.width + x;
        const tile = this.tiles[index];
        const original = this.naturalTerrainTiles && this.naturalTerrainTiles[index];
        const wall = this.walls && this.walls[index];
        const originalWall = this.naturalTerrainWalls && this.naturalTerrainWalls[index];
        if ((wall && wall !== originalWall) ||
            (tile !== TILES.AIR && tile !== TILES.WATER &&
              !(tile === original && [TILES.DIRT, TILES.STONE, TILES.SAND, TILES.MUD,
                TILES.SANDSTONE, TILES.SNOW].includes(tile)))) continue;
        available[i] = { x, y };
        break;
      }
    }
  }
  const wanted = Math.min(Math.max(0, count), targets.length);
  this.reefPearls = [];
  for (let i = 0; i < wanted; i++) {
    const location = available[i] || alreadyPlaced[i];
    if (!location) continue;
    this.setTile(location.x, location.y, OCEAN_TILES.PEARL);
    this.reefPearls.push({ x: location.x, y: location.y, region: i });
  }
  this._tileCacheDirty = true;
  return this.reefPearls;
};

World.prototype.generateReef = function() {
  if (!this.naturalTerrainTiles) this.naturalTerrainTiles = this.tiles.slice();
  if (!this.naturalTerrainWalls) this.naturalTerrainWalls = this.walls.slice();
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
  // Keep the historic temple alignment stable; the four pearls themselves are
  // distributed afterward, from the deep reef to distant land biomes.
  const deepLen = mainRight - left;
  const pearlColumns = [0.16, 0.36, 0.62, 0.84].map(f => Math.round(left + deepLen * f));
  const legacyShrineColumns = pearlColumns.map(x => Math.min(x + 4, mainRight - 4));
  const portalX = Math.round((legacyShrineColumns[1] + legacyShrineColumns[2]) / 2);
  const podiumColumns = [portalX - 10, portalX - 6, portalX + 6, portalX + 10];

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

  for (let x = left + 4; x < mainRight - 3; x += 4) {
    const floor = this.surfaceHeights[x];
    const roll = Math.abs(Math.sin(x * 12.9898) * 43758.5453) % 1;
    const height = 18 + Math.floor(roll * 9);
    const waterDepth = floor - seaY;
    if (waterDepth >= height + 1 && !legacyShrineColumns.includes(x) &&
        !podiumColumns.some(podiumX => Math.abs(podiumX - x) <= 4) &&
        Math.abs(x - portalX) > 17) {
      for (let k = 1; k <= height; k++) this.setTile(x, floor - k, TILES.CORAL);
      for (const fraction of [0.2, 0.4, 0.6, 0.8]) {
        const branchY = floor - Math.round(height * fraction);
        for (const side of [-1, 1]) {
          for (let length = 1; length <= 6; length++) {
            const branchX = x + side * length;
            const branchTileY = branchY - (length > 2 ? Math.ceil((length - 2) / 2) : 0);
            if (branchX > left && branchX < mainRight &&
                !legacyShrineColumns.includes(branchX) &&
                !podiumColumns.some(podiumX => Math.abs(podiumX - branchX) <= 3) &&
                Math.abs(branchX - portalX) > 17 &&
                this.getTile(branchX, branchTileY) === TILES.WATER) {
              this.setTile(branchX, branchTileY, TILES.CORAL);
            }
          }
        }
      }
    }
  }

  const templeLeft = portalX - 16;
  const templeRight = portalX + 16;
  const templeFloorY = Math.max(...this.surfaceHeights.slice(templeLeft, templeRight + 1));
  for (let x = templeLeft; x <= templeRight; x++) this.surfaceHeights[x] = templeFloorY;
  this.reefBounds = { left, right: edgeRight, mainRight, seaY };
  this.reefPortal = {
    x: portalX,
    y: seaY + Math.max(1, Math.floor((this.surfaceHeights[portalX] - seaY) * 0.6))
  };
  this.reefPodiums = podiumColumns.map((x, i) => ({
    x,
    y: templeFloorY - 1,
    pearlIndex: i,
    side: i < 2 ? 'left' : 'right'
  }));
  this.reefShrines = this.reefPodiums;
  this.reefTemple = {
    left: templeLeft,
    right: templeRight,
    top: seaY + 8,
    floorY: templeFloorY,
    portalX,
    portalY: this.reefPortal.y,
    interior: {
      left: portalX - 11,
      right: portalX + 11,
      top: seaY + 14,
      bottom: this.surfaceHeights[portalX]
    }
  };
  this.placeDistributedReefPearls(4);
  this.buildReefTemple(new Set(), true);
  this._tileCacheDirty = true;
  return {
    left, right: edgeRight, mainRight, seaY, floorY: deepFloor,
    podiums: this.reefPodiums, portal: this.reefPortal, temple: this.reefTemple
  };
};

World.prototype.placeReefTempleTile = function(x, y, tile, floor = false) {
  if (x < 0 || x >= this.width || y < 0 || y >= this.height) return;
  const current = this.getTile(x, y);
  const replaceable = current === TILES.AIR || current === TILES.WATER ||
    OCEAN_TILE_SET.has(current) ||
    (floor && (current === TILES.SAND || current === TILES.SANDSTONE));
  if (replaceable) this.setTile(x, y, tile);
};

World.prototype.buildReefTemple = function(activePodiums = new Set(), clearInterior = false) {
  const temple = this.reefTemple;
  if (!temple || !this.reefPodiums) return;
  const place = (x, y, tile, floor = false) =>
    this.placeReefTempleTile(x, y, tile, floor);
  const { left, right, top, portalX, portalY } = temple;

  // The inner sanctuary is a dry, house-walled chamber, not another flooded
  // cave. Clear generated coral and stray terrain before rebuilding its shell.
  for (let x = temple.interior.left; x <= temple.interior.right; x++) {
    for (let y = temple.interior.top; y < temple.interior.bottom; y++) {
      const tile = this.getTile(x, y);
      if (clearInterior || tile === TILES.WATER || tile === TILES.CORAL) {
        this.setTile(x, y, TILES.AIR);
      }
      this.walls[y * this.width + x] = 23;
    }
  }

  // The stepped roof and paired towers give the gate a broad, unmistakable
  // silhouette, while the center stays open so the portal is reachable.
  for (let x = left + 3; x <= right - 3; x++) {
    place(x, top + 5, TILES.STONE_BRICK);
  }
  for (let x = portalX - 13; x <= portalX + 13; x++) place(x, top + 4, TILES.MARBLE);
  for (let x = portalX - 9; x <= portalX + 9; x++) place(x, top + 3, TILES.POLISHED_STONE);
  for (let x = portalX - 5; x <= portalX + 5; x++) place(x, top + 2, TILES.MARBLE);
  for (let x = portalX - 2; x <= portalX + 2; x++) place(x, top + 1, TILES.COPPER_BLOCK);
  for (const side of [-1, 1]) {
    for (let x = portalX + side * 15; x !== portalX + side * 8; x -= side) {
      place(x, top + 4, TILES.MARBLE);
    }
    place(portalX + side * 16, top + 3, TILES.COPPER_BLOCK);
  }
  for (const side of [-1, 1]) {
    const pilaster = portalX + side * 11;
    for (let y = top + 7; y < temple.floorY; y++) {
      place(pilaster - 1, y, y % 5 === 0 ? TILES.COPPER_BLOCK : TILES.POLISHED_STONE);
      place(pilaster, y, TILES.COPPER_BLOCK);
      place(pilaster + 1, y, y % 5 === 0 ? TILES.COPPER_BLOCK : TILES.POLISHED_STONE);
    }
    place(portalX + side * 14, top + 6, TILES.MARBLE);
    place(portalX + side * 14, top + 7, TILES.COPPER_BLOCK);
    place(portalX + side * 14, top + 8, TILES.POLISHED_STONE);
  }

  for (const side of [-1, 1]) {
    const towerX = portalX + side * 13;
    const outerX = portalX + side * 15;
    for (let y = top + 6; y < temple.floorY; y++) {
      place(towerX, y, y % 4 === 0 ? TILES.MARBLE : TILES.POLISHED_STONE);
      if (y >= top + 9) place(outerX, y, TILES.STONE_BRICK);
    }
    place(towerX, top + 5, TILES.COPPER_BLOCK);
    place(towerX, top + 8, TILES.COPPER_BLOCK);
    place(outerX, top + 8, TILES.MARBLE);
    place(towerX, top + 4, TILES.MARBLE);
    place(outerX, top + 5, TILES.COPPER_BLOCK);

    const archX = portalX + side * 3;
    for (let y = portalY - 6; y <= portalY + 4; y++) {
      place(archX, y, y % 3 === 0 ? TILES.COPPER_BLOCK : TILES.MARBLE);
    }
  }
  const torchY = Math.max(temple.interior.top + 2, portalY - 2);
  for (const side of [-1, 1]) {
    for (const offsetY of [0, 5]) {
      place(portalX + side * 8, torchY + offsetY, TILES.TORCH);
    }
  }
  for (let x = portalX - 3; x <= portalX + 3; x++) {
    place(x, portalY - 4, TILES.COPPER_BLOCK);
  }
  place(portalX, portalY - 5, TILES.MARBLE);

  for (let x = left; x <= right; x++) {
    const tile = (x - left) % 4 === 0 ? TILES.MARBLE : TILES.POLISHED_STONE;
    this.setTile(x, temple.floorY, tile);
  }
  for (let i = 0; i < this.reefPodiums.length; i++) {
    const podium = this.reefPodiums[i];
    podium.y = temple.floorY - 1;
    this.setTile(podium.x, podium.y,
      activePodiums.has(i) ? OCEAN_TILES.SHRINE_ACTIVE : OCEAN_TILES.SHRINE);
  }
  const awake = activePodiums.size === this.reefPodiums.length;
  this.setTile(portalX, portalY,
    awake ? OCEAN_TILES.PORTAL : OCEAN_TILES.DORMANT_PORTAL);
  this._tileCacheDirty = true;
};

World.prototype.migrateDistributedReefPearls = function() {
  const count = this.tiles.reduce((total, tile) => total + (tile === OCEAN_TILES.PEARL ? 1 : 0), 0);
  this.placeDistributedReefPearls(count);
  return count;
};

World.prototype.migrateLegacyReefTemple = function() {
  if (!this.reefBounds || !this.reefPodiums || !this.reefPortal) return false;
  const deepLen = this.reefBounds.mainRight - this.reefBounds.left;
  const pearlColumns = [0.16, 0.36, 0.62, 0.84].map(f =>
    Math.round(this.reefBounds.left + deepLen * f));
  const oldShrineColumns = pearlColumns.map(x =>
    Math.min(x + 4, this.reefBounds.mainRight - 4));
  const oldShrines = oldShrineColumns.map(x => {
    for (let y = Math.max(this.reefBounds.seaY, this.reefTemple.floorY - 9);
      y <= this.reefTemple.floorY + 1; y++) {
      const tile = this.getTile(x, y);
      if (tile === OCEAN_TILES.SHRINE || tile === OCEAN_TILES.SHRINE_ACTIVE) {
        return { x, y, active: tile === OCEAN_TILES.SHRINE_ACTIVE };
      }
    }
    return { x, y: -1, active: false };
  });
  const oldActive = oldShrines.map(shrine => shrine.active);
  for (let i = 0; i < oldShrineColumns.length; i++) {
    const { x, y } = oldShrines[i];
    if (y < 0) continue;
    if (this.reefPodiums.some(podium => podium.x === x && podium.y === y)) continue;
    this.setTile(x, y, TILES.WATER);
  }
  let gateWasOpen = false;
  for (let y = Math.max(this.reefBounds.seaY, this.reefPortal.y - 5);
    y <= this.reefPortal.y + 5; y++) {
    const tile = this.getTile(this.reefPortal.x, y);
    if (tile === OCEAN_TILES.PORTAL || tile === OCEAN_TILES.DORMANT_PORTAL) {
      gateWasOpen = tile === OCEAN_TILES.PORTAL;
      this.setTile(this.reefPortal.x, y, TILES.WATER);
      break;
    }
  }
  const activePodiums = new Set(oldActive.map((active, index) => active ? index : -1).filter(index => index >= 0));
  if (gateWasOpen && activePodiums.size < this.reefPodiums.length) {
    for (let i = 0; i < this.reefPodiums.length; i++) activePodiums.add(i);
  }
  this.buildReefTemple(activePodiums, true);
  this.migrateDistributedReefPearls();
  this._tileCacheDirty = true;
  return true;
};

World.prototype.migrateReefTempleFloor = function() {
  const temple = this.reefTemple;
  if (!temple || !this.reefPodiums || !this.reefPortal) return false;
  const activePodiums = new Set();
  for (let i = 0; i < this.reefPodiums.length; i++) {
    const podium = this.reefPodiums[i];
    for (let y = Math.max(this.reefBounds.seaY, temple.floorY - 9);
      y <= temple.floorY + 1; y++) {
      if (this.getTile(podium.x, y) === OCEAN_TILES.SHRINE_ACTIVE) {
        activePodiums.add(i);
        break;
      }
    }
  }
  let gateWasOpen = false;
  for (let y = Math.max(this.reefBounds.seaY, this.reefPortal.y - 5);
    y <= this.reefPortal.y + 5; y++) {
    if (this.getTile(this.reefPortal.x, y) === OCEAN_TILES.PORTAL) {
      gateWasOpen = true;
      break;
    }
  }
  if (gateWasOpen) {
    for (let i = 0; i < this.reefPodiums.length; i++) activePodiums.add(i);
  }
  for (let x = temple.left; x <= temple.right; x++) {
    this.surfaceHeights[x] = temple.floorY;
  }
  this.buildReefTemple(activePodiums, true);
  this.upgradeReefCoral();
  return true;
};

World.prototype.upgradeReefCoral = function() {
  if (!this.reefBounds) return false;
  const { left, mainRight, seaY } = this.reefBounds;
  for (let x = left + 4; x < mainRight - 3; x++) {
    const floorY = this.surfaceHeights[x];
    if (floorY - seaY < 20 || Math.abs(x - this.reefTemple.portalX) <= 17) continue;
    let topY = floorY - 1;
    while (topY >= seaY && this.getTile(x, topY) !== TILES.CORAL) topY--;
    if (topY < seaY) continue;
    let currentTop = topY;
    while (currentTop > seaY && this.getTile(x, currentTop - 1) === TILES.CORAL) currentTop--;
    const roll = Math.abs(Math.sin(x * 12.9898) * 43758.5453) % 1;
    const desiredHeight = Math.min(floorY - seaY - 2, 18 + Math.floor(roll * 9));
    const desiredTop = floorY - desiredHeight;
    for (let y = currentTop - 1; y >= desiredTop; y--) {
      if (this.getTile(x, y) !== TILES.WATER) break;
      this.setTile(x, y, TILES.CORAL);
    }
    for (const fraction of [0.2, 0.4, 0.6, 0.8]) {
      const branchY = floorY - Math.round(desiredHeight * fraction);
      for (const side of [-1, 1]) {
        for (let length = 1; length <= 6; length++) {
          const branchX = x + side * length;
          const branchTileY = branchY -
            (length > 2 ? Math.ceil((length - 2) / 2) : 0);
          if (branchX > left && branchX < mainRight &&
              Math.abs(branchX - this.reefTemple.portalX) > 17 &&
              this.getTile(branchX, branchTileY) === TILES.WATER) {
            this.setTile(branchX, branchTileY, TILES.CORAL);
          }
        }
      }
    }
  }
  this._tileCacheDirty = true;
  return true;
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
  if (width <= 0 || height <= 0) return;
  let cache = this._oceanBackgroundCache;
  if (!cache || cache.width !== width || cache.height !== height) {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const background = canvas.getContext('2d');
    const gradient = background.createLinearGradient(0, 0, 0, height);
    gradient.addColorStop(0, '#0c4a6e');
    gradient.addColorStop(0.45, '#083344');
    gradient.addColorStop(1, '#020617');
    background.fillStyle = gradient;
    background.fillRect(0, 0, width, height);
    cache = this._oceanBackgroundCache = { canvas, width, height };
  }
  ctx.drawImage(cache.canvas, 0, 0);
  ctx.save();
  ctx.globalAlpha = 0.1;
  ctx.fillStyle = '#67e8f9';
  const drift = (Date.now() * 0.01) % (width + 180);
  for (let i = 0; i < 3; i++) {
    const x = ((i * width / 3 - drift * 0.12 + width) % width);
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
    this.size = 11 + (species % 3) * 3;
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
    const flick = Math.sin(this.phase * 2.5) * 2;
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(this.vx < 0 ? -1 : 1, 1);

    // Broad, bright body with separate fins makes each little fish readable
    // against the tiled water instead of disappearing into a tiny oval.
    ctx.fillStyle = '#083548';
    ctx.beginPath();
    ctx.moveTo(-this.size * 0.72, -1);
    ctx.lineTo(-this.size * 1.35, -this.size * 0.8 + flick);
    ctx.lineTo(-this.size * 1.25, this.size * 0.85 + flick);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = this.color;
    ctx.beginPath();
    ctx.ellipse(0, 0, this.size * 1.12, this.size * 0.65, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#f8fafc';
    ctx.beginPath();
    ctx.ellipse(this.size * 0.12, this.size * 0.28, this.size * 0.72,
      this.size * 0.25, 0, 0, Math.PI);
    ctx.fill();
    ctx.fillStyle = this.color;
    ctx.beginPath();
    ctx.moveTo(-this.size * 0.15, -this.size * 0.45);
    ctx.lineTo(this.size * 0.12, -this.size * 1.05);
    ctx.lineTo(this.size * 0.5, -this.size * 0.45);
    ctx.closePath();
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(-this.size * 0.1, this.size * 0.35);
    ctx.lineTo(this.size * 0.28, this.size * 0.88);
    ctx.lineTo(this.size * 0.48, this.size * 0.32);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    for (let stripe = 0; stripe < 2 + (this.species % 2); stripe++) {
      const sx = -this.size * 0.45 + stripe * this.size * 0.42;
      ctx.fillRect(sx, -this.size * 0.34, this.size * 0.13, this.size * 0.68);
    }
    ctx.strokeStyle = 'rgba(8,47,73,0.85)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(this.size * 0.45, 0, this.size * 0.34, -0.85, 0.85);
    ctx.stroke();
    ctx.fillStyle = '#fff7ed';
    ctx.beginPath();
    ctx.arc(this.size * 0.73, -this.size * 0.13, this.size * 0.15, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#082f49';
    ctx.beginPath();
    ctx.arc(this.size * 0.78, -this.size * 0.13, this.size * 0.075, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.8)';
    ctx.fillRect(this.size * 0.72, -this.size * 0.2, 2, 2);
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
