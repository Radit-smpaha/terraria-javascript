// Patch 14: final fin pass -- tuck the terminal fins even lower and flatter on
// the flanks, so nothing at the crown reads as "ears". A giant squid's fins
// sit a third of the way down a long mantle, laid nearly flat along its sides.
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

apply('flatter lower fins',
  `    for (const side of [-1, 1]) {
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
    }`,
  `    // The two terminal fins sit about a third of the way down the mantle and
    // lie almost flat along its flanks -- low, wide, and trailing, exactly the
    // way a giant squid wears them. Rooted well below the apex so they can
    // never read as ears or horns.
    for (const side of [-1, 1]) {
      const rootX = cx + side * shoulderW * 0.42;
      const rootY = apexY + this.height * 0.20;
      const flap = Math.sin(t * 1.4 + (side > 0 ? 0 : Math.PI)) * 3;
      ctx.globalAlpha = ctx.globalAlpha * (flash ? 0.92 : 0.88);
      ctx.fillStyle = flash ? '#ffffff'
        : this.phase === 3 ? '#b91c1c' : this.phase === 2 ? '#e11d48' : '#fb7185';
      ctx.beginPath();
      ctx.moveTo(rootX, rootY - 16);
      // Leading edge: out and gently down, hugging the mantle's curve.
      ctx.quadraticCurveTo(rootX + side * 40, rootY - 6 + flap,
        rootX + side * 66, rootY + 18 + flap * 0.4);
      // Trailing edge: a shallow scallop back to the flank, low.
      ctx.quadraticCurveTo(rootX + side * 52, rootY + 34, rootX + side * 28, rootY + 36);
      ctx.quadraticCurveTo(rootX + side * 12, rootY + 24, rootX, rootY + 6);
      ctx.closePath(); ctx.fill();
      ctx.strokeStyle = ink; ctx.lineWidth = 2.5; ctx.stroke();
      ctx.globalAlpha = hiddenNow ? Math.max(0.12, this.hideAlpha) : 1;
    }`);

if (EOL === '\r\n') src = src.replace(/\n/g, '\r\n');
fs.writeFileSync(FILE, src, 'utf8');
console.log('\nFINAL FINS PATCH APPLIED');
