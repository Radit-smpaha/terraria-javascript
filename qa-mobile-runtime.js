// Runtime checks for the mobile control scheme: boots the real game with DOM
// stubs (the same approach as qa-node-harness.js) and then drives the touch
// pad the way a thumb would - press, hold, release, pause, switch scheme.
//
// qa-mobile.js covers the static wiring; this file covers what actually
// happens at runtime, which is where a stray `input.keys` entry or an
// un-released button would show up.
const fs = require('fs');
const vm = require('vm');

let failed = 0;
const check = (label, ok, detail = '') => {
  if (!ok) failed++;
  console.log((ok ? '  ok      ' : '  FAIL    ') + label + (detail ? '  -- ' + detail : ''));
};

/* ---------- DOM stubs with real class/attr behaviour ---------- */
// The class list has to actually track adds/removes: several of the checks
// below assert on `hidden` flipping, and a no-op stub would pass everything.
function makeCtx2D() {
  return new Proxy({}, {
    get(t, p) {
      if (p === 'canvas') return {};
      if (p === 'createRadialGradient' || p === 'createLinearGradient') {
        return () => ({ addColorStop() {} });
      }
      if (p === 'getImageData') return () => ({ data: new Uint8ClampedArray(4) });
      if (p === 'measureText') return () => ({ width: 10 });
      if (typeof p === 'string') return () => undefined;
      return undefined;
    },
    set() { return true; }
  });
}

function makeEl(id, tag = 'div') {
  const classes = new Set();
  const el = {
    id, tagName: (tag || 'div').toUpperCase(), width: 800, height: 600,
    textContent: '', innerHTML: '', className: '', value: '',
    style: {}, dataset: {}, hidden: false, disabled: false,
    children: [],
    offsetParent: {},
    focus() {}, click() {},
    getContext: () => makeCtx2D(),
    classList: {
      add(...c) { c.forEach((x) => classes.add(x)); },
      remove(...c) { c.forEach((x) => classes.delete(x)); },
      contains: (c) => classes.has(c),
      toggle(c, on) { if (on === undefined) { classes.has(c) ? classes.delete(c) : classes.add(c); } else if (on) classes.add(c); else classes.delete(c); },
      [Symbol.iterator]: () => classes[Symbol.iterator]()
    },
    addEventListener(type, fn) { (this._h || (this._h = {}))[type] = fn; },
    removeEventListener() {},
    appendChild(c) { this.children.push(c); },
    querySelector: () => null,
    querySelectorAll: () => [],
    closest: () => null,
    remove() {},
    parentNode: { removeChild() {} },
    setAttribute() {}, getAttribute: () => null,
    setPointerCapture() {}, releasePointerCapture() {},
    getBoundingClientRect: () => ({ left: 0, top: 0, width: 800, height: 600 })
  };
  return el;
}

const els = new Map();
const store = new Map();
global.document = {
  readyState: 'complete',
  scripts: [],
  hidden: false,
  getElementById: (id) => {
    if (!els.has(id)) els.set(id, makeEl(id));
    return els.get(id);
  },
  createElement: (tag) => makeEl(tag, tag),
  addEventListener() {},
  // The game asks "is any modal open?" with '.modal:not(.hidden)', so the
  // stub has to understand that selector rather than always answering [].
  querySelector(sel) { return global.document.querySelectorAll(sel)[0] || null; },
  querySelectorAll(sel) {
    const out = [];
    for (const el of els.values()) {
      if (matches(el, sel)) out.push(el);
    }
    return out;
  },
  body: makeEl('body', 'body'),
  activeElement: null
};
// Tiny selector matcher: '.a', '.a:not(.b)' - all this file needs.
function matches(el, sel) {
  const m = /^\s*\.([\w-]+)(?::not\(\.([\w-]+)\))?\s*$/.exec(sel);
  if (!m) return false;
  if (!el.classList.contains(m[1])) return false;
  if (m[2] && el.classList.contains(m[2])) return false;
  return true;
}
global.window = global;
global.innerWidth = 1280; global.innerHeight = 720;
global.devicePixelRatio = 1;
// Minimal Web Audio stub. Without it every tap logs a full "AudioCtx is not a
// constructor" stack trace, which buries the actual check results.
function audioParam(v = 0) {
  return { value: v, setValueAtTime() {}, linearRampToValueAtTime() {}, exponentialRampToValueAtTime() {} };
}
global.AudioContext = function AudioContext() {
  const node = () => ({
    connect() {}, disconnect() {},
    gain: audioParam(1), frequency: audioParam(440), detune: audioParam(0),
    type: 'sine', start() {}, stop() {},
    buffer: null, playbackRate: audioParam(1), loop: false,
    pan: audioParam(0), Q: audioParam(1)
  });
  return {
    currentTime: 0, state: 'running', sampleRate: 44100, destination: node(),
    createGain: node, createOscillator: node, createBiquadFilter: node,
    createBufferSource: node, createStereoPanner: node, createDelay: node,
    createBuffer: () => ({ getChannelData: () => new Float32Array(1) }),
    createPeriodicWave: () => ({}), createConvolver: () => node(),
    createDynamicsCompressor: node, resume() {}, close() {}
  };
};
global.webkitAudioContext = global.AudioContext;

// Listeners are RECORDED, not discarded: the frozen-aim bug lived in a handler
// that was never attached, and a no-op stub would have hidden that.
const winHandlers = {};
const docHandlers = {};
global.addEventListener = (t, f) => { (winHandlers[t] || (winHandlers[t] = [])).push(f); };
global.document.addEventListener = (t, f) => { (docHandlers[t] || (docHandlers[t] = [])).push(f); };
global.performance = { now: () => 1000 };
global.requestAnimationFrame = () => 0;
global.localStorage = {
  getItem: (k) => (store.has(k) ? store.get(k) : null),
  setItem: (k, v) => store.set(k, String(v)),
  removeItem: (k) => store.delete(k)
};
global.matchMedia = () => ({ matches: false });

const files = ['audio.js', 'particles.js', 'world.js', 'weather.js', 'entities.js',
  'underworld.js', 'space.js', 'juice.js', 'npcs.js', 'journey.js', 'terraria.js'];
const ctx = vm.createContext(global);
for (const f of files) {
  try {
    vm.runInContext(fs.readFileSync(f, 'utf8'), ctx, { filename: f });
  } catch (e) {
    console.log('EVAL FAIL ' + f + ': ' + (e.stack || e.message));
    process.exit(1);
  }
}

const g = global.game;
check('game booted', !!g);

/* ---------- 1. the question comes first ---------- */
check('unanswered opens the platform question', g.titlePanel === 'platform',
  'panel=' + g.titlePanel);
check('unanswered leaves platform null', g.platform === null, 'platform=' + g.platform);

/* ---------- 2. answering it applies the scheme ---------- */
g.setControlScheme('pc');
check('pc scheme stored', store.get('terracraft-controls') === 'pc',
  'stored=' + store.get('terracraft-controls'));
check('pc answers and moves to the menu', g.titlePanel === 'menu', 'panel=' + g.titlePanel);
check('pc adds controls-pc', document.body.classList.contains('controls-pc'));
check('pc does NOT add controls-touch', !document.body.classList.contains('controls-touch'));
check('pc keeps the pad hidden', !g._touchControlsShown);

/* ---------- 3. the pad writes the same keys the keyboard does ---------- */
g.setControlScheme('touch');
check('touch scheme stored', store.get('terracraft-controls') === 'touch');
check('touch adds controls-touch', document.body.classList.contains('controls-touch'));
check('touch drops controls-pc', !document.body.classList.contains('controls-pc'));

g.setTouchKey('KeyA', true);
check('left button presses the real movement key', g.input.keys.KeyA === true);
g.setTouchKey('KeyA', false);
check('releasing left clears the key', !g.input.keys.KeyA);

g.setTouchKey('KeyS', true);
check('drop-through uses the real key', g.input.keys.KeyS === true);
g.setTouchKey('KeyS', false);
check('drop-through releases', !g.input.keys.KeyS);

// The held-key bookkeeping must be symmetric, or a later releaseTouchInput
// would leave the player walking on their own.
g.setTouchKey('KeyD', true);
g.setTouchKey('KeyA', true);
check('two keys held at once are tracked', g._touchHeld.size === 2, 'held=' + g._touchHeld.size);
g.releaseTouchInput();
check('releaseTouchInput clears every held key',
  g._touchHeld.size === 0 && !g.input.keys.KeyA && !g.input.keys.KeyD);

/* ---------- 4. action buttons drive the real click handlers ---------- */
let leftClicks = 0, rightClicks = 0;
const realLeft = g.handleLeftClick.bind(g);
const realRight = g.handleRightClick.bind(g);
g.handleLeftClick = () => { leftClicks++; };
g.handleRightClick = () => { rightClicks++; };

g.setTouchAction('left', true);
check('attack button fires handleLeftClick once', leftClicks === 1, 'clicks=' + leftClicks);
check('attack button holds the left mouse', g.input.mouseDown === true);
check('attack button does not hold the right mouse', !g.input.mouseRightDown);
g.setTouchAction('left', false);
check('releasing attack clears the left mouse', g.input.mouseDown === false);

g.setTouchAction('right', true);
check('use button fires handleRightClick once', rightClicks === 1, 'clicks=' + rightClicks);
check('use button holds the right mouse', g.input.mouseRightDown === true);
check('use button does not hold the left mouse', !g.input.mouseDown);
g.setTouchAction('right', false);
check('releasing use clears the right mouse', g.input.mouseRightDown === false);

g.handleLeftClick = realLeft;
g.handleRightClick = realRight;

/* ---------- 5. pausing hides the pad and lets go ---------- */
g.titleScreenOpen = false;
g.paused = false;
g.refreshTouchControls();
check('pad shows while playing in touch mode', g._touchControlsShown === true);

g.setTouchKey('KeyA', true);
g.togglePause(true);
g.refreshTouchControls();
check('pausing hides the pad', g._touchControlsShown === false);
check('pausing releases held keys', !g.input.keys.KeyA && g._touchHeld.size === 0);

g.togglePause(false);
g.refreshTouchControls();
check('resuming brings the pad back', g._touchControlsShown === true);

// The title screen must cover the pad, not sit under the thumb.
g.showTitleScreen();
g.refreshTouchControls();
check('title screen hides the pad', g._touchControlsShown === false);
g.titleScreenOpen = false;
g.paused = false;

/* ---------- 6. a modal must take the pad away ---------- */
// The stub builds elements by id with no classes, so give this one the same
// "modal hidden" classes the real markup carries.
const modal = document.getElementById('settings-modal');
modal.classList.add('modal', 'hidden');
check('the modal is genuinely detected as open', g.isModalOpen() === false);
modal.classList.remove('hidden');
check('isModalOpen sees the opened modal', g.isModalOpen() === true);
g.refreshTouchControls();
check('an open modal hides the pad', g._touchControlsShown === false);
modal.classList.add('hidden');
g.refreshTouchControls();
check('closing the modal brings the pad back', g._touchControlsShown === true);

/* ---------- 7. dying must take the pad away ---------- */
g.isDead = true;
g.refreshTouchControls();
check('death hides the pad', g._touchControlsShown === false);
g.isDead = false;
g.refreshTouchControls();
check('respawning brings the pad back', g._touchControlsShown === true);

/* ---------- 8. pc mode can never arm the pad ---------- */
g.setControlScheme('pc');
check('switching to pc hides the pad', g._touchControlsShown === false);
g.paused = false;
g.refreshTouchControls();
check('pc mode never re-shows the pad', g._touchControlsShown === false);

// And the safety net: a stale body class must not survive a frame, because
// the CSS trusts that class to decide both the pad and the HUD size.
document.body.classList.remove('controls-touch');
g.platform = 'touch';
g.refreshTouchControls();
check('a stale body class is re-synced', document.body.classList.contains('controls-touch'),
  'classes=' + [...document.body.classList]);
g.platform = 'pc';
g.refreshTouchControls();
check('switching to pc clears the touch class',
  !document.body.classList.contains('controls-touch'));

/* ---------- 9. aim snap only forgives on a weapon ---------- */
g.setControlScheme('touch');
const monster = { x: 1000, y: 1000, width: 32, height: 32, dead: false };
const putItem = (id) => { for (let i = 0; i < 9; i++) g.inventory[i] = { id, count: 1 }; };
g.camera.x = 0; g.camera.y = 0;

// Mining must stay EXACT: a monster nearby must not drag the aim off the tile.
putItem('copper_pickaxe');
g.monsters = [monster];
g.input.mouseX = 960; g.input.mouseY = 1000;   // ~48px away: outside the snap
g.snapTouchAim();
check('mining aim is never snapped', g.input.mouseX === 960 && g.input.mouseY === 1000,
  'aim=' + g.input.mouseX + ',' + g.input.mouseY);

// Swinging near a monster should be forgiven.
putItem('copper_sword');
g.input.mouseX = 1005; g.input.mouseY = 1005;   // ~6px from the centre
g.snapTouchAim();
check('combat aim snaps onto a nearby monster',
  Math.abs(g.input.mouseX - 1016) < 1 && Math.abs(g.input.mouseY - 1016) < 1,
  'aim=' + g.input.mouseX + ',' + g.input.mouseY);

// Far away = untouched.
g.input.mouseX = 400; g.input.mouseY = 400;
g.snapTouchAim();
check('a distant aim is left alone', g.input.mouseX === 400 && g.input.mouseY === 400);

// A dead monster is not a target.
g.monsters = [{ x: 1000, y: 1000, width: 32, height: 32, dead: true }];
g.input.mouseX = 1005; g.input.mouseY = 1005;
g.snapTouchAim();
check('a dead monster is not snapped to', g.input.mouseX === 1005);

// Snap must be a no-op on pc.
g.setControlScheme('pc');
g.monsters = [monster];
g.input.mouseX = 1005; g.input.mouseY = 1005;
g.snapTouchAim();
check('pc aim is never snapped', g.input.mouseX === 1005);

/* ---------- 10. a bad stored value falls back to asking ---------- */
store.set('terracraft-controls', 'nonsense');
check('a corrupt stored answer is ignored', g.loadControlScheme() === null);

/* ---------- 11. tap-to-place works in EVERY direction ----------
   The reported bug: blocks only ever landed in one spot. Root cause was a
   pointer capture that could be dropped without a pointerup, leaving the aim
   latched so every later tap was rejected. Both halves are checked here. */
g.setControlScheme('touch');
g.titleScreenOpen = false; g.paused = false; g.isDead = false;
for (let i = 0; i < 9; i++) g.inventory[i] = { id: 'dirt', count: 99 };
g.player.selectedSlot = 0;

const screenOf = (wx, wy) => [wx + g.camera.x, wy + g.camera.y];
const px = Math.floor((g.player.x + 9) / 24);
const py = Math.floor((g.player.y + 18) / 24);
// A real tap goes through the pointer handler, so the "one finger at a time"
// guard is exercised rather than bypassed.
const tapAt = (sx, sy, id) => {
  g.canvas._h.pointerdown({ pointerId: id, clientX: sx, clientY: sy, preventDefault() {} });
  if (g.canvas._h.pointerup) g.canvas._h.pointerup({ pointerId: id });
};

const directions = [
  ['above', px, py - 3],
  ['below', px, py + 5],
  ['to the left of', px - 4, py],
  ['to the right of', px + 4, py]
];
for (const [label, tx, ty] of directions) {
  g.world.setTile(tx, ty, 0);
  g.world.setTile(tx, ty - 1, 0);       // headroom
  const before = g.stats.blocksPlaced;
  const [sx, sy] = screenOf(tx * 24 + 12, ty * 24 + 12);
  tapAt(Math.round(sx), Math.round(sy), 20);
  check('a tap places a block ' + label + ' the player',
    g.world.getTile(tx, ty) === global.TILES.DIRT && g.stats.blocksPlaced === before + 1,
    'tile=' + g.world.getTile(tx, ty) + ' delta=' + (g.stats.blocksPlaced - before));
}

// And the frozen-aim half: every way a capture can end abnormally must leave
// the aim usable again.
const recoveryProbe = (label, trigger) => {
  const tx = px - 4, ty = py;
  g.world.setTile(tx, ty, 0);
  g.world.setTile(tx, ty - 1, 0);
  g._touchAimPointer = 4242;                    // a capture that never released
  trigger();
  const [sx, sy] = screenOf(tx * 24 + 12, ty * 24 + 12);
  tapAt(Math.round(sx), Math.round(sy), 21);
  check('aim recovers after ' + label, g.world.getTile(tx, ty) === global.TILES.DIRT,
    'tile=' + g.world.getTile(tx, ty) + ' pointer=' + g._touchAimPointer);
};
recoveryProbe('lostpointercapture', () =>
  g.canvas._h.lostpointercapture({ pointerId: 4242 }));
recoveryProbe('pointercancel', () =>
  g.canvas._h.pointercancel({ pointerId: 4242 }));
recoveryProbe('window blur', () => {
  g._touchAimPointer = 4242;
  for (const fn of (winHandlers.blur || [])) fn();
});
recoveryProbe('the tab being hidden', () => {
  g._touchAimPointer = 4242;
  global.document.visibilityState = 'hidden';
  for (const fn of (docHandlers.visibilitychange || [])) fn();
});

/* ---------- 12. the HUD size setting ---------- */
check('the ui scale setting exists in the panel', /id="settings-ui-scale"/.test(
  require('fs').readFileSync(require('path').join(__dirname, 'terraria.html'), 'utf8')));

g.settings.uiScale = 'small';
g.applyUiScale();
check('small sets ui-small', document.body.classList.contains('ui-small'));
check('small does not set ui-large', !document.body.classList.contains('ui-large'));
g.settings.uiScale = 'large';
g.applyUiScale();
check('large sets ui-large', document.body.classList.contains('ui-large'));
check('large drops ui-small', !document.body.classList.contains('ui-small'));
g.settings.uiScale = 'nonsense';
check('a bogus value falls back to no class',
  g.applyUiScale() === 'normal' && !document.body.classList.contains('ui-small') &&
  !document.body.classList.contains('ui-large'));
g.settings.uiScale = 'normal';
g.applyUiScale();

// It must persist through the same guarded save path as every other setting.
store.set('terracraft-settings', JSON.stringify({ uiScale: 'large' }));
check('a saved hud size is restored', g.loadSettings().uiScale === 'large');
store.set('terracraft-settings', JSON.stringify({ uiScale: 'evil' }));
check('a corrupt hud size is rejected', g.loadSettings().uiScale === 'normal');

console.log('');
console.log(failed ? 'MOBILE RUNTIME QA FAILED: ' + failed + ' check(s)' : 'MOBILE RUNTIME QA PASSED: all checks green');
process.exit(failed ? 1 : 0);
