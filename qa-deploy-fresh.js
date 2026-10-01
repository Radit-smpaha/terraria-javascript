// qa-deploy-fresh.js — is GitHub (and therefore Streamlit) actually up to date?
//
// Streamlit Community Cloud serves the files in the connected branch, so a
// "nothing changed" deploy almost always means the new files never reached
// that branch — not that Streamlit failed to rebuild. This asks GitHub for the
// raw files and asserts the space-dimension + dragon-wing markers are present.
//
//   node qa-deploy-fresh.js            (checks branch 'main')
//   node qa-deploy-fresh.js my-branch
//
// Needs network access; exits 1 when the deploy is stale and lists the fix.
const REPO = 'Radit-smpaha/terraria-javascript';
const branch = process.argv[2] || 'main';
const raw = (f) =>
  `https://raw.githubusercontent.com/${REPO}/${branch}/${encodeURIComponent(f)}`;

// Every file Streamlit needs to inline the game (see app.py GAME_SCRIPTS).
const REQUIRED = [
  'app.py',
  'terraria.html',
  'terraria.css',
  'requirements.txt',
  'audio.js',
  'particles.js',
  'world.js',
  'weather.js',
  'entities.js',
  'underworld.js',
  'juice.js',
  'npcs.js',
  'journey.js',
  'space.js',
  'terraria.js',
];

// marker: [file, substring that must exist, human description]
const MARKERS = [
  ['space.js', 'SkeletonDragonBoss', 'the Ossuary Sovereign boss'],
  ['terraria.html', 'space.js', 'terraria.html loads the space module'],
  ['app.py', '"space.js"', 'app.py inlines space.js into the Streamlit page'],
  ['terraria.js', 'enterSpaceDimension', 'the wormhole dimension plumbing'],
  ['terraria.js', 'dragon_wings', 'the Sovereign drops Dragon Wings'],
  ['terraria.js', 'equippedAccessoryId', 'the accessory slot (wings) saves/loads'],
  ['terraria.html', 'wings-chip', 'the flight HUD chip'],
  ['entities.js', 'hasWings', 'wing flight physics'],
  ['entities.js', 'flightFuel', 'the flight fuel tank'],
  ['juice.js', 'grantsFlight', 'the Flight line in the wings tooltip'],
  // ---- The Ossuary rework -------------------------------------------------
  // Every one of these is a marker for a bug that was fixed, so a GitHub Pages
  // / Streamlit cache that serves an older space.js or entities.js gets caught
  // rather than looking like "it still gets stuck in rocks".
  ['space.js', 'maxHp = 88000', 'the nerfed 88,000 HP Sovereign'],
  ['space.js', 'nearestHitTarget', 'body hits, and the 8% tax they pay'],
  ['space.js', 'bodyDamageScale', 'the skull still hurts more than the spine'],
  ['space.js', 'blocksDragon', 'the dragon no longer wedges in arena rock'],
  ['space.js', 'unstick(dt, world)', 'the anti-stuck glide + recovery'],
  ['space.js', '_paintSpaceLive', 'the live twinkling space backdrop'],
  ['space.js', 'const lattice', 'the six-tier star platform lattice'],
  ['entities.js', 'setWings', 'per-item flight tanks (30s / 3 minutes)'],
  ['entities.js', 'flightCooldown', 'the wing cooldown'],
  ['entities.js', 'DEFAULT_WING_COOLDOWN', 'a spent tank always arms its cooldown'],
  ['terraria.js', 'angel_wings', 'craftable Angel Wings (30s flight / 30s cooldown)'],
  ['terraria.js', 'dragonSlain', 'a killed Sovereign stays dead'],
  ['terraria.js', 'performBoneRite', 'the Rite of Bones is the only way back in'],
  ['terraria.js', 'ossuary_armor', 'Skeletal Wyrmplate, the new apex plate'],
  ['terraria.js', 'ossuary_blade', "Sovereign's Fang, the new apex blade"],
  ['terraria.js', 'flightTime: 180', 'Dragon Wings hold three minutes'],
  ['terraria.js', 'regenLock', 'regen stops for 4s after a hit'],
  ['terraria.js', 'rite_of_bones', 'the Rite of Bones recipe'],
  ['juice.js', 'dragonRite', 'the rite tooltip that says where to read it'],
  ['space.js', 'MINION_CAP', 'the bone legion capped at 9 across every summon'],
  // ---- Chest storage -------------------------------------------------------
  ['terraria.html', 'chest-grid', 'the chest storage panel grid'],
  ['terraria.html', 'chest-inv-grid', 'the bag mirror inside the chest panel'],
  ['terraria.js', 'openChestUI', 'chests open their own storage panel'],
  ['terraria.js', 'spillChestContents', 'breaking a chest spills its contents'],
  ['terraria.js', 'chestQuickDeposit', 'the quick deposit / take all buttons'],
  ["terraria.js", "name: 'Chest'", 'the craftable chest recipe'],
  ["world.js", "id: 'chest', count: 1", 'the chest tile drops itself when mined'],
];

const fails = [];
const files = new Map();

(async () => {
  for (const name of REQUIRED) {
    try {
      const res = await fetch(raw(name), { cache: 'no-store' });
      if (!res.ok) {
        fails.push(`${name}: HTTP ${res.status} — the file is not on ${branch}`);
        continue;
      }
      files.set(name, await res.text());
    } catch (error) {
      fails.push(`${name}: fetch failed (${error.message})`);
    }
  }

  for (const [name, needle, what] of MARKERS) {
    const body = files.get(name);
    if (body === undefined) continue; // already reported as missing
    if (!body.includes(needle)) {
      fails.push(`${name}: no "${needle}" — missing ${what}`);
    }
  }

  const present = [...files.keys()];
  console.log(`GitHub ${REPO}@${branch} — ${present.length}/${REQUIRED.length} game files present`);
  for (const name of REQUIRED) {
    console.log(`  ${files.has(name) ? 'present' : 'MISSING'}  ${name}` +
      (files.has(name) ? `  (${files.get(name).length} chars)` : ''));
  }
  console.log('\nContent checks:');
  for (const [name, needle, what] of MARKERS) {
    if (!files.has(name)) continue;
    const ok = files.get(name).includes(needle);
    console.log(`  ${ok ? 'OK  ' : 'FAIL'}  ${what}`);
  }

  if (!fails.length) {
    console.log('\nDEPLOY IS FRESH — Streamlit is serving the current build.');
    console.log('If the page still looks old: Streamlit menu (top right) -> Reboot app,');
    console.log('then hard-refresh the tab (Ctrl+Shift+R).');
    process.exit(0);
  }

  console.log('\nSTALE DEPLOY — GitHub is missing this:');
  for (const f of fails) console.log('  - ' + f);
  console.log(`\nFix: copy these files into ${REPO}@${branch} (the branch Streamlit is connected to):`);
  console.log('  ' + [...new Set(fails.map((f) => f.split(':')[0]))].join(', '));
  console.log('then Streamlit -> Settings -> Reboot app.');
  process.exit(1);
})();
