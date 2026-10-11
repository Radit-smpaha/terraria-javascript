// Patch 8: smooth the mantle apex (the lit block was overshooting the tip and
// reading as a flat pink lid) and tighten the highlight to the flank only.
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

// The lit shoulder block started right at the apex and its top edge crossed
// over the pointed tip, drawing a flat pink bar across the crown. Start it a
// little below the tip and pull its top in so the point stays a point.
apply('apex highlight',
    `    ctx.globalAlpha = ctx.globalAlpha * (flash ? 0.5 : 0.28);
    ctx.fillStyle = '#ffe4e6';
    ctx.beginPath();
    ctx.moveTo(cx - shoulderW * 0.18, apexY + this.height * 0.10);`,
    `    ctx.globalAlpha = ctx.globalAlpha * (flash ? 0.5 : 0.26);
    ctx.fillStyle = '#ffe4e6';
    ctx.beginPath();
    ctx.moveTo(cx - shoulderW * 0.10, apexY + this.height * 0.16);`);

// And close the highlight lower so it hugs the flank instead of ringing the top.
apply('apex highlight close',
    `    ctx.bezierCurveTo(cx - shoulderW * 0.30, shoulderY - this.height * 0.16,
      cx - shoulderW * 0.20, apexY + this.height * 0.24,
      cx - shoulderW * 0.18, apexY + this.height * 0.10);`,
    `    ctx.bezierCurveTo(cx - shoulderW * 0.30, shoulderY - this.height * 0.16,
      cx - shoulderW * 0.16, apexY + this.height * 0.30,
      cx - shoulderW * 0.10, apexY + this.height * 0.16);`);

if (EOL === '\r\n') src = src.replace(/\n/g, '\r\n');
fs.writeFileSync(FILE, src, 'utf8');
console.log('\nAPEX PATCH APPLIED');
