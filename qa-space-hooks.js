// Quick presence probe for the space-dimension integration hooks.
const fs = require('fs');
const t = fs.readFileSync('terraria.js', 'utf8');
const html = fs.readFileSync('terraria.html', 'utf8');
const css = fs.readFileSync('terraria.css', 'utf8');
const probes = {
  'teraria.js renderSpaceBackground': /renderSpaceBackground\(ctx/.test(t),
  'terraria.js isInSpace guard count': (t.match(/isInSpace\(\)/g) || []).length,
  'terraria.js renderTelegraph': /renderTelegraph\(/.test(t),
  'terraria.js wormhole render': /this\.wormhole\.render\(/.test(t),
  'terraria.js screen overlay': /renderScreenOverlay\(/.test(t),
  'terraria.js updateWormhole call': /this\.updateWormhole\(dt\)/.test(t),
  'terraria.js persistTiles': /persistTiles\(\)/.test(t),
  'terraria.js persistWalls': /persistWalls\(\)/.test(t),
  'terraria.js dragon defeat': /defeatedDragon/.test(t),
  'terraria.js onDragonDefeated call': /this\.onDragonDefeated\(\)/.test(t),
  'terraria.js save dragonHP': /dragonHP:/.test(t),
  'terraria.js load dragonHP': /save\.dragonHP/.test(t),
  'terraria.js mote dragon': /kind === 'dragon'/.test(t),
  'html dimension badge': /id="dimension-badge"/.test(html),
  // Script tags carry cache-busters plus onerror/onload probes, so match the src
  // prefix — a bare `src="space.js"` never matched and reported a false failure.
  'html space.js script': /<script[^>]*src="space\.js\?v=\d+"/.test(html),
  'html badge before space': html.search(/id="dimension-badge"/) < html.search(/<script[^>]*src="space\.js/),
  'css dimension-badge': /\.dimension-badge/.test(css),
  'script order space<terraria': html.search(/<script[^>]*src="space\.js/) < html.search(/<script[^>]*src="terraria\.js/),
  // app.py builds the single-file build the Streamlit app ships. If space.js ever
  // drops out of GAME_SCRIPTS the deployed game dies on World.isInSpace.
  'app.py ships space.js': /"space\.js"/.test(fs.readFileSync('app.py', 'utf8'))
};
let bad = 0;
for (const [k, v] of Object.entries(probes)) {
  // Some probes report a count instead of a boolean; any hit at all is a pass.
  const good = v === true || (typeof v === 'number' && v >= 1);
  if (!good) bad++;
  console.log((good ? 'OK   ' : 'CHECK ') + k +
    (good ? (typeof v === 'number' ? ' (' + v + ')' : '') : ' -> ' + v));
}
// No process.exit() here: with stdout piped, console.log is still in flight and
// exiting would truncate the report. Nothing keeps the loop alive in this file.
process.exitCode = bad ? 1 : 0;
