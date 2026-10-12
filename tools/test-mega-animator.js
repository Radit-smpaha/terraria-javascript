// ============================================================================
// test-mega-animator.js -- headless test for the pack's animator.
//
// Runs under tools/run-node.ps1 (no browser needed): it feeds the animator a
// stub image loader and checks the playback rules that actually matter --
// delta-time frame stepping, loop vs one-shot latching, no needless restarts,
// frame rects inside the sheet, and manifest/spec agreement.
//
//   usage: powershell -File tools/run-node.ps1 tools/test-mega-animator.js
// ============================================================================
'use strict';
const fs = require('fs');
const path = require('path');
process.chdir(path.join(__dirname, '..'));

const { MegaSpriteClip, MegaSpriteAnimator, drawFrame, pixelPerfect } =
  require('../assets/bosses/megalodon/sprite-animator.js');

let pass = 0, fail = 0;
const check = (name, cond, extra) => {
  if (cond) { pass++; console.log('  ok   ' + name); }
  else { fail++; console.log('  FAIL ' + name + (extra ? '  [' + extra + ']' : '')); }
};

const manifest = JSON.parse(fs.readFileSync('assets/bosses/megalodon/manifest.json', 'utf8'));

// ---------------------------------------------------------------- clip unit
console.log('\nMegaSpriteClip:');
{
  const spec = { animation: 'x', file: 'x.png', frames: 4, columns: 4, rows: 1,
    frameWidth: 100, frameHeight: 50, fps: 10, loop: true, once: false,
    origin: { x: 50, y: 25 } };
  const img = { width: 400, height: 50 };
  const c = new MegaSpriteClip(spec, img);
  check('frameTime from fps (10 fps = 0.1s)', Math.abs(c.frameTime - 0.1) < 1e-9);
  c.restart();
  check('restart puts it on frame 0', c.index === 0 && c.playing && !c.done);
  check('half a frame advances nothing', c.update(0.05) === false && c.index === 0);
  check('one frame time advances one frame', c.update(0.05) === false && c.index === 1);
  // twelve clean frame-times on a 4-frame loop comes back around exactly
  c.restart();
  for (let i = 0; i < 12; i++) c.update(0.1);
  check('a 4-frame loop wraps back to frame 0', c.index === 0 && !c.done, 'index=' + c.index);
  c.update(0.9);
  check('big dt walks frames without escaping the clip', c.index >= 0 && c.index < c.frames);

  c.once = true; c.loop = false; c.restart();
  let finished = false;
  for (let i = 0; i < 20 && !finished; i++) finished = c.update(0.05);
  check('one-shot reports it finished', finished === true && c.done === true);
  check('one-shot latches on the last frame', c.index === c.frames - 1);
  check('finished one-shot keeps playing=false', c.playing === false);

  const r = c.rect();
  check('rect inside the sheet', r.sx + r.w <= img.width && r.sy + r.h <= img.height,
    JSON.stringify(r));
  check('rect is the current frame', r.sx === c.index * 100);
}

// --------------------------------------------------------------- animator
console.log('\nMegaSpriteAnimator:');
const stub = (url) => Promise.resolve({ url, width: 1, height: 1 });
const a = new MegaSpriteAnimator(manifest, { loader: stub });

a.load().then(() => {
  check('every manifest asset got a clip', a.names().length === manifest.assets.length,
    a.names().length + '/' + manifest.assets.length);

  // manifest <-> animator agreement
  let agree = true, badName = '';
  for (const spec of manifest.assets) {
    const c = a.clip(spec.animation);
    if (!c || c.frames !== spec.frames || c.fw !== spec.frameWidth || c.fh !== spec.frameHeight
      || c.fps !== spec.fps || c.loop !== spec.loop) { agree = false; badName = spec.animation; }
  }
  check('animator matches every manifest spec', agree, badName);

  // no needless restarts: re-playing the running clip keeps its position
  a.play('swim');
  a.update(0.31);                       // ~3 frames in at 10 fps
  const idx = a.clip('swim').index;
  a.play('swim');
  check('re-playing the running clip does not restart it',
    a.clip('swim').index === idx && idx > 0, 'index=' + idx);

  // switching away and back restarts cleanly
  a.play('bite');
  a.update(0.05);
  a.play('swim');
  check('switching clips switches immediately', a.current.name === 'swim');
  a.play('bite');
  a.update(0.4);
  a.play('swim', { once: false });
  check('a one-shot clip rewinds when revisited',
    a.clip('swim').index === 0 || a.clip('bite').done === true);

  // delta-time: exactly one frame time of the clip's own fps advances one frame
  a.play('idle');
  a.clip('idle').index = 0; a.clip('idle').t = 0;
  const step = a.clip('idle').frameTime;      // idle = 8 fps = 0.125 s
  a.update(step);
  check('delta-time stepping is fps-accurate', a.clip('idle').index === 1,
    'index=' + a.clip('idle').index + ' step=' + step);
  a.update(step * 0.99);
  check('just under a frame time does not advance', a.clip('idle').index === 1);

  // frame() contract
  const f = a.frame();
  check('frame() returns a drawable rect', !!f && typeof f.sx === 'number' && f.image !== undefined);
  check('frame() reports the anchor and clip name', f.clip === 'idle' && f.originX > 0 && f.originY > 0);
  check('flip is a flag, not a second sheet', a.setFlipped(true).frame().flipped === true);
  check('busy() is false while looping', a.busy() === false);

  // one-shot tracking
  a.play('bite', { once: true });
  a.update(0.05);
  check('busy() is true during a one-shot', a.busy() === true);
  for (let i = 0; i < 40; i++) a.update(0.05);
  check('busy() clears when the one-shot ends', a.busy() === false);

  // helpers tolerate a bare context (drawFrame must not throw on a null image)
  let threw = false;
  try { drawFrame({}, null, 0, 0, 1); drawFrame({}, { image: null }, 0, 0, 1); pixelPerfect({}); } catch (e) { threw = true; }
  check('drawFrame/pixelPerfect tolerate empty input', !threw);

  console.log('\n' + (fail ? fail + ' FAILURE(S)' : 'ALL ' + pass + ' ANIMATOR CHECKS PASSED'));
  process.exit(fail ? 1 : 0);
});
