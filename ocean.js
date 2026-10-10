// Reef progression and the ocean-planet dimension. Loaded after world.js and
// space.js so it can extend World without changing the established biome bands.
const OCEAN_TILES = {
  PEARL: 73,
  SHRINE: 74,
  SHRINE_ACTIVE: 75,
  PORTAL: 76,
  CORAL: 77,
  DORMANT_PORTAL: 78,
  TALL_CORAL: 79,
  TEMPLE_LEVER: 80,
  TEMPLE_LEVER_PULLED: 81,
  TEMPLE_DOOR: 82,
  // Shipwreck furniture on the ocean-planet islands. WRECK_PLANK and WRECK_HULL
  // are solid and drop loot when mined, so a wreck is a place you break open
  // rather than a decorative prop. WRECK_MAST is a climbable mast (platform).
  WRECK_PLANK: 83,
  WRECK_HULL: 84,
  WRECK_MAST: 85
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
TILES.TALL_CORAL = OCEAN_TILES.TALL_CORAL;
TILES.TEMPLE_LEVER = OCEAN_TILES.TEMPLE_LEVER;
TILES.TEMPLE_LEVER_PULLED = OCEAN_TILES.TEMPLE_LEVER_PULLED;
TILES.TEMPLE_DOOR = OCEAN_TILES.TEMPLE_DOOR;
TILES.WRECK_PLANK = OCEAN_TILES.WRECK_PLANK;
TILES.WRECK_HULL = OCEAN_TILES.WRECK_HULL;
TILES.WRECK_MAST = OCEAN_TILES.WRECK_MAST;

Object.assign(TILE_PROPERTIES, {
  [OCEAN_TILES.PEARL]: { solid: true, light: 11, color: '#67e8f9', name: 'Sacred Pearl', drops: { id: 'sacred_pearl', count: 1 } },
  [OCEAN_TILES.SHRINE]: { solid: true, light: 2, color: '#0e7490', name: 'Dormant Reef Shrine', drops: null },
  [OCEAN_TILES.SHRINE_ACTIVE]: { solid: true, light: 9, color: '#22d3ee', name: 'Awakened Reef Shrine', drops: null },
  [OCEAN_TILES.PORTAL]: { solid: false, light: 15, color: '#22d3ee', name: 'Tide Portal', drops: null },
  [OCEAN_TILES.CORAL]: { solid: false, light: 2, color: '#fb7185', name: 'Reef Coral', drops: { id: 'coral_fragment', count: 1 } },
  [OCEAN_TILES.DORMANT_PORTAL]: { solid: false, light: 2, color: '#475569', name: 'Dormant Tide Gate', drops: null },
  [OCEAN_TILES.TALL_CORAL]: { solid: false, light: 3, color: '#c084fc', name: 'Tall Reef Coral', drops: { id: 'coral_fragment', count: 1 } },
  [OCEAN_TILES.TEMPLE_LEVER]: { solid: false, light: 2, color: '#fbbf24', name: 'Tide Temple Lever', drops: null },
  [OCEAN_TILES.TEMPLE_LEVER_PULLED]: { solid: false, light: 3, color: '#22d3ee', name: 'Pulled Tide Temple Lever', drops: null },
  [OCEAN_TILES.TEMPLE_DOOR]: { solid: true, light: 0, color: '#64748b', name: 'Tide Temple Door', drops: null },
  // Wreck tiles drop real salvage: planks give wood, the hull gives iron (a
  // wreck is the ocean's ore seam), and the mast is climbable and gives wood.
  [OCEAN_TILES.WRECK_PLANK]: { solid: true, light: 0, color: '#5b4636', name: 'Rotten Plank', drops: { id: 'wood', count: 2 } },
  [OCEAN_TILES.WRECK_HULL]: { solid: true, light: 0, color: '#3f3226', name: 'Barnacled Hull', drops: { id: 'iron_ore', count: 2 } },
  [OCEAN_TILES.WRECK_MAST]: { solid: false, light: 0, color: '#7c5a3a', name: 'Broken Mast', isPlatform: true, drops: { id: 'wood', count: 3 } }
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
  } else if (tile === OCEAN_TILES.TALL_CORAL) {
    const tallColors = [
      ['#c084fc', '#a78bfa', '#ede9fe'],
      ['#fb7185', '#f472b6', '#fecdd3'],
      ['#2dd4bf', '#14b8a6', '#99f6e4'],
      ['#f97316', '#facc15', '#ffedd5'],
      ['#38bdf8', '#2563eb', '#bae6fd']
    ];
    const plant = tallColors[Math.abs(tx * 31 + ty * 17) % tallColors.length];
    const bend = Math.sin(tx * 1.7 + ty * 0.4) > 0 ? 1 : -1;
    ctx.fillStyle = '#062b43';
    ctx.fillRect(sx, sy, TILE_SIZE, TILE_SIZE);
    ctx.fillStyle = '#124454';
    ctx.fillRect(sx, sy + 20, TILE_SIZE, 4);
    ctx.fillStyle = '#3b1f56';
    ctx.fillRect(sx + 10, sy, 5, TILE_SIZE);
    ctx.fillStyle = plant[0];
    ctx.fillRect(sx + 11, sy, 3, TILE_SIZE);
    ctx.fillStyle = plant[1];
    if (bend > 0) ctx.fillRect(sx + 13, sy + 4, 8, 4);
    else ctx.fillRect(sx + 3, sy + 4, 8, 4);
    ctx.fillRect(sx + 11, sy + 13, 3, 3);
    ctx.fillStyle = plant[2];
    ctx.fillRect(sx + (bend > 0 ? 18 : 2), sy + 2, 4, 4);
    ctx.fillRect(sx + (bend > 0 ? 2 : 18), sy + 11, 4, 4);
    ctx.fillStyle = '#67e8f9';
    ctx.fillRect(sx + 5, sy + 18, 2, 2);
  } else if (tile === OCEAN_TILES.TEMPLE_LEVER ||
      tile === OCEAN_TILES.TEMPLE_LEVER_PULLED) {
    const pulled = tile === OCEAN_TILES.TEMPLE_LEVER_PULLED;
    ctx.fillStyle = '#123447';
    ctx.fillRect(sx + 2, sy + 5, 20, 17);
    ctx.fillStyle = '#94a3b8';
    ctx.fillRect(sx + 5, sy + 7, 14, 13);
    ctx.fillStyle = '#475569';
    ctx.fillRect(sx + 7, sy + 9, 10, 9);
    ctx.fillStyle = '#fbbf24';
    ctx.fillRect(sx + 11, sy + 11, 3, 7);
    ctx.fillStyle = pulled ? '#22d3ee' : '#f8fafc';
    ctx.fillRect(sx + (pulled ? 7 : 12), sy + (pulled ? 3 : 1), 4, 11);
    ctx.fillStyle = '#fbbf24';
    ctx.fillRect(sx + (pulled ? 5 : 11), sy + (pulled ? 2 : 0), 8, 4);
  } else if (tile === OCEAN_TILES.TEMPLE_DOOR) {
    ctx.fillStyle = '#0b2230';
    ctx.fillRect(sx, sy, TILE_SIZE, TILE_SIZE);
    ctx.fillStyle = '#334155';
    ctx.fillRect(sx + 2, sy + 1, 20, 22);
    ctx.fillStyle = '#94a3b8';
    ctx.fillRect(sx + 4, sy + 2, 2, 20);
    ctx.fillRect(sx + 18, sy + 2, 2, 20);
    ctx.fillStyle = '#0e7490';
    ctx.fillRect(sx + 7, sy + 4, 10, 16);
    ctx.fillStyle = '#cbd5e1';
    ctx.fillRect(sx + 8, sy + 5, 8, 2);
    ctx.fillRect(sx + 8, sy + 17, 8, 2);
    ctx.fillStyle = '#fbbf24';
    ctx.fillRect(sx + 16, sy + 11, 3, 3);
  } else if (tile === OCEAN_TILES.WRECK_PLANK) {
    // Weather-beaten planks: a dark hull board with pale grain and a rusted nail.
    ctx.fillStyle = '#2f241a';
    ctx.fillRect(sx, sy, TILE_SIZE, TILE_SIZE);
    ctx.fillStyle = '#5b4636';
    ctx.fillRect(sx + 1, sy + 2, TILE_SIZE - 2, 9);
    ctx.fillRect(sx + 1, sy + 13, TILE_SIZE - 2, 9);
    ctx.fillStyle = '#7a6144';
    ctx.fillRect(sx + 1, sy + 3, TILE_SIZE - 2, 2);
    ctx.fillRect(sx + 1, sy + 14, TILE_SIZE - 2, 2);
    ctx.fillStyle = '#3b2f22';
    ctx.fillRect(sx + 4, sy + 11, TILE_SIZE - 8, 2);
    ctx.fillStyle = '#8a9aa8';
    ctx.fillRect(sx + 5, sy + 5, 2, 2);
    ctx.fillRect(sx + 16, sy + 16, 2, 2);
  } else if (tile === OCEAN_TILES.WRECK_HULL) {
    // A curved hull plate crusted with barnacles and hanging weed.
    ctx.fillStyle = '#241c14';
    ctx.fillRect(sx, sy, TILE_SIZE, TILE_SIZE);
    ctx.fillStyle = '#3f3226';
    ctx.beginPath();
    ctx.moveTo(sx, sy + 3);
    ctx.quadraticCurveTo(sx + 12, sy - 2, sx + TILE_SIZE, sy + 3);
    ctx.lineTo(sx + TILE_SIZE, sy + TILE_SIZE - 2);
    ctx.quadraticCurveTo(sx + 12, sy + TILE_SIZE + 2, sx, sy + TILE_SIZE - 2);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#57483a';
    ctx.fillRect(sx + 2, sy + 7, TILE_SIZE - 4, 2);
    ctx.fillRect(sx + 2, sy + 15, TILE_SIZE - 4, 2);
    ctx.fillStyle = '#8fb3a3';
    ctx.fillRect(sx + 4, sy + 10, 2, 2);
    ctx.fillRect(sx + 15, sy + 4, 2, 2);
    ctx.fillRect(sx + 9, sy + 18, 2, 2);
    ctx.fillStyle = '#2f5f4a';
    ctx.fillRect(sx + 18, sy + 20, 3, 3);
    ctx.fillRect(sx + 3, sy + 1, 2, 3);
  } else if (tile === OCEAN_TILES.WRECK_MAST) {
    // A leaning, splintered mast you can stand on — an actual platform tile.
    ctx.fillStyle = 'rgba(0,0,0,0)';
    ctx.clearRect(sx, sy, TILE_SIZE, TILE_SIZE);
    ctx.fillStyle = '#6b4f33';
    ctx.fillRect(sx + 8, sy, 8, TILE_SIZE);
    ctx.fillStyle = '#8a6a45';
    ctx.fillRect(sx + 9, sy, 3, TILE_SIZE);
    ctx.fillStyle = '#4a3623';
    ctx.fillRect(sx + 13, sy + 4, 2, 6);
    ctx.fillRect(sx + 8, sy + 14, 2, 5);
    ctx.fillStyle = '#3b2f22';
    ctx.fillRect(sx + 2, sy + 2, 20, 3);
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
  // TILES.SNOW covers the snow-dusted tips growSnowPine stamps on the outer
  // ring (`tip ? TILES.SNOW : SNOW_PINE_LEAVES`): without it those white caps
  // survived the flood at the reef/snow border and floated above the waterline.
  const veg = new Set([TILES.FLOWER, TILES.TALL_GRASS, TILES.LILY, TILES.CACTUS,
    TILES.SNOWBUSH, TILES.ICICLE, TILES.LEAVES, TILES.SNOW_PINE_LEAVES,
    TILES.ACACIA_LEAVES, TILES.MANGROVE_LEAVES, TILES.WOOD, TILES.SNOW]);
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

  for (let x = left + 4; x < mainRight - 3; x += 8) {
    const floor = this.surfaceHeights[x];
    const roll = Math.abs(Math.sin(x * 12.9898) * 43758.5453) % 1;
    // Three size tiers so the reef floor reads as mixed growth rather than
    // one uniform stand of chest-high coral: half the colonies are low 2-4
    // tile clusters, a third are mid fans, and the rare one reaches 9-12.
    // (The separate TALL_CORAL species stays 13+; QA caps this one at 12.)
    const tier = Math.abs(Math.sin(x * 1.039) * 12345.6789) % 1;
    const height = tier < 0.5 ? 2 + Math.floor(roll * 3)
      : tier < 0.85 ? 5 + Math.floor(roll * 4)
        : 9 + Math.floor(roll * 4);
    const waterDepth = floor - seaY;
    if (waterDepth >= height + 1 && !legacyShrineColumns.includes(x) &&
        !podiumColumns.some(podiumX => Math.abs(podiumX - x) <= 3) &&
        Math.abs(x - portalX) > 17) {
      for (let k = 1; k <= height; k++) this.setTile(x, floor - k, TILES.CORAL);
      // Branch levels are fractions of the colony's OWN height — at the old
      // uniform height of 7 these are exactly the old 2/4/6 — so a short
      // cluster fans out near its own top instead of branching from the floor.
      for (const fraction of [0.3, 0.55, 0.8]) {
        const branchY = floor - height + Math.max(1, Math.round(height * fraction));
        for (const side of [-1, 1]) {
          for (let length = 1; length <= 3; length++) {
            const branchX = x + side * length;
            const branchTileY = branchY - (length > 1 ? 1 : 0);
            if (branchX > left && branchX < mainRight &&
                !legacyShrineColumns.includes(branchX) &&
                !podiumColumns.some(podiumX => Math.abs(podiumX - branchX) <= 2) &&
                Math.abs(branchX - portalX) > 17 &&
                this.getTile(branchX, branchTileY) === TILES.WATER) {
              this.setTile(branchX, branchTileY, TILES.CORAL);
            }
          }
        }
      }
    }
  }

  for (const x of [portalX - 22, portalX + 22]) {
    if (x <= left + 3 || x >= mainRight - 2) continue;
    const floor = this.surfaceHeights[x];
    const roll = Math.abs(Math.sin((x + 11) * 12.9898) * 43758.5453) % 1;
    const height = 13 + Math.floor(roll * 8);
    if (floor - seaY < height + 1 ||
        legacyShrineColumns.includes(x) ||
        podiumColumns.some(podiumX => Math.abs(podiumX - x) <= 4) ||
        Math.abs(x - portalX) <= 17) continue;
    for (let k = 1; k <= height; k++) this.setTile(x, floor - k, TILES.TALL_CORAL);
    for (const fraction of [0.3, 0.55, 0.8]) {
      const branchY = floor - Math.round(height * fraction);
      for (const side of [-1, 1]) {
        for (let length = 1; length <= 4; length++) {
          const branchX = x + side * length;
          const branchTileY = branchY - (length > 2 ? 1 : 0);
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
    },
    door: {
      left: templeLeft + 1,
      right: templeLeft + 2,
      top: templeFloorY - 3,
      bottom: templeFloorY - 1,
      leverX: templeLeft,
      leverY: templeFloorY - 2
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
      if (clearInterior || tile === TILES.WATER || tile === TILES.CORAL ||
          tile === TILES.TALL_CORAL) {
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
      if (side === -1 && y >= temple.door.top && y <= temple.door.bottom) continue;
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
      const throughDoorway = side === -1 && y >= temple.door.top && y <= temple.door.bottom;
      if (!throughDoorway) {
        place(towerX, y, y % 4 === 0 ? TILES.MARBLE : TILES.POLISHED_STONE);
        if (y >= top + 9) place(outerX, y, TILES.STONE_BRICK);
      }
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

  for (let y = temple.door.top; y <= temple.door.bottom; y++) {
    for (let x = temple.door.left; x <= temple.door.right; x++) {
      this.setTile(x, y, TILES.TEMPLE_DOOR);
    }
    for (let x = temple.door.right + 1; x <= temple.interior.left; x++) {
      this.setTile(x, y, TILES.AIR);
    }
  }
  this.setTile(temple.door.leverX, temple.door.leverY, TILES.TEMPLE_LEVER);

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

  // ---- Tide Gate frame: anchor the portal so it never reads as floating ----
  // The gate TILE must stay mid-water (the whole reef ritual is built around a
  // gate you swim up to), but a bare ellipse hanging in open water looked like
  // a bug. A stone arch rises from the temple floor to cradle the gate: two
  // pillars, a lintel over the top, and a foot pedestal under it. The gate now
  // sits in a built gateway instead of dangling in the blue.
  const floor = temple.floorY;
  const frameTop = Math.max(this.reefBounds.seaY + 1, portalY - 5);
  for (const side of [-1, 1]) {
    const px = portalX + side * 3;
    for (let y = frameTop; y < floor; y++) {
      if (this.getTile(px, y) === TILES.AIR || this.getTile(px, y) === TILES.WATER) {
        this.setTile(px, y, y % 3 === 0 ? TILES.MARBLE : TILES.POLISHED_STONE);
      }
    }
  }
  // Lintel across the top of the two pillars.
  for (let x = portalX - 3; x <= portalX + 3; x++) {
    if (this.getTile(x, frameTop) === TILES.AIR || this.getTile(x, frameTop) === TILES.WATER) {
      this.setTile(x, frameTop, TILES.MARBLE);
    }
  }
  // Pedestal directly beneath the gate, seated on the temple floor.
  for (let x = portalX - 2; x <= portalX + 2; x++) {
    if (this.getTile(x, floor - 1) === TILES.AIR || this.getTile(x, floor - 1) === TILES.WATER) {
      this.setTile(x, floor - 1, TILES.COPPER_BLOCK);
    }
  }
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
  this.migrateLegacyTallCoral();
  return true;
};

World.prototype.migrateLegacyTallCoral = function() {
  if (!this.reefBounds) return false;
  const { left, mainRight, seaY } = this.reefBounds;
  for (let x = left + 1; x < mainRight - 1; x++) {
    const floorY = this.surfaceHeights[x];
    let bottomY = floorY - 1;
    while (bottomY >= seaY && this.getTile(x, bottomY) !== TILES.CORAL) bottomY--;
    if (bottomY < seaY) continue;
    let topY = bottomY;
    while (topY > seaY && this.getTile(x, topY - 1) === TILES.CORAL) topY--;
    if (bottomY - topY + 1 < 16) continue;
    for (let y = topY; y < bottomY - 2; y++) {
      this.setTile(x, y, TILES.TALL_CORAL);
    }
  }
  this._tileCacheDirty = true;
  return true;
};

World.prototype.advanceReefTempleDoor = function(dt) {
  const door = this.reefTemple && this.reefTemple.door;
  if (!door || this.getTile(door.leverX, door.leverY) !== TILES.TEMPLE_LEVER_PULLED) return;
  this.reefTempleDoorTimer = (this.reefTempleDoorTimer || 0) + Math.max(0, dt);
  while (this.reefTempleDoorTimer >= 0.72) {
    let openedRow = false;
    for (let y = door.top; y <= door.bottom; y++) {
      let rowHasDoor = false;
      for (let x = door.left; x <= door.right; x++) {
        if (this.getTile(x, y) === TILES.TEMPLE_DOOR) rowHasDoor = true;
      }
      if (rowHasDoor) {
        for (let x = door.left; x <= door.right; x++) {
          if (this.getTile(x, y) === TILES.TEMPLE_DOOR) this.setTile(x, y, TILES.AIR);
        }
        openedRow = true;
        break;
      }
    }
    if (!openedRow) {
      this.reefTempleDoorTimer = 0;
      return;
    }
    this.reefTempleDoorTimer -= 0.72;
  }
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

World.prototype.buildOceanShipwreck = function(cx, groundY, seaY) {
  if (cx < 4 || cx >= this.width - 4) return;
  const set = (x, y, tile) => {
    if (x < 0 || x >= this.width || y < 0 || y >= this.height) return;
    // Never carve a wreck into open water: a column whose ground is still
    // below the waterline is left alone, so the hull always sits on dry sand.
    this.setTile(x, y, tile);
  };
  const waterline = Number.isFinite(seaY) ? seaY
    : (this.oceanArena ? this.oceanArena.seaY : this.surfaceHeights[cx]);
  const dry = (x) => x >= 0 && x < this.width && this.surfaceHeights[x] < waterline;
  // A broken hull: a wide, low arc of barnacled hull with a plank deck on top,
  // sitting on the beach. The prow is lifted and cracked open so it reads as
  // wrecked rather than moored.
  const hullLeft = cx - 4;
  const hullRight = cx + 4;
  for (let x = hullLeft; x <= hullRight; x++) {
    if (!dry(x)) continue;
    const t = (x - hullLeft) / Math.max(1, hullRight - hullLeft);
    // Hull is deepest in the middle and rises toward both broken ends.
    const rise = Math.round(Math.abs(t - 0.5) * 4);
    const deckY = groundY - 3 + rise;
    for (let y = deckY + 1; y <= groundY; y++) set(x, y, OCEAN_TILES.WRECK_HULL);
    set(x, deckY, OCEAN_TILES.WRECK_PLANK);
  }
  // The cracked stern stands a little higher and opens into a cabin mouth.
  for (let y = groundY - 6; y <= groundY - 3; y++) {
    set(hullLeft, y, OCEAN_TILES.WRECK_HULL);
    set(hullRight, y, OCEAN_TILES.WRECK_HULL);
  }
  set(hullLeft, groundY - 7, OCEAN_TILES.WRECK_PLANK);
  set(hullRight, groundY - 7, OCEAN_TILES.WRECK_PLANK);
  // Interior air pocket inside the hull, so there is somewhere to stand.
  for (let x = hullLeft + 1; x < hullRight; x++) {
    for (let y = groundY - 2; y <= groundY - 1; y++) set(x, y, TILES.AIR);
  }
  // A leaning, broken mast — climbable planks rising out of the deck.
  const mastX = cx + 1;
  const mastTop = groundY - 13;
  for (let y = mastTop; y <= groundY - 4; y++) set(mastX, y, OCEAN_TILES.WRECK_MAST);
  // A cross-yard near the top, with one broken half missing.
  set(mastX - 1, mastTop + 3, OCEAN_TILES.WRECK_MAST);
  set(mastX - 2, mastTop + 3, OCEAN_TILES.WRECK_MAST);
  set(mastX + 1, mastTop + 5, OCEAN_TILES.WRECK_PLANK);
  // A couple of chests half-buried in the sand, so the loot is on the shore too.
  this.oceanWreckChests = this.oceanWreckChests || [];
  if (dry(hullLeft + 1)) this.oceanWreckChests.push({ x: hullLeft + 1, y: groundY - 1 });
  if (dry(hullRight - 1)) this.oceanWreckChests.push({ x: hullRight - 1, y: groundY - 1 });
  this._tileCacheDirty = true;
};

/**
 * A sunken ruins: a broken marble hall hunched on the seabed, half-swallowed by
 * the abyss. Two standing wall stubs, a collapsed roof, a marble floor, a couple
 * of loot chests and a lonely torch — a place that reads as "something important
 * drowned here". Built on a confirmed seabed column so it never floats.
 */
World.prototype.buildSunkenRuins = function(cx, groundY) {
  if (cx < 6 || cx >= this.width - 6) return;
  const set = (x, y, tile) => {
    if (x < 1 || x >= this.width || y < 1 || y >= this.height) return;
    this.setTile(x, y, tile);
  };
  const halfW = 4;
  const floorY2 = groundY;                 // the hall floor sits on the seabed
  const wallH = 5;
  // Floor slab.
  for (let x = cx - halfW; x <= cx + halfW; x++) set(x, floorY2, TILES.POLISHED_STONE);
  // Two end walls (the middle has collapsed away).
  for (const wx of [cx - halfW, cx + halfW]) {
    for (let k = 1; k <= wallH; k++) set(wx, floorY2 - k, k % 2 === 0 ? TILES.MARBLE : TILES.POLISHED_STONE);
    set(wx, floorY2 - wallH - 1, TILES.MARBLE); // capstone
  }
  // A partial roof beam sagging between the walls.
  for (let x = cx - halfW + 1; x <= cx + 1; x++) set(x, floorY2 - wallH - 1, TILES.MARBLE);
  // A toppled column in the middle of the hall.
  set(cx, floorY2 - 1, TILES.MARBLE);
  set(cx, floorY2 - 2, TILES.MARBLE);
  // Loot + a guttering torch so the ruin glows in the dark.
  this.oceanWreckChests = this.oceanWreckChests || [];
  this.oceanWreckChests.push({ x: cx - 2, y: floorY2 - 1 });
  this.oceanWreckChests.push({ x: cx + 2, y: floorY2 - 1 });
  set(cx - halfW + 1, floorY2 - 2, TILES.TORCH);
  set(cx + halfW - 1, floorY2 - 2, TILES.TORCH);
  this._tileCacheDirty = true;
};

World.prototype.generateOceanPlanet = function() {
  this.tiles.fill(TILES.AIR);
  this.walls.fill(0);
  const seaY = Math.max(24, Math.floor(this.height * 0.24));
  const floorY = this.height - 18;
  this.surfaceHeights.fill(floorY);

  // ---- The abyssal planet is a WORLD OF ISLANDS, not a tank of water ----
  // The sea surface (seaY) and the seabed (floorY) stay flat, but a handful of
  // rolling islands rise out of the water. The player spawns on the first one;
  // the rest are places to explore. Every column is still carved the same way
  // (bedrock, water, seabed), so the island bumps are the only irregularity and
  // nothing here can produce a floating tile.
  const islandCount = 5 + Math.floor(Math.random() * 3);
  const islands = [];
  const minGap = 34;
  const margin = 24;
  const usable = Math.max(1, this.width - margin * 2);
  for (let i = 0; i < islandCount; i++) {
    // Evenly spaced with jitter, so no two islands ever merge into one blob.
    const base = margin + (usable * (i + 0.5)) / islandCount;
    const jitter = (Math.random() - 0.5) * (usable / islandCount) * 0.5;
    const cx = Math.max(margin, Math.min(this.width - margin - 1,
      Math.round(base + jitter)));
    if (islands.some(other => Math.abs(other.cx - cx) < minGap)) continue;
    const halfWidth = 9 + Math.floor(Math.random() * 9);
    const height = 6 + Math.floor(Math.random() * 9);
    islands.push({ cx, halfWidth, height });
  }

  // ---- Small stepping-stone islets -------------------------------------
  // The big islands sit far apart; a swimmer needs somewhere to surface and
  // stand mid-channel instead of drowning between them. These short, dry sand
  // bumps rise just above the waterline so you can hop across the sea. They
  // are terrain only — never the spawn, the boss, or a wreck.
  const islets = [];
  for (let i = 0; i + 1 < islands.length; i++) {
    const a = islands[i], b = islands[i + 1];
    const gap = b.cx - a.cx;
    if (gap < 44) continue;
    const mid = (a.cx + b.cx) / 2;
    const spots = gap > 96 ? [mid - gap * 0.16, mid + gap * 0.16] : [mid];
    for (const sx of spots) {
      const cx = Math.round(sx);
      if (cx < margin || cx > this.width - margin - 1) continue;
      if (islands.some(o => Math.abs(o.cx - cx) < 18)) continue;
      if (islets.some(o => Math.abs(o.cx - cx) < 12)) continue;
      islets.push({ cx, halfWidth: 2 + Math.floor(Math.random() * 3),
        height: 3 + Math.floor(Math.random() * 3), islet: true });
    }
  }

  const allIslands = islands.concat(islets);

  // A smooth, deterministic height profile for the whole world. The base
  // ground is the deep seabed (floorY); each island is a broad cosine mound
  // that rises all the way above the waterline, so its flanks pass through
  // seaY as a beach and its crown is dry land.
  const groundHeight = new Int16Array(this.width);
  for (let x = 0; x < this.width; x++) {
    let ground = floorY;
    for (const island of allIslands) {
      const d = Math.abs(x - island.cx);
      if (d > island.halfWidth) continue;
      const t = d / island.halfWidth;
      const bump = Math.cos((t * Math.PI) / 2);
      const surf = Math.round(floorY - (floorY - (seaY - island.height)) * bump);
      if (surf < ground) ground = surf;
    }
    groundHeight[x] = ground;
  }

  for (let x = 0; x < this.width; x++) {
    const ground = groundHeight[x];
    this.surfaceHeights[x] = ground;
    const islandColumn = ground < seaY;
    // Flood every air tile between the waterline and the ground. Over open
    // ocean that is the whole water column; over an island it is only the
    // shallow shelf around the beach.
    for (let y = seaY; y < ground; y++) this.setTile(x, y, TILES.WATER);
    // Beach/soil for the exposed island cap, then the seabed proper.
    if (islandColumn) {
      this.setTile(x, ground, TILES.SAND);
      for (let y = ground + 1; y < ground + 4 && y < this.height; y++) {
        this.setTile(x, y, TILES.DIRT);
      }
      for (let y = ground + 4; y < this.height; y++) this.setTile(x, y, TILES.STONE);
    } else {
      this.setTile(x, ground, x % 5 === 0 ? TILES.SANDSTONE : TILES.SAND);
      for (let y = ground + 1; y < this.height; y++) this.setTile(x, y, TILES.STONE);
    }
    // Coral gardens still dress the deep reef, but never inside an island.
    if (!islandColumn && x % 13 === 0) {
      for (let k = 1; k <= 1 + (x % 3); k++) {
        if (this.getTile(x, ground - k) === TILES.WATER) this.setTile(x, ground - k, TILES.CORAL);
      }
    }
  }

  // ---- The abyssal UNDERGROUND: carved caverns beneath the seabed ----
  // The planet used to be solid stone from the seabed straight to the map
  // floor — nothing to dig, no reason to go deep. Now a handful of air
  // caverns, ore seams and glowing crystals is tunnelled through the rock below
  // the seabed, so the abyss has a real underworld to mine and explore. Caverns
  // never break the seabed surface (they start a few tiles under `ground`) and
  // never touch the island crowns, so the water above always stays sealed.
  const cavernCount = 40 + Math.floor(Math.random() * 20);
  for (let c = 0; c < cavernCount; c++) {
    // Random walk: a blob of cavern grows from a seed, never above the local
    // seabed plus a 4-tile roof, so the ocean can never drain into a cave.
    let cx0 = 4 + Math.floor(Math.random() * (this.width - 8));
    const localGround = groundHeight[Math.min(this.width - 1, Math.max(0, cx0))];
    let cy0 = Math.min(this.height - 4,
      localGround + 5 + Math.floor(Math.random() * Math.max(3, (this.height - localGround) - 8)));
    const steps = 10 + Math.floor(Math.random() * 22);
    let ang = Math.random() * Math.PI * 2;
    for (let s = 0; s < steps; s++) {
      ang += (Math.random() - 0.5) * 1.4;
      cx0 += Math.round(Math.cos(ang));
      cy0 += Math.round(Math.sin(ang) * 0.7);
      const roof = groundHeight[Math.min(this.width - 1, Math.max(0, cx0))] + 4;
      if (cx0 < 3 || cx0 > this.width - 4) break;
      if (cy0 < roof || cy0 > this.height - 3) { cy0 = Math.max(roof, Math.min(this.height - 3, cy0)); }
      // Carve a small round pocket of air.
      const r = 1 + Math.floor(Math.random() * 2);
      for (let dy = -r; dy <= r; dy++) {
        for (let dx = -r; dx <= r; dx++) {
          if (dx * dx + dy * dy > r * r + 1) continue;
          const px = cx0 + dx, py = cy0 + dy;
          if (px < 1 || px >= this.width - 1 || py < 1 || py >= this.height) continue;
          if (py < groundHeight[px] + 3) continue; // keep the seabed roof solid
          if (this.getTile(px, py) === TILES.STONE) this.setTile(px, py, TILES.AIR);
        }
      }
    }
  }
  // Ore + crystals dress the cavern floors: iron and gold in the stone, and a
  // vein of glowing crystal so the deep abyss is lit and worth diving for.
  for (let x = 2; x < this.width - 2; x++) {
    for (let y = groundHeight[x] + 5; y < this.height - 2; y++) {
      const tile = this.getTile(x, y);
      if (tile !== TILES.STONE) continue;
      const roll = Math.random();
      if (roll < 0.012) this.setTile(x, y, TILES.IRON_ORE);
      else if (roll < 0.018) this.setTile(x, y, TILES.GOLD_ORE);
      else if (roll < 0.0205) this.setTile(x, y, TILES.CRYSTAL);
      // A crystal stuck to a cavern ceiling sparkles the whole chamber.
      else if (roll < 0.024 && this.getTile(x, y - 1) === TILES.AIR) {
        this.setTile(x, y, TILES.CRYSTAL);
      }
    }
  }

  // ---- Shipwrecks: lootable ruins on the island shores ----
  // Each wreck is a broken hull half-buried in the beach, with a cracked mast,
  // and every plank tile carries loot (see OCEAN_TILES.WRECK_PLANK). A `wreck`
  // record is kept so the save migration and the minimap can find them again.
  this.shipwrecks = [];
  this.oceanWreckChests = [];
  for (const island of islands) {
    if (island.height < 6) continue; // only the substantial islands keep a wreck
    const side = Math.random() < 0.5 ? -1 : 1;
    // Walk out from the crown toward the chosen shore until the ground is
    // comfortably dry, so the whole hull sits on land instead of half-flooded.
    let wx = null;
    for (let step = 0; step <= island.halfWidth; step++) {
      const candidate = island.cx + side * step;
      if (candidate < 6 || candidate > this.width - 7) break;
      if (groundHeight[candidate] <= seaY - 2) { wx = candidate; break; }
    }
    if (wx === null) continue;
    const ground = groundHeight[wx];
    this.buildOceanShipwreck(wx, ground, seaY);
    this.shipwrecks.push({ x: wx, y: ground, side });
  }

  // ---- Sunken ruins on the open seabed, between the islands ----
  // A couple of drowned marble halls hunched on the abyssal floor, well clear of
  // any island crown, so the deep water has landmarks of its own to dive to.
  this.sunkenRuins = [];
  for (let attempt = 0; attempt < 24 && this.sunkenRuins.length < 3; attempt++) {
    const rx = 10 + Math.floor(Math.random() * (this.width - 20));
    // Only on genuine open seabed: no island crown within a wide margin, so the
    // hall never collides with a beach or a wreck.
    const near = allIslands.some(o => Math.abs(o.cx - rx) < o.halfWidth + 10);
    if (near) continue;
    if (groundHeight[rx] < seaY + 6) continue; // must be real deep floor, not a shore
    this.buildSunkenRuins(rx, groundHeight[rx]);
    this.sunkenRuins.push({ x: rx, y: groundHeight[rx] });
  }

  const portalX = Math.floor(this.width * 0.33);
  for (let y = floorY - 4; y < floorY; y++) this.setTile(portalX, y, TILES.OCEAN_PORTAL);

  // ---- Dress the spawn island so it reads as "home", not bare sand ----
  // A beach you wash up on should have palms for shade, a campfire and torches
  // for light, a little dock lapping into the water, and scattered shore grass.
  // Everything is placed on confirmed dry land (ground < seaY) with clear air
  // overhead, so nothing floats and the player never spawns inside a prop.
  const spawnIsland = islands[0];
  if (spawnIsland) {
    const crown = spawnIsland.cx;
    const isDry = (x) => x >= 2 && x < this.width - 2 && groundHeight[x] < seaY;
    const clear = (x, y) => this.getTile(x, y) === TILES.AIR &&
      this.getTile(x, y - 1) === TILES.AIR;
    // Palms: a 3-tall trunk with a leafy crown, set back from the exact spawn
    // column so they frame the beach instead of blocking it.
    const plantPalm = (x) => {
      if (!isDry(x)) return;
      const g = groundHeight[x];
      for (let k = 1; k <= 3; k++) this.setTile(x, g - k, TILES.WOOD);
      const topY = g - 4;
      this.setTile(x - 1, topY, TILES.MANGROVE_LEAVES);
      this.setTile(x + 1, topY, TILES.MANGROVE_LEAVES);
      this.setTile(x, topY, TILES.MANGROVE_LEAVES);
      this.setTile(x, topY - 1, TILES.MANGROVE_LEAVES);
    };
    for (const off of [-6, -4, 4, 6]) plantPalm(crown + off);
    // Campfire + a ring of torches at the heart of the camp.
    const fireX = crown;
    if (isDry(fireX) && clear(fireX, groundHeight[fireX] - 1)) {
      this.setTile(fireX, groundHeight[fireX] - 1, TILES.CAMPFIRE);
    }
    for (const off of [-3, -2, 2, 3]) {
      const tx = crown + off;
      if (isDry(tx) && clear(tx, groundHeight[tx] - 1)) {
        this.setTile(tx, groundHeight[tx] - 1, TILES.TORCH);
      }
    }
    // A short wooden dock reaching from the beach out over the water.
    const dockX = crown + (spawnIsland.halfWidth - 2 > 0 ? Math.min(4, spawnIsland.halfWidth - 1) : -4);
    const dir = dockX >= crown ? 1 : -1;
    for (let s = 0; s < 5; s++) {
      const dx = dockX + dir * s;
      if (dx < 2 || dx >= this.width - 2) break;
      const surf = Math.min(groundHeight[dx], seaY - 1);
      if (this.getTile(dx, surf) === TILES.AIR) this.setTile(dx, surf, TILES.WOOD_PLATFORM);
    }
    // Shore grass and the occasional flower across the dry cap.
    for (let x = crown - spawnIsland.halfWidth; x <= crown + spawnIsland.halfWidth; x++) {
      if (!isDry(x)) continue;
      const g = groundHeight[x];
      if (!clear(x, g - 1)) continue;
      const roll = Math.random();
      if (roll < 0.16) this.setTile(x, g - 1, TILES.TALL_GRASS);
      else if (roll < 0.24) this.setTile(x, g - 1, TILES.FLOWER);
    }
  }

  // Spawn on the first island's beach, not in open water. The Kraken breaches
  // the WATER SURFACE just off that same shore — visible the instant you land —
  // then stalks you across the sea, so the arena is a real place with ground to
  // fight on and the boss is never a silent speck a screen (or a seabed) away.
  const bossX = spawnIsland ? spawnIsland.cx + spawnIsland.halfWidth + 5 : Math.floor(this.width * 0.38);
  const bossStandX = Math.max(6, Math.min(this.width - 7, bossX));
  const arena = {
    seaY,
    floorY,
    portalX,
    islands,
    shipwrecks: this.shipwrecks,
    spawnX: (spawnIsland ? spawnIsland.cx : Math.floor(this.width * 0.34)) * TILE_SIZE,
    spawnY: (Math.max(2, groundHeight[spawnIsland ? spawnIsland.cx : Math.floor(this.width * 0.34)] - 2)) * TILE_SIZE,
    // Rise out of the water, not the seabed: the eye sits around the waterline
    // (seaY), the mantle breaches it, and the tentacles trail down into the deep.
    bossX: bossStandX * TILE_SIZE,
    bossY: Math.max(2, seaY - 3) * TILE_SIZE
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
  const time = Date.now() * 0.001;

  // ---- Base water column: a deep reef gradient, brighter toward the surface --
  let cache = this._oceanBackgroundCache;
  if (!cache || cache.width !== width || cache.height !== height) {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const background = canvas.getContext('2d');
    const gradient = background.createLinearGradient(0, 0, 0, height);
    gradient.addColorStop(0, '#0e7490');     // sunlit surface
    gradient.addColorStop(0.30, '#0c4a6e');
    gradient.addColorStop(0.62, '#082f49');
    gradient.addColorStop(1, '#020617');     // lightless deep
    background.fillStyle = gradient;
    background.fillRect(0, 0, width, height);
    cache = this._oceanBackgroundCache = { canvas, width, height };
  }
  ctx.drawImage(cache.canvas, 0, 0);

  // ---- Caustics: rippling bands of light where the surface chops the sun ----
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  for (let i = 0; i < 5; i++) {
    const y = 20 + i * 34 + Math.sin(time * 0.6 + i) * 6;
    ctx.strokeStyle = 'rgba(165, 243, 252, ' + (0.05 + 0.03 * Math.sin(time + i * 1.7)).toFixed(3) + ')';
    ctx.lineWidth = 10 + i * 3;
    ctx.beginPath();
    for (let x = -20; x <= width + 20; x += 24) {
      const wy = y + Math.sin(x * 0.02 + time * 1.4 + i) * 7 + Math.sin(x * 0.05 - time) * 3;
      if (x === -20) ctx.moveTo(x, wy); else ctx.lineTo(x, wy);
    }
    ctx.stroke();
  }
  ctx.restore();

  // ---- God rays: soft shafts angling down from the surface ----
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  for (let i = 0; i < 6; i++) {
    const baseX = ((i * 260 - camera.x * 0.10) % (width + 400) + width + 400) % (width + 400) - 200;
    const sway = Math.sin(time * 0.3 + i * 1.3) * 30;
    const topW = 26 + (i % 3) * 14;
    const g = ctx.createLinearGradient(0, 0, 0, height * 0.9);
    g.addColorStop(0, 'rgba(186, 230, 253, 0.10)');
    g.addColorStop(1, 'rgba(186, 230, 253, 0)');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.moveTo(baseX + sway, -10);
    ctx.lineTo(baseX + sway + topW, -10);
    ctx.lineTo(baseX + sway + topW * 3 + 90, height * 0.9);
    ctx.lineTo(baseX + sway + 90, height * 0.9);
    ctx.closePath();
    ctx.fill();
  }
  ctx.restore();

  // ---- Drifting particulate: motes of marine snow hanging in the water ----
  ctx.save();
  for (let i = 0; i < 40; i++) {
    const seed = i * 12.9898;
    const drift = (camera.x * 0.05 + time * (6 + (i % 5) * 3)) % (width + 40);
    const px = ((Math.sin(seed) * 0.5 + 0.5) * width + drift) % (width + 40) - 20;
    const py = ((Math.cos(seed * 1.7) * 0.5 + 0.5) * height + Math.sin(time * 0.5 + i) * 8) % height;
    const r = 0.8 + (i % 3) * 0.6;
    ctx.fillStyle = 'rgba(165, 243, 252, ' + (0.10 + (i % 4) * 0.05).toFixed(3) + ')';
    ctx.beginPath(); ctx.arc(px, py, r, 0, Math.PI * 2); ctx.fill();
  }
  ctx.restore();

  // ---- Parallax reef silhouettes: distant coral/rock ridge, then kelp ----
  // Two depth bands keyed to camera.x so the whole scene scrolls like water.
  const reefRidge = (parallax, baseFrac, color, amp, seedOff) => {
    const off = camera.x * parallax;
    const baseY = height * baseFrac;
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(-10, height + 10);
    for (let x = -10; x <= width + 10; x += 18) {
      const wx = x + off;
      const n = Math.sin(wx * 0.006 + seedOff) * amp
        + Math.sin(wx * 0.017 + seedOff * 2) * amp * 0.5
        + Math.abs(Math.sin(wx * 0.04 + seedOff)) * amp * 0.25;
      ctx.lineTo(x, baseY - n);
    }
    ctx.lineTo(width + 10, height + 10);
    ctx.closePath();
    ctx.fill();
  };
  reefRidge(0.08, 0.86, '#04222f', 46, 1.3);   // far ridge, darkest
  reefRidge(0.16, 0.96, '#020e17', 34, 4.7);   // near ridge

  // Kelp/coral fronds swaying in the foreground current, deterministic per x.
  const frond = (wx, baseY, hgt, color, phase) => {
    const sx = wx - camera.x * 0.22;
    if (sx < -40 || sx > width + 40) return;
    ctx.strokeStyle = color;
    ctx.lineWidth = 4;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(sx, baseY);
    const segs = 5;
    for (let s = 1; s <= segs; s++) {
      const tt = s / segs;
      const sway = Math.sin(time * 1.1 + phase + tt * 2) * 12 * tt;
      ctx.lineTo(sx + sway, baseY - hgt * tt);
    }
    ctx.stroke();
    // A couple of leafy blobs on the frond.
    ctx.fillStyle = color;
    for (const tt of [0.5, 0.8]) {
      const sway = Math.sin(time * 1.1 + phase + tt * 2) * 12 * tt;
      ctx.beginPath();
      ctx.ellipse(sx + sway + 5, baseY - hgt * tt, 5, 3, 0.5, 0, Math.PI * 2);
      ctx.fill();
    }
  };
  for (let i = 0; i < 14; i++) {
    const wx = i * 97 + 30;
    frond(wx, height * 0.99, 90 + (i % 4) * 40, i % 2 ? '#053b30' : '#064e3b', i * 0.9);
  }
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

// ============================================================
// THE ABYSSAL KRAKEN — the ocean-planet boss.
//
// Replaces the three-headed Sea Leviathan wholesale: one giant mantle,
// eight animated tentacles, and a single glowing eye that is the fight's
// whole damage story — the eye weakpoint soaks 1.4x while the armoured
// mantle shrugs off a third of every blow, so players learn to aim.
//
// Kit: a telegraphed Ink Blindness burst (catching you inside it applies
// the ink_blindness debuff — see juice.js BUFF_DEFS), a tentacle slam,
// and volleys of hostile ink globs that blind on contact.
//
// The old name stays exported (window.OceanLeviathan) because app.py's
// inline probe, the HTML onload probe and older hooks still look for it —
// the Kraken simply occupies the slot the Leviathan used to hold.
// ============================================================
class Kraken {
  constructor(x, y, game) {
    this.kind = 'kraken';
    this.name = 'ABYSSAL KRAKEN';
    this.x = x;
    this.y = y;
    this.width = 340;
    this.height = 230;
    this.maxHp = 110000;
    this.hp = 110000;
    this.phase = 1;
    this.dead = false;
    this.game = game;
    this.lightRadius = 270;
    this.glowRadius = 150;
    this.lightColor = [168, 85, 247];
    this.animT = 0;
    this.attackTimer = 2.3;
    /** Armed telegraphed skill: { type, x, y, radius, timer, total } */
    this.pending = null;
    this.hitFlash = 0;
  }

  /**
   * Hittable points: the glowing eye (weakpoint, `eye: true`) and three
   * armoured mantle nodes (`body: true`). Tentacle roots are decorative —
   * swings along the skirt still land on a mantle node, so melee never
   * whiffs against a body that visually fills the arc.
   */
  headTargets() {
    const cx = this.x + this.width * 0.5;
    const bob = Math.sin(this.animT * 2) * 6;
    return [
      { x: cx, y: this.y + 52 + bob, r: 28, head: true, eye: true, index: 0 },
      { x: cx - 74, y: this.y + 84 + bob * 0.5, r: 44, body: true, index: 1 },
      { x: cx + 74, y: this.y + 84 + bob * 0.5, r: 44, body: true, index: 2 },
      { x: cx, y: this.y + 124, r: 52, body: true, index: 3 }
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
    // The eye is the whole fight: it eats 1.4x. The armoured mantle shrugs
    // off a third of everything (0.65x). Aiming at the glow is rewarded;
    // flailing at the body grinds through 110k HP the slow way.
    const mult = target && target.eye ? 1.4 : target && target.body ? 0.65 : 1;
    return Math.max(1, Math.round(damage * mult));
  }

  takeDamage(amount, sound, particles, critical = false) {
    if (this.dead) return 0;
    const damage = Math.max(1, Math.round(amount));
    this.hp = Math.max(0, this.hp - damage);
    this.hitFlash = 0.2;
    if (sound) sound.playHit();
    if (particles) {
      particles.addDamageText(this.x + this.width / 2, this.y, damage,
        critical ? '#fef08a' : '#d8b4fe', critical);
      particles.magicSparkle(this.x + this.width / 2, this.y + this.height / 2, '#a855f7', 5);
    }
    const phase = this.hp <= this.maxHp / 3 ? 3 : this.hp <= this.maxHp * 2 / 3 ? 2 : 1;
    if (phase > this.phase) {
      this.phase = phase;
      this.name = phase === 3 ? 'WOUNDED KRAKEN · LAST INK'
        : 'ENRAGED KRAKEN · INK STORM';
      if (sound) sound.playBossRoar();
      if (this.game && this.game.feel) this.game.feel.shake(0.8);
    }
    if (this.hp <= 0) {
      this.dead = true;
      if (sound) sound.playExplosion();
      if (particles) particles.magicSparkle(this.x + this.width / 2, this.y, '#a855f7', 100);
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

    // ---- The Kraken stalks you across the sea, smoothly -----------------
    // A leviathan that parked off-screen and never moved was the whole reason
    // the fight felt broken. It now accelerates toward the player with real
    // inertia — thrust toward a hover point, then water drag — so it glides and
    // leans into its turns like something heavy swimming, instead of snapping
    // along a straight line. A lazy swim-cycle bob keeps it alive at range.
    if (target && !this.dead) {
      const world = this.game && this.game.world;
      const pcx = target.x + target.width / 2;
      const pcy = target.y + target.height / 2;
      const ccx = this.x + this.width / 2;
      const ccy = this.y + this.height * 0.45;

      // Desired hover point: hold station a little off the player, orbiting
      // slowly so it never sits perfectly still. The orbit radius grows with
      // phase so later phases loom from further out.
      const orbit = 300 + this.phase * 30;
      const orbitAng = this.animT * 0.25;
      const goalX = pcx + Math.cos(orbitAng) * orbit;
      const goalY = pcy + Math.sin(orbitAng * 0.7) * orbit * 0.5 - 20;

      // Steering: accelerate toward the goal, capped by a max speed that rises
      // with phase. This is thrust, not teleport-on-a-line.
      const dx = goalX - ccx;
      const dy = goalY - ccy;
      const dist = Math.hypot(dx, dy) || 1;
      const maxSpeed = 150 + this.phase * 45;
      // Ease the thrust off as it arrives, so it settles instead of overshooting.
      const arrive = Math.min(1, dist / 160);
      const ax = (dx / dist) * maxSpeed * arrive;
      const ay = (dy / dist) * maxSpeed * arrive;
      // Velocity integrates thrust, then drag bleeds it off (frame-rate safe).
      this.vx = (this.vx || 0) + ax * dt;
      this.vy = (this.vy || 0) + ay * dt;
      const drag = Math.pow(0.12, dt); // strong water drag
      this.vx *= drag;
      this.vy *= drag;
      this.x += this.vx * dt;
      this.y += this.vy * dt;

      // Lean into the direction of travel — a heavy body banks as it turns.
      this.lean = (this.lean || 0) + ((this.vx / (maxSpeed * 2)) - (this.lean || 0)) * Math.min(1, dt * 4);

      // A slow vertical swim cycle so it undulates even while holding station.
      this.y += Math.sin(this.animT * 1.1) * 10 * dt;

      if (world) {
        this.x = Math.max(0, Math.min(world.pixelWidth - this.width, this.x));
        this.y = Math.max(0, Math.min(world.pixelHeight - this.height, this.y));
      }
    }

    // Wind up the armed telegraph; it resolves through resolvePending().
    if (this.pending) {
      this.pending.timer -= dt;
      if (this.pending.timer <= 0) this.resolvePending(sound, particles);
    }

    this.attackTimer -= dt;
    if (this.attackTimer <= 0 && target && !this.pending) {
      const px = target.x + target.width / 2;
      const py = target.y + target.height / 2;
      const roll = Math.random();
      if (roll < 0.26) {
        // INK BLINDNESS BURST — telegraphed circle on your position; caught
        // inside means the debuff, not just damage. Dodge = counterplay.
        this.pending = {
          type: 'ink_burst', x: px, y: py,
          radius: 130 + this.phase * 20, timer: 0.95, total: 0.95
        };
      } else if (roll < 0.46) {
        // TENTACLE SLAM — telegraphed circle, pure damage, no debuff.
        this.pending = {
          type: 'slam', x: px, y: py,
          radius: 95 + this.phase * 15, timer: 0.7, total: 0.7
        };
      } else if (roll < 0.62) {
        // INK GEYSER — three erupting columns burst out of the water around
        // you a beat later. Reads as the seabed vomiting ink; stay moving.
        this.pending = {
          type: 'geyser', x: px, y: py,
          radius: 120 + this.phase * 15, timer: 1.1, total: 1.1,
          vents: [-1, 0, 1]
        };
      } else if (roll < 0.78) {
        // WHIRLPOOL — a spiralling vortex opens under you and drags you toward
        // its core while it spins up, then collapses. The pull is the threat.
        this.pending = {
          type: 'whirlpool', x: px, y: py,
          radius: 150 + this.phase * 20, timer: 1.3, total: 1.3
        };
      } else if (roll < 0.86) {
        // TENTACLE SWEEP — a single arm scythes across a wide arc in front of
        // the Kraken. The telegraph is a sweeping wedge, not a circle.
        const toward = Math.atan2(py - (this.y + this.height * 0.5),
          px - (this.x + this.width * 0.5));
        this.pending = {
          type: 'sweep', x: this.x + this.width * 0.5, y: this.y + this.height * 0.6,
          radius: 210 + this.phase * 25, angle: toward, timer: 0.85, total: 0.85
        };
      } else if (roll < 0.96) {
        // TENTACLE BARRAGE — a ring of tentacles stabs up from the deep in a
        // sequence, each at its own delay. The whole arena lights up with warning
        // spikes; you have to keep moving between the beats.
        this.pending = {
          type: 'barrage', x: px, y: py,
          radius: 150 + this.phase * 20, timer: 1.5, total: 1.5,
          // Six stab points around the player, staggered.
          stabs: [0, 1, 2, 3, 4, 5].map(i => {
            const a = (i / 6) * Math.PI * 2;
            return {
              x: px + Math.cos(a) * (110 + this.phase * 20),
              y: py + Math.sin(a) * 60,
              at: 0.25 + i * 0.18 // stagger, in seconds from the start
            };
          })
        };
      } else if (projectiles && typeof Projectile === 'function') {
        // INK GLOB VOLLEY — immediate spread of hostile globs.
        this.fireInkGlobs(target, projectiles);
      }
      // (In a QA sandbox with no Projectile class the volley branch is
      // skipped and the cooldown simply recycles — never a thrown ReferenceError.)
      this.attackTimer = Math.max(1.2, 3.0 - this.phase * 0.5);
      if (sound) sound.playBossRoar();
    }

    // ---- Barrage stab timing: fire each tentacle stab as its beat arrives ----
    if (this.pending && this.pending.type === 'barrage') {
      const p = this.pending;
      const elapsed = p.total - p.timer;
      for (const stab of p.stabs) {
        if (!stab.done && elapsed >= stab.at) {
          stab.done = true;
          if (particles) particles.bloodBurst(stab.x, stab.y, '#7f1d3a', 18);
          if (this.game && this.game.player) {
            const pl = this.game.player;
            if (Math.hypot(pl.x + pl.width / 2 - stab.x, pl.y + pl.height / 2 - stab.y) <= 60) {
              this.game.damagePlayer(40 + this.phase * 14, stab.x,
                'A tentacle speared up out of the deep!', true, stab.y);
            }
          }
          if (sound) sound.playHit();
          if (this.game && this.game.feel) this.game.feel.shake(0.3);
        }
      }
    }

    // ---- Whirlpool drag: while it spins up, haul the player toward the core --
    if (this.pending && this.pending.type === 'whirlpool' && target) {
      const p = this.pending;
      const px = target.x + target.width / 2;
      const py = target.y + target.height / 2;
      const dx = p.x - px, dy = p.y - py;
      const dist = Math.hypot(dx, dy) || 1;
      if (dist < p.radius * 2.2 && dist > 4) {
        // Pull strengthens as the timer runs down; a real inward current.
        const pull = (1 - p.timer / p.total) * 150 * dt;
        target.x += (dx / dist) * pull;
        target.y += (dy / dist) * pull * 0.7;
      }
    }
  }

  /** Resolve a spent telegraph: damage, the blindness debuff, and the show. */
  resolvePending(sound, particles) {
    const p = this.pending;
    this.pending = null;
    if (!p) return;
    const player = this.game && this.game.player;
    const ppx = player ? player.x + player.width / 2 : 0;
    const ppy = player ? player.y + player.height / 2 : 0;
    if (p.type === 'ink_burst') {
      if (particles) particles.magicSparkle(p.x, p.y, '#f43f5e', 34);
      if (player && Math.hypot(ppx - p.x, ppy - p.y) <= p.radius) {
        this.game.damagePlayer(30 + this.phase * 10, p.x,
          'The Kraken’s ink cloud blinded you!', true, p.y);
        if (this.game.buffs) this.game.buffs.add('ink_blindness', 14);
        if (this.game.feel) this.game.feel.shake(0.35);
      }
    } else if (p.type === 'slam') {
      if (particles) particles.bloodBurst(p.x, p.y, '#7f1d3a', 22);
      if (player && Math.hypot(ppx - p.x, ppy - p.y) <= p.radius) {
        this.game.damagePlayer(44 + this.phase * 14, p.x,
          'A Kraken tentacle slam crushed you!', true, p.y);
      }
    } else if (p.type === 'geyser') {
      // Three columns erupt; each vent is its own damage + ink check.
      if (particles) {
        for (const v of (p.vents || [-1, 0, 1])) {
          particles.magicSparkle(p.x + v * 70, p.y, '#f43f5e', 26);
        }
      }
      for (const v of (p.vents || [-1, 0, 1])) {
        const vx = p.x + v * 70;
        if (player && Math.abs(ppx - vx) <= 46) {
          this.game.damagePlayer(34 + this.phase * 12, vx,
            'A geyser of black ink erupted beneath you!', true, p.y);
          if (this.game.buffs) this.game.buffs.add('ink_blindness', 6);
        }
      }
      if (this.game && this.game.feel) this.game.feel.shake(0.5);
    } else if (p.type === 'whirlpool') {
      // The vortex collapses: a spiral burst of debris spinning out of the
      // core, a final inward crush + blindness.
      if (particles) {
        for (let arm = 0; arm < 4; arm++) {
          for (let s = 0; s < 6; s++) {
            const a = arm * (Math.PI / 2) + s * 0.35;
            const r = p.radius * (0.15 + s * 0.14);
            particles.magicSparkle(p.x + Math.cos(a) * r, p.y + Math.sin(a) * r * 0.6,
              s % 2 ? '#fb7185' : '#be123c', 6);
          }
        }
      }
      if (player && Math.hypot(ppx - p.x, ppy - p.y) <= p.radius) {
        this.game.damagePlayer(38 + this.phase * 12, p.x,
          'The whirlpool dragged you into its crushing core!', true, p.y);
        if (this.game.buffs) this.game.buffs.add('ink_blindness', 8);
      }
      if (this.game && this.game.feel) this.game.feel.shake(0.6);
    } else if (p.type === 'sweep') {
      // A scything arc: hit if the player is within the radius AND within the
      // swept angular band in front of the Kraken.
      if (particles) {
        // Trail of spray along the whole swept arc, not just a single burst.
        for (let s = 0; s <= 8; s++) {
          const a = p.angle - 0.9 + 1.8 * (s / 8);
          particles.bloodBurst(p.x + Math.cos(a) * p.radius,
            p.y + Math.sin(a) * p.radius, '#be123c', 4);
        }
        particles.bloodBurst(p.x, p.y, '#7f1d3a', 16);
      }
      if (player) {
        const dx = ppx - p.x, dy = ppy - p.y;
        const dist = Math.hypot(dx, dy);
        let dAng = Math.atan2(dy, dx) - p.angle;
        while (dAng > Math.PI) dAng -= Math.PI * 2;
        while (dAng < -Math.PI) dAng += Math.PI * 2;
        if (dist <= p.radius && Math.abs(dAng) <= 0.9) {
          this.game.damagePlayer(50 + this.phase * 16, ppx,
            'A sweeping tentacle hurled you aside!', true, ppy);
        }
      }
      if (this.game && this.game.feel) this.game.feel.shake(0.45);
    } else if (p.type === 'barrage') {
      // All the stabs already fired on their beats; the resolve moment is just
      // the arena exhaling — a last ring of ichor at each spent spike.
      if (particles) {
        for (const stab of p.stabs) {
          if (stab.done) particles.magicSparkle(stab.x, stab.y, '#be123c', 8);
        }
      }
      if (this.game && this.game.feel) this.game.feel.shake(0.4);
    }
    if (sound) sound.playHit();
  }

  /** A fan of hostile ink globs aimed at the player. Blind on contact. */
  fireInkGlobs(target, projectiles) {
    const cx = this.x + this.width * 0.5;
    const cy = this.y + this.height * 0.42;
    const px = target.x + target.width / 2;
    const py = target.y + target.height / 2;
    const base = Math.atan2(py - cy, px - cx);
    const count = 2 + this.phase;
    const speed = 5.2;
    for (let i = 0; i < count; i++) {
      const a = base + (i - (count - 1) / 2) * 0.22;
      const glob = new Projectile(cx, cy,
        Math.cos(a) * speed, Math.sin(a) * speed,
        'ink_glob', 24 + this.phase * 6, true, 3.5, 70);
      glob.fromBoss = true;
      projectiles.push(glob);
    }
  }

  renderTelegraph(ctx, camera) {
    const p = this.pending;
    if (!p) return;
    ctx.save();
    const sx = p.x - camera.x;
    const sy = p.y - camera.y;
    const k = 1 - Math.max(0, p.timer) / p.total; // 0 → 1 as it winds up
    const pulse = 0.5 + Math.sin(this.animT * 22) * 0.25;
    if (p.type === 'ink_burst') {
      // The full blast radius, plus a dark fill that closes in as time runs.
      ctx.setLineDash([12, 8]);
      ctx.lineWidth = 4;
      ctx.strokeStyle = 'rgba(244, 63, 94, ' + (0.55 + pulse * 0.4).toFixed(3) + ')';
      ctx.beginPath();
      ctx.arc(sx, sy, p.radius, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = 'rgba(76, 5, 25, ' + (0.15 + 0.35 * k).toFixed(3) + ')';
      ctx.beginPath();
      ctx.arc(sx, sy, p.radius * (0.7 + 0.3 * k), 0, Math.PI * 2);
      ctx.fill();
    } else if (p.type === 'geyser') {
      // Three warning columns that brighten and fill upward as they erupt.
      for (const v of (p.vents || [-1, 0, 1])) {
        const vx = sx + v * 70;
        ctx.setLineDash([8, 6]);
        ctx.lineWidth = 4;
        ctx.strokeStyle = 'rgba(244, 63, 94, ' + (0.5 + pulse * 0.4).toFixed(3) + ')';
        ctx.strokeRect(vx - 24, sy - 150, 48, 150);
        ctx.setLineDash([]);
        // Ink surging up the column toward the surface as the timer runs down.
        const colH = 150 * k;
        const grad = ctx.createLinearGradient(vx, sy, vx, sy - colH);
        grad.addColorStop(0, 'rgba(127, 29, 29, 0.55)');
        grad.addColorStop(1, 'rgba(251, 113, 133, 0.05)');
        ctx.fillStyle = grad;
        ctx.fillRect(vx - 24, sy - colH, 48, colH);
      }
    } else if (p.type === 'whirlpool') {
      // A spiralling vortex: concentric rings that rotate and close in, plus
      // spiral arms, so the pull reads before it grabs you.
      const spin = this.animT * 6;
      for (let ring = 3; ring >= 1; ring--) {
        const rr = p.radius * (ring / 3) * (1 - k * 0.35);
        ctx.strokeStyle = 'rgba(251, 113, 133, ' + (0.25 + 0.35 * (1 - ring / 3)).toFixed(3) + ')';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(sx, sy, rr, 0, Math.PI * 2);
        ctx.stroke();
      }
      for (let arm = 0; arm < 4; arm++) {
        ctx.strokeStyle = 'rgba(244, 63, 94, ' + (0.4 + pulse * 0.4).toFixed(3) + ')';
        ctx.lineWidth = 4;
        ctx.beginPath();
        for (let s = 0; s <= 24; s++) {
          const tt = s / 24;
          const ang = spin + arm * (Math.PI / 2) + tt * 3.2;
          const rr = p.radius * (1 - tt) * (0.4 + 0.6 * (1 - k * 0.3));
          const px2 = sx + Math.cos(ang) * rr;
          const py2 = sy + Math.sin(ang) * rr * 0.6;
          if (s === 0) ctx.moveTo(px2, py2); else ctx.lineTo(px2, py2);
        }
        ctx.stroke();
      }
      // Dark core that tightens as it collapses.
      ctx.fillStyle = 'rgba(27, 3, 10, ' + (0.2 + 0.5 * k).toFixed(3) + ')';
      ctx.beginPath();
      ctx.arc(sx, sy, p.radius * 0.28 * (1 - k * 0.4), 0, Math.PI * 2);
      ctx.fill();
    } else if (p.type === 'sweep') {
      // A sweeping wedge that rotates across the arc as it winds up.
      const sweepNow = p.angle - 0.9 + 1.8 * k;
      ctx.setLineDash([10, 6]);
      ctx.lineWidth = 5;
      ctx.strokeStyle = 'rgba(244, 63, 94, ' + (0.5 + pulse * 0.4).toFixed(3) + ')';
      ctx.beginPath();
      ctx.moveTo(sx, sy);
      ctx.arc(sx, sy, p.radius, sweepNow - 0.45, sweepNow + 0.45);
      ctx.closePath();
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = 'rgba(127, 29, 29, ' + (0.18 + 0.3 * k).toFixed(3) + ')';
      ctx.beginPath();
      ctx.moveTo(sx, sy);
      ctx.arc(sx, sy, p.radius, sweepNow - 0.45, sweepNow + 0.45);
      ctx.closePath();
      ctx.fill();
      // Leading edge of the arm, a bright line at the sweep front.
      ctx.strokeStyle = 'rgba(255, 255, 255, ' + (0.5 + pulse * 0.5).toFixed(3) + ')';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(sx, sy);
      ctx.lineTo(sx + Math.cos(sweepNow + 0.45) * p.radius, sy + Math.sin(sweepNow + 0.45) * p.radius);
      ctx.stroke();
    } else if (p.type === 'barrage') {
      // TENTACLE BARRAGE — a ring of warning spikes around the player, each
      // flashing faster as its own stab beat approaches, then going dark once
      // it has fired. The whole arena becomes a rhythm of dodges.
      const elapsed = p.total - p.timer;
      for (const stab of p.stabs) {
        const tx = stab.x - camera.x;
        const ty = stab.y - camera.y;
        const untilStab = stab.at - elapsed;
        if (stab.done) {
          // Already fired: a faint dark scar on the seabed.
          ctx.fillStyle = 'rgba(43, 6, 8, 0.35)';
          ctx.beginPath(); ctx.arc(tx, ty, 26, 0, Math.PI * 2); ctx.fill();
          continue;
        }
        // Warning spike: a triangle rising from the seabed that pulses, then
        // snaps bright white in the last moment before it stabs.
        const armed = Math.max(0, Math.min(1, 1 - untilStab / 0.35)); // 0→1 over last .35s
        const warn = 0.4 + 0.4 * Math.sin(this.animT * 18 + stab.at * 10);
        ctx.strokeStyle = armed > 0.5
          ? 'rgba(255, 255, 255, ' + (0.6 + 0.4 * armed).toFixed(3) + ')'
          : 'rgba(244, 63, 94, ' + warn.toFixed(3) + ')';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(tx, ty + 14);
        ctx.lineTo(tx - 16, ty - 18);
        ctx.moveTo(tx, ty + 14);
        ctx.lineTo(tx + 16, ty - 18);
        ctx.stroke();
        // Ground ring so the hit zone is readable.
        ctx.setLineDash([6, 5]);
        ctx.lineWidth = 3;
        ctx.strokeStyle = 'rgba(251, 113, 133, ' + (0.3 + 0.3 * warn).toFixed(3) + ')';
        ctx.beginPath();
        ctx.ellipse(tx, ty + 14, 34, 16, 0, 0, Math.PI * 2);
        ctx.stroke();
        ctx.setLineDash([]);
        // Rising ink plume preview under the armed spikes.
        if (armed > 0.3) {
          ctx.fillStyle = 'rgba(127, 29, 29, ' + (0.3 * armed).toFixed(3) + ')';
          ctx.fillRect(tx - 6, ty - 30 * armed, 12, 30 * armed);
        }
      }
    } else {
      ctx.setLineDash([6, 6]);
      ctx.lineWidth = 5;
      ctx.strokeStyle = 'rgba(255, 255, 255, ' + (0.5 + pulse * 0.5).toFixed(3) + ')';
      ctx.beginPath();
      ctx.arc(sx, sy, p.radius, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);
      // Crosshair so the slam point reads at a glance.
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(sx - 14, sy);
      ctx.lineTo(sx + 14, sy);
      ctx.moveTo(sx, sy - 14);
      ctx.lineTo(sx, sy + 14);
      ctx.stroke();
    }
    ctx.restore();
  }

  render(ctx, camera) {
    const x = this.x - camera.x;
    const y = this.y - camera.y;
    const injury = 1 - this.hp / this.maxHp;
    const cx = x + this.width * 0.5;
    // Arms and tentacles radiate from the MOUTH at the base of the head, not
    // from the middle of the mantle — that is what makes it read as a squid
    // with a crown of limbs rather than a jellyfish with a fringe.
    const mouthY = y + this.height * 0.60;
    const t = this.animT * (1.6 + this.phase * 0.35);
    ctx.save();
    // Lean the whole beast into its direction of travel (set by update()), so
    // it banks as it swims instead of gliding flat and stiff.
    if (this.lean) {
      ctx.translate(cx, y + this.height * 0.5);
      ctx.rotate(this.lean * 0.18);
      ctx.translate(-cx, -(y + this.height * 0.5));
    }

    // ---- Arms + tentacles, drawn first so the mantle overlaps their roots ----
    // A kraken has EIGHT arms ringing the mouth plus TWO enormous feeding
    // tentacles — ten limbs total. Skin is deep ink-crimson and bruise-purple
    // (a monstrous sea beast), NOT the bright cyan that read as a jellyfish.
    // Each limb is a tapering, coiling stroke that sways on its own phase, with
    // a sucker ridge, a wet rim-light and a darker underside for volume.
    const flash = this.hitFlash > 0;
    const skinTop = flash ? '#ffffff'
      : this.phase === 3 ? '#7f1d1d' : this.phase === 2 ? '#9f1239' : '#be123c';
    const skinMid = flash ? '#fecaca'
      : this.phase === 3 ? '#4c0519' : this.phase === 2 ? '#6b0f2a' : '#7f1d3a';
    const skinTip = flash ? '#fca5a5'
      : this.phase === 3 ? '#2b0410' : this.phase === 2 ? '#3f0a1c' : '#4c0d24';
    const suckerColor = flash ? '#ffffff'
      : this.phase === 3 ? '#fda4af' : this.phase === 2 ? '#fda4af' : '#fecdd3';
    const rimColor = flash ? '#ffffff'
      : this.phase === 3 ? '#fb7185' : this.phase === 2 ? '#fb7185' : '#fda4af';

    /**
     * Draw one limb: a quadratic from a fat base to a thin tip, tapering in
     * segments (a real limb, not a pipe), with a bright rim-light down the
     * leading edge, a darker underside, and translucent suckers marching down
     * it. `coil` bends the control point so tentacles curl instead of hanging
     * straight.
     */
    const limb = (bx, by, ctrlX, ctrlY, tipX, tipY, baseW, length, suckers, coil = 0) => {
      const segs = 12;
      ctx.lineCap = 'round';
      // Dark underside pass first (offset a touch), then the lit body on top.
      for (let pass = 0; pass < 2; pass++) {
        for (let s = 0; s < segs; s++) {
          const t0 = s / segs, t1 = (s + 1) / segs;
          const w0 = baseW * (1 - t0) + 2.5 * t0;
          const w1 = baseW * (1 - t1) + 2.5 * t1;
          const off = pass === 0 ? 2 : 0;
          const p0 = qPoint(bx, by + off, ctrlX, ctrlY + off, tipX, tipY + off, t0);
          const p1 = qPoint(bx, by + off, ctrlX, ctrlY + off, tipX, tipY + off, t1);
          if (pass === 0) {
            ctx.strokeStyle = skinTip;
            ctx.lineWidth = w0;
          } else {
            ctx.strokeStyle = t0 < 0.5 ? skinTop : t0 < 0.82 ? skinMid : skinTip;
            ctx.lineWidth = w0 * 0.7;
          }
          ctx.beginPath(); ctx.moveTo(p0.x, p0.y); ctx.lineTo(p1.x, p1.y); ctx.stroke();
        }
      }
      // Rim-light along the leading edge.
      ctx.globalAlpha = 0.5;
      ctx.strokeStyle = rimColor;
      ctx.lineWidth = Math.max(1.5, baseW * 0.28);
      ctx.beginPath(); ctx.moveTo(bx, by); ctx.quadraticCurveTo(ctrlX, ctrlY, tipX, tipY); ctx.stroke();
      ctx.globalAlpha = 1;
      // Suckers: pale ovals perpendicular to the limb, denser toward the tip.
      if (suckers) {
        ctx.fillStyle = suckerColor;
        for (const tt of [0.30, 0.42, 0.54, 0.66, 0.78, 0.88, 0.95]) {
          const pt = qPoint(bx, by, ctrlX, ctrlY, tipX, tipY, tt);
          const r = 2.8 * (1 - tt) + 1.0;
          ctx.beginPath(); ctx.ellipse(pt.x, pt.y, r, r * 0.72, tt * 1.7, 0, Math.PI * 2); ctx.fill();
        }
      }
    };
    function qPoint(x0, y0, x1, y1, x2, y2, t) {
      const it = 1 - t;
      return { x: it * it * x0 + 2 * it * t * x1 + t * t * x2, y: it * it * y0 + 2 * it * t * y1 + t * t * y2 };
    }

    // Two colossal feeding tentacles FIRST (behind the arms): they curl out and
    // up like striking serpents, the kraken's signature silhouette.
    for (const side of [-1, 1]) {
      const bx = cx + side * this.width * 0.10;
      const sway = Math.sin(t * 0.6 + (side > 0 ? 0 : Math.PI)) * (30 + this.phase * 10);
      const reach = this.height * 1.25;
      const tipX = bx + side * (150 + Math.abs(sway));
      const tipY = mouthY + reach * 0.55 + Math.cos(t * 0.5 + side) * 30 - 40;
      const ctrlX = bx + side * (90 + sway);
      const ctrlY = mouthY + reach * 0.55;
      limb(bx, mouthY + 4, ctrlX, ctrlY, tipX, tipY, 20, reach, true, side);
    }
    // Eight shorter arms fanned in a crown around the mouth, arcing down.
    for (let i = 0; i < 8; i++) {
      const f = i / 7;                                    // 0..1 across the crown
      const bx = x + this.width * (0.12 + 0.76 * f);
      const outward = (f - 0.5) * 165;                    // outer arms reach wider
      const sway = Math.sin(t * 0.9 + i * 1.2) * (16 + this.phase * 6);
      const reach = this.height * (0.55 + 0.32 * Math.sin(i * 2.1)); // varied lengths
      const tipX = bx + outward + sway;
      const tipY = mouthY + reach;
      const ctrlX = bx + outward * 0.3 + sway * 0.5;
      const ctrlY = mouthY + reach * 0.6;
      limb(bx, mouthY, ctrlX, ctrlY, tipX, tipY, 12, reach, true, (f - 0.5) * 2);
    }


    // ---- Mantle: a tall, tapering squid body with an integrated head ----
    // A real giant squid is not a symmetric bell. It is an elongated mantle —
    // blunt and wide at the skirt (bottom), narrowing smoothly up to a rounded
    // crown (top) — with the head and mouth at its base where the arms radiate.
    // Draw that silhouette as a closed bezier so it tapers instead of reading
    // as a flat ellipse (the old "blue jellyfish").
    const mantleRx = this.width * 0.40;          // half-width at the widest skirt
    const crownX = cx;
    const crownY = y + this.height * 0.04;       // rounded top of the mantle
    const skirtY = y + this.height * 0.56;       // widest point / where head begins
    const mantleGrad = ctx.createLinearGradient(cx - mantleRx, crownY, cx + mantleRx, skirtY);
    if (flash) {
      mantleGrad.addColorStop(0, '#ffffff');
      mantleGrad.addColorStop(1, '#fecaca');
    } else if (this.phase === 3) {
      mantleGrad.addColorStop(0, '#7f1d1d');
      mantleGrad.addColorStop(0.5, '#571010');
      mantleGrad.addColorStop(1, '#2b0608');
    } else if (this.phase === 2) {
      mantleGrad.addColorStop(0, '#9f1239');
      mantleGrad.addColorStop(0.5, '#6b0f2a');
      mantleGrad.addColorStop(1, '#3f0a1c');
    } else {
      mantleGrad.addColorStop(0, '#be123c');
      mantleGrad.addColorStop(0.5, '#881337');
      mantleGrad.addColorStop(1, '#4c0519');
    }
    ctx.fillStyle = mantleGrad;
    ctx.beginPath();
    // Start at the crown, sweep down the right flank bulging out to the skirt,
    // across the rounded skirt, and back up the left flank. Control points make
    // the shoulders slope in so the body tapers toward the top like a squid.
    ctx.moveTo(crownX, crownY);
    ctx.bezierCurveTo(crownX + mantleRx * 0.95, crownY + this.height * 0.16,
      crownX + mantleRx, skirtY - this.height * 0.16,
      crownX + mantleRx * 0.92, skirtY);
    ctx.quadraticCurveTo(crownX, skirtY + this.height * 0.10,
      crownX - mantleRx * 0.92, skirtY);
    ctx.bezierCurveTo(crownX - mantleRx, skirtY - this.height * 0.16,
      crownX - mantleRx * 0.95, crownY + this.height * 0.16,
      crownX, crownY);
    ctx.closePath();
    ctx.fill();
    // Key-light sheen down the lit (left) shoulder of the mantle — a wet highlight.
    ctx.globalAlpha = flash ? 0.5 : 0.26;
    ctx.fillStyle = '#fecdd3';
    ctx.beginPath();
    ctx.moveTo(crownX - mantleRx * 0.30, crownY + this.height * 0.10);
    ctx.bezierCurveTo(crownX - mantleRx * 0.55, crownY + this.height * 0.22,
      crownX - mantleRx * 0.60, skirtY - this.height * 0.20,
      crownX - mantleRx * 0.34, skirtY - this.height * 0.04);
    ctx.quadraticCurveTo(crownX - mantleRx * 0.18, (crownY + skirtY) * 0.5,
      crownX - mantleRx * 0.30, crownY + this.height * 0.10);
    ctx.closePath();
    ctx.fill();
    ctx.globalAlpha = 1;
    // Bumpy cephalopod skin: a scatter of small tubercles across the mantle so
    // it reads as lumpy hide, not smooth plastic.
    ctx.fillStyle = 'rgba(43, 6, 8, 0.35)';
    for (let i = 0; i < 26; i++) {
      const a = (i * 2.399); // golden-angle scatter
      const rad = Math.sqrt(i / 26);
      const bx2 = cx + Math.cos(a) * mantleRx * 0.82 * rad;
      const by2 = crownY + (skirtY - crownY) * (0.12 + rad * 0.86);
      const rr = 2 + (i % 3);
      ctx.beginPath(); ctx.arc(bx2, by2, rr, 0, Math.PI * 2); ctx.fill();
    }
    // Dark underside for volume along the bottom skirt of the mantle.
    ctx.globalAlpha = 0.30;
    ctx.fillStyle = '#1c0307';
    ctx.beginPath();
    ctx.ellipse(cx, skirtY + this.height * 0.02, mantleRx * 0.80, this.height * 0.06, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;

    // ---- Head: a narrower rounded bulge at the base of the mantle ----
    // The eyes and beak live here, and the arms radiate from its mouth.
    const headRx = this.width * 0.30;
    const headRy = this.height * 0.13;
    const headY = skirtY + this.height * 0.06;
    const headGrad = ctx.createRadialGradient(cx - headRx * 0.3, headY - headRy * 0.3, headRx * 0.1, cx, headY, headRx * 1.2);
    if (flash) {
      headGrad.addColorStop(0, '#ffffff');
      headGrad.addColorStop(1, '#fecaca');
    } else if (this.phase === 3) {
      headGrad.addColorStop(0, '#991b1b');
      headGrad.addColorStop(1, '#450a0a');
    } else if (this.phase === 2) {
      headGrad.addColorStop(0, '#be123c');
      headGrad.addColorStop(1, '#581026');
    } else {
      headGrad.addColorStop(0, '#e11d48');
      headGrad.addColorStop(1, '#6b0f2a');
    }
    ctx.fillStyle = headGrad;
    ctx.beginPath();
    ctx.ellipse(cx, headY, headRx, headRy, 0, 0, Math.PI * 2);
    ctx.fill();


    // ---- Terminal mantle fins: tattered, ribbed wings on the crown (top) ----
    // A squid's fins sit at the tip of the mantle. Each fin is a ragged diamond
    // with notches torn out of the trailing edge, so it reads as torn membrane
    // rather than a clean geometric wing.
    for (const side of [-1, 1]) {
      const finX = cx + side * mantleRx * 0.30;
      const finY = crownY + this.height * 0.05;
      const flap = Math.sin(t * 1.4 + (side > 0 ? 0 : Math.PI)) * 6;
      ctx.globalAlpha = flash ? 0.55 : 0.5;
      ctx.fillStyle = flash ? '#ffffff'
        : this.phase === 3 ? '#7f1d1d' : this.phase === 2 ? '#9f1239' : '#be123c';
      ctx.beginPath();
      ctx.moveTo(finX, finY);
      // Out to the tip with a tattered, wavering trailing edge.
      const notches = 4;
      for (let n = 1; n <= notches; n++) {
        const nn = n / notches;
        const ex = finX + side * (96 * nn);
        const ey = finY - 20 + flap + Math.sin(t * 2 + n + side) * 5;
        const mid = finX + side * (96 * (nn - 0.5 / notches));
        const midy = finY - 6 + flap * 0.5 + (n % 2 ? 10 : -6);
        ctx.lineTo(mid, midy);
        ctx.lineTo(ex, ey);
      }
      // Back along the lower edge to the mantle.
      ctx.quadraticCurveTo(finX + side * 48, finY + 24 + flap * 0.5, finX, finY + 20);
      ctx.closePath();
      ctx.fill();
      // Fin ribs: a few darker struts supporting the membrane.
      ctx.globalAlpha = 0.4;
      ctx.strokeStyle = '#2b0608';
      ctx.lineWidth = 1.5;
      for (let n = 1; n <= 3; n++) {
        const nn = n / 4;
        ctx.beginPath();
        ctx.moveTo(finX, finY + 4);
        ctx.lineTo(finX + side * 96 * nn, finY - 16 + flap + Math.sin(t * 2 + n + side) * 5);
        ctx.stroke();
      }
      ctx.globalAlpha = 1;
    }

    // ---- The eyes: a squid has two. The big one is the glowing weakpoint ----
    // and the fight's whole tutorial; the smaller opposite eye is what stops it
    // reading as a one-eyed monster. Layered for depth: a bioluminescent halo
    // that bleeds into the water, a dark socket, a gradient iris with a vertical
    // slit pupil (the kraken signature), a specular glint and a pulsing ring.
    const eye = this.headTargets()[0];
    const ex = eye.x - camera.x;
    const ey = eye.y - camera.y;
    const glow = 1 + Math.sin(this.animT * 5) * 0.12;
    const haloColor = this.phase === 3 ? '248, 113, 113' : this.phase === 2 ? '251, 146, 60' : '253, 224, 71';

    // Draw one eye at (px,py) with radius scale s. The primary weakpoint gets
    // the full halo + pulsing target ring; the secondary is calmer and dimmer.
    const drawEye = (px, py, s, isPrimary) => {
      if (isPrimary) {
        const halo = ctx.createRadialGradient(px, py, 4, px, py, 56 * s * glow);
        halo.addColorStop(0, 'rgba(' + haloColor + ', 0.5)');
        halo.addColorStop(1, 'rgba(' + haloColor + ', 0)');
        ctx.fillStyle = halo;
        ctx.beginPath(); ctx.arc(px, py, 56 * s * glow, 0, Math.PI * 2); ctx.fill();
      }
      ctx.fillStyle = '#020617'; // socket, so the iris pops off the head
      ctx.beginPath(); ctx.arc(px, py, 30 * s, 0, Math.PI * 2); ctx.fill();
      const irisColor = this.phase === 3 ? '#f87171' : this.phase === 2 ? '#fbbf24' : '#fef08a';
      const irisGrad = ctx.createRadialGradient(px, py, 2, px, py, 20 * s);
      irisGrad.addColorStop(0, '#ffffff');
      irisGrad.addColorStop(0.5, irisColor);
      irisGrad.addColorStop(1, this.phase === 3 ? '#7f1d1d' : this.phase === 2 ? '#b45309' : '#ca8a04');
      ctx.fillStyle = irisGrad;
      ctx.beginPath(); ctx.arc(px, py, 20 * s, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#020617'; // vertical slit pupil
      ctx.beginPath(); ctx.ellipse(px, py, 4.5 * s, 13 * s, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#ffffff'; // specular glint
      ctx.beginPath(); ctx.arc(px - 6 * s, py - 7 * s, 3.5 * s, 0, Math.PI * 2); ctx.fill();
      if (isPrimary) {
        // Pulsing ring marks it as THE target, whatever the phase colour does.
        ctx.strokeStyle = 'rgba(' + haloColor + ', ' + (0.4 + Math.sin(this.animT * 6) * 0.2).toFixed(3) + ')';
        ctx.lineWidth = 2.5;
        ctx.beginPath(); ctx.arc(px, py, 34 * s * glow, 0, Math.PI * 2); ctx.stroke();
      }
    };
    // Secondary eye, mirrored to the far side of the head, a touch smaller.
    drawEye(cx - (ex - cx) * 0.9, ey - 4, 0.6, false);
    // Primary weakpoint eye, drawn last so it sits on top.
    drawEye(ex, ey, 1, true);

    // ---- Beak: a dark parrot-like hook at the centre of the arm crown ----
    ctx.fillStyle = '#1c1917';
    ctx.beginPath();
    ctx.moveTo(cx - 11, mouthY - 6);
    ctx.quadraticCurveTo(cx, mouthY + 20, cx + 13, mouthY - 7);
    ctx.quadraticCurveTo(cx, mouthY + 4, cx - 11, mouthY - 6);
    ctx.closePath();
    ctx.fill();

    // ---- Ink dripping off the skirt: black globs of venomous ichor ----
    ctx.fillStyle = '#0b0212';
    for (let i = 0; i < 7; i++) {
      const dx = x + this.width * (0.16 + i * 0.12);
      const drip = (this.animT * 26 + i * 37) % (this.height * 0.34);
      ctx.beginPath();
      ctx.ellipse(dx, y + this.height * 0.54 + drip, 3, 4 + drip * 0.05, 0, 0, Math.PI * 2);
      ctx.fill();
    }

    // ---- The boss wears its injuries: glowing scars spread with lost HP ----
    if (injury > 0.05) {
      ctx.save();
      ctx.shadowColor = 'rgba(248, 113, 113, 0.8)';
      ctx.shadowBlur = 8;
      ctx.strokeStyle = 'rgba(248, 113, 113, ' + Math.min(0.9, injury).toFixed(3) + ')';
      ctx.lineWidth = 3 + injury * 3;
      ctx.beginPath();
      for (let i = 0; i < 5; i++) {
        const px2 = cx - 70 + i * 34;
        const py2 = y + this.height * (0.28 + (i % 2) * 0.14);
        ctx.moveTo(px2, py2);
        ctx.lineTo(px2 + 9, py2 + 13);
        ctx.lineTo(px2 - 4, py2 + 24);
      }
      ctx.stroke();
      ctx.restore();
    }

    // Hit flash: whole-silhouette white, same deal as every other boss.
    if (this.hitFlash > 0) {
      ctx.globalAlpha = Math.min(0.6, this.hitFlash * 3);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(x, y, this.width, this.height);
      ctx.globalAlpha = 1;
    }
    ctx.restore();
  }
}

window.Kraken = Kraken;
// Back-compat alias: app.py's inline probe, the HTML onload probe and older
// hooks that still name the class OceanLeviathan resolve straight to Kraken.
window.OceanLeviathan = Kraken;

window.OceanFish = OceanFish;
