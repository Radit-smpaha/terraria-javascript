// Builds terraria.inlined.html from the ROOT game sources — the same pipeline
// app.py's build_inline_html() uses. The Streamlit app embeds the inlined file
// from GitHub Pages, so this build is what players actually run.
const fs = require('fs');
const path = require('path');
const BASE = __dirname;

// Must match app.py GAME_SCRIPTS exactly.
const GAME_SCRIPTS = [
  'audio.js', 'particles.js', 'world.js', 'weather.js', 'entities.js',
  'underworld.js', 'space.js', 'ocean.js', 'juice.js', 'npcs.js',
  'journey.js', 'multiplayer.js', 'terraria.js'
];

let html = fs.readFileSync(path.join(BASE, 'terraria.html'), 'utf8');
const css = fs.readFileSync(path.join(BASE, 'terraria.css'), 'utf8');

html = html.replace(/<link[^>]*terraria\.css[^>]*>/,
  '<style>\n/* inlined terraria.css */\n' + css + '\n</style>');

for (const name of GAME_SCRIPTS) {
  let js = fs.readFileSync(path.join(BASE, name), 'utf8');
  js = js.replace(/<\/script/gi, '<\\/script');
  const pattern = new RegExp('<script\\s+src="' + name.replace(/\./g, '\\.') +
    '(\\?v=[^"]*)?"[^>]*>\\s*</script>');
  if (!pattern.test(html)) {
    console.log('MISSING script tag for ' + name);
    process.exit(1);
  }
  html = html.replace(pattern, '<script>\n/* inlined ' + name + ' */\n' + js + '\n</script>');
}

fs.writeFileSync(path.join(BASE, 'terraria.inlined.html'), html);
console.log('wrote terraria.inlined.html (' + html.length + ' chars)');
