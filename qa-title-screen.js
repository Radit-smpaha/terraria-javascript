// qa-title-screen.js - regression test for the Terracraft main menu.
//
// Covers the things that are easy to break and invisible until someone opens
// the page: the Terraria-styled buttons, the greyed-out Multiplayer row with
// its "( Coming soon! )" note, the credits entries, the rotating splash
// line (including the rare "Shoutout to Terraria!" pull), the animated
// background across a whole day/night cycle, and the three-save-file picker
// behind Singleplayer.
//
// Usage: node qa-title-screen.js [dir]
const fs = require('fs');
const vm = require('vm');
const path = require('path');

const dir = process.argv[2] || '.';
const SCRIPTS = [
  'audio.js', 'particles.js', 'world.js', 'weather.js', 'entities.js',
  'underworld.js', 'space.js', 'juice.js', 'npcs.js', 'journey.js', 'terraria.js'
];

const results = [];
function check(name, ok, detail) {
  results.push({ name, ok });
  console.log((ok ? '  PASS  ' : '  FAIL  ') + name + (detail ? '   [' + detail + ']' : ''));
}

// ---- Minimal DOM stub (qa-boot's, plus listeners + innerHTML clearing) ----
function makeCtx() {
  const noop = () => {};
  return new Proxy({
    canvas: { width: 1280, height: 720 },
    measureText: () => ({ width: 10 }),
    createLinearGradient: () => ({ addColorStop: noop }),
    createRadialGradient: () => ({ addColorStop: noop }),
    createPattern: () => null,
    getImageData: () => ({ data: new Uint8ClampedArray(4) }),
    save: noop, restore: noop
  }, {
    get: (t, k) => (k in t ? t[k] : noop),
    set: (t, k, v) => { t[k] = v; return true; }
  });
}

function makeEl(tag) {
  const el = {
    tagName: (tag || 'div').toUpperCase(),
    style: {}, dataset: {}, children: [], _classes: new Set(), _listeners: {},
    width: 1280, height: 720, clientWidth: 1280, clientHeight: 720,
    offsetWidth: 200, offsetHeight: 40, offsetParent: {}, hidden: false,
    className: '', disabled: false, type: '', textContent: '', value: '',
    classList: {
      add: (c) => el._classes.add(c),
      remove: (c) => el._classes.delete(c),
      contains: (c) => el._classes.has(c),
      toggle: (c, force) => {
        const want = force === undefined ? !el._classes.has(c) : !!force;
        if (want) el._classes.add(c); else el._classes.delete(c);
        return want;
      }
    },
    appendChild(c) { el.children.push(c); return c; },
    append(...cs) { for (const c of cs) el.children.push(c); },
    removeChild(c) { return c; },
    setAttribute() {}, getAttribute: () => null, removeAttribute() {}, remove() {},
    addEventListener(type, fn) { (el._listeners[type] = el._listeners[type] || []).push(fn); },
    removeEventListener() {},
    dispatch(type, event) { for (const fn of (el._listeners[type] || [])) fn(event || {}); },
    querySelector: () => null, querySelectorAll: () => [],
    getBoundingClientRect: () => ({ left: 0, top: 0, width: 1280, height: 720, right: 1280, bottom: 720 }),
    focus() {}, blur() {}, click() {}, scrollIntoView: () => {},
    getContext: () => makeCtx()
  };
  let inner = '';
  Object.defineProperty(el, 'innerHTML', {
    get: () => inner,
    set: (v) => { inner = v; if (v === '') el.children.length = 0; }
  });
  return el;
}

const elements = new Map();
const document = {
  readyState: 'complete',
  getElementById: (id) => {
    if (!elements.has(id)) elements.set(id, makeEl('div'));
    return elements.get(id);
  },
  createElement: (t) => makeEl(t),
  querySelector: () => null,
  querySelectorAll: () => [],
  addEventListener: () => {}, removeEventListener: () => {},
  body: makeEl('body'), documentElement: makeEl('html')
};

const store = new Map();
const localStorage = {
  getItem: (k) => (store.has(k) ? store.get(k) : null),
  setItem: (k, v) => { store.set(k, String(v)); },
  removeItem: (k) => { store.delete(k); },
  clear: () => store.clear()
};

const rafQueue = [];
const errors = [];
let reloads = 0;

const win = {
  console, document, localStorage,
  Math, JSON, Date, Object, Array, String, Number, Boolean, Error,
  Uint8ClampedArray, Uint8Array, Float32Array, Set, Map, Promise, Proxy, Reflect,
  isNaN, parseInt, parseFloat, isFinite,
  setTimeout: (fn) => { try { fn(); } catch (e) { errors.push(e); } return 0; },
  setInterval: () => 0, clearTimeout: () => {}, clearInterval: () => {},
  requestAnimationFrame: (fn) => { rafQueue.push(fn); return rafQueue.length; },
  cancelAnimationFrame: () => {},
  addEventListener: () => {}, removeEventListener: () => {},
  innerWidth: 1280, innerHeight: 720, devicePixelRatio: 1,
  location: { href: 'http://localhost/', search: '', hash: '', reload: () => { reloads += 1; } },
  navigator: { userAgent: 'node' },
  // Must share rAF's time origin (0 here): initTitleScreen stamps its splash
  // timer with performance.now() and compares it against the rAF timestamp.
  performance: { now: () => 0 },
  Audio: function () { return { play: () => {}, close: () => {} }; },
  AudioContext: function () { return { createOscillator: () => ({ connect() {}, start() {}, stop() {}, frequency: { value: 0 }, type: '' }), createGain: () => ({ connect() {}, gain: { value: 0 } }), createBuffer: () => ({ getChannelData: () => new Float32Array(1) }), createBufferSource: () => ({ connect() {}, start() {}, stop() {}, buffer: null, loop: false }), destination: {}, currentTime: 0, sampleRate: 44100, resume() {}, state: 'running' }; },
  Image: function () { return { src: '', onload: null, width: 0, height: 0 }; },
  OffscreenCanvas: function () { return { getContext: () => makeCtx(), width: 0, height: 0 }; }
};
win.window = win; win.self = win; win.globalThis = win;

const ctxv = vm.createContext(win);

console.log('=== title screen: ' + dir + ' ===');
for (const f of SCRIPTS) {
  const p = path.join(dir, f);
  if (!fs.existsSync(p)) { console.log('  MISSING  ' + f); process.exit(1); }
  try {
    vm.runInContext(fs.readFileSync(p, 'utf8'), ctxv, { filename: f });
  } catch (e) {
    console.log('  THREW    ' + f + ' -> ' + e.message);
    console.log((e.stack || '').split('\n').slice(0, 8).join('\n'));
    process.exit(1);
  }
}

// ---- boot ---------------------------------------------------------------
const g = win.game;
check('Game constructs with the main menu', !!g, g ? 'ok' : 'window.game is null');

if (g) {
  check('menu boots paused with the title screen open',
    g.paused === true && g.titleScreenOpen === true,
    'paused=' + g.paused + ' open=' + g.titleScreenOpen);

  // The game's own renderer is irrelevant here, and leaving it live would make
  // it impossible to tell the title draw callback from the game loop in the
  // rAF queue (both simply re-queue themselves).
  g.render = () => {};

  // ---- locate the title scene's draw callback ---------------------------
  // The title draw paints the menu scene; the watchdog below identifies it by
  // the one side effect only it has - rolling the splash line. The bug this
  // test now pins down: the loop used to STOP scheduling itself the moment the
  // player entered a world, so the menu came back over a frozen canvas. It must
  // keep re-queueing while closed (and must NOT paint during that time).
  const savedOpen = g.titleScreenOpen;
  const splash = document.getElementById('title-splash');

  // Identify the title draw by running each candidate while the menu is OPEN:
  // only the title draw sets a splash line.
  let drawFn = null;
  for (const fn of rafQueue.slice()) {
    if (drawFn) break;
    splash.textContent = '';
    // A fresh splash rolls every 8s, so jump well past that: at t=1000 the
    // title draw paints but does not yet touch the splash line.
    try { fn(9000); } catch (e) { errors.push(e); continue; }
    if (splash.textContent) drawFn = fn;
  }
  check('animated background draw loop is installed', !!drawFn);

  // Now prove it survives a world: with the menu closed it must still re-queue
  // (fix), and it must not draw over the game.
  if (drawFn) {
    g.titleScreenOpen = false;
    const queueBefore = rafQueue.length;
    const splashBefore = splash.textContent;
    let threw = null;
    try { drawFn(2000); } catch (e) { threw = e; }
    const requeued = rafQueue.length > queueBefore;
    const didNotPaint = splash.textContent === splashBefore;
    g.titleScreenOpen = true;
    check('background draw loop keeps running while a world is played', requeued,
      'scheduled=' + requeued);
    check('background does not paint over the game', didNotPaint && !threw,
      threw ? threw.message : 'splash unchanged');
  }
  g.titleScreenOpen = savedOpen;

  // ---- animated scene across a whole day/night cycle ----------------------
  if (drawFn) {
    const seen = new Set();
    let frameErr = null;
    for (let i = 0; i <= 240 && !frameErr; i++) {
      try { drawFn(i * 500); } catch (e) { frameErr = e; }
      seen.add(splash.textContent);
    }
    check('background renders a full day/night cycle without throwing',
      !frameErr, frameErr ? frameErr.message : '240 frames over 120s');
    check('splash line is populated', [...seen].every((t) => typeof t === 'string' && t.length > 0),
      seen.size + ' distinct lines');
    check('splash line rotates', seen.size > 1, seen.size + ' distinct lines');

    // Force the 1-in-10 branch to prove the rare line actually exists.
    const realRandom = Math.random;
    Math.random = () => 0.01;
    let rareErr = null;
    try { drawFn(400000); } catch (e) { rareErr = e; }
    Math.random = realRandom;
    check('rare splash "Shoutout to Terraria!" is reachable',
      !rareErr && splash.textContent === 'Shoutout to Terraria!',
      rareErr ? rareErr.message : JSON.stringify(splash.textContent));
    check('rare splash is flagged for its special style',
      splash._classes.has('title-splash-rare'));
  }

  // ---- three save files --------------------------------------------------
  store.set('terracraft-world-slot-1', JSON.stringify({
    name: 'Home', version: 11, dayCount: 7,
    progress: { stats: { playTime: 3720, kills: 42 } }
  }));
  store.set('terracraft-world-slot-2', JSON.stringify({ name: 'Desert Run', version: 11, dayCount: 2 }));
  store.delete('terracraft-world-slot-3');

  const picked = [];
  g.renderTitleWorlds((slot) => picked.push(slot));
  const list = document.getElementById('title-world-list');
  check('save picker renders exactly three files', list.children.length === 3,
    'got ' + list.children.length);

  const nameOf = (card) => card.children[1].children[0].textContent;
  const metaOf = (card) => card.children[1].children[1].textContent;
  const actionOf = (card) => card.children[2].textContent;
  const [c1, c2, c3] = list.children;

  check('slot 1 shows its world name', nameOf(c1) === 'Home', nameOf(c1));
  check('slot 1 shows day / playtime / kills',
    metaOf(c1) === 'Day 7 \u00b7 1h 2m played \u00b7 42 kills', metaOf(c1));
  check('slot 2 offers PLAY', actionOf(c2) === 'PLAY', actionOf(c2));
  check('empty slot 3 offers CREATE', actionOf(c3) === 'CREATE', actionOf(c3));
  check('empty slot 3 is labelled empty',
    c3.className.indexOf('is-empty') !== -1 && /Empty slot/.test(metaOf(c3)), metaOf(c3));
  check('the live slot is marked CURRENT',
    c1.className.indexOf('is-current') !== -1 &&
    c1.children[1].children[0].children.length === 1);

  list.children[2].dispatch('click');
  check('clicking a slot hands back its number', picked.length === 1 && picked[0] === 3,
    JSON.stringify(picked));

  // ---- switching slots ---------------------------------------------------
  check('the current slot starts without a reload',
    g.startTitleWorld(1) === true && reloads === 0, 'reloads=' + reloads);
  check('another slot switches and reloads',
    g.startTitleWorld(2) === false &&
    store.get('terracraft-active-save') === '2' && reloads === 1,
    'active=' + store.get('terracraft-active-save') + ' reloads=' + reloads);
  check('switching slots stops the exit hook rewriting the slot being left',
    g.suppressExitSave === true);

  store.delete('terracraft-active-save');
  g.suppressExitSave = false;

  // ---- panel navigation ---------------------------------------------------
  const screen = document.getElementById('title-screen');
  const menu = document.getElementById('title-menu');
  const worlds = document.getElementById('title-worlds');
  const credits = document.getElementById('title-credits');

  document.getElementById('title-singleplayer').dispatch('click');
  check('Singleplayer opens the save-file picker',
    g.titlePanel === 'worlds' && worlds.hidden === false && menu.hidden === true,
    'panel=' + g.titlePanel);
  check('the picker is populated when opened',
    document.getElementById('title-world-list').children.length === 3);

  document.getElementById('title-worlds-back').dispatch('click');
  check('Back returns from the picker to the menu',
    g.titlePanel === 'menu' && menu.hidden === false && worlds.hidden === true);

  document.getElementById('title-credits-button').dispatch('click');
  check('Credits opens', g.titlePanel === 'credits' && credits.hidden === false);

  let prevented = false;
  screen.dispatch('keydown', {
    key: 'Escape',
    stopPropagation() {},
    preventDefault() { prevented = true; }
  });
  check('Escape returns from Credits to the menu',
    g.titlePanel === 'menu' && prevented, 'panel=' + g.titlePanel);

  document.getElementById('title-singleplayer').dispatch('click');
  document.getElementById('title-world-list').children[0].dispatch('click');
  check('choosing the current world starts the game',
    g.titleScreenOpen === false && g.paused === false &&
    screen._classes.has('title-screen-leaving'),
    'open=' + g.titleScreenOpen + ' paused=' + g.paused);
}

// ---- static markup / style checks ----------------------------------------
const html = fs.readFileSync(path.join(dir, 'terraria.html'), 'utf8');
const css = fs.readFileSync(path.join(dir, 'terraria.css'), 'utf8');
const terrariaJs = fs.readFileSync(path.join(dir, 'terraria.js'), 'utf8');

const menuBlock = (html.match(/<main id="title-menu"[\s\S]*?<\/main>/) || [''])[0];
check('menu has exactly Singleplayer, Multiplayer, Credits',
  (menuBlock.match(/<button/g) || []).length === 3 &&
  /Singleplayer/.test(menuBlock) && /Multiplayer/.test(menuBlock) && /Credits/.test(menuBlock),
  (menuBlock.match(/<button/g) || []).length + ' buttons');
check('Multiplayer is a real, clickable menu button',
  /<button id="title-multiplayer" class="title-button">Multiplayer<\/button>/.test(menuBlock) &&
  !/title-button-disabled/.test(menuBlock) && !/\( Coming soon! \)/.test(menuBlock),
  menuBlock.replace(/\s+/g, ' ').slice(0, 160));
check('the menu wires Multiplayer to its panel',
  /getElementById\('title-multiplayer'\)\?\.addEventListener\('click', \(\) => showPanel\('multiplayer'\)\)/.test(terrariaJs));
const mpBlock = (html.match(/<section id="title-multiplayer-panel"[\s\S]*?<\/section>/) || [''])[0];
check('the multiplayer panel has name, room, server, host and join controls',
  /id="mp-name"/.test(mpBlock) && /id="mp-room"/.test(mpBlock) && /id="mp-server"/.test(mpBlock) &&
  /id="mp-host-btn"/.test(mpBlock) && /id="mp-join-btn"/.test(mpBlock) &&
  /id="mp-status"/.test(mpBlock) && /id="title-multiplayer-back"/.test(mpBlock));
check('the panel starts hidden and is revealed by showPanel',
  /id="title-multiplayer-panel"[^>]*hidden/.test(html) &&
  /mpPanel\.hidden = name !== 'multiplayer'/.test(terrariaJs));
check('multiplayer.js is loaded before terraria.js',
  html.indexOf('src="multiplayer.js') !== -1 &&
  html.indexOf('src="multiplayer.js') < html.indexOf('src="terraria.js'));
check('app.py inlines multiplayer.js', /"multiplayer\.js"/.test(fs.readFileSync(path.join(dir, 'app.py'), 'utf8')));
check('the stylesheet styles the panel and the in-game HUD',
  /\.title-mp \{/.test(css) && /\.mp-chip \{/.test(css) &&
  /\.mp-chat-log \{/.test(css) && /\.mp-chat-input \{/.test(css));

const creditsBlock = (html.match(/<section id="title-credits"[\s\S]*?<\/section>/) || [''])[0];
const names = [];
const nameRe = /<span class="credit-name">([^<]+)<\/span>/g;
let nm;
while ((nm = nameRe.exec(creditsBlock))) names.push(nm[1]);
const expected = ['Terraria', 'Minecraft', 'FISH (Ano)', 'Mikey (Radit)', 'Cline', 'Codegpt', 'Ghaniyy', 'Rasheed', 'Danish'];
check('credits lists the names in order (incl. testers)',
  JSON.stringify(names) === JSON.stringify(expected), names.join(', '));

check('menu markup has the save-file container',
  /id="title-world-list"/.test(html) && /id="title-worlds"/.test(html));
check('logo has the splash element',
  /id="title-splash"/.test(html) && /class="title-brand"/.test(html));
// The splash used to be anchored to .title-brand, whose box is as wide as its
// widest child — the tagline — so it drifted off past the end of the lettering.
check('the splash is anchored to the logo box, not the header',
  /<div class="title-logo">[\s\S]*?<h1>Terracraft<\/h1>[\s\S]*?id="title-splash"[\s\S]*?<\/div>\s*\n\s*<span class="title-tagline">/.test(html) &&
  /\.title-logo \{ position: relative/.test(css));
// .title-brand sets white-space: nowrap and the splash used to inherit it, so
// the line never wrapped: it ran off the right edge and the rotation clipped
// it against the top of the screen.
check('the splash wraps inside its own box instead of running off-screen',
  /\.title-splash \{[^}]*white-space: normal/.test(css));
check('the splash sits just past the logo edge',
  /\.title-splash \{[^}]*left: calc\(100% \+ 12px\)/.test(css));
// The ( Coming soon! ) note is gone — the button is live now. What replaced it
// must keep its own spacing sane: the panel stacks its fields, and the status
// line stays legible even when a room code has not been typed.
check('the panel stacks its fields and centres its two actions',
  /\.title-mp-field \{[^}]*flex-direction: column/.test(css) &&
  /\.title-mp-actions \{[^}]*justify-content: center/.test(css));
check('the retired ( Coming soon! ) note is really gone',
  !/\( Coming soon! \)/.test(html) && !/\.coming-soon \{/.test(css));

const needed = ['.title-button', '.title-world-card',
  '.title-splash-rare', '.title-worlds',
  '#hunger-bar.hunger-fill'];
for (const cls of needed) check('style defines ' + cls, css.indexOf(cls) !== -1);

// The warm Terraria skin was reverted to the approved slate UI. Assert its
// tokens are gone so this suite cannot silently start passing on either look.
for (const gone of ['--terra-panel', '--terra-gold', '--terra-bevel',
  'plate-shine', '.title-menu::before']) {
  check('style no longer defines ' + gone, css.indexOf(gone) === -1);
}

// ---- summary -------------------------------------------------------------
if (errors.length) {
  console.log('\nerrors captured: ' + errors.length);
  for (const e of errors.slice(0, 5)) console.log('  ' + (e && e.message));
}
const failed = results.filter((r) => !r.ok);
console.log('\n' + (results.length - failed.length) + '/' + results.length + ' checks passed');
if (failed.length) {
  console.log('FAILED: ' + failed.map((r) => r.name).join(' | '));
  process.exit(1);
}
console.log('RESULT: title screen OK');

