// High-performance particle and visual effects system for Terraria
class ParticleSystem {
  constructor() {
    this.particles = [];
    this.damageTexts = [];
    this.slashes = [];
    this.lightSources = [];
    this.ambientLeaves = [];
    this.density = 1;
  }

  setDensity(density) {
    this.density = Math.max(0.1, Math.min(1, Number(density) || 1));
  }

  /**
   * THE BAN HAMMER's mark, stamped ON the victim rather than over the screen.
   *
   * It is a damageText so it rides the same update/render/cull path (world
   * coordinates, floats up, fades) and needs no new draw loop — but `isBan`
   * switches the renderer to the big stamped hacker treatment: red glow,
   * chromatic ghosting and a slight pop.
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
      life: 1.35,
      isCrit: false,
      isBan: true
    });
  }

  // Floating combat text (like Terraria damage numbers)
  addDamageText(x, y, text, color = '#ffeb3b', isCrit = false) {
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
      t.life -= dt * 1.5;
      if (t.life <= 0) {
        this.damageTexts.splice(i, 1);
        continue;
      }
      t.x += t.vx;
      t.y += t.vy;
      t.vy += 0.12; // slowly curve down
      t.alpha = Math.max(0, t.life);
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

      // 1. Outer coloured glow, thick and soft.
      ctx.beginPath();
      ctx.arc(0, 0, s.radius, startA, endA);
      ctx.strokeStyle = color;
      ctx.globalAlpha = 0.55 * fade;
      ctx.lineWidth = 14 * fade + 3;
      ctx.shadowColor = color;
      ctx.shadowBlur = 12;
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
      ctx.globalAlpha = fade;
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2.5 * fade + 0.5;
      ctx.shadowBlur = 16;
      ctx.stroke();

      // 4. Trailing wake: a fainter arc lagging behind at a larger radius.
      ctx.beginPath();
      ctx.arc(0, 0, s.radius * (1.05 + progress * 0.12), startA, endA);
      ctx.globalAlpha = 0.3 * fade;
      ctx.strokeStyle = color;
      ctx.lineWidth = 4 * fade;
      ctx.shadowBlur = 8;
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

    // Particles
    for (const p of this.particles) {
      const sx = p.x - camera.x;
      const sy = p.y - camera.y;
      if (sx < -20 || sx > camera.viewportWidth + 20 || sy < -20 || sy > camera.viewportHeight + 20) continue;

      const alpha = Math.max(0, p.life / p.maxLife);
      ctx.save();
      ctx.globalAlpha = alpha;
      if (p.glow) {
        ctx.shadowColor = p.color;
        ctx.shadowBlur = 8;
      }
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(sx, sy, p.size * alpha, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    // Damage numbers
    for (const t of this.damageTexts) {
      const sx = t.x - camera.x;
      const sy = t.y - camera.y;
      if (sx < -50 || sx > camera.viewportWidth + 50 || sy < -50 || sy > camera.viewportHeight + 50) continue;

      ctx.save();
      ctx.globalAlpha = t.alpha;

      if (t.isBan) {
        // THE BAN HAMMER's on-mob stamp. Bigger than a damage number, with the
        // red bloom and two offset ghost copies faked as chromatic
        // aberration — the same "glitched terminal" read as the screen overlay,
        // but attached to the thing that just got banned.
        const pop = 1 + 0.35 * Math.max(0, Math.min(1, t.life / 1.35));
        ctx.font = `bold ${Math.round(20 * pop)}px 'Press Start 2P', monospace`;
        ctx.textAlign = 'center';
        ctx.shadowColor = '#ff0000';
        ctx.shadowBlur = 18;
        // Ghost copies first, so the real glyph lands on top of them.
        ctx.fillStyle = 'rgba(255,60,60,0.55)';
        ctx.fillText(t.text, sx - 2.5, sy - 1.5);
        ctx.fillStyle = 'rgba(120,0,0,0.75)';
        ctx.fillText(t.text, sx + 2.5, sy + 1.5);
        ctx.shadowBlur = 0;
        ctx.strokeStyle = '#1a0000';
        ctx.lineWidth = 4;
        ctx.strokeText(t.text, sx, sy);
        ctx.fillStyle = t.color;
        ctx.fillText(t.text, sx, sy);
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
