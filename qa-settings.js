// qa-settings.js - the player-facing settings: defaults, persistence, clamping,
// and that each control actually reaches the subsystem it claims to control.
//
// Settings are the easiest thing in the codebase to break quietly: a renamed
// element id or a saved value that no longer validates produces a settings panel
// that looks fine and does nothing. This asserts the wiring end to end.
//
// Usage: node qa-settings.js
const fs = require('fs');
const vm = require('vm');

let failures = 0;
const check = (label, ok, detail = '') => {
  if (!ok) failures++;
  console.log((ok ? '  PASS  ' : '  FAIL  ') + label + (!ok && detail ? '   [' + detail + ']' : ''));
};
const step = (t) => console.log('\n▸ ' + t);

// ---- DOM / canvas stubs -----------------------------------------------------
// Settings are entirely DOM-driven, so these stubs have to be real enough to
// carry a value, a checked flag and a list of listeners.
function makeCtx() {
  return new Proxy({}, {
    get(t, p) {
      if (p === 'canvas') return {};
      if (p === 'createRadialGradient' || p === 'createLinearGradient') return () => ({ addColorStop() {} });
      if (p === 'getImageData') return () => ({ data: new Uint8ClampedArray(4) });
      if (p === 'measureText') return () => ({ width: 10 });
      if (typeof p === 'string') return () => undefined;
      return undefined;
    },
    set() { return true; }
  });
}
function makeEl(id) {
  const el = {
    id, nodeType: 1, width: 800, height: 600, textContent: '', innerHTML: '',
    style: {}, dataset: {}, className: '', value: '', checked: false, hidden: false,
    offsetWidth: 120, offsetHeight: 24, min: '0', max: '100', step: '5',
    _listeners: {},
    addEventListener(type, fn) { (el._listeners[type] ||= []).push(fn); },
    removeEventListener() {},
    dispatch(type, evt) { for (const fn of el._listeners[type] || []) fn(evt || {}); },
    appendChild() {}, querySelector: () => null, querySelectorAll: () => [],
    closest: () => null, remove() {}, parentNode: { removeChild() {} },
    setAttribute() {}, getAttribute: () => null,
    getContext: () => makeCtx()
  };
  el.classList = (() => {
    const set = new Set();
    return {
      add: (c) => set.add(c), remove: (c) => set.delete(c), contains: (c) => set.has(c),
      toggle: (c, on) => { const want = on === undefined ? !set.has(c) : !!on; if (want) set.add(c); else set.delete(c); return want; }
    };
  })();
  return el;
}
const els = {};
global.document = {
  readyState: 'complete', scripts: [],
  getElementById: (id) => (els[id] ||= makeEl(id)),
  createElement: (tag) => makeEl(tag),
  addEventListener() {},
  querySelector: () => null, querySelectorAll: () => [],
  body: makeEl('body')
};
global.window = global;
global.innerWidth = 1280; global.innerHeight = 720; global.devicePixelRatio = 1;
global.addEventListener = () => {};
global.performance = { now: () => 1000 };
global.requestAnimationFrame = () => 0;
global.cancelAnimationFrame = () => {};
const store = new Map();
global.localStorage = {
  getItem: (k) => (store.has(k) ? store.get(k) : null),
  setItem: (k, v) => store.set(k, String(v)),
  removeItem: (k) => store.delete(k),
  clear: () => store.clear()
};

const FILES = ['audio.js', 'particles.js', 'world.js', 'weather.js', 'entities.js',
  'underworld.js', 'space.js', 'juice.js', 'npcs.js', 'journey.js', 'terraria.js'];
const ctx = vm.createContext(global);
for (const f of FILES) {
  try {
    vm.runInContext(fs.readFileSync(f, 'utf8'), ctx, { filename: f });
  } catch (e) {
    console.log('EVAL FAIL ' + f + ': ' + (e.stack || e.message));
    process.exit(1);
  }
}

const SETTINGS_KEY = 'terracraft-settings';
const read = () => JSON.parse(store.get(SETTINGS_KEY));

step('1. Every new control exists in the markup');
// --------------------------------------------------------------------
// A settings panel whose control is missing from the HTML still boots fine and
// still passes every behavioural check — it just silently does nothing. So the
// ids are asserted against the actual file, not against the JS.
const html = fs.readFileSync('terraria.html', 'utf8');
const CONTROL_IDS = [
  'settings-volume', 'settings-volume-value', 'settings-music',
  'settings-shake', 'settings-hitstop',
  'settings-damagetext', 'settings-minimap', 'settings-tooltips'
];
for (const id of CONTROL_IDS) {
  check('terraria.html defines #' + id, html.includes('id="' + id + '"'));
}
// The pre-existing ones too: a rename would silently orphan them the same way.
for (const id of ['settings-quality', 'settings-effects', 'settings-glow',
  'settings-fps', 'settings-autosave']) {
  check('terraria.html still defines #' + id, html.includes('id="' + id + '"'));
}
check('the volume slider is a range input', /id="settings-volume"[^>]*type="range"/.test(html));
check('the volume readout starts at the default', html.includes('id="settings-volume-value">90%'));
// Each option list has to actually contain the values loadSettings allows.
const optionValues = (id) => {
  const m = html.match(new RegExp('<select id="' + id + '"[^>]*>([\\s\\S]*?)</select>'));
  return m ? [...m[1].matchAll(/value="([^"]+)"/g)].map(x => x[1]) : [];
};
check('the shake select offers off/reduced/full',
  ['off', 'reduced', 'full'].every(v => optionValues('settings-shake').includes(v)),
  optionValues('settings-shake').join(','));
check('the minimap select offers hidden/small/medium/large',
  ['hidden', 'small', 'medium', 'large'].every(v => optionValues('settings-minimap').includes(v)),
  optionValues('settings-minimap').join(','));

step('2. Defaults');
// --------------------------------------------------------------------
// A first-time player must get the authored experience, not a degraded one.
store.delete(SETTINGS_KEY);
const g = new global.Game();
g.titleScreenOpen = false;
g.paused = false;
const d = g.settings;
check('volume defaults to 90%', d.volume === 90, String(d.volume));
check('music defaults on', d.music === true);
check('screen shake defaults to full', d.shake === 'full', String(d.shake));
check('hit-stop defaults on', d.hitStop === true);
check('damage numbers default on', d.damageText === true);
check('the minimap defaults to medium', d.minimap === 'medium', String(d.minimap));
check('item names default on', d.tooltips === true);
// Pre-existing defaults must survive the change.
check('quality still defaults to auto', d.quality === 'auto');
check('autosave still defaults to 90s', d.autosave === 90, String(d.autosave));

step('3. Each setting reaches its subsystem');
// --------------------------------------------------------------------
// The whole point of the feature. A setting that saves correctly but moves
// nothing is worse than no setting at all, so each is checked at the far end.
check('volume reaches the sound mixer', (() => {
  g.settings.volume = 40;
  g.applyVolume(false);
  return Math.abs(g.sound.volume - 0.4) < 1e-6;
})(), 'sound.volume=' + g.sound.volume);
check('music off reaches the ambient gain', (() => {
  g.settings.music = false;
  g.applyMusic();
  return g.sound.musicEnabled === false;
})());
g.settings.music = true; g.applyMusic();
check('shake off silences the camera', (() => {
  g.settings.shake = 'off';
  g.applyShake(false);
  g.feel.shake(1.0);          // the heaviest possible knock
  g.feel.update(1 / 60);
  return g.feel.shakeScale === 0 && g.feel.shakeX === 0 && g.feel.shakeY === 0;
})());
check('shake full is the authored level', (() => {
  g.settings.shake = 'full';
  g.applyShake(false);
  return g.feel.shakeScale === 1;
})());
check('shake reduced sits between', (() => {
  g.settings.shake = 'reduced';
  g.applyShake(false);
  return g.feel.shakeScale > 0 && g.feel.shakeScale < 1;
})(), String(g.feel.shakeScale));
g.settings.shake = 'full'; g.applyShake(false);
check('hit-stop off prevents the freeze', (() => {
  g.settings.hitStop = false;
  g.applyHitStop();
  g.feel.stop(0.09, 0.06);
  const frozen = g.feel.frozen;
  g.settings.hitStop = true; g.applyHitStop();
  return frozen === false;
})());
check('hit-stop on restores the freeze', (() => {
  g.feel.stop(0.09, 0.06);
  const frozen = g.feel.frozen;
  g.feel.hitStop = 0;
  return frozen === true;
})());
check('damage numbers off suppresses the text', (() => {
  g.settings.damageText = false;
  g.applyDamageText(false);
  g.particles.damageTexts.length = 0;
  g.particles.addDamageText(10, 10, '999');
  const off = g.particles.damageTexts.length;
  g.settings.damageText = true;
  g.applyDamageText(false);
  g.particles.addDamageText(10, 10, '999');
  const on = g.particles.damageTexts.length;
  return off === 0 && on === 1;
})());
let mmLarge = -1, mmHidden = -1, mmMedium = -1, mmVisibleHidden = null, mmVisibleMedium = null;
check('the minimap setting moves the real minimap', (() => {
  g.settings.minimap = 'large';
  g.applyMinimap(false);
  mmLarge = g.minimap.mode;
  g.settings.minimap = 'hidden';
  g.applyMinimap(false);
  mmHidden = g.minimap.mode;
  // Visibility must follow the mode too, not just the index: a broken
  // applyVisibility would leave the panel drawn while the mode said otherwise.
  mmVisibleHidden = g.minimap.visible;
  g.settings.minimap = 'medium';
  g.applyMinimap(false);
  mmMedium = g.minimap.mode;
  mmVisibleMedium = g.minimap.visible;
  return mmLarge === 3 && mmHidden === 0 && mmMedium === 2 &&
    mmVisibleHidden === false && mmVisibleMedium === true;
})(), 'large=' + mmLarge + ' hidden=' + mmHidden + ' medium=' + mmMedium +
  ' visibleHidden=' + mmVisibleHidden + ' visibleMedium=' + mmVisibleMedium);
check('item names off stops the hotbar popup', (() => {
  g.settings.tooltips = false;
  g.applyTooltips(false);
  g.showItemNamePopup({ id: 'wood', count: 3 });
  const popup = document.getElementById('item-name-popup');
  const silent = popup.textContent === '' && !popup.classList.contains('show');
  g.settings.tooltips = true;
  g.applyTooltips(false);
  g.showItemNamePopup({ id: 'wood', count: 3 });
  const spoken = popup.textContent.indexOf('Wood') !== -1 && popup.classList.contains('show');
  return silent && spoken;
})());

step('4. Persistence and hostile input');
// --------------------------------------------------------------------
// Everything is read back out of localStorage, which the player can edit by
// hand. A bad value must fall back to the default, never reach a subsystem.
g.settings.volume = 25;
g.settings.music = false;
g.settings.shake = 'off';
g.settings.hitStop = false;
g.settings.damageText = false;
g.settings.minimap = 'large';
g.settings.tooltips = false;
g.saveSettings();
const saved = read();
check('all seven new settings are written',
  saved.volume === 25 && saved.music === false && saved.shake === 'off' &&
  saved.hitStop === false && saved.damageText === false &&
  saved.minimap === 'large' && saved.tooltips === false,
  JSON.stringify(saved));
const g2 = new global.Game();
g2.titleScreenOpen = false;
check('they all survive a reload',
  g2.settings.volume === 25 && g2.settings.music === false &&
  g2.settings.shake === 'off' && g2.settings.hitStop === false &&
  g2.settings.damageText === false && g2.settings.minimap === 'large' &&
  g2.settings.tooltips === false);
check('a reloaded game really applies them', (() => {
  g2.feel.trauma = 0;
  g2.feel.shake(1.0);
  g2.feel.update(1 / 60);
  return g2.feel.shakeScale === 0 && g2.sound.musicEnabled === false &&
    Math.abs(g2.sound.volume - 0.25) < 1e-6 && g2.minimap.mode === 3;
})());

const hostile = [
  ['an out-of-range volume', { volume: 9999 }, 'volume', 100],
  ['a negative volume', { volume: -50 }, 'volume', 0],
  ['a non-numeric volume', { volume: 'loud' }, 'volume', 90],
  ['an unknown shake mode', { shake: 'wobbly' }, 'shake', 'full'],
  ['an unknown minimap size', { minimap: 'enormous' }, 'minimap', 'medium']
];
for (const [label, patch, key, want] of hostile) {
  store.set(SETTINGS_KEY, JSON.stringify(Object.assign({}, saved, patch)));
  const loaded = new global.Game().settings;
  check(label + ' falls back to the default', loaded[key] === want,
    String(loaded[key]) + ' (wanted ' + want + ')');
}
store.set(SETTINGS_KEY, JSON.stringify(Object.assign({}, saved, { hitStop: 'yes' })));
check('a non-boolean hitStop is treated as on', new global.Game().settings.hitStop === true);
store.set(SETTINGS_KEY, 'not json at all');
check('a corrupt settings blob does not throw', (() => {
  try { return new global.Game().settings.volume === 90; } catch (e) { return false; }
})());
store.set(SETTINGS_KEY, JSON.stringify(Object.assign({}, saved, { volume: undefined })));
check('a missing key keeps its default', new global.Game().settings.volume === 90);

step('5. The panel reflects stored state');
// --------------------------------------------------------------------
// Opening Settings must show what was chosen, not what the markup defaults to.
store.set(SETTINGS_KEY, JSON.stringify(Object.assign({}, saved, {
  volume: 35, music: true, shake: 'reduced', hitStop: true,
  damageText: true, minimap: 'small', tooltips: false
})));
const g3 = new global.Game();
g3.titleScreenOpen = false;
g3.syncSettingsUI();
check('the volume slider shows the stored level',
  document.getElementById('settings-volume').value === '35',
  document.getElementById('settings-volume').value);
check('the volume readout shows the stored level',
  document.getElementById('settings-volume-value').textContent === '35%',
  document.getElementById('settings-volume-value').textContent);
check('the shake select shows the stored mode',
  document.getElementById('settings-shake').value === 'reduced');
check('the minimap select shows the stored size',
  document.getElementById('settings-minimap').value === 'small');
check('the item-name checkbox shows the stored state',
  document.getElementById('settings-tooltips').checked === false);
check('the music checkbox shows the stored state',
  document.getElementById('settings-music').checked === true);

console.log('\n' + '─'.repeat(62));
console.log(failures
  ? '✖ ' + failures + ' SETTINGS CHECK(S) FAILED'
  : '✔ ALL SETTINGS CHECKS PASSED');
const code = failures === 0 ? 0 : 1;
const leave = () => process.exit(code);
process.stdout.write('', leave);
setTimeout(leave, 1000);