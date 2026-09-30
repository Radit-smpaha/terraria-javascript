// Reproduces the Streamlit embed pipeline from app.py WITHOUT needing Streamlit
// installed: inline terraria.css + every GAME_SCRIPT into terraria.html exactly
// the way build_inline_html() does, write the result to a file, and print it.
//
// Usage: node qa-inline-build.js [outFile]
//   default outFile: terraria.inlined.html
//
// Feed the output to qa-loadcheck.js to see whether the inlined document still
// defines every class:
//   node qa-loadcheck.js . terraria.inlined.html
const fs = require('fs');
const path = require('path');

const BASE = __dirname;
const OUT = path.join(BASE, process.argv[2] || 'terraria.inlined.html');

// Must match app.py GAME_SCRIPTS exactly.
const GAME_SCRIPTS = [
  'audio.js', 'particles.js', 'world.js', 'weather.js', 'entities.js',
  'underworld.js', 'space.js', 'juice.js', 'npcs.js', 'journey.js', 'terraria.js'
];

let html = fs.readFileSync(path.join(BASE, 'terraria.html'), 'utf8');
const css = fs.readFileSync(path.join(BASE, 'terraria.css'), 'utf8');

html = html.replace(/<link[^>]*terraria\.css[^>]*>/,
  '<style>\n/* inlined terraria.css */\n' + css + '\n</style>');

for (const name of GAME_SCRIPTS) {
  let js = fs.readFileSync(path.join(BASE, name), 'utf8');
  // Same escaping rule as app.py: a literal "</script" ends the block.
  js = js.replace(/<\/script/gi, '<\\/script');
  const pattern = new RegExp('<script\\s+src="' + name.replace(/\./g, '\\.') +
    '(\\?v=[^"]*)?"[^>]*>\\s*</script>');
  if (!pattern.test(html)) {
    console.log('MISSING script tag for ' + name + ' in terraria.html');
    process.exit(1);
  }
  html = html.replace(pattern, '<script>\n/* inlined ' + name + ' */\n' + js + '\n</script>');
}

fs.writeFileSync(OUT, html);
console.log('wrote ' + OUT + ' (' + html.length + ' chars)');