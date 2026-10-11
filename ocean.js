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
  // ---- The Abyssal Colosseum: a colosseum carved into the deep floor -------
  // A huge circular bowl in the abyss, with tiered stone seating curving
  // up around a central pit. The Megalodon circles in the arena floor,
  // the player stands on the seating tiers. Everything is carved from
  // dark abyssal stone, lit by bioluminescent glow and the faint
  // surface light filtering from above.
  const colosseum = (() => {
    const r = 18;                // radius in tiles (~430px)
    const tierH = 3;             // tier height in tiles (each tier climbs 3)
    const ringBand = 12;         // outer band width of seating
    const pitR = 11;             // pit (no seating, open center)
    const cols = Math.floor(r * 2);  // approx seating capacity
    // Arena centre column, in tiles. This used to be declared INSIDE the tier
    // loop below, so every use after that loop (carving the pit, the pillars,
    // the corner pillars) hit a ReferenceError and killed the whole ocean
    // world-gen — which is what made the Abyssal Planet render black/white
    // with only the UI alive. Hoisted here so all three passes agree on it.
    const cx = Math.floor(this.width * 0.5);

    // Build a ring of tiers around the center: each tier is a circular
    // bench ring that climbs up the sides of the arena pit.
    const tiers = [];
    for (let t = 0; t < 7; t++) {
      const tierR = pitR + t * tierH + 4;  // radius of this tier
      if (tierR > r) break;
      tiers.push({ t, tierR });
    }

    // Place stone seating tiles: flat-topped bench blocks carved into
    // the abyssal floor, going up in tiers around the central pit.
    const seatTiles = [];
    for (const tier of tiers) {
      for (let a = 0; a < Math.PI * 2; a += 0.12) {
        const angle = a;
        const bx = Math.round(cx + Math.cos(angle) * tier.tierR);
        const by = Math.round(seaY + 28 + (Math.sin(angle) < 0 ? -1 : 1) * tier.t);
        if (bx < 6 || bx >= this.width - 6 || by < 0 || by >= this.height - 6) continue;
        // Only fill the tier where the terrain is the deep floor
        if (this.getTile(bx, by) === TILES.STONE) {
          seatTiles.push({ x: bx, y: by });
        }
      }
    }

    // Carve the central pit (open arena floor, water falls in)
    for (let a = 0; a < Math.PI * 2; a += 0.15) {
      const angle = a;
      const bx = Math.round(cx + Math.cos(angle) * pitR);
      const by = Math.round(seaY + 28);
      if (bx < 8 || bx >= this.width - 8 || by < 0 || by >= this.height - 8) continue;
      this.setTile(bx, by, TILES.AIR);
    }

    // Add stone archways and pillars framing the arena's central cavern
    const pillars = [];
    for (let i = 0; i < 8; i++) {
      const angle = (i / 8) * Math.PI * 2;
      const px = Math.round(cx + Math.cos(angle) * (pitR + 1.5));
      const py = Math.round(seaY + 28);
      if (px < 8 || px >= this.width - 8 || py < 0 || py >= this.height - 8) continue;
      // Pillar base on the floor
      for (let dy = 0; dy < 3; dy++) {
        if (this.getTile(px, py - dy) === TILES.AIR) {
          this.setTile(px, py - dy, TILES.STONE);
        }
      }
      pillars.push({ x: px, y: py - 3 });
    }

    // Corner pillars outside the seating ring
    for (const off of [-2, 2]) {
      const angle = (Math.PI * 2) / 8 * 1 + (off > 0 ? 0 : Math.PI / 4);
      const px = Math.round(cx + Math.cos(angle) * (r + 4));
      const py = Math.round(seaY + 28 + Math.sin(angle) * 2);
      if (px < 8 || px >= this.width - 8 || py < 0 || py >= this.height - 8) continue;
      for (let dy = 0; dy < 3; dy++) {
        if (this.getTile(px, py - dy) === TILES.AIR) {
          this.setTile(px, py - dy, TILES.STONE);
        }
      }
      pillars.push({ x: px, y: py - 3 });
    }

    return {
      seaY,
      floorY,
      portalX,
      arenaR: r * TILE_SIZE,            // arena radius in pixels
      arenaCX: cx * TILE_SIZE,           // center X in pixels
      arenaCY: (seaY + 28) * TILE_SIZE,  // center Y in pixels
      seatTiles,
      pillars,
      tiers,
      islands,
      shipwrecks: this.shipwrecks,
      spawnX: (spawnIsland ? spawnIsland.cx : Math.floor(this.width * 0.34)) * TILE_SIZE,
      spawnY: (Math.max(2, groundHeight[spawnIsland ? spawnIsland.cx : Math.floor(this.width * 0.34)] - 2)) * TILE_SIZE,
      bossX: Math.max(6, Math.min(this.width - 7, bossX)) * TILE_SIZE,
      bossY: Math.max(2, seaY - 3) * TILE_SIZE
    };
  })();

  this.oceanArena = colosseum;
  this.underworldStart = this.height + 1000;
  this.underworld = null;
  this.dungeon = null;
  this.landmarks = [];
  this.lightSources = [];
  this._tileCache = null;
  this._tileCacheDirty = true;
  this._spaceBgCache = null;
  return colosseum;
};

/**
 * Render the Abyssal Colosseum: a colosseum carved into the deep floor,
 * with tiered stone seating curving around a central pit.
 * Uses 3D-looking depth, sheen, and bioluminescent lighting.
 */
World.prototype.renderColosseum = function(ctx, camera, time) {
  const arena = this.oceanArena;
  if (!arena || !arena.arenaCX) return;

  const px = arena.arenaCX;
  const py = arena.arenaCY;
  const r = arena.arenaR / TILE_SIZE;
  const ringR = r - 2;

  // Lighting
  const sTime = time * 0.8;
  const sunGlow = 0.25 + 0.15 * Math.sin(sTime);
  const biolum = 0.5 + 0.3 * Math.sin(sTime * 1.3);

  const stoneBase = 'rgba(24, 35, 48, 1)';
  const stoneTop = 'rgba(38, 52, 70, 1)';
  const stoneLight = 'rgba(58, 77, 100, 1)';
  const seatDark = 'rgba(18, 28, 40, 1)';
  const seatLight = 'rgba(42, 62, 88, 1)';

  ctx.save();
  ctx.globalCompositeOperation = 'source-over';

  // Deep floor around the colosseum
  ctx.fillStyle = 'rgba(4, 12, 22, 1)';
  ctx.beginPath();
  ctx.ellipse(px, py, r * TILE_SIZE * 1.6, r * TILE_SIZE * 0.8, 0, 0, Math.PI * 2);
  ctx.fill();

  // Outer seating ring (tiers carved into the abyss)
  for (let t = 0; t < 7; t++) {
    const tierR = ringR - 1.5 - t * 2.8;
    if (tierR < 8) break;
    const yOff = t * 3 + 3;
    const tierColor = t === 0 ? seatDark : t < 3 ? seatLight : 'rgba(28, 42, 62, 1)';
    for (let a = 0; a < Math.PI * 2; a += 0.1) {
      const bx = px + Math.cos(a) * tierR;
      const by = py + Math.sin(a) * tierR - yOff;
      const w = 1.8 + (Math.sin(a * 3 + t) * 0.3);
      const h = 1.8 + t * 0.25;

      if (Math.abs(bx - px) > r * 0.5) continue;
      if (Math.abs(by - py) > r * 1.2) continue;

      ctx.fillStyle = tierColor;
      ctx.fillRect(bx - w / 2, by - h / 2, w, h);

      ctx.fillStyle = 'rgba(60, 80, 110, 0.15)';
      ctx.fillRect(bx - w / 2, by - h / 2 - 1, w, 1.5);

      ctx.fillStyle = 'rgba(8, 14, 24, 0.5)';
      ctx.fillRect(bx - w / 2, by + h / 2 - 1, w, 1);
    }
  }

  // Solid stone pillars framing the arena
  if (arena.pillars) {
    for (const p of arena.pillars) {
      const pxl = p.x * TILE_SIZE - camera.x;
      const pyl = p.y * TILE_SIZE - camera.y;
      const ph = 8;

      ctx.fillStyle = 'rgba(40, 55, 78, 0.85)';
      ctx.fillRect(pxl - 3, pyl - ph, 6, ph);

      ctx.fillStyle = 'rgba(58, 77, 100, 0.9)';
      ctx.fillRect(pxl - 4, pyl - ph - 3, 8, 3);

      ctx.fillStyle = 'rgba(100, 180, 255, 0.08)';
      ctx.fillRect(pxl - 4, pyl - ph - 3, 8, 1.5);
    }
  }

  // Central pit: the open arena floor with water falling in
  const pitR = r - 6;
  if (pitR > 4) {
    ctx.fillStyle = 'rgba(3, 8, 18, 1)';
    ctx.beginPath();
    ctx.ellipse(px, py, pitR * TILE_SIZE, pitR * TILE_SIZE * 0.6, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.globalAlpha = 0.4 + 0.3 * Math.sin(sTime * 2);
    ctx.fillStyle = 'rgba(56, 189, 248, 0.25)';
    for (let i = 0; i < 12; i++) {
      const a = (i / 12) * Math.PI * 2 + sTime * 0.3;
      const dist = 20 + Math.sin(sTime + i) * 8;
      const fx = px + Math.cos(a) * dist;
      const fy = py + Math.sin(a) * dist * 0.6;
      const sz = 2 + Math.sin(sTime * 3 + i) * 1.5;
      ctx.fillRect(fx - sz / 2, fy - sz / 2, sz, sz);
    }
    ctx.globalAlpha = 1;
  }

  // Stone archways at the four cardinal points of the arena
  for (const side of [-1, 1]) {
    for (const ord of [-1, 1]) {
      const angle = Math.atan2(ord, side) - Math.PI / 4;
      const pxl = px + Math.cos(angle) * (r - 4) * TILE_SIZE;
      const pyl = py + Math.sin(angle) * (r - 4) * TILE_SIZE;

      const archW = 10 + Math.sin(time * 0.8 + side * ord) * 2;
      ctx.fillStyle = 'rgba(20, 30, 45, 0.85)';
      ctx.fillRect(pxl - archW / 2, pyl - 6, archW, 12);

      ctx.fillStyle = 'rgba(58, 77, 100, 0.8)';
      ctx.fillRect(pxl - 2, pyl - 7, 4, 3);

      ctx.strokeStyle = `rgba(100, 180, 255, ${0.08 + 0.06 * Math.sin(sTime + side * 2)})`;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.ellipse(pxl, pyl, 8, 4, 0, 0, Math.PI * 2);
      ctx.stroke();
    }
  }

  // Arena floor edge: a raised rim of stone around the outer pit
  for (let x = -1; x <= 1; x += 2) {
    for (let y = -1; y <= 1; y += 2) {
      const rx = px + x * pitR * TILE_SIZE;
      const ry = py + y * pitR * TILE_SIZE * 0.6;
      if (Math.abs(rx - px) > r * TILE_SIZE * 0.7) continue;

      ctx.fillStyle = 'rgba(32, 48, 66, 0.9)';
      const rimW = 3 + Math.sin(time * 0.5 + x * y) * 1;
      ctx.fillRect(rx - rimW / 2, ry - 2, rimW, 4);

      ctx.fillStyle = 'rgba(70, 95, 125, 0.12)';
      ctx.fillRect(rx - rimW / 2, ry - 2, rimW, 2);
    }
  }

  // Bioluminescent floor glow in the central pit
  const glowR = pitR * TILE_SIZE + 20;
  const grad = ctx.createRadialGradient(px, py, 0, px, py, glowR);
  grad.addColorStop(0, `rgba(80, 160, 255, ${0.06 * biolum})`);
  grad.addColorStop(0.4, `rgba(40, 100, 200, ${0.03 * biolum})`);
  grad.addColorStop(1, `rgba(10, 30, 60, 0)`);
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.ellipse(px, py, glowR / TILE_SIZE, glowR / TILE_SIZE * 0.6, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
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

// THE MEGALODON — the ancient apex predator of the drowned colosseum.
// ============================================================================
// No magic, no ink: just a mile of scarred muscle, a mouth like a bear trap,
// and a speed nothing that big should have. Three phases:
//   1. THE ANCIENT PREDATOR (100-65%) — circles, charges, punishes greed.
//      Gimmick: the longer you tread water, the more aggressive it gets.
//   2. BLOOD FRENZY (65-30%) — cracked hide, burning eyes, chained dashes,
//      whirlpool spins and tooth volleys. Gimmick: turbulent currents drag
//      you off your footing — dodge, don't outrun.
//   3. APEX OF THE ANCIENT SEA (30-0%) — vanishing execution charges,
//      depth-erupting leaps, suction bites and the Extinction Hunt combo,
//      which leaves it EXHAUSTED: a real damage window for anyone who
//      survives the whole chain.
// The combat surface (headTargets / takeDamage / update / render /
// renderTelegraph / overlapsPlayer / touchDamage) matches the old Kraken
// exactly, so the game loop, boss panel, save-HP banking and every QA hook
// keep working untouched. `kind` stays 'kraken' for save compatibility.
class Megalodon {
  constructor(x, y, game) {
    this.kind = 'kraken';
    this.name = 'MEGALODON · THE ANCIENT PREDATOR';
    this.x = x;
    this.y = y;
    // A long torpedo body, not a tall mantle: 420x200 reads as "shark" at
    // every zoom and leaves the jaws the biggest single feature.
    this.width = 420;
    this.height = 200;
    this.maxHp = 180000;
    this.hp = 180000;
    this.phase = 1;
    this.dead = false;
    this.game = game;
    this.lightRadius = 300;
    this.glowRadius = 160;
    this.lightColor = [110, 170, 220];
    this.animT = 0;
    this.attackTimer = 2.6;
    /** Armed telegraphed skill: { type, x, y, radius, timer, total, ... } */
    this.pending = null;
    this.hitFlash = 0;

    // ---- Whole-body motion (same field set the old leviathan used, so the
    // render springs and the QA harness stay valid) -----------------------
    this.vx = 0;
    this.vy = 0;
    this.bob = 0;
    this.sway = 0;
    this.lean = 0;
    this.surge = 0;
    this.faceDir = -1;        // sharks lead with the nose; hunt left-ward at spawn
    this.pitch = 0;
    this.skew = 0;
    this.pulse = 0;
    this.pulseCd = 0;
    this.squash = 0;
    this.squashV = 0;
    this.recoil = 0;
    this.recoilV = 0;
    this.lunge = 0;
    this.breath = 1;
    this.swimPhase = 0;

    // ---- Shark-specific state -------------------------------------------
    this.jawOpen = 0;         // 0 closed .. 1 unhinged
    this.jawTarget = 0;
    this.tailSwing = 0;       // caudal sweep, driven by speed + swim cycle
    this.circleAng = Math.random() * Math.PI * 2;
    this.circleDir = Math.random() < 0.5 ? -1 : 1;
    this.circleBurst = 0;     // hunting-circle acceleration window
    this.dash = null;         // active charge: { vx, vy, t, dmg, kind, hit }
    this.rushLeft = 0;        // frenzy-rush combo counter
    this.vanishT = 0;         // apex execution: submerged ghost before the hit
    this.apexLane = null;     // { x0, y0, x1, y1 } warning stripe
    this.depthDive = 0;       // depth-charge: seconds until it erupts
    this.tornadoT = 0;        // sharknado spin timer
    this.suctionT = 0;        // devouring maw pull timer
    this.hunt = null;         // extinction-hunt step scheduler
    this.exhaustT = 0;        // post-hunt damage window
    this.frenzy = 0;          // feeding-frenzy stacks (phase 2+)
    this.frenzyT = 0;
    this.waterT = 0;          // seconds the player has been treading water
    this.currentT = 5;        // phase-2 turbulent-current pulse timer
    this.currentPull = 0;     // seconds left of the current's drag on you
    this.skillGlow = 0;
    this.phaseFlash = 0;
    /** Blood-cloud stains left on the arena floor by slammed attacks. */
    this.stainPools = [];
  }

  /**
   * Hittable points along the horizontal body: the eye/jaw (weakpoint,
   * `eye: true`) at the nose, and three armoured flank/tail nodes
   * (`body: true`). The nodes track the live swim offsets so a hit that
   * visually connects always actually lands.
   */
  headTargets() {
    const cx = this.x + this.width * 0.5 + this.sway;
    const cy = this.y + this.height * 0.5 + this.bob;
    const f = this.faceDir || 1;
    const jaw = this.jawOpen * 18;
    return [
      // The eye, just above the jaw hinge — aim here.
      { x: cx + f * this.width * 0.31, y: cy - this.height * 0.16 + jaw * 0.3,
        r: 26, head: true, eye: true, index: 0 },
      // Shoulder / gill mass behind the head.
      { x: cx + f * this.width * 0.10, y: cy - this.height * 0.04,
        r: 46, body: true, index: 1 },
      // Mid-flank.
      { x: cx - f * this.width * 0.13, y: cy + this.height * 0.02,
        r: 48, body: true, index: 2 },
      // Caudal peduncle — still armoured, but you must reach past the tail.
      { x: cx - f * this.width * 0.33, y: cy + this.height * 0.04
          + this.tailSwing * 0.25, r: 40, body: true, index: 3 }
    ];
  }


  takeDamage(amount, sound, particles, critical = false) {
    if (this.dead) return 0;
    const damage = Math.max(1, Math.round(amount));
    this.hp = Math.max(0, this.hp - damage);
    this.hitFlash = 0.2;
    if (sound) sound.playHit();
    if (particles) {
      particles.addDamageText(this.x + this.width / 2, this.y, damage,
        critical ? '#fef08a' : '#bae6fd', critical);
      // Blood spray in the water, not violet magic.
      particles.bloodBurst(this.x + this.width / 2, this.y + this.height / 2, 5);
    }
    // Three phases: the thresholds sit where the gimmicks take over.
    const phase = this.hp <= this.maxHp * 0.30 ? 3
      : this.hp <= this.maxHp * 0.65 ? 2 : 1;
    if (phase > this.phase) {
      this.phase = phase;
      this.name = phase === 3 ? 'MEGALODON · APEX OF THE ANCIENT SEA'
        : phase === 2 ? 'MEGALODON · BLOOD FRENZY'
          : 'MEGALODON · THE ANCIENT PREDATOR';
      if (sound) sound.playBossRoar();
      if (this.game && this.game.feel) this.game.feel.shake(1.1);
      // A phase step is a story beat: it rears, the scars split open, and
      // the whole silhouette flares.
      this.phaseFlash = 1.7;
      this.skillGlow = Math.max(this.skillGlow || 0, 1.3);
      // Blood Frenzy opens with a live feeding-frenzy stack already running.
      if (phase >= 2) { this.frenzy = Math.max(this.frenzy, 1); this.frenzyT = 8; }
      // Apex phase begins with a roar that hangs it in the water for a beat.
      if (phase === 3) { this.jawTarget = 1; this.attackTimer = Math.max(this.attackTimer, 1.6); }
    }
    if (this.hp <= 0) {
      this.dead = true;
      if (sound) sound.playExplosion();
      if (particles) {
        particles.bloodBurst(this.x + this.width / 2, this.y + this.height / 2, 60);
        particles.magicSparkle(this.x + this.width / 2, this.y, '#7dd3fc', 80);
      }
    }
    return damage;
  }

  overlapsPlayer(player) {
    // A vanished megalodon (apex execution) is a ghost in the water: it
    // cannot body-check you — the lane charge does the hurting.
    if (this.vanishT > 0) return false;
    const cx = this.x + this.width / 2 + this.sway;
    const cy = this.y + this.height / 2 + this.bob;
    // The body is long but slim: the hitbox hugs the torso, not the fins.
    return Math.abs(player.x + player.width / 2 - cx) < (player.width + this.width * 0.82) / 2 &&
      Math.abs(player.y + player.height / 2 - cy) < (player.height + this.height * 0.66) / 2;
  }

  touchDamage() {
    if (this.vanishT > 0) return 0;
    const base = [0, 42, 60, 82][this.phase] || 42;
    // Feeding frenzy makes every bump hurt more.
    return Math.round(base * (1 + this.frenzy * 0.06));
  }

  /** Seconds of aggression pressure built from the player treading water. */
  waterAggression() {
    if (this.phase !== 1) return 1.35; // later phases never let the pressure off
    return 1 + Math.min(1, this.waterT / 25) * 0.7;
  }

  /** Start a straight-line charge. The dash is the Megalodon's whole game. */
  startDash(vx, vy, dur, dmg, kind) {
    this.dash = { vx, vy, t: dur, dur, dmg, kind, hit: false };
    this.jawTarget = kind === 'maw' ? 1 : 0.55;
    this.pulse = 1;
    this.surge = 1;
  }

  /** Blood-cloud stain on the arena floor where a heavy attack slammed down. */
  addStain(x, y, r) {
    this.stainPools.push({ x, y, r, t: 0, life: 7 + this.phase * 2, peak: 0.5 });
    // Cap the record so a long fight cannot grow the array forever.
    if (this.stainPools.length > 24) this.stainPools.shift();
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
    // The eye is the whole fight: it eats 1.4x. The armoured flank shrugs
    // off a third (0.65x). And while it hangs exhausted after the Extinction
    // Hunt, everything lands 1.5x harder — the reward for surviving the combo.
    const mult = target && target.eye ? 1.4 : target && target.body ? 0.65 : 1;
    const exhaust = this.exhaustT > 0 ? 1.5 : 1;
    return Math.max(1, Math.round(damage * mult * exhaust));
  }

  update(dt, target, projectiles, sound, particles) {
    this.animT += dt;
    this.hitFlash = Math.max(0, this.hitFlash - dt);
    this.skillGlow = Math.max(0, this.skillGlow - dt * 2);
    this.phaseFlash = Math.max(0, this.phaseFlash - dt * 1.2);
    this.exhaustT = Math.max(0, this.exhaustT - dt);
    this.vanishT = Math.max(0, this.vanishT - dt);
    this.circleBurst = Math.max(0, this.circleBurst - dt);
    this.tornadoT = Math.max(0, this.tornadoT - dt);
    this.depthDive = Math.max(0, this.depthDive - dt);
    if (this.exhaustT > 0) this.jawTarget = 0.6; else this.jawTarget *= Math.pow(0.05, dt);

    const ph = this.phase;
    // Phase ladders: 1.0 -> 2.1 speed, 1.0 -> 2.3 damage, 1.0 -> 1.9 rate.
    const power = 1 + (ph - 1) * 0.55;
    const dmgMul = 1 + (ph - 1) * 0.65;
    const atkMul = (1 + (ph - 1) * 0.45) * this.waterAggression();

    // ---- Feeding frenzy: landing hits makes it faster and meaner ---------
    if (this.frenzyT > 0) {
      this.frenzyT -= dt;
      if (this.frenzyT <= 0) { this.frenzy = Math.max(0, this.frenzy - 1); this.frenzyT = this.frenzy > 0 ? 6 : 0; }
    }
    const frenzyMul = 1 + this.frenzy * 0.08;

    // ---- Phase 1 gimmick: the water-logged player feeds its aggression ---
    // While you tread water (below the surface), the hunt pressure climbs;
    // get to the arena floor or the surface and it eases off.
    if (target && !this.dead) {
      const world = this.game && this.game.world;
      const seaY = (world && world.oceanArena ? world.oceanArena.seaY : 12) * TILE_SIZE;
      const pcy = target.y + target.height / 2;
      if (pcy > seaY + TILE_SIZE * 2) this.waterT = Math.min(25, this.waterT + dt);
      else this.waterT = Math.max(0, this.waterT - dt * 2);
    }

    // ---- Phase 2 gimmick: turbulent currents -----------------------------
    // Periodic sideways surges drag you toward the Megalodon's side of the
    // arena. The water itself is fighting you; footwork beats top speed.
    if (ph >= 2 && !this.dead) {
      this.currentT -= dt * (ph === 3 ? 1.4 : 1);
      if (this.currentT <= 0) {
        this.currentT = 5 + Math.random() * 3;
        this.currentPull = 1.6;
        if (this.game && this.game.feel) this.game.feel.shake(0.25);
        if (sound) sound.playBossLaser();
      }
      if (this.currentPull > 0) {
        this.currentPull -= dt;
        if (target) {
          const dx = (this.x + this.width / 2) - (target.x + target.width / 2);
          const dy = (this.y + this.height / 2) - (target.y + target.height / 2);
          const d = Math.hypot(dx, dy) || 1;
          const pull = 95 * dt * power;
          target.x += (dx / d) * pull;
          target.y += (dy / d) * pull * 0.6;
        }
      }
    }

    // ---- Extinction Hunt scheduler (phase 3 combo) -----------------------
    // A chain of dashes, a tail sweep, then one final bite — and when the
    // chain finishes the beast hangs spent in the water: EXHAUSTED.
    if (this.hunt) {
      this.hunt.t += dt;
      for (const step of this.hunt.steps) {
        if (!step.done && this.hunt.t >= step.at) {
          step.done = true;
          if (step.act === 'dash') {
            const a = Math.atan2(
              (target ? target.y + target.height / 2 : this.y) - (this.y + this.height / 2),
              (target ? target.x + target.width / 2 : this.x) - (this.x + this.width / 2));
            this.startDash(Math.cos(a) * 1500 * power, Math.sin(a) * 1500 * power,
              0.5, (120 + ph * 30) * dmgMul, 'hunt_dash');
            if (sound) sound.playBossRoar();
          } else if (step.act === 'sweep') {
            this.pending = {
              type: 'tail_sweep', x: this.x + this.width * 0.5, y: this.y + this.height * 0.5,
              radius: 260 * power, angle: this.faceDir > 0 ? 0 : Math.PI,
              timer: 0.35, total: 0.35
            };
          } else if (step.act === 'bite') {
            this.pending = {
              type: 'extinction_bite', x: this.x + this.width * 0.5, y: this.y + this.height * 0.5,
              radius: 200 * power, timer: 0.45, total: 0.45,
              target: { x: target ? target.x : this.x, y: target ? target.y : this.y }
            };
          }
        }
      }
      if (this.hunt.t >= this.hunt.dur && !this.pending && !this.dash) {
        this.hunt = null;
        // The damage window: it hangs, jaws slack, gills fluttering.
        this.exhaustT = 3.4;
        this.jawTarget = 0.65;
        this.vx *= 0.1; this.vy *= 0.1;
        if (sound) sound.playBossRoar();
        if (particles) {
          particles.addParticle(this.x + this.width / 2, this.y + this.height * 0.3,
            0, -2, 'rgba(255, 255, 255, 0.55)', 3, 1.6, -0.02, true);
        }
      }
    }

    // ---- Frenzy-rush chaining (phase 2): three dashes, alternating sides -
    if (this.rushLeft > 0 && !this.pending && !this.dash && !this.hunt) {
      this.rushLeft--;
      const pcx = target ? target.x + target.width / 2 : this.x;
      const pcy = target ? target.y + target.height / 2 : this.y;
      // Come in from above/below alternately so you must switch your dodge.
      const side = this.rushLeft % 2 === 0 ? -1 : 1;
      const fromX = pcx + side * 520 * power;
      const fromY = pcy + side * -160;
      this.x = Math.max(this.x - 600, Math.min(this.x + 600, fromX - this.width / 2));
      this.y = Math.max(this.y - 300, Math.min(this.y + 300, fromY - this.height / 2));
      const a = Math.atan2(pcy - (this.y + this.height / 2), pcx - (this.x + this.width / 2));
      this.faceDir = Math.cos(a) >= 0 ? 1 : -1;
      this.startDash(Math.cos(a) * 1400 * power, Math.sin(a) * 1400 * power,
        0.45, (95 + ph * 25) * dmgMul, 'frenzy');
      if (sound) sound.playHit();
    }


    // ---- Movement: dash > spin > circle > exhausted ----------------------
    const pvxBefore = this.vx || 0;
    if (!this.dead) {
      if (this.dash) {
        // Full commitment: the charge travels in a straight, unstoppable line.
        const d = this.dash;
        d.t -= dt;
        this.x += d.vx * dt;
        this.y += d.vy * dt;
        this.faceDir = d.vx >= 0 ? 1 : -1;
        this.pitch = Math.max(-0.5, Math.min(0.5, d.vy / 1400));
        // Water spray off the flanks while it charges.
        if (particles && Math.random() < 0.55) {
          particles.addParticle(this.x + this.width * 0.5 - this.faceDir * this.width * 0.3,
            this.y + this.height * 0.5,
            -d.vx * 0.05 + (Math.random() - 0.5) * 3, (Math.random() - 0.5) * 3,
            'rgba(186, 230, 253, 0.5)', 2.6, 0.4, 0, true);
        }
        // One bite per charge: contact while the jaws are open.
        if (!d.hit && this.jawOpen > 0.3 && target && this.overlapsPlayer(target)) {
          d.hit = true;
          this.game.damagePlayer(Math.round(d.dmg), this.x + this.width / 2,
            'The Megalodon’s jaws closed around you!', true, this.y + this.height / 2);
          this.frenzy = Math.min(6, this.frenzy + 1);
          this.frenzyT = 6;
          if (this.game && this.game.feel) this.game.feel.shake(0.8);
          if (sound) sound.playHit();
        }
        if (d.t <= 0) {
          this.dash = null;
          this.recoilV += 7;
          // The charge ends in a hard turn back toward the hunt.
          this.circleDir *= -1;
        }
      } else if (this.tornadoT > 0) {
        // SHARKNADO: spin in place, hauling the player toward the teeth.
        const pcx = target ? target.x + target.width / 2 : this.x;
        const pcy = target ? target.y + target.height / 2 : this.y;
        this.y += Math.sin(this.animT * 6) * 120 * dt;
        if (target) {
          const dx = pcx - (this.x + this.width / 2);
          const dy = pcy - (this.y + this.height / 2);
          const dist = Math.hypot(dx, dy) || 1;
          if (dist < 560) {
            const pull = 320 * dt * power;
            target.x += (dx / dist) * pull;
            target.y += (dy / dist) * pull * 0.75;
          }
          // Grazing the vortex hurts on a cooldown, not every frame.
          this._spinTick = (this._spinTick || 0) + dt;
          if (dist < 150 * power && this._spinTick > 0.7) {
            this._spinTick = 0;
            this.game.damagePlayer(Math.round((70 + ph * 20) * dmgMul), this.x + this.width / 2,
              'The current dragged you into the Megalodon’s spin!', true, this.y + this.height / 2);
            this.frenzy = Math.min(6, this.frenzy + 1);
            this.frenzyT = 6;
          }
        }
        if (particles && Math.random() < 0.8) {
          const a = this.animT * 9;
          particles.addParticle(this.x + this.width / 2 + Math.cos(a) * 130,
            this.y + this.height / 2 + Math.sin(a) * 70,
            -Math.sin(a) * 26, Math.cos(a) * 14,
            'rgba(125, 211, 252, 0.5)', 3, 0.5, 0, true);
        }
      } else if (this.depthDive > 0) {

        // DEPTH CHARGE: it sinks under you, invisible, then erupts upward.
        if (target) {
          const gx = target.x + target.width / 2 - this.width / 2;
          const gy = target.y + target.height / 2 + 300;
          this.x += (gx - this.x) * Math.min(1, dt * 6);
          this.y += (gy - this.y) * Math.min(1, dt * 6);
        }
        if (this.depthDive <= dt + 0.001) {
          // Erupt! Straight up through the player's column.
          this.startDash(0, -2100 * power, 0.55, (130 + ph * 32) * dmgMul, 'erupt');
          this.jawTarget = 1;
          this.addStain(this.x + this.width / 2, this.y + this.height, 90 * power);
          this.skillFX(particles, this.x + this.width / 2, this.y + this.height * 0.4, 'erupt', {});
          if (this.game && this.game.feel) this.game.feel.shake(1.0);
          if (sound) sound.playExplosion();
        }
      } else if (this.exhaustT > 0) {
        // EXHAUSTED: it hangs in the water, trembling, gills fluttering.
        this.x += Math.sin(this.animT * 2.3) * 30 * dt;
        this.y += Math.cos(this.animT * 1.9) * 24 * dt;
        if (particles && Math.random() < 0.25) {
          particles.addParticle(this.x + this.width * 0.5 + (Math.random() - 0.5) * this.width * 0.5,
            this.y + this.height * 0.3, 0, -1.5,
            'rgba(255, 255, 255, 0.4)', 2, 1.2, -0.01, true);
        }
      } else {
        // THE HUNTING CIRCLE: it stalks a lazy orbit around you, then the
        // burst flag flips the orbit direction and launches a charge.
        const pcx = target ? target.x + target.width / 2 : this.x + this.width / 2;
        const ccx = this.x + this.width / 2;
        // Orbit speed climbs with phase and the water-pressure gimmick.
        this.circleAng += this.circleDir * (0.55 + ph * 0.12) * atkMul * frenzyMul * dt;
        const radius = (330 - ph * 26) * (this.circleBurst > 0 ? 0.55 : 1);
        const goalX = pcx + Math.cos(this.circleAng) * radius;
        const goalY = (target ? target.y + target.height / 2 : this.y) +
          Math.sin(this.circleAng) * radius * 0.45 - 10;
        const dx = goalX - ccx;
        const dy = goalY - (this.y + this.height / 2);
        const dist = Math.hypot(dx, dy) || 1;
        const maxSpeed = (300 + ph * 80) * power * frenzyMul * (this.circleBurst > 0 ? 2.2 : 1);
        const arrive = Math.min(1, dist / 140);
        const pvx = this.vx || 0;
        this.vx = (this.vx || 0) + (dx / dist) * maxSpeed * arrive * dt * 3.2;
        this.vy = (this.vy || 0) + (dy / dist) * maxSpeed * arrive * dt * 3.2;
        const drag = Math.pow(0.06, dt);
        this.vx *= drag;
        this.vy *= drag;
        this.x += this.vx * dt;
        this.y += this.vy * dt;
        // Faces the player between bursts; faces the charge during one.
        if (Math.abs(pcx - ccx) > 14) this.faceDir = pcx >= ccx ? 1 : -1;
        this.pitch = Math.max(-0.4, Math.min(0.4, (this.vy || 0) / 900));
      }
    }

    // ---- Arena bounds: it lives in the colosseum bowl, water or no water --
    if (this.game && this.game.world) {
      const world = this.game.world;
      const seaTop = (world.oceanArena ? world.oceanArena.seaY : 12) * TILE_SIZE;
      this.x = Math.max(TILE_SIZE, Math.min(world.pixelWidth - this.width - TILE_SIZE, this.x));
      this.y = Math.max(seaTop - this.height * 0.18,
        Math.min((world.pixelHeight || world.height * TILE_SIZE) - this.height * 1.1, this.y));
    }

    // ---- Whole-body motion springs --------------------------------------
    const speedNow = Math.hypot(this.vx || 0, this.vy || 0);
    const breathRate = (1.2 + ph * 0.14) * atkMul;
    this.bob = Math.sin(this.animT * breathRate) * (8 + ph * 2) * power
      + Math.sin(this.animT * 2.7 + 1.3) * 3 * power;
    this.sway = Math.cos(this.animT * breathRate * 0.7) * (10 + ph * 3) * power;
    this.lean = (this.lean || 0) + (((this.vx || 0) / 900) - (this.lean || 0)) * Math.min(1, dt * 4);
    this.skew = Math.max(-0.3, Math.min(0.3,
      ((this.vx || 0) - pvxBefore) * 0.0006 + (this.skew || 0) * Math.pow(0.02, dt)));
    this.pulse = Math.max(0, (this.pulse || 0) - dt * 2.2);
    this.pulseCd = Math.max(0, (this.pulseCd || 0) - dt);
    if (speedNow > 500 && (this.pulseCd || 0) <= 0) { this.pulse = 1; this.pulseCd = 0.8; }
    // Squash spring: charges compress the body, the recoil releases it.
    let chargePose = 0;
    if (this.pending && this.pending.total) {
      chargePose = 1 - Math.max(0, this.pending.timer) / this.pending.total;
      chargePose = chargePose * chargePose;
    }
    this.recoil = this.recoil || 0;
    this.recoilV = this.recoilV || 0;
    this.recoilV += ((0 - this.recoil) * 90 - this.recoilV * 9) * dt;
    this.recoil += this.recoilV * dt;
    const squashTarget = (this.pulse || 0) * 0.4 + (this.dash ? 0.35 : 0)
      + chargePose * 0.3 - this.recoil * 0.4;
    this.squashV += ((squashTarget - this.squash) * 26 - this.squashV * 7) * dt;
    this.squash += this.squashV * dt;
    this.lunge = chargePose * 0.5 - this.recoil * 0.9;
    this.breath = 1 + Math.sin(this.animT * breathRate * 0.5) * 0.03;
    this.swimPhase = (this.swimPhase || 0) + dt * (3 + ph * 0.5 + Math.min(3, speedNow / 220));
    const surgeTarget = Math.min(1, speedNow / 700) * 0.9 + (this.dash ? 0.6 : 0.05);
    this.surge += (surgeTarget - this.surge) * Math.min(1, dt * 4);
    // Tail sweeps hardest when swimming or spinning.
    const tailRate = 2.4 + (this.dash ? 7 : this.tornadoT > 0 ? 10 : 0) + ph * 0.4;
    this.tailSwing = Math.sin(this.swimPhase * tailRate * 0.45) * (14 + speedNow * 0.03);
    // Jaws ease toward their target gape.
    this.jawOpen += (this.jawTarget - this.jawOpen) * Math.min(1, dt * 7);

    // ---- Stain decay ------------------------------------------------------
    for (let i = this.stainPools.length - 1; i >= 0; i--) {
      const s = this.stainPools[i];
      s.t += dt;
      if (s.t > s.life) this.stainPools.splice(i, 1);
    }


    // ---- Wind up the armed telegraph; it resolves through resolvePending --
    if (this.pending) {
      this.pending.timer -= dt;
      // DEVOURING MAW: the windup IS the suction — the water (and you) pour
      // into the gape before the bite lands.
      if (this.pending.type === 'devouring_maw' && target) {
        const dx = (this.pending.x) - (target.x + target.width / 2);
        const dy = (this.pending.y) - (target.y + target.height / 2);
        const d = Math.hypot(dx, dy) || 1;
        if (d < this.pending.radius * 1.3 && d > 6) {
          const pull = 430 * dt * power;
          target.x += (dx / d) * pull;
          target.y += (dy / d) * pull * 0.7;
        }
        this.jawTarget = 1;
      }
      if (this.pending.timer <= 0) this.resolvePending(sound, particles);
    }
    // Apex warning lane burns down while it charges.
    if (this.apexLane) {
      this.apexLane.t = Math.max(0, (this.apexLane.t || 0) - dt);
      if (this.apexLane.t <= 0 && (!this.pending || this.pending.type !== 'apex_execution')) {
        this.apexLane = null;
      }
    }

    // ---- The hunt picks its next skill ------------------------------------
    // No attacks while exhausted (that IS the damage window), while a combo
    // chain is running, or while a dash already has the wheel.
    this.attackTimer -= dt * atkMul * frenzyMul;
    if (this.attackTimer <= 0 && target && !this.pending && !this.dash &&
        !this.hunt && this.exhaustT <= 0 && this.vanishT <= 0 &&
        this.tornadoT <= 0 && this.depthDive <= 0 && this.rushLeft === 0) {
      const px = target.x + target.width / 2;
      const py = target.y + target.height / 2;
      const roll = Math.random();
      if (ph === 1) {
        // ---- PHASE 1: the ancient predator. Telegraphed, readable, cruel.
        if (roll < 0.30) {
          // PREDATOR DASH: a short tell, then a straight high-speed charge.
          this.pending = {
            type: 'predator_dash', x: px, y: py, radius: 60,
            timer: 0.65, total: 0.65,
            target: { x: px, y: py }
          };
        } else if (roll < 0.55) {
          // CRUSHING BITE: jaws flare open, then a short lunge with the maw.
          this.pending = {
            type: 'crushing_bite', x: this.x + this.width * 0.5, y: this.y + this.height * 0.5,
            radius: 170 * power, timer: 0.7, total: 0.7,
            angle: Math.atan2(py - (this.y + this.height / 2), px - (this.x + this.width * 0.5)),
            target: { x: px, y: py }
          };
        } else if (roll < 0.78) {
          // TAIL SWEEP: the caudal fin scythes a wide arc; knockback heavy.
          const toward = Math.atan2(py - (this.y + this.height * 0.5),
            px - (this.x + this.width * 0.5));
          this.pending = {
            type: 'tail_sweep', x: this.x + this.width * 0.5, y: this.y + this.height * 0.5,
            radius: 240 * power, angle: toward, timer: 0.6, total: 0.6
          };
        } else {
          // HUNTING CIRCLE: it breaks the orbit, reverses, and bursts at you.
          this.circleDir *= -1;
          this.circleBurst = 2.2;
          this.pending = {
            type: 'hunt_call', x: this.x + this.width * 0.5, y: this.y + this.height * 0.5,
            radius: 120, timer: 0.5, total: 0.5
          };
        }
      } else if (ph === 2) {


        // ---- PHASE 2: blood frenzy. Chains, spins, volleys.
        if (roll < 0.32) {
          // FRENZY RUSH: three dashes from alternating heights.
          this.rushLeft = 3;
          this.attackTimer = 2.4;
          if (sound) sound.playBossRoar();
          this.skillGlow = 1;
        } else if (roll < 0.56) {
          // SHARKNADO: it tucks and spins; the current does the rest.
          this.pending = {
            type: 'sharknado', x: this.x + this.width * 0.5, y: this.y + this.height * 0.5,
            radius: 300 * power, timer: 0.7, total: 0.7
          };
        } else if (roll < 0.80) {
          // TOOTH BARRAGE: a jaw-snap volley of razor teeth.
          this.pending = {
            type: 'tooth_barrage', x: this.x + this.width * 0.5, y: this.y + this.height * 0.42,
            radius: 0, timer: 0.55, total: 0.55,
            target: { x: px, y: py }
          };
        } else {
          // A bigger predator dash, angled to cut off the swim.
          this.pending = {
            type: 'predator_dash', x: px, y: py, radius: 60,
            timer: 0.5, total: 0.5, target: { x: px, y: py }
          };
        }
      } else {
        // ---- PHASE 3: apex of the ancient sea. Everything is lethal.
        if (roll < 0.24) {
          // APEX EXECUTION: it vanishes, a warning lane paints the arena,
          // then it crosses the WHOLE bowl at killing speed.
          const laneY = py;
          const side = Math.random() < 0.5 ? -1 : 1;
          const startX = side < 0 ? TILE_SIZE * 2
            : (this.game.world.pixelWidth - this.width - TILE_SIZE * 2);
          this.vanishT = 0.9;
          this.apexLane = { x0: startX, y0: laneY, x1: px, y1: laneY, t: 0.9 };
          this.pending = {
            type: 'apex_execution', x: startX, y: laneY - this.height * 0.5,
            radius: 90, timer: 0.9, total: 0.9, lane: true
          };
          if (sound) sound.playBossRoar();
        } else if (roll < 0.46) {
          // DEPTH CHARGE: it sinks out of sight under you, then erupts.
          this.depthDive = 0.8;
          this.pending = {
            type: 'depth_warning', x: px, y: py + 260, radius: 130 * power,
            timer: 0.8, total: 0.8
          };
        } else if (roll < 0.70) {


          // DEVOURING MAW: a suction pull, then one enormous bite.
          this.pending = {
            type: 'devouring_maw', x: this.x + this.width * 0.5, y: this.y + this.height * 0.5,
            radius: 420 * power, timer: 1.1, total: 1.1,
            target: { x: px, y: py }
          };
        } else {
          // EXTINCTION HUNT: the full chain — dash, dash, sweep, bite —
          // and when it finishes, the beast hangs EXHAUSTED in the water.
          this.hunt = {
            t: 0, dur: 3.6,
            steps: [
              { at: 0.4, act: 'dash', done: false },
              { at: 1.2, act: 'dash', done: false },
              { at: 2.0, act: 'sweep', done: false },
              { at: 2.8, act: 'bite', done: false }
            ]
          };
          this.pending = {
            type: 'hunt_call', x: this.x + this.width * 0.5, y: this.y + this.height * 0.5,
            radius: 140, timer: 0.55, total: 0.55
          };
          if (sound) sound.playBossRoar();
        }
      }
      // Base cooldown between skill picks; the ladders above scale it down.
      this.skillGlow = Math.max(this.skillGlow, 0.6 + ph * 0.2);
      this.attackTimer = Math.max(1.1, (3.4 - ph * 0.55)) / Math.max(1, atkMul * frenzyMul * 0.9);
      if (sound && !this.pending) sound.playBossRoar();
    }
  }


  /**
   * Resolve a spent telegraph: damage, knockback, projectiles, and the show.
   * Every branch is defensive about a missing player/projectiles so a QA
   * sandbox driving the class directly never throws.
   */
  resolvePending(sound, particles) {
    const p = this.pending;
    this.pending = null;
    if (!p) return;
    // Every resolve kicks the recoil spring so the body snaps forward the
    // instant a skill fires.
    this.recoilV = (this.recoilV || 0) + 8 + this.phase * 2.5;
    this.pulse = Math.max(this.pulse || 0, 0.7 + this.phase * 0.1);
    const player = this.game && this.game.player;
    const ppx = player ? player.x + player.width / 2 : 0;
    const ppy = player ? player.y + player.height / 2 : 0;
    const ph = this.phase;
    const dmgMul = 1 + (ph - 1) * 0.65;
    const power = 1 + (ph - 1) * 0.55;
    const ccx = this.x + this.width * 0.5;
    const ccy = this.y + this.height * 0.5;

    if (p.type === 'predator_dash') {
      // The charge: lock onto where you WERE and go.
      const tx = (p.target ? p.target.x : ppx) - ccx;
      const ty = (p.target ? p.target.y : ppy) - ccy;
      const a = Math.atan2(ty, tx);
      this.faceDir = Math.cos(a) >= 0 ? 1 : -1;
      this.jawTarget = 0.8;
      this.startDash(Math.cos(a) * (1250 + ph * 130) * power,
        Math.sin(a) * (1250 + ph * 130) * power,
        0.75, (100 + ph * 26) * dmgMul, 'dash');
      this.skillFX(particles, ccx, ccy, 'charge', {});
      if (sound) sound.playBossRoar();
    } else if (p.type === 'crushing_bite') {
      // A short, vicious lunge: the maw itself is the hit.
      const tx = (p.target ? p.target.x : ppx) - ccx;
      const ty = (p.target ? p.target.y : ppy) - ccy;
      const a = Math.atan2(ty, tx);
      this.faceDir = Math.cos(a) >= 0 ? 1 : -1;
      this.jawTarget = 1;
      this.startDash(Math.cos(a) * 820 * power, Math.sin(a) * 820 * power,
        0.42, (150 + ph * 34) * dmgMul, 'bite');
      this.skillFX(particles, ccx + Math.cos(a) * 120, ccy + Math.sin(a) * 60, 'bite', {});
      this.skillImpact('bite', 0.6);
      if (player && Math.hypot(ppx - (ccx + Math.cos(a) * 130), ppy - ccy) <= p.radius) {
        this.game.damagePlayer(Math.round((130 + ph * 30) * dmgMul), ccx,
          'The Megalodon’s crushing bite shattered your guard!', true, ccy);
        this.frenzy = Math.min(6, this.frenzy + 1);
        this.frenzyT = 6;
      }
      this.addStain(ccx + Math.cos(a) * 150, ccy, 70 * power);
      if (sound) sound.playHit();
    } else if (p.type === 'tail_sweep') {
      // The caudal fin scythes a wide arc. Anyone inside gets hurled back.
      this.skillFX(particles, ccx, ccy, 'sweep', { radius: p.radius, angle: p.angle });
      this.skillImpact('sweep', 0.5);
      if (player) {
        const dx = ppx - ccx, dy = ppy - ccy;
        const dist = Math.hypot(dx, dy);
        const toP = Math.atan2(dy, dx);
        const dAng = Math.abs(((toP - (p.angle || 0) + Math.PI) % (Math.PI * 2)) - Math.PI);
        if (dist <= p.radius && dAng <= 1.15) {
          this.game.damagePlayer(Math.round((105 + ph * 26) * dmgMul), ccx,
            'The Megalodon’s tail sweep sent you flying!', true, ccy);
          // Knockback: a real shove away from the tail.
          if (player.vx !== undefined) {
            player.vx += (dx / (dist || 1)) * 14;
            player.vy += (dy / (dist || 1)) * 8 - 4;
          }
          this.frenzy = Math.min(6, this.frenzy + 1);
          this.frenzyT = 6;
        }
      }
      if (sound) sound.playHit();
    } else if (p.type === 'hunt_call') {

      // The call that opens the hunting circle / the extinction chain:
      // a roar, a shockwave of bubbles, and the beast commits.
      this.skillFX(particles, ccx, ccy, 'call', {});
      if (sound) sound.playBossRoar();
      if (this.game && this.game.feel) this.game.feel.shake(0.4);
    } else if (p.type === 'sharknado') {
      // It tucks and spins for the duration; update() drags you inward.
      this.tornadoT = 2.3;
      this.skillFX(particles, ccx, ccy, 'spin', { radius: p.radius });
      this.skillImpact('spin', 0.55);
      if (sound) sound.playBossLaser();
    } else if (p.type === 'tooth_barrage') {
      // A fan of razor teeth spat at where you stood.
      this.jawTarget = 1;
      this.fireTeeth(p.target ? p.target : { x: ppx, y: ppy });
      this.skillFX(particles, p.x, p.y, 'teeth', {});
      if (sound) sound.playHit();
      this.recoilV += 5;
    } else if (p.type === 'depth_warning') {
      // The eruption itself fires from update()'s depthDive timer; the
      // warning marker just pays off its show here.
      this.skillFX(particles, p.x, p.y, 'rumble', { radius: p.radius });
      if (sound) sound.playBossLaser();
    } else if (p.type === 'apex_execution') {
      // It appears at the lane start and crosses the entire arena.
      this.x = p.x || this.x;
      this.y = p.y || this.y;
      this.vanishT = 0;
      const dir = (this.apexLane && this.apexLane.x1 >= this.apexLane.x0) ? 1 : -1;
      this.faceDir = dir;
      this.jawTarget = 1;
      this.startDash(dir * 2300, 0, 1.1, (190 + this.phase * 40) * dmgMul, 'apex');
      this.skillFX(particles, this.x + this.width / 2, this.y + this.height / 2, 'charge', {});
      this.skillImpact('apex', 0.9);
      if (sound) sound.playExplosion();
    } else if (p.type === 'devouring_maw') {
      // The mega-bite at the end of the suction windup.
      this.jawTarget = 1;
      const tx = (p.target ? p.target.x : ppx) - ccx;
      const ty = (p.target ? p.target.y : ppy) - ccy;
      const a = Math.atan2(ty, tx);
      this.faceDir = Math.cos(a) >= 0 ? 1 : -1;
      this.startDash(Math.cos(a) * 700, Math.sin(a) * 700, 0.4, (200 + ph * 44) * dmgMul, 'maw');
      this.skillFX(particles, ccx, ccy, 'maw', {});
      this.skillImpact('maw', 0.85);
      if (player && Math.hypot(ppx - ccx, ppy - ccy) <= p.radius) {
        this.game.damagePlayer(Math.round((120 + ph * 30) * dmgMul), ccx,
          'The Megalodon swallowed the water — and you with it!', true, ccy);
      }
      this.addStain(ccx, ccy, 120 * power);
      if (sound) sound.playExplosion();
    } else if (p.type === 'extinction_bite') {
      // The final bite of the Extinction Hunt chain.
      this.jawTarget = 1;
      this.recoilV += 10;
      this.skillFX(particles, ccx, ccy, 'bite', { radius: p.radius });
      this.skillImpact('bite', 0.9);
      if (player && Math.hypot(ppx - ccx, ppy - ccy) <= p.radius) {
        this.game.damagePlayer(Math.round((210 + ph * 46) * dmgMul), ccx,
          'The Extinction Hunt ended in those jaws!', true, ccy);
      }
      this.addStain(ccx, ccy, 130 * power);
      if (sound) sound.playExplosion();
    }
    this.skillGlow = 0.4 + ph * 0.15;
    if (sound) sound.playHit();
  }
  /** A fan of razor teeth spat at the player. Hostile projectiles. */
  fireTeeth(target, projectiles) {
    const projs = projectiles || (this.game && this.game.projectiles);
    if (!projs || typeof Projectile !== 'function') return;
    const ph = this.phase;
    const dmgMul = 1 + (ph - 1) * 0.65;
    const cx = this.x + this.width * 0.5 + (this.faceDir || 1) * this.width * 0.36;
    const cy = this.y + this.height * 0.42;
    const px = target ? target.x + (target.width || 24) / 2 : cx + this.faceDir * 300;
    const py = target ? target.y + (target.height || 40) / 2 : cy;
    const base = Math.atan2(py - cy, px - cx);
    // More teeth, tighter spread as the phases turn over.
    const count = 5 + ph * 2;
    const spread = 0.42 - ph * 0.05;
    for (let i = 0; i < count; i++) {
      const a = base + (i - (count - 1) / 2) * spread;
      const speed = (11 + ph * 1.6);
      const tooth = new Projectile(cx, cy,
        Math.cos(a) * speed, Math.sin(a) * speed,
        'tooth', Math.round((70 + ph * 22) * dmgMul), true, 3.0, 60);
      tooth.fromBoss = true;
      tooth.toothSpin = a;
      projs.push(tooth);
    }
  }

  /**
   * The skill show: layered particle chords every resolve spends. Each skill
   * gets its own signature — a white water-flash, a ring racing outward,
   * arcing spray, and lingering motes — plus hit-stop + slow-mo on the
   * heaviest hits so impacts LAND instead of just happening.
   * Uses existing helpers only: addParticle / magicSparkle / bloodBurst.
   */
  skillFX(particles, x, y, chord, opts = {}) {
    if (!particles) return;
    const ph = this.phase;
    const power = 1 + (ph - 1) * 0.55;
    const radius = (opts.radius || 90) * power;
    // Palette: sea-foam white/cyan for water force, crimson for the jaws.
    const wet = chord === 'charge' || chord === 'spin' || chord === 'rumble';
    const tint = wet ? '#7dd3fc' : chord === 'teeth' ? '#e2e8f0' : '#f87171';
    // Core flash.
    for (let i = 0; i < 4 + ph * 2; i++) {
      particles.addParticle(x + (Math.random() - 0.5) * 20, y + (Math.random() - 0.5) * 20,
        (Math.random() - 0.5) * 6, (Math.random() - 0.5) * 6,
        i % 2 ? tint : 'rgba(255, 255, 255, 0.8)',
        3 + Math.random() * 3, 0.4, 0, true);
    }
    // Racing ring of spray.
    const rings = 1 + (ph > 2 ? 1 : 0);
    for (let r = 0; r < rings; r++) {
      const n = 10 + ph * 4;
      for (let i = 0; i < n; i++) {
        const a = (i / n) * Math.PI * 2 + r * 0.3;
        particles.addParticle(x + Math.cos(a) * radius * 0.3,
          y + Math.sin(a) * radius * 0.3,
          Math.cos(a) * (4 + ph * 2), Math.sin(a) * (4 + ph * 2),
          tint, 2.4, 0.55, 0, true);
      }
    }
    // Arcing spray.
    for (let i = 0; i < 6 + ph * 3; i++) {
      particles.addParticle(x, y,
        (Math.random() - 0.5) * 12, -Math.random() * 8 - 2,
        'rgba(186, 230, 253, 0.7)', 2.6, 0.7, 0.14, true);
    }
    particles.magicSparkle(x, y, tint, 5 + ph * 3);
    // The heavier the hit, the harder the screen flinches.
    if (chord === 'maw' || chord === 'apex' || chord === 'bite') {
      this.skillImpact(chord, 0.7);
    }
  }

  /** Hit-stop + slow-mo + shake tuned per skill, scaled by phase. */
  skillImpact(chord, baseShake) {
    const feel = this.game && this.game.feel;
    if (!feel) return;
    const w = 1 + (this.phase - 1) * 0.45;
    if (chord === 'bite' || chord === 'maw' || chord === 'apex') {
      if (typeof feel.stop === 'function') feel.stop(0.09 * w, 0.05);
      if (typeof feel.slow === 'function') feel.slow(0.35 * w, 0.3);
    } else if (chord === 'sweep' || chord === 'spin') {
      if (typeof feel.stop === 'function') feel.stop(0.06 * w, 0.05);
    }
    if (typeof feel.shake === 'function') feel.shake(baseShake);
  }

  renderTelegraph(ctx, camera) {
    const p = this.pending;
    const lane = this.apexLane;
    ctx.save();
    const pulse = 0.5 + Math.sin(this.animT * 22) * 0.25;
    // ---- Apex execution warning lane: painted even while it is vanished ----
    if (lane && lane.t > 0) {
      const lx0 = lane.x0 - camera.x, ly0 = lane.y0 - camera.y;
      const lx1 = lane.x1 - camera.x, ly1 = lane.y1 - camera.y;
      const fade = Math.min(1, lane.t);
      ctx.globalAlpha = 0.25 + 0.35 * fade;
      ctx.fillStyle = 'rgba(248, 113, 113, 0.4)';
      const nx = -(ly1 - ly0), ny = (lx1 - lx0);
      const nl = Math.hypot(nx, ny) || 1;
      const halfW = 62;
      ctx.beginPath();
      ctx.moveTo(lx0 + (nx / nl) * halfW, ly0 + (ny / nl) * halfW);
      ctx.lineTo(lx1 + (nx / nl) * halfW, ly1 + (ny / nl) * halfW);
      ctx.lineTo(lx1 - (nx / nl) * halfW, ly1 - (ny / nl) * halfW);
      ctx.lineTo(lx0 - (nx / nl) * halfW, ly0 - (ny / nl) * halfW);
      ctx.closePath();
      ctx.fill();
      // Chevron arrows racing along the lane in the charge direction.
      ctx.globalAlpha = 0.5 + 0.4 * pulse;
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
      ctx.lineWidth = 3;
      const dir = lane.x1 >= lane.x0 ? 1 : -1;
      for (let i = 0; i < 6; i++) {
        const f = ((this.animT * 1.4 + i / 6) % 1);
        const cxp = lx0 + (lx1 - lx0) * f;
        const cyp = ly0 + (ly1 - ly0) * f;
        ctx.beginPath();
        ctx.moveTo(cxp - dir * 14, cyp - 9);
        ctx.lineTo(cxp + dir * 2, cyp);
        ctx.lineTo(cxp - dir * 14, cyp + 9);
        ctx.stroke();
      }
      ctx.globalAlpha = 1;
    }
    if (!p) { ctx.restore(); return; }
    const sx = p.x - camera.x;
    const sy = p.y - camera.y;
    const k = 1 - Math.max(0, p.timer) / p.total; // 0 → 1 as it winds up

    if (p.type === 'predator_dash' || p.type === 'apex_execution') {
      // A charge lane: a bright bar from the beast to the target, tightening.
      const tx = (p.target ? p.target.x : p.x) - camera.x;
      const ty = (p.target ? p.target.y : p.y) - camera.y;
      ctx.setLineDash([16, 10]);
      ctx.lineWidth = 4 + k * 4;
      ctx.strokeStyle = 'rgba(248, 113, 113, ' + (0.5 + pulse * 0.45).toFixed(3) + ')';
      ctx.beginPath();
      ctx.moveTo(sx, sy);
      ctx.lineTo(tx, ty);
      ctx.stroke();
      ctx.setLineDash([]);
      // Target reticle: contracts as the charge launches.
      const ringR = 34 * (1 - k) + 8;
      ctx.lineWidth = 3;
      ctx.strokeStyle = 'rgba(255, 255, 255, ' + (0.35 + 0.45 * k).toFixed(3) + ')';
      ctx.beginPath(); ctx.arc(tx, ty, ringR, 0, Math.PI * 2); ctx.stroke();
      for (let c = 0; c < 4; c++) {
        const a = c * Math.PI / 2 + this.animT * 2;
        ctx.beginPath();
        ctx.moveTo(tx + Math.cos(a) * (ringR + 8), ty + Math.sin(a) * (ringR + 8));
        ctx.lineTo(tx + Math.cos(a) * (ringR + 20), ty + Math.sin(a) * (ringR + 20));
        ctx.stroke();
      }
    } else if (p.type === 'crushing_bite' || p.type === 'devouring_maw' ||
               p.type === 'extinction_bite') {


      // A gape: two arcs closing like jaws over the danger zone.
      const r = p.radius || 160;
      ctx.lineWidth = 5;
      ctx.strokeStyle = 'rgba(248, 113, 113, ' + (0.55 + pulse * 0.4).toFixed(3) + ')';
      const gap = (1 - k) * 0.9;
      // Upper jaw arc and lower jaw arc, closing as k approaches 1.
      ctx.beginPath();
      ctx.arc(sx, sy, r, Math.PI + gap, Math.PI * 2 - gap, false);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(sx, sy, r, gap, Math.PI - gap, false);
      ctx.stroke();
      // Warning teeth marks around the rim.
      ctx.fillStyle = 'rgba(255, 255, 255, ' + (0.3 + 0.5 * k).toFixed(3) + ')';
      for (let t = 0; t < 10; t++) {
        const a = (t / 10) * Math.PI * 2;
        const tr = r * (0.85 + 0.15 * Math.sin(this.animT * 18 + t));
        ctx.beginPath();
        ctx.moveTo(sx + Math.cos(a - 0.06) * tr, sy + Math.sin(a - 0.06) * tr);
        ctx.lineTo(sx + Math.cos(a) * (tr - 14 * k - 4), sy + Math.sin(a) * (tr - 14 * k - 4));
        ctx.lineTo(sx + Math.cos(a + 0.06) * tr, sy + Math.sin(a + 0.06) * tr);
        ctx.closePath();
        ctx.fill();
      }
      // Boiling core swelling toward the bite.
      ctx.fillStyle = 'rgba(127, 29, 29, ' + (0.16 + 0.3 * k).toFixed(3) + ')';
      ctx.beginPath(); ctx.arc(sx, sy, r * (0.3 + 0.55 * k), 0, Math.PI * 2); ctx.fill();
      if (p.type === 'devouring_maw') {
        // Inward streaklines: the suction, drawn before the bite lands.
        ctx.strokeStyle = 'rgba(186, 230, 253, ' + (0.25 + 0.4 * (1 - k)).toFixed(3) + ')';
        ctx.lineWidth = 2;
        for (let s = 0; s < 10; s++) {
          const a = (s / 10) * Math.PI * 2 + this.animT * 0.8;
          const r0 = r * 1.25, r1 = r * (0.35 + 0.5 * (1 - k));
          ctx.beginPath();
          ctx.moveTo(sx + Math.cos(a) * r0, sy + Math.sin(a) * r0);
          ctx.lineTo(sx + Math.cos(a) * r1, sy + Math.sin(a) * r1);
          ctx.stroke();
        }
      }
    } else if (p.type === 'tail_sweep') {
      // A sweeping wedge that closes in the swing direction.
      const r = p.radius || 220;
      const ang = p.angle || 0;
      ctx.fillStyle = 'rgba(251, 146, 60, ' + (0.12 + 0.22 * k).toFixed(3) + ')';
      ctx.beginPath();
      ctx.moveTo(sx, sy);
      ctx.arc(sx, sy, r * (0.5 + 0.5 * k), ang - 1.15, ang + 1.15);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = 'rgba(253, 224, 71, ' + (0.45 + 0.4 * k).toFixed(3) + ')';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.arc(sx, sy, r * (0.5 + 0.5 * k), ang - 1.15, ang + 1.15);
      ctx.stroke();
      // The fin itself, cocked back and about to whip through.
      const fx = sx - Math.cos(ang) * r * 0.8;
      const fy = sy - Math.sin(ang) * r * 0.8;
      ctx.fillStyle = 'rgba(226, 232, 240, ' + (0.35 + 0.4 * (1 - k)).toFixed(3) + ')';
      ctx.beginPath();
      ctx.ellipse(fx, fy, 26, 12, ang, 0, Math.PI * 2);
      ctx.fill();
    } else if (p.type === 'sharknado') {

      // A spinning vortex of streaklines around the boss.
      const r = (p.radius || 260) * (0.6 + 0.4 * k);
      ctx.lineWidth = 3;
      for (let arm = 0; arm < 5; arm++) {
        ctx.strokeStyle = 'rgba(125, 211, 252, ' + (0.3 + 0.4 * k).toFixed(3) + ')';
        ctx.beginPath();
        for (let s = 0; s <= 14; s++) {
          const f = s / 14;
          const a = this.animT * 7 + arm * (Math.PI * 2 / 5) + f * 2.4;
          const rr = r * (1 - f * 0.85);
          const px2 = sx + Math.cos(a) * rr;
          const py2 = sy + Math.sin(a) * rr * 0.55;
          if (s === 0) ctx.moveTo(px2, py2); else ctx.lineTo(px2, py2);
        }
        ctx.stroke();
      }
      ctx.setLineDash([8, 8]);
      ctx.strokeStyle = 'rgba(244, 63, 94, ' + (0.4 + pulse * 0.4).toFixed(3) + ')';
      ctx.lineWidth = 4;
      ctx.beginPath(); ctx.arc(sx, sy, r, 0, Math.PI * 2); ctx.stroke();
      ctx.setLineDash([]);
    } else if (p.type === 'tooth_barrage') {
      // Spark lines converging on the gape, then the volley fires.
      ctx.strokeStyle = 'rgba(255, 255, 255, ' + (0.3 + 0.5 * k).toFixed(3) + ')';
      ctx.lineWidth = 2;
      for (let i = 0; i < 8; i++) {
        const a = (i / 8) * Math.PI * 2 + this.animT;
        const r0 = 60 + 50 * (1 - k);
        ctx.beginPath();
        ctx.moveTo(sx + Math.cos(a) * r0, sy + Math.sin(a) * r0 * 0.6);
        ctx.lineTo(sx + Math.cos(a) * 14, sy + Math.sin(a) * 8);
        ctx.stroke();
      }
    } else if (p.type === 'depth_warning') {
      // An eruption marker below the player: ring + rising chevrons.
      ctx.setLineDash([10, 7]);
      ctx.lineWidth = 4;
      ctx.strokeStyle = 'rgba(253, 224, 71, ' + (0.4 + 0.45 * k).toFixed(3) + ')';
      ctx.beginPath();
      ctx.ellipse(sx, sy, p.radius || 120, (p.radius || 120) * 0.4, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = 'rgba(125, 211, 252, ' + (0.2 + 0.4 * k).toFixed(3) + ')';
      for (let c = 0; c < 4; c++) {
        const rise = ((this.animT * 140 + c * 46) % 180);
        ctx.beginPath();
        ctx.moveTo(sx - 12, sy - rise);
        ctx.lineTo(sx + 12, sy - rise);
        ctx.lineTo(sx, sy - rise - 16);
        ctx.closePath();
        ctx.fill();
      }
    } else if (p.type === 'hunt_call') {
      // A roar ring: a hard bright circle snapping inward.
      const r = (p.radius || 120) * (1.7 - 0.7 * k);
      ctx.setLineDash([14, 9]);
      ctx.lineWidth = 5;
      ctx.strokeStyle = 'rgba(248, 113, 113, ' + (0.5 + pulse * 0.5).toFixed(3) + ')';
      ctx.beginPath(); ctx.arc(sx, sy, r, 0, Math.PI * 2); ctx.stroke();
      ctx.setLineDash([]);
      // Emanating shockwave ticks.
      ctx.strokeStyle = 'rgba(255, 255, 255, ' + (0.2 + 0.4 * k).toFixed(3) + ')';
      ctx.lineWidth = 3;
      for (let s = 0; s < 8; s++) {
        const a = (s / 8) * Math.PI * 2;
        ctx.beginPath();
        ctx.moveTo(sx + Math.cos(a) * (r + 6), sy + Math.sin(a) * (r + 6));
        ctx.lineTo(sx + Math.cos(a) * (r + 16 + 8 * k), sy + Math.sin(a) * (r + 16 + 8 * k));
        ctx.stroke();
      }
    }
    ctx.restore();
  }


  /**
   * Terraria-styled side-view Megalodon: a long slate-blue torpedo with a
   * pale belly, one huge crescent tail, tall dorsal + sweeping pectorals,
   * and a mouth that hangs open far past what looks possible — red gape,
   * rows of white teeth, eye burning above the jawline. Scar count grows
   * with injury; phase 2 cracks the hide open, phase 3 shreds the fins.
   */
  render(ctx, camera) {
    const x = this.x - camera.x;
    const y = this.y - camera.y;
    const injury = 1 - this.hp / this.maxHp;
    const ph = this.phase;
    const flash = this.hitFlash > 0;
    const faceDir = this.faceDir || 1;
    // VISUAL SCALE: grows a touch per phase, capped — never runaway.
    const grow = Math.min(1.3, 1 + (ph - 1) * 0.12);
    const P = (v) => Math.round(v / 2) * 2;

    // ---- Palette: hard flat bands, Terraria-style. Phase tints shift the
    // blues toward charcoal + blood as the frenzy takes over. --------------
    const hideTop  = flash ? '#ffffff' : ph === 3 ? '#3a4258' : ph === 2 ? '#465578' : '#556590';
    const hideMid  = flash ? '#ffe4e6' : ph === 3 ? '#4c5670' : ph === 2 ? '#5c6d97' : '#6b7dab';
    const hideLow  = flash ? '#fecdd3' : ph === 3 ? '#7b88a8' : '#93a2c4';
    const belly    = flash ? '#ffffff' : ph === 3 ? '#c9d2e4' : '#dde4f2';
    const finDark  = flash ? '#ffffff' : ph === 3 ? '#333b50' : ph === 2 ? '#3f4d72' : '#4a5a87';
    const finLite  = flash ? '#ffe4e6' : ph === 3 ? '#5d6a8a' : '#7486b3';
    const outline  = '#10182b';
    const mouthDeep = ph >= 2 ? '#5c0d1a' : '#6b1220';
    const mouthLit  = ph >= 2 ? '#a41c33' : '#b52538';
    const gum       = '#d76a78';
    const tooth     = '#f4f6fa';
    const eyeGlow   = ph === 1 ? 0 : ph === 2 ? 0.5 : 1;

    ctx.save();
    // ---- Whole-body transform: bank, pitch, squash, breathe, lunge. ------
    const squash = this.squash || 0;
    const breath = this.breath || 1;
    const pitch = this.pitch || 0;
    const lean = this.lean || 0;
    const lunge = this.lunge || 0;
    const bodyCX = x + this.width * 0.5 + (this.sway || 0);
    const bodyCY = y + this.height * 0.5 + (this.bob || 0);
    ctx.translate(bodyCX, bodyCY);
    ctx.scale(grow, grow);
    ctx.rotate(lean * 0.14 + pitch * 0.5 + lunge * 0.05 * faceDir);
    ctx.transform(1 + squash * 0.22, squash * 0.06 * pitch,
      squash * 0.06 * pitch, (1 - squash * 0.3) * breath, 0, 0);
    // Face left or right with a single flip; all art below draws NOSE RIGHT.
    ctx.scale(faceDir, 1);
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    // Apex-execution vanish: a ghost silhouette in the water.
    const vanished = this.vanishT > 0;
    if (vanished) ctx.globalAlpha = 0.16 + Math.abs(Math.sin(this.animT * 30)) * 0.08;
    if (this.exhaustT > 0) {
      // Exhausted: desaturated tremble, drawn slightly slack in the water.
      ctx.globalAlpha = 0.92;
    }
    // Local frame: x right = nose direction, y down. Body ~420 long.
    const HW = this.width * 0.5;   // 210
    const HH = this.height * 0.5;  // 100
    const wob = Math.sin(this.swimPhase * 0.9) * 3;


    // ====================================================================
    // 1. THE TAIL — a huge crescent caudal fin, drawn first (furthest back).
    //    It sweeps with tailSwing; the swing is the swim cycle made visible.
    // ====================================================================
    const tailX = -HW + 30;
    const tSwing = (this.tailSwing || 0) * 0.02;
    ctx.save();
    ctx.translate(tailX, wob * 0.5);
    ctx.rotate(tSwing);
    // Upper lobe (longer, shark-style).
    ctx.fillStyle = finDark;
    ctx.strokeStyle = outline;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.quadraticCurveTo(-46, -58, -64, -92);
    ctx.quadraticCurveTo(-40, -60, -12, -26);
    ctx.lineTo(0, -6);
    ctx.closePath();
    ctx.fill(); ctx.stroke();
    // Lower lobe (shorter).
    ctx.fillStyle = finDark;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.quadraticCurveTo(-38, 40, -50, 66);
    ctx.quadraticCurveTo(-30, 42, -8, 20);
    ctx.lineTo(0, 6);
    ctx.closePath();
    ctx.fill(); ctx.stroke();
    // Ragged notches on the caudal fin in the apex phase.
    if (ph === 3) {
      ctx.fillStyle = 'rgba(16, 24, 43, 0.9)';
      ctx.beginPath(); ctx.moveTo(-30, -46); ctx.lineTo(-18, -34); ctx.lineTo(-34, -30); ctx.closePath(); ctx.fill();
      ctx.beginPath(); ctx.moveTo(-26, 30); ctx.lineTo(-16, 22); ctx.lineTo(-30, 18); ctx.closePath(); ctx.fill();
    }
    ctx.restore();

    // ====================================================================
    // 2. PECTORAL FINS — the big swept wings low on the flanks. The far-side
    //    fin is drawn dark (behind the body), the near-side one on top.
    // ====================================================================
    const pecBase = HW * 0.34;
    // Far pectoral (behind body): darker, smaller.
    ctx.fillStyle = finDark;
    ctx.strokeStyle = outline;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(pecBase - 10, HH * 0.34);
    ctx.quadraticCurveTo(pecBase - 60, HH * 0.9, pecBase - 92, HH * 1.15 + wob);
    ctx.quadraticCurveTo(pecBase - 40, HH * 0.72, pecBase - 26, HH * 0.3);
    ctx.closePath();
    ctx.fill(); ctx.stroke();

    // ====================================================================
    // 3. THE BODY — one long bezier torpedo: nose at +HW, peduncle at -HW.
    // ====================================================================
    const noseY = -6 + wob * 0.3;           // the snout dips slightly
    const backY = -HH * 0.62 + wob;         // arch of the back
    const bellyY = HH * 0.58 + wob;         // swell of the belly
    ctx.beginPath();
    ctx.moveTo(HW, noseY + 8);                                   // snout tip
    ctx.quadraticCurveTo(HW * 0.72, backY, HW * 0.18, backY - 4); // upper jawline back
    ctx.quadraticCurveTo(-HW * 0.42, backY - 2, -HW + 24, wob * 0.6); // back to peduncle
    ctx.lineTo(-HW + 24, wob * 0.6 + 14);
    ctx.quadraticCurveTo(-HW * 0.42, bellyY + 6, HW * 0.2, bellyY);
    ctx.quadraticCurveTo(HW * 0.78, bellyY - 24, HW, noseY + 8);  // jawline forward
    ctx.closePath();
    ctx.fillStyle = hideMid;
    ctx.fill();
    ctx.strokeStyle = outline;
    ctx.lineWidth = 4;
    ctx.stroke();
    // Dorsal dark band (top half) and pale belly (bottom): hard flat tones.
    ctx.save();
    ctx.clip();
    ctx.fillStyle = hideTop;
    ctx.beginPath();
    ctx.moveTo(HW, backY);
    ctx.lineTo(-HW, backY + 2);
    ctx.lineTo(-HW, backY + 26);
    ctx.quadraticCurveTo(0, backY + 34, HW, backY + 22);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = hideLow;
    ctx.beginPath();
    ctx.moveTo(HW, bellyY - 30);
    ctx.quadraticCurveTo(0, bellyY - 20, -HW, bellyY - 26);
    ctx.lineTo(-HW, bellyY + 20);
    ctx.lineTo(HW, bellyY + 20);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = belly;
    ctx.beginPath();
    ctx.moveTo(HW, noseY + 12);
    ctx.quadraticCurveTo(HW * 0.5, bellyY - 12, -HW * 0.3, bellyY - 14);
    ctx.lineTo(-HW * 0.3, bellyY + 20);
    ctx.lineTo(HW, bellyY + 20);
    ctx.closePath();
    ctx.fill();
    // Counter-shading seam: a hard line where dark meets light.
    ctx.strokeStyle = 'rgba(16, 24, 43, 0.35)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(HW - 8, bellyY - 26);
    ctx.quadraticCurveTo(0, bellyY - 18, -HW * 0.6, bellyY - 24);
    ctx.stroke();
    ctx.restore();


    // ====================================================================
    // 4. DORSAL FIN — the tall triangle that reads "shark" from a mile off.
    // ====================================================================
    ctx.fillStyle = finDark;
    ctx.strokeStyle = outline;
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(HW * 0.30, backY + 4);
    ctx.quadraticCurveTo(-2, backY - 40, -26, backY - 78 + wob);   // swept-back tip
    ctx.quadraticCurveTo(-16, backY - 30, -HW * 0.22, backY + 2);
    ctx.closePath();
    ctx.fill(); ctx.stroke();
    // Fin highlight edge.
    ctx.strokeStyle = finLite;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(HW * 0.28, backY);
    ctx.quadraticCurveTo(-2, backY - 36, -24, backY - 72 + wob);
    ctx.stroke();
    if (ph === 3) {
      // Apex: the dorsal is notched and torn.
      ctx.fillStyle = hideMid;
      ctx.beginPath(); ctx.moveTo(-10, backY - 34); ctx.lineTo(2, backY - 22); ctx.lineTo(-18, backY - 20); ctx.closePath(); ctx.fill();
    }
    // Second dorsal + pelvic nubs for silhouette richness.
    ctx.fillStyle = finDark;
    ctx.strokeStyle = outline;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(-HW * 0.52, backY + 4);
    ctx.quadraticCurveTo(-HW * 0.58, backY - 22, -HW * 0.66, backY - 30 + wob);
    ctx.quadraticCurveTo(-HW * 0.62, backY - 8, -HW * 0.68, backY + 4);
    ctx.closePath();
    ctx.fill(); ctx.stroke();

    // ====================================================================
    // 5. NEAR PECTORAL — big swept wing on the viewer's side, drawn ON TOP.
    // ====================================================================
    ctx.fillStyle = finLite;
    ctx.strokeStyle = outline;
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(pecBase + 14, HH * 0.40);
    ctx.quadraticCurveTo(pecBase - 42, HH * 1.05 + wob, pecBase - 86, HH * 1.42 + wob * 1.4);
    ctx.quadraticCurveTo(pecBase - 20, HH * 0.86, pecBase + 34, HH * 0.36);
    ctx.closePath();
    ctx.fill(); ctx.stroke();
    ctx.strokeStyle = 'rgba(16, 24, 43, 0.4)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(pecBase + 6, HH * 0.44);
    ctx.quadraticCurveTo(pecBase - 36, HH * 1.02, pecBase - 76, HH * 1.34 + wob);
    ctx.stroke();

    // ====================================================================
    // 6. GILL SLITS — five slashes behind the head. They flutter with breath.
    // ====================================================================
    ctx.strokeStyle = 'rgba(16, 24, 43, 0.75)';
    ctx.lineWidth = 3;
    for (let g = 0; g < 5; g++) {
      const gx = HW * 0.52 - g * 13;
      const gl = 26 + Math.sin(this.animT * 4 + g * 0.6) * 3 * breath + this.surge * 5;
      ctx.beginPath();
      ctx.moveTo(gx, backY + 14);
      ctx.quadraticCurveTo(gx - 5, backY + 14 + gl * 0.5, gx - 3, backY + 14 + gl);
      ctx.stroke();
    }

    // ====================================================================
    // 7. SCARS — the record of a million years of hunting. Count + severity
    //    climb with injury; phase 2 splits them open, phase 3 is chewed raw.
    // ====================================================================
    const scarCount = Math.floor(3 + injury * 9 + (ph - 1) * 3);
    for (let s = 0; s < scarCount; s++) {
      // Deterministic scatter along the flank.
      const sSeed = s * 2.399;
      const sxp = Math.cos(sSeed) * HW * 0.55;
      const syp = Math.sin(sSeed * 1.7) * HH * 0.34 + wob;
      const slen = 12 + (s % 4) * 6;
      const sang = 0.7 + (s % 3) * 0.5;
      ctx.strokeStyle = ph >= 2
        ? 'rgba(212, 74, 90, ' + Math.min(0.95, 0.5 + injury * 0.5).toFixed(2) + ')'
        : 'rgba(148, 163, 198, 0.75)';
      ctx.lineWidth = 2.5 + (s % 2);
      ctx.beginPath();
      ctx.moveTo(sxp, syp);
      ctx.lineTo(sxp + Math.cos(sang) * slen, syp + Math.sin(sang) * slen);
      // Cross-hatch second stroke on every other scar — like the reference.
      if (s % 2 === 0) {
        ctx.moveTo(sxp + Math.cos(sang) * slen * 0.2, syp + Math.sin(sang) * slen);
        ctx.lineTo(sxp + Math.cos(sang) * slen * 0.9, syp - 4);
      }
      ctx.stroke();
      // Phase 2+: the scars crack and weep light.
      if (ph >= 2 && s % 3 === 0) {
        ctx.fillStyle = 'rgba(248, 113, 113, ' + (0.35 + eyeGlow * 0.3).toFixed(2) + ')';
        ctx.fillRect(sxp + 2, syp + 2, 3, 3);
      }
    }


    // ====================================================================
    // 8. THE HEAD — blunt snout, burning eye, and THE MAW.
    // ====================================================================
    // Brow ridge: a heavy shadow above the eye, angriest in the apex phase.
    ctx.fillStyle = hideTop;
    ctx.strokeStyle = outline;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(HW, noseY + 2);
    ctx.quadraticCurveTo(HW * 0.9, backY + 16, HW * 0.62, backY + 12);
    ctx.quadraticCurveTo(HW * 0.8, backY + 30, HW, noseY + 14);
    ctx.closePath();
    ctx.fill(); ctx.stroke();

    // THE EYE: a black bead with a hard white glint. It ignites red as the
    // frenzy takes hold — phase 1 cold slate, phase 2 ember, phase 3 furnace.
    const eyeX = HW * 0.76;
    const eyeY = backY + 30;
    if (eyeGlow > 0) {
      ctx.fillStyle = 'rgba(248, 113, 113, ' + (0.22 + eyeGlow * 0.3).toFixed(2) + ')';
      ctx.beginPath();
      ctx.arc(eyeX, eyeY, 11 + eyeGlow * 3 + Math.sin(this.animT * 6) * 1.5, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.fillStyle = '#f8fafc';
    ctx.beginPath(); ctx.ellipse(eyeX, eyeY, 7, 6, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = ph === 1 ? '#0f172a' : '#7f1d1d';
    ctx.beginPath(); ctx.ellipse(eyeX + 1.5, eyeY, 4, 4.5, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(eyeX - 1, eyeY - 3, 2, 2);
    // Angry brow crease over the eye.
    ctx.strokeStyle = outline;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(eyeX - 14, eyeY - 10);
    ctx.lineTo(eyeX + 9, eyeY - 7);
    ctx.stroke();

    // --------------------------------------------------------------------
    // THE MAW. jawOpen (0..1) drops the lower jaw and flares the gape. The
    // reference: a mouth nearly as tall as the body, dark red throat, rows
    // of white triangular teeth on both jaws.
    // --------------------------------------------------------------------
    const j = this.jawOpen;               // 0..1
    const gape = j * HH * 0.62;           // how far the jaw drops
    const jawPivotX = HW * 0.55;          // hinge behind the mouth
    const mouthTopY = noseY + 16;
    // Mouth interior: a wedge from the hinge to the snout, filled dark red.
    ctx.fillStyle = mouthDeep;
    ctx.strokeStyle = outline;
    ctx.lineWidth = 3.5;
    ctx.beginPath();
    ctx.moveTo(jawPivotX, mouthTopY + 6);
    ctx.quadraticCurveTo(HW * 0.86, mouthTopY - 2 + j * -6, HW - 2, noseY + 14);
    // Lower jaw line, dropped by gape.
    ctx.quadraticCurveTo(HW * 0.84, mouthTopY + 20 + gape * 0.7, jawPivotX + 8, mouthTopY + 16 + gape);
    ctx.closePath();
    ctx.fill();
    if (j > 0.02) {
      // Lit throat: a smaller bright-red wedge inside the gape.
      ctx.fillStyle = mouthLit;
      ctx.beginPath();
      ctx.moveTo(jawPivotX + 10, mouthTopY + 10);
      ctx.quadraticCurveTo(HW * 0.82, mouthTopY + 4 + j * 2, HW * 0.96, noseY + 16);
      ctx.quadraticCurveTo(HW * 0.8, mouthTopY + 18 + gape * 0.55, jawPivotX + 16, mouthTopY + 18 + gape * 0.8);
      ctx.closePath();
      ctx.fill();
      // Tongue: a dark muscular curl at the floor of the mouth.
      ctx.fillStyle = '#8f1220';
      ctx.beginPath();
      ctx.ellipse(jawPivotX + 44, mouthTopY + 16 + gape * 0.5, 26 + j * 8, 8 + j * 5, 0.15, 0, Math.PI * 2);
      ctx.fill();
      // Gum line.
      ctx.strokeStyle = gum;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(jawPivotX + 6, mouthTopY + 9);
      ctx.quadraticCurveTo(HW * 0.85, mouthTopY - 1 + j * -5, HW - 4, noseY + 15);
      ctx.stroke();
    }


    // UPPER TEETH: a row of triangles hanging from the upper jaw.
    const upperTeeth = 9;
    for (let t = 0; t < upperTeeth; t++) {
      const f = t / (upperTeeth - 1);
      const tx = jawPivotX + 12 + (HW - jawPivotX - 16) * f;
      const tyCurve = mouthTopY + 4 - Math.sin(f * Math.PI) * 6 + j * f * -4;
      const tlen = 8 + f * 8 + j * 3;
      ctx.fillStyle = tooth;
      ctx.strokeStyle = 'rgba(16, 24, 43, 0.55)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(tx - 4.5, tyCurve);
      ctx.lineTo(tx + 4.5, tyCurve);
      ctx.lineTo(tx + (t % 2) * 2 - 1, tyCurve + tlen);
      ctx.closePath();
      ctx.fill(); ctx.stroke();
    }
    // LOWER TEETH: they ride the dropped jaw, pointing up into the gape.
    if (j > 0.05) {
      const lowerTeeth = 8;
      for (let t = 0; t < lowerTeeth; t++) {
        const f = t / (lowerTeeth - 1);
        const tx = jawPivotX + 18 + (HW - jawPivotX - 24) * f;
        const tyCurve = mouthTopY + 17 + gape * (0.55 + f * 0.4) - Math.sin(f * Math.PI) * 4;
        const tlen = 7 + f * 7 + j * 3;
        ctx.fillStyle = tooth;
        ctx.strokeStyle = 'rgba(16, 24, 43, 0.55)';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(tx - 4, tyCurve);
        ctx.lineTo(tx + 4, tyCurve);
        ctx.lineTo(tx + (t % 2) * 2 - 1, tyCurve - tlen);
        ctx.closePath();
        ctx.fill(); ctx.stroke();
      }
      // The jaw itself: a heavy slab under the lower teeth.
      ctx.fillStyle = hideMid;
      ctx.strokeStyle = outline;
      ctx.lineWidth = 3.5;
      ctx.beginPath();
      ctx.moveTo(jawPivotX + 6, mouthTopY + 18 + gape);
      ctx.quadraticCurveTo(HW * 0.84, mouthTopY + 22 + gape * 0.75, HW - 4, noseY + 18 + j * 10);
      ctx.quadraticCurveTo(HW * 0.85, mouthTopY + 34 + gape * 0.9, jawPivotX + 14, mouthTopY + 34 + gape * 1.1);
      ctx.closePath();
      ctx.fill(); ctx.stroke();
    } else {
      // Closed-mouth lip line with a few teeth peeking through — the
      // reference's resting snarl.
      ctx.strokeStyle = outline;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(jawPivotX + 6, mouthTopY + 12);
      ctx.quadraticCurveTo(HW * 0.86, mouthTopY + 4, HW - 2, noseY + 5);
      ctx.stroke();
      ctx.fillStyle = tooth;
      for (let t = 0; t < 4; t++) {
        const f = 0.35 + t * 0.17;
        const tx = jawPivotX + 12 + (HW - jawPivotX - 16) * f;
        const ty = mouthTopY + 9 - Math.sin(f * Math.PI) * 4;
        ctx.beginPath();
        ctx.moveTo(tx - 2.5, ty);
        ctx.lineTo(tx + 2.5, ty);
        ctx.lineTo(tx, ty + 5);
        ctx.closePath();
        ctx.fill();
      }
    }
    // Nostril slit near the snout tip.
    ctx.fillStyle = 'rgba(16, 24, 43, 0.8)';
    ctx.beginPath();
    ctx.ellipse(HW - 14, noseY + 9, 3, 2, 0.3, 0, Math.PI * 2);
    ctx.fill();


    // ====================================================================
    // 9. PHASE FLARE + HIT FLASH + the always-balanced restore.
    // ====================================================================
    if (this.phaseFlash > 0) {
      ctx.globalAlpha = Math.min(0.5, this.phaseFlash * 0.35);
      ctx.fillStyle = ph === 3 ? '#fef2f2' : ph === 2 ? '#fee2e2' : '#ffffff';
      ctx.fillRect(-HW - 30, -HH - 90, this.width + 60, this.height + 170);
      ctx.globalAlpha = 1;
    }
    ctx.restore();
    // Hit flash: whole-silhouette white, same as every other boss.
    if (this.hitFlash > 0) {
      ctx.save();
      ctx.globalAlpha = Math.min(0.55, this.hitFlash * 3);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(P(x - 20), P(y - 10), this.width + 40, this.height + 20);
      ctx.restore();
    }

    // Blood-cloud stains on the arena floor: the record of every slam,
    // drawn in world space so they persist after the beast swims on.
    for (let i = this.stainPools.length - 1; i >= 0; i--) {
      const s = this.stainPools[i];
      const fade = 1 - s.t / s.life;
      const open = 0.5 + 0.5 * Math.min(1, s.t / s.peak);
      const rNow = s.r * (0.55 + 0.45 * open) * Math.min(1, fade * 1.3);
      ctx.globalAlpha = Math.min(0.5, (0.18 + 0.32 * open) * fade);
      ctx.fillStyle = '#3f0d14';
      ctx.beginPath();
      ctx.arc(s.x - camera.x, s.y - camera.y, rNow, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = 'rgba(248, 113, 113, 0.16)';
      ctx.beginPath();
      ctx.arc(s.x - camera.x, s.y - camera.y, rNow * 0.6, 0, Math.PI * 2);
      ctx.fill();
    }
    if (this.stainPools.length) ctx.globalAlpha = 1;
  }
}

// The game spawns `new Kraken(...)` in several places (terraria.js, the QA
// suites, the app.py probe). Keep both names pointing at the same class so
// saves, the boss panel, the victory hooks and the deploy probe all resolve.
window.Megalodon = Megalodon;
window.Kraken = Megalodon;
// Back-compat alias: older hooks that named the class OceanLeviathan.
window.OceanLeviathan = Megalodon;

window.OceanFish = OceanFish;
