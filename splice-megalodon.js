// splice-megalodon.js — replace the Kraken class in ocean.js with the new
// Megalodon class from new-megalodon.js. Finds `class Kraken {` and the
// window.OceanLeviathan = Kraken; line by text anchor (robust to drift).
const fs = require('fs');
const lines = fs.readFileSync('ocean.js', 'utf8').split(/\r?\n/);
const start = lines.findIndex(l => l.startsWith('class Kraken {'));
const end = lines.findIndex(l => l.startsWith('window.OceanLeviathan = Kraken;'));
if (start < 0 || end < 0 || end < start) {
  console.error('anchors not found: start=' + start + ' end=' + end);
  process.exit(1);
}
const block = fs.readFileSync('new-megalodon.js', 'utf8').split(/\r?\n/);
// Drop the trailing blank lines from the block before splicing.
while (block.length && block[block.length - 1].trim() === '') block.pop();
lines.splice(start, end - start + 1, ...block);
fs.writeFileSync('ocean.js', lines.join('\n'));
console.log('spliced lines ' + (start + 1) + '..' + (end + 1) + ' -> ' + block.length + ' lines');
