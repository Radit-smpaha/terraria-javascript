// Patch 12: the two fins were standing straight up off the apex like rabbit
// ears. A giant squid's terminal fins are LOW, WIDE and hug the mantle flanks,
// sweeping back and down. Pin them to the upper flanks and lay them flat.
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

apply('low flat fins',
  `    for (const side of [-1, 1]) {
      // Root the fin partway down the apex so it hugs the upper flank and
      // sweeps DOWNWARD (a squid fin trails along the mantle, it does not
      // stand up like an ear). The whole shape leans out and down.
      const rootX = cx + side * shoulderW * 0.16;
      const rootY = apexY + this.height * 0.06;
      const flap = Math.sin(t * 1.4 + (side > 0 ? 0 : Math.PI)) * 5;
      ctx.globalAlpha = ctx.globalAlpha * (flash ? 0.9 : 0.82);
      ctx.fillStyle = flash ? '#ffffff'
        : this.phase === 3 ? '#b91c1c' : this.phase === 2 ? '#e11d48' : '#fb7185';
      ctx.beginPath();
      ctx.moveTo(rootX, rootY);
      // Leading edge sweeps out and DOWN alongside the cone.
      ctx.quadraticCurveTo(rootX + side * 40, rootY + 10 + flap,
        rootX + side * 74, rootY + 58 + flap * 0.6);
      // Tattered trailing edge with torn notches, trailing up the flank.
      ctx.lineTo(rootX + side * 54, rootY + 74 + flap * 0.4);
      ctx.lineTo(rootX + side * 58, rootY + 88 + flap * 0.3);
      ctx.lineTo(rootX + side * 34, rootY + 78 + flap * 0.3);
      ctx.lineTo(rootX + side * 22, rootY + 92);
      // Back to the mantle low on the flank.
      ctx.quadraticCurveTo(rootX + side * 6, rootY + 60, rootX, rootY + 34);
      ctx.closePath(); ctx.fill();
      ctx.strokeStyle = ink; ctx.lineWidth = 2.5; ctx.stroke();
      ctx.globalAlpha = hiddenNow ? Math.max(0.12, this.hideAlpha) : 1;
    }`,
  `    // Two low, wide fins laid flat along the upper flanks: the classic squid
    // arrowhead. They are rooted partway DOWN the mantle (never at the tip, or
    // they read as ears) and sweep outward and down, hugging the cone.
    for (const side of [-1, 1]) {
      const rootX = cx + side * shoulderW * 0.34;
      const rootY = apexY + this.height * 0.12;
      const flap = Math.sin(t * 1.4 + (side > 0 ? 0 : Math.PI)) * 4;
      ctx.globalAlpha = ctx.globalAlpha * (flash ? 0.92 : 0.86);
      ctx.fillStyle = flash ? '#ffffff'
        : this.phase === 3 ? '#b91c1c' : this.phase === 2 ? '#e11d48' : '#fb7185';
      ctx.beginPath();
      ctx.moveTo(rootX, rootY);
      // Leading edge: out and gently down, staying close to the mantle.
      ctx.quadraticCurveTo(rootX + side * 34, rootY + 4 + flap,
        rootX + side * 62, rootY + 30 + flap * 0.5);
      // Trailing edge: a soft scallop back to the flank.
      ctx.quadraticCurveTo(rootX + side * 50, rootY + 46, rootX + side * 30, rootY + 50);
      ctx.quadraticCurveTo(rootX + side * 14, rootY + 40, rootX, rootY + 26);
      ctx.closePath(); ctx.fill();
      ctx.strokeStyle = ink; ctx.lineWidth = 2.5; ctx.stroke();
      ctx.globalAlpha = hiddenNow ? Math.max(0.12, this.hideAlpha) : 1;
    }`);

if (EOL === '\r\n') src = src.replace(/\n/g, '\r\n');
fs.writeFileSync(FILE, src, 'utf8');
console.log('\nFLAT-FINS PATCH APPLIED');
