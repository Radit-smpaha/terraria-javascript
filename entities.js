// Entities: Player, Enemies (Zombie, Demon Eye, Wraith), Boss (Ancient Forest Guardian), Projectiles, Drops

class DropItem {
  constructor(x, y, id, count = 1) {
    this.x = x;
    this.y = y;
    this.vx = (Math.random() - 0.5) * 2;
    this.vy = -3 - Math.random() * 2;
    this.width = 14;
    this.height = 14;
    this.id = id;
    this.count = count;
    this.life = 60; // 60 seconds despawn
    this.bobAngle = Math.random() * Math.PI * 2;
  }

  update(dt, world) {
    this.life -= dt;
    this.vy += 0.25; // gravity
    if (this.vy > 8) this.vy = 8;

    // Movement & tile collision
    const nextX = this.x + this.vx;
    const nextY = this.y + this.vy;

    const tileX = Math.floor((nextX + this.width / 2) / TILE_SIZE);
    const tileY = Math.floor((nextY + this.height) / TILE_SIZE);

    if (world.isSolid(tileX, tileY)) {
      this.y = tileY * TILE_SIZE - this.height;
      this.vy = 0;
      this.vx *= 0.8;
    } else {
      this.y = nextY;
      this.x = nextX;
    }

    this.bobAngle += dt * 3;
  }

  render(ctx, camera) {
    const sx = this.x - camera.x;
    const sy = this.y - camera.y + Math.sin(this.bobAngle) * 3;

    ctx.save();
    // Soft bounce glow
    ctx.shadowColor = '#fbbf24';
    ctx.shadowBlur = 6;

    const itemData = ITEMS[this.id];
    const icon = itemData && itemData.icon ? itemData.icon : '📦';
    // The pixel buffer does not reliably rasterize color emoji on every browser.
    // Always draw a bright, readable item-colored token underneath the icon, so
    // dropped blocks/materials remain visible even when the emoji font is absent.
    const accent = itemData ? {
      dirt: '#8b5a2b', stone: '#64748b', wood: '#92400e', iron_ore: '#b87333',
      gold_ore: '#facc15', diamond: '#67e8f9', crystal: '#a78bfa', wool: '#f8fafc',
      rainbow_ore: '#f472b6', fallen_star: '#fde68a', apple: '#fb7185', acorn: '#d97706'
    }[this.id] || '#fbbf24' : '#fbbf24';
    ctx.fillStyle = 'rgba(15,23,42,.88)';
    ctx.fillRect(Math.round(sx) - 1, Math.round(sy) - 1, 16, 16);
    ctx.fillStyle = accent;
    ctx.fillRect(Math.round(sx) + 1, Math.round(sy) + 1, 12, 12);
    ctx.fillStyle = 'rgba(255,255,255,.35)';
    ctx.fillRect(Math.round(sx) + 2, Math.round(sy) + 2, 5, 2);
    ctx.fillStyle = '#0f172a';
    ctx.font = "13px 'Segoe UI Emoji','Apple Color Emoji','Noto Color Emoji',sans-serif";
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(icon, Math.round(sx) + 7, Math.round(sy) + 7);
    ctx.restore();
  }
}

class Projectile {
  constructor(x, y, vx, vy, type, damage, isHostile = false, life = 3.0, lightRadius = 0) {
    this.x = x;
    this.y = y;
    this.vx = vx;
    this.vy = vy;
    this.type = type; // 'arrow', 'magic_bolt', 'boss_laser', 'boss_thorn'
    this.damage = damage;
    this.isHostile = isHostile;
    this.life = life;
    this.width = 8;
    this.height = 8;
    this.dead = false;
    this.lightRadius = lightRadius;
    // Phantom blades carry their own colour into the room's bloom pass.
    if (type === 'knight_blade') this.lightColor = [150, 140, 255];
  }

  update(dt, world, particleSystem) {
    this.life -= dt;
    if (this.life <= 0) {
      this.dead = true;
      return;
    }

    // Gravity for arrows
    if (this.type === 'arrow') {
      this.vy += 0.12;
    }

    this.x += this.vx;
    this.y += this.vy;

    // Particle trail
    if (this.type === 'magic_bolt') {
      particleSystem.magicSparkle(this.x, this.y, this.boltTint || '#60a5fa', 1);
      // A drifting wisp behind the bolt, so it draws a line across the screen.
      if (Math.random() < 0.5) {
        particleSystem.addParticle(
          this.x - this.vx * 0.3, this.y - this.vy * 0.3,
          (Math.random() - 0.5) * 0.7, (Math.random() - 0.5) * 0.7 - 0.3,
          this.boltTint || '#60a5fa', 2 + Math.random() * 2, 0.4, -0.01, true
        );
      }
    } else if (this.type === 'arrow') {
      // Arrows used to leave no trace at all, which made them hard to track.
      if (Math.random() < 0.4) {
        particleSystem.addParticle(
          this.x - this.vx * 0.25, this.y - this.vy * 0.25,
          (Math.random() - 0.5) * 0.4, (Math.random() - 0.5) * 0.4,
          this.arrowTint || '#93c5fd', 1.4 + Math.random() * 1.4, 0.22, -0.01, true
        );
      }
    } else if (this.type === 'boss_laser') {
      particleSystem.addParticle(this.x, this.y, 0, 0, '#ef4444', 3, 0.2, 0, true);
    } else if (this.type === 'boss_thorn') {
      particleSystem.addParticle(this.x, this.y, 0, 0, '#22c55e', 2.5, 0.2, 0, false);
    } else if (this.type === 'knight_blade') {
      // Dense spectral trail: coloured motes, white hot core, drifting embers.
      const big = !!this.bladeBig;
      const n = big ? 3 : 2;
      for (let i = 0; i < n; i++) {
        const back = i * 7;
        particleSystem.addParticle(
          this.x - (this.vx / 7.2) * back + (Math.random() - 0.5) * 7,
          this.y - (this.vy / 7.2) * back + (Math.random() - 0.5) * 7,
          -this.vx * 0.15 + (Math.random() - 0.5) * 0.8,
          -this.vy * 0.15 + (Math.random() - 0.5) * 0.8,
          i === 0 ? '#ffffff' : (Math.random() < 0.5 ? '#818cf8' : '#c084fc'),
          Math.random() * 2.5 + 1.5,
          0.28 + i * 0.06,
          0,
          true
        );
      }
      // Occasional long-lived ember that lingers after the blade has passed.
      if (Math.random() < 0.3) {
        particleSystem.addParticle(
          this.x + (Math.random() - 0.5) * 10, this.y + (Math.random() - 0.5) * 10,
          (Math.random() - 0.5) * 0.7, -0.4 - Math.random() * 0.6,
          big ? '#f0abfc' : '#c7d2fe', Math.random() * 2 + 1, 0.7, -0.01, true
        );
      }
    }

    // World collision
    const tx = Math.floor(this.x / TILE_SIZE);
    const ty = Math.floor(this.y / TILE_SIZE);
    if (world.isSolid(tx, ty)) {
      this.dead = true;
      if (this.type === 'magic_bolt') {
        particleSystem.magicSparkle(this.x, this.y, '#93c5fd', 8);
      } else if (this.type === 'boss_laser') {
        particleSystem.bloodBurst(this.x, this.y, '#ef4444', 6);
      } else if (this.type === 'knight_blade') {
        // Shattered spectral steel: shards fly back along the impact normal.
        particleSystem.magicSparkle(this.x, this.y, '#a5b4fc', 16);
        particleSystem.bloodBurst(this.x, this.y, this.bladeBig ? '#c084fc' : '#818cf8', 12);
        particleSystem.bloodBurst(this.x, this.y, '#ffffff', 6);
        // Ejected blade shards, thrown back the way it came.
        for (let i = 0; i < 10; i++) {
          const a = Math.atan2(this.vy, this.vx) + Math.PI + (Math.random() - 0.5) * 2.0;
          particleSystem.addParticle(
            this.x, this.y,
            Math.cos(a) * (1.4 + Math.random() * 3.6), Math.sin(a) * (1.4 + Math.random() * 3.6) - 0.8,
            Math.random() < 0.4 ? '#ffffff' : (this.bladeBig ? '#e9d5ff' : '#e0e7ff'),
            2 + Math.random() * 3, 0.42, 0.22, true
          );
        }
        // Brief glare left hanging on the wall it struck.
        for (let i = 0; i < 4; i++) {
          particleSystem.addParticle(
            this.x + (Math.random() - 0.5) * 16, this.y + (Math.random() - 0.5) * 16,
            (Math.random() - 0.5) * 0.8, (Math.random() - 0.5) * 0.8,
            this.bladeBig ? '#f0abfc' : '#c7d2fe', 4.5, 0.34, 0.01, true
          );
        }
      }
    }
  }

  render(ctx, camera) {
    const sx = this.x - camera.x;
    const sy = this.y - camera.y;

    ctx.save();
    const angle = Math.atan2(this.vy, this.vx);
    ctx.translate(sx, sy);
    ctx.rotate(angle);

    if (this.type === 'arrow') {
      // Fletched arrow with a bright head and an additive shine along the shaft.
      ctx.fillStyle = '#92400e';
      ctx.fillRect(-10, -1.5, 20, 3);
      // Arrowhead
      ctx.fillStyle = '#cbd5e1';
      ctx.beginPath();
      ctx.moveTo(11, 0);
      ctx.lineTo(5, -4);
      ctx.lineTo(5, 4);
      ctx.closePath();
      ctx.fill();
      // Fletching
      ctx.fillStyle = this.arrowTint || '#f8fafc';
      ctx.fillRect(-10, -3, 3, 6);
      ctx.fillRect(-7, -2.5, 2, 5);
      // Ember/ice shine riding the shaft.
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      ctx.globalAlpha = 0.7;
      ctx.fillStyle = this.arrowTint || '#93c5fd';
      ctx.fillRect(-8, -0.5, 16, 1);
      ctx.restore();
    } else if (this.type === 'magic_bolt') {
      // Layered spell orb: soft corona, body, white core, plus a spinning rune
      // ring so it reads as magic rather than a plain blob.
      const tint = this.boltTint || '#60a5fa';
      const pulse = 1 + Math.sin(Date.now() * 0.02 + this.x * 0.1) * 0.12;

      ctx.save();
      ctx.shadowColor = tint;
      ctx.shadowBlur = 14;
      ctx.fillStyle = tint;
      ctx.globalAlpha = 0.5;
      ctx.beginPath();
      ctx.ellipse(0, 0, 13 * pulse, 7 * pulse, 0, 0, Math.PI * 2);
      ctx.fill();

      ctx.globalAlpha = 0.95;
      ctx.fillStyle = '#e0e7ff';
      ctx.beginPath();
      ctx.ellipse(0, 0, 8 * pulse, 4.5 * pulse, 0, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#ffffff';
      ctx.shadowBlur = 8;
      ctx.beginPath();
      ctx.ellipse(1, 0, 4 * pulse, 2.4 * pulse, 0, 0, Math.PI * 2);
      ctx.fill();

      // Two rune flecks orbiting the bolt.
      ctx.globalCompositeOperation = 'lighter';
      ctx.fillStyle = '#ffffff';
      for (let i = 0; i < 2; i++) {
        const a = Date.now() * 0.012 + i * Math.PI;
        ctx.fillRect(Math.cos(a) * 9 - 1, Math.sin(a) * 5 - 1, 2.5, 2.5);
      }
      ctx.restore();
    } else if (this.type === 'boss_laser') {
      ctx.shadowColor = '#ef4444';
      ctx.shadowBlur = 14;
      ctx.fillStyle = '#fee2e2';
      ctx.fillRect(-12, -3, 24, 6);
      ctx.fillStyle = '#dc2626';
      ctx.fillRect(-14, -1.5, 28, 3);
    } else if (this.type === 'boss_thorn') {
      ctx.fillStyle = '#15803d';
      ctx.beginPath();
      ctx.moveTo(8, 0);
      ctx.lineTo(-6, -4);
      ctx.lineTo(-6, 4);
      ctx.closePath();
      ctx.fill();
    } else if (this.type === 'knight_blade') {
      // Terraria-style phantom blade: layered pixel blade with glowing aura & hilt.
      const pPulse = 0.85 + Math.sin(Date.now() * 0.02 + this.x * 0.05) * 0.15;
      const big = !!this.bladeBig;
      const sc = big ? 1.35 : 1;
      const bob = Math.sin(Date.now() * 0.014 + (this.bladePhase || 0)) * 1.2;
      ctx.translate(0, bob);
      ctx.scale(sc, sc);
      ctx.shadowColor = big ? '#c084fc' : '#818cf8';
      ctx.shadowBlur = 16 * pPulse;

      // Spectral wake streaking back along the flight path.
      ctx.globalAlpha = 0.5;
      ctx.fillStyle = big ? 'rgba(192, 132, 252, 0.5)' : 'rgba(165, 180, 252, 0.45)';
      ctx.beginPath();
      ctx.moveTo(-8, 0);
      ctx.lineTo(-30, -4.5);
      ctx.lineTo(-46, 0);
      ctx.lineTo(-30, 4.5);
      ctx.closePath();
      ctx.fill();
      ctx.globalAlpha = 0.85;
      ctx.fillStyle = 'rgba(255, 255, 255, 0.55)';
      ctx.beginPath();
      ctx.moveTo(-10, 0);
      ctx.lineTo(-30, -1.6);
      ctx.lineTo(-30, 1.6);
      ctx.closePath();
      ctx.fill();
      ctx.globalAlpha = 1;

      // Outer spectral glow
      ctx.fillStyle = 'rgba(165, 180, 252, 0.45)';
      ctx.beginPath();
      ctx.moveTo(16, 0);
      ctx.lineTo(-6, -7);
      ctx.lineTo(-2, 0);
      ctx.lineTo(-6, 7);
      ctx.closePath();
      ctx.fill();

      // Blade body
      ctx.fillStyle = '#e0e7ff';
      ctx.beginPath();
      ctx.moveTo(14, 0);
      ctx.lineTo(-4, -4.5);
      ctx.lineTo(-1, 0);
      ctx.lineTo(-4, 4.5);
      ctx.closePath();
      ctx.fill();

      // Inner blade core (bright white)
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.moveTo(11, 0);
      ctx.lineTo(-2, -2);
      ctx.lineTo(0, 0);
      ctx.lineTo(-2, 2);
      ctx.closePath();
      ctx.fill();

      // Crossguard
      ctx.fillStyle = '#4338ca';
      ctx.fillRect(-6, -6, 3, 12);
      ctx.fillStyle = big ? '#f0abfc' : '#c084fc';
      ctx.fillRect(-5, -1.5, 3, 3); // Guard gem

      // Grip & pommel
      ctx.fillStyle = '#1e1b4b';
      ctx.fillRect(-11, -1.5, 5, 3);
      ctx.fillStyle = '#a5b4fc';
      ctx.fillRect(-13, -2, 2, 4);

      // Additive ghost twin — doubles the perceived brightness of every blade
      // without touching the palette, so volleys stack into real light.
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      ctx.globalAlpha = 0.4 + Math.sin(Date.now() * 0.016 + (this.bladePhase || 0)) * 0.15;
      ctx.fillStyle = big ? 'rgba(192, 132, 252, 0.75)' : 'rgba(129, 140, 248, 0.7)';
      ctx.beginPath();
      ctx.moveTo(20, 0);
      ctx.lineTo(-6, -9);
      ctx.lineTo(-3, 0);
      ctx.lineTo(-6, 9);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
      ctx.beginPath();
      ctx.moveTo(14, 0);
      ctx.lineTo(-2, -2.4);
      ctx.lineTo(0, 0);
      ctx.lineTo(-2, 2.4);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }

    ctx.restore();
  }
}

// Life drained per second once the hunger bar empties. Slow enough to be a
// warning you can still walk out of, fast enough that ignoring it kills you.
const STARVATION_DPS = 3;

class Player {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.width = 18;
    this.height = 36;
    this.vx = 0;
    this.vy = 0;

    // Movement constants
    this.speed = 4.2;
    this.accel = 0.6;
    this.friction = 0.82;
    this.jumpForce = 7.6;
    this.gravity = 0.38;
    this.terminalVel = 12.0;
    this.sprintMultiplier = 1.6;

    // Stats
    this.maxHp = 100;
    this.hp = 100;
    this.maxMana = 50;
    this.mana = 50;
    // The un-upgraded caps. Life/Mana Crystals raise maxHp/maxMana on top of
    // these, and the save only stores how many crystals were ever drunk — so
    // every load has to re-derive the real caps from these baselines.
    this.baseMaxHp = 100;
    this.baseMaxMana = 50;
    this.maxHunger = 100;
    this.hunger = 100;
    this.starving = false; // true while the empty bar is draining life
    this.maxStamina = 100;
    this.stamina = 100;

    // States
    this.onGround = false;
    this.facing = 1; // 1 = right, -1 = left
    this.canDoubleJump = true;
    this.isDodgeRolling = false;
    this.dodgeTime = 0;
    this.dodgeDuration = 0.28;
    this.invulnerableTime = 0;
    this.isWallSliding = false;
    this.wallDir = 0; // -1 left wall, 1 right wall

    // ---- Modern platformer movement feel ----
    this.coyoteTimer = 0;     // brief grace period to still jump after walking off a ledge
    this.jumpBuffer = 0;      // remembers a jump pressed just before landing
    this.wasOnGround = false;
    this.landedHard = false;  // one-frame flag the Game reads to add landing impact
    this.isSprinting = false;
    this.sprintFxTimer = 0;
    this.stepTimer = 0;       // footstep sfx / dust cadence
    this.hurtDirection = 0;   // -1..1 horizontal hurt knockback direction

    // Tool/Weapon swing animation
    this.isSwinging = false;
    this.swingTimer = 0;
    this.swingDuration = 0.22;
    this.swingAngle = 0;

    // Equipment & Inventory
    this.selectedSlot = 0;
    this.armorDefense = 0;
    this.activeArmor = null;
  }

  /**
   * Apply damage. Returns the damage actually taken (0 when blocked by i-frames),
   * so the caller can trigger screen shake / vignette only for real hits.
   */
  takeDamage(amount, soundSystem, particleSystem, sourceX = null) {
    if (this.invulnerableTime > 0 || this.isDodgeRolling) return 0;
    const actualDamage = Math.max(1, Math.floor(amount - this.armorDefense * 0.5));
    this.hp -= actualDamage;
    this.invulnerableTime = 0.6; // i-frames
    if (soundSystem) soundSystem.playPlayerHurt();
    if (particleSystem) {
      particleSystem.addDamageText(this.x + this.width / 2, this.y, actualDamage, '#ef4444', false);
      particleSystem.bloodBurst(this.x + this.width / 2, this.y + this.height / 2, '#ef4444', 8);
    }

    // Knock away from the attacker (falls back to "backwards" when unknown).
    const midX = this.x + this.width / 2;
    const dir = (typeof sourceX === 'number' && Number.isFinite(sourceX))
      ? (midX >= sourceX ? 1 : -1)
      : -this.facing;
    this.hurtDirection = dir;
    this.vy = -3.5;
    this.vx = dir * 4.2;
    return actualDamage;
  }

  /** Heal and report how much life was actually restored. */
  heal(amount, particleSystem) {
    const before = this.hp;
    this.hp = Math.min(this.maxHp, this.hp + amount);
    const restored = Math.max(0, Math.round(this.hp - before));
    if (restored > 0 && particleSystem) {
      particleSystem.magicSparkle(this.x + this.width / 2, this.y + this.height / 2, '#4ade80', 14);
    }
    return restored;
  }

  dodge(soundSystem, particleSystem) {
    if (this.stamina < 30 || this.isDodgeRolling) return false;
    this.stamina -= 30;
    this.isDodgeRolling = true;
    this.dodgeTime = this.dodgeDuration;
    this.vx = this.facing * 8.5;
    soundSystem.playDodge();
    particleSystem.windBurst(this.x + this.width / 2, this.y + this.height);
    return true;
  }

  /** True while the player can still perform a ground jump (includes coyote time). */
  get canGroundJump() {
    return this.onGround || this.coyoteTimer > 0;
  }

  /**
   * Attempt a jump immediately. Returns true when something actually happened,
   * which lets the input layer decide whether to bank a jump for landing.
   */
  jump(soundSystem, particleSystem) {
    if (this.canGroundJump) {
      this.vy = -this.jumpForce;
      this.onGround = false;
      this.coyoteTimer = 0;
      this.canDoubleJump = true;
      soundSystem.playJump();
      if (particleSystem) particleSystem.windBurst(this.x + this.width / 2, this.y + this.height);
      return true;
    }

    // Wall Kick
    if (this.isWallSliding) {
      this.vy = -this.jumpForce * 0.95;
      this.vx = -this.wallDir * (this.speed * 1.3);
      this.facing = -this.wallDir;
      this.canDoubleJump = true;
      this.isWallSliding = false;
      soundSystem.playDoubleJump();
      particleSystem.windBurst(this.x + this.width / 2, this.y + this.height / 2);
      return true;
    }

    // Double Jump (Hermes wind)
    if (this.canDoubleJump) {
      this.canDoubleJump = false;
      this.vy = -this.jumpForce * 0.88;
      soundSystem.playDoubleJump();
      particleSystem.windBurst(this.x + this.width / 2, this.y + this.height);
      return true;
    }
    return false;
  }

  /** Input entry point: jump now, or bank the press for the moment we land. */
  queueJump(soundSystem, particleSystem) {
    const jumped = this.jump(soundSystem, particleSystem);
    if (!jumped) this.jumpBuffer = 0.14;
    return jumped;
  }

  /**
   * Starvation damage.
   *
   * This used to go through takeDamage(), which was wrong twice over. takeDamage
   * is a *hit* reaction: it applies hurt knockback (vx/vy), plays the hurt sound
   * and spawns blood, so an empty stomach physically threw the player around and
   * screamed at them. On top of that it floors every tick to a minimum of 1 HP
   * and hands out 0.6s of i-frames, so the real 3 HP/s trickle was silently
   * rounded *up* to 1 HP per frame (a 60x damage rate) and then throttled back
   * down by the i-frames it had just granted itself.
   *
   * Starving is a bleed, not an attack, so it is applied as a plain HP decrement
   * with no knockback, no sound and no i-frames. The Game's death check still
   * picks the player up when this reaches 0, and `starving` is left set so the
   * death screen can name starvation as the cause.
   */
  applyStarvation(dt) {
    this.hp = Math.max(0, this.hp - dt * STARVATION_DPS);
  }

  /**
   * Per-frame player simulation: resources, states, movement and collisions.
   */
  update(dt, input, world, soundSystem, particleSystem) {
    // Regenerate stamina & mana
    this.stamina = Math.min(this.maxStamina, this.stamina + dt * 25);
    this.mana = Math.min(this.maxMana, this.mana + dt * 10);
    // Hunger drains gently: a full 100-point bar lasts about 20 minutes.
    this.hunger = Math.max(0, this.hunger - dt * 0.0833333333);
    if (this.hunger <= 0) {
      this.starving = true;
      this.applyStarvation(dt);
    } else {
      this.starving = false;
    }

    // Coyote time + buffered jumps let the player press jump slightly early/late.
    if (this.coyoteTimer > 0) this.coyoteTimer = Math.max(0, this.coyoteTimer - dt);
    if (this.jumpBuffer > 0) {
      this.jumpBuffer = Math.max(0, this.jumpBuffer - dt);
      if (this.canGroundJump) {
        this.jumpBuffer = 0;
        this.jump(soundSystem, particleSystem);
      }
    }
    this.landedHard = false;

    if (this.invulnerableTime > 0) {
      this.invulnerableTime -= dt;
    }

    // Dodge roll update
    if (this.isDodgeRolling) {
      this.dodgeTime -= dt;
      particleSystem.addParticle(
        this.x + Math.random() * this.width,
        this.y + Math.random() * this.height,
        -this.facing * 1.5,
        (Math.random() - 0.5) * 1.5,
        'rgba(147, 197, 253, 0.6)',
        3, 0.2, 0, true
      );
      if (this.dodgeTime <= 0) {
        this.isDodgeRolling = false;
      }
    }

    // Swing timer update
    if (this.isSwinging) {
      this.swingTimer -= dt;
      if (this.swingTimer <= 0) {
        this.isSwinging = false;
      }
    }

    // Horizontal movement (hold CTRL while running to sprint)
    const leftHeld = input.keys['KeyA'] || input.keys['ArrowLeft'];
    const rightHeld = input.keys['KeyD'] || input.keys['ArrowRight'];
    const sprintHeld = (input.keys['ControlLeft'] || input.keys['ControlRight']) &&
      (leftHeld || rightHeld) && this.stamina > 1;
    this.isSprinting = !!sprintHeld;

    if (!this.isDodgeRolling) {
      const maxSpeed = this.speed * (this.speedMultiplier || 1) * (this.isSprinting ? this.sprintMultiplier : 1);
      const accel = this.accel * (this.isSprinting ? 1.15 : 1);
      if (leftHeld) {
        this.vx -= accel;
        this.facing = -1;
      } else if (rightHeld) {
        this.vx += accel;
        this.facing = 1;
      } else {
        this.vx *= this.friction;
        if (Math.abs(this.vx) < 0.1) this.vx = 0;
      }
      this.vx = Math.max(-maxSpeed, Math.min(maxSpeed, this.vx));
    }

    // Sprinting costs a trickle of stamina and kicks up dust behind the player.
    if (this.isSprinting && Math.abs(this.vx) > 1) {
      this.stamina = Math.max(0, this.stamina - dt * 6);
      this.sprintFxTimer -= dt;
      if (this.sprintFxTimer <= 0 && particleSystem) {
        this.sprintFxTimer = 0.05;
        particleSystem.addParticle(
          this.x + this.width / 2 - this.facing * 8,
          this.y + this.height - 3,
          -this.facing * 1.2,
          -Math.random() * 0.8,
          'rgba(226,232,240,0.55)', 3, 0.3, 0.02
        );
      }
    } else {
      this.sprintFxTimer = 0;
    }

    // Footstep dust cadence (walking and sprinting alike).
    if (this.onGround && Math.abs(this.vx) > 1.4) {
      this.stepTimer -= dt * (this.isSprinting ? 2.2 : 1.4);
      if (this.stepTimer <= 0 && particleSystem) {
        this.stepTimer = 0.28;
        particleSystem.addParticle(
          this.x + this.width / 2, this.y + this.height - 1,
          -this.facing * 0.5, -0.4, 'rgba(203,213,225,0.5)', 2.5, 0.22, 0.04
        );
      }
    } else {
      this.stepTimer = 0;
    }

    // Falling through platforms when pressing Down / S
    const dropThrough = input.keys['KeyS'] || input.keys['ArrowDown'];

    // Gravity
    this.vy += this.gravity;
    if (this.vy > this.terminalVel) this.vy = this.terminalVel;

    // Wall slide detection
    this.isWallSliding = false;
    this.wallDir = 0;
    if (!this.onGround && this.vy > 0) {
      const leftTileX = Math.floor((this.x - 2) / TILE_SIZE);
      const rightTileX = Math.floor((this.x + this.width + 2) / TILE_SIZE);
      const midY = Math.floor((this.y + this.height / 2) / TILE_SIZE);

      if (world.isSolid(leftTileX, midY) && (input.keys['KeyA'] || input.keys['ArrowLeft'])) {
        this.isWallSliding = true;
        this.wallDir = -1;
        this.vy = Math.min(this.vy, 2.0); // slower descent
        particleSystem.addParticle(this.x, this.y + this.height * 0.7, 1, -1, '#64748b', 2.5, 0.15);
      } else if (world.isSolid(rightTileX, midY) && (input.keys['KeyD'] || input.keys['ArrowRight'])) {
        this.isWallSliding = true;
        this.wallDir = 1;
        this.vy = Math.min(this.vy, 2.0);
        particleSystem.addParticle(this.x + this.width, this.y + this.height * 0.7, -1, -1, '#64748b', 2.5, 0.15);
      }
    }

    // Physics integration with world collision (AABB)
    this.resolveWorldCollisions(world, dropThrough);
  }

  resolveWorldCollisions(world, dropThrough) {
    // Remember the falling speed so we can detect heavy landings.
    this._impactVy = this.vy;

    // Horizontal step
    let newX = this.x + this.vx;
    const startTileY = Math.floor(this.y / TILE_SIZE);
    const endTileY = Math.floor((this.y + this.height - 1) / TILE_SIZE);

    if (this.vx > 0) {
      const rightTile = Math.floor((newX + this.width) / TILE_SIZE);
      let blocked = false;
      for (let ty = startTileY; ty <= endTileY; ty++) {
        if (world.isSolid(rightTile, ty)) {
          blocked = true;
          break;
        }
      }
      if (blocked) {
        newX = rightTile * TILE_SIZE - this.width - 0.01;
        this.vx = 0;
      }
    } else if (this.vx < 0) {
      const leftTile = Math.floor(newX / TILE_SIZE);
      let blocked = false;
      for (let ty = startTileY; ty <= endTileY; ty++) {
        if (world.isSolid(leftTile, ty)) {
          blocked = true;
          break;
        }
      }
      if (blocked) {
        newX = (leftTile + 1) * TILE_SIZE + 0.01;
        this.vx = 0;
      }
    }
    this.x = newX;

    // Vertical step
    let newY = this.y + this.vy;
    const startTileX = Math.floor((this.x + 1) / TILE_SIZE);
    const endTileX = Math.floor((this.x + this.width - 1) / TILE_SIZE);

    this.onGround = false;

    if (this.vy > 0) {
      const bottomTile = Math.floor((newY + this.height) / TILE_SIZE);
      let blocked = false;
      for (let tx = startTileX; tx <= endTileX; tx++) {
        if (world.isSolid(tx, bottomTile, dropThrough)) {
          // If platform, only block if previous bottom was above or at platform level
          if (world.isPlatform(tx, bottomTile)) {
            if (this.y + this.height <= bottomTile * TILE_SIZE + 4) {
              blocked = true;
              break;
            }
          } else {
            blocked = true;
            break;
          }
        }
      }
      if (blocked) {
        newY = bottomTile * TILE_SIZE - this.height;
        this.vy = 0;
        this.onGround = true;
        this.canDoubleJump = true;
      }
    } else if (this.vy < 0) {
      const topTile = Math.floor(newY / TILE_SIZE);
      let blocked = false;
      for (let tx = startTileX; tx <= endTileX; tx++) {
        const tile = world.getTile(tx, topTile);
        if (tile && TILE_PROPERTIES[tile].solid && !TILE_PROPERTIES[tile].isPlatform) {
          blocked = true;
          break;
        }
      }
      if (blocked) {
        newY = (topTile + 1) * TILE_SIZE;
        this.vy = 0;
      }
    }
    this.y = newY;

    // Track ground transitions: coyote time plus a heavy-landing flag.
    if (this.onGround) {
      this.coyoteTimer = 0.1;
      if (!this.wasOnGround && this._impactVy > 8.5) this.landedHard = true;
    } else if (this.wasOnGround) {
      this.coyoteTimer = 0.1;
    }
    this.wasOnGround = this.onGround;
  }

  startSwing(duration = 0.22) {
    this.isSwinging = true;
    this.swingTimer = duration;
    this.swingDuration = duration;
  }

  render(ctx, camera, heldItem, armorItem = this.activeArmor) {
    const sx = this.x - camera.x;
    const sy = this.y - camera.y;

    ctx.save();

    // Damage flash (flashing red / translucent when invulnerable)
    if (this.invulnerableTime > 0 && Math.floor(Date.now() / 60) % 2 === 0) {
      ctx.globalAlpha = 0.4;
    }

    // Dodge roll spin or normal draw
    if (this.isDodgeRolling) {
      const rollProgress = 1 - (this.dodgeTime / this.dodgeDuration);
      ctx.translate(sx + this.width / 2, sy + this.height / 2);
      ctx.rotate(this.facing * rollProgress * Math.PI * 2);
      this.drawPlayerBody(ctx, -this.width / 2, -this.height / 2);
      this.renderArmor(ctx, armorItem, -this.width / 2, -this.height / 2);
    } else {
      ctx.translate(sx, sy);
      if (this.facing === -1) {
        ctx.scale(-1, 1);
        ctx.translate(-this.width, 0);
      }
      this.drawPlayerBody(ctx, 0, 0);
      this.renderArmor(ctx, armorItem, 0, 0);

      // Render Held Item & Swing Arc
      if (heldItem && heldItem.id !== 'empty') {
        this.renderHeldItem(ctx, heldItem);
      }
    }

    ctx.restore();
  }

  drawPlayerBody(ctx, ox, oy) {
    // Terraria-style Pixel Player Model
    // 1. Hair / Helmet
    ctx.fillStyle = '#b45309'; // Copper/Golden hair
    ctx.fillRect(ox + 3, oy + 2, 12, 6);
    ctx.fillRect(ox + 2, oy + 4, 3, 5);

    // 2. Head / Face
    ctx.fillStyle = '#fed7aa'; // Skin tone
    ctx.fillRect(ox + 4, oy + 6, 10, 8);

    // Eyes
    ctx.fillStyle = '#1e3a8a';
    ctx.fillRect(ox + 10, oy + 8, 3, 3);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(ox + 10, oy + 8, 1, 1);

    // 3. Torso / Shirt
    ctx.fillStyle = '#2563eb'; // Blue adventurer tunic
    ctx.fillRect(ox + 3, oy + 14, 12, 11);
    ctx.fillStyle = '#1d4ed8'; // Belt / shadows
    ctx.fillRect(ox + 3, oy + 22, 12, 3);
    ctx.fillStyle = '#f59e0b'; // Gold belt buckle
    ctx.fillRect(ox + 8, oy + 22, 3, 3);

    // 4. Arms
    ctx.fillStyle = '#fed7aa';
    ctx.fillRect(ox + 1, oy + 15, 3, 8);

    // 5. Pants & Boots
    const walkAnim = Math.abs(this.vx) > 0.2 ? Math.sin(Date.now() * 0.015) * 3 : 0;
    // Legs
    ctx.fillStyle = '#334155'; // Dark trousers
    ctx.fillRect(ox + 4, oy + 25, 4, 6 - walkAnim);
    ctx.fillRect(ox + 10, oy + 25, 4, 6 + walkAnim);

    // Boots
    ctx.fillStyle = '#78350f'; // Leather boots
    ctx.fillRect(ox + 3, oy + 31 - walkAnim, 5, 5);
    ctx.fillRect(ox + 9, oy + 31 + walkAnim, 5, 5);
  }

  renderArmor(ctx, armorItem, ox, oy) {
    if (!armorItem) return;
    const colors = {
      gold_armor: ['#fbbf24', '#92400e'],
      iron_armor: ['#cbd5e1', '#475569'],
      diamond_armor: ['#67e8f9', '#155e75'],
      crystal_armor: ['#1e3a8a', '#0f172a'],
      rainbow_armor: ['#f0abfc', '#3730a3'],
      fallen_star_armor: ['#fef3c7', '#78350f']
    };
    const armorColors = colors[armorItem.id];
    if (!armorColors) return;

    ctx.save();
    ctx.fillStyle = armorColors[0];
    ctx.fillRect(ox + 2, oy + 2, 14, 6);
    ctx.fillRect(ox + 2, oy + 14, 14, 11);
    ctx.fillRect(ox, oy + 15, 4, 7);
    ctx.fillRect(ox + 14, oy + 15, 4, 7);
    ctx.fillStyle = armorColors[1];
    ctx.fillRect(ox + 3, oy + 22, 12, 3);
    ctx.fillRect(ox + 5, oy + 4, 3, 2);
    ctx.fillStyle = '#f8fafc';
    ctx.globalAlpha = 0.55;
    ctx.fillRect(ox + 4, oy + 15, 2, 6);
    ctx.restore();
  }

  renderHeldItem(ctx, heldItem) {
    const itemData = ITEMS[heldItem.id];
    if (!itemData) return;

    ctx.save();
    // Anchor at player hand
    ctx.translate(14, 18);

    if (this.isSwinging) {
      const swingProg = 1 - (this.swingTimer / this.swingDuration);
      const swingAngle = -Math.PI * 0.4 + swingProg * Math.PI * 0.85;
      ctx.rotate(swingAngle);
    } else {
      ctx.rotate(0.2); // Rest angle
    }

    // Render tool or weapon sprite
    const isPrismatic = heldItem.id === 'prismatic_saber' || heldItem.id === 'aurora_blade';
    const isHellWeapon = ['hellstone_greatblade', 'soulfire_repeater', 'abyssal_staff', 'inferno_brand'].includes(heldItem.id);
    if (isHellWeapon) {
      // Underworld gear is drawn as a compact pixel sprite rather than an emoji:
      // obsidian edges, ember seams, and a soul-lit core make each recipe readable.
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      ctx.globalAlpha = 0.18 + Math.sin(Date.now() * 0.012) * 0.05;
      ctx.fillStyle = heldItem.id === 'abyssal_staff' ? '#a855f7' : '#fb923c';
      ctx.fillRect(-5, -22, 10, 42);
      ctx.restore();
      ctx.fillStyle = '#1e293b';
      if (heldItem.id === 'soulfire_repeater') {
        ctx.fillRect(-2, -13, 4, 27); ctx.fillRect(-10, -5, 20, 4);
        ctx.fillStyle = '#fb7185'; ctx.fillRect(-7, -3, 14, 2); ctx.fillRect(1, 10, 3, 9);
      } else if (heldItem.id === 'abyssal_staff') {
        ctx.fillRect(-2, -15, 4, 30); ctx.fillRect(-7, -18, 14, 4);
        ctx.fillStyle = '#c084fc'; ctx.fillRect(-4, -22, 8, 8); ctx.fillStyle = '#f5d0fe'; ctx.fillRect(-1, -19, 3, 3);
      } else {
        ctx.fillStyle = '#f97316'; ctx.fillRect(0, -17, 5, 28); ctx.fillStyle = '#fef3c7'; ctx.fillRect(2, -14, 2, 19);
        ctx.fillStyle = '#7f1d1d'; ctx.fillRect(-3, 9, 11, 4); ctx.fillRect(2, 12, 4, 8);
      }
    } else if (isPrismatic) {
      // Endgame blades leave a living aurora behind the hand: layered neon
      // trails, orbiting motes, and a bright prismatic core.
      const pulse = 0.7 + Math.sin(Date.now() * 0.012) * 0.3;
      const colors = heldItem.id === 'aurora_blade'
        ? ['#22d3ee', '#a855f7', '#f472b6']
        : ['#f472b6', '#facc15', '#22d3ee'];
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      for (let i = 0; i < 3; i++) {
        ctx.strokeStyle = colors[i];
        ctx.globalAlpha = 0.35 * pulse;
        ctx.lineWidth = 3 - i;
        ctx.beginPath();
        ctx.moveTo(-22 - i * 5, 8 + i * 2);
        ctx.quadraticCurveTo(-4, -20 - i * 5, 28 + i * 4, -8 + i * 2);
        ctx.stroke();
      }
      for (let i = 0; i < 5; i++) {
        const a = Date.now() * 0.008 + i * 1.25;
        ctx.fillStyle = colors[i % colors.length];
        ctx.globalAlpha = 0.7 * pulse;
        ctx.fillRect(Math.cos(a) * 22 - 2, Math.sin(a) * 14 - 2, 4, 4);
      }
      ctx.restore();
    }
    if (!isHellWeapon) {
      ctx.font = "18px 'Segoe UI Emoji','Apple Color Emoji','Noto Color Emoji',sans-serif";
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(itemData.icon, 8, -6);
    }

    ctx.restore();
  }
}

// ==========================================
// MONSTER ENEMIES (Zombie, Demon Eye, Wraith)
// ==========================================

// Per-type traits: display name, knockback resistance (0..1) and whether the
// night can promote the monster into a tougher pink-named elite.
const MONSTER_TRAITS = {
  zombie: { name: 'Zombie', kb: 0.10, elite: true },
  demon_eye: { name: 'Demon Eye', kb: 0.00, elite: true },
  wraith: { name: 'Forest Wraith', kb: 0.45, elite: true },
  snow_wolf: { name: 'Snow Wolf', kb: 0.15, elite: true },
  savanna_hyena: { name: 'Savanna Hyena', kb: 0.15, elite: true },
  swamp_slime: { name: 'Swamp Slime', kb: 0.55, elite: true },
  cave_spider: { name: 'Cave Spider', kb: 0.20, elite: true },
  cave_bat: { name: 'Cave Bat', kb: 0.05, elite: true },
  swamp_mosquito: { name: 'Swamp Mosquito', kb: 0.00, elite: true },
  ice_golem: { name: 'Ice Golem', kb: 0.80, elite: true },
  snow_bat: { name: 'Frost Bat', kb: 0.05, elite: true },
  sun_scorpion: { name: 'Sun Scorpion', kb: 0.35, elite: true },
  ostrich: { name: 'Wild Ostrich', kb: 0.25, elite: true },
  bog_witch: { name: 'Bog Witch', kb: 0.50, elite: true }
};

class Monster {
  constructor(x, y, type = 'zombie') {
    this.x = x;
    this.y = y;
    this.type = type;
    this.vx = 0;
    this.vy = 0;
    this.facing = 1;
    this.dead = false;
    this.lightRadius = 0;

    if (type === 'zombie') {
      this.width = 18;
      this.height = 36;
      this.hp = 45;
      this.maxHp = 45;
      this.speed = 1.8;
      this.damage = 14;
      this.exp = 15;
    } else if (type === 'demon_eye') {
      this.width = 24;
      this.height = 20;
      this.hp = 35;
      this.maxHp = 35;
      this.speed = 3.2;
      this.damage = 18;
      this.exp = 20;
      this.lightRadius = 70;
      this.floatAngle = Math.random() * Math.PI * 2;
    } else if (type === 'wraith') {
      this.width = 22;
      this.height = 32;
      this.hp = 60;
      this.maxHp = 60;
      this.speed = 2.4;
      this.damage = 22;
      this.exp = 30;
      this.lightRadius = 90;
    } else if (type === 'snow_wolf') {
      this.width = 26;
      this.height = 22;
      this.hp = 55;
      this.maxHp = 55;
      this.speed = 2.5;
      this.damage = 20;
      this.exp = 25;
    } else if (type === 'savanna_hyena') {
      this.width = 24;
      this.height = 20;
      this.hp = 50;
      this.maxHp = 50;
      this.speed = 2.8;
      this.damage = 18;
      this.exp = 24;
    } else if (type === 'swamp_slime') {
      this.width = 26;
      this.height = 20;
      this.hp = 70;
      this.maxHp = 70;
      this.speed = 1.2;
      this.damage = 20;
      this.exp = 28;
    } else if (type === 'cave_spider') {
      this.width = 22;
      this.height = 18;
      this.hp = 42;
      this.maxHp = 42;
      this.speed = 2.2;
      this.damage = 17;
      this.exp = 26;
    } else if (type === 'cave_bat') {
      this.width = 26;
      this.height = 18;
      this.hp = 38;
      this.maxHp = 38;
      this.speed = 3.5;
      this.damage = 16;
      this.exp = 24;
      this.lightRadius = 45;
      this.floatAngle = Math.random() * Math.PI * 2;
    } else if (type === 'swamp_mosquito') {
      this.width = 18;
      this.height = 22;
      this.hp = 30;
      this.maxHp = 30;
      this.speed = 3.8;
      this.damage = 12;
      this.exp = 20;
      this.lightRadius = 30;
      this.floatAngle = Math.random() * Math.PI * 2;
    } else if (type === 'ice_golem') {
      this.width = 30;
      this.height = 40;
      this.hp = 110;
      this.maxHp = 110;
      this.speed = 0.9;
      this.damage = 28;
      this.exp = 45;
    } else if (type === 'snow_bat') {
      this.width = 26;
      this.height = 18;
      this.hp = 45;
      this.maxHp = 45;
      this.speed = 3.8;
      this.damage = 19;
      this.exp = 35;
      this.floatAngle = Math.random() * Math.PI * 2;
    } else if (type === 'sun_scorpion') {
      this.width = 25;
      this.height = 18;
      this.hp = 52;
      this.maxHp = 52;
      this.speed = 2.6;
      this.damage = 24;
      this.exp = 35;
    } else if (type === 'ostrich') {
      this.width = 24;
      this.height = 34;
      this.hp = 65;
      this.maxHp = 65;
      this.speed = 3.1;
      this.damage = 21;
      this.exp = 38;
    } else if (type === 'bog_witch') {
      this.width = 22;
      this.height = 34;
      this.hp = 75;
      this.maxHp = 75;
      this.speed = 1.4;
      this.damage = 26;
      this.exp = 42;
    }

    // ---- Shared combat / AI state ----
    const traits = MONSTER_TRAITS[type] || { name: type, kb: 0.15, elite: true };
    this.displayName = traits.name;
    this.knockbackResist = traits.kb;
    this.canBeElite = traits.elite !== false;
    this.hurtCooldown = 0;      // short i-frames so a burst cannot double-dip
    this.hitFlash = 0;          // white flash timer when struck
    this.isElite = false;
    this.eliteScale = 1;
    this.stuckTimer = 0;
    this.speedJitter = 0.9 + Math.random() * 0.2;
    this.wanderTimer = Math.random() * 2;
  }

  /** Night-time promotion: tougher, faster, pink-named, better loot. */
  makeElite() {
    if (this.isElite || !this.canBeElite) return this;
    this.isElite = true;
    this.eliteScale = 1.22;
    this.maxHp = Math.round(this.maxHp * 2.2);
    this.hp = this.maxHp;
    this.damage = Math.round(this.damage * 1.35);
    this.speed *= 1.1;
    this.exp = Math.round(this.exp * 2.4);
    this.knockbackResist = Math.min(0.9, this.knockbackResist + 0.25);
    this.width = Math.round(this.width * 1.18);
    this.height = Math.round(this.height * 1.18);
    this.displayName = 'Elite ' + this.displayName;
    return this;
  }

  die(particleSystem) {
    this.dead = true;
    if (!particleSystem) return;
    const ichor = this.type === 'demon_eye' ? '#a855f7'
      : this.type === 'ice_golem' || this.type === 'snow_bat' ? '#bae6fd'
        : this.type === 'swamp_slime' || this.type === 'bog_witch' ? '#4ade80'
          : '#ef4444';
    particleSystem.bloodBurst(this.x + this.width / 2, this.y + this.height / 2, ichor, this.isElite ? 24 : 16);
    particleSystem.magicSparkle(this.x + this.width / 2, this.y + this.height / 2, ichor, this.isElite ? 18 : 8);
  }

  /**
   * Apply damage. Returns the damage actually dealt (0 when blocked by i-frames)
   * so callers can gate hit-stop and screen shake on real hits.
   */
  takeDamage(amount, soundSystem, particleSystem, isCrit = false, options = null) {
    if (this.dead) return 0;
    if (this.hurtCooldown > 0 && !(options && options.bypassIFrames)) return 0;

    const dealt = Math.max(1, Math.round(amount));
    this.hp -= dealt;
    this.hurtCooldown = 0.22;
    this.hitFlash = 0.12;

    if (soundSystem) soundSystem.playHit();
    if (particleSystem) {
      const blood = this.type === 'demon_eye' ? '#a855f7' : '#ef4444';
      particleSystem.addDamageText(this.x + this.width / 2, this.y, dealt, isCrit ? '#f59e0b' : '#ef4444', isCrit);
      particleSystem.bloodBurst(this.x + this.width / 2, this.y + this.height / 2, blood, isCrit ? 14 : 8);
    }

    // Directional knockback, resisted by heavier monsters.
    const kbDir = (options && Number.isFinite(options.kbDir)) ? options.kbDir : -this.facing;
    const kbForce = (options && Number.isFinite(options.kbForce)) ? options.kbForce : 3;
    const resist = 1 - this.knockbackResist;
    if (resist > 0) {
      const critBoost = isCrit ? 1.5 : 1;
      this.vx = kbDir * kbForce * resist * critBoost;
      this.vy = -3 * resist * critBoost;
    }

    if (this.hp <= 0) this.die(particleSystem);
    return dealt;
  }

  update(dt, player, world) {
    if (this.hurtCooldown > 0) this.hurtCooldown = Math.max(0, this.hurtCooldown - dt);
    if (this.hitFlash > 0) this.hitFlash = Math.max(0, this.hitFlash - dt);

    const dx = (player.x + player.width / 2) - (this.x + this.width / 2);
    const dy = (player.y + player.height / 2) - (this.y + this.height / 2);
    const distToPlayer = Math.hypot(dx, dy);
    // Only turn to face the player when it can actually sense them.
    if (distToPlayer < 700) this.facing = dx >= 0 ? 1 : -1;

    if (this.isGroundType()) {
      // ---- Ground AI: chase, hop obstacles, refuse to walk into lava ----
      const speed = this.speed * this.speedJitter;
      if (Math.abs(dx) > 10) {
        // Ease into the chase so monsters do not snap between directions.
        const desired = this.facing * speed;
        this.vx += (desired - this.vx) * 0.25;
      } else {
        this.vx *= 0.7;
      }

      this.vy += 0.38; // gravity
      if (this.vy > 12) this.vy = 12;

      const frontTileX = Math.floor((this.x + (this.facing === 1 ? this.width + 4 : -4)) / TILE_SIZE);
      const footTileY = Math.floor((this.y + this.height - 2) / TILE_SIZE);
      const bellyTileY = Math.floor((this.y + this.height * 0.5) / TILE_SIZE);
      const wallAhead = world.isSolid(frontTileX, bellyTileY) || world.isSolid(frontTileX, footTileY - 1);

      // Hop over one-block steps instead of grinding into them.
      if (wallAhead && this.vy >= 0) {
        this.vy = -6.8 - (this.isElite ? 0.8 : 0);
      }

      // Do not stroll into lava or off a lethal drop while not chasing.
      const belowTileY = Math.floor((this.y + this.height + 4) / TILE_SIZE);
      const nextFloorSolid = world.isSolid(frontTileX, belowTileY);
      const nextFloorLava = world.getTile(frontTileX, belowTileY) === TILES.LAVA;
      if (Math.abs(dx) > 200 && nextFloorLava) {
        this.vx = -this.facing * speed * 0.8;
      }
      if (Math.abs(dx) > 200 && !nextFloorSolid && Math.abs(this.vy) < 0.6) {
        this.vx *= 0.2; // ledge hesitation
      }

      // Stuck detection: if we have been blocked for a while, hop and reverse.
      this.stuckTimer = Math.abs(this.vx) < 0.09 && Math.abs(dx) > 14
        ? this.stuckTimer + dt
        : 0;
      if (this.stuckTimer > 1.2) {
        this.stuckTimer = 0;
        this.vy = -7.2;
        this.vx = -this.facing * speed;
        this.facing = -this.facing;
      }

      this.resolveWorldPhysics(world);

      // Lava hurts monsters too — they will not camp in it.
      if (world.getTile(Math.floor((this.x + this.width / 2) / TILE_SIZE),
        Math.floor((this.y + this.height - 4) / TILE_SIZE)) === TILES.LAVA) {
        this.hp -= dt * 26;
        if (this.hp <= 0) this.dead = true;
      }

    } else if (this.type === 'demon_eye' || this.type === 'cave_bat' || this.type === 'swamp_mosquito' || this.type === 'snow_bat') {
      // ---- Flying AI: swoop in a sine wave and steer around solid rock ----
      this.floatAngle += dt * 3;
      const targetY = player.y + Math.sin(this.floatAngle) * 35;
      const tdy = targetY - this.y;

      const accel = 0.15 * (this.isElite ? 1.2 : 1);
      this.vx += (dx > 0 ? accel : -accel);
      this.vy += (tdy > 0 ? 0.12 : -0.12);

      // Wall avoidance: probe ahead and push up/back when rock is in the way.
      const probeX = Math.floor((this.x + this.width / 2 + Math.sign(this.vx || 1) * 14) / TILE_SIZE);
      const probeY = Math.floor((this.y + this.height / 2) / TILE_SIZE);
      if (world.isSolid(probeX, probeY)) {
        this.vy -= 0.35;
        this.vx -= Math.sign(this.vx || 1) * 0.18;
      }
      const aboveProbe = Math.floor((this.y - 6) / TILE_SIZE);
      if (world.isSolid(probeX, aboveProbe)) {
        this.vy += 0.35;
      }

      const flySpeed = this.speed * (this.isElite ? 1.1 : 1);
      this.vx = Math.max(-flySpeed, Math.min(flySpeed, this.vx));
      this.vy = Math.max(-flySpeed, Math.min(flySpeed, this.vy));

      this.x += this.vx;
      this.y += this.vy;

    } else if (this.type === 'wraith') {
      // Floating phantom: passes through stone smoothly
      const dist = Math.hypot(dx, dy) || 1;
      const chaseSpeed = this.speed * (this.isElite ? 1.12 : 1);
      this.vx = (dx / dist) * chaseSpeed;
      this.vy = (dy / dist) * chaseSpeed;

      this.x += this.vx;
      this.y += this.vy;
    }
  }

  /** True for the walker types that use tile collision. */
  isGroundType() {
    return ['zombie', 'snow_wolf', 'savanna_hyena', 'swamp_slime', 'cave_spider',
      'ice_golem', 'sun_scorpion', 'ostrich', 'bog_witch'].includes(this.type);
  }

  resolveWorldPhysics(world) {
    // Horizontal step
    let newX = this.x + this.vx;
    const startTileY = Math.floor(this.y / TILE_SIZE);
    const endTileY = Math.floor((this.y + this.height - 1) / TILE_SIZE);

    if (this.vx > 0) {
      const rightTile = Math.floor((newX + this.width) / TILE_SIZE);
      let blocked = false;
      for (let ty = startTileY; ty <= endTileY; ty++) {
        if (world.isSolid(rightTile, ty)) {
          blocked = true;
          break;
        }
      }
      if (blocked) {
        newX = rightTile * TILE_SIZE - this.width - 0.01;
        this.vx = 0;
      }
    } else if (this.vx < 0) {
      const leftTile = Math.floor(newX / TILE_SIZE);
      let blocked = false;
      for (let ty = startTileY; ty <= endTileY; ty++) {
        if (world.isSolid(leftTile, ty)) {
          blocked = true;
          break;
        }
      }
      if (blocked) {
        newX = (leftTile + 1) * TILE_SIZE + 0.01;
        this.vx = 0;
      }
    }
    this.x = newX;

    // Vertical step
    let newY = this.y + this.vy;
    const startTileX = Math.floor(this.x / TILE_SIZE);
    const endTileX = Math.floor((this.x + this.width) / TILE_SIZE);

    if (this.vy > 0) {
      const bottomTile = Math.floor((newY + this.height) / TILE_SIZE);
      let blocked = false;
      for (let tx = startTileX; tx <= endTileX; tx++) {
        if (world.isSolid(tx, bottomTile)) {
          blocked = true;
          break;
        }
      }
      if (blocked) {
        newY = bottomTile * TILE_SIZE - this.height;
        this.vy = 0;
      }
    } else if (this.vy < 0) {
      const topTile = Math.floor(newY / TILE_SIZE);
      let blocked = false;
      for (let tx = startTileX; tx <= endTileX; tx++) {
        if (world.isSolid(tx, topTile)) {
          blocked = true;
          break;
        }
      }
      if (blocked) {
        newY = (topTile + 1) * TILE_SIZE;
        this.vy = 0;
      }
    }
    this.y = newY;
  }

  render(ctx, camera) {
    const sx = this.x - camera.x;
    const sy = this.y - camera.y;

    ctx.save();
    ctx.translate(sx, sy);
    if (this.isElite) {
      // Elites are visibly larger, scaling about their own centre.
      ctx.translate(this.width / 2, this.height / 2);
      ctx.scale(this.eliteScale, this.eliteScale);
      ctx.translate(-this.width / 2, -this.height / 2);
    }
    if (this.facing === -1) {
      ctx.scale(-1, 1);
      ctx.translate(-this.width, 0);
    }

    if (this.type === 'zombie') {
      // Rotting green flesh
      ctx.fillStyle = '#4ade80';
      ctx.fillRect(4, 4, 10, 10);
      // Tattered clothes
      ctx.fillStyle = '#166534';
      ctx.fillRect(3, 14, 12, 12);
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(4, 26, 10, 10);
      // Glowing bloody eye
      ctx.fillStyle = '#ef4444';
      ctx.fillRect(10, 7, 3, 3);
      // Outstretched arms
      ctx.fillStyle = '#4ade80';
      ctx.fillRect(12, 16, 8, 4);

    } else if (this.type === 'snow_wolf' || this.type === 'savanna_hyena' || this.type === 'swamp_slime' || this.type === 'cave_spider' || this.type === 'ice_golem' || this.type === 'sun_scorpion' || this.type === 'ostrich' || this.type === 'bog_witch') {
      const bodyColor = this.type === 'snow_wolf' ? '#e2e8f0' : this.type === 'ice_golem' ? '#bae6fd' : this.type === 'savanna_hyena' ? '#b45309' : this.type === 'sun_scorpion' ? '#f59e0b' : this.type === 'ostrich' ? '#7c2d12' : this.type === 'bog_witch' ? '#581c87' : this.type === 'swamp_slime' ? '#4d7c0f' : '#7c3aed';
      ctx.fillStyle = bodyColor;
      ctx.fillRect(3, 6, this.width - 7, this.height - 8);
      ctx.fillRect(this.width - 8, 3, 6, 10);
      ctx.fillStyle = '#111827';
      ctx.fillRect(this.width - 5, 6, 2, 2);
      ctx.fillStyle = this.type === 'swamp_slime' ? '#bef264' : '#334155';
      ctx.fillRect(5, this.height - 4, 4, 4);
      ctx.fillRect(this.width - 10, this.height - 4, 4, 4);

    } else if (this.type === 'demon_eye') {
      // Glowing sclera
      ctx.fillStyle = '#f8fafc';
      ctx.beginPath();
      ctx.arc(12, 10, 10, 0, Math.PI * 2);
      ctx.fill();
      // Bloodshot veins
      ctx.strokeStyle = '#dc2626';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(4, 8);
      ctx.lineTo(8, 10);
      ctx.moveTo(6, 14);
      ctx.lineTo(10, 11);
      ctx.stroke();
      // Glowing iris & pupil
      ctx.fillStyle = '#7c3aed';
      ctx.beginPath();
      ctx.arc(15, 10, 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#000000';
      ctx.beginPath();
      ctx.arc(16, 10, 2.5, 0, Math.PI * 2);
      ctx.fill();

    } else if (this.type === 'cave_bat' || this.type === 'swamp_mosquito' || this.type === 'snow_bat') {
      ctx.fillStyle = this.type === 'snow_bat' ? '#bfdbfe' : this.type === 'cave_bat' ? '#312e81' : '#365314';
      ctx.beginPath();
      ctx.moveTo(12, 8);
      ctx.lineTo(1, 2);
      ctx.lineTo(5, 12);
      ctx.lineTo(1, 18);
      ctx.lineTo(12, 14);
      ctx.lineTo(23, 18);
      ctx.lineTo(19, 12);
      ctx.lineTo(23, 2);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = '#f87171';
      ctx.fillRect(10, 9, 3, 3);
      ctx.fillRect(15, 9, 3, 3);

    } else if (this.type === 'wraith') {
      ctx.globalAlpha = 0.85;
      ctx.fillStyle = '#312e81';
      ctx.beginPath();
      ctx.moveTo(11, 2);
      ctx.quadraticCurveTo(22, 10, 18, 30);
      ctx.quadraticCurveTo(11, 24, 4, 30);
      ctx.quadraticCurveTo(0, 10, 11, 2);
      ctx.fill();
      // Glowing ethereal eyes
      ctx.fillStyle = '#67e8f9';
      ctx.shadowColor = '#06b6d4';
      ctx.shadowBlur = 10;
      ctx.fillRect(8, 10, 3, 2);
      ctx.fillRect(14, 10, 3, 2);
    }

    ctx.restore();

    // White impact flash so every hit reads instantly.
    if (this.hitFlash > 0) {
      ctx.save();
      ctx.globalAlpha = Math.min(0.85, this.hitFlash * 6);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(sx - 1, sy - 1, this.width + 2, this.height + 2);
      ctx.restore();
    }

    this.renderHealthBar(ctx, sx, sy);
  }

  /** Compact health pip above wounded enemies, Terraria style. */
  renderHealthBar(ctx, sx, sy) {
    if (this.dead) return;
    const wounded = this.hp < this.maxHp;
    const focused = this.hurtCooldown > 0;
    if (!wounded && !focused && !this.isElite) return;

    const w = Math.max(20, this.width);
    const x = sx + (this.width - w) / 2;
    const y = sy - 8;
    const ratio = Math.max(0, Math.min(1, this.hp / this.maxHp));

    ctx.save();
    ctx.fillStyle = 'rgba(2, 6, 23, 0.75)';
    ctx.fillRect(x - 1, y - 1, w + 2, 5);
    ctx.fillStyle = ratio > 0.5 ? '#4ade80' : ratio > 0.22 ? '#fbbf24' : '#ef4444';
    ctx.fillRect(x, y, w * ratio, 3);
    if (this.isElite) {
      ctx.strokeStyle = '#f472b6';
      ctx.lineWidth = 1;
      ctx.strokeRect(x - 1.5, y - 1.5, w + 3, 6);
    }
    ctx.restore();
  }
}

class Critter {
  constructor(x, y, type = 'sheep') {
    this.x = x;
    this.y = y;
    this.type = type;
    this.width = type === 'sheep' ? 26 : 18;
    this.height = type === 'sheep' ? 22 : 16;
    this.vx = Math.random() > 0.5 ? 0.45 : -0.45;
    this.vy = 0;
    this.hp = type === 'sheep' ? 28 : 18;
    this.dead = false;
    this.wanderTimer = 1 + Math.random() * 3;
    this.bob = Math.random() * Math.PI * 2;
  }

  takeDamage(amount, soundSystem, particleSystem) {
    this.hp -= amount;
    this.vx = this.vx >= 0 ? 2.5 : -2.5;
    particleSystem.addDamageText(this.x + this.width / 2, this.y, amount, '#fca5a5', false);
    particleSystem.bloodBurst(this.x + this.width / 2, this.y + this.height / 2, '#f87171', 5);
    if (this.hp <= 0) this.dead = true;
  }

  update(dt, player, world) {
    this.wanderTimer -= dt;
    this.bob += dt * 4;
    const playerDistance = Math.hypot(player.x - this.x, player.y - this.y);
    if (playerDistance < 100) {
      this.vx = player.x < this.x ? 1.2 : -1.2;
    } else if (this.wanderTimer <= 0) {
      this.vx = (Math.random() - 0.5) * 1.2;
      this.wanderTimer = 1.5 + Math.random() * 3;
    }

    this.vy = Math.min(8, this.vy + 0.35);
    const nextX = this.x + this.vx;
    const footTileX = Math.floor((nextX + this.width / 2) / TILE_SIZE);
    const footTileY = Math.floor((this.y + this.height + 2) / TILE_SIZE);
    if (world.isSolid(footTileX, footTileY)) {
      this.vx *= -1;
    } else {
      this.x = nextX;
    }

    const nextY = this.y + this.vy;
    const bottomTile = Math.floor((nextY + this.height) / TILE_SIZE);
    if (this.vy > 0 && world.isSolid(Math.floor((this.x + this.width / 2) / TILE_SIZE), bottomTile)) {
      this.y = bottomTile * TILE_SIZE - this.height;
      this.vy = 0;
    } else {
      this.y = nextY;
    }
  }

  render(ctx, camera) {
    const sx = this.x - camera.x;
    const sy = this.y - camera.y + Math.sin(this.bob) * 1.5;
    ctx.save();
    ctx.translate(sx, sy);
    if (this.vx < 0) {
      ctx.scale(-1, 1);
      ctx.translate(-this.width, 0);
    }
    if (this.type === 'sheep') {
      ctx.fillStyle = '#f8fafc';
      ctx.fillRect(4, 5, 18, 12);
      ctx.fillRect(1, 8, 7, 8);
      ctx.fillStyle = '#334155';
      ctx.fillRect(0, 10, 6, 7);
      ctx.fillRect(7, 16, 3, 6);
      ctx.fillRect(18, 16, 3, 6);
      ctx.fillStyle = '#111827';
      ctx.fillRect(2, 12, 2, 2);
    } else {
      ctx.fillStyle = '#a16207';
      ctx.fillRect(3, 5, 12, 9);
      ctx.fillStyle = '#fef3c7';
      ctx.fillRect(12, 7, 7, 7);
      ctx.fillStyle = '#78350f';
      ctx.fillRect(5, 13, 3, 3);
      ctx.fillRect(12, 13, 3, 3);
      ctx.fillStyle = '#111827';
      ctx.fillRect(16, 9, 2, 2);
      ctx.fillRect(3, 1, 3, 5);
      ctx.fillRect(12, 1, 3, 5);
    }
    ctx.restore();
  }
}

// ==========================================
// BOSS: ANCIENT FOREST GUARDIAN
// (Phase 1: Forest Sentinel Eye -> Phase 2: Bramble Behemoth)
// ==========================================

class ForestGuardianBoss {
  constructor(x, y, game = null) {
    this.x = x;
    this.y = y;
    this.width = 64;
    this.height = 64;
    this.vx = 0;
    this.vy = 0;
    this.maxHp = 3000;
    this.hp = 3000;
    this.phase = 1; // Phase 1 or Phase 2
    this.name = 'ANCIENT FOREST GUARDIAN';
    this.dead = false;
    this.lightRadius = 240;
    this.game = game;         // optional back-reference for shake / summons
    this.hitFlash = 0;
    this.enraged = false;
    this.lastAttack = '';

    // Attack AI Timers
    this.attackTimer = 0;
    this.attackState = 'hover'; // hover | barrage | dash_charge | dashing | slam
    this.stateTimer = 2.0;
    this.dashTargetX = 0;
    this.dashTargetY = 0;
    this.facing = 1;
    this.rot = 0;
    this.telegraph = null;      // { type, x, y, angle, timer } read by the renderer
    this.attackHistory = [];
  }

  /** Bosses cannot be knocked back, but they do flash and report damage dealt. */
  takeDamage(amount, soundSystem, particleSystem, isCrit = false) {
    if (this.dead) return 0;
    const dealt = Math.max(1, Math.round(amount));
    this.hp -= dealt;
    this.hitFlash = 0.1;
    if (soundSystem) soundSystem.playHit();
    if (particleSystem) {
      particleSystem.addDamageText(this.x + this.width / 2, this.y, dealt, isCrit ? '#f59e0b' : '#ef4444', isCrit);
      particleSystem.bloodBurst(this.x + this.width / 2, this.y + this.height / 2,
        this.phase === 1 ? '#e11d48' : '#22c55e', isCrit ? 20 : 14);
    }

    // Phase transition at 50% HP — slow motion + roar for drama.
    if (this.phase === 1 && this.hp <= this.maxHp * 0.5) {
      this.phase = 2;
      this.enraged = true;
      this.name = 'BRAMBLE BEHEMOTH (ENRAGED)';
      this.speedBoost = 1.25;
      if (soundSystem) soundSystem.playBossRoar();
      if (particleSystem) {
        particleSystem.magicSparkle(this.x + this.width / 2, this.y + this.height / 2, '#22c55e', 40);
        particleSystem.bloodBurst(this.x + this.width / 2, this.y + this.height / 2, '#86efac', 24);
        for (let i = 0; i < 26; i++) {
          const ra = (i / 26) * Math.PI * 2;
          particleSystem.addParticle(this.x + this.width / 2, this.y + this.height / 2,
            Math.cos(ra) * (4 + Math.random() * 3), Math.sin(ra) * (4 + Math.random() * 3),
            i % 2 ? '#4ade80' : '#fde047', 3.5, 0.8, 0.04);
        }
      }
      if (this.game && this.game.feel) {
        this.game.feel.stop(0.12, 0.05);
        this.game.feel.slow(1.3, 0.28);
        this.game.feel.shake(0.9);
      }
      if (this.game) this.game.showAnnouncement('🌿 THE GUARDIAN ENRAGES!');
    }

    if (this.hp <= 0) {
      this.dead = true;
      if (soundSystem) soundSystem.playExplosion();
      if (particleSystem) {
        particleSystem.magicSparkle(this.x + this.width / 2, this.y + this.height / 2, '#fbbf24', 50);
        particleSystem.bloodBurst(this.x + this.width / 2, this.y + this.height / 2, '#dc2626', 40);
      }
      if (this.game && this.game.feel) this.game.feel.shake(1.0);
    }
    return dealt;
  }

  /** Choose the next attack, avoiding an immediate repeat of the previous one. */
  pickAttack() {
    const pool = this.phase === 1
      ? ['barrage', 'dash_charge', 'slam']
      : ['barrage', 'dash_charge', 'slam', 'barrage', 'minions'];
    let choice = pool[Math.floor(Math.random() * pool.length)];
    if (choice === this.lastAttack && Math.random() < 0.7) {
      choice = pool[(pool.indexOf(choice) + 1) % pool.length];
    }
    this.lastAttack = choice;
    return choice;
  }

  /** Fire a full circle of projectiles — the classic "bullet hell ring". */
  spawnRing(cx, cy, projectiles, count, speed, type, damage) {
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2 + Math.random() * 0.12;
      projectiles.push(new Projectile(
        cx, cy,
        Math.cos(angle) * speed,
        Math.sin(angle) * speed,
        type, damage, true, 4.5, 90
      ));
    }
  }

  update(dt, player, projectiles, soundSystem, particleSystem, world = null) {
    if (this.hitFlash > 0) this.hitFlash = Math.max(0, this.hitFlash - dt);
    const cx = this.x + this.width / 2;
    const cy = this.y + this.height / 2;
    const px = player.x + player.width / 2;
    const py = player.y + player.height / 2;
    const dx = px - cx;
    const dy = py - cy;
    this.facing = dx >= 0 ? 1 : -1;
    const boost = this.enraged ? 1.25 : 1;

    this.stateTimer -= dt;

    if (this.attackState === 'hover') {
      // Hover menacingly above player
      const desiredX = px + Math.sin(Date.now() * 0.002) * 120;
      const desiredY = py - (this.phase === 1 ? 160 : 130);
      this.vx += (desiredX - cx) * 0.04;
      this.vy += (desiredY - cy) * 0.04;
      this.vx *= 0.92;
      this.vy *= 0.92;

      // Projectile shooting
      this.attackTimer += dt;
      const shootInterval = (this.phase === 1 ? 1.6 : 1.0) / boost;
      if (this.attackTimer >= shootInterval) {
        this.attackTimer = 0;
        soundSystem.playBossLaser();
        const angle = Math.atan2(dy, dx);
        const pSpeed = (this.phase === 1 ? 6.5 : 8.5) * boost;
        const pType = this.phase === 1 ? 'boss_laser' : 'boss_thorn';
        projectiles.push(new Projectile(
          cx, cy,
          Math.cos(angle) * pSpeed,
          Math.sin(angle) * pSpeed,
          pType,
          this.phase === 1 ? 18 : 24,
          true,
          4.0,
          100
        ));
      }

      if (this.stateTimer <= 0) {
        // Pick the next attack and telegraph it so the player can react.
        this.attackState = this.pickAttack();
        this.telegraph = null;
        if (this.attackState === 'dash_charge') {
          this.stateTimer = 0.7;
          this.dashTargetX = px;
          this.dashTargetY = py;
          this.telegraph = { type: 'line', timer: 0.7, x: px, y: py };
          soundSystem.playBossRoar();
        } else if (this.attackState === 'barrage') {
          this.stateTimer = 1.1;
          this.telegraph = { type: 'ring', timer: 1.1 };
          soundSystem.playBossRoar();
        } else if (this.attackState === 'slam') {
          this.stateTimer = 0.85;
          this.telegraph = { type: 'ground', timer: 0.85, x: px, y: py };
          soundSystem.playBossRoar();
        } else if (this.attackState === 'minions') {
          this.stateTimer = 0.6;
          this.telegraph = { type: 'summon', timer: 0.6 };
        }
      }

    } else if (this.attackState === 'dash_charge') {
      // Wind up & aim at player
      this.vx *= 0.85;
      this.vy *= 0.85;
      // Track slowly, so a moving player can still dodge the charge.
      this.dashTargetX += (px - this.dashTargetX) * 0.04;
      this.dashTargetY += (py - this.dashTargetY) * 0.04;
      if (this.telegraph) {
        this.telegraph.timer = this.stateTimer;
        this.telegraph.x = this.dashTargetX;
        this.telegraph.y = this.dashTargetY;
      }
      particleSystem.addParticle(cx + (Math.random() - 0.5) * 40, cy + (Math.random() - 0.5) * 40, 0, 0, '#ef4444', 4, 0.2, 0, true);

      if (this.stateTimer <= 0) {
        this.attackState = 'dashing';
        this.stateTimer = 1.0;
        this.telegraph = null;
        const dAngle = Math.atan2(this.dashTargetY - cy, this.dashTargetX - cx);
        const dashSpeed = (this.phase === 1 ? 13 : 17) * boost;
        this.vx = Math.cos(dAngle) * dashSpeed;
        this.vy = Math.sin(dAngle) * dashSpeed;
        if (this.game && this.game.feel) this.game.feel.shake(0.4);
      }

    } else if (this.attackState === 'dashing') {
      // Flying high-speed charge
      particleSystem.addParticle(cx, cy, -this.vx * 0.2, -this.vy * 0.2, this.phase === 1 ? '#ef4444' : '#22c55e', 6, 0.3, 0, true);

      if (this.stateTimer <= 0) {
        this.attackState = 'hover';
        this.stateTimer = (this.phase === 1 ? 3.0 : 2.2) / boost;
      }

    } else if (this.attackState === 'barrage') {
      // Hover in place, then erupt in a full ring of thorns.
      this.vx *= 0.86;
      this.vy *= 0.86;
      this.vy += (py - 140 - cy) * 0.006;
      if (this.telegraph) this.telegraph.timer = this.stateTimer;
      particleSystem.addParticle(cx + (Math.random() - 0.5) * 60, cy + (Math.random() - 0.5) * 60, 0, 0, '#22c55e', 3, 0.25, 0, true);

      if (this.stateTimer <= 0) {
        soundSystem.playBossLaser();
        const count = this.phase === 1 ? 12 : 18;
        const speed = (this.phase === 1 ? 5.0 : 6.2) * boost;
        this.spawnRing(cx, cy, projectiles, count, speed,
          this.phase === 1 ? 'boss_laser' : 'boss_thorn',
          this.phase === 1 ? 18 : 24);
        if (this.game && this.game.feel) this.game.feel.shake(0.35);
        this.telegraph = null;
        this.attackState = 'hover';
        this.stateTimer = (this.phase === 1 ? 2.8 : 2.0) / boost;
      }

    } else if (this.attackState === 'slam') {
      // Rear up high above the player before crashing down.
      const desiredY = py - 230;
      this.vy += (desiredY - cy) * 0.028;
      this.vx *= 0.9;
      if (this.telegraph) this.telegraph.timer = this.stateTimer;
      if (this.stateTimer <= 0) {
        this.attackState = 'slamming';
        this.stateTimer = 1.4;
        this.telegraph = null;
        this.vx = (px - cx) * 0.03;
        this.vy = 15 * boost;
      }

    } else if (this.attackState === 'slamming') {
      particleSystem.addParticle(cx, cy, (Math.random() - 0.5) * 2, -1, '#fbbf24', 5, 0.3, 0, true);
      const footTile = Math.floor((this.y + this.height + 4) / TILE_SIZE);
      const midTileX = Math.floor(cx / TILE_SIZE);
      const grounded = world ? world.isSolid(midTileX, footTile) : false;

      if (grounded || this.stateTimer <= 0) {
        // Impact: heavy shake plus a spray of ground thorns.
        soundSystem.playExplosion();
        if (particleSystem) particleSystem.bloodBurst(cx, this.y + this.height, '#fbbf24', 26);
        if (this.game && this.game.feel) this.game.feel.shake(0.95);
        const shards = this.phase === 1 ? 8 : 14;
        for (let i = 0; i < shards; i++) {
          const dir = i % 2 === 0 ? 1 : -1;
          const spread = 1 + Math.floor(i / 2) * 0.22;
          projectiles.push(new Projectile(
            cx, this.y + this.height - 12,
            dir * (3.0 + spread) * boost,
            -(2.4 + spread * 0.5),
            'boss_thorn',
            this.phase === 1 ? 16 : 22,
            true, 3.0, 80
          ));
        }
        this.vy = -4;
        this.attackState = 'hover';
        this.stateTimer = (this.phase === 1 ? 2.6 : 1.8) / boost;
      }

    } else if (this.attackState === 'minions') {
      if (this.stateTimer <= 0) {
        const types = this.phase === 1 ? ['cave_bat'] : ['cave_bat', 'demon_eye', 'wraith'];
        if (this.game && Array.isArray(this.game.monsters)) {
          const count = this.phase === 1 ? 2 : 3;
          for (let i = 0; i < count; i++) {
            const type = types[Math.floor(Math.random() * types.length)];
            const minion = new Monster(cx + (i - (count - 1) / 2) * 34, cy - 12, type);
            minion.speed *= 1.1;
            if (this.phase === 2) minion.makeElite();
            this.game.monsters.push(minion);
          }
          if (this.game.feel) this.game.feel.shake(0.3);
          if (particleSystem) particleSystem.magicSparkle(cx, cy, '#22c55e', 22);
        }
        this.telegraph = null;
        this.attackState = 'hover';
        this.stateTimer = (this.phase === 1 ? 2.4 : 1.6) / boost;
      }
    }

    this.x += this.vx;
    this.y += this.vy;
    this.rot = Math.atan2(this.vy, this.vx) * 0.3;
  }

  render(ctx, camera) {
    const sx = this.x - camera.x;
    const sy = this.y - camera.y;

    ctx.save();
    ctx.translate(sx + this.width / 2, sy + this.height / 2);
    ctx.rotate(this.rot);

    if (this.phase === 1) {
      // Phase 1: Giant Demon Eye of the Forest
      ctx.shadowColor = '#ef4444';
      ctx.shadowBlur = 20;

      // Sclera
      ctx.fillStyle = '#f8fafc';
      ctx.beginPath();
      ctx.arc(0, 0, 28, 0, Math.PI * 2);
      ctx.fill();

      // Blood veins
      ctx.strokeStyle = '#dc2626';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(-20, -10);
      ctx.lineTo(-6, -4);
      ctx.moveTo(-18, 14);
      ctx.lineTo(-4, 6);
      ctx.stroke();

      // Iris & Cornea
      ctx.fillStyle = '#b91c1c';
      ctx.beginPath();
      ctx.arc(8 * this.facing, 0, 14, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#111827';
      ctx.beginPath();
      ctx.arc(9 * this.facing, 0, 7, 0, Math.PI * 2);
      ctx.fill();

      // Crown of thorns / brambles
      ctx.fillStyle = '#166534';
      for (let i = 0; i < 6; i++) {
        const a = (i / 6) * Math.PI * 2;
        ctx.beginPath();
        ctx.moveTo(Math.cos(a) * 26, Math.sin(a) * 26);
        ctx.lineTo(Math.cos(a) * 38, Math.sin(a) * 38);
        ctx.lineTo(Math.cos(a + 0.2) * 26, Math.sin(a + 0.2) * 26);
        ctx.fill();
      }

    } else {
      // Phase 2: Bramble Behemoth - Giant Maw & Thorns
      ctx.shadowColor = '#22c55e';
      ctx.shadowBlur = 25;

      // Dark bramble shell
      ctx.fillStyle = '#14532d';
      ctx.beginPath();
      ctx.arc(0, 0, 32, 0, Math.PI * 2);
      ctx.fill();

      // Terrifying open maw
      ctx.fillStyle = '#450a0a';
      ctx.beginPath();
      ctx.ellipse(4 * this.facing, 0, 18, 22, 0, 0, Math.PI * 2);
      ctx.fill();

      // Razor teeth
      ctx.fillStyle = '#f8fafc';
      for (let t = -16; t <= 16; t += 8) {
        ctx.beginPath();
        ctx.moveTo(t, -18);
        ctx.lineTo(t + 4, -8);
        ctx.lineTo(t + 8, -18);
        ctx.fill();

        ctx.beginPath();
        ctx.moveTo(t, 18);
        ctx.lineTo(t + 4, 8);
        ctx.lineTo(t + 8, 18);
        ctx.fill();
      }

      // Enraged glowing core eye inside maw
      ctx.fillStyle = '#facc15';
      ctx.shadowColor = '#eab308';
      ctx.shadowBlur = 15;
      ctx.beginPath();
      ctx.arc(4 * this.facing, 0, 8, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();

    // Damage flash on the boss body.
    if (this.hitFlash > 0) {
      ctx.save();
      ctx.globalAlpha = Math.min(0.7, this.hitFlash * 5);
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(sx + this.width / 2, sy + this.height / 2, 30, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    this.renderTelegraph(ctx, camera);
  }

  /**
   * Draw attack wind-up warnings so every boss move is readable before it lands.
   */
  renderTelegraph(ctx, camera) {
    const t = this.telegraph;
    if (!t) return;
    const cx = this.x + this.width / 2 - camera.x;
    const cy = this.y + this.height / 2 - camera.y;
    const pulse = 0.6 + Math.abs(Math.sin(Date.now() * 0.012)) * 0.4;

    ctx.save();
    if (t.type === 'line') {
      const tx = t.x - camera.x;
      const ty = t.y - camera.y;
      const angle = Math.atan2(ty - cy, tx - cx);
      ctx.strokeStyle = `rgba(239, 68, 68, ${pulse})`;
      ctx.lineWidth = 3;
      ctx.setLineDash([10, 8]);
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(cx + Math.cos(angle) * 900, cy + Math.sin(angle) * 900);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = 'rgba(239, 68, 68, 0.30)';
      ctx.beginPath();
      ctx.arc(tx, ty, 26, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#fecaca';
      ctx.lineWidth = 2;
      ctx.stroke();
    } else if (t.type === 'ring') {
      const radius = 46 + Math.sin(Date.now() * 0.02) * 6;
      ctx.strokeStyle = `rgba(34, 197, 94, ${pulse})`;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(cx, cy, radius, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([6, 6]);
      ctx.beginPath();
      ctx.arc(cx, cy, radius + 22, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);
    } else if (t.type === 'ground') {
      const tx = t.x - camera.x;
      const ty = t.y - camera.y;
      ctx.strokeStyle = `rgba(251, 191, 36, ${pulse})`;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.ellipse(tx, ty, 54, 14, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.fillStyle = 'rgba(251, 191, 36, 0.18)';
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(tx, ty - 120);
      ctx.lineTo(tx - 7, ty - 132);
      ctx.lineTo(tx + 7, ty - 132);
      ctx.closePath();
      ctx.fillStyle = 'rgba(251, 191, 36, 0.9)';
      ctx.fill();
    } else if (t.type === 'summon') {
      ctx.fillStyle = 'rgba(34, 197, 94, 0.9)';
      ctx.font = "bold 12px 'Press Start 2P', monospace";
      ctx.textAlign = 'center';
      ctx.fillText('SUMMONING!', cx, cy - 50);
    }
    ctx.restore();
  }
}

// ============================================================
// DUNGEON BOSS — THE CURSED KNIGHT
// A knight statue buried with its chapel; click the pedestal to wake it.
// Phase 1: stalks you around the chamber with telegraphed sword attacks.
// Phase 2 (<50% HP): unbound — faster, death novas, hollow wraith minions.
// ============================================================
class CursedKnightBoss {
  constructor(x, y, game = null) {
    this.kind = 'knight';
    this.x = x;
    this.y = y;
    this.width = 40;
    this.height = 56;
    this.vx = 0;
    this.vy = 0;
    this.facing = -1;
    this.maxHp = 5200;
    this.hp = 5200;
    this.phase = 1;
    this.name = 'THE CURSED KNIGHT';
    this.dead = false;
    this.lightRadius = 220;
    this.game = game;
    this.hitFlash = 0;
    this.onGround = false;
    this.animT = 0;
    this.attackState = 'stalk';  // stalk | tell_dash | dash | tell_slam | slam | tell_blades
    this.stateTimer = 2.2;
    this.telegraph = null;
    this.lastAttack = '';
    this.dashDir = -1;
    this.slamArmed = false;
    this.minionTimer = 9;
    // --- Presentation state ---
    this.aura = 0;            // 0..1 charge-up veil during telegraphed attacks
    this.glowRadius = 96;     // additive bloom radius (world.renderGlow)
    this.lightColor = [168, 150, 255];
    this.emerge = 0;          // 0..1, stone cracks off as he wakes
    this.trail = [];          // ghost after-images left by dashes
    this.impact = null;       // shockwave ring left by a grave slam
    this.bladesUntil = -1;    // how long the giant sword stays raised
    this.wardTimer = 0;       // phase-2 arcane ward covering the body
    this.wardDir = 1;
  }

  /** The giant sword stays overhead through the whole telegraph of an attack. */
  get swordRaised() {
    return this.attackState.indexOf('tell') === 0 || this.animT < this.bladesUntil;
  }

  /** True on the frame an attack commits — used for a lance-flash on the blade. */
  get attacking() {
    return this.attackState === 'dash' || this.attackState === 'slam' ||
      this.attackState === 'detonate' || this.attackState === 'blades';
  }

  /** Dim the additive aura while the world is meant to be pitch black. */
  glowActive() {
    const w = this.game && this.game.world;
    if (!w || !w.isNight) return 1;
    return w.isNight() ? 0.8 : 1;
  }

  /** Bosses cannot be knocked back, but they flash and report damage dealt. */
  takeDamage(amount, soundSystem, particleSystem, isCrit = false) {
    if (this.dead) return 0;
    const dealt = Math.max(1, Math.round(amount));
    this.hp -= dealt;
    this.hitFlash = 0.1;
    if (soundSystem) soundSystem.playHit();
    if (particleSystem) {
      particleSystem.addDamageText(this.x + this.width / 2, this.y, dealt, isCrit ? '#f59e0b' : '#ef4444', isCrit);
      particleSystem.bloodBurst(this.x + this.width / 2, this.y + this.height / 2,
        this.phase === 1 ? '#a5b4fc' : '#c084fc', isCrit ? 18 : 12);
    }

    // Phase transition at 50% — slow motion + roar, like the forest guardian.
    if (this.phase === 1 && this.hp <= this.maxHp * 0.5) {
      this.phase = 2;
      this.name = 'THE CURSED KNIGHT (UNBOUND)';
      this.lightRadius = 300;
      this.glowRadius = 150;
      this.lightColor = [196, 132, 252];
      this.wardTimer = 0;
      this.bladesUntil = this.animT + 0.4;
      if (soundSystem) soundSystem.playBossRoar();
      if (particleSystem) {
        particleSystem.magicSparkle(this.x + this.width / 2, this.y + this.height / 2, '#a855f7', 70);
        particleSystem.magicSparkle(this.x + this.width / 2, this.y + this.height / 2, '#f0abfc', 46);
        particleSystem.bloodBurst(this.x + this.width / 2, this.y + this.height / 2, '#c084fc', 40);
        // Three expanding shells of shattering rune light.
        for (let shell = 0; shell < 3; shell++) {
          const n = 30 + shell * 14;
          const spd = 6.5 - shell * 1.6;
          for (let i = 0; i < n; i++) {
            const ra = (i / n) * Math.PI * 2;
            particleSystem.addParticle(this.x + this.width / 2, this.y + this.height / 2,
              Math.cos(ra) * spd, Math.sin(ra) * spd,
              shell === 2 ? '#ffffff' : (i % 2 ? '#a78bfa' : '#f0abfc'),
              4.5 - shell * 0.8, 0.7 + shell * 0.15, 0.03, shell < 2);
          }
        }
        // Chunks of the old stone shell blown off the armour.
        for (let i = 0; i < 30; i++) {
          particleSystem.addParticle(
            this.x + Math.random() * this.width, this.y + Math.random() * this.height,
            (Math.random() - 0.5) * 7, -3 - Math.random() * 4,
            Math.random() < 0.5 ? '#94a3b8' : '#64748b',
            2 + Math.random() * 3.5, 0.9, 0.24, false
          );
        }
      }
      if (this.game && this.game.feel) {
        this.game.feel.stop(0.2, 0.03);
        this.game.feel.slow(1.6, 0.26);
        this.game.feel.shake(1.2);
        this.game.feel.hurt(0.35);
      }
      if (this.game) this.game.showAnnouncement('💀 THE KNIGHT REMEMBERS ITS DEATH!');
      this.minionTimer = 2.5;
    }

    if (this.hp <= 0) {
      this.dead = true;
      this.bladesUntil = this.animT + 1.0;
      if (soundSystem) soundSystem.playExplosion();
      if (particleSystem) {
        particleSystem.magicSparkle(this.x + this.width / 2, this.y + this.height / 2, '#a5b4fc', 90);
        particleSystem.magicSparkle(this.x + this.width / 2, this.y + this.height / 2, '#e0e7ff', 60);
        particleSystem.bloodBurst(this.x + this.width / 2, this.y + this.height / 2, '#64748b', 60);
        particleSystem.bloodBurst(this.x + this.width / 2, this.y + this.height / 2, '#ffffff', 26);
        // The statue comes apart in stages, from the visor outwards.
        for (let ring = 0; ring < 3; ring++) {
          const n = 26 + ring * 12;
          for (let i = 0; i < n; i++) {
            const ra = (i / n) * Math.PI * 2;
            particleSystem.addParticle(this.x + this.width / 2, this.y + this.height / 2,
              Math.cos(ra) * (3 + ring * 2.4), Math.sin(ra) * (3 + ring * 2.4) - 1.5,
              ring === 0 ? '#ffffff' : (i % 2 ? '#c7d2fe' : '#94a3b8'),
              3.5, 0.8 + ring * 0.2, 0.1, ring === 0);
          }
        }
      }
      if (this.game && this.game.feel) {
        this.game.feel.shake(1.2);
        this.game.feel.stop(0.16, 0.03);
        this.game.feel.slow(1.1, 0.3);
      }
    }
    return dealt;
  }

  /** Choose the next attack, avoiding an immediate repeat of the previous one. */
  pickAttack() {
    const pool = this.phase === 1
      ? ['dash', 'slam', 'blades']
      : ['dash', 'slam', 'blades', 'slam', 'dash'];
    let choice = pool[Math.floor(Math.random() * pool.length)];
    if (choice === this.lastAttack && Math.random() < 0.7) {
      choice = pool[(pool.indexOf(choice) + 1) % pool.length];
    }
    this.lastAttack = choice;
    return choice;
  }
  // KNIGHT_AI

  update(dt, player, projectiles, soundSystem, particleSystem, world = null) {
    if (this.dead) return;
    if (this.hitFlash > 0) this.hitFlash = Math.max(0, this.hitFlash - dt);
    this.animT += dt;
    // Wake-up is a staged reveal: stone cracks off him over the first 1.2s.
    if (this.emerge < 1) {
      this.emerge = Math.min(1, this.emerge + dt / 1.2);
      if (particleSystem && Math.random() < 0.5) {
        particleSystem.addParticle(
          this.x + Math.random() * this.width, this.y + Math.random() * this.height,
          (Math.random() - 0.5) * 1.6, -1.2 - Math.random(),
          Math.random() < 0.5 ? '#94a3b8' : '#cbd5e1',
          2 + Math.random() * 2, 0.5, 0.14, false
        );
      }
    }
    // The aura ramps up during a wind-up and snaps away the moment it fires,
    // which is what makes the telegraph feel like a spring being compressed.
    const charging = this.attackState.indexOf('tell') === 0;
    const auraTarget = charging ? 1 : 0;
    this.aura += (auraTarget - this.aura) * Math.min(1, dt * (charging ? 4.5 : 12));
    // Phase 2 clings to a low ambient aura so the armour always smoulders.
    if (this.aura < 0.14) this.aura = this.phase === 2 ? 0.14 + Math.sin(this.animT * 3) * 0.03 : 0;
    // Ward breathes in and out through phase two.
    this.wardTimer += dt;
    if (this.phase === 2 && this.wardTimer > 3.2) {
      this.wardTimer = 0;
      this.wardDir *= -1;
      if (soundSystem && soundSystem.playHit) soundSystem.playHit();
    }
    if (this.impact) {
      this.impact.t += dt;
      if (this.impact.t >= this.impact.life) this.impact = null;
    }
    for (let i = this.trail.length - 1; i >= 0; i--) {
      this.trail[i].t += dt;
      if (this.trail[i].t >= this.trail[i].life) this.trail.splice(i, 1);
    }
    // The unbound knight draws vitality from the cursed chapel. He regenerates
    // between attacks, but only up to the health shown when phase two began —
    // relentless pressure without becoming mathematically impossible to kill.
    if (this.phase === 2 && this.hp > 0) {
      this.phaseTwoFloor = this.phaseTwoFloor ?? this.hp;
      this.hp = Math.min(this.maxHp, this.hp + dt * 12);
    }
    const cx = this.x + this.width / 2;
    const cy = this.y + this.height / 2;
    const px = player.x + player.width / 2;
    const py = player.y + player.height / 2;
    this.facing = px >= cx ? 1 : -1;
    if (this.telegraph) {
      this.telegraph.timer -= dt;
      if (this.telegraph.timer <= 0) this.telegraph = null;
    }
    this.stateTimer -= dt;
    const boost = this.phase === 2 ? 1.55 : 1;

    switch (this.attackState) {
      case 'stalk': {
        // March relentlessly toward the player.
        this.vx += (this.facing * 1.6 * boost - this.vx) * Math.min(1, dt * 5);
        if (this.stateTimer <= 0 && this.onGround) {
          const choice = this.pickAttack();
          if (choice === 'dash') {
            this.attackState = 'tell_dash';
            this.stateTimer = 0.55;
            this.telegraph = { type: 'line', timer: 0.55, total: 0.55, x: px, y: py };
            if (soundSystem) soundSystem.playBossRoar();
            if (particleSystem) particleSystem.magicSparkle(cx, cy, this.phase === 2 ? '#c084fc' : '#a5b4fc', 14);
          } else if (choice === 'slam') {
            this.attackState = 'tell_slam';
            this.stateTimer = 0.5;
            this.telegraph = { type: 'ground', timer: 0.5, total: 0.5, x: px, y: this.y + this.height };
            if (soundSystem) soundSystem.playBossRoar();
          } else {
            this.attackState = 'tell_blades';
            this.stateTimer = 0.6;
            // Record the fan's aim so the aim-lines and the blades agree.
            const aimAngle = Math.atan2(py - cy, px - cx);
            this.telegraph = {
              type: 'ring', timer: 0.6, total: 0.6,
              aimAngle, aimCount: this.phase === 2 ? 8 : 5, aimSpread: 0.55
            };
            if (soundSystem) soundSystem.playBossLaser();
          }
        }
        break;
      }
      case 'tell_dash': {
        this.vx *= 0.72;
        // Coil back a step so the charge visibly loads.
        this.vx -= this.facing * 1.1 * dt * 10;
        if (this.stateTimer <= 0) {
          this.attackState = 'dash';
          this.stateTimer = 0.5;
          this.dashDir = this.facing;
          this.telegraph = null;
          this.trail = [];
          if (soundSystem) soundSystem.playSwing();
          // Slamming into the charge throws a shockwave off his own boots.
          if (particleSystem) {
            for (let i = 0; i < 18; i++) {
              const a = (i / 18) * Math.PI * 2;
              particleSystem.addParticle(
                cx, this.y + this.height - 2,
                Math.cos(a) * 4.4 - this.dashDir * 2.4, Math.sin(a) * 1.6 - 1.2,
                i % 2 ? '#e0e7ff' : (this.phase === 2 ? '#c084fc' : '#818cf8'),
                3.2, 0.4, 0.12, true
              );
            }
          }
        }
        break;
      }
      case 'dash': {
        this.vx = this.dashDir * (this.phase === 2 ? 13.5 : 11.5);
        // Lay down ghost after-images and a tearing wake of sparks.
        this.trail.push({ x: this.x, y: this.y, facing: this.facing, t: 0, life: 0.34 });
        if (this.trail.length > 7) this.trail.shift();
        if (particleSystem) {
          for (let i = 0; i < 2; i++) {
            particleSystem.addParticle(
              cx + (Math.random() - 0.5) * 10, this.y + 6 + Math.random() * (this.height - 10),
              -this.dashDir * (2.6 + Math.random() * 2.4), (Math.random() - 0.5) * 1.4,
              i ? (this.phase === 2 ? '#c084fc' : '#a5b4fc') : '#ffffff',
              2 + Math.random() * 2.5, 0.3, 0.03, i === 1
            );
          }
          if (Math.random() < 0.6) {
            particleSystem.addParticle(cx, this.y + this.height - 3,
              -this.dashDir * 2.2, -0.6, 'rgba(165,180,252,0.55)', 3, 0.32, 0.05);
          }
        }
        if (this.stateTimer <= 0) this.endAttack(1.9);
        break;
      }
      case 'tell_slam': {
        this.vx *= 0.8;
        if (this.stateTimer <= 0) {
          this.attackState = 'slam';
          this.stateTimer = 2.0; // safety timeout
          this.vy = -9.5;
          this.vx = this.facing * 4.2;
          this.slamArmed = true;
          this.telegraph = null;
          if (particleSystem) {
            for (let i = 0; i < 16; i++) {
              const a = (i / 16) * Math.PI * 2;
              particleSystem.addParticle(
                cx, this.y + this.height, Math.cos(a) * 3.4, Math.sin(a) * 1.2,
                'rgba(203,213,225,0.85)', 3, 0.4, 0.16, false
              );
            }
          }
        }
        break;
      }
      case 'slam': {
        if (this.slamArmed && this.onGround) {
          this.slamArmed = false;
          this.bladesUntil = this.animT + 0.34;
          this.detonate(soundSystem, particleSystem, projectiles);
          this.endAttack(2.1);
        } else if (this.stateTimer <= 0) {
          this.slamArmed = false;
          this.endAttack(1.4);
        }
        break;
      }
      case 'tell_blades': {
        this.vx *= 0.75;
        // Keep the fan locked onto the player as it charges.
        if (this.telegraph) {
          this.telegraph.aimAngle = Math.atan2(py - cy, px - cx);
        }
        if (this.stateTimer <= 0) {
          this.telegraph = null;
          const count = this.phase === 2 ? 8 : 5;
          const base = Math.atan2(py - cy, px - cx);
          const spread = 0.55;
          this.attackState = 'blades';
          this.bladesUntil = this.animT + 0.26;
          for (let i = 0; i < count; i++) {
            const a = count === 1 ? base : base - spread + (i / (count - 1)) * spread * 2;
            const spd = 7.2;
            const bl = new Projectile(
              cx, cy,
              Math.cos(a) * spd, Math.sin(a) * spd,
              'knight_blade', this.phase === 2 ? 26 : 20, true, 3.6, 70
            );
            // Fans of clones so the volley reads as a wall of swords.
            bl.bladePhase = Math.random() * Math.PI * 2;
            bl.bladeBig = this.phase === 2;
            projectiles.push(bl);

            // Muzzle flare at the tip of each launched blade.
            if (particleSystem) {
              particleSystem.addParticle(
                cx + Math.cos(a) * 14, cy + Math.sin(a) * 14,
                Math.cos(a) * 3.4, Math.sin(a) * 3.4,
                '#ffffff', 3.5, 0.22, 0.02, true
              );
              particleSystem.addParticle(
                cx + Math.cos(a) * 20, cy + Math.sin(a) * 20,
                Math.cos(a) * 1.6, Math.sin(a) * 1.6,
                this.phase === 2 ? '#f0abfc' : '#c7d2fe', 4.5, 0.3, 0.02, true
              );
            }
          }
          if (soundSystem) soundSystem.playBow();
          if (this.game && this.game.feel) this.game.feel.shake(0.32);
          this.endAttack(2.0);
        }
        break;
      }
    }

    // Phase 2: the knight calls hollow wraiths to harry you.
    if (this.phase === 2 && this.game && Array.isArray(this.game.monsters)) {
      this.minionTimer -= dt;
      if (this.minionTimer <= 0) {
        this.minionTimer = 11;
        if (this.game.monsters.length < 3) {
          this.game.monsters.push(new Monster(cx, this.y + this.height - 40, 'wraith'));
          if (particleSystem) {
            // A grave-tear opens before each wraith claws its way out.
            particleSystem.magicSparkle(cx, this.y + 20, '#67e8f9', 26);
            for (let i = 0; i < 22; i++) {
              const a = (i / 22) * Math.PI * 2;
              particleSystem.addParticle(
                cx, this.y + this.height - 40,
                Math.cos(a) * 4.2, Math.sin(a) * 4.2 - 1,
                i % 2 ? '#67e8f9' : '#a855f7', 3.4, 0.6, 0.05, true
              );
            }
          }
          if (this.game.feel) {
            this.game.feel.shake(0.4);
            this.game.feel.slow(0.3, 0.45);
          }
          if (this.game.showToast) this.game.showToast('👻 The knight calls its hollow guard!');
        }
      }
    }

    // Gravity + chamber collisions.
    if (!world) { this.x += this.vx; this.y += this.vy; return; }
    this.vy += 0.35;
    if (this.vy > 12) this.vy = 12;
    this.onGround = false;
    this.resolveCollisions(world);
  }
  // KNIGHT_PHYSICS

  /** Tile collision for the 40x56 knight (walks the chapel floor, bonks walls). */
  resolveCollisions(world) {
    let newX = this.x + this.vx;
    const startTileY = Math.floor(this.y / TILE_SIZE);
    const endTileY = Math.floor((this.y + this.height - 1) / TILE_SIZE);
    if (this.vx > 0) {
      const rightTile = Math.floor((newX + this.width) / TILE_SIZE);
      for (let ty = startTileY; ty <= endTileY; ty++) {
        if (world.isSolid(rightTile, ty)) {
          newX = rightTile * TILE_SIZE - this.width - 0.01;
          this.vx = 0;
          break;
        }
      }
    } else if (this.vx < 0) {
      const leftTile = Math.floor(newX / TILE_SIZE);
      for (let ty = startTileY; ty <= endTileY; ty++) {
        if (world.isSolid(leftTile, ty)) {
          newX = (leftTile + 1) * TILE_SIZE + 0.01;
          this.vx = 0;
          break;
        }
      }
    }
    this.x = newX;

    let newY = this.y + this.vy;
    const startTileX = Math.floor((this.x + 1) / TILE_SIZE);
    const endTileX = Math.floor((this.x + this.width - 1) / TILE_SIZE);
    if (this.vy > 0) {
      const bottomTile = Math.floor((newY + this.height) / TILE_SIZE);
      for (let tx = startTileX; tx <= endTileX; tx++) {
        if (world.isSolid(tx, bottomTile)) {
          newY = bottomTile * TILE_SIZE - this.height;
          this.vy = 0;
          this.onGround = true;
          break;
        }
      }
    } else if (this.vy < 0) {
      const topTile = Math.floor(newY / TILE_SIZE);
      for (let tx = startTileX; tx <= endTileX; tx++) {
        if (world.isSolid(tx, topTile)) {
          newY = (topTile + 1) * TILE_SIZE;
          this.vy = 0;
          break;
        }
      }
    }
    this.y = newY;
  }

  /**
   * Grave Shockwave: landing hurts anyone nearby; phase 2 adds a blade nova.
   * Tuned for spectacle — a seam of light in the floor, a triple dust ring,
   * slow motion and a shockwave that visibly propagates outwards.
   */
  detonate(soundSystem, particleSystem, projectiles) {
    const cx = this.x + this.width / 2;
    const groundY = this.y + this.height;
    if (soundSystem) soundSystem.playExplosion();
    if (this.game && this.game.feel) {
      this.game.feel.shake(this.phase === 2 ? 1.1 : 0.85);
      this.game.feel.stop(0.09, 1.0);
      this.game.feel.slow(0.26, 0.3);
    }
    this.impact = { x: cx, y: groundY, t: 0, life: this.phase === 2 ? 0.85 : 0.62, maxR: 150 };
    this.aura = 0;
    if (particleSystem) {
      const hot = this.phase === 2;
      particleSystem.bloodBurst(cx, groundY, hot ? '#c084fc' : '#a5b4fc', 46);
      particleSystem.bloodBurst(cx, groundY, hot ? '#f472b6' : '#38bdf8', 22);
      particleSystem.bloodBurst(cx, groundY, '#e2e8f0', 18);

      // Three flattened dust rings of different speeds — Terraria shockwave.
      for (let ring = 0; ring < 3; ring++) {
        const n = 20 + ring * 8;
        const spd = 6.4 - ring * 1.5;
        for (let i = 0; i < n; i++) {
          const a = (i / n) * Math.PI * 2;
          particleSystem.addParticle(
            cx + Math.cos(a) * (ring * 7), groundY - 2,
            Math.cos(a) * spd, Math.sin(a) * spd * 0.42 - (1.2 - ring * 0.4),
            ring === 2 ? 'rgba(203,213,225,0.8)' : (i % 2 ? '#a5b4fc' : '#e0e7ff'),
            3.6 - ring * 0.5, 0.55 + ring * 0.1, 0.16, ring < 2
          );
        }
      }
      // Rising grave-dust and a bright heart of light at the impact point.
      for (let i = 0; i < 14; i++) {
        particleSystem.addParticle(
          cx + (Math.random() - 0.5) * 52, groundY - Math.random() * 6,
          (Math.random() - 0.5) * 2.4, -4 - Math.random() * 4,
          '#c084fc', 3 + Math.random() * 2, 0.7, 0.16, true
        );
      }
      for (let i = 0; i < 9; i++) {
        particleSystem.addParticle(
          cx + (Math.random() - 0.5) * 18, groundY - 4 - Math.random() * 12,
          (Math.random() - 0.5) * 1.5, -2 - Math.random() * 2,
          '#ffffff', 4.5, 0.26, 0.02, true
        );
      }
    }
    if (this.game && this.game.player) {
      const p = this.game.player;
      const dist = Math.hypot(p.x + p.width / 2 - cx, p.y + p.height - groundY);
      if (dist < 130) {
        this.game.damagePlayer(this.phase === 2 ? 38 : 30, cx,
          'The Cursed Knight shattered the ground beneath you.');
      }
    }
    // Phase 2: the impact also throws a ring of phantom blades.
    if (this.phase === 2 && projectiles) {
      const count = 12;
      for (let i = 0; i < count; i++) {
        const a = (i / count) * Math.PI * 2 - Math.PI / 2;
        projectiles.push(new Projectile(
          cx, groundY - 8,
          Math.cos(a) * 5.6, Math.sin(a) * 5.6 - 1,
          'knight_blade', 24, true, 3.2, 70
        ));
      }
    }
  }

  /** Horizontal gauge showing how long the grave-marks left by a slam stay lit. */
  renderImpact(ctx, camera) {
    const im = this.impact;
    if (!im) return;
    const k = im.t / im.life;
    if (k >= 1) return;
    const sx = im.x - camera.x;
    const sy = im.y - camera.y;
    const fade = 1 - k;
    const r = im.maxR * (0.35 + k * 0.75);

    ctx.save();
    // Expanding dust disc, flattened so it reads as a ground shockwave.
    ctx.globalAlpha = 0.5 * fade;
    ctx.strokeStyle = this.phase === 2 ? '#c084fc' : '#a5b4fc';
    ctx.lineWidth = 4 * fade + 1;
    ctx.beginPath();
    ctx.ellipse(sx, sy, r, r * 0.24, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.globalAlpha = 0.22 * fade;
    ctx.fillStyle = this.phase === 2 ? '#7e22ce' : '#4338ca';
    ctx.fill();

    // Cracks left glowing in the floor itself.
    ctx.globalAlpha = 0.85 * fade;
    ctx.strokeStyle = this.phase === 2 ? '#f0abfc' : '#c7d2fe';
    ctx.lineWidth = 2;
    for (let i = 0; i < 7; i++) {
      const a = (i / 7) * Math.PI * 2 + 0.4;
      const len = r * (0.7 + (i % 3) * 0.16);
      const midX = sx + Math.cos(a) * len * 0.5;
      const midY = sy + Math.sin(a) * len * 0.22 - 3;
      ctx.beginPath();
      ctx.moveTo(sx + Math.cos(a) * 12, sy + Math.sin(a) * 4);
      ctx.lineTo(midX, midY);
      ctx.lineTo(sx + Math.cos(a) * len, sy + Math.sin(a) * len * 0.1);
      ctx.stroke();
    }
    ctx.restore();
  }

  endAttack(cooldown) {
    this.attackState = 'stalk';
    this.stateTimer = cooldown;
    this.telegraph = null;
    this.vx *= 0.25;
  }
  // KNIGHT_RENDER

  render(ctx, camera) {
    const sx = Math.round(this.x - camera.x);
    const sy = Math.round(this.y - camera.y);
    if (sx < -120 || sy < -120 || sx > camera.viewportWidth + 120 || sy > camera.viewportHeight + 120) return;

    const p2 = this.phase === 2;
    const t = this.animT;
    // Stone-grey right after summon, warms into living armour over ~1.2s.
    const stoneK = Math.max(0, 1 - t / 1.2);
    const mix = (r, g, b) => `rgb(${Math.round(100 + (r - 100) * (1 - stoneK))},${Math.round(116 + (g - 116) * (1 - stoneK))},${Math.round(139 + (b - 139) * (1 - stoneK))})`;

    // ---- Ground effects are drawn before the body so it stands on top ----
    this.renderRuneCircle(ctx, sx, sy, p2, t);
    this.renderImpact(ctx, camera);

    // ---- Ghost after-images left by a dash (Terraria's motion smear) ----
    for (const gh of this.trail) {
      const k = gh.t / gh.life;
      if (k >= 1) continue;
      const a = (1 - k) * 0.4;
      const gx = Math.round(gh.x - camera.x);
      const gy = Math.round(gh.y - camera.y);
      if (gx < -120 || gx > camera.viewportWidth + 120) continue;
      ctx.save();
      ctx.globalAlpha = a;
      ctx.fillStyle = p2 ? '#c084fc' : '#a5b4fc';
      // Torn cape silhouette of the ghost.
      ctx.beginPath();
      ctx.moveTo(gx + 9 * gh.facing, gy + 10);
      ctx.lineTo(gx + 2 * gh.facing, gy + 22);
      ctx.lineTo(gx + 6 * gh.facing, gy + this.height - 4);
      ctx.lineTo(gx + gh.facing * this.width, gy + this.height - 5);
      ctx.lineTo(gx + gh.facing * this.width * 0.65, gy + 12);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = p2 ? '#e9d5ff' : '#e0e7ff';
      ctx.fillRect(gx + 9, gy + 2, 22, 16);   // helm
      ctx.fillRect(gx + 7, gy + 18, 26, 26);  // torso
      ctx.fillRect(gx + 8, gy + 44, 9, 12);   // legs
      ctx.fillRect(gx + 22, gy + 44, 9, 12);
      ctx.restore();
    }

    // ---- Charge veil: runes climb the knight while he winds an attack up ----
    if (this.aura > 0.01) this.renderAura(ctx, sx, sy, p2, t);

    ctx.save();
    ctx.translate(sx, sy);
    if (this.facing === -1) {
      ctx.translate(this.width, 0);
      ctx.scale(-1, 1);
    }

    // Per-frame animation values shared by the body parts below.
    const step = this.onGround ? Math.sin(t * (this.attackState === 'stalk' ? 7 : 4)) : 0;
    const dashK = this.attackState === 'dash' ? 1 : 0;
    const p2pulse = 0.6 + Math.abs(Math.sin(t * (p2 ? 8 : 3))) * 0.4;

    // ============ TATTERED CAPE (under everything, torn hem) ============
    const sway = Math.sin(t * 4) * 2 + dashK * 7;
    ctx.fillStyle = p2 ? mix(127, 29, 29) : mix(76, 29, 149);
    ctx.beginPath();
    ctx.moveTo(9, 10);
    ctx.lineTo(2, 16 + sway * 0.3);
    ctx.lineTo(6, this.height - 4);
    ctx.lineTo(15, this.height - 7 - sway * 0.4);
    ctx.lineTo(13, 12);
    ctx.closePath();
    ctx.fill();
    // Torn hem — three ragged points so the cape reads as ancient cloth.
    ctx.beginPath();
    ctx.moveTo(2, 40 + sway * 0.4);
    ctx.lineTo(-1, 52);
    ctx.lineTo(5, 44);
    ctx.lineTo(3, 56);
    ctx.lineTo(9, 46);
    ctx.closePath();
    ctx.fill();
    // Embroidered rune line down the cape.
    ctx.fillStyle = p2 ? 'rgba(240,171,252,0.75)' : 'rgba(165,180,252,0.7)';
    ctx.fillRect(9, 20, 1.5, 15);
    ctx.fillRect(7, 28, 5, 1.5);

    // ============ LEGS & SABATONS ============
    const legA = step * 2;
    ctx.fillStyle = mix(100, 116, 139);
    ctx.fillRect(8, 44, 9, 12 + legA);
    ctx.fillRect(22, 44, 9, 12 - legA);
    ctx.fillStyle = mix(71, 85, 105);
    ctx.fillRect(7, 52 + legA, 11, 4);
    ctx.fillRect(21, 52 - legA, 11, 4);
    // Steel toecaps.
    ctx.fillStyle = mix(203, 213, 225);
    ctx.fillRect(7, 55 + legA, 11, 2);
    ctx.fillRect(21, 55 - legA, 11, 2);

    // ============ TORSO PLATE ============
    ctx.fillStyle = mix(148, 163, 184);
    ctx.fillRect(7, 18, 26, 26);
    // Vertical plate seams — the single biggest readability win on armour.
    ctx.fillStyle = mix(100, 116, 139);
    ctx.fillRect(7, 30, 26, 3);
    ctx.fillRect(19, 18, 2, 26);
    ctx.fillRect(7, 30, 2, 3);
    // Highlight ridge along the top of the chest.
    ctx.fillStyle = mix(226, 232, 240);
    ctx.fillRect(7, 18, 26, 2);

    // ============ PAULDRONS (layered, with spikes) ============
    ctx.fillStyle = mix(203, 213, 225);
    ctx.fillRect(4, 16, 10, 9);
    ctx.fillRect(26, 16, 10, 9);
    ctx.fillStyle = mix(148, 163, 184);
    ctx.fillRect(4, 23, 10, 2);
    ctx.fillRect(26, 23, 10, 2);
    // Spikes jutting outwards — clear silhouette in a dark chapel.
    ctx.fillStyle = mix(226, 232, 240);
    ctx.beginPath(); ctx.moveTo(4, 16); ctx.lineTo(0, 10); ctx.lineTo(6, 16); ctx.closePath(); ctx.fill();
    ctx.beginPath(); ctx.moveTo(36, 16); ctx.lineTo(40, 10); ctx.lineTo(34, 16); ctx.closePath(); ctx.fill();

    // ============ CHEST SIGIL (breathes, brighter in phase 2) ============
    ctx.save();
    ctx.shadowColor = p2 ? '#c084fc' : '#818cf8';
    ctx.shadowBlur = 8 * p2pulse;
    ctx.fillStyle = p2 ? '#f0abfc' : '#c7d2fe';
    ctx.fillRect(18, 22, 4, 4);
    ctx.fillStyle = p2 ? '#a855f7' : '#818cf8';
    ctx.fillRect(19, 23, 2, 2);
    ctx.restore();

    // ============ BLOOD-RED SASH ACROSS THE CHEST ============
    ctx.fillStyle = p2 ? '#7f1d1d' : '#4c1d95';
    ctx.beginPath();
    ctx.moveTo(7, 27);
    ctx.lineTo(33, 22);
    ctx.lineTo(33, 25);
    ctx.lineTo(7, 30);
    ctx.closePath();
    ctx.fill();

    // ============ GREAT HELM (closed visor, horns, crest) ============
    // Halo behind the head, like the Eater of Worlds' glow.
    ctx.save();
    ctx.globalAlpha = 0.5;
    ctx.fillStyle = p2 ? 'rgba(168,85,247,0.4)' : 'rgba(99,102,241,0.32)';
    ctx.beginPath();
    ctx.arc(20, 10, 19 + p2pulse * 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    ctx.fillStyle = mix(203, 213, 225);
    ctx.fillRect(9, 2, 22, 16);
    ctx.fillStyle = mix(100, 116, 139);
    ctx.fillRect(9, 2, 22, 4);
    // Cheek plates giving the helm a face.
    ctx.fillStyle = mix(148, 163, 184);
    ctx.fillRect(9, 9, 3, 9);
    ctx.fillRect(28, 9, 3, 9);

    // Visor with a hot, pulsing slit of light behind it.
    const pulse = 0.6 + Math.abs(Math.sin(t * (p2 ? 8 : 3))) * 0.4;
    ctx.save();
    ctx.shadowColor = p2 ? '#c084fc' : '#ef4444';
    ctx.shadowBlur = 12 * pulse;
    ctx.fillStyle = p2 ? '#d8b4fe' : '#fca5a5';
    ctx.fillRect(13, 9, 14, 3);
    // Two bright pupils inside the slit — makes it glare instead of glow flat.
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(19 + this.facing * 2, 9, 3, 3);
    ctx.fillRect(24 + this.facing * 2, 9, 2, 3);
    ctx.restore();

    // Horns sweeping back from the temples.
    ctx.fillStyle = mix(226, 232, 240);
    ctx.beginPath(); ctx.moveTo(9, 4); ctx.lineTo(1, -2); ctx.lineTo(10, 0); ctx.closePath(); ctx.fill();
    ctx.beginPath(); ctx.moveTo(31, 4); ctx.lineTo(39, -2); ctx.lineTo(30, 0); ctx.closePath(); ctx.fill();
    // Crest plume, taller and redder once unbound.
    ctx.fillStyle = p2 ? '#b91c1c' : '#7c3aed';
    ctx.fillRect(16, -3, 5, 5);
    ctx.fillRect(15, -6, 7, 3);
    ctx.fillStyle = p2 ? '#ef4444' : '#a78bfa';
    ctx.fillRect(17, -8, 3, 3);

    // ============ GIANT GREATSWORD ============
    this.renderGiantSword(ctx, p2, t, pulse);

    ctx.restore();

    // ---- Ward + hit flash sit above the body ----
    if (this.wardTimer > 0) this.renderWard(ctx, sx, sy, p2, t);

    // White hit flash so every strike reads instantly.
    if (this.hitFlash > 0) {
      ctx.save();
      ctx.globalAlpha = Math.min(0.7, this.hitFlash * 5);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(sx + 4, sy, this.width - 8, this.height);
      ctx.restore();
    }

    // ---- Overlay effects ----
    this.renderBladeAura(ctx, camera, p2, t);
    this.renderTelegraph(ctx, camera);
  }

  /** Pulsing arcane rune circle under the knight — rotating, ringed, sigil-rune. */
  renderRuneCircle(ctx, sx, sy, p2, t) {
    const cx = sx + this.width / 2;
    const cy = sy + this.height - 2;
    const col = p2 ? '#c084fc' : '#818cf8';
    // Wider and angrier in phase 2.
    const scale = p2 ? 1.18 : 1;
    const spin = p2 ? t * 0.5 : t * 0.28;

    ctx.save();
    ctx.translate(cx, cy);
    ctx.scale(scale, scale);
    ctx.globalAlpha = 0.3 + Math.sin(t * 3) * 0.18;
    ctx.strokeStyle = col;
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.ellipse(0, 0, 27, 7, 0, 0, Math.PI * 2); ctx.stroke();
    ctx.globalAlpha *= 0.7;
    ctx.beginPath(); ctx.ellipse(0, 0, 18, 5, 0, 0, Math.PI * 2); ctx.stroke();

    // Rotating outer rune band with tick marks and orbiting sparks.
    ctx.globalAlpha = 0.55 + Math.sin(t * 2.4) * 0.2;
    ctx.beginPath(); ctx.ellipse(0, 0, 34, 9, 0, 0, Math.PI * 2); ctx.stroke();
    ctx.save();
    ctx.rotate(spin * 0.4);
    ctx.strokeStyle = p2 ? '#f0abfc' : '#c7d2fe';
    ctx.lineWidth = 1.5;
    for (let i = 0; i < 12; i++) {
      const a = (i / 12) * Math.PI * 2;
      const rx = Math.cos(a) * 34;
      const ry = Math.sin(a) * 9;
      ctx.beginPath();
      ctx.moveTo(rx, ry);
      ctx.lineTo(Math.cos(a) * 30, Math.sin(a) * 7.6);
      ctx.stroke();
    }
    ctx.restore();

    // Four rune sigils placed on the band's diagonals.
    ctx.fillStyle = p2 ? '#e9d5ff' : '#e0e7ff';
    for (let i = 0; i < 4; i++) {
      const a = spin + (i / 4) * Math.PI * 2;
      const rx = Math.cos(a) * 30;
      const ry = Math.sin(a) * 8;
      ctx.fillRect(rx - 1.5, ry - 1.5, 3, 3);
    }

    // Slow-turning inner summoning star.
    ctx.save();
    ctx.globalAlpha = 0.4 + Math.sin(t * 4) * 0.15;
    ctx.strokeStyle = p2 ? '#f472b6' : '#60a5fa';
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let i = 0; i <= 5; i++) {
      const a = -spin * 0.8 + (i / 5) * Math.PI * 2 - Math.PI / 2;
      const rx = Math.cos(a) * 22 * (i % 2 === 0 ? 1 : 0.45);
      const ry = Math.sin(a) * 6 * (i % 2 === 0 ? 1 : 0.45);
      if (i === 0) ctx.moveTo(rx, ry); else ctx.lineTo(rx, ry);
    }
    ctx.closePath();
    ctx.stroke();
    ctx.restore();

    // Two ribbon streams of light feeding the circle.
    ctx.globalAlpha = 0.35 + Math.sin(t * 5) * 0.15;
    ctx.lineWidth = 1.4;
    for (let s = 0; s < 2; s++) {
      ctx.strokeStyle = s ? (p2 ? '#f0abfc' : '#c7d2fe') : col;
      ctx.beginPath();
      for (let i = 0; i <= 16; i++) {
        const a = spin * (s ? -1.4 : 1.4) + (i / 16) * Math.PI * 2;
        const rr = 20 + Math.sin(a * 3 + t * 2) * 3 + i * 0.5;
        const rx = Math.cos(a) * rr;
        const ry = Math.sin(a) * rr * 0.26;
        if (i === 0) ctx.moveTo(rx, ry); else ctx.lineTo(rx, ry);
      }
      ctx.stroke();
    }
    ctx.restore();
  }

  /** Rune glyphs and sparks rising off the armour while an attack charges. */
  renderAura(ctx, sx, sy, p2, t) {
    const cx = sx + this.width / 2;
    const cy = sy + this.height / 2;
    const k = this.aura;
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    // Soft veil of colour over the whole body.
    ctx.globalAlpha = 0.22 * k + Math.sin(t * 9) * 0.05 * k;
    ctx.fillStyle = p2 ? '#a855f7' : '#6366f1';
    ctx.beginPath();
    ctx.ellipse(cx, cy, this.width * 0.72, this.height * 0.62, 0, 0, Math.PI * 2);
    ctx.fill();

    // Glyphs orbiting on rising helical paths.
    for (let i = 0; i < 6; i++) {
      const ph = (t * 1.5 + i / 6) % 1;
      const a = t * 3 + i * 1.05;
      const gx = cx + Math.cos(a) * (16 + i * 1.6);
      const gy = sy + this.height - ph * (this.height + 22);
      ctx.globalAlpha = k * (1 - ph) * 0.9;
      ctx.fillStyle = p2 ? '#f0abfc' : '#c7d2fe';
      ctx.fillRect(gx - 2, gy - 2, 4, 4);
      ctx.fillStyle = p2 ? '#a855f7' : '#818cf8';
      ctx.fillRect(gx - 4, gy - 1, 8, 1.5);
      ctx.fillRect(gx - 1, gy - 4, 1.5, 8);
    }

    // Pulsing charge ring hugging the knight, closing in as it peaks.
    ctx.globalAlpha = 0.5 * k;
    ctx.strokeStyle = p2 ? '#e9d5ff' : '#e0e7ff';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(cx, cy, (28 + (1 - k) * 16) * (1 + Math.sin(t * 22) * 0.05), 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }

  /** Phase-2 arcane ward: two counter-rotating plates of rune light. */
  renderWard(ctx, sx, sy, p2, t) {
    const cx = sx + this.width / 2;
    const cy = sy + this.height / 2;
    const k = Math.min(1, this.wardTimer / 0.5) > 0 ? 1 : 0;
    if (!k) return;
    ctx.save();
    ctx.translate(cx, cy);
    ctx.globalCompositeOperation = 'lighter';
    ctx.globalAlpha = 0.34;
    ctx.strokeStyle = p2 ? '#c084fc' : '#818cf8';
    ctx.lineWidth = 1.5;
    for (let s = 0; s < 2; s++) {
      ctx.save();
      ctx.rotate(t * (s ? -1.6 : 1.6) * this.wardDir + s * Math.PI);
      ctx.beginPath();
      // Hexagonal plate that reads as a shield bubble. (settled every 6 steps)
      for (let i = 0; i <= 6; i++) {
        const a = (i / 6) * Math.PI * 2;
        const rx = Math.cos(a) * 34;
        const ry = Math.sin(a) * 40;
        if (i === 0) ctx.moveTo(rx, ry);
        else ctx.lineTo(rx, ry);
      }
      ctx.stroke();
      ctx.restore();
    }
    ctx.restore();
  }

  /** The greatsword: crossguard, fuller, pommel gem, traced sigils, motion blur. */
  renderGiantSword(ctx, p2, t, pulse) {
    const tell = this.swordRaised;
    const impact = this.attacking;
    const dashK = this.attackState === 'dash' ? 1 : 0;

    ctx.save();
    ctx.translate(31, 22);
    // Wind-up swings the blade right back; otherwise it rests at the shoulder.
    const base = tell ? -1.15 : 0.45 + Math.sin(t * 2) * 0.05;
    // Dash drags it behind; slamming snaps it down overhead.
    const swing = impact ? (this.attackState === 'slam' ? 1.5 : 0.5) : 0;
    ctx.rotate(base + swing - dashK * 0.25);

    const glowCol = p2 ? '#c084fc' : '#818cf8';
    ctx.shadowColor = glowCol;
    ctx.shadowBlur = 10 * pulse + this.aura * 22;

    // Traced rune glyphs along the blade while charging.
    if (this.aura > 0.05) {
      ctx.save();
      ctx.globalAlpha = this.aura * (0.6 + Math.sin(t * 22) * 0.3);
      ctx.fillStyle = p2 ? '#f0abfc' : '#c7d2fe';
      for (let i = 0; i < 4; i++) ctx.fillRect(-1, -30 + i * 7, 3, 1.5);
      ctx.restore();
    }

    // Motion smear while the blade is actually flying.
    if (impact || dashK) {
      ctx.save();
      ctx.globalAlpha = 0.28;
      ctx.fillStyle = glowCol;
      ctx.beginPath();
      ctx.moveTo(-1, -38); ctx.lineTo(4, -38);
      ctx.lineTo(11, 0); ctx.lineTo(-1, 0);
      ctx.closePath(); ctx.fill();
      ctx.restore();
    }

    // Blade body — dark steel core, bright edge catch, white heart.
    ctx.fillStyle = '#94a3b8';
    ctx.fillRect(-3, -36, 7, 36);
    ctx.fillStyle = '#cbd5e1';
    ctx.fillRect(-2, -34, 5, 34);
    ctx.fillStyle = '#eef2ff';
    ctx.fillRect(-2, -34, 2, 34);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(-1, -33, 1, 32);
    // Fuller groove down the centre.
    ctx.fillStyle = 'rgba(100,116,139,0.65)';
    ctx.fillRect(0, -31, 1, 29);
    // Edge nicks — battle-worn steel.
    ctx.fillStyle = '#64748b';
    ctx.fillRect(-3, -26, 1.5, 2);
    ctx.fillRect(4, -18, 1.5, 2);
    ctx.fillRect(-3, -12, 1.5, 1.5);
    // Angled point.
    ctx.fillStyle = '#eef2ff';
    ctx.beginPath();
    ctx.moveTo(-2, -36); ctx.lineTo(0.5, -42); ctx.lineTo(3, -36);
    ctx.closePath(); ctx.fill();

    // Crossguard with downward-swept quillons.
    ctx.fillStyle = p2 ? '#a855f7' : '#818cf8';
    ctx.fillRect(-9, -3, 19, 4);
    ctx.fillStyle = p2 ? '#f0abfc' : '#c7d2fe';
    ctx.fillRect(-9, -3, 19, 1.5);
    ctx.beginPath(); ctx.moveTo(-9, -1); ctx.lineTo(-13, 3); ctx.lineTo(-9, 3); ctx.closePath(); ctx.fill();
    ctx.beginPath(); ctx.moveTo(10, -1); ctx.lineTo(14, 3); ctx.lineTo(10, 3); ctx.closePath(); ctx.fill();

    // Hilt, grip rings, pommel gem.
    ctx.fillStyle = '#78350f';
    ctx.fillRect(-2, 2, 5, 8);
    ctx.fillStyle = '#57534e';
    ctx.fillRect(-2, 4, 5, 1);
    ctx.fillRect(-2, 7, 5, 1);
    ctx.fillStyle = p2 ? '#c084fc' : '#a5b4fc';
    ctx.fillRect(-3, 10, 7, 3);
    ctx.shadowBlur = 14 * pulse;
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(-1, 11, 3, 1);

    ctx.restore();
  }

  /** Phantom blades get an additive spectral halo and a ragged arc of sparks. */
  renderBladeAura(ctx, camera, p2, t) {
    const volley = this.animT - this.bladesUntil < 0.32 && this.bladesUntil > 0;
    const baseA = (p2 ? 0.42 : 0.3) + (volley ? 0.25 : 0);
    const cx = this.x + this.width / 2 - camera.x;
    const cy = this.y + this.height / 2 - camera.y;

    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    ctx.globalAlpha = baseA + Math.sin(t * 6) * 0.05;
    ctx.fillStyle = p2 ? 'rgba(168,85,247,0.5)' : 'rgba(99,102,241,0.42)';
    ctx.beginPath();
    ctx.arc(cx, cy, 34 * (p2 ? 1.12 : 1), 0, Math.PI * 2);
    ctx.fill();

    // Fan of ghost blades swept across the front of the knight.
    for (let i = 0; i < 5; i++) {
      const a = this.facing * (-0.7 + i * 0.35) + Math.sin(t * 2 + i) * 0.06;
      const r0 = 40 + i * 5;
      const bx = cx + Math.cos(a) * r0;
      const by = cy + Math.sin(a) * r0 * 0.6;
      ctx.save();
      ctx.translate(bx, by);
      ctx.rotate(a + Math.PI / 2);
      ctx.globalAlpha = baseA * (0.5 + Math.sin(t * 7 + i) * 0.3);
      ctx.fillStyle = p2 ? '#f0abfc' : '#e0e7ff';
      ctx.fillRect(-1, -9, 2, 18);
      ctx.restore();
    }
    ctx.restore();
    void camera;
  }

  /** Attack wind-up warnings: charge line, slam landing zone, blade ring. */
  renderTelegraph(ctx, camera) {
    const t = this.telegraph;
    if (!t) return;
    const cx = this.x + this.width / 2 - camera.x;
    const cy = this.y + this.height / 2 - camera.y;
    const now = Date.now();
    const pulse = 0.6 + Math.abs(Math.sin(now * 0.012)) * 0.4;
    const p2 = this.phase === 2;
    const hot = p2 ? '#c084fc' : '#a5b4fc';
    const white = p2 ? '#f0abfc' : '#e0e7ff';
    // 0 when the wind-up starts, 1 the instant the attack fires.
    const prog = Math.max(0, Math.min(1, 1 - t.timer / (t.total || 0.6)));

    ctx.save();
    ctx.globalCompositeOperation = 'lighter';

    if (t.type === 'line') {
      const tx = t.x - camera.x;
      const ty = t.y - camera.y;
      const angle = Math.atan2(ty - cy, tx - cx);
      const ex = cx + Math.cos(angle) * 700;
      const ey = cy + Math.sin(angle) * 700;

      // Charge lane: a widening translucent corridor, then the dashed guide.
      ctx.globalAlpha = 0.16 + prog * 0.2;
      ctx.fillStyle = hot;
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(ex + Math.sin(angle) * 16, ey - Math.cos(angle) * 16);
      ctx.lineTo(ex - Math.sin(angle) * 16, ey + Math.cos(angle) * 16);
      ctx.closePath();
      ctx.fill();

      ctx.globalAlpha = 1;
      ctx.strokeStyle = `rgba(165, 180, 252, ${pulse})`;
      ctx.lineWidth = 2 + prog * 4;
      ctx.setLineDash([10, 8]);
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(ex, ey);
      ctx.stroke();
      ctx.setLineDash([]);

      // Hot white core line snaps in as the charge completes.
      ctx.globalAlpha = prog * 0.9;
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(ex, ey);
      ctx.stroke();

      // Chevrons marching down the lane toward the player.
      ctx.globalAlpha = 0.55 + pulse * 0.35;
      ctx.strokeStyle = white;
      ctx.lineWidth = 2;
      const march = (now * 0.0016) % 1;
      for (let i = 0; i < 7; i++) {
        const d = ((i / 7) + march) % 1;
        const px = cx + Math.cos(angle) * 720 * d;
        const py = cy + Math.sin(angle) * 720 * d;
        ctx.beginPath();
        ctx.moveTo(px - Math.cos(angle) * 10 - Math.sin(angle) * 7, py - Math.sin(angle) * 10 + Math.cos(angle) * 7);
        ctx.lineTo(px, py);
        ctx.lineTo(px - Math.cos(angle) * 10 + Math.sin(angle) * 7, py - Math.sin(angle) * 10 - Math.cos(angle) * 7);
        ctx.stroke();
      }

      // Crosshair snapping shut on the charge target.
      ctx.globalAlpha = 0.75 + pulse * 0.25;
      ctx.strokeStyle = hot;
      ctx.lineWidth = 2.5;
      const rr = 30 - prog * 16;
      ctx.beginPath(); ctx.arc(tx, ty, rr, 0, Math.PI * 2); ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(tx - rr - 8, ty); ctx.lineTo(tx + rr + 8, ty);
      ctx.moveTo(tx, ty - rr - 8); ctx.lineTo(tx, ty + rr + 8);
      ctx.stroke();
    } else if (t.type === 'ground') {
      const tx = t.x - camera.x;
      const ty = t.y - camera.y;

      // Landing zone floods in as the knight rises.
      ctx.globalAlpha = 0.14 + prog * 0.3;
      ctx.fillStyle = p2 ? '#a855f7' : '#6366f1';
      ctx.beginPath();
      ctx.ellipse(tx, ty, 64, 16, 0, 0, Math.PI * 2);
      ctx.fill();

      ctx.globalAlpha = 1;
      ctx.strokeStyle = `rgba(148, 163, 184, ${pulse})`;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.ellipse(tx, ty, 60, 15, 0, 0, Math.PI * 2);
      ctx.stroke();

      // Fist closing on the target: two counter-rotating targeting rings.
      ctx.strokeStyle = hot;
      ctx.lineWidth = 2;
      for (let s = 0; s < 2; s++) {
        ctx.save();
        ctx.translate(tx, ty);
        ctx.scale(1, 0.25 + s * 0.06);
        ctx.rotate((now * 0.002 * (s ? -1 : 1)) % (Math.PI * 2));
        ctx.setLineDash([7, 6]);
        ctx.beginPath();
        ctx.arc(0, 0, 44 + s * 14 - prog * 6, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
      }
      ctx.setLineDash([]);

      // Falling marker above the target, dropping as the attack charges.
      const markY = ty - 150 + prog * 118;
      ctx.globalAlpha = 0.9;
      ctx.fillStyle = p2 ? '#f0abfc' : '#fbbf24';
      ctx.beginPath();
      ctx.moveTo(tx, markY + 14);
      ctx.lineTo(tx - 9, markY);
      ctx.lineTo(tx + 9, markY);
      ctx.closePath();
      ctx.fill();
      ctx.globalAlpha = 0.4;
      ctx.fillRect(tx - 1.5, markY + 16, 3, Math.max(0, ty - markY - 18));
    } else if (t.type === 'ring') {
      const radius = 34 + Math.sin(now * 0.02) * 5;
      ctx.globalAlpha = 1;
      ctx.strokeStyle = `rgba(165, 180, 252, ${pulse})`;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(cx, cy, radius, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([6, 6]);
      ctx.beginPath();
      ctx.arc(cx, cy, radius + 20, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);

      // Rune seal that fills up, then five aiming barrels spread over the fan.
      ctx.globalAlpha = 0.4 + prog * 0.5;
      ctx.strokeStyle = white;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(cx, cy, radius - 6, -Math.PI / 2, -Math.PI / 2 + prog * Math.PI * 2);
      ctx.stroke();

      const aimA = t.aimAngle ?? 0;
      const count = t.aimCount ?? 5;
      const spread = t.aimSpread ?? 0.55;
      for (let i = 0; i < count; i++) {
        const a = count === 1 ? aimA : aimA - spread + (i / (count - 1)) * spread * 2;
        const inner = radius + 4;
        const outer = radius + 26 + prog * 22;
        ctx.globalAlpha = 0.35 + prog * 0.5;
        ctx.strokeStyle = `rgba(244, 114, 182, ${0.35 + prog * 0.5})`;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(cx + Math.cos(a) * inner, cy + Math.sin(a) * inner);
        ctx.lineTo(cx + Math.cos(a) * outer, cy + Math.sin(a) * outer);
        ctx.stroke();
      }
    }
    ctx.restore();
  }
}

window.DropItem = DropItem;
window.Projectile = Projectile;
window.Player = Player;
window.Monster = Monster;
window.Critter = Critter;
window.ForestGuardianBoss = ForestGuardianBoss;
window.CursedKnightBoss = CursedKnightBoss;
