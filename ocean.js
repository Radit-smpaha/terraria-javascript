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
    tile.fillStyle = 'rgba(56, 189, 248, 0.10)';
    tile.fillRect(1, 7 + ripple, 9, 2);
    tile.fillRect(14, 13 - ripple, 6, 2);
    tile.fillStyle = 'rgba(165, 243, 252, 0.08)';
    tile.fillRect(6, 2 + ripple, 5, 1);
    tile.fillRect(10, 18 - ripple, 7, 1);
    tile.fillStyle = 'rgba(226, 232, 240, 0.10)';
    tile.fillRect(3, 9 + (ripple > 2 ? 3 : 0), 1, 1);
    tile.fillRect(17, 16 - (ripple > 2 ? 4 : 0), 1, 1);
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
  const inOceanDim = this.isInOcean();
  if (inOceanDim && tile === TILES.SAND) {
    ctx.fillStyle = '#3b2f1e';
    ctx.fillRect(sx, sy, TILE_SIZE, TILE_SIZE);
    if (exposedTop) {
      ctx.fillStyle = '#57452c';
      ctx.fillRect(sx, sy, TILE_SIZE, 4);
      ctx.fillStyle = 'rgba(123, 101, 64, 0.5)';
      ctx.fillRect(sx + 2, sy + 6, 8, 1);
      ctx.fillRect(sx + 11, sy + 11, 8, 1);
      ctx.fillRect(sx + 5, sy + 17, 7, 1);
    }
    ctx.fillStyle = 'rgba(216, 197, 155, 0.5)';
    ctx.fillRect(sx + (tx * 7 + ty * 5) % 16, sy + (tx * 3 + ty * 11) % 18, 2, 2);
    ctx.fillStyle = 'rgba(240, 230, 210, 0.35)';
    ctx.fillRect(sx + (tx * 11 + ty * 3) % 14, sy + (tx * 5 + ty * 7) % 16, 3, 2);
    return;
  }
  if (inOceanDim && tile === TILES.SANDSTONE) {
    ctx.fillStyle = '#4a3b26';
    ctx.fillRect(sx, sy, TILE_SIZE, TILE_SIZE);
    ctx.fillStyle = '#5c4a30';
    ctx.fillRect(sx, sy + 2, TILE_SIZE, 3);
    ctx.fillRect(sx, sy + 11, TILE_SIZE, 3);
    ctx.fillStyle = '#3a2e1e';
    ctx.fillRect(sx, sy + 8, TILE_SIZE, 2);
    ctx.fillRect(sx, sy + 19, TILE_SIZE, 2);
    ctx.fillStyle = 'rgba(216, 197, 155, 0.35)';
    ctx.fillRect(sx + (tx * 5 + ty * 13) % 15, sy + (tx * 9 + ty * 3) % 17, 2, 1);
    return;
  }
  if (inOceanDim && tile === TILES.STONE) {
    ctx.fillStyle = '#141d26';
    ctx.fillRect(sx, sy, TILE_SIZE, TILE_SIZE);
    if (exposedTop) {
      ctx.fillStyle = '#1f2c38';
      ctx.fillRect(sx, sy, TILE_SIZE, 3);
    }
    ctx.fillStyle = 'rgba(226, 232, 240, 0.07)';
    ctx.fillRect(sx + (tx * 7 + ty * 11) % 17, sy + (tx * 3 + ty * 5) % 19, 3, 1);
    ctx.fillStyle = 'rgba(148, 197, 226, 0.06)';
    ctx.fillRect(sx + (tx * 13 + ty * 7) % 14, sy + (tx * 5 + ty * 3) % 17, 4, 1);
    return;
  }
  if (inOceanDim && tile === TILES.DIRT) {
    ctx.fillStyle = '#2b2318';
    ctx.fillRect(sx, sy, TILE_SIZE, TILE_SIZE);
    ctx.fillStyle = 'rgba(123, 101, 64, 0.4)';
    ctx.fillRect(sx + (tx * 9 + ty * 3) % 15, sy + (tx * 3 + ty * 9) % 18, 6, 1);
    ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
    ctx.fillRect(sx + (tx * 5 + ty * 13) % 12, sy + (tx * 7 + ty * 5) % 16, 4, 2);
    return;
  }
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
    // tile clusters, a third are mid fans, and the rare one reaches 7-8.
    // (The separate TALL_CORAL species stays 13+; the regular crust never
    // climbs above a player's head, so the reef floor stays a readable rug
    // of short growth instead of a picket fence of spikes.)
    const tier = Math.abs(Math.sin(x * 1.039) * 12345.6789) % 1;
    const height = tier < 0.5 ? 2 + Math.floor(roll * 3)
      : tier < 0.85 ? 5 + Math.floor(roll * 2)
        : 7 + Math.floor(roll * 2);
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
  const seaY = Math.max(24, Math.floor(this.height * 0.30));
  // ---- Higher seabed: the abyssal ocean is SHALLOWER than before ----
  // The floor used to sit 34 tiles above the map bottom; it now sits 52 up,
  // so the dive from the surface to the seabed is much shorter and the
  // kraken fight stays in a readable, torch-lit arena instead of a black pit.
  const floorY = this.height - 52;
  const duneFloor = new Int16Array(this.width);
  for (let x = 0; x < this.width; x++) {
    duneFloor[x] = floorY - 4 + Math.round(
      Math.sin(x * 0.09) * 3 + Math.sin(x * 0.031 + 1.7) * 4);
  }
  this.surfaceHeights.fill(floorY);

  // ---- The abyssal planet is a WORLD OF ISLANDS, not a tank of water ----
  // The sea surface (seaY) and the seabed (floorY) stay flat, but a handful of
  // rolling islands rise out of the water. The player spawns on the first one;
  // the rest are places to explore. Every column is still carved the same way
  // (bedrock, water, seabed), so the island bumps are the only irregularity and
  // nothing here can produce a floating tile.
  // A bigger archipelago: more mainland islands, spread across the whole sea so
  // the planet feels like an ocean world, not a tank with five rocks in it.
  const islandCount = 9 + Math.floor(Math.random() * 4);
  const islands = [];
  const minGap = 26;
  const margin = 20;
  const usable = Math.max(1, this.width - margin * 2);
  for (let i = 0; i < islandCount; i++) {
    // Evenly spaced with jitter, so no two islands ever merge into one blob.
    const base = margin + (usable * (i + 0.5)) / islandCount;
    const jitter = (Math.random() - 0.5) * (usable / islandCount) * 0.6;
    const cx = Math.max(margin, Math.min(this.width - margin - 1,
      Math.round(base + jitter)));
    if (islands.some(other => Math.abs(other.cx - cx) < minGap)) continue;
    const halfWidth = 8 + Math.floor(Math.random() * 9);
    const height = 6 + Math.floor(Math.random() * 9);
    islands.push({ cx, halfWidth, height });
  }

  // ---- Small islands: a whole scattered archipelago --------------------
  // The big islands sit far apart; a swimmer needs somewhere to surface and
  // stand mid-channel instead of drowning between them. These short, low sand
  // bumps rise just above the waterline so you can hop across the sea. They
  // are terrain only — never the spawn, the boss, or a wreck. A dense scatter
  // runs across the WHOLE map (not just the big gaps), so the ocean reads as a
  // living archipelago full of little landmarks to dive between.
  const islets = [];
  const isletSpacing = 11;   // min tiles between any two small islands
  for (let i = 0; i + 1 < islands.length; i++) {
    const a = islands[i], b = islands[i + 1];
    const gap = b.cx - a.cx;
    if (gap < 30) continue;
    const mid = (a.cx + b.cx) / 2;
    const spots = gap > 70 ? [mid - gap * 0.22, mid - gap * 0.08, mid + gap * 0.08, mid + gap * 0.22]
      : gap > 44 ? [mid - gap * 0.15, mid + gap * 0.15]
        : [mid];
    for (const sx of spots) {
      const cx = Math.round(sx);
      if (cx < margin || cx > this.width - margin - 1) continue;
      if (islands.some(o => Math.abs(o.cx - cx) < 16)) continue;
      if (islets.some(o => Math.abs(o.cx - cx) < isletSpacing)) continue;
      // A wide, flat, elevated shoal: 5-8 tiles of walkable table that rises
      // 3-5 tiles above the waterline, floating on the sea like a sand bar
      // rather than a thin spike spearing up from the deep.
      islets.push({ cx, halfWidth: 5 + Math.floor(Math.random() * 4),
        height: 3 + Math.floor(Math.random() * 3), islet: true, flat: true });
    }
  }
  // A generous independent scatter fills the open water between the rows above
  // so no stretch of sea is ever featureless. These free-floating shoals are
  // the same flat-table shape.
  for (let attempt = 0; attempt < this.width; attempt++) {
    const cx = margin + Math.floor(Math.random() * usable);
    if (islands.some(o => Math.abs(o.cx - cx) < 16)) continue;
    if (islets.some(o => Math.abs(o.cx - cx) < isletSpacing)) continue;
    islets.push({ cx, halfWidth: 4 + Math.floor(Math.random() * 4),
      height: 3 + Math.floor(Math.random() * 3), islet: true, flat: true });
    if (islets.length >= 70) break;
  }

  const allIslands = islands.concat(islets);

  // ---- FLOATING islands: nothing touches the seabed ----
  // Each island is a lens of rock hanging in the water: a dry crown ABOVE the
  // waterline (seaY), a rocky body below it, then OPEN WATER between the
  // island's underside and the deep seabed (duneFloor). Islands never connect
  // to the floor — you can swim clean under every one of them.
  //   topY(x)    — dry crown surface (above seaY near the middle)
  //   bottomY(x) — island underside; water again below it down to duneFloor
  // The lens tapers at the flanks: near the rim the crown dips below the
  // waterline and the underside rises, so the island pinches out into open
  // water instead of ending in a cliff wall.
  const islandTop = new Int16Array(this.width).fill(-1);
  const islandBottom = new Int16Array(this.width).fill(-1);
  for (const island of allIslands) {
    const thick = island.flat ? 7 : 9;   // rock thickness under the crown core
    for (let x = island.cx - island.halfWidth; x <= island.cx + island.halfWidth; x++) {
      if (x < 0 || x >= this.width) continue;
      const d = Math.abs(x - island.cx);
      const t = d / island.halfWidth;
      const flat = island.flat ? 0.58 : 0.42;
      const crown = seaY - island.height;
      let surf;
      if (t < flat) {
        surf = crown;
      } else {
        const k = (t - flat) / (1 - flat);
        const eased = 1 - k * k * (3 - 2 * k);
        // Flanks sink back into the sea instead of into the seabed.
        surf = Math.round(crown + ((seaY + 3) - crown) * (1 - eased));
      }
      // Underside: full thickness at the core, pinching up toward the rim.
      const pinch = t < flat ? 1 : Math.max(0, 1 - (t - flat) / (1 - flat));
      const bottom = Math.round(surf + 2 + thick * (0.25 + 0.75 * pinch));
      // Never let the lens reach the seabed: keep at least 4 tiles of swim
      // water between island rock and the dune floor.
      const cappedBottom = Math.min(bottom, duneFloor[x] - 4);
      if (cappedBottom <= surf + 1) continue; // pinched out entirely
      if (islandTop[x] < 0 || surf < islandTop[x]) {
        islandTop[x] = surf;
        islandBottom[x] = cappedBottom;
      }
    }
    // Flat islets get a soft 1-tile dip table on top (a sand bar you stand on).
    if (island.flat) {
      for (let x = island.cx - 2; x <= island.cx + 2; x++) {
        if (x < 0 || x >= this.width || islandTop[x] < 0) continue;
        islandTop[x] = Math.min(islandTop[x] + 1, seaY - 1);
      }
    }
  }

  // A smooth, deterministic height profile for the whole world. The base
  // ground is the deep seabed (duneFloor); island columns are tracked
  // separately in islandTop/islandBottom above.
  const groundHeight = new Int16Array(this.width);
  for (let x = 0; x < this.width; x++) {
    groundHeight[x] = islandTop[x] >= 0 ? islandTop[x] : duneFloor[x];
  }

  for (let x = 0; x < this.width; x++) {
    const ground = groundHeight[x];
    this.surfaceHeights[x] = ground;
    const islandColumn = islandTop[x] >= 0 && ground < seaY + 3;
    // Flood every air tile between the waterline and the ground. Over open
    // ocean that is the whole water column; under a floating island it is the
    // open swim gap between the island's underside and the deep seabed.
    for (let y = seaY; y < duneFloor[x]; y++) this.setTile(x, y, TILES.WATER);
    // Beach/soil for the exposed island lens, then the seabed proper.
    if (islandColumn) {
      const bottom = islandBottom[x];
      this.setTile(x, ground, TILES.SAND);
      for (let y = ground + 1; y <= bottom && y < this.height; y++) {
        // Taper the lens: dirt shell near the crown, stone heart, sandy rim.
        // rimEdge = tiles from the nearest island edge (0 = at the rim).
        const depthInto = y - ground;
        let rimEdge = 99;
        for (const isl of allIslands) {
          const dd = Math.abs(x - isl.cx);
          if (dd <= isl.halfWidth) rimEdge = Math.min(rimEdge, isl.halfWidth - dd);
        }
        this.setTile(x, y, depthInto <= 2 ? TILES.DIRT
          : (rimEdge <= 1.5 && depthInto > bottom - ground - 2) ? TILES.SAND : TILES.STONE);
      }
      // The column below the lens stays open water down to the seabed...
      for (let y = bottom + 1; y < duneFloor[x]; y++) this.setTile(x, y, TILES.WATER);
      // ...then the seabed proper, solid stone to the map floor.
      this.setTile(x, duneFloor[x], x % 5 === 0 ? TILES.SANDSTONE : TILES.SAND);
      for (let y = duneFloor[x] + 1; y < this.height; y++) this.setTile(x, y, TILES.STONE);
    } else {
      // Re-point island-less columns at the raised dune floor (no stale profile).
      groundHeight[x] = duneFloor[x];
      this.surfaceHeights[x] = duneFloor[x];
      this.setTile(x, duneFloor[x], x % 5 === 0 ? TILES.SANDSTONE : TILES.SAND);
      for (let y = duneFloor[x] + 1; y < this.height; y++) this.setTile(x, y, TILES.STONE);
    }
    // ---- Living seabed dressing -----------------------------------------
    // The old coral grew as tall vertical columns, which read as thin coloured
    // poles covering the whole ocean. It is now a flat 1-tile crust scattered
    // across the dune floor, plus swaying sea grass: a living sea floor, not
    // a picket fence of coral spikes. Dresses the TRUE seabed (duneFloor) —
    // never the floating lens — so coral/grass can never sprout mid-water.
    const seabed = duneFloor[x];
    if (this.getTile(x, seabed - 1) === TILES.WATER) {
      const crustRoll = (x * 2654435761 % 97) / 97;
      if (crustRoll < 0.30) {
        this.setTile(x, seabed - 1, TILES.CORAL);
      }
      // Sea grass: the biggest "this is a living ocean" tell. Blades grow up
      // to 4 tiles in the deep water and stay short near the shallows.
      const grassRoll = (x * 40503) % 101 / 101;
      if (grassRoll < 0.34) {
        const depth = seabed - seaY;
        const maxLen = depth > 20 ? 4 : 2;
        const len = 1 + ((x * 31) % maxLen);
        for (let k = 1; k <= len; k++) {
          if (this.getTile(x, seabed - k) === TILES.WATER) {
            this.setTile(x, seabed - k, TILES.TALL_GRASS);
          }
        }
      }
    }
    // Sea grass tufts on the UNDERSIDE of floating islands: hanging moss that
    // sells the "rock hanging in water" read. Only where there is open water
    // below the lens.
    if (islandColumn && islandBottom[x] + 1 < duneFloor[x] - 1 &&
        this.getTile(x, islandBottom[x] + 1) === TILES.WATER) {
      if (((x * 7919) % 101) / 101 < 0.22) {
        this.setTile(x, islandBottom[x] + 1, TILES.TALL_GRASS);
      }
    }
  }

  // ---- The abyssal UNDERGROUND: carved caverns beneath the seabed ----
  // The planet used to be solid stone from the seabed straight to the map
  // floor — nothing to dig, no reason to go deep. Now a handful of air
  // caverns, ore seams and glowing crystals is tunnelled through the rock below
  // the seabed, so the abyss has a real underworld to mine and explore. Caverns
  // key off the TRUE seabed (duneFloor), never the floating lens above it:
  // they start a few tiles under the dune floor and never break it, so the
  // water above always stays sealed and no cave can swallow an island's gap.
  const cavernCount = 40 + Math.floor(Math.random() * 20);
  for (let c = 0; c < cavernCount; c++) {
    // Random walk: a blob of cavern grows from a seed, never above the local
    // seabed plus a 4-tile roof, so the ocean can never drain into a cave.
    let cx0 = 4 + Math.floor(Math.random() * (this.width - 8));
    const localGround = duneFloor[Math.min(this.width - 1, Math.max(0, cx0))];
    let cy0 = Math.min(this.height - 4,
      localGround + 5 + Math.floor(Math.random() * Math.max(3, (this.height - localGround) - 8)));
    const steps = 10 + Math.floor(Math.random() * 22);
    let ang = Math.random() * Math.PI * 2;
    for (let s = 0; s < steps; s++) {
      ang += (Math.random() - 0.5) * 1.4;
      cx0 += Math.round(Math.cos(ang));
      cy0 += Math.round(Math.sin(ang) * 0.7);
      const roof = duneFloor[Math.min(this.width - 1, Math.max(0, cx0))] + 4;
      if (cx0 < 3 || cx0 > this.width - 4) break;
      if (cy0 < roof || cy0 > this.height - 3) { cy0 = Math.max(roof, Math.min(this.height - 3, cy0)); }
      // Carve a small round pocket of air.
      const r = 1 + Math.floor(Math.random() * 2);
      for (let dy = -r; dy <= r; dy++) {
        for (let dx = -r; dx <= r; dx++) {
          if (dx * dx + dy * dy > r * r + 1) continue;
          const px = cx0 + dx, py = cy0 + dy;
          if (px < 1 || px >= this.width - 1 || py < 1 || py >= this.height) continue;
          if (py < duneFloor[px] + 3) continue; // keep the seabed roof solid
          if (this.getTile(px, py) === TILES.STONE) this.setTile(px, py, TILES.AIR);
        }
      }
    }
  }
  // Ore + crystals dress the cavern floors: iron and gold in the stone, and a
  // vein of glowing crystal so the deep abyss is lit and worth diving for.
  for (let x = 2; x < this.width - 2; x++) {
    for (let y = duneFloor[x] + 5; y < this.height - 2; y++) {
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

  // ---- Dress the rest of the archipelago so it isn't a bare sand heap ----
  // Each substantial island gets palms on its crown, a torch set in a hollow,
  // flowers and shore grass across the cap, and stone outcrops on the beach —
  // so the islands read as lived-in places, not procedural blobs. Everything
  // lands on confirmed dry land (ground < seaY) with clear air overhead, so
  // land area and the boss spawn are never shifted.
  for (let idx = 1; idx < islands.length; idx++) {
    const isl = islands[idx];
    if (isl.height < 5 || isl.halfWidth < 5) continue;
    const isDry = (x) => x >= 2 && x < this.width - 2 && groundHeight[x] < seaY;
    const clearUp = (x, y) => this.getTile(x, y) === TILES.AIR &&
      this.getTile(x, y - 1) === TILES.AIR;
    const plantPalm = (x) => {
      if (!isDry(x)) return;
      const g = groundHeight[x];
      if (g < 5 || !clearUp(x, g - 1)) return;
      for (let k = 1; k <= 3; k++) this.setTile(x, g - k, TILES.WOOD);
      const topY = g - 4;
      this.setTile(x - 1, topY, TILES.MANGROVE_LEAVES);
      this.setTile(x + 1, topY, TILES.MANGROVE_LEAVES);
      this.setTile(x, topY, TILES.MANGROVE_LEAVES);
      this.setTile(x, topY - 1, TILES.MANGROVE_LEAVES);
    };
    plantPalm(isl.cx - Math.floor(isl.halfWidth / 2));
    plantPalm(isl.cx + Math.floor(isl.halfWidth / 2));
    // Flowers + shore grass across the dry cap (sparse, not a lawn).
    for (let x = isl.cx - isl.halfWidth; x <= isl.cx + isl.halfWidth; x++) {
      if (!isDry(x) || !clearUp(x, groundHeight[x] - 1)) continue;
      const roll = Math.random();
      if (roll < 0.11) this.setTile(x, groundHeight[x] - 1, TILES.FLOWER);
      else if (roll < 0.25) this.setTile(x, groundHeight[x] - 1, TILES.TALL_GRASS);
    }
    // Stone outcrops on the beach rim: low 2-tile rocks.
    for (const off of [-Math.floor(isl.halfWidth / 1.5), Math.floor(isl.halfWidth / 1.5)]) {
      const tx = isl.cx + off;
      if (isDry(tx) && clearUp(tx, groundHeight[tx] - 1) && clearUp(tx, groundHeight[tx] - 2)) {
        this.setTile(tx, groundHeight[tx] - 1, TILES.STONE);
        this.setTile(tx, groundHeight[tx] - 2, TILES.STONE);
      }
    }
    // A lone torch on bigger islands: a light piercing the deep.
    if (isl.halfWidth > 7) {
      const tx = isl.cx + (isl.cx % 3 - 1) * Math.floor(isl.halfWidth / 3);
      if (isDry(tx) && clearUp(tx, groundHeight[tx] - 1)) this.setTile(tx, groundHeight[tx] - 1, TILES.TORCH);
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

  // ---- Distant abyssal archipelago on the horizon ----
  // Jagged volcanic isle silhouettes with hot vents, drifting across two depth
  // bands, plus a low horizon swell. This is what sells the "ocean world of
  // islands" read from the water: the next peak looming above the swell.
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  const skyline = (parallax, baseFrac, amp, peaks, seedOff, shade) => {
    const off = camera.x * parallax;
    const baseY = height * baseFrac;
    ctx.fillStyle = shade;
    ctx.beginPath();
    ctx.moveTo(-10, height + 10);
    for (let x = -10; x <= width + 10; x += 13) {
      const wx = x + off;
      const n = Math.sin(wx * 0.0045 + seedOff) * amp
        + Math.sin(wx * 0.011 + seedOff * 2.3) * amp * 0.5;
      ctx.lineTo(x, baseY - n);
    }
    ctx.lineTo(width + 10, height + 10);
    ctx.closePath();
    ctx.fill();
    // Vent glows: sparse hot spots flickering on the ridge line.
    for (let i = 0; i < peaks; i++) {
      const vx = ((i * 137 + seedOff * 73 + off * 0.6) % (width + 80)) - 20;
      const vy = baseY - 26 - Math.sin(i * 1.7 + time * 1.3) * 6;
      if (Math.abs(Math.sin(time * 3 + i * 0.9 + seedOff)) < 0.3) continue;
      ctx.globalAlpha = 0.26 + 0.22 * Math.abs(Math.sin(time * 3 + i * 0.7));
      ctx.fillStyle = '#fb7185';
      ctx.beginPath(); ctx.arc(vx, vy, 2.2 + Math.sin(time + i) * 0.6, 0, Math.PI * 2); ctx.fill();
    }
  };
  skyline(0.05, 0.80, 44, 11, 1.3, '#0b1220');
  skyline(0.09, 0.87, 28, 7, 4.1, '#030712');
  ctx.restore();
  // Low horizon swell: the islands' breathing beneath the surface.
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  ctx.strokeStyle = 'rgba(180, 210, 252, 0.08)';
  ctx.lineWidth = 2;
  for (let i = 0; i < 3; i++) {
    const baseX = ((i * 230 - camera.x * 0.06) % (width + 500) + width + 500) % (width + 500) - 250;
    ctx.beginPath();
    for (let x = -10; x <= width + 10; x += 16) {
      const wy = height * 0.9 - Math.sin((x + baseX) * 0.012 + time * 0.7 + i) * 2.6;
      if (x === -10) ctx.moveTo(x, wy); else ctx.lineTo(x, wy);
    }
    ctx.stroke();
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
    this.width = 360;
    this.height = 250;
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

    // ---- Whole-body motion state --------------------------------------
    // The kraken is not a sprite that slides around: its mantle, head and
    // limbs are all driven by recorded velocity, a bob/sway field and a
    // follow-the-leader limb chain. vx/vy is the measured per-frame drift,
    // which lets the limbs trail behind the mantle and the mantle lean into
    // the swim; bob/sway carry the whole silhouette so it undulates as one.
    this.vx = 0;
    this.vy = 0;
    this.bob = 0;            // vertical breath/buoyancy offset of the mantle
    this.sway = 0;           // horizontal swim sway of the mantle
    this.lean = 0;           // mantle tilt driven by horizontal speed
    this.surge = 0;          // jet-propulsion pulse (0..1) when it lunges
    this.faceDir = 1;        // 1 = facing right, -1 = facing left
    // ---- Hide-and-lash: it sinks its whole mantle to a shadow and whips
    // out its ten limbs from ambush. hidden fades the body out; the lash
    // runs the strike itself. Both are timed so the fight keeps a rhythm.
    this.hidden = false;
    this.hideT = 0;          // seconds remaining in the current hide cycle
    this.hideAlpha = 1;      // 1 = fully visible, 0 = fully hidden (smooth)
    this.lashTimer = 0;      // seconds remaining in the strike burst
    this.lashPhase = 0;      // 0..1 eased punch of the lash
    this.hideCooldown = 6;   // counts down to the next hide
    this.inkPools = [];      // dark stains the boss leaves on the seabed
    this.skillGlow = 0;      // eye flash + limb pulse when a skill fires
    this.phaseFlash = 0;     // whole-silhouette flare on a phase step
  }

  /**
   * Hittable points: the glowing eye (weakpoint, `eye: true`) and three
   * armoured mantle nodes (`body: true`). Tentacle roots are decorative —
   * swings along the skirt still land on a mantle node, so melee never
   * whiffs against a body that visually fills the arc.
   */
  headTargets() {
    // The nodes track the body's live swim offsets (bob/sway/lean) so a hit
    // that visually connects is always a hit that actually lands.
    // Node heights are keyed to the render's own geometry: the head (and the
    // glowing eye) at 0.60 of the height, and two armoured mantle nodes up the
    // tall cone at 0.30 and 0.18, plus one low body node at the crown of arms.
    const cx = this.x + this.width * 0.5 + this.sway + this.lean * 40;
    const bob = this.bob + Math.sin(this.animT * 2) * 4;
    return [
      { x: cx, y: this.y + this.height * 0.60 + bob, r: 30, head: true, eye: true, index: 0 },
      { x: cx - 46, y: this.y + this.height * 0.30 + bob * 0.6, r: 46, body: true, index: 1 },
      { x: cx + 46, y: this.y + this.height * 0.30 + bob * 0.6, r: 46, body: true, index: 2 },
      { x: cx, y: this.y + this.height * 0.76 + bob * 0.3, r: 54, body: true, index: 3 }
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
    // Four phases, each a genuine power step rather than a colour swap.
    // The thresholds are tight at the bottom: the last 15% is the "final ink"
    // rage where every skill maxes out and the beast fights to the death.
    const phase = this.hp <= this.maxHp * 0.15 ? 4
      : this.hp <= this.maxHp * 0.35 ? 3
      : this.hp <= this.maxHp * 0.60 ? 2 : 1;
    if (phase > this.phase) {
      this.phase = phase;
      this.name = phase === 4 ? 'WOUNDED KRAKEN · FINAL INK'
        : phase === 3 ? 'WOUNDED KRAKEN · LAST INK'
        : phase === 2 ? 'ENRAGED KRAKEN · INK STORM'
        : 'ABYSSAL KRAKEN';
      if (sound) sound.playBossRoar();
      if (this.game && this.game.feel) this.game.feel.shake(1.0);
      // A phase step is a story beat: the mantle flares, the limbs fan out,
      // and the whole arena's lighting shifts to the new phase's colour.
      this.phaseFlash = 1.6;
      this.skillGlow = Math.max(this.skillGlow || 0, 1.2);
    }
    if (this.hp <= 0) {
      this.dead = true;
      if (sound) sound.playExplosion();
      if (particles) particles.magicSparkle(this.x + this.width / 2, this.y, '#a855f7', 100);
    }
    return damage;
  }

  overlapsPlayer(player) {
    // A hidden kraken cannot body-check you — it is a shadow on the seabed,
    // not a wall. Only when it is surfaced does the mantle crush.
    if (this.hideAlpha < 0.4) return false;
    const cx = this.x + this.width / 2 + this.sway;
    const cy = this.y + this.height / 2;
    return Math.abs(player.x + player.width / 2 - cx) < (player.width + this.width) / 2 &&
      Math.abs(player.y + player.height / 2 - cy) < (player.height + this.height) / 2;
  }

  touchDamage() {
    // A hidden kraken deals no contact damage; the lash does the hurting.
    if (this.hideAlpha < 0.4) return 0;
    return [0, 38, 55, 72][this.phase];
  }

  update(dt, target, projectiles, sound, particles) {
    this.animT += dt;
    this.hitFlash = Math.max(0, this.hitFlash - dt);
    this.skillGlow = Math.max(0, this.skillGlow - dt * 2);
    this.phaseFlash = Math.max(0, this.phaseFlash - dt * 1.2);

    // ---- The Kraken stalks you across the sea, smoothly -----------------
    // A leviathan that parked off-screen and never moved was the whole reason
    // the fight felt broken. It now accelerates toward the player with real
    // inertia — thrust toward a hover point, then water drag — so it glides and
    // leans into its turns like something heavy swimming, instead of snapping
    // along a straight line. A lazy swim-cycle bob keeps it alive at range.
    // Every phase is a real power step: the power ladder rises sharply, so
    // phase 4 is a completely different beast from phase 1 — not the same
    // numbers in a different colour.
    const ph = this.phase;
    // PHASE LADDER — every phase is a full level up, not a colour swap. Each of
    // the four phases multiplies power, damage and aggression hard, so by the
    // FINAL INK the same skill is a completely different, screen-filling spell.
    const power = 1 + (ph - 1) * 1.7;      // 1.0 → 6.1 size/impact scale
    const dmgMul = 1 + (ph - 1) * 1.5;     // 1.0 → 5.5 damage ladder
    const atkMul = 1 + (ph - 1) * 0.85;    // 1.0 → 3.55 attack-rate ladder
    if (target && !this.dead) {
      const world = this.game && this.game.world;
      const pcx = target.x + target.width / 2;
      const pcy = target.y + target.height / 2;
      const ccx = this.x + this.width / 2;
      const ccy = this.y + this.height * 0.45;

      // Desired hover point: hold station a little off the player, orbiting
      // slowly so it never sits perfectly still. The orbit radius grows with
      // phase so later phases loom from further out.
      const orbit = (240 + ph * 55) * power;
      const orbitAng = this.animT * 0.3 * atkMul;
      const goalX = pcx + Math.cos(orbitAng) * orbit;
      const goalY = pcy + Math.sin(orbitAng * 0.7) * orbit * 0.5 - 20;

      // Steering: accelerate toward the goal, capped by a max speed that rises
      // with phase. This is thrust, not teleport-on-a-line.
      const dx = goalX - ccx;
      const dy = goalY - ccy;
      const dist = Math.hypot(dx, dy) || 1;
      const maxSpeed = (120 + ph * 55) * power;
      // Ease the thrust off as it arrives, so it settles instead of overshooting.
      const arrive = Math.min(1, dist / 160);
      const ax = (dx / dist) * maxSpeed * arrive;
      const ay = (dy / dist) * maxSpeed * arrive;
      // Velocity integrates thrust, then drag bleeds it off (frame-rate safe).
      // pvx/pvy (captured before the push) let the body language below detect
      // turn beats — sharp direction changes the render spends as pulses.
      const pvx = this.vx || 0, pvy = this.vy || 0;
      this.vx = (this.vx || 0) + ax * dt;
      this.vy = (this.vy || 0) + ay * dt;
      const drag = Math.pow(0.12, dt); // strong water drag
      this.vx *= drag;
      this.vy *= drag;
      this.x += this.vx * dt;
      this.y += this.vy * dt;

      // Lean into the direction of travel — a heavy body banks as it turns.
      this.lean = (this.lean || 0) + ((this.vx / (maxSpeed * 2)) - (this.lean || 0)) * Math.min(1, dt * 4);
      // Dive/climb pitch: climbing noses the mantle up, diving noses it down.
      const pitchTarget = Math.max(-0.5, Math.min(0.5, (this.vy || 0) / (maxSpeed * 1.6)));
      this.pitch = (this.pitch || 0) + (pitchTarget - (this.pitch || 0)) * Math.min(1, dt * 3.2);
      // Yaw skew: horizontal bursts shear the silhouette sideways for a beat.
      this.skew = (this.skew || 0) * Math.pow(0.02, dt) +
        Math.max(-1, Math.min(1, ((this.vx || 0) - pvx) / Math.max(1, maxSpeed * dt * 8))) * 0.12;
      this.skew = Math.max(-0.35, Math.min(0.35, this.skew || 0));
      // Turn beat: a sharp direction change fires a squash pulse. Cools down
      // so it stays punchy instead of rattling every frame.
      this.pulse = Math.max(0, (this.pulse || 0) - dt * 2.2);
      this.pulseCd = Math.max(0, (this.pulseCd || 0) - dt);
      if (Math.hypot((this.vx || 0) - pvx, (this.vy || 0) - pvy) > maxSpeed * 0.55 &&
          (this.pulseCd || 0) <= 0) {
        this.pulse = 1;
        this.pulseCd = 0.9;
      }

      // A slow vertical swim cycle so it undulates even while holding station.
      this.y += Math.sin(this.animT * 1.1) * 10 * dt;
      // Facing follows the swim direction, so the head and its long arms
      // always lead the way instead of the boss sliding backwards.
      if (Math.abs(pcx - ccx) > 14) this.faceDir = pcx >= ccx ? 1 : -1;
      if (world) {
        this.x = Math.max(0, Math.min(world.pixelWidth - this.width, this.x));
        // A kraken is a sea creature, not a balloon: keep the body in the
        // water. The mantle top must stay at-or-below the waterline (a small
        // crown breach is allowed) and the skirt must stay above the floor.
        const seaTop = (world.oceanArena ? world.oceanArena.seaY : 12) * TILE_SIZE;
        const floorTop = world.pixelHeight || world.height * TILE_SIZE;
        this.y = Math.max(seaTop - this.height * 0.10,
          Math.min(floorTop - this.height * 1.25, this.y));
      }
    }

    // ---- Whole-body motion --------------------------------------------
    // Every part of the body hangs off these fields, so the kraken is never
    // a static PNG: the mantle breathes, sways, pitches with its dives,
    // skews with its turns, and SQUASHES through every surge — and the limbs
    // (drawn from the same fields) trail behind. The chain:
    //   pulse → squash spring: a turn beat briefly compresses the mantle
    //     vertically and widens it, then releases with an overshoot bounce.
    //   breath: slow inhale/exhale scaling the whole body ±4%.
    //   swimPhase: a travelling wave down the body's length — the spine
    //     ripples and the arms follow late, never all at once.
    const breathRate = (1.15 + ph * 0.12) * atkMul;
    this.bob = Math.sin(this.animT * breathRate) * (10 + ph * 2) * power
      + Math.sin(this.animT * 2.7 + 1.3) * 3 * power;
    this.sway = Math.cos(this.animT * breathRate * 0.7) * (12 + ph * 3) * power
      + Math.sin(this.animT * 0.9) * 5 * power;
    this.squashV = this.squashV || 0;
    this.squash = this.squash || 0;
    // ATTACK ANTICIPATION — while a telegraphed skill winds up, the whole body
    // COILS: it leans back away from the target and compresses, the way a
    // spring loads before it snaps. chargePose ramps 0→1 as the tell fills and
    // is spent by the recoil the instant the skill resolves. This is what ties
    // the movement to the attacks so the two can never feel disconnected.
    let chargePose = 0;
    if (this.pending && this.pending.total) {
      chargePose = 1 - Math.max(0, this.pending.timer) / this.pending.total;
      chargePose = chargePose * chargePose; // ease-in: slow load, sharp at the end
    }
    this.chargePose = chargePose;
    // RECOIL spring: a skill firing kicks it to 1, then it bounces back to 0.
    this.recoil = this.recoil || 0;
    this.recoilV = this.recoilV || 0;
    this.recoilV += ((0 - this.recoil) * 90 - this.recoilV * 9) * dt;
    this.recoil += this.recoilV * dt;
    const squashTarget = (this.pulse || 0) * 0.55 + (this.lashTimer > 0 ? 0.3 : 0)
      + chargePose * 0.35 - this.recoil * 0.4;
    this.squashV += ((squashTarget - this.squash) * 26 - this.squashV * 7) * dt;
    this.squash += this.squashV * dt;
    // The mantle dips forward on the recoil and pulls back on the charge, so
    // the silhouette visibly lunges into each attack and settles after it.
    this.lunge = (chargePose * 0.5 - this.recoil * 0.9);
    this.breath = 1 + Math.sin(this.animT * breathRate * 0.5) * 0.035
      + (this.lashTimer > 0 ? 0.03 : 0);
    this.swimPhase = (this.swimPhase || 0) + dt * (2.2 + this.phase * 0.4 +
      Math.min(2, Math.hypot(this.vx || 0, this.vy || 0) / 90));
    // A jet pulse fires hardest while it is actually swimming somewhere.
    const speedNow = Math.hypot(this.vx || 0, this.vy || 0);
    const surgeTarget = Math.min(1, speedNow / 140) * 0.8 + (this.lashTimer > 0 ? 0.6 : 0.1);
    this.surge += (surgeTarget - this.surge) * Math.min(1, dt * 3);
    // Jet-spout particles: a real squid vents water/ink to thrust, so a
    // pressurised plume vents from the apex while it is mid-swim. The hotter
    // the surge, the blacker the ink in the jet.
    if (this.surge > 0.45 && particles && Math.random() < 0.18) {
      const cx = this.x + this.width * 0.5;
      particles.addParticle(cx, this.y + this.height * 0.08,
        (Math.random() - 0.5) * 3, -this.surge * 7 - 2,
        this.surge > 0.75 ? 'rgba(124, 50, 94, 0.55)' : 'rgba(248, 250, 253, 0.45)',
        2.5, 0.5, 0, true);
    }
    // Decay ink pools left on the seabed by slammed attacks.
    for (let i = this.inkPools.length - 1; i >= 0; i--) {
      const p = this.inkPools[i];
      p.t += dt;
      if (p.t > p.life) this.inkPools.splice(i, 1);
    }

    // ---- Hide-and-lash cycle ------------------------------------------
    // The mythological kraken does not brawl in the open: it sinks into the
    // dark, becomes a shadow, then erupts in a storm of arms. hideT runs
    // the submerged phase, lashTimer the strike. The hide fades the mantle
    // and immobilises the body; the lash snaps ten limbs out at the player.
    if (!this.dead) {
      const lashDuration = (1.0 + ph * 0.12) / atkMul;
      if (this.lashTimer > 0) {
        // Strike running: ease the lash punch up then down.
        const k = 1 - this.lashTimer / lashDuration; // 0..1
        this.lashPhase = Math.sin(Math.min(1, k) * Math.PI);
        this.lashTimer -= dt;
        this.hideAlpha += (1 - this.hideAlpha) * Math.min(1, dt * 6);
        if (this.lashTimer <= 0) {
          // The strike is spent: sink back to the shadows for the next one.
          this.hidden = true;
          this.hideT = Math.max(1.1, 2.0 - ph * 0.25) / atkMul;
          this.hideCooldown = (5 + Math.random() * 4) / atkMul;
          this.lashPhase = 0;
        }
      } else if (this.hidden) {
        // Submerged: fade the body out and hold still, then erupt.
        this.hideT -= dt;
        this.hideAlpha += (0.05 - this.hideAlpha) * Math.min(1, dt * 3);
        if (this.hideT <= 0) {
          this.hidden = false;
          this.lashTimer = lashDuration;
          this.lashPhase = 0;
          if (sound) sound.playBossRoar();
          if (particles) {
            particles.magicSparkle(this.x + this.width / 2, this.y + this.height * 0.5, '#0e7490', 40);
          }
          // Every limb whips out as a hostile arm: a radial spray of globs.
          if (projectiles && typeof Projectile === 'function') this.fireInkGlobs(target, projectiles);
        }
      } else {
        // Surfaced: surface smoothly, and once the cooldown lapses dive again.
        this.hideAlpha += (1 - this.hideAlpha) * Math.min(1, dt * 3);
        this.hideCooldown -= dt;
        if (this.hideCooldown <= 0 && !this.pending) {
          this.hidden = true;
          this.hideT = Math.max(1.1, 2.0 - ph * 0.25) / atkMul;
        }
      }
    }

    // Wind up the armed telegraph; it resolves through resolvePending().
    if (this.pending) {
      this.pending.timer -= dt;
      if (this.pending.timer <= 0) this.resolvePending(sound, particles);
    }
    // Attacks only fire while surfaced — a hidden kraken merely waits, which
    // is what makes the ambush feel deliberate rather than random.
    this.attackTimer -= dt;
    if (this.attackTimer <= 0 && target && !this.pending && this.hideAlpha > 0.5) {
      const px = target.x + target.width / 2;
      const py = target.y + target.height / 2;
      const roll = Math.random();
      if (roll < 0.26) {
        // INK BLINDNESS BURST — telegraphed circle on your position; caught
        // inside means the debuff, not just damage. Dodge = counterplay.
        this.pending = {
          type: 'ink_burst', x: px, y: py,
          radius: (130 + ph * 20) * power, timer: 0.95 / atkMul, total: 0.95 / atkMul
        };
      } else if (roll < 0.46) {
        // TENTACLE SLAM — telegraphed circle, pure damage, no debuff.
        this.pending = {
          type: 'slam', x: px, y: py,
          radius: (95 + ph * 15) * power, timer: 0.7 / atkMul, total: 0.7 / atkMul
        };
      } else if (roll < 0.62) {
        // INK GEYSER — three erupting columns burst out of the water around
        // you a beat later. Reads as the seabed vomiting ink; stay moving.
        this.pending = {
          type: 'geyser', x: px, y: py,
          radius: (120 + ph * 15) * power, timer: 1.1 / atkMul, total: 1.1 / atkMul,
          vents: [-1, 0, 1]
        };
      } else if (roll < 0.78) {
        // WHIRLPOOL — a spiralling vortex opens under you and drags you toward
        // its core while it spins up, then collapses. The pull is the threat.
        this.pending = {
          type: 'whirlpool', x: px, y: py,
          radius: (150 + ph * 20) * power, timer: 1.3 / atkMul, total: 1.3 / atkMul
        };
      } else if (roll < 0.86) {
        // TENTACLE SWEEP — a single arm scythes across a wide arc in front of
        // the Kraken. The telegraph is a sweeping wedge, not a circle.
        const toward = Math.atan2(py - (this.y + this.height * 0.5),
          px - (this.x + this.width * 0.5));
        this.pending = {
          type: 'sweep', x: this.x + this.width * 0.5, y: this.y + this.height * 0.6,
          radius: (210 + ph * 25) * power, angle: toward,
          timer: 0.85 / atkMul, total: 0.85 / atkMul
        };
      } else if (roll < 0.90) {
        // INK SPEW — the maw opens and a sustained cone of blinding ink jets
        // forward, tracking your position so it reads as the beast trying to
        // swallow you whole. Blind + damage over the channel: personal and mythic.
        const inkToward = Math.atan2(py - (this.y + this.height * 0.62),
          px - (this.x + this.width * 0.5));
        this.pending = {
          type: 'ink_spew', x: this.x + this.width * 0.5, y: this.y + this.height * 0.62,
          angle: inkToward, radius: 0, timer: 0.75 / atkMul, total: 0.75 / atkMul,
          width: 0.9 + ph * 0.15
        };
      } else if (roll < 0.94) {
        // AQUA LANCE — the Kraken locks a high-pressure water/laser beam onto
        // you and charges it. The eye superheats first (a white-hot line from
        // the eye to your position), then the lance fires — a searing column
        // you have to STRAFE, not merely dodge. The widest tell in the kit, and
        // the one that turns the fight's pacing: you either commit or you pay.
        const eyeX = this.x + this.width * 0.5 + this.faceDir * 8;
        const eyeY = this.y + this.height * 0.60;
        this.pending = {
          type: 'beam', x: eyeX, y: eyeY,
          radius: 0, timer: 0.9 / atkMul, total: 0.9 / atkMul,
          target: { x: px, y: py }
        };
      } else if (roll < 0.99) {
        // TENTACLE BARRAGE — a ring of tentacles stabs up from the deep in a
        // sequence, each at its own delay. The whole arena lights up with warning
        // spikes; you have to keep moving between the beats.
        this.pending = {
          type: 'barrage', x: px, y: py,
          radius: (150 + ph * 20) * power, timer: 1.5 / atkMul, total: 1.5 / atkMul,
          // Six stab points around the player, staggered.
          stabs: [0, 1, 2, 3, 4, 5].map(i => {
            const a = (i / 6) * Math.PI * 2;
            return {
              x: px + Math.cos(a) * (110 + ph * 20) * power,
              y: py + Math.sin(a) * 60 * power,
              at: (0.25 + i * 0.18) / atkMul // stagger, in seconds from the start
            };
          })
        };
      } else if (projectiles && typeof Projectile === 'function') {
        // INK GLOB VOLLEY — immediate spread of hostile globs.
        this.fireInkGlobs(target, projectiles);
      }
      // (In a QA sandbox with no Projectile class the volley branch is
      // skipped and the cooldown simply recycles — never a thrown ReferenceError.)
      this.skillGlow = 0.6 + ph * 0.25;     // eye + limb flash on a skill going off
      this.attackTimer = Math.max(0.8, (3.0 - ph * 0.5) / atkMul);
      if (sound) sound.playBossRoar();
    }

    // ---- Barrage stab timing: fire each tentacle stab as its beat arrives ----
    if (this.pending && this.pending.type === 'barrage') {
      const p = this.pending;
      const ph = this.phase;
      const dmgMul = 1 + (ph - 1) * 1.5;
      const power = 1 + (ph - 1) * 1.7;
      const elapsed = p.total - p.timer;
      for (const stab of p.stabs) {
        if (!stab.done && elapsed >= stab.at) {
          stab.done = true;
          this.skillFX(particles, stab.x, stab.y, 'stab', {});
          this.pulse = Math.max(this.pulse || 0, 0.5);
          if (this.game && this.game.player) {
            const pl = this.game.player;
            if (Math.hypot(pl.x + pl.width / 2 - stab.x, pl.y + pl.height / 2 - stab.y) <= 60 * power) {
              this.game.damagePlayer(Math.round((88 + ph * 30) * dmgMul), stab.x,
                'A tentacle speared up out of the deep!', true, stab.y);
            }
          }
          if (sound) sound.playHit();
          if (this.game && this.game.feel) this.game.feel.shake(0.3 * power);
        }
      }
    }

    // ---- Whirlpool drag: while it spins up, haul the player toward the core --
    if (this.pending && this.pending.type === 'whirlpool' && target) {
      const p = this.pending;
      const ph = this.phase;
      const power = 1 + (ph - 1) * 1.7;
      const px = target.x + target.width / 2;
      const py = target.y + target.height / 2;
      const dx = p.x - px, dy = p.y - py;
      const dist = Math.hypot(dx, dy) || 1;
      if (dist < p.radius * 2.2 && dist > 4) {
        // Pull strengthens as the timer runs down; a real inward current.
        const pull = (1 - p.timer / p.total) * 150 * dt * power;
        target.x += (dx / dist) * pull;
        target.y += (dy / dist) * pull * 0.7;
      }
    }
  }

  /** Resolve a spent telegraph: damage, the blindness debuff, and the show. */
  /**
   * The skill show: layered particle chords every resolve spends. Each skill
   * gets its own signature — a bright core flash, a coloured ring racing
   * outward, arcing debris, and lingering motes — plus hit-stop + slow-mo on
   * the heaviest hits so impacts LAND instead of just happening.
   * Uses existing helpers only: addParticle / magicSparkle / bloodBurst.
   */
  skillFX(particles, x, y, chord, opts = {}) {
    if (!particles) return;
    // Every phase turns the show up: more sparks, wider rings, longer-lived
    // motes. A phase 4 skill burst is a wall of light, not a flash.
    const ph = this.phase;
    const power = 1 + (ph - 1) * 1.7;
    const R = (opts.radius || 90) * power;
    // Counts scale HARD with phase — a phase-4 burst throws several times the
    // light of a phase-1 one, so the show itself levels up every phase.
    const m = (n) => Math.max(n, Math.round(n * (0.7 + ph * 0.85)));
    // Core flash: a fat white-hot disc that scales with power.
    const flash = (color, size, life = 0.22) => {
      if (typeof particles.addParticle === 'function') {
        particles.addParticle(x, y, 0, 0, color, size * power * 1.5, life, 0, true);
        // A second, longer-lived halo so the flash lingers and blooms.
        particles.addParticle(x, y, 0, 0, color, size * power * 2.4, life * 2.2, 0, true);
      }
    };
    // n sparks on an expanding circle.
    const ring = (color, maxR, n, life = 0.7) => {
      for (let i = 0; i < m(n); i++) {
        const a = (i / n) * Math.PI * 2 + (opts.spin || 0);
        const spd = maxR * (1.6 + Math.random() * 1.2);
        if (typeof particles.addParticle === 'function') {
          particles.addParticle(x, y, Math.cos(a) * spd, Math.sin(a) * spd * 0.7,
            color, 3.2 + ph * 0.8, life * (0.7 + Math.random() * 0.6), 0, true);
        }
      }
    };
    // A triple stacked shockwave — three rings racing out at different speeds
    // and sizes. This is the single biggest "cool" upgrade: every skill now
    // reads as a pressure wave, not a single puff.
    const shockwave = (colors, maxR, n) => {
      for (let layer = 0; layer < 3; layer++) {
        const cnt = m(n) + layer * 4;
        const rr = maxR * (0.55 + layer * 0.28);
        const c = colors[layer % colors.length];
        for (let i = 0; i < cnt; i++) {
          const a = (i / cnt) * Math.PI * 2 + (opts.spin || 0) + layer * 0.4;
          const spd = rr * (2.0 + layer * 0.7 + Math.random() * 1.2);
          if (typeof particles.addParticle === 'function') {
            particles.addParticle(x, y, Math.cos(a) * spd, Math.sin(a) * spd * 0.7,
              c, 3.6 + layer * 0.6, 0.6 + layer * 0.25 + Math.random() * 0.4, 0, true);
          }
        }
      }
    };
    // Arcing shards with a gravity pull.
    const debris = (colors, n, spd, up = -3) => {
      for (let i = 0; i < m(n); i++) {
        const a = Math.random() * Math.PI * 2;
        const s = spd * (0.4 + Math.random() * 0.9);
        const c = colors[(Math.random() * colors.length) | 0];
        if (typeof particles.magicSparkle === 'function') {
          particles.magicSparkle(x + Math.cos(a) * 8, y + Math.sin(a) * 6, c,
            1 + ((Math.random() * 2) | 0));
        }
        if (typeof particles.addParticle === 'function') {
          particles.addParticle(x, y, Math.cos(a) * s, Math.sin(a) * s * 0.6 + up,
            c, 2.6 + ph * 0.4, 0.8 + Math.random() * 0.7, 0.35, false);
        }
      }
    };
    // Slow drifting embers that hang in the water.
    const motes = (color, n, r, life = 2.2) => {
      for (let i = 0; i < m(n); i++) {
        const a = Math.random() * Math.PI * 2;
        const rr = Math.sqrt(Math.random()) * r;
        if (typeof particles.addParticle === 'function') {
          particles.addParticle(x + Math.cos(a) * rr, y + Math.sin(a) * rr * 0.7,
            (Math.random() - 0.5) * 0.5, -0.3 - Math.random() * 0.5,
            color, 2.2, life * (0.6 + Math.random() * 0.8), 0, true);
        }
      }
    };
    if (chord === 'inkburst') {
      flash('#ffffff', 9);
      if (typeof particles.magicSparkle === 'function') {
        particles.magicSparkle(x, y, '#f43f5e', m(30));
        particles.magicSparkle(x, y, '#1a0308', m(22));
        particles.magicSparkle(x, y, '#e9d5ff', m(12));
      }
      shockwave(['#fb7185', '#f43f5e', '#e9d5ff'], R, 22);
      ring('#fb7185', R, m(22));
      ring('#4c0519', R * 0.7, m(14), 1.0);
      debris(['#7f1d3a', '#be123c', '#0b0212'], m(16), 4.5);
      motes('rgba(168, 85, 247, 0.8)', m(14), R * 0.8);
    } else if (chord === 'slam') {
      flash('#ffffff', 11);
      if (typeof particles.bloodBurst === 'function') {
        particles.bloodBurst(x, y, '#7f1d3a', m(20));
        particles.bloodBurst(x, y, '#fecdd3', m(10));
      }
      shockwave(['#fef3c7', '#fb7185', '#be123c'], R * 1.15, 18);
      ring('#fef3c7', R * 0.9, m(18), 0.5);
      ring('#be123c', R * 1.15, m(20));
      debris(['#7f1d3a', '#451a1a', '#fecaca'], m(20), 5.5, -4);
      motes('rgba(251, 113, 133, 0.7)', m(10), R * 0.7);
    } else if (chord === 'stab') {
      flash('#fef3c7', 10);
      if (typeof particles.bloodBurst === 'function') {
        particles.bloodBurst(x, y, '#7f1d3a', m(16));
        particles.bloodBurst(x, y, '#ffffff', m(6));
      }
      ring('#fb7185', 70, m(12), 0.5);
      if (typeof particles.addParticle === 'function') {
        for (let i = 0; i < m(12); i++) {
          particles.addParticle(x + (Math.random() - 0.5) * 18, y,
            (Math.random() - 0.5) * 2, -5 - Math.random() * 5,
            i % 2 ? '#fecdd3' : '#be123c', 2.8, 0.6, 0, true);
        }
      }
      motes('rgba(127, 29, 58, 0.8)', m(6), 50);
    } else if (chord === 'geyser') {
      flash('#fda4af', 8);
      if (typeof particles.magicSparkle === 'function') {
        particles.magicSparkle(x, y, '#f43f5e', m(24));
        particles.magicSparkle(x, y - 60, '#fb7185', m(14));
        particles.magicSparkle(x, y - 120, '#fecdd3', m(8));
      }
      // A vertical jet column: fast risers stacked up the vent.
      if (typeof particles.addParticle === 'function') {
        for (let i = 0; i < m(22); i++) {
          particles.addParticle(x + (Math.random() - 0.5) * 34,
            y - Math.random() * 40, (Math.random() - 0.5) * 1.2,
            -6 - Math.random() * 5, i % 3 ? '#be123c' : '#ffe4e6',
            3, 0.7 + Math.random() * 0.5, 0, true);
        }
      }
      shockwave(['#fb7185', '#fecdd3', '#be123c'], R * 0.8, 14);
      ring('#fb7185', R * 0.8, m(14), 0.6);
      motes('rgba(76, 5, 25, 0.9)', m(12), R * 0.6);
    } else if (chord === 'whirlpool') {
      flash('#e9d5ff', 9);
      // Spiral arms of debris spinning OUT of the collapsed core.
      for (let arm = 0; arm < 4; arm++) {
        for (let s = 0; s < m(7); s++) {
          const a = arm * (Math.PI / 2) + s * 0.4 + (opts.spin || 0);
          const rr = R * (0.12 + s * 0.15);
          if (typeof particles.magicSparkle === 'function') {
            particles.magicSparkle(x + Math.cos(a) * rr, y + Math.sin(a) * rr * 0.6,
              s % 2 ? '#fb7185' : '#4c0519', 3);
          }
        }
      }
      shockwave(['#fda4af', '#e9d5ff', '#a855f7'], R, 20);
      ring('#fda4af', R, m(20), 0.9);
      debris(['#be123c', '#0b0212', '#e9d5ff'], m(14), 5);
      motes('rgba(168, 85, 247, 0.7)', m(16), R);
    } else if (chord === 'sweep') {
      flash('#ffffff', 8);
      // Trail of spray along the whole swept arc, not just a single burst.
      for (let s = 0; s <= m(10); s++) {
        const a = (opts.angle || 0) - 0.9 + 1.8 * (s / m(10));
        const ax = x + Math.cos(a) * R, ay = y + Math.sin(a) * R;
        if (typeof particles.bloodBurst === 'function') {
          particles.bloodBurst(ax, ay, '#be123c', 3);
        }
        if (typeof particles.magicSparkle === 'function') {
          particles.magicSparkle(ax, ay, '#fecdd3', 2);
        }
      }
      if (typeof particles.bloodBurst === 'function') {
        particles.bloodBurst(x, y, '#7f1d3a', m(14));
      }
      ring('#fecdd3', R * 0.7, m(12), 0.5);
      motes('rgba(251, 113, 133, 0.6)', m(8), R * 0.5);
    } else if (chord === 'beam') {
      // AQUA LANCE impact: a burst of pressurised water and ink erupting from
      // the eye along the beam spine — ice-crack sparkles, a twin ring of water
      // and ink, and a fan of mist droplets marching down the lance.
      flash('#93c5f7', 11);
      if (typeof particles.magicSparkle === 'function') {
        particles.magicSparkle(x, y, '#93c5f7', m(22));
        particles.magicSparkle(x, y, '#1a0308', m(14));
        particles.magicSparkle(x, y, '#ffffff', m(10));
      }
      shockwave(['#ffffff', '#93c5f7', '#1a0308'], R, 18);
      ring('rgba(147, 197, 253)', R, m(18));
      ring('rgba(124, 50, 94)', R * 0.7, m(12), 1.0);
      // Pressurised mist: droplets fanning down the charged spine toward the
      // target, so the blast reads as a column, not a single point.
      if (opts.target) {
        const bdx = opts.target.x - x, bdy = opts.target.y - y;
        const blen = Math.hypot(bdx, bdy) || 1;
        const nx = bdx / blen, ny = bdy / blen;
        for (let i = 0; i < m(20); i++) {
          const f = i / m(20);
          const mx = x + nx * blen * f + (Math.random() - 0.5) * 22;
          const my = y + ny * blen * f + (Math.random() - 0.5) * 22;
          if (typeof particles.addParticle === 'function') {
            particles.addParticle(mx, my, (Math.random() - 0.5) * 1.8,
              (Math.random() - 0.5) * 1.8 - 1.2,
              i % 2 ? 'rgba(147, 197, 253, 0.8)' : 'rgba(124, 50, 94, 0.7)',
              3, 0.7 + Math.random() * 0.5, 0.22, false);
          }
        }
        // Crackle sparkles along the spine for a frozen-lance look.
        if (typeof particles.magicSparkle === 'function') {
          for (let i = 0; i < m(8); i++) {
            const f = (i / m(8)) * 0.6 + 0.1;
            particles.magicSparkle(x + nx * blen * f, y + ny * blen * f,
              '#ffffff', 2 + (i % 2) * 2);
          }
        }
      }
      motes('rgba(168, 85, 247, 0.75)', m(12), R * 0.85);
      // A second, bigger detonation at the far end of the lance where it lands,
      // so the beam reads as a projectile that HITS, not just a line from A.
      if (opts.target && typeof particles.magicSparkle === 'function') {
        const tImpact = ['#ffffff', '#93c5f7', '#fecdd3'];
        for (let i = 0; i < m(26); i++) {
          const a = (i / m(26)) * Math.PI * 2;
          const spd = (60 + ph * 22) * (0.6 + Math.random() * 0.8);
          if (typeof particles.addParticle === 'function') {
            particles.addParticle(opts.target.x, opts.target.y,
              Math.cos(a) * spd, Math.sin(a) * spd * 0.7,
              tImpact[i % tImpact.length], 3.4 + ph * 0.6, 0.6 + Math.random() * 0.5, 0, true);
          }
        }
        particles.magicSparkle(opts.target.x, opts.target.y, '#ffffff', m(24));
        particles.magicSparkle(opts.target.x, opts.target.y, '#93c5f7', m(18));
      }
    } else if (chord === 'inkspew') {
      // INK SPEW impact: the maw erupts a fan of blinding mist along its spine,
      // a twin ring of water and ink, and droplet mist racing down the cone.
      flash('#4a0d1f', 9);
      if (typeof particles.magicSparkle === 'function') {
        particles.magicSparkle(x, y, '#93c5f7', m(14));
        particles.magicSparkle(x, y, '#1a0308', m(18));
      }
      shockwave(['#0b0212', '#7f1d3a', '#93c5f7'], R, 16);
      ring('rgba(147, 197, 253)', R, m(16));
      ring('rgba(26, 3, 8)', R * 0.7, m(12), 1.0);
      // Spine mist: droplets fanning along the spew direction toward the target.
      if (opts.target) {
        const bdx = opts.target.x - x, bdy = opts.target.y - y;
        const blen = Math.hypot(bdx, bdy) || 1;
        const nx = bdx / blen, ny = bdy / blen;
        const nSpew = m(22);
        for (let i = 0; i < nSpew; i++) {
          const f = i / nSpew;
          const mx = x + nx * 200 * f + (Math.random() - 0.5) * 24;
          const my = y + ny * 200 * f + (Math.random() - 0.5) * 24;
          if (typeof particles.addParticle === 'function') {
            particles.addParticle(mx, my, (Math.random() - 0.5) * 2,
              (Math.random() - 0.5) * 2 - 1,
              'rgba(26, 3, 8, ' + (0.4 + f * 0.3).toFixed(3) + ')',
              4 - f * 2, 0.6 + Math.random() * 0.4, 0.18, false);
          }
        }
      }
      motes('rgba(124, 50, 94, 0.8)', m(12), R * 0.8);
    }
  }

  /** Cinematic weight for the heaviest resolves: hit-stop + slow-mo + shake. */
  skillImpact(chord, baseShake) {
    const feel = this.game && this.game.feel;
    if (!feel) return;
    // The cinematic weight scales with phase too — a FINAL INK hit freezes the
    // screen harder and drops into slow-mo longer than the phase-1 version of
    // the same skill, so the whole fight escalates in FEEL, not just numbers.
    const w = 1 + (this.phase - 1) * 0.55;
    if (chord === 'slam' || chord === 'whirlpool') {
      if (typeof feel.stop === 'function') feel.stop(0.09 * w, 0.05);
      if (typeof feel.slow === 'function') feel.slow(0.35 * w, 0.35);
    } else if (chord === 'inkburst' || chord === 'geyser') {
      if (typeof feel.stop === 'function') feel.stop(0.06 * w, 0.06);
    }
    if (typeof feel.shake === 'function') feel.shake(baseShake);
  }

  resolvePending(sound, particles) {
    const p = this.pending;
    this.pending = null;
    if (!p) return;
    // Every resolve kicks the recoil spring so the body snaps forward the
    // instant a skill fires — the anticipation coil pays off into a lunge, and
    // the bigger the phase the harder the kick, so late-game attacks hit with
    // real physical weight.
    this.recoilV = (this.recoilV || 0) + 9 + this.phase * 2.5;
    this.pulse = Math.max(this.pulse || 0, 0.7 + this.phase * 0.1);
    const player = this.game && this.game.player;
    const ppx = player ? player.x + player.width / 2 : 0;
    const ppy = player ? player.y + player.height / 2 : 0;
    // Phase power ladder: every phase is a real step up, so the final ink
    // phase is a completely different fight from the opening salvo.
    const ph = this.phase;
    const dmgMul = 1 + (ph - 1) * 1.5;
    const power = 1 + (ph - 1) * 1.7;
    const atkMul = 1 + (ph - 1) * 0.85;
    if (p.type === 'ink_burst') {
      this.skillFX(particles, p.x, p.y, 'inkburst', { radius: p.radius });
      this.skillImpact('inkburst', 0.35);
      if (player && Math.hypot(ppx - p.x, ppy - p.y) <= p.radius) {
        this.game.damagePlayer(Math.round((70 + ph * 26) * dmgMul), p.x,
          'The Kraken’s ink cloud blinded you!', true, p.y);
        if (this.game.buffs) this.game.buffs.add('ink_blindness', 14);
        if (this.game.feel) this.game.feel.shake(0.35);
      }
    } else if (p.type === 'slam') {
      this.skillFX(particles, p.x, p.y, 'slam', { radius: p.radius });
      this.skillImpact('slam', 0.55);
      if (player && Math.hypot(ppx - p.x, ppy - p.y) <= p.radius) {
        this.game.damagePlayer(Math.round((95 + ph * 32) * dmgMul), p.x,
          'A Kraken tentacle slam crushed you!', true, p.y);
      }
    } else if (p.type === 'geyser') {
      // Three columns erupt; each vent is its own damage + ink check.
      for (const v of (p.vents || [-1, 0, 1])) {
        this.skillFX(particles, p.x + v * 70, p.y, 'geyser', { radius: 70 * power });
      }
      this.skillImpact('geyser', 0.5);
      for (const v of (p.vents || [-1, 0, 1])) {
        const vx = p.x + v * 70;
        if (player && Math.abs(ppx - vx) <= 46 * power) {
          this.game.damagePlayer(Math.round((74 + ph * 26) * dmgMul), vx,
            'A geyser of black ink erupted beneath you!', true, p.y);
          if (this.game.buffs) this.game.buffs.add('ink_blindness', 6);
        }
      }
      if (this.game && this.game.feel) this.game.feel.shake(0.5);
    } else if (p.type === 'whirlpool') {
      // The vortex collapses: a spiral burst of debris spinning out of the
      // core, a final inward crush + blindness.
      this.skillFX(particles, p.x, p.y, 'whirlpool',
        { radius: p.radius, spin: this.animT * 6 });
      this.skillImpact('whirlpool', 0.6);
      if (player && Math.hypot(ppx - p.x, ppy - p.y) <= p.radius) {
        this.game.damagePlayer(Math.round((82 + ph * 28) * dmgMul), p.x,
          'The whirlpool dragged you into its crushing core!', true, p.y);
        if (this.game.buffs) this.game.buffs.add('ink_blindness', 8);
      }
      if (this.game && this.game.feel) this.game.feel.shake(0.6 * power);
    } else if (p.type === 'sweep') {
      // A scything arc: hit if the player is within the radius AND within the
      // swept angular band in front of the Kraken.
      this.skillFX(particles, p.x, p.y, 'sweep', { radius: p.radius, angle: p.angle });
      this.skillImpact('sweep', 0.45);
      if (player) {
        const dx = ppx - p.x, dy = ppy - p.y;
        const dist = Math.hypot(dx, dy);
        let dAng = Math.atan2(dy, dx) - p.angle;
        while (dAng > Math.PI) dAng -= Math.PI * 2;
        while (dAng < -Math.PI) dAng += Math.PI * 2;
        if (dist <= p.radius && Math.abs(dAng) <= 0.9) {
          this.game.damagePlayer(Math.round((105 + ph * 34) * dmgMul), ppx,
            'A sweeping tentacle hurled you aside!', true, ppy);
        }
      }
      if (this.game && this.game.feel) this.game.feel.shake(0.45 * power);
} else if (p.type === 'barrage') {
      // All the stabs already fired on their beats; the resolve moment is just
      // the arena exhaling — a last ring of ichor at each spent spike.
      for (const stab of p.stabs) {
        if (stab.done) this.skillFX(particles, stab.x, stab.y, 'stab', {});
      }
      this.skillImpact('barrage', 0.4);
    } else if (p.type === 'beam') {
      // AQUA LANCE resolve: the locked lance erupts from the eye along the
      // charged spine. Players still intersecting the beam take the hit and are
      // thrown back; the impact vents to the seabed as a high-pressure scar.
      this.skillFX(particles, p.x, p.y, 'beam', { target: p.target, radius: p.radius });
      this.skillImpact('beam', 0.5);
      if (player) {
        const x1 = p.x, y1 = p.y, x2 = p.target.x, y2 = p.target.y;
        const bdx = x2 - x1, bdy = y2 - y1;
        const blen2 = bdx * bdx + bdy * bdy || 1;
        let tt = ((player.x + player.width / 2 - x1) * bdx +
                  (player.y + player.height / 2 - y1) * bdy) / blen2;
        tt = Math.max(0, Math.min(1, tt));
        const cx2 = x1 + tt * bdx, cy2 = y1 + tt * bdy;
        const dist = Math.hypot((player.x + player.width / 2) - cx2,
                                (player.y + player.height / 2) - cy2);
        const hitW = (34 + ph * 4) * power;
        if (dist <= hitW) {
          this.game.damagePlayer(Math.round((140 + ph * 40) * dmgMul), p.target.x,
            'The Abyssal Kraken’s water-laser seared you!', true, p.target.y);
          // Knockback AWAY from the eye along the beam spine.
          const kdx = (player.x + player.width / 2) - p.x;
          const kdy = (player.y + player.height / 2) - p.y;
          const klen = Math.hypot(kdx, kdy) || 1;
          player.x += (kdx / klen) * 52 * power;
          player.y += (Math.max(0, kdy) / klen) * 18 * power;
        }
      }
    } else if (p.type === 'ink_spew') {
      // INK SPEW resolve: the cone erupts in a burst of blinding mist. Anyone
      // still inside the channel takes damage and is blinded — the sea goes dark.
      this.skillFX(particles, p.x, p.y, 'inkspew', { angle: p.angle, width: p.width });
      this.skillImpact('inkspew', 0.45);
      if (player) {
        const dx = (player.x + player.width / 2) - p.x;
        const dy = (player.y + player.height / 2) - p.y;
        const dist = Math.hypot(dx, dy);
        const len = (230 + ph * 30) * power;
        const toP = Math.atan2(dy, dx);
        const dAng = Math.abs(((toP - p.angle + Math.PI) % (Math.PI * 2)) - Math.PI);
        if (dist <= len && dAng <= p.width + 0.18) {
          this.game.damagePlayer(Math.round((56 + ph * 20) * dmgMul), p.x,
            'The Abyssal Kraken’s cone of ink blinded you!', true, p.y);
          if (this.game.buffs) this.game.buffs.add('ink_blindness', 10);
          if (this.game.feel) this.game.feel.shake(0.3);
        }
      }
    }
    // The seabed remembers every slammed attack: a dark ink pool stains the
    // ground where it landed, fading slowly so the arena tells the fight's
    // story. This is what makes the skills FEEL like they matter, not just
    // numbers — you see the crater you left behind.
    this.inkPools.push({
      x: p.x, y: p.y, r: ((p.radius || 80) * 0.55 + 10) * power,
      t: 0, life: 6 + ph * 2, peak: 0.55
    });
    this.skillGlow = 0.4 + ph * 0.15;
    if (sound) sound.playHit();
  }

  /** A fan of hostile ink globs aimed at the player. Blind on contact. */
  fireInkGlobs(target, projectiles) {
    const ph = this.phase;
    const power = 1 + (ph - 1) * 1.7;
    const dmgMul = 1 + (ph - 1) * 1.5;
    const cx = this.x + this.width * 0.5;
    const cy = this.y + this.height * 0.42;
    const px = target.x + target.width / 2;
    const py = target.y + target.height / 2;
    const base = Math.atan2(py - cy, px - cx);
    // The volley thickens and bites harder every phase: more globs, faster, and
    // a wider fan so late phases carpet the water instead of poking at you.
    const count = 3 + ph * 2;
    const speed = (6 + ph * 1.1) * power;
    const spread = 0.30 - ph * 0.02;
    for (let i = 0; i < count; i++) {
      const a = base + (i - (count - 1) / 2) * spread;
      const glob = new Projectile(cx, cy,
        Math.cos(a) * speed, Math.sin(a) * speed,
        'ink_glob', Math.round((52 + ph * 18) * dmgMul), true, 3.5, 70);
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
      // INK BURST telegraph: a closing iris + a boiling core + orbiting
      // sparks. Reads as "the sea is about to detonate HERE".
      ctx.setLineDash([12, 8]);
      ctx.lineWidth = 4;
      ctx.strokeStyle = 'rgba(244, 63, 94, ' + (0.55 + pulse * 0.4).toFixed(3) + ')';
      ctx.beginPath();
      ctx.arc(sx, sy, p.radius, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);
      // Boiling core: stacked flickering discs that swell as it winds up.
      for (let blob = 0; blob < 5; blob++) {
        const ba = this.animT * 3 + blob * 1.256;
        const br = p.radius * (0.12 + 0.10 * k) * (0.8 + 0.3 * Math.sin(ba * 2.3));
        const bx = sx + Math.cos(ba) * p.radius * 0.22 * k;
        const by = sy + Math.sin(ba * 1.3) * p.radius * 0.22 * k;
        ctx.fillStyle = 'rgba(26, 3, 8, ' + (0.35 + 0.3 * k).toFixed(3) + ')';
        ctx.beginPath(); ctx.arc(bx, by, br, 0, Math.PI * 2); ctx.fill();
      }
      // Orbiting warning sparks: 8 embers circling the rim, speeding up.
      ctx.fillStyle = 'rgba(253, 164, 175, ' + (0.5 + pulse * 0.5).toFixed(3) + ')';
      for (let s = 0; s < 8; s++) {
        const a = this.animT * (2 + k * 6) + s * (Math.PI / 4);
        ctx.beginPath();
        ctx.arc(sx + Math.cos(a) * p.radius, sy + Math.sin(a) * p.radius,
          3 + k * 2, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.fillStyle = 'rgba(76, 5, 25, ' + (0.15 + 0.35 * k).toFixed(3) + ')';
      ctx.beginPath();
      ctx.arc(sx, sy, p.radius * (0.7 + 0.3 * k), 0, Math.PI * 2);
      ctx.fill();
    } else if (p.type === 'geyser') {
      // GEYSER telegraph: three warning columns that brighten and fill upward,
      // each crowned with a bubbling vent cap + rising bubble previews.
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
        // Bubbling vent cap: a churning mound at the column base.
        for (let b = 0; b < 4; b++) {
          const ba = this.animT * 7 + b * 1.7 + v;
          const br = 4 + 3 * Math.abs(Math.sin(ba)) * (0.5 + k);
          ctx.fillStyle = 'rgba(26, 3, 8, ' + (0.4 + 0.35 * k).toFixed(3) + ')';
          ctx.beginPath();
          ctx.arc(vx + Math.sin(ba * 1.4) * 14, sy - 4 - (b * 5), br, 0, Math.PI * 2);
          ctx.fill();
        }
        // Rising bubble previews climbing the column.
        ctx.fillStyle = 'rgba(254, 205, 211, ' + (0.3 + 0.4 * k).toFixed(3) + ')';
        for (let b = 0; b < 3; b++) {
          const rise = ((this.animT * 90 + b * 50 + v * 17) % 150);
          ctx.beginPath();
          ctx.arc(vx + Math.sin(this.animT * 5 + b * 2 + v) * 10,
            sy - rise, 2.5, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    } else if (p.type === 'whirlpool') {
      // WHIRLPOOL telegraph: concentric rings that rotate and close in, spiral
      // arms, a tightening dark core — plus orbiting debris chunks and inward
      // streaklines so the PULL reads before it grabs you.
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
      // Orbiting debris chunks caught in the current.
      ctx.fillStyle = 'rgba(69, 10, 10, ' + (0.4 + 0.4 * k).toFixed(3) + ')';
      for (let d = 0; d < 7; d++) {
        const da = spin * 1.4 + d * 0.9;
        const dr = p.radius * (0.75 - k * 0.3) * (0.7 + (d % 3) * 0.15);
        ctx.beginPath();
        ctx.arc(sx + Math.cos(da) * dr, sy + Math.sin(da) * dr * 0.6,
          2.5 + (d % 2) * 1.5, 0, Math.PI * 2);
        ctx.fill();
      }
      // Inward streaklines: short dashes racing toward the core.
      ctx.strokeStyle = 'rgba(253, 224, 71, ' + (0.25 + 0.35 * k).toFixed(3) + ')';
      ctx.lineWidth = 2;
      for (let s = 0; s < 10; s++) {
        const sa = spin * 0.7 + s * 0.63;
        const r0 = p.radius * (1.25 - k * 0.5);
        const r1 = r0 * 0.82;
        ctx.beginPath();
        ctx.moveTo(sx + Math.cos(sa) * r0, sy + Math.sin(sa) * r0 * 0.6);
        ctx.lineTo(sx + Math.cos(sa) * r1, sy + Math.sin(sa) * r1 * 0.6);
        ctx.stroke();
      }
    } else if (p.type === 'sweep') {
      // SWEEP telegraph: a rotating wedge + a ghost of the arm itself sweeping
      // across the arc + spray streaks, so you see the limb coming, not just
      // a shape on the floor.
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
      // Ghost arm: a thick translucent limb from the kraken toward the sweep
      // front, so the telegraph reads as a limb mid-swing.
      ctx.strokeStyle = 'rgba(190, 18, 60, ' + (0.25 + 0.35 * k).toFixed(3) + ')';
      ctx.lineWidth = 16;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(sx, sy);
      ctx.quadraticCurveTo(
        sx + Math.cos(sweepNow) * p.radius * 0.55,
        sy + Math.sin(sweepNow) * p.radius * 0.55 - 30 * (1 - k),
        sx + Math.cos(sweepNow) * p.radius * 0.92,
        sy + Math.sin(sweepNow) * p.radius * 0.92);
      ctx.stroke();
      ctx.strokeStyle = 'rgba(254, 205, 211, ' + (0.3 + 0.3 * k).toFixed(3) + ')';
      ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.moveTo(sx, sy);
      ctx.quadraticCurveTo(
        sx + Math.cos(sweepNow) * p.radius * 0.55,
        sy + Math.sin(sweepNow) * p.radius * 0.55 - 30 * (1 - k),
        sx + Math.cos(sweepNow) * p.radius * 0.92,
        sy + Math.sin(sweepNow) * p.radius * 0.92);
      ctx.stroke();
      // Spray streaks flung ahead of the swing.
      ctx.strokeStyle = 'rgba(255, 255, 255, ' + (0.2 + 0.3 * k).toFixed(3) + ')';
      ctx.lineWidth = 2;
      for (let s = 0; s < 5; s++) {
        const sa = sweepNow + 0.45 + 0.06 * s;
        const r0 = p.radius * (0.55 + 0.08 * s);
        ctx.beginPath();
        ctx.moveTo(sx + Math.cos(sa) * r0, sy + Math.sin(sa) * r0);
        ctx.lineTo(sx + Math.cos(sa) * (r0 + 22), sy + Math.sin(sa) * (r0 + 22));
        ctx.stroke();
      }
    } else if (p.type === 'barrage') {
      // TENTACLE BARRAGE telegraph: each stab beat gets a churning mound, a
      // rising tentacle ghost, and a timing ring that closes in — the whole
      // arena becomes a rhythm of dodges.
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
        const warmup = Math.max(0, Math.min(1, 1 - untilStab / 1.2)); // 0→1 over last 1.2s
        // Churning mound: the seabed bulges before the spike.
        if (warmup > 0 && !stab.done) {
          ctx.fillStyle = 'rgba(69, 10, 10, ' + (0.25 + 0.4 * warmup).toFixed(3) + ')';
          ctx.beginPath();
          ctx.ellipse(tx, ty + 14, 20 + 14 * warmup, 7 + 5 * warmup, 0, 0, Math.PI * 2);
          ctx.fill();
        }
        // Rising tentacle ghost: a thick translucent spear climbing out of the
        // mound as the beat approaches.
        if (warmup > 0.25 && !stab.done) {
          const spearH = 70 * warmup;
          ctx.strokeStyle = 'rgba(190, 18, 60, ' + (0.3 + 0.45 * warmup).toFixed(3) + ')';
          ctx.lineWidth = 13;
          ctx.lineCap = 'round';
          ctx.beginPath();
          ctx.moveTo(tx, ty + 14);
          ctx.quadraticCurveTo(tx + Math.sin(this.animT * 9 + stab.at * 10) * 8,
            ty + 14 - spearH * 0.6, tx, ty + 14 - spearH);
          ctx.stroke();
          ctx.strokeStyle = 'rgba(254, 205, 211, ' + (0.3 + 0.4 * warmup).toFixed(3) + ')';
          ctx.lineWidth = 4;
          ctx.beginPath();
          ctx.moveTo(tx, ty + 14);
          ctx.quadraticCurveTo(tx + Math.sin(this.animT * 9 + stab.at * 10) * 8,
            ty + 14 - spearH * 0.6, tx, ty + 14 - spearH);
          ctx.stroke();
        }
        // Timing ring: closes in on the stab point as its beat arrives.
        if (!stab.done && untilStab > 0) {
          const ringR = 20 + untilStab * 90;
          ctx.strokeStyle = 'rgba(253, 224, 71, ' + (0.25 + 0.3 * warmup).toFixed(3) + ')';
          ctx.lineWidth = 2.5;
          ctx.setLineDash([5, 5]);
          ctx.beginPath(); ctx.arc(tx, ty + 14, ringR, 0, Math.PI * 2); ctx.stroke();
          ctx.setLineDash([]);
        }
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
    } else if (p.type === 'ink_spew') {
      // INK SPEW telegraph: a widening cone of murk pouring from the maw — you
      // must leave the sector, not just the epicentre.
      const len = 230 + this.phase * 30;
      const wedge = ctx.createRadialGradient(sx, sy, 0, sx, sy, len);
      wedge.addColorStop(0, 'rgba(26, 3, 8, ' + (0.12 + 0.18 * k).toFixed(3) + ')');
      wedge.addColorStop(0.55, 'rgba(26, 3, 8, ' + (0.22 + 0.22 * k).toFixed(3) + ')');
      wedge.addColorStop(1, 'rgba(26, 3, 8, 0)');
      ctx.fillStyle = wedge;
      ctx.beginPath();
      ctx.moveTo(sx, sy);
      const inkA = p.angle, inkW = p.width;
      ctx.arc(sx, sy, len, inkA - inkW / 2, inkA + inkW / 2);
      ctx.closePath(); ctx.fill();
      // Edge lances: ink racing along the cone borders as it widens.
      ctx.strokeStyle = 'rgba(124, 50, 94, ' + (0.3 + 0.4 * k).toFixed(3) + ')';
      ctx.lineWidth = 3 + 8 * k;
      ctx.lineCap = 'round';
      for (const sign of [-1, 1]) {
        const ex = sx + Math.cos(inkA + sign * inkW / 2) * len * k;
        const ey = sy + Math.sin(inkA + sign * inkW / 2) * len * k;
        ctx.beginPath(); ctx.moveTo(sx, sy); ctx.lineTo(ex, ey); ctx.stroke();
      }
    } else if (p.type === 'beam') {
      // AQUA LANCE telegraph: a white-hot eye, a charging spine that thickens
      // and brightens toward the player, and a ring that contracts to nothing
      // at their feet — strafe or take the searing hit.
      const tx = p.target.x - camera.x;
      const ty = p.target.y - camera.y;
      const charge = 0.5 + 0.5 * k;                  // 0.5 → 1.0 as it winds up
      const bdx = p.target.x - p.x, bdy = p.target.y - p.y;
      const blen = Math.hypot(bdx, bdy) || 1;
      const nx = bdx / blen, ny = bdy / blen;
      // Eye superheat core: the glow grows as it locks on.
      ctx.fillStyle = 'rgba(255, 255, 255, ' + (0.25 + 0.45 * charge).toFixed(3) + ')';
      ctx.beginPath(); ctx.arc(sx, sy, 6 + 12 * charge, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = 'rgba(255, 241, 194, ' + (0.25 + 0.4 * charge).toFixed(3) + ')';
      ctx.beginPath(); ctx.arc(sx, sy, 3 + 7 * charge, 0, Math.PI * 2); ctx.fill();
      // The charging spine: thin core → bright lance, widening along its length.
      ctx.lineCap = 'round';
      ctx.strokeStyle = 'rgba(165, 243, 253, ' + (0.35 + 0.45 * charge).toFixed(3) + ')';
      ctx.lineWidth = 3 + 10 * charge;
      ctx.beginPath(); ctx.moveTo(sx, sy); ctx.lineTo(tx, ty); ctx.stroke();
      ctx.strokeStyle = 'rgba(255, 255, 255, ' + (0.45 + 0.4 * charge).toFixed(3) + ')';
      ctx.lineWidth = 1.5 + 4 * charge;
      ctx.beginPath(); ctx.moveTo(sx, sy); ctx.lineTo(tx, ty); ctx.stroke();
      // Contracting ring at the player end — the moment it hits zero, it fires.
      const ringR = 30 * (1 - k);
      ctx.setLineDash([5, 6]);
      ctx.strokeStyle = 'rgba(253, 224, 71, ' + (0.3 + 0.5 * charge).toFixed(3) + ')';
      ctx.lineWidth = 3;
      ctx.beginPath(); ctx.arc(tx, ty, ringR, 0, Math.PI * 2); ctx.stroke();
      ctx.setLineDash([]);
      // Micro-spark streaks racing down the spine as the charge peaks.
      ctx.strokeStyle = 'rgba(255, 255, 255, ' + (0.15 + 0.35 * charge).toFixed(3) + ')';
      ctx.lineWidth = 1.5;
      for (let s = 0; s < 6; s++) {
        const f = Math.random();
        ctx.beginPath();
        ctx.moveTo(sx + (tx - sx) * f, sy + (ty - sy) * f);
        ctx.lineTo(sx + (tx - sx) * f + nx * 6, sy + (ty - sy) * f + ny * 6);
        ctx.stroke();
      }
    } else {
      // SLAM telegraph: the generic circle becomes a cracking impact site —
      // a dark crater disc, radiating cracks, a closing timing ring, a
      // descending shadow of the incoming limb, and rising dust.
      ctx.fillStyle = 'rgba(43, 6, 8, ' + (0.25 + 0.3 * k).toFixed(3) + ')';
      ctx.beginPath(); ctx.arc(sx, sy, p.radius * (0.5 + 0.5 * k), 0, Math.PI * 2); ctx.fill();
      // Radiating cracks that lengthen as the hit approaches.
      ctx.strokeStyle = 'rgba(26, 3, 8, ' + (0.5 + 0.4 * k).toFixed(3) + ')';
      ctx.lineWidth = 3;
      for (let c = 0; c < 8; c++) {
        const ca = c * (Math.PI / 4) + 0.4;
        const r0 = p.radius * 0.15;
        const r1 = p.radius * (0.3 + 0.6 * k);
        ctx.beginPath();
        ctx.moveTo(sx + Math.cos(ca) * r0, sy + Math.sin(ca) * r0 * 0.6);
        ctx.lineTo(sx + Math.cos(ca) * r1, sy + Math.sin(ca) * r1 * 0.6);
        ctx.stroke();
      }
      // Closing timing ring: starts wide, lands exactly on the radius.
      const ringR = p.radius * (1.6 - 0.6 * k);
      ctx.setLineDash([10, 7]);
      ctx.lineWidth = 4;
      ctx.strokeStyle = 'rgba(253, 224, 71, ' + (0.35 + 0.4 * k).toFixed(3) + ')';
      ctx.beginPath(); ctx.arc(sx, sy, ringR, 0, Math.PI * 2); ctx.stroke();
      ctx.setLineDash([]);
      // Descending limb shadow: a dark bar dropping onto the site.
      const dropK = k * k;
      ctx.fillStyle = 'rgba(26, 3, 8, ' + (0.25 + 0.45 * dropK).toFixed(3) + ')';
      ctx.fillRect(sx - 14, sy - 160 * (1 - dropK) - 30, 28, 60);
      // Rising dust motes shaken loose before the hit.
      ctx.fillStyle = 'rgba(254, 205, 211, ' + (0.2 + 0.35 * k).toFixed(3) + ')';
      for (let d = 0; d < 5; d++) {
        const da = this.animT * 4 + d * 1.256;
        ctx.beginPath();
        ctx.arc(sx + Math.cos(da) * p.radius * 0.6,
          sy + Math.sin(da) * p.radius * 0.3 - 6 * k, 2, 0, Math.PI * 2);
        ctx.fill();
      }
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
    const ph = this.phase;
    // Phase power ladder: every phase is a real step up, so the silhouette
    // itself grows — phase 4 is a bigger, brighter, angrier beast.
    const power = 1 + (ph - 1) * 1.7;
    const t = this.animT * (1.6 + ph * 0.35);
    const lash = this.lashPhase || 0;
    const hiddenNow = this.hideAlpha < 0.6;
    const flash = this.hitFlash > 0;
    const faceDir = this.faceDir || 1;

    // ---- Terraria palette: a small, flat set of tones, nothing blended ----
    const skinLit = flash ? '#ffffff' : ph === 4 ? '#ffffff' : ph === 3 ? '#dc2626' : ph === 2 ? '#f43f5e' : '#fb7185';
    const skinTop = flash ? '#fecaca' : ph === 4 ? '#fde68a' : ph === 3 ? '#b91c1c' : ph === 2 ? '#e11d48' : '#f43f5e';
    const skinMid = flash ? '#fca5a5' : ph === 4 ? '#f97316' : ph === 3 ? '#7f1d1d' : ph === 2 ? '#9f1239' : '#be123c';
    const skinTip = flash ? '#fecaca' : ph === 4 ? '#450a0a' : ph === 3 ? '#450a0a' : ph === 2 ? '#4c0519' : '#7f1d3a';
    const skinDark = '#2b0608';
    const ink = '#1a0308';            // the hard outline colour
    const suckerColor = flash ? '#ffffff' : ph === 4 ? '#fef08a' : ph === 3 ? '#fecaca' : '#fecdd3';
    const rimColor = flash ? '#ffffff' : ph === 4 ? '#fde68a' : ph === 3 ? '#fb7185' : '#fda4af';

    ctx.save();
    // ---- The WHOLE body moves: bank, pitch, skew, squash, breathe ----
    // Lean banks the beast into its swim; pitch noses the mantle with dives
    // and climbs; skew shears the silhouette on horizontal bursts; the squash
    // spring compresses/widens the cone on every turn beat and releases with
    // a bounce; breath swells everything ±4% on the inhale. All of it stacks,
    // so the silhouette is never the same shape twice in a row.
    const squash = this.squash || 0;
    const breath = this.breath || 1;
    const pitch = this.pitch || 0;
    const skew = this.skew || 0;
    // lunge: the anticipation coil pulls the body back, the recoil snaps it
    // FORWARD toward whatever it is facing — so every skill fires with a
    // physical lunge the player can read off the silhouette.
    const lunge = this.lunge || 0;
    const bodyCX = cx + (this.sway || 0);
    const bodyCY = y + this.height * 0.5 + (this.bob || 0);
    ctx.translate(bodyCX, bodyCY);
    ctx.rotate((this.lean || 0) * 0.18 + pitch * 0.35 + lunge * 0.06 * faceDir);
    ctx.transform(1 + skew * 0.6 + squash * 0.35, skew * 0.25,
      skew * 0.25, (1 - squash * 0.45) * breath, 0, 0);
    ctx.scale(breath, breath);
    ctx.translate(-bodyCX, -bodyCY);
    // The lunge shifts the whole silhouette along the facing axis, so the beast
    // physically throws itself into each attack instead of standing and glowing.
    ctx.translate((this.sway || 0) + faceDir * lunge * 26, (this.bob || 0) - Math.abs(lunge) * 8);
    ctx.globalAlpha = hiddenNow ? Math.max(0.12, this.hideAlpha) : 1;
    ctx.lineJoin = 'round';
    // Travelling ripple: a wave running apex→arms the limbs spend as lag.
    // spineOff(k) offsets any point at body-fraction k (0 = apex, 1 = arms).
    const swimPh = this.swimPhase || 0;
    const speedNow = Math.hypot(this.vx || 0, this.vy || 0);
    const rippleAmp = 4 + Math.min(10, speedNow / 22) + (this.lashTimer > 0 ? 5 : 0);
    const spineOff = (k) => Math.sin(swimPh * 2.1 - k * 3.4) * rippleAmp * (0.25 + k * 0.75);

    // ====================================================================
    // Geometry. A kraken is: a TALL tapering mantle (apex up), a narrow
    // head with two big eyes below it, then a heavy crown of ten limbs below
    // the head. The mantle is deliberately much taller than it is wide.
    // There is no mouth/beak: the face is eyes only, which reads cleaner at
    // boss scale and never looks like a weird beak. The eyes grow with phase.
    const apexY = y + this.height * 0.02;       // pointed tip of the mantle
    const shoulderY = y + this.height * 0.30;   // widest point of the cone
    const headY = y + this.height * 0.57;       // eyes, low above the arms
    const limbRootY = headY + this.height * 0.04;  // where the arm crown roots
    // The mantle is deliberately NARROW: at 0.20 of the body width the cone is
    // clearly taller than it is wide, which is the whole difference between a
    // kraken and a jellyfish bell. The shoulder flares only gently and the
    // collar tucks back in toward the head.
    const shoulderW = this.width * 0.20;   // mantle half-width at the shoulder
    const collarW = this.width * 0.13;     // mantle half-width at the head
    const headW = this.width * 0.22;

    // ---- Helper: a tapering limb from a base to a curling tip -----------
    // lagRx/lagRy bend the control point opposite the swim direction so fast
    // limbs trail behind the mantle instead of sticking out rigidly.
    const lagRx = -(this.vx || 0) * 0.16;
    const lagRy = -(this.vy || 0) * 0.10;
    const qPoint = (x0, y0, x1, y1, x2, y2, tt) => {
      const it = 1 - tt;
      return { x: it * it * x0 + 2 * it * tt * x1 + tt * tt * x2,
        y: it * it * y0 + 2 * it * tt * y1 + tt * tt * y2 };
    };
    const limb = (bx, by, ctrlX, ctrlY, tipX, tipY, baseW) => {
      const segs = 14;
      ctx.lineCap = 'round';
      // 1. Hard outline, one step wider than the limb.
      ctx.strokeStyle = ink;
      ctx.lineWidth = baseW + 5;
      ctx.beginPath(); ctx.moveTo(bx, by);
      ctx.quadraticCurveTo(ctrlX, ctrlY, tipX, tipY); ctx.stroke();
      // 2. Flat body tones, quantised into four bands.
      const tones = [skinLit, skinTop, skinMid, skinTip];
      const bounds = [0.20, 0.45, 0.78, 1.0];
      for (let s = 0; s < segs; s++) {
        const t0 = s / segs, t1 = (s + 1) / segs;
        const w0 = baseW * (1 - t0) + 2.5 * t0;
        let band = 0; while (band < 3 && t0 > bounds[band]) band++;
        const p0 = qPoint(bx, by, ctrlX, ctrlY, tipX, tipY, t0);
        const p1 = qPoint(bx, by, ctrlX, ctrlY, tipX, tipY, t1);
        ctx.strokeStyle = tones[band];
        ctx.lineWidth = w0;
        ctx.beginPath(); ctx.moveTo(p0.x, p0.y); ctx.lineTo(p1.x, p1.y); ctx.stroke();
      }
      // 3. A pale rim-light down the leading edge for a wet sheen.
      const prevA = ctx.globalAlpha;
      ctx.globalAlpha = prevA * 0.5;
      ctx.strokeStyle = rimColor;
      ctx.lineWidth = Math.max(1.5, baseW * 0.26);
      ctx.beginPath(); ctx.moveTo(bx, by);
      ctx.quadraticCurveTo(ctrlX, ctrlY, tipX, tipY); ctx.stroke();
      ctx.globalAlpha = prevA;
      // 4. Suckers: discs down the underside, each ringed with a pale rim and
      //    a soft bioluminescent glow — the arms light up as they move, like a
      //    deep-sea hunter. The glow brightens with swim speed, the skill
      //    pulse and the turn-beat squash so the whole beast flickers with
      //    living light, brightest mid-lash.
      const suckerPulse = Math.min(1, 0.30 + Math.min(0.35, speedNow / 400) +
        this.skillGlow * 0.5 + squash * 0.5);
      for (const tt of [0.28, 0.40, 0.52, 0.64, 0.76, 0.88]) {
        const pt = qPoint(bx, by, ctrlX, ctrlY, tipX, tipY, tt);
        const r = 3.4 * (1 - tt) + 1.1;
        const sg = ctx.createRadialGradient(pt.x, pt.y, 0, pt.x, pt.y, r * 2.0);
        sg.addColorStop(0, 'rgba(147, 197, 253, ' + suckerPulse.toFixed(3) + ')');
        sg.addColorStop(1, 'rgba(147, 197, 253, 0)');
        ctx.fillStyle = sg;
        ctx.beginPath(); ctx.arc(pt.x, pt.y, r * 1.6, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = suckerColor;
        ctx.beginPath(); ctx.arc(pt.x, pt.y, r, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = 'rgba(26, 3, 8, 0.7)'; ctx.lineWidth = 1; ctx.stroke();
      }
    };

    // ====================================================================
    // 1. TWO long feeding tentacles, drawn first (furthest back). They curl
    //    out and UP like striking serpents -- the kraken's signature shape.
    // ====================================================================
    // Player (world -> screen) the feeding tentacles strike toward when attacking.
    // Idle they keep their rest curl (out and down); only a strike lets them track prey.
    const _P = this.game && this.game.player;
    const aimX = _P ? _P.x + _P.width / 2 - camera.x : cx + faceDir * 320;
    const aimY = _P ? _P.y + _P.height / 2 - camera.y : limbRootY + 80;
    const aimA = Math.atan2(aimY - limbRootY, aimX - cx);
    // Strike readiness: the hide/lash punch OR an aimed skill (aqua lance, ink
    // spew, sweep, ink burst, whirlpool) charging — then the tentacles snap to
    // attention and lash OUT at the prey instead of resting at their sides.
    let feedStrike = 0;
    if (this.lashTimer > 0) feedStrike = Math.max(feedStrike, lash * 0.9);
    if (this.pending && /^(beam|ink_spew|sweep|ink_burst|whirlpool)$/.test(this.pending.type)) {
      const pk = 1 - Math.max(0, this.pending.timer) / this.pending.total;
      feedStrike = Math.max(feedStrike, 0.25 + 0.7 * pk);
    }
    feedStrike = Math.min(1, feedStrike);
    const striking = feedStrike > 0.03;

    for (const side of [-1, 1]) {
      const bx = cx + side * this.width * 0.10 + spineOff(0.85);
      const sway = Math.sin(t * 0.6 + (side > 0 ? 0 : Math.PI)) * (26 + ph * 8) * power;
      // Idle: the two feeding tentacles curl out and slightly down like serpents
      // at rest. On a strike they pivot to aim at the prey and extend, hooking
      // around it — the classic kraken "strike and grab".
      const idleA = side < 0 ? Math.PI - 0.46 : 0.46;   // down-and-out, per side
      const lead = striking ? (aimA + side * 0.28) : idleA;
      const reach = striking
        ? (205 + ph * 12 + feedStrike * 115) * power
        : (185 + Math.abs(sway)) * power;
      const tipX = bx + Math.cos(lead) * reach;
      const tipY = limbRootY + Math.sin(lead) * reach;
      // Travelling serpent wave down the shaft, louder when surging / striking.
      const wave = Math.sin(t * 2.9 + side * 3.1) *
        (striking ? (16 + this.surge * 20 + feedStrike * 16) : (10 + this.surge * 14 + 3)) * power;
      const perX = -Math.sin(lead), perY = Math.cos(lead);
      const bStrength = (striking ? 52 : 38) * power;
      const ctrlX = bx + Math.cos(lead) * (reach * 0.52) + perX * bStrength +
        lagRx * 0.5 + wave * perX * 0.3;
      const ctrlY = limbRootY + Math.sin(lead) * (reach * 0.52) + perY * bStrength +
        lagRy * 0.5 + wave * perY * 0.3 + (striking ? 16 : 12) * power;
      limb(bx, limbRootY, ctrlX, ctrlY, tipX, tipY, 24 * power);
      // Hooked tip: a wider, ink-rimmed sucker cup that flares on the strike.
      const tipScale = 1 + feedStrike * 0.35;
      ctx.fillStyle = skinMid;
      ctx.strokeStyle = ink; ctx.lineWidth = 2.5 * power;
      ctx.beginPath(); ctx.arc(tipX, tipY, 7 * tipScale * power, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      // An ink flick trails the hook on the downstroke — the tentacle lashes.
      if (feedStrike > 0.6) {
        ctx.fillStyle = 'rgba(26, 3, 8, ' + (0.25 + 0.35 * feedStrike).toFixed(3) + ')';
        ctx.beginPath();
        ctx.ellipse(tipX + Math.cos(lead) * 12, tipY + Math.sin(lead) * 12,
          4 * tipScale * power, 10 * tipScale * power, lead, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // ====================================================================
    // 2. The EIGHT short arms, fanned across a full lower arc. Each arm is a
    //    heavy curl with its own slot so the crown reads as eight limbs.
    // ====================================================================
    for (let i = 0; i < 8; i++) {
      const f = i / 7;
      // Sweep the LOWER half-circle: arms hang down and fan outward like a
      // kraken's crown. (An upper-half sweep is what made the last version
      // look like a starfish with its arms in the air.)
      const ang = Math.PI * (0.06 + 0.88 * f);   // 0 = right, PI = left, under
      const dirX = Math.cos(ang);
      const dirY = Math.sin(ang);                 // 0..1, always downward-ish
      // Varied lengths so the crown is not a tidy star: the middle arms float
      // shorter, the outer pairs reach longest.
      const reach = this.height * (0.40 + 0.30 * Math.abs(Math.cos(ang * 1.5))) * power;
      const sway = Math.sin(t * 0.9 + i * 1.2) * (14 + ph * 5) * power;
      const punch = lash * (0.4 + 0.6 * Math.abs(dirX));
      // Each arm roots along the travelling ripple and its tip lags a full
      // beat behind — the crown ripples apex→tips in sequence, never in sync.
      const rootLag = spineOff(0.9);
      const bx = cx + dirX * (collarW * 0.8) + rootLag;
      const tipLag2 = Math.sin(swimPh * 2.1 - 3.6 - i * 0.35) * rippleAmp * 0.9;
      const tipX = cx + dirX * (reach * 0.95 + punch * 70) + sway +
        lagRx * (0.5 + 0.08 * i) + tipLag2 * 0.6;
      const tipY = limbRootY + dirY * (reach * 0.9) + punch * 30 +
        lagRy * (0.5 + 0.08 * i) +
        Math.cos(swimPh * 2.1 - 3.0 - i * 0.35) * rippleAmp * 0.5;
      // Curl DOWN: the control point is pushed low and wide so each arm bows
      // outward then hooks toward the seabed, like a limb feeling for prey. A
      // per-arm wave phase makes the crown ripple — ten limbs reading as ten
      // independent, writhing arms, not one stiff star.
      const wave = Math.sin(t * 3.1 + i * 0.9) * (6 + this.surge * 8) * power;
      const ctrlX = bx + dirX * (reach * 0.55) + sway * 0.5 + lagRx * 0.3;
      const ctrlY = limbRootY + dirY * (reach * 0.25) + reach * 0.30 + wave + lagRy * 0.3;
      limb(bx, limbRootY, ctrlX, ctrlY, tipX, tipY, 13 * power);
    }

    // ====================================================================
    // 3. THE MANTLE: a tall tapering cone, apex up. This is the part that
    //    has to beat the old "mushroom bell" read -- so it is long and
    //    narrow, with a pointed apex and a soft flare at the shoulder.
    // ====================================================================
    const mantleGrad = ctx.createLinearGradient(cx - shoulderW, apexY, cx + shoulderW, shoulderY);
    if (flash) {
      mantleGrad.addColorStop(0, '#ffffff'); mantleGrad.addColorStop(1, '#fecaca');
    } else if (this.phase === 4) {
      // Final ink: the mantle burns white-hot at the spine, bleeding to black.
      mantleGrad.addColorStop(0, '#ffffff');
      mantleGrad.addColorStop(0.4, '#fde68a');
      mantleGrad.addColorStop(0.7, '#dc2626');
      mantleGrad.addColorStop(1, '#1a0204');
    } else if (this.phase === 3) {
      mantleGrad.addColorStop(0, '#dc2626');
      mantleGrad.addColorStop(0.5, '#991b1b');
      mantleGrad.addColorStop(1, '#450a0a');
    } else if (this.phase === 2) {
      mantleGrad.addColorStop(0, '#f43f5e');
      mantleGrad.addColorStop(0.5, '#be123c');
      mantleGrad.addColorStop(1, '#4c0519');
    } else {
      mantleGrad.addColorStop(0, '#fb7185');
      mantleGrad.addColorStop(0.5, '#e11d48');
      mantleGrad.addColorStop(1, '#7f1d3a');
    }
    ctx.fillStyle = mantleGrad;
    ctx.beginPath();
    ctx.moveTo(cx, apexY);                                        // pointed apex
    ctx.bezierCurveTo(cx + shoulderW * 0.22, apexY + this.height * 0.12,
      cx + shoulderW * 0.78, shoulderY - this.height * 0.06,
      cx + shoulderW, shoulderY);                                 // R flank
    ctx.bezierCurveTo(cx + shoulderW * 0.80, shoulderY + this.height * 0.16,
      cx + collarW * 1.20, headY - this.height * 0.06,
      cx + collarW, headY);                                       // R collar
    // The mantle flows into a broad, forward-facing head. Its lower edge
    // overlaps the limb roots, so the face and arms read as one animal.
    ctx.bezierCurveTo(cx + collarW * 1.2, headY + this.height * 0.10,
      cx + headW * 0.9, limbRootY - this.height * 0.02,
      cx + headW * 0.5, limbRootY + this.height * 0.02);
    ctx.quadraticCurveTo(cx, limbRootY + this.height * 0.09,
      cx - headW * 0.5, limbRootY + this.height * 0.02);
    ctx.bezierCurveTo(cx - headW * 0.9, limbRootY - this.height * 0.02,
      cx - collarW * 1.2, headY + this.height * 0.10,
      cx - collarW, headY);                                       // under-head
    ctx.bezierCurveTo(cx - collarW * 1.20, headY - this.height * 0.06,
      cx - shoulderW * 0.80, shoulderY + this.height * 0.16,
      cx - shoulderW, shoulderY);                                 // L collar
    ctx.bezierCurveTo(cx - shoulderW * 0.78, shoulderY - this.height * 0.06,
      cx - shoulderW * 0.22, apexY + this.height * 0.12,
      cx, apexY);                                                 // back to apex
    ctx.closePath();
    ctx.fill();
    // Hard cut-out outline.
    ctx.strokeStyle = ink; ctx.lineWidth = 5 * power; ctx.stroke();
    // Dorsal spine ridge: the fin-ray crown along the mantle spine. A row of
    // tipped spines that rise with the swim cycle, so the beast reads as a
    // living apex instead of a smooth teardrop — a squid's mantle teeth.
    // The ridge rides the travelling ripple, so the whole spine ripples.
    const spineAmp = this.surge * 0.4 + (1 - hiddenNow) * 0.25 + this.phaseFlash * 0.4;
    for (let i = 0; i < 7; i++) {
      const k = i / 6;
      const midY = apexY + (shoulderY - apexY) * (0.22 + k * 0.52);
      const ridgeX = cx + Math.cos(this.animT * 3.3 + i) * shoulderW * 0.11 * spineAmp +
        spineOff(k * 0.55);
      const spH = (9 + (i % 3) * 2 + spineAmp * 3) * power;
      const spW = (6 + spineAmp * 2) * power;
      ctx.fillStyle = flash ? '#ffffff' : '#2b0608';
      ctx.beginPath();
      ctx.moveTo(ridgeX - spW, midY);
      ctx.lineTo(ridgeX, midY - spH);
      ctx.lineTo(ridgeX + spW, midY);
      ctx.closePath(); ctx.fill();
      ctx.strokeStyle = ink; ctx.lineWidth = 1.4 * power;
      ctx.beginPath(); ctx.arc(ridgeX, midY - spH * 0.3, 1.5 * power, 0, Math.PI * 2); ctx.stroke();
    }
    // Jet spout: a real squid vents a pressurised ink/water plume from the
    // apex to thrust. The brighter the surge, the harder the jet.
    if (this.surge > 0.45) {
      const jx = cx;
      const jy = apexY - this.height * 0.04;
      const spoutLen = this.surge * 26 * (1 + (1 - this.hideAlpha) * 0.4) * power;
      ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
      ctx.beginPath(); ctx.moveTo(jx - 4, jy); ctx.lineTo(jx - 2, jy - spoutLen);
      ctx.lineTo(jx + 2, jy - spoutLen); ctx.lineTo(jx + 4, jy); ctx.closePath(); ctx.fill();
      ctx.fillStyle = 'rgba(168, 85, 247, 0.4)';
      ctx.beginPath(); ctx.arc(jx, jy - spoutLen * 0.6, 3 + this.surge * 4 * power, 0, Math.PI * 2); ctx.fill();
    }
    // ---- Abyssal aura: the water around the beast glows ----
    // A deep violet meniscus behind the whole silhouette + a hot rim under
    // the mantle in the phase colour. This is what makes it read as a BOSS
    // and not a big fish: the sea itself reacts to it. Intensity follows
    // skillGlow + turn-beat squash + injury.
    const auraBase = hiddenNow ? 0.10 : 0.22;
    const auraHot = auraBase + this.skillGlow * 0.25 + squash * 0.3 + injury * 0.15
      + this.phaseFlash * 0.35;
    const aura = ctx.createRadialGradient(bodyCX, bodyCY, this.height * 0.2,
      bodyCX, bodyCY, this.width * 0.85 * power);
    const auraCore = this.phase === 4 ? '255, 255, 255'
      : this.phase === 3 ? '248, 113, 113'
      : this.phase === 2 ? '251, 146, 60' : '168, 85, 247';
    aura.addColorStop(0, 'rgba(' + auraCore + ', ' + Math.min(0.65, auraHot).toFixed(3) + ')');
    aura.addColorStop(0.6, 'rgba(76, 5, 25, ' + (auraHot * 0.45).toFixed(3) + ')');
    aura.addColorStop(1, 'rgba(76, 5, 25, 0)');
    ctx.fillStyle = aura;
    ctx.beginPath(); ctx.arc(bodyCX, bodyCY, this.width * 0.85 * power, 0, Math.PI * 2); ctx.fill();
    // ---- Bioluminescent rune-rings circling the mantle ----
    // Two dashed rings orbiting opposite ways, brighter with skillGlow: the
    // kraken wears its charge-up like a spell circle. Terraria-style flat
    // strokes, no gradients — they read as carved light. Rings grow with phase.
    ctx.save();
    ctx.globalAlpha = (hiddenNow ? 0.15 : 0.35) + this.skillGlow * 0.45 + this.phaseFlash * 0.3;
    for (const ring of [0, 1]) {
      const rr = this.width * (0.30 + ring * 0.09) * power;
      const rot = this.animT * (ring ? -1.1 : 0.8) + ring * 1.7;
      ctx.strokeStyle = ring ? '#fda4af' : '#e9d5ff';
      ctx.lineWidth = (ring ? 2.5 : 3.5) * power;
      ctx.setLineDash(ring ? [4, 10] : [16, 9]);
      ctx.lineDashOffset = rot * 22;
      ctx.beginPath();
      ctx.ellipse(bodyCX, bodyCY - this.height * 0.08, rr, rr * 0.42, 0, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.restore();
    ctx.globalAlpha = hiddenNow ? Math.max(0.12, this.hideAlpha) : 1;
    // Lit shoulder (a flat block of light, not a soft gradient).
    ctx.globalAlpha = ctx.globalAlpha * (flash ? 0.5 : 0.26);
    ctx.fillStyle = '#ffe4e6';
    ctx.beginPath();
    ctx.moveTo(cx - shoulderW * 0.10, apexY + this.height * 0.16);
    ctx.bezierCurveTo(cx - shoulderW * 0.45, apexY + this.height * 0.20,
      cx - shoulderW * 0.62, shoulderY - this.height * 0.02,
      cx - shoulderW * 0.50, shoulderY - this.height * 0.02);
    ctx.bezierCurveTo(cx - shoulderW * 0.30, shoulderY - this.height * 0.16,
      cx - shoulderW * 0.16, apexY + this.height * 0.30,
      cx - shoulderW * 0.10, apexY + this.height * 0.16);
    ctx.closePath(); ctx.fill();
    ctx.globalAlpha = hiddenNow ? Math.max(0.12, this.hideAlpha) : 1;
    // Dark side, quantised to the right flank for volume.
    ctx.globalAlpha = ctx.globalAlpha * 0.30;
    ctx.fillStyle = skinDark;
    ctx.beginPath();
    ctx.moveTo(cx + collarW * 0.4, headY - this.height * 0.06);
    ctx.bezierCurveTo(cx + shoulderW * 0.9, shoulderY + this.height * 0.06,
      cx + shoulderW * 0.9, shoulderY - this.height * 0.10,
      cx + shoulderW * 0.55, apexY + this.height * 0.16);
    ctx.quadraticCurveTo(cx + collarW * 0.6, headY - this.height * 0.10,
      cx + collarW * 0.4, headY - this.height * 0.06);
    ctx.closePath(); ctx.fill();
    ctx.globalAlpha = hiddenNow ? Math.max(0.12, this.hideAlpha) : 1;
    // Bumpy hide: a golden-angle scatter of small darker spots.
    // Battle damage: at high injury some spots crack into glowing embers —
    // the beast visibly falls apart as you win. Spots ride the ripple too.
    ctx.fillStyle = 'rgba(69, 10, 10, 0.45)';
    for (let i = 0; i < 22; i++) {
      const a = i * 2.399;
      const rad = Math.sqrt(i / 22);
      const kSpot = 0.18 + rad * 0.8;
      const bx2 = cx + Math.cos(a) * shoulderW * 0.72 * rad + spineOff(kSpot * 0.6);
      const by2 = apexY + (shoulderY - apexY) * kSpot;
      const cracked = injury > 0.45 && (i % 4 === 0);
      if (cracked) {
        const ember = ctx.createRadialGradient(bx2, by2, 0, bx2, by2, 7);
        ember.addColorStop(0, 'rgba(254, 240, 138, 0.95)');
        ember.addColorStop(0.5, 'rgba(249, 115, 22, 0.6)');
        ember.addColorStop(1, 'rgba(249, 115, 22, 0)');
        ctx.fillStyle = ember;
        ctx.beginPath(); ctx.arc(bx2, by2, 7, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = 'rgba(69, 10, 10, 0.45)';
      }
      ctx.beginPath(); ctx.arc(bx2, by2, 2 + (i % 3), 0, Math.PI * 2); ctx.fill();
    }

    // ====================================================================
    // 4. Terminal FINS on the apex: two tattered, ribbed wings at the very
    //    top of the mantle, exactly as a squid/giant squid wears them.
    // ====================================================================
    // Two terminal fins sweep down-and-out along the upper flanks: the wide
    // arrowhead silhouette a giant squid wears at the tip of its mantle. Drawn
    // BEHIND the mantle by placing them at the apex and letting the cone's own
    // outline sit over their roots.
    // Two low, wide fins laid flat along the upper flanks: the classic squid
    // arrowhead. They are rooted partway DOWN the mantle (never at the tip, or
    // they read as ears) and sweep outward and down, hugging the cone.
    // The two terminal fins sit about a third of the way down the mantle and
    // lie almost flat along its flanks -- low, wide, and trailing, exactly the
    // way a giant squid wears them. Rooted well below the apex so they can
    // never read as ears or horns.
    for (const side of [-1, 1]) {
      const rootX = cx + side * shoulderW * 0.42 + spineOff(0.35);
      const rootY = apexY + this.height * 0.20;
      // Fins beat with the swim: faster when moving, snapping on turn beats.
      const flap = Math.sin(t * 1.4 + (side > 0 ? 0 : Math.PI)) *
        (3 + Math.min(6, speedNow / 45)) + (squash || 0) * side * 9;
      ctx.globalAlpha = ctx.globalAlpha * (flash ? 0.92 : 0.88);
      ctx.fillStyle = flash ? '#ffffff'
        : this.phase === 3 ? '#b91c1c' : this.phase === 2 ? '#e11d48' : '#fb7185';
      ctx.beginPath();
      ctx.moveTo(rootX, rootY - 16);
      // Leading edge: out and gently down, hugging the mantle's curve.
      ctx.quadraticCurveTo(rootX + side * 40, rootY - 6 + flap,
        rootX + side * 66, rootY + 18 + flap * 0.4);
      // Trailing edge: a shallow scallop back to the flank, low.
      ctx.quadraticCurveTo(rootX + side * 52, rootY + 34, rootX + side * 28, rootY + 36);
      ctx.quadraticCurveTo(rootX + side * 12, rootY + 24, rootX, rootY + 6);
      ctx.closePath(); ctx.fill();
      ctx.strokeStyle = ink; ctx.lineWidth = 2.5; ctx.stroke();
      ctx.globalAlpha = hiddenNow ? Math.max(0.12, this.hideAlpha) : 1;
    }

    // ====================================================================
    // 5. THE EYES: two big black-rimmed orbs set into the head, with the
    //    glowing weakpoint on the right. The keystone of the whole face.
    // ====================================================================
    // The eyes are drawn INSIDE the body's own transform (sway/bob translate +
    // lean rotation already applied to `cx`), so they can never drift away from
    // the head or sit asymmetrically: both orbs share ONE centre line through
    // `cx` and ONE shared row `ey`, identical size, identical pupil, identical
    // glint. No per-eye offset of any kind.
    const ey = y + this.height * 0.60 + spineOff(0.75) * 0.5;
    // The eye pulse: a slow breathe plus a hard flash the instant a skill fires,
    // so the weakpoint telegraphs the fight's rhythm. Turn beats dilate it. When
    // the aqua lance locks on, the eye swells white-hot — the fight's loudest tell.
    const _beamCharge = this.pending && this.pending.type === 'beam'
      ? (1 - Math.max(0, this.pending.timer) / this.pending.total) : 0;
    // The eye swells with ANY charging skill, not just the aqua lance, so the
    // weakpoint always telegraphs the fight's rhythm — and the bigger the phase,
    // the hotter the flare, keeping the eye the loudest tell on the whole boss.
    const chargeGlow = (this.chargePose || 0) * (0.5 + ph * 0.25);
    const glow = 1 + Math.sin(this.animT * 5) * 0.12 + this.skillGlow * 0.6 +
      (squash || 0) * 0.4 + _beamCharge * 0.9 + chargeGlow;
    const haloColor = this.phase === 3 ? '248, 113, 113' : this.phase === 2 ? '251, 146, 60' : '253, 224, 71';
    const irisColor = this.phase === 3 ? '#f87171' : this.phase === 2 ? '#fbbf24' : '#fef08a';
    const drawEye = (px, py, s, primary) => {
      if (primary) {
        // Weakpoint glow: a flat disc of light behind the eye that blooms when
        // skills fire and tightens when the aqua lance locks on.
        const halo = ctx.createRadialGradient(px, py, 6, px, py, 40 * s * glow);
        halo.addColorStop(0, 'rgba(' + haloColor + ', 0.5)');
        halo.addColorStop(1, 'rgba(' + haloColor + ', 0)');
        ctx.fillStyle = halo;
        ctx.beginPath(); ctx.arc(px, py, 40 * s * glow, 0, Math.PI * 2); ctx.fill();
      }
      // Round socket: a disc set flush with the head, not a floating eyeball.
      ctx.fillStyle = skinDark;
      ctx.beginPath(); ctx.arc(px, py, 14 * s, 0, Math.PI * 2); ctx.fill();
      // Wet ink rim around the lid.
      ctx.strokeStyle = 'rgba(26, 3, 8, 0.8)'; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.arc(px, py, 14 * s, 0, Math.PI * 2); ctx.stroke();
      ctx.strokeStyle = ink; ctx.lineWidth = 2.5; ctx.stroke();
      // Iris: a wet disc, slightly off toward the face direction.
      const ix = px + faceDir * 2.4 * s;
      const ild = ctx.createRadialGradient(ix - 1.8 * s, py - 1.8 * s, 2 * s, ix, py, 10 * s);
      ild.addColorStop(0, irisColor);
      ild.addColorStop(1, '#0b0712');
      ctx.fillStyle = ild;
      ctx.beginPath(); ctx.arc(ix, py, 10 * s, 0, Math.PI * 2); ctx.fill();
      // Round pupil: the deep-sea hunter's mark.
      ctx.fillStyle = '#0b0712';
      ctx.beginPath(); ctx.arc(ix, py, 3 * s, 0, Math.PI * 2); ctx.fill();
      // Wet glint for a living eye.
      ctx.fillStyle = '#ffffff';
      ctx.beginPath(); ctx.arc(ix - 3.2 * s, py - 3.4 * s, 2.3 * s, 0, Math.PI * 2); ctx.fill();
      if (primary) {
        // Aqua-lance lock-on: a contracting ring around the weakpoint as it charges.
        if (_beamCharge > 0.05) {
          const ringR = 28 * s + 12 * _beamCharge;
          ctx.strokeStyle = 'rgba(255, 241, 194, ' + (0.2 + 0.55 * _beamCharge).toFixed(3) + ')';
          ctx.lineWidth = 1.5;
          ctx.setLineDash([5, 14 - 10 * _beamCharge]);
          ctx.beginPath(); ctx.arc(px, py, ringR, 0, Math.PI * 2); ctx.stroke();
          ctx.setLineDash([]);
        }
        // Corneal sheen: a crescent catchlight on the iris.
        ctx.fillStyle = 'rgba(255, 255, 255, ' + (0.3 + 0.2 * Math.sin(this.animT * 7)).toFixed(3) + ')';
        ctx.beginPath();
        ctx.ellipse(ix + 2 * s, py - 3.2 * s, 2.8 * s, 1.4 * s, 0, 0, Math.PI * 2);
        ctx.fill();
      }
    };
    const eyeSpread = this.width * 0.075;
    drawEye(cx - eyeSpread, ey + 2, 0.84, false);
    drawEye(cx + eyeSpread, ey, 1, true);

    // ====================================================================
    // 6. NO MOUTH. The kraken is a beakless, mawless abyss — its face is the
    //    twin glowing eyes and nothing else. A toothy maw read as a weird beak
    //    at boss scale and clashed with the clean mantle silhouette, so the
    //    lower face is left bare ink and the eyes carry all the expression.
    // ====================================================================

    // ====================================================================
    // 7. Ink dripping off the crown, and the wounds the boss has taken.
    // ====================================================================
    ctx.fillStyle = '#0b0212';
    for (let i = 0; i < 7; i++) {
      const dx = cx - shoulderW * 0.8 + i * (shoulderW * 1.6 / 6);
      const drip = (this.animT * 26 + i * 37) % (this.height * 0.34);
      ctx.beginPath();
      ctx.ellipse(dx, headY + drip, 3, 4 + drip * 0.05, 0, 0, Math.PI * 2);
      ctx.fill();
    }
    if (injury > 0.05) {
      ctx.save();
      ctx.shadowColor = 'rgba(248, 113, 113, 0.8)';
      ctx.shadowBlur = 8;
      ctx.strokeStyle = 'rgba(248, 113, 113, ' + Math.min(0.9, injury).toFixed(3) + ')';
      ctx.lineWidth = 3 + injury * 3;
      ctx.beginPath();
      for (let i = 0; i < 5; i++) {
        const px2 = cx - 60 + i * 30;
        const py2 = apexY + (shoulderY - apexY) * (0.25 + (i % 2) * 0.4);
        ctx.moveTo(px2, py2);
        ctx.lineTo(px2 + 9, py2 + 13);
        ctx.lineTo(px2 - 4, py2 + 24);
      }
      ctx.stroke();
      ctx.restore();
    }

    // Hit flash: whole-silhouette white, same as every other boss.
    if (this.hitFlash > 0) {
      ctx.globalAlpha = Math.min(0.6, this.hitFlash * 3);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(x - 20, y - 20, this.width + 40, this.height + 40);
      ctx.globalAlpha = 1;
    }
    ctx.restore();

    // Ink pools stain the seabed where a slammed attack landed. Drawn in world
    // space (after the body transform is popped) so they sit flat on the floor
    // and persist after the kraken dives back into the dark — a visible record
    // of every skill that landed.
    for (let i = this.inkPools.length - 1; i >= 0; i--) {
      const p = this.inkPools[i];
      const fade = 1 - p.t / p.life;
      // Rim brightens as the pool blooms, then fades to a thin scar.
      const open = 0.5 + 0.5 * Math.min(1, p.t / p.peak);
      const rNow = p.r * (0.55 + 0.45 * open) * Math.min(1, fade * 1.3);
      ctx.globalAlpha = Math.min(0.55, (0.2 + 0.35 * open) * fade);
      ctx.fillStyle = '#0b0212';
      ctx.beginPath(); ctx.arc(p.x - camera.x, p.y - camera.y, rNow, 0, Math.PI * 2); ctx.fill();
      const inner = ctx.createRadialGradient(p.x - camera.x, p.y - camera.y, 0,
        p.x - camera.x, p.y - camera.y, rNow);
      inner.addColorStop(0, 'rgba(168, 85, 247, 0.22)');
      inner.addColorStop(1, 'rgba(168, 85, 247, 0)');
      ctx.fillStyle = inner;
      ctx.beginPath(); ctx.arc(p.x - camera.x, p.y - camera.y, rNow * 0.6, 0, Math.PI * 2); ctx.fill();
    }
    if (this.inkPools.length) ctx.globalAlpha = 1;
  }
}

window.Kraken = Kraken;
// Back-compat alias: app.py's inline probe, the HTML onload probe and older
// hooks that still name the class OceanLeviathan resolve straight to Kraken.
window.OceanLeviathan = Kraken;

window.OceanFish = OceanFish;
