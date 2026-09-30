// Structural audit of space.js: after the reassembly we need to be sure every
// top-level block survived exactly once, and that the brace depth returns to
// zero at the end of the file (a lost closing brace is what broke it before).
const fs = require('fs');
const src = fs.readFileSync(process.argv[2] || 'space.js', 'utf8').replace(/\r\n/g, '\n');
const lines = src.split('\n');

// --- 1. top-level declarations, with duplicates flagged -------------------
const decls = new Map();
lines.forEach((line, i) => {
  const m = line.match(/^(?:const|let|var|class|function)\s+([A-Za-z_$][\w$]*)/);
  if (!m) return;
  if (!decls.has(m[1])) decls.set(m[1], []);
  decls.get(m[1]).push(i + 1);
});
const dupes = [...decls].filter(([, at]) => at.length > 1);

// --- 2. brace depth walk (string/comment aware enough for this file) ------
let depth = 0;
let inBlockComment = false;
const classDepths = [];
for (let i = 0; i < lines.length; i++) {
  let line = lines[i];
  if (inBlockComment) {
    const end = line.indexOf('*/');
    if (end === -1) continue;
    inBlockComment = false;
    line = line.slice(end + 2);
  }
  // strip block comments that open and close on this line, then line comments
  line = line.replace(/\/\*[\s\S]*?\*\//g, '');
  const commentStart = line.indexOf('//');
  if (commentStart !== -1) line = line.slice(0, commentStart);
  line = line.replace(/"(?:[^"\\]|\\.)*"/g, '""').replace(/'(?:[^'\\]|\\.)*'/g, "''")
    .replace(/`(?:[^`\\]|\\.)*`/g, '``');
  const opens = (line.match(/\{/g) || []).length;
  const closes = (line.match(/\}/g) || []).length;
  const before = depth;
  depth += opens - closes;
  if (/^class\s+/.test(lines[i])) classDepths.push({ name: lines[i].trim(), openLine: i + 1, before });
  if (depth < 0) console.log('!! negative depth at line ' + (i + 1));
  const blockOpen = line.indexOf('/*');
  if (blockOpen !== -1 && line.indexOf('*/', blockOpen) === -1) inBlockComment = true;
}

console.log('lines: ' + lines.length + ' | top-level declarations: ' + decls.size);
console.log('final brace depth: ' + depth + (depth === 0 ? '  (balanced)' : '  ** UNBALANCED **'));
console.log('duplicate declarations: ' + (dupes.length ? JSON.stringify(dupes) : 'none'));
console.log('\nclasses:');
for (const c of classDepths) console.log('  L' + String(c.openLine).padStart(5) + '  depth ' + c.before + '  ' + c.name);

const wanted = ['SPACE_TILE_IDS', 'enterSpaceDimension', 'exitSpaceDimension', 'renderSpaceBackground',
  'SkeletonMinion', 'SkeletonDragonBoss', 'WormholeFX', 'renderTelegraph', 'spawnSpaceProjectile',
  'SPACE_PROJECTILE_TYPES', 'persistTiles', 'persistWalls', 'inArena', 'isInSpace'];
console.log('\nrequired symbols:');
for (const w of wanted) {
  const at = src.includes(w) ? 'present' : '** MISSING **';
  console.log('  ' + w.padEnd(24) + at);
}
const failed = depth !== 0 || dupes.length > 0 || wanted.some(w => !src.includes(w));
console.log(failed ? '\nSPACE.JS STRUCTURE: FAIL' : '\nSPACE.JS STRUCTURE: OK');
process.exit(failed ? 1 : 0);
