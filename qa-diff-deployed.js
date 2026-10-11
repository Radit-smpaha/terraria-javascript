// Compares the deployed (GitHub) copy of each game script against the local
// one, normalizing line endings so only real content differences show.
const fs = require('fs');
const path = require('path');

const SCRIPTS = ['audio.js', 'particles.js', 'world.js', 'weather.js', 'entities.js',
  'underworld.js', 'space.js', 'juice.js', 'npcs.js', 'journey.js', 'terraria.js'];

const deployedDoc = fs.readFileSync('qa-deployed-srcdoc.html', 'utf8');

for (const name of SCRIPTS) {
  const marker = '/* inlined ' + name + ' */';
  const start = deployedDoc.indexOf(marker);
  if (start < 0) { console.log(name + ': MARKER MISSING'); continue; }
  const end = deployedDoc.indexOf('</script>', start);
  const deployed = deployedDoc.slice(start + marker.length, end)
    .replace(/<\\\/script/gi, '</script').replace(/\r\n/g, '\n').trim();
  const local = fs.readFileSync(path.join('.', name), 'utf8')
    .replace(/\r\n/g, '\n').trim();

  if (deployed === local) { console.log(name + ': IDENTICAL'); continue; }

  // Character-level first divergence.
  let i = 0;
  while (i < Math.min(deployed.length, local.length) && deployed[i] === local[i]) i++;
  const shorter = deployed.length < local.length ? 'DEPLOYED' : 'LOCAL';
  console.log(name + ': DIFFERS  deployed=' + deployed.length + ' local=' + local.length +
    '  first diff at char ' + i + '  (' + shorter + ' file is shorter)');
  if (deployed.length < local.length) {
    console.log('   deployed tail:      ' + JSON.stringify(deployed.slice(-80)));
    console.log('   local continues:    ' + JSON.stringify(local.slice(i, i + 120)));
  } else {
    console.log('   local tail:         ' + JSON.stringify(local.slice(-80)));
    console.log('   deployed continues: ' + JSON.stringify(deployed.slice(i, i + 120)));
  }
}