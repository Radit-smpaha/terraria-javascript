// Structural checks for the mobile support added on top of Terracraft.
//
// Everything here is static: it reads the shipped html/css/js and asserts the
// wiring exists and, where it matters, that the CSS is not accidentally nested
// inside a media query (which is the failure mode that silently disables a
// whole feature on desktop widths).
const fs = require('fs');
const path = require('path');

const base = __dirname;
const html = fs.readFileSync(path.join(base, 'terraria.html'), 'utf8');
const css = fs.readFileSync(path.join(base, 'terraria.css'), 'utf8');
const js = fs.readFileSync(path.join(base, 'terraria.js'), 'utf8');

let failed = 0;
const check = (label, ok, detail = '') => {
  if (!ok) failed++;
  console.log((ok ? '  ok      ' : '  FAIL    ') + label + (detail ? '  -- ' + detail : ''));
};

/* ---------- markup ---------- */
check('platform question exists', /id="title-platform"/.test(html));
check('pc option exists', /id="title-platform-pc"/.test(html));
check('mobile option exists', /id="title-platform-mobile"/.test(html));
check('platform panel starts hidden', /id="title-platform"[^>]*hidden/.test(html));
check('controls chip exists', /id="title-controls-chip"/.test(html));
check('mobile pad exists', /id="mobile-controls"/.test(html));
check('pad starts hidden', /id="mobile-controls"[^>]*class="mobile-controls hidden"/.test(html));
check('settings has a control-scheme select', /id="settings-controls"/.test(html));
check('viewport blocks pinch zoom',
  /user-scalable=no/.test(html) && /viewport/.test(html));

// The pad must live INSIDE #ui-layer so every modal / pause / title screen
// (all z-index 50+) stacks above it without any extra z-index bookkeeping.
const uiOpen = html.indexOf('id="ui-layer"');
const padAt = html.indexOf('id="mobile-controls"');
check('pad sits inside #ui-layer', uiOpen !== -1 && padAt > uiOpen);

/* ---------- pad buttons ---------- */
const padEnd = html.indexOf('<!-- Pause Overlay', padAt);
const pad = html.slice(padAt, padEnd);
const buttons = [...pad.matchAll(/id="(touch-[a-z]+)"[^>]*data-(code|action)="([^"]+)"/g)]
  .map((m) => ({ id: m[1], kind: m[2], value: m[3] }));
check('pad has 11 buttons', buttons.length === 11, 'found ' + buttons.length);
for (const need of ['touch-left', 'touch-right', 'touch-jump', 'touch-attack', 'touch-use', 'touch-pause']) {
  check('pad has ' + need, buttons.some((b) => b.id === need));
}
// The two action buttons must drive the real mouse handlers, not a new path.
const actions = buttons.filter((b) => b.kind === 'action').map((b) => b.value).sort();
check('action buttons are left+right', actions.join(',') === 'left,right', actions.join(','));

// Every virtual key the pad writes must be a key the game already understands.
const KNOWN = ['KeyA', 'KeyD', 'KeyS', 'Space', 'ShiftLeft', 'KeyH', 'KeyQ', 'KeyT', 'Escape'];
for (const b of buttons.filter((x) => x.kind === 'code')) {
  check('key ' + b.value + ' (' + b.id + ') is a real binding', KNOWN.includes(b.value));
}

/* ---------- css structure ---------- */

// The audit that matters: no `body.controls-touch` rule may end up nested
// inside an @media block, or the smaller HUD silently stops applying on a
// desktop-sized window.
function braceMap(src) {
  const lines = src.split(/\r?\n/);
  let depth = 0;
  const out = [];
  lines.forEach((line, i) => {
    let s = line.replace(/\/\*[\s\S]*?\*\//g, '');
    s = s.replace(/'(?:\\.|[^'\\])*'/g, "''").replace(/"(?:\\.|[^"\\])*"/g, '""');
    const open = (s.match(/\{/g) || []).length;
    const close = (s.match(/\}/g) || []).length;
    out.push({ n: i + 1, text: line });
    depth += open - close;
  });
  return { lines: out, depth };
}
const audit = braceMap(css);
// Depth of the enclosing @media block for each line, so we can prove the HUD
// rules are top-level. A media block opens at the brace depth of its own line
// and closes when depth falls back to it, so plain brace counting is not
// enough - a nested rule's own `}` must not be read as closing the query.
// Walk the braces one at a time, remembering for every open block whether it
// was an @media. A selector sits before its own `{`, so the state at the start
// of a line is what decides whether that line is inside a query.
function insideMediaSelector(line) {
  let s = line.replace(/\/\*[\s\S]*?\*\//g, '');
  s = s.replace(/'(?:\\.|[^'\\])*'/g, "''").replace(/"(?:\\.|[^"\\])*"/g, '""');
  return { isSelector: /\{/.test(s) || !/^\s*\}/.test(s), stripped: s };
}
const stack = [];
let depth = 0;
const trappedHud = [];
const topLevelPad = new Set();
const basePad = ['.mobile-controls', '.touch-btn', '.touch-cluster', '.touch-act', '.touch-move'];
for (const l of audit.lines) {
  const { stripped } = insideMediaSelector(l.text);
  const selector = stripped.trim();
  const isMedia = /^@media/.test(selector);
  // Recorded BEFORE this line's own brace is pushed: a selector is inside a
  // query only if an ANCESTOR block was one.
  const inMedia = stack.some(Boolean);
  if (inMedia) {
    if (/^body\.controls-touch\s/.test(selector)) trappedHud.push(l.n);
  } else {
    for (const sel of basePad) {
      if (new RegExp('^' + sel.replace('.', '\\.') + '\\b').test(selector)) topLevelPad.add(sel);
    }
  }
  // Now consume this line's braces left to right.
  for (const ch of stripped) {
    if (ch === '{') { stack.push(isMedia); depth++; }
    else if (ch === '}') { stack.pop(); depth--; }
  }
}
const missingBase = basePad.filter((s) => !topLevelPad.has(s));
check('css braces balance', audit.depth === 0, 'final depth ' + audit.depth);
check('no smaller-HUD rule trapped in a media query', trappedHud.length === 0,
  'lines ' + trappedHud.join(', '));
check('pad base layout not trapped in a media query', missingBase.length === 0,
  'never defined at top level: ' + missingBase.join(', '));

check('pad is pointer-transparent', /#ui-layer > \.mobile-controls \{ pointer-events: none; \}/.test(css));
check('pad buttons re-enable pointer events', /\.touch-cluster > \* \{ pointer-events: auto; \}/.test(css));
check('pad has touch-action: none', /\.mobile-controls \{[\s\S]*?touch-action: none;/.test(css));
check('pad hidden unless touch mode', /body\.controls-touch \.mobile-controls:not\(\.hidden\)/.test(css));
check('stale class cannot arm the pad', /body:not\(\.controls-touch\) \.mobile-controls \{ display: none; \}/.test(css));

/* ---------- the "don't resize the main menu" requirement ---------- */
// No touch-mode rule may target a title/menu selector.
const menuSelectors = [...css.matchAll(/body\.controls-touch[^{]*([^{]*)\{/g)]
  .map((m) => m[1])
  .filter((sel) => /title-|menu|credits|worlds|platform/i.test(sel));
check('touch mode never resizes the main menu', menuSelectors.length === 0,
  menuSelectors.join(' | '));

/* ---------- js wiring ---------- */
check('platform is stored per-device, not in settings',
  /get controlSchemeKey\(\) \{ return 'terracraft-controls'; \}/.test(js));
check('loadControlScheme validates the stored value',
  /saved === 'pc' \|\| saved === 'touch' \? saved : null/.test(js));
check('pad writes into the shared key map', /this\.input\.keys\[code\] = true;/.test(js));
check('action button reuses handleLeftClick', /if \(left\) this\.handleLeftClick\(\);/.test(js));
check('action button reuses handleRightClick', /else this\.handleRightClick\(\);/.test(js));
check('hidden pad releases held keys', /if \(!wanted\) this\.releaseTouchInput\(\);/.test(js));
check('stranded keys are released', /releaseTouchInput\(\) \{[\s\S]*?this\._touchHeld\.clear\(\)/.test(js));
check('pad visibility recomputed every frame',
  /loop\(currentTime\) \{[\s\S]*?this\.refreshTouchControls\(\);/.test(js));
check('title opens on the question when unanswered',
  /this\.titlePanel = this\.platform \? 'menu' : 'platform';/.test(js));
check('answering the question advances to the menu',
  /if \(this\.titleScreenOpen && this\._titleShowPanel\) this\._titleShowPanel\('menu'\);/.test(js));
check('returning to the menu does not re-ask',
  /if \(this\._titleShowPanel\) this\._titleShowPanel\('menu'\);/.test(js));
check('aim snap gated to weapons only',
  /if \(!itemData \|\| itemData\.type !== 'weapon'\) return;/.test(js));
check('escape guard while the question is up',
  /if \(this\.titlePanel === 'platform'\) \{[\s\S]{0,80}event\.preventDefault\(\);/.test(js));

/* ---------- tap routing + frozen aim (the "only one direction" bug) ---------- */
check('a world tap routes by held item', /handleTouchTap\(\) \{[\s\S]*?itemData\.type === 'tile' \|\| itemData\.type === 'consumable'/.test(js));
check('a tap with a block places it', /if \(isUse\) \{[\s\S]{0,120}this\.handleRightClick\(\);/.test(js));
check('a tap with a tool still swings', /if \(isUse\) \{[\s\S]{0,220}else \{\s*this\.handleLeftClick\(\);/.test(js));
check('the aim listens for lostpointercapture',
  /canvas\.addEventListener\('lostpointercapture', endAim\);/.test(js),
  'a dropped capture here is what froze the aim on one tile');
check('pointercancel is handled', /canvas\.addEventListener\('pointercancel', endAim\);/.test(js));
check('losing focus releases the aim', /window\.addEventListener\('blur', \(\) => endAim\(null\)\);/.test(js));
check('a hidden tab releases the aim',
  /document\.addEventListener\('visibilitychange'[\s\S]{0,140}endAim\(null\);/.test(js));
check('an aim reticle is drawn', /renderTouchReticle\(ctx\)/.test(js));
check('the reticle mirrors the 7 tile range', /Math\.hypot\(tileX - pTileX, tileY - pTileY\) <= 7\.0/.test(js));

/* ---------- HUD size setting ---------- */
check('the settings panel offers a HUD size', /id="settings-ui-scale"/.test(html));
check('uiScale is a real setting', /uiScale: 'normal'/.test(js));
check('uiScale is validated on load', /if \(\['small', 'normal', 'large'\]\.includes\(saved\.uiScale\)\)/.test(js));
check('the HUD size select is wired', /getElementById\('settings-ui-scale'\)\?\.addEventListener\('change'/.test(js));
check('the HUD size is applied at boot', /this\.applyUiScale\(\);\s*\n\s*this\.showFps/.test(js));
check('small scales the hud down', /body\.ui-small \{ --ui-zoom: 0\.85; \}/.test(css));
check('large scales the hud up', /body\.ui-large \{ --ui-zoom: 1\.18; \}/.test(css));
// zoom (not transform) is required, or touch hit-testing breaks on every button.
check('the hud scales with zoom, not transform',
  /#ui-layer \{\s*\n\s*zoom: var\(--ui-zoom, 1\);/.test(css));
check('the zoom is cancelled so it does not overflow',
  /width: calc\(100% \/ var\(--ui-zoom, 1\)\)/.test(css));
// The main menu must be untouched by the HUD size setting.
check('the hud size never touches the main menu', !/body\.ui-(small|large)[^{]*\.title-/.test(css));

/* ---------- redesigned pad ---------- */
check('the pad clears notches and home bars',
  /env\(safe-area-inset-bottom/.test(css) && /env\(safe-area-inset-left/.test(css));
check('pad buttons have a glass backdrop', /backdrop-filter: blur\(6px\)/.test(css));
check('the pressed state lights up', /\.touch-btn\.is-down \{[\s\S]*?rgba\(250, 204, 21, \.3\)/.test(css));
check('the primary action stays tinted', /\.touch-attack \{[\s\S]*?border-color: rgba\(250, 204, 21, \.6\)/.test(css));

console.log('');
console.log(failed ? 'MOBILE QA FAILED: ' + failed + ' check(s)' : 'MOBILE QA PASSED: all checks green');
process.exit(failed ? 1 : 0);
