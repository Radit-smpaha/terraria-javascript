// ============================================================================
// splice-mega-class.js -- install new-megalodon.js into ocean.js.
//
// The live game page loads ocean.js (terraria.html), and ocean.js carries a
// copy of the Megalodon class. new-megalodon.js is the canonical source, so
// every change is made there and then mirrored with this tool:
//   powershell -File tools/run-node.ps1 tools/splice-mega-class.js
//
// Anchors are text-only but brace-matched, so the replacement never depends on
// line numbers.
// ============================================================================
'use strict';
const fs = require('fs');

const ROOT = require('path').join(__dirname, '..');
process.chdir(ROOT);

const EOL = fs.readFileSync('ocean.js', 'utf8').includes('\r\n') ? '\r\n' : '\n';
const raw = fs.readFileSync('ocean.js', 'utf8').replace(/\r\n/g, '\n');
const lines = raw.split('\n');

const start = lines.findIndex(l => l.startsWith('class Megalodon {'));
const end = lines.findIndex(l => l.startsWith('window.OceanLeviathan = Megalodon;'));
if (start < 0 || end < 0 || end < start) {
  console.error('anchors not found: class=' + start + ' alias=' + end);
  process.exit(1);
}

const block = fs.readFileSync('new-megalodon.js', 'utf8').replace(/\r\n/g, '\n').split('\n');
while (block.length && block[block.length - 1].trim() === '') block.pop();

const before = lines.length;
lines.splice(start, end - start + 1, ...block);
fs.writeFileSync('ocean.js', lines.join('\n').replace(/\n/g, EOL));
console.log('spliced ocean.js ' + (start + 1) + '..' + (end + 1) +
  ' -> ' + block.length + ' lines (file ' + before + ' -> ' + lines.length + ')');
