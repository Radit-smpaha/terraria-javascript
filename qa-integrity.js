// Quick regression checks: item integrity + music structure.
const fs = require('fs');
const vm = require('vm');

global.window = global;
global.document = { readyState: 'complete', getElementById: () => null, addEventListener() {} };
const ctx = vm.createContext(global);

// Only the data portion of terraria.js (ITEMS/tuning/recipes), not the Game class.
const terr = fs.readFileSync('terraria.js', 'utf8').split('class Game')[0];
vm.runInContext(fs.readFileSync('world.js', 'utf8'), ctx, { filename: 'world.js' });
vm.runInContext(fs.readFileSync('juice.js', 'utf8'), ctx, { filename: 'juice.js' });
vm.runInContext(terr, ctx, { filename: 'terraria-items' });
// Top-level const in a vm context isn't a global property — export explicitly.
vm.runInContext('window.ITEMS = ITEMS; window.RECIPES = RECIPES;', ctx);
const ITEMS = vm.runInContext('ITEMS', ctx);

let fail = 0;
const bad = Object.values(ITEMS).filter(i => !i.icon || !i.name || !i.type);
if (bad.length) { console.log('FAIL items missing icon/name/type:', bad.map(b => b.id || JSON.stringify(b)).join(', ')); fail = 1; }
else console.log('OK: all ' + Object.keys(ITEMS).length + ' items have icon + name + type');

const pick = ITEMS.copper_pickaxe;
console.log('copper_pickaxe ->', pick.icon, '|', pick.name, '|', pick.type, '| useTime', pick.useTime);
const sword = ITEMS.copper_sword;
console.log('copper_sword ->', sword.icon, '|', sword.name, '|', sword.type, '| damage', sword.damage, '| useTime', sword.useTime);
console.log('bomb ->', ITEMS.bomb.icon, '| useTime', ITEMS.bomb.useTime);

// Tuning survived the merge?
const tunedOk = ['copper_pickaxe', 'starlight_bow', 'diamond_blade'].every(id => ITEMS[id].useTime > 0);
if (!tunedOk) { console.log('FAIL: tuning lost'); fail = 1; } else console.log('OK: balance tuning merged in');

// Music structure
const audio = fs.readFileSync('audio.js', 'utf8');
const need = ['DAY_PROGS', 'NIGHT_PROGS', 'ARP', 'BOSS_RIFF', 'seq.gap', 'C, Em, Dm, G', 'startAmbientMusic'];
const missing = need.filter(n => !audio.includes(n));
if (missing.length) { console.log('FAIL music missing:', missing.join(', ')); fail = 1; }
else console.log('OK: Minecraft-style chord engine present (fixed progressions + arpeggios + gaps)');
if (audio.includes('rollPhrase')) { console.log('FAIL: random walk still present'); fail = 1; }

console.log(fail ? 'VALIDATION FAILED' : 'ALL VALIDATION PASSED');
process.exit(fail);
