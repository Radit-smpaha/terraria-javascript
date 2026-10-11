// Patch 4: fix the Kraken SILHOUETTE so it reads as a tall mythological
// kraken, not a flat mushroom cap. Makes the mantle a tall tapering cone,
// thickens the arm crown, and fans the limbs so all ten are visible.
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

// ---- A. Mantle: tall tapering cone, not a wide bell ----------------------
apply('mantle proportions',
  `    const mantleRx = this.width * 0.40;          // half-width at the widest skirt
    const crownX = cx;
    const crownY = y + this.height * 0.04;       // rounded top of the mantle
    const skirtY = y + this.height * 0.56;       // widest point / where head begins`,
  `    // A kraken mantle is TALLER than it is wide \u2014 a tapering cone that narrows
    // to a pointed crown. The old 0.40 half-width was nearly as wide as the
    // body was tall, which is why it read as a mushroom cap; a tighter waist
    // and a higher crown give it the true cephalopod profile.
    const mantleRx = this.width * 0.30;          // half-width at the widest skirt
    const crownX = cx;
    const crownY = y + this.height * 0.02;       // pointed top of the mantle
    const skirtY = y + this.height * 0.58;       // widest point / where head begins`);

// ---- B. Thicken the eight arms and fan them wider ------------------------
apply('arm crown',
  `    // Eight shorter arms fanned in a crown around the mouth, arcing down. On a
    // lash each arm stretches toward its own splay angle, clawing outward.
    for (let i = 0; i < 8; i++) {
      const f = i / 7;                                    // 0..1 across the crown
      const bx = x + this.width * (0.12 + 0.76 * f);
      const outward = (f - 0.5) * 165;                    // outer arms reach wider`,
  `    // Eight shorter arms fanned in a crown around the mouth, arcing down. On a
    // lash each arm stretches toward its own splay angle, clawing outward. Each
    // arm is drawn against its own angular slot so a wide, even crown of eight
    // separate limbs is always visible instead of a few overlapping strokes.
    for (let i = 0; i < 8; i++) {
      const f = i / 7;                                    // 0..1 across the crown
      const bx = x + this.width * (0.18 + 0.64 * f);
      const outward = (f - 0.5) * 220;                    // outer arms reach wider`);

// ---- C. Thicken limbs (base widths) --------------------------------------
apply('limb widths',
  `      limb(bx, mouthY + 4, ctrlX, ctrlY, tipX, tipY, 20, reach, true, side);`,
  `      limb(bx, mouthY + 4, ctrlX, ctrlY, tipX, tipY, 26, reach, true, side);`);
apply('arm widths',
  `      limb(bx, mouthY, ctrlX, ctrlY, tipX, tipY, 12, reach, true, (f - 0.5) * 2);`,
  `      limb(bx, mouthY, ctrlX, ctrlY, tipX, tipY, 15, reach, true, (f - 0.5) * 2);`);

if (EOL === '\r\n') src = src.replace(/\n/g, '\r\n');
fs.writeFileSync(FILE, src, 'utf8');
console.log('\nSILHOUETTE PATCH APPLIED to ' + FILE);
