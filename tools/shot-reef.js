const fs=require('fs');const path=require('path');const vm=require('vm');
const mini=require('./mini-canvas.js');
function makeEl(id){return {id,width:960,height:720,textContent:'',innerHTML:'',style:{},dataset:{},classList:{add(){},remove(){},contains(){return false},toggle(){}},getContext:function(){ const mini=require('./mini-canvas.js'); this._c = this._c || mini.createCtx(300,300,1); return this._c; },addEventListener(){},removeEventListener(){},appendChild(){},querySelector:()=>null,querySelectorAll:()=>[],remove(){},parentNode:{removeChild(){}},setAttribute(){},getAttribute:()=>null,className:'',value:''};}
const els={};
global.document={readyState:'complete',scripts:[],getElementById:id=>els[id]||(els[id]=makeEl(id)),createElement:t=>makeEl(t),addEventListener(){},removeEventListener(){},querySelector:()=>null,querySelectorAll:()=>[],body:makeEl('body')};
global.window=global;global.localStorage={getItem:()=>null,setItem(){},removeItem(){}};
vm.runInThisContext(fs.readFileSync('world.js','utf8'),{filename:'world.js'});
vm.runInThisContext(fs.readFileSync('ocean.js','utf8'),{filename:'ocean.js'});
const W=new global.World(440,175,777);
W.generateReef();
const T=global.TILES;
const rb=W.reefBounds;
console.log('reefBounds left='+rb.left+' right='+rb.right+' seaY='+rb.seaY);
function render(name,minX,minY,tw,th){
  const ctx=mini.createCtx(tw*24,th*24,1);
  ctx.fillStyle='#0b2545';ctx.fillRect(0,0,tw*24,th*24);
  let wallAir=0;
  for(let y=minY;y<minY+th;y++)for(let x=minX;x<minX+tw;x++){
    const idx=y*W.width+x;
    if(W.tiles[idx]===T.AIR&&W.walls[idx])wallAir++;
    const t=W.tiles[idx];
    if(t===T.AIR)continue;
    const sx=(x-minX)*24,sy=(y-minY)*24;
    W.drawTileGraphic(ctx,t,sx,sy,x,y,W.getTile(x,y-1)===T.AIR);
  }
  mini.writePNG(ctx,'tools/shots/'+name+'.png');
  console.log(name+' wallAir='+wallAir);
}
render('reef-top',30,0,32,60);
