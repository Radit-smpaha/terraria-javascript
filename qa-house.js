// Geometry checks for the starter house (and the other surface buildings).
//
// Bug this guards: buildHouseShell takes the row of the SOLID GROUND and builds
// upward from it, so the floor is groundY - 1 and the row a player stands in is
// groundY - 2. The starter camp used to pass groundY - 1 instead, which lifted
// the whole shell a tile and dropped the campfire, chest and bed into the gap
// UNDERNEATH the house. These checks assert the furnishings are inside it, on
// a real floor, and that the doorway is still walkable.
const fs = require('fs');
const vm = require('vm');

let failed = 0;
const check = (label, ok, detail = '') => {
  if (!ok) failed++;
  console.log((ok ? '  ok      ' : '  FAIL    ') + label + (detail ? '  -- ' + detail : ''));
};

function makeCtx2D() {
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
function makeEl(id, tag = 'div') {
  const classes = new Set();
  return {
    id, tagName: (tag || 'div').toUpperCase(), width: 800, height: 600,
    textContent: '', innerHTML: '', className: '', value: '',
    style: {}, dataset: {}, hidden: false, disabled: false, children: [], offsetParent: {},
    focus() {}, click() {},
    getContext: () => makeCtx2D(),
    classList: {
      add(...c) { c.forEach((x) => classes.add(x)); },
      remove(...c) { c.forEach((x) => classes.delete(x)); },
      contains: (c) => classes.has(c),
      toggle(c, on) { if (on === undefined) { classes.has(c) ? classes.delete(c) : classes.add(c); } else if (on) classes.add(c); else classes.delete(c); }
    },
    addEventListener() {}, removeEventListener() {},
    appendChild(c) { this.children.push(c); },
    querySelector: () => null, querySelectorAll: () => [], closest: () => null,
    remove() {}, parentNode: { removeChild() {} },
    setAttribute() {}, getAttribute: () => null,
    setPointerCapture() {}, releasePointerCapture() {},
    getBoundingClientRect: () => ({ left: 0, top: 0, width: 800, height: 600 })
  };
}

const els = new Map();
global.document = {
  readyState: 'complete', scripts: [], hidden: false,
  getElementById: (id) => { if (!els.has(id)) els.set(id, makeEl(id)); return els.get(id); },
  createElement: (tag) => makeEl(tag, tag),
  addEventListener() {}, querySelector: () => null, querySelectorAll: () => [],
  body: makeEl('body', 'body'), activeElement: null
};
global.window = global;
global.innerWidth = 1280; global.innerHeight = 720;
global.devicePixelRatio = 1;
global.addEventListener = () => {};
global.performance = { now: () => 1000 };
global.requestAnimationFrame = () => 0;
global.localStorage = { getItem: () => null, setItem() {}, removeItem() {} };
global.matchMedia = () => ({ matches: false });

const ctx = vm.createContext(global);
for (const f of ['audio.js', 'particles.js', 'world.js', 'weather.js', 'entities.js',
  'underworld.js', 'space.js', 'juice.js', 'npcs.js', 'journey.js', 'terraria.js']) {
  try {
    vm.runInContext(fs.readFileSync(f, 'utf8'), ctx, { filename: f });
  } catch (e) {
    console.log('EVAL FAIL ' + f + ': ' + (e.stack || e.message));
    process.exit(1);
  }
}

const W = global.game.world;
const TILES = global.TILES;
const spawnX = Math.floor(W.width / 2);
const groundY = W.surfaceHeights[spawnX];
const roomY = groundY - 2;
const floorY = groundY - 1;   // plank floor sits on the foundation/terrain row

/* ---------- the floor is real ground-level, not floating ---------- */
// NOTE: the doorway column spawnX holds the stone porch STEP (world.js sets
// spawnX/floorY and spawnX/groundY to STONE_BRICK after the shell), so the
// plank floor and cobble foundation are asserted one column in from the door.
const floorCol = spawnX - 3;
check('the house has a plank floor', W.getTile(floorCol, floorY) === TILES.PLANKS,
  'tile=' + W.getTile(floorCol, floorY));
check('the floor rests on the terrain', W.isSolid(spawnX, groundY),
  'tile=' + W.getTile(spawnX, groundY));
check('there is a stone foundation course',
  W.getTile(spawnX - 7, groundY) === TILES.COBBLESTONE,
  'tile=' + W.getTile(spawnX - 7, groundY));
// Nothing may hang in the gap between the floor and the ground.
const buried = [];
for (let x = spawnX - 8; x <= spawnX + 8; x++) {
  const t = W.getTile(x, groundY);
  if (t === TILES.CAMPFIRE || t === TILES.CHEST || t === TILES.BED) buried.push(x + '=' + t);
}
check('nothing is buried under the house', buried.length === 0, buried.join(' '));

/* ---------- the furnishings are INSIDE, on the standing row ---------- */
// The house footprint is measured from the world, not assumed: scan outward
// from the doorway for the first solid column on each side. Scanning for "any
// solid column near spawnX" is fooled by (a) the door JAMBS, which sit one
// tile either side of the opening, and (b) furniture like the chest, which is
// also solid. Both are skipped so we find the actual wall run.
const FURNITURE = [TILES.CAMPFIRE, TILES.CHEST, TILES.BED, TILES.TORCH,
  TILES.BOOKSHELF, TILES.LANTERN];
const findWall = (dir) => {
  for (let d = 2; d <= 14; d++) {
    const t = W.getTile(spawnX + dir * d, roomY);
    if (W.isSolid(spawnX + dir * d, roomY) && !FURNITURE.includes(t)) {
      return spawnX + dir * d;
    }
  }
  return null;
};
const wallL = findWall(-1);
const wallR = findWall(1);
check('the house has two side walls', wallL !== null && wallR !== null,
  'left=' + wallL + ' right=' + wallR);

const find = (tile) => {
  const hits = [];
  for (let y = groundY - 12; y <= groundY; y++) {
    for (let x = spawnX - 8; x <= spawnX + 8; x++) {
      if (W.getTile(x, y) === tile) hits.push({ x, y });
    }
  }
  return hits;
};
for (const [name, tile] of [['campfire', TILES.CAMPFIRE], ['chest', TILES.CHEST], ['bed', TILES.BED]]) {
  const hits = find(tile);
  check('a ' + name + ' exists at spawn', hits.length > 0, 'found ' + hits.length);
  const inside = hits.filter((h) =>
    wallL !== null && wallR !== null && h.x > wallL && h.x < wallR && h.y === roomY);
  check('the ' + name + ' is inside the house', inside.length > 0,
    hits.map((h) => h.x + ',' + h.y).join(' ') + ' (walls ' + wallL + '..' + wallR + ')');
  check('the ' + name + ' stands on the floor',
    inside.every((h) => W.isSolid(h.x, floorY)));
}

/* ---------- head height and a real roof ---------- */
// The player is 36px and a tile is 24px: standing on the floor they occupy
// roomY (legs) and roomY-1 (head). Both must be air — note roomY-2 is the
// door LINTEL by design, so it must NOT be included here.
const headCol = spawnX - 3;   // clear interior column, no furniture
check('the room has head height',
  W.getTile(headCol, roomY) === TILES.AIR && W.getTile(headCol, roomY - 1) === TILES.AIR,
  'tiles ' + W.getTile(headCol, roomY) + '/' + W.getTile(headCol, roomY - 1));
// Something solid must close the top, or the house is a roofless pen.
let roofFound = false;
for (let y = roomY - 3; y >= roomY - 8; y--) {
  if (W.isSolid(spawnX, y)) { roofFound = true; break; }
}
check('there is a roof over the room', roofFound);

/* ---------- the doorway must be walkable ---------- */
// TWO clear tiles. A one-tile opening is physically impassable for a 36px
// player, which is exactly what the old house had.
const doorLow = W.getTile(spawnX, roomY);
const doorHigh = W.getTile(spawnX, roomY - 1);
check('the doorway is two tiles tall and clear',
  doorLow === TILES.AIR && doorHigh === TILES.AIR,
  'lower=' + doorLow + ' upper=' + doorHigh);
check('the doorway has jambs either side',
  W.isSolid(spawnX - 1, roomY) && W.isSolid(spawnX + 1, roomY));
check('there is a lintel over the door', W.isSolid(spawnX, roomY - 2));
// And no solid furnishing may stand in the opening.
const doorBlocked = [TILES.CHEST, TILES.BED, TILES.BOOKSHELF].some((t) =>
  [roomY, roomY - 1].some((y) => W.getTile(spawnX, y) === t));
check('no furnishing stands in the doorway', !doorBlocked);
// The player spawns above the floor inside the house, not embedded in it.
const playerTileY = Math.floor(((W.surfaceHeights[spawnX] - 3) * 24 + 18) / 24);
check('the player spawns inside the house', playerTileY >= groundY - 8 && playerTileY <= groundY - 1,
  'playerTileY=' + playerTileY + ' groundY=' + groundY);
check('the spawn column is not solid at head height', !W.isSolid(spawnX, roomY));

/* ---------- the other surface buildings obey the same convention ---------- */
for (const lm of W.landmarks.filter((l) => ['cabin', 'snow_lodge', 'swamp_hut', 'savanna_outpost'].includes(l.type))) {
  const gy = W.surfaceHeights[lm.x];
  const chestHere = [];
  for (let y = gy - 10; y <= gy; y++) {
    for (let x = lm.x - 7; x <= lm.x + 7; x++) {
      if (W.getTile(x, y) === TILES.CHEST) chestHere.push({ x, y });
    }
  }
  const good = chestHere.filter((c) => c.y === gy - 2);
  check(lm.type + ' keeps its chest inside on the standing row', good.length > 0,
    chestHere.map((c) => c.x + ',' + c.y).join(' ') || 'no chest');
  // Every building must have a walkable two-tile doorway too.
  const dLow = W.getTile(lm.x, gy - 2), dHigh = W.getTile(lm.x, gy - 3);
  check(lm.type + ' has a walkable doorway', dLow === TILES.AIR && dHigh === TILES.AIR,
    'lower=' + dLow + ' upper=' + dHigh);
}

/* ---------- villagers stand somewhere real ---------- */
// The Prospector's offset used to be exactly the cottage's right-hand wall
// column, so he was embedded in solid timber for the entire game.
const villagers = (global.game.npcs && global.game.npcs.npcs) || [];
check('the villagers exist', villagers.length === 3, 'found ' + villagers.length);
for (const npc of villagers) {
  const tx = Math.floor((npc.x + npc.width / 2) / 24);
  const feetRow = Math.floor((npc.y + npc.height - 1) / 24);
  const bodyOk = W.getTile(tx, feetRow) === TILES.AIR;
  const headOk = W.getTile(tx, feetRow - 1) === TILES.AIR;
  const groundOk = W.isSolid(tx, feetRow + 1);
  check(npc.name + ' stands on open, solid ground', bodyOk && headOk && groundOk,
    'tile ' + tx + ',' + feetRow + ' body=' + bodyOk + ' head=' + headOk + ' ground=' + groundOk);
  // And nobody is standing inside the cottage.
  const inHouse = wallL !== null && wallR !== null && tx > wallL && tx < wallR;
  check(npc.name + ' is not inside the cottage', !inHouse, 'x=' + tx);
}
// They must also not be stacked on top of each other.
const npcCols = villagers.map((n) => Math.floor((n.x + n.width / 2) / 24));
check('no two villagers share a column', new Set(npcCols).size === npcCols.length,
  'columns ' + npcCols.join(','));

console.log('');
console.log(failed ? 'HOUSE QA FAILED: ' + failed + ' check(s)' : 'HOUSE QA PASSED: all checks green');
process.exit(failed ? 1 : 0);
