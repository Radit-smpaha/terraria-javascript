// Underworld expansion: the deepest layer, a demon castle, and late-game enemies.
// Loaded after world.js/entities.js and before terraria.js so the base World and
// Monster classes already exist when the game constructs its world.

const UNDERWORLD_TILE_IDS = {
  ASH: 41,
  OBSIDIAN: 42,
  HELLSTONE: 43,
  CASTLE_BRICK: 44,
  DEMON_GATE: 45,
  DEMON_ALTAR: 46,
  DEMON_BRICK: 47
};

for (const [name, id] of Object.entries(UNDERWORLD_TILE_IDS)) TILES[name] = id;
Object.assign(TILE_PROPERTIES, {
  [TILES.ASH]: { solid: true, light: 0, color: '#34202b', name: 'Underworld Ash', drops: { id: 'hellstone', count: 1 } },
  [TILES.OBSIDIAN]: { solid: true, light: 0, color: '#241238', name: 'Obsidian', drops: { id: 'obsidian_block', count: 1 } },
  [TILES.HELLSTONE]: { solid: true, light: 5, color: '#8b2e1d', name: 'Hellstone', drops: { id: 'hellstone', count: 1 } },
  [TILES.CASTLE_BRICK]: { solid: true, light: 0, color: '#343746', name: 'Castle Brick', drops: { id: 'castle_brick', count: 1 } },
  [TILES.DEMON_GATE]: { solid: true, light: 8, color: '#4c102d', name: 'Demon Castle Gate', drops: null },
  [TILES.DEMON_ALTAR]: { solid: true, light: 12, color: '#7f1d3d', name: 'Demon Altar', drops: null },
  [TILES.DEMON_BRICK]: { solid: true, light: 1, color: '#4b102c', name: 'Demon Brick', drops: { id: 'demon_brick', count: 1 } }
});

World.prototype.isUnderworldAtY = function(tileY) {
  return Number.isFinite(tileY) && tileY >= this.underworldStart;
};

World.prototype.ensureUnderworld = function(force = false) {
  if (!this.underworld || force) this.generateUnderworld();
  return this.underworld;
};

const baseGenerateTerrain = World.prototype.generateTerrain;
World.prototype.generateTerrain = function() {
  this.underworldStart = Math.max(70, this.height - 38);
  this.underworld = null;
  baseGenerateTerrain.call(this);
  this.generateUnderworld();
};

World.prototype.generateUnderworld = function() {
  if (!this.underworldStart) this.underworldStart = Math.max(70, this.height - 38);
  const start = this.underworldStart;
  const floorY = this.height - 5;
  this.landmarks = (this.landmarks || []).filter(landmark => landmark.type !== 'demon_castle');

  // Ash and obsidian replace ordinary stone as the bottom layer takes over.
  for (let x = 0; x < this.width; x++) {
    for (let y = start; y < this.height; y++) {
      const idx = y * this.width + x;
      const roll = Math.random();
      if (y >= start + 7 && roll < 0.09) this.tiles[idx] = TILES.OBSIDIAN;
      else if (y >= start + 4 && roll < 0.18) this.tiles[idx] = TILES.HELLSTONE;
      else this.tiles[idx] = TILES.ASH;
      this.walls[idx] = TILES.OBSIDIAN;
    }
  }

  // Broad, connected caverns make the layer feel like a real destination.
  for (let chamber = 0; chamber < 22; chamber++) {
    const cx = 10 + Math.floor(Math.random() * (this.width - 20));
    const cy = start + 7 + Math.floor(Math.random() * Math.max(8, floorY - start - 12));
    const rx = 5 + Math.floor(Math.random() * 7);
    const ry = 3 + Math.floor(Math.random() * 4);
    this.landmarks.push({ x: cx, y: cy, type: 'underworld_cavern' });
    for (let y = Math.max(start, cy - ry); y <= Math.min(floorY - 1, cy + ry); y++) {
      for (let x = cx - rx; x <= cx + rx; x++) {
        const norm = ((x - cx) ** 2) / (rx ** 2) + ((y - cy) ** 2) / (ry ** 2);
        if (norm <= 1) {
          this.setTile(x, y, TILES.AIR);
          this.walls[y * this.width + x] = TILES.OBSIDIAN;
        }
      }
    }
  }

  // Hellstone seams and obsidian shelves make the layer mineable and readable.
  for (let vein = 0; vein < 18; vein++) {
    const cx = 8 + Math.floor(Math.random() * (this.width - 16));
    const cy = start + 5 + Math.floor(Math.random() * Math.max(5, floorY - start - 8));
    for (let i = 0; i < 7 + Math.floor(Math.random() * 7); i++) {
      const x = cx + (i % 3) - 1;
      const y = cy + Math.floor(i / 3);
      if (y >= start && y < floorY && this.getTile(x, y) !== TILES.AIR) this.setTile(x, y, i % 4 === 0 ? TILES.OBSIDIAN : TILES.HELLSTONE);
    }
  }

  // Lava ocean below the castle platform: dangerous, bright, and unavoidable.
  for (let x = 0; x < this.width; x++) {
    const oceanTop = floorY + Math.floor(Math.sin(x * 0.11) * 1.2);
    for (let y = oceanTop; y < this.height; y++) this.setTile(x, y, TILES.LAVA);
  }
  for (let bridge = 0; bridge < 3; bridge++) {
    const bx = 35 + bridge * Math.floor((this.width - 70) / 2);
    for (let x = bx - 10; x <= bx + 10; x++) {
      this.setTile(x, floorY, TILES.OBSIDIAN);
      this.setTile(x, floorY + 1, TILES.AIR);
    }
  }

  const castleX = Math.max(46, Math.min(this.width - 47, Math.floor(this.width * 0.61)));
  const castle = this.buildDemonCastle(castleX, start + 3, this.height - 11);
  this.underworld = {
    version: 1,
    start,
    oceanTop: floorY,
    castleX,
    castleLeft: castle.left,
    castleRight: castle.right,
    castleTop: castle.top,
    floorY: castle.floorY,
    gateX: castleX,
    gateY: castle.top,
    altarX: castleX,
    altarY: castle.floorY - 1,
    active: false
  };
  this.landmarks.push({ x: castleX, y: castle.top - 2, type: 'demon_castle' });
  this._tileCacheDirty = true;
  return this.underworld;
};

World.prototype.buildDemonCastle = function(cx, top, floorY) {
  const left = cx - 18;
  const right = cx + 18;
  // Solid outer shell, hollow rooms, then a solid floor and battlements.
  for (let x = left; x <= right; x++) {
    for (let y = top; y <= floorY; y++) {
      this.setTile(x, y, TILES.CASTLE_BRICK);
      this.walls[y * this.width + x] = TILES.DEMON_BRICK;
    }
  }
  for (let y = top + 3; y < floorY; y++) {
    for (let x = left + 3; x <= right - 3; x++) this.setTile(x, y, TILES.AIR);
  }
  // Inner buttresses and a shadowed crown make the throne room feel like a
  // sealed fortress without filling the playable center with collision.
  for (let y = top + 2; y < floorY - 1; y++) {
    this.setTile(left + 3, y, TILES.DEMON_BRICK);
    this.setTile(right - 3, y, TILES.DEMON_BRICK);
  }
  for (let x = left + 4; x <= right - 4; x++) {
    if (x < cx - 2 || x > cx + 2) this.setTile(x, top + 2, TILES.OBSIDIAN);
  }
  this.setTile(left + 3, top + 4, TILES.TORCH);
  this.setTile(right - 3, top + 4, TILES.TORCH);
  this.setTile(left + 6, top + 5, TILES.TORCH);
  this.setTile(right - 6, top + 5, TILES.TORCH);
  // Recessed side pillars, ribbed arches and a raised throne dais make the
  // chamber read like a sealed fortress instead of a plain hollow box.
  for (const x of [left + 5, right - 5]) {
    for (let y = top + 3; y < floorY - 1; y += 2) this.setTile(x, y, TILES.DEMON_BRICK);
  }
  for (let x = left + 7; x <= right - 7; x += 3) {
    this.setTile(x, top + 2, TILES.CASTLE_BRICK);
    this.walls[(top + 3) * this.width + x] = TILES.DEMON_BRICK;
  }
  // ---- The arena floor ----
  // Everything below builds the throne dais and the decorative ribs that used to
  // fill the chamber floor. The Demon is 82px tall and spawns standing on
  // floorY, so any solid tile in the floorY-1 / floorY-2 rows intersects its
  // body: the boss spawned inside its own throne, got wedged between the dais
  // and the scattered ribs, and could never reach the player. The floor is now
  // kept flat and clear across the whole fighting width, and the ribs are
  // pushed out to the walls where they read as decoration without colliding.
  for (let x = left + 3; x <= right - 3; x++) {
    // Flat, walkable floor. The altar keeps its own tile further below.
    this.setTile(x, floorY - 1, TILES.AIR);
    this.setTile(x, floorY - 2, TILES.AIR);
  }
  // Ribs survive only along the side walls, outside the boss's patrol box.
  for (let x = left + 3; x <= left + 5; x++) this.setTile(x, floorY - 1, TILES.DEMON_BRICK);
  for (let x = right - 5; x <= right - 3; x++) this.setTile(x, floorY - 1, TILES.DEMON_BRICK);
  for (let x = left + 3; x <= right - 3; x++) {
    this.setTile(x, floorY, TILES.CASTLE_BRICK);
  }
  for (let x = left + 2; x <= right - 2; x += 4) {
    this.setTile(x, top, TILES.DEMON_BRICK);
    this.setTile(x, top - 1, TILES.DEMON_BRICK);
  }
  // Front gate, central hall, throne altar, and side braziers.
  this.setTile(cx, top, TILES.DEMON_GATE);
  this.setTile(cx, top + 1, TILES.AIR);
  this.setTile(cx, top + 2, TILES.AIR);
  this.setTile(cx, floorY - 1, TILES.DEMON_ALTAR);
  for (const x of [left + 6, right - 6]) {
    this.setTile(x, floorY - 1, TILES.CAMPFIRE);
    this.setTile(x, floorY - 2, TILES.AIR);
  }
  // (The old `x % 3` rib scatter across the arena floor was removed — see the
  // arena-floor block above. Those pillars are what used to trap the Demon.)
  // A clear central stair shaft from the underworld ceiling to the gate.
  for (let y = this.underworldStart; y <= top + 2; y++) this.setTile(cx, y, TILES.AIR);
  this.setTile(cx, top, TILES.DEMON_GATE);
  return { left, right, top, floorY };
};

const baseBackgroundLayer = World.prototype._renderBackgroundLayer;
World.prototype._renderBackgroundLayer = function(target, w, h, camera, biome) {
  if (this.isUnderworldAtY((camera.y + camera.viewportHeight * 0.5) / TILE_SIZE)) return this.renderUnderworldBackground(target, w, h, camera);
  return baseBackgroundLayer.call(this, target, w, h, camera, biome);
};

World.prototype.renderUnderworldBackground = function(target, w, h, camera) {
  if (target.width !== w) target.width = w;
  if (target.height !== h) target.height = h;
  const ctx = target.getContext && target.getContext('2d');
  if (!ctx) return false;
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.clearRect(0, 0, w, h);
  ctx.fillStyle = '#120914';
  ctx.fillRect(0, 0, w, h);
  ctx.fillStyle = '#26101d';
  ctx.fillRect(0, h * 0.28, w, h * 0.72);
  ctx.fillStyle = '#3b111e';
  for (let band = 0; band < 5; band++) {
    const y = h * (0.46 + band * 0.11);
    const offset = (camera.x * (0.08 + band * 0.025)) % (w + 120);
    for (let x = -120 - offset; x < w + 120; x += 44) {
      const peak = 10 + ((x + band * 31) % 5) * 4;
      ctx.fillRect(Math.floor(x), Math.floor(y - peak), 22, peak + 30);
    }
  }
  ctx.fillStyle = '#ef4444';
  ctx.globalAlpha = 0.18;
  for (let crack = 0; crack < 9; crack++) {
    const x = (crack * 79 + Math.floor(camera.x * 0.12)) % Math.max(1, w);
    const y = h * 0.58 + (crack % 3) * 24;
    ctx.fillRect(x, y, 3, 28 + (crack % 4) * 8);
    ctx.fillRect(x - 7, y + 15, 17, 3);
  }
  ctx.globalAlpha = 0.75;
  ctx.fillStyle = '#fb923c';
  for (let ember = 0; ember < 18; ember++) {
    const x = (ember * 47 + Math.floor(camera.x * 0.2)) % Math.max(1, w);
    const y = h - 12 - ((ember * 19 + Math.floor(Date.now() * 0.001 * (2 + ember % 3))) % Math.max(20, h - 20));
    ctx.fillRect(x, y, 2, 2);
  }
  ctx.globalAlpha = 1;
  return true;
};

const baseDrawTileGraphic = World.prototype.drawTileGraphic;
World.prototype.drawTileGraphic = function(ctx, tile, sx, sy, tx, ty, exposedTop = false) {
  const S = TILE_SIZE;
  if (tile === TILES.ASH) {
    ctx.fillStyle = '#34202b'; ctx.fillRect(sx, sy, S, S);
    ctx.fillStyle = '#4b2935'; ctx.fillRect(sx + 3, sy + 4, 7, 3); ctx.fillRect(sx + 15, sy + 15, 5, 4);
    ctx.fillStyle = '#1c101b'; ctx.fillRect(sx + 7, sy + 19, 3, 2);
  } else if (tile === TILES.OBSIDIAN) {
    ctx.fillStyle = '#160d24'; ctx.fillRect(sx, sy, S, S);
    ctx.fillStyle = '#31205a'; ctx.fillRect(sx + 2, sy + 3, 8, 6); ctx.fillRect(sx + 15, sy + 14, 7, 5);
    ctx.fillStyle = '#6d4bb0'; ctx.fillRect(sx + 5, sy + 6, 3, 2); ctx.fillRect(sx + 18, sy + 16, 2, 2);
  } else if (tile === TILES.HELLSTONE) {
    ctx.fillStyle = '#6b241b'; ctx.fillRect(sx, sy, S, S);
    ctx.fillStyle = '#b83a1d'; ctx.fillRect(sx + 2, sy + 2, 9, 4); ctx.fillRect(sx + 14, sy + 11, 8, 4);
    ctx.fillStyle = '#ff9a3d'; ctx.fillRect(sx + 10, sy + 7, 3, 11); ctx.fillRect(sx + 7, sy + 14, 9, 2);
  } else if (tile === TILES.CASTLE_BRICK) {
    ctx.fillStyle = '#343746'; ctx.fillRect(sx, sy, S, S);
    ctx.fillStyle = '#202331'; ctx.fillRect(sx, sy + 11, S, 2); ctx.fillRect(sx + 11, sy, 2, 11); ctx.fillRect(sx + 5, sy + 13, 2, 11); ctx.fillRect(sx + 18, sy + 13, 2, 11);
    ctx.fillStyle = '#5b6074'; ctx.fillRect(sx + 2, sy + 2, 6, 2);
  } else if (tile === TILES.DEMON_BRICK) {
    ctx.fillStyle = '#4b102c'; ctx.fillRect(sx, sy, S, S);
    ctx.fillStyle = '#29101f'; ctx.fillRect(sx, sy + 12, S, 2); ctx.fillRect(sx + 8, sy, 2, 12); ctx.fillRect(sx + 18, sy + 14, 2, 10);
    ctx.fillStyle = '#be123c'; ctx.fillRect(sx + 3, sy + 3, 4, 2);
  } else if (tile === TILES.DEMON_GATE) {
    ctx.fillStyle = '#100713'; ctx.fillRect(sx, sy, S, S);
    ctx.fillStyle = '#881337'; ctx.fillRect(sx + 2, sy + 3, S - 4, S - 6);
    ctx.fillStyle = '#f97316'; ctx.fillRect(sx + 5, sy + 6, 3, 12); ctx.fillRect(sx + 16, sy + 6, 3, 12); ctx.fillRect(sx + 8, sy + 11, 8, 3);
    ctx.fillStyle = '#fed7aa'; ctx.fillRect(sx + 10, sy + 5, 4, 5);
  } else if (tile === TILES.DEMON_ALTAR) {
    ctx.fillStyle = '#25101f'; ctx.fillRect(sx, sy, S, S);
    ctx.fillStyle = '#7f1d3d'; ctx.fillRect(sx + 4, sy + 9, 16, 10);
    ctx.fillStyle = '#fb7185'; ctx.fillRect(sx + 8, sy + 4, 8, 7); ctx.fillRect(sx + 10, sy + 2, 4, 3);
    ctx.fillStyle = '#fda4af'; ctx.fillRect(sx + 10, sy + 6, 4, 3);
  } else {
    return baseDrawTileGraphic.call(this, ctx, tile, sx, sy, tx, ty, exposedTop);
  }
};


const baseRenderLighting = World.prototype.renderLighting;
World.prototype.renderLighting = function(lightCtx, camera, player, entities) {
  baseRenderLighting.call(this, lightCtx, camera, player, entities);
  if (!this.isUnderworldAtY((camera.y + camera.viewportHeight * 0.5) / TILE_SIZE)) return;
  const minX = Math.max(0, Math.floor(camera.x / TILE_SIZE) - 2);
  const maxX = Math.min(this.width - 1, Math.ceil((camera.x + camera.viewportWidth) / TILE_SIZE) + 2);
  const minY = Math.max(0, Math.floor(camera.y / TILE_SIZE) - 2);
  const maxY = Math.min(this.height - 1, Math.ceil((camera.y + camera.viewportHeight) / TILE_SIZE) + 2);
  lightCtx.save();
  // The underworld is intentionally near-black even during daylight. Re-carve
  // practical lights below so the player can still read the room and fight.
  lightCtx.globalCompositeOperation = 'source-over';
  lightCtx.fillStyle = 'rgba(1, 0, 4, 0.62)';
  lightCtx.fillRect(0, 0, camera.viewportWidth, camera.viewportHeight);
  lightCtx.globalCompositeOperation = 'destination-out';
  this.carveLightCircle(lightCtx, player.x + player.width / 2 - camera.x, player.y + player.height / 2 - camera.y, 145, 0.82);
  for (let y = minY; y <= maxY; y++) {
    for (let x = minX; x <= maxX; x++) {
      const tile = this.getTile(x, y);
      const radius = tile === TILES.LAVA ? 175 : tile === TILES.HELLSTONE ? 125 : tile === TILES.DEMON_GATE ? 170 : tile === TILES.DEMON_ALTAR ? 220 : tile === TILES.CAMPFIRE ? 145 : 0;
      if (radius) this.carveLightCircle(lightCtx, x * TILE_SIZE + 12 - camera.x, y * TILE_SIZE + 12 - camera.y, radius, tile === TILES.DEMON_ALTAR ? 0.98 : 0.7);
    }
  }
  for (const ent of entities || []) {
    if (ent.lightRadius) this.carveLightCircle(lightCtx, ent.x + (ent.width || 0) / 2 - camera.x, ent.y + (ent.height || 0) / 2 - camera.y, ent.lightRadius, 0.72);
  }
  lightCtx.restore();
};

const baseRenderGlow = World.prototype.renderGlow;
World.prototype.renderGlow = function(glowCtx, camera, player, entities = []) {
  baseRenderGlow.call(this, glowCtx, camera, player, entities);
  if ((this.glowScale ?? 1) <= 0 || !this.isUnderworldAtY((camera.y + camera.viewportHeight * 0.5) / TILE_SIZE)) return;
  const t = Date.now() * 0.001;
  const minX = Math.max(0, Math.floor(camera.x / TILE_SIZE) - 2);
  const maxX = Math.min(this.width - 1, Math.ceil((camera.x + camera.viewportWidth) / TILE_SIZE) + 2);
  const minY = Math.max(0, Math.floor(camera.y / TILE_SIZE) - 2);
  const maxY = Math.min(this.height - 1, Math.ceil((camera.y + camera.viewportHeight) / TILE_SIZE) + 2);
  for (let y = minY; y <= maxY; y++) {
    for (let x = minX; x <= maxX; x++) {
      const tile = this.getTile(x, y);
      if (tile !== TILES.HELLSTONE && tile !== TILES.DEMON_GATE && tile !== TILES.DEMON_ALTAR) continue;
      const pulse = 0.78 + Math.sin(t * 3 + x * 0.7 + y) * 0.18;
      const radius = tile === TILES.DEMON_ALTAR ? 110 : tile === TILES.DEMON_GATE ? 90 : 70;
      const color = tile === TILES.HELLSTONE ? [255, 86, 25] : [244, 63, 94];
      this.glowBlob(glowCtx, x * TILE_SIZE + 12 - camera.x, y * TILE_SIZE + 12 - camera.y, radius * pulse, color[0], color[1], color[2], 0.45);
    }
  }
};



class UnderworldMonster extends Monster {
  constructor(x, y, species = 'hellhound') {
    super(x, y, 'zombie');
    this.species = species;
    this.type = species;
    this.underworld = true;
    this.floatAngle = Math.random() * Math.PI * 2;
    if (species === 'imp') {
      this.width = 24; this.height = 28; this.hp = this.maxHp = 165;
      this.speed = 3.7; this.damage = 38; this.exp = 85; this.lightRadius = 105;
      this.displayName = 'Cinder Imp'; this.knockbackResist = 0.18;
    } else if (species === 'bone_serpent') {
      this.width = 46; this.height = 20; this.hp = this.maxHp = 260;
      this.speed = 2.35; this.damage = 46; this.exp = 110; this.lightRadius = 70;
      this.displayName = 'Bone Serpent'; this.knockbackResist = 0.52;
    } else {
      this.width = 34; this.height = 25; this.hp = this.maxHp = 210;
      this.speed = 3.25; this.damage = 42; this.exp = 95; this.lightRadius = 80;
      this.displayName = 'Hellhound'; this.knockbackResist = 0.34;
    }
    this.speedJitter = 0.94 + Math.random() * 0.12;
  }

  isGroundType() { return this.species !== 'imp'; }

  update(dt, player, world) {
    const species = this.species;
    this.animT = (this.animT || 0) + dt;
    this.type = species === 'imp' ? 'cave_bat' : 'zombie';
    super.update(dt, player, world);
    this.type = species;
  }

  render(ctx, camera) {
    const sx = this.x - camera.x;
    const sy = this.y - camera.y;
    const t = this.animT || Date.now() * 0.001;
    const elite = this.isElite;
    ctx.save();
    ctx.translate(sx, sy);
    ctx.fillStyle = 'rgba(0,0,0,0.38)';
    ctx.beginPath(); ctx.ellipse(this.width / 2, this.height - 2, this.width * 0.48, 4, 0, 0, Math.PI * 2); ctx.fill();
    if (this.facing === -1) { ctx.translate(this.width, 0); ctx.scale(-1, 1); }
    if (elite) {
      ctx.translate(this.width / 2, this.height / 2); ctx.scale(this.eliteScale, this.eliteScale); ctx.translate(-this.width / 2, -this.height / 2);
      ctx.globalAlpha = 0.2; ctx.fillStyle = '#f43f5e'; ctx.fillRect(-3, -3, this.width + 6, this.height + 6); ctx.globalAlpha = 1;
    }
    if (this.species === 'imp') {
      ctx.shadowColor = '#fb923c'; ctx.shadowBlur = 12;
      // membraned wings, hooked tail, cloven feet, and a molten core
      ctx.fillStyle = '#4c1d95'; ctx.beginPath(); ctx.moveTo(10, 12); ctx.lineTo(0, 2); ctx.lineTo(4, 16); ctx.lineTo(12, 18); ctx.closePath(); ctx.fill();
      ctx.beginPath(); ctx.moveTo(18, 12); ctx.lineTo(29, 2); ctx.lineTo(25, 17); ctx.lineTo(17, 19); ctx.closePath(); ctx.fill();
      ctx.strokeStyle = '#fb7185'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(5, 5); ctx.lineTo(9, 12); ctx.lineTo(4, 15); ctx.moveTo(24, 5); ctx.lineTo(20, 12); ctx.lineTo(25, 16); ctx.stroke();
      ctx.fillStyle = '#7f1d1d'; ctx.fillRect(9, 11, 10, 10); ctx.fillRect(7, 19, 14, 5);
      ctx.fillStyle = '#fb923c'; ctx.fillRect(8, 13, 4, 5); ctx.fillRect(17, 13, 4, 5); ctx.fillRect(11, 23, 3, 5); ctx.fillRect(16, 23, 3, 5);
      ctx.fillStyle = '#fdba74'; ctx.fillRect(10, 5, 9, 7); ctx.fillRect(7, 3, 3, 5); ctx.fillRect(19, 3, 3, 5);
      ctx.fillStyle = '#fef3c7'; ctx.fillRect(11, 7, 2, 2); ctx.fillRect(16, 7, 2, 2);
      ctx.fillStyle = '#431407'; ctx.fillRect(12, 10, 5, 2); ctx.fillStyle = '#f97316'; ctx.fillRect(14, 15, 2, 3);
      ctx.strokeStyle = '#fb923c'; ctx.beginPath(); ctx.moveTo(7, 23); ctx.quadraticCurveTo(1, 28, 5, 31); ctx.stroke();
    } else if (this.species === 'bone_serpent') {
      // articulated vertebra chain, ribs, horned skull and jaw
      ctx.fillStyle = '#57534e';
      for (let i = 0; i < 7; i++) {
        const px = i * 6.1; const py = 8 + Math.sin(t * 4 - i * 0.7) * 2.4;
        ctx.fillRect(px, py, 7, 4); ctx.fillStyle = i % 2 ? '#a8a29e' : '#d6d3d1'; ctx.fillRect(px + 1, py, 4, 2); ctx.fillStyle = '#57534e';
        ctx.fillStyle = '#78716c'; ctx.fillRect(px + 2, py - 2, 2, 2);
      }
      ctx.fillStyle = '#e7e5e4'; ctx.fillRect(1, 5, 9, 10); ctx.fillRect(4, 14, 5, 4);
      ctx.fillStyle = '#a8a29e'; ctx.fillRect(2, 8, 3, 3); ctx.fillRect(2, 13, 3, 2);
      ctx.fillStyle = '#ef4444'; ctx.fillRect(7, 8, 2, 2); ctx.fillRect(5, 16, 2, 2);
      ctx.fillStyle = '#fca5a5'; ctx.fillRect(7, 8, 1, 1);
      ctx.fillStyle = '#d6d3d1'; ctx.fillRect(0, 4, 2, 4); ctx.fillRect(9, 4, 2, 4);
    } else {
      // Hellhound: plated shoulders, ember mane, tail plume and a readable face.
      ctx.fillStyle = '#43151a'; ctx.beginPath(); ctx.moveTo(7, 12); ctx.lineTo(0, 5); ctx.lineTo(2, 18); ctx.lineTo(10, 20); ctx.closePath(); ctx.fill();
      ctx.strokeStyle = '#ef4444'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(3, 14); ctx.quadraticCurveTo(-3, 8, 1, 4); ctx.stroke();
      ctx.fillStyle = '#1f1017'; ctx.fillRect(7, 19, 5, 6); ctx.fillRect(24, 19, 5, 6);
      ctx.fillStyle = '#ef4444'; ctx.fillRect(3, 9, 29, 12); ctx.fillRect(8, 5, 18, 7);
      ctx.fillStyle = '#7f1d1d'; ctx.fillRect(5, 12, 26, 6); ctx.fillRect(8, 6, 18, 5);
      ctx.fillStyle = '#fb923c'; ctx.fillRect(7, 8, 3, 4); ctx.fillRect(26, 8, 3, 4); ctx.fillRect(13, 20, 3, 3); ctx.fillRect(21, 20, 3, 3);
      ctx.fillStyle = '#fca5a5'; ctx.fillRect(10, 9, 4, 3); ctx.fillRect(23, 9, 4, 3);
      ctx.fillStyle = '#fef3c7'; ctx.fillRect(3, 2, 3, 8); ctx.fillRect(29, 2, 3, 8); ctx.fillRect(2, 16, 4, 3); ctx.fillRect(31, 16, 4, 3);
      ctx.fillStyle = '#43151a'; ctx.fillRect(15, 13, 7, 3); ctx.fillStyle = '#fda4af'; ctx.fillRect(17, 13, 1, 2); ctx.fillRect(20, 13, 1, 2);
      ctx.fillStyle = '#fda4af'; ctx.fillRect(11, 5, 2, 3); ctx.fillRect(23, 5, 2, 3); ctx.fillStyle = '#43151a'; ctx.fillRect(14, 16, 8, 2);
    }
    if (this.hitFlash > 0) { ctx.globalAlpha = Math.min(0.82, this.hitFlash * 6); ctx.fillStyle = '#fff'; ctx.fillRect(-2, -2, this.width + 4, this.height + 4); }
    ctx.restore();
    this.renderHealthBar(ctx, sx, sy);
  }
}

class DemonBoss {
  constructor(x, y, game = null) {
    this.kind = 'demon';
    this.x = x; this.y = y; this.width = 72; this.height = 82;
    this.vx = 0; this.vy = 0; this.facing = -1;
    // 24k -> 38k. The Demon is the hardest fight in the game and now outlasts
    // a full phase of chip damage from anything short of the Inferno Brand.
    this.maxHp = 38000; this.hp = 38000; this.phase = 1;
    this.name = 'THE HELLBOUND DEMON, KING OF ASH';
    this.dead = false; this.lightRadius = 420; this.glowRadius = 210;
    this.game = game; this.hitFlash = 0; this.animT = 0;
    this.attackState = 'stalk'; this.stateTimer = 1.4; this.telegraph = null;
    this.lastAttack = ''; this.targetX = x; this.targetY = y;
    this.attackHistory = []; this.minionTimer = 6; this.aura = 0;
    // Phase 3 "Abyssal Maelstrom": a rotating beam sweep that forces the player
    // to keep moving instead of hugging a wall waiting out the projectile ring.
    this.sweepAngle = 0; this.sweepTimer = 0; this.sweeping = false;
  }

  get phaseName() {
    return this.phase === 3 ? 'PHASE 3 · Infernal Ascension' : this.phase === 2 ? 'PHASE 2 · Furnace Unbound' : 'PHASE 1 · Castle Siege';
  }

  takeDamage(amount, soundSystem, particleSystem, isCrit = false) {
    if (this.dead) return 0;
    const dealt = Math.max(1, Math.round(amount));
    this.hp -= dealt; this.hitFlash = 0.1;
    soundSystem?.playHit();
    particleSystem?.addDamageText(this.x + this.width / 2, this.y, dealt, isCrit ? '#fb923c' : '#ef4444', isCrit);
    particleSystem?.bloodBurst(this.x + this.width / 2, this.y + this.height / 2, '#f97316', isCrit ? 22 : 14);
    const nextPhase = this.hp <= this.maxHp * 0.33 ? 3 : this.hp <= this.maxHp * 0.66 ? 2 : 1;
    if (nextPhase > this.phase) {
      this.phase = nextPhase;
      this.name = nextPhase === 3 ? 'THE HELLBOUND DEMON, LORD OF THE ABYSS' : 'THE HELLBOUND DEMON, FURNACE UNBOUND';
      this.lightRadius = nextPhase === 3 ? 460 : 410; this.glowRadius = nextPhase === 3 ? 230 : 200; this.aura = 1;
      soundSystem?.playBossRoar(); this.game?.feel?.stop(0.18, 0.04); this.game?.feel?.slow(1.5, 0.22); this.game?.feel?.shake(1.3);
      this.game?.showAnnouncement?.(nextPhase === 3 ? '🔥 THE DEMON CLAIMS THE ABYSS!' : '🔥 THE CASTLE FURNACE BREAKS OPEN!');
      particleSystem?.magicSparkle(this.x + this.width / 2, this.y + this.height / 2, '#fb923c', 80);
    }
    if (this.hp <= 0) {
      this.hp = 0; this.dead = true; soundSystem?.playExplosion(); this.game?.feel?.shake(1.8);
      particleSystem?.magicSparkle(this.x + this.width / 2, this.y + this.height / 2, '#fde047', 100);
    }
    return dealt;
  }

  spawnRing(projectiles, soundSystem, particleSystem) {
    const count = this.phase === 1 ? 14 : this.phase === 2 ? 19 : 26;
    const damage = this.phase === 1 ? 34 : this.phase === 2 ? 44 : 56;
    const cx = this.x + this.width / 2, cy = this.y + this.height / 2;
    // Successive rings counter-rotate so the gaps never line up twice in a row.
    const spin = (this.phase - 1) * 0.21;
    for (let i = 0; i < count; i++) {
      const a = (i / count) * Math.PI * 2 + this.animT * 0.13 * (i % 2 ? 1 : -1) + spin;
      const speed = 4.6 + this.phase * 0.7;
      projectiles.push(new Projectile(cx, cy, Math.cos(a) * speed, Math.sin(a) * speed, 'boss_laser', damage, true, 5.2, 90));
    }
    soundSystem?.playBossLaser(); particleSystem?.magicSparkle(cx, cy, '#fb923c', 26);
  }

  /**
   * Phase 3 only: a slow rotating double-beam fired from the boss's hands for a
   * few seconds. It sweeps a full circle over its lifetime, so the safe spot is
   * always moving — a static projectile ring can be waited out, this cannot.
   */
  startSweep(projectiles, soundSystem, particleSystem) {
    this.sweeping = true;
    this.sweepTimer = 3.4;
    this.sweepAngle = Math.atan2(
      (this.game?.player?.y || this.y) - (this.y + this.height / 2),
      (this.game?.player?.x || this.x) - (this.x + this.width / 2)
    );
    soundSystem?.playBossLaser();
    particleSystem?.magicSparkle(this.x + this.width / 2, this.y + this.height / 2, '#f43f5e', 40);
  }

  updateSweep(dt, projectiles, soundSystem, particleSystem) {
    if (!this.sweeping) return;
    this.sweepTimer -= dt;
    this.sweepAngle += dt * (this.phase === 3 ? 1.15 : 0.8);
    const cx = this.x + this.width / 2, cy = this.y + this.height / 2;
    // Two opposed arms, emitted a few times a second, so the sweep reads as a
    // continuous beam rather than a stream of loose shots.
    this._sweepEmit = (this._sweepEmit || 0) + dt;
    if (this._sweepEmit >= 0.16) {
      this._sweepEmit = 0;
      const damage = this.phase === 3 ? 40 : 32;
      for (const offset of [0, Math.PI]) {
        const a = this.sweepAngle + offset;
        projectiles.push(new Projectile(cx, cy, Math.cos(a) * 6.2, Math.sin(a) * 6.2, 'boss_laser', damage, true, 2.6, 80));
      }
      if (particleSystem && Math.random() < 0.5) particleSystem.magicSparkle(cx, cy, '#fb7185', 3);
    }
    if (this.sweepTimer <= 0) { this.sweeping = false; this.sweepTimer = 0; }
  }

  summonMinions(projectiles, soundSystem, particleSystem) {
    if (!this.game) return;
    const count = this.phase === 1 ? 2 : this.phase === 2 ? 3 : 4;
    for (let i = 0; i < count; i++) {
      const species = i % 2 ? 'imp' : (this.phase === 3 ? 'bone_serpent' : 'hellhound');
      const minion = new UnderworldMonster(this.x + (i - 1) * 46, this.y - 20, species);
      if (this.phase >= 2) minion.makeElite();
      // Minions hit meaningfully harder alongside the boss instead of being
      // ignorable chip damage while the player's attention is on the Demon.
      minion.damage = Math.round((minion.damage || 12) * (1 + this.phase * 0.25));
      this.game.monsters.push(minion);
      particleSystem?.bloodBurst(minion.x + minion.width / 2, minion.y + minion.height / 2, '#f97316', 14);
    }
    soundSystem?.playBossRoar();
    this.minionTimer = this.phase === 3 ? 5 : this.phase === 2 ? 7 : 9;
  }

  chooseAttack(player) {
    // The maelstrom sweep is phase 3's signature: it is weighted heavily so the
    // final phase actually feels like a different fight, and it is never picked
    // twice in a row.
    const options = this.phase === 1
      ? ['ring', 'blink', 'summon']
      : this.phase === 2
        ? ['ring', 'blink', 'rain', 'summon', 'sweep']
        : ['ring', 'blink', 'rain', 'summon', 'sweep', 'sweep', 'ring'];
    let choice = options[Math.floor(Math.random() * options.length)];
    if (choice === this.lastAttack && options.length > 1) choice = options[(options.indexOf(choice) + 1) % options.length];
    this.lastAttack = choice; this.attackHistory.push(choice); if (this.attackHistory.length > 5) this.attackHistory.shift();
    this.stateTimer = choice === 'blink' ? 0.55 : choice === 'rain' ? 0.85 : choice === 'sweep' ? 1.0 : 0.7;
    this.telegraph = {
      type: choice === 'blink' ? 'line' : choice === 'rain' ? 'target' : choice === 'sweep' ? 'sweep' : choice === 'ring' ? 'ring' : 'summon',
      timer: this.stateTimer, total: this.stateTimer,
      x: player.x + player.width / 2, y: player.y + player.height / 2
    };
    this.attackState = `tell_${choice}`;
  }


  castleBounds(world) {
    const castle = world && world.underworld;
    if (!castle) return null;
    const left = (castle.castleLeft + 4) * TILE_SIZE;
    const right = (castle.castleRight - 4) * TILE_SIZE - this.width;
    const top = (castle.castleTop + 3) * TILE_SIZE;
    const bottom = castle.floorY * TILE_SIZE - this.height;
    return { left, right: Math.max(left, right), top, bottom: Math.max(top, bottom) };
  }

  positionClear(x, y, world) {
    if (!world) return true;
    const points = [
      [x + 4, y + 4], [x + this.width - 4, y + 4],
      [x + 4, y + this.height - 4], [x + this.width - 4, y + this.height - 4],
      [x + this.width / 2, y + this.height / 2]
    ];
    return points.every(([px, py]) => {
      const tile = world.getTile(Math.floor(px / TILE_SIZE), Math.floor(py / TILE_SIZE));
      const prop = TILE_PROPERTIES[tile];
      return !prop || !prop.solid;
    });
  }

  pathClear(x, y, world) {
    if (!world) return true;
    const distance = Math.hypot(x - this.x, y - this.y);
    const steps = Math.max(1, Math.ceil(distance / 14));
    for (let i = 1; i <= steps; i++) {
      const t = i / steps;
      if (!this.positionClear(this.x + (x - this.x) * t, this.y + (y - this.y) * t, world)) return false;
    }
    return true;
  }

  safeBossPosition(x, y, world) {
    if (!world) return { x, y };
    const bounds = this.castleBounds(world);
    const fallbackX = bounds ? Math.max(bounds.left, Math.min(bounds.right, this.x)) : Math.max(0, Math.min(world.pixelWidth - this.width, this.x));
    const fallbackY = bounds ? Math.max(bounds.top, Math.min(bounds.bottom, this.y)) : Math.max(0, Math.min(world.pixelHeight - this.height, this.y));
    const candidate = {
      x: bounds ? Math.max(bounds.left, Math.min(bounds.right, x)) : Math.max(0, Math.min(world.pixelWidth - this.width, x)),
      y: bounds ? Math.max(bounds.top, Math.min(bounds.bottom, y)) : Math.max(0, Math.min(world.pixelHeight - this.height, y))
    };
    if (this.positionClear(candidate.x, candidate.y, world) && this.pathClear(candidate.x, candidate.y, world)) return candidate;

    const slideX = { x: candidate.x, y: this.y };
    if (this.positionClear(slideX.x, slideX.y, world) && this.pathClear(slideX.x, slideX.y, world)) return slideX;
    const slideY = { x: this.x, y: candidate.y };
    if (this.positionClear(slideY.x, slideY.y, world) && this.pathClear(slideY.x, slideY.y, world)) return slideY;
    return { x: fallbackX, y: fallbackY };
  }

  beginAttack(attack, player, projectiles, soundSystem, particleSystem) {
    const cx = this.x + this.width / 2, cy = this.y + this.height / 2;
    if (attack === 'ring') this.spawnRing(projectiles, soundSystem, particleSystem);
    else if (attack === 'sweep') this.startSweep(projectiles, soundSystem, particleSystem);
    else if (attack === 'rain') {
      const count = this.phase === 3 ? 19 : this.phase === 2 ? 13 : 9;
      const damage = 34 + this.phase * 10;
      for (let i = 0; i < count; i++) {
        const x = player.x - 260 + i * (520 / Math.max(1, count - 1));
        projectiles.push(new Projectile(x, player.y - 360, 0, 5.5 + this.phase * 0.7, 'boss_laser', damage, true, 4.8, 80));
      }
      soundSystem?.playBossLaser();
    } else if (attack === 'blink') {
      const desiredX = player.x - 190 + Math.random() * 380;
      const desiredY = player.y - 150;
      const safeTarget = this.safeBossPosition(desiredX, desiredY, this.game?.world);
      this.targetX = safeTarget.x; this.targetY = safeTarget.y;
      particleSystem?.magicSparkle(cx, cy, '#f43f5e', 30);
      this.x = safeTarget.x; this.y = safeTarget.y;
      particleSystem?.magicSparkle(this.x + this.width / 2, this.y + this.height / 2, '#fb923c', 44);
      soundSystem?.playBossRoar();
    } else if (attack === 'summon') this.summonMinions(projectiles, soundSystem, particleSystem);
    this.telegraph = null; this.attackState = attack; this.stateTimer = attack === 'blink' ? 0.35 : 0.7;
  }

  update(dt, player, projectiles, soundSystem, particleSystem, world) {
    if (this.dead) return;
    this.animT += dt; this.hitFlash = Math.max(0, this.hitFlash - dt); this.aura = Math.max(0, this.aura - dt * 0.5); this.minionTimer -= dt;
    // The sweep runs on its own clock, independent of the stalk/tell state
    // machine, so it can overlap the boss repositioning between attacks.
    this.updateSweep(dt, projectiles, soundSystem, particleSystem);
    // Phase 3 keeps pressure on: an extra minion wave mid-fight so the arena
    // never becomes a safe corridor to kite in.
    if (this.phase === 3 && !this._pressureFired && this.hp <= this.maxHp * 0.45) {
      this._pressureFired = true;
      this.summonMinions(projectiles, soundSystem, particleSystem);
    }
    const px = player.x + player.width / 2, py = player.y + player.height / 2;
    const cx = this.x + this.width / 2;
    this.facing = px >= cx ? 1 : -1; this.stateTimer -= dt;
    if (this.attackState === 'stalk') {
      const targetX = px - this.facing * 150;
      const targetY = py - 120 + Math.sin(this.animT * 2.4) * 28;
      const desiredX = this.x + (targetX - this.x) * Math.min(1, dt * (this.phase === 3 ? 2.8 : 2.1));
      const desiredY = this.y + (targetY - this.y) * Math.min(1, dt * 2.2);
      const safe = this.safeBossPosition(desiredX, desiredY, world);
      this.x = safe.x; this.y = safe.y;
      if (this.stateTimer <= 0) this.chooseAttack(player);
    } else if (this.attackState.startsWith('tell_')) {
      if (this.stateTimer <= 0) this.beginAttack(this.attackState.slice(5), player, projectiles, soundSystem, particleSystem);
    } else if (this.stateTimer <= 0) {
      this.attackState = 'stalk'; this.stateTimer = Math.max(0.45, 1.25 - this.phase * 0.22); this.telegraph = null;
    }
    if (world) {
      const safe = this.safeBossPosition(this.x, this.y, world);
      this.x = safe.x; this.y = safe.y;
    }
  }


  render(ctx, camera) {
    const sx = this.x - camera.x, sy = this.y - camera.y;
    // The live maelstrom beams are drawn UNDER the body so the demon stays
    // readable on top of its own effect instead of being buried in it.
    if (this.sweeping) this.renderSweep(ctx, camera);
    const body = this.phase === 3 ? '#4c0519' : this.phase === 2 ? '#701a2c' : '#3f1720';
    const edge = this.phase === 3 ? '#ff4d6d' : '#fb923c';
    const t = this.animT;
    const pulse = 0.75 + Math.sin(t * 3.2) * 0.25;
    ctx.save(); ctx.translate(sx, sy);
    if (this.facing === -1) { ctx.translate(this.width, 0); ctx.scale(-1, 1); }
    // Aura: two passes, a wide soft halo plus a tighter hot core, breathing with
    // the phase. Phase 3 burns hottest so the escalation is visible at a glance.
    const auraHeat = this.phase === 3 ? 1 : this.phase === 2 ? 0.7 : 0.45;
    ctx.globalCompositeOperation = 'lighter';
    ctx.globalAlpha = (0.14 + this.aura * 0.3) * auraHeat + 0.06;
    ctx.fillStyle = edge;
    ctx.fillRect(-20, 2, this.width + 40, this.height + 6);
    ctx.globalAlpha = (0.2 + this.aura * 0.4) * auraHeat;
    ctx.fillRect(-6, 12, this.width + 12, this.height - 12);
    ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';
    ctx.fillStyle = '#1b0714'; ctx.beginPath(); ctx.moveTo(9, 25); ctx.lineTo(-18, 2); ctx.lineTo(-8, 43); ctx.lineTo(13, 49); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#260a1e'; ctx.beginPath(); ctx.moveTo(63, 25); ctx.lineTo(90, 2); ctx.lineTo(80, 43); ctx.lineTo(59, 49); ctx.closePath(); ctx.fill();
    ctx.fillStyle = body; ctx.fillRect(16, 18, 40, 49); ctx.fillRect(25, 8, 22, 18);
    ctx.fillStyle = edge; ctx.fillRect(11, 13, 6, 18); ctx.fillRect(55, 13, 6, 18); ctx.fillRect(28, 4, 5, 13); ctx.fillRect(40, 4, 5, 13);
    ctx.fillStyle = '#fb7185'; ctx.fillRect(27, 18, 7, 5); ctx.fillRect(40, 18, 7, 5); ctx.fillRect(35, 27, 5, 3);
    ctx.fillStyle = '#111827'; ctx.fillRect(29, 19, 3, 3); ctx.fillRect(42, 19, 3, 3);
    ctx.fillStyle = '#f59e0b'; ctx.fillRect(31, 34, 11, 15); ctx.fillStyle = '#fef3c7'; ctx.fillRect(34, 38, 5, 7);
    ctx.fillStyle = edge; ctx.fillRect(8, 43, 12, 5); ctx.fillRect(52, 43, 12, 5); ctx.fillRect(18, 64, 11, 10); ctx.fillRect(45, 64, 11, 10);
    ctx.fillStyle = '#fef3c7'; ctx.fillRect(6, 47, 5, 4); ctx.fillRect(61, 47, 5, 4);
    ctx.fillStyle = '#fb923c'; ctx.fillRect(20, 77, 8, 4); ctx.fillRect(46, 77, 8, 4);
    // Ominous armor details: crown, ribbed chest, claws and phase runes.
    ctx.fillStyle = '#1f0717'; ctx.fillRect(22, 27, 28, 3); ctx.fillRect(24, 49, 24, 3);
    ctx.fillStyle = edge; ctx.fillRect(20, 19, 3, 9); ctx.fillRect(49, 19, 3, 9); ctx.fillRect(35, 44, 3, 9);
    ctx.fillStyle = this.phase === 3 ? '#f43f5e' : '#f59e0b'; ctx.globalAlpha = 0.55 + pulse * 0.35;
    ctx.fillRect(29, 31, 3, 3); ctx.fillRect(41, 31, 3, 3); ctx.fillRect(35, 54, 3, 3);
    ctx.globalAlpha = 1;
    ctx.fillStyle = '#fef3c7'; ctx.fillRect(4, 45, 3, 6); ctx.fillRect(65, 45, 3, 6);
    ctx.restore();
    if (this.hitFlash > 0) { ctx.save(); ctx.globalAlpha = Math.min(0.75, this.hitFlash * 7); ctx.fillStyle = '#fff'; ctx.fillRect(sx, sy, this.width, this.height); ctx.restore(); }
    this.renderTelegraph(ctx, camera);
  }

  /** The live rotating maelstrom beams. Drawn as a fading trail, not a hard line. */
  renderSweep(ctx, camera) {
    const cx = this.x + this.width / 2 - camera.x;
    const cy = this.y + this.height / 2 - camera.y;
    const fade = Math.max(0, Math.min(1, this.sweepTimer / 0.6));
    const len = 900;
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    ctx.lineCap = 'round';
    for (const offset of [0, Math.PI]) {
      const a = this.sweepAngle + offset;
      // Three nested strokes fake a soft, hot beam core.
      for (let i = 0; i < 3; i++) {
        ctx.globalAlpha = [0.5, 0.26, 0.13][i] * fade;
        ctx.lineWidth = [7, 15, 26][i];
        ctx.strokeStyle = i === 0 ? '#fff1f2' : (i === 1 ? '#f43f5e' : '#fb923c');
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.lineTo(cx + Math.cos(a) * len, cy + Math.sin(a) * len);
        ctx.stroke();
      }
    }
    // Bright hub at the boss's chest where both beams originate.
    ctx.globalAlpha = 0.65 * fade;
    ctx.fillStyle = '#fecdd3';
    ctx.beginPath(); ctx.arc(cx, cy, 7, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
  }

  renderTelegraph(ctx, camera) {
    const t = this.telegraph; if (!t) return;
    const cx = this.x + this.width / 2 - camera.x, cy = this.y + this.height / 2 - camera.y;
    const progress = Math.max(0, Math.min(1, 1 - t.timer / (t.total || 1)));
    const pulse = 0.55 + Math.sin(Date.now() * 0.014) * 0.35;
    ctx.save(); ctx.globalAlpha = 0.45 + progress * 0.5; ctx.strokeStyle = this.phase === 3 ? '#f43f5e' : '#fb923c'; ctx.fillStyle = '#f97316'; ctx.lineWidth = 3;
    if (t.type === 'ring') { ctx.beginPath(); ctx.arc(cx, cy, 30 + progress * 34, 0, Math.PI * 2); ctx.stroke(); ctx.globalAlpha *= 0.25; ctx.beginPath(); ctx.arc(cx, cy, 70 + progress * 35, 0, Math.PI * 2); ctx.fill(); }
    else if (t.type === 'line') { const tx = t.x - camera.x, ty = t.y - camera.y; const a = Math.atan2(ty - cy, tx - cx); ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(cx + Math.cos(a) * 900, cy + Math.sin(a) * 900); ctx.stroke(); ctx.beginPath(); ctx.arc(tx, ty, 24 - progress * 10, 0, Math.PI * 2); ctx.stroke(); }
    else if (t.type === 'target') { const tx = t.x - camera.x, ty = t.y - camera.y; ctx.beginPath(); ctx.ellipse(tx, ty, 30 + progress * 24, 10 + progress * 8, 0, 0, Math.PI * 2); ctx.stroke(); }
    else if (t.type === 'sweep') {
      // Wind-up for the maelstrom: a growing arc that previews the direction the
      // beam will start sweeping, so the opening is dodgeable rather than blind.
      const r = 40 + progress * 46;
      ctx.lineWidth = 4;
      ctx.beginPath(); ctx.arc(cx, cy, r, this.sweepAngle - 0.5, this.sweepAngle + 0.5); ctx.stroke();
      ctx.globalAlpha *= 0.3;
      ctx.beginPath(); ctx.arc(cx, cy, r * 0.55, this.sweepAngle + Math.PI - 0.5, this.sweepAngle + Math.PI + 0.5); ctx.stroke();
      ctx.font = "bold 11px 'Press Start 2P', monospace"; ctx.textAlign = 'center';
      ctx.fillStyle = '#fda4af'; ctx.fillText('MAELSTROM', cx, cy - r - 14);
    }
    else { ctx.font = "bold 11px 'Press Start 2P', monospace"; ctx.textAlign = 'center'; ctx.fillStyle = '#fda4af'; ctx.fillText('SUMMONING HELL', cx, cy - 56); }
    ctx.restore();
  }
}

if (typeof window !== 'undefined') {
  window.UnderworldMonster = UnderworldMonster;
  window.DemonBoss = DemonBoss;
  window.UNDERWORLD_TILE_IDS = UNDERWORLD_TILE_IDS;
}

