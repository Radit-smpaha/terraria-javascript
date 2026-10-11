// Patch 13: the eye hit-node sat at 0.24 of the height (up in the mantle),
// while the head is drawn at 0.60. Move the eye DOWN onto the head and spread
// the body nodes over the new tall-mantle proportions, so the art and the
// hittable weakpoint agree.
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

apply('eye + body hit nodes',
  `    const cx = this.x + this.width * 0.5 + this.sway + this.lean * 40;
    const bob = this.bob + Math.sin(this.animT * 2) * 4;
    return [
      { x: cx, y: this.y + 60 + bob, r: 30, head: true, eye: true, index: 0 },
      { x: cx - 78, y: this.y + 96 + bob * 0.6, r: 46, body: true, index: 1 },
      { x: cx + 78, y: this.y + 96 + bob * 0.6, r: 46, body: true, index: 2 },
      { x: cx, y: this.y + 138 + bob * 0.3, r: 54, body: true, index: 3 }
    ];`,
  `    // Node heights are keyed to the render's own geometry: the head (and the
    // glowing eye) at 0.60 of the height, and two armoured mantle nodes up the
    // tall cone at 0.30 and 0.18, plus one low body node at the crown of arms.
    const cx = this.x + this.width * 0.5 + this.sway + this.lean * 40;
    const bob = this.bob + Math.sin(this.animT * 2) * 4;
    return [
      { x: cx, y: this.y + this.height * 0.60 + bob, r: 30, head: true, eye: true, index: 0 },
      { x: cx - 46, y: this.y + this.height * 0.30 + bob * 0.6, r: 46, body: true, index: 1 },
      { x: cx + 46, y: this.y + this.height * 0.30 + bob * 0.6, r: 46, body: true, index: 2 },
      { x: cx, y: this.y + this.height * 0.76 + bob * 0.3, r: 54, body: true, index: 3 }
    ];`);

if (EOL === '\r\n') src = src.replace(/\n/g, '\r\n');
fs.writeFileSync(FILE, src, 'utf8');
console.log('\nHIT-NODE PATCH APPLIED');
