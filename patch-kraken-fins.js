// Patch 7: polish — swept-back squid fins (not bow-ears) and eyes seated a
// touch lower on the head so the face reads as a kraken, not an owl.
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

// Fins: sweep them DOWN-and-out along the upper mantle flanks like a giant
// squid's terminal fins, instead of splaying up like a pair of ears.
apply('terminal fins',
  `    for (const side of [-1, 1]) {
      const finX = cx + side * shoulderW * 0.18;
      const finY = apexY + this.height * 0.05;
      const flap = Math.sin(t * 1.4 + (side > 0 ? 0 : Math.PI)) * 6;
      ctx.globalAlpha = ctx.globalAlpha * (flash ? 0.9 : 0.8);
      ctx.fillStyle = flash ? '#ffffff'
        : this.phase === 3 ? '#b91c1c' : this.phase === 2 ? '#e11d48' : '#fb7185';
      ctx.beginPath();
      ctx.moveTo(finX, finY);
      const notches = 4;
      for (let n = 1; n <= notches; n++) {
        const nn = n / notches;
        const ex = finX + side * (74 * nn);
        const ey = finY - 18 + flap + Math.sin(t * 2 + n + side) * 5;
        const midx = finX + side * (74 * (nn - 0.5 / notches));
        const midy = finY - 4 + flap * 0.5 + (n % 2 ? 9 : -6);
        ctx.lineTo(midx, midy); ctx.lineTo(ex, ey);
      }
      ctx.quadraticCurveTo(finX + side * 38, finY + 20 + flap * 0.5, finX, finY + 16);
      ctx.closePath(); ctx.fill();
      ctx.strokeStyle = ink; ctx.lineWidth = 2.5; ctx.stroke();
      ctx.globalAlpha = hiddenNow ? Math.max(0.12, this.hideAlpha) : 1;
    }`,
  `    // Two terminal fins sweep down-and-out along the upper flanks: the wide
    // arrowhead silhouette a giant squid wears at the tip of its mantle. Drawn
    // BEHIND the mantle by placing them at the apex and letting the cone's own
    // outline sit over their roots.
    for (const side of [-1, 1]) {
      const rootX = cx + side * shoulderW * 0.10;
      const rootY = apexY + this.height * 0.02;
      const flap = Math.sin(t * 1.4 + (side > 0 ? 0 : Math.PI)) * 5;
      ctx.globalAlpha = ctx.globalAlpha * (flash ? 0.9 : 0.82);
      ctx.fillStyle = flash ? '#ffffff'
        : this.phase === 3 ? '#b91c1c' : this.phase === 2 ? '#e11d48' : '#fb7185';
      ctx.beginPath();
      ctx.moveTo(rootX, rootY);
      // Upper trailing edge, sweeping outward and slightly down.
      ctx.quadraticCurveTo(rootX + side * 46, rootY - 6 + flap,
        rootX + side * 96, rootY + 24 + flap);
      // Tattered lower edge with a couple of torn notches.
      ctx.lineTo(rootX + side * 70, rootY + 40 + flap * 0.4);
      ctx.lineTo(rootX + side * 78, rootY + 52 + flap * 0.3);
      ctx.lineTo(rootX + side * 54, rootY + 48 + flap * 0.3);
      ctx.lineTo(rootX + side * 40, rootY + 60);
      // Back to the mantle along the lower flank.
      ctx.quadraticCurveTo(rootX + side * 22, rootY + 44, rootX, rootY + 26);
      ctx.closePath(); ctx.fill();
      ctx.strokeStyle = ink; ctx.lineWidth = 2.5; ctx.stroke();
      ctx.globalAlpha = hiddenNow ? Math.max(0.12, this.hideAlpha) : 1;
    }`);

// Eyes: drop them a little so they sit on the head, and pull them closer.
apply('eye seating',
  `    const eye = this.headTargets()[0];
    const ex = eye.x - camera.x + (this.sway || 0);
    const ey = eye.y - camera.y + (this.bob || 0);`,
  `    const eye = this.headTargets()[0];
    const ex = eye.x - camera.x + (this.sway || 0);
    // Seat the eyes lower, on the head just above the arm crown, so the glowing
    // weakpoint reads as a face rather than two orbs floating on top.
    const ey = eye.y - camera.y + (this.bob || 0) + this.height * 0.02;`);

if (EOL === '\r\n') src = src.replace(/\n/g, '\r\n');
fs.writeFileSync(FILE, src, 'utf8');
console.log('\nFINS + EYES PATCH APPLIED');
