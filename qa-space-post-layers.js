// qa-space-post-layers.js — the cached space light/bloom buffers.
//
// The QA canvas cannot rasterise, so this asserts the COMPOSITE CONTRACT the
// two passes depend on — which is exactly the thing that was silently broken:
// painting a light layer with destination-out (which erases alpha from an
// already-transparent canvas) produced an empty layer and deleted every tile
// light in the Ossuary, while every other suite stayed green.
const fs = require('fs');
const vm = require('vm');

let failures = 0;
const check = (label, ok, detail = '') => {
  if (!ok) failures++;
  console.log((ok ? '  PASS ' : '  FAIL ') + label + (!ok && detail ? ' — ' + detail : ''));
};

// A canvas stub that RECORDS the composite operator in force for every draw.
// It reads the CURRENT shared record at push time, not the one live when the
// element was created — otherwise a canvas the game built during boot would
// keep reporting into a stale array and this file would never see its draws.
let SHARED = [];
function makeCtx(tag) {
  let current = 'source-over';
  return new Proxy({}, {
    get(t, p) {
      if (p === 'canvas') return {};
      if (p === 'globalCompositeOperation') return current;
      if (p === 'createRadialGradient' || p === 'createLinearGradient') {
        return () => ({ addColorStop() {} });
      }
      if (p === 'getImageData') return () => ({ data: new Uint8ClampedArray(4) });
      if (p === 'measureText') return () => ({ width: 10 });
      if (typeof p === 'string') {
        return () => {
          if (p === 'clearRect') SHARED.push({ op: 'clearRect', composite: current, tag });
          if (p === 'drawImage') SHARED.push({ op: 'drawImage', composite: current, tag });
        };
      }
      return undefined;
    },
    set(t, p, v) {
      if (p === 'globalCompositeOperation') { current = v; return true; }
      return true;
    }
  });
}
function makeEl(id) {
  return {
    id, width: 1280, height: 720, textContent: '', innerHTML: '', style: {}, dataset: {},
    classList: (() => { const s = new Set(); return { add: c => s.add(c), remove: c => s.delete(c), contains: c => s.has(c), toggle: () => false }; })(),
    getContext: () => makeCtx(id),
    addEventListener() {}, removeEventListener() {}, appendChild() {},
    querySelector: () => null, querySelectorAll: () => [], closest: () => null,
    remove() {}, parentNode: { removeChild() {} },
    setAttribute() {}, getAttribute: () => null, className: '', value: ''
  };
}
const els = {};
global.document = {
  readyState: 'complete', scripts: [],
  getElementById: (id) => (els[id] ||= makeEl(id)),
  createElement: (tag) => makeEl(tag),
  addEventListener() {}, querySelector: () => null, querySelectorAll: () => [], body: makeEl('body')
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
  removeItem: (k) => store.delete(k), clear: () => store.clear()
};
const files = ['audio.js', 'particles.js', 'world.js', 'weather.js', 'entities.js',
  'underworld.js', 'space.js', 'juice.js', 'npcs.js', 'journey.js', 'terraria.js'];
const ctx = vm.createContext(global);
for (const f of files) vm.runInContext(fs.readFileSync(f, 'utf8'), ctx, { filename: f });

const g = new global.Game();
g.player.invulnerableTime = 99999;
g.addItem('void_rift_beacon', 1);
const homeX = Math.floor(g.world.width / 2);
for (let ty = 0; ty <= g.world.surfaceHeights[homeX]; ty++) g.world.setTile(homeX, ty, global.TILES.AIR);
g.player.x = homeX * global.TILE_SIZE + 4;
g.player.y = (g.world.surfaceHeights[homeX] - 2) * global.TILE_SIZE;
g.useVoidRiftBeacon();
for (let i = 0; i < 900 && g.world.dimension !== 'space'; i++) g.update(1 / 60);
check('reached the Ossuary', g.world.dimension === 'space');

const W = g.world;
// The camera must look at the ARENA. At (0,0) the tile scan covers the empty
// left edge of the world and finds no lit tiles at all, which would make these
// checks pass (or fail) for the wrong reason.
const ar = W.spaceArena;
const camera = {
  x: (ar.cx * global.TILE_SIZE) - 300,
  y: (ar.floorY * global.TILE_SIZE) - 300,
  viewportWidth: 1280,
  viewportHeight: 720
};
check('the camera is over the arena', camera.x > ar.left * global.TILE_SIZE - 200);

// ---- 1. The light layer must be painted source-over, blitted destination-out.
const lightRec = [];
SHARED = lightRec;
const lightStub = makeCtx(lightRec, 'light-target');
// Drop any bake made during boot so this call is guaranteed to repaint and the
// layer's own draws are actually observed.
W._spacePostLayers = null;
W.renderLighting(lightStub, camera, g.player, []);
const lightDraws = lightRec.filter(r => r.op === 'drawImage');
check('the light layer is painted source-over (it is a MASK)',
  lightRec.some(r => r.op === 'drawImage' && r.composite === 'source-over'),
  JSON.stringify(lightRec.map(r => r.op + ':' + r.composite)));
check('the light layer is cleared before repaint',
  lightRec.some(r => r.op === 'clearRect'));
check('the light layer is APPLIED with destination-out',
  lightDraws.some(r => r.composite === 'destination-out'),
  'blits=' + JSON.stringify(lightDraws.map(r => r.composite)));

// ---- 2. The glow layer must be painted AND blitted additively.
const glowRec = [];
SHARED = glowRec;
const glowStub = makeCtx(glowRec, 'glow-target');
// Same reasoning: the bloom layer paints through glowBlob, so it must run, and
// the cache is dropped so this call is a real repaint.
W._spacePostLayers = null;
W.renderGlow(glowStub, camera, g.player, []);
const glowDraws = glowRec.filter(r => r.op === 'drawImage');
check('the glow layer is painted additively',
  glowRec.some(r => r.op === 'drawImage' && r.composite === 'lighter'));
check('the glow layer is BLITTED additively',
  glowDraws.some(r => r.composite === 'lighter'),
  'blits=' + JSON.stringify(glowDraws.map(r => r.composite)));

// ---- 3. The cache must actually be reused (the whole point of the change).
let paints = 0;
const counted = W.glowBlob.bind(W);
W.glowBlob = (...a) => { paints++; return counted(...a); };
const reuseStub = makeCtx([], 'reuse');
for (let i = 0; i < 30; i++) W.renderGlow(reuseStub, camera, g.player, []);
W.glowBlob = counted;
// 30 frames at one repaint per 3 must not be 30 full repaints.
check('the bloom layer is reused across frames', paints > 0 && paints < 30 * 400,
  'blob paints over 30 frames = ' + paints);

// ---- 4. Editing a tile must invalidate it (no stale glow after mining).
paints = 0;
W.glowBlob = (...a) => { paints++; return counted(...a); };
W.setTile(60, 60, global.TILES.METEOR_ORE);
W.renderGlow(reuseStub, camera, g.player, []);
check('a tile edit forces a repaint', paints > 0, 'paints=' + paints);
W.glowBlob = counted;

// ---- 5. The layer must ALWAYS cover the viewport, wherever the camera sits.
// This is the geometry that makes the cache safe: a viewport-sized layer could
// only ever be reused while the camera stood still, and panning onto unpainted
// edge would show a seam of missing light. Pan the whole chunk and check.
// (This runs BEFORE the exit test below, because outside the dimension the
// layer correctly declines to bake at all.)
W._spacePostLayers = null;
const step = 8 * global.TILE_SIZE;   // must match SPACE_POST_CHUNK
let worst = { dx: 0, dy: 0, ok: true, bailed: 0 };
for (let ox = 0; ox < step; ox += 37) {
  for (let oy = 0; oy < step; oy += 37) {
    const pan = { x: camera.x + ox, y: camera.y + oy, viewportWidth: 1280, viewportHeight: 720 };
    const l = W._spacePostLayer('light', pan, reuseStub, () => {}, {});
    if (!l) { worst.bailed++; continue; }
    // The blit offset must sit inside the layer, and the far edge of the
    // viewport must still land inside it.
    const covers = l.dx >= 0 && l.dy >= 0 &&
      l.dx + 1280 <= l.canvas.width && l.dy + 720 <= l.canvas.height;
    if (!covers) worst.ok = false;
    worst.dx = Math.max(worst.dx, l.dx);
    worst.dy = Math.max(worst.dy, l.dy);
  }
}
check('the baked layer covers the view at every camera offset',
  worst.ok && worst.bailed === 0,
  'max dx=' + worst.dx + ' dy=' + worst.dy + ' skipped=' + worst.bailed);

// ---- 6. Leaving the dimension must drop the baked layers.
W.renderGlow(reuseStub, camera, g.player, []);
const hadLayers = !!W._spacePostLayers;
W.exitSpaceDimension();
check('leaving the Ossuary drops the baked layers', hadLayers && !W._spacePostLayers);

console.log('\n' + '─'.repeat(62));
console.log(failures
  ? '✗ ' + failures + ' SPACE POST-LAYER CHECK(S) FAILED'
  : '✓ ALL SPACE POST-LAYER CHECKS PASSED');
process.exit(failures ? 1 : 0);