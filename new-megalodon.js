// ============================================================================
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


