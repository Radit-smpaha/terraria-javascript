// One-shot repair: space.js was assembled with line-based inserts that landed
// one line above EOF, so each new block displaced the previous tail to the end
// of the file. This script cuts the fragments out by line range and re-inserts
// each one at its unique anchor, then verifies the result parses with node.
const fs = require('fs');
const { execFileSync } = require('child_process');

const P = 'space.js';
const src = fs.readFileSync(P, 'utf8');
const EOL = src.includes('\r\n') ? '\r\n' : '\n';
const A = (s) => s.split('\n').join(EOL);   // anchors are written with \n in this script
const lines = src.split(/\r\n|\n/);
const cut = (a, b) => lines.slice(a - 1, b);

// ---- fragments, by their current line ranges ----
const F = {
  arenaTail1: cut(267, 274),   // start of generateSpaceArena's tail
  teleTail:   cut(2315, 2367), // renderTelegraph tail + dragon class close
  exports:    cut(2369, 2377),
  stray:      cut(2379, 2379),
  spawnTail:  cut(2381, 2383),
  projTail:   cut(2385, 2389),
  tileTail:   cut(2391, 2395),
  lightTail:  cut(2397, 2402),
  starTail:   cut(2404, 2427),
  arenaTail2: cut(2429, 2440)
};

// ---- drop the two displaced regions: 267-274 and 2314-2440 ----
const kept = lines.slice(0, 266).concat(lines.slice(274, 2313)).concat(lines.slice(2440));
let out = kept.join(EOL);

const insertAfter = (text, anchor, frag) => {
  const at = text.indexOf(A(anchor));
  if (at === -1) throw new Error('anchor missing: ' + JSON.stringify(anchor.slice(0, 60)));
  const end = at + A(anchor).length;
  return text.slice(0, end) + EOL + frag.join(EOL) + text.slice(end);
};
const insertBefore = (text, anchor, frag) => {
  const at = text.indexOf(A(anchor));
  if (at === -1) throw new Error('anchor missing: ' + JSON.stringify(anchor.slice(0, 60)));
  return text.slice(0, at) + frag.join(EOL) + EOL + text.slice(at);
};

// 1. generateSpaceArena's tail returns home, just before enterSpaceDimension's doc block.
out = insertBefore(out, "/**\n * Swap the world's tile buffers for the arena's.",
  F.arenaTail1.concat(F.arenaTail2));
// 2. the starfield loop goes back into the star layer list.
out = insertAfter(out, "    { factor: 0.08, count: 260, size: 1, alpha: 0.5 },", F.starTail);
// 3. renderLighting's entity loop tail.
out = insertBefore(out, '/** Bloom pass: rune bricks, crystals, meteors and the rift gate all bleed light. */',
  F.lightTail);
// 4. drawTileGraphic's default case.
out = insertAfter(out, "      ctx.fillRect(sx + 18, sy + 1, 3, 3);\n      break;", F.tileTail);
// 5. the projectile update wrapper's detonation branch.
out = insertAfter(out, '  // Meteors detonate instead of winking out when they hit the arena.', F.projTail);
// 6. spawnSpaceProjectile's tail.
out = insertAfter(out, '  p.lightColor = lightColor;', F.spawnTail);
// 7. renderTelegraph's tail and the dragon's class close.
out = insertAfter(out, '          : tg.x) - camera.x;', F.teleTail);
// 8. the exports block belongs at the very end.
out = out.replace(/\s*$/, EOL) + F.exports.join(EOL) + EOL;
// 9. the orphaned brace closes SkeletonMinion; it was pushed out of place by the
//    insert that added the dragon class below it.
out = insertBefore(out, '// ============================================================\n// 6. SKELETON DRAGON, THE OSSUARY SOVEREIGN', F.stray);

// ---- verify against the real parser before touching the file ----
function parses(code) {
  const tmp = 'space.check.tmp.js';
  fs.writeFileSync(tmp, code);
  try {
    execFileSync(process.execPath, ['--check', tmp], { stdio: 'pipe' });
    return true;
  } catch (_) {
    return false;
  } finally {
    fs.unlinkSync(tmp);
  }
}

if (!parses(out)) {
  console.log('REASSEMBLED FILE DOES NOT PARSE - manual repair needed');
  fs.writeFileSync('space.broken.js', out);
  process.exit(1);
}
fs.writeFileSync(P, out);
const outLines = out.split(/\r\n|\n/).length;
console.log('reassembled space.js: ' + outLines + ' lines, parses cleanly');
