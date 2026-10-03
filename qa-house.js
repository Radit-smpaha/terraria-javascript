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

/* ---------- the floor is real ground-level, not floating ---------- */
// The house floor must sit directly on the terrain: solid at groundY - 1 and
// still solid terrain at groundY underneath it.
check('the house has a solid floor', W.getTile(spawnX, groundY - 1) === TILES.STONE_BRICK,
  'tile=' + W.getTile(spawnX, groundY - 1));
check('the floor rests on the terrain', W.isSolid(spawnX, groundY),
  'tile=' + W.getTile(spawnX, groundY));
// Nothing may hang in the gap between the floor and the ground.
const buried = [];
for (let x = spawnX - 6; x <= spawnX + 6; x++) {
  const t = W.getTile(x, groundY - 1);
  if (t === TILES.CAMPFIRE || t === TILES.CHEST || t === TILES.BED) buried.push(x + '=' + t);
}
check('nothing is buried in the floor', buried.length === 0, buried.join(' '));

/* ---------- the furnishings are INSIDE, on the standing row ---------- */
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
  const inside = hits.filter((h) => h.y === roomY && Math.abs(h.x - spawnX) <= 5);
  check('the ' + name + ' is inside the house', inside.length > 0,
    hits.map((h) => h.x + ',' + h.y).join(' '));
}

// Standing row must be enclosed: walls either side, a roof overhead.
check('the standing row is walled left', W.isSolid(spawnX - 6, roomY));
check('the standing row is walled right', W.isSolid(spawnX + 6, roomY));
// buildHouseShell(halfWidth=6, height=6): top = groundY - 6, and the roof is
// layered at top, top - 1 and top - 2. So the highest roof board is
// groundY - 8, and the room's open head-height is groundY - 5..groundY - 3.
const roofY = groundY - 8;
check('there is a roof over the room', W.isSolid(spawnX, roofY),
  'tile=' + W.getTile(spawnX, roofY) + ' at y=' + roofY);
check('the room has open head height', !W.isSolid(spawnX, roomY - 2),
  'tile=' + W.getTile(spawnX, roomY - 2));

/* ---------- the doorway is still walkable ---------- */
check('the doorway tile is open', W.getTile(spawnX, groundY - 2) === TILES.AIR,
  'tile=' + W.getTile(spawnX, groundY - 2));
// And it must not be blocked by a solid furnishing standing in the opening.
const doorBlocked = find(TILES.CHEST).some((h) => h.x === spawnX && h.y === roomY) ||
  find(TILES.BED).some((h) => h.x === spawnX && h.y === roomY);
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
}

console.log('');
console.log(failed ? 'HOUSE QA FAILED: ' + failed + ' check(s)' : 'HOUSE QA PASSED: all checks green');
process.exit(failed ? 1 : 0);
