// shot-trees.js — renders real world tiles (trees, decor, cave dressing)
// through the mini-canvas rasterizer so the procedural art can be inspected
// without a browser. Produces tools/shots/trees-*.png.
//   usage: python -m nodejs tools/shot-trees.js [seed]
'use strict';
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const mini = require('./mini-canvas.js');

const ROOT = path.join(__dirname, '..');
process.chdir(ROOT);
const OUT = path.join(ROOT, 'tools', 'shots');
fs.mkdirSync(OUT, { recursive: true });

const SEED = Number(process.argv[2] || 777);

// ---------------------------------------------------------------- DOM stubs
function makeEl(id) {
  const el = {
    id, width: 960, height: 720, textContent: '', innerHTML: '',
    style: {}, dataset: {},
    classList: (() => { const s = new Set(); return { add: c => s.add(c), remove: c => s.delete(c), contains: c => s.has(c), toggle: () => false }; })(),
    addEventListener() {}, removeEventListener() {}, appendChild() {},
    querySelector: () => null, querySelectorAll: () => [], closest() { return null; },
    remove() {}, parentNode: { removeChild() {} }, setAttribute() {}, getAttribute: () => null,
    className: '', value: ''
  };
  el.getContext = () => mini.createCtx(el.width, el.height, 1);
  return el;
}
const els = {};
global.document = {
  readyState: 'complete', scripts: [],
  getElementById: (id) => els[id] || (els[id] = makeEl(id)),
  querySelector: () => null, querySelectorAll: () => [],
  createElement: (tag) => makeEl(tag),
  addEventListener() {}, removeEventListener() {},
  body: makeEl('body'), documentElement: makeEl('html')
};
global.window = global;
global.localStorage = { getItem: () => null, setItem() {}, removeItem() {} };
global.requestAnimationFrame = () => 0;
global.cancelAnimationFrame = () => {};
global.performance = { now: () => Date.now() };
global.innerWidth = 1280; global.innerHeight = 720;
global.devicePixelRatio = 1;
global.addEventListener = () => {};

vm.runInThisContext(fs.readFileSync('world.js', 'utf8'), { filename: 'world.js' });

const TILE_SIZE = global.TILE_SIZE;
const TILES = global.TILES;
const world = new global.World(440, 175, SEED);

// Midday sun so the shot matches what the player sees at noon.
world.timeOfDay = 0.28;

function renderWindow(name, minX, minY, tilesW, tilesH) {
  const cw = tilesW * TILE_SIZE, ch = tilesH * TILE_SIZE;
  const ctx = mini.createCtx(cw, ch, 1);
  // Sky-ish backdrop so empty air is not black.
  ctx.fillStyle = '#87bfe8';
  ctx.fillRect(0, 0, cw, ch);
  const sun = world.sunShade();
  const bw = tilesW + 2, bh = tilesH + 2;
  const solid = new Uint8Array(bw * bh);
  for (let y = 0; y < bh; y++) {
    for (let x = 0; x < bw; x++) {
      const tl = world.getTile(minX + x - 1, minY + y - 1);
      const p = global.TILE_PROPERTIES[tl];
      solid[y * bw + x] = (p && p.solid) ? 1 : 0;
    }
  }
  for (let y = minY; y < minY + tilesH; y++) {
    for (let x = minX; x < minX + tilesW; x++) {
      const tile = world.tiles[y * world.width + x];
      if (tile === TILES.AIR) continue;
      const sx = (x - minX) * TILE_SIZE, sy = (y - minY) * TILE_SIZE;
      const lx = x - minX + 1, ly = y - minY + 1;
      const exposedTop = world.getTile(x, y - 1) === TILES.AIR;
      world.drawTileGraphic(ctx, tile, sx, sy, x, y, exposedTop);
      const buried = solid[ly * bw + lx - 1] && solid[ly * bw + lx + 1] &&
        solid[(ly - 1) * bw + lx] && solid[(ly + 1) * bw + lx];
      if (buried || world.isAnimatedTile(tile)) continue;
      world.shadeEdgesFast(ctx, sx, sy, lx, ly, bw, solid);
      if (exposedTop && !buried) {
        ctx.fillStyle = 'rgba(255, 250, 220, 0.16)';
        ctx.fillRect(sx, sy, TILE_SIZE, 1);
      }
      world.applyTileLightFast(ctx, sx, sy, sun);
    }
  }
  const file = path.join(OUT, name + '.png');
  mini.writePNG(ctx, file);
  console.log('wrote ' + file);
}

// A tall window that always starts a little above the surface.
function surfaceWindow(name, centerX) {
  const base = Math.max(4, centerX - 14);
  let top = world.surfaceHeights[base];
  for (let x = base; x < base + 28; x++) top = Math.min(top, world.surfaceHeights[x]);
  top -= 14;
  const h = Math.min(30, world.height - top - 2);
  renderWindow(name, base, top, 28, h);
}

// Biomes: reef 0..128, snow 128..163, forest 163..196, plains 196..264,
// savanna 264..352, swamp 352..440 (weights over a 440-tile world).
surfaceWindow('trees-snow', 145);
surfaceWindow('trees-forest', 180);
surfaceWindow('trees-plains', 230);
surfaceWindow('trees-savanna', 300);
surfaceWindow('trees-swamp', 395);

// Cave dressing: find a chamber landmark and render a slice around it.
{
  const ch = (world.landmarks || []).find(l => l.type === 'cavern' || l.type === 'deep_cavern');
  if (ch) {
    renderWindow('trees-cave', Math.max(2, ch.x - 14), Math.max(2, ch.y - 10), 28, 20);
  } else {
    renderWindow('trees-cave', 30, 70, 28, 20);
  }
}
console.log('done');
