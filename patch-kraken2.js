// Patch 2: the Kraken RENDER overhaul — whole-body motion, hide dimming,
// lash-driven limbs, Terraria cut-out outlines and quantised skin tones.
const fs = require('fs');
const path = require('path');
const FILE = path.join(__dirname, 'ocean.js');
let src = fs.readFileSync(FILE, 'utf8');
const EOL = src.includes('\r\n') ? '\r\n' : '\n';
src = src.replace(/\r\n/g, '\n');

function apply(label, oldText, newText) {
  oldText = oldText.replace(/\r\n/g, '\n');
  newText = newText.replace(/\r\n/g, '\n');
  if (src.indexOf(oldText) === -1) throw new Error('PATCH FAILED (not found): ' + label);
  src = src.replace(oldText, newText);
  console.log('  ok  ' + label);
}

// ---- A. render head: add lash/hidden/swim-origin state -------------------
apply('render head',
  `    const mouthY = y + this.height * 0.60;
    const t = this.animT * (1.6 + this.phase * 0.35);
    ctx.save();
    // Lean the whole beast into its direction of travel (set by update()), so
    // it banks as it swims instead of gliding flat and stiff.
    if (this.lean) {
      ctx.translate(cx, y + this.height * 0.5);
      ctx.rotate(this.lean * 0.18);
      ctx.translate(-cx, -(y + this.height * 0.5));
    }`,
  `    const mouthY = y + this.height * 0.60;
    const t = this.animT * (1.6 + this.phase * 0.35);
    // How far into the lash strike we are: 0 idle, 1 fully whipped out. When
    // the beast lashes, every limb stretches toward the target and the skin
    // flushes hot; when it hides, the whole body sinks to a dim silhouette.
    const lash = this.lashPhase || 0;
    const hiddenNow = this.hideAlpha < 0.6;
    ctx.save();
    // Lean the whole beast into its direction of travel (set by update()), so
    // it banks as it swims instead of gliding flat and stiff.
    if (this.lean) {
      ctx.translate(cx, y + this.height * 0.5);
      ctx.rotate(this.lean * 0.18);
      ctx.translate(-cx, -(y + this.height * 0.5));
    }
    // Everything below is drawn relative to a swim origin that carries the
    // live bob/sway of the body, so the whole creature moves as one organism.
    ctx.translate(this.sway || 0, this.bob || 0);
    // While hidden the beast becomes a faint shadow in the deep: dim the lot,
    // but keep a hot eye and lashing limbs bright so the threat still reads.
    ctx.globalAlpha = hiddenNow ? Math.max(0.12, this.hideAlpha) : 1;`);

// ---- B. skin tones: add skinLit ------------------------------------------
apply('skin palette',
  `    const flash = this.hitFlash > 0;
    const skinTop = flash ? '#ffffff'
      : this.phase === 3 ? '#7f1d1d' : this.phase === 2 ? '#9f1239' : '#be123c';`,
  `    const flash = this.hitFlash > 0;
    // Skin palette flushes hotter as the beast enrages; the "lit" tone is the
    // brightest top-edge colour used on the leading side of every limb.
    const skinLit = flash ? '#ffffff'
      : this.phase === 3 ? '#b91c1c' : this.phase === 2 ? '#e11d48' : '#fb7185';
    const skinTop = flash ? '#ffffff'
      : this.phase === 3 ? '#7f1d1d' : this.phase === 2 ? '#9f1239' : '#be123c';`);

// ---- C. limb(): hard outline + quantised tones + stamped suckers ----------
apply('limb body',
  `    const limb = (bx, by, ctrlX, ctrlY, tipX, tipY, baseW, length, suckers, coil = 0) => {
      const segs = 12;
      ctx.lineCap = 'round';
      // Dark underside pass first (offset a touch), then the lit body on top.
      for (let pass = 0; pass < 2; pass++) {
        for (let s = 0; s < segs; s++) {
          const t0 = s / segs, t1 = (s + 1) / segs;
          const w0 = baseW * (1 - t0) + 2.5 * t0;
          const w1 = baseW * (1 - t1) + 2.5 * t1;
          const off = pass === 0 ? 2 : 0;
          const p0 = qPoint(bx, by + off, ctrlX, ctrlY + off, tipX, tipY + off, t0);
          const p1 = qPoint(bx, by + off, ctrlX, ctrlY + off, tipX, tipY + off, t1);
          if (pass === 0) {
            ctx.strokeStyle = skinTip;
            ctx.lineWidth = w0;
          } else {
            ctx.strokeStyle = t0 < 0.5 ? skinTop : t0 < 0.82 ? skinMid : skinTip;
            ctx.lineWidth = w0 * 0.7;
          }
          ctx.beginPath(); ctx.moveTo(p0.x, p0.y); ctx.lineTo(p1.x, p1.y); ctx.stroke();
        }
      }
      // Rim-light along the leading edge.
      ctx.globalAlpha = 0.5;
      ctx.strokeStyle = rimColor;
      ctx.lineWidth = Math.max(1.5, baseW * 0.28);
      ctx.beginPath(); ctx.moveTo(bx, by); ctx.quadraticCurveTo(ctrlX, ctrlY, tipX, tipY); ctx.stroke();
      ctx.globalAlpha = 1;
      // Suckers: pale ovals perpendicular to the limb, denser toward the tip.
      if (suckers) {
        ctx.fillStyle = suckerColor;
        for (const tt of [0.30, 0.42, 0.54, 0.66, 0.78, 0.88, 0.95]) {
          const pt = qPoint(bx, by, ctrlX, ctrlY, tipX, tipY, tt);
          const r = 2.8 * (1 - tt) + 1.0;
          ctx.beginPath(); ctx.ellipse(pt.x, pt.y, r, r * 0.72, tt * 1.7, 0, Math.PI * 2); ctx.fill();
        }
      }
    };`,
  `    const limb = (bx, by, ctrlX, ctrlY, tipX, tipY, baseW, length, suckers, coil = 0) => {
      const segs = 12;
      ctx.lineCap = 'round';
      // ---- Terraria-style hard silhouette -------------------------------
      // A thick near-black outline is laid down FIRST, one step wider than the
      // limb itself, so every arm reads as a distinct cut-out shape against the
      // water -- the single most important part of the game's sprite look.
      ctx.strokeStyle = '#1a0308';
      ctx.lineWidth = (baseW + 4) * 0.9;
      ctx.beginPath();
      ctx.moveTo(bx, by);
      ctx.quadraticCurveTo(ctrlX, ctrlY, tipX, tipY);
      ctx.stroke();
      // Dark underside pass first (offset a touch), then the lit body on top.
      for (let pass = 0; pass < 2; pass++) {
        for (let s = 0; s < segs; s++) {
          const t0 = s / segs, t1 = (s + 1) / segs;
          const w0 = baseW * (1 - t0) + 2.5 * t0;
          const w1 = baseW * (1 - t1) + 2.5 * t1;
          const off = pass === 0 ? 2 : 0;
          const p0 = qPoint(bx, by + off, ctrlX, ctrlY + off, tipX, tipY + off, t0);
          const p1 = qPoint(bx, by + off, ctrlX, ctrlY + off, tipX, tipY + off, t1);
          if (pass === 0) {
            ctx.strokeStyle = skinTip;
            ctx.lineWidth = w0;
          } else {
            // Quantise the taper into four flat tones (Terraria sprites do not
            // blend shades): lit edge, top, mid flank, dark tip.
            ctx.strokeStyle = t0 < 0.22 ? skinLit : t0 < 0.45 ? skinTop
              : t0 < 0.82 ? skinMid : skinTip;
            ctx.lineWidth = w0 * 0.72;
          }
          ctx.beginPath(); ctx.moveTo(p0.x, p0.y); ctx.lineTo(p1.x, p1.y); ctx.stroke();
        }
      }
      // Rim-light along the leading edge.
      const rimPrev = ctx.globalAlpha;
      ctx.globalAlpha = rimPrev * 0.5;
      ctx.strokeStyle = rimColor;
      ctx.lineWidth = Math.max(1.5, baseW * 0.28);
      ctx.beginPath(); ctx.moveTo(bx, by); ctx.quadraticCurveTo(ctrlX, ctrlY, tipX, tipY); ctx.stroke();
      ctx.globalAlpha = rimPrev;
      // Suckers: pale ovals perpendicular to the limb, denser toward the tip,
      // each stamped with a one-pixel dark rim so they read as drawn-on.
      if (suckers) {
        for (const tt of [0.30, 0.42, 0.54, 0.66, 0.78, 0.88, 0.95]) {
          const pt = qPoint(bx, by, ctrlX, ctrlY, tipX, tipY, tt);
          const r = 2.8 * (1 - tt) + 1.0;
          ctx.fillStyle = suckerColor;
          ctx.beginPath(); ctx.ellipse(pt.x, pt.y, r, r * 0.72, tt * 1.7, 0, Math.PI * 2); ctx.fill();
          ctx.strokeStyle = 'rgba(26, 3, 8, 0.55)';
          ctx.lineWidth = 1;
          ctx.stroke();
        }
      }
    };`);

// ---- D. tentacle + arm loops react to the lash ---------------------------
apply('tentacle + arm loops',
  `    // Two colossal feeding tentacles FIRST (behind the arms): they curl out and
    // up like striking serpents, the kraken's signature silhouette.
    for (const side of [-1, 1]) {
      const bx = cx + side * this.width * 0.10;
      const sway = Math.sin(t * 0.6 + (side > 0 ? 0 : Math.PI)) * (30 + this.phase * 10);
      const reach = this.height * 1.25;
      const tipX = bx + side * (150 + Math.abs(sway));
      const tipY = mouthY + reach * 0.55 + Math.cos(t * 0.5 + side) * 30 - 40;
      const ctrlX = bx + side * (90 + sway);
      const ctrlY = mouthY + reach * 0.55;
      limb(bx, mouthY + 4, ctrlX, ctrlY, tipX, tipY, 20, reach, true, side);
    }
    // Eight shorter arms fanned in a crown around the mouth, arcing down.
    for (let i = 0; i < 8; i++) {
      const f = i / 7;                                    // 0..1 across the crown
      const bx = x + this.width * (0.12 + 0.76 * f);
      const outward = (f - 0.5) * 165;                    // outer arms reach wider
      const sway = Math.sin(t * 0.9 + i * 1.2) * (16 + this.phase * 6);
      const reach = this.height * (0.55 + 0.32 * Math.sin(i * 2.1)); // varied lengths
      const tipX = bx + outward + sway;
      const tipY = mouthY + reach;
      const ctrlX = bx + outward * 0.3 + sway * 0.5;
      const ctrlY = mouthY + reach * 0.6;
      limb(bx, mouthY, ctrlX, ctrlY, tipX, tipY, 12, reach, true, (f - 0.5) * 2);
    }`,
  `    // Two colossal feeding tentacles FIRST (behind the arms): they curl out and
    // up like striking serpents, the kraken's signature silhouette. On a lash
    // they punch straight out toward the player's side, hard and fast.
    for (const side of [-1, 1]) {
      const bx = cx + side * this.width * 0.10;
      const sway = Math.sin(t * 0.6 + (side > 0 ? 0 : Math.PI)) * (30 + this.phase * 10);
      const reach = this.height * 1.25;
      // The lash throws the two long arms forward on the facing side; the far
      // arm whips across the body. lash drives the extra extension.
      const punch = lash * (side === this.faceDir ? 1 : 0.45);
      const tipX = bx + side * (150 + Math.abs(sway)) + this.faceDir * punch * 150;
      const tipY = mouthY + reach * 0.55 + Math.cos(t * 0.5 + side) * 30 - 40 - punch * 60;
      const ctrlX = bx + side * (90 + sway) + this.faceDir * punch * 90;
      const ctrlY = mouthY + reach * 0.55 - punch * 40;
      limb(bx, mouthY + 4, ctrlX, ctrlY, tipX, tipY, 20, reach, true, side);
    }
    // Eight shorter arms fanned in a crown around the mouth, arcing down. On a
    // lash each arm stretches toward its own splay angle, clawing outward.
    for (let i = 0; i < 8; i++) {
      const f = i / 7;                                    // 0..1 across the crown
      const bx = x + this.width * (0.12 + 0.76 * f);
      const outward = (f - 0.5) * 165;                    // outer arms reach wider
      const sway = Math.sin(t * 0.9 + i * 1.2) * (16 + this.phase * 6);
      const reach = this.height * (0.55 + 0.32 * Math.sin(i * 2.1)); // varied lengths
      // Every arm reaches further and fans wider during the strike.
      const punch = lash * (0.5 + 0.5 * Math.sin(i * 2.1));
      const tipX = bx + outward + sway + Math.sign(outward || 1) * punch * 70;
      const tipY = mouthY + reach + punch * 40;
      const ctrlX = bx + outward * 0.3 + sway * 0.5;
      const ctrlY = mouthY + reach * 0.6;
      limb(bx, mouthY, ctrlX, ctrlY, tipX, tipY, 12, reach, true, (f - 0.5) * 2);
    }`);

// ---- E. mantle hard outline ----------------------------------------------
apply('mantle outline',
  `    ctx.bezierCurveTo(crownX - mantleRx, skirtY - this.height * 0.16,
      crownX - mantleRx * 0.95, crownY + this.height * 0.16,
      crownX, crownY);
    ctx.closePath();
    ctx.fill();`,
  `    ctx.bezierCurveTo(crownX - mantleRx, skirtY - this.height * 0.16,
      crownX - mantleRx * 0.95, crownY + this.height * 0.16,
      crownX, crownY);
    ctx.closePath();
    ctx.fill();
    // Hard near-black silhouette outline -- the Terraria cut-out edge that
    // stops the mantle from dissolving into the water.
    ctx.strokeStyle = '#1a0308';
    ctx.lineWidth = 5;
    ctx.stroke();
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.lineWidth = 1.5;
    ctx.stroke();`);

// ---- F. head hard outline ------------------------------------------------
apply('head outline',
  `    ctx.fillStyle = headGrad;
    ctx.beginPath();
    ctx.ellipse(cx, headY, headRx, headRy, 0, 0, Math.PI * 2);
    ctx.fill();


    // ---- Terminal mantle fins:`,
  `    ctx.fillStyle = headGrad;
    ctx.beginPath();
    ctx.ellipse(cx, headY, headRx, headRy, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#1a0308';
    ctx.lineWidth = 4;
    ctx.stroke();


    // ---- Terminal mantle fins:`);

// ---- G. at the end of render, reset save() (already there) ---------------
if (EOL === '\r\n') src = src.replace(/\n/g, '\r\n');
fs.writeFileSync(FILE, src, 'utf8');
console.log('\nPATCH 2 APPLIED to ' + FILE);
