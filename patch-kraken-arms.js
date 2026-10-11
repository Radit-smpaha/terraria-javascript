// Patch 10: the arm crown was splaying UPWARD (a starfish/starburst) because
// the angle sweep covered the upper half-circle. Kraken arms hang and curl
// DOWN and outward. Sweep the lower half, vary the lengths, and add a
// downward curl so the crown reads as ten tentacles reaching for the deep.
const fs = require('fs');
const path = require('path');
const FILE = path.join(__dirname, 'ocean.js');
let src = fs.readFileSync(FILE, 'utf8');
const EOL = src.includes('\r\n') ? '\r\n' : '\n';
src = src.replace(/\r\n/g, '\n');
function apply(label, oldText, newText) {
  oldText = oldText.replace(/\r\n/g, '\n');
  newText = newText.replace(/\r\n/g, '\n');
  if (src.indexOf(oldText) === -1) throw new Error('PATCH FAILED: ' + label);
  src = src.replace(oldText, newText);
  console.log('  ok  ' + label);
}

apply('arm crown faces down',
  `    for (let i = 0; i < 8; i++) {
      const f = i / 7;
      // Spread from straight-left, under the body, to straight-right.
      const ang = Math.PI * (0.10 + 0.80 * f);
      const reach = this.height * (0.52 + 0.22 * Math.sin(i * 2.1));
      const sway = Math.sin(t * 0.9 + i * 1.2) * (14 + this.phase * 5);
      const punch = lash * (0.4 + 0.6 * Math.sin(i * 2.1));
      const bx = cx + Math.cos(ang) * (collarW * 0.8);
      const tipX = cx + Math.cos(ang) * (reach * 0.95 + punch * 60) + sway;
      const tipY = limbRootY + Math.abs(Math.sin(ang)) * (reach * 0.85) + punch * 30;
      // Curl: control point pushed outward and up so the arm bows then hooks.
      const ctrlX = bx + Math.cos(ang) * (reach * 0.30) + sway * 0.5;
      const ctrlY = limbRootY + Math.abs(Math.sin(ang)) * (reach * 0.30);
      limb(bx, limbRootY, ctrlX, ctrlY, tipX, tipY, 13);
    }`,
  `    for (let i = 0; i < 8; i++) {
      const f = i / 7;
      // Sweep the LOWER half-circle: arms hang down and fan outward like a
      // kraken's crown. (An upper-half sweep is what made the last version
      // look like a starfish with its arms in the air.)
      const ang = Math.PI * (0.06 + 0.88 * f);   // 0 = right, PI = left, under
      const dirX = Math.cos(ang);
      const dirY = Math.sin(ang);                 // 0..1, always downward-ish
      // Varied lengths so the crown is not a tidy star: the middle arms float
      // shorter, the outer pairs reach longest.
      const reach = this.height * (0.40 + 0.30 * Math.abs(Math.cos(ang * 1.5)));
      const sway = Math.sin(t * 0.9 + i * 1.2) * (14 + this.phase * 5);
      const punch = lash * (0.4 + 0.6 * Math.abs(dirX));
      const bx = cx + dirX * (collarW * 0.8);
      const tipX = cx + dirX * (reach * 0.95 + punch * 70) + sway;
      const tipY = limbRootY + dirY * (reach * 0.9) + punch * 30;
      // Curl DOWN: the control point is pushed low and wide so each arm bows
      // outward then hooks toward the seabed, like a limb feeling for prey.
      const ctrlX = bx + dirX * (reach * 0.55) + sway * 0.5;
      const ctrlY = limbRootY + dirY * (reach * 0.25) + reach * 0.30;
      limb(bx, limbRootY, ctrlX, ctrlY, tipX, tipY, 13);
    }`);

if (EOL === '\r\n') src = src.replace(/\n/g, '\r\n');
fs.writeFileSync(FILE, src, 'utf8');
console.log('\nARM-CROWN PATCH APPLIED');
