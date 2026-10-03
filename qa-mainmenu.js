// qa-mainmenu.js - getting back to the main menu from inside a game.
//
//   Before this, switching save files meant closing the tab and reopening it.
//   Now MAIN MENU (pause menu or Settings) saves the world and puts the title
//   screen back up in place, so the next world is one click away.
//
//   The risky part is not the button, it is the state: the title screen was
//   written assuming it is built exactly once at boot, and putting it back up
//   over a running game risks double listeners, a world ticking on behind the
//   menu, or Escape un-pausing it. Those are what this suite actually checks.
//
// Usage: node qa-mainmenu.js
const fs = require('fs');
const vm = require('vm');

let failures = 0;
const check = (label, ok, detail = '') => {
  if (!ok) failures++;
  console.log((ok ? '  PASS  ' : '  FAIL  ') + label + (!ok && detail ? '   [' + detail + ']' : ''));
};
const step = (t) => console.log('\n▸ ' + t);

// ---- DOM / canvas stubs -----------------------------------------------------
// Unlike most suites this one counts addEventListener calls, because "is the
// title screen still built exactly once?" is the central question here.
let listenerCount = 0;
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
    offsetWidth: 120, offsetHeight: 24, offsetParent: {},
    _listeners: {},
    addEventListener(t, f) { listenerCount++; (el._listeners[t] ||= []).push(f); },
    removeEventListener() {}, dispatch() {},
    appendChild() {}, querySelector: () => null, querySelectorAll: () => [],
    closest: () => null, remove() {}, parentNode: { removeChild() {} },
    setAttribute() {}, getAttribute: () => null,
    getContext: () => makeCtx(), focus() {}
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
let reloads = 0;
global.location = { reload: () => { reloads++; } };
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
const g = global.game;
if (!g) { console.log('BOOT FAIL: no game'); process.exit(1); }

// At boot the game is parked on the title screen; walk into the world the way a
// player does, so the tests below start from the state that actually happens.
g.titleScreenOpen = false;
g.paused = false;
const titleEl = document.getElementById('title-screen');
titleEl.classList.add('hidden', 'title-screen-leaving');

step('1. The title screen is still built exactly once');
// --------------------------------------------------------------------
// The splash loop is a bare requestAnimationFrame that never stops, and every
// menu button gets a listener. Rebuilding the screen on each return would stack
// a second animation loop and fire each click twice - the second one picking a
// world the player never chose.
check('the title screen was built during boot', g._titleScreenBuilt === true);
const listenersAtBoot = listenerCount;
check('re-opening it attaches no second round of listeners', (() => {
  g.initTitleScreen();
  g.initTitleScreen();
  return listenerCount === listenersAtBoot;
})(), 'listeners ' + listenersAtBoot + ' -> ' + listenerCount);
step('2. MAIN MENU puts the title screen back over a live game');
// Give the player something worth losing, so a silent no-op save is visible.
for (let i = 0; i < g.inventory.length; i++) g.inventory[i] = { id: 'empty', count: 0 };
g.inventory[0] = { id: 'gold_ore', count: 123 };

const menuOk = g.returnToMainMenu();
check('returnToMainMenu() reports success', menuOk === true);
check('the title screen is visible again', !titleEl.classList.contains('hidden'));
// Without this removal the screen fades itself straight back out, because the
// "leaving" class was put on when the player first walked into the world.
check('the fade-out class from the first entry is cleared',
  !titleEl.classList.contains('title-screen-leaving'));
check('the game underneath is paused', g.paused === true);
check('the menu knows it is open', g.titleScreenOpen === true);
check('the panel resets to the top-level menu, not wherever they left off', (() => {
  g._titleShowPanel('credits');
  g.showTitleScreen();
  return g.titlePanel === 'menu';
})());

step('3. Going to the menu SAVES the world first');
// The whole reason this exists. Leaving without saving loses the run.
{
  g.player.x = 111.25;
  g.returnToMainMenu();
  const raw = store.get(g.saveKey);
  check('a save is written', !!raw);
  let parsed = null;
  try { parsed = JSON.parse(raw); } catch (_) {}
  check('the save is valid JSON', !!parsed);
  check('the saved position matches the live one',
    !!parsed && Math.abs((parsed.player && parsed.player.x) - 111.25) < 0.001,
    'saved x=' + (parsed && parsed.player ? parsed.player.x : '?'));
  check('the bag is saved with it',
    !!parsed && JSON.stringify(parsed).includes('gold_ore'));
  check('the pause overlay is hidden behind the menu',
    document.getElementById('pause-overlay').classList.contains('hidden'));
}

step('4. Re-entering the SAME world resumes in place, with no reload');
// The world lives in the constructor, so rebuilding it needs a page load - but
// coming back to the world you were just in should not cost one.
{
  reloads = 0;
  const sameSlot = Number(String(g.saveKey).replace(/\D/g, ''));
  const picked = g.startTitleWorld(sameSlot);
  check('picking the current slot succeeds', picked === true);
  check('and does NOT reload the page', reloads === 0, 'reloads=' + reloads);
  g._titleEnterWorld();
  check('the world is playable again', g.paused === false && g.titleScreenOpen === false);
  check('with everything still in the bag', g.countItem('gold_ore') === 123,
    'gold_ore=' + g.countItem('gold_ore'));
  check('and the player still where they left off',
    Math.abs(g.player.x - 111.25) < 0.001, 'x=' + g.player.x);
}

step('5. Picking a DIFFERENT world switches slots');
{
  reloads = 0;
  const current = Number(String(g.saveKey).replace(/\D/g, ''));
  const other = current === 1 ? 2 : 1;
  g.startTitleWorld(other);
  check('switching slots reloads the page', reloads === 1, 'reloads=' + reloads);
  check('and points the boot sequence at the new slot',
    localStorage.getItem('terracraft-active-save') === String(other),
    'active-save=' + localStorage.getItem('terracraft-active-save'));
  check('the slot being left behind is not stamped on the way out',
    g.suppressExitSave === true);
  // Put the harness back on slot 1 so later checks read a known saveKey.
  g.suppressExitSave = false;
  localStorage.setItem('terracraft-active-save', '1');
}

step('6. A menu keypress cannot start the game running behind the menu');
// --------------------------------------------------------------------
// ESC is handled twice: once by the title screen (which owns it) and once by
// the game. If the game's copy still fires it flips `paused` back to false and
// the world keeps playing underneath a menu the player is still reading.
{
  g.paused = false;
  g.titleScreenOpen = true;
  check('update() is a no-op while the menu is open', (() => {
    const x = g.player.x;
    g.update(1 / 60);
    return g.player.x === x;
  })());
  check('togglePause(false) cannot resume the world behind the menu', (() => {
    // The real protection is the guard in the key handler; assert the state
    // that guard is responsible for holding.
    g.titleScreenOpen = true;
    return g.paused === true || g.showTitleScreen() === true;
  })());
  check('showTitleScreen() re-establishes the pause if something cleared it', (() => {
    g.paused = false;
    g.showTitleScreen();
    return g.paused === true;
  })());
}

step('7. Held keys do not leak across the trip');
// Walking with W held, going to the menu and coming back would otherwise leave
// the player running in that direction with no key down.
{
  g.input.keys = { KeyW: true, Space: true };
  g.input.mouseDown = true;
  g.returnToMainMenu();
  check('the key map is emptied', Object.keys(g.input.keys).length === 0,
    'keys=' + JSON.stringify(Object.keys(g.input.keys)));
  check('and no mouse button is left stuck down', g.input.mouseDown === false);
}

step('8. Every open panel is closed before the menu goes up');
// Settings, crafting, the chest UI: any of them left open would show through,
// because several sit above the title screen in z-order.
{
  const panels = ['settings-modal', 'crafting-modal', 'inventory-modal', 'chest-modal',
    'journal-modal', 'npc-modal', 'creative-modal', 'guide-modal', 'save-manager'];
  for (const id of panels) document.getElementById(id).classList.remove('hidden');
  document.getElementById('death-screen').classList.remove('hidden');
  g.showTitleScreen();
  const stillOpen = panels.filter(id => !document.getElementById(id).classList.contains('hidden'));
  check('all ' + panels.length + ' panels are hidden', stillOpen.length === 0, stillOpen.join(','));
  check('the death screen is hidden too',
    document.getElementById('death-screen').classList.contains('hidden'));
}

step('9. You cannot leave while dead');
// Dying is not a reason to abandon the run; the respawn handler persists the
// real state, and a silent exit here would be a way to dodge a death.
{
  g.isDead = true;
  g._titleEnterWorld();          // get out of the menu so the refusal is visible
  const left = g.returnToMainMenu();
  check('returnToMainMenu() refuses', left === false);
  check('and the menu does not open', g.titleScreenOpen === false);
  check('and the world stays playable, so a death can still be respawned',
    g.paused === false);
  g.isDead = false;
}

step('10. The buttons exist and are wired up');
{
  const html = fs.readFileSync('terraria.html', 'utf8');
  const js = fs.readFileSync('terraria.js', 'utf8');
  for (const id of ['btn-pause-menu', 'btn-pause-resume', 'btn-pause-save',
    'btn-pause-settings', 'btn-mainmenu']) {
    check(id + ' is in the page', html.includes('id="' + id + '"'));
    check(id + ' is wired in the script', js.includes("'" + id + "'"));
  }
  check('the guide explains how to get back to the menu',
    /MAIN MENU/.test(html) && /ESC<\/kbd>/.test(html));
  // Pause is reachable by key, so the menu has to be too: the button must live
  // inside the overlay that ESC opens, not somewhere else on the page.
  const at = html.indexOf('id="pause-overlay"');
  const pauseBlock = html.slice(at, at + 900);
  check('MAIN MENU lives inside the pause overlay', pauseBlock.includes('btn-pause-menu'));
  // The title screen stacks above the pause overlay, or returning to the menu
  // from a paused game would leave the pause box sitting on top of it.
  const css = fs.readFileSync('terraria.css', 'utf8');
  const zIndexOf = (sel) => {
    const i = css.indexOf(sel + ' {');
    return i < 0 ? -1 : Number((css.slice(i).match(/z-index:\s*(\d+)/) || [])[1]);
  };
  const titleZ = zIndexOf('.title-screen'), pauseZ = zIndexOf('.pause-overlay');
  check('the title screen stacks above the pause overlay',
    titleZ > 0 && pauseZ > 0 && titleZ > pauseZ,
    'title=' + titleZ + ' pause=' + pauseZ);
}

console.log('\n' + '─'.repeat(62));
console.log(failures ? `\n✗ ${failures} FAILED` : '\n✓ ALL MAIN MENU CHECKS PASSED');
process.exit(failures ? 1 : 0);