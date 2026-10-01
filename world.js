// World, Tiles, Forest Background, Day/Night Cycle, and Dynamic Lighting
const TILE_SIZE = 24;
const HOUSE_WALL = 23;
// PERF: the static-tile render cache is aligned to this many tiles. The camera
// can travel a whole chunk before the cached window has to be repainted.
const TILE_CACHE_CHUNK = 8;
// Half-width, in tiles, of the levelled building plot in the plains.
const PLAINS_PLOT_HALF = 28;

// Tile types enum
const TILES = {
  AIR: 0,
  DIRT: 1,
  GRASS: 2,
  STONE: 3,
  WOOD: 4,
  LEAVES: 5,
  WOOD_PLATFORM: 6,
  IRON_ORE: 7,
  GOLD_ORE: 8,
  TORCH: 9,
  CAMPFIRE: 10,
  CHEST: 11,
  BED: 12,
  CRYSTAL: 13,
  SNOW: 14,
  SAND: 15,
  MUD: 16,
  STONE_BRICK: 17,
  GLASS: 18,
  SNOW_PINE_LEAVES: 19,
  ACACIA_LEAVES: 20,
  MANGROVE_LEAVES: 21,
  CHEST_OPEN: 22,
  WOOD_STAIRS: 24,
  DIAMOND_ORE: 25,
  LAVA: 26,
  WATER: 27,
  MOSSY_STONE: 28,
  FROSTBRICK: 29,
  SANDSTONE: 30,
  CACTUS: 31,
  LILY: 32,
  FLOWER: 33,
  TALL_GRASS: 34,
  SNOWBUSH: 35,
  ICICLE: 36,
  ALTAR: 37,
  RAINBOW_ORE: 38,
  CURSED_BRICK: 39,
  DUNGEON_GATE: 40,
  // ---- Building set: ten blocks whose only job is to be built with ----------
  // Ids 41-57 are claimed by underworld.js and space.js, which load after this
  // file, so the building set starts at 58 and runs consecutively.
  PLANKS: 58,
  COBBLESTONE: 59,
  BRICK_BLOCK: 60,
  POLISHED_STONE: 61,
  SANDSTONE_BRICK: 62,
  HAY_BLOCK: 63,
  WOOL_BLOCK: 64,
  ICE_BLOCK: 65,
  BOOKSHELF: 66,
  LANTERN: 67,
};

const TILE_PROPERTIES = {
  [TILES.AIR]: { solid: false, light: 0, drops: null },
  [TILES.DIRT]: { solid: true, light: 0, color: '#593a1e', name: 'Dirt Block', drops: { id: 'dirt', count: 1 } },
  [TILES.GRASS]: { solid: true, light: 0, color: '#38b764', name: 'Grass Block', drops: { id: 'dirt', count: 1 } },
  [TILES.STONE]: { solid: true, light: 0, color: '#737373', name: 'Stone Block', drops: { id: 'stone', count: 1 } },
  [TILES.WOOD]: { solid: true, light: 0, color: '#854d0e', name: 'Wood Block', drops: { id: 'wood', count: 1 } },
  [TILES.LEAVES]: { solid: false, light: 0, color: '#15803d', name: 'Forest Leaves', drops: { id: 'acorn', count: 1 } },
  [TILES.WOOD_PLATFORM]: { solid: true, isPlatform: true, light: 0, color: '#b45309', name: 'Wood Platform', drops: { id: 'wood_platform', count: 1 } },
  [TILES.IRON_ORE]: { solid: true, light: 0, color: '#94a3b8', name: 'Iron Ore', drops: { id: 'iron_ore', count: 1 } },
  [TILES.GOLD_ORE]: { solid: true, light: 1, color: '#fbbf24', name: 'Gold Ore', drops: { id: 'gold_ore', count: 1 } },
  [TILES.DIAMOND_ORE]: { solid: true, light: 4, color: '#22d3ee', name: 'Diamond Ore', drops: { id: 'diamond', count: 1 } },
  [TILES.LAVA]: { solid: false, light: 10, color: '#f97316', name: 'Lava', drops: null },
  [TILES.TORCH]: { solid: false, light: 12, color: '#f59e0b', name: 'Torch', drops: { id: 'torch', count: 1 } },
  [TILES.CAMPFIRE]: { solid: false, light: 14, color: '#ef4444', name: 'Campfire', drops: { id: 'wood', count: 5 } },
  [TILES.CHEST]: { solid: true, light: 0, color: '#d97706', name: 'Forest Chest', drops: { id: 'chest', count: 1 } },
  [TILES.BED]: { solid: false, light: 0, color: '#60a5fa', name: 'Forest Bed', drops: { id: 'bed', count: 1 } },
  [TILES.CRYSTAL]: { solid: true, light: 6, color: '#67e8f9', name: 'Cave Crystal', drops: { id: 'crystal', count: 1 } }
  , [TILES.SNOW]: { solid: true, light: 0, color: '#e0f2fe', name: 'Snow Block', drops: { id: 'snow_block', count: 1 } }
  , [TILES.SAND]: { solid: true, light: 0, color: '#facc15', name: 'Sand Block', drops: { id: 'sand_block', count: 1 } }
  , [TILES.MUD]: { solid: true, light: 0, color: '#365314', name: 'Swamp Mud', drops: { id: 'mud_block', count: 1 } }
  , [TILES.STONE_BRICK]: { solid: true, light: 0, color: '#64748b', name: 'Stone Brick', drops: { id: 'stone_brick', count: 1 } }
  , [TILES.GLASS]: { solid: false, light: 0, color: '#bae6fd', name: 'Glass Block', drops: { id: 'glass_block', count: 1 } }
  , [TILES.SNOW_PINE_LEAVES]: { solid: false, light: 0, color: '#dbeafe', name: 'Snow Pine Needles', drops: { id: 'acorn', count: 1 } }
  , [TILES.ACACIA_LEAVES]: { solid: false, light: 0, color: '#84cc16', name: 'Acacia Leaves', drops: { id: 'acorn', count: 1 } }
  , [TILES.MANGROVE_LEAVES]: { solid: false, light: 0, color: '#0f766e', name: 'Mangrove Leaves', drops: { id: 'acorn', count: 1 } }
  , [TILES.CHEST_OPEN]: { solid: false, light: 0, color: '#d97706', name: 'Opened Chest', drops: { id: 'chest', count: 1 } }
  , [TILES.WOOD_STAIRS]: { solid: true, light: 0, color: '#b45309', name: 'Wood Stairs', drops: { id: 'wood', count: 1 } }
  , [TILES.WATER]: { solid: false, light: 1, color: '#38bdf8', name: 'Water', drops: null }
  // ---- Rich biome tile variants (drops reuse existing item ids so saves stay valid) ----
  , [TILES.MOSSY_STONE]: { solid: true, light: 0, color: '#3f6212', name: 'Mossy Stone', drops: { id: 'stone', count: 1 } }
  , [TILES.FROSTBRICK]: { solid: true, light: 0, color: '#a5c4fc', name: 'Frostbrick', drops: { id: 'stone', count: 1 } }
  , [TILES.SANDSTONE]: { solid: true, light: 0, color: '#d97706', name: 'Sandstone', drops: { id: 'sand_block', count: 1 } }
  , [TILES.CACTUS]: { solid: false, light: 0, color: '#4d7c0f', name: 'Prickly Cactus', drops: { id: 'wood', count: 1 } }
  , [TILES.LILY]: { solid: false, light: 1, color: '#6ee7b7', name: 'Glow Lily', drops: { id: 'acorn', count: 1 } }
  , [TILES.FLOWER]: { solid: false, light: 0, color: '#f472b6', name: 'Wildflower', drops: { id: 'acorn', count: 1 } }
  , [TILES.TALL_GRASS]: { solid: false, light: 0, color: '#4ade80', name: 'Tall Grass', drops: { id: 'acorn', count: 1 } }
  , [TILES.SNOWBUSH]: { solid: false, light: 0, color: '#e0f2fe', name: 'Frost Shrub', drops: { id: 'acorn', count: 1 } }
  , [TILES.ICICLE]: { solid: false, light: 1, color: '#bae6fd', name: 'Icicle', drops: { id: 'snow_block', count: 1 } }
  , [TILES.ALTAR]: { solid: true, light: 6, color: '#8b95a8', name: 'Knight Statue', drops: null }
  , [TILES.RAINBOW_ORE]: { solid: true, light: 4, color: '#ff7ae0', name: 'Rainbow Ore', drops: { id: 'rainbow_ore', count: 1 } }
  , [TILES.CURSED_BRICK]: { solid: true, light: 2, color: '#312e46', name: 'Cursed Brick', drops: { id: 'stone_brick', count: 1 } }
  , [TILES.DUNGEON_GATE]: { solid: true, light: 3, color: '#1e1b4b', name: 'Sealed Dungeon Gate', drops: null }
  // ---- Building set --------------------------------------------------------
  , [TILES.PLANKS]: { solid: true, light: 0, color: '#b45309', name: 'Oak Planks', drops: { id: 'planks', count: 1 } }
  , [TILES.COBBLESTONE]: { solid: true, light: 0, color: '#78716c', name: 'Cobblestone', drops: { id: 'cobblestone', count: 1 } }
  , [TILES.BRICK_BLOCK]: { solid: true, light: 0, color: '#9f3a2f', name: 'Brick Block', drops: { id: 'brick_block', count: 1 } }
  , [TILES.POLISHED_STONE]: { solid: true, light: 0, color: '#a8b0bb', name: 'Polished Stone', drops: { id: 'polished_stone', count: 1 } }
  , [TILES.SANDSTONE_BRICK]: { solid: true, light: 0, color: '#e0bf7a', name: 'Sandstone Brick', drops: { id: 'sandstone_brick', count: 1 } }
  , [TILES.HAY_BLOCK]: { solid: true, light: 0, color: '#d4a017', name: 'Hay Bale', drops: { id: 'hay_block', count: 1 } }
  , [TILES.WOOL_BLOCK]: { solid: true, light: 0, color: '#f5f5f4', name: 'Wool Block', drops: { id: 'wool_block', count: 1 } }
  , [TILES.ICE_BLOCK]: { solid: true, light: 1, color: '#a5e8f5', name: 'Ice Block', drops: { id: 'ice_block', count: 1 } }
  , [TILES.BOOKSHELF]: { solid: true, light: 0, color: '#7c4a1e', name: 'Bookshelf', drops: { id: 'bookshelf', count: 1 } }
  , [TILES.LANTERN]: { solid: false, light: 13, color: '#fbbf24', name: 'Lantern', drops: { id: 'lantern', count: 1 } }
};

// The world is laid out as equal west→east bands, one per entry, in this order.
// EVERYTHING biome-shaped reads this list: getBiomeAtX, the border blends, the
// sky palettes, weather and the spawn tables. Insert a name and the whole world
// re-divides evenly; there are no hard-coded quarter fractions left to update.
const BIOME_ORDER = ['snow', 'forest', 'plains', 'savanna', 'swamp'];

class World {
  constructor(width = 300, height = 140) {
    this.width = width;
    this.height = height;
    this.pixelWidth = width * TILE_SIZE;
    this.pixelHeight = height * TILE_SIZE;
    this.tiles = new Uint8Array(width * height);
    this.walls = new Uint8Array(width * height); // background walls
    this.lightGrid = new Uint8Array(width * height);

    // Day / Night cycle (1 full in-game day = 420 seconds = 7 minutes)
    // 0 = 06:00 AM (Sunrise)
    // 0.25 = 12:00 PM (Noon)
    // 0.5 = 06:00 PM (Dusk)
    // 0.6 = 07:30 PM (Night begins)
    // 0.75 = 12:00 AM (Midnight, boss hour)
    // 1.0 = 06:00 AM (New day)
    this.timeOfDay = 0.15; // starts in morning
    this.dayCount = 1;
    this.dayDuration = 420; // 7 minutes full cycle
    this.surfaceHeights = new Int16Array(width);

    // Dynamic light sources list: {x, y, radius, color, intensity}
    this.lightSources = [];
    this.landmarks = [];
    this.dungeon = null; // secret dungeon descriptor (see generateSecretDungeon)
    this.rainbowSeeded = false; // once rare rainbow ore veins exist in this world

    // Baked radial-gradient sprites for the lighting and bloom passes. Building
    // a gradient per light per frame dominated the draw cost; these caches let
    // every light become a single drawImage instead.
    this._lightSpriteCache = new Map();
    this._glowSpriteCache = new Map();

    this.generateTerrain();
    this.generateSecretDungeon();
    this.seedRainbowOre(68);
  }

  getTile(x, y) {
    if (x < 0 || x >= this.width || y < 0 || y >= this.height) return TILES.STONE;
    return this.tiles[y * this.width + x];
  }

  setTile(x, y, tile) {
    if (x < 0 || x >= this.width || y < 0 || y >= this.height) return;
    this.tiles[y * this.width + x] = tile;
    this._tileCacheDirty = true; // static tile cache must rebuild
  }

  isSolid(x, y, isFallingThrough = false) {
    const tile = this.getTile(x, y);
    if (!tile) return false;
    const prop = TILE_PROPERTIES[tile];
    if (!prop || !prop.solid) return false;
    if (prop.isPlatform && isFallingThrough) return false;
    return true;
  }

  isPlatform(x, y) {
    const tile = this.getTile(x, y);
    return tile === TILES.WOOD_PLATFORM;
  }

  // Biome id at a tile column. Fractional blending near borders is handled
  // by biomeMix() below; hard borders remain for gameplay (trees, weather).
  //
  // The world is a single west→east strip of equal bands, so the biome table
  // itself is the only place the layout is described. Adding a biome means
  // adding it to BIOME_ORDER; every border, blend and palette lookup below
  // derives from that list rather than from four hard-coded fractions.
  getBiomeAtX(tileX) {
    const x = Math.max(0, Math.min(this.width - 1, Math.floor(tileX)));
    const band = Math.min(BIOME_ORDER.length - 1,
      Math.floor((x / this.width) * BIOME_ORDER.length));
    return BIOME_ORDER[band];
  }

  // Equal-band border positions, west→east. For 5 biomes on a 440-tile world:
  // 88, 176, 264, 352.
  biomeBorders() {
    const n = BIOME_ORDER.length;
    const borders = [];
    for (let i = 1; i < n; i++) borders.push(this.width * (i / n));
    return borders;
  }

  // 0..1 blend weights for the two biomes meeting at the nearest border.
  // Used for terrain height + surface tiles so biomes melt into each other.
  biomeMix(tileX) {
    const borders = this.biomeBorders();
    const names = BIOME_ORDER;
    let nearest = 0;
    let nearestDist = Infinity;
    for (let i = 0; i < borders.length; i++) {
      const d = Math.abs(tileX - borders[i]);
      if (d < nearestDist) { nearestDist = d; nearest = i; }
    }
    const W = 14; // blend half-width in tiles
    if (nearestDist >= W) {
      return { a: names[nearest + (tileX < borders[nearest] ? 0 : 1)], b: null, t: 0 };
    }
    const t = (tileX - (borders[nearest] - W)) / (W * 2);
    return { a: names[nearest], b: names[nearest + 1], t: Math.max(0, Math.min(1, t)) };
  }

  // Per-biome surface relief: dunes roll, swamp sags into pools, snow is craggy,
  // plains are deliberately almost level — the flat one you can build on.
  biomeRelief(biome, x) {
    switch (biome) {
      case 'snow': return Math.sin(x * 0.11) * 4 + Math.sin(x * 0.31) * 1.5;
      case 'forest': return Math.sin(x * 0.06) * 6 + Math.sin(x * 0.21) * 1.5;
      case 'plains': return Math.sin(x * 0.022 + 0.7) * 1.8 + Math.sin(x * 0.08) * 0.5;
      case 'savanna': return Math.sin(x * 0.045 + 1.3) * 4 + Math.sin(x * 0.13) * 1.2;
      case 'swamp': return Math.sin(x * 0.05 + 2.6) * 3 - 2 + Math.sin(x * 0.4) * 0.8;
      default: return 0;
    }
  }

  // How much of the fractal base terrain a biome keeps. The base wave is worth
  // ±10 tiles on its own, which is a hillside; plains damp it to a fifth so the
  // band reads as open level ground instead of downs. Blended across borders by
  // generateTerrain, so a plains edge still melts into the neighbouring hills.
  biomeReliefScale(biome) {
    return biome === 'plains' ? 0.2 : 1;
  }

  generateTerrain() {
    // Fractal base relief + per-biome relief blended across borders,
    // so each biome rolls differently but melts into its neighbor.
    const baseSurface = 50;

    // Generate surface profile
    for (let x = 0; x < this.width; x++) {
      const mix = this.biomeMix(x);
      const biome = mix.b ? (mix.t < 0.5 ? mix.a : mix.b) : mix.a;
      const base = Math.sin(x * 0.03) * 12 + Math.sin(x * 0.08) * 5 + Math.sin(x * 0.18) * 2;
      const reliefA = this.biomeRelief(mix.a, x);
      const reliefB = mix.b ? this.biomeRelief(mix.b, x) : reliefA;
      const relief = reliefA + ((reliefB - reliefA) * (mix.b ? mix.t : 0));
      // Same blend for how much of the base hills a biome keeps, so the plains
      // flattening ramps in over the border instead of snapping to level.
      const scaleA = this.biomeReliefScale(mix.a);
      const scaleB = mix.b ? this.biomeReliefScale(mix.b) : scaleA;
      const reliefScale = scaleA + ((scaleB - scaleA) * (mix.b ? mix.t : 0));
      // Swamp sags a touch lower to make room for pools.
      const sag = biome === 'swamp' ? 2.5 : 0;
      const surfaceY = Math.floor(baseSurface + base * 0.55 * reliefScale + relief + sag);
      this.surfaceHeights[x] = surfaceY;
      const surfaceTile = biome === 'snow' ? TILES.SNOW : biome === 'savanna' ? TILES.SAND : biome === 'swamp' ? TILES.MUD : TILES.GRASS;
      const dirtTile = biome === 'snow' ? TILES.SNOW : biome === 'savanna' ? TILES.SANDSTONE : biome === 'swamp' ? TILES.MUD : TILES.DIRT;

      // Fill vertical slice
      for (let y = 0; y < this.height; y++) {
        const idx = y * this.width + x;
        if (y < surfaceY) {
          this.tiles[idx] = TILES.AIR;
        } else if (y === surfaceY) {
          this.tiles[idx] = surfaceTile;
          this.walls[idx] = TILES.DIRT;
        } else if (y < surfaceY + 6) {
          // Sprinkle biome stone accents through the dirt band.
          if (biome === 'forest' && Math.random() < 0.06) this.tiles[idx] = TILES.MOSSY_STONE;
          else if (biome === 'snow' && Math.random() < 0.09) this.tiles[idx] = TILES.FROSTBRICK;
          else if (biome === 'savanna' && Math.random() < 0.10) this.tiles[idx] = TILES.SANDSTONE;
          else this.tiles[idx] = dirtTile;
          this.walls[idx] = biome === 'swamp' ? TILES.MUD : biome === 'savanna' ? TILES.SAND : TILES.DIRT;
        } else {
          // Stone layer with ores and caves
          // Cave noise
          const caveNoise = Math.sin(x * 0.15) * Math.cos(y * 0.15) + Math.sin(x * 0.05 + y * 0.05);
          if (caveNoise > 0.78 && y > surfaceY + 10) {
            this.tiles[idx] = TILES.AIR;
          } else {
            // Ore generation (savanna hides extra gold, snow hides crystal pockets)
            const oreRoll = Math.random();
            if (oreRoll < 0.035) {
              this.tiles[idx] = TILES.IRON_ORE;
            } else if (oreRoll < 0.05 && y > surfaceY + 15) {
              this.tiles[idx] = TILES.GOLD_ORE;
            } else if (biome === 'snow' && oreRoll < 0.058 && y > surfaceY + 12) {
              this.tiles[idx] = TILES.CRYSTAL;
            } else if (biome === 'savanna' && oreRoll < 0.062 && y > surfaceY + 8) {
              this.tiles[idx] = TILES.GOLD_ORE;
            } else if (biome === 'swamp' && oreRoll < 0.06) {
              this.tiles[idx] = TILES.CRYSTAL;
            } else {
              this.tiles[idx] = TILES.STONE;
            }
          }
          this.walls[idx] = TILES.STONE;
        }
      }
    }

    // Swamp water pools: carve shallow basins on flat stretches and fill with water.
    for (let x = 6; x < this.width - 6; x++) {
      if (this.getBiomeAtX(x) !== 'swamp') continue;
      const sy = this.surfaceHeights[x];
      const flat = Math.abs(this.surfaceHeights[x - 2] - sy) <= 1 && Math.abs(this.surfaceHeights[x + 2] - sy) <= 1;
      if (flat && Math.random() < 0.35) {
        this.setTile(x, sy, TILES.WATER);
        this.setTile(x, sy + 1, TILES.MUD);
        if (Math.random() < 0.4) this.setTile(x, sy - 1, TILES.LILY);
      }
    }

    this.decorateSurface();

    // The plains' building plot is levelled and cleared *after* the surface has
    // been dressed and *before* anything grows or is built on it, so nothing has
    // to be validated away afterwards: no flowers to uproot, no trees to fell.
    this.carvePlainsBuildPlot();

    // Grow lush Forest Trees!
    for (let x = 10; x < this.width - 10; x += Math.floor(Math.random() * 5 + 4)) {
      const groundY = this.surfaceHeights[x];
      const biome = this.getBiomeAtX(x);
      if (this.getTile(x, groundY) !== TILES.AIR) {
        // 4 tiles of margin: a canopy is wider than a trunk, and the plot is
        // meant to be open sky, not a cave of leaves.
        if (this.isInPlainsBuildPlot(x, 4)) continue;
        if (biome === 'forest') this.growTree(x, groundY - 1);
        if (biome === 'plains' && Math.random() < 0.30) this.growTree(x, groundY - 1);
        if (biome === 'snow') this.growSnowPine(x, groundY - 1);
        if (biome === 'savanna') this.growAcacia(x, groundY - 1);
        if (biome === 'swamp') this.growMangrove(x, groundY - 1);
      }
    }

    // Place starting campfire and torches at spawn point (center)
    const spawnX = Math.floor(this.width / 2);
    const spawnY = this.surfaceHeights[spawnX] - 1;
    this.setTile(spawnX, spawnY, TILES.CAMPFIRE);
    this.setTile(spawnX - 4, spawnY, TILES.TORCH);
    this.setTile(spawnX + 4, spawnY, TILES.TORCH);

    // Build a compact starter camp with a clear doorway and a safe respawn point.
    this.buildHouseShell(spawnX, spawnY, 6, 6, TILES.WOOD, TILES.WOOD_STAIRS);
    this.setTile(spawnX - 3, spawnY, TILES.CHEST);
    this.setTile(spawnX + 2, spawnY, TILES.BED);
    this.landmarks.push({ x: spawnX, y: spawnY - 6, type: 'spawn_camp' });

    this.generateLandmarks();
    this.generateSurfaceStructures();
    this.generateUndergroundFeatures();
  }

  // ---- The plains build plot -----------------------------------------------
  // Every biome in this world is a place you travel *through*; the plains are the
  // place you settle. So the plains band ships with a surveyed, level clearing
  // roughly 57 tiles across, centred on the spawn point (which sits squarely in
  // the plains band now that the world is five equal slices): one flat row of
  // grass, no trees, no shrubs, open sky, and a torch at each corner so it can be
  // worked after dark. Nothing here is required — it is just a place where the
  // ground is already right for whatever the player wants to build.
  // `margin` widens the test by that many tiles: used by the tree pass, because a
  // trunk outside the plot still drops a canopy several tiles into it.
  isInPlainsBuildPlot(tileX, margin = 0) {
    const plot = this.plainsPlot;
    return !!plot && tileX >= plot.x0 - margin && tileX <= plot.x1 + margin;
  }

  carvePlainsBuildPlot() {
    const half = PLAINS_PLOT_HALF;
    const centre = Math.floor(this.width / 2);
    const x0 = Math.max(2, centre - half);
    const x1 = Math.min(this.width - 3, centre + half);

    // Level to the *median* height of the stretch. Cutting to the lowest point
    // would leave a quarry wall at the edges and filling to the highest would
    // bury the neighbours, so the middle figure is both the smallest amount of
    // earth moved and the one that disappears into the surrounding ground.
    const heights = [];
    for (let x = x0; x <= x1; x++) heights.push(this.surfaceHeights[x]);
    heights.sort((a, b) => a - b);
    const level = heights[Math.floor(heights.length / 2)];
    this.plainsPlot = { x0, x1, level, centre };

    for (let x = x0; x <= x1; x++) {
      const old = this.surfaceHeights[x];
      // Clear the column above the new ground line. Anything the surface pass
      // dressed the grass with (flowers, tufts) lives in these rows.
      for (let y = Math.min(old, level) - 12; y < level; y++) {
        this.setTile(x, y, TILES.AIR);
      }
      // Ground: living grass on top, plain soil beneath — the same profile the
      // plains generate with, just at the levelled height. Six rows of soil is
      // exactly the dirt band generateTerrain lays down, so the pad matches the
      // untouched ground beside it and no stone shows through.
      this.setTile(x, level, TILES.GRASS);
      this.walls[level * this.width + x] = TILES.DIRT;
      const floor = Math.max(old, level) + 6;
      for (let y = level + 1; y <= floor; y++) {
        this.setTile(x, y, TILES.DIRT);
        this.walls[y * this.width + x] = TILES.DIRT;
      }
      this.surfaceHeights[x] = level;
    }

    // Corner torches: light for a night build, and four points that make the
    // clearing read as somewhere chosen rather than as a bald patch.
    for (const cx of [x0 + 1, x1 - 1]) {
      this.setTile(cx, level - 1, TILES.TORCH);
      this.walls[(level - 1) * this.width + cx] = TILES.AIR;
    }
    this.landmarks.push({ x: centre, y: level - 4, type: 'plains_plot' });
  }

  // ============================================================
  // SECRET DUNGEON — a buried knight's chapel ~70 tiles east of spawn.
  // A stone arch with beacon torches marks it on the surface, so it is
  // hidden but never hard to find. A brick-lined shaft drops to a walled
  // chamber with chests, torches and the Cursed Knight's statue pedestal.
  // ============================================================
  generateSecretDungeon() {
    // Far beyond the peaceful forest/savanna, deep in the drowned swamp where
    // crooked trees and fog make the old oath-seal feel naturally sinister.
    let dx = Math.floor(this.width * 0.86);
    dx = Math.max(30, Math.min(this.width - 30, dx));
    const surf = this.surfaceHeights[dx];
    const y0 = surf + 16;                      // chamber ceiling
    const y1 = y0 + 7;                         // chamber floor row
    const x0 = dx - 7, x1 = dx + 7;

    // 1. Clear any trees standing where the doorway will go.
    for (let x = dx - 1; x <= dx + 1; x++) {
      for (let y = surf - 8; y < surf; y++) {
        const t = this.getTile(x, y);
        if (t === TILES.WOOD || t === TILES.LEAVES || t === TILES.ACACIA_LEAVES ||
            t === TILES.SNOW_PINE_LEAVES || t === TILES.MANGROVE_LEAVES) {
          this.setTile(x, y, TILES.AIR);
        }
      }
    }

    // 2. Chamber: stone-brick shell, dark built walls, air inside.
    for (let x = x0; x <= x1; x++) {
      for (let y = y0; y <= y1; y++) {
        const border = x === x0 || x === x1 || y === y0 || y === y1;
        this.setTile(x, y, border ? TILES.STONE_BRICK : TILES.AIR);
        this.walls[y * this.width + x] = border ? TILES.STONE_BRICK : HOUSE_WALL;
      }
    }
    // Columns for atmosphere (the middle stays open for the fight).
    for (const col of [x0 + 3, x1 - 3]) {
      for (let y = y0 + 1; y < y1; y++) this.setTile(col, y, TILES.STONE_BRICK);
    }
    // Ceiling torches (the outer two sit atop the columns).
    for (const tx of [x0 + 1, dx - 4, dx + 4, x1 - 1]) this.setTile(tx, y0 + 1, TILES.TORCH);
    // Loot chests + the knight statue pedestal at the centre of the floor.
    this.setTile(x0 + 2, y1 - 1, TILES.CHEST);
    this.setTile(x1 - 2, y1 - 1, TILES.CHEST);
    this.setTile(dx, y1 - 1, TILES.ALTAR);
    this.setTile(dx, y1 - 2, TILES.AIR);

    // 3. Shaft to the surface: brick-lined, wall-jumpable, staggered platforms.
    for (let y = surf + 1; y < y0; y++) {
      for (const x of [dx - 1, dx, dx + 1]) {
        this.setTile(x, y, TILES.AIR);
        this.walls[y * this.width + x] = HOUSE_WALL;
      }
      this.setTile(dx - 2, y, TILES.STONE_BRICK);
      this.setTile(dx + 2, y, TILES.STONE_BRICK);
    }
    // Breach the chamber ceiling so the shaft connects.
    for (const x of [dx - 1, dx, dx + 1]) {
      this.setTile(x, y0, TILES.AIR);
      this.walls[y0 * this.width + x] = HOUSE_WALL;
    }
    // Staggered platforms make climbing back out trivial (wall jumps too).
    let step = 0;
    for (let y = y0 + 2; y < surf - 2; y += 3, step++) {
      this.setTile(step % 2 === 0 ? dx - 1 : dx + 1, y, TILES.WOOD_PLATFORM);
    }

    // 4. Visible landmark: stone doorstep, arch pillars and beacon torches.
    for (let x = dx - 2; x <= dx + 2; x++) this.setTile(x, surf, TILES.STONE_BRICK);
    for (let x = dx - 1; x <= dx + 1; x++) {
      this.setTile(x, surf, TILES.AIR);
      for (let y = surf - 4; y < surf; y++) {
        const t = this.getTile(x, y);
        if (t === TILES.WOOD || t === TILES.LEAVES) this.setTile(x, y, TILES.AIR);
      }
    }
    for (const x of [dx - 2, dx + 2]) {
      this.setTile(x, surf - 1, TILES.CURSED_BRICK);
      this.setTile(x, surf - 2, TILES.CURSED_BRICK);
      this.setTile(x, surf - 3, TILES.TORCH);
    }
    // The oath-seal remains until the chapel's gatekeeper is defeated.
    this.setTile(dx, surf - 1, TILES.DUNGEON_GATE);

    this.dungeon = {
      x: dx,
      entranceY: surf,
      altarX: dx,
      altarY: y1 - 1,
      roomTop: y0,
      roomFloor: y1,
      found: false
    };
    this.dungeon.layoutVersion = 2;
    this.landmarks.push({ x: dx, y: surf - 5, type: 'dungeon' });
  }

  // Remove the original forest-side chapel from legacy saves, then rebuild the
  // ominous swamp entrance. This keeps old worlds compatible without leaving
  // two competing dungeons behind.
  migrateDungeon(oldDungeon) {
    if (oldDungeon && Number.isFinite(oldDungeon.x)) {
      const ox = oldDungeon.x;
      const surf = this.surfaceHeights[ox];
      // Clear the complete old chapel + stair footprint down to its old room.
      const oldRoomTop = Number.isFinite(oldDungeon.roomTop) ? oldDungeon.roomTop : surf + 16;
      const oldRoomFloor = Number.isFinite(oldDungeon.roomFloor) ? oldDungeon.roomFloor : oldRoomTop + 7;
      for (let y = surf - 5; y <= oldRoomFloor; y++) {
        for (let x = ox - 8; x <= ox + 8; x++) {
          if (x < 0 || x >= this.width || y < 0 || y >= this.height) continue;
          // Restore the exact natural biome column, not generic dirt/stone.
          // This prevents an old dungeon cleanup from leaving rectangular
          // savanna/snow/swamp slabs in the neighbouring biome.
          const mix = this.biomeMix(x);
          const biome = mix.b ? (mix.t < 0.5 ? mix.a : mix.b) : mix.a;
          const surfaceTile = biome === 'snow' ? TILES.SNOW : biome === 'savanna' ? TILES.SAND : biome === 'swamp' ? TILES.MUD : TILES.GRASS;
          const dirtTile = biome === 'snow' ? TILES.SNOW : biome === 'savanna' ? TILES.SANDSTONE : biome === 'swamp' ? TILES.MUD : TILES.DIRT;
          const wallTile = biome === 'swamp' ? TILES.MUD : biome === 'savanna' ? TILES.SAND : TILES.DIRT;
          if (y < this.surfaceHeights[x]) this.tiles[y * this.width + x] = TILES.AIR;
          else if (y === this.surfaceHeights[x]) this.tiles[y * this.width + x] = surfaceTile;
          else if (y < this.surfaceHeights[x] + 6) this.tiles[y * this.width + x] = dirtTile;
          else this.tiles[y * this.width + x] = TILES.STONE;
          this.walls[y * this.width + x] = y < this.surfaceHeights[x] ? TILES.AIR : wallTile;
        }
      }
      this.landmarks = this.landmarks.filter(l => !(l.type === 'dungeon' && l.x === ox));
    }
    this.generateSecretDungeon();
    this.dungeon.layoutVersion = 2;
  }

  // ============================================================
  // RAINBOW ORE — endgame material. Extremely rare veins buried deep
  // underground (below ~34 tiles of overburden); the two OP swords need it.
  // ============================================================
  seedRainbowOre(veins = 68) {
    let placed = 0;
    let guard = 0;
    while (placed < veins && guard++ < 8000) {
      const x = 6 + Math.floor(Math.random() * (this.width - 12));
      const surf = this.surfaceHeights[x];
      const depth = 34 + Math.floor(Math.random() * Math.max(24, this.height - surf - 46));
      const y = surf + depth;
      if (y >= this.height - 5 || y <= surf + 20) continue;
      const t = this.getTile(x, y);
      if (t !== TILES.STONE && t !== TILES.MOSSY_STONE) continue;
      this.setTile(x, y, TILES.RAINBOW_ORE);
      placed++;
      // Companion ores make each find a small vein, not a lone speck.
      const veinSize = Math.floor(Math.random() * 3);
      for (let i = 0; i < veinSize; i++) {
        const vx = x + (Math.random() < 0.5 ? -1 : 1) * (Math.random() < 0.7 ? 1 : 0);
        const vy = y + (Math.random() < 0.5 ? 0 : 1);
        const t2 = this.getTile(vx, vy);
        if (t2 === TILES.STONE || t2 === TILES.MOSSY_STONE) {
          this.setTile(vx, vy, TILES.RAINBOW_ORE);
          placed++;
        }
      }
    }
    this.rainbowSeeded = true;
    return placed;
  }

  /** Count rainbow ore tiles (used by saves/QA). */
  countRainbowOre() {
    let n = 0;
    for (let i = 0; i < this.tiles.length; i++) {
      if (this.tiles[i] === TILES.RAINBOW_ORE) n++;
    }
    return n;
  }

  paintStoneInterior(left, right, top, bottom) {
    for (let y = top; y <= bottom; y++) {
      for (let x = left; x <= right; x++) {
        this.setTile(x, y, TILES.AIR);
        this.walls[y * this.width + x] = HOUSE_WALL;
      }
    }
  }

  buildHouseShell(centerX, groundY, halfWidth, height, wallTile, roofTile) {
    const left = centerX - halfWidth;
    const right = centerX + halfWidth;
    const top = groundY - height;

    this.paintStoneInterior(left + 1, right - 1, top + 1, groundY - 2);
    for (let y = top; y <= groundY - 2; y++) {
      this.setTile(left, y, wallTile);
      this.setTile(right, y, wallTile);
    }
    for (let x = left; x <= right; x++) {
      this.setTile(x, groundY - 1, TILES.STONE_BRICK);
    }

    // Layered roof creates a readable silhouette instead of a flat cap.
    for (let row = 0; row < 3; row++) {
      const roofHalfWidth = Math.max(1, halfWidth - row);
      for (let x = centerX - roofHalfWidth; x <= centerX + roofHalfWidth; x++) {
        this.setTile(x, top - row, roofTile);
      }
    }

    // Door, timber framing, and two windows make the front legible at game scale.
    this.setTile(centerX, groundY - 2, TILES.AIR);
    this.setTile(centerX - 1, groundY - 2, TILES.WOOD);
    this.setTile(centerX + 1, groundY - 2, TILES.WOOD);
    if (halfWidth >= 4) {
      this.setTile(left + 2, top + 2, TILES.GLASS);
      this.setTile(right - 2, top + 2, TILES.GLASS);
    }
    this.setTile(right - 1, top - 1, TILES.STONE_BRICK);
    this.setTile(right - 1, top - 2, TILES.STONE_BRICK);
  }

  generateLandmarks() {
    // Small stone shrines give surface exploration recognizable destinations.
    // Spread one per biome band (snow, forest, plains, swamp), with the plains one
    // sitting clear of the building plot so the meadow stays an open field.
    const shrineXs = [24, 78, 260, 360];
    for (const shrineX of shrineXs) {
      const groundY = this.surfaceHeights[shrineX];
      this.landmarks.push({ x: shrineX, y: groundY - 5, type: 'shrine' });
      this.paintStoneInterior(shrineX - 2, shrineX + 2, groundY - 4, groundY - 2);
      this.setTile(shrineX, groundY - 1, TILES.CHEST);
      for (const offset of [-3, -2, 2, 3]) {
        this.setTile(shrineX + offset, groundY - 1, TILES.STONE_BRICK);
        this.setTile(shrineX + offset, groundY - 2, TILES.STONE_BRICK);
        this.setTile(shrineX + offset, groundY - 3, TILES.STONE_BRICK);
      }
      for (let offset = -3; offset <= 3; offset++) {
        this.setTile(shrineX + offset, groundY - 4, TILES.STONE_BRICK);
      }
      for (let offset = -2; offset <= 2; offset++) {
        this.setTile(shrineX + offset, groundY - 5, TILES.STONE_BRICK);
      }
    }

    const cabinXs = [120];
    for (const cabinX of cabinXs) {
      const groundY = this.surfaceHeights[cabinX];
      this.landmarks.push({ x: cabinX, y: groundY - 4, type: 'cabin' });
      this.buildHouseShell(cabinX, groundY, 5, 6, TILES.WOOD, TILES.WOOD_STAIRS);
      this.setTile(cabinX, groundY - 2, TILES.CHEST);
      this.setTile(cabinX - 1, groundY - 2, TILES.CAMPFIRE);
    }
  }

  generateSurfaceStructures() {
    this.buildSnowLodge(42);
    // Keep a small, memorable set of hand-built landmarks; leave the rest wild.
  }

  buildSnowLodge(centerX) {
    const groundY = this.surfaceHeights[centerX];
    this.landmarks.push({ x: centerX, y: groundY - 5, type: 'snow_lodge' });
    this.buildHouseShell(centerX, groundY, 5, 6, TILES.SNOW, TILES.SNOW);
    this.setTile(centerX, groundY - 2, TILES.CHEST);
    this.setTile(centerX - 2, groundY - 1, TILES.CAMPFIRE);
  }

  buildSavannaOutpost(centerX) {
    const groundY = this.surfaceHeights[centerX];
    this.landmarks.push({ x: centerX, y: groundY - 6, type: 'savanna_outpost' });
    this.buildHouseShell(centerX, groundY, 5, 7, TILES.STONE_BRICK, TILES.SAND);
    this.setTile(centerX, groundY - 1, TILES.CHEST);
  }

  buildSwampHut(centerX) {
    const groundY = this.surfaceHeights[centerX];
    this.landmarks.push({ x: centerX, y: groundY - 5, type: 'swamp_hut' });
    this.buildHouseShell(centerX, groundY, 5, 6, TILES.MUD, TILES.MANGROVE_LEAVES);
    this.setTile(centerX, groundY - 2, TILES.CHEST);
  }

  generateUndergroundFeatures() {
    // Veins are deliberately limited so rare resources remain meaningful.
    const diamondVeins = 7 + Math.floor(Math.random() * 4);
    for (let vein = 0; vein < diamondVeins; vein++) {
      this.generateOreVein(TILES.DIAMOND_ORE, 4 + Math.floor(Math.random() * 4), 28);
    }

    const crystalVeins = 5 + Math.floor(Math.random() * 4);
    for (let vein = 0; vein < crystalVeins; vein++) {
      this.generateOreVein(TILES.CRYSTAL, 4 + Math.floor(Math.random() * 4), 18);
    }

    // Larger underground chambers break up the narrow starter caves.
    for (let chamber = 0; chamber < 12; chamber++) {
      const centerX = 10 + Math.floor(Math.random() * (this.width - 20));
      const centerY = this.surfaceHeights[centerX] + 30 + Math.floor(Math.random() * 55);
      const radiusX = 5 + Math.floor(Math.random() * 5);
      const radiusY = 3 + Math.floor(Math.random() * 4);
      this.landmarks.push({ x: centerX, y: centerY, type: 'cavern' });

      for (let y = centerY - radiusY; y <= centerY + radiusY; y++) {
        for (let x = centerX - radiusX; x <= centerX + radiusX; x++) {
          const normalized = ((x - centerX) ** 2) / (radiusX ** 2) + ((y - centerY) ** 2) / (radiusY ** 2);
          if (normalized <= 1 && y > this.surfaceHeights[x] + 10) {
            this.setTile(x, y, TILES.AIR);
            this.walls[y * this.width + x] = TILES.STONE;
          }
        }
      }

      if (chamber % 2 === 0) {
        this.setTile(centerX, centerY, TILES.CHEST);
      }
    }

    // Deep lava pools sit at the bottom of larger cave spaces.
    for (let pool = 0; pool < 10; pool++) {
      const centerX = 12 + Math.floor(Math.random() * (this.width - 24));
      const centerY = this.surfaceHeights[centerX] + 34 + Math.floor(Math.random() * 28);
      const radius = 2 + Math.floor(Math.random() * 4);
      this.landmarks.push({ x: centerX, y: centerY, type: 'lava_pool' });
      for (let x = centerX - radius; x <= centerX + radius; x++) {
        this.setTile(x, centerY, TILES.LAVA);
        if (Math.abs(x - centerX) < radius - 1) this.setTile(x, centerY - 1, TILES.LAVA);
        this.setTile(x, centerY - 2, TILES.AIR);
      }
    }

    // A second deep layer makes the lower half of the world worth reaching.
    for (let chamber = 0; chamber < 8; chamber++) {
      const centerX = 10 + Math.floor(Math.random() * (this.width - 20));
      const centerY = this.surfaceHeights[centerX] + 68 + Math.floor(Math.random() * 22);
      const radiusX = 6 + Math.floor(Math.random() * 5);
      const radiusY = 4 + Math.floor(Math.random() * 3);
      this.landmarks.push({ x: centerX, y: centerY, type: 'deep_cavern' });
      for (let y = centerY - radiusY; y <= centerY + radiusY; y++) {
        for (let x = centerX - radiusX; x <= centerX + radiusX; x++) {
          const normalized = ((x - centerX) ** 2) / (radiusX ** 2) + ((y - centerY) ** 2) / (radiusY ** 2);
          if (normalized <= 1 && y > this.surfaceHeights[x] + 20) {
            this.setTile(x, y, TILES.AIR);
            this.walls[y * this.width + x] = TILES.STONE;
          }
        }
      }
    }

    // Carved mineshafts create navigable underground routes and chest rewards.
    for (let shaft = 0; shaft < 8; shaft++) {
      const centerX = 18 + Math.floor(Math.random() * (this.width - 36));
      const centerY = this.surfaceHeights[centerX] + 22 + Math.floor(Math.random() * 18);
      this.landmarks.push({ x: centerX, y: centerY, type: 'mineshaft' });
      for (let x = centerX - 8; x <= centerX + 8; x++) {
        this.setTile(x, centerY - 1, TILES.AIR);
        this.setTile(x, centerY, TILES.AIR);
        this.setTile(x, centerY + 1, TILES.WOOD_PLATFORM);
      }
      for (let x = centerX - 7; x <= centerX + 7; x += 4) {
        this.setTile(x, centerY - 2, TILES.WOOD);
        this.setTile(x, centerY - 1, TILES.WOOD);
        this.setTile(x, centerY + 1, TILES.WOOD);
      }
      this.setTile(centerX + 5, centerY - 1, TILES.CHEST);
    }
  }

  generateOreVein(tile, length, depthOffset) {
    const centerX = 10 + Math.floor(Math.random() * (this.width - 20));
    const minimumY = this.surfaceHeights[centerX] + depthOffset;
    let veinX = centerX;
    let veinY = minimumY + Math.floor(Math.random() * Math.max(1, this.height - minimumY - 8));

    // Find a solid starting cell so every vein is made of actual ore blocks.
    for (let attempt = 0; attempt < 12 && this.getTile(veinX, veinY) !== TILES.STONE; attempt++) {
      veinX = centerX + Math.floor(Math.random() * 7) - 3;
      veinY = minimumY + Math.floor(Math.random() * Math.max(1, this.height - minimumY - 8));
    }

    for (let segment = 0; segment < length; segment++) {
      if (this.getTile(veinX, veinY) !== TILES.STONE && this.getTile(veinX, veinY) !== TILES.AIR) break;
      this.setTile(veinX, veinY, tile);

      const directions = [[1, 0], [-1, 0], [0, 1], [0, -1]];
      directions.sort(() => Math.random() - 0.5);
      const next = directions.find(([dx, dy]) => {
        const nextTile = this.getTile(veinX + dx, veinY + dy);
        return nextTile === TILES.STONE || nextTile === TILES.AIR;
      });
      if (!next) break;
      veinX += next[0];
      veinY += next[1];
    }
  }

  // Non-colliding surface dressing: flowers, tall grass, shrubs, cacti,
  // icicles. Purely visual, mined for a small acorn/seed refund.
  decorateSurface() {
    for (let x = 4; x < this.width - 4; x++) {
      const biome = this.getBiomeAtX(x);
      const sy = this.surfaceHeights[x];
      if (this.getTile(x, sy - 1) !== TILES.AIR) continue;
      const ground = this.getTile(x, sy);
      const roll = Math.random();
      if (biome === 'forest' && (ground === TILES.GRASS || ground === TILES.DIRT)) {
        if (roll < 0.16) this.setTile(x, sy - 1, TILES.FLOWER);
        else if (roll < 0.42) this.setTile(x, sy - 1, TILES.TALL_GRASS);
      } else if (biome === 'snow' && ground === TILES.SNOW) {
        if (roll < 0.14) this.setTile(x, sy - 1, TILES.SNOWBUSH);
        else if (roll < 0.22) this.setTile(x, sy - 1, TILES.ICICLE);
      } else if (biome === 'savanna' && (ground === TILES.SAND || ground === TILES.SANDSTONE)) {
        if (roll < 0.12) {
          const h = 2 + Math.floor(Math.random() * 3);
          for (let i = 1; i <= h; i++) this.setTile(x, sy - i, TILES.CACTUS);
        } else if (roll < 0.30) this.setTile(x, sy - 1, TILES.TALL_GRASS);
      } else if (biome === 'plains' && (ground === TILES.GRASS || ground === TILES.DIRT)) {
        // Minecraft plains: mostly open grass, thick with flowers and tufts and
        // nothing that hurts to walk into. Denser than the forest on purpose —
        // that scatter of flowers is the biome's whole silhouette.
        if (roll < 0.22) this.setTile(x, sy - 1, TILES.FLOWER);
        else if (roll < 0.52) this.setTile(x, sy - 1, TILES.TALL_GRASS);
      } else if (biome === 'swamp' && (ground === TILES.MUD || ground === TILES.WATER)) {
        if (ground === TILES.MUD && roll < 0.20) this.setTile(x, sy - 1, TILES.LILY);
        else if (ground === TILES.MUD && roll < 0.44) this.setTile(x, sy - 1, TILES.TALL_GRASS);
      }
    }
  }

  growTree(baseX, baseY) {
    const giant = Math.random() < 0.12; // occasional ancient forest giant
    const height = giant ? Math.floor(Math.random() * 4 + 12) : Math.floor(Math.random() * 6 + 7);
    // Trunk (giants get a 2-wide trunk)
    for (let i = 0; i < height; i++) {
      this.setTile(baseX, baseY - i, TILES.WOOD);
      if (giant && i < 4) this.setTile(baseX + 1, baseY - i, TILES.WOOD);
    }
    // Roots flare at the base
    this.setTile(baseX - 1, baseY, TILES.WOOD);
    this.setTile(baseX + (giant ? 2 : 1), baseY, TILES.WOOD);
    if (Math.random() < 0.5) this.setTile(baseX - 2, baseY, TILES.WOOD);
    // Tapered crown foliage keeps neighboring trees from becoming one flat canopy.
    const topY = baseY - height;
    const crownWidths = giant ? [2, 3, 4, 4, 3, 2, 1] : [1, 2, 3, 3, 2, 1];
    for (let row = 0; row < crownWidths.length; row++) {
      const width = crownWidths[row];
      for (let ox = -width; ox <= width; ox++) {
        if (Math.abs(ox) === width && row > 0 && Math.random() < 0.3) continue;
        if (this.getTile(baseX + ox, topY + row) === TILES.AIR) {
          this.setTile(baseX + ox, topY + row, TILES.LEAVES);
        }
      }
    }
    // Hanging vines on giants + a possible beehive glow spot
    if (giant) {
      for (const vx of [-2, 3]) {
        const len = 2 + Math.floor(Math.random() * 3);
        for (let i = 1; i <= len; i++) {
          if (this.getTile(baseX + vx, topY + 2 + i) === TILES.AIR) this.setTile(baseX + vx, topY + 2 + i, TILES.TALL_GRASS);
        }
      }
    }
  }

  growSnowPine(baseX, baseY) {
    // Frostberry pines: layered boughs with snow caps and dangling icicles.
    for (let i = 0; i < 9; i++) this.setTile(baseX, baseY - i, TILES.WOOD);
    for (let row = 0; row < 7; row++) {
      const width = Math.min(3, Math.floor(row / 2) + 1);
      for (let offset = -width; offset <= width; offset++) {
        if (Math.abs(offset) !== width || Math.random() > 0.2) {
          if (this.getTile(baseX + offset, baseY - 3 - row) === TILES.AIR) {
            // Snow-dusted tips on the outer ring.
            const tip = Math.abs(offset) === width && Math.random() < 0.6;
            this.setTile(baseX + offset, baseY - 3 - row, tip ? TILES.SNOW : TILES.SNOW_PINE_LEAVES);
          }
        }
      }
    }
    // Icicles drip from a random low bough.
    const ix = baseX + (Math.random() < 0.5 ? -2 : 2);
    if (this.getTile(ix, baseY - 3) === TILES.AIR) this.setTile(ix, baseY - 3, TILES.ICICLE);
    // Snowdrift at the roots.
    if (this.getTile(baseX - 1, baseY) === TILES.SNOW) this.setTile(baseX - 1, baseY - 1, TILES.SNOWBUSH);
  }

  growAcacia(baseX, baseY) {
    // Wind-sculpted acacia: leaning trunk, flat umbrella canopy, dry brush below.
    const lean = Math.random() < 0.5 ? -1 : 1;
    for (let i = 0; i < 6; i++) {
      const lx = baseX + (i > 2 ? lean * Math.floor((i - 2) / 2) : 0);
      this.setTile(lx, baseY - i, TILES.WOOD);
    }
    const topX = baseX + lean;
    for (let offset = -4; offset <= 4; offset++) {
      if (Math.abs(offset) < 4 || Math.random() > 0.35) {
        if (this.getTile(topX + offset, baseY - 7) === TILES.AIR) this.setTile(topX + offset, baseY - 7, TILES.ACACIA_LEAVES);
        if (Math.abs(offset) < 3 && this.getTile(topX + offset, baseY - 6) === TILES.AIR) this.setTile(topX + offset, baseY - 6, TILES.ACACIA_LEAVES);
      }
    }
    // Drooping seed pods on the canopy edge.
    this.setTile(topX - 4, baseY - 6, TILES.ACACIA_LEAVES);
    this.setTile(topX + 4, baseY - 6, TILES.ACACIA_LEAVES);
    // A cactus sometimes keeps the acacia company.
    if (Math.random() < 0.3) {
      const cx = baseX + lean * 3;
      if (this.getTile(cx, baseY - 1) === TILES.AIR) {
        this.setTile(cx, baseY - 1, TILES.CACTUS);
        if (this.getTile(cx, baseY - 2) === TILES.AIR && Math.random() < 0.6) this.setTile(cx, baseY - 2, TILES.CACTUS);
      }
    }
  }

  growMangrove(baseX, baseY) {
    // Mangrove: stilt roots over the mire, broad dripping canopy, lilies below.
    for (const rx of [-2, -1, 1, 2]) {
      this.setTile(baseX + rx, baseY, TILES.WOOD);
      this.setTile(baseX + (rx > 0 ? rx - 1 : rx + 1), baseY - 1, TILES.WOOD);
    }
    for (let i = 0; i < 7; i++) this.setTile(baseX, baseY - i, TILES.WOOD);
    for (let offset = -4; offset <= 4; offset++) {
      for (let row = 0; row < 3; row++) {
        if (Math.abs(offset) + row < 6 && (Math.abs(offset) < 2 || Math.random() > 0.25)) {
          if (this.getTile(baseX + offset, baseY - 7 - row) === TILES.AIR) {
            this.setTile(baseX + offset, baseY - 7 - row, TILES.MANGROVE_LEAVES);
          }
        }
      }
    }
    // Hanging moss strands.
    for (const mx of [-3, 0, 3]) {
      if (this.getTile(baseX + mx, baseY - 6) === TILES.AIR && Math.random() < 0.7) {
        this.setTile(baseX + mx, baseY - 6, TILES.TALL_GRASS);
      }
    }
    // Lily pads at the foot of the tree.
    for (const lx of [-3, 3]) {
      if (this.getTile(baseX + lx, baseY - 1) === TILES.AIR && Math.random() < 0.6) {
        this.setTile(baseX + lx, baseY - 1, TILES.LILY);
      }
    }
  }

  update(dt) {
    // Time progression
    this.timeOfDay += dt / this.dayDuration;
    if (this.timeOfDay >= 1.0) {
      this.timeOfDay = 0;
      this.dayCount++;
    }
  }

  isNight() {
    return this.timeOfDay >= 0.55 && this.timeOfDay <= 0.95;
  }

  isMidnight() {
    return this.timeOfDay >= 0.72 && this.timeOfDay <= 0.78;
  }

  getTimeFormatted() {
    // 0.0 -> 06:00
    // 0.25 -> 12:00
    // 0.5 -> 18:00
    // 0.75 -> 00:00
    const totalMinutes = Math.floor(this.timeOfDay * 24 * 60) + (6 * 60);
    const m = (totalMinutes % (24 * 60));
    let hours = Math.floor(m / 60);
    const minutes = Math.floor(m % 60);
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours % 12 === 0 ? 12 : hours % 12;
    const strM = minutes < 10 ? '0' + minutes : minutes;
    const strH = displayHours < 10 ? '0' + displayHours : displayHours;
    return `${strH}:${strM} ${ampm} (Day ${this.dayCount})`;
  }

  getSkyColor() {
    return this.getSkyPalette().zenith;
  }

  /**
   * Full sky palette for the current time of day.
   *
   * A single flat colour was why every hour looked like the same blue: there was
   * no separation between the top of the screen and the horizon, so the sky read
   * as a wall rather than as distance. This returns a zenith (top), a mid band
   * and a horizon glow that are *different* colours, which is what actually
   * gives the world depth. Sunrise and sunset get their own warm ground-glow.
   */
  getSkyPalette() {
    const t = this.timeOfDay;
    // Anchor stops: deep night -> dawn -> morning -> noon -> dusk -> night.
    const stops = [
      { t: 0.00, zenith: [26, 34, 74], mid: [58, 62, 110], horizon: [150, 108, 120] },
      { t: 0.10, zenith: [92, 120, 190], mid: [190, 150, 150], horizon: [255, 168, 118] },
      { t: 0.22, zenith: [84, 158, 232], mid: [140, 196, 246], horizon: [206, 232, 250] },
      { t: 0.42, zenith: [64, 142, 236], mid: [124, 186, 246], horizon: [196, 226, 250] },
      { t: 0.52, zenith: [96, 140, 216], mid: [206, 158, 148], horizon: [255, 168, 96] },
      { t: 0.60, zenith: [44, 44, 104], mid: [128, 62, 110], horizon: [232, 96, 88] },
      { t: 0.70, zenith: [16, 20, 48], mid: [30, 36, 74], horizon: [64, 52, 88] },
      { t: 0.88, zenith: [10, 14, 34], mid: [22, 28, 60], horizon: [42, 44, 78] },
      { t: 1.00, zenith: [26, 34, 74], mid: [58, 62, 110], horizon: [150, 108, 120] }
    ];
    for (let i = 0; i < stops.length - 1; i++) {
      const a = stops[i];
      const b = stops[i + 1];
      if (t >= a.t && t <= b.t) {
        const p = (t - a.t) / Math.max(0.0001, b.t - a.t);
        return {
          zenith: this.interpolateColor(a.zenith, b.zenith, p),
          mid: this.interpolateColor(a.mid, b.mid, p),
          horizon: this.interpolateColor(a.horizon, b.horizon, p)
        };
      }
    }
    return { zenith: stops[3].zenith, mid: stops[3].mid, horizon: stops[3].horizon };
  }

  interpolateColor(c1, c2, factor) {
    return [
      Math.round(c1[0] + (c2[0] - c1[0]) * factor),
      Math.round(c1[1] + (c2[1] - c1[1]) * factor),
      Math.round(c1[2] + (c2[2] - c1[2]) * factor)
    ];
  }

  // Deterministic 0..1 hash per tile — stable grain, no per-frame random.
  hash2(tx, ty) {
    let h = (tx * 374761393 + ty * 668265263) | 0;
    h = (h ^ (h >> 13)) * 1274126177;
    h = (h ^ (h >> 16)) >>> 0;
    return (h % 1000) / 1000;
  }

  // Directional sun: which sides are lit + tint color + strength.
  // Morning = warm east light, noon = top, dusk = orange west, night = cool moon.
  sunShade() {
    const t = this.timeOfDay;
    if (t < 0.2) return { lx: 0.10, rx: 0.0, top: 0.06, warm: [255, 190, 120], a: 0.12 };
    if (t < 0.5) return { lx: 0.0, rx: 0.0, top: 0.10, warm: [255, 250, 220], a: 0.08 };
    if (t < 0.6) return { lx: 0.0, rx: 0.10, top: 0.03, warm: [255, 140, 70], a: 0.14 };
    return { lx: 0.05, rx: 0.05, top: 0.02, warm: [120, 160, 255], a: 0.10, night: true };
  }

  // Terraria-style AO: dark strips where a solid neighbour touches,
  // top highlight where sky is above, dark corner pixels on diagonals.
  shadeEdges(ctx, sx, sy, tx, ty) {
    const solidAt = (x, y) => {
      const tl = this.getTile(x, y);
      const p = TILE_PROPERTIES[tl];
      return !!p && !!p.solid;
    };
    const S = TILE_SIZE;
    if (solidAt(tx, ty - 1)) { ctx.fillStyle = 'rgba(0,0,0,0.30)'; ctx.fillRect(sx, sy, S, 4); }
    else { ctx.fillStyle = 'rgba(255,255,255,0.10)'; ctx.fillRect(sx, sy, S, 2); }
    if (solidAt(tx, ty + 1)) { ctx.fillStyle = 'rgba(0,0,0,0.34)'; ctx.fillRect(sx, sy + S - 4, S, 4); }
    if (solidAt(tx - 1, ty)) { ctx.fillStyle = 'rgba(0,0,0,0.26)'; ctx.fillRect(sx, sy, 4, S); }
    if (solidAt(tx + 1, ty)) { ctx.fillStyle = 'rgba(0,0,0,0.26)'; ctx.fillRect(sx + S - 4, sy, 4, S); }
    // Inner-corner pixels sell the depth.
    if (!solidAt(tx - 1, ty) && !solidAt(tx, ty - 1) && solidAt(tx - 1, ty - 1)) {
      ctx.fillStyle = 'rgba(0,0,0,0.30)'; ctx.fillRect(sx, sy, 4, 4);
    }
    if (!solidAt(tx + 1, ty) && !solidAt(tx, ty - 1) && solidAt(tx + 1, ty - 1)) {
      ctx.fillStyle = 'rgba(0,0,0,0.30)'; ctx.fillRect(sx + S - 4, sy, 4, 4);
    }
  }

  // Sun wash overlay per tile + deterministic grain speckles.
  applyTileLight(ctx, sx, sy, tx, ty) {
    const sun = this.sunShade();
    const S = TILE_SIZE;
    const [wr, wg, wb] = sun.warm;
    if (sun.top > 0) { ctx.fillStyle = `rgba(${wr},${wg},${wb},${sun.top * sun.a * 8})`; ctx.fillRect(sx, sy, S, 3); }
    if (sun.lx > 0) { ctx.fillStyle = `rgba(${wr},${wg},${wb},${sun.lx})`; ctx.fillRect(sx, sy, 3, S); }
    if (sun.rx > 0) { ctx.fillStyle = `rgba(${wr},${wg},${wb},${sun.rx})`; ctx.fillRect(sx + S - 3, sy, 3, S); }
    if (sun.night) { ctx.fillStyle = 'rgba(40,60,160,0.08)'; ctx.fillRect(sx, sy, S, S); }
    // Grain: 3 stable 2x2 speckles keyed off tile hash.
    const h = this.hash2(tx, ty);
    const gx = 3 + Math.floor(h * 15);
    const gy = 4 + Math.floor(this.hash2(ty, tx) * 13);
    ctx.fillStyle = 'rgba(0,0,0,0.10)';
    ctx.fillRect(sx + gx, sy + gy, 2, 2);
    ctx.fillRect(sx + ((gx + 9) % 20), sy + ((gy + 7) % 20), 2, 2);
    ctx.fillStyle = 'rgba(255,255,255,0.07)';
    ctx.fillRect(sx + ((gx + 14) % 20), sy + ((gy + 12) % 20), 2, 2);
  }

  // Draw 5-layer parallax backdrop (Terraria aesthetics)
  //
  // PERF: this is the most expensive per-frame pass in the game — a full-screen
  // gradient, two mountain ridge walks, pine and canopy layers, plus clouds,
  // stars and biome flourishes. All of it is deterministic, so it is baked into
  // an offscreen canvas and blitted as ONE drawImage.
  //
  // The cache is keyed on a coarse bucket of (time of day, camera x, camera y,
  // biome): stars only fade on a smooth curve and parallax moves in large
  // steps, so quantising slightly is invisible while letting a row of frames
  // reuse a single render.
  renderForestBackground(ctx, camera) {
    const w = camera.viewportWidth;
    const h = camera.viewportHeight;
    const biome = this.getBiomeAtX((camera.x + w / 2) / TILE_SIZE);
    const key = [
      Math.floor(this.timeOfDay * 220),   // ~6.5s of real time per bucket
      Math.floor(camera.x / 4),           // parallax shifts a quarter-pixel/frame
      Math.floor(camera.y / 4),
      biome
    ].join('|');

    if (!this._bgCache || this._bgCache.key !== key ||
        this._bgCache.w !== w || this._bgCache.h !== h) {
      // The backdrop is painted into its own persistent canvas, not into the
      // caller's buffer, so the cache owns the layer outright.
      if (!this._bgCanvas) {
        this._bgCanvas = document.createElement('canvas');
      }
      // Only mark the cache valid if the layer actually painted; otherwise the
      // next frame must retry rather than blit an empty canvas forever.
      if (this._renderBackgroundLayer(this._bgCanvas, w, h, camera, biome)) {
        this._bgCache = { key, w, h };
      }
    }
    if (this._bgCanvas) ctx.drawImage(this._bgCanvas, 0, 0);
  }

  /**
   * Paint the whole backdrop once into a scratch canvas.
   *
   * @param target  the canvas to paint into
   * @param w,h     viewport size
   * @param camera  used for parallax offsets
   * @param biome   which palette and flourishes to use
   */
  _renderBackgroundLayer(target, w, h, camera, biome) {
    if (target.width !== w || target.height !== h) {
      target.width = w;
      target.height = h;
    }
    // Guarded because a canvas without a 2d context (some headless/offscreen
    // setups) must degrade to "no backdrop" instead of throwing every frame.
    const ctx = target.getContext && target.getContext('2d');
    if (!ctx) return false;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, w, h);
    ctx.imageSmoothingEnabled = false;
    const t = Date.now() * 0.001;
    const night = this.isNight();

    const sun = this._paintSky(ctx, camera, biome, w, h, t, night);

    this.renderBiomeDecor(ctx, camera, biome, w, h, t, night);
    if (biome === 'forest' && !night) this.renderGodRays(ctx, camera, w, h, sun.sunX, sun.sunY);
    if (biome === 'forest') this.renderFallingLeaves(ctx, camera, w, h, t);
    if (biome === 'savanna') this.renderSavannaLife(ctx, camera, w, h, t, night);
    if (biome === 'snow') this.renderSnowfall(ctx, camera, w, h, t);
    if (biome === 'swamp') this.renderSwampNight(ctx, camera, w, h, t, night);

    // Swamp mire tint + fireflies drifting over the water at night.
    if (biome === 'swamp') {
      ctx.fillStyle = 'rgba(20, 83, 45, 0.16)';
      ctx.fillRect(0, h * 0.52, w, h * 0.48);
      if (night) {
        ctx.save();
        ctx.fillStyle = 'rgba(254, 240, 138, 0.9)';
        for (let f = 0; f < 14; f++) {
          const fx = ((f * 211 + t * (12 + f * 2)) % (w + 40)) - 20 - (camera.x * 0.02) % 40;
          const fy = h * 0.55 + ((f * 67) % Math.max(1, h * 0.3)) + Math.sin(t * 1.7 + f) * 8;
          ctx.fillRect(fx, fy, 2, 2);
        }
        ctx.restore();
      }
    }
    // Diamond-dust sparkles in snow daylight.
    if (biome === 'snow' && !night) {
      ctx.save();
      ctx.fillStyle = 'rgba(255, 255, 255, 0.55)';
      for (let f = 0; f < 18; f++) {
        const fx = ((f * 173 + t * 9) % w);
        const fy = h * 0.15 + ((f * 41) % Math.max(1, h * 0.4));
        ctx.fillRect(fx, fy, 2, 2);
      }
      ctx.restore();
    }
    return true;
  }

  /** Biome colours for the far scenery layers. */
  _biomePalette(biome) {
    return {
      snow: { ridge: '#5b6b82', ridgeSnow: '#e2e8f0', far: '#7f8fa6', near: '#a8b8cc', haze: 'rgba(200,225,245,0.20)' },
      forest: { ridge: '#1e293b', ridgeSnow: null, far: '#14532d', near: '#166534', haze: 'rgba(180,220,190,0.14)' },
      // Plains sit further away than the forest: a paler, hazier green so the
      // distance reads as open country rather than as more canopy.
      plains: { ridge: '#3f6212', ridgeSnow: null, far: '#4d7c0f', near: '#65a30d', haze: 'rgba(226,240,200,0.18)' },
      savanna: { ridge: '#8a4a12', ridgeSnow: null, far: '#a16207', near: '#ca8a04', haze: 'rgba(255,215,150,0.22)' },
      swamp: { ridge: '#134e4a', ridgeSnow: null, far: '#115e59', near: '#166534', haze: 'rgba(150,200,175,0.20)' }
    }[biome] || {
      ridge: '#1e293b', ridgeSnow: null, far: '#14532d', near: '#166534', haze: 'rgba(180,220,190,0.14)'
    };
  }

  /** The sky itself: gradient, haze, celestial bodies, clouds, stars, ridges. */
  _paintSky(ctx, camera, biome, w, h, t, night) {
    const sky = this.getSkyPalette();
    const palette = this._biomePalette(biome);
    // 1. Sky gradient. Three genuinely different colours — a dark zenith, a
    // mid band, and a glow sitting on the horizon — instead of one flat blue.
    // The biome tints the horizon only, so biomes differ without fighting the
    // time of day.
    const horizonBoost = biome === 'savanna' ? [1.06, 0.98, 0.86]
      : biome === 'snow' ? [0.94, 0.99, 1.06]
      : biome === 'swamp' ? [0.9, 1.0, 0.96]
      // Plains are the one biome with nothing tall in the way, so the horizon
      // gets a touch more sky behind it.
      : biome === 'plains' ? [1.02, 1.02, 1.0]
      : [1, 1, 1];
    const clamp = (v) => Math.max(0, Math.min(255, Math.round(v)));
    const skyGrad = ctx.createLinearGradient(0, 0, 0, h);
    skyGrad.addColorStop(0, `rgb(${sky.zenith.join(',')})`);
    skyGrad.addColorStop(0.42, `rgb(${sky.mid.join(',')})`);
    skyGrad.addColorStop(0.72, `rgb(${sky.horizon.map((c, i) => clamp(c * horizonBoost[i])).join(',')})`);
    // Below the horizon line the colour deepens again, which reads as ground fog.
    skyGrad.addColorStop(1, `rgb(${sky.horizon.map((c, i) => clamp(c * 0.55 * horizonBoost[i])).join(',')})`);
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, w, h);

    // Horizon haze band — atmosphere depth for free.
    ctx.fillStyle = palette.haze;
    ctx.fillRect(0, h * 0.42, w, h * 0.14);

    this.renderSkyFlavor(ctx, camera, biome, w, h);

    // Celestial bodies: Sun & Moon (bigger soft discs + halo rings)
    const sunAngle = (this.timeOfDay * Math.PI * 2) - Math.PI / 2;
    const cx = w * 0.5;
    const cy = h * 0.85;
    const orbDist = Math.max(w, h) * 0.65;
    const sunX = cx + Math.cos(sunAngle) * orbDist;
    const sunY = cy + Math.sin(sunAngle) * orbDist;

    // Twinkling Stars during night (two sizes + twinkle). Drawn before the sun
    // and moon so bodies always sit in front of the star field.
    if (night) {
      ctx.save();
      const starAlpha = Math.sin(((this.timeOfDay - 0.55) / 0.4) * Math.PI);
      for (let s = 0; s < 130; s++) {
        const sx = ((s * 137.5) % w);
        const sy = ((s * 89.3) % (h * 0.7));
        const tw = 0.55 + 0.45 * Math.sin(t * 2 + s * 1.7);
        const a = Math.max(0, starAlpha * 0.9 * tw);
        ctx.fillStyle = `rgba(255, 255, 255, ${a.toFixed(3)})`;
        const sz = (s % 4 === 0) ? 3 : (s % 3) + 1;
        if (s % 17 === 0) { ctx.fillRect(sx - 3, sy, 7, 1); ctx.fillRect(sx, sy - 3, 1, 7); }
        ctx.fillRect(sx, sy, sz, sz);
      }
      ctx.restore();
    }

    if (sunY < h + 100) {
      ctx.save();
      ctx.beginPath();
      ctx.arc(sunX, sunY, 64, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(255, 236, 150, 0.16)';
      ctx.fill();
      ctx.beginPath();
      ctx.arc(sunX, sunY, 36, 0, Math.PI * 2);
      ctx.fillStyle = '#fffa65';
      ctx.shadowColor = '#fff200';
      ctx.shadowBlur = 40;
      ctx.fill();
      ctx.shadowBlur = 0;
      ctx.fillStyle = '#fff7ae';
      ctx.fillRect(sunX - 14, sunY - 14, 28, 28);
      ctx.beginPath();
      ctx.arc(sunX, sunY, 50, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(255, 235, 59, 0.25)';
      ctx.lineWidth = 14;
      ctx.stroke();
      ctx.restore();
    }

    // Quiet drifting cloud bands add depth without changing the biome palette.
    ctx.save();
    ctx.fillStyle = night ? 'rgba(180, 196, 232, 0.13)' : 'rgba(255, 255, 255, 0.20)';
    const cloudOffset = (camera.x * 0.035 + t * 8) % (w + 220);
    for (let cloud = -1; cloud < 5; cloud++) {
      const cloudX = cloud * 260 - cloudOffset;
      const cloudY = 70 + (cloud % 2) * 55;
      ctx.beginPath();
      ctx.arc(cloudX + 34, cloudY, 20, Math.PI, 0);
      ctx.arc(cloudX + 62, cloudY - 8, 28, Math.PI, 0);
      ctx.arc(cloudX + 96, cloudY, 19, Math.PI, 0);
      ctx.fill();
    }
    ctx.restore();

    const moonAngle = sunAngle + Math.PI;
    const moonX = cx + Math.cos(moonAngle) * orbDist;
    const moonY = cy + Math.sin(moonAngle) * orbDist;
    if (moonY < h + 100) {
      ctx.save();
      ctx.beginPath();
      ctx.arc(moonX, moonY, 52, 0, Math.PI * 2);
      ctx.fillStyle = night ? 'rgba(254, 205, 211, 0.14)' : 'rgba(226, 232, 240, 0.14)';
      ctx.fill();
      ctx.beginPath();
      ctx.arc(moonX, moonY, 32, 0, Math.PI * 2);
      ctx.fillStyle = night ? '#fecdd3' : '#e2e8f0';
      ctx.shadowColor = night ? '#e11d48' : '#93c5fd';
      ctx.shadowBlur = 35;
      ctx.fill();
      ctx.shadowBlur = 0;
      ctx.fillStyle = 'rgba(0, 0, 0, 0.15)';
      ctx.beginPath();
      ctx.arc(moonX - 8, moonY - 6, 8, 0, Math.PI * 2);
      ctx.arc(moonX + 10, moonY + 8, 10, 0, Math.PI * 2);
      ctx.arc(moonX + 6, moonY - 12, 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = 'rgba(10, 14, 32, 0.25)';
      ctx.fillRect(moonX + 4, moonY - 32, 28, 64);
      ctx.restore();
    }

    // Far ridge (darker) + near ridge (palette) = instant depth.
    // Ridges sit at the horizon so the sky reads as receding, not as a backdrop.
    this.renderMountainLayer(ctx, camera, 0.05, this.shadeHex(palette.ridge, 0.55), h * 0.48, 110, null);
    this.renderMountainLayer(ctx, camera, 0.08, palette.ridge, h * 0.55, 90, palette.ridgeSnow);

    if (biome === 'savanna') this.renderDuneLayer(ctx, camera, 0.14, '#b45309', h * 0.66);
    else if (biome === 'swamp') this.renderSwampWaterLayer(ctx, camera, 0.14, h * 0.68);
    else if (biome === 'snow') this.renderSnowDriftLayer(ctx, camera, 0.14, h * 0.66);
    this.renderPineForestLayer(ctx, camera, 0.2, palette.far, h * 0.62, 50, biome);
    this.renderDeciduousForestLayer(ctx, camera, 0.4, palette.near, h * 0.7, 75, biome);

    // Sun position is needed by the god-ray layer below, so hand it back.
    return { sunX, sunY };
  }

  // Small, deterministic scenery props for each biome. Uses the same world
  // position/hash style as the landscape layers, so props never pop or drift
  // when the camera moves.
  renderBiomeDecor(ctx, camera, biome, w, h, t, night) {
    ctx.save();
    const propOffset = camera.x * 0.58;
    const start = Math.floor(propOffset / 190) - 1;
    const count = Math.ceil(w / 190) + 2;

    for (let i = 0; i < count; i++) {
      const id = start + i;
      const x = id * 190 - propOffset;
      const seed = ((id * 92821 + 31337) % 997) / 997;
      const y = h * (0.63 + seed * 0.08);
      ctx.globalAlpha = night ? 0.34 : 0.62;

      if (biome === 'forest') {
        // Fern clusters, a tiny mushroom ring, and a weathered trail marker.
        ctx.fillStyle = '#14532d';
        for (let f = 0; f < 4; f++) {
          const fx = x + f * 9;
          const fh = 12 + (f % 2) * 6;
          ctx.beginPath();
          ctx.moveTo(fx, y + 24);
          ctx.quadraticCurveTo(fx - 6, y + 10, fx, y + 24 - fh);
          ctx.quadraticCurveTo(fx + 6, y + 10, fx, y + 24);
          ctx.fill();
        }
        if (id % 2 === 0) {
          ctx.fillStyle = night ? '#7c2d55' : '#b45309';
          ctx.fillRect(x + 12, y + 18, 4, 6);
          ctx.fillRect(x + 9, y + 15, 10, 5);
        } else {
          ctx.fillStyle = night ? '#581c87' : '#d97706';
          ctx.fillRect(x + 16, y + 21, 4, 3);
        }
      } else if (biome === 'snow') {
        // Frosted boulders and a small, wind-bent ice crystal.
        ctx.fillStyle = night ? '#475569' : '#94a3b8';
        ctx.fillRect(x + 10, y + 10, 30, 18);
        ctx.fillRect(x + 17, y + 4, 20, 12);
        ctx.fillStyle = night ? 'rgba(165,243,252,0.25)' : 'rgba(255,255,255,0.8)';
        ctx.fillRect(x + 14, y + 8, 19, 3);
        ctx.fillStyle = night ? '#67e8f9' : '#bae6fd';
        ctx.beginPath();
        ctx.moveTo(x + 61, y + 28);
        ctx.lineTo(x + 66, y - 2);
        ctx.lineTo(x + 71, y + 28);
        ctx.closePath();
        ctx.fill();
      } else if (biome === 'plains') {
        // Open ground: low grass clumps, a haystack, and a small stone marker —
        // deliberately sparse, because the emptiness is the point.
        ctx.fillStyle = night ? '#14532d' : '#4d7c0f';
        for (let g = 0; g < 7; g++) {
          const gx = x + 8 + g * 8;
          const gh = 8 + (g % 3) * 4;
          ctx.fillRect(gx, y + 26 - gh, 2, gh);
        }
        ctx.fillStyle = night ? '#78350f' : '#ca8a04';
        ctx.fillRect(x + 56, y + 12, 22, 17);
        ctx.fillRect(x + 59, y + 6, 16, 8);
        ctx.fillStyle = night ? '#57534e' : '#a8a29e';
        ctx.fillRect(x + 92, y + 18, 12, 11);
      } else if (biome === 'savanna') {
        // Dry grass clumps, a crooked dead branch, and a small stone marker.
        ctx.fillStyle = night ? '#713f12' : '#a16207';
        for (let g = 0; g < 5; g++) {
          const gx = x + 10 + g * 7;
          ctx.fillRect(gx, y + 12 - (g % 2) * 4, 2, 13 + (g % 2) * 4);
        }
        ctx.fillStyle = night ? '#451a03' : '#78350f';
        ctx.fillRect(x + 55, y - 5, 5, 34);
        ctx.fillRect(x + 48, y + 3, 13, 4);
        ctx.fillStyle = night ? '#57534e' : '#a8a29e';
        ctx.fillRect(x + 88, y + 15, 15, 14);
      } else {
        // Swamp reeds, mushrooms, and a crooked drowned stump.
        ctx.fillStyle = night ? '#164e63' : '#0f766e';
        for (let r = 0; r < 6; r++) {
          const rx = x + 9 + r * 8;
          const rh = 22 + (r % 3) * 9;
          ctx.fillRect(rx, y + 28 - rh, 3, rh);
          ctx.fillRect(rx - 4, y + 27 - rh, 10, 4);
        }
        ctx.fillStyle = night ? '#581c87' : '#4d7c0f';
        ctx.fillRect(x + 64, y + 16, 7, 13);
        ctx.fillRect(x + 59, y + 11, 17, 8);
        ctx.fillStyle = night ? '#2f2417' : '#5b3413';
        ctx.fillRect(x + 100, y - 7, 8, 36);
        ctx.fillRect(x + 95, y + 2, 18, 5);
      }
    }
    ctx.restore();
  }


  // Slanted god-ray shafts from the sun (forest day). Chunky quads, additive feel.
  renderGodRays(ctx, camera, w, h, sunX, sunY) {
    ctx.save();
    const dx = (w * 0.5 - sunX) * 0.002;
    ctx.fillStyle = 'rgba(255, 250, 200, 0.06)';
    for (let i = 0; i < 4; i++) {
      const bx = ((i * 317 + camera.x * 0.1) % (w + 200)) - 100;
      ctx.beginPath();
      ctx.moveTo(bx, h * 0.15);
      ctx.lineTo(bx + 46, h * 0.15);
      ctx.lineTo(bx + 46 + dx * h * 0.5 + 60, h * 0.85);
      ctx.lineTo(bx + dx * h * 0.5 + 60, h * 0.85);
      ctx.closePath();
      ctx.fill();
    }
    ctx.restore();
  }

  // Drifting falling leaves (forest, day + night).
  renderFallingLeaves(ctx, camera, w, h, t) {
    ctx.save();
    ctx.fillStyle = 'rgba(74, 222, 128, 0.7)';
    for (let i = 0; i < 12; i++) {
      const lx = ((i * 173 + t * (14 + (i % 3) * 6) + camera.x * 0.3) % (w + 20)) - 10;
      const ly = h * 0.2 + ((i * 97 + t * 22) % (h * 0.55)) + Math.sin(t * 2 + i * 2.4) * 10;
      const s = 2 + (i % 2);
      ctx.fillRect(lx, ly, s, s);
    }
    ctx.restore();
  }

  // Savanna: dust devils by day, soaring birds, giant low sun glow.
  renderSavannaLife(ctx, camera, w, h, t, night) {
    ctx.save();
    if (!night) {
      // Dust devil: spiralling rect column.
      for (let d = 0; d < 2; d++) {
        const bx = ((d * 613 + t * 40 + camera.x * 0.2) % (w + 100)) - 50;
        ctx.fillStyle = 'rgba(214, 158, 74, 0.20)';
        for (let sgm = 0; sgm < 8; sgm++) {
          const sway = Math.sin(t * 3 + sgm * 0.9 + d * 3) * (6 + sgm * 2);
          ctx.fillRect(bx + sway, h * 0.45 + sgm * 14, 14 - sgm, 8);
        }
      }
    }
    // Birds: 2px flapping "v" silhouettes.
    ctx.fillStyle = night ? 'rgba(20,20,30,0.8)' : 'rgba(60,30,10,0.7)';
    for (let b = 0; b < 5; b++) {
      const bx = ((b * 389 + t * (18 + b * 4)) % (w + 60)) - 30;
      const by = h * 0.18 + (b % 3) * 34 + Math.sin(t * 1.2 + b) * 8;
      const flap = Math.sin(t * 6 + b * 2) > 0 ? 1 : 0;
      ctx.fillRect(bx - 5, by - flap * 2, 5, 2);
      ctx.fillRect(bx, by - flap * 2, 5, 2);
      ctx.fillRect(bx - 1, by, 2, 2);
    }
    ctx.restore();
  }

  // Snow: layered falling snow in front of the canopy.
  renderSnowfall(ctx, camera, w, h, t) {
    ctx.save();
    for (let layer = 0; layer < 2; layer++) {
      const n = layer === 0 ? 40 : 22;
      ctx.fillStyle = layer === 0 ? 'rgba(255,255,255,0.75)' : 'rgba(255,255,255,0.45)';
      const speed = layer === 0 ? 46 : 26;
      const drift = camera.x * (layer === 0 ? 0.5 : 0.3);
      for (let i = 0; i < n; i++) {
        const fx = ((i * 167 + layer * 61 + Math.sin(t * 0.9 + i) * 24 - drift) % (w + 20) + w + 20) % (w + 20) - 10;
        const fy = ((i * 211 + t * speed) % (h + 20) + h + 20) % (h + 20) - 10;
        const s = layer === 0 ? 2 : 3;
        ctx.fillRect(fx, fy, s, s);
      }
    }
    ctx.restore();
  }

  // Swamp: extra fireflies + moon glitter path + vignette.
  renderSwampNight(ctx, camera, w, h, t, night) {
    ctx.save();
    const n = night ? 22 : 8;
    for (let f = 0; f < n; f++) {
      const fx = ((f * 211 + t * (12 + f * 2) + camera.x * 0.25) % (w + 40) + w + 40) % (w + 40) - 20;
      const fy = h * 0.5 + ((f * 67) % Math.max(1, h * 0.35)) + Math.sin(t * 1.7 + f) * 10;
      const pulse = 0.5 + 0.5 * Math.sin(t * 3 + f * 2.2);
      ctx.fillStyle = `rgba(190, 242, 100, ${(0.35 + pulse * 0.55).toFixed(2)})`;
      ctx.fillRect(fx, fy, 2, 2);
      if (pulse > 0.85) { ctx.fillStyle = 'rgba(190,242,100,0.18)'; ctx.fillRect(fx - 3, fy - 3, 8, 8); }
    }
    if (night) {
      // Moon glitter path on the water band.
      ctx.fillStyle = 'rgba(254, 205, 211, 0.20)';
      const gx = w * 0.5 + Math.sin(t * 0.4) * 20;
      for (let r = 0; r < 6; r++) {
        ctx.fillRect(gx - 30 + r * 4, h * 0.62 + r * 8, 60 - r * 8, 3);
      }
    }
    // Swamp vignette: dark dripping edges.
    ctx.fillStyle = 'rgba(5, 20, 15, 0.30)';
    ctx.fillRect(0, 0, w, 26);
    ctx.fillRect(0, h - 30, w, 30);
    ctx.fillRect(0, 0, 22, h);
    ctx.fillRect(w - 22, 0, 22, h);
    ctx.restore();
  }

  // Drifting sky flavor per biome — cheap rects, big personality.
  renderSkyFlavor(ctx, camera, biome, w, h) {
    const t = Date.now() * 0.001;
    ctx.save();
    if (biome === 'savanna' && !this.isNight()) {
      // Heat shimmer bands rising off the dunes.
      ctx.fillStyle = 'rgba(255, 240, 200, 0.10)';
      for (let b = 0; b < 4; b++) {
        const y = h * 0.35 + b * 26 + Math.sin(t * 1.3 + b * 2) * 5;
        for (let x = 0; x < w; x += 46) {
          ctx.fillRect(x + ((b * 17 + t * 20) % 46), y, 24, 3);
        }
      }
    } else if (biome === 'snow' && this.isNight()) {
      // Aurora wisps over the peaks.
      ctx.fillStyle = 'rgba(103, 232, 249, 0.12)';
      for (let b = 0; b < 3; b++) {
        const y = h * 0.12 + b * 22;
        for (let x = 0; x < w; x += 36) {
          const sway = Math.sin(t * 0.8 + x * 0.02 + b * 2) * 10;
          ctx.fillRect(x, y + sway, 26, 5);
        }
      }
      ctx.fillStyle = 'rgba(167, 139, 250, 0.10)';
      for (let b = 0; b < 2; b++) {
        const y = h * 0.16 + b * 26;
        for (let x = 10; x < w; x += 44) {
          const sway = Math.cos(t * 0.7 + x * 0.02 + b) * 12;
          ctx.fillRect(x, y + sway, 30, 4);
        }
      }
    } else if (biome === 'plains' && !this.isNight()) {
      // Drifting seed-down and a few butterflies: the plains are busy at knee
      // height rather than overhead, so the sky stays open.
      ctx.fillStyle = 'rgba(254, 249, 195, 0.55)';
      for (let p = 0; p < 14; p++) {
        const px = ((p * 191 + t * (10 + (p % 4) * 5)) % (w + 30)) - 15;
        const py = h * 0.34 + ((p * 71) % Math.max(1, h * 0.34)) + Math.sin(t * 1.4 + p * 1.7) * 9;
        ctx.fillRect(px, py, 2, 2);
      }
      ctx.fillStyle = 'rgba(253, 224, 71, 0.35)';
      for (let b = 0; b < 5; b++) {
        const bx = ((b * 263 + t * (22 + b * 3)) % (w + 40)) - 20;
        const by = h * 0.46 + (b % 3) * 22 + Math.sin(t * 2.2 + b * 1.3) * 7;
        ctx.fillRect(bx, by, 3, 2);
        ctx.fillRect(bx + 4, by - 1, 3, 2);
      }
    } else if (biome === 'swamp') {
      ctx.fillStyle = this.isNight() ? 'rgba(190, 220, 200, 0.10)' : 'rgba(220, 240, 225, 0.12)';
      for (let b = 0; b < 3; b++) {
        const y = h * 0.5 + b * 30;
        const drift = (t * (8 + b * 4) + camera.x * 0.02) % (w + 300);
        for (let x = -300; x < w; x += 150) {
          ctx.fillRect(x + drift, y, 110, 10);
        }
      }
    } else if (biome === 'forest' && !this.isNight()) {
      // Pollen motes spiraling through sunbeams.
      ctx.fillStyle = 'rgba(254, 243, 199, 0.5)';
      for (let p = 0; p < 16; p++) {
        const px = ((p * 151 + t * 14) % w);
        const py = h * 0.25 + ((p * 53) % Math.max(1, h * 0.35)) + Math.sin(t + p) * 6;
        ctx.fillRect(px, py, 2, 2);
      }
    }
    ctx.restore();
  }

  // Darken/lighten a hex color by k (for far-ridge silhouettes).
  shadeHex(hex, k) {
    const n = parseInt(hex.slice(1), 16);
    const r = Math.round(((n >> 16) & 255) * k);
    const g = Math.round(((n >> 8) & 255) * k);
    const b = Math.round((n & 255) * k);
    return `rgb(${r},${g},${b})`;
  }

  renderMountainLayer(ctx, camera, speed, baseColor, baseY, amp, snowCap = null) {
    const offset = camera.x * speed;
    const w = camera.viewportWidth;
    ctx.fillStyle = baseColor;
    ctx.beginPath();
    ctx.moveTo(0, camera.viewportHeight);

    const step = 40;
    const peaks = [];
    for (let x = -40; x <= w + 40; x += step) {
      const worldX = x + offset;
      const my = baseY - Math.sin(worldX * 0.003) * amp - Math.cos(worldX * 0.008) * (amp * 0.5);
      peaks.push([x, my]);
      ctx.lineTo(x, my);
    }
    ctx.lineTo(w, camera.viewportHeight);
    ctx.closePath();
    ctx.fill();
    // Snow caps on the highest ridges (snow biome) — crisp Terraria triangles.
    if (snowCap) {
      ctx.fillStyle = snowCap;
      for (const [x, my] of peaks) {
        const prominence = baseY - my;
        if (prominence > amp * 0.55) {
          ctx.beginPath();
          ctx.moveTo(x - 26, my + 22);
          ctx.lineTo(x, my - 4);
          ctx.lineTo(x + 26, my + 22);
          ctx.closePath();
          ctx.fill();
        }
      }
    }
  }

  // Rolling savanna dunes between the mountains and the tree line.
  renderDuneLayer(ctx, camera, speed, color, baseY) {
    const offset = camera.x * speed;
    const w = camera.viewportWidth;
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(0, camera.viewportHeight);
    for (let x = -20; x <= w + 20; x += 20) {
      const worldX = x + offset;
      const my = baseY - Math.sin(worldX * 0.006) * 34 - Math.cos(worldX * 0.017) * 12;
      ctx.lineTo(x, my);
    }
    ctx.lineTo(w, camera.viewportHeight);
    ctx.closePath();
    ctx.fill();
    // Sunlit dune crests.
    ctx.fillStyle = 'rgba(253, 224, 130, 0.5)';
    for (let x = -20; x <= w + 20; x += 20) {
      const worldX = x + offset;
      const my = baseY - Math.sin(worldX * 0.006) * 34 - Math.cos(worldX * 0.017) * 12;
      ctx.fillRect(x, my, 20, 3);
    }
  }

  // Glassy swamp mere with lily silhouettes.
  renderSwampWaterLayer(ctx, camera, speed, baseY) {
    const offset = camera.x * speed;
    const w = camera.viewportWidth;
    ctx.fillStyle = '#0f3a3a';
    ctx.fillRect(0, baseY - 30, w, camera.viewportHeight - baseY + 30);
    ctx.fillStyle = 'rgba(45, 212, 191, 0.25)';
    for (let x = 0; x < w; x += 60) {
      const shimmer = Math.sin((x + offset) * 0.02) * 3;
      ctx.fillRect(x, baseY - 18 + shimmer, 44, 3);
    }
    ctx.fillStyle = '#134e4a';
    for (let i = 0; i < Math.ceil(w / 130); i++) {
      const lx = i * 130 - (offset % 130);
      ctx.fillRect(lx + 20, baseY - 14, 26, 6);
      ctx.fillRect(lx + 90, baseY - 8, 18, 5);
    }
  }

  // Wind-combed snowdrifts.
  renderSnowDriftLayer(ctx, camera, speed, baseY) {
    const offset = camera.x * speed;
    const w = camera.viewportWidth;
    ctx.fillStyle = '#dbeafe';
    ctx.beginPath();
    ctx.moveTo(0, camera.viewportHeight);
    for (let x = -20; x <= w + 20; x += 20) {
      const worldX = x + offset;
      const my = baseY - Math.sin(worldX * 0.008) * 26 - Math.cos(worldX * 0.02) * 9;
      ctx.lineTo(x, my);
    }
    ctx.lineTo(w, camera.viewportHeight);
    ctx.closePath();
    ctx.fill();
  }

  renderPineForestLayer(ctx, camera, speed, color, baseY, treeWidth, biome = 'forest') {
    const offset = camera.x * speed;
    const w = camera.viewportWidth;
    ctx.fillStyle = color;

    const startIdx = Math.floor(offset / treeWidth) - 1;
    const count = Math.ceil(w / treeWidth) + 2;

    for (let i = 0; i < count; i++) {
      const treeIdx = startIdx + i;
      const screenX = treeIdx * treeWidth - offset;
      const heightVar = Math.sin(treeIdx * 3.7) * 25 + 70;
      const tipY = baseY - heightVar;

      if (biome === 'savanna') {
        // Distant flat-top acacia silhouettes.
        ctx.fillRect(screenX + treeWidth * 0.5 - 2, tipY + 30, 4, 40);
        ctx.fillRect(screenX + 4, tipY + 24, treeWidth - 8, 10);
      } else if (biome === 'swamp') {
        // Cypress knees + drooping moss curtains.
        ctx.fillRect(screenX + treeWidth * 0.5 - 3, tipY + 20, 6, 50);
        ctx.fillRect(screenX + 8, tipY + 44, 5, 22);
        ctx.fillRect(screenX + treeWidth - 13, tipY + 44, 5, 22);
      } else {
        // Draw pine triangle
        ctx.beginPath();
        ctx.moveTo(screenX + treeWidth * 0.5, tipY);
        ctx.lineTo(screenX + treeWidth, baseY + 60);
        ctx.lineTo(screenX, baseY + 60);
        ctx.closePath();
        ctx.fill();
      }
    }
  }

  renderDeciduousForestLayer(ctx, camera, speed, color, baseY, spacing, biome = 'forest') {
    const offset = camera.x * speed;
    const w = camera.viewportWidth;
    ctx.fillStyle = color;

    const startIdx = Math.floor(offset / spacing) - 1;
    const count = Math.ceil(w / spacing) + 2;

    for (let i = 0; i < count; i++) {
      const treeIdx = startIdx + i;
      const screenX = treeIdx * spacing - offset;
      const heightVar = Math.sin(treeIdx * 2.1) * 20 + 80;
      const crownRadius = 38 + (treeIdx % 4) * 5;
      const cy = baseY - heightVar;

      // Trunk
      ctx.fillStyle = biome === 'savanna' ? '#5b3413' : biome === 'swamp' ? '#2f2417' : biome === 'snow' ? '#4a3b2c' : '#3f2e1e';
      ctx.fillRect(screenX + spacing * 0.5 - 6, cy, 12, heightVar + 40);

      // Lush crown
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(screenX + spacing * 0.5, cy, crownRadius, 0, Math.PI * 2);
      ctx.fill();
      // Canopy light-pockets: snow glints, savanna sun-flecks, swamp glow-moss.
      if (biome === 'snow') {
        ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
        ctx.fillRect(screenX + spacing * 0.5 - crownRadius * 0.5, cy - crownRadius * 0.6, 10, 5);
        ctx.fillRect(screenX + spacing * 0.5 + 4, cy - 4, 8, 4);
      } else if (biome === 'savanna') {
        ctx.fillStyle = 'rgba(254, 243, 199, 0.6)';
        ctx.fillRect(screenX + spacing * 0.5 - 10, cy - 12, 12, 5);
      } else if (biome === 'swamp') {
        ctx.fillStyle = 'rgba(110, 231, 183, 0.55)';
        ctx.fillRect(screenX + spacing * 0.5 - 8, cy + 6, 7, 4);
        ctx.fillRect(screenX + spacing * 0.5 + 4, cy + 12, 6, 3);
      } else {
        ctx.fillStyle = 'rgba(134, 239, 172, 0.6)';
        ctx.fillRect(screenX + spacing * 0.5 - 12, cy - 10, 10, 5);
      }
    }
  }

  // Draw the tile grid. PERF: static tiles are pre-rendered once into an
  // offscreen chunk cache; per frame we blit the slice (1 drawImage) and
  // redraw only animated tiles (lava/torch/fire/water). Identical pixels.
  //
  // PERF: the cached window is snapped outwards to a CHUNK grid and covers the
  // viewport plus up to one chunk of slack on the far side. The old cache was
  // pinned to the viewport's own top-left tile, so simply walking rebuilt the
  // whole thing every time the camera crossed a tile boundary. Snapping moves
  // that to once per chunk of travel — same canvas, ~8x fewer rebuilds.
  //
  // PERF: the background wall pass is painted into this same canvas (walls are
  // static too — generation writes them before the first frame, and loading a
  // save flags the cache dirty, so nothing can go stale), which deletes a
  // second full sweep of the viewport from every frame.
  renderTiles(ctx, camera) {
    const viewMinX = Math.max(0, Math.floor(camera.x / TILE_SIZE));
    const viewMaxX = Math.min(this.width - 1, Math.ceil((camera.x + camera.viewportWidth) / TILE_SIZE));
    const viewMinY = Math.max(0, Math.floor(camera.y / TILE_SIZE));
    const viewMaxY = Math.min(this.height - 1, Math.ceil((camera.y + camera.viewportHeight) / TILE_SIZE));

    // Round the cached window out to chunk boundaries. Both ends move together
    // (they are the same camera), so the window is stable for a whole chunk of
    // travel and every frame inside it is a single blit.
    const minTileX = Math.max(0, Math.floor(viewMinX / TILE_CACHE_CHUNK) * TILE_CACHE_CHUNK);
    const maxTileX = Math.min(this.width - 1, (Math.floor(viewMaxX / TILE_CACHE_CHUNK) + 1) * TILE_CACHE_CHUNK);
    const minTileY = Math.max(0, Math.floor(viewMinY / TILE_CACHE_CHUNK) * TILE_CACHE_CHUNK);
    const maxTileY = Math.min(this.height - 1, (Math.floor(viewMaxY / TILE_CACHE_CHUNK) + 1) * TILE_CACHE_CHUNK);

    const sunKey = this.sunCacheKey();
    const cw = maxTileX - minTileX + 1;
    const ch = maxTileY - minTileY + 1;
    const cache = this._tileCache;
    if (!cache || !cache.canvas || cache.w !== cw || cache.h !== ch ||
        cache.tx !== minTileX || cache.ty !== minTileY ||
        cache.sun !== sunKey || this._tileCacheDirty) {
      this.rebuildTileCache(minTileX, minTileY, cw, ch, sunKey);
    }
    this._tileCacheDirty = false;

    const c = this._tileCache;
    ctx.drawImage(c.canvas, minTileX * TILE_SIZE - camera.x, minTileY * TILE_SIZE - camera.y);

    // Animated tiles drawn live on top (usually < 40 in view). Swept over the
    // viewport, not the cached window, so the slack chunk costs nothing here.
    const sun = this._cachedSun;
    for (let y = viewMinY; y <= viewMaxY; y++) {
      const rowBase = y * this.width;
      for (let x = viewMinX; x <= viewMaxX; x++) {
        const tile = this.tiles[rowBase + x];
        if (!this.isAnimatedTile(tile)) continue;
        const sx = x * TILE_SIZE - camera.x;
        const sy = y * TILE_SIZE - camera.y;
        // Animated tiles keep their surface treatment too, so a torch sitting on
        // grass does not visually strip the grass cap off the tile beneath it.
        const exposedTop = this.getTile(x, y - 1) === TILES.AIR;
        this.drawTileGraphic(ctx, tile, sx, sy, x, y, exposedTop);
        this.applyTileLightFast(ctx, sx, sy, sun);
      }
    }
  }

  // Sun bucketed into 8 phases: cache rebuilds ~8x per day, not per frame.
  sunCacheKey() {
    return Math.floor(this.timeOfDay * 8) % 8;
  }

  isAnimatedTile(tile) {
    return tile === TILES.LAVA || tile === TILES.TORCH || tile === TILES.CAMPFIRE ||
      tile === TILES.WATER || tile === TILES.LILY || tile === TILES.CRYSTAL ||
      tile === TILES.LANTERN;
  }

  // Background walls, painted into the static tile cache instead of the frame
  // buffer. PERF: this pass used to run over the viewport every single frame —
  // one getTile + one fillRect per air tile, thousands of times a second for
  // scenery that never moves. It is identical work, done ~8x less often, and it
  // composites in the same order (walls first, tiles on top).
  paintWalls(ctx, originX, originY, cw, ch) {
    const T = TILE_SIZE;
    for (let y = originY; y < originY + ch; y++) {
      const rowBase = y * this.width;
      const sy = (y - originY) * T;
      for (let x = originX; x < originX + cw; x++) {
        const wall = this.walls[rowBase + x];
        if (!wall || this.tiles[rowBase + x] !== TILES.AIR) continue;
        const sx = (x - originX) * T;
        ctx.fillStyle = wall === HOUSE_WALL ? '#171c24' : wall === TILES.STONE ? '#262626' : '#2d1e12';
        ctx.fillRect(sx, sy, T, T);
        if (wall === HOUSE_WALL) {
          ctx.strokeStyle = 'rgba(100, 116, 139, 0.24)';
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(sx, sy + T - 1);
          ctx.lineTo(sx + T, sy + T - 1);
          ctx.moveTo(sx + ((x + y) % 2) * 12, sy);
          ctx.lineTo(sx + ((x + y) % 2) * 12, sy + T);
          ctx.stroke();
        }
      }
    }
  }

  rebuildTileCache(minTileX, minTileY, cw, ch, sunKey) {
    let cache = this._tileCache;
    if (!cache || !cache.canvas) {
      cache = this._tileCache = {};
      cache.canvas = document.createElement('canvas');
    }
    cache.canvas.width = cw * TILE_SIZE;
    cache.canvas.height = ch * TILE_SIZE;
    const cctx = cache.canvas.getContext('2d');
    cctx.imageSmoothingEnabled = false;
    cctx.clearRect(0, 0, cache.canvas.width, cache.canvas.height);
    // Walls go down first, exactly where the old per-frame wall pass drew them.
    this.paintWalls(cctx, minTileX, minTileY, cw, ch);
    const sun = this.sunShade();
    sun._topStyle = `rgba(${sun.warm[0]},${sun.warm[1]},${sun.warm[2]},${(sun.top * sun.a * 8).toFixed(3)})`;
    sun._sideStyle = `rgba(${sun.warm[0]},${sun.warm[1]},${sun.warm[2]},${Math.max(sun.lx, sun.rx).toFixed(3)})`;
    this._cachedSun = sun;
    // Pre-resolve solid flags for chunk + 1 border: AO becomes 1 lookup
    // instead of 8 getTile() calls per tile.
    const bw = cw + 2;
    const bh = ch + 2;
    const solid = new Uint8Array(bw * bh);
    for (let y = 0; y < bh; y++) {
      for (let x = 0; x < bw; x++) {
        const tl = this.getTile(minTileX + x - 1, minTileY + y - 1);
        const p = TILE_PROPERTIES[tl];
        solid[y * bw + x] = (p && p.solid) ? 1 : 0;
      }
    }
    // Pre-resolve whether each tile in the chunk (plus its top border) is air.
    // "Is there air directly above me?" is what turns a flat block into an
    // actual ground surface, and reading it from a pre-built bit grid avoids a
    // getTile() per tile in the inner loop.
    const openAir = new Uint8Array(bw * bh);
    for (let y = 0; y < bh; y++) {
      for (let x = 0; x < bw; x++) {
        openAir[y * bw + x] = this.getTile(minTileX + x - 1, minTileY + y - 1) === TILES.AIR ? 1 : 0;
      }
    }

    for (let y = minTileY; y < minTileY + ch; y++) {
      for (let x = minTileX; x < minTileX + cw; x++) {
        const tile = this.tiles[y * this.width + x];
        if (tile === TILES.AIR) continue;
        const lx = x - minTileX + 1;
        const ly = y - minTileY + 1;
        const buried = solid[ly * bw + lx - 1] && solid[ly * bw + lx + 1] &&
          solid[(ly - 1) * bw + lx] && solid[(ly + 1) * bw + lx];
        const sx = (x - minTileX) * TILE_SIZE;
        const sy = (y - minTileY) * TILE_SIZE;
        // Exposed to the sky: gets a lit top edge and biome grass.
        const exposedTop = openAir[(ly - 1) * bw + lx] === 1;
        this.drawTileGraphic(cctx, tile, sx, sy, x, y, exposedTop);
        // Buried tiles are invisible: flat base only, skip all overlays.
        if (buried || this.isAnimatedTile(tile)) continue;
        const depth = Math.max(0, Math.min(1, (y - this.surfaceHeights[x]) / 40));
        if (depth > 0.02) {
          cctx.fillStyle = `rgba(2,2,14,${(depth * 0.35).toFixed(2)})`;
          cctx.fillRect(sx, sy, TILE_SIZE, TILE_SIZE);
        }
        this.shadeEdgesFast(cctx, sx, sy, lx, ly, bw, solid);
        // Sunlit rim along any upward-facing solid edge. This is what makes the
        // terrain read as lit from the sky rather than as a flat silhouette.
        if (exposedTop && !buried) {
          cctx.fillStyle = 'rgba(255, 250, 220, 0.16)';
          cctx.fillRect(sx, sy, TILE_SIZE, 1);
        }
        this.applyTileLightFast(cctx, sx, sy, sun);
      }
    }
    cache.w = cw; cache.h = ch;
    cache.tx = minTileX; cache.ty = minTileY;
    cache.sun = sunKey;
  }

  // Fast AO using the pre-resolved solid grid (no getTile calls).
  shadeEdgesFast(ctx, sx, sy, lx, ly, bw, solid) {
    const S = TILE_SIZE;
    const at = (x, y) => solid[y * bw + x];
    if (at(lx, ly - 1)) { ctx.fillStyle = 'rgba(0,0,0,0.30)'; ctx.fillRect(sx, sy, S, 4); }
    else { ctx.fillStyle = 'rgba(255,255,255,0.10)'; ctx.fillRect(sx, sy, S, 2); }
    if (at(lx, ly + 1)) { ctx.fillStyle = 'rgba(0,0,0,0.34)'; ctx.fillRect(sx, sy + S - 4, S, 4); }
    if (at(lx - 1, ly)) { ctx.fillStyle = 'rgba(0,0,0,0.26)'; ctx.fillRect(sx, sy, 4, S); }
    if (at(lx + 1, ly)) { ctx.fillStyle = 'rgba(0,0,0,0.26)'; ctx.fillRect(sx + S - 4, sy, 4, S); }
    if (!at(lx - 1, ly) && !at(lx, ly - 1) && at(lx - 1, ly - 1)) {
      ctx.fillStyle = 'rgba(0,0,0,0.30)'; ctx.fillRect(sx, sy, 4, 4);
    }
    if (!at(lx + 1, ly) && !at(lx, ly - 1) && at(lx + 1, ly - 1)) {
      ctx.fillStyle = 'rgba(0,0,0,0.30)'; ctx.fillRect(sx + S - 4, sy, 4, 4);
    }
  }

  // Sun wash with precomputed styles (no sunShade() call per tile).
  applyTileLightFast(ctx, sx, sy, sun) {
    const S = TILE_SIZE;
    if (sun.top > 0) { ctx.fillStyle = sun._topStyle; ctx.fillRect(sx, sy, S, 3); }
    if (sun.lx > 0) { ctx.fillStyle = sun._sideStyle; ctx.fillRect(sx, sy, 3, S); }
    if (sun.rx > 0) { ctx.fillStyle = sun._sideStyle; ctx.fillRect(sx + S - 3, sy, 3, S); }
    if (sun.night) { ctx.fillStyle = 'rgba(40,60,160,0.08)'; ctx.fillRect(sx, sy, S, S); }
  }

  drawTileGraphic(ctx, tile, sx, sy, tx, ty, exposedTop = false) {
    switch (tile) {
      case TILES.GRASS: {
        if (exposedTop) {
          // A real ground surface: soil body, a lit grass cap, hanging tufts and
          // a bright highlight line. This is what the player walks on all game,
          // so it gets the most detail of any tile in the world.
          ctx.fillStyle = '#593a1e';
          ctx.fillRect(sx, sy, TILE_SIZE, TILE_SIZE);
          // Speckled soil so the body is not a flat slab.
          ctx.fillStyle = '#422813';
          ctx.fillRect(sx + 4, sy + 14, 4, 4);
          ctx.fillRect(sx + 15, sy + 20, 5, 4);
          ctx.fillStyle = '#6b4623';
          ctx.fillRect(sx + 12, sy + 17, 3, 3);

          // Grass cap, slightly overhanging so it reads as a living edge.
          ctx.fillStyle = '#2f9e52';
          ctx.fillRect(sx, sy, TILE_SIZE, 8);
          ctx.fillStyle = '#38b764';
          ctx.fillRect(sx, sy, TILE_SIZE, 6);
          // Warm sunlit top line.
          ctx.fillStyle = '#86efac';
          ctx.fillRect(sx, sy, TILE_SIZE, 2);

          // Tufts hang unevenly into the soil — the classic pixel-art tell that
          // grass is growing rather than painted on.
          ctx.fillStyle = '#22c55e';
          ctx.fillRect(sx + 1, sy + 6, 4, 4);
          ctx.fillRect(sx + 7, sy + 6, 3, 6);
          ctx.fillRect(sx + 12, sy + 6, 5, 3);
          ctx.fillRect(sx + 19, sy + 6, 4, 5);
          // Occasional taller blade catching the light.
          if ((tx * 7 + ty * 13) % 3 === 0) {
            ctx.fillStyle = '#4ade80';
            ctx.fillRect(sx + 9, sy - 2, 2, 3);
            ctx.fillRect(sx + 16, sy - 1, 2, 2);
          }
        } else {
          // Grass underground (placed by the player, or a buried rim): just the
          // green block, so a built wall never sprouts a fake lawn.
          ctx.fillStyle = '#593a1e';
          ctx.fillRect(sx, sy, TILE_SIZE, TILE_SIZE);
          ctx.fillStyle = '#38b764';
          ctx.fillRect(sx, sy, TILE_SIZE, 7);
          ctx.fillStyle = '#22c55e';
          ctx.fillRect(sx + 2, sy + 7, 4, 3);
          ctx.fillRect(sx + 10, sy + 7, 5, 4);
          ctx.fillRect(sx + 18, sy + 7, 4, 2);
          ctx.fillStyle = '#86efac';
          ctx.fillRect(sx, sy, TILE_SIZE, 2);
        }
        break;
      }
      case TILES.DIRT: {
        ctx.fillStyle = '#593a1e';
        ctx.fillRect(sx, sy, TILE_SIZE, TILE_SIZE);
        // Dirt noise specks
        ctx.fillStyle = '#422813';
        ctx.fillRect(sx + 3, sy + 4, 4, 4);
        ctx.fillRect(sx + 14, sy + 12, 5, 4);
        ctx.fillStyle = '#784d28';
        ctx.fillRect(sx + 11, sy + 2, 4, 3);
        break;
      }
      case TILES.STONE: {
        ctx.fillStyle = '#64748b';
        ctx.fillRect(sx, sy, TILE_SIZE, TILE_SIZE);
        // Dark stone bevels
        ctx.fillStyle = '#475569';
        ctx.fillRect(sx + 2, sy + 2, 8, 8);
        ctx.fillRect(sx + 12, sy + 11, 10, 10);
        ctx.fillStyle = '#94a3b8';
        ctx.fillRect(sx, sy, TILE_SIZE, 1);
        ctx.fillRect(sx, sy, 1, TILE_SIZE);
        break;
      }
      case TILES.WOOD: {
        ctx.fillStyle = '#92400e';
        ctx.fillRect(sx, sy, TILE_SIZE, TILE_SIZE);
        // Tree bark lines
        ctx.fillStyle = '#78350f';
        ctx.fillRect(sx + 4, sy, 3, TILE_SIZE);
        ctx.fillRect(sx + 14, sy, 4, TILE_SIZE);
        ctx.fillStyle = '#b45309';
        ctx.fillRect(sx + 8, sy, 2, TILE_SIZE);
        break;
      }
      case TILES.LEAVES: {
        ctx.fillStyle = '#15803d';
        ctx.fillRect(sx, sy, TILE_SIZE, TILE_SIZE);
        ctx.fillStyle = '#16a34a';
        ctx.fillRect(sx + 3, sy + 2, 8, 8);
        ctx.fillRect(sx + 13, sy + 12, 7, 7);
        ctx.fillStyle = '#4ade80';
        ctx.fillRect(sx + 5, sy + 4, 3, 3);
        break;
      }
      case TILES.WOOD_PLATFORM: {
        ctx.fillStyle = '#b45309';
        ctx.fillRect(sx, sy, TILE_SIZE, 8);
        ctx.fillStyle = '#f59e0b';
        ctx.fillRect(sx, sy, TILE_SIZE, 2);
        ctx.fillStyle = '#78350f';
        ctx.fillRect(sx, sy + 6, TILE_SIZE, 2);
        // Supports
        ctx.fillRect(sx + 2, sy + 8, 3, 6);
        ctx.fillRect(sx + TILE_SIZE - 5, sy + 8, 3, 6);
        break;
      }
      case TILES.WOOD_STAIRS: {
        ctx.fillStyle = '#78350f';
        ctx.fillRect(sx, sy, TILE_SIZE, TILE_SIZE);
        ctx.fillStyle = '#b45309';
        ctx.beginPath();
        ctx.moveTo(sx, sy + TILE_SIZE);
        ctx.lineTo(sx, sy + 4);
        ctx.lineTo(sx + TILE_SIZE, sy);
        ctx.lineTo(sx + TILE_SIZE, sy + TILE_SIZE);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = '#f59e0b';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(sx + 4, sy + TILE_SIZE - 2);
        ctx.lineTo(sx + TILE_SIZE - 4, sy + 4);
        ctx.stroke();
        break;
      }
      case TILES.IRON_ORE: {
        ctx.fillStyle = '#64748b';
        ctx.fillRect(sx, sy, TILE_SIZE, TILE_SIZE);
        // Metallic sheen deposits
        ctx.fillStyle = '#cbd5e1';
        ctx.fillRect(sx + 4, sy + 5, 6, 6);
        ctx.fillRect(sx + 13, sy + 12, 5, 5);
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(sx + 5, sy + 6, 2, 2);
        break;
      }
      case TILES.GOLD_ORE: {
        ctx.fillStyle = '#64748b';
        ctx.fillRect(sx, sy, TILE_SIZE, TILE_SIZE);
        // Golden veins
        ctx.fillStyle = '#f59e0b';
        ctx.fillRect(sx + 3, sy + 4, 7, 6);
        ctx.fillRect(sx + 12, sy + 11, 7, 6);
        ctx.fillStyle = '#fef08a';
        ctx.fillRect(sx + 4, sy + 5, 3, 3);
        ctx.fillRect(sx + 14, sy + 12, 3, 3);
        break;
      }
      case TILES.DIAMOND_ORE: {
        ctx.fillStyle = '#172554';
        ctx.fillRect(sx, sy, TILE_SIZE, TILE_SIZE);
        ctx.shadowColor = '#22d3ee';
        ctx.shadowBlur = 8;
        ctx.fillStyle = '#22d3ee';
        ctx.beginPath();
        ctx.moveTo(sx + 3, sy + 14);
        ctx.lineTo(sx + 7, sy + 5);
        ctx.lineTo(sx + 13, sy + 3);
        ctx.lineTo(sx + 20, sy + 9);
        ctx.lineTo(sx + 17, sy + 19);
        ctx.lineTo(sx + 9, sy + 21);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = '#e0f2fe';
        ctx.fillRect(sx + 8, sy + 6, 4, 3);
        ctx.fillRect(sx + 14, sy + 10, 3, 4);
        ctx.shadowBlur = 0;
        break;
      }
      case TILES.LAVA: {
        const wave = Math.sin(Date.now() * 0.004 + tx * 1.7) * 2;
        ctx.fillStyle = '#9a3412';
        ctx.fillRect(sx, sy, TILE_SIZE, TILE_SIZE);
        ctx.fillStyle = '#f97316';
        ctx.fillRect(sx, sy + 4 + wave, TILE_SIZE, TILE_SIZE - 4);
        ctx.fillStyle = '#facc15';
        ctx.fillRect(sx + 3, sy + 7 + wave, 7, 2);
        ctx.fillRect(sx + 15, sy + 15 - wave, 5, 2);
        break;
      }
      case TILES.TORCH: {
        // Wooden stick
        ctx.fillStyle = '#78350f';
        ctx.fillRect(sx + 10, sy + 8, 4, 14);
        // Flame
        const flicker = Math.sin(Date.now() * 0.02 + tx * 3) * 2;
        ctx.fillStyle = '#ef4444';
        ctx.beginPath();
        ctx.arc(sx + 12, sy + 8 + flicker * 0.3, 6, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#fbbf24';
        ctx.beginPath();
        ctx.arc(sx + 12, sy + 8 + flicker * 0.3, 3.5, 0, Math.PI * 2);
        ctx.fill();
        break;
      }
      case TILES.CAMPFIRE: {
        // Logs
        ctx.fillStyle = '#78350f';
        ctx.fillRect(sx + 2, sy + 16, 20, 6);
        ctx.fillStyle = '#451a03';
        ctx.fillRect(sx + 4, sy + 12, 16, 5);
        // Big warm fire
        const f = Math.sin(Date.now() * 0.015) * 3;
        ctx.fillStyle = '#f97316';
        ctx.beginPath();
        ctx.arc(sx + 12, sy + 10 + f * 0.4, 10, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#fef08a';
        ctx.beginPath();
        ctx.arc(sx + 12, sy + 11 + f * 0.4, 5, 0, Math.PI * 2);
        ctx.fill();
        break;
      }
      case TILES.CHEST: {
        ctx.fillStyle = '#d97706';
        ctx.fillRect(sx + 2, sy + 6, 20, 16);
        ctx.fillStyle = '#92400e';
        ctx.fillRect(sx + 2, sy + 11, 20, 2);
        // Lock
        ctx.fillStyle = '#fef08a';
        ctx.fillRect(sx + 10, sy + 10, 4, 5);
        break;
      }
      case TILES.CHEST_OPEN: {
        ctx.fillStyle = '#92400e';
        ctx.fillRect(sx + 2, sy + 13, 20, 9);
        ctx.fillStyle = '#f59e0b';
        ctx.fillRect(sx + 2, sy + 4, 20, 7);
        ctx.fillStyle = '#fef08a';
        ctx.fillRect(sx + 10, sy + 11, 4, 4);
        break;
      }
      case TILES.BED: {
        ctx.fillStyle = '#78350f';
        ctx.fillRect(sx + 1, sy + 15, 21, 6);
        ctx.fillStyle = '#60a5fa';
        ctx.fillRect(sx + 3, sy + 8, 15, 8);
        ctx.fillStyle = '#dbeafe';
        ctx.fillRect(sx + 4, sy + 9, 7, 5);
        ctx.fillStyle = '#451a03';
        ctx.fillRect(sx + 2, sy + 20, 3, 4);
        ctx.fillRect(sx + 18, sy + 20, 3, 4);
        break;
      }
      case TILES.CRYSTAL: {
        ctx.fillStyle = '#164e63';
        ctx.fillRect(sx, sy, TILE_SIZE, TILE_SIZE);
        ctx.fillStyle = '#67e8f9';
        ctx.beginPath();
        ctx.moveTo(sx + 5, sy + 20);
        ctx.lineTo(sx + 9, sy + 4);
        ctx.lineTo(sx + 13, sy + 16);
        ctx.lineTo(sx + 17, sy + 2);
        ctx.lineTo(sx + 20, sy + 21);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = '#cffafe';
        ctx.fillRect(sx + 9, sy + 7, 2, 7);
        ctx.fillRect(sx + 17, sy + 5, 2, 8);
        break;
      }
      case TILES.SNOW: {
        ctx.fillStyle = '#e0f2fe';
        ctx.fillRect(sx, sy, TILE_SIZE, TILE_SIZE);
        if (exposedTop) {
          // Snow surface: a bright wind-packed cap with soft blue shadow
          // underneath and a couple of glints.
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(sx, sy, TILE_SIZE, 5);
          ctx.fillStyle = 'rgba(125, 211, 252, 0.55)';
          ctx.fillRect(sx, sy + 5, TILE_SIZE, 2);
          ctx.fillStyle = '#f0f9ff';
          ctx.fillRect(sx + 3, sy + 2, 5, 2);
          ctx.fillRect(sx + 17, sy + 3, 4, 2);
          // Drifted lip that rises just above the block line.
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(sx + 6, sy - 2, 5, 2);
          ctx.fillRect(sx + 15, sy - 1, 4, 1);
        } else {
          ctx.fillStyle = '#bae6fd';
          ctx.fillRect(sx + 3, sy + 5, 4, 3);
          ctx.fillRect(sx + 15, sy + 14, 5, 3);
        }
        break;
      }
      case TILES.SAND: {
        ctx.fillStyle = '#facc15';
        ctx.fillRect(sx, sy, TILE_SIZE, TILE_SIZE);
        if (exposedTop) {
          // Sunlit dune crest: pale highlight, grain speckle, wind ripple lines.
          ctx.fillStyle = '#fde68a';
          ctx.fillRect(sx, sy, TILE_SIZE, 4);
          ctx.fillStyle = '#fbbf24';
          ctx.fillRect(sx, sy + 4, TILE_SIZE, 2);
          ctx.fillStyle = 'rgba(180, 83, 9, 0.28)';
          ctx.fillRect(sx + 2, sy + 9, 9, 1);
          ctx.fillRect(sx + 12, sy + 14, 8, 1);
          ctx.fillRect(sx + 5, sy + 19, 7, 1);
          ctx.fillStyle = '#fef3c7';
          ctx.fillRect(sx + 6, sy + 2, 3, 1);
          ctx.fillRect(sx + 14, sy + 1, 4, 1);
        } else {
          ctx.fillStyle = '#eab308';
          ctx.fillRect(sx + 4, sy + 5, 2, 2);
          ctx.fillRect(sx + 15, sy + 15, 2, 2);
        }
        break;
      }
      case TILES.MUD: {
        ctx.fillStyle = '#365314';
        ctx.fillRect(sx, sy, TILE_SIZE, TILE_SIZE);
        if (exposedTop) {
          // Wet swamp muck: darker, glossier cap with moss and a damp sheen.
          ctx.fillStyle = '#27400a';
          ctx.fillRect(sx, sy, TILE_SIZE, 6);
          ctx.fillStyle = 'rgba(190, 242, 100, 0.35)';
          ctx.fillRect(sx, sy + 1, TILE_SIZE, 1);
          ctx.fillStyle = '#4d7c0f';
          ctx.fillRect(sx + 2, sy + 6, 4, 3);
          ctx.fillRect(sx + 13, sy + 6, 5, 2);
          ctx.fillStyle = 'rgba(56, 189, 248, 0.22)';
          ctx.fillRect(sx + 8, sy + 11, 6, 2);
        } else {
          ctx.fillStyle = '#4d7c0f';
          ctx.fillRect(sx + 4, sy + 6, 5, 3);
          ctx.fillRect(sx + 14, sy + 16, 4, 3);
          ctx.fillStyle = '#1a2e05';
          ctx.fillRect(sx + 8, sy + 10, 3, 3);
        }
        break;
      }
      case TILES.STONE_BRICK: {
        ctx.fillStyle = '#64748b';
        ctx.fillRect(sx, sy, TILE_SIZE, TILE_SIZE);
        ctx.fillStyle = '#334155';
        ctx.fillRect(sx, sy + 11, TILE_SIZE, 2);
        ctx.fillRect(sx + 11, sy, 2, 11);
        ctx.fillRect(sx + 5, sy + 13, 2, 11);
        break;
      }
      case TILES.RAINBOW_ORE: {
        // Stone matrix shot through with slowly shifting rainbow flecks.
        ctx.fillStyle = '#64748b';
        ctx.fillRect(sx, sy, TILE_SIZE, TILE_SIZE);
        const rh = Math.floor(Date.now() * 0.06) % 360;
        ctx.fillStyle = `hsl(${rh}, 95%, 62%)`;
        ctx.fillRect(sx + 4, sy + 5, 5, 5);
        ctx.fillStyle = `hsl(${(rh + 72) % 360}, 95%, 62%)`;
        ctx.fillRect(sx + 14, sy + 4, 5, 5);
        ctx.fillStyle = `hsl(${(rh + 144) % 360}, 95%, 62%)`;
        ctx.fillRect(sx + 8, sy + 13, 5, 5);
        ctx.fillStyle = `hsl(${(rh + 216) % 360}, 95%, 62%)`;
        ctx.fillRect(sx + 16, sy + 15, 4, 4);
        ctx.fillStyle = `hsl(${(rh + 288) % 360}, 95%, 72%)`;
        ctx.fillRect(sx + 3, sy + 16, 3, 3);
        break;
      }
      case TILES.ALTAR: {
        // Cursed pedestal + knight statue (draws upward into the tile above).
        const altarT = Date.now() * 0.0025;
        const altarPulse = 0.55 + Math.abs(Math.sin(altarT)) * 0.45;

        // Rune circle the statue stands in, gently breathing in the dark.
        ctx.save();
        ctx.globalAlpha = 0.22 + altarPulse * 0.28;
        ctx.strokeStyle = '#a855f7';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.ellipse(sx + 12, sy + 17, 20, 6, 0, 0, Math.PI * 2);
        ctx.stroke();
        ctx.globalAlpha *= 0.7;
        ctx.beginPath();
        ctx.ellipse(sx + 12, sy + 17, 13, 4, 0, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();

        // Weather-beaten plinth: recessed base, chipped cap, engraved plaque.
        ctx.fillStyle = '#1e293b';
        ctx.fillRect(sx, sy + 20, 24, 4);
        ctx.fillStyle = '#334155';
        ctx.fillRect(sx + 1, sy + 12, 22, 10);
        ctx.fillStyle = '#475569';
        ctx.fillRect(sx + 1, sy + 12, 22, 2);
        ctx.fillStyle = '#64748b';
        ctx.fillRect(sx + 3, sy + 10, 18, 4);
        // Chipped corners on the cap.
        ctx.fillStyle = '#334155';
        ctx.fillRect(sx + 3, sy + 10, 2, 1);
        ctx.fillRect(sx + 19, sy + 10, 2, 1);
        // Engraved epitaph lit faintly by the curse.
        ctx.save();
        ctx.globalAlpha = 0.5 + altarPulse * 0.5;
        ctx.fillStyle = '#c4b5fd';
        for (let i = 0; i < 4; i++) ctx.fillRect(sx + 5 + i * 4, sy + 15, 2, 1.5);
        ctx.restore();

        // Robed legs, torso, belt
        ctx.fillStyle = '#7c8798';
        ctx.fillRect(sx + 8, sy - 6, 8, 18);
        // Weather streaks down the robe.
        ctx.fillStyle = '#6b7686';
        ctx.fillRect(sx + 9, sy - 2, 1, 13);
        ctx.fillRect(sx + 14, sy - 4, 1, 12);
        ctx.fillStyle = '#94a3b8';
        ctx.fillRect(sx + 6, sy - 22, 12, 17);
        ctx.fillStyle = '#64748b';
        ctx.fillRect(sx + 6, sy - 12, 12, 3);
        // Sash across the stone chest.
        ctx.fillStyle = '#4c1d95';
        ctx.beginPath();
        ctx.moveTo(sx + 6, sy - 18);
        ctx.lineTo(sx + 18, sy - 21);
        ctx.lineTo(sx + 18, sy - 19);
        ctx.lineTo(sx + 6, sy - 16);
        ctx.closePath();
        ctx.fill();
        // Pauldrons with a hint of spikes.
        ctx.fillStyle = '#b6c2d2';
        ctx.fillRect(sx + 4, sy - 21, 4, 7);
        ctx.fillRect(sx + 16, sy - 21, 4, 7);
        ctx.fillStyle = '#cbd5e1';
        ctx.beginPath(); ctx.moveTo(sx + 4, sy - 21); ctx.lineTo(sx + 1, sy - 25); ctx.lineTo(sx + 6, sy - 21); ctx.closePath(); ctx.fill();
        ctx.beginPath(); ctx.moveTo(sx + 20, sy - 21); ctx.lineTo(sx + 23, sy - 25); ctx.lineTo(sx + 18, sy - 21); ctx.closePath(); ctx.fill();

        // Helmet with horns and a visor full of waiting light.
        ctx.fillStyle = '#cbd5e1';
        ctx.fillRect(sx + 7, sy - 32, 10, 11);
        ctx.fillStyle = '#64748b';
        ctx.fillRect(sx + 7, sy - 32, 10, 3);
        ctx.fillStyle = '#b6c2d2';
        ctx.beginPath(); ctx.moveTo(sx + 7, sy - 30); ctx.lineTo(sx + 3, sy - 35); ctx.lineTo(sx + 8, sy - 32); ctx.closePath(); ctx.fill();
        ctx.beginPath(); ctx.moveTo(sx + 17, sy - 30); ctx.lineTo(sx + 21, sy - 35); ctx.lineTo(sx + 16, sy - 32); ctx.closePath(); ctx.fill();

        // Greatsword planted point-down beside it, runed and glowing faintly.
        ctx.fillStyle = '#475569';
        ctx.fillRect(sx + 19, sy - 26, 3, 30);
        ctx.fillStyle = '#94a3b8';
        ctx.fillRect(sx + 19, sy - 26, 1, 30);
        ctx.fillStyle = '#334155';
        ctx.fillRect(sx + 17, sy - 3, 7, 3);
        ctx.save();
        ctx.globalAlpha = 0.35 + altarPulse * 0.45;
        ctx.fillStyle = '#c084fc';
        ctx.fillRect(sx + 20, sy - 22, 1, 14);
        ctx.fillRect(sx + 20, sy - 15, 2.5, 1);
        ctx.restore();

        // Glowing eyes — the curse waiting to wake. Drawn last, so the halo sits
        // on top of the helm instead of behind it.
        ctx.save();
        ctx.shadowColor = '#a855f7';
        ctx.shadowBlur = 10 * altarPulse;
        ctx.fillStyle = `rgba(196, 181, 253, ${altarPulse.toFixed(2)})`;
        ctx.fillRect(sx + 9, sy - 27, 2, 2);
        ctx.fillRect(sx + 13, sy - 27, 2, 2);
        // Slow pulse halo growing out of the statue's head.
        ctx.globalAlpha = 0.14 + altarPulse * 0.16;
        ctx.fillStyle = '#7e22ce';
        ctx.beginPath();
        ctx.arc(sx + 12, sy - 27, 13 + altarPulse * 5, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
        break;
      }
      case TILES.GLASS: {
        ctx.fillStyle = 'rgba(186, 230, 253, 0.48)';
        ctx.fillRect(sx, sy, TILE_SIZE, TILE_SIZE);
        ctx.strokeStyle = '#e0f2fe';
        ctx.strokeRect(sx + 1, sy + 1, TILE_SIZE - 2, TILE_SIZE - 2);
        break;
      }
      case TILES.SNOW_PINE_LEAVES: {
        ctx.fillStyle = '#dbeafe';
        ctx.fillRect(sx, sy, TILE_SIZE, TILE_SIZE);
        ctx.fillStyle = '#93c5fd';
        ctx.fillRect(sx + 3, sy + 5, 7, 3);
        ctx.fillRect(sx + 14, sy + 14, 6, 3);
        break;
      }
      case TILES.ACACIA_LEAVES: {
        ctx.fillStyle = '#84cc16';
        ctx.fillRect(sx, sy, TILE_SIZE, TILE_SIZE);
        ctx.fillStyle = '#bef264';
        ctx.fillRect(sx + 4, sy + 3, 5, 4);
        ctx.fillRect(sx + 15, sy + 13, 4, 4);
        break;
      }
      case TILES.MANGROVE_LEAVES: {
        ctx.fillStyle = '#0f766e';
        ctx.fillRect(sx, sy, TILE_SIZE, TILE_SIZE);
        ctx.fillStyle = '#2dd4bf';
        ctx.fillRect(sx + 3, sy + 5, 6, 3);
        ctx.fillRect(sx + 14, sy + 14, 5, 3);
        break;
      }
      // ---- Water & biome dressing (all chunky Terraria-style rects) ----
      case TILES.WATER: {
        ctx.fillStyle = '#0c4a6e';
        ctx.fillRect(sx, sy, TILE_SIZE, TILE_SIZE);
        ctx.fillStyle = '#38bdf8';
        ctx.fillRect(sx, sy, TILE_SIZE, TILE_SIZE);
        ctx.fillStyle = '#bae6fd';
        ctx.fillRect(sx, sy, TILE_SIZE, 3);
        ctx.fillStyle = '#0284c7';
        const bob = 3 + Math.floor(((tx * 7 + ty * 3) % 5 + 5) % 5);
        ctx.fillRect(sx + 2, sy + 8 + bob, 7, 2);
        ctx.fillRect(sx + 13, sy + 14 - bob, 8, 2);
        ctx.fillStyle = 'rgba(255,255,255,0.5)';
        ctx.fillRect(sx + 5, sy + 1, 3, 2);
        break;
      }
      case TILES.MOSSY_STONE: {
        ctx.fillStyle = '#64748b';
        ctx.fillRect(sx, sy, TILE_SIZE, TILE_SIZE);
        ctx.fillStyle = '#475569';
        ctx.fillRect(sx + 2, sy + 2, 8, 8);
        ctx.fillRect(sx + 12, sy + 11, 10, 10);
        ctx.fillStyle = '#4d7c0f';
        ctx.fillRect(sx, sy, TILE_SIZE, 5);
        ctx.fillRect(sx + 6, sy + 5, 4, 3);
        ctx.fillRect(sx + 15, sy + 4, 5, 4);
        ctx.fillStyle = '#84cc16';
        ctx.fillRect(sx + 2, sy + 1, 4, 2);
        break;
      }
      case TILES.FROSTBRICK: {
        ctx.fillStyle = '#93a7d4';
        ctx.fillRect(sx, sy, TILE_SIZE, TILE_SIZE);
        ctx.fillStyle = '#64748b';
        ctx.fillRect(sx, sy + 11, TILE_SIZE, 2);
        ctx.fillRect(sx + 11, sy, 2, 11);
        ctx.fillRect(sx + 5, sy + 13, 2, 11);
        ctx.fillStyle = '#e0f2fe';
        ctx.fillRect(sx, sy, TILE_SIZE, 3);
        ctx.fillRect(sx + 16, sy + 14, 5, 4);
        break;
      }
      case TILES.SANDSTONE: {
        ctx.fillStyle = '#d97706';
        ctx.fillRect(sx, sy, TILE_SIZE, TILE_SIZE);
        ctx.fillStyle = '#92400e';
        ctx.fillRect(sx, sy + 7, TILE_SIZE, 2);
        ctx.fillRect(sx, sy + 16, TILE_SIZE, 2);
        ctx.fillStyle = '#fbbf24';
        ctx.fillRect(sx + 3, sy + 3, 6, 3);
        ctx.fillRect(sx + 13, sy + 11, 7, 3);
        break;
      }
      case TILES.CACTUS: {
        ctx.fillStyle = '#365314';
        ctx.fillRect(sx + 8, sy, 8, TILE_SIZE);
        ctx.fillStyle = '#4d7c0f';
        ctx.fillRect(sx + 9, sy, 6, TILE_SIZE);
        ctx.fillStyle = '#84cc16';
        ctx.fillRect(sx + 10, sy + 1, 2, TILE_SIZE - 2);
        // Arms
        ctx.fillStyle = '#4d7c0f';
        ctx.fillRect(sx + 3, sy + 10, 6, 4);
        ctx.fillRect(sx + 3, sy + 6, 4, 6);
        ctx.fillRect(sx + 15, sy + 13, 6, 4);
        ctx.fillRect(sx + 17, sy + 9, 4, 6);
        // Spikes
        ctx.fillStyle = '#ecfccb';
        ctx.fillRect(sx + 9, sy + 4, 6, 1);
        ctx.fillRect(sx + 9, sy + 12, 6, 1);
        ctx.fillRect(sx + 9, sy + 19, 6, 1);
        break;
      }
      case TILES.LILY: {
        ctx.fillStyle = 'rgba(12, 74, 110, 0.6)';
        ctx.fillRect(sx, sy + 12, TILE_SIZE, 12);
        ctx.fillStyle = '#16a34a';
        ctx.fillRect(sx + 3, sy + 14, 18, 7);
        ctx.fillRect(sx + 3, sy + 14, 8, 7); // notch cut illusion
        ctx.fillStyle = '#0c4a6e';
        ctx.fillRect(sx + 3, sy + 14, 3, 7);
        ctx.fillStyle = '#f9a8d4';
        ctx.fillRect(sx + 10, sy + 8, 5, 6);
        ctx.fillStyle = '#fef3c7';
        ctx.fillRect(sx + 11, sy + 9, 3, 3);
        break;
      }
      case TILES.FLOWER: {
        ctx.fillStyle = '#166534';
        ctx.fillRect(sx + 11, sy + 10, 2, 14);
        ctx.fillStyle = '#4ade80';
        ctx.fillRect(sx + 6, sy + 16, 5, 3);
        const petal = ((tx * 5 + ty * 11) % 3 + 3) % 3;
        ctx.fillStyle = petal === 0 ? '#f472b6' : petal === 1 ? '#facc15' : '#c084fc';
        ctx.fillRect(sx + 8, sy + 4, 8, 7);
        ctx.fillRect(sx + 10, sy + 2, 4, 11);
        ctx.fillStyle = '#fff7ed';
        ctx.fillRect(sx + 10, sy + 6, 4, 4);
        break;
      }
      case TILES.TALL_GRASS: {
        ctx.fillStyle = '#166534';
        ctx.fillRect(sx + 4, sy + 10, 3, 14);
        ctx.fillRect(sx + 10, sy + 6, 3, 18);
        ctx.fillRect(sx + 16, sy + 12, 3, 12);
        ctx.fillStyle = '#4ade80';
        ctx.fillRect(sx + 4, sy + 8, 3, 4);
        ctx.fillRect(sx + 10, sy + 4, 3, 4);
        ctx.fillRect(sx + 16, sy + 10, 3, 4);
        break;
      }
      case TILES.SNOWBUSH: {
        ctx.fillStyle = '#7dd3fc';
        ctx.fillRect(sx + 5, sy + 14, 3, 10);
        ctx.fillRect(sx + 11, sy + 12, 3, 12);
        ctx.fillRect(sx + 16, sy + 15, 3, 9);
        ctx.fillStyle = '#f0f9ff';
        ctx.fillRect(sx + 4, sy + 11, 5, 5);
        ctx.fillRect(sx + 10, sy + 9, 5, 5);
        ctx.fillRect(sx + 15, sy + 12, 5, 5);
        break;
      }
      case TILES.ICICLE: {
        ctx.fillStyle = '#bae6fd';
        ctx.beginPath();
        ctx.moveTo(sx + 6, sy);
        ctx.lineTo(sx + 18, sy);
        ctx.lineTo(sx + 12, sy + TILE_SIZE);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = '#f0f9ff';
        ctx.fillRect(sx + 9, sy + 1, 3, 12);
        break;
      }

      // ============================================================
      // BUILDING SET — ten blocks drawn flat and tileable, because their whole
      // job is to sit next to copies of themselves without a visible seam.
      // `tx`/`ty` only show up where a repeated pattern needs an offset, so a
      // wall of one block never looks like one block repeated.
      // ============================================================
      case TILES.PLANKS: {
        // Four oak boards with staggered end-joints, so a wall of planks reads
        // as panelling rather than as stripes.
        ctx.fillStyle = '#b45309';
        ctx.fillRect(sx, sy, TILE_SIZE, TILE_SIZE);
        ctx.fillStyle = '#d97706';
        for (let row = 0; row < 4; row++) ctx.fillRect(sx, sy + row * 6 + 4, TILE_SIZE, 1);
        ctx.fillStyle = '#92400e';
        for (let row = 0; row < 4; row++) ctx.fillRect(sx, sy + row * 6 + 5, TILE_SIZE, 1);
        ctx.fillStyle = '#7c2d12';
        for (let row = 0; row < 4; row++) {
          const jx = ((row + tx + ty) % 2) ? sx + 7 : sx + 17;
          ctx.fillRect(jx, sy + row * 6, 2, 6);
        }
        ctx.fillStyle = 'rgba(120, 53, 15, 0.5)';
        ctx.fillRect(sx + 3, sy + 1, 4, 1);
        ctx.fillRect(sx + 14, sy + 13, 5, 1);
        break;
      }
      case TILES.COBBLESTONE: {
        // Rounded stones in mortar, three sizes, hashed so no two cobble tiles
        // repeat the same arrangement.
        ctx.fillStyle = '#57534e';
        ctx.fillRect(sx, sy, TILE_SIZE, TILE_SIZE);
        const cob = (tx * 13 + ty * 29) % 5;
        ctx.fillStyle = '#78716c';
        ctx.fillRect(sx + 2, sy + 2, 9, 8);
        ctx.fillRect(sx + 13, sy + 2, 9, 5);
        ctx.fillRect(sx + 7, sy + 12, 11, 9);
        ctx.fillStyle = '#a8a29e';
        ctx.fillRect(sx + 3, sy + 3, 6, 3);
        ctx.fillRect(sx + 14, sy + 3, 5, 2);
        ctx.fillRect(sx + 9, sy + 13, 6, 3);
        ctx.fillStyle = '#44403c';
        if (cob === 0) ctx.fillRect(sx + 17, sy + 9, 5, 3);
        else if (cob === 1) ctx.fillRect(sx + 1, sy + 10, 4, 3);
        else ctx.fillRect(sx + 2, sy + 20, 4, 2);
        break;
      }
      case TILES.BRICK_BLOCK: {
        // Four courses of offset brick in pale mortar.
        ctx.fillStyle = '#c9c1b6';
        ctx.fillRect(sx, sy, TILE_SIZE, TILE_SIZE);
        for (let row = 0; row < 4; row++) {
          const by = sy + row * 5 + row;
          const shift = ((row + tx + ty) % 2) ? 0 : 6;
          ctx.fillStyle = '#9f3a2f';
          for (let bx = -6; bx < TILE_SIZE; bx += 12) {
            ctx.fillRect(sx + bx + shift, by, 10, 5);
          }
        }
        // Highlight along the top of each brick course.
        ctx.fillStyle = '#b91c1c';
        for (let row = 0; row < 4; row++) {
          const by = sy + row * 5 + row;
          const shift = ((row + tx + ty) % 2) ? 0 : 6;
          for (let bx = -6; bx < TILE_SIZE; bx += 12) ctx.fillRect(sx + bx + shift, by, 10, 1);
        }
        break;
      }
      case TILES.POLISHED_STONE: {
        // Smooth slab with a bevelled edge: the quiet, expensive-looking block.
        ctx.fillStyle = '#a8b0bb';
        ctx.fillRect(sx, sy, TILE_SIZE, TILE_SIZE);
        ctx.fillStyle = '#cbd5e1';
        ctx.fillRect(sx, sy, TILE_SIZE, 2);
        ctx.fillRect(sx, sy, 2, TILE_SIZE);
        ctx.fillStyle = '#8892a0';
        ctx.fillRect(sx, sy + TILE_SIZE - 2, TILE_SIZE, 2);
        ctx.fillRect(sx + TILE_SIZE - 2, sy, 2, TILE_SIZE);
        // Faint vein, so a large floor is not a dead flat field.
        ctx.fillStyle = 'rgba(148, 163, 184, 0.6)';
        ctx.fillRect(sx + 4, sy + 8, 12, 1);
        ctx.fillRect(sx + 16, sy + 9, 2, 8);
        break;
      }
      case TILES.SANDSTONE_BRICK: {
        // Long, low blocks in the ashlar pattern sandstone actually cuts into.
        ctx.fillStyle = '#b08c48';
        ctx.fillRect(sx, sy, TILE_SIZE, TILE_SIZE);
        ctx.fillStyle = '#e0bf7a';
        ctx.fillRect(sx, sy, 11, 7);
        ctx.fillRect(sx + 13, sy, 11, 7);
        ctx.fillRect(sx + 5, sy + 9, 11, 7);
        ctx.fillRect(sx, sy + 18, 11, 6);
        ctx.fillRect(sx + 13, sy + 18, 11, 6);
        ctx.fillStyle = '#f3dea6';
        ctx.fillRect(sx, sy, 11, 1);
        ctx.fillRect(sx + 5, sy + 9, 11, 1);
        ctx.fillRect(sx + 13, sy + 18, 11, 1);
        break;
      }
      case TILES.HAY_BLOCK: {
        // Straw with two twine bands — reads instantly as a hay bale.
        ctx.fillStyle = '#d4a017';
        ctx.fillRect(sx, sy, TILE_SIZE, TILE_SIZE);
        ctx.fillStyle = '#a16207';
        for (let s = 0; s < 12; s++) {
          const hx = (s * 7 + tx * 3) % TILE_SIZE;
          ctx.fillRect(sx + hx, sy + 2, 1, TILE_SIZE - 4);
        }
        ctx.fillStyle = '#facc15';
        ctx.fillRect(sx, sy, TILE_SIZE, 2);
        ctx.fillStyle = '#7c2d12';
        ctx.fillRect(sx, sy + 6, TILE_SIZE, 2);
        ctx.fillRect(sx, sy + 16, TILE_SIZE, 2);
        break;
      }
      case TILES.WOOL_BLOCK: {
        ctx.fillStyle = '#e7e5e4';
        ctx.fillRect(sx, sy, TILE_SIZE, TILE_SIZE);
        ctx.fillStyle = '#fafaf9';
        ctx.fillRect(sx + 2, sy + 2, 8, 6);
        ctx.fillRect(sx + 13, sy + 11, 8, 7);
        ctx.fillStyle = '#d6d3d1';
        ctx.fillRect(sx + 12, sy + 3, 7, 5);
        ctx.fillRect(sx + 4, sy + 13, 7, 6);
        // Fluffed lower edge, so a wall of wool reads as soft.
        ctx.fillStyle = '#b8b4b1';
        ctx.fillRect(sx + 3, sy + 21, 4, 2);
        ctx.fillRect(sx + 15, sy + 20, 5, 2);
        break;
      }
      case TILES.ICE_BLOCK: {
        ctx.fillStyle = '#a5e8f5';
        ctx.fillRect(sx, sy, TILE_SIZE, TILE_SIZE);
        ctx.fillStyle = '#d8f6fd';
        ctx.fillRect(sx, sy, TILE_SIZE, 3);
        ctx.fillRect(sx, sy, 3, TILE_SIZE);
        // Interior fractures, hashed so a wall of ice is not the same pane twice.
        ctx.strokeStyle = 'rgba(240, 249, 255, 0.85)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        const crack = (tx * 7 + ty * 11) % 3;
        if (crack === 0) { ctx.moveTo(sx + 4, sy + 6); ctx.lineTo(sx + 14, sy + 15); ctx.lineTo(sx + 20, sy + 20); }
        else if (crack === 1) { ctx.moveTo(sx + 18, sy + 4); ctx.lineTo(sx + 9, sy + 13); ctx.lineTo(sx + 12, sy + 21); }
        else { ctx.moveTo(sx + 2, sy + 17); ctx.lineTo(sx + 11, sy + 9); ctx.lineTo(sx + 21, sy + 12); }
        ctx.stroke();
        ctx.fillStyle = 'rgba(56, 189, 248, 0.35)';
        ctx.fillRect(sx + 12, sy + 4, 8, 4);
        break;
      }
      case TILES.BOOKSHELF: {
        // Timber frame with two shelves of coloured spines.
        ctx.fillStyle = '#7c4a1e';
        ctx.fillRect(sx, sy, TILE_SIZE, TILE_SIZE);
        ctx.fillStyle = '#1c1917';
        ctx.fillRect(sx + 2, sy + 2, TILE_SIZE - 4, 8);
        ctx.fillRect(sx + 2, sy + 13, TILE_SIZE - 4, 9);
        const spines = ['#dc2626', '#2563eb', '#16a34a', '#d97706', '#7c3aed', '#0891b2'];
        for (let b = 0; b < 6; b++) {
          const bx = sx + 3 + b * 3;
          ctx.fillStyle = spines[(b + tx + ty) % spines.length];
          ctx.fillRect(bx, sy + 3, 2, 6);
          ctx.fillStyle = spines[(b + tx + ty + 3) % spines.length];
          ctx.fillRect(bx, sy + 14, 2, 7);
        }
        // Shelf boards and top/bottom rails.
        ctx.fillStyle = '#5b3413';
        ctx.fillRect(sx, sy + 10, TILE_SIZE, 3);
        ctx.fillStyle = '#92400e';
        ctx.fillRect(sx, sy, TILE_SIZE, 1);
        ctx.fillRect(sx, sy + TILE_SIZE - 1, TILE_SIZE, 1);
        break;
      }
      case TILES.LANTERN: {
        // A hung iron lantern: chain, ring, cage and a live flame. Drawn two
        // pixels above centre so it reads as hanging rather than resting.
        const lT = Date.now() * 0.004;
        const lPulse = 0.72 + Math.sin(lT + tx) * 0.16 + Math.sin(lT * 2.7 + ty) * 0.12;
        ctx.fillStyle = '#44403c';
        ctx.fillRect(sx + 11, sy + 1, 2, 4);
        ctx.strokeStyle = '#78716c';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(sx + 12, sy + 4, 3, 0, Math.PI * 2);
        ctx.stroke();
        // Glass body, faintly lit even before the flame goes on top of it.
        ctx.fillStyle = '#57534e';
        ctx.fillRect(sx + 6, sy + 7, 12, 2);
        ctx.fillStyle = 'rgba(251, 191, 36, 0.22)';
        ctx.fillRect(sx + 7, sy + 9, 10, 11);
        ctx.fillStyle = '#3f3f46';
        ctx.fillRect(sx + 6, sy + 9, 1, 11);
        ctx.fillRect(sx + 17, sy + 9, 1, 11);
        ctx.fillRect(sx + 6, sy + 20, 12, 2);
        // Flame.
        ctx.save();
        ctx.globalAlpha = lPulse;
        ctx.fillStyle = '#fb923c';
        ctx.fillRect(sx + 9, sy + 12, 6, 7);
        ctx.fillStyle = '#fbbf24';
        ctx.fillRect(sx + 10, sy + 13, 4, 5);
        ctx.fillStyle = '#fef3c7';
        ctx.fillRect(sx + 11, sy + 15, 2, 3);
        ctx.restore();
        break;
      }
    }
  }

  // Multiply lighting pass: gives Terraria its signature torch glow, dark undergrounds and scary nights!
  renderLighting(lightCtx, camera, player, entities) {
    const w = camera.viewportWidth;
    const h = camera.viewportHeight;

    // Base ambient light depends on Day/Night & depth
    let ambientLuminance = 1.0;
    if (this.isNight()) {
      ambientLuminance = 0.08; // deep dark night!
    } else {
      const t = this.timeOfDay;
      if (t < 0.2) {
        ambientLuminance = 0.4 + (t / 0.2) * 0.6;
      } else if (t > 0.5 && t < 0.6) {
        ambientLuminance = 1.0 - ((t - 0.5) / 0.1) * 0.85;
      } else {
        ambientLuminance = 1.0;
      }
    }

    // Fill dark mask on lighting canvas (warm at dusk, cold at night)
    lightCtx.clearRect(0, 0, w, h);
    const nightK = this.isNight() ? 1 : 0;
    const duskK = (!nightK && this.timeOfDay >= 0.5 && this.timeOfDay < 0.62) ? 1 : 0;
    const maskR = nightK ? 5 : duskK ? 34 : 5;
    const maskG = nightK ? 7 : duskK ? 12 : 7;
    const maskB = nightK ? 18 : duskK ? 26 : 18;
    lightCtx.fillStyle = `rgba(${maskR}, ${maskG}, ${maskB}, ${1.0 - ambientLuminance})`;
    lightCtx.fillRect(0, 0, w, h);

    // Underground darkness bonus
    const minTileY = Math.floor(camera.y / TILE_SIZE);
    const undergroundStart = 56;
    if (minTileY > undergroundStart - 10) {
      const depthFactor = Math.min(1.0, (minTileY - undergroundStart + 10) / 15);
      lightCtx.fillStyle = `rgba(0, 0, 0, ${depthFactor * 0.92})`;
      lightCtx.fillRect(0, 0, w, h);
    }

    // Now carve out radial lights with 'destination-out' or radial gradients
    lightCtx.save();
    lightCtx.globalCompositeOperation = 'destination-out';

    // 1. Player aura (player carries a soft glow)
    const playerSx = player.x + player.width / 2 - camera.x;
    const playerSy = player.y + player.height / 2 - camera.y;
    this.carveLightCircle(lightCtx, playerSx, playerSy, 160, 0.9);

    // 2. Visible torches & campfires in view (+ lava / crystal carve light too)
    const minTileX = Math.max(0, Math.floor(camera.x / TILE_SIZE) - 2);
    const maxTileX = Math.min(this.width - 1, Math.ceil((camera.x + w) / TILE_SIZE) + 2);
    const topY = Math.max(0, Math.floor(camera.y / TILE_SIZE) - 2);
    const botY = Math.min(this.height - 1, Math.ceil((camera.y + h) / TILE_SIZE) + 2);

    for (let y = topY; y <= botY; y++) {
      // PERF: most of a daylight screen is plain dirt/stone, so grab the row
      // once and skip non-emitters with a single array comparison instead of
      // four of them per tile.
      const rowBase = y * this.width;
      for (let x = minTileX; x <= maxTileX; x++) {
        const tile = this.tiles[rowBase + x];
        if (tile !== TILES.TORCH && tile !== TILES.CAMPFIRE && tile !== TILES.LAVA &&
            tile !== TILES.CRYSTAL && tile !== TILES.WATER && tile !== TILES.LANTERN) continue;
        if (tile === TILES.TORCH) {
          const sx = x * TILE_SIZE + 12 - camera.x;
          const sy = y * TILE_SIZE + 12 - camera.y;
          this.carveLightCircle(lightCtx, sx, sy, 220, 0.95);
        } else if (tile === TILES.CAMPFIRE) {
          const sx = x * TILE_SIZE + 12 - camera.x;
          const sy = y * TILE_SIZE + 12 - camera.y;
          this.carveLightCircle(lightCtx, sx, sy, 320, 1.0);
        } else if (tile === TILES.LAVA) {
          const sx = x * TILE_SIZE + 12 - camera.x;
          const sy = y * TILE_SIZE + 12 - camera.y;
          this.carveLightCircle(lightCtx, sx, sy, 190, 0.85);
        } else if (tile === TILES.CRYSTAL) {
          const sx = x * TILE_SIZE + 12 - camera.x;
          const sy = y * TILE_SIZE + 12 - camera.y;
          this.carveLightCircle(lightCtx, sx, sy, 150, 0.8);
        } else if (tile === TILES.LANTERN) {
          // Between a torch and a campfire: it is a placeable room light, so it
          // has to hold a room rather than a doorstep.
          const sx = x * TILE_SIZE + 12 - camera.x;
          const sy = y * TILE_SIZE + 12 - camera.y;
          this.carveLightCircle(lightCtx, sx, sy, 250, 0.92);
        } else {
          const sx = x * TILE_SIZE + 12 - camera.x;
          const sy = y * TILE_SIZE + 12 - camera.y;
          this.carveLightCircle(lightCtx, sx, sy, 90, 0.35);
        }
      }
    }

    // 3. Glowing projectiles & boss eyes
    for (const ent of entities) {
      if (ent.lightRadius) {
        const sx = ent.x + (ent.width || 0) * 0.5 - camera.x;
        const sy = ent.y + (ent.height || 0) * 0.5 - camera.y;
        this.carveLightCircle(lightCtx, sx, sy, ent.lightRadius, 0.9);
      }
    }

    lightCtx.restore();
  }

  /**
   * Soft dark circle carved out of the lighting mask.
   *
   * createRadialGradient() re-parses its colour stops every call and this ran
   * for every torch, campfire, crystal and projectile in view on every frame.
   * The shape only depends on (radius, maxAlpha), so it is rasterised once into
   * a small offscreen sprite and then blitted — same pixels, a fraction of the
   * cost. Position is free because the sprite is drawn centred on the light.
   */
  carveLightCircle(ctx, x, y, radius, maxAlpha = 1.0) {
    const sprite = this._lightSprite(radius, maxAlpha);
    ctx.drawImage(sprite, x - sprite.width / 2, y - sprite.height / 2);
  }

  _lightSprite(radius, maxAlpha) {
    const key = `${Math.round(radius)}|${maxAlpha.toFixed(2)}`;
    let sprite = this._lightSpriteCache.get(key);
    if (sprite) return sprite;

    const size = Math.max(2, Math.ceil(radius * 2));
    sprite = document.createElement('canvas');
    sprite.width = size;
    sprite.height = size;
    const sctx = sprite.getContext('2d');
    const c = size / 2;
    const grad = sctx.createRadialGradient(c, c, radius * 0.05, c, c, radius);
    grad.addColorStop(0, `rgba(0, 0, 0, ${maxAlpha})`);
    grad.addColorStop(0.5, `rgba(0, 0, 0, ${maxAlpha * 0.6})`);
    grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    sctx.fillStyle = grad;
    sctx.beginPath();
    sctx.arc(c, c, radius, 0, Math.PI * 2);
    sctx.fill();

    // Lights vary in radius and alpha, but there are only a handful of distinct
    // combinations on screen; cap the cache so a pathological case cannot grow
    // it without bound.
    if (this._lightSpriteCache.size > 160) this._lightSpriteCache.clear();
    this._lightSpriteCache.set(key, sprite);
    return sprite;
  }

  // ==========================================
  // ADDITIVE BLOOM PASS
  // The multiply lighting layer can only darken. This layer can only brighten,
  // so torches, lava, stars and explosions finally cast real coloured light.
  // ==========================================
  renderGlow(glowCtx, camera, player, entities = []) {
    const w = camera.viewportWidth;
    const h = camera.viewportHeight;
    const t = Date.now() * 0.001;
    const glowScale = this.glowScale ?? 1;

    glowCtx.clearRect(0, 0, w, h);
    if (glowScale <= 0) return;

    // PERF: everything the tile sweep below adds is an *additive* light. At
    // high noon nothing is actually dark, so those blobs are invisible — yet
    // we were still scanning every tile in view and blitting hundreds of
    // sprites into a full-screen layer. While the scene is bright the pass is
    // skipped wholesale; it fades in with dusk and is properly blown out
    // underground, where it matters most.
    if (this.isNight()) {
      this._glowStrength = 1;
    } else {
      const t = this.timeOfDay;
      // Dawn ramp (0.16 -> 0.24) and dusk ramp (0.46 -> 0.56), matching the
      // ambient curve renderLighting() already uses.
      const dawn = Math.max(0, Math.min(1, (t - 0.16) / 0.08));
      const dusk = Math.max(0, Math.min(1, (t - 0.46) / 0.10));
      this._glowStrength = Math.max(dawn, dusk);
    }
    const minTileX = Math.max(0, Math.floor(camera.x / TILE_SIZE) - 4);
    const maxTileX = Math.min(this.width - 1, Math.ceil((camera.x + w) / TILE_SIZE) + 4);
    const minTileY = Math.max(0, Math.floor(camera.y / TILE_SIZE) - 4);
    const maxTileY = Math.min(this.height - 1, Math.ceil((camera.y + h) / TILE_SIZE) + 4);

    // ---- Light-emitting tiles ----
    // Deep underground the world is dark in every direction regardless of the
    // clock, so the sweep always runs down there.
    const underground = Math.floor(camera.y / TILE_SIZE) > 56 - 10;
    if (this._glowStrength > 0.05 || underground) {
    for (let y = minTileY; y <= maxTileY; y++) {
      // PERF: a row read plus a single early-out test replaces the switch
      // dispatch that every tile of every frame used to go through.
      const rowBase = y * this.width;
      for (let x = minTileX; x <= maxTileX; x++) {
        const tile = this.tiles[rowBase + x];
        if (tile === TILES.AIR) continue;

        const sx = x * TILE_SIZE - camera.x + TILE_SIZE / 2;
        const sy = y * TILE_SIZE - camera.y + TILE_SIZE / 2;

        switch (tile) {
          case TILES.TORCH: {
            // Two flicker sines so the flame never settles into an obvious loop
            const flicker = 0.82 + Math.sin(t * 7.3 + x * 2.1) * 0.1 + Math.sin(t * 13.7 + y) * 0.08;
            this.glowBlob(glowCtx, sx, sy - 2, 74 * flicker, 255, 168, 70, 0.85);
            this.glowBlob(glowCtx, sx, sy - 2, 26 * flicker, 255, 236, 180, 0.9);
            break;
          }
          case TILES.CAMPFIRE: {
            const flicker = 0.88 + Math.sin(t * 5.1 + x) * 0.08 + Math.sin(t * 9.4) * 0.05;
            this.glowBlob(glowCtx, sx, sy - 3, 118 * flicker, 255, 150, 55, 0.85);
            this.glowBlob(glowCtx, sx, sy - 3, 40 * flicker, 255, 225, 150, 0.9);
            break;
          }
          case TILES.LAVA: {
            const pulse = 0.85 + Math.sin(t * 2.2 + x * 0.9 + y * 1.3) * 0.15;
            this.glowBlob(glowCtx, sx, sy, 88 * pulse, 255, 96, 26, 0.7);
            this.glowBlob(glowCtx, sx, sy, 32 * pulse, 255, 190, 60, 0.75);
            break;
          }
          case TILES.CRYSTAL:
            this.glowBlob(glowCtx, sx, sy, 62, 90, 220, 255, 0.5);
            break;
          case TILES.LANTERN: {
            // Warm, steady, with just enough flicker to feel alive.
            const lampFlicker = 0.92 + Math.sin(t * 6.2 + x * 1.7) * 0.05 + Math.sin(t * 11.3 + y) * 0.04;
            this.glowBlob(glowCtx, sx, sy - 2, 96 * lampFlicker, 255, 176, 84, 0.8);
            this.glowBlob(glowCtx, sx, sy - 2, 34 * lampFlicker, 255, 240, 190, 0.88);
            break;
          }
          case TILES.DIAMOND_ORE:
            this.glowBlob(glowCtx, sx, sy, 44, 120, 240, 255, 0.34);
            break;
          case TILES.GOLD_ORE:
            this.glowBlob(glowCtx, sx, sy, 30, 255, 200, 90, 0.24);
            break;
          case TILES.CHEST:
            this.glowBlob(glowCtx, sx, sy, 26, 255, 210, 120, 0.18);
            break;
          case TILES.BED:
            this.glowBlob(glowCtx, sx, sy, 22, 150, 200, 255, 0.14);
            break;
          case TILES.RAINBOW_ORE: {
            const rPulse = 0.30 + Math.sin(t * 3 + x) * 0.12;
            this.glowBlob(glowCtx, sx, sy, 46, 255, 120, 230, rPulse);
            this.glowBlob(glowCtx, sx, sy, 20, 255, 230, 160, rPulse * 0.8);
            break;
          }
          case TILES.ALTAR: {
            const curse = 0.7 + Math.sin(t * 2.4 + x) * 0.2 + Math.sin(t * 5.1) * 0.1;
            this.glowBlob(glowCtx, sx, sy - 8, 74, 150, 110, 255, 0.30 * curse);
            this.glowBlob(glowCtx, sx, sy - 30, 26, 196, 181, 253, 0.35 * curse);
            break;
          }
          case TILES.WATER: {
            const shimmer = 0.10 + Math.sin(t * 2.4 + x * 1.7 + y) * 0.04;
            this.glowBlob(glowCtx, sx, sy, 64, 80, 180, 255, shimmer);
            break;
          }
          case TILES.LILY:
            this.glowBlob(glowCtx, sx, sy - 2, 30 + Math.sin(t * 2 + x) * 5, 110, 230, 180, 0.22);
            break;
        }
      }
    }
    } // end daylight gate on the emitter sweep

    // ---- Player warp-in aura ----
    if (player) {
      const pSx = player.x + player.width / 2 - camera.x;
      const pSy = player.y + player.height / 2 - camera.y;
      this.glowBlob(glowCtx, pSx, pSy, 58, 170, 220, 255, 0.16);

      // Held torch / campfire lights the adventurer's own face
      if (player.isSwinging) {
        this.glowBlob(glowCtx, pSx + player.facing * 18, pSy, 34, 255, 200, 130, 0.2);
      }
    }

    // ---- Glowing entities, projectiles and blast cores ----
    for (const ent of entities) {
      if (!ent) continue;
      const ex = (ent.x || 0) + (ent.width || 0) / 2 - camera.x;
      const ey = (ent.y || 0) + (ent.height || 0) / 2 - camera.y;
      if (ex < -160 || ex > w + 160 || ey < -160 || ey > h + 160) continue;
      const radius = ent.lightRadius || ent.glowRadius || 0;
      if (radius <= 0) continue;
      const tint = ent.lightColor || ent.glowColor;
      if (tint) {
        // Tinted blob on top of the warm core, so a boss can cast its own
        // colour onto the room instead of every glow reading as orange.
        this.glowBlob(glowCtx, ex, ey, radius * 0.9, tint[0], tint[1], tint[2], 0.20);
        this.glowBlob(glowCtx, ex, ey, radius * 0.35, tint[0], tint[1], tint[2], 0.16);
        this.glowBlob(glowCtx, ex, ey, radius * 0.55, 255, 240, 220, 0.10);
      } else {
        this.glowBlob(glowCtx, ex, ey, radius * 0.75, 255, 130, 110, 0.22);
      }
      if (ent.hitFlash > 0) {
        this.glowBlob(glowCtx, ex, ey, radius * 0.85, 255, 255, 255, 0.22 * Math.min(1, ent.hitFlash * 8));
      }
    }

    // Blast flash cores (explosions briefly flood the screen with light)
    if (Array.isArray(this._blasts)) {
      for (const b of this._blasts) {
        const ex = b.x - camera.x;
        const ey = b.y - camera.y;
        const k = 1 - b.t / b.life;
        this.glowBlob(glowCtx, ex, ey, b.maxR * 1.6 * k, b.r ?? 255, b.g ?? 170, b.b ?? 80, 0.55 * k);
      }
    }
  }

  // Soft radial bloom blob. Additive, so overlapping lights stack into real brightness.
  //
  // Like carveLightCircle, this used to build a fresh radial gradient per call,
  // which is the most expensive thing the glow pass did. A static blob is fully
  // described by (radius, r, g, b, alpha), so each distinct combination is baked
  // into a sprite once and then blitted. Flicker stays because the radius is
  // quantised — 4px buckets read as smooth shimmer to the eye.
  glowBlob(ctx, x, y, radius, r, g, b, alpha) {
    const glowScale = this.glowScale ?? 1;
    if (glowScale <= 0 || radius <= 0 || alpha <= 0) return;
    radius *= glowScale;
    alpha *= glowScale;
    const sprite = this._glowSprite(radius, r, g, b, alpha);
    ctx.drawImage(sprite, x - sprite.width / 2, y - sprite.height / 2);
  }

  _glowSprite(radius, r, g, b, alpha) {
    const qr = Math.max(2, Math.round(radius / 4) * 4);
    const qa = Math.round(alpha * 20) / 20;
    const key = `${qr}|${r}|${g}|${b}|${qa}`;
    let sprite = this._glowSpriteCache.get(key);
    if (sprite) return sprite;

    const size = Math.max(2, Math.ceil(qr * 2));
    sprite = document.createElement('canvas');
    sprite.width = size;
    sprite.height = size;
    const sctx = sprite.getContext('2d');
    const c = size / 2;
    const grad = sctx.createRadialGradient(c, c, 0, c, c, qr);
    grad.addColorStop(0, `rgba(${r}, ${g}, ${b}, ${qa})`);
    grad.addColorStop(0.35, `rgba(${r}, ${g}, ${b}, ${qa * 0.45})`);
    grad.addColorStop(1, `rgba(${r}, ${g}, ${b}, 0)`);
    sctx.fillStyle = grad;
    sctx.beginPath();
    sctx.arc(c, c, qr, 0, Math.PI * 2);
    sctx.fill();

    if (this._glowSpriteCache.size > 160) this._glowSpriteCache.clear();
    this._glowSpriteCache.set(key, sprite);
    return sprite;
  }
}

window.World = World;
window.TILES = TILES;
window.TILE_PROPERTIES = TILE_PROPERTIES;
window.TILE_SIZE = TILE_SIZE;
