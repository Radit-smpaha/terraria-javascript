// TEMPORARY verification harness (deleted after use). Renders the REAL boss
// render() + renderTelegraph() through mini-canvas so the silhouette and the
// red-skill redesign can be inspected without a browser.
'use strict';
const fs = require('fs');
const vm = require('vm');
const mini = require('./mini-canvas.js');
const ROOT = require('path').join(__dirname, '..');
process.chdir(ROOT);
function makeEl(id) {
  return { id, width: 800, height: 600, textContent: '', innerHTML: '', style: {}, dataset: {},
    classList: (() => { const s = new Set(); return { add: c => s.add(c), remove: c => s.delete(c), contains: c => s.has(c), toggle: () => false }; })(),
    getContext: () => null, addEventListener() {}, removeEventListener() {}, appendChild() {},
    querySelector: () => null, querySelectorAll: () => [], closest: () => null, remove() {},
    parentNode: { removeChild() {} }, setAttribute() {}, getAttribute: () => null, className: '', value: '' };
}
const els = {};
global.document = { getElementById: (id) => els[id] || (els[id] = makeEl(id)), querySelector: () => null,
  querySelectorAll: () => [], createElement: (t) => makeEl(t), addEventListener() {}, removeEventListener() {},
  body: makeEl('body'), documentElement: makeEl('html') };
global.window = global;
global.localStorage = { getItem: () => null, setItem() {}, removeItem() {} };
global.requestAnimationFrame = () => 0; global.cancelAnimationFrame = () => {};
global.performance = { now: () => Date.now() };
global.Image = class { set src(v) {} };
try { global.navigator = { userAgent: 'node' }; } catch (e) {}
for (const f of ['audio.js','particles.js','world.js','weather.js','entities.js','underworld.js','juice.js','npcs.js','journey.js','multiplayer.js','space.js','ocean.js']) {
  vm.runInThisContext(fs.readFileSync(f, 'utf8'), { filename: f });
}
const world = new global.World(440, 175, 12345);
const arena = world.generateOceanPlanet();
const game = { world, titleScreenOpen: false, paused: false,
  player: { x: arena.arenaCX + 420, y: arena.arenaCY - 60, width: 24, height: 40, hp: 100 },
  projectiles: [], particles: new global.ParticleSystem(), sound: null, feel: null,
  buffs: { add() {} }, damagePlayer() {}, isDead: false, camera: { x: 0, y: 0 } };
const CX = 400, CY = 300;
function makeBoss() {
  const boss = new global.Megalodon ? new global.Megalodon(arena.arenaCX, arena.arenaCY, 3)
    : null;
  return boss;
}
// The Megalodon reuses the Kraken class name in this build.
console.log('has Kraken=' + (typeof global.Kraken) + ' has renderTelegraph=' + (global.Kraken && typeof global.Kraken.prototype.renderTelegraph));
function reset() {
  const b = new global.Kraken(arena.arenaCX, arena.arenaCY, 3);
  for (let i = 0; i < 90; i++) b.update(1/60, game.player, game.projectiles, null, game.particles);
  b.x = CX - b.width/2; b.y = CY - b.height/2; b.vx = 260; b.vy = 40;
  b.pitch = 0; b.lean = 0; b.sway = 0; b.bob = 0; b.surge = 0.5; b.jawOpen = b.jawTarget || 0.12;
  return b;
}
function bg(ctx, W, H) {
  const bands = [['#050b18',0,0.18],['#071224',0.18,0.42],['#08182c',0.42,0.66],['#0a1e36',0.66,0.84],['#0b2440',0.84,1]];
  for (const [c,a,bb] of bands) { ctx.fillStyle=c; ctx.fillRect(0,H*a,W,H*(bb-a)+1); }
}
function shot(name, mutate, opts) {
  opts = opts || {};
  const W=800,H=600; const b=reset(); if (mutate) mutate(b, game);
  const ctx=mini.createCtx(W,H,2); bg(ctx,W,H); const cv=ctx.canvas.__cv; const snap=cv.buf.slice();
  if (opts.telegraph) { try { b.renderTelegraph(ctx, {x:0,y:0}); } catch(e){ console.log('telegraph err', e.message); } }
  b.render(ctx, {x:0,y:0});
  if (!fs.existsSync('tools/shots')) fs.mkdirSync('tools/shots', {recursive:true});
  mini.writePNG(ctx, 'tools/shots/'+name+'.png');
  // Count strongly-red pixels (the old circle) in screen space.
  let red=0, changed=0;
  for (let i=0;i<cv.W*cv.H;i++){ const o=i*4; const r=cv.buf[o],g=cv.buf[o+1],bl=cv.buf[o+2];
    if (r>150 && g<90 && bl<90) red++;
    if (Math.abs(cv.buf[o]-snap[o])>2) changed++; }
  console.log(name+': redPx='+red+' changedPx='+changed+' w='+b.width+' h='+b.height);
}
shot('verify-swim', b=>{ b.phase=1; });
shot('verify-head', b=>{ b.phase=1; b.jawTarget=0.4; b.jawOpen=0.4; });
shot('verify-headopen', b=>{ b.phase=1; b.jawTarget=1; b.jawOpen=1; });
shot('verify-suction', b=>{
  b.phase=3; b.jawOpen=0.9;
  b.pending={type:'devouring_maw', x:b.x+b.width*0.5, y:b.y+b.height*0.5, radius:420*2.25, timer:0.4, total:0.9, angle:0.1, target:{x:game.player.x,y:game.player.y}};
}, {telegraph:true});
shot('verify-suction-late', b=>{
  b.phase=3; b.jawOpen=1;
  b.pending={type:'devouring_maw', x:b.x+b.width*0.5, y:b.y+b.height*0.5, radius:420*2.25, timer:0.05, total:0.9, angle:0.1, target:{x:game.player.x,y:game.player.y}};
}, {telegraph:true});
