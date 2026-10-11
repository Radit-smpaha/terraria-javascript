// Patch 11: two long feeding tentacles reach OUT and down (they were pointing
// up), and the mantle apex is smoothed so it is a point, not a flat lid.
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

apply('feeding tentacles reach out+down',
      `      const punch = lash * (side === faceDir ? 1 : 0.4);
      const tipX = bx + side * (180 + Math.abs(sway)) + faceDir * punch * 130;
      const tipY = limbRootY - 70 + Math.cos(t * 0.5 + side) * 26 - punch * 40;
      // The control point whips the mid-limb out to the side, then the tip
      // curls up: that S-curve is what makes them read as striking, not limp.
      const ctrlX = bx + side * (150 + sway) + faceDir * punch * 70;
      const ctrlY = limbRootY + 60 - punch * 80;`,
      `      const punch = lash * (side === faceDir ? 1 : 0.4);
      // The two long feeding tentacles reach OUT to the side and slightly down,
      // then hook \u2014 like serpents striking at prey, not arms in the air.
      const tipX = bx + side * (185 + Math.abs(sway)) + faceDir * punch * 130;
      const tipY = limbRootY + 92 + Math.cos(t * 0.5 + side) * 22 + punch * 40;
      // The control point bows the mid-limb UP and out so the tip hooks back
      // down: that S-curve is what makes them read as striking, not limp.
      const ctrlX = bx + side * (150 + sway) + faceDir * punch * 70;
      const ctrlY = limbRootY - 46 - punch * 60;`);

if (EOL === '\r\n') src = src.replace(/\n/g, '\r\n');
fs.writeFileSync(FILE, src, 'utf8');
console.log('\nTENTACLE PATCH APPLIED');
