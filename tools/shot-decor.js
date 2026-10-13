const fs=require('fs');const vm=require('vm');
const mini=require('./mini-canvas.js');
function makeEl(id){return {id,width:960,height:720,textContent:'',innerHTML:'',style:{},dataset:{},classList:{add(){},remove(){},contains(){return false},toggle(){}},getContext:()=>null,addEventListener(){},removeEventListener(){},appendChild(){},querySelector:()=>null,querySelectorAll:()=>[],remove(){},parentNode:{removeChild(){}},setAttribute(){},getAttribute:()=>null,className:'',value:''};}
const els={};
global.document={readyState:'complete',scripts:[],getElementById:id=>els[id]||(els[id]=makeEl(id)),createElement:t=>makeEl(t),addEventListener(){},removeEventListener(){},querySelector:()=>null,querySelectorAll:()=>[],body:makeEl('body')};
global.window=global;global.localStorage={getItem:()=>null,setItem(){},removeItem(){}};
vm.runInThisContext(fs.readFileSync('world.js','utf8'),{filename:'world.js'});
const W=new global.World(440,175,777);
const T=global.TILES;
// A wall of 6 trophy mounts on a plank backdrop.
const N=6;
const ctx=mini.createCtx(N*24*3, 24*3, 3);
ctx.save();ctx.scale(3,3);
ctx.fillStyle='#4a443c';ctx.fillRect(0,0,N*24,24);
for(let i=0;i<N;i++){ ctx.fillStyle='#4a443c'; ctx.fillRect(i*24,0,24,24); }
for(let i=0;i<N;i++){ W.drawTileGraphic(ctx, T.MEGALODON_TROPHY, i*24, 0, 300+i, 40, false); }
// A pebble row and a glowshroom next to it for scale.
for(let i=0;i<N;i++) W.drawTileGraphic(ctx, T.PEBBLE, i*24, 12, 200+i, 20, false);
W.drawTileGraphic(ctx, T.GLOWSHROOM, 0, 18, 5, 5, false);
W.drawTileGraphic(ctx, T.SAPLING, 24, 18, 8, 8, false);
W.drawTileGraphic(ctx, T.FALLEN_LEAF, 48, 18, 9, 9, false);
W.drawTileGraphic(ctx, T.BUSH, 72, 18, 10, 10, false);
ctx.restore();
mini.writePNG(ctx,'tools/shots/trophy-decor.png');
console.log('wrote tools/shots/trophy-decor.png');
