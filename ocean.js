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
  WRECK_MAST: 85,
  // ---- Abyssal sea ores. Four tiers of ocean-themed metal, found ONLY in the
  // rock UNDER the abyssal planet's seabed. Rarer and richer the deeper you
  // dig: brine (shallow) -> abyssal -> tidesteel -> leviathan (bottom). Each is
  // placeable and drops its material when mined. --------------------------
  BRINE_ORE: 86,
  ABYSS_ORE: 87,
  TIDE_ORE: 88,
  LEVIATHAN_ORE: 89
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
TILES.BRINE_ORE = OCEAN_TILES.BRINE_ORE;
TILES.ABYSS_ORE = OCEAN_TILES.ABYSS_ORE;
TILES.TIDE_ORE = OCEAN_TILES.TIDE_ORE;
TILES.LEVIATHAN_ORE = OCEAN_TILES.LEVIATHAN_ORE;

Object.assign(TILE_PROPERTIES, {
  // Sacred Pearl: light was 11, which turned every pearl into a lighthouse
  // visible across the map — the opposite of a secret. 4 is a local glimmer
  // you only see once you are already down there.
  [OCEAN_TILES.PEARL]: { solid: true, light: 4, color: '#67e8f9', name: 'Sacred Pearl', drops: { id: 'sacred_pearl', count: 1 } },
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
  [OCEAN_TILES.WRECK_MAST]: { solid: false, light: 0, color: '#7c5a3a', name: 'Broken Mast', isPlatform: true, drops: { id: 'wood', count: 3 } },
  // The abyssal sea ores. Leviathan ore glows faintly so the bottom of the
  // mine is findable; the rest are lit by the player's own light.
  [OCEAN_TILES.BRINE_ORE]: { solid: true, light: 0, color: '#cbd5e1', name: 'Brine Ore', drops: { id: 'brine_ore', count: 1 } },
  [OCEAN_TILES.ABYSS_ORE]: { solid: true, light: 1, color: '#312e81', name: 'Abyssal Ore', drops: { id: 'abyss_ore', count: 1 } },
  [OCEAN_TILES.TIDE_ORE]: { solid: true, light: 2, color: '#0ea5e9', name: 'Tidesteel Ore', drops: { id: 'tide_ore', count: 1 } },
  [OCEAN_TILES.LEVIATHAN_ORE]: { solid: true, light: 3, color: '#67e8f9', name: 'Leviathan Ore', drops: { id: 'leviathan_ore', count: 1 } }
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
    // ---- The Tide Gate has TWO hand-drawn identities ----------------------
    // Both are tile art because the gate is 4 tiles tall, but they are
    // deliberately different worlds: the reef's gate in the overworld is a
    // whirlpool throat cut into marble (matches its arch), while the gate in
    // the abyssal planet — the one you came through to get home — is a torn
    // kelp rift wrapped in bioluminescent fronds. Same tile, opposite sides of
    // the same door, so a player always knows at a glance which way is home.
    const homeGate = inOceanDim;
    if (homeGate) {
      // ---------- ABYSS RIFT: a kelp-wound tear in the water ----------
      // Deep indigo core, a torn rim, and curling fronds with lit tips that
      // breathe on a slow cycle. Nothing here resembles the reef's teal
      // whirlpool, and nothing resembles the Ossuary's violet wormhole.
      const t = Date.now() * 0.001;
      const breathe = 0.5 + 0.5 * Math.sin(t * 1.3 + ty * 0.4);
      // Water displaced around the rift: a soft dark halo.
      ctx.fillStyle = 'rgba(4, 12, 26, 0.55)';
      ctx.fillRect(sx + 1, sy, 22, TILE_SIZE);
      // The tear itself.
      ctx.fillStyle = '#0b1024';
      ctx.beginPath();
      ctx.ellipse(sx + 12, sy + 12, 7, 11, Math.sin(t * 0.6) * 0.08, 0, Math.PI * 2);
      ctx.fill();
      // Inner glow welling up from the deep: two rings, the inner hotter.
      const g1 = ctx.createRadialGradient(sx + 12, sy + 12, 1, sx + 12, sy + 12, 9);
      g1.addColorStop(0, `rgba(99, 102, 241, ${(0.5 + breathe * 0.3).toFixed(2)})`);
      g1.addColorStop(0.6, 'rgba(30, 27, 75, 0.55)');
      g1.addColorStop(1, 'rgba(4, 12, 26, 0)');
      ctx.fillStyle = g1;
      ctx.fillRect(sx + 2, sy + 1, 20, 22);
      // Kelp fronds: four curving strands hugging the rim, lit at their tips.
      for (let f = 0; f < 4; f++) {
        const side = f % 2 === 0 ? -1 : 1;
        const y0 = sy + 3 + f * 5;
        const sway = Math.sin(t * 1.1 + f * 1.7) * 2.2;
        ctx.strokeStyle = f === 1 ? '#0f766e' : '#115e59';
        ctx.lineWidth = 2.4;
        ctx.beginPath();
        ctx.moveTo(sx + 12 + side * 8, y0);
        ctx.quadraticCurveTo(sx + 12 + side * (11 + sway), y0 + 3, sx + 12 + side * 9, y0 + 7);
        ctx.stroke();
        // Bioluminescent tip, phased so the fronds shimmer independently.
        ctx.fillStyle = `rgba(45, 212, 191, ${(0.45 + 0.45 * Math.sin(t * 2.2 + f)).toFixed(2)})`;
        ctx.fillRect(sx + 12 + side * 9 - 1, y0 + 6, 2, 2);
      }
      // Motes drawn toward the rift: three dots drifting inward.
      for (let m = 0; m < 3; m++) {
        const p = (t * 0.5 + m / 3) % 1;
        const ang = m * 2.1 + t * 0.4;
        const mr = 9 - p * 6;
        ctx.fillStyle = `rgba(153, 246, 228, ${(0.5 * (1 - p)).toFixed(2)})`;
        ctx.fillRect(sx + 12 + Math.cos(ang) * mr, sy + 12 + Math.sin(ang) * mr * 1.4, 1, 1);
      }
      // A hard rim highlight so the tear reads as a surface, not a smudge.
      ctx.strokeStyle = `rgba(94, 234, 212, ${(0.5 + breathe * 0.25).toFixed(2)})`;
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.ellipse(sx + 12, sy + 12, 7, 11, 0, Math.PI * 1.05, Math.PI * 1.95);
      ctx.stroke();
      return;
    }
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
  } else if (tile === OCEAN_TILES.BRINE_ORE || tile === OCEAN_TILES.ABYSS_ORE
      || tile === OCEAN_TILES.TIDE_ORE || tile === OCEAN_TILES.LEVIATHAN_ORE) {
    // ---- THE ABYSSAL SEA ORES. Each is drawn as the abyssal stone with a
    // cluster of crystal nodules in its own colour, and the richer tiers get a
    // self-lit glow so a deep seam is findable in the dark.
    const isLevi = tile === OCEAN_TILES.LEVIATHAN_ORE;
    const isTide = tile === OCEAN_TILES.TIDE_ORE;
    const isAbyss = tile === OCEAN_TILES.ABYSS_ORE;
    // Base: the same dark seabed stone the ocean dimension uses.
    ctx.fillStyle = '#141d26';
    ctx.fillRect(sx, sy, TILE_SIZE, TILE_SIZE);
    if (exposedTop) {
      ctx.fillStyle = '#1f2c38';
      ctx.fillRect(sx, sy, TILE_SIZE, 3);
    }
    const oreCol = isLevi ? '#67e8f9' : isTide ? '#0ea5e9'
      : isAbyss ? '#4338ca' : '#e2e8f0';
    const oreLit = isLevi ? '#cffafe' : isTide ? '#7dd3fc'
      : isAbyss ? '#818cf8' : '#ffffff';
    // A soft glow halo on the two richest tiers.
    if (isLevi || isTide) {
      ctx.fillStyle = isLevi
        ? `rgba(103,232,249,${(0.10 + pulse * 0.10).toFixed(3)})`
        : `rgba(14,165,233,${(0.07 + pulse * 0.06).toFixed(3)})`;
      ctx.beginPath();
      ctx.arc(sx + 12, sy + 12, 11, 0, Math.PI * 2);
      ctx.fill();
    }
    // Nodule cluster: three or four chunky crystals, deterministic per tile.
    const nodes = [
      [(tx * 5 + ty * 3) % 8 + 5, (tx * 3 + ty * 7) % 8 + 4, 4],
      [(tx * 7 + ty * 11) % 9 + 11, (tx * 13 + ty * 5) % 8 + 6, 3],
      [(tx * 11 + ty * 2) % 8 + 4, (tx * 5 + ty * 13) % 7 + 13, 3]
    ];
    if (isLevi) nodes.push([(tx * 3 + ty * 9) % 7 + 13, (tx * 7 + ty * 3) % 6 + 14, 2]);
    for (const [ox, oy, rr] of nodes) {
      ctx.fillStyle = oreCol;
      ctx.beginPath();
      ctx.moveTo(sx + ox, sy + oy - rr);
      ctx.lineTo(sx + ox + rr, sy + oy);
      ctx.lineTo(sx + ox, sy + oy + rr);
      ctx.lineTo(sx + ox - rr, sy + oy);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = oreLit;
      ctx.fillRect(sx + ox - 1, sy + oy - 1, 2, 2);
    }
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
  const t = Date.now() * 0.001;
  const pulse = 0.72 + Math.sin(t * 3) * 0.18;
  const rx = TILE_SIZE * 1.25;
  const ry = TILE_SIZE * 1.8;
  ctx.save();
  ctx.globalAlpha = active ? 1 : 0.92;
  // Arch silhouette — the dark stone column the gate is cut into.
  ctx.fillStyle = '#071b2b';
  ctx.beginPath();
  ctx.moveTo(cx - rx, cy + ry);
  ctx.lineTo(cx - rx, cy - ry * 0.38);
  ctx.quadraticCurveTo(cx - rx, cy - ry, cx, cy - ry);
  ctx.quadraticCurveTo(cx + rx, cy - ry, cx + rx, cy - ry * 0.38);
  ctx.lineTo(cx + rx, cy + ry);
  ctx.closePath();
  ctx.fill();

  if (active) {
    // ---- ACTIVE: a whirlpool throat, not a flat teal gradient. ----
    ctx.save();
    ctx.beginPath();
    ctx.ellipse(cx, cy, rx * 0.72, ry * 0.82, 0, 0, Math.PI * 2);
    ctx.clip();
    const throat = ctx.createRadialGradient(cx, cy, 2, cx, cy, rx * 0.9);
    throat.addColorStop(0, '#01060e');
    throat.addColorStop(0.55, '#063252');
    throat.addColorStop(1, '#0a4a68');
    ctx.fillStyle = throat;
    ctx.fillRect(cx - rx * 2, cy - ry * 2, rx * 4, ry * 4);
    // Caustic light sinking through the water column.
    ctx.globalCompositeOperation = 'lighter';
    for (let i = 0; i < 5; i++) {
      const band = (t * 0.35 + i * 0.21) % 1;
      ctx.globalAlpha = 0.16 * Math.sin(band * Math.PI);
      ctx.fillStyle = '#38bdf8';
      ctx.fillRect(cx - rx * 2, cy - ry + band * ry * 2, rx * 4, 3);
    }
    // Three spiral arms winding INTO the centre — the gate is always turning.
    for (let arm = 0; arm < 3; arm++) {
      const base = t * 1.6 + (arm / 3) * Math.PI * 2;
      ctx.globalAlpha = arm === 1 ? 0.6 : 0.42;
      ctx.strokeStyle = arm === 1 ? '#a5f3fc' : '#67e8f9';
      ctx.lineWidth = arm === 1 ? 3 : 2;
      ctx.beginPath();
      for (let s = 0; s <= 1.0001; s += 0.04) {
        const ang = base + s * 3.4;
        const rad = (1 - s * 0.82) * rx * 0.7;
        const px2 = cx + Math.cos(ang) * rad;
        const py2 = cy + Math.sin(ang) * rad * 1.14;
        if (s === 0) ctx.moveTo(px2, py2); else ctx.lineTo(px2, py2);
      }
      ctx.stroke();
    }
    // Foam streaks skating round the rim of the whirl.
    ctx.globalAlpha = 0.5 + Math.sin(t * 5) * 0.2;
    ctx.strokeStyle = 'rgba(236, 254, 255, 0.75)';
    ctx.lineWidth = 1.6;
    for (let i = 0; i < 6; i++) {
      const a0 = t * 0.9 + i * 1.05;
      ctx.beginPath();
      ctx.arc(cx, cy, rx * 0.55, a0, a0 + 0.5);
      ctx.stroke();
    }
    // Pearl bloom at the heart.
    const bloom = ctx.createRadialGradient(cx, cy, 0, cx, cy, rx * 0.55);
    bloom.addColorStop(0, `rgba(207,250,254,${(0.35 + Math.sin(t * 4) * 0.12).toFixed(3)})`);
    bloom.addColorStop(1, 'rgba(34,211,238,0)');
    ctx.fillStyle = bloom;
    ctx.fillRect(cx - rx, cy - ry, rx * 2, ry * 2);
    ctx.restore();

    // ---- Rim: foam-crest arch stroke + inner whirl lines (was one stroke).
    ctx.lineWidth = 5;
    ctx.strokeStyle = `rgba(103,232,249,${pulse})`;
    ctx.beginPath();
    ctx.moveTo(cx - rx, cy + ry);
    ctx.lineTo(cx - rx, cy - ry * 0.38);
    ctx.quadraticCurveTo(cx - rx, cy - ry, cx, cy - ry);
    ctx.quadraticCurveTo(cx + rx, cy - ry, cx + rx, cy - ry * 0.38);
    ctx.lineTo(cx + rx, cy + ry);
    ctx.stroke();
    ctx.lineWidth = 2.5;
    ctx.strokeStyle = `rgba(255,255,255,${pulse})`;
    ctx.beginPath();
    ctx.ellipse(cx, cy, rx * 0.72, ry * 0.82, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.lineWidth = 1.4;
    ctx.strokeStyle = `rgba(165,243,252,${0.45 + Math.sin(t * 6) * 0.25})`;
    ctx.beginPath();
    ctx.ellipse(cx, cy, rx * 0.58, ry * 0.7, 0, 0, Math.PI * 2);
    ctx.stroke();
    // Corner shrine lights, breathing.
    for (const [dx, dy] of [[0, -ry + 8], [-rx + 5, 0], [rx - 5, 0], [0, ry - 6]]) {
      ctx.globalAlpha = 0.6 + Math.sin(t * 4 + dx * 0.2) * 0.35;
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(cx + dx - 2, cy + dy - 2, 4, 4);
    }
    ctx.globalAlpha = 1;
  } else {
    // ---- DORMANT: a sealed slate door. It should read as "not yet". ----
    const portalGradient = ctx.createLinearGradient(cx - rx, cy, cx + rx, cy);
    portalGradient.addColorStop(0, '#0f172a');
    portalGradient.addColorStop(0.5, '#1e293b');
    portalGradient.addColorStop(1, '#0f172a');
    ctx.fillStyle = portalGradient;
    ctx.beginPath();
    ctx.ellipse(cx, cy, rx * 0.72, ry * 0.82, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.lineWidth = 5;
    ctx.strokeStyle = '#94a3b8';
    ctx.beginPath();
    ctx.moveTo(cx - rx, cy + ry);
    ctx.lineTo(cx - rx, cy - ry * 0.38);
    ctx.quadraticCurveTo(cx - rx, cy - ry, cx, cy - ry);
    ctx.quadraticCurveTo(cx + rx, cy - ry, cx + rx, cy - ry * 0.38);
    ctx.lineTo(cx + rx, cy + ry);
    ctx.stroke();
    ctx.lineWidth = 2;
    ctx.strokeStyle = '#0e7490';
    ctx.beginPath();
    ctx.ellipse(cx, cy, rx * 0.72, ry * 0.82, 0, 0, Math.PI * 2);
    ctx.stroke();
    // The sealed seam down the middle.
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(cx, cy - ry * 0.6);
    ctx.lineTo(cx, cy + ry * 0.7);
    ctx.stroke();
    ctx.fillStyle = '#cbd5e1';
    for (const [dx, dy] of [[0, -ry + 8], [-rx + 5, 0], [rx - 5, 0], [0, ry - 6]]) {
      ctx.fillRect(cx + dx - 2, cy + dy - 2, 4, 4);
    }
  }
  ctx.restore();
};

// ============================================================
// THE ABYSSAL GATE — the Tide Gate's own crossing animation
// ============================================================
// Walking into the Tide Gate (and out of it, on the far side) used to run the
// Void Rift's WormholeFX, so the deep-sea door tore open exactly like the sky
// above the Ossuary. This is the crossing the Abyssal Planet deserves: a
// maelstrom instead of a black hole — water that BREATHES rather than gravity
// that pulls.
//
// Deliberately the opposite of the wormhole in every read:
//   * a tall mouth whose silhouette ripples like a disturbed water surface
//     (not a smooth event horizon), with a luminous teal throat instead of a
//     perfectly black core
//   * foam ripples that wave OUTWARD — the wormhole's debris falls inward
//   * bubbles that climb out of the gate — the wormhole's dust orbits it
//   * three slow ink tendrils curling round the rim: the Kraken's colour
//   * a tidal pull that yanks in SURGES with a side-to-side undertow sway,
//     not one tight accelerating spiral
//
// Same contract as WormholeFX — constructor(x, y, opts), phase, playerScale,
// playerSpin, update()/render()/renderScreenOverlay() — so Game.openWormhole,
// the player-transform pass and the screen overlay all drive it identically.
class AbyssalGateFX {
  constructor(x, y, opts = {}) {
    this.x = x;
    this.y = y;
    this.radius = 0;
    this.maxRadius = opts.maxRadius || 175;
    this.phase = 'open';
    this.timer = 0;
    this.t = 0;
    this.durations = { open: 1.20, suck: 2.05, collapse: 0.60 };
    this.pullRadius = 700;
    this.done = false;
    this.flash = 0;
    this.squash = 1;       // vertical fold factor — the collapse closes flat
    this.surge = 0;        // 0..1 strength of the current's latest yank
    this.playerSpin = 0;
    this.playerScale = 1;
    this.ripples = [];     // foam rings expanding away from the mouth
    this.bubbles = [];     // bubbles climbing out of the gate
    this.rippleClock = 0;
    // Repeat crossings are quicker, exactly like the charged rift: a player
    // hopping back and forth for gear should not replay the full cinematic.
    this.charged = !!opts.charged;
    if (this.charged) {
      this.durations = { open: 0.62, suck: 1.05, collapse: 0.34 };
      this.maxRadius *= 1.1;
    }
  }

  get totalDuration() {
    return this.durations.open + this.durations.suck + this.durations.collapse;
  }

  /**
   * Advance the crossing. Returns 'done' on the frame the gate folds shut, so
   * the Game can swap dimensions while the screen is still washed out.
   */
  update(dt, player, particleSystem) {
    this.timer += dt;
    this.t += dt;
    this.flash = Math.max(0, this.flash - dt * 2.2);
    this.updateWater(dt, particleSystem);

    if (this.phase === 'open') {
      const t = Math.min(1, this.timer / this.durations.open);
      // A swell, not an inflate: it surges past its size, sloshes back and
      // settles — water never opens on a clean ease curve.
      const eased = 1 - Math.pow(1 - t, 3);
      this.radius = this.maxRadius * (eased + Math.sin(t * Math.PI * 2) * 0.1 * (1 - t));
      if (particleSystem) {
        for (let i = 0; i < 2; i++) {
          const a = Math.random() * Math.PI * 2;
          const r = this.radius * (0.5 + Math.random() * 0.6);
          particleSystem.addParticle(
            this.x + Math.cos(a) * r, this.y + Math.sin(a) * r,
            Math.cos(a) * 1.5, -1.8 - Math.random() * 2.4,
            Math.random() < 0.5 ? '#a5f3fc' : '#e0f2fe',
            2 + Math.random() * 2, 1.1, -0.02, true
          );
        }
      }
      if (t >= 1) { this.phase = 'suck'; this.timer = 0; }
      return null;
    }

    if (this.phase === 'suck') {
      const p = Math.min(1, this.timer / this.durations.suck);
      // The gate gulps: a slow double pulse per cycle is what makes it read
      // as water swallowing rather than a hole narrowing.
      this.surge = Math.pow(Math.max(0, Math.sin(this.timer * 3.1)), 2);
      this.radius = this.maxRadius * (1 - p * 0.16) * (1 + Math.sin(this.timer * 7) * 0.035);
      this.pull(dt, player, particleSystem);
      if (p >= 1) { this.phase = 'collapse'; this.timer = 0; }
      return null;
    }

    // ---- collapse ----
    const t = Math.min(1, this.timer / this.durations.collapse);
    // The mouth does not slam shut like a trap — it folds flat like a wave
    // curling over, going thin vertically before it goes narrow.
    this.squash = Math.pow(1 - t, 1.6);
    this.radius = this.maxRadius * (1 - t * 0.35);
    this.flash = Math.max(this.flash, 0.3 + t * 0.7);
    this.playerScale = Math.max(0.04, this.playerScale * (1 - dt * 3.2));
    if (particleSystem) {
      for (let i = 0; i < 7; i++) {
        const a = Math.random() * Math.PI * 2;
        particleSystem.addParticle(
          this.x + Math.cos(a) * this.radius, this.y + Math.sin(a) * this.radius,
          Math.cos(a) * 6, Math.sin(a) * 6 - 3,
          Math.random() < 0.5 ? '#ffffff' : '#a5f3fc',
          2.5, 0.5, -0.05, true
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
   * Haul the player in on the tide. The current arrives in SURGES (this.surge
   * pulses about twice a second) and swings them side to side as it goes, so
   * the path into the gate is an undulating drag — a spiral would just be the
   * wormhole again.
   */
  pull(dt, player, particleSystem) {
    if (!player) return;
    const px = player.x + player.width / 2;
    const py = player.y + player.height / 2;
    const dx = this.x - px;
    const dy = this.y - py;
    const dist = Math.hypot(dx, dy) || 1;
    const closeness = 1 - Math.max(0, Math.min(1, dist / this.pullRadius));
    const nx = dx / dist;
    const ny = dy / dist;
    const inward = (85 + closeness * closeness * 1350) * dt * (0.35 + this.surge * 1.6);
    const sway = Math.sin(this.timer * 3.6) * (95 + closeness * 400) * dt;
    // Inward along the current, plus a perpendicular undertow swing.
    player.x += nx * inward - ny * sway;
    player.y += ny * inward + nx * sway;
    player.vx = nx * 5;
    player.vy = ny * 5;
    // A slow, watery tumble — lazy, not the wormhole's tight screw-in.
    this.playerSpin += dt * (1.3 + closeness * 5);
    this.playerScale = Math.max(0.06, Math.min(1, dist / (this.pullRadius * 0.5)));
    if (particleSystem) {
      // Sea foam clinging to them as the current hauls them in.
      particleSystem.addParticle(
        px + (Math.random() - 0.5) * 16, py + (Math.random() - 0.5) * 22,
        -nx * 2.4 + (Math.random() - 0.5), -ny * 2.4 - 0.9,
        Math.random() < 0.5 ? '#e0f2fe' : '#67e8f9',
        2 + Math.random() * 2, 0.5, -0.03, true
      );
    }
  }

  /** Ripple rings leaving the mouth + bubbles climbing out of it. */
  updateWater(dt, particleSystem) {
    // Ripples wave OUTWARD — water answers a disturbance by spreading it,
    // the exact opposite of the wormhole's infalling debris.
    this.rippleClock -= dt;
    if (this.rippleClock <= 0 && this.phase !== 'collapse' && this.radius > 8) {
      this.rippleClock = 0.3;
      this.ripples.push({
        r: this.radius * 0.5, life: 1.25, maxLife: 1.25,
        lobe: 3 + Math.floor(Math.random() * 3), wob: Math.random() * Math.PI * 2
      });
    }
    for (let i = this.ripples.length - 1; i >= 0; i--) {
      const rp = this.ripples[i];
      rp.r += (95 + this.radius * 0.5) * dt;
      rp.life -= dt;
      if (rp.life <= 0) this.ripples.splice(i, 1);
    }
    if (this.bubbles.length < 32 && this.phase !== 'collapse' && this.radius > 8) {
      const a = Math.random() * Math.PI * 2;
      this.bubbles.push({
        x: this.x + Math.cos(a) * this.radius * 0.9,
        y: this.y + Math.sin(a) * this.radius * this.squash,
        vy: -(18 + Math.random() * 44),
        sway: Math.random() * Math.PI * 2,
        swayAmp: 5 + Math.random() * 14,
        size: 1.3 + Math.random() * 3.2,
        life: 1.3 + Math.random() * 1.5
      });
    }
    for (let i = this.bubbles.length - 1; i >= 0; i--) {
      const b = this.bubbles[i];
      b.y += b.vy * dt;
      b.sway += dt * 3.2;
      b.life -= dt;
      if (b.life <= 0 || b.y < this.y - this.radius * 3) {
        if (particleSystem && b.life <= 0) {
          // Popped: a speck of foam where the bubble was.
          particleSystem.addParticle(b.x, b.y, 0, -1, '#e0f9ff', 1.6, 0.3, 0, true);
        }
        this.bubbles.splice(i, 1);
      }
    }
  }
  /**
   * World-space draw, in strict hierarchy so it never reads as clutter:
   * bloom → geyser → tendrils → whirlpool throat → ripples/bubbles →
   * updraft sheets → foam crest. One focal point (the spinning throat), one
   * silhouette (the scalloped crest), everything else supports them.
   */
  render(ctx, camera) {
    if (this.radius <= 0.5) return;
    const cx = this.x - camera.x;
    const cy = this.y - camera.y;
    const R = this.radius;
    const rx = R;
    const ry = R * 1.22 * this.squash;
    const t = this.t;

    ctx.save();

    // 1. Wet halo — one wide teal bloom so the gate reads from off-screen.
    ctx.globalCompositeOperation = 'lighter';
    const halo = ctx.createRadialGradient(cx, cy, R * 0.3, cx, cy, R * 2.3);
    halo.addColorStop(0, `rgba(34,211,238,${(0.5 + Math.sin(t * 2.4) * 0.12).toFixed(3)})`);
    halo.addColorStop(0.45, 'rgba(8,145,178,0.24)');
    halo.addColorStop(1, 'rgba(2,6,23,0)');
    ctx.fillStyle = halo;
    ctx.fillRect(cx - R * 2.3, cy - R * 2.3, R * 4.6, R * 4.6);

    // 2. Open-phase geyser: the gate doesn't just appear — it BLOWS a column
    //    of water skyward as it tears open, then the column collapses into
    //    the mouth. This is the moment that sells the crossing.
    if (this.phase === 'open') {
      const k = Math.min(1, this.timer / this.durations.open);
      const colH = R * 2.6 * (1 - Math.pow(1 - k, 3));
      const colW = R * 0.75 * (1 - k * 0.4);
      for (let i = -2; i <= 2; i++) {
        const off = i * colW * 0.42;
        ctx.globalAlpha = (1 - k) * 0.55;
        ctx.strokeStyle = i === 0 ? '#e0f9ff' : '#67e8f9';
        ctx.lineWidth = i === 0 ? 7 : 4;
        ctx.beginPath();
        ctx.moveTo(cx + off, cy - R * 0.4);
        ctx.quadraticCurveTo(cx + off * 1.6, cy - colH * 0.6, cx + off * 2.4, cy - colH);
        ctx.stroke();
      }
      ctx.globalAlpha = 1;
    }

    // 3. Ink tendrils, BEHIND the throat: their inner halves disappear into
    //    the gate, so they read as swimming out from behind it.
    ctx.globalCompositeOperation = 'source-over';
    ctx.globalAlpha = 1;
    for (let i = 0; i < 2; i++) {
      const dir = i ? -1 : 1;
      const phase = t * 0.62 * dir + i * 2.4;
      this._tendril(ctx, cx, cy, R, phase, dir, 'rgba(4,10,26,0.5)', 0.22);
      this._tendril(ctx, cx, cy, R, phase, dir, 'rgba(56,189,248,0.3)', 0.07);
    }

    // 4. THE THROAT: a rotating whirlpool in the same language as the static
    //    Tide Gate — watching the door and stepping through it are one idea.
    ctx.save();
    this._mouthPath(ctx, cx, cy, rx, ry, t);
    ctx.clip();
    const throat = ctx.createRadialGradient(cx, cy, 2, cx, cy, rx);
    throat.addColorStop(0, '#01060e');
    throat.addColorStop(0.55, '#063252');
    throat.addColorStop(1, '#0a4a68');
    ctx.globalAlpha = 1;
    ctx.fillStyle = throat;
    ctx.fillRect(cx - rx * 1.6, cy - ry * 1.6, rx * 3.2, ry * 3.2);
    ctx.globalCompositeOperation = 'lighter';
    for (let i = 0; i < 5; i++) {
      const band = (t * 0.5 + i * 0.2) % 1;
      ctx.globalAlpha = 0.2 * Math.sin(band * Math.PI);
      ctx.fillStyle = '#38bdf8';
      ctx.fillRect(cx - rx * 1.6, cy - ry + band * ry * 2, rx * 3.2,
        3 + Math.sin(t * 3 + i) * 2);
    }
    // Four spiral arms winding INTO the centre — visibly faster while the
    // current is hauling.
    const spin = this.phase === 'suck' ? 2.4 : 1.5;
    for (let arm = 0; arm < 4; arm++) {
      const base = t * spin + (arm / 4) * Math.PI * 2;
      ctx.globalAlpha = arm % 2 ? 0.55 : 0.36;
      ctx.strokeStyle = arm % 2 ? '#a5f3fc' : '#67e8f9';
      ctx.lineWidth = arm % 2 ? 3.5 : 2;
      ctx.beginPath();
      for (let s = 0; s <= 1.0001; s += 0.04) {
        const ang = base + s * 3.2;
        const rad = (1 - s * 0.85) * rx * 0.95;
        const px = cx + Math.cos(ang) * rad;
        const py = cy + Math.sin(ang) * rad * 1.12;
        if (s === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
      }
      ctx.stroke();
    }
    const bloom = ctx.createRadialGradient(cx, cy, 0, cx, cy, rx * 0.6);
    bloom.addColorStop(0, `rgba(207,250,254,${(0.55 + Math.sin(t * 4) * 0.15).toFixed(3)})`);
    bloom.addColorStop(1, 'rgba(34,211,238,0)');
    ctx.globalAlpha = 1;
    ctx.fillStyle = bloom;
    ctx.fillRect(cx - rx * 1.6, cy - ry * 1.6, rx * 3.2, ry * 3.2);
    ctx.restore();
    // 5. Outward foam ripples: water answering the wound by spreading it.
    ctx.globalCompositeOperation = 'lighter';
    for (const rp of this.ripples) {
      const k = 1 - rp.life / rp.maxLife;
      ctx.globalAlpha = Math.max(0, (1 - k) * 0.5);
      ctx.strokeStyle = k < 0.5 ? '#e0f9ff' : '#67e8f9';
      ctx.lineWidth = Math.max(0.6, 3.2 * (1 - k));
      ctx.beginPath();
      for (let s = 0; s <= 64; s++) {
        const a = (s / 64) * Math.PI * 2;
        const wob = 1 + Math.sin(a * rp.lobe + rp.wob + t * 3) * 0.07;
        const px = cx + Math.cos(a) * rp.r * wob;
        const py = cy + Math.sin(a) * rp.r * wob * 0.88;
        if (s === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
      }
      ctx.closePath();
      ctx.stroke();
    }

    // 6. Bubbles climbing out, over the throat.
    ctx.globalCompositeOperation = 'source-over';
    for (const b of this.bubbles) {
      const bx = b.x - camera.x + Math.sin(b.sway) * b.swayAmp;
      const by = b.y - camera.y;
      const alpha = Math.max(0, Math.min(1, b.life / 0.8)) * 0.8;
      ctx.globalAlpha = alpha;
      ctx.strokeStyle = '#d8f7ff';
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.arc(bx, by, b.size, 0, Math.PI * 2);
      ctx.stroke();
      ctx.globalAlpha = alpha * 0.35;
      ctx.fillStyle = '#a5f3fc';
      ctx.fill();
      ctx.globalAlpha = alpha;
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(bx - b.size * 0.35, by - b.size * 0.35, Math.max(0.6, b.size * 0.3), 0, Math.PI * 2);
      ctx.fill();
    }

    // 7. UPDRAFT SHEETS: ribbons of water streaming past the gate — pulled
    //    upward while it opens, dragged inward once the current takes over.
    ctx.globalCompositeOperation = 'lighter';
    for (let i = 0; i < 6; i++) {
      const side = i % 2 ? 1 : -1;
      const lane = side * (R * (0.78 + (i % 3) * 0.26));
      const flow = (t * (120 + i * 26) + i * 53) % (R * 2.4);
      const y0 = cy + R * 1.2 - flow;
      ctx.globalAlpha = 0.3;
      ctx.strokeStyle = i % 2 ? '#a5f3fc' : '#e0f9ff';
      ctx.lineWidth = 2 + (i % 3);
      ctx.beginPath();
      ctx.moveTo(cx + lane + Math.sin(t * 3 + i) * 4, y0);
      ctx.lineTo(cx + lane * 1.05, y0 - R * 0.7);
      ctx.stroke();
    }

    // 8. FOAM CREST: the scalloped, breathing rim — the one silhouette that
    //    says "water" from any distance, with foam beads riding it.
    ctx.globalCompositeOperation = 'lighter';
    ctx.globalAlpha = 0.85 + Math.sin(t * 6) * 0.15;
    ctx.strokeStyle = '#f0fdfe';
    ctx.lineWidth = 4;
    this._mouthPath(ctx, cx, cy, rx * 1.02, ry * 1.02, t);
    ctx.stroke();
    ctx.globalAlpha = 0.5;
    ctx.strokeStyle = '#67e8f9';
    ctx.lineWidth = 2;
    this._mouthPath(ctx, cx, cy, rx * 0.88, ry * 0.9, t + 1.7);
    ctx.stroke();
    ctx.globalAlpha = 0.9;
    ctx.fillStyle = '#ffffff';
    for (let i = 0; i < 7; i++) {
      const a = t * 0.8 + i * 0.9;
      const wob = 1 + Math.sin(a * 3 + t * 2.6) * 0.055 + Math.sin(a * 5 - t * 3.4) * 0.035;
      ctx.beginPath();
      ctx.arc(cx + Math.cos(a) * rx * wob, cy + Math.sin(a) * ry * wob,
        1.6 + (i % 3), 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  /** The mouth: an oval whose edge ripples like disturbed water. */
  _mouthPath(ctx, cx, cy, rx, ry, t) {
    ctx.beginPath();
    for (let s = 0; s <= 72; s++) {
      const a = (s / 72) * Math.PI * 2;
      const wob = 1 + Math.sin(a * 3 + t * 2.6) * 0.055 + Math.sin(a * 5 - t * 3.4) * 0.035;
      const px = cx + Math.cos(a) * rx * wob;
      const py = cy + Math.sin(a) * ry * wob;
      if (s === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
    }
    ctx.closePath();
  }

  /** One tapered ink whip curling round the gate. */
  _tendril(ctx, cx, cy, R, phase, dir, color, width) {
    const STEPS = 18;
    const outer = [];
    const inner = [];
    for (let s = 0; s <= STEPS; s++) {
      const k = s / STEPS;
      const a = phase + dir * (k * 2.6);
      const rad = R * (0.72 + k * 1.15) * (1 + Math.sin(k * 5 + phase * 2) * 0.07);
      const w = R * width * Math.pow(1 - k, 1.1) + 1.2;
      const px = cx + Math.cos(a) * rad;
      const py = cy + Math.sin(a) * rad * 1.08;
      outer.push([px + Math.cos(a) * w * 0.5, py + Math.sin(a) * w * 0.5]);
      inner.push([px - Math.cos(a) * w * 0.5, py - Math.sin(a) * w * 0.5]);
    }
    ctx.beginPath();
    ctx.moveTo(outer[0][0], outer[0][1]);
    for (let i = 1; i < outer.length; i++) ctx.lineTo(outer[i][0], outer[i][1]);
    for (let i = inner.length - 1; i >= 0; i--) ctx.lineTo(inner[i][0], inner[i][1]);
    ctx.closePath();
    ctx.fillStyle = color;
    ctx.fill();
  }

  /**
   * Full-screen draw on the OUTPUT canvas (same contract as WormholeFX):
   * deep water closing over the screen — teal pressure and rising foam streaks
   * instead of the rift's violet haze and horizontal motion blur — then a
   * sea-foam white-out on the exact frame the Game swaps dimensions.
   */
  renderScreenOverlay(ctx, w, h) {
    const suckT = this.phase === 'suck'
      ? Math.min(1, this.timer / this.durations.suck)
      : (this.phase === 'collapse' ? 1 : 0);
    ctx.save();
    if (this.phase !== 'collapse' && suckT > 0.02) {
      // Deep water crowding in from the edges.
      const g = ctx.createRadialGradient(
        w / 2, h / 2, Math.min(w, h) * 0.22, w / 2, h / 2, Math.max(w, h) * 0.72);
      g.addColorStop(0, 'rgba(8,47,73,0)');
      g.addColorStop(1, `rgba(2,14,26,${(0.3 + suckT * 0.55).toFixed(3)})`);
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, w, h);
      // Columns of foam CLIMBING the screen — the current taking them up,
      // the opposite read to the wormhole's sideways streaking.
      ctx.globalCompositeOperation = 'lighter';
      for (let i = 0; i < 30; i++) {
        const x = ((i * 53) % w) + Math.sin(i * 2.1) * 8;
        const rise = (this.t * (60 + (i % 7) * 26) + i * 97) % (h + 80);
        const y = h - rise;
        const len = 24 + suckT * 90 * (0.4 + ((i * 17) % 10) / 10);
        ctx.globalAlpha = 0.06 + suckT * 0.16;
        ctx.fillStyle = i % 3 ? '#a5f3fc' : '#67e8f9';
        ctx.fillRect(x, y - len, 2, len);
      }
    }
    ctx.restore();
    if (this.flash > 0) {
      ctx.save();
      ctx.globalAlpha = Math.min(1, this.flash);
      // Sea-foam white-out: bright enough to hide the tile swap completely.
      ctx.fillStyle = '#eafffb';
      ctx.fillRect(0, 0, w, h);
      ctx.restore();
    }
  }
}

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
    // ---- SECRECY ----------------------------------------------------------
    // The four pearls used to settle in whatever AIR/WATER tile was nearest
    // the target, which meant they sat ON the surface glowing like beacons
    // and the whole ritual was a sightseeing tour. A pearl now prefers a
    // BURIED pocket: it is placed inside the terrain, sealed under a solid
    // roof, so finding one takes digging or an accident — the glow is a
    // reward for being close, not a signpost from three screens away. An
    // open spot is only used when the column has nowhere buried to hide.
    const surface = this.surfaceHeights[Math.max(0, Math.min(this.width - 1, target.x))] + 2;
    const buried = [];
    for (let dy = 0; dy <= 14 && !buried[i]; dy++) {
      for (const step of (dy === 0 ? [0] : [-dy, dy])) {
        const x = target.x + step;
        if (x < 2 || x >= this.width - 2) continue;
        const y = surface + dy;
        if (y < 2 || y >= this.height - 2) continue;
        const index = y * this.width + x;
        const tile = this.tiles[index];
        const above = this.tiles[index - this.width];
        const wall = this.walls && this.walls[index];
        const originalWall = this.naturalTerrainWalls && this.naturalTerrainWalls[index];
        // Must be solid ground we can replace, and solid ground above it so
        // the pearl is genuinely sealed in.
        if ([TILES.DIRT, TILES.STONE, TILES.SAND, TILES.MUD, TILES.SANDSTONE].includes(tile) &&
            above !== TILES.AIR && above !== TILES.WATER && !(wall && wall !== originalWall)) {
          buried[i] = { x, y };
          break;
        }
      }
    }
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
    // Buried ALWAYS wins when it exists: the open-spot search above is the
    // fallback for a column with nowhere to hide, not an equally good option.
    if (buried[i]) available[i] = buried[i];
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
  // HARD SWEEP above the waterline. The snapshot shave above only clears
  // tiles that still MATCH the natural generation, so trees/houses from an
  // older worldgen (or a player build) survived inside the reef band and
  // floated over open water. Anything solid and non-temple above seaY in the
  // reef columns is now removed outright — the reef is open sea.
  for (let x = left; x < edgeRight; x++) {
    for (let y = 1; y < seaY; y++) {
      const idx = y * this.width + x;
      const t = this.tiles[idx];
      if (t === TILES.AIR || t === TILES.WATER) continue;
      if (t === TILES.OCEAN_PORTAL || t === TILES.DORMANT_OCEAN_PORTAL) continue;
      if (t === TILES.TEMPLE_DOOR || t === TILES.TEMPLE_LEVER || t === TILES.TEMPLE_LEVER_PULLED) continue;
      if (t === TILES.SACRED_PEARL) continue; // shrine architecture keeps its pearls
      // Leave the tide-temple superstructure alone (stone-brick/marble walls
      // inside the temple bounds); clear everything else.
      if (typeof this.isInsideReefTemple === 'function' && this.isInsideReefTemple(x, y)) continue;
      this.tiles[idx] = TILES.AIR;
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

  // The flood shaves vegetation and terrain above the new waterline back to
  // AIR, which left the overworld's own walls standing in the open sea: every
  // carved column showed the natural stone wall (and vault/shrine brick) as a
  // dark background floating at the top of the water. Walls only render where
  // the tile is AIR, so dropping the wall under carved/carveable air is the
  // whole fix — and it cannot touch terrain, water or anything solid.
  for (let x = left; x < edgeRight; x++) {
    for (let y = 1; y < seaY; y++) {
      const idx = y * this.width + x;
      if (this.tiles[idx] === TILES.AIR) this.walls[idx] = TILES.AIR;
    }
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
  // The reef rewrote surfaceHeights down to the seabed, which can leave a
  // vault buried only against the natural surface hanging in open sea water.
  // Re-seat any that did so they stay a diggable room under the rock.
  if (typeof this.reseatVaults === 'function') this.reseatVaults();
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
  if (typeof this.reseatVaults === 'function') this.reseatVaults();
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
  //
  // WEST BIAS: the archipelago used to be spread evenly across the whole width,
  // so sailing west from the spawn island ran out of land almost immediately and
  // the left third of the map read as empty blue. Land is now weighted toward
  // the west: the big islands' centres are pulled left by a power curve, they
  // are larger, and the small islet scatter is denser out there too. The east
  // still has open water (the colosseum and the ruins need room), it just is
  // not the only thing out west.
  const islandCount = 16 + Math.floor(Math.random() * 5);
  const islands = [];
  const minGap = 24;
  // ---- ASYMMETRIC MAP BOUNDS ---------------------------------------------
  // The planet's playable region used to be symmetric (margin 20 both sides),
  // so the far west was a thin strip along the world edge and the whole east
  // third was a long empty crossing. The map now runs from the WEST EDGE
  // (margin 6) and stops well before the east edge (margin 78): the west side
  // of the planet is ~3x the area it was, and the east side is correspondingly
  // smaller. Everything placed from `usable` (islands, shoals, portal, spawn)
  // inherits the new footprint automatically.
  const W_MARGIN = 6;
  const E_MARGIN = 78;
  const margin = W_MARGIN;
  const usable = Math.max(1, this.width - W_MARGIN - E_MARGIN);
  for (let i = 0; i < islandCount; i++) {
    // Evenly spaced with jitter, so no two islands ever merge into one blob.
    const even = (i + 0.5) / islandCount;
    // Bias the slot westward: even^1.45 compresses toward 0 (the map's left),
    // so more slots land in the western half without ever leaving the right.
    const biased = Math.pow(even, 1.45);
    const base = margin + usable * biased;
    const jitter = (Math.random() - 0.5) * (usable / islandCount) * 0.6;
    const cx = Math.max(margin, Math.min(this.width - E_MARGIN - 1,
      Math.round(base + jitter)));
    if (islands.some(other => Math.abs(other.cx - cx) < minGap)) continue;
    // Bigger overall, and bigger still the further west you go.
    const west = 1 - Math.min(1, Math.max(0, (cx - margin) / usable));
    // WEST SIDE BIGGER. The archipelago already biased west; the report is that
    // it needs to be MORE land out there, not just a bias. Two changes:
    //   - the west curve is squared, so the biggest islands bunch into the
    //     western third instead of tapering smoothly across the whole map;
    //   - the size boost roughly doubles on the far west, with the shoal
    //     count raised to match (more islets = a real archipelago to cross).
    const westBias = Math.pow(west, 1.8);
    const sizeBoost = 0.75 + westBias * 1.45;
    const halfWidth = Math.round((8 + Math.floor(Math.random() * 9)) * sizeBoost);
    const height = Math.round((6 + Math.floor(Math.random() * 9)) * sizeBoost);
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
    // Same westward bias for the free-floating shoals: weight the roll toward
    // the left third so the western sea is a proper archipelago to swim across
    // instead of the long empty crossing it used to be.
    const westRoll = Math.pow(Math.random(), 1.85);
    const wcx = margin + Math.floor(usable * westRoll);
    if (islands.some(o => Math.abs(o.cx - wcx) < 16)) continue;
    if (islets.some(o => Math.abs(o.cx - wcx) < isletSpacing)) continue;
    islets.push({ cx: wcx, halfWidth: 4 + Math.floor(Math.random() * 4),
      height: 3 + Math.floor(Math.random() * 3), islet: true, flat: true });
    if (islets.length >= 140) break;
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
    // ---- WALLS ---------------------------------------------------------------
  // The overworld's walls ride along into this dimension, and they only show
  // through AIR — so the ocean planet's open water and swim gaps painted the
  // overworld's cave stone (and every buried structure's brick) as a dark
  // background hanging under every island. This dimension has no caves and no
  // kept walls: drop the wall under every non-solid tile so the water is water.
  for (let i = 0; i < this.tiles.length; i++) {
    if (this.tiles[i] !== TILES.AIR) continue;
    const t = this.tiles[i];
    if (t === TILES.AIR) this.walls[i] = TILES.AIR;
  }
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

  // ---- WALLS ---------------------------------------------------------------
  // The overworld's walls ride along into this dimension, and they only show
  // through AIR — so the ocean planet's open water and swim gaps painted the
  // overworld's cave stone (and every buried structure's brick) as a dark
  // background hanging under every island. This dimension's caves are carved
  // AFTER this point and repaint their own walls; everything above only needs
  // the overworld's walls gone.
  for (let i = 0; i < this.tiles.length; i++) {
    if (this.tiles[i] === TILES.AIR) this.walls[i] = TILES.AIR;
  }
  this._tileCacheDirty = true;

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
  //
  // THIS is also where the OCEAN-THEMED ORES live. They are found nowhere else
  // in the game: the rock under the abyssal seabed is the only source of brine,
  // abyssal, tidesteel and leviathan ore — the materials the Megalodon's
  // fang-blade is forged from. Each tier owns a DEPTH BAND, so the deeper you
  // dig the richer the seam: brine just under the seabed, leviathan near the
  // map floor. The band fraction is measured from the local seabed down to the
  // bottom, so even a shallow column still yields brine at its own floor.
  //
  // TWO FIXES HERE:
  //   1. ISLAND BLEED. Ore used to seed straight under the islands as well. The
  //      real test for "this column is an island" is solid rock ABOVE THE
  //      WATERLINE — not a comparison against the flat `duneFloor` number,
  //      which varied per column and wrongly excluded most of the open seabed.
  //   2. TOO FREQUENT (then too scarce). One ORE_RATE constant scales every
  //      band's roll cut-off. It was 0.34, which combined with the broken
  //      column filter to leave almost no ore in the world; it is now 0.9.
  const ORE_RATE = 0.9;
  const cut = (base) => base * ORE_RATE;
  // The sea surface, for the island test.
  const seaSurface = this.oceanArena ? this.oceanArena.seaY : 0;
  for (let x = 2; x < this.width - 2; x++) {
    const top = duneFloor[x];
    const span = Math.max(1, this.height - 2 - top);
    // Island body: solid rock reaching above the sea surface in this column.
    let waterlineBlocked = false;
    if (seaSurface > 2) {
      for (let y = 2; y < seaSurface; y++) {
        if (this.getTile(x, y) !== TILES.AIR) { waterlineBlocked = true; break; }
      }
    } else {
      // No arena (direct generator call): fall back to the column's own top
      // solid tile sitting well above the local seabed.
      for (let y = 2; y < top; y++) {
        const above = this.getTile(x, y);
        if (above !== TILES.AIR && above !== TILES.WATER) { waterlineBlocked = true; break; }
      }
    }
    if (waterlineBlocked) continue;                            // island / roots — no ore
    // Ore only begins a few tiles under the seabed it belongs to.
    const oreStart = top + 4;
    for (let y = oreStart; y < this.height - 2; y++) {
      const tile = this.getTile(x, y);
      if (tile !== TILES.STONE) continue;
      // 0 at the seabed, 1 at the map floor.
      const depth = (y - top) / span;
      const roll = Math.random();
      if (roll < cut(0.012)) this.setTile(x, y, TILES.IRON_ORE);
      else if (roll < cut(0.018)) this.setTile(x, y, TILES.GOLD_ORE);
      else if (roll < cut(0.0205)) this.setTile(x, y, TILES.CRYSTAL);
      // A crystal stuck to a cavern ceiling sparkles the whole chamber.
      else if (roll < cut(0.024) && this.getTile(x, y - 1) === TILES.AIR) {
        this.setTile(x, y, TILES.CRYSTAL);
      }
      // ---- Ocean-themed ore bands. The common ore of each band gets a wide
      // share; the rarer ore above it is a thin seam, so a seam feels found.
      else if (roll < cut(0.033)) {
        // Brine: the shallow band, commonest near the seabed.
        if (depth < 0.55) this.setTile(x, y, TILES.BRINE_ORE);
        else if (roll < cut(0.028)) this.setTile(x, y, TILES.BRINE_ORE);
        else this.setTile(x, y, TILES.ABYSS_ORE);
      } else if (roll < cut(0.042)) {
        // Abyssal: the middle band.
        if (depth > 0.30 && depth < 0.82) this.setTile(x, y, TILES.ABYSS_ORE);
        else if (roll < cut(0.037)) this.setTile(x, y, TILES.BRINE_ORE);
        else this.setTile(x, y, TILES.TIDE_ORE);
      } else if (roll < cut(0.049)) {
        // Tidesteel: the deep band, below the middle.
        if (depth > 0.55) this.setTile(x, y, TILES.TIDE_ORE);
        else if (roll < cut(0.045)) this.setTile(x, y, TILES.ABYSS_ORE);
        else this.setTile(x, y, TILES.TIDE_ORE);
      } else if (roll < cut(0.0535)) {
        // Leviathan: the very bottom of the planet, rare everywhere else.
        if (depth > 0.78) this.setTile(x, y, TILES.LEVIATHAN_ORE);
        else if (roll < cut(0.051)) this.setTile(x, y, TILES.TIDE_ORE);
        else this.setTile(x, y, TILES.LEVIATHAN_ORE);
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

  const portalX = W_MARGIN + Math.floor(usable * 0.42);
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
      // COSMETIC ONLY. These pillars used to ALSO stamp solid STONE collision
      // tiles upward from the swim floor (py-dy at seaY+28 — the exact depth the
      // Megalodon circles at), so the player's arrows/melee hit invisible stone
      // in mid-water and could never damage the boss. The visual pillar is drawn
      // from this `pillars` array in renderColosseum(), so it survives untouched;
      // we simply no longer put blocking geometry in the swim volume.
      pillars.push({ x: px, y: py - 3 });
    }

    // Corner pillars outside the seating ring
    for (const off of [-2, 2]) {
      const angle = (Math.PI * 2) / 8 * 1 + (off > 0 ? 0 : Math.PI / 4);
      const px = Math.round(cx + Math.cos(angle) * (r + 4));
      const py = Math.round(seaY + 28 + Math.sin(angle) * 2);
      if (px < 8 || px >= this.width - 8 || py < 0 || py >= this.height - 8) continue;
      // COSMETIC ONLY — see the arena pillars above: no solid collision tiles in
      // the swim volume, or the player's shots hit invisible stone around the boss.
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
      spawnX: (spawnIsland ? spawnIsland.cx : W_MARGIN + Math.floor(usable * 0.42)) * TILE_SIZE,
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
  // ---- ABYSSAL ORE MIGRATION --------------------------------------------
  // Ores only generate during generateOceanPlanet(), so any ocean world made
  // before they existed is stone from seabed to bedrock — no brine, no abyssal,
  // no tidesteel, no leviathan, and therefore NO Fang of the Last Predator.
  // Seed the seams into any stone that has never been carved by the player.
  if (!this._abyssOreSeeded) {
    const O = OCEAN_TILES;
    const oceanTiers = [
      { id: O.BRINE_ORE, weight: 0.055 },   // shallow band
      { id: O.ABYSS_ORE, weight: 0.040 },   // middle band
      { id: O.TIDE_ORE, weight: 0.028 },    // deep band
      { id: O.LEVIATHAN_ORE, weight: 0.012 } // bottom of the world
    ];
    const totalW = oceanTiers.reduce((s, t) => s + t.weight, 0);
    let seeded = 0;
    for (let x = 2; x < this.width - 2; x++) {
      // ---- ISLAND BLEED, same fix as the generator -----------------------
      // This migration ran over EVERY stone tile below the seabed line, which
      // includes the rock inside and under every island: a small island's
      // underside came out studded with ore. The seabed here is the ocean
      // arena's floor line (`surfaceHeights` is left at the sea surface by the
      // dimension swap, so it cannot be used), and a column whose topmost solid
      // tile is ABOVE that line is an island column and gets no seam here.
      // ---- ISLAND BLEED, same fix as the generator -----------------------
      // This migration ran over EVERY stone tile below the seabed line, which
      // includes the rock inside and under every island: a small island's
      // underside came out studded with ore.
      //
      // The arena's `floorY` is a flat REFERENCE, not the seabed — `duneFloor`
      // varies per column, so comparing a column's first solid tile against one
      // flat number classified ~417 of ~436 columns as "island" and suppressed
      // ore over nearly the whole planet (the "there's still no ore" report).
      // The real test is two-part:
      //   1. An island column has solid rock ABOVE THE WATERLINE.
      //   2. The column's own seabed is the first solid tile below the sea.
      const seaY = this.oceanArena ? this.oceanArena.seaY : (this.surfaceHeights[x]);
      let waterlineBlocked = false;
      for (let y = 2; y < seaY; y++) {
        if (this.tiles[y * this.width + x] !== TILES.AIR) { waterlineBlocked = true; break; }
      }
      if (waterlineBlocked) continue;                          // island body / roots
      let seabed = -1;
      for (let y = Math.max(2, seaY); y < this.height - 2; y++) {
        const t = this.tiles[y * this.width + x];
        if (t !== TILES.AIR && t !== TILES.WATER) { seabed = y; break; }
      }
      if (seabed < 0) continue;                                // no rock in this column
      // Find the seabed: the first solid non-sand/stone cap from above, or fall
      // back to the surface height for this column.
      const top = seabed;
      const span = Math.max(1, this.height - 2 - top);
      for (let y = top + 4; y < this.height - 2; y++) {
        const i = y * this.width + x;
        if (this.tiles[i] !== TILES.STONE) continue;
        const depth = (y - top) / span;
        // MUST be `let`: the tier walk below subtracts each weight in turn.
        // This was `const`, so the first subtraction threw
        // "TypeError: Assignment to constant variable" from inside
        // enterOceanDimension() — which left the Tide Gate crossing frozen
        // mid-swap (white-out that never cleared / an empty ocean arena).
        let roll = Math.random() * totalW;
        let pick = null;
        for (const t of oceanTiers) {
          roll -= t.weight;
          if (roll <= 0) { pick = t.id; break; }
        }
        if (pick === null) continue;
        // Band gating: brine shallow, leviathan deep, so migration matches the
        // fresh-generation distribution.
        if (pick === O.BRINE_ORE && depth > 0.62) continue;
        if (pick === O.LEVIATHAN_ORE && depth < 0.62) continue;
        this.tiles[i] = pick;
        seeded++;
      }
    }
    this._abyssOreSeeded = true;
    if (seeded > 0 && typeof console !== 'undefined') {
      console.log('[terra-migrate] abyssal ore seams seeded into this ocean world: ' + seeded);
    }
  }
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
// ============================================================================
// THE MEGALODON â€” the ancient apex predator of the drowned colosseum.
// ============================================================================
// No magic, no ink: just a mile of scarred muscle, a mouth like a bear trap,
// and a speed nothing that big should have. Three phases:
//   1. THE ANCIENT PREDATOR (100-65%) â€” circles, charges, punishes greed.
//   2. BLOOD FRENZY (65-30%) â€” cracked hide, burning eyes, chained dashes.
//   3. APEX OF THE ANCIENT SEA (30-0%) â€” vanishing execution charges,
//      depth-erupting leaps, suction bites and the Extinction Hunt combo.
//
// THE MODEL: the animal is sampled along a spine whose curvature is the live
// swim cycle, so flexion travels from shoulder to caudal tip and every part
// of it â€” fins, gills, brow, eye and the hinged jaw â€” hangs off the same
// skeleton. render() is the only place the art is defined; update() feeds it
// the rig channels (swimPhase, tailBend, finKick, gillFlare, blink, roll/yaw,
// droop, jawV) and never the geometry itself.
//
// The combat surface (headTargets / takeDamage / update / render /
// renderTelegraph / overlapsPlayer / touchDamage) matches the old Kraken
// exactly, so the game loop, boss panel, save-HP banking and every QA hook
// keep working untouched. `kind` stays 'kraken' for save compatibility.
// ============================================================================
// ============================================================================
// THE MEGALODON â€” the ancient apex predator of the drowned colosseum.
// ============================================================================
// No magic, no ink: just a mile of scarred muscle, a mouth like a bear trap,
// and a speed nothing that big should have. Three phases:
//   1. THE ANCIENT PREDATOR (100-65%) â€” circles, charges, punishes greed.
//   2. BLOOD FRENZY (65-30%) â€” cracked hide, burning eyes, chained dashes.
//   3. APEX OF THE ANCIENT SEA (30-0%) â€” vanishing execution charges,
//      depth-erupting leaps, suction bites and the Extinction Hunt combo.
//
// THE MODEL: the animal is sampled along a spine whose curvature is the live
// swim cycle, so flexion travels from shoulder to caudal tip and every part
// of it â€” fins, gills, brow, eye and the hinged jaw â€” hangs off the same
// skeleton. render() is the only place the art is defined; update() feeds it
// the rig channels (swimPhase, tailBend, finKick, gillFlare, blink, roll/yaw,
// droop, jawV) and never the geometry itself.
//
// The combat surface (headTargets / takeDamage / update / render /
// renderTelegraph / overlapsPlayer / touchDamage) matches the old Kraken
// exactly, so the game loop, boss panel, save-HP banking and every QA hook
// keep working untouched. `kind` stays 'kraken' for save compatibility.
// ============================================================================
// ============================================================================
// THE MEGALODON â€” the ancient apex predator of the drowned colosseum.
// ============================================================================
// No magic, no ink: just a mile of scarred muscle, a mouth like a bear trap,
// and a speed nothing that big should have. Three phases:
//   1. THE ANCIENT PREDATOR (100-65%) â€” circles, charges, punishes greed.
//   2. BLOOD FRENZY (65-30%) â€” cracked hide, burning eyes, chained dashes.
//   3. APEX OF THE ANCIENT SEA (30-0%) â€” vanishing execution charges,
//      depth-erupting leaps, suction bites and the Extinction Hunt combo.
//
// THE MODEL: the animal is sampled along a spine whose curvature is the live
// swim cycle, so flexion travels from shoulder to caudal tip and every part
// of it â€” fins, gills, brow, eye and the hinged jaw â€” hangs off the same
// skeleton. render() is the only place the art is defined; update() feeds it
// the rig channels (swimPhase, tailBend, finKick, gillFlare, blink, roll/yaw,
// droop, jawV) and never the geometry itself.
//
// The combat surface (headTargets / takeDamage / update / render /
// renderTelegraph / overlapsPlayer / touchDamage) matches the old Kraken
// exactly, so the game loop, boss panel, save-HP banking and every QA hook
// keep working untouched. `kind` stays 'kraken' for save compatibility.
// ============================================================================
// ============================================================================
// THE MEGALODON â€” the ancient apex predator of the drowned colosseum.
// ============================================================================
// No magic, no ink: just a mile of scarred muscle, a mouth like a bear trap,
// and a speed nothing that big should have. Three phases:
//   1. THE ANCIENT PREDATOR (100-65%) â€” circles, charges, punishes greed.
//   2. BLOOD FRENZY (65-30%) â€” cracked hide, burning eyes, chained dashes.
//   3. APEX OF THE ANCIENT SEA (30-0%) â€” vanishing execution charges,
//      depth-erupting leaps, suction bites and the Extinction Hunt combo.
//
// THE MODEL: the animal is sampled along a spine whose curvature is the live
// swim cycle, so flexion travels from shoulder to caudal tip and every part
// of it â€” fins, gills, brow, eye and the hinged jaw â€” hangs off the same
// skeleton. render() is the only place the art is defined; update() feeds it
// the rig channels (swimPhase, tailBend, finKick, gillFlare, blink, roll/yaw,
// droop, jawV) and never the geometry itself.
//
// The combat surface (headTargets / takeDamage / update / render /
// renderTelegraph / overlapsPlayer / touchDamage) matches the old Kraken
// exactly, so the game loop, boss panel, save-HP banking and every QA hook
// keep working untouched. `kind` stays 'kraken' for save compatibility.
// ============================================================================
// ============================================================================
// THE MEGALODON â€” the ancient apex predator of the drowned colosseum.
// ============================================================================
// No magic, no ink: just a mile of scarred muscle, a mouth like a bear trap,
// and a speed nothing that big should have. Three phases:
//   1. THE ANCIENT PREDATOR (100-65%) â€” circles, charges, punishes greed.
//   2. BLOOD FRENZY (65-30%) â€” cracked hide, burning eyes, chained dashes.
//   3. APEX OF THE ANCIENT SEA (30-0%) â€” vanishing execution charges,
//      depth-erupting leaps, suction bites and the Extinction Hunt combo.
//
// THE MODEL: the animal is sampled along a spine whose curvature is the live
// swim cycle, so flexion travels from shoulder to caudal tip and every part
// of it â€” fins, gills, brow, eye and the hinged jaw â€” hangs off the same
// skeleton. render() is the only place the art is defined; update() feeds it
// the rig channels (swimPhase, tailBend, finKick, gillFlare, blink, roll/yaw,
// droop, jawV) and never the geometry itself.
//
// The combat surface (headTargets / takeDamage / update / render /
// renderTelegraph / overlapsPlayer / touchDamage) matches the old Kraken
// exactly, so the game loop, boss panel, save-HP banking and every QA hook
// keep working untouched. `kind` stays 'kraken' for save compatibility.
// ============================================================================
// ============================================================================
// THE MEGALODON â€” the ancient apex predator of the drowned colosseum.
// ============================================================================
// No magic, no ink: just a mile of scarred muscle, a mouth like a bear trap,
// and a speed nothing that big should have. Three phases:
//   1. THE ANCIENT PREDATOR (100-65%) â€” circles, charges, punishes greed.
//   2. BLOOD FRENZY (65-30%) â€” cracked hide, burning eyes, chained dashes.
//   3. APEX OF THE ANCIENT SEA (30-0%) â€” vanishing execution charges,
//      depth-erupting leaps, suction bites and the Extinction Hunt combo.
//
// THE MODEL: the animal is sampled along a spine whose curvature is the live
// swim cycle, so flexion travels from shoulder to caudal tip and every part
// of it â€” fins, gills, brow, eye and the hinged jaw â€” hangs off the same
// skeleton. render() is the only place the art is defined; update() feeds it
// the rig channels (swimPhase, tailBend, finKick, gillFlare, blink, roll/yaw,
// droop, jawV) and never the geometry itself.
//
// The combat surface (headTargets / takeDamage / update / render /
// renderTelegraph / overlapsPlayer / touchDamage) matches the old Kraken
// exactly, so the game loop, boss panel, save-HP banking and every QA hook
// keep working untouched. `kind` stays 'kraken' for save compatibility.
// ============================================================================
// ============================================================================
// THE MEGALODON â€” the ancient apex predator of the drowned colosseum.
// ============================================================================
// No magic, no ink: just a mile of scarred muscle, a mouth like a bear trap,
// and a speed nothing that big should have. Three phases:
//   1. THE ANCIENT PREDATOR (100-65%) â€” circles, charges, punishes greed.
//   2. BLOOD FRENZY (65-30%) â€” cracked hide, burning eyes, chained dashes.
//   3. APEX OF THE ANCIENT SEA (30-0%) â€” vanishing execution charges,
//      depth-erupting leaps, suction bites and the Extinction Hunt combo.
//
// THE MODEL: the animal is sampled along a spine whose curvature is the live
// swim cycle, so flexion travels from shoulder to caudal tip and every part
// of it â€” fins, gills, brow, eye and the hinged jaw â€” hangs off the same
// skeleton. render() is the only place the art is defined; update() feeds it
// the rig channels (swimPhase, tailBend, finKick, gillFlare, blink, roll/yaw,
// droop, jawV) and never the geometry itself.
//
// The combat surface (headTargets / takeDamage / update / render /
// renderTelegraph / overlapsPlayer / touchDamage) matches the old Kraken
// exactly, so the game loop, boss panel, save-HP banking and every QA hook
// keep working untouched. `kind` stays 'kraken' for save compatibility.
// ============================================================================
// THE MEGALODON — V2 SKILL KIT. Every named ability of the fight, keyed by the
// internal `pending.type` / scheduler the AI arms. The boss bar surfaces
// `skillName` (set via castSkill) so the player always knows what is coming.
// Pure presentation: combat code never reads these strings for behaviour.
// ============================================================================
const MEGA_SKILLS = {
  // Phase 1 — The Ancient Predator
  predator_dash: 'Abyssal Charge',
  crushing_bite: 'Rending Bite',
  predators_wake: "Predator's Wake",
  hunters_feint: "Hunter's Feint",
  tail_sweep: 'Tailbreaker',
  // Phase 2 — The Ravaging Abyss
  tsunami_breaker: 'Tsunami Breaker',
  abyssal_undertow: 'Abyssal Undertow',
  predators_barrage: "Predator's Barrage",
  crushing_depths: 'Crushing Depths',
  abyssal_roar: 'Abyssal Roar',
  death_spiral: 'Death Spiral',
  // Phase 3 — Extinction Engine
  extinction_rush: 'Extinction Rush',
  devouring_maw: 'Abyssal Maw',
  leviathans_judgment: "Leviathan's Judgment",
  world_devourer: 'World Devourer',
  cataclysmic_breach: 'Cataclysmic Breach',
  last_predator_standing: 'Last Predator Standing',
  // Special abilities (phase 2+, insert rolls)
  blackwater_vanish: 'Blackwater Vanish',
  pressure_rupture: 'Pressure Rupture',
  tidal_lock: 'Tidal Lock',
  // Legacy V1 types still resolvable (QA harness + bake pack drive them)
  hunt_call: 'Abyssal Roar',
  sharknado: 'Death Spiral',
  tooth_barrage: "Predator's Barrage",
  frenzy_rush: "Predator's Barrage",
  apex_execution: 'Extinction Rush',
  depth_warning: 'Cataclysmic Breach',
  extinction_bite: 'Last Predator Standing'
};
// ============================================================================
// THE MEGALODON â€” the ancient apex predator of the drowned colosseum.
// ============================================================================
// No magic, no ink: just a mile of scarred muscle, a mouth like a bear trap,
// and a speed nothing that big should have. Three phases:
//   1. THE ANCIENT PREDATOR (100-65%) â€” circles, charges, punishes greed.
//   2. BLOOD FRENZY (65-30%) â€” cracked hide, burning eyes, chained dashes.
//   3. APEX OF THE ANCIENT SEA (30-0%) â€” vanishing execution charges,
//      depth-erupting leaps, suction bites and the Extinction Hunt combo.
//
// THE MODEL: the animal is sampled along a spine whose curvature is the live
// swim cycle, so flexion travels from shoulder to caudal tip and every part
// of it â€” fins, gills, brow, eye and the hinged jaw â€” hangs off the same
// skeleton. render() is the only place the art is defined; update() feeds it
// the rig channels (swimPhase, tailBend, finKick, gillFlare, blink, roll/yaw,
// droop, jawV) and never the geometry itself.
//
// The combat surface (headTargets / takeDamage / update / render /
// renderTelegraph / overlapsPlayer / touchDamage) matches the old Kraken
// exactly, so the game loop, boss panel, save-HP banking and every QA hook
// keep working untouched. `kind` stays 'kraken' for save compatibility.
// ============================================================================
// ============================================================================
// THE MEGALODON â€” the ancient apex predator of the drowned colosseum.
// ============================================================================
// No magic, no ink: just a mile of scarred muscle, a mouth like a bear trap,
// and a speed nothing that big should have. Three phases:
//   1. THE ANCIENT PREDATOR (100-65%) â€” circles, charges, punishes greed.
//   2. BLOOD FRENZY (65-30%) â€” cracked hide, burning eyes, chained dashes.
//   3. APEX OF THE ANCIENT SEA (30-0%) â€” vanishing execution charges,
//      depth-erupting leaps, suction bites and the Extinction Hunt combo.
//
// THE MODEL: the animal is sampled along a spine whose curvature is the live
// swim cycle, so flexion travels from shoulder to caudal tip and every part
// of it â€” fins, gills, brow, eye and the hinged jaw â€” hangs off the same
// skeleton. render() is the only place the art is defined; update() feeds it
// the rig channels (swimPhase, tailBend, finKick, gillFlare, blink, roll/yaw,
// droop, jawV) and never the geometry itself.
//
// The combat surface (headTargets / takeDamage / update / render /
// renderTelegraph / overlapsPlayer / touchDamage) matches the old Kraken
// exactly, so the game loop, boss panel, save-HP banking and every QA hook
// keep working untouched. `kind` stays 'kraken' for save compatibility.
// ============================================================================
// ============================================================================
// THE MEGALODON â€” the ancient apex predator of the drowned colosseum.
// ============================================================================
// No magic, no ink: just a mile of scarred muscle, a mouth like a bear trap,
// and a speed nothing that big should have. Three phases:
//   1. THE ANCIENT PREDATOR (100-65%) â€” circles, charges, punishes greed.
//   2. BLOOD FRENZY (65-30%) â€” cracked hide, burning eyes, chained dashes.
//   3. APEX OF THE ANCIENT SEA (30-0%) â€” vanishing execution charges,
//      depth-erupting leaps, suction bites and the Extinction Hunt combo.
//
// THE MODEL: the animal is sampled along a spine whose curvature is the live
// swim cycle, so flexion travels from shoulder to caudal tip and every part
// of it â€” fins, gills, brow, eye and the hinged jaw â€” hangs off the same
// skeleton. render() is the only place the art is defined; update() feeds it
// the rig channels (swimPhase, tailBend, finKick, gillFlare, blink, roll/yaw,
// droop, jawV) and never the geometry itself.
//
// The combat surface (headTargets / takeDamage / update / render /
// renderTelegraph / overlapsPlayer / touchDamage) matches the old Kraken
// exactly, so the game loop, boss panel, save-HP banking and every QA hook
// keep working untouched. `kind` stays 'kraken' for save compatibility.
// ============================================================================
// ============================================================================
// THE MEGALODON â€” the ancient apex predator of the drowned colosseum.
// ============================================================================
// No magic, no ink: just a mile of scarred muscle, a mouth like a bear trap,
// and a speed nothing that big should have. Three phases:
//   1. THE ANCIENT PREDATOR (100-65%) â€” circles, charges, punishes greed.
//   2. BLOOD FRENZY (65-30%) â€” cracked hide, burning eyes, chained dashes.
//   3. APEX OF THE ANCIENT SEA (30-0%) â€” vanishing execution charges,
//      depth-erupting leaps, suction bites and the Extinction Hunt combo.
//
// THE MODEL: the animal is sampled along a spine whose curvature is the live
// swim cycle, so flexion travels from shoulder to caudal tip and every part
// of it â€” fins, gills, brow, eye and the hinged jaw â€” hangs off the same
// skeleton. render() is the only place the art is defined; update() feeds it
// the rig channels (swimPhase, tailBend, finKick, gillFlare, blink, roll/yaw,
// droop, jawV) and never the geometry itself.
//
// The combat surface (headTargets / takeDamage / update / render /
// renderTelegraph / overlapsPlayer / touchDamage) matches the old Kraken
// exactly, so the game loop, boss panel, save-HP banking and every QA hook
// keep working untouched. `kind` stays 'kraken' for save compatibility.
// ============================================================================
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
    /**
     * ---- The animation rig (see render): additive channels the whole body
     * integrates. `tailBend` is the live spine curvature fed into the tail,
     * `finKick` is a per-beat pectoral flap impulse, `blink` is the eyelid
     * timer, and `roll`/`yaw` carry the 3-D cheat that reads as a banking
     * turn. None of these touch combat — they are pure presentation.
     */
    this.tailBend = 0;
    this.finKick = 0;
    this.blink = 0;
    this.blinkCd = 2 + Math.random() * 3;
    this.roll = 0;
    this.yaw = 0;
    this.gillFlare = 0;
    this.scarSeed = Math.random() * 1000;
    this.wakeT = 0;
    this.trail = [];          // charge afterimages: spine snapshots
    this.fx = [];             // live pooled VFX (rings, collapses, bursts, wakes)
    this._fxPool = [];        // recycled records: no per-frame allocation
    this.droop = 0;           // 0 alert .. 1 exhausted-and-sagging
    this.jawV = 0;            // jaw spring velocity
    /** Death timer: seconds since hp hit zero, drives the death clip. */
    this.deadT = 0;
    /** Which clip of the reference sheet the animal is running right now.
     *  One of: idle, swim, fast_swim, turn, bite, tail_sweep, hurt, death,
     *  frenzy_rush, sharknado, tooth_barrage, feeding_frenzy, apex_execution,
     *  depth_charge, devouring_maw, extinction_hunt, exhausted.
     *  Pure presentation: the attack AI never reads it. */
    this.poseMode = 'swim';
    this._lastFaceDir = this.faceDir;
    /**
     * ---- Attack-readability channels (all pure presentation).
     * `anticip` is 0..1 through a telegraph: it opens the jaw, coils the spine
     * and rears the body back BEFORE the hit, so every attack reads as
     * anticipation -> strike -> recovery rather than a state swap.
     * `flipSmooth` eases the facing so a direction change pivots instead of
     * snapping; `turnKick` spikes on the crossing for one tail flick.
     * `hitReact` is the decaying damage flinch; `recoverT` is the coast
     * window after a charge. None of them touch combat or hitboxes.
     */
    this.anticip = 0;
    this.flipSmooth = this.faceDir;
    this.turnKick = 0;
    this.hitReact = 0;
    this.recoverT = 0;
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
    // Damage reaction: one flinch (jaw clench, head pull-back, hard blink).
    // It is a decaying channel, so proportions are never permanently altered.
    this.hitReact = 1;
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
      if (phase === 3) { this.jawTarget = 1; this.attackTimer = Math.max(this.attackTimer, 2.2); }
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

  /**
   * Move the target (the player) by a suction/current displacement WITHOUT
   * ever embedding them inside solid rock or dragging them out of the map.
   *
   * The Megalodon's vortex (SHARKNADO), devouring-maw suction and the phase-2
   * turbulent currents all used to write target.x/target.y directly. Those raw
   * writes bypassed the physics solver entirely, so the pull shoved the player
   * straight through the arena's stone benches, the reef walls and the world
   * border: embedded in blocks with no way to move, or outside the map where
   * the camera could never follow. This helper applies the same displacement,
   * but only into positions the player's AABB can actually occupy — the
   * blocked axis is dropped instead of tunneling through it, which reads as
   * the current losing its grip on you against the rock rather than a bug.
   */
  _pullTarget(target, dx, dy) {
    if (!target || !Number.isFinite(dx) || !Number.isFinite(dy)) return;
    const world = this.game && this.game.world;
    if (!world) return;
    const T = TILE_SIZE;
    const free = (x, y) => {
      // Map bounds: the player can never be pulled outside the world.
      if (x < 0 || y < 0) return false;
      if (x + target.width > world.pixelWidth || y + target.height > world.pixelHeight) return false;
      const x0 = Math.floor(x / T), x1 = Math.floor((x + target.width - 1) / T);
      const y0 = Math.floor(y / T), y1 = Math.floor((y + target.height - 1) / T);
      for (let ty = y0; ty <= y1; ty++) {
        for (let tx = x0; tx <= x1; tx++) {
          if (world.isSolid(tx, ty)) return false;
        }
      }
      return true;
    };
    if (free(target.x + dx, target.y + dy)) {
      target.x += dx;
      target.y += dy;
      return;
    }
    // Slide along whichever single axis is open, so a pull into a wall scrubs
    // speed along that axis only instead of stopping dead.
    if (free(target.x + dx, target.y)) target.x += dx;
    else if (free(target.x, target.y + dy)) target.y += dy;
    // Fully blocked: the pull simply does not move the player this frame.
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

  /**
   * The PRESENTATION half of the rig: every spring that only moves pixels.
   * update() calls this after it has integrated the AI and motion, and
   * animatePresentation() (guests, who never simulate the boss) calls it on
   * its own, so a multiplayer puppet still swims, blinks, flaps and pants
   * instead of standing frozen on a snapshot.
   * It must never move the boss, damage anyone, or pick attacks.
   */
  _rigPresentation(dt, speedNow, ph) {
    const breathRate = (1.2 + ph * 0.14);
    this.bob = Math.sin(this.animT * breathRate) * (8 + ph * 2)
      + Math.sin(this.animT * 2.7 + 1.3) * 3;
    this.sway = Math.cos(this.animT * breathRate * 0.7) * (10 + ph * 3);
    this.pulse = Math.max(0, (this.pulse || 0) - dt * 2.2);
    this.pulseCd = Math.max(0, (this.pulseCd || 0) - dt);
    if (speedNow > 500 && (this.pulseCd || 0) <= 0) { this.pulse = 1; this.pulseCd = 0.8; }
    // --- anticipation: how far through the armed telegraph we are -----------
    const wind = this.pending && this.pending.total ? this.pending : null;
    this.anticip = wind ? Math.max(0, Math.min(1, 1 - wind.timer / wind.total)) : 0;
    // --- recoil / squash springs -------------------------------------------
    this.recoil = this.recoil || 0;
    this.recoilV = this.recoilV || 0;
    this.recoilV += ((0 - this.recoil) * 90 - this.recoilV * 9) * dt;
    this.recoil += this.recoilV * dt;
    const squashTarget = (this.pulse || 0) * 0.4 + (this.dash ? 0.35 : 0)
      + (this.anticip || 0) * 0.28
      + (this.hitReact || 0) * 0.18 - this.recoil * 0.4;
    this.squashV += ((squashTarget - this.squash) * 26 - this.squashV * 7) * dt;
    this.squash += this.squashV * dt;
    // Body lunge: the tell REARS BACK, the release snaps FORWARD, and the
    // spring settles out. That one sign flip is what makes an attack read.
    this.lunge = -(this.anticip || 0) * 0.62 + this.recoil * 0.85 - (this.hitReact || 0) * 0.2;
    this.breath = 1 + Math.sin(this.animT * breathRate * 0.5) * 0.03;
    this.swimPhase = (this.swimPhase || 0) + dt * (3 + ph * 0.5 + Math.min(3, speedNow / 220));
    const surgeTarget = Math.min(1, speedNow / 700) * 0.9 + (this.dash ? 0.6 : 0.05);
    this.surge = (this.surge || 0) + (surgeTarget - (this.surge || 0)) * Math.min(1, dt * 4);
    // Tail sweeps hardest when swimming, charging or spinning.
    const tailRate = 2.4 + (this.dash ? 7 : this.tornadoT > 0 ? 10 : 0) + ph * 0.4;
    this.tailSwing = Math.sin(this.swimPhase * tailRate * 0.45) * (14 + speedNow * 0.03);
    // Jaws: a spring, not a lerp -- a bite SNAPS and a snarl settles with a
    // touch of overshoot, which is what sells the weight of the head. The
    // telegraph drives the target upward so the maw is already gaping when the
    // strike lands; without this the jaw only opened AFTER the hit.
    const AT = this.anticip || 0;
    if (this.exhaustT > 0) this.jawTarget = 0.6;
    else if (wind && (wind.type === 'crushing_bite' || wind.type === 'extinction_bite'
        || wind.type === 'devouring_maw' || wind.type === 'apex_execution'
        || wind.type === 'tooth_barrage')) {
      this.jawTarget = 0.28 + 0.72 * AT;          // bite: open through the tell
    } else if (wind && (wind.type === 'predator_dash' || wind.type === 'frenzy_rush'
        || wind.type === 'depth_warning' || wind.type === 'sharknado'
        || wind.type === 'tail_sweep')) {
      this.jawTarget = 0.25 + 0.6 * AT;           // charge/sweep: jaw cracks open
    } else this.jawTarget *= Math.pow(0.05, dt);
    this.jawV = (this.jawV || 0) + ((this.jawTarget - this.jawOpen) * 120 - this.jawV * 13) * dt;
    this.jawOpen = Math.max(0, Math.min(1.05, (this.jawOpen || 0) + this.jawV * dt));
    return AT;
  }

  /** Guest-side presentation only: the puppet has no AI, so drive the rig from
   *  the interpolated position it is given. Never touches combat state. */
  animatePresentation(dt) {
    const ph = this.phase || 1;
    const nx = this.x, ny = this.y;
    // Approximate velocity from the puppet's own drift: the host's position
    // arrives at 10Hz and terraria.js lerps it, so the delta is the swim.
    const spd = Math.hypot((this.vx = nx - (this._ppX == null ? nx : this._ppX)) / Math.max(dt, 1e-4),
      (this.vy = ny - (this._ppY == null ? ny : this._ppY)) / Math.max(dt, 1e-4));
    this._ppX = nx; this._ppY = ny;
    this.animT = (this.animT || 0) + dt;
    this.deadT = this.dead ? (this.deadT || 0) + dt : 0;
    this.hitFlash = Math.max(0, (this.hitFlash || 0) - dt);
    this.skillGlow = Math.max(0, (this.skillGlow || 0) - dt * 2);
    this.phaseFlash = Math.max(0, (this.phaseFlash || 0) - dt * 1.2);
    this.exhaustT = Math.max(0, (this.exhaustT || 0) - dt);
    this.vanishT = Math.max(0, (this.vanishT || 0) - dt);
    this.blinkCd = (this.blinkCd || 2) - dt;
    if (this.blinkCd <= 0) { this.blink = 1; this.blinkCd = 2.4 + Math.random() * 3.6; }
    this.blink = Math.max(0, (this.blink || 0) - dt * 6);
    this._rigPresentation(dt, spd, ph);
    // A guest never simulates the fight, so the pose comes from what the host
    // actually replicates: alive/dead, phase, and the phases' own timers.
    this.poseMode = this.dead ? 'death'
      : this.exhaustT > 0 ? 'exhausted'
        : ph === 3 ? 'extinction_hunt'
          : ph === 2 ? 'swim'
            : spd < 60 ? 'idle' : spd > 620 ? 'fast_swim' : 'swim';
  }

  /**
   * ---- VFX detail level, read from the game's OWN quality dial. -----------
   * `game.particleScale` already folds the quality mode (auto/high/balanced/
   * low) together with the effects setting (full/reduced/minimal), and the
   * particle system consumes the same number. The boss VFX reads it too, so
   * there is exactly one source of truth and LOW genuinely draws less while
   * every telegraph keeps its full silhouette.
   * Returns 0.25 .. 1.
   */
  _fxDetail() {
    const g = this.game;
    let d = (g && Number.isFinite(g.particleScale)) ? g.particleScale : 1;
    if (g && g.quality && g.quality.lowQuality) d = Math.min(d, 0.4);
    return Math.max(0.25, Math.min(1, d));
  }

  /** World-space point of the mouth: where suction and bites should converge. */
  _mouthWorld() {
    const face = this.flipSmooth == null ? (this.faceDir || 1) : this.flipSmooth;
    const f = face >= 0 ? 1 : -1;
    return {
      x: this.x + this.width * 0.5 + f * this.width * 0.34,
      y: this.y + this.height * 0.5 + (this.bob || 0) * 0.5
    };
  }

  // ==========================================================================
  // POOLED BOSS VFX — the EXECUTION + AFTERMATH half of every skill.
  //
  // A telegraph says "this is coming"; these say "it happened". They are a
  // fixed array of recycled records (no per-frame allocation, no new canvas,
  // no gradients): a slot is taken from the pool, advanced, and returned when
  // its life runs out. All of them are drawn in WORLD space and culled against
  // the camera, so a boss off-screen costs nothing.
  //
  // Nothing in here can touch damage: they are pure presentation, driven by
  // the same events that already fire in resolvePending().
  // ==========================================================================
  _fxSpawn(kind, x, y, o = {}) {
    const rec = this._fxPool.length ? this._fxPool.pop()
      : { kind: '', x: 0, y: 0, t: 0, life: 1, r0: 0, r1: 0, ang: 0, spin: 0, wide: 1 };
    rec.kind = kind; rec.x = x; rec.y = y;
    rec.t = 0; rec.life = o.life || 0.45;
    rec.r0 = o.r0 || 0; rec.r1 = o.r1 || 120;
    rec.ang = o.ang || 0; rec.spin = o.spin || 0;
    rec.wide = o.wide == null ? 1 : o.wide;
    // Bounded: a long chain must never grow the live list without limit.
    if (this.fx.length < 24) this.fx.push(rec); else this._fxPool.push(rec);
    return rec;
  }

  _fxUpdate(dt) {
    const fx = this.fx;
    for (let i = fx.length - 1; i >= 0; i--) {
      const f = fx[i];
      f.t += dt;
      if (f.spin) f.ang += f.spin * dt;
      if (f.t >= f.life) {
        fx.splice(i, 1);
        if (this._fxPool.length < 24) this._fxPool.push(f);
      }
    }
  }

  /** Is this world point inside the camera view (with a margin)? */
  _fxOnScreen(x, y, camera, w, h, pad = 220) {
    return x + pad > camera.x && x - pad < camera.x + w
      && y + pad > camera.y && y - pad < camera.y + h;
  }

  _fxDraw(ctx, camera) {
    const fx = this.fx;
    if (!fx.length) return;
    const W = this.game && this.game.canvas ? this.game.canvas.width : 960;
    const H = this.game && this.game.canvas ? this.game.canvas.height : 540;
    const q = this._fxDetail();
    ctx.save();
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    for (let i = 0; i < fx.length; i++) {
      const f = fx[i];
      if (!this._fxOnScreen(f.x, f.y, camera, W, H)) continue;
      const k = Math.max(0, Math.min(1, f.t / f.life));   // 0 -> 1
      const sx = f.x - camera.x, sy = f.y - camera.y;
      // Ease: fast out, slow settle — every FX uses one curve family.
      const e = 1 - Math.pow(1 - k, 2.4);
      // ====================================================================
      // GLOBAL FX UPGRADE — every effect gets three things it used to lack:
      //   1. a HORIZONTAL SHEAR. Water rings around a moving body squash
      //      vertically and stretch along the travel direction, so a ring
      //      spawned by a charge is an ellipse aligned to the charge, not a
      //      circle. Every radial FX now reads f.ang as its major axis.
      //   2. a CAUSTIC CORE: a soft additive glow at the origin that fades
      //      faster than the ring, so impacts light the water around them
      //      the way a real submerged detonation does.
      //   3. LAYERED BUBBLES: a deterministic ring of small bubbles riding
      //      the expanding front. This is the single detail that sells an
      //      effect as water — the old FX had geometry but no air.
      // ====================================================================
      const shear = f.ang ? Math.cos(f.ang) : 1;
      const shearPerp = f.ang ? Math.sin(f.ang) : 0;
      const squash = 0.72 + 0.28 * Math.abs(shear);
      const glowFor = (rad, strength, tint) => {
        if (q < 0.4) return;
        ctx.save();
        ctx.globalCompositeOperation = 'lighter';
        const g = ctx.createRadialGradient(sx, sy, 0, sx, sy, rad);
        g.addColorStop(0, `rgba(${tint}, ${(strength * Math.pow(1 - k, 1.6)).toFixed(3)})`);
        g.addColorStop(1, `rgba(${tint}, 0)`);
        ctx.fillStyle = g;
        ctx.beginPath(); ctx.arc(sx, sy, rad, 0, Math.PI * 2); ctx.fill();
        ctx.restore();
      };
      const bubblesOnRing = (r, count, tint, maxR) => {
        if (q < 0.5) return;
        const n = q > 0.75 ? count : Math.ceil(count * 0.6);
        ctx.strokeStyle = `rgba(${tint}, ${(0.5 * (1 - k)).toFixed(3)})`;
        ctx.lineWidth = 1.2;
        for (let b = 0; b < n; b++) {
          const a = (b / n) * Math.PI * 2 + (f.spin || 0) * k * 3;
          const br = Math.max(0.8, maxR * (1 - k) * (0.55 + 0.45 * Math.sin(b * 2.3)));
          const bx = sx + Math.cos(a) * r * shear + Math.sin(a) * r * 0.15;
          const by = sy + Math.sin(a) * r * squash + Math.cos(a) * r * 0.15;
          ctx.beginPath(); ctx.arc(bx, by, br, 0, Math.PI * 2); ctx.stroke();
        }
      };
      // Caustic core for anything that is an impact.
      if (f.kind === 'burst' || f.kind === 'foam' || f.kind === 'splash' ||
          f.kind === 'ring' || f.kind === 'collapse') {
        glowFor((f.r1 || 140) * 0.5, 0.5, '148, 232, 253');
      }
      if (f.kind === 'ring') {
        // ---- expanding pressure ring: thin, crisp, no fill ---------------
        // SHEARED into the travel direction when the spawner has one, so a
        // charge's pressure wave is an ellipse pointing along the charge.
        const r = f.r0 + (f.r1 - f.r0) * e;
        ctx.save();
        if (f.ang) {
          ctx.translate(sx, sy);
          ctx.rotate(f.ang);
          ctx.scale(1, squash);
          ctx.translate(-sx, -sy);
        }
        ctx.strokeStyle = 'rgba(125, 211, 252, ' + (0.5 * (1 - k)).toFixed(3) + ')';
        ctx.lineWidth = Math.max(1, 3.4 * (1 - k * 0.55));
        ctx.beginPath(); ctx.arc(sx, sy, r, 0, Math.PI * 2); ctx.stroke();
        // a second, tighter foam ring slightly behind: two lines, not a disc
        if (q > 0.5) {
          const r2 = r * 0.72;
          ctx.strokeStyle = 'rgba(224, 242, 254, ' + (0.32 * (1 - k)).toFixed(3) + ')';
          ctx.lineWidth = 1.6;
          ctx.beginPath(); ctx.arc(sx, sy, r2, 0, Math.PI * 2); ctx.stroke();
        }
        // radial ticks that fade as the ring passes them
        const ticks = q > 0.7 ? 10 : 6;
        ctx.strokeStyle = 'rgba(186, 230, 253, ' + (0.4 * (1 - k)).toFixed(3) + ')';
        ctx.lineWidth = 2;
        for (let t = 0; t < ticks; t++) {
          const a = (t / ticks) * Math.PI * 2 + f.ang;
          const l = 8 + 16 * (1 - k);
          ctx.beginPath();
          ctx.moveTo(sx + Math.cos(a) * r, sy + Math.sin(a) * r);
          ctx.lineTo(sx + Math.cos(a) * (r + l), sy + Math.sin(a) * (r + l));
          ctx.stroke();
        }
        bubblesOnRing(r, 14, '224, 242, 254', 4.2);
        ctx.restore();   // matches the ring's shear save()
      } else if (f.kind === 'arc') {
        // ---- a widening sweep (tail sweep): an arc ring, not a wedge -----
        const r = f.r0 + (f.r1 - f.r0) * e;
        const half = f.wide * (1 - 0.25 * k);
        ctx.strokeStyle = 'rgba(186, 230, 253, ' + (0.55 * (1 - k * 0.7)).toFixed(3) + ')';
        ctx.lineWidth = Math.max(1.5, 5 * (1 - k * 0.5));
        ctx.beginPath(); ctx.arc(sx, sy, r, f.ang - half, f.ang + half); ctx.stroke();
        ctx.strokeStyle = 'rgba(248, 113, 113, ' + (0.5 * (1 - k)).toFixed(3) + ')';
        ctx.lineWidth = 2;
        ctx.beginPath(); ctx.arc(sx, sy, r * 0.94, f.ang - half * 0.9, f.ang + half * 0.9); ctx.stroke();
      } else if (f.kind === 'collapse') {
        // ---- the bite closing: everything snaps INWARD -------------------
        const r = f.r1 * (1 - e * 0.82);
        ctx.strokeStyle = 'rgba(224, 242, 254, ' + (0.7 * (1 - k * 0.85)).toFixed(3) + ')';
        ctx.lineWidth = Math.max(1, 4 * (1 - k));
        ctx.beginPath(); ctx.arc(sx, sy, r, 0, Math.PI * 2); ctx.stroke();
        // inward streaks: same spiral family as the telegraph
        const arms = q > 0.6 ? 7 : 4;
        ctx.strokeStyle = 'rgba(125, 211, 252, ' + (0.45 * (1 - k)).toFixed(3) + ')';
        ctx.lineWidth = 1.8;
        for (let s = 0; s < arms; s++) {
          const a = (s / arms) * Math.PI * 2 + f.ang + e * 2.2;
          const r0 = r * 1.25, r1 = r * 0.32;
          ctx.beginPath();
          ctx.moveTo(sx + Math.cos(a) * r0, sy + Math.sin(a) * r0);
          ctx.quadraticCurveTo(
            sx + Math.cos(a + 0.5) * r * 0.9, sy + Math.sin(a + 0.5) * r * 0.9,
            sx + Math.cos(a + 0.9) * r1, sy + Math.sin(a + 0.9) * r1);
          ctx.stroke();
        }
      } else if (f.kind === 'burst') {
        // ---- compact impact: a tight star + a spike ring, no screen flash
        const r = f.r0 + (f.r1 - f.r0) * (1 - Math.pow(1 - k, 3));
        const spikes = q > 0.7 ? 9 : 6;
        ctx.strokeStyle = 'rgba(224, 242, 254, ' + (0.85 * (1 - k)).toFixed(3) + ')';
        ctx.lineWidth = Math.max(1.2, 3.2 * (1 - k));
        for (let s = 0; s < spikes; s++) {
          const a = (s / spikes) * Math.PI * 2 + f.ang;
          const l = r * (0.7 + 0.3 * Math.sin(s * 2.3));
          ctx.beginPath();
          ctx.moveTo(sx + Math.cos(a) * r * 0.3, sy + Math.sin(a) * r * 0.3);
          ctx.lineTo(sx + Math.cos(a) * l, sy + Math.sin(a) * l);
          ctx.stroke();
        }
        ctx.fillStyle = 'rgba(255, 255, 255, ' + (0.75 * Math.pow(1 - k, 2)).toFixed(3) + ')';
        ctx.beginPath(); ctx.arc(sx, sy, r * 0.26 * (1 - k * 0.5), 0, Math.PI * 2); ctx.fill();
      } else if (f.kind === 'wake') {
        // ---- tapered wake behind a charge: drawn along its own path ------
        const len = f.r1 * e, wide = f.r0 * (1 - k * 0.8) * f.wide;
        const c = Math.cos(f.ang), s = Math.sin(f.ang);
        ctx.fillStyle = 'rgba(148, 210, 245, ' + (0.16 * (1 - k)).toFixed(3) + ')';
        ctx.beginPath();
        ctx.moveTo(sx, sy);
        ctx.lineTo(sx - c * len - s * wide * 0.5, sy - s * len + c * wide * 0.5);
        ctx.lineTo(sx - c * len * 1.15, sy - s * len * 1.15);
        ctx.lineTo(sx - c * len + s * wide * 0.5, sy - s * len - c * wide * 0.5);
        ctx.closePath(); ctx.fill();
        ctx.strokeStyle = 'rgba(224, 242, 254, ' + (0.45 * (1 - k)).toFixed(3) + ')';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(sx - c * len - s * wide * 0.5, sy - s * len + c * wide * 0.5);
        ctx.lineTo(sx - c * len * 1.1, sy - s * len * 1.1);
        ctx.lineTo(sx - c * len + s * wide * 0.5, sy - s * len - c * wide * 0.5);
        ctx.stroke();
      } else if (f.kind === 'foam') {
        // ---- PRESSURE FOAM: a filled disc of churned water ---------------
        // A pressure wave moves WATER, and water displaced visibly is a
        // volume. This is a filled radial plume (not a stroked ring): a pale
        // core fading out through foam blue, studded with bubbles that pop as
        // the plume passes them. It is what makes a charge read as a body of
        // water moving rather than as a drawn line.
        const r = f.r0 + (f.r1 - f.r0) * e;
        const grad = ctx.createRadialGradient(sx, sy, r * 0.12, sx, sy, r);
        grad.addColorStop(0, 'rgba(240, 253, 255, ' + (0.62 * (1 - k * 0.85)).toFixed(3) + ')');
        grad.addColorStop(0.55, 'rgba(148, 226, 253, ' + (0.34 * (1 - k * 0.9)).toFixed(3) + ')');
        grad.addColorStop(1, 'rgba(70, 150, 200, 0)');
        ctx.fillStyle = grad;
        ctx.beginPath(); ctx.arc(sx, sy, r, 0, Math.PI * 2); ctx.fill();
        // Bubbles: a stable ring of small circles that drift outward with the
        // plume and shrink as they pop. Deterministic per index, so the plume
        // keeps its shape frame to frame.
        const bubbles = q > 0.7 ? 12 : 7;
        for (let b = 0; b < bubbles; b++) {
          const a = (b / bubbles) * Math.PI * 2 + f.ang + e * 0.6;
          const rr = r * (0.3 + 0.65 * e) * (0.7 + 0.3 * Math.sin(b * 2.7));
          const br = Math.max(1, 4.2 * (1 - k) * (0.6 + 0.4 * Math.sin(b * 1.9)));
          const bx = sx + Math.cos(a) * rr, by = sy + Math.sin(a) * rr;
          ctx.fillStyle = 'rgba(224, 242, 254, ' + (0.5 * (1 - k)).toFixed(3) + ')';
          ctx.beginPath(); ctx.arc(bx, by, br, 0, Math.PI * 2); ctx.fill();
          ctx.strokeStyle = 'rgba(255, 255, 255, ' + (0.55 * (1 - k)).toFixed(3) + ')';
          ctx.lineWidth = 1;
          ctx.beginPath(); ctx.arc(bx - br * 0.3, by - br * 0.3, br * 0.5, 0, Math.PI * 2); ctx.stroke();
        }
        // The displaced rim: one bright crest line where the wave is breaking.
        ctx.strokeStyle = 'rgba(255, 255, 255, ' + (0.4 * (1 - k)).toFixed(3) + ')';
        ctx.lineWidth = 2.2;
        ctx.beginPath(); ctx.arc(sx, sy, r * 0.97, f.ang, f.ang + Math.PI * 1.15); ctx.stroke();
      } else if (f.kind === 'bubbleCluster') {
        // ---- RISING BUBBLES: water torn loose by a bite or a dash --------
        // A column of bubbles climbing with a wobble, each sized by its index
        // and popping before the top of the column: air from a submerged kill,
        // which is the single most readable "something big just moved" tell.
        const n = q > 0.6 ? 9 : 5;
        for (let b = 0; b < n; b++) {
          const f0 = b / n;
          const rise = (1 - f0) * 1.0 + 0.02;
          const by = sy - e * f.r1 * rise;
          const bx = sx + Math.sin(e * 5 + b * 1.3 + f.ang) * 10 + (b - n / 2) * 2.4;
          const life = Math.max(0, 1 - Math.max(0, e - 0.75) / 0.25);
          const br = Math.max(0.5, (1.6 + 2.6 * ((b * 37) % 5) / 4) * life);
          ctx.strokeStyle = 'rgba(226, 246, 255, ' + (0.75 * life).toFixed(3) + ')';
          ctx.lineWidth = 1.2;
          ctx.beginPath(); ctx.arc(bx, by, br, 0, Math.PI * 2); ctx.stroke();
          ctx.fillStyle = 'rgba(255, 255, 255, ' + (0.28 * life).toFixed(3) + ')';
          ctx.beginPath(); ctx.arc(bx, by, br * 0.55, 0, Math.PI * 2); ctx.fill();
        }
      } else if (f.kind === 'splash') {
        // ---- SPLASH CROWN: the water thrown out of an impact ------------
        // A filled crescent shoulder on each side of the impact, plus a jet of
        // droplets. This is the difference between a dot and a splash.
        const r = f.r0 + (f.r1 - f.r0) * e;
        const fade = 1 - Math.pow(k, 1.6);
        for (const side of [-1, 1]) {
          ctx.fillStyle = 'rgba(186, 232, 253, ' + (0.42 * fade).toFixed(3) + ')';
          ctx.beginPath();
          ctx.moveTo(sx, sy);
          ctx.quadraticCurveTo(
            sx + side * r * 0.75, sy - r * (0.55 + 0.35 * e),
            sx + side * r * 1.15, sy - r * (0.05 + 0.25 * e));
          ctx.quadraticCurveTo(sx + side * r * 0.6, sy + r * 0.12, sx, sy);
          ctx.closePath(); ctx.fill();
          ctx.strokeStyle = 'rgba(255, 255, 255, ' + (0.6 * fade).toFixed(3) + ')';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(sx, sy);
          ctx.quadraticCurveTo(
            sx + side * r * 0.75, sy - r * (0.55 + 0.35 * e),
            sx + side * r * 1.15, sy - r * (0.05 + 0.25 * e));
          ctx.stroke();
        }
        // Droplet jet.
        const drops = q > 0.6 ? 10 : 6;
        for (let d = 0; d < drops; d++) {
          const f0 = d / drops;
          const side = (d % 2) ? 1 : -1;
          const dr = r * (0.85 + 0.5 * f0);
          const dx = sx + side * dr * (0.45 + 0.55 * f0);
          const dy = sy - r * (0.9 + 0.5 * f0) * (1 - e * 0.25) + e * 14;
          const dl = Math.max(1, 3 * fade);
          ctx.fillStyle = 'rgba(240, 253, 255, ' + (0.8 * fade).toFixed(3) + ')';
          ctx.fillRect(dx, dy, dl, dl + 1);
        }
      }
    }
    ctx.restore();
  }

  update(dt, target, projectiles, sound, particles) {
    this.animT += dt;
    // Pooled VFX tick: the execution + aftermath of every skill. Pure
    // presentation, and free when nothing is alive.
    this._fxUpdate(dt);
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
    const dmgMul = 1 + (ph - 1) * 0.5;
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
          this._pullTarget(target, (dx / d) * pull, (dy / d) * pull * 0.6);
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
            this.startDash(Math.cos(a) * 1240 * power, Math.sin(a) * 1240 * power,
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
      this.startDash(Math.cos(a) * 1150 * power, Math.sin(a) * 1150 * power,
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
        // ---- EXECUTION: a tapered wake that follows the ACTUAL trajectory.
        // One record per step interval, aimed along the live velocity, so the
        // wake curves with the charge instead of being a fixed polygon.
        this._wakeT = (this._wakeT || 0) - dt;
        if (this._wakeT <= 0) {
          this._wakeT = 0.045;
          this._fxSpawn('wake', this.x + this.width * 0.5, this.y + this.height * 0.5, {
            r0: this.height * (0.3 + (this.surge || 0) * 0.16),
            r1: 150 + Math.hypot(d.vx, d.vy) * 0.16,
            ang: Math.atan2(d.vy, d.vx),
            life: 0.34, spin: 0
          });
          // ---- CHARGE UPGRADE: the wake is a SHOCKWAVE, not a stripe ---------
          // A 2300-velocity body moving through water does not leave a line, it
          // leaves a pressure-plume with a bow wave. Every wake step now also
          // drops a foam bloom BELOW/behind the body (the displaced column) and
          // a bubble cluster torn loose from the flank, so the charge carves a
          // visible trough in the water with air curling up out of it.
          this._fxSpawn('foam', this.x + this.width * 0.5 - this.faceDir * this.width * 0.16,
            this.y + this.height * 0.5 + this.height * 0.2, {
              r0: this.height * 0.22, r1: this.height * 0.55 + (this.surge || 0) * 20,
              life: 0.4, ang: Math.atan2(d.vy, d.vx) + Math.PI
            });
          if (this._fxDetail() > 0.55) {
            this._fxSpawn('bubbleCluster',
              this.x + this.width * 0.5 - this.faceDir * this.width * 0.3,
              this.y + this.height * 0.5 + this.height * 0.1,
              { r0: 0, r1: 60, life: 0.7 });
          }
        }
        // Flank spray, scaled by the game's own effects dial.
        const spray = this._fxDetail();
        if (particles && Math.random() < 0.55 * spray) {
          particles.addParticle(this.x + this.width * 0.5 - this.faceDir * this.width * 0.3,
            this.y + this.height * 0.5,
            -d.vx * 0.05 + (Math.random() - 0.5) * 3, (Math.random() - 0.5) * 3,
            'rgba(186, 230, 253, 0.5)', 2.6, 0.4, 0, true);
        }
        // One bite per charge: contact while the jaws are open, and only in
        // the first 60% of the run so a charge that overshoots cannot graze
        // you a second time on the way past.
        if (!d.hit && d.t > d.dur * 0.4 && this.jawOpen > 0.45
          && target && this.overlapsPlayer(target)) {
          d.hit = true;
          // EXECUTION: the impact is a compact burst at the contact point, not
          // a screen-wide flash. THE BITE, upgraded: a foam plume where the jaws
          // close, a splash crown thrown out of the water, a column of bubbles,
          // and a pressure ring that starts at the CONTACT point rather than the
          // body centre — so the hit reads as "the teeth met you here".
          const mouth = this._mouthWorld();
          this._fxSpawn('burst', mouth.x, mouth.y,
            { r0: 24, r1: 96, life: 0.3, ang: Math.random() * 6.28 });
          this._fxSpawn('foam', mouth.x, mouth.y,
            { r0: 26, r1: 150, life: 0.45, ang: Math.random() * 6.28 });
          this._fxSpawn('splash', mouth.x, mouth.y,
            { r0: 28, r1: 120, life: 0.4, ang: Math.random() * 6.28 });
          this._fxSpawn('bubbleCluster', mouth.x, mouth.y,
            { r0: 0, r1: 85, life: 0.9 });
          this._fxSpawn('ring', mouth.x, mouth.y,
            { r0: 60, r1: 230 * (1 + (this.phase - 1) * 0.4), life: 0.45 });
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
          // Recovery window: the charge has weight, so it coasts and swings
          // wide instead of snapping straight back into the hunting circle.
          this.recoverT = 0.55 + this.phase * 0.12;
          // AFTERMATH: a pressure ring where the charge stopped, drifting out
          // over the water instead of vanishing on one frame.
          this._fxSpawn('ring', this.x + this.width * 0.5, this.y + this.height * 0.5,
            { r0: 60, r1: 210 + this.phase * 40, life: 0.5, ang: Math.random() * 6.28 });
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
            // NOTE: dx/dy point FROM the shark TO the player, so the suction
            // displacement must be subtracted to drag the player INTO the
            // spin. The old raw write added them, which shoved the player AWAY
            // from the vortex — the opposite of the tell, the death message and
            // the graze-hit check, which all assume the player is pulled in.
            this._pullTarget(target, -(dx / dist) * pull, -(dy / dist) * pull * 0.75);
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
        if ((this.recoverT || 0) > 0) {
          // POST-CHARGE RECOVERY: no steering, heavy drag. The beast keeps
          // travelling where it pointed, swings wide, then picks the hunt up.
          this.recoverT = Math.max(0, this.recoverT - dt);
          const coast = Math.pow(0.22, dt);
          this.vx = (this.vx || 0) * coast;
          this.vy = (this.vy || 0) * coast;
        } else {
          this.vx = (this.vx || 0) + (dx / dist) * maxSpeed * arrive * dt * 3.2;
          this.vy = (this.vy || 0) + (dy / dist) * maxSpeed * arrive * dt * 3.2;
          const drag = Math.pow(0.06, dt);
          this.vx *= drag;
          this.vy *= drag;
        }
        this.x += (this.vx || 0) * dt;
        this.y += (this.vy || 0) * dt;
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
    // Presentation rig (springs, telegraph, jaw, swim cycle). Kept in one
    // place so the host simulation and the guest puppet cannot drift apart.
    this._rigPresentation(dt, speedNow, ph);
    // Lean into the direction of travel and skew on acceleration: the body
    // tips forward as it commits to a charge, then settles behind it.
    this.lean = (this.lean || 0) + (((this.vx || 0) / 900) - (this.lean || 0)) * Math.min(1, dt * 4);
    this.skew = Math.max(-0.3, Math.min(0.3,
      ((this.vx || 0) - (this._pvxBefore || 0)) * 0.0006 + (this.skew || 0) * Math.pow(0.02, dt)));
    this._pvxBefore = this.vx || 0;

    // ---- Animation rig: additive channels the render integrates -----------
    // Spine flexion (radians of bend travelling down the tail) — the visible
    // swim cycle. Charges straighten the spine; a spin coils it hard.
    const dashingNow = !!this.dash;
    const bendTarget = dashingNow ? 0.05
      : this.tornadoT > 0 ? 0.42 * Math.sin(this.swimPhase * 6)
        : Math.sin(this.swimPhase * 0.9) * (0.12 + Math.min(0.14, speedNow / 4200));
    this.tailBend += (bendTarget - this.tailBend) * Math.min(1, dt * 6);
    // Pectoral kick: a periodic flap impulse, snapping hard on a charge.
    this.finKick += dt * (2.2 + Math.min(2.4, speedNow / 260) + (dashingNow ? 3 : 0));
    if (this.finKick > 1) this.finKick -= 1;
    // Gill flare widens with breath, speed and any big skill wind-up.
    const gillTarget = (this.breath || 1) * 0.5 + Math.min(1, speedNow / 900) * 0.5
      + (this.jawOpen > 0.5 ? 0.35 : 0) + (this.surge || 0) * 0.3;
    this.gillFlare += (gillTarget - this.gillFlare) * Math.min(1, dt * 5);
    // A slow blink on its own clock; a hit or a phase step slams it shut.
    this.blinkCd -= dt;
    if (this.blinkCd <= 0) { this.blink = 1; this.blinkCd = 2.4 + Math.random() * 3.6; }
    if (this.hitFlash > 0.15 || this.phaseFlash > 1.2) this.blink = Math.max(this.blink, 0.7);
    this.blink = Math.max(0, this.blink - dt * 6);
    // Roll/yaw cheat: banking into a turn and pitching into a dive give the
    // flat side-view a sense of swimming through a volume, not a plane.
    const rollTarget = ((this.vy || 0) / 1400) * 0.5 + (this.tornadoT > 0 ? 0.9 : 0)
      + (this.turnKick || 0) * 0.5 + (this.anticip || 0) * 0.12;
    this.roll += (rollTarget - this.roll) * Math.min(1, dt * 3);
    const yawTarget = ((this.vx || 0) / 1600) * 0.5 + (this.turnKick || 0) * 0.35;
    this.yaw += (yawTarget - this.yaw) * Math.min(1, dt * 3);
    // ---- Facing: eased, so a direction change is a PIVOT, not a snap. The
    // render scales x by this value, so the animal squashes through zero and
    // expands out the other way. `turnKick` fires once, on the crossing.
    const fs0 = this.flipSmooth == null ? (this.faceDir || 1) : this.flipSmooth;
    const sign0 = fs0 >= 0 ? 1 : -1;
    this.flipSmooth = fs0 + ((this.faceDir || 1) - fs0) * Math.min(1, dt * 9);
    const sign1 = this.flipSmooth >= 0 ? 1 : -1;
    if (sign1 !== sign0) this.turnKick = 1;
    this.turnKick = Math.max(0, (this.turnKick || 0) - dt * 3.4);
    // A mid-turn tail coil: the caudal drags behind the pivot.
    this.tailBend += (this.turnKick || 0) * 0.5 * dt * 6;
    // ---- Damage reaction: one flinch, decaying. It never touches the
    // proportions for longer than a few frames.
    this.hitReact = Math.max(0, (this.hitReact || 0) - dt * 4);
    if ((this.hitReact || 0) > 0.9) {
      this.recoilV += 9;                       // head snaps back
      this.blink = Math.max(this.blink, 1);   // and it winces
    }
    // ---- DEATH SEQUENCE: a final violent bite, then the wreck hangs slack,
    // sinks and fades. `deadT` is accumulated exactly once (see below), so the
    // sequence can never restart.
    if (this.dead) {
      this.deadT = (this.deadT || 0) + dt;
      this.jawTarget = this.deadT < 0.45 ? 1 : 0.55;   // snap, then dangle
      this.gillFlare = 0;
    }
    // Droop: exhaustion sags every fin and half-lids the eye, and recovers
    // slowly enough that the post-hunt damage window reads as a spent beast.
    const droopTarget = this.dead ? 1
      : this.exhaustT > 0 ? 1 : this.vanishT > 0 ? 0.5 : 0;
    this.droop += (droopTarget - this.droop) * Math.min(1, dt * 2.2);
    // ---- POSE MODE: which clip of the reference sheet the animal is running.
    // The render reads this to tune the swim wave, the fin beat and the jaw, so
    // every named clip in assets/bosses/megalodon/ has a live in-game pose.
    // The attack AI never reads it: it is written FROM the AI's state.
    let pose = 'swim';
    if (this.dead) pose = 'death';
    else if (this.hitFlash > 0.12) pose = 'hurt';
    else if (this.exhaustT > 0) pose = 'exhausted';
    else if (this.vanishT > 0) pose = 'apex_execution';
    else if (this.tornadoT > 0) pose = 'sharknado';
    else if (this.suctionT > 0 || (this.pending && this.pending.type === 'devouring_maw')) pose = 'devouring_maw';
    else if (this.hunt) pose = 'extinction_hunt';
    else if (this.depthDive > 0 || (this.pending && this.pending.type === 'depth_warning')) pose = 'depth_charge';
    else if (this.pending && this.pending.type === 'tail_sweep') pose = 'tail_sweep';
    else if (this.pending && (this.pending.type === 'crushing_bite'
        || this.pending.type === 'extinction_bite'
        || this.pending.type === 'predator_dash')) pose = 'bite';
    else if (this.pending && this.pending.type === 'tooth_barrage') pose = 'tooth_barrage';
    else if (this.pending && this.pending.type === 'frenzy_rush') pose = 'frenzy_rush';
    else if (this.frenzy > 0 && speedNow < 120) pose = 'feeding_frenzy';
    // A dash reads as its own clip: the frenzy rush chains three of them, the
    // plain predator dash is the fast swim.
    else if (this.dash) pose = (this.dash.kind === 'frenzy'
      || this.dash.kind === 'frenzy_rush') ? 'frenzy_rush' : 'fast_swim';
    else if (speedNow > 620) pose = 'fast_swim';
    else if ((this.flipSmooth == null ? 1 : this.flipSmooth) < 0 !== (this.faceDir || 1) < 0) pose = 'turn';
    else if (speedNow < 60) pose = 'idle';
    else if ((this.recoverT || 0) > 0) pose = 'swim';
    this._lastFaceDir = this.faceDir;
    this.poseMode = pose;
    // (deadT is accumulated in the death block above, exactly once per frame.)
    // CHARGE TRAIL: spine snapshots whenever it moves fast enough to smear.
    // The ghosts re-run the same spine sampler with the phase they were
    // caught at, so an afterimage is the animal a frame ago, not a rectangle.
    this._trailT = (this._trailT || 0) - dt;
    if ((speedNow > 620 || dashingNow) && this._trailT <= 0) {
      this._trailT = 0.045;
      if (!this.trail) this.trail = [];
      this.trail.push({
        x: this.x, y: this.y, sway: this.sway || 0, bob: this.bob || 0,
        faceDir: this.faceDir || 1, age: 0, st: this._spineState()
      });
      if (this.trail.length > 6) this.trail.shift();
    }
    for (let i = this.trail.length - 1; i >= 0; i--) {
      this.trail[i].age += dt;
      if (this.trail[i].age > 0.3) this.trail.splice(i, 1);
    }
    // Wake turbulence: emit a trail of bubbles off the caudal fin while moving.
    if (particles && speedNow > 240 && (this.wakeT || 0) <= 0) {
      this.wakeT = 0.05;
      const tailPx = this.x + this.width * 0.5 - this.faceDir * this.width * 0.46;
      particles.addParticle(tailPx + (Math.random() - 0.5) * 26,
        this.y + this.height * 0.5 + (Math.random() - 0.5) * 34,
        -this.vx * 0.04 + (Math.random() - 0.5) * 2, -1 - Math.random() * 1.5,
        'rgba(186, 230, 253, 0.4)', 2 + Math.random() * 2, 0.9, -0.02, true);
    }
    if (this.wakeT > 0) this.wakeT -= dt;

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
          this._pullTarget(target, (dx / d) * pull, (dy / d) * pull * 0.7);
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
      // NERF PASS: the shark's difficulty was not its damage, it was that it
    // never stopped. The phase-3 minimum cooldown rises from 1.1s to 1.6s, the
    // phase-3 terminal chain no longer re-arms itself instantly, and the attack
    // cadence only ever scales TOWARD the base with the frenzy ladder instead of
    // accelerating past it — so the fight leaves room to breathe and heal.
    this.attackTimer = Math.max(1.6, (3.9 - ph * 0.6)) / Math.max(1, atkMul * frenzyMul * 0.55);
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
    const dmgMul = 1 + (ph - 1) * 0.5;
    const power = 1 + (ph - 1) * 0.55;
    const ccx = this.x + this.width * 0.5;
    const ccy = this.y + this.height * 0.5;
    const mouth = this._mouthWorld();
    const q = this._fxDetail();

    if (p.type === 'predator_dash') {
      // The charge: lock onto where you WERE and go.
      const tx = (p.target ? p.target.x : ppx) - ccx;
      const ty = (p.target ? p.target.y : ppy) - ccy;
      const a = Math.atan2(ty, tx);
      this.faceDir = Math.cos(a) >= 0 ? 1 : -1;
      this.jawTarget = 0.8;
      // Committed a touch slower than the old (1250 + ph*130): it still
      // closes an arena gap fast and still out-runs a fleeing player, but a
      // strafing dodge now has a real window — without turning it into a crawl.
      const dashSp = (1030 + ph * 105) * (1 + (ph - 1) * 0.35);
      this.startDash(Math.cos(a) * dashSp, Math.sin(a) * dashSp,
        0.75, (100 + ph * 26) * dmgMul, 'dash');
      // EXECUTION: a burst at the jaws the instant it commits. No screen flash.
      this._fxSpawn('burst', mouth.x, mouth.y,
        { r0: 22, r1: 86, life: 0.3, ang: a });
      // The water it is displacing: a foam plume blooming at the jaws and a
      // splash crown as the charge tears free, so the dash leaves a visible
      // body of water behind it rather than a streak.
      this._fxSpawn('foam', mouth.x, mouth.y,
        { r0: 30, r1: 130 * power, life: 0.5, ang: a });
      this._fxSpawn('splash', mouth.x, mouth.y,
        { r0: 26, r1: 105 * power, life: 0.42, ang: a });
      if (q > 0.55) {
        this._fxSpawn('bubbleCluster', mouth.x, mouth.y,
          { r0: 0, r1: 90, life: 0.9, ang: a });
      }
      this.skillFX(particles, ccx, ccy, 'charge', { ang: a });
      if (sound) sound.playBossRoar();
    } else if (p.type === 'crushing_bite') {
      // A short, vicious lunge: the maw itself is the hit.
      const tx = (p.target ? p.target.x : ppx) - ccx;
      const ty = (p.target ? p.target.y : ppy) - ccy;
      const a = Math.atan2(ty, tx);
      this.faceDir = Math.cos(a) >= 0 ? 1 : -1;
      this.jawTarget = 1;
      this.startDash(Math.cos(a) * 760 * power, Math.sin(a) * 760 * power,
        0.42, (150 + ph * 34) * dmgMul, 'bite');
      // EXECUTION + AFTERMATH: a compact burst at the jaws, then a pressure
      // ring that stays where the lunge began.
      this._fxSpawn('burst', mouth.x, mouth.y,
        { r0: 18, r1: 82, life: 0.28, ang: a });
      this._fxSpawn('foam', mouth.x, mouth.y,
        { r0: 26, r1: 120 * power, life: 0.46, ang: a });
      // Bubbles torn loose by the strike: the aftermath that sells the hit.
      this._fxSpawn('bubbleCluster', mouth.x, mouth.y,
        { r0: 0, r1: 70, life: 1.0, ang: a });
      this._fxSpawn('ring', ccx, ccy, { r0: 70, r1: 200 * power, life: 0.45 });
      this.skillFX(particles, ccx, ccy, 'bite', { ang: a });
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
      // EXECUTION: a widening arc ring that matches the gameplay arc exactly.
      this._fxSpawn('arc', ccx, ccy, {
        r0: (p.radius || 220) * 0.4, r1: (p.radius || 220),
        wide: 1.15, ang: p.angle || 0, life: 0.4
      });
      // The displaced water the tail is dragging with it: a foam plume that
      // blooms at the body, plus a splash thrown out along the sweep.
      this._fxSpawn('foam', ccx, ccy, {
        r0: 40, r1: (p.radius || 220) * 0.9, life: 0.5, ang: p.angle || 0, wide: 0.7
      });
      this._fxSpawn('splash', ccx, ccy, {
        r0: 30, r1: (p.radius || 220) * 0.55, life: 0.4, ang: p.angle || 0
      });
      this.skillFX(particles, ccx, ccy, 'sweep', { radius: p.radius, ang: p.angle });
      this.skillImpact('sweep', 0.5);
      if (player) {
        const dx = ppx - ccx, dy = ppy - ccy;
        const dist = Math.hypot(dx, dy);
        const toP = Math.atan2(dy, dx);
        const dAng = Math.abs(((toP - (p.angle || 0) + Math.PI) % (Math.PI * 2)) - Math.PI);
        if (dist <= p.radius && dAng <= 1.15) {
          this.game.damagePlayer(Math.round((105 + ph * 26) * dmgMul), ccx,
            'The Megalodon’s tail sweep sent you flying!', true, ccy);
          // Knockback is ALREADY applied by damagePlayer (the `true` flag above,
          // sourced at ccx/ccy). Adding a second manual vx/vy shove here
          // double-knocked the player back every sweep, which — on a skill this
          // common — launched the player across the arena and made it impossible
          // to stay close enough to land hits. Keep the in-system knockback only.
          this.frenzy = Math.min(6, this.frenzy + 1);
          this.frenzyT = 6;
        }
      }
      if (sound) sound.playHit();
    } else if (p.type === 'hunt_call') {

      // The call that opens the hunting circle / the extinction chain:
      // a roar, a shockwave of bubbles, and the beast commits.
      this._fxSpawn('ring', ccx, ccy,
        { r0: 120, r1: 330 + ph * 60, life: 0.55 });
      this.skillFX(particles, ccx, ccy, 'call', {});
      if (sound) sound.playBossRoar();
      if (this.game && this.game.feel) this.game.feel.shake(0.4);
    } else if (p.type === 'sharknado') {
      // It tucks and spins for the duration; update() drags you inward.
      this.tornadoT = 2.3;
      // The vortex closes on itself the moment it forms.
      this._fxSpawn('collapse', ccx, ccy, {
        r0: 40, r1: (p.radius || 260), life: 0.5, ang: Math.random() * 6.28
      });
      // The water the vortex is actually pulling into a funnel: a foam core
      // and a column of bubbles drawn in from around the spin.
      this._fxSpawn('foam', ccx, ccy, {
        r0: 60, r1: (p.radius || 260), life: 0.6
      });
      this._fxSpawn('bubbleCluster', ccx, ccy, {
        r0: 0, r1: (p.radius || 260) * 0.7, life: 1.1
      });
      this.skillFX(particles, ccx, ccy, 'spin', { radius: p.radius });
      this.skillImpact('spin', 0.55);
      if (sound) sound.playBossLaser();
    } else if (p.type === 'tooth_barrage') {
      // A fan of razor teeth spat at where you stood.
      this.jawTarget = 1;
      this.fireTeeth(p.target ? p.target : { x: ppx, y: ppy });
      this._fxSpawn('burst', mouth.x, mouth.y, { r0: 14, r1: 70, life: 0.26 });
      this.skillFX(particles, p.x, p.y, 'teeth', {});
      if (sound) sound.playHit();
      this.recoilV += 5;
    } else if (p.type === 'depth_warning') {
      // The eruption itself fires from update()'s depthDive timer; the
      // warning marker just pays off its show here.
      this._fxSpawn('ring', p.x, p.y,
        { r0: 20, r1: (p.radius || 130), life: 0.5, wide: 0.6 });
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
      this.startDash(dir * 1950, 0, 1.1, (190 + this.phase * 40) * dmgMul, 'apex');
      this.skillFX(particles, this.x + this.width / 2, this.y + this.height / 2,
        'charge', { ang: dir > 0 ? 0 : Math.PI });
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
      // RELEASE: the vortex snaps inward and then the pressure ring snaps
      // out. Two crisp records, not a field of translucent circles. The
      // collapse radius is the suction radius the telegraph advertised, so
      // what the player dodged is what they see close.
      this._fxSpawn('collapse', ccx, ccy, { r0: 60, r1: p.radius || 420, life: 0.32 });
      this._fxSpawn('burst', mouth.x, mouth.y, { r0: 26, r1: 110, life: 0.3, ang: a });
      // The suction's payoff: a foam plume at the jaws, a splash crown where
      // the pressure was released, and a column of bubbles drawn up from the
      // funnel — the maw reads as it ate something, not as a line snappping.
      this._fxSpawn('foam', mouth.x, mouth.y, {
        r0: 40, r1: (p.radius || 420) * 0.55, life: 0.5, ang: a
      });
      this._fxSpawn('splash', mouth.x, mouth.y, {
        r0: 34, r1: 130, life: 0.45, ang: a
      });
      this._fxSpawn('bubbleCluster', ccx, ccy, {
        r0: 0, r1: (p.radius || 420) * 0.5, life: 1.1
      });
      this._fxSpawn('ring', ccx, ccy,
        { r0: 90, r1: 260 + ph * 60, life: 0.55, ang: a });
      this.skillFX(particles, ccx, ccy, 'maw', { ang: a });
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
      // A compact, high-impact bite: burst + ring, both at the jaws.
      this._fxSpawn('burst', mouth.x, mouth.y, { r0: 30, r1: 130, life: 0.32 });
      this._fxSpawn('ring', ccx, ccy, { r0: 120, r1: 300 + ph * 60, life: 0.5 });
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
    const dmgMul = 1 + (ph - 1) * 0.5;
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
    // Particle counts scale with the game's own effects dial, so LOW quality
    // spends fewer particles while the vector VFX (rings/bursts/wakes) still
    // carry the whole read.
    const q = this._fxDetail();
    const n = (base) => Math.max(2, Math.round(base * q));
    const ph = this.phase;
    const power = 1 + (ph - 1) * 0.55;
    const radius = (opts.radius || 90) * power;
    // Palette: sea-foam white/cyan for water force, crimson for the jaws.
    const wet = chord === 'charge' || chord === 'spin' || chord === 'rumble' ||
      chord === 'suction' || chord === 'undertow';
    const tint = wet ? '#7dd3fc' : chord === 'teeth' ? '#e2e8f0' : '#f87171';
    const foam = '#e0f9ff';
    const ang = opts.ang != null ? opts.ang : Math.random() * Math.PI * 2;

    // ---- 1. CORE: a white-hot spark heart that blooms and dies.
    for (let i = 0; i < n(6 + ph * 3); i++) {
      particles.addParticle(x + (Math.random() - 0.5) * 16, y + (Math.random() - 0.5) * 16,
        (Math.random() - 0.5) * 7, (Math.random() - 0.5) * 7,
        i % 3 === 0 ? 'rgba(255, 255, 255, 0.9)' : tint,
        3.5 + Math.random() * 3.5, 0.38, 0, true);
    }

    // ---- 2. LAYERED SHOCK RINGS: staggered speeds, so the impact has a
    //      beginning, a middle and an afterglow instead of a single pop.
    const ringCount = q > 0.6 ? 3 : 2;
    for (let r = 0; r < ringCount; r++) {
      const c = n(14 + ph * 5);
      const rr = radius * (0.35 + r * 0.42);
      for (let i = 0; i < c; i++) {
        const a = (i / c) * Math.PI * 2 + r * 0.42;
        particles.addParticle(x + Math.cos(a) * rr * 0.25, y + Math.sin(a) * rr * 0.25,
          Math.cos(a) * (4.5 + ph * 2.2 + r * 1.6), Math.sin(a) * (4.5 + ph * 2.2 + r * 1.6),
          r === 1 ? foam : tint, 2.6 - r * 0.4, 0.6 + r * 0.18, 0, true);
      }
    }

    // ---- 3. DIRECTIONAL FOAM JET: water force and jaws both blow a cone of
    //      spray along the skill's facing (plus a smaller backwash), so every
    //      effect has a DIRECTION — the old radial-only puff read the same on
    //      every skill.
    if (wet || chord === 'bite' || chord === 'maw' || chord === 'apex' ||
        chord === 'hunt') {
      const cone = n(10 + ph * 4);
      for (let i = 0; i < cone; i++) {
        const spread = (Math.random() - 0.5) * 1.1;
        const sp = 7 + Math.random() * 7;
        particles.addParticle(x, y,
          Math.cos(ang + spread) * sp, Math.sin(ang + spread) * sp,
          i % 2 ? foam : tint, 3 + Math.random() * 2, 0.55, 0.06, true);
      }
      for (let i = 0; i < n(5); i++) {
        const spread = (Math.random() - 0.5) * 0.9;
        particles.addParticle(x, y,
          -Math.cos(ang + spread) * (3 + Math.random() * 3),
          -Math.sin(ang + spread) * (3 + Math.random() * 3),
          'rgba(186, 230, 253, 0.65)', 2.4, 0.7, 0.04, true);
      }
    }

    // ---- 4. RISING BUBBLE COLUMN: water force always drags air upward, and
    //      the wobble sells it as WATER rather than a generic explosion.
    if (wet) {
      for (let i = 0; i < n(7 + ph * 3); i++) {
        particles.addParticle(x + (Math.random() - 0.5) * radius * 0.8,
          y + (Math.random() - 0.5) * 20,
          (Math.random() - 0.5) * 1.4, -1.5 - Math.random() * 3,
          'rgba(224, 249, 255, 0.85)', 1.8 + Math.random() * 2.2, 1.0, -0.05, true);
      }
    }

    // ---- 5. VECTOR LAYER: pooled shapes that stay crisp in the water after
    //      the particles fade. Charges ring out, jaws SNAP inward (the same
    //      collapse the telegraph promised — anticipation and payoff share one
    //      shape), currents spin.
    if (chord === 'charge' || chord === 'apex') {
      this._fxSpawn('ring', x, y, { r0: radius * 0.3, r1: radius * 1.7, life: 0.5 });
      this._fxSpawn('foam', x, y, { r0: 30, r1: radius * 1.4, life: 0.6, ang });
      if (q > 0.55) this._fxSpawn('bubbleCluster', x, y, { r0: 0, r1: radius, life: 1.0, ang });
    } else if (chord === 'bite' || chord === 'maw' || chord === 'teeth') {
      this._fxSpawn('collapse', x, y, { r0: radius * 0.4, r1: radius * 1.6, life: 0.3 });
      this._fxSpawn('burst', x, y, { r0: 16, r1: radius, life: 0.28, ang });
    } else if (chord === 'spin' || chord === 'rumble' || chord === 'suction') {
      this._fxSpawn('arc', x, y,
        { r0: radius * 0.5, r1: radius * 1.8, wide: 2.6, ang, life: 0.55, spin: 3 });
      this._fxSpawn('ring', x, y, { r0: radius * 0.2, r1: radius * 1.5, life: 0.7 });
    } else {
      this._fxSpawn('ring', x, y, { r0: radius * 0.3, r1: radius * 1.5, life: 0.45 });
    }

    if (q > 0.5) particles.magicSparkle(x, y, tint, Math.round(n(6 + ph * 4)));
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

  /**
   * The telegraph layer: ANTICIPATION. One consistent visual language across
   * every skill, all drawn in WORLD space (the canvas is already translated),
   * and every one of them read from the same `k` (0 -> 1 through the windup).
   *
   * Shape language (see the pack README's style guide):
   *   charges    -> a narrow TAPERED lane plus a contracting reticle
   *   bites      -> a toothed jaw arc that closes; compact core, no big disc
   *   suction    -> spiral flow lines converging on the mouth, thin boundary
   *   radial     -> clean rings with fading ticks
   *   eruptions  -> a squashed ellipse with rising chevrons
   * Colour: cyan/foam for water motion, crimson ONLY for the danger boundary.
   *
   * Detail (arm counts, bubble counts) is scaled by _fxDetail(), so LOW quality
   * still draws every full silhouette with fewer elements.
   */
  renderTelegraph(ctx, camera) {
    const p = this.pending;
    const lane = this.apexLane;
    // ---- Camera cull: an off-screen telegraph must cost nothing. The
    // destinations are checked (with the radius as padding) so a large radial
    // telegraph is still culled when it is entirely outside the view.
    const vw = (ctx && ctx.canvas && ctx.canvas.width) ? ctx.canvas.width : 960;
    const vh = (ctx && ctx.canvas && ctx.canvas.height) ? ctx.canvas.height : 540;
    const vis = (x, y, pad) => x + pad > camera.x && x - pad < camera.x + vw
      && y + pad > camera.y && y - pad < camera.y + vh;
    const anyVisible = (p && vis(p.x, p.y, (p.radius || 200) + 260))
      || (lane && vis((lane.x0 + lane.x1) * 0.5, (lane.y0 + lane.y1) * 0.5,
        Math.abs(lane.x1 - lane.x0) * 0.5 + 300));
    if (!anyVisible) return;
    const q = this._fxDetail();
    const FOAM = '186, 230, 253';      // water / foam
    const CYAN = '125, 211, 252';      // deep water motion
    const PALE = '224, 242, 254';      // sharp highlights
    const RED = '248, 113, 113';       // danger only
    ctx.save();
    const pulse = 0.5 + Math.sin(this.animT * 22) * 0.25;
    // ---- Apex execution warning lane: painted even while it is vanished ----
    if (lane && lane.t > 0) {
      const lx0 = lane.x0 - camera.x, ly0 = lane.y0 - camera.y;
      const lx1 = lane.x1 - camera.x, ly1 = lane.y1 - camera.y;
      const fade = Math.min(1, lane.t);
      const nx = -(ly1 - ly0), ny = (lx1 - lx0);
      const nl = Math.hypot(nx, ny) || 1;
      const halfW = 62;
      const k = Math.max(0, Math.min(1, 1 - lane.t));
      // A tapered lane (narrow at the muzzle, wide at the far end) reads as
      // travel direction; a constant-width bar does not.
      ctx.fillStyle = 'rgba(' + RED + ', ' + (0.06 + 0.12 * fade).toFixed(3) + ')';
      ctx.beginPath();
      ctx.moveTo(lx0 + (nx / nl) * halfW * 0.35, ly0 + (ny / nl) * halfW * 0.35);
      ctx.lineTo(lx1 + (nx / nl) * halfW, ly1 + (ny / nl) * halfW);
      ctx.lineTo(lx1 - (nx / nl) * halfW, ly1 - (ny / nl) * halfW);
      ctx.lineTo(lx0 - (nx / nl) * halfW * 0.35, ly0 - (ny / nl) * halfW * 0.35);
      ctx.closePath(); ctx.fill();
      // Two clean edges (no fill banding): bright inner, red outer.
      ctx.lineWidth = 2;
      ctx.strokeStyle = 'rgba(' + RED + ', ' + (0.45 + 0.4 * fade).toFixed(3) + ')';
      ctx.beginPath();
      ctx.moveTo(lx0 + (nx / nl) * halfW * 0.35, ly0 + (ny / nl) * halfW * 0.35);
      ctx.lineTo(lx1 + (nx / nl) * halfW, ly1 + (ny / nl) * halfW);
      ctx.moveTo(lx0 - (nx / nl) * halfW * 0.35, ly0 - (ny / nl) * halfW * 0.35);
      ctx.lineTo(lx1 - (nx / nl) * halfW, ly1 - (ny / nl) * halfW);
      ctx.stroke();
      ctx.strokeStyle = 'rgba(' + PALE + ', ' + (0.25 + 0.35 * k).toFixed(3) + ')';
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.moveTo(lx0 + (nx / nl) * halfW * 0.35, ly0 + (ny / nl) * halfW * 0.35);
      ctx.lineTo(lx1 + (nx / nl) * halfW, ly1 + (ny / nl) * halfW);
      ctx.moveTo(lx0 - (nx / nl) * halfW * 0.35, ly0 - (ny / nl) * halfW * 0.35);
      ctx.lineTo(lx1 - (nx / nl) * halfW, ly1 - (ny / nl) * halfW);
      ctx.stroke();
      // Chevrons racing FORWARD only: the direction you cannot stand in.
      const dir = lane.x1 >= lane.x0 ? 1 : -1;
      const chevs = q > 0.6 ? 6 : 4;
      ctx.strokeStyle = 'rgba(255, 255, 255, ' + (0.45 + 0.4 * pulse).toFixed(3) + ')';
      ctx.lineWidth = 3;
      for (let i = 0; i < chevs; i++) {
        const f = ((this.animT * 1.6 + i / chevs) % 1);
        const cxp = lx0 + (lx1 - lx0) * f;
        const cyp = ly0 + (ly1 - ly0) * f;
        const grow = 8 + f * 10;
        ctx.beginPath();
        ctx.moveTo(cxp - dir * grow, cyp - grow * 0.8);
        ctx.lineTo(cxp + dir * 3, cyp);
        ctx.lineTo(cxp - dir * grow, cyp + grow * 0.8);
        ctx.stroke();
      }
      ctx.globalAlpha = 1;
    }
    if (!p) { ctx.restore(); return; }
    const sx = p.x - camera.x;
    const sy = p.y - camera.y;
    const k = 1 - Math.max(0, p.timer) / p.total; // 0 -> 1 as it winds up

    // ---- CHARGES: predator dash + apex execution ---------------------------
    if (p.type === 'predator_dash' || p.type === 'apex_execution') {
      const tx = (p.target ? p.target.x : p.x) - camera.x;
      const ty = (p.target ? p.target.y : p.y) - camera.y;
      const mouth = this._mouthWorld();
      const ox = mouth.x - camera.x, oy = mouth.y - camera.y;
      // The lane runs from the MOUTH to the target, not boss-centre to target,
      // so the indicator starts where the attack actually comes from.
      const vx = tx - ox, vy = ty - oy;
      const len = Math.hypot(vx, vy) || 1;
      const ux = vx / len, uy = vy / len;
      const nx = -uy, ny = ux;
      // Taper: wide at the shark (it leaves a wide wake), narrow at the target.
      const w0 = 26 + 26 * k, w1 = 9 + 5 * k;
      ctx.fillStyle = 'rgba(' + RED + ', ' + (0.05 + 0.1 * k).toFixed(3) + ')';
      ctx.beginPath();
      ctx.moveTo(ox + nx * w0, oy + ny * w0);
      ctx.lineTo(tx + nx * w1, ty + ny * w1);
      ctx.lineTo(tx - nx * w1, ty - ny * w1);
      ctx.lineTo(ox - nx * w0, oy - ny * w0);
      ctx.closePath(); ctx.fill();
      ctx.lineWidth = 2;
      ctx.strokeStyle = 'rgba(' + PALE + ', ' + (0.3 + 0.4 * k).toFixed(3) + ')';
      ctx.beginPath();
      ctx.moveTo(ox + nx * w0, oy + ny * w0);
      ctx.lineTo(tx + nx * w1, ty + ny * w1);
      ctx.moveTo(ox - nx * w0, oy - ny * w0);
      ctx.lineTo(tx - nx * w1, ty - ny * w1);
      ctx.stroke();
      ctx.strokeStyle = 'rgba(' + RED + ', ' + (0.5 + 0.4 * pulse).toFixed(3) + ')';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(tx + nx * w1, ty + ny * w1);
      ctx.lineTo(tx - nx * w1, ty - ny * w1);
      ctx.stroke();
      // Flow streaks inside the lane, running forward: the projected path.
      const streaks = q > 0.6 ? 7 : 4;
      ctx.lineWidth = 2;
      for (let i = 0; i < streaks; i++) {
        const f0 = ((this.animT * 1.5 + i / streaks) % 1);
        const f1 = f0 + 0.14;
        const jit = ((i % 3) - 1) * 6 * (w0 / 40);
        ctx.strokeStyle = 'rgba(' + FOAM + ', ' + (0.42 * (1 - f0 * 0.6)).toFixed(3) + ')';
        ctx.beginPath();
        ctx.moveTo(ox + vx * f0 + nx * jit, oy + vy * f0 + ny * jit);
        ctx.lineTo(ox + vx * f1 + nx * jit * 1.4, oy + vy * f1 + ny * jit * 1.4);
        ctx.stroke();
      }
      // Target reticle: contracts as the charge launches, so it reads as
      // "closing" rather than a static circle. Four corner ticks, no disc.
      const ringR = 40 * (1 - k) + 9;
      ctx.lineWidth = 2.5;
      ctx.strokeStyle = 'rgba(' + RED + ', ' + (0.55 + 0.35 * k).toFixed(3) + ')';
      for (let c = 0; c < 4; c++) {
        const a = c * Math.PI / 2 + Math.PI / 4 + k * 0.5;
        ctx.beginPath();
        ctx.arc(tx, ty, ringR, a, a + Math.PI / 3.4);
        ctx.stroke();
      }
      ctx.strokeStyle = 'rgba(255, 255, 255, ' + (0.35 + 0.45 * k).toFixed(3) + ')';
      ctx.lineWidth = 2;
      for (let c = 0; c < 4; c++) {
        const a = c * Math.PI / 2 + this.animT * 2;
        ctx.beginPath();
        ctx.moveTo(tx + Math.cos(a) * (ringR + 6), ty + Math.sin(a) * (ringR + 6));
        ctx.lineTo(tx + Math.cos(a) * (ringR + 16), ty + Math.sin(a) * (ringR + 16));
        ctx.stroke();
      }
      // Wind-up: water pulled back the way it came from, in front of the mouth.
      ctx.strokeStyle = 'rgba(' + CYAN + ', ' + (0.35 * k).toFixed(3) + ')';
      ctx.lineWidth = 2;
      for (let i = 0; i < 3; i++) {
        const off = (i - 1) * 12;
        ctx.beginPath();
        ctx.moveTo(ox - ux * (18 + 12 * k) + nx * off, oy - uy * (18 + 12 * k) + ny * off);
        ctx.lineTo(ox - ux * (52 + 30 * k) + nx * off * 1.6, oy - uy * (52 + 30 * k) + ny * off * 1.6);
        ctx.stroke();
      }
    }
    // ---- BITES: crushing bite + the extinction finisher --------------------
    else if (p.type === 'crushing_bite' || p.type === 'extinction_bite') {
      // Two toothed jaw arcs closing like the real maw. The radius is the
      // damage radius, so the visual boundary IS the hitbox boundary.
      const r = p.radius || 160;
      const gap = (1 - k) * 1.05;
      // Teeth: evenly spaced along each arc, sized to the closing gap. No
      // random placement, no floating triangles.
      const teeth = q > 0.6 ? 11 : 7;
      ctx.lineWidth = 4;
      ctx.strokeStyle = 'rgba(' + RED + ', ' + (0.5 + pulse * 0.4).toFixed(3) + ')';
      for (let t = 0; t < teeth; t++) {
        const a = Math.PI + gap + (t / (teeth - 1)) * (Math.PI - gap * 2);
        const tl = 10 + 12 * k;
        ctx.beginPath();
        ctx.moveTo(sx + Math.cos(a - 0.07) * r, sy + Math.sin(a - 0.07) * r);
        ctx.lineTo(sx + Math.cos(a) * (r - tl), sy + Math.sin(a) * (r - tl));
        ctx.lineTo(sx + Math.cos(a + 0.07) * r, sy + Math.sin(a + 0.07) * r);
        ctx.closePath();
        ctx.stroke();
      }
      for (let t = 0; t < teeth; t++) {
        const a = gap + (t / (teeth - 1)) * (Math.PI - gap * 2);
        const tl = 10 + 12 * k;
        ctx.beginPath();
        ctx.moveTo(sx + Math.cos(a - 0.07) * r, sy + Math.sin(a - 0.07) * r);
        ctx.lineTo(sx + Math.cos(a) * (r - tl), sy + Math.sin(a) * (r - tl));
        ctx.lineTo(sx + Math.cos(a + 0.07) * r, sy + Math.sin(a + 0.07) * r);
        ctx.closePath();
        ctx.stroke();
      }
      // A thin boundary ring: the true damage edge, nothing filled in.
      ctx.lineWidth = 1.6;
      ctx.strokeStyle = 'rgba(' + PALE + ', ' + (0.3 + 0.4 * k).toFixed(3) + ')';
      ctx.beginPath(); ctx.arc(sx, sy, r, 0, Math.PI * 2); ctx.stroke();
      // Inward streaklines: the water the jaws are about to displace.
      const arms = q > 0.6 ? 9 : 5;
      ctx.strokeStyle = 'rgba(' + CYAN + ', ' + (0.4 * (1 - k * 0.5)).toFixed(3) + ')';
      ctx.lineWidth = 2;
      for (let s = 0; s < arms; s++) {
        const a = (s / arms) * Math.PI * 2 + this.animT * 0.9;
        const r0 = r * 1.18, r1 = r * (0.2 + 0.35 * (1 - k));
        ctx.beginPath();
        ctx.moveTo(sx + Math.cos(a) * r0, sy + Math.sin(a) * r0);
        ctx.quadraticCurveTo(sx + Math.cos(a + 0.6) * r * 0.85, sy + Math.sin(a + 0.6) * r * 0.85,
          sx + Math.cos(a + 1.1) * r1, sy + Math.sin(a + 1.1) * r1);
        ctx.stroke();
      }
      // A COMPACT core: only the very middle tightens, never a full-field disc.
      const coreR = 14 + 26 * k;
      ctx.fillStyle = 'rgba(' + RED + ', ' + (0.06 + 0.14 * k).toFixed(3) + ')';
      ctx.beginPath(); ctx.arc(sx, sy, coreR, 0, Math.PI * 2); ctx.fill();
      ctx.lineWidth = 2;
      ctx.strokeStyle = 'rgba(' + PALE + ', ' + (0.45 + 0.4 * k).toFixed(3) + ')';
      ctx.beginPath(); ctx.arc(sx, sy, coreR, 0, Math.PI * 2); ctx.stroke();
    }
    // ---- SUCTION: the Abyssal Maw -----------------------------------------
    else if (p.type === 'devouring_maw') {
      // What this attack actually is: the game pulls the player toward
      // p.x/p.y (the boss centre, radius 420*power) at 430*power px/s, then
      // one enormous bite. So the art is a vortex converging on the mouth --
      // NOT a translucent circle over the shark.
      const r = p.radius || 420;                 // exactly what the bite checks
      const mouth = this._mouthWorld();
      const mx = mouth.x - camera.x, my = mouth.y - camera.y;
      // Spiral flow lines from the boundary toward the jaws. The arms are
      // logarithmic spirals so they read as rotation AND as inflow.
      const spin = this.animT * (1.5 + k * 5.0);
      const arms = q > 0.7 ? 7 : q > 0.45 ? 5 : 3;
      ctx.lineWidth = 2.2;
      for (let a0 = 0; a0 < arms; a0++) {
        const base = spin + (a0 / arms) * Math.PI * 2;
        ctx.strokeStyle = 'rgba(' + CYAN + ', ' + (0.16 + 0.3 * k).toFixed(3) + ')';
        ctx.beginPath();
        for (let s = 0; s <= 12; s++) {
          const f = s / 12;                       // 0 outer -> 1 throat
          const rr = r * (1 - f * 0.86);
          const a = base + f * 2.15 * (a0 % 2 ? 1 : -1);
          const px2 = mx + Math.cos(a) * rr;
          const py2 = my + Math.sin(a) * rr * 0.72;
          if (s === 0) ctx.moveTo(px2, py2); else ctx.lineTo(px2, py2);
        }
        ctx.stroke();
        // A travelling mote on each arm: flow speed that visibly accelerates
        // inward, matching the pull.
        const f0 = ((this.animT * (0.55 + k * 0.9) + a0 / arms) % 1);
        const rr = r * (1 - f0 * 0.86);
        const a = base + f0 * 2.15 * (a0 % 2 ? 1 : -1);
        const mxx = mx + Math.cos(a) * rr, myy = my + Math.sin(a) * rr * 0.72;
        ctx.fillStyle = 'rgba(' + PALE + ', ' + (0.55 * (1 - f0 * 0.5)).toFixed(3) + ')';
        ctx.beginPath(); ctx.arc(mxx, myy, 1.8 + 2.4 * f0, 0, Math.PI * 2); ctx.fill();
      }
      // The danger boundary: ONE thin broken ring at the EXACT damage radius,
      // centred on the boss centre that resolvePending() actually checks
      // (p.x/p.y), so the line a player dodges is the line that hits. It
      // replaces the filled disc entirely.
      ctx.lineWidth = 1.8;
      ctx.strokeStyle = 'rgba(' + RED + ', ' + (0.4 + 0.45 * k).toFixed(3) + ')';
      for (let seg = 0; seg < 3; seg++) {
        const a0 = spin * 0.4 + seg * (Math.PI * 2 / 3);
        const gap = 0.5 + 0.22 * Math.sin(this.animT * 9 + seg * 2.1);
        ctx.beginPath();
        ctx.arc(sx, sy, r, a0, a0 + Math.PI * 2 / 3 - gap);
        ctx.stroke();
      }
      // Concentric pressure arcs *inside* the ring: depth, not a red wash.
      const rings = q > 0.6 ? 3 : 2;
      for (let i = 1; i <= rings; i++) {
        const rr = r * (1 - i * 0.2) * (0.94 + 0.06 * Math.sin(this.animT * 5 + i));
        ctx.strokeStyle = 'rgba(' + CYAN + ', ' + (0.1 + 0.08 * i).toFixed(3) + ')';
        ctx.lineWidth = 1.4;
        ctx.beginPath(); ctx.arc(sx, sy, rr, 0, Math.PI * 2); ctx.stroke();
      }
      // The throat: a tight ring at the jaws that tightens as it commits. This
      // is the only place that reads as "hot", and it sits ON the mouth.
      const throat = 26 + 46 * k;
      ctx.fillStyle = 'rgba(' + RED + ', ' + (0.05 + 0.1 * k).toFixed(3) + ')';
      ctx.beginPath(); ctx.arc(mx, my, throat, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = 'rgba(' + PALE + ', ' + (0.4 + 0.45 * k).toFixed(3) + ')';
      ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(mx, my, throat, 0, Math.PI * 2); ctx.stroke();
      // A few deliberate bubbles on the current, not a particle cloud.
      const bubbles = q > 0.6 ? 6 : 3;
      for (let b = 0; b < bubbles; b++) {
        const f0 = ((this.animT * (0.7 + k) + b / bubbles) % 1);
        const a = this.animT * 1.2 + b * 2.4;
        const rr = r * (1 - f0);
        ctx.strokeStyle = 'rgba(' + PALE + ', ' + (0.45 * (1 - f0)).toFixed(3) + ')';
        ctx.lineWidth = 1.4;
        ctx.beginPath();
        ctx.arc(mx + Math.cos(a) * rr, my + Math.sin(a) * rr * 0.72,
          2 + 5 * f0, 0, Math.PI * 2);
        ctx.stroke();
      }
    }
    // ---- TAIL SWEEP: a widening arc, cyan with a crimson leading edge -----
    else if (p.type === 'tail_sweep') {
      const r = (p.radius || 220);
      const ang = p.angle || 0;
      const half = 1.15;
      const rr = r * (0.45 + 0.55 * k);
      // Trailing foam band (thin), then the bright leading edge.
      ctx.strokeStyle = 'rgba(' + FOAM + ', ' + (0.3 + 0.35 * k).toFixed(3) + ')';
      ctx.lineWidth = 3;
      ctx.beginPath(); ctx.arc(sx, sy, rr * 0.9, ang - half, ang + half); ctx.stroke();
      ctx.strokeStyle = 'rgba(' + PALE + ', ' + (0.45 + 0.45 * k).toFixed(3) + ')';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.arc(sx, sy, rr, ang + half * (1 - k) * 0.6, ang + half * (1 - k) * 0.6 + half * 0.8 * (0.4 + k));
      ctx.stroke();
      // The fin itself, cocked back and about to whip through.
      const fx = sx - Math.cos(ang) * r * 0.82;
      const fy = sy - Math.sin(ang) * r * 0.82;
      ctx.strokeStyle = 'rgba(' + PALE + ', ' + (0.4 + 0.4 * (1 - k)).toFixed(3) + ')';
      ctx.lineWidth = 3;
      ctx.beginPath(); ctx.ellipse(fx, fy, 28, 13, ang, -0.6, 0.6); ctx.stroke();
    }
    // ---- SHARKNADO: a cyan vortex, rim in foam (no red wash) ---------------
    else if (p.type === 'sharknado') {
      const r = (p.radius || 260) * (0.55 + 0.45 * k);
      const arms = q > 0.6 ? 5 : 3;
      ctx.lineWidth = 3;
      for (let arm = 0; arm < arms; arm++) {
        ctx.strokeStyle = 'rgba(' + CYAN + ', ' + (0.26 + 0.4 * k).toFixed(3) + ')';
        ctx.beginPath();
        for (let s = 0; s <= 14; s++) {
          const f = s / 14;
          const a = this.animT * 7 + arm * (Math.PI * 2 / arms) + f * 2.4;
          const rr = r * (1 - f * 0.85);
          const px2 = sx + Math.cos(a) * rr;
          const py2 = sy + Math.sin(a) * rr * 0.55;
          if (s === 0) ctx.moveTo(px2, py2); else ctx.lineTo(px2, py2);
        }
        ctx.stroke();
      }
      // Rim: a broken ring of ticks rather than a dashed circle.
      const ticks = q > 0.6 ? 16 : 9;
      ctx.lineWidth = 3;
      ctx.strokeStyle = 'rgba(' + PALE + ', ' + (0.35 + 0.45 * k).toFixed(3) + ')';
      for (let t = 0; t < ticks; t++) {
        const a = (t / ticks) * Math.PI * 2 + this.animT * 1.2;
        ctx.beginPath();
        ctx.arc(sx, sy, r, a, a + 0.18);
        ctx.stroke();
      }
    }
    // ---- TOOTH BARRAGE: converging chevrons into the gape ------------------
    else if (p.type === 'tooth_barrage') {
      const mouth = this._mouthWorld();
      const ox = mouth.x - camera.x, oy = mouth.y - camera.y;
      const n = q > 0.6 ? 8 : 5;
      ctx.lineWidth = 2.2;
      for (let i = 0; i < n; i++) {
        const a = (i / n) * Math.PI * 2 + this.animT;
        const r0 = 70 + 60 * (1 - k);
        const r1 = 16;
        const cxp = ox + Math.cos(a) * r0, cyp = oy + Math.sin(a) * r0 * 0.6;
        const txx = ox + Math.cos(a) * r1, tyy = oy + Math.sin(a) * r1 * 0.6;
        // Chevron pointing INWARD so the direction is unambiguous.
        const ux = txx - cxp, uy = tyy - cyp;
        const ul = Math.hypot(ux, uy) || 1;
        ctx.strokeStyle = 'rgba(' + PALE + ', ' + (0.3 + 0.5 * k).toFixed(3) + ')';
        ctx.beginPath();
        ctx.moveTo(cxp - ux / ul * 14 - uy / ul * 6, cyp - uy / ul * 14 + ux / ul * 6);
        ctx.lineTo(txx, tyy);
        ctx.lineTo(cxp - ux / ul * 14 + uy / ul * 6, cyp - uy / ul * 14 - ux / ul * 6);
        ctx.stroke();
      }
      // A compact throat marker where the volley leaves.
      ctx.strokeStyle = 'rgba(' + PALE + ', ' + (0.4 + 0.4 * k).toFixed(3) + ')';
      ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(ox, oy, 14 + 12 * k, 0, Math.PI * 2); ctx.stroke();
    }
    // ---- DEPTH WARNING: a squashed eruption ellipse -----------------------
    else if (p.type === 'depth_warning') {
      const r = p.radius || 120;
      const ry = r * 0.42;
      // Ticks around the ellipse: radial, evenly spaced, no dashes.
      const ticks = q > 0.6 ? 14 : 8;
      ctx.lineWidth = 3;
      ctx.strokeStyle = 'rgba(253, 224, 71, ' + (0.35 + 0.5 * k).toFixed(3) + ')';
      for (let t = 0; t < ticks; t++) {
        const a = (t / ticks) * Math.PI * 2;
        const l = 6 + 12 * k;
        ctx.beginPath();
        ctx.moveTo(sx + Math.cos(a) * (r - l), sy + Math.sin(a) * (ry - l * 0.6));
        ctx.lineTo(sx + Math.cos(a) * r, sy + Math.sin(a) * ry);
        ctx.stroke();
      }
      ctx.strokeStyle = 'rgba(' + PALE + ', ' + (0.4 + 0.4 * k).toFixed(3) + ')';
      ctx.lineWidth = 2;
      ctx.beginPath(); ctx.ellipse(sx, sy, r, ry, 0, 0, Math.PI * 2); ctx.stroke();
      // Rising chevrons: the column of water that is about to erupt.
      const chevs = q > 0.6 ? 4 : 3;
      ctx.fillStyle = 'rgba(' + CYAN + ', ' + (0.2 + 0.45 * k).toFixed(3) + ')';
      for (let c = 0; c < chevs; c++) {
        const rise = ((this.animT * 150 + c * 52) % 200);
        const alpha = 1 - rise / 200;
        ctx.globalAlpha = alpha;
        ctx.beginPath();
        ctx.moveTo(sx - 13, sy - rise);
        ctx.lineTo(sx + 13, sy - rise);
        ctx.lineTo(sx, sy - rise - 18);
        ctx.closePath(); ctx.fill();
      }
      ctx.globalAlpha = 1;
    }
    // ---- HUNT CALL: a snap ring that contracts ----------------------------
    else if (p.type === 'hunt_call') {
      const r = (p.radius || 140) * (1.7 - 0.75 * k);
      ctx.strokeStyle = 'rgba(' + RED + ', ' + (0.45 + pulse * 0.45).toFixed(3) + ')';
      ctx.lineWidth = 4;
      ctx.beginPath(); ctx.arc(sx, sy, r, 0, Math.PI * 2); ctx.stroke();
      // Shrinking second ring inside it: the roar tightening.
      ctx.strokeStyle = 'rgba(' + PALE + ', ' + (0.3 * (1 - k)).toFixed(3) + ')';
      ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(sx, sy, r * 0.62, 0, Math.PI * 2); ctx.stroke();
      const ticks = q > 0.6 ? 10 : 6;
      ctx.strokeStyle = 'rgba(' + FOAM + ', ' + (0.25 + 0.45 * k).toFixed(3) + ')';
      ctx.lineWidth = 3;
      for (let s = 0; s < ticks; s++) {
        const a = (s / ticks) * Math.PI * 2 + this.animT * 1.5;
        const l = 10 + 14 * k;
        ctx.beginPath();
        ctx.moveTo(sx + Math.cos(a) * (r + 4), sy + Math.sin(a) * (r + 4));
        ctx.lineTo(sx + Math.cos(a) * (r + 4 + l), sy + Math.sin(a) * (r + 4 + l));
        ctx.stroke();
      }
    }
    ctx.restore();
  }


  /**
   * A shark with a spine.
   *
   * The body is never drawn as one frozen silhouette: the whole animal is
   * sampled along a centre-line whose curvature is the live swim cycle
   * (`swimPhase` + `tailBend`), so waves of flexion travel from shoulder to
   * caudal tip the way a real macropredator swims. Everything hangs off that
   * spine â€” the caudal fin, the dorsals, the pectorals, the gills, the brow,
   * the eye and the jaw â€” so the model banks, breathes and flows as one
   * organism instead of a pile of decals sliding together.
   *
   * Render order is far-to-near: wake shadow, charge ghosts, far pectoral,
   * caudal fin, body + countershading, dorsal line, near pectoral, gills,
   * hide wear, head, THE MAW, water FX, phase flare. Countershading is five
   * hard flat bands with a seam, dappled caustics, a lateral line and a
   * specular back ridge â€” the shark is always lit from overhead, the way it
   * would be under the colosseum's light shafts.
   */
  render(ctx, camera) {
    const x = this.x - camera.x;
    const y = this.y - camera.y;
    const injury = Math.max(0, Math.min(1, 1 - this.hp / this.maxHp));
    const ph = this.phase;
    const flash = this.hitFlash > 0;
    const faceDir = this.faceDir || 1;
    // VISUAL SCALE: grows a touch per phase, capped â€” never runaway.
    const grow = Math.min(1.3, 1 + (ph - 1) * 0.12);
    const HW = this.width * 0.5;   // 210
    const HH = this.height * 0.5;  // 100

    // ---------------------------------------------------------------- rig
    const speed = Math.hypot(this.vx || 0, this.vy || 0);
    const dashing = !!this.dash;
    const spinning = this.tornadoT > 0;
    const exhausted = this.exhaustT > 0;
    const vanished = this.vanishT > 0;
    const droop = Math.max(0, Math.min(1, this.droop || 0));
    const swing = this.tailSwing || 0;

    // ---- Palette: the reference sheet's hard-edged navy macropredator.
    // Phase tints walk the blue toward charcoal (Blood Frenzy) and then toward
    // raw crimson (Apex of the Ancient Sea). Exhaustion desaturates everything:
    // the beast goes grey when it is spent. ---------------------------------
    const dull = (ph >= 2 && exhausted ? 0.5 : exhausted ? 0.35 : 0) ;
    const dullMix = (c) => dull > 0 ? this._mixColor(c, '#59627a', dull) : c;
    // HIDE: five hard bands, Terraria-style — dark navy back, pale belly.
    const hideBack = dullMix(flash ? '#ffffff' : ph === 3 ? '#1a1320' : ph === 2 ? '#121a34' : '#111a33');
    const hideTop  = dullMix(flash ? '#ffffff' : ph === 3 ? '#221827' : ph === 2 ? '#18224a' : '#182447');
    const hideMid  = dullMix(flash ? '#ffe4e6' : ph === 3 ? '#2e1f2f' : ph === 2 ? '#1f2f5e' : '#213463');
    const hideLow  = dullMix(flash ? '#fecdd3' : ph === 3 ? '#452a3c' : ph === 2 ? '#2f4576' : '#334b80');
    const belly    = dullMix(flash ? '#ffffff' : ph === 3 ? '#c6b3bb' : ph === 2 ? '#c6cfe4' : '#c9d7ec');
    const bellySh  = dullMix(flash ? '#ffffff' : ph === 3 ? '#a8979f' : ph === 2 ? '#a9b6d2' : '#acbbd9');
    const finDark  = dullMix(flash ? '#ffffff' : ph === 3 ? '#1d1420' : ph === 2 ? '#141f3f' : '#152344');
    const finLite  = dullMix(flash ? '#ffe4e6' : ph === 3 ? '#37223a' : ph === 2 ? '#27396c' : '#2b4074');
    // One outline colour, very dark navy — the pixel-art keyline of the sheet.
    const outline  = '#060a14';
    const mouthDeep = flash ? '#7f1d1d' : ph >= 2 ? '#3a060e' : '#480a14';
    const mouthLit  = flash ? '#fecdd3' : ph >= 2 ? '#c41e38' : '#a8172c';
    const gum       = flash ? '#fecdd3' : '#9c2b38';
    const tooth     = flash ? '#ffffff' : ph === 3 ? '#e6dfd0' : '#f3f6fb';
    // EYES: ember-red at every phase — a dull coal in 1, a furnace in the apex.
    const eyeGlow   = flash ? 1 : ph === 1 ? 0.38 : ph === 2 ? 0.72 : 1;
    const woundGlow = ph >= 2 ? Math.min(1, 0.3 + injury * 0.7) : injury * 0.25;

    // ---- Pose-driven swim cycle: each clip of the reference sheet has its own
    // beat. idle is a slow drift, swim is the default, fast_swim is a tight
    // high-frequency wave, turn coils the spine hard, the sharknado is a blur.
    const pose = this.poseMode || 'swim';
    const poseWave = pose === 'idle' ? { amp: 0.55, rate: 0.55 }
      : pose === 'fast_swim' ? { amp: 1.35, rate: 1.9 }
        : pose === 'turn' ? { amp: 1.5, rate: 1.15 }
          : pose === 'frenzy_rush' ? { amp: 1.15, rate: 1.6 }
            : pose === 'sharknado' ? { amp: 2.1, rate: 2.4 }
              : pose === 'tail_sweep' ? { amp: 1.6, rate: 1.25 }
                : (pose === 'bite' || pose === 'devouring_maw') ? { amp: 0.8, rate: 0.8 }
                  : (pose === 'exhausted' || pose === 'death') ? { amp: 0.42, rate: 0.35 }
                    : { amp: 1, rate: 1 };
    const waveAmp = (0.10 + Math.min(0.16, Math.abs(swing) * 0.006)
      + (dashing ? -0.05 : 0) + (spinning ? 0.22 : 0)) * poseWave.amp;
    const wavePhase = this.swimPhase * 0.85 * poseWave.rate;
    // A turn coils the tail: the spine is pre-bent into the direction of travel.
    const st = {
      waveAmp, wavePhase,
      tailBend: (this.tailBend || 0)
        + (pose === 'turn' ? 0.18 : 0)
        // A direction change whips the caudal behind the pivot...
        + (this.turnKick || 0) * 0.30
        // ...and the death convulsion thrashes it hard.
        + (this.dead && (this.deadT || 0) < 1.5
          ? (1 - (this.deadT || 0) / 1.5) * 0.45 * Math.sin(this.animT * 26) : 0),
      pitch: this.pitch || 0
    };

    // ======================================================================
    // THE SPINE SAMPLER
    // ----------------------------------------------------------------------
    // One centre-line runs nose-to-tail in local units (nose at +HW, caudal
    // tip at -HW). Its curvature is the travelling swim wave plus any
    // skill-driven coil. `spineAt(u, off)` returns the local point at
    // arclength fraction u (0 = tail, 1 = nose) offset `off` along the
    // normal (-1 = back ridge, +1 = belly). Every part of the animal is
    // placed through it, so the whole body flexes together â€” nothing can
    // drift out of register.
    // ======================================================================
    const spineBend = (u) => {
      const tailGain = Math.pow(1 - u, 1.7);           // 1 at tail, 0 at nose
      return Math.sin(wavePhase - u * 2.7) * waveAmp * tailGain
        + st.tailBend * tailGain * 1.6
        + st.pitch * (1 - u) * 4                        // pitch noses over on a dive
        + Math.sin(wavePhase * 1.7 - u * 4.2) * waveAmp * 0.22 * tailGain; // organic harmonic
    };
    const bodyHalf = (u) => {
      // ---- The silhouette of a real macropredator, expressed in u (0 = caudal
      // peduncle, 1 = snout): girth peaks just BEHIND the head, the head
      // itself is deep but TAPERS to a pointed snout, and the tail is a thin
      // stalk. Sampling a piecewise curve (rather than one sine that peaks
      // mid-body) is what gives the heavy-front / whippy-tail read.
      const g = u < 0.60
        ? (0.56 + 0.44 * Math.sin((u / 0.60) * Math.PI * 0.5))   // stalk -> peak
        : (1.0 - 0.16 * ((u - 0.60) / 0.40));                    // peak -> deep head
      const prof = 0.09 + 0.94 * Math.pow(g, 0.55);
      // NATURAL SNOUT: a long, even taper over the last 20% of the body so
      // the tip comes to a point instead of a blunt box. The head stays deep
      // right up to the taper; only the last few percent narrow.
      const noseTaper = u > 0.80
        ? Math.max(0.30, Math.sqrt(1 - Math.pow((u - 0.80) / 0.20, 1.35)))
        : 1;
      const peduncle = u < 0.15 ? Math.max(0.34, u / 0.15) : 1;  // thin caudal stalk
      return HH * prof * noseTaper * peduncle;
    };
    const spineAt = (u, off = 0) => {
      const sx = -HW + u * this.width;                  // nose .. tail across
      const bend = spineBend(u);
      const half = bodyHalf(u);
      const reach = off < 0 ? off * half : off * half * 0.82; // belly pulled in: sleek
      return { x: sx, y: bend * (1 - u) * 5 + reach, half };
    };
    // A smooth polyline trace: quadratic curves through mid-points so 32
    // samples read as one flowing curve, not a rope of segments.
    const traceSmooth = (c, pts) => {
      c.moveTo(pts[0].x, pts[0].y);
      for (let i = 1; i < pts.length - 1; i++) {
        const mx = (pts[i].x + pts[i + 1].x) * 0.5;
        const my = (pts[i].y + pts[i + 1].y) * 0.5;
        c.quadraticCurveTo(pts[i].x, pts[i].y, mx, my);
      }
      const last = pts[pts.length - 1];
      c.lineTo(last.x, last.y);
    };
    // RAGGED EDGES: the sheet's torn, tattered fins. Walks from p0 to p1 and
    // returns sub-points with bites taken out of the edge along its normal.
    // Deterministic per index/seed, so a fin tears the same way every frame
    // instead of shimmering. `amp` is how deep the bites go.
    const raggedEdge = (p0, p1, n, amp, seed) => {
      const dx = p1.x - p0.x, dy = p1.y - p0.y;
      const len = Math.hypot(dx, dy) || 1;
      const nx = -dy / len, ny = dx / len;        // edge normal
      const out = [];
      for (let i = 0; i <= n; i++) {
        const f = i / n;
        const h = this._hash01(seed + i * 2.31);
        // every other sub-segment bites deep: a shredded membrane, not a saw
        const bite = (i % 2 === 0 ? amp * (0.30 + h * 0.70) : -amp * 0.16 * h);
        out.push({ x: p0.x + dx * f + nx * bite, y: p0.y + dy * f + ny * bite });
      }
      return out;
    };
    // How shredded the fins are: the apex phase is a shredded wreck.
    const tearAmp = (ph === 3 ? 1 : ph === 2 ? 0.5 : 0.18) * (0.55 + injury * 0.6);

    ctx.save();
    // ---- Whole-body transform: bank, pitch, roll/yaw, squash, breathe. ----
    const squash = this.squash || 0;
    const breath = this.breath || 1;
    const pitch = this.pitch || 0;
    const lean = this.lean || 0;
    const lunge = this.lunge || 0;
    const rollV = this.roll || 0;
    const yawV = this.yaw || 0;
    const turnKick = this.turnKick || 0;
    const anticip = this.anticip || 0;
    const hitReact = this.hitReact || 0;
    // Facing is EASED (see update): the animal squashes through zero and
    // expands the other way, which reads as a pivot rather than a snap.
    const faceEased = this.flipSmooth == null ? (this.faceDir || 1) : this.flipSmooth;
    const faceSign = faceEased >= 0 ? 1 : -1;
    // Death: a final lunge and a thrash, then it hangs limp, sinks and fades.
    const deadT = this.dead ? (this.deadT || 0) : 0;
    const deathLurch = this.dead && deadT < 0.45 ? (1 - deadT / 0.45) : 0;
    const deathThrash = this.dead && deadT < 1.5 ? (1 - deadT / 1.5) : 0;
    // Exhausted, it sinks a little and trembles in the water.
    const tremble = exhausted ? Math.sin(this.animT * 37) * 0.8 : 0;
    const bodyCX = x + this.width * 0.5 + (this.sway || 0);
    const sink = Math.min(60, deadT * 12);
    const bodyCY = y + this.height * 0.5 + (this.bob || 0) + droop * 9 + tremble + sink;
    ctx.translate(bodyCX, bodyCY);
    ctx.scale(grow, grow);
    ctx.rotate(lean * 0.14 + pitch * 0.5 + lunge * 0.05 * faceSign
      + turnKick * 0.1 * faceSign - hitReact * 0.06);   // a hit snaps the head back
    // The strike translates the whole body forward; the tell pulls it back.
    ctx.translate((this.recoil || 0) * 16 * faceSign - anticip * 10,
      (this.recoil || 0) * 4 + deathLurch * 10);
    // Yaw cheat: a horizontal skew that reads as turning toward/away.
    ctx.transform(1, yawV * 0.16, yawV * 0.10, 1, 0, 0);
    ctx.transform(1 + squash * 0.22, squash * 0.06 * pitch,
      squash * 0.06 * pitch, (1 - squash * 0.3) * breath, 0, 0);
    // Roll cheat: vertical squash + the banked flank shadow sell a body
    // swimming through a volume instead of sliding across a plane.
    ctx.scale(1, 1 - Math.abs(rollV) * 0.22);
    // Face left or right with a single flip; all art below draws NOSE RIGHT.
    ctx.scale(faceEased, 1);
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    if (vanished) ctx.globalAlpha = 0.16 + Math.abs(Math.sin(this.animT * 30)) * 0.08;
    else if (exhausted) ctx.globalAlpha = 0.94;
    else if (this.dead) ctx.globalAlpha = Math.max(0, 1 - deadT * 0.16);


    // ======================================================================
    // 0. WAKE SHADOW â€” a soft dark bloom under the body so it never reads
    //    as a flat sticker on the backdrop.
    // ======================================================================
    {
      ctx.fillStyle = 'rgba(4, 9, 20, 0.30)';
      ctx.beginPath(); ctx.ellipse(0, HH * 0.46, HW * 1.02, HH * 1.02, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = 'rgba(4, 9, 20, 0.22)';
      ctx.beginPath(); ctx.ellipse(-HW * 0.1, HH * 0.66, HW * 0.72, HH * 0.55, 0, 0, Math.PI * 2); ctx.fill();
    }

    // ======================================================================
    // 0b. CHARGE GHOSTS â€” afterimages of the spine during a dash. Each ghost
    //     re-runs the spine sampler with the snapshot's own swim phase, so
    //     the whole animal smears instead of a rectangle fading out.
    // ======================================================================
    if (this.trail && this.trail.length && !vanished) {
      for (let i = 0; i < this.trail.length; i++) {
        const g = this.trail[i];
        const k = i / Math.max(1, this.trail.length - 1);
        ctx.save();
        ctx.translate((g.x - camera.x) + this.width * 0.5 + (g.sway || 0),
          (g.y - camera.y) + this.height * 0.5 + (g.bob || 0));
        ctx.scale(grow, grow);
        ctx.scale(g.faceDir || 1, 1);
        ctx.globalAlpha = (0.05 + 0.11 * k) * (dashing ? 1 : 0.5);
        ctx.fillStyle = '#9fd2f5';
        this._hullPath(ctx, g.st);
        ctx.fill();
        ctx.restore();
      }
      ctx.globalAlpha = vanished ? 0.16 : exhausted ? 0.94 : 1;
    }

    // ======================================================================
    // A SHARK, DRAWN AS A SHARK
    // --------------------------------------------------------------------
    // Three curves define everything: the back ridge, the belly line and the
    // spine centre-line. Fins are closed paths with a swept leading edge and
    // a concave trailing edge; the body is one hull, filled flat and CLIPPED,
    // so no band, scar, dapple or highlight can bleed off the animal.
    // ======================================================================

    // ======================================================================
    // 1. THE FAR PECTORAL â€” behind the body: darker, tucked, opposite flap.
    // ======================================================================
    // Idle barely flaps; the charge beats are snapped and violent.
    const finRate = pose === 'idle' ? 0.55
      : (pose === 'exhausted' || pose === 'death') ? 0.5
        : (pose === 'fast_swim' || pose === 'frenzy_rush') ? 1.35
          : pose === 'sharknado' ? 1.8 : 1;
    const flapFront = Math.sin((this.finKick || 0) * Math.PI * 2 * finRate) * 0.5;
    const flapBack  = Math.sin(((this.finKick || 0) + 0.5) * Math.PI * 2 * finRate) * 0.5;
    const pecFlap = (f) => (f * 0.6 + (1 - f) * flapBack) * (1 - droop * 0.7);
    {
      const rootA = spineAt(0.70, 0.55);
      const rootB = spineAt(0.575, 0.62);
      const mid   = spineAt(0.635, 0);
      const drop  = bodyHalf(0.635) * 0.95 + pecFlap(0.5) * 22;
      // Same swept-wing silhouette as the near pectoral, tucked smaller and
      // darker behind the body — a clean leading edge out to a pointed tip,
      // concave torn trailing edge back to the flank.
      const wingTip = { x: mid.x - 128 - pecFlap(0.12) * 26, y: mid.y + drop * 1.24 + pecFlap(0.12) * 14 };
      const backEnd = { x: mid.x - 56 - pecFlap(0.5) * 12, y: mid.y + drop * 0.68 + pecFlap(0.5) * 8 };
      const pts = [rootB]
        .concat(raggedEdge(rootB, wingTip, 2, 5 + tearAmp * 8, 71.3))
        .concat(raggedEdge(wingTip, backEnd, 3, 6 + tearAmp * 9, 72.9))
        .concat([rootA]);
      ctx.beginPath(); traceSmooth(ctx, pts); ctx.closePath();
      ctx.fillStyle = flash ? '#e2e8f0' : finDark;
      ctx.fill();
      ctx.strokeStyle = outline;
      ctx.lineWidth = 3.5;
      ctx.stroke();
    }

    // ======================================================================
    // 2. THE CAUDAL FIN â€” the great heterocercal crescent. Long upper lobe,
    //    short lower lobe, a real notch, fin rays; swept by the tail slope.
    // ======================================================================
    {
      const ped = spineAt(0.03, 0);
      const slope = Math.atan2(spineAt(0.13, 0).y - spineAt(0.0, 0).y,
        spineAt(0.13, 0).x - spineAt(0.0, 0).x);
      ctx.save();
      ctx.translate(ped.x, ped.y);
      ctx.rotate(slope * 0.8 - swing * 0.004);
      // One closed path: leading edge up to the long tip, trailing edge back
      // through the fork, the short lower lobe, closed into the peduncle.
      // Both lobe edges run through raggedEdge(), so the crescent is torn
      // with bites whose depth scales with the phase and the damage taken.
      // The upper lobe gets a SHOULDER point (a wide mid-lobe) so the
      // crescent reads as a massive fin rather than two thin blades; bite
      // amplitude is scaled to the lobe length so the shredding stays
      // proportional at every phase.
      const upperRoot = { x: 34, y: -13 };
      const shoulder = { x: -18, y: -96 };
      const upperTip = { x: -70, y: -126 };
      const fork = { x: -15, y: -24 };
      const lowerTip = { x: -60, y: 82 };
      const upper = [upperRoot, shoulder]
        .concat(raggedEdge(shoulder, upperTip, 4, 9 + tearAmp * 11, 11.3))
        .concat(raggedEdge(upperTip, fork, 3, 7 + tearAmp * 9, 21.7));
      // The lower lobe continues FROM the fork, straight out to its own tip.
      // Routing it through a `lowerRoot` at (-17, 20) instead filled the notch
      // with a 44px vertical wedge, which read as two lumps instead of one
      // crescent with a real V cut in it.
      const lower = [fork]
        .concat(raggedEdge(fork, lowerTip, 4, 10 + tearAmp * 13, 41.9))
        .concat(raggedEdge(lowerTip, { x: -32, y: 46 }, 2, 8 + tearAmp * 8, 51.3))
        .concat([{ x: 2, y: 22 }, { x: 32, y: 16 }]);
      // Droop + dash stretch the tail: fatigue sags it, a charge snaps it straight.
      const sag = (1 + droop * 0.35) * (dashing ? 0.86 : 1);
      ctx.beginPath();
      traceSmooth(ctx, upper);
      traceSmooth(ctx, lower);
      ctx.closePath();
      ctx.save();
      ctx.scale(1, sag);
      ctx.fillStyle = flash ? '#e2e8f0' : finDark;
      ctx.fill();
      ctx.strokeStyle = outline;
      ctx.lineWidth = 3.5;
      ctx.stroke();
      // Fin rays fanning through both lobes.
      ctx.strokeStyle = 'rgba(6, 10, 20, 0.30)';
      ctx.lineWidth = 1.5;
      for (let r = 0; r < 6; r++) {
        ctx.beginPath();
        ctx.moveTo(16, -3 + r * 2);
        ctx.lineTo(-14 - r * 4, -110 + r * 15);
        ctx.stroke();
      }
      for (let r = 0; r < 4; r++) {
        ctx.beginPath();
        ctx.moveTo(14, 6 + r * 2);
        ctx.lineTo(-16 - r * 4, 66 + r * 6);
        ctx.stroke();
      }
      // Caudal keel: the ridge running forward of the fin on the peduncle.
      ctx.strokeStyle = 'rgba(6, 10, 20, 0.4)';
      ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(36, -6); ctx.lineTo(58, -2); ctx.stroke();
      ctx.restore();
      // Apex (or heavy damage): the crescent is torn and notched.
      if (ph >= 2 || injury > 0.3) {
        ctx.fillStyle = flash ? '#ffe4e6' : hideMid;
        ctx.beginPath(); ctx.moveTo(-30, -74); ctx.lineTo(-12, -54); ctx.lineTo(-38, -48); ctx.closePath(); ctx.fill();
        if (ph === 3) {
          ctx.beginPath(); ctx.moveTo(-26, 44); ctx.lineTo(-10, 30); ctx.lineTo(-30, 22); ctx.closePath(); ctx.fill();
        }
      }
      ctx.restore();
    }

    // ======================================================================
    // 3. THE HULL — back ridge, belly line, and the flat-banded countershading
    //    that makes it read as volume under a light shaft. The hull itself is
    //    `_hullPath(ctx, st)`: one sampler, used by the live body AND by the
    //    charge ghosts, so an afterimage is the real silhouette, not a blur.
    // ======================================================================
    const STEPS = 34;
    ctx.save();
    this._hullPath(ctx, st);
    ctx.fillStyle = hideMid;
    ctx.fill();
    ctx.strokeStyle = outline;
    ctx.lineWidth = 4;
    ctx.stroke();
    // ---- everything below is clipped inside the silhouette ----
    ctx.clip();
    {
      // Countershading: five hard bands, hard seams, overhead key light.
      const band = (ptsA, ptsB, fill) => {
        ctx.beginPath();
        traceSmooth(ctx, ptsA);
        for (let i = ptsB.length - 1; i >= 0; i--) ctx.lineTo(ptsB[i].x, ptsB[i].y);
        ctx.closePath();
        ctx.fillStyle = fill;
        ctx.fill();
      };
      const bandOff = (o0, o1) => {
        const a = [], b = [];
        for (let i = 0; i <= STEPS; i++) {
          const u = 1 - i / STEPS;
          a.push(spineAt(u, o0));
          b.push(spineAt(u, o1));
        }
        return [a, b];
      };
      band(...bandOff(-1.0, -0.52), hideBack);   // deep back
      band(...bandOff(-0.52, -0.10), hideTop);   // upper flank
      band(...bandOff(-0.10, 0.34), hideMid);    // mid flank
      band(...bandOff(0.34, 0.72), hideLow);     // lower flank
      band(...bandOff(0.72, 1.0), belly);        // belly
      // A thin bounce-light sliver under the belly fold.
      band(...bandOff(0.60, 0.70), bellySh);
      // Countershade seam: a hard line where dark meets light.
      ctx.strokeStyle = 'rgba(6, 10, 20, 0.35)';
      ctx.lineWidth = 2;
      {
        const seam = [];
        for (let i = 0; i <= 12; i++) seam.push(spineAt(1 - i / 12, 0.55));
        ctx.beginPath(); traceSmooth(ctx, seam); ctx.stroke();
      }
      // Specular ridge: light catching the back above the water's glare.
      ctx.strokeStyle = 'rgba(206, 224, 255, 0.20)';
      ctx.lineWidth = 5;
      {
        const ridge = [];
        for (let i = 0; i <= 12; i++) ridge.push(spineAt(1 - i / 12, -0.82));
        ctx.beginPath(); traceSmooth(ctx, ridge); ctx.stroke();
      }
      // CAUSTIC LIGHT — the moving net of sunlight that swims across a body
      // under shallow water. Three soft, slow-sliding bands of pale light
      // draped over the back half, masked to the silhouette by this clip. They
      // drift along the spine and shimmer in width, which is what actually
      // reads as "under water" at rest; static dapples never did. Gated on
      // the quality dial — first thing to drop on low effects.
      // NOTE: `micro` is declared later in this method (section 6b), so this
      // early block asks the quality dial directly instead of touching it
      // before its `const` declaration (which would be a TDZ ReferenceError).
      if (this._fxDetail() > 0.35 && !vanished) {
        ctx.save();
        ctx.globalCompositeOperation = 'lighter';
        const t = this.animT * 0.35;
        for (let ci = 0; ci < 3; ci++) {
          const phase = (t + ci * 0.33) % 1;
          const u0 = 0.30 + phase * 0.55;              // band centre slides tail->head
          const wob = Math.sin(this.animT * 1.4 + ci * 2.1) * 0.5 + 0.5;
          ctx.strokeStyle = 'rgba(186, 230, 253, '
            + (0.05 + 0.05 * wob).toFixed(3) + ')';
          ctx.lineWidth = 7 + wob * 9;
          ctx.beginPath();
          for (let k = 0; k <= 8; k++) {
            const u = Math.max(0.04, Math.min(0.97, u0 - 0.16 + k * 0.04));
            const p = spineAt(u, -0.95 + k * 0.14 + Math.sin(k * 1.3 + ci) * 0.1);
            if (k === 0) ctx.moveTo(p.x, p.y); else ctx.lineTo(p.x, p.y);
          }
          ctx.stroke();
        }
        ctx.restore();
      }
      // Subtle hide mottling: a handful of stable speckles, not a scattergun.
      // Anything denser reads as noise at 24px tiles and costs fill rate.
      for (let i = 0; i < 12; i++) {
        const h1 = this._hash01(i * 1.37 + (this.scarSeed || 0));
        const h2 = this._hash01(i * 2.11 + (this.scarSeed || 0));
        const h3 = this._hash01(i * 3.07 + (this.scarSeed || 0));
        const u = 0.12 + h1 * 0.84;
        const p = spineAt(u, -0.85 + h2 * 1.5);
        const r = 3 + h3 * 6;
        ctx.fillStyle = h2 > 0.5 ? 'rgba(210, 230, 255, 0.06)' : 'rgba(6, 10, 20, 0.05)';
        ctx.beginPath(); ctx.ellipse(p.x, p.y, r, r * 0.62, h1 * 3, 0, Math.PI * 2); ctx.fill();
      }
      // Lateral line: the dotted sensory canal down the flank.
      ctx.fillStyle = 'rgba(6, 10, 20, 0.34)';
      for (let i = 0; i < 22; i++) {
        const u = 0.12 + (i / 21) * 0.74;
        const p = spineAt(u, 0.12 + Math.sin(i * 1.7) * 0.05);
        ctx.fillRect(p.x, p.y, 2.4, 2.4);
      }
      // BLOOD FRENZY + APEX: the hide is cracked open and glowing from inside.
      // Phase 2 gets a hot wash under the skin; phase 3 adds bleeding cracks.
      if (ph >= 2) {
        // Internal light, not a tint over the animal: a low, flank-only wash.
        // (A corrupted comment used to swallow this fillStyle line via a literal
        //  "\r\n" in the source, so the wash silently painted with whatever the
        //  previous fillStyle was — fixed.)
        ctx.fillStyle = 'rgba(127, 29, 29, ' + (ph === 3 ? 0.10 : 0.05).toFixed(2) + ')';
        const wash = [];
        for (let i = 0; i <= 16; i++) wash.push(spineAt(1 - i / 16, -0.85));
        for (let i = 16; i >= 0; i--) wash.push(spineAt(1 - i / 16, 0.55));
        ctx.beginPath(); traceSmooth(ctx, wash); ctx.closePath(); ctx.fill();
        const crackA = (ph === 3 ? 0.5 : 0.3) * (0.5 + woundGlow * 0.8);
        const cracks = ph === 3 ? 9 : 5;
        for (let i = 0; i < cracks; i++) {
          const s = i * 1.93 + (this.scarSeed || 0);
          const u = 0.18 + this._hash01(s) * 0.74;
          const p0 = spineAt(u, -0.55 + this._hash01(s * 1.7) * 1.35);
          ctx.strokeStyle = 'rgba(239, 68, 68, ' + crackA.toFixed(2) + ')';
          ctx.lineWidth = 1.6 + this._hash01(s * 2.7);
          ctx.beginPath();
          ctx.moveTo(p0.x, p0.y);
          let cx = p0.x, cy = p0.y;
          for (let k = 0; k < 3; k++) {
            const a = (this._hash01(s * 3.1 + k) - 0.5) * 2.4 + spineBend(u) * 2.2;
            cx += Math.cos(a) * 9 + Math.cos(spineBend(u)) * 4;
            cy += Math.sin(a) * 9 + 2;
            ctx.lineTo(cx, cy);
          }
          ctx.stroke();
        }
      }
    }
    ctx.restore();

    // ======================================================================
    // 4. THE DORSAL LINE â€” the tall triangle that reads "shark" from a mile
    //    off, plus the second dorsal and the pelvic/anal nubs. All of them
    //    ride the spine, so the whole fin row ripples with the swim cycle.
    // ======================================================================
    const finTilt = (spinning ? 0.5 : 0) + rollV * 0.4 - droop * 0.25;
    {
      const rootFront = spineAt(0.62, -1.0);
      const rootBack  = spineAt(0.24, -1.0);
      const base       = spineAt(0.43, 0);
      // The sheet's dorsal: a big, heavy, swept-back triangle that leans into
      // the swim direction. Roots sit ON the back ridge (off=-1.0) so the fin
      // merg with the hull instead of floating a sliver above it — and the
      // BASE edge is traced along the ridge itself (sampled spine points, held
      // a hair outside the hull line), so no background can show through
      // between the fin and the back even while the spine bends. Bleed
      // Frenzy/Apex tear chunks out of its back.
      // DORSAL RESHAPE (take three). Two reports in a row: still too big, and
      // the fill colour (`finLite`) did not match the hide it grows out of, so
      // the fin read as a separate pasted-on triangle with no volume.
      //   - HEIGHT: apex ~1.35 body-depths and only 26px aft. The fin is now
      //     proportionate to the body rather than the first thing you see.
      //   - SHADING: the fin is no longer one flat fill. It is filled with the
      //     hull's own `hideTop` colour (so it belongs to the animal), then
      //     given a darker base gradient where it meets the back, a lit leading
      //     edge along the convex sweep, and a shadow band on the trailing
      //     side — the same three-band treatment the hull gets, so the fin has
      //     the same volume language as the body.
      const finH = bodyHalf(0.43) * 1.35;
      const tipX = base.x - 26 - (this.surge || 0) * 12 - (dashing ? 10 : 0);
      const tipY = base.y - finH + finTilt * 14;
      // The leading root is pulled DOWN onto the shoulder (spineAt -0.92, not
      // the ridge cap) so the leading edge has room to run long and convex —
      // the line that actually reads "shark fin" from a mile off.
      const rootFrontL = spineAt(0.62, -0.86);
      const edgeTear = Math.max(0, tearAmp - 0.25) * 14;
      const rootB = { x: rootBack.x - 4, y: rootBack.y - bodyHalf(0.43) * 0.40 };
      const rootF = { x: rootFrontL.x + 2, y: rootFrontL.y - bodyHalf(0.43) * 0.22 };
      const sampleQuad = (p0, pc, p1, n) => {
        const out = [];
        for (let i = 0; i <= n; i++) {
          const t = i / n, mt = 1 - t;
          out.push({
            x: mt * mt * p0.x + 2 * mt * t * pc.x + t * t * p1.x,
            y: mt * mt * p0.y + 2 * mt * t * pc.y + t * t * p1.y
          });
        }
        return out;
      };
      const tipP = { x: tipX, y: tipY };
      // Rear slope (root -> tip): SHORT and concave — the fin's trailing edge
      // drops from the apex quickly, which is what makes the shape read as a
      // triangle instead of a sail.
      const midRear = { x: (rootB.x + tipX) / 2, y: (rootB.y + tipY) / 2 };
      const leading = edgeTear > 1.5
        ? raggedEdge(rootB, tipP, 5, edgeTear, 61.7)
        : sampleQuad(rootB, { x: midRear.x + 7, y: midRear.y + 10 }, tipP, 7);
      // Front slope (tip -> front root): the LONG convex leading edge. The
      // control point is pushed forward and down so the edge bows outward.
      const midFront = { x: (tipX + rootF.x) / 2, y: (tipY + rootF.y) / 2 };
      const trailing = edgeTear > 1.5
        ? raggedEdge(tipP, rootF, 6, edgeTear, 63.1)
        : sampleQuad(tipP, { x: midFront.x + 14, y: midFront.y - 4 }, rootF, 10);
      // Base: ride the actual back ridge so the fin is one piece with the hull.
      const baseLine = [];
      for (let u = 0.62; u >= 0.235; u -= 0.035) {
        const p = spineAt(u, -1.06);
        baseLine.push({ x: p.x, y: p.y + 2 });
      }
      const pts = [{ x: rootBack.x, y: rootBack.y + 3 }]
        .concat(leading)
        .concat(trailing)
        .concat([{ x: rootFront.x + 4, y: rootFront.y + 3 }])
        .concat(baseLine);
      ctx.beginPath(); traceSmooth(ctx, pts); ctx.closePath();
      // Fill with the HULL's own back colour so the fin is the same animal,
      // then shade it: a dark foot where it springs from the back, the mid tone
      // over the membrane, and a lit leading edge on the convex sweep.
      ctx.fillStyle = flash ? '#e2e8f0' : finDark;
      ctx.fill();
      ctx.save();
      ctx.beginPath(); traceSmooth(ctx, pts); ctx.closePath();
      ctx.clip();
      // Base shadow: darkest at the root, fading up the membrane.
      const foot = ctx.createLinearGradient(0, base.y, 0, tipY);
      foot.addColorStop(0, 'rgba(4, 10, 22, 0.55)');
      foot.addColorStop(0.45, 'rgba(4, 10, 22, 0.12)');
      foot.addColorStop(1, 'rgba(4, 10, 22, 0)');
      ctx.fillStyle = foot;
      ctx.fillRect(Math.min(rootBack.x, tipX) - 4, Math.min(rootBack.y, tipY) - 4,
        Math.abs(rootBack.x - tipX) + 8, Math.abs(rootBack.y - tipY) + 8);
      // Mid membrane: the hide's own top tone, lighter toward the apex.
      const membrane = ctx.createLinearGradient(rootF.x, rootF.y, tipX, tipY);
      membrane.addColorStop(0, flash ? '#cbd5e1' : hideMid);
      membrane.addColorStop(1, flash ? '#f1f5f9' : hideTop);
      ctx.fillStyle = membrane;
      ctx.globalAlpha = 0.85;
      ctx.fillRect(Math.min(rootF.x, tipX) - 4, Math.min(rootF.y, tipY) - 4,
        Math.abs(rootF.x - tipX) + 8, Math.abs(rootF.y - tipY) + 8);
      ctx.globalAlpha = 1;
      ctx.restore();
      ctx.strokeStyle = outline;
      ctx.lineWidth = 4;
      ctx.stroke();
      // Membrane rays + leading-edge highlight, CLIPPED to the fin silhouette.
      // They used to be stroked unchecked, so both ends hung over the edges as
      // loose scratches — the other half of the "messy fin" read.
      ctx.save();
      ctx.beginPath(); traceSmooth(ctx, pts); ctx.closePath();
      ctx.clip();
      ctx.strokeStyle = 'rgba(6, 10, 20, 0.28)';
      ctx.lineWidth = 1.5;
      // Three rays fanning root -> tip: fin structure, not clutter.
      for (let r = 0; r < 3; r++) {
        ctx.beginPath();
        ctx.moveTo(rootFrontL.x - 2 - r * 6, rootFrontL.y - 8 - r * 6);
        ctx.lineTo(tipX + 6 + r * 9, tipY + 22 + r * 24);
        ctx.stroke();
      }
      ctx.strokeStyle = 'rgba(206, 224, 255, 0.30)';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(rootFrontL.x + 2, rootFrontL.y);
      ctx.quadraticCurveTo((rootFrontL.x + tipX) / 2 + 12, (rootFrontL.y + tipY) / 2 - 4, tipX, tipY - 2);
      ctx.stroke();
      ctx.restore();
      // Apex: the dorsal is notched and torn.
      if (ph === 3 || (ph === 2 && injury > 0.4)) {
        ctx.fillStyle = flash ? '#ffe4e6' : hideMid;
        ctx.beginPath();
        ctx.moveTo(tipX - 16, tipY + 10); ctx.lineTo(tipX + 2, tipY + 30); ctx.lineTo(tipX - 26, tipY + 26);
        ctx.closePath(); ctx.fill();
      }
      // Second dorsal — smaller, further back, its base also ridge-traced so it
      // can never read as a loose triangle hovering over the back.
      {
        const rF = spineAt(0.30, -0.86);
        const rB = spineAt(0.235, -0.9);
        const bb = spineAt(0.265, 0);
        const tp = { x: bb.x - 16, y: bb.y - bodyHalf(0.265) * 1.12 + finTilt * 8 };
        const ridge = [];
        for (let u = 0.30; u >= 0.235; u -= 0.022) {
          const p = spineAt(u, -1.04);
          ridge.push({ x: p.x, y: p.y + 2 });
        }
        ctx.beginPath();
        ctx.moveTo(rF.x, rF.y + 3);
        ctx.quadraticCurveTo(bb.x - 8, bb.y - bodyHalf(0.265) * 0.8, tp.x, tp.y);
        ctx.quadraticCurveTo(bb.x - 34, bb.y - bodyHalf(0.265) * 0.4, rB.x, rB.y + 3);
        // Sweep the base back along the ridge to the front root.
        for (const p of ridge) ctx.lineTo(p.x, p.y);
        ctx.closePath();
        ctx.fillStyle = flash ? '#e2e8f0' : finDark;
        ctx.fill();
        ctx.strokeStyle = outline;
        ctx.lineWidth = 3;
        ctx.stroke();
      }
    }
    // Pelvic + anal nubs: silhouette richness on the belly line. Both are
    // short, blunt and hugging the flank — pointed fins jutting aft here
    // cluttered the underside and tangled with the pectoral's tip.
    {
      const pelv = spineAt(0.35, 0.72);
      const pelvB = spineAt(0.29, 0.76);
      const pe = spineAt(0.32, 0);
      const tp = { x: pe.x - 14, y: pe.y + bodyHalf(0.32) * 1.05 - droop * 8 };
      ctx.beginPath();
      ctx.moveTo(pelv.x, pelv.y);
      ctx.quadraticCurveTo(pe.x - 8, pe.y + bodyHalf(0.32) * 0.92, tp.x, tp.y);
      ctx.quadraticCurveTo(pe.x - 22, pe.y + bodyHalf(0.32) * 0.66, pelvB.x, pelvB.y);
      ctx.closePath();
      ctx.fillStyle = flash ? '#e2e8f0' : finDark;
      ctx.fill();
      ctx.strokeStyle = outline;
      ctx.lineWidth = 3;
      ctx.stroke();

      const an = spineAt(0.17, 0.74);
      const anB = spineAt(0.12, 0.78);
      const ae = spineAt(0.145, 0);
      const at = { x: ae.x - 10, y: ae.y + bodyHalf(0.145) * 1.0 - droop * 6 };
      ctx.beginPath();
      ctx.moveTo(an.x, an.y);
      ctx.quadraticCurveTo(ae.x - 6, ae.y + bodyHalf(0.145) * 0.82, at.x, at.y);
      ctx.quadraticCurveTo(ae.x - 18, ae.y + bodyHalf(0.145) * 0.6, anB.x, anB.y);
      ctx.closePath();
      ctx.fillStyle = flash ? '#e2e8f0' : finDark;
      ctx.fill();
      ctx.strokeStyle = outline;
      ctx.lineWidth = 3;
      ctx.stroke();
    }

    // ======================================================================
    // 5. THE NEAR PECTORAL â€” the big swept wing on the viewer's side, drawn
    //    ON TOP. It flaps on the swim beat, lagging the head like a real fin.
    // ======================================================================
    {
      // Roots sit ON the belly ridge (off→0.9) so the wing emerges from the
      // hull silhouette with no floating gap — the old 0.6/0.66 roots left a
      // sliver of background between the fin base and the body outline.
      const rootA = spineAt(0.70, 0.90);
      const rootB = spineAt(0.58, 0.92);
      const mid   = spineAt(0.635, 0);
      const f = pecFlap;
      const wing = bodyHalf(0.635) * 1.5 + swing * 0.05;
      // PECTORAL RESHAPE. The wing used to be built from [rootB, wMid, wTip]
      // with wMid only 74px out at 0.9 wing-depth — a fat, nearly vertical
      // paddle. A pectoral is a LONG, NARROW, SWEPT-BACK wing: leading edge
      // runs clean from the belly to a pointed tip far aft, then a concave
      // trailing edge returns. Tearing only lives on the trailing edge.
      //
      // The tip reach was 148px, which carried it right back over the pelvic
      // and anal nubs on the same belly line: two swept shapes crossing each
      // other is exactly what read as a messy tangle of bottom fins. 118 keeps
      // the wing unmistakably long while leaving the nubs their own space.
      const wTip = { x: mid.x - 118 - f(0.12) * 26, y: mid.y + wing * 1.26 + f(0.12) * 14 };
      const trailingEnd = { x: mid.x - 52 - f(0.5) * 12, y: mid.y + wing * 0.68 + f(0.5) * 8 };
      const pts = [rootB, wTip]
        .concat(raggedEdge(wTip, trailingEnd, 3, 6 + tearAmp * 10, 81.7))
        .concat([rootA]);
      ctx.beginPath(); traceSmooth(ctx, pts); ctx.closePath();
      ctx.fillStyle = flash ? '#ffe4e6' : finLite;
      ctx.fill();
      ctx.strokeStyle = outline;
      ctx.lineWidth = 4;
      ctx.stroke();
      // Rays + the trailing-edge shadow that gives the wing thickness.
      // The rays are held INSIDE the wing: the old strokes ran past the
      // trailing edge to mid.x-112, so in game they read as loose strands
      // hanging off the fin rather than as membrane structure.
      ctx.strokeStyle = 'rgba(6, 10, 20, 0.30)';
      ctx.lineWidth = 1.8;
      // Rays: three clean strokes fanning along the swept wing.
      for (let r = 0; r < 3; r++) {
        ctx.beginPath();
        ctx.moveTo(rootB.x + 2, rootB.y - 3 + r * 3);
        ctx.quadraticCurveTo(mid.x - 58, mid.y + wing * 0.82 + r * 6,
          wTip.x + 22 + r * 11, wTip.y - 12 - r * 8);
        ctx.stroke();
      }
      // The lit leading edge, running root -> tip along the sweep.
      ctx.strokeStyle = 'rgba(206, 224, 255, 0.28)';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(rootB.x, rootB.y - 2);
      ctx.quadraticCurveTo((rootB.x + wTip.x) / 2 - 6, (rootB.y + wTip.y) / 2 + wing * 0.10,
        wTip.x, wTip.y);
      ctx.stroke();
    }

    // ======================================================================
    // 6. GILL SLITS — five slashes behind the head, fluttering with breath.
    //    UPGRADED: each slit now has a raised lip (a dark inner channel with a
    //    lit rim on one side) and a fleshy flap that opens with `gillFlare`, so
    //    the gills read as anatomy rather than as painted ticks. A faint blood
    //    bloom tracks the state instead of only appearing in later phases.
    // ======================================================================
    {
      const open = Math.max(0.18, Math.min(1.2,
        (this.gillFlare || 0) * 0.5 + (this.surge || 0) * 0.25 - droop * 0.3));
      for (let g = 0; g < 5; g++) {
        const u = 0.80 - g * 0.046;
        const top = spineAt(u, -0.52);
        const bot = spineAt(u - 0.004, 0.02);
        const len = (bot.y - top.y) * (0.5 + open * 0.35);
        const x0 = top.x - 2, y0 = top.y + 6;
        // 1. The channel: darkest at the mouth of the slit, tapering inward.
        ctx.strokeStyle = ph >= 2 ? 'rgba(96, 18, 30, 0.85)' : 'rgba(6, 10, 20, 0.78)';
        ctx.lineWidth = 2.6;
        ctx.beginPath();
        ctx.moveTo(x0, y0);
        ctx.quadraticCurveTo(x0 - 6, y0 + len * 0.5, x0 - 3, y0 + len);
        ctx.stroke();
        // 2. A lit rim on the slit's raised lower lip — the highlight that
        //    makes a slit look like tissue rather than a stroke.
        ctx.strokeStyle = 'rgba(180, 200, 224, 0.30)';
        ctx.lineWidth = 1.1;
        ctx.beginPath();
        ctx.moveTo(x0 + 1, y0 + 1);
        ctx.quadraticCurveTo(x0 - 3, y0 + len * 0.5, x0 + 1, y0 + len - 1);
        ctx.stroke();
        // 3. Blood bloom when the animal is worked hard: it scales with the
        //    damage taken (not just with the phase), so the gills redden as the
        //    fight goes on and are calm again at full HP.
        const blooded = Math.min(1, injury * 0.9 + (ph >= 2 ? 0.25 : 0) + woundGlow * 0.3);
        if (blooded > 0.15 && micro > 0.45) {
          ctx.save();
          ctx.globalCompositeOperation = 'lighter';
          ctx.globalAlpha = blooded * 0.42;
          const g2 = ctx.createRadialGradient(x0 - 3, y0 + len * 0.5, 1, x0 - 3, y0 + len * 0.5, len * 0.7);
          g2.addColorStop(0, 'rgba(190, 40, 55, 0.9)');
          g2.addColorStop(1, 'rgba(190, 40, 55, 0)');
          ctx.fillStyle = g2;
          ctx.fillRect(x0 - len * 0.7, y0 - 2, len * 0.8, len + 4);
          ctx.restore();
        }
        // 4. Phase 2+: the gills actively bleed light in the dark water.
        if (ph >= 2 && woundGlow > 0.2) {
          ctx.strokeStyle = 'rgba(248, 113, 113, ' + (0.18 + woundGlow * 0.3).toFixed(2) + ')';
          ctx.lineWidth = 1.4;
          ctx.beginPath();
          ctx.moveTo(x0, y0);
          ctx.quadraticCurveTo(x0 - 6, y0 + len * 0.5, x0 - 3, y0 + len);
          ctx.stroke();
        }
        // 5. EMBER VENT — the hot slit of living tissue deep inside the channel.
        //    A radial bloom centred two thirds down the slit, breathing with
        //    gillFlare: this is what makes the gills read as gasping anatomy
        //    under the water instead of painted marks, and it is the feature
        //    that lights the animal's silhouette from within during Blood
        //    Frenzy and the Apex phase.
        {
          const ventHeat = Math.max(0, Math.min(1,
            0.30 * (ph >= 2 ? 1 : 0.45) + 0.55 * (this.gillFlare || 0) * open
            + 0.25 * woundGlow));
          if (ventHeat > 0.06) {
            ctx.save();
            ctx.globalCompositeOperation = 'lighter';
            const vy0 = y0 + len * 0.62;
            const grad = ctx.createRadialGradient(x0 - 4, vy0, 0.5, x0 - 4, vy0, len * 0.5);
            const ember = ph >= 3 ? '255, 92, 60' : ph === 2 ? '244, 63, 94' : '190, 74, 60';
            grad.addColorStop(0, 'rgba(' + ember + ', ' + (0.55 * ventHeat).toFixed(3) + ')');
            grad.addColorStop(0.45, 'rgba(' + ember + ', ' + (0.18 * ventHeat).toFixed(3) + ')');
            grad.addColorStop(1, 'rgba(' + ember + ', 0)');
            ctx.fillStyle = grad;
            ctx.beginPath();
            ctx.ellipse(x0 - 4, vy0, len * 0.34, len * 0.5, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
            // The slit core itself: a short bright line at the hottest point,
            // flickering very slightly so the vent feels alive rather than lit.
            const flick = 0.85 + Math.sin(this.animT * 9 + g * 1.7) * 0.15;
            ctx.strokeStyle = 'rgba(255, 176, 140, ' + (0.5 * ventHeat * flick).toFixed(3) + ')';
            ctx.lineWidth = 1.4;
            ctx.beginPath();
            ctx.moveTo(x0 - 3, vy0 - len * 0.26);
            ctx.quadraticCurveTo(x0 - 5.4, vy0, x0 - 3.6, vy0 + len * 0.3);
            ctx.stroke();
          }
          // 6. GILL VAPOR — a slow ribbon of aerated water lifting off the slit
          //    tips. Deterministic (no Math.random), phase-tinted, and only the
          //    first three slits bother, so it reads as one breath, not five.
          if (g < 3 && micro > 0.35 && !vanished
              && ((this.gillFlare || 0) > 0.35 || ph >= 2 || dashing)) {
            const puff = (this.animT * 0.55 + g * 0.31) % 1;
            const alpha = (1 - puff) * (0.10 + open * 0.10)
              * (ph >= 2 ? 1.35 : 1);
            if (alpha > 0.015) {
              ctx.save();
              ctx.globalCompositeOperation = 'lighter';
              ctx.fillStyle = ph >= 2
                ? 'rgba(244, 118, 130, ' + Math.min(0.3, alpha).toFixed(3) + ')'
                : 'rgba(186, 230, 253, ' + Math.min(0.22, alpha).toFixed(3) + ')';
              ctx.beginPath();
              ctx.ellipse(x0 - 6 - puff * 12, y0 - 4 - puff * 20,
                2.2 + puff * 5.5, 1.6 + puff * 4, -0.4, 0, Math.PI * 2);
              ctx.fill();
              ctx.restore();
            }
          }
        }
      }
      // 7. GILL RIDGE SHADOW — a soft occlusion stroke behind the whole slit
      //    row, so the gill chamber sits IN the shoulder rather than on it.
      {
        const top0 = spineAt(0.80, -0.52);
        const bot0 = spineAt(0.61, 0.02);
        ctx.strokeStyle = 'rgba(6, 10, 20, 0.20)';
        ctx.lineWidth = 9;
        ctx.beginPath();
        ctx.moveTo(top0.x - 10, top0.y + 4);
        ctx.quadraticCurveTo(top0.x - 20, (top0.y + bot0.y) / 2, bot0.x - 4, bot0.y - 2);
        ctx.stroke();
      }
    }

    // ======================================================================
    // 6b. HIDE MICRO-DETAIL — three cheap, deterministic passes that make the
    //     hide read as a body instead of a filled silhouette. All of them use
    //     the quality dial: they are the first thing dropped on low effects.
    //       - DERMAL DENTICLES: tiny tooth-like scales, brighter on the lit
    //         upper flank and fading into the belly, along the swim direction.
    //       - BARNACLE CLUSTERS: pale calcareous dots crusted in 4 fixed spots
    //         (a wound scar line, the peduncle, behind the eye, at the dorsal
    //         root) — the detail that most reads as "an old animal".
    //       - SPERM-whale-style WRINKLES: a few short fold lines over the
    //         shoulder where the hide bunches during a turn.
    // ======================================================================
    const micro = this._fxDetail();
    if (micro > 0.35) {
      const detailSeed = (this.scarSeed || 0) * 0.37;

    // ---- dermal denticles: small soft scales, denser on the lit flank ----
    // Raised from 46 to 120 (and 90 to 170 at high quality): the hide's
    // micro-texture is what stopped the body reading as a flat silhouette,
    // and the previous counts were still too sparse to see at game scale.
    const scaleCount = micro > 0.75 ? 170 : 120;
      ctx.save();
      ctx.globalAlpha = 1.0;
      for (let i = 0; i < scaleCount; i++) {
        const a = this._hash01(detailSeed + i * 1.71);
        const b = this._hash01(detailSeed * 1.37 + i * 2.13);
        const c = this._hash01(detailSeed * 0.61 + i * 3.29);
        // Skip the head: the face is drawn separately and scales there read as
        // dirt on a portrait.
        const u = 0.12 + a * 0.72;
        const off = -0.8 + c * 1.55;
        const p = spineAt(u, off);
        // Only on the body, and only where the hull is actually wide.
        const hh = bodyHalf(u);
        if (Math.abs(off) > 0.95 || hh < 8) continue;
        // Scales rake backwards, and grow sparser toward the belly.
        const size = 1.8 + b * 1.6;
        const drift = (b - 0.5) * 5;
        const lit = off < -0.05;
        ctx.fillStyle = lit ? 'rgba(203, 226, 250, 0.55)' : 'rgba(6, 12, 24, 0.32)';
        ctx.fillRect(p.x + drift, p.y + (b - 0.5) * 3, size, size * 0.75);
      }
      ctx.restore();
      // ---- barnacle crust: 4 fixed clusters of pale calcareous dots --------
      const clusters = [
        [0.86, -0.55], [0.72, 0.42], [0.14, 0.62], [0.46, -1.0]
      ];
      for (const [cu, coff] of clusters) {
        const base = spineAt(cu, coff);
        if (!Number.isFinite(base.x)) continue;
        // More barnacles per cluster (14/9): the crust is the single most
        // readable 'this is an old animal' cue, and it was barely visible.
        const n = micro > 0.75 ? 14 : 9;
        for (let k = 0; k < n; k++) {
          const a = this._hash01(detailSeed * 0.83 + cu * 40 + k * 1.93);
          const b2 = this._hash01(detailSeed * 1.51 + cu * 61 + k * 2.71);
          const c2 = this._hash01(detailSeed * 0.29 + cu * 17 + k * 3.37);
          if (c2 > 0.72) continue;                        // crust, not a carpet
          const bx = base.x + (a - 0.5) * 26;
          const by = base.y + (b2 - 0.5) * 14;
          const s = 1.8 + c2 * 2.6;
          ctx.fillStyle = 'rgba(226, 236, 245, ' + (0.62 + c2 * 0.32).toFixed(2) + ')';
          ctx.fillRect(bx, by, s, s);
          // Littoral barnacles have a dark rim.
          ctx.fillStyle = 'rgba(20, 30, 44, 0.5)';
          ctx.fillRect(bx, by + s - 0.7, s, 1);
          if (c2 > 0.45) {
            ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
            ctx.fillRect(bx, by, 1, 1);
          }
        }
      }
      // ---- hide folds: short lines where the shoulder bunches in a turn ----
      const foldCount = micro > 0.75 ? 5 : 3;
      ctx.strokeStyle = 'rgba(6, 12, 24, 0.18)';
      ctx.lineWidth = 1.3;
      for (let i = 0; i < foldCount; i++) {
        const u = 0.58 + i * 0.055;
        const a = spineAt(u, -0.75);
        const b3 = spineAt(u + 0.03, -0.35);
        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.quadraticCurveTo((a.x + b3.x) / 2 - 3, (a.y + b3.y) / 2 + 3, b3.x, b3.y);
        ctx.stroke();
      }
    }

    // ======================================================================
    // 7. HIDE WEAR — a small, DELIBERATE set of battle scars. These are
    //    readable slashes, not scatter: hatch marks, barnacles and escort
    //    fish were removed because they read as noise at game scale.
    // ======================================================================
    {
      const scars = 4 + Math.floor(injury * 4);      // 4 .. 8, more as it dies
      for (let s = 0; s < scars; s++) {
        const sSeed = s * 7.399 + (this.scarSeed || 0);
        const u = 0.20 + this._hash01(sSeed) * 0.74;
        // Upper flank only: scars never cross the pale belly or the face.
        const p = spineAt(u, -0.85 + this._hash01(sSeed * 1.7) * 0.7);
        const slen = 16 + this._hash01(sSeed * 2.3) * 26;
        // Slashes rake backwards along the body, following the spine.
        const sang = 0.6 + this._hash01(sSeed * 3.1) * 0.5 + spineBend(u) * 0.4;
        const a2 = spineAt(u + 0.05, -0.85 + this._hash01(sSeed * 1.7) * 0.7);
        // A SCAR is healed tissue, not a drawn line: a pale core with a darker
        // shadow along one side (the keloid standing proud of the hide) and a
        // bright rim along the other, over a 3-segment jag — never a single
        // clean stroke, and never glowing. Straight bright lines are what these
        // used to be, and straight bright lines read as vector art.
        const j1 = {
          x: p.x + Math.cos(sang) * slen * 0.45 + Math.sin(sang + 1.6) * 2.5,
          y: p.y + Math.sin(sang) * slen * 0.45 + Math.cos(sang + 1.6) * 2.5
        };
        const p2 = {
          x: a2.x + Math.cos(sang) * slen - 2,
          y: a2.y + Math.sin(sang) * slen + 1
        };
        // 1. Shadow under the raised tissue.
        ctx.strokeStyle = 'rgba(8, 14, 26, 0.5)';
        ctx.lineWidth = 3.4;
        ctx.beginPath();
        ctx.moveTo(p.x + 1.6, p.y + 1.8);
        ctx.lineTo(j1.x + 1.6, j1.y + 1.8);
        ctx.lineTo(p2.x + 1.6, p2.y + 1.8);
        ctx.stroke();
        // 2. Pale healed core: the widest part is the middle of the slash.
        ctx.strokeStyle = 'rgba(206, 214, 228, ' + (0.62 + injury * 0.22).toFixed(2) + ')';
        ctx.lineWidth = 2.2;
        ctx.beginPath();
        ctx.moveTo(p.x, p.y);
        ctx.lineTo(j1.x, j1.y);
        ctx.lineTo(p2.x, p2.y);
        ctx.stroke();
        // 3. Bright rim on the sun side, only on the upper edge.
        ctx.strokeStyle = 'rgba(240, 246, 255, 0.5)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(p.x - 1, p.y - 1.2);
        ctx.lineTo(j1.x - 1, j1.y - 1.2);
        ctx.lineTo(p2.x - 1, p2.y - 1.2);
        ctx.stroke();
        // 4. In the apex phase a couple of the OLDEST wounds throb: a slow,
        // dim pulse under two of them only, so the body reads as scarred flesh
        // that happens to be alive, not as a map of light sources.
        if (ph === 3 && s % 3 === 0) {
          ctx.strokeStyle = 'rgba(190, 70, 80, ' + (0.16 + 0.22 * (0.5 + 0.5 * Math.sin(this.animT * 2.2 + s))).toFixed(2) + ')';
          ctx.lineWidth = 5;
          ctx.beginPath();
          ctx.moveTo(p.x, p.y);
          ctx.lineTo(j1.x, j1.y);
          ctx.lineTo(p2.x, p2.y);
          ctx.stroke();
        }
      }
    }

      // ---- Richer hide-wear pass. The single-slash loop above is kept, and
      // these additional scar families layer over it so the animal reads as a
      // scarred veteran rather than a cleanly sketched silhouette.
      const seed = this.scarSeed || 0;
      // (a) TOOTH-RAKE TRIPLES: three parallel scratches from one rival's
      //     swipe — always a tight cluster of exactly three.
      const rakes = 2 + Math.floor(this._hash01(seed * 5.7) * 3);
      for (let rk = 0; rk < rakes; rk++) {
        const rs = rk * 13.31 + seed * 0.9;
        const u = 0.22 + this._hash01(rs) * 0.6;
        const p = spineAt(u, -0.74 + this._hash01(rs * 1.4) * 0.55);
        const baseA = 0.55 + this._hash01(rs * 2.1) * 0.6 + spineBend(u) * 0.35;
        const len = 20 + this._hash01(rs * 2.8) * 26;
        for (let t = -1; t <= 1; t++) {
          const a = baseA + t * 0.14;
          const off = t * 5.5;
          ctx.strokeStyle = 'rgba(206, 214, 228, ' + (0.34 + injury * 0.2).toFixed(2) + ')';
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.moveTo(p.x + Math.sin(baseA) * off, p.y + Math.cos(baseA) * off);
          ctx.lineTo(p.x + Math.sin(baseA) * off + Math.cos(a) * len,
            p.y + Math.cos(baseA) * off + Math.sin(a) * len);
          ctx.stroke();
        }
      }
      // (b) HEALED BITE HOLES: paired pockmarks with a raised pale rim.
      const holes = 2 + Math.floor(this._hash01(seed * 3.9) * 3);
      for (let hIdx = 0; hIdx < holes; hIdx++) {
        const hs = hIdx * 8.61 + seed * 3.4;
        const u = 0.20 + this._hash01(hs) * 0.64;
        const p = spineAt(u, -0.72 + this._hash01(hs * 1.6) * 0.5);
        const rr = 3.4 + this._hash01(hs * 2.3) * 4.4;
        ctx.fillStyle = 'rgba(10, 14, 26, 0.55)';
        ctx.beginPath(); ctx.arc(p.x, p.y, rr * 0.6, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = 'rgba(226, 234, 252, 0.35)';
        ctx.lineWidth = 1.3;
        ctx.beginPath(); ctx.arc(p.x, p.y, rr, 0, Math.PI * 2); ctx.stroke();
        ctx.fillStyle = 'rgba(10, 14, 26, 0.45)';
        ctx.beginPath(); ctx.arc(p.x - rr * 2.2, p.y + rr * 0.8, rr * 0.5, 0, Math.PI * 2); ctx.fill();
      }
      // (c) BARNACLE RINGS: pale encrusted clusters from its slow years.
      const barns = 4 + Math.floor(this._hash01(seed * 7.1) * 4);
      for (let bIdx = 0; bIdx < barns; bIdx++) {
        const bs = bIdx * 4.773 + seed * 2.1;
        const u = 0.30 + this._hash01(bs) * 0.56;
        const p = spineAt(u, -0.9 + this._hash01(bs * 1.7) * 0.45);
        const rr = 2.2 + this._hash01(bs * 2.3) * 3.2;
        ctx.strokeStyle = 'rgba(216, 226, 244, 0.42)';
        ctx.lineWidth = 1.2;
        ctx.beginPath(); ctx.arc(p.x, p.y, rr, 0, Math.PI * 2); ctx.stroke();
        ctx.strokeStyle = 'rgba(180, 195, 220, 0.28)';
        ctx.beginPath(); ctx.arc(p.x, p.y, rr * 0.5, 0, Math.PI * 2); ctx.stroke();
        ctx.fillStyle = 'rgba(240, 246, 255, 0.28)';
        ctx.beginPath(); ctx.arc(p.x - rr * 0.3, p.y - rr * 0.3, rr * 0.3, 0, Math.PI * 2); ctx.fill();
      }
      // (d) DAPPLE COAT: faint two-tone speckle along the whole flank, bigger
      //     and denser than before but low-contrast — texture, never noise.
      const dapples = 30 + Math.floor(injury * 14);
      for (let d = 0; d < dapples; d++) {
        const ds = d * 3.317 + seed * 0.31;
        const u = 0.10 + this._hash01(ds) * 0.86;
        const p = spineAt(u, -0.95 + this._hash01(ds * 1.9) * 1.55);
        const rr = 2.6 + this._hash01(ds * 2.7) * 6;
        const upper = this._hash01(ds * 1.9) < 0.55;
        ctx.fillStyle = upper ? 'rgba(210, 230, 255, 0.07)' : 'rgba(6, 10, 20, 0.06)';
        ctx.beginPath();
        ctx.ellipse(p.x, p.y, rr, rr * 0.58, this._hash01(ds * 4.1) * 3, 0, Math.PI * 2);
        ctx.fill();
      }
      // (e) CROSS-HATCHED SCAR WEBS: long-healed wounds crossed by older ones.
      const webs = 1 + Math.floor(this._hash01(seed * 9.9) * 2);
      for (let wIdx = 0; wIdx < webs; wIdx++) {
        const ws = wIdx * 17.43 + seed * 2.6;
        const u = 0.30 + this._hash01(ws) * 0.46;
        const p = spineAt(u, -0.66 + this._hash01(ws * 1.3) * 0.5);
        const arm = 12 + this._hash01(ws * 2.4) * 14;
        ctx.strokeStyle = 'rgba(224, 232, 250, 0.26)';
        ctx.lineWidth = 1.2;
        for (const a of [0.7, 2.15, 3.5, 4.9]) {
          const aa = a + this._hash01(ws * 3.1) * 0.5;
          ctx.beginPath();
          ctx.moveTo(p.x - Math.cos(aa) * arm, p.y - Math.sin(aa) * arm * 0.7);
          ctx.lineTo(p.x + Math.cos(aa) * arm, p.y + Math.sin(aa) * arm * 0.7);
          ctx.stroke();
        }
      }
      // (f) THE SIGNATURE GASH — one long, deliberate wound that runs from the
      //     gill chamber back toward the dorsal root, the story scar of the
      //     whole animal. A real healed gash is a rope: a raised pale ridge
      //     with a shadow under it, crossed by four or five stitch marks where
      //     the wound was closed, and it always reads at game scale because it
      //     is ONE big line instead of a scatter of small ones. It appears
      //     only once the animal has actually been hurt (injury > 0.12), so a
      //     fresh Megalodon at full HP is clean and the scar grows into the
      //     fight — then stays lit (and throbs) through the Apex phase.
      if (injury > 0.12 && !vanished) {
        const uA = 0.55 + this._hash01(seed * 1.7) * 0.12;
        const uB = uA + 0.20;
        const offA = -0.44 + this._hash01(seed * 2.9) * 0.2;
        const gpts = [];
        for (let gi = 0; gi <= 4; gi++) {
          const gu = uA + (uB - uA) * (gi / 4);
          gpts.push(spineAt(gu, offA + gi * 0.07 + Math.sin(gi * 2.1 + seed) * 0.05));
        }
        const severity = Math.min(1, (injury - 0.12) / 0.5);
        const drawPoly = (pts, dx, dy) => {
          ctx.beginPath();
          ctx.moveTo(pts[0].x + dx, pts[0].y + dy);
          for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i].x + dx, pts[i].y + dy);
          ctx.stroke();
        };
        // 1. Shadow trough under the raised tissue.
        ctx.strokeStyle = 'rgba(6, 12, 24, ' + (0.45 + severity * 0.2).toFixed(2) + ')';
        ctx.lineWidth = 5.2;
        drawPoly(gpts, 1.6, 2.2);
        // 2. The pale keloid ridge itself — widest at the gill end, tapering.
        ctx.strokeStyle = 'rgba(214, 222, 238, ' + (0.55 + severity * 0.3).toFixed(2) + ')';
        ctx.lineWidth = 3.4;
        drawPoly(gpts, 0, 0);
        // 3. Stitch marks: short perpendicular ticks crossing the ridge, the
        //    single most legible "this wound was deep" cue at 24px scale.
        ctx.strokeStyle = 'rgba(190, 200, 220, ' + (0.5 + severity * 0.25).toFixed(2) + ')';
        ctx.lineWidth = 1.6;
        for (let si = 1; si <= 4; si++) {
          const t = si / 5;
          const idx = Math.min(gpts.length - 2, Math.floor(t * (gpts.length - 1)));
          const a0 = gpts[idx], b0 = gpts[idx + 1];
          const mx = a0.x + (b0.x - a0.x) * (t * (gpts.length - 1) - idx);
          const my = a0.y + (b0.y - a0.y) * (t * (gpts.length - 1) - idx);
          ctx.beginPath();
          ctx.moveTo(mx - 2.5, my - 4);
          ctx.lineTo(mx + 2.5, my + 4);
          ctx.stroke();
        }
        // 4. Apex: the gash splits back open and glows from inside — same
        //    heartbeat as the flank scars, but hotter and always on.
        if (ph >= 2) {
          ctx.save();
          ctx.globalCompositeOperation = 'lighter';
          ctx.strokeStyle = 'rgba(239, 68, 68, '
            + (0.14 + severity * 0.22 + 0.14 * Math.sin(this.animT * 2.6)).toFixed(3) + ')';
          ctx.lineWidth = 2.2;
          drawPoly(gpts, 0, 0);
          ctx.restore();
        }
      }
      // (g) TORN FIN NOTCHES — bite craters taken out of the dorsal and the
      //     near pectoral: dark wedges over the fin body plus a pale healed
      //     lip, so the fins themselves carry the fight history. Count scales
      //     with injury; deterministic from scarSeed.
      if (micro > 0.35) {
        const tears = Math.min(5, 1 + Math.floor(injury * 5));
        for (let ti = 0; ti < tears; ti++) {
          const ts = ti * 11.17 + seed * 4.4;
          // Alternate between dorsal territory (u 0.30..0.62, high on the back)
          // and pectoral territory (u 0.66..0.80, mid flank).
          const onDorsal = this._hash01(ts * 0.7) < 0.55;
          const u = onDorsal ? 0.30 + this._hash01(ts) * 0.32
            : 0.66 + this._hash01(ts) * 0.14;
          const p = onDorsal ? spineAt(u, -1.16) : spineAt(u, 0.34);
          const r = 4.5 + this._hash01(ts * 1.9) * 5;
          const bite = 0.7 + this._hash01(ts * 2.7) * 1.4;
          // Healed lip: a pale arc around the crater's intact side.
          ctx.strokeStyle = 'rgba(206, 216, 234, 0.4)';
          ctx.lineWidth = 1.6;
          ctx.beginPath();
          ctx.arc(p.x, p.y, r, Math.PI * 0.25, Math.PI * (1.1 + bite * 0.5));
          ctx.stroke();
          // The notch itself: dark wedge bitten out of the silhouette edge.
          ctx.fillStyle = 'rgba(8, 14, 26, 0.55)';
          ctx.beginPath();
          ctx.moveTo(p.x, p.y);
          ctx.arc(p.x, p.y, r * 0.85, Math.PI * (1.15 + bite * 0.35), Math.PI * (2.0 + bite * 0.55));
          ctx.closePath();
          ctx.fill();
        }
      }

    // ======================================================================
    // 8. THE HEAD â€” blunt snout, heavy brow, burning eye. The head carries
    //    its own counter-rotation against the spine so it stays "aimed".
    // ======================================================================
    const headSlope = Math.atan2(spineAt(0.98, 0).y - spineAt(0.86, 0).y,
      spineAt(0.98, 0).x - spineAt(0.86, 0).x);
    {
      // Brow ridge: a heavy shadow above the eye, angriest in the apex phase.
      // PHASE 3 RAGE: the whole brow drops and thickens — the classic predatory
      // glare — and a second, darker folded brow ridge stacks over the first,
      // which is the single cheapest way to make the same head read as enraged
      // instead of merely darker-tinted.
      const browA = spineAt(0.92, -0.62);
      const browB = spineAt(0.70, -0.55);
      const bb = spineAt(0.80, 0);
      const rageBrow = ph === 3 ? (0.28 + 0.1 * Math.sin(this.animT * 4)) : 0;
      ctx.beginPath();
      ctx.moveTo(browA.x, browA.y);
      ctx.quadraticCurveTo(bb.x + 6, bb.y - bodyHalf(0.80) * (1.05 + 0.1 * eyeGlow),
        browB.x, browB.y);
      ctx.quadraticCurveTo(bb.x + 2, bb.y - bodyHalf(0.80) * 0.55, browA.x + 12, browA.y + 8);
      ctx.closePath();
      ctx.fillStyle = hideTop;
      ctx.fill();
      ctx.strokeStyle = outline;
      ctx.lineWidth = 3;
      ctx.stroke();
      if (rageBrow > 0.01) {
        // The folded angry brow: a wedge pressed down over the eye.
        const foldA = spineAt(0.94, -0.72);
        const foldB = spineAt(0.72, -0.34);
        ctx.beginPath();
        ctx.moveTo(foldA.x, foldA.y);
        ctx.quadraticCurveTo(bb.x + 8, bb.y - bodyHalf(0.80) * (1.34 + rageBrow), foldB.x, foldB.y);
        ctx.quadraticCurveTo(bb.x + 2, bb.y - bodyHalf(0.80) * 0.78, foldA.x + 14, foldA.y + 6);
        ctx.closePath();
        ctx.fillStyle = 'rgba(6, 12, 24, 0.55)';
        ctx.fill();
        ctx.strokeStyle = 'rgba(15, 23, 42, 0.8)';
        ctx.lineWidth = 2;
        ctx.stroke();
      }

      // THE EYE: bead + iris + pupil + glint, with a nictitating blink. It
      // sits just above the mouth line, a third of the way back from the
      // snout — low and forward, the way a predator's eye is set.
      const eye = spineAt(0.875, -0.34);
      const eyeX = eye.x, eyeY = eye.y - 2;
      // Where the eye looks: the player, converted to the nose-right frame.
      let lookX = 0, lookY = 0;
      const player = this.game && this.game.player;
      if (player && !vanished) {
        const ex = this.x + this.width * 0.5, ey = this.y + this.height * 0.5;
        const dx = (player.x + player.width / 2) - ex;
        const dy = (player.y + player.height / 2) - ey;
        const d = Math.hypot(dx, dy) || 1;
        lookX = Math.max(-1, Math.min(1, dx / d)) * faceDir;
        lookY = Math.max(-1, Math.min(1, dy / d));
      }
      if (eyeGlow > 0) {
        // Ember bloom behind the eye; the pulse is the heartbeat of the fight.
        ctx.fillStyle = 'rgba(239, 68, 68, ' + (0.14 + eyeGlow * 0.26).toFixed(2) + ')';
        ctx.beginPath();
        ctx.arc(eyeX, eyeY, 13 + eyeGlow * 5 + Math.sin(this.animT * 6) * 1.5, 0, Math.PI * 2);
        ctx.fill();
      }
      // PHASE 3 RAGE: the eye goes wide — sclera showing all around a blown
      // iris — with a hot outer ring. Wide iris + visible sclera is the body
      // language of an enraged animal; a bigger version of the same calm eye
      // is not.
      const rageEye = ph === 3 ? 1 : 0;
      // Sclera: white when it flashes, a livid red neon the rest of the time.
      ctx.fillStyle = flash ? '#ffffff' : eyeGlow > 0.6 ? '#fca5a5' : '#e2b3b3';
      ctx.beginPath(); ctx.ellipse(eyeX, eyeY, 8.4 + rageEye * 1.6, 7.2 + rageEye * 1.2, 0, 0, Math.PI * 2); ctx.fill();
      // Iris: deep blood-red, brightening with the phase.
      const iris = ph === 1 ? '#7f1d1d' : ph === 2 ? '#b91c1c' : '#ef4444';
      ctx.fillStyle = flash ? '#fecdd3' : iris;
      ctx.beginPath(); ctx.ellipse(eyeX + lookX * 2, eyeY + lookY * 1.4, 5.8 + rageEye * 1.5, 6.2 + rageEye * 1.2, 0, 0, Math.PI * 2); ctx.fill();
      if (rageEye) {
        // Hot rim where the iris meets the sclera: the "starved" read.
        ctx.strokeStyle = 'rgba(248, 113, 113, ' + (0.5 + 0.3 * Math.sin(this.animT * 8)).toFixed(2) + ')';
        ctx.lineWidth = 1.4;
        ctx.beginPath();
        ctx.ellipse(eyeX + lookX * 2, eyeY + lookY * 1.4, 5.8 + rageEye * 1.5, 6.2 + rageEye * 1.2, 0, 0, Math.PI * 2);
        ctx.stroke();
      }
      // Pupil: a black vertical slit, the way a shark's eye actually reads.
      ctx.fillStyle = '#0b0710';
      ctx.beginPath(); ctx.ellipse(eyeX + lookX * 3, eyeY + lookY * 2, 1.7, 4.2, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(eyeX - 1.5 + lookX * 2, eyeY - 4, 2.4, 2.4);
      // Socket ring: dark hide around the eye so it sits IN the head.
      ctx.strokeStyle = outline;
      ctx.lineWidth = 2.5;
      ctx.beginPath(); ctx.ellipse(eyeX, eyeY, 10.5, 8.8, 0, 0, Math.PI * 2); ctx.stroke();
      // Blink: the nictitating membrane sweeps down; exhaustion half-lids it.
      const lid = Math.max(this.blink || 0, exhausted ? 0.45 : 0);
      if (lid > 0.02) {
        ctx.fillStyle = hideMid;
        ctx.beginPath();
        ctx.ellipse(eyeX, eyeY - 10 + lid * 12, 11, 10 * lid + 1.5, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = outline;
        ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(eyeX - 10, eyeY - 8 + lid * 11); ctx.lineTo(eyeX + 10, eyeY - 8 + lid * 11); ctx.stroke();
      }
      // Angry crease over the eye; a second one opens in the apex phase.
      ctx.strokeStyle = outline;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(eyeX - 15, eyeY - 12);
      ctx.lineTo(eyeX + 10, eyeY - 8);
      ctx.stroke();
      if (ph === 3) {
        ctx.beginPath();
        ctx.moveTo(eyeX - 12, eyeY - 17);
        ctx.lineTo(eyeX + 8, eyeY - 14);
        ctx.stroke();
      }
      // Nostril slit near the snout tip.
      ctx.fillStyle = 'rgba(6, 10, 20, 0.8)';
      ctx.beginPath(); ctx.ellipse(spineAt(0.97, -0.35).x, spineAt(0.97, -0.35).y, 3, 2, 0.3, 0, Math.PI * 2); ctx.fill();
      // Ampullae of Lorenzini: the sensory pores over the snout — kept as an
      // even, paired row so it reads as anatomy instead of confetti.
      ctx.fillStyle = 'rgba(6, 10, 20, 0.3)';
      for (let a = 0; a < 6; a++) {
        const p = spineAt(0.955 - (a % 3) * 0.026, -0.62 + Math.floor(a / 3) * 0.13);
        ctx.fillRect(p.x, p.y, 2, 1.6);
      }
    }

    // ======================================================================
    // 9. THE MAW — the biggest single feature of the model. A real hinge:
    //    the lower jaw rotates about a point behind the mouth corner, so the
    //    teeth interleave, the throat opens and the tongue rides the floor.
    //    The mouth line itself is routed along the UNDERSIDE of the snout —
    //    a shark's mouth is a slot under the head, not a gash across it.
    // ======================================================================
    {
      // Mouth corner (hinge) sits behind the eye, low on the flank; the front
      // of the lip rides the belly outline of the snout.
      const hinge = spineAt(0.585, 0.12);
      const lipEnd = spineAt(0.985, 0.50);
      const lipCtrl = { x: hinge.x + (lipEnd.x - hinge.x) * 0.52, y: hinge.y + (lipEnd.y - hinge.y) * 0.52 + 4 };
      const lipPt = (f) => this._quadAt(hinge, lipCtrl, lipEnd, f);
      const lipTangent = (f) => {
        const a = lipPt(Math.max(0, f - 0.03)), b = lipPt(Math.min(1, f + 0.03));
        const dx = b.x - a.x, dy = b.y - a.y;
        const l = Math.hypot(dx, dy) || 1;
        return { x: dx / l, y: dy / l };
      };
      // Jaw angle: a resting snarl that unhinges to near-vertical. The sheet's
      // gape is enormous: the head throws open like a bear trap.
      const ja = 0.10 + (this.jawOpen || 0) * 0.64;
      const rot = (p, a) => {
        const c = Math.cos(a), s = Math.sin(a);
        const dx = p.x - hinge.x, dy = p.y - hinge.y;
        return { x: hinge.x + dx * c - dy * s, y: hinge.y + dx * s + dy * c };
      };
      // Closed mouth line: the lip dropped by the jaw's resting thickness.
      const closedY = (f) => {
        const t = lipTangent(f);
        return { x: lipPt(f).x - t.y * 5, y: lipPt(f).y + t.x * 5 };
      };
      // Jaw line: the closed line rotated open about the hinge.
      const jawPt = (f) => rot(closedY(f), ja);
      const jawTangent = (f) => {
        const a = jawPt(Math.max(0, f - 0.03)), b = jawPt(Math.min(1, f + 0.03));
        const dx = b.x - a.x, dy = b.y - a.y;
        const l = Math.hypot(dx, dy) || 1;
        return { x: dx / l, y: dy / l };
      };
      const open01 = Math.max(0, Math.min(1, ((this.jawOpen || 0) - 0.12) / 0.88));

      // ---- Mouth interior: a sliver when shut, a maw when thrown wide. ----
      {
        const interior = [];
        for (let i = 0; i <= 10; i++) interior.push(lipPt(i / 10));
        for (let i = 10; i >= 0; i--) interior.push(jawPt(i / 10));
        ctx.beginPath(); traceSmooth(ctx, interior); ctx.closePath();
        ctx.fillStyle = mouthDeep;
        ctx.fill();
        ctx.strokeStyle = outline;
        ctx.lineWidth = 2.5;
        ctx.stroke();
        if (open01 > 0.03) {
          // Lit throat: a brighter wedge deep inside the gape.
          const lit = [];
          for (let i = 0; i <= 8; i++) {
            const f = i / 8;
            const p = lipPt(0.10 + f * 0.48), q = jawPt(0.10 + f * 0.48);
            lit.push({ x: p.x + (q.x - p.x) * 0.30, y: p.y + (q.y - p.y) * 0.30 });
          }
          for (let i = 8; i >= 0; i--) {
            const f = i / 8;
            const p = lipPt(0.10 + f * 0.48), q = jawPt(0.10 + f * 0.48);
            lit.push({ x: p.x + (q.x - p.x) * 0.70, y: p.y + (q.y - p.y) * 0.70 });
          }
          ctx.beginPath(); traceSmooth(ctx, lit); ctx.closePath();
          ctx.fillStyle = mouthLit;
          ctx.fill();
          // Throat rings receding into the gullet. Control points are sampled
          // BETWEEN the lip and jaw (the old `p.x - 12*rr` dragged them a
          // fixed 24px sideways and they streaked out of the gape when open).
          ctx.strokeStyle = 'rgba(74, 10, 24, 0.55)';
          ctx.lineWidth = 2;
          for (let rr = 0; rr < 3; rr++) {
            const f0 = 0.12 + rr * 0.11;
            const p = lipPt(f0), q = jawPt(f0);
            const at = (s) => ({ x: p.x + (q.x - p.x) * s, y: p.y + (q.y - p.y) * s });
            const a = at(0.3), b = at(0.5), c = at(0.7);
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.quadraticCurveTo(b.x, b.y, c.x, c.y);
            ctx.stroke();
          }
          // Tongue: a muscular curl riding the floor of the mouth. Sized by
          // the GAPE — the old fixed 26x7 ellipse overflowed the lips at small
          // openings and smeared a red blob across the snout.
          if (open01 > 0.16) {
            const t0 = jawPt(0.34), t1 = jawPt(0.62);
            const tg = jawTangent(0.5);
            ctx.fillStyle = '#8f1220';
            ctx.beginPath();
            ctx.ellipse((t0.x + t1.x) / 2, (t0.y + t1.y) / 2 + 3,
              8 + open01 * 26, 2.5 + open01 * 8, Math.atan2(tg.y, tg.x), 0, Math.PI * 2);
            ctx.fill();
          }
          // The heat of the gullet, phase 2+: skill glow bleeds out of it.
          // Also gaped — a fixed 26x10 disc spilled over the jawline shut.
          if (ph >= 2 && this.skillGlow > 0 && open01 > 0.2) {
            const g0 = lipPt(0.2), g1 = jawPt(0.2);
            ctx.fillStyle = 'rgba(251, 146, 60, ' + Math.min(0.35, this.skillGlow * 0.22).toFixed(2) + ')';
            ctx.beginPath();
            ctx.ellipse((g0.x + g1.x) / 2, (g0.y + g1.y) / 2,
              6 + open01 * 20, 3 + open01 * 9, 0, 0, Math.PI * 2);
            ctx.fill();
          }
        }
      }

      // ---- LOWER JAW: the slab + its teeth, hinged at the mouth corner. ----
      {
        const slab = [];
        for (let i = 0; i <= 8; i++) slab.push(jawPt(i / 8));
        // Jaw depth: a slab, not a block. Kept slim even at full gape — the
        // old `13 + open*8` grew the slab to 28px wide and, swung open, it
        // dragged across the gill/pectoral area and read as a mess.
        const jowl = (f) => 11 + open01 * 3 + Math.sin(f * Math.PI) * 6;
        for (let i = 8; i >= 0; i--) {
          const f = i / 8;
          const t = jawTangent(f);
          slab.push({ x: jawPt(f).x - t.y * jowl(f), y: jawPt(f).y + t.x * jowl(f) });
        }
        ctx.beginPath(); traceSmooth(ctx, slab); ctx.closePath();
        ctx.fillStyle = hideMid;
        ctx.fill();
        ctx.strokeStyle = outline;
        ctx.lineWidth = 3.5;
        ctx.stroke();
        // Jaw underside highlight.
        ctx.strokeStyle = 'rgba(200, 220, 255, 0.14)';
        ctx.lineWidth = 3;
        ctx.beginPath();
        for (let i = 0; i <= 8; i++) {
          const f = i / 8;
          const t = jawTangent(f);
          const p = { x: jawPt(f).x - t.y * (jowl(f) * 0.8), y: jawPt(f).y + t.x * (jowl(f) * 0.8) };
          if (i === 0) ctx.moveTo(p.x, p.y); else ctx.lineTo(p.x, p.y);
        }
        ctx.stroke();
        // LOWER TEETH: they ride the top edge of the dropped jaw, pointing up
        // into the gape so the two rows interleave when it snaps shut. Fewer,
        // cleaner teeth (was 13, oversized and overlapping).
        const lowerTeeth = 9;
        for (let t = 0; t < lowerTeeth; t++) {
          const f = 0.04 + (t / (lowerTeeth - 1)) * 0.94;
          const base = jawPt(f);
          const tg = jawTangent(f);
          const tlen = (8 + Math.sin(f * Math.PI) * 13 + open01 * 4)
            * (ph === 3 && t % 3 === 1 ? 0.45 : 1);   // apex: teeth snapped off
          // direction: from the jaw line up into the gape = (-t.y, t.x) reversed
          this._toothTri(ctx, base.x + tg.y * 2, base.y - tg.x * 2, tg.y, -tg.x, tlen, 3.4, tooth);
        }
      }

      // ---- UPPER TEETH: ONE clean, evenly-spaced row hanging from the upper
      //      lip. The old two staggered rows (28 overlapping triangles) read as
      //      a messy white zigzag; a single row is how a shark's real serrated
      //      bite looks and keeps every tooth individually readable.
      {
        const count = 11;
        for (let t = 0; t < count; t++) {
          const f = 0.03 + (t / (count - 1)) * 0.94;
          const base = lipPt(f);
          const tg = lipTangent(f);
          const tlen = (9 + Math.sin(f * Math.PI) * 16 + open01 * 4)
            * (ph === 3 && t % 3 === 2 ? 0.5 : 1);  // apex: a tooth snapped off
          // direction: from the lip down into the gape = (t.y, -t.x)
          this._toothTri(ctx, base.x - tg.y * 1.4, base.y + tg.x * 1.4, -tg.y, tg.x, tlen, 3.6, tooth);
        }
        // Gum line along the upper jaw, just inside the lip.
        ctx.strokeStyle = gum;
        ctx.lineWidth = 3;
        ctx.beginPath();
        for (let i = 0; i <= 10; i++) {
          const p = lipPt(i / 10);
          const t = lipTangent(i / 10);
          const q = { x: p.x - t.y * 4, y: p.y + t.x * 4 };
          if (i === 0) ctx.moveTo(q.x, q.y); else ctx.lineTo(q.x, q.y);
        }
        ctx.stroke();
      }

      // ---- SALIVA STRANDS: elastic threads of mucus stretching between the
      //      upper and lower jaws while the mouth is working. They are what
      //      sells a mouth as WET meat: thin near-white lines sagging under
      //      their own weight, thinning and snapping as the gape widens. Only
      //      while the jaws are actually apart — a shut mouth has none — and
      //      deterministic (animT-driven), so nothing flickers randomly.
      if (open01 > 0.10 && open01 < 0.72 && !vanished) {
        const strands = [
          { f: 0.22, sag: 5, snap: 0.72 },
          { f: 0.46, sag: 8, snap: 0.64 },
          { f: 0.70, sag: 6, snap: 0.68 }
        ];
        for (let si2 = 0; si2 < strands.length; si2++) {
          const sd = strands[si2];
          // Threads snap from the back of the mouth forward as it opens.
          const gapeNow = open01 + Math.sin(this.animT * 7 + si2 * 2.4) * 0.03;
          if (gapeNow >= sd.snap) continue;
          const life = 1 - gapeNow / sd.snap;          // 1 fresh .. 0 about to snap
          const up = lipPt(sd.f);
          const dn = jawPt(sd.f + 0.03);
          if (!Number.isFinite(up.x) || !Number.isFinite(dn.x)) continue;
          const alpha = (0.28 + life * 0.4) * (ph >= 2 ? 1.15 : 1);
          const slack = sd.sag * life + 1.5;
          ctx.strokeStyle = 'rgba(236, 240, 248, ' + Math.min(0.72, alpha).toFixed(3) + ')';
          ctx.lineWidth = 1.1 + life * 0.9;
          ctx.beginPath();
          ctx.moveTo(up.x, up.y + 3);
          ctx.quadraticCurveTo((up.x + dn.x) / 2, (up.y + dn.y) / 2 + slack, dn.x, dn.y - 3);
          ctx.stroke();
          // A swollen droplet of mucus hanging off the sag's lowest point.
          if (life > 0.35) {
            ctx.fillStyle = 'rgba(240, 244, 252, ' + (life * 0.5).toFixed(3) + ')';
            ctx.beginPath();
            ctx.arc((up.x + dn.x) / 2, (up.y + dn.y) / 2 + slack, 1.4 + life * 1.1, 0, Math.PI * 2);
            ctx.fill();
          }
        }
      }
      // ---- Closed-mouth resting snarl: front teeth always overhang the lip,
      //      the way the sheet's shark never fully closes its mouth. --------
      if (open01 < 0.5) {
        ctx.strokeStyle = outline;
        ctx.lineWidth = 3;
        ctx.beginPath();
        traceSmooth(ctx, [closedY(0.06), closedY(0.4), closedY(0.75), closedY(0.98)]);
        ctx.stroke();
        for (let t = 0; t < 7; t++) {
          const f = 0.18 + t * 0.105;
          const base = lipPt(f);
          const tg = lipTangent(f);
          this._toothTri(ctx, base.x - tg.y * 1.4, base.y + tg.x * 1.4, -tg.y, tg.x,
            8 + Math.sin(f * Math.PI) * 5, 3.4, tooth);
        }
      }
      // Blood drip from the mouth corner: phase 3 is raw meat.
      if (ph === 3) {
        const d = (this.animT * 0.7) % 1;
        const c0 = hinge;
        ctx.strokeStyle = 'rgba(127, 29, 29, 0.75)';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.moveTo(c0.x, c0.y + 2);
        ctx.quadraticCurveTo(c0.x - 4, c0.y + 12 + d * 26, c0.x + 2, c0.y + 24 + d * 30);
        ctx.stroke();
        ctx.fillStyle = '#7f1d1d';
        ctx.beginPath();
        ctx.arc(c0.x + 2, c0.y + 26 + d * 30, 2.4, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    // 10. WATER FX â€” bubbles off the hide, spray when it snaps shut.
    // ======================================================================
    if (!vanished) {
      const bub = (speed > 90 ? 1 : 0) + (spinning ? 1 : 0) + (dashing ? 1 : 0);
      for (let i = 0; i < 9 * bub; i++) {
        const t = (this.animT * (0.5 + (i % 3) * 0.18) + i * 0.41) % 1;
        const u = 0.62 - t * 0.58;
        if (u < 0.02) continue;
        const p = spineAt(u, -0.2 + ((i * 37) % 10) / 10 * 1.1);
        const r = 1.6 + ((i * 53) % 7) * 0.5 + t * 2.4;
        ctx.strokeStyle = 'rgba(224, 242, 254, ' + (0.5 * (1 - t)).toFixed(2) + ')';
        ctx.lineWidth = 1.2;
        ctx.beginPath(); ctx.arc(p.x + t * 8, p.y - t * 14, r, 0, Math.PI * 2); ctx.stroke();
      }
      // Escaping breath when the jaws are wide.
      if ((this.jawOpen || 0) > 0.55) {
        const hinge = spineAt(0.585, 0.12);
        for (let i = 0; i < 3; i++) {
          const t = (this.animT * 1.3 + i * 0.33) % 1;
          ctx.strokeStyle = 'rgba(224, 242, 254, ' + (0.55 * (1 - t)).toFixed(2) + ')';
          ctx.lineWidth = 1.4;
          ctx.beginPath();
          ctx.arc(hinge.x + 60 + t * 40, hinge.y - 10 - t * 26 + i * 5, 2 + t * 4, 0, Math.PI * 2);
          ctx.stroke();
        }
      }
      // Dash spray: white streaks tearing off the flanks.
      if (dashing) {
        ctx.strokeStyle = 'rgba(186, 230, 253, 0.4)';
        ctx.lineWidth = 2.5;
        for (let i = 0; i < 5; i++) {
          const u = 0.2 + i * 0.16;
          const p = spineAt(u, 1.0);
          ctx.beginPath();
          ctx.moveTo(p.x, p.y);
          ctx.quadraticCurveTo(p.x + 30, p.y + 8 + i * 3, p.x + 70 + i * 12, p.y + 2);
          ctx.stroke();
        }
      }
    }

    // ======================================================================
    // 11. PHASE FLARE + HIT FLASH + the always-balanced restore.
    // ======================================================================
    if (this.phaseFlash > 0) {
      const ff = Math.min(1, this.phaseFlash);
      const tint = ph === 3 ? '254, 242, 242' : ph === 2 ? '254, 226, 226' : '224, 242, 254';
      // Layered bloom instead of a gradient: concentric ellipses fading out.
      for (let i = 4; i >= 1; i--) {
        ctx.fillStyle = 'rgba(' + tint + ', ' + (0.10 * ff * i).toFixed(3) + ')';
        ctx.beginPath();
        ctx.ellipse(0, 0, HW * 1.3 * i / 4, HH * 1.85 * i / 4, 0, 0, Math.PI * 2);
        ctx.fill();
      }
      // Shockwave ring snapping outward on the phase step.
      ctx.strokeStyle = 'rgba(' + tint + ', ' + (0.5 * ff).toFixed(2) + ')';
      ctx.lineWidth = 4 * ff + 1;
      ctx.beginPath();
      ctx.arc(0, 0, HW * (1.1 - ff * 0.5) + 30, 0, Math.PI * 2);
      ctx.stroke();
    }
    // (A whole-body "glow" ellipse used to be drawn here. It was a fake bloom
    // one translucent blob wide across the entire animal, which is exactly the
    // "red circle over the shark" this VFX pass removed. Phase 2/3 now read
    // their heat through the rim keyline and the bleeding cracks below, both
    // of which survive with every post-processing effect disabled.)
    // Phase 2+ rim light: a crimson keyline running the whole silhouette, so
    // the frenzy phases read as the same animal lit from inside.
    //
    // PHASE 3 is no longer a flat red outline around the WHOLE body — that
    // read as a sticker, and it is exactly what made the apex phase look like a
    // tint rather than a mood. The heat is now confined to the UPPER silhouette
    // (back, dorsal, head) as a slow ember pulse: the animal is lit from within
    // where the muscle is working, while the pale belly stays cold.
    if (ph >= 2 && !vanished) {
      if (ph === 3) {
        const pulse = 0.5 + 0.5 * Math.sin(this.animT * 3.4);
        ctx.save();
        // Clip to the upper half of the body plus a margin, in world space.
        const midY = y + this.height * 0.42 + (this.bob || 0);
        ctx.beginPath();
        ctx.rect(x - 220 - (this.sway || 0), midY - 260, this.width + 440, 300);
        ctx.clip();
        ctx.strokeStyle = 'rgba(249, 115, 22, ' + (0.16 + 0.16 * pulse + woundGlow * 0.12).toFixed(3) + ')';
        ctx.lineWidth = 3.2;
        this._hullPath(ctx, st);
        ctx.stroke();
        ctx.restore();
      } else {
        ctx.strokeStyle = 'rgba(248, 113, 113, 0.26)';
        ctx.lineWidth = 2.4;
        this._hullPath(ctx, st);
        ctx.stroke();
      }
    }
    ctx.restore();
    // Hit flash: a soft white bloom over the silhouette so it reads as the
    // shark itself lighting up, not a rectangle behind it.
    if (this.hitFlash > 0) {
      ctx.save();
      ctx.globalAlpha = Math.min(0.5, this.hitFlash * 2.6);
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.ellipse(x + this.width * 0.5 + (this.sway || 0),
        y + this.height * 0.5 + (this.bob || 0),
        this.width * 0.54, this.height * 0.6, 0, 0, Math.PI * 2);
      ctx.fill();
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
    // Pooled skill VFX last: pressure rings, collapses, bursts and wakes are
    // foreground water, so they sit over the animal and the stains.
    this._fxDraw(ctx, camera);
  }

// ==========================================================================
  // MODEL UTILITIES — the spine sampler's shared plumbing.
  //
  // `_hullPath` is the single source of truth for the silhouette: the live
  // body draws through it, and every charge ghost redraws through it with the
  // swim phase it had at snapshot time, so an afterimage is the same animal a
  // frame ago instead of a blob. `_spineBend/_bodyHalf/_spineAt` mirror the
  // render-time sampler exactly; render keeps its own closure for speed and
  // these exist so anything OUTSIDE the render frame (ghosts, QA, probes) can
  // ask the same questions about the same model.
  // ==========================================================================
  _hash01(n) {
    const s = Math.sin(n * 127.1) * 43758.5453;
    return s - Math.floor(s);
  }

  _quadAt(p0, p1, p2, f) {
    const u = 1 - f;
    return {
      x: u * u * p0.x + 2 * u * f * p1.x + f * f * p2.x,
      y: u * u * p0.y + 2 * u * f * p1.y + f * f * p2.y
    };
  }

  _mixColor(a, b, t) {
    const k = Math.max(0, Math.min(1, t));
    const pa = this._rgb(a), pb = this._rgb(b);
    const r = Math.round(pa[0] + (pb[0] - pa[0]) * k);
    const g = Math.round(pa[1] + (pb[1] - pa[1]) * k);
    const bl = Math.round(pa[2] + (pb[2] - pa[2]) * k);
    return 'rgb(' + r + ',' + g + ',' + bl + ')';
  }

  _rgb(hex) {
    const h = hex.replace('#', '');
    return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
  }

  _traceSmooth(c, pts) {
    c.moveTo(pts[0].x, pts[0].y);
    for (let i = 1; i < pts.length - 1; i++) {
      const mx = (pts[i].x + pts[i + 1].x) * 0.5;
      const my = (pts[i].y + pts[i + 1].y) * 0.5;
      c.quadraticCurveTo(pts[i].x, pts[i].y, mx, my);
    }
    const last = pts[pts.length - 1];
    c.lineTo(last.x, last.y);
  }

  /** One triangular tooth sitting on a jaw line. (x,y) is the base centre,
   *  (nx,ny) the unit direction the point aims INTO the gape. */
  _toothTri(c, x, y, nx, ny, len, halfW, fill) {
    const px = -ny, py = nx;                     // perpendicular of the aim
    // A CLEAN, crisp triangle. The old random per-tooth `jag` plus a heavy
    // outline on ~50 overlapping teeth read as a messy white zigzag; this is a
    // smooth sliver with only a soft rim, so each tooth stays individually
    // readable against the dark mouth without scribbling over its neighbours.
    const tipX = x + nx * len, tipY = y + ny * len;
    c.beginPath();
    c.moveTo(x + px * halfW, y + py * halfW);
    c.quadraticCurveTo(x + nx * len * 0.16, y + ny * len * 0.16, tipX, tipY);
    c.quadraticCurveTo(x + nx * len * 0.16, y + ny * len * 0.16, x - px * halfW, y - py * halfW);
    c.closePath();
    c.fillStyle = fill;
    c.fill();
    c.strokeStyle = 'rgba(10, 16, 28, 0.34)';    // thin, soft rim — not a scribble
    c.lineWidth = 1;
    c.stroke();
    c.strokeStyle = 'rgba(96, 34, 44, 0.30)';    // gum-side shade: teeth sit IN the jaw
    c.lineWidth = 1.6;
    c.beginPath();
    c.moveTo(x + px * halfW * 0.9, y + py * halfW * 0.9);
    c.lineTo(x - px * halfW * 0.9, y - py * halfW * 0.9);
    c.stroke();
  }

  /** The rig state the render integrates, snapshot for the trail ghosts. */
  _spineState() {
    const swing = this.tailSwing || 0;
    const dashing = !!this.dash;
    const spinning = this.tornadoT > 0;
    const waveAmp = 0.10 + Math.min(0.16, Math.abs(swing) * 0.006)
      + (dashing ? -0.05 : 0) + (spinning ? 0.22 : 0);
    return {
      waveAmp,
      wavePhase: (this.swimPhase || 0) * 0.85,
      tailBend: this.tailBend || 0,
      pitch: this.pitch || 0
    };
  }

  _spineBendAt(u, st) {
    const tailGain = Math.pow(1 - u, 1.7);
    return Math.sin(st.wavePhase - u * 2.7) * st.waveAmp * tailGain
      + st.tailBend * tailGain * 1.6
      + st.pitch * (1 - u) * 4
      + Math.sin(st.wavePhase * 1.7 - u * 4.2) * st.waveAmp * 0.22 * tailGain;
  }

  _bodyHalfAt(u) {
    const HH = this.height * 0.5;
    // MUST mirror the render's bodyHalf: peak girth just behind the head,
    // a long even snout taper, thin caudal stalk.
    const g = u < 0.60
      ? (0.56 + 0.44 * Math.sin((u / 0.60) * Math.PI * 0.5))
      : (1.0 - 0.16 * ((u - 0.60) / 0.40));
    const prof = 0.09 + 0.94 * Math.pow(g, 0.55);
    const noseTaper = u > 0.80
      ? Math.max(0.30, Math.sqrt(1 - Math.pow((u - 0.80) / 0.20, 1.35)))
      : 1;
    const peduncle = u < 0.15 ? Math.max(0.34, u / 0.15) : 1;
    return HH * prof * noseTaper * peduncle;
  }

  _spineAt(u, off, st) {
    const HW = this.width * 0.5;
    const sx = -HW + u * this.width;
    const bend = this._spineBendAt(u, st);
    const half = this._bodyHalfAt(u);
    const reach = off < 0 ? off * half : off * half * 0.82;
    return { x: sx, y: bend * (1 - u) * 5 + reach, half };
  }

  /** The full silhouette loop in the body's local frame (nose right). */
  _hullPath(c, st) {
    const STEPS = 34;
    const loop = [this._spineAt(1.0, -0.55, st)];
    for (let i = 0; i <= STEPS; i++) loop.push(this._spineAt(1 - i / STEPS, -1.0, st));
    loop.push(this._spineAt(0.0, -0.12, st));
    // BELLY must run tail→nose (i/STEPS), the reverse of the back ridge above.
    // It used to reuse `1 - i/STEPS` (nose→tail), so after the tail tip the path
    // teleported to the nose-bottom and slashed back across the whole body —
    // three long self-intersecting diagonals that broke the silhouette into a
    // disconnected top/bottom. Running it the correct way closes one clean loop.
    for (let i = 0; i <= STEPS; i++) loop.push(this._spineAt(i / STEPS, 1.0, st));
    loop.push(this._spineAt(1.0, 0.5, st));
    c.beginPath();
    this._traceSmooth(c, loop);
    c.closePath();
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

// The Tide Gate's crossing FX (AbyssalGateFX, above). Exported the same way
// as the rest of ocean.js so Game.openWormhole in terraria.js can reach it,
// and so the Node QA harnesses can see it too.
window.AbyssalGateFX = AbyssalGateFX;