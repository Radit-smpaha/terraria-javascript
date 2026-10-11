// Patch 5: the real silhouette rebuild. The kraken read as a wide, flat
// mushroom cap with a fringe of thin arms. This makes the mantle a TALL,
// NARROW tapering cone (apex at top, widest at the head) and gives the eight
// arms a genuine radiating crown with heavy, separated, curling limbs.
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

// ---- A. Mantle: a tall tapering cone with a pointed apex -----------------
apply('mantle shape v2',
  `    // A kraken mantle is TALLER than it is wide \u2014 a tapering cone that narrows
    // to a pointed crown. The old 0.40 half-width was nearly as wide as the
    // body was tall, which is why it read as a mushroom cap; a tighter waist
    // and a higher crown give it the true cephalopod profile.
    const mantleRx = this.width * 0.30;          // half-width at the widest skirt
    const crownX = cx;
    const crownY = y + this.height * 0.02;       // pointed top of the mantle
    const skirtY = y + this.height * 0.58;       // widest point / where head begins`,
  `    // A kraken mantle is TALLER than it is wide: a tapering cone whose apex is
    // a rounded point at the very top and whose widest point is the shoulder
    // just above the head. Drawing it narrow (0.26 half-width) with a taller
    // span than it is wide is what finally stops it reading as a wide jellyfish
    // bell. The apex is a pointed bezier crown, not a flat cap.
    const mantleRx = this.width * 0.26;          // half-width at the widest shoulder
    const crownX = cx;
    const crownY = y + this.height * 0.015;      // pointed apex of the mantle
    const shoulderY = y + this.height * 0.30;    // widest point of the cone
    const skirtY = y + this.height * 0.58;       // where the head begins`);

// ---- B. Mantle body: rebuild the bezier as a real cone -------------------
apply('mantle bezier v2',
  `    ctx.fillStyle = mantleGrad;
    ctx.beginPath();
    // Start at the crown, sweep down the right flank bulging out to the skirt,
    // across the rounded skirt, and back up the left flank. Control points make
    // the shoulders slope in so the body tapers toward the top like a squid.
    ctx.moveTo(crownX, crownY);
    ctx.bezierCurveTo(crownX + mantleRx * 0.95, crownY + this.height * 0.16,
      crownX + mantleRx, skirtY - this.height * 0.16,
      crownX + mantleRx * 0.92, skirtY);
    ctx.quadraticCurveTo(crownX, skirtY + this.height * 0.10,
      crownX - mantleRx * 0.92, skirtY);
    ctx.bezierCurveTo(crownX - mantleRx, skirtY - this.height * 0.16,
      crownX - mantleRx * 0.95, crownY + this.height * 0.16,
      crownX, crownY);
    ctx.closePath();
    ctx.fill();`,
  `    ctx.fillStyle = mantleGrad;
    ctx.beginPath();
    // A true squid mantle: a long cone. From the pointed apex it flares down
    // the right flank to the widest shoulder, then tucks back in toward the
    // head collar, across the underside, and symmetrically back up the left.
    ctx.moveTo(crownX, crownY);                                   // apex
    ctx.bezierCurveTo(crownX + mantleRx * 0.55, crownY + this.height * 0.10,
      crownX + mantleRx * 0.95, shoulderY - this.height * 0.04,
      crownX + mantleRx, shoulderY);                              // R flank
    ctx.bezierCurveTo(crownX + mantleRx * 0.96, shoulderY + this.height * 0.14,
      crownX + mantleRx * 0.66, skirtY - this.height * 0.02,
      crownX + mantleRx * 0.52, skirtY);                          // R collar
    ctx.quadraticCurveTo(crownX, skirtY + this.height * 0.08,
      crownX - mantleRx * 0.52, skirtY);                          // underside
    ctx.bezierCurveTo(crownX - mantleRx * 0.66, skirtY - this.height * 0.02,
      crownX - mantleRx * 0.96, shoulderY + this.height * 0.14,
      crownX - mantleRx, shoulderY);                              // L collar
    ctx.bezierCurveTo(crownX - mantleRx * 0.95, shoulderY - this.height * 0.04,
      crownX - mantleRx * 0.55, crownY + this.height * 0.10,
      crownX, crownY);                                            // back to apex
    ctx.closePath();
    ctx.fill();`);

// ---- C. Under-mantle sheath: a narrow collar joining head to shoulders ----
apply('head collar',
  `    // ---- Head: a narrower rounded bulge at the base of the mantle ----
    // The eyes and beak live here, and the arms radiate from its mouth.
    const headRx = this.width * 0.30;
    const headRy = this.height * 0.13;
    const headY = skirtY + this.height * 0.06;`,
  `    // ---- Head: a narrower rounded bulge at the base of the mantle ----
    // The eyes and beak live here, and the arms radiate from its mouth. The
    // head is deliberately narrower than the mantle so the profile tapers:
    // apex -> broad shoulder -> tucked collar -> head -> arm crown.
    const headRx = this.width * 0.22;
    const headRy = this.height * 0.115;
    const headY = skirtY + this.height * 0.055;`);

// ---- D. Arm crown v2: heavy, separated, curling arms ---------------------
apply('arm crown v2',
  `    // Eight shorter arms fanned in a crown around the mouth, arcing down. On a
    // lash each arm stretches toward its own splay angle, clawing outward. Each
    // arm is drawn against its own angular slot so a wide, even crown of eight
    // separate limbs is always visible instead of a few overlapping strokes.
    for (let i = 0; i < 8; i++) {
      const f = i / 7;                                    // 0..1 across the crown
      const bx = x + this.width * (0.18 + 0.64 * f);
      const outward = (f - 0.5) * 220;                    // outer arms reach wider
      const sway = Math.sin(t * 0.9 + i * 1.2) * (16 + this.phase * 6);
      const reach = this.height * (0.55 + 0.32 * Math.sin(i * 2.1)); // varied lengths
      // Every arm reaches further and fans wider during the strike.
      const punch = lash * (0.5 + 0.5 * Math.sin(i * 2.1));
      const tipX = bx + outward + sway + Math.sign(outward || 1) * punch * 70;
      const tipY = mouthY + reach + punch * 40;
      const ctrlX = bx + outward * 0.3 + sway * 0.5;
      const ctrlY = mouthY + reach * 0.6;
      limb(bx, mouthY, ctrlX, ctrlY, tipX, tipY, 15, reach, true, (f - 0.5) * 2);
    }`,
  `    // Eight shorter arms fanned in a crown around the mouth. Each arm is given
    // its own angular slot on a full half-circle, and is drawn as a heavy,
    // curling limb that kinks at a control point partway down \u2014 so the crown
    // reads as eight separate arms clawing outward, not a straight fringe.
    const mouthGlobalY = y + this.height * 0.60;
    for (let i = 0; i < 8; i++) {
      const f = i / 7;                                    // 0..1 across the crown
      const angle = Math.PI * (0.18 + 0.64 * f);          // spread across the lower arc
      const reach = this.height * (0.62 + 0.26 * Math.sin(i * 2.1)); // varied lengths
      const sway = Math.sin(t * 0.9 + i * 1.2) * (16 + this.phase * 6);
      // Every arm reaches further and fans wider during the strike.
      const punch = lash * (0.5 + 0.5 * Math.sin(i * 2.1));
      const bx = cx + Math.cos(angle) * (this.width * 0.16);
      const tipX = cx + Math.cos(angle) * (reach * 0.9 + punch * 60) + sway;
      const tipY = mouthY + Math.sin(angle) * (reach * 0.75) + punch * 40;
      // Kink the arm so it curls: the control sits off the midpoint.
      const ctrlX = bx + Math.cos(angle) * (reach * 0.18) + sway * 0.5;
      const ctrlY = mouthY + Math.sin(angle) * (reach * 0.5);
      limb(bx, mouthY, ctrlX, ctrlY, tipX, tipY, 15, reach, true, angle - Math.PI / 2);
    }`);
apply('mouthY unused', `    const mouthY = y + this.height * 0.60;\n    const t = this.animT`, `    const mouthY = y + this.height * 0.60;\n    const t = this.animT`);

if (EOL === '\r\n') src = src.replace(/\n/g, '\r\n');
fs.writeFileSync(FILE, src, 'utf8');
console.log('\nSILHOUETTE v2 PATCH APPLIED to ' + FILE);
