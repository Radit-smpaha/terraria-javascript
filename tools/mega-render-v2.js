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

    // ---- Palette: five hard bands, Terraria-style. Phase tints walk the
    // blues toward charcoal and then toward a raw blood-glow. Exhaustion
    // desaturates everything: the beast goes grey when it is spent. --------
    const dull = (ph >= 2 && exhausted ? 0.5 : exhausted ? 0.35 : 0) ;
    const dullMix = (c) => dull > 0 ? this._mixColor(c, '#59627a', dull) : c;
    const hideBack = dullMix(flash ? '#ffffff' : ph === 3 ? '#2c3446' : ph === 2 ? '#3a4763' : '#48587f');
    const hideTop  = dullMix(flash ? '#ffffff' : ph === 3 ? '#3a4258' : ph === 2 ? '#465578' : '#556590');
    const hideMid  = dullMix(flash ? '#ffe4e6' : ph === 3 ? '#4c5670' : ph === 2 ? '#5c6d97' : '#6b7dab');
    const hideLow  = dullMix(flash ? '#fecdd3' : ph === 3 ? '#7b88a8' : ph === 2 ? '#93a2c4' : '#a8b5d2');
    const belly    = dullMix(flash ? '#ffffff' : ph === 3 ? '#c9d2e4' : ph === 2 ? '#dbe3f3' : '#e6ecf8');
    const bellySh  = dullMix(flash ? '#ffffff' : ph === 3 ? '#a7b2c8' : ph === 2 ? '#c2ccdf' : '#cdd6e8');
    const finDark  = dullMix(flash ? '#ffffff' : ph === 3 ? '#333b50' : ph === 2 ? '#3f4d72' : '#4a5a87');
    const finLite  = dullMix(flash ? '#ffe4e6' : ph === 3 ? '#5d6a8a' : ph === 2 ? '#7486b3' : '#8ba0cc');
    const outline  = '#0d1424';
    const mouthDeep = flash ? '#7f1d1d' : ph >= 2 ? '#4e0a16' : '#5c0d1a';
    const mouthLit  = flash ? '#fecdd3' : ph >= 2 ? '#b8223c' : '#c72640';
    const gum       = flash ? '#fecdd3' : '#d76a78';
    const tooth     = flash ? '#ffffff' : ph === 3 ? '#e8e2d4' : '#f4f6fa';
    const eyeGlow   = flash ? 1 : ph === 1 ? 0 : ph === 2 ? 0.5 : 1;
    const woundGlow = ph >= 2 ? Math.min(1, 0.3 + injury * 0.7) : injury * 0.25;

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
    const waveAmp = 0.10 + Math.min(0.16, Math.abs(swing) * 0.006)
      + (dashing ? -0.05 : 0) + (spinning ? 0.22 : 0);
    const wavePhase = this.swimPhase * 0.85;
    const st = { waveAmp, wavePhase, tailBend: this.tailBend || 0, pitch: this.pitch || 0 };

    const spineBend = (u) => {
      const tailGain = Math.pow(1 - u, 1.7);           // 1 at tail, 0 at nose
      return Math.sin(wavePhase - u * 2.7) * waveAmp * tailGain
        + st.tailBend * tailGain * 1.6
        + st.pitch * (1 - u) * 4                        // pitch noses over on a dive
        + Math.sin(wavePhase * 1.7 - u * 4.2) * waveAmp * 0.22 * tailGain; // organic harmonic
    };
    const bodyHalf = (u) => {
      const t = u;  // 0 tail .. 1 nose
      const swell = Math.sin(Math.min(1, 0.12 + t * 0.80) * Math.PI);
      const prof = 0.10 + 0.86 * Math.pow(Math.max(0, swell), 0.62);
      const noseTaper = t > 0.96 ? Math.max(0.74, 1 - (t - 0.96) * 6.5) : 1;
      const peduncle = t < 0.14 ? Math.max(0.42, t / 0.14) : 1;   // thin caudal stalk
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

    ctx.save();
    // ---- Whole-body transform: bank, pitch, roll/yaw, squash, breathe. ----
    const squash = this.squash || 0;
    const breath = this.breath || 1;
    const pitch = this.pitch || 0;
    const lean = this.lean || 0;
    const lunge = this.lunge || 0;
    const rollV = this.roll || 0;
    const yawV = this.yaw || 0;
    // Exhausted, it sinks a little and trembles in the water.
    const tremble = exhausted ? Math.sin(this.animT * 37) * 0.8 : 0;
    const bodyCX = x + this.width * 0.5 + (this.sway || 0);
    const bodyCY = y + this.height * 0.5 + (this.bob || 0) + droop * 9 + tremble;
    ctx.translate(bodyCX, bodyCY);
    ctx.scale(grow, grow);
    ctx.rotate(lean * 0.14 + pitch * 0.5 + lunge * 0.05 * faceDir);
    // Yaw cheat: a horizontal skew that reads as turning toward/away.
    ctx.transform(1, yawV * 0.16, yawV * 0.10, 1, 0, 0);
    ctx.transform(1 + squash * 0.22, squash * 0.06 * pitch,
      squash * 0.06 * pitch, (1 - squash * 0.3) * breath, 0, 0);
    // Roll cheat: vertical squash + the banked flank shadow sell a body
    // swimming through a volume instead of sliding across a plane.
    ctx.scale(1, 1 - Math.abs(rollV) * 0.22);
    // Face left or right with a single flip; all art below draws NOSE RIGHT.
    ctx.scale(faceDir, 1);
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    if (vanished) ctx.globalAlpha = 0.16 + Math.abs(Math.sin(this.animT * 30)) * 0.08;
    else if (exhausted) ctx.globalAlpha = 0.94;
    const scarN = Math.floor(3 + injury * 11 + (ph - 1) * 3);

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
    // 0a. WOUND AURA — phase 2+ the cracked hide breathes light into the
    //     water. Drawn BEHIND the animal as a bloom, never over the model.
    // ======================================================================
    if (ph >= 2 && this.skillGlow > 0 && !vanished) {
      const wg = Math.min(0.15, this.skillGlow * 0.11);
      ctx.fillStyle = 'rgba(248, 113, 113, ' + wg.toFixed(3) + ')';
      ctx.beginPath(); ctx.ellipse(0, HH * 0.1, HW * 1.08, HH * 1.5, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = 'rgba(251, 146, 60, ' + (wg * 0.5).toFixed(3) + ')';
      ctx.beginPath(); ctx.ellipse(HW * 0.2, HH * 0.1, HW * 0.5, HH * 0.8, 0, 0, Math.PI * 2); ctx.fill();
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
    const flapFront = Math.sin((this.finKick || 0) * Math.PI * 2) * 0.5;
    const flapBack  = Math.sin(((this.finKick || 0) + 0.5) * Math.PI * 2) * 0.5;
    const pecFlap = (f) => (f * 0.6 + (1 - f) * flapBack) * (1 - droop * 0.7);
    {
      const rootA = spineAt(0.70, 0.55);
      const rootB = spineAt(0.575, 0.62);
      const mid   = spineAt(0.635, 0);
      const drop  = bodyHalf(0.635) * 0.95 + pecFlap(0.5) * 22;
      const pts = [
        rootB,
        { x: mid.x - 66 - pecFlap(0.3) * 20, y: mid.y + drop * 0.92 + pecFlap(0.3) * 10 },
        { x: mid.x - 108 - pecFlap(0.12) * 30, y: mid.y + drop * 1.18 + pecFlap(0.12) * 16 },
        { x: mid.x - 66 - pecFlap(0.5) * 14, y: mid.y + drop * 0.78 + pecFlap(0.5) * 8 },
        rootA
      ];
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
      const upper = [
        { x: 34, y: -13 },
        { x: -30, y: -56 }, { x: -70, y: -126 },
        { x: -46, y: -76 }, { x: -24, y: -42 },
        { x: -15, y: -24 }
      ];
      const lower = [
        { x: -17, y: 20 },
        { x: -42, y: 52 }, { x: -60, y: 82 },
        { x: -32, y: 46 }, { x: 2, y: 22 }, { x: 32, y: 16 }
      ];
      // Droop + dash stretch the tail: fatigue sags it, a charge snaps it straight.
      const sag = (1 + droop * 0.35) * (dashing ? 0.86 : 1);
      ctx.beginPath();
      traceSmooth(ctx, upper);
      traceSmooth(ctx, lower);
      ctx.closePath();
      ctx.save();
      ctx.translate(0, 0); ctx.scale(1, sag);
      ctx.fillStyle = flash ? '#e2e8f0' : finDark;
      ctx.fill();
      ctx.strokeStyle = outline;
      ctx.lineWidth = 3.5;
      ctx.stroke();
      // Fin rays fanning through both lobes.
      ctx.strokeStyle = 'rgba(13, 20, 36, 0.30)';
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
      ctx.strokeStyle = 'rgba(13, 20, 36, 0.4)';
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
      ctx.strokeStyle = 'rgba(13, 20, 36, 0.35)';
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
      // Dappled caustics: stable hash speckles over the whole hide.
      for (let i = 0; i < 54; i++) {
        const h1 = this._hash01(i * 1.37 + (this.scarSeed || 0));
        const h2 = this._hash01(i * 2.11 + (this.scarSeed || 0));
        const h3 = this._hash01(i * 3.07 + (this.scarSeed || 0));
        const u = 0.06 + h1 * 0.92;
        const p = spineAt(u, -0.9 + h2 * 1.7);
        const r = 2 + h3 * 5;
        ctx.fillStyle = h2 > 0.5 ? 'rgba(210, 230, 255, 0.07)' : 'rgba(13, 20, 36, 0.06)';
        ctx.beginPath(); ctx.ellipse(p.x, p.y, r, r * 0.62, h1 * 3, 0, Math.PI * 2); ctx.fill();
      }
      // Lateral line: the dotted sensory canal down the flank.
      ctx.fillStyle = 'rgba(13, 20, 36, 0.34)';
      for (let i = 0; i < 22; i++) {
        const u = 0.12 + (i / 21) * 0.74;
        const p = spineAt(u, 0.12 + Math.sin(i * 1.7) * 0.05);
        ctx.fillRect(p.x, p.y, 2.4, 2.4);
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
      const rootFront = spineAt(0.60, -0.92);
      const rootBack  = spineAt(0.26, -0.96);
      const base       = spineAt(0.43, 0);
      const tipX = base.x - 26 - (this.surge || 0) * 14 - dashing * 12;
      const tipY = base.y - bodyHalf(0.43) * 1.62 + finTilt * 14;
      const pts = [
        { x: rootFront.x + 4, y: rootFront.y + 3 },
        { x: rootFront.x - 20, y: rootFront.y - bodyHalf(0.43) * 0.5 },
        { x: tipX, y: tipY },
        { x: base.x - 58, y: base.y - bodyHalf(0.43) * 0.42 },
        { x: rootBack.x, y: rootBack.y + 3 }
      ];
      ctx.beginPath(); traceSmooth(ctx, pts); ctx.closePath();
      ctx.fillStyle = flash ? '#e2e8f0' : finLite;
      ctx.fill();
      ctx.strokeStyle = outline;
      ctx.lineWidth = 4;
      ctx.stroke();
      // Membrane rays + leading-edge highlight.
      ctx.strokeStyle = 'rgba(13, 20, 36, 0.28)';
      ctx.lineWidth = 1.5;
      for (let r = 0; r < 5; r++) {
        ctx.beginPath();
        ctx.moveTo(rootFront.x - 6, rootFront.y - 10 - r * 2);
        ctx.lineTo(tipX + 8 + r * 3, tipY + 16 + r * 8);
        ctx.stroke();
      }
      ctx.strokeStyle = 'rgba(206, 224, 255, 0.30)';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(rootFront.x + 2, rootFront.y);
      ctx.quadraticCurveTo(rootFront.x - 22, rootFront.y - bodyHalf(0.43) * 0.52, tipX, tipY - 2);
      ctx.stroke();
      // Apex: the dorsal is notched and torn.
      if (ph === 3 || (ph === 2 && injury > 0.4)) {
        ctx.fillStyle = flash ? '#ffe4e6' : hideMid;
        ctx.beginPath();
        ctx.moveTo(tipX - 16, tipY + 10); ctx.lineTo(tipX + 2, tipY + 30); ctx.lineTo(tipX - 26, tipY + 26);
        ctx.closePath(); ctx.fill();
      }
      // Second dorsal.
      {
        const rF = spineAt(0.30, -0.86);
        const rB = spineAt(0.235, -0.9);
        const bb = spineAt(0.265, 0);
        const tp = { x: bb.x - 16, y: bb.y - bodyHalf(0.265) * 1.28 + finTilt * 8 };
        ctx.beginPath();
        ctx.moveTo(rF.x, rF.y + 3);
        ctx.quadraticCurveTo(bb.x - 8, bb.y - bodyHalf(0.265) * 0.8, tp.x, tp.y);
        ctx.quadraticCurveTo(bb.x - 34, bb.y - bodyHalf(0.265) * 0.4, rB.x, rB.y + 3);
        ctx.closePath();
        ctx.fillStyle = flash ? '#e2e8f0' : finDark;
        ctx.fill();
        ctx.strokeStyle = outline;
        ctx.lineWidth = 3;
        ctx.stroke();
      }
    }
    // Pelvic + anal nubs: silhouette richness on the belly line.
    {
      const pelv = spineAt(0.35, 0.72);
      const pelvB = spineAt(0.29, 0.76);
      const pe = spineAt(0.32, 0);
      const tp = { x: pe.x - 24, y: pe.y + bodyHalf(0.32) * 1.1 - droop * 8 };
      ctx.beginPath();
      ctx.moveTo(pelv.x, pelv.y);
      ctx.quadraticCurveTo(pe.x - 14, pe.y + bodyHalf(0.32) * 0.9, tp.x, tp.y);
      ctx.quadraticCurveTo(pe.x - 40, pe.y + bodyHalf(0.32) * 0.7, pelvB.x, pelvB.y);
      ctx.closePath();
      ctx.fillStyle = flash ? '#e2e8f0' : finDark;
      ctx.fill();
      ctx.strokeStyle = outline;
      ctx.lineWidth = 3;
      ctx.stroke();

      const an = spineAt(0.17, 0.74);
      const anB = spineAt(0.12, 0.78);
      const ae = spineAt(0.145, 0);
      const at = { x: ae.x - 18, y: ae.y + bodyHalf(0.145) * 1.05 - droop * 6 };
      ctx.beginPath();
      ctx.moveTo(an.x, an.y);
      ctx.quadraticCurveTo(ae.x - 10, ae.y + bodyHalf(0.145) * 0.85, at.x, at.y);
      ctx.quadraticCurveTo(ae.x - 30, ae.y + bodyHalf(0.145) * 0.65, anB.x, anB.y);
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
      const rootA = spineAt(0.70, 0.6);
      const rootB = spineAt(0.58, 0.66);
      const mid   = spineAt(0.635, 0);
      const f = pecFlap;
      const wing = bodyHalf(0.635) * 1.5 + swing * 0.05;
      const pts = [
        rootB,
        { x: mid.x - 74 - f(0.3) * 26, y: mid.y + wing * 0.9 + f(0.3) * 12 },
        { x: mid.x - 122 - f(0.12) * 34, y: mid.y + wing * 1.22 + f(0.12) * 18 },
        { x: mid.x - 76 - f(0.5) * 18, y: mid.y + wing * 0.8 + f(0.5) * 10 },
        rootA
      ];
      ctx.beginPath(); traceSmooth(ctx, pts); ctx.closePath();
      ctx.fillStyle = flash ? '#ffe4e6' : finLite;
      ctx.fill();
      ctx.strokeStyle = outline;
      ctx.lineWidth = 4;
      ctx.stroke();
      // Rays + the trailing-edge shadow that gives the wing thickness.
      ctx.strokeStyle = 'rgba(13, 20, 36, 0.30)';
      ctx.lineWidth = 1.8;
      for (let r = 0; r < 5; r++) {
        ctx.beginPath();
        ctx.moveTo(mid.x + 10, mid.y + wing * 0.5 + r * 3);
        ctx.quadraticCurveTo(mid.x - 60, mid.y + wing * 0.9 + r * 4,
          mid.x - 112 - f(0.2) * 20, mid.y + wing * 1.15 + r * 5);
        ctx.stroke();
      }
      ctx.strokeStyle = 'rgba(13, 20, 36, 0.4)';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(mid.x - 70, mid.y + wing * 0.86);
      ctx.quadraticCurveTo(mid.x - 100, mid.y + wing * 1.08, mid.x - 120 - f(0.15) * 24, mid.y + wing * 1.2);
      ctx.stroke();
    }

    // ======================================================================
    // 6. GILL SLITS â€” five slashes behind the head, fluttering with breath.
    // ======================================================================
    {
      const open = Math.max(0.18, Math.min(1.4,
        (this.gillFlare || 0) * 0.55 + (this.surge || 0) * 0.3 - droop * 0.3));
      for (let g = 0; g < 5; g++) {
        const u = 0.80 - g * 0.042;
        const top = spineAt(u, -0.62);
        const bot = spineAt(u - 0.005, 0.34);
        const len = (bot.y - top.y) * (0.5 + open * 0.5);
        ctx.strokeStyle = ph >= 2 ? 'rgba(90, 16, 28, 0.85)' : 'rgba(13, 20, 36, 0.78)';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(top.x - 2, top.y + 8);
        ctx.quadraticCurveTo(top.x - 6, top.y + 8 + len * 0.5, top.x - 3, top.y + 8 + len);
        ctx.stroke();
        // Phase 2+: the gills bleed light in the dark water.
        if (ph >= 2 && woundGlow > 0.2) {
          ctx.strokeStyle = 'rgba(248, 113, 113, ' + (0.18 + woundGlow * 0.3).toFixed(2) + ')';
          ctx.lineWidth = 1.6;
          ctx.stroke();
        }
      }
    }

    // ======================================================================
    // 7. HIDE WEAR â€” the record of a million years of hunting. Scars, the
    //    barnacles of a lazy youth, and the remoras that still escort it.
    // ======================================================================
    for (let s = 0; s < scarN; s++) {
      const sSeed = s * 2.399 + (this.scarSeed || 0);
      const u = 0.14 + (this._hash01(sSeed) * 0.82);
      const p = spineAt(u, -0.7 + this._hash01(sSeed * 1.7) * 1.5);
      const slen = 12 + (s % 4) * 7;
      const sang = 0.7 + (s % 3) * 0.5 + spineBend(u) * 0.4;
      ctx.strokeStyle = ph >= 2
        ? 'rgba(190, 60, 76, ' + Math.min(0.95, 0.5 + injury * 0.45).toFixed(2) + ')'
        : 'rgba(148, 163, 198, 0.7)';
      ctx.lineWidth = 2.5 + (s % 2);
      ctx.beginPath();
      ctx.moveTo(p.x, p.y);
      ctx.lineTo(p.x + Math.cos(sang) * slen, p.y + Math.sin(sang) * slen);
      ctx.stroke();
      // Cross-hatch second stroke on every other scar.
      if (s % 2 === 0) {
        ctx.beginPath();
        ctx.moveTo(p.x + Math.cos(sang) * slen * 0.2, p.y + Math.sin(sang) * slen);
        ctx.lineTo(p.x + Math.cos(sang) * slen * 0.9, p.y - 4);
        ctx.stroke();
      }
      // Phase 2+: scars crack and weep.
      if (ph >= 2 && s % 3 === 0) {
        ctx.fillStyle = 'rgba(248, 113, 113, ' + (0.3 + eyeGlow * 0.35).toFixed(2) + ')';
        ctx.fillRect(p.x + 2, p.y + 2, 3, 3);
      }
      // Phase 3: raw scar cores, pale bone under the torn hide.
      if (ph === 3 && s % 4 === 0) {
        ctx.fillStyle = 'rgba(226, 214, 196, 0.5)';
        ctx.fillRect(p.x + slen * 0.45, p.y + 1, 4, 2);
      }
    }
    // Barnacles: worn off as the frenzy takes it. Phase 1 keeps a collar.
    if (ph === 1) {
      const barn = spineAt(0.74, 0.3);
      ctx.fillStyle = 'rgba(214, 205, 180, 0.85)';
      for (let b = 0; b < 7; b++) {
        const bx = barn.x - b * 11 + Math.sin(b * 2.1) * 3;
        const by = barn.y + Math.cos(b * 1.7) * 6 + 4;
        ctx.beginPath(); ctx.arc(bx, by, 2.6 + (b % 3), 0, Math.PI * 2); ctx.fill();
      }
    } else if (ph === 2) {
      const barn = spineAt(0.76, 0.3);
      ctx.fillStyle = 'rgba(214, 205, 180, 0.6)';
      for (let b = 0; b < 3; b++) {
        ctx.beginPath(); ctx.arc(barn.x - b * 11, barn.y + 4, 2.4, 0, Math.PI * 2); ctx.fill();
      }
    }
    // Remoras: two escort fish under the gills. They swim off in the apex.
    if (ph < 3) {
      for (let r = 0; r < 2; r++) {
        const lag = r * 0.5;
        const swayR = Math.sin((this.finKick || 0) * Math.PI * 2 + lag * 3) * 5;
        const u = 0.72 - r * 0.05;
        const p = spineAt(u, 0.55);
        ctx.save();
        ctx.translate(p.x, p.y + swayR);
        ctx.rotate(0.25 + Math.cos((this.finKick || 0) * Math.PI * 2 + lag * 3) * 0.12);
        ctx.fillStyle = '#8fa3bf';
        ctx.strokeStyle = outline;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.ellipse(0, 0, 11, 4.6, 0, 0, Math.PI * 2);
        ctx.fill(); ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(-9, -1); ctx.lineTo(-19, -7); ctx.lineTo(-17, 2); ctx.closePath();
        ctx.fill(); ctx.stroke();
        ctx.restore();
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
      const browA = spineAt(0.92, -0.62);
      const browB = spineAt(0.70, -0.55);
      const bb = spineAt(0.80, 0);
      ctx.beginPath();
      ctx.moveTo(browA.x, browA.y);
      ctx.quadraticCurveTo(bb.x + 6, bb.y - bodyHalf(0.80) * (1.05 + 0.1 * eyeGlow), browB.x, browB.y);
      ctx.quadraticCurveTo(bb.x + 2, bb.y - bodyHalf(0.80) * 0.55, browA.x + 12, browA.y + 8);
      ctx.closePath();
      ctx.fillStyle = hideTop;
      ctx.fill();
      ctx.strokeStyle = outline;
      ctx.lineWidth = 3;
      ctx.stroke();

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
        // Ember bloom behind the eye in the frenzy phases.
        ctx.fillStyle = 'rgba(248, 113, 113, ' + (0.16 + eyeGlow * 0.22).toFixed(2) + ')';
        ctx.beginPath();
        ctx.arc(eyeX, eyeY, 13 + eyeGlow * 4 + Math.sin(this.animT * 6) * 1.5, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.fillStyle = '#f8fafc';
      ctx.beginPath(); ctx.ellipse(eyeX, eyeY, 8.2, 7, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = ph === 1 ? '#1e293b' : '#7f1d1d';
      ctx.beginPath(); ctx.ellipse(eyeX + lookX * 2, eyeY + lookY * 1.4, 5.6, 6, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = ph === 3 ? '#fca5a5' : '#0f172a';
      ctx.beginPath(); ctx.ellipse(eyeX + lookX * 3.2, eyeY + lookY * 2.2, 3.2, 3.6, 0, 0, Math.PI * 2); ctx.fill();
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
      ctx.fillStyle = 'rgba(13, 20, 36, 0.8)';
      ctx.beginPath(); ctx.ellipse(spineAt(0.97, -0.35).x, spineAt(0.97, -0.35).y, 3, 2, 0.3, 0, Math.PI * 2); ctx.fill();
      // Ampullae of Lorenzini: the sensory pores over the snout.
      ctx.fillStyle = 'rgba(13, 20, 36, 0.28)';
      for (let a = 0; a < 8; a++) {
        const p = spineAt(0.94 - (a % 4) * 0.022, -0.42 + Math.floor(a / 4) * 0.12 + (a % 2) * 0.03);
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
      // Jaw angle: a resting snarl that unhinges to near-vertical.
      const ja = 0.09 + (this.jawOpen || 0) * 0.46;
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
          // Throat rings receding into the gullet.
          ctx.strokeStyle = 'rgba(74, 10, 24, 0.55)';
          ctx.lineWidth = 2;
          for (let rr = 0; rr < 3; rr++) {
            const f0 = 0.12 + rr * 0.11;
            const p = lipPt(f0), q = jawPt(f0);
            ctx.beginPath();
            ctx.moveTo(p.x + (q.x - p.x) * 0.3, p.y + (q.y - p.y) * 0.3);
            ctx.quadraticCurveTo(p.x - 12 * rr, p.y + (q.y - p.y) * 0.5,
              p.x + (q.x - p.x) * 0.7, p.y + (q.y - p.y) * 0.7);
            ctx.stroke();
          }
          // Tongue: a muscular curl riding the floor of the mouth.
          {
            const t0 = jawPt(0.34), t1 = jawPt(0.62);
            ctx.fillStyle = '#8f1220';
            ctx.beginPath();
            ctx.ellipse((t0.x + t1.x) / 2, (t0.y + t1.y) / 2 + 4,
              26 + open01 * 10, 7 + open01 * 5, jawTangent(0.5).y * 0.5, 0, Math.PI * 2);
            ctx.fill();
          }
          // The heat of the gullet, phase 2+: skill glow bleeds out of it.
          if (ph >= 2 && this.skillGlow > 0) {
            const g0 = lipPt(0.2), g1 = jawPt(0.2);
            ctx.fillStyle = 'rgba(251, 146, 60, ' + Math.min(0.35, this.skillGlow * 0.22).toFixed(2) + ')';
            ctx.beginPath();
            ctx.ellipse((g0.x + g1.x) / 2, (g0.y + g1.y) / 2, 26, 10 + open01 * 12, 0, 0, Math.PI * 2);
            ctx.fill();
          }
        }
      }

      // ---- LOWER JAW: the slab + its teeth, hinged at the mouth corner. ----
      {
        const slab = [];
        for (let i = 0; i <= 8; i++) slab.push(jawPt(i / 8));
        const jowl = (f) => 13 + open01 * 8 + Math.sin(f * Math.PI) * 5;
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
        // into the gape so the two rows interleave when it snaps shut.
        const lowerTeeth = 10;
        for (let t = 0; t < lowerTeeth; t++) {
          const f = 0.05 + (t / (lowerTeeth - 1)) * 0.92;
          const base = jawPt(f);
          const tg = jawTangent(f);
          const tlen = (8 + Math.sin(f * Math.PI) * 15 + open01 * 4)
            * (ph === 3 && t % 3 === 1 ? 0.45 : 1);   // apex: teeth snapped off
          // direction: from the jaw line up into the gape = (-t.y, t.x) reversed
          this._toothTri(ctx, base.x + tg.y * 2, base.y - tg.x * 2, tg.y, -tg.x, tlen, 4.4, tooth);
        }
      }

      // ---- UPPER TEETH: two staggered rows hanging from the upper lip. ----
      {
        for (let row = 0; row < 2; row++) {
          const count = row === 0 ? 11 : 10;
          const scale = row === 0 ? 1 : 0.72;
          for (let t = 0; t < count; t++) {
            const f = 0.03 + (t / (count - 1)) * 0.94 + row * 0.05;
            const base = lipPt(Math.min(1, f));
            const tg = lipTangent(Math.min(1, f));
            const tlen = (10 + Math.sin(f * Math.PI) * 21 + open01 * 5) * scale
              * (ph === 3 && t % 3 === 2 ? 0.5 : 1);  // apex: teeth snapped off
            // direction: from the lip down into the gape = (t.y, -t.x)
            this._toothTri(ctx, base.x - tg.y * 1.5, base.y + tg.x * 1.5, -tg.y, tg.x, tlen, 4.8 * scale, tooth);
          }
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

      // ---- Closed-mouth resting snarl: front teeth over the lip line. ----
      if (open01 < 0.12) {
        ctx.strokeStyle = outline;
        ctx.lineWidth = 3;
        ctx.beginPath();
        traceSmooth(ctx, [closedY(0.06), closedY(0.4), closedY(0.75), closedY(0.98)]);
        ctx.stroke();
        for (let t = 0; t < 5; t++) {
          const f = 0.3 + t * 0.15;
          const base = lipPt(f);
          const tg = lipTangent(f);
          this._toothTri(ctx, base.x - tg.y * 2, base.y + tg.x * 2, -tg.y, tg.x, 7, 3, tooth);
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
    // Wound glow: phase 2+ bleeds light out of the cracked hide.
    if (ph >= 2 && this.skillGlow > 0 && !vanished) {
      ctx.globalAlpha = Math.min(0.22, this.skillGlow * 0.16);
      ctx.fillStyle = '#f87171';
      ctx.beginPath();
      ctx.ellipse(0, 0, HW * 1.0, HH * 1.45, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = vanished ? 0.16 : exhausted ? 0.94 : 1;
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
  }
