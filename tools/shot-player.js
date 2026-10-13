const fs=require('fs');const vm=require('vm');
const mini=require('./mini-canvas.js');
function makeCtx(){return new Proxy({},{get(t,p){if(p==='canvas')return {};if(p==='createRadialGradient'||p==='createLinearGradient')return()=>({addColorStop(){}});if(p==='getImageData')return()=>({data:new Uint8ClampedArray(4)});if(p==='measureText')return()=>({width:10});if(typeof p==='string')return()=>undefined;return undefined;},set(){return true;}});}
function makeEl(id){return {id,width:800,height:600,textContent:'',innerHTML:'',style:{},dataset:{},classList:{add(){},remove(){},contains(){return false},toggle(){}},getContext:()=>makeCtx(),addEventListener(){},removeEventListener(){},appendChild(){},querySelector:()=>null,querySelectorAll:()=>[],closest:()=>null,remove(){},parentNode:{removeChild(){}},setAttribute(){},getAttribute:()=>null,className:'',value:''};}
const els={};
global.document={readyState:'complete',scripts:[],getElementById:id=>els[id]||(els[id]=makeEl(id)),createElement:t=>makeEl(t),addEventListener(){},removeEventListener(){},querySelector:()=>null,querySelectorAll:()=>[],body:makeEl('body')};
global.window=global;global.innerWidth=1280;global.innerHeight=720;global.devicePixelRatio=1;
global.addEventListener=()=>{};global.performance={now:()=>1000};global.requestAnimationFrame=()=>0;global.cancelAnimationFrame=()=>{};
const store=new Map();global.localStorage={getItem:k=>store.has(k)?store.get(k):null,setItem:(k,v)=>store.set(k,String(v)),removeItem:k=>store.delete(k),clear:()=>store.clear()};
const files=['audio.js','particles.js','world.js','weather.js','entities.js','underworld.js','space.js','ocean.js','juice.js','npcs.js','journey.js','multiplayer.js','terraria.js'];
const ctx=vm.createContext(global);
for(const f of files){try{vm.runInContext(fs.readFileSync(f,'utf8'),ctx,{filename:f});}catch(e){console.log('EVAL FAIL '+f+': '+e.message);process.exit(1);}}
const g=global.game;const p=g.player;
// A tiled strip: idle, walking, airborne.
const frames=[
 {label:'idle', vx:0, onGround:true, vy:0},
 {label:'walk', vx:2.4, onGround:true, vy:0},
 {label:'jump', vx:1, onGround:false, vy:-2},
 {label:'fall', vx:1, onGround:false, vy:2},
];
const c=mini.createCtx(24*4, 40*4, 4);
c.save();c.scale(4,4);
c.fillStyle='#87bfe8';c.fillRect(0,0,24*4,40);
let i=0;
for(const fr of frames){
  p.vx=fr.vx;p.vy=fr.vy;p.onGround=fr.onGround;
  p.animClock=i*140;
  p.drawPlayerBody(c, i*24, 0);
  i++;
}
c.restore();
mini.writePNG(c,'tools/shots/player-model.png');
console.log('wrote player-model.png');
