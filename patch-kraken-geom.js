// Patch 6: tune the kraken geometry so the mantle is unmistakably a TALL
// narrow tapering cone (apex up, eyes low), killing the wide-dome read.
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

apply('geometry constants',
  `    const apexY = y + this.height * 0.06;
    const shoulderY = y + this.height * 0.34;
    const headY = y + this.height * 0.56;
    const mouthY = y + this.height * 0.66;
    const halfW = this.width * 0.5;
    const shoulderW = this.width * 0.30;   // mantle half-width at the shoulder
    const collarW = this.width * 0.17;     // mantle half-width at the head`,
  `    const apexY = y + this.height * 0.02;       // pointed tip of the mantle
    const shoulderY = y + this.height * 0.30;   // widest point of the cone
    const headY = y + this.height * 0.60;       // head/eyes, low above the arms
    const mouthY = y + this.height * 0.70;      // beak, centre of the arm crown
    // The mantle is deliberately NARROW: at 0.20 of the body width the cone is
    // clearly taller than it is wide, which is the whole difference between a
    // kraken and a jellyfish bell. The shoulder flares only gently and the
    // collar tucks back in toward the head.
    const shoulderW = this.width * 0.20;   // mantle half-width at the shoulder
    const collarW = this.width * 0.13;     // mantle half-width at the head`);

// A taller, more pointed cone: the bezier keeps the flanks tight up top and
// only blooms near the shoulder.
apply('mantle cone bezier',
  `    ctx.moveTo(cx, apexY);                                        // pointed apex
    ctx.bezierCurveTo(cx + shoulderW * 0.35, apexY + this.height * 0.10,
      cx + shoulderW * 0.95, shoulderY - this.height * 0.08,
      cx + shoulderW, shoulderY);                                 // R flank
    ctx.bezierCurveTo(cx + shoulderW * 0.85, shoulderY + this.height * 0.14,
      cx + collarW * 1.15, headY - this.height * 0.02,
      cx + collarW, headY);                                       // R collar
    ctx.quadraticCurveTo(cx, headY + this.height * 0.05,
      cx - collarW, headY);                                       // under-head
    ctx.bezierCurveTo(cx - collarW * 1.15, headY - this.height * 0.02,
      cx - shoulderW * 0.85, shoulderY + this.height * 0.14,
      cx - shoulderW, shoulderY);                                 // L collar
    ctx.bezierCurveTo(cx - shoulderW * 0.95, shoulderY - this.height * 0.08,
      cx - shoulderW * 0.35, apexY + this.height * 0.10,
      cx, apexY);                                                 // back to apex`,
  `    ctx.moveTo(cx, apexY);                                        // pointed apex
    ctx.bezierCurveTo(cx + shoulderW * 0.22, apexY + this.height * 0.12,
      cx + shoulderW * 0.78, shoulderY - this.height * 0.06,
      cx + shoulderW, shoulderY);                                 // R flank
    ctx.bezierCurveTo(cx + shoulderW * 0.80, shoulderY + this.height * 0.16,
      cx + collarW * 1.20, headY - this.height * 0.06,
      cx + collarW, headY);                                       // R collar
    ctx.quadraticCurveTo(cx, headY + this.height * 0.05,
      cx - collarW, headY);                                       // under-head
    ctx.bezierCurveTo(cx - collarW * 1.20, headY - this.height * 0.06,
      cx - shoulderW * 0.80, shoulderY + this.height * 0.16,
      cx - shoulderW, shoulderY);                                 // L collar
    ctx.bezierCurveTo(cx - shoulderW * 0.78, shoulderY - this.height * 0.06,
      cx - shoulderW * 0.22, apexY + this.height * 0.12,
      cx, apexY);                                                 // back to apex`);

// Long feeding tentacles reach down past the mouth now that mouthY moved.
apply('feeding tentacle root',
  `      const tipY = limbRootY - 70 + Math.cos(t * 0.5 + side) * 26 - punch * 40;`,
  `      const tipY = limbRootY - 96 + Math.cos(t * 0.5 + side) * 26 - punch * 40;`);

if (EOL === '\r\n') src = src.replace(/\n/g, '\r\n');
fs.writeFileSync(FILE, src, 'utf8');
console.log('\nGEOMETRY PATCH APPLIED');
