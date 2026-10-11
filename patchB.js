// ===== PATCH B: islets as elevated flat floating plateaus ==================
const fs = require('fs');
const FILE = 'ocean.js';
let src = fs.readFileSync(FILE, 'utf8');
const EOL = src.includes('\r\n') ? '\r\n' : '\n';
src = src.replace(/\r\n/g, '\n');
let applied = 0;
function apply(label, oldText, newText) {
  oldText = oldText.replace(/\r\n/g, '\n');
  newText = newText.replace(/\r\n/g, '\n');
  if (src.indexOf(oldText) === -1) throw new Error('NOT FOUND: ' + label);
  src = src.replace(oldText, newText);
  applied++;
  console.log('  ok  ' + label);
}

// Wide flat islets instead of thin spikes. halfWidth now 5-8 tiles (a walkable
// table), and the crown rises 3-5 tiles above the waterline.
apply('islet plateau shape',
  `      islets.push({ cx, halfWidth: 2 + Math.floor(Math.random() * 4),
        height: 2 + Math.floor(Math.random() * 4), islet: true });
    }
  }
  // A generous independent scatter fills the open water between the rows above
  // so no stretch of sea is ever featureless.
  for (let attempt = 0; attempt < this.width; attempt++) {
    const cx = margin + Math.floor(Math.random() * usable);
    if (islands.some(o => Math.abs(o.cx - cx) < 16)) continue;
    if (islets.some(o => Math.abs(o.cx - cx) < isletSpacing)) continue;
    islets.push({ cx, halfWidth: 1 + Math.floor(Math.random() * 3),
      height: 2 + Math.floor(Math.random() * 3), islet: true });
    if (islets.length >= 90) break;
  }`,
  `      // A wide, flat, elevated shoal: 5-8 tiles of walkable table that rises
      // 3-5 tiles above the waterline, floating on the sea like a sand bar
      // rather than a thin spike spearing up from the deep.
      islets.push({ cx, halfWidth: 5 + Math.floor(Math.random() * 4),
        height: 3 + Math.floor(Math.random() * 3), islet: true, flat: true });
    }
  }
  // A generous independent scatter fills the open water between the rows above
  // so no stretch of sea is ever featureless. These free-floating shoals are
  // the same flat-table shape.
  for (let attempt = 0; attempt < this.width; attempt++) {
    const cx = margin + Math.floor(Math.random() * usable);
    if (islands.some(o => Math.abs(o.cx - cx) < 16)) continue;
    if (islets.some(o => Math.abs(o.cx - cx) < isletSpacing)) continue;
    islets.push({ cx, halfWidth: 4 + Math.floor(Math.random() * 4),
      height: 3 + Math.floor(Math.random() * 3), islet: true, flat: true });
    if (islets.length >= 70) break;
  }`);

if (EOL === '\r\n') src = src.replace(/\n/g, '\r\n');
fs.writeFileSync(FILE, src, 'utf8');
console.log('\nPATCH B APPLIED (' + applied + ' edits)');
