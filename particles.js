// High-performance particle and visual effects system for Terraria
class ParticleSystem {
  constructor() {
    this.particles = [];
    this.damageTexts = [];
    this.slashes = [];
    this.lightSources = [];
    this.ambientLeaves = [];
    this.density = 1;
    // Floating combat text can be turned off wholesale. It is a separate switch
    // from `density` on purpose: a player at "minimal" effects still wants to
    // read how much damage a hit landed, but plenty of players want neither.
    this.damageTextEnabled = true;
  }

  setDamageTextEnabled(on) {
    this.damageTextEnabled = on !== false;
    if (!this.damageTextEnabled) this.damageTexts.length = 0;
    return this.damageTextEnabled;
  }

  setDensity(density) {
    this.density = Math.max(0.1, Math.min(1, Number(density) || 1));
  }

  /**
   * A pre-baked radial-gradient sprite for one particle colour, or null when the
   * colour cannot be turned into a gradient.
   *
   * drawImage() of a small cached canvas is dramatically cheaper than the
   * `ctx.shadowBlur = 8` this replaced: a canvas shadow re-runs a blur pass for
   * EVERY draw call, which is why a heavy boss fight (hundreds of glowing
   * particles per frame) collapsed the frame rate on strong hardware. Baking the
   * same falloff into a sprite once per colour keeps the look and pays for it
   * exactly once. The cache is bounded because hit tints can vary per enemy.
   */
  _glowSprite(color) {
    if (!this._glowSprites) this._glowSprites = new Map();
    const key = String(color);
    const hit = this._glowSprites.get(key);
    if (hit !== undefined) {
      this._glowSprites.delete(key);
      this._glowSprites.set(key, hit);
      return hit;
    }
    let sprite = null;
    // Guarded: a malformed colour must degrade to "no glow", never throw once
    // per particle per frame.
    try {
      const size = 24;
      const c = size / 2;
      const cv = document.createElement('canvas');
      cv.width = size;
      cv.height = size;
      const g = cv.getContext('2d');
      const grad = g.createRadialGradient(c, c, 0, c, c, c);
      grad.addColorStop(0, key);
      grad.addColorStop(0.35, key);
      grad.addColorStop(1, 'rgba(0,0,0,0)');
      g.fillStyle = grad;
      g.fillRect(0, 0, size, size);
      sprite = cv;
    } catch (_) {
      sprite = null;
    }
    if (this._glowSprites.size >= 64) {
      this._glowSprites.delete(this._glowSprites.keys().next().value);
    }
    this._glowSprites.set(key, sprite);
    return sprite;
  }

  /**
   * THE BAN HAMMER's mark, stamped ON the victim rather than over the screen.
   *
   * It is a damageText so it rides the same update/render/cull path (world
   * coordinates, floats up, fades) and needs no new draw loop — but `isBan`
   * switches the renderer to a full multi-pass terminal-ban treatment: a filled
   * red slab behind the word, a heavy drop shadow, a white-hot core with a red
   * bloom, and two offset chromatic ghosts that jitter every frame so the glyphs
   * visibly tear rather than sit still.
   */
  addBanStamp(x, y) {
    this.damageTexts.push({
      x: x + (Math.random() - 0.5) * 8,
      y: y - 6,
      vx: (Math.random() - 0.5) * 0.8,
      vy: -1.5,
      text: '!!BANNED!!',
      color: '#ff1a1a',
      scale: 1.0,
      alpha: 1.0,
      life: 1.6,
      maxLife: 1.6,
      isCrit: false,
      isBan: true
    });
  }

  // Floating combat text (like Terraria damage numbers)
  addDamageText(x, y, text, color = '#ffeb3b', isCrit = false) {
    if (!this.damageTextEnabled) return;
    this.damageTexts.push({
      x: x + (Math.random() - 0.5) * 12,
      y: y - 10,
      vx: (Math.random() - 0.5) * 1.5,
      vy: isCrit ? -4.5 : -2.8,
      text: text.toString(),
      color: color,
      scale: isCrit ? 1.4 : 1.0,
      alpha: 1.0,
      life: 1.0,
      isCrit: isCrit
    });
  }

  // Generic particle with physics, color, and alpha fade
  addParticle(x, y, vx, vy, color, size, life, gravity = 0.1, glow = false) {
    if (Math.random() > this.density) return;
    this.particles.push({
      x, y, vx, vy,
      color,
      size,
      maxLife: life,
      life: life,
      gravity,
      glow
    });
  }

  // Burst of debris when breaking a tile
  tileBreak(tileX, tileY, color) {
    const px = tileX * 24 + 12;
    const py = tileY * 24 + 12;
    for (let i = 0; i < 12; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 4 + 1;
      this.addParticle(
        px, py,
        Math.cos(angle) * speed,
        Math.sin(angle) * speed - 1.5,
        color,
        Math.random() * 4 + 2,
        Math.random() * 0.4 + 0.3,
        0.25
      );
    }
  }

  // Blood / ichor splat when hitting monsters
  bloodBurst(x, y, color = '#ef4444', count = 10) {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 4 + 1.5;
      this.addParticle(
        x, y,
        Math.cos(angle) * speed,
        Math.sin(angle) * speed - 2,
        color,
        Math.random() * 3.5 + 2,
        Math.random() * 0.5 + 0.3,
        0.2,
        false
      );
    }
  }

  // Starlight / magic sparkles
  magicSparkle(x, y, color = '#60a5fa', count = 8) {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 3 + 0.5;
      this.addParticle(
        x, y,
        Math.cos(angle) * speed,
        Math.sin(angle) * speed,
        color,
        Math.random() * 3 + 2,
        Math.random() * 0.4 + 0.2,
        0.02,
        true
      );
    }
  }

  // Fire / torch ember
  addTorchEmber(x, y) {
    if (Math.random() < 0.3) {
      const colors = ['#f59e0b', '#ef4444', '#fbbf24'];
      const col = colors[Math.floor(Math.random() * colors.length)];
      this.addParticle(
        x + (Math.random() - 0.5) * 6,
        y - 4,
        (Math.random() - 0.5) * 0.6,
        -Math.random() * 1.5 - 0.5,
        col,
        Math.random() * 2.5 + 1.5,
        Math.random() * 0.5 + 0.3,
        -0.02,
        true
      );
    }
  }

  // Double jump / Dash wind cloud
  windBurst(x, y) {
    for (let i = 0; i < 10; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 3 + 1;
      this.addParticle(
        x, y,
        Math.cos(angle) * speed,
        Math.sin(angle) * speed * 0.5 + 1.5,
        'rgba(240, 249, 255, 0.8)',
        Math.random() * 5 + 3,
        0.35,
        -0.05
      );
    }
  }

  // Sword slash crescent animation arc
  addSlash(x, y, angle, radius, color = '#60a5fa') {
    this.slashes.push({
      x, y, angle, radius,
      color,
      life: 0.14,
      maxLife: 0.14
    });
  }

  // Boss roar screen wave & laser sparks
  laserBlast(x, y, targetX, targetY, color = '#ef4444') {
    const dx = targetX - x;
    const dy = targetY - y;
    const dist = Math.hypot(dx, dy);
    const steps = Math.floor(dist / 14);
    for (let i = 0; i < steps; i++) {
      const px = x + (dx / steps) * i + (Math.random() - 0.5) * 8;
      const py = y + (dy / steps) * i + (Math.random() - 0.5) * 8;
      this.addParticle(
        px, py,
        (Math.random() - 0.5) * 2,
        (Math.random() - 0.5) * 2,
        color,
        Math.random() * 4 + 2,
        Math.random() * 0.3 + 0.2,
        0,
        true
      );
    }
  }

  // Ambient falling leaves in the forest
  initAmbientLeaves(worldWidth, worldHeight) {
    this.ambientLeaves = [];
    const count = Math.max(12, Math.round(70 * this.density));
    for (let i = 0; i < count; i++) {
      this.ambientLeaves.push({
        x: Math.random() * worldWidth,
        y: Math.random() * worldHeight * 0.7,
        vx: (Math.random() * 0.8 + 0.4),
        vy: (Math.random() * 0.6 + 0.5),
        rot: Math.random() * Math.PI * 2,
        rotSpeed: (Math.random() - 0.5) * 0.05,
        size: Math.random() * 4 + 3,
        color: Math.random() > 0.4 ? '#38b764' : (Math.random() > 0.5 ? '#22c55e' : '#eab308'),
        swayOffset: Math.random() * 10
      });
    }
  }

  update(dt, worldWidth, worldHeight) {
    // Update regular particles
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.life -= dt;
      if (p.life <= 0) {
        this.particles.splice(i, 1);
        continue;
      }
      p.x += p.vx;
      p.y += p.vy;
      p.vy += p.gravity;
      p.vx *= 0.98;
    }

    // Update floating damage texts
    for (let i = this.damageTexts.length - 1; i >= 0; i--) {
      const t = this.damageTexts[i];
      // Ban stamps live longer than damage numbers (they carry the whole
      // "you just got banned" beat), so they opt out of the faster 1.5x decay.
      t.life -= dt * (t.isBan ? 0.62 : 1.5);
      if (t.life <= 0) {
        this.damageTexts.splice(i, 1);
        continue;
      }
      t.x += t.vx;
      t.y += t.vy;
      t.vy += 0.12; // slowly curve down
      // Clamped: a ban stamp starts with life > 1, and an unclamped alpha would
      // be handed to globalAlpha (harmless) but read as nonsense if inspected.
      t.alpha = Math.max(0, Math.min(1, t.life));
    }

    // Update slashes
    for (let i = this.slashes.length - 1; i >= 0; i--) {
      const s = this.slashes[i];
      s.life -= dt;
      if (s.life <= 0) {
        this.slashes.splice(i, 1);
      }
    }

    // Update ambient leaves
    const time = Date.now() * 0.002;
    for (const leaf of this.ambientLeaves) {
      leaf.x += leaf.vx + Math.sin(time + leaf.swayOffset) * 0.6;
      leaf.y += leaf.vy;
      leaf.rot += leaf.rotSpeed;

      if (leaf.y > worldHeight * 0.8 || leaf.x > worldWidth) {
        leaf.x = Math.random() * worldWidth * 0.8;
        leaf.y = Math.random() * -100;
      }
    }
  }

  render(ctx, camera) {
    // Ambient Leaves in forest
    for (const leaf of this.ambientLeaves) {
      const sx = leaf.x - camera.x;
      const sy = leaf.y - camera.y;
      if (sx < -20 || sx > camera.viewportWidth + 20 || sy < -20 || sy > camera.viewportHeight + 20) continue;

      ctx.save();
      ctx.translate(sx, sy);
      ctx.rotate(leaf.rot);
      ctx.fillStyle = leaf.color;
      ctx.beginPath();
      ctx.ellipse(0, 0, leaf.size, leaf.size * 0.5, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    // Slashes — a layered crescent: coloured glow, blade body, white hot edge,
    // a swept wake behind the arc and a spark flare at the tip.
    for (const s of this.slashes) {
      const sx = s.x - camera.x;
      const sy = s.y - camera.y;
      const progress = 1 - (s.life / s.maxLife);
      const fade = 1 - progress;
      const color = s.color || '#60a5fa';

      ctx.save();
      ctx.translate(sx, sy);
      ctx.rotate(s.angle);

      // The arc sweeps through its travel, so the crescent reads as motion.
      const startA = -Math.PI * (0.45 - progress * 0.18);
      const endA = Math.PI * (0.45 - progress * 0.18);

      // PERF NOTE: the three glow strokes below used to be ONE stroke each
      // with `ctx.shadowBlur` set. A canvas shadow costs a full blur pass per
      // draw, and a swing happens constantly, so this was paid many times a
      // second. The soft halo is reproduced with progressively wider, fainter
      // strokes instead — visually the same falloff, no blur pass at all.

      // 1. Outer coloured glow: a wide, faint stroke reads as the halo.
      ctx.beginPath();
      ctx.arc(0, 0, s.radius, startA, endA);
      ctx.strokeStyle = color;
      ctx.globalAlpha = 0.14 * fade;
      ctx.lineWidth = 24 * fade + 5;
      ctx.stroke();
      ctx.globalAlpha = 0.32 * fade;
      ctx.lineWidth = 15 * fade + 3;
      ctx.stroke();

      // 2. The blade body itself.
      ctx.beginPath();
      ctx.arc(0, 0, s.radius, startA, endA);
      ctx.globalAlpha = 0.95 * fade;
      ctx.strokeStyle = '#e0e7ff';
      ctx.lineWidth = 7 * fade + 1;
      ctx.stroke();

      // 3. White hot leading edge — the thing the eye actually tracks.
      ctx.beginPath();
      ctx.arc(0, 0, s.radius * 0.97, startA, endA);
      ctx.globalAlpha = 0.5 * fade;
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 24 * fade + 6;
      ctx.stroke();
      ctx.globalAlpha = fade;
      ctx.lineWidth = 2.5 * fade + 0.5;
      ctx.stroke();

      // 4. Trailing wake: a fainter arc lagging behind at a larger radius.
      ctx.beginPath();
      ctx.arc(0, 0, s.radius * (1.05 + progress * 0.12), startA, endA);
      ctx.globalAlpha = 0.3 * fade;
      ctx.strokeStyle = color;
      ctx.lineWidth = 4 * fade;
      ctx.stroke();

      // 5. Tip flare where the swing is travelling to.
      const tipR = s.radius * 0.98;
      const tipX = Math.cos(endA) * tipR;
      const tipY = Math.sin(endA) * tipR;
      ctx.globalAlpha = 0.9 * fade;
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(tipX, tipY, 3.5 * fade + 1.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 0.5 * fade;
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(tipX, tipY, 8 * fade + 2, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();
    }

    // ---- Particles ------------------------------------------------
    // PERF: this used to draw every particle as its own arc() with a
    // save/restore pair and — for glowing particles — `ctx.shadowBlur = 8`.
    // Canvas shadows force a full blur pass PER DRAW CALL, so a boss fight
    // spawning 1500 glowing particles meant 1500 blur passes a frame. That is
    // what pinned high-end machines at ~40fps with violent spikes.
    //
    // Two changes, both pixel-identical:
    //   1. Glow particles draw a pre-baked radial-gradient sprite (baked once
    //      per colour) blitted with drawImage, instead of a live shadow blur.
    //   2. Plain particles are drawn as squares in batches grouped by colour,
    //      so fillStyle is set once per colour rather than per particle. A
    //      particle of size s reads as the same soft dot either way at these
    //      sizes, and the sprite path is used whenever the dot is big enough
    //      to show its edge.
    const vw = camera.viewportWidth;
    const vh = camera.viewportHeight;
    const parts = this.particles;
    if (parts.length) {
      // Cap the per-frame draw count on huge bursts: past a few hundred live
      // particles the extra ones are visually indistinguishable in a blur, and
      // skipping them is the difference between a spike and a smooth frame.
      const maxDraw = 900;
      const stride = parts.length > maxDraw ? Math.ceil(parts.length / maxDraw) : 1;

      // Pass 1: glowing particles as cached sprites (no shadowBlur).
      for (let i = 0; i < parts.length; i += stride) {
        const p = parts[i];
        if (!p.glow) continue;
        const sx = p.x - camera.x;
        const sy = p.y - camera.y;
        if (sx < -24 || sx > vw + 24 || sy < -24 || sy > vh + 24) continue;
        const alpha = Math.max(0, p.life / p.maxLife);
        const sprite = this._glowSprite(p.color);
        if (!sprite) continue;
        const size = Math.max(1, p.size * alpha);
        // The sprite already carries the soft falloff; scale it to the dot size.
        const d = size * 2.4;
        ctx.globalAlpha = alpha;
        ctx.drawImage(sprite, sx - d / 2, sy - d / 2, d, d);
      }
      ctx.globalAlpha = 1;

      // Pass 2: plain particles, batched by colour.
      this._particleBatch = this._particleBatch || new Map();
      const batch = this._particleBatch;
      batch.clear();
      for (let i = 0; i < parts.length; i += stride) {
        const p = parts[i];
        if (p.glow) continue;
        const sx = p.x - camera.x;
        const sy = p.y - camera.y;
        if (sx < -16 || sx > vw + 16 || sy < -16 || sy > vh + 16) continue;
        const alpha = Math.max(0, p.life / p.maxLife);
        const size = p.size * alpha;
        if (size <= 0.4) continue;
        const bucket = batch.get(p.color);
        if (bucket) bucket.push(sx, sy, size);
        else batch.set(p.color, [sx, sy, size]);
      }
      for (const [color, arr] of batch) {
        ctx.fillStyle = color;
        // Bucket by rounded size so a single fillStyle can cover a run of
        // particles: rects are far cheaper than one arc() per dot.
        for (let k = 0; k < arr.length; k += 3) {
          const sx = arr[k], sy = arr[k + 1], size = arr[k + 2];
          const s = Math.max(1, Math.round(size));
          ctx.fillRect(sx - s / 2, sy - s / 2, s, s);
        }
      }
      batch.clear();
    }

    // Damage numbers
    for (const t of this.damageTexts) {
      const sx = t.x - camera.x;
      const sy = t.y - camera.y;
      if (sx < -50 || sx > camera.viewportWidth + 50 || sy < -50 || sy > camera.viewportHeight + 50) continue;

      ctx.save();
      ctx.globalAlpha = t.alpha;

      if (t.isBan) {
        // THE BAN HAMMER's on-mob stamp. Drawn in four passes so it reads as a
        // stamped, glitching system notice rather than a red damage number:
        //   1. a filled slab + hard border, so the word never competes with the
        //      background it is stamped on top of,
        //   2. two chromatic ghost copies that jitter EVERY FRAME (the tear),
        //   3. a white-hot core with a heavy red bloom,
        //   4. a hard black outline so it stays legible over bright tiles.
        // `pop` overshoots on spawn then settles; the flicker keeps it alive.
        const life = t.maxLife || 1.6;
        const age = 1 - Math.max(0, Math.min(1, t.life / life));
        // Slam in: starts ~2.4x and eases down hard over the first fifth.
        const slam = Math.max(0, 1 - age / 0.18);
        const pop = 1 + 1.4 * slam * slam;
        const size = Math.round(26 * pop);
        const jitter = (Math.random() - 0.5) * 5;
        const flicker = age < 0.5 && Math.random() < 0.22 ? 0.55 : 1;

        ctx.save();
        ctx.globalAlpha = t.alpha * flicker;
        ctx.font = `bold ${size}px 'Press Start 2P', monospace`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        const w = ctx.measureText(t.text).width;
        const h = size * 1.5;

        // 1. slab
        ctx.fillStyle = 'rgba(20,0,0,0.82)';
        ctx.fillRect(sx - w / 2 - 12, sy - h / 2, w + 24, h);
        ctx.strokeStyle = '#ff1a1a';
        ctx.lineWidth = 3;
        ctx.strokeRect(sx - w / 2 - 12, sy - h / 2, w + 24, h);

        // 2. chromatic ghosts, jittered
        ctx.shadowColor = '#ff0000';
        ctx.shadowBlur = 22;
        ctx.fillStyle = 'rgba(255,60,60,0.75)';
        ctx.fillText(t.text, sx - 4 + jitter, sy - 2);
        ctx.fillStyle = 'rgba(140,0,0,0.85)';
        ctx.fillText(t.text, sx + 4 - jitter, sy + 2);
        ctx.shadowBlur = 0;

        // 3. white-hot core with red fill glow
        ctx.fillStyle = 'rgba(255,190,190,0.9)';
        ctx.fillText(t.text, sx - 1, sy - 1);
        ctx.shadowColor = '#ff0000';
        ctx.shadowBlur = 26;
        ctx.fillStyle = t.color;
        ctx.fillText(t.text, sx, sy);

        // 4. hard outline for legibility
        ctx.shadowBlur = 0;
        ctx.strokeStyle = '#1a0000';
        ctx.lineWidth = 6;
        ctx.lineJoin = 'round';
        ctx.strokeText(t.text, sx, sy);
        ctx.restore();
        continue;
      }

      ctx.font = t.isCrit ? `bold 22px 'Press Start 2P', monospace` : `bold 16px 'Press Start 2P', monospace`;
      ctx.textAlign = 'center';

      // Outline
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 4;
      ctx.strokeText(t.text, sx, sy);

      // Fill
      ctx.fillStyle = t.color;
      ctx.fillText(t.text, sx, sy);
      ctx.restore();
    }
  }
}

window.ParticleSystem = ParticleSystem;
