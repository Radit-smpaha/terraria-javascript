// shot-trees-zoom.js — 2x-scale crops of individual trees and decor so the
// pixel detail can be judged at a readable size. Produces tools/shots/zoom-*.png.
//   usage: python -m nodejs tools/shot-trees-zoom.js [seed]
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
world.timeOfDay = 0.28;

/** Find the tallest tree (WOOD column with LEAVES above) inside [x0,x1). */
function findTallestTree(x0, x1) {
  let best = null;
  for (let x = x0; x < x1; x++) {
    const surface = world.surfaceHeights[x];
    // Walk up the wood column from the surface.
    let y = surface;
    while (world.getTile(x, y) === TILES.WOOD) y--;
    const trunkTop = y;
    const height = surface - trunkTop;
    let leaves = 0;
    for (let ly = trunkTop - 8; ly < trunkTop + 2; ly++) {
      for (let lx = x - 6; lx <= x + 6; lx++) {
        if (world.getTile(lx, ly) === TILES.LEAVES) leaves++;
      }
    }
    if (!best || height > best.height) best = { x, trunkTop, height, leaves };
  }
  return best;
}

function renderZoom(name, minX, minY, tilesW, tilesH) {
  const SS = 2;
  const ctx = mini.createCtx(tilesW * TILE_SIZE * SS, tilesH * TILE_SIZE * SS, SS);
  ctx.save();
  ctx.scale(SS, SS);
  ctx.fillStyle = '#87bfe8';
  ctx.fillRect(0, 0, tilesW * TILE_SIZE, tilesH * TILE_SIZE);
  const sun = world.sunShade();
  const bw = tilesW + 2, bh = tilesH + 2;
  const solid = new Uint8Array(bw * bh);
  for (let y = 0; y < bh; y++) for (let x = 0; x < bw; x++) {
    const p = global.TILE_PROPERTIES[world.getTile(minX + x - 1, minY + y - 1)];
    solid[y * bw + x] = (p && p.solid) ? 1 : 0;
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
  ctx.restore();
  const file = path.join(OUT, name + '.png');
  mini.writePNG(ctx, file);
  console.log('wrote ' + file + ' (tree at x=' + minX + '..' + (minX + tilesW) + ')');
}

// Forest (163..196): three different trees side by side for variety.
const f1 = findTallestTree(163, 196);
if (f1) renderZoom('zoom-forest-a', Math.max(2, f1.x - 7), Math.max(2, f1.trunkTop - 8), 14, 18);
// Plains (196..264) — mostly grass and flowers, one lone tree if there is one.
const f2 = findTallestTree(196, 264);
if (f2 && f2.height >= 5) renderZoom('zoom-plains-a', Math.max(2, f2.x - 7), Math.max(2, f2.trunkTop - 8), 14, 18);
// Snow pines (128..163): the layered conifer.
{
  const x = 145;
  const surface = world.surfaceHeights[x];
  renderZoom('zoom-snow-a', Math.max(2, x - 7), Math.max(2, surface - 16), 14, 20);
}
// Savanna acacia (264..352).
{
  const x = 300;
  const surface = world.surfaceHeights[x];
  renderZoom('zoom-savanna-a', Math.max(2, x - 8), Math.max(2, surface - 12), 16, 16);
}
// Swamp mangrove (352..440).
{
  const x = 395;
  const surface = world.surfaceHeights[x];
  renderZoom('zoom-swamp-a', Math.max(2, x - 9), Math.max(2, surface - 14), 18, 18);
}
console.log('done');
