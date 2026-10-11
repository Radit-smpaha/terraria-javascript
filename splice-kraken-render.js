// splice-kraken-render.js — replace the Kraken's render() in ocean.js with the
// rebuilt Terraria-styled version from kraken-render-v2.js. Finds the method by
// brace-depth (robust to line-number drift) and swaps it verbatim.
const fs = require('fs');
const renderLines = require('./kraken-render-v2.js');
const newBody = renderLines.join('\n');

const path = 'ocean.js';
const src = fs.readFileSync(path, 'utf8');
const lines = src.split('\n').map(l => l.replace(/\r$/, ''));

// Locate the Kraken render(): the LAST `  render(ctx, camera) {` in the file
// (the class has one; other classes' renders are earlier).
let start = -1;
for (let i = 0; i < lines.length; i++) {
  if (/^  render\(ctx, camera\) \{\r?$/.test(lines[i])) start = i;
}
if (start < 0) { console.error('could not find render(ctx, camera) {'); process.exit(1); }

// Find its closing brace by brace depth.
let depth = 0, end = -1, started = false;
for (let i = start; i < lines.length; i++) {
  for (const ch of lines[i]) { if (ch === '{') { depth++; started = true; } else if (ch === '}') depth--; }
  if (started && depth === 0) { end = i; break; }
}
if (end < 0) { console.error('could not find render() closing brace'); process.exit(1); }

console.log('replacing render() at lines ' + (start + 1) + '..' + (end + 1) + ' (' + (end - start + 1) + ' lines) with ' + renderLines.length + ' new lines');

// Preserve the file's line-ending style (CRLF here).
const eol = src.includes('\r\n') ? '\r\n' : '\n';
const rebuilt = lines.slice(0, start).concat(newBody.split('\n')).concat(lines.slice(end + 1));
fs.writeFileSync(path, rebuilt.join(eol));
console.log('ocean.js rewritten.');
