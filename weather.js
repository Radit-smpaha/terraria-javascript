// Terracraft Extreme Weather — gentle showers, thunder storms, blizzards,
// sandstorms and swamp fog. Weather is driven by biome + day/night + a slow
// pressure cycle, and it feeds real particles both behind and in front of entities.

const WEATHER_TYPES = {
  CLEAR: 'clear',
  RAIN: 'rain',
  STORM: 'storm',
  SNOW: 'blizzard',
  SAND: 'sandstorm',
  FOG: 'fog'
};

class WeatherSystem {
  constructor(world) {
    this.world = world;
    this.type = WEATHER_TYPES.CLEAR;
    this.intensity = 0;        // 0..1 fade for the active weather
    this.targetIntensity = 0;
    this.holdTimer = 0;        // how long the current weather sticks around
    this.checkTimer = 0;
    this.rollTimer = 3;

    // Particles live in one pool; kind decides where they draw.
    this.particles = [];
    this.maxParticles = 340;

    // Lightning
    this.lightningFlash = 0;
    this.lightningCooldown = 4;
    this.bolt = null;

    // Wind: -1..1, drives rain slant and snow drift
    this.wind = 0;

    this.label = '';
    this.tint = null;
  }

  /* ---------------- Weather selection ---------------- */

  pickWeather(player, world) {
    const tileX = Math.floor((player.x + player.width / 2) / TILE_SIZE);
    const tileY = Math.floor((player.y + player.height / 2) / TILE_SIZE);
    const biome = world.getBiomeAtX(tileX);
    const underground = tileY > world.surfaceHeights[tileX] + 8;
    const night = world.isNight();

    // Underground weather is just dripping water and darkness.
    if (underground) {
      return { type: WEATHER_TYPES.CLEAR, hold: 12, label: '' };
    }

    const roll = Math.random();

    if (biome === 'snow') {
      if (roll < 0.62) return { type: WEATHER_TYPES.SNOW, hold: 26 + Math.random() * 20, label: 'Blizzard' };
      return { type: WEATHER_TYPES.CLEAR, hold: 14, label: '' };
    }

    if (biome === 'plains') {
      // Minecraft's plains are the fair-weather biome: mostly clear, and when it
      // does rain it is a shower rather than a storm.
      if (roll < 0.28) return { type: WEATHER_TYPES.RAIN, hold: 18 + Math.random() * 12, label: 'Rain' };
      return { type: WEATHER_TYPES.CLEAR, hold: 20 + Math.random() * 12, label: '' };
    }

    if (biome === 'savanna') {
      if (roll < 0.45) return { type: WEATHER_TYPES.SAND, hold: 22 + Math.random() * 16, label: 'Sandstorm' };
      return { type: WEATHER_TYPES.CLEAR, hold: 14, label: '' };
    }

    if (biome === 'swamp') {
      if (roll < 0.5) return { type: WEATHER_TYPES.FOG, hold: 24 + Math.random() * 18, label: 'Swamp Fog' };
      if (roll < 0.78) return { type: WEATHER_TYPES.RAIN, hold: 20 + Math.random() * 14, label: 'Marsh Rain' };
      return { type: WEATHER_TYPES.CLEAR, hold: 12, label: '' };
    }

    // Temperate forest: rain by day, thunder storms mostly at night
    if (roll < (night ? 0.42 : 0.3)) {
      return { type: WEATHER_TYPES.STORM, hold: 24 + Math.random() * 16, label: 'Thunderstorm' };
    }
    if (roll < 0.6) {
      return { type: WEATHER_TYPES.RAIN, hold: 20 + Math.random() * 16, label: 'Rain' };
    }
    return { type: WEATHER_TYPES.CLEAR, hold: 16 + Math.random() * 10, label: '' };
  }

  /* ---------------- Update ---------------- */

  update(dt, game) {
    const world = this.world;
    const player = game.player;

    // Slow wind drift
    this.wind += (Math.sin(Date.now() * 0.00013) * 0.5 - this.wind) * dt * 0.4;

    // Re-evaluate what the sky is doing
    this.checkTimer -= dt;
    if (this.checkTimer <= 0) {
      this.checkTimer = 6;
      const tileX = Math.floor((player.x + player.width / 2) / TILE_SIZE);
      const tileY = Math.floor((player.y + player.height / 2) / TILE_SIZE);
      const underground = tileY > world.surfaceHeights[tileX] + 8;

      if (underground && this.type !== WEATHER_TYPES.CLEAR) {
        this.targetIntensity = 0;
        this.holdTimer = Math.min(this.holdTimer, 4);
      } else if (this.holdTimer <= 0 && this.targetIntensity === 0) {
        const picked = this.pickWeather(player, world);
        this.setWeather(picked.type, picked.hold, picked.label, game);
      }
    }

    if (this.holdTimer > 0) this.holdTimer -= dt;
    if (this.holdTimer <= 0 && this.targetIntensity > 0) {
      this.targetIntensity = 0;
    }

    // Fade toward target
    const rate = this.intensity < this.targetIntensity ? 0.22 : 0.4;
    this.intensity += (this.targetIntensity - this.intensity) * Math.min(1, rate * dt * 4);
    if (this.intensity < 0.01 && this.targetIntensity === 0) {
      this.intensity = 0;
      this.label = '';
      this.tint = null;
    }

    this.updateParticles(dt, game);
    this.updateLightning(dt, game);
  }

  setWeather(type, hold, label, game) {
    const wasClear = this.type === WEATHER_TYPES.CLEAR;
    this.type = type;
    this.label = label || '';
    this.holdTimer = hold;
    this.targetIntensity = type === WEATHER_TYPES.CLEAR ? 0 : 1;

    if (type !== WEATHER_TYPES.CLEAR && wasClear) {
      game.showToast(this.iconFor(type) + ' ' + this.label + ' rolls in...');
    } else if (type !== WEATHER_TYPES.CLEAR && label) {
      game.showToast(this.iconFor(type) + ' ' + this.label + ' continues.');
    }

    if (type === WEATHER_TYPES.STORM) {
      this.lightningCooldown = 2 + Math.random() * 3;
    }
  }

  iconFor(type) {
    switch (type) {
      case WEATHER_TYPES.RAIN: return '🌧️';
      case WEATHER_TYPES.STORM: return '⛈️';
      case WEATHER_TYPES.SNOW: return '❄️';
      case WEATHER_TYPES.SAND: return '🌪️';
      case WEATHER_TYPES.FOG: return '🌫️';
      default: return '☁️';
    }
  }

  /* ---------------- Particles ---------------- */

  spawnRate() {
    switch (this.type) {
      case WEATHER_TYPES.RAIN: return 150;
      case WEATHER_TYPES.STORM: return 260;
      case WEATHER_TYPES.SNOW: return 70;
      case WEATHER_TYPES.SAND: return 130;
      case WEATHER_TYPES.FOG: return 10;
      default: return 0;
    }
  }

  updateParticles(dt, game) {
    const cam = game.camera;
    const density = Math.max(0.1, Math.min(1, game.particleScale || 1));
    this.maxParticles = Math.max(24, Math.round(340 * density));
    const spray = this.spawnRate() * this.intensity * dt * density;

    let toSpawn = spray + (Math.random() < (spray % 1) ? 1 : 0);
    while (toSpawn-- > 0 && this.particles.length < this.maxParticles) {
      this.particles.push(this.makeParticle(cam));
    }

    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.life -= dt;

      if (p.kind === 'fog') {
        p.x += p.vx * dt;
        p.y += Math.sin(p.life * 1.5 + p.seed) * 4 * dt;
      } else {
        p.x += (p.vx + this.wind * p.windFactor) * dt;
        p.y += p.vy * dt;
      }

      // Off-screen or expired
      if (p.life <= 0 || p.y > cam.viewportHeight + 20 || p.x < -80 || p.x > cam.viewportWidth + 80) {
        this.particles.splice(i, 1);
        continue;
      }

      // Rain/snow splashes on the surface instead of passing through the ground
      if (p.splash && p.y > p.groundScreenY && p.groundScreenY > 0) {
        this.hitGround(p, cam);
        this.particles.splice(i, 1);
      }
    }
  }

  makeParticle(cam) {
    const vw = cam.viewportWidth;
    const vh = cam.viewportHeight;
    const x = Math.random() * (vw + 120) - 60;

    // Find the on-screen ground height at this x so drops stop at terrain
    const worldTileX = Math.floor((x + cam.x) / TILE_SIZE);
    let groundScreenY = -1;
    if (worldTileX >= 0 && worldTileX < this.world.width) {
      const surfaceY = this.world.surfaceHeights[worldTileX];
      groundScreenY = surfaceY * TILE_SIZE - cam.y;
    }

    switch (this.type) {
      case WEATHER_TYPES.RAIN:
      case WEATHER_TYPES.STORM: {
        const stormy = this.type === WEATHER_TYPES.STORM ? 1.35 : 1;
        return {
          kind: 'rain',
          x,
          y: -20 - Math.random() * 60,
          vx: 40 * stormy,
          vy: (620 + Math.random() * 260) * stormy,
          len: 9 + Math.random() * 10,
          windFactor: 0.6,
          life: 3,
          splash: true,
          groundScreenY
        };
      }
      case WEATHER_TYPES.SNOW:
        return {
          kind: 'snow',
          x,
          y: -20 - Math.random() * 40,
          vx: (Math.random() - 0.5) * 30,
          vy: 34 + Math.random() * 46,
          size: 1 + Math.random() * 2,
          windFactor: 2.2,
          life: 12,
          splash: false,
          groundScreenY
        };
      case WEATHER_TYPES.SAND:
        return {
          kind: 'sand',
          x: Math.random() > 0.5 ? -30 : vw + 30,
          y: Math.random() * vh,
          vx: (Math.random() > 0.5 ? 1 : -1) * (220 + Math.random() * 260),
          vy: (Math.random() - 0.5) * 40,
          size: 1 + Math.random() * 2.4,
          windFactor: 0.2,
          life: 2.4,
          splash: false,
          groundScreenY: -1
        };
      case WEATHER_TYPES.FOG:
      default:
        return {
          kind: 'fog',
          x: Math.random() * vw,
          y: Math.random() * vh * 0.75,
          vx: 8 + Math.random() * 14,
          vy: 0,
          size: 70 + Math.random() * 120,
          seed: Math.random() * 10,
          windFactor: 0,
          life: 9 + Math.random() * 6,
          splash: false,
          groundScreenY: -1
        };
    }
  }

  hitGround(p, cam) {
    // Small splash spark: cheap, and it sells that the rain is landing on something
    const sx = p.x;
    const sy = p.groundScreenY;
    if (sx < -10 || sx > cam.viewportWidth + 10) return;

    let splash = this._splashes;
    if (!splash) {
      splash = this._splashes = [];
    }
    if (splash.length > 60) return;

    splash.push({
      x: sx,
      y: sy,
      vx: (Math.random() - 0.5) * 40,
      vy: -20 - Math.random() * 50,
      life: 0.22 + Math.random() * 0.18
    });
  }

  /* ---------------- Lightning ---------------- */

  updateLightning(dt, game) {
    if (this.lightningFlash > 0) {
      this.lightningFlash = Math.max(0, this.lightningFlash - dt * 3.4);
    }

    if (this.bolt) {
      this.bolt.life -= dt;
      if (this.bolt.life <= 0) this.bolt = null;
    }

    if (this.type !== WEATHER_TYPES.STORM || this.intensity < 0.4) return;

    this.lightningCooldown -= dt * this.intensity;
    if (this.lightningCooldown > 0) return;

    this.lightningCooldown = 3.5 + Math.random() * 7;

    const cam = game.camera;
    const strikeScreenX = Math.random() * cam.viewportWidth;
    const strikeWorldX = strikeScreenX + cam.x;
    const tileX = Math.floor(strikeWorldX / TILE_SIZE);

    // Build a jagged bolt from the top of the screen down to the terrain
    const segments = [];
    let x = strikeScreenX;
    let y = -10;
    const groundScreenY = (tileX >= 0 && tileX < this.world.width)
      ? this.world.surfaceHeights[tileX] * TILE_SIZE - cam.y
      : cam.viewportHeight * 0.7;

    const steps = 14;
    for (let i = 0; i < steps; i++) {
      segments.push({ x, y });
      const stepY = (groundScreenY - y) / (steps - i);
      y += stepY;
      x += (Math.random() - 0.5) * 46;
    }
    segments.push({ x: strikeScreenX + (Math.random() - 0.5) * 20, y: groundScreenY });

    this.bolt = { points: segments, life: 0.28, groundScreenY, strikeScreenX };
    this.lightningFlash = 1;

    game.sound.playExplosion();
    game.sound.playBossRoar();

    // Close strikes actually hurt — a lightning rod's worth of respect.
    const hitRadius = 90;
    for (const [ent, label] of [[game.player, 'player'], ...game.monsters.map(m => [m, 'monster'])]) {
      if (!ent) continue;
      const ex = ent.x + (ent.width || 0) / 2 - cam.x;
      const ey = ent.y + (ent.height || 0) / 2 - cam.y;
      if (Math.hypot(ex - strikeScreenX, ey - groundScreenY) > hitRadius) continue;

      if (label === 'player') {
        // Grounded metal hurts more than a wooden sword; dodge i-frames still apply.
        ent.takeDamage(18, game.sound, game.particles);
        game.showToast('⚡ Lightning strikes you!');
      } else {
        ent.takeDamage(60, game.sound, game.particles, false);
      }
    }

    game.particles.bloodBurst(strikeScreenX + cam.x, groundScreenY + cam.y, '#fef08a', 18);
    game.showToast('⚡ Lightning strikes the forest!');
  }

  /* ---------------- Render ---------------- */

  /**
   * One baked fog puff: a radial alpha falloff rasterised ONCE into a small
   * offscreen canvas. FOG weather used to call createRadialGradient() for
   * every puff on every frame (up to ~30 a frame) — gradients are expensive
   * to build, and this was pure waste for a shape that never changes. The
   * sprite is blitted with globalAlpha carrying the per-puff fade and scaled
   * to p.size, which reproduces the same falloff at any radius.
   */
  fogSprite() {
    if (this._fogSprite) return this._fogSprite;
    const cv = document.createElement('canvas');
    cv.width = cv.height = 96;
    const g = cv.getContext && cv.getContext('2d');
    if (!g) return null;
    const grad = g.createRadialGradient(48, 48, 0, 48, 48, 48);
    grad.addColorStop(0, 'rgba(206, 219, 214, 0.1)');
    grad.addColorStop(1, 'rgba(206, 219, 214, 0)');
    g.fillStyle = grad;
    g.fillRect(0, 0, 96, 96);
    this._fogSprite = cv;
    return cv;
  }

  render(game, ctx, cam, layer) {
    if (this.intensity <= 0.01 && !this.bolt) return;

    if (layer === 'back') {
      // Atmospheric tint behind entities
      if (this.type === WEATHER_TYPES.FOG) {
        ctx.save();
        ctx.fillStyle = `rgba(190, 205, 200, ${0.16 * this.intensity})`;
        ctx.fillRect(0, 0, cam.viewportWidth, cam.viewportHeight);
        ctx.restore();
      } else if (this.type === WEATHER_TYPES.SAND) {
        ctx.save();
        ctx.fillStyle = `rgba(214, 158, 74, ${0.1 * this.intensity})`;
        ctx.fillRect(0, 0, cam.viewportWidth, cam.viewportHeight);
        ctx.restore();
      } else if (this.type === WEATHER_TYPES.STORM) {
        ctx.save();
        ctx.fillStyle = `rgba(20, 26, 48, ${0.16 * this.intensity})`;
        ctx.fillRect(0, 0, cam.viewportWidth, cam.viewportHeight);
        ctx.restore();
      }
      return;
    }

    // ---- Front layer: particles, bolt, flash ----
    ctx.save();

    // PERF: every weather particle used to be its own beginPath()+stroke()
    // (or gradient+fill) with a freshly formatted rgba() string — during a
    // storm that is hundreds of style parses and draw calls a frame, plus a
    // radial gradient built per fog puff per frame. The particle's only
    // per-instance variation is a fading alpha, so alpha is QUANTISED into 8
    // buckets: every particle in a bucket joins ONE path and is stroked (or
    // filled) in a single call with one style. The largest visual difference
    // is a ~0.06 alpha step on a 1-px streak — not perceivable against a
    // moving sky, for a few percent of the draw calls.
    const buckets = this._particleBuckets || (this._particleBuckets = {});
    const bucketArray = (key) => {
      const arr = buckets[key] || (buckets[key] = []);
      for (let i = 0; i < 8; i++) (arr[i] || (arr[i] = [])).length = 0;
      return arr;
    };
    const rainB = bucketArray('rain');
    const sandB = bucketArray('sand');
    const snowB = bucketArray('snow');
    const bucketOf = (a) => Math.min(7, Math.max(0, (a * 8) | 0));

    for (const p of this.particles) {
      switch (p.kind) {
        case 'rain': {
          const a = Math.min(1, p.life) * this.intensity;
          const slantX = (p.vx + this.wind * p.windFactor) * 0.02;
          const slantY = p.vy * 0.02;
          const seg = rainB[bucketOf(a)];
          seg.push(p.x - slantX * p.len, p.y - slantY * p.len, p.x, p.y);
          break;
        }
        case 'snow': {
          const a = Math.min(1, p.life / 3) * this.intensity;
          if (a > 0) {
            const seg = snowB[bucketOf(a)];
            seg.push(p.x, p.y, p.size, p.size);
          }
          break;
        }
        case 'sand': {
          const a = Math.min(1, p.life / 1.5) * this.intensity;
          const seg = sandB[bucketOf(a)];
          seg.push(p.x, p.y, p.x - Math.sign(p.vx) * (6 + p.size), p.y);
          break;
        }
        case 'fog': {
          const fade = Math.min(1, p.life / 4) * this.intensity;
          if (fade <= 0.01) break;
          // One baked puff sprite (built once) scaled to p.size, instead of
          // a radial gradient built and rasterised per puff per frame.
          const sprite = this.fogSprite();
          if (!sprite) break;
          ctx.globalAlpha = fade;
          ctx.drawImage(sprite, p.x - p.size, p.y - p.size, p.size * 2, p.size * 2);
          break;
        }
      }
    }
    ctx.globalAlpha = 1;

    // One style + one path (rain/sand) or one fillStyle (snow) per bucket.
    ctx.lineWidth = 1;
    for (let i = 0; i < 8; i++) {
      const mid = ((i + 0.5) / 8).toFixed(4);
      const r = rainB[i];
      if (r.length) {
        ctx.strokeStyle = `rgba(174, 214, 241, ${(0.5 * Number(mid)).toFixed(3)})`;
        ctx.beginPath();
        for (let k = 0; k < r.length; k += 4) {
          ctx.moveTo(r[k], r[k + 1]);
          ctx.lineTo(r[k + 2], r[k + 3]);
        }
        ctx.stroke();
      }
      const s = sandB[i];
      if (s.length) {
        ctx.strokeStyle = `rgba(226, 184, 110, ${(0.55 * Number(mid)).toFixed(3)})`;
        ctx.beginPath();
        for (let k = 0; k < s.length; k += 4) {
          ctx.moveTo(s[k], s[k + 1]);
          ctx.lineTo(s[k + 2], s[k + 3]);
        }
        ctx.stroke();
      }
      const n = snowB[i];
      if (n.length) {
        ctx.fillStyle = `rgba(255, 255, 255, ${(0.8 * Number(mid)).toFixed(3)})`;
        for (let k = 0; k < n.length; k += 4) {
          ctx.fillRect(n[k], n[k + 1], n[k + 2], n[k + 3]);
        }
      }
    }

    // Splash sparks where rain lands
    if (this._splashes) {
      for (let i = this._splashes.length - 1; i >= 0; i--) {
        const s = this._splashes[i];
        s.life -= 1 / 60;
        if (s.life <= 0) {
          this._splashes.splice(i, 1);
          continue;
        }
        s.x += s.vx / 60;
        s.y += s.vy / 60;
        s.vy += 260 / 60;
        ctx.fillStyle = `rgba(200, 230, 255, ${0.6 * (s.life / 0.4) * this.intensity})`;
        ctx.fillRect(s.x, s.y, 1.5, 1.5);
      }
    }

    // The bolt itself
    if (this.bolt) {
      const fade = this.bolt.life / 0.28;
      ctx.strokeStyle = `rgba(255, 255, 255, ${fade})`;
      ctx.lineWidth = 3.5;
      ctx.shadowColor = '#bfe9ff';
      ctx.shadowBlur = 18;
      ctx.beginPath();
      const pts = this.bolt.points;
      ctx.moveTo(pts[0].x, pts[0].y);
      for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i].x, pts[i].y);
      ctx.stroke();

      // Thin inner core
      ctx.strokeStyle = `rgba(255, 255, 255, ${fade})`;
      ctx.lineWidth = 1.2;
      ctx.stroke();
      ctx.shadowBlur = 0;
    }

    // Whole-screen flash for the strike
    if (this.lightningFlash > 0.01) {
      ctx.fillStyle = `rgba(210, 235, 255, ${this.lightningFlash * 0.4})`;
      ctx.fillRect(0, 0, cam.viewportWidth, cam.viewportHeight);
    }

    ctx.restore();
  }
}

window.WEATHER_TYPES = WEATHER_TYPES;
window.WeatherSystem = WeatherSystem;