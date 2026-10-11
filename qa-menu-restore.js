// Confirms the appended restore block is byte-identical to the approved menu
// CSS in backup-ui-20261003-025118, so the menu really is back to how the
// user liked it - and that the in-game skin was left alone.
const fs = require('fs');
const path = require('path');

const base = __dirname;
const cur = fs.readFileSync(path.join(base, 'terraria.css'), 'utf8');
const old = fs.readFileSync(path.join(base, 'backup-ui-20261003-025118', 'terraria.css'), 'utf8');

const norm = (s) => s.replace(/\r\n/g, '\n');

// The whole approved menu block: from its banner to the end of that file.
const oldBanner = old.indexOf('   MAIN TITLE SCREEN');
const want = norm(old.slice(old.lastIndexOf('/* ===', oldBanner))).trim();

// The block we appended: from our banner to just before the undo section.
const marker = '   MAIN MENU - restored to the approved version';
const start = cur.indexOf(marker);
const headerStart = cur.lastIndexOf('/* ===', start);
const end = cur.indexOf('/* ---- Undo the menu-only bits');
const got = norm(cur.slice(headerStart, end)).trim();

// The banner comment is our own label, not a rule, so compare from the first
// selector/keyword line onward.
const stripBanner = (s) => {
  const lines = s.split('\n');
  const i = lines.findIndex((l) => /^[.@]/.test(l.trim()));
  return lines.slice(i).join('\n').trim();
};

console.log('menu rules identical to approved backup:',
  stripBanner(want) === stripBanner(got));
if (stripBanner(want) !== stripBanner(got)) {
  const a = stripBanner(want).split('\n');
  const b = stripBanner(got).split('\n');
  for (let i = 0; i < Math.max(a.length, b.length); i++) {
    if (a[i] !== b[i]) {
      console.log('first difference at rule line', i);
      console.log('  approved:', JSON.stringify(a[i]));
      console.log('  current :', JSON.stringify(b[i]));
      break;
    }
  }
}

// The in-game skin must have survived untouched.
const keep = [
  ['tan hotbar frames', 'border-color: #b0a17c'],
  ['big hearts', 'filter: drop-shadow(0 1px 0 #4a0b0b)'],
  ['dirt panel texture', 'repeating-linear-gradient(45deg'],
  ['hunger bar id fix', '#hunger-bar.hunger-fill'],
  ['plaque neutralised', '.title-menu::before { content: none; }'],
  ['menu stroke neutralised', '-webkit-text-stroke: 0;']
];
for (const [label, needle] of keep) {
  console.log((cur.includes(needle) ? '  ok      ' : '  MISSING ') + label);
}