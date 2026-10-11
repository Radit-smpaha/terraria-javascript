// Confirms the new main menu is actually live in the pushed GitHub files
// (not just present in the local working copy).
const https = require('https');

const BASE = 'https://raw.githubusercontent.com/Radit-smpaha/terraria-javascript/main/';
const get = (f) => new Promise((resolve, reject) => {
  https.get(BASE + f, (res) => {
    let d = '';
    res.on('data', (c) => { d += c; });
    res.on('end', () => resolve(d));
  }).on('error', reject);
});

(async () => {
  const [html, css, js] = await Promise.all([
    get('terraria.html'), get('terraria.css'), get('terraria.js')
  ]);

  let bad = 0;
  const t = (name, ok) => {
    if (!ok) bad++;
    console.log((ok ? 'OK    ' : 'MISS  ') + name + '   (' + (html.length + css.length + js.length) + ' chars fetched)');
  };

  t('html: title screen section', html.includes('id="title-screen"'));
  t('html: Terracraft logo', /<h1>Terracraft<\/h1>/.test(html));
  t('html: only Singleplayer / Multiplayer / Credits',
    /Singleplayer/.test(html) && /Multiplayer/.test(html) && /Credits/.test(html));
  t('html: "( Coming soon! )" note', html.includes('( Coming soon! )'));
  t('html: Multiplayer is disabled', /title-button-disabled"[^>]*\sdisabled/.test(html));
  t('html: 3-slot world picker', html.includes('id="title-world-list"') && html.includes('id="title-worlds"'));
  for (const who of ['Terraria', 'Minecraft', 'FISH (Ano)', 'Mikey (Radit)', 'Cline', 'Codegpt', 'Ghaniyy', 'Rasheed']) {
    t('html: credits ' + who, html.includes('>' + who + '<'));
  }
  t('css: world card styles', css.includes('.title-world-card'));
  t('css: rare splash style', css.includes('.title-splash-rare'));
  t('css: Terraria warm palette is shipped',
    css.includes('--terra-panel') && css.includes('--terra-gold') && css.includes('--terra-bevel'));
  t('css: menu items use a hard pixel outline, not a soft shadow',
    /\.title-button \{[^}]*text-shadow: var\(--px-outline\)/.test(css));
  t('css: selected menu item gets a sweeping gold underline',
    /\.title-button::after \{/.test(css) && css.includes('plate-shine'));
  t('css: in-game HUD + panels share the palette',
    /\.top-left-panel \{[^}]*--terra-panel/.test(css) &&
    /\.hotbar-slot \{[^}]*--terra-bevel/.test(css) &&
    /\.modal-content \{[^}]*--terra-panel/.test(css));
  t('html: splash is anchored inside .title-logo',
    /<div class="title-logo">[\s\S]*?<h1>Terracraft<\/h1>[\s\S]*?id="title-splash"[\s\S]*?<\/div>/.test(html));
  t('css: .title-logo is the positioning context', /\.title-logo \{ position: relative/.test(css));
  t('css: splash wraps instead of running off-screen',
    /\.title-splash \{[^}]*white-space: normal/.test(css));
  t('css: splash sits just past the logo edge', /\.title-splash \{[^}]*left: calc\(100% \+ 12px\)/.test(css));
  t('css: ( Coming soon! ) note is close on the RIGHT of Multiplayer',
    /\.coming-soon \{[^}]*left: calc\(100% \+ 10px\)/.test(css) &&
    !/\.coming-soon \{[^}]*width: 160px/.test(css) &&
    !/\.coming-soon \{[^}]*right: calc\(100%/.test(css));
  t('js: world list renderer', js.includes('renderTitleWorlds'));
  t('js: world switcher', js.includes('startTitleWorld'));
  t('js: rare splash string', js.includes('Shoutout to Terraria!'));
  t('js: animated scene (palette + stars)', js.includes('blendPalette') && js.includes('shootingStar'));
  t('js: exit-save guard', js.includes('suppressExitSave'));

  console.log('\n' + (bad ? bad + ' CHECK(S) MISSING ON GITHUB' : 'RESULT: the new main menu is live on GitHub'));
  process.exit(bad ? 1 : 0);
})();