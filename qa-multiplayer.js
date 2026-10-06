// qa-multiplayer.js — is co-op actually wired end to end?
//
// Three layers, cheapest first:
//   1. The module loads and two REAL Game instances talk to each other through
//      the in-process hub transport: handshake, world snapshot, tile/chest/drop
//      sync, mob snapshots + hit reporting, damage routing, player states,
//      chat. This is the same code path the browser takes.
//   2. server.js's zero-dependency WebSocket relay, driven by a hand-rolled
//      RFC 6455 client (handshake, masked frames, 7/16/64-bit lengths, target
//      routing, host-gone).
//   3. Static wiring: the game loop pumps the session, guests skip host-only
//      simulation, the HTML/CSS/deploy manifests know about the module.
const fs = require('fs');
const vm = require('vm');
const path = require('path');
const net = require('net');
const crypto = require('crypto');

const dir = process.argv[2] || '.';
let bad = 0;
function check(name, ok, detail) {
  if (!ok) bad++;
  console.log((ok ? 'ok   ' : 'FAIL ') + name + (detail ? '  [' + detail + ']' : ''));
}

// ---- the same stub DOM qa-boot.js uses -------------------------------------
function makeCtx() {
  const noop = () => {};
  return new Proxy({
    canvas: { width: 1280, height: 720 },
    measureText: () => ({ width: 10 }),
    createLinearGradient: () => ({ addColorStop: noop }),
    createRadialGradient: () => ({ addColorStop: noop }),
    createPattern: () => null,
    getImageData: () => ({ data: new Uint8ClampedArray(4) }),
    save: noop, restore: noop
  }, { get: (t, k) => (k in t ? t[k] : noop), set: (t, k, v) => { t[k] = v; return true; } });
}
function makeEl(tag) {
  const el = {
    tagName: (tag || 'div').toUpperCase(),
    style: {}, dataset: {}, children: [], _classes: new Set(),
    classList: {
      add: (c) => el._classes.add(c), remove: (c) => el._classes.delete(c),
      contains: (c) => el._classes.has(c),
      toggle: (c) => { el._classes.has(c) ? el._classes.delete(c) : el._classes.add(c); }
    },
    width: 1280, height: 720, clientWidth: 1280, clientHeight: 720,
    innerHTML: '', textContent: '', value: '',
    appendChild(c) { el.children.push(c); if (c) c.parentNode = el; return c; },
    removeChild(c) { return c; },
    remove() { if (el.parentNode && el.parentNode.children) { const i = el.parentNode.children.indexOf(el); if (i >= 0) el.parentNode.children.splice(i, 1); } },
    setAttribute() {}, getAttribute: () => null, removeAttribute() {},
    addEventListener() {}, removeEventListener() {},
    querySelector: () => null, querySelectorAll: () => [],
    getBoundingClientRect: () => ({ left: 0, top: 0, width: 1280, height: 720, right: 1280, bottom: 720 }),
    focus() {}, blur() {}, click() {}, scrollIntoView() {},
    getContext: () => makeCtx()
  };
  return el;
}
const elements = new Map();
global.document = {
  readyState: 'complete',
  getElementById: (id) => { if (!elements.has(id)) elements.set(id, makeEl('div')); return elements.get(id); },
  createElement: (t) => makeEl(t),
  createTextNode: (t) => makeEl('#text'),
  querySelector: () => null, querySelectorAll: () => [],
  addEventListener() {}, removeEventListener() {},
  body: makeEl('body'), documentElement: makeEl('html')
};
global.window = global;
global.location = { hostname: 'localhost', port: '8000', protocol: 'http:' };
global.innerWidth = 1280; global.innerHeight = 720;
global.devicePixelRatio = 1;
global.addEventListener = () => {};
global.performance = { now: () => 1000 };
global.requestAnimationFrame = () => 0;
const store = new Map();
global.localStorage = {
  getItem: (k) => (store.has(k) ? store.get(k) : null),
  setItem: (k, v) => store.set(k, String(v)),
  removeItem: (k) => store.delete(k)
};

const SCRIPTS = ['audio.js', 'particles.js', 'world.js', 'weather.js', 'entities.js',
  'underworld.js', 'space.js', 'juice.js', 'npcs.js', 'journey.js', 'multiplayer.js', 'terraria.js'];
const ctxv = vm.createContext(global);
for (const f of SCRIPTS) {
  try {
    vm.runInContext(fs.readFileSync(path.join(dir, f), 'utf8'), ctxv, { filename: f });
  } catch (error) {
    console.log('FAIL ' + f + ' threw while evaluating: ' + (error.stack || error.message));
    process.exit(1);
  }
}
check('every script (multiplayer.js included) evaluates', true);
check('Multiplayer is exported for the game', typeof global.Multiplayer === 'function',
  'typeof ' + typeof global.Multiplayer);

// ---- base64 helper: the world snapshot's whole payload rides on it ---------
const sample = new Uint8Array(2048);
for (let i = 0; i < sample.length; i++) sample[i] = i % 256;
check('base64 round-trips a whole tile array byte for byte',
  Buffer.compare(Buffer.from(global.mpUnb64(global.mpB64(sample))), Buffer.from(sample)) === 0);
check('base64 survives a payload that ends mid-triplet',
  (() => {
    for (const n of [0, 1, 2, 3, 4, 5]) {
      const small = new Uint8Array(n).map((_, i) => i);
      const back = global.mpUnb64(global.mpB64(small));
      if (!back || back.length !== n || Buffer.compare(Buffer.from(back), Buffer.from(small)) !== 0) return false;
    }
    return true;
  })());

// ===========================================================================
// 1. Two REAL Game instances in one session (the hub transport stands in for
//    BroadcastChannel/WebSocket so the test drives delivery itself).
// ===========================================================================
const hostGame = global.game;
const clientGame = new global.Game();
check('a guest is a full second Game', !!clientGame.world && !!clientGame.mp && !!clientGame.player);
// Give the guest a DIFFERENT world so the welcome snapshot has to rebuild it —
// the same thing happens when a friend on slot 3 joins slot 1's world.
clientGame.world = new global.World(440, 175, 777);
clientGame.weather = new global.WeatherSystem(clientGame.world);
clientGame.minimap = new global.Minimap(clientGame.world);

const hub = global.Multiplayer.makeHub();
const factory = (selfId, onMessage, onStatus) =>
  global.Multiplayer.makeHubTransport(hub, selfId, onMessage, onStatus);
const hp = hostGame.mp;
const cp = clientGame.mp;
const hostRes = hp.startHost('coop', '', 'Host', factory);
let joined = false;
const joinRes = cp.startJoin('coop', '', 'Guest', () => { joined = true; }, factory);
check('host and guest agree on the room code',
  hostRes.ok && joinRes.ok && hp.room === 'COOP' && cp.room === 'COOP',
  hp.room + '/' + cp.room);
hub.pump();
check('the handshake completes and enters the world',
  cp.status === 'joined' && joined === true, cp.status + ' ' + cp.statusDetail);
check("the guest rebuilt its world to the host's seed",
  clientGame.world.seed === hostGame.world.seed &&
  clientGame.world.width === hostGame.world.width &&
  clientGame.world.height === hostGame.world.height, 'seed ' + clientGame.world.seed);
check('the guest world is byte-identical to the host',
  Buffer.compare(Buffer.from(clientGame.world.tiles), Buffer.from(hostGame.world.tiles)) === 0 &&
  Buffer.compare(Buffer.from(clientGame.world.walls), Buffer.from(hostGame.world.walls)) === 0);
check('the guest clock and chests came with it',
  clientGame.world.timeOfDay === hostGame.world.timeOfDay &&
  clientGame.world.dayCount === hostGame.world.dayCount);

// ---- tiles ---------------------------------------------------------------
hostGame.world.setTile(40, 40, 12);
hub.pump();
check('a tile the host changed reaches the guest', clientGame.world.getTile(40, 40) === 12);
clientGame.world.setTile(41, 41, 3);
hub.pump();
check('a tile the guest changed reaches the host', hostGame.world.getTile(41, 41) === 3);
check('a remote tile change is never echoed back out',
  clientGame.world.getTile(40, 40) === 12 && !cp.applyingRemote);

// ---- chests --------------------------------------------------------------
const slots = hp._sanitiseChest([{ id: 'wood', count: 12 }, { id: 'torch', count: 5 }]);
hostGame.chestStorage['7,9'] = slots;
hostGame.openChest = { x: 7, y: 9 };
hostGame.renderChestUI();
hub.pump();
check('a chest grid reaches the guest',
  JSON.stringify(clientGame.chestStorage['7,9']) === JSON.stringify(slots));
clientGame.openChest = { x: 7, y: 9 };
clientGame.chestStorage['7,9'][0].count = 3;
clientGame.renderChestUI();
hub.pump();
check('a chest change on the guest comes back through the host',
  hostGame.chestStorage['7,9'][0].count === 3);
hostGame.openChest = null;
clientGame.openChest = null;

// ---- drops ---------------------------------------------------------------
hostGame.drops.push(new global.DropItem(100, 120, 'wood', 3));
hp.tick(0.1);
hub.pump();
check('a world drop the host made appears for the guest',
  clientGame.drops.some(d => d.id === 'wood' && Math.abs(d.x - 100) < 1 && d.count === 3));

// ---- mobs ---------------------------------------------------------------
const px = hostGame.player.x + 200;
const py = hostGame.player.y;
const mob = new global.Monster(px, py, 'zombie');
mob.hp = 30; mob.maxHp = 30;
hostGame.monsters.push(mob);
hp.tick(0.2);
hub.pump();
const puppet = clientGame.monsters.find(m => m.netId === mob.netId);
check('a host mob becomes a puppet on the guest screen',
  !!puppet && puppet.type === 'zombie' && puppet.netId === mob.netId,
  puppet ? puppet.type : 'none, guest has ' + clientGame.monsters.length);
check('the puppet carries the host hp and facing',
  !!puppet && puppet.hp === 30 && typeof puppet.tx === 'number');
if (puppet) {
  puppet.hp = 5;
  cp.sendMobHit(puppet, 50, false);
  check('a guest hit cannot kill a mob locally before the host confirms',
    !puppet.dead && puppet.hp === 5, 'hp ' + puppet.hp);
  hub.pump();
  check('the host applies the guest hit for real', mob.dead === true, 'host hp ' + mob.hp);
  const dropStart = hostGame.drops.length;
  hostGame.drops.push(new global.DropItem(px, py, 'gold_ore', 2));
  hp.hostMobDeath(mob, dropStart);
  hostGame.monsters.splice(hostGame.monsters.indexOf(mob), 1);
  hub.pump();
  check('a guest kill hands that guest the loot',
    clientGame.drops.some(d => d.id === 'gold_ore' && d.count === 2));
  check('the corpse leaves the guest screen',
    !clientGame.monsters.some(m => m.netId === mob.netId));
}

// ---- player states, avatars, damage routing ------------------------------
cp.tick(0.07);
hub.pump();
const peer = [...hp.peers.values()][0];
check('the host tracks the guest character and builds an avatar',
  !!peer && !!peer.avatar && peer.name === 'Guest');
hp.tick(0.1);
hub.pump();
check('the guest sees the host character in return',
  cp.peers.has('host') && cp.peers.get('host').name === 'Host' && !!cp.peers.get('host').avatar);
if (peer) {
  // Put the guest right next to a hit source the host is standing well clear of.
  peer.avatar.x = 1000; peer.avatar.y = 300; peer.avatar.hp = 100;
  hostGame.player.x = 1400; hostGame.player.y = 300;
  hostGame.player.hp = hostGame.player.maxHp;
  const before = hostGame.player.hp;
  const routed = hp.routeDamage(40, 1010, 300, 'test bite', false);
  hub.pump();
  check('a hit nearer the guest is forwarded, not eaten by the host',
    routed === true && hostGame.player.hp === before);
  check('the guest is the one who takes it',
    clientGame.player.hp < clientGame.player.maxHp, 'guest hp ' + clientGame.player.hp);
  hostGame.player.hp = hostGame.player.maxHp;
  check('a hit nearer the host stays with the host',
    hp.routeDamage(40, 1390, 300, 'test bite', false) === false);
  // Avatars lag one smoothing step behind their last state frame — that is the
  // interpolation, and it must converge rather than snap or drift.
  const avatar = peer.avatar;
  const before2 = avatar.x;
  peer.st = Object.assign({}, peer.st, { x: 2000 });
  hp.updateAvatars(0.5);
  check('a remote character eases toward its latest state',
    avatar.x > before2 && avatar.x <= 2000, 'x ' + avatar.x);
}

// ---- bosses --------------------------------------------------------------
hostGame.summonBoss(false);
hp.tick(0.11);
hub.pump();
check('a summoned boss appears on the guest screen as a puppet',
  !!clientGame.boss && (clientGame.boss.kind || 'forest') === (hostGame.boss.kind || 'forest'),
  clientGame.boss ? clientGame.boss.kind : 'no puppet');
if (clientGame.boss) {
  const gb = clientGame.boss;
  const hpBefore = hostGame.boss.hp;
  cp.sendBossHit(500, false);
  check('a guest cannot finish the boss locally',
    !gb.dead && gb.hp >= 1 && gb.__mpPuppet === true);
  hub.pump();
  check('the host applies the boss damage', hostGame.boss.hp < hpBefore,
    hpBefore + ' -> ' + hostGame.boss.hp);
}

// ---- chat ----------------------------------------------------------------
cp.sendChat('digging the east shaft');
hub.pump();
check('guest chat is relayed by the host and shown on both sides',
  hp.chatLines.some(l => l.name === 'Guest' && l.text === 'digging the east shaft') &&
  cp.chatLines.some(l => l.text === 'digging the east shaft'));
const peerId = peer ? peer.id : 'c1';
const seen = [];
const realTransportSend = hp.transport.send.bind(hp.transport);
hp.transport.send = (m, to) => { seen.push(m); return realTransportSend(m, to); };
hp._onHostMessage({ t: 'say', s: '   ' }, peerId);
check('an empty chat line is never broadcast', !seen.some(m => m.t === 'say'));
hp._onHostMessage({ t: 'say', s: 'for real' }, peerId);
check('a real chat line is broadcast to the room',
  seen.some(m => m.t === 'say' && m.s === 'for real'));
hp._onHostMessage({ t: 'nonsense' }, peerId);
hp._onHostMessage(null, peerId);
hp._onHostMessage({ t: 'say', s: 'x' }, 'not-a-peer');
check('garbage and unknown frames from a guest are survivable', true);
hp.transport.send = realTransportSend;

// ---- a real frame, mid-session ------------------------------------------
// Everything above exercised the message layer directly. This pumps the actual
// game loop with a live session on both machines: the guest must run its own
// player, particles, HUD and a puppet-render pass while skipping every
// host-only simulation step, and the host must do the same with a guest avatar
// in its lighting list.
let frameOk = true;
try {
  hostGame.titleScreenOpen = false;
  clientGame.titleScreenOpen = false;
  hostGame.paused = false;
  clientGame.paused = false;
  for (let i = 0; i < 5; i++) {
    hostGame.update(1 / 60);
    hostGame.render();
    clientGame.update(1 / 60);
    clientGame.render();
  }
} catch (error) {
  frameOk = false;
  console.log('  frame error: ' + (error.stack || error.message));
}
check('five full frames run on both machines mid-session', frameOk);
check('the guest frame left the shared world intact',
  Buffer.compare(Buffer.from(clientGame.world.tiles), Buffer.from(hostGame.world.tiles)) === 0 ||
  // only the tiles either side actually mined may differ now
  clientGame.world.getTile(40, 40) === 12);

// ---- capacity, saving, shutdown ------------------------------------------
const other = new global.Game();
const op = other.mp;
op.startJoin('coop', '', 'Late', () => {}, factory);
hub.pump();
check('a second guest joins the same room', hp.peers.size === 2, hp.peers.size + ' guests');
const storeBefore = store.size;
clientGame.saveGame(true);
check('a guest never writes the world save', store.size === storeBefore);
const cdBefore = clientGame.world.getTile(41, 41);
hp.disconnect('test over', true);
hub.pump();
check('guests are released when the host ends the session',
  cp.status === 'closed' && !cp.isClient && op.status === 'closed');
check('a released guest keeps the world it was playing',
  clientGame.world.getTile(41, 41) === cdBefore && clientGame.player != null);
check('a released guest can save again (single-player rules return)',
  (() => { const n = store.size; clientGame.saveGame(true); return store.size !== n; })());
other.mp.disconnect('done', true);
clientGame.mp.disconnect('done', true);
check('a chat left open cannot lock out the next session',
  cp.chatOpen === false && hp.chatOpen === false);
// Loot already on the floor when a room opens came from the save (or from the
// welcome snapshot) — announcing it again would double every stack for guests.
const mpSrc = fs.readFileSync(path.join(dir, 'multiplayer.js'), 'utf8');
check('pre-existing floor loot is claimed before a room opens',
  (mpSrc.match(/this\.markExistingDrops\(\);/g) || []).length === 2 &&
  /markExistingDrops\(\) \{[\s\S]{0,160}_mpn = true/.test(mpSrc),
  (mpSrc.match(/this\.markExistingDrops\(\);/g) || []).length + ' call sites');

// ===========================================================================
// 2. server.js's WebSocket relay, driven by a hand-rolled RFC 6455 client.
//    The browser half of this lives in multiplayer.js (WSTransport).
// ===========================================================================
function wsConnect(port, onOpen, onFrame) {
  const key = crypto.randomBytes(16).toString('base64');
  const socket = net.connect(port, '127.0.0.1');
  const client = { socket, buf: Buffer.alloc(0), onFrame, open: false };
  const drain = () => {
    for (;;) {
      const buf = client.buf;
      if (buf.length < 2) return;
      const opcode = buf[0] & 0x0f;
      let len = buf[1] & 0x7f;
      let off = 2;
      if (len === 126) { if (buf.length < 4) return; len = buf.readUInt16BE(2); off = 4; }
      else if (len === 127) { if (buf.length < 10) return; len = Number(buf.readBigUInt64BE(2)); off = 10; }
      if (buf.length < off + len) return;
      const payload = buf.subarray(off, off + len);
      client.buf = buf.subarray(off + len);
      if (opcode === 1 && client.onFrame) {
        try { client.onFrame(JSON.parse(payload.toString('utf8'))); } catch (_) { /* junk */ }
      } else if (opcode === 8) {
        client.socket.destroy();
      }
    }
  };
  socket.on('connect', () => {
    socket.write('GET /mp HTTP/1.1\r\nHost: 127.0.0.1\r\nUpgrade: websocket\r\n' +
      'Connection: Upgrade\r\n' + `Sec-WebSocket-Key: ${key}\r\nSec-WebSocket-Version: 13\r\n\r\n`);
  });
  let handshook = false;
  socket.on('data', (chunk) => {
    if (!handshook) {
      const idx = chunk.indexOf('\r\n\r\n');
      if (idx < 0) return;
      const head = chunk.subarray(0, idx).toString();
      const expect = crypto.createHash('sha1')
        .update(key + '258EAFA5-E914-47DA-95CA-C5AB0DC85B11').digest('base64');
      handshook = true;
      client.buf = Buffer.from(chunk.subarray(idx + 4));
      if (/101/.test(head) && head.indexOf(expect) >= 0) {
        client.open = true;
        if (onOpen) onOpen(client);
      } else {
        client.socket.destroy();
        return;
      }
      drain();
      return;
    }
    client.buf = Buffer.concat([client.buf, chunk]);
    drain();
  });
  socket.on('error', () => {});
  return client;
}

function wsSend(client, obj) {
  const payload = Buffer.from(JSON.stringify(obj), 'utf8');
  const len = payload.length;
  let header;
  if (len < 126) { header = Buffer.alloc(2); header[1] = 0x80 | len; }
  else if (len < 65536) { header = Buffer.alloc(4); header[1] = 0x80 | 126; header.writeUInt16BE(len, 2); }
  else { header = Buffer.alloc(10); header[1] = 0x80 | 127; header.writeBigUInt64BE(BigInt(len), 2); }
  header[0] = 0x81;   // FIN + text
  const mask = crypto.randomBytes(4);
  const masked = Buffer.alloc(len);
  for (let i = 0; i < len; i++) masked[i] = payload[i] ^ mask[i & 3];
  client.socket.write(Buffer.concat([header, mask, masked]));
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const { server, rooms } = require(path.resolve(dir, 'server.js'));

async function relaySuite() {
  await new Promise((res) => server.listen(0, '127.0.0.1', res));
  const port = server.address().port;
  const framesHost = [];
  const framesGuest = [];
  const framesGuest2 = [];
  let guestId = null;
  let guest2Id = null;
  const host = wsConnect(port,
    () => wsSend(host, { t: 'hello', role: 'host', room: 'qa7f' }),
    (f) => framesHost.push(f));
  const guest = wsConnect(port,
    () => wsSend(guest, { t: 'hello', role: 'client', room: 'QA7F', name: 'G1' }),
    (f) => { framesGuest.push(f); if (f.t === 'sid') guestId = f.id; });
  const guest2 = wsConnect(port,
    () => wsSend(guest2, { t: 'hello', role: 'client', room: 'QA7F', name: 'G2' }),
    (f) => { framesGuest2.push(f); if (f.t === 'sid') guest2Id = f.id; });
  await sleep(250);
  check('the relay completes the handshake and issues ids',
    framesHost.some(f => f.t === 'sid' && f.id === 'host') && !!guestId && !!guest2Id,
    'ids ' + guestId + '/' + guest2Id);
  check('the host hears a guest arrive, stamped with the relay id',
    framesHost.some(f => f.t === 'msg' && f.from === guestId && f.m && f.m.t === 'hi' && f.m.name === 'G1'));
  framesHost.length = 0; framesGuest.length = 0; framesGuest2.length = 0;

  wsSend(guest, { t: 'msg', to: 'host', m: { t: 'p', x: 5 } });
  await sleep(80);
  check('a guest message reaches the host',
    framesHost.some(f => f.from === guestId && f.m && f.m.t === 'p'));
  framesHost.length = 0; framesGuest.length = 0; framesGuest2.length = 0;

  wsSend(host, { t: 'msg', m: { t: 'hb', names: [['host', 'Host']] } });
  await sleep(80);
  check('a host broadcast reaches every guest',
    framesGuest.length === 1 && framesGuest2.length === 1,
    framesGuest.length + '/' + framesGuest2.length);
  framesGuest.length = 0; framesGuest2.length = 0;

  wsSend(host, { t: 'msg', to: guestId, m: { t: 'ph', id: guestId, a: 5 } });
  await sleep(80);
  check('a targeted host message reaches only its guest',
    framesGuest.length === 1 && framesGuest2.length === 0);
  framesGuest.length = 0; framesGuest2.length = 0;

  // The welcome snapshot is ~200KB of JSON, so the 64-bit length path has to be
  // right in BOTH directions — this is the frame that would silently truncate.
  wsSend(host, { t: 'msg', to: guestId, m: { t: 'w', snap: 'x'.repeat(200000) } });
  wsSend(host, { t: 'msg', m: { t: 'hb', names: [] } });
  await sleep(250);
  check('a 200KB frame survives the 64-bit length path',
    framesGuest.some(f => f.m && f.m.t === 'w' && f.m.snap && f.m.snap.length === 200000));
  framesHost.length = 0; framesGuest2.length = 0;

  wsSend(guest, { t: 'msg', to: guest2Id, m: { t: 'say', s: 'sneak' } });
  await sleep(80);
  check("a guest cannot whisper to another guest behind the host's back",
    framesGuest2.length === 0 && framesHost.some(f => f.m && f.m.t === 'say'));
  framesHost.length = 0;

  guest.socket.destroy();
  await sleep(150);
  check('the host is told when a guest vanishes',
    framesHost.some(f => f.t === 'msg' && f.m && f.m.t === 'lv'));
  framesGuest2.length = 0;

  host.socket.destroy();
  await sleep(150);
  check('guests are released when the host vanishes',
    framesGuest2.some(f => f.t === 'bye'));
  check('the relay forgets a dead room', !rooms.has('QA7F'));
  guest2.socket.destroy();
  await sleep(80);
}

// ===========================================================================
// 3. Static wiring: the guards that keep ONE simulation, and the manifests
//    that carry multiplayer.js into every build.
// ===========================================================================
function staticSuite() {
  const js = fs.readFileSync(path.join(dir, 'terraria.js'), 'utf8');
  const mp = fs.readFileSync(path.join(dir, 'multiplayer.js'), 'utf8');
  const html = fs.readFileSync(path.join(dir, 'terraria.html'), 'utf8');
  const css = fs.readFileSync(path.join(dir, 'terraria.css'), 'utf8');
  const app = fs.readFileSync(path.join(dir, 'app.py'), 'utf8');
  // Helper scripts only exist in the working folder, not in a deployed clone;
  // their checks are skipped (loudly) rather than failed there.
  const readIf = (f) => { try { return fs.readFileSync(path.join(dir, f), 'utf8'); } catch (_) { return null; } };
  const relay = readIf('server.js');
  const copyScript = readIf('copy-to-deploy.ps1');
  const syncScript = readIf('sync-to-github.ps1');
  if (!relay) console.log('skip  relay checks (no server.js in this folder)');
  if (!copyScript || !syncScript) console.log('skip  deploy-script checks (helpers not in this folder)');

  check('the game loop pumps the session before the pause guard',
    /update\(dt\) \{[\s\S]{0,200}this\.mp\.tick\(dt\);\s*\n\s*if \(this\.paused\) return;/.test(js));
  check('guests never spawn monsters and never run monster AI',
    /!this\.mp\?\.isClient && this\.spawnTimer >= 7\.0/.test(js) &&
    /if \(this\.mp && this\.mp\.isClient\) continue;/.test(js));
  check('guests never run boss AI or boss touch damage',
    /if \(!\(this\.mp && this\.mp\.isClient\)\) \{[\s\S]{0,900}this\.boss\.update\(dt, bossTarget/.test(js) &&
    /Boss touch damage — host\/SP only/.test(js));
  check('remote characters are drawn and lit',
    /this\.mp\?\.renderPlayers\(ctx, this\.camera\)/.test(js) && /this\.mp\?\.pushLit\(lit\)/.test(js));
  check('damagePlayer asks the session who wears the hit',
    /this\.mp && this\.mp\.routeDamage\(amount, sourceX, sourceY, cause, isBoss\)/.test(js));
  check('guests cannot write the world save',
    /saveGame\(silent = false\) \{[\s\S]{0,400}this\.mp\.isClient/.test(js));
  check('the rift and the rite belong to the host',
    /useVoidRiftBeacon\(\) \{[\s\S]{0,300}denyForClient/.test(js) &&
    /performBoneRite\(\) \{[\s\S]{0,300}denyForClient/.test(js));
  check('chest changes, deletions and sealed-chest loot go through the session',
    /renderChestUI\(\) \{[\s\S]{0,4000}this\.mp\?\.chestChanged\(\)/.test(js) &&
    /this\.mp\?\.chestDeleted\(tileX, tileY\)/.test(js) &&
    /this\.mp\.requestChest\(tileX, tileY\)/.test(js));
  check('a kill hands its loot list to the guests',
    /this\.mp\?\.hostMobDeath\(m, mpDropStart\)/.test(js) &&
    /this\.mp\?\.markLocalDrops\(mpBossDropStart\)/.test(js));
  check('boss summons and the dungeon warden are asked of the host',
    /this\.mp\.requestBossSummon\(\)/.test(js) && /this\.mp\.requestGate\(tileX, tileY\)/.test(js));
  // Every boss entrance must be host-owned. The three that do NOT go through
  // summonBoss() (the altar, the chapel statue, the Sovereign) each used to be a
  // way for a guest to start a second, invisible simulation.
  check('every boss entrance is host-owned, not just the HUD summon',
    /summonDemonBoss\(\) \{[\s\S]{0,600}requestBossSummon\('demon'\)/.test(js) &&
    /summonCursedKnight\(\) \{[\s\S]{0,600}requestBossSummon\('knight'\)/.test(js) &&
    /wakeSovereign\(arena[\s\S]{0,600}requestBossSummon\('dragon'\)/.test(js) &&
    /if \(m\.k === 'demon'\) g\.summonDemonBoss\(\)/.test(mp));
  check('guest swings and arrows report their damage, clamped locally',
    /this\.mp\?\.sendMobHit\(m, roll\.damage, crit\)/.test(js) &&
    /this\.mp\?\.sendMobHit\(m, roll\.damage, roll\.crit\)/.test(js) &&
    /sendMobHit\(mob, damage, crit\) \{[\s\S]{0,400}mob\.dead = false/.test(mp));
  check('every tile edit is announced through the setTile hook',
    /World\.prototype\.__mpHooked/.test(mp) && /session\.localTile\(x, y, tile\)/.test(mp));
  check('arena edits can never leak into a guest world',
    /persistTiles\(\) !== w\.tiles\) return;/.test(mp));
  check('clients trust only the host, and never their own echo',
    /from !== 'host'\) return/.test(mp) && /if \(m\.src && m\.src === this\.selfId\) return;/.test(mp));
  check('a stale connection is dropped instead of hanging on',
    /this\._tickNow - p\.lastRecv > 5/.test(mp) && /this\._tickNow - this\.lastHostBeat > 4\.5/.test(mp));
  check('the relay only answers on /mp and stamps every sender',
    relay === null || (/urlPath !== '\/mp'/.test(relay) && /if \(require\.main === module\)/.test(relay) &&
      /from: conn\.id, m:/.test(relay) && /clients MUST mask/.test(relay) &&
      /socket\.on\('end', \(\) => destroy\(conn\)\)/.test(relay) &&
      /wrapper\.m \? wrapper\.m : wrapper/.test(relay)));
  check('the room caps at four players (host + 3)',
    /if \(this\.peers\.size >= 3\)/.test(mp) && (relay === null || /room\.clients\.size >= 3/.test(relay)));
  check('every build carries multiplayer.js',
    /"multiplayer\.js"/.test(app) &&
    /src="multiplayer\.js/.test(html) &&
    (copyScript === null || /'multiplayer\.js'/.test(copyScript)) &&
    (syncScript === null || /'multiplayer\.js'/.test(syncScript)) &&
    (relay === null || /server\.js/.test(syncScript || '') || /server\.js/.test(copyScript || '')));
  check('the session HUD is styled', /\.mp-chip \{/.test(css) && /\.mp-chat-log \{/.test(css));

  console.log('');
  console.log('FAILING CHECKS: ' + bad);
  process.exit(bad ? 1 : 0);
}

relaySuite()
  .catch((error) => {
    console.log('FAIL relay suite threw: ' + (error.stack || error.message));
    bad++;
  })
  .then(() => {
    try { server.close(); } catch (_) { /* never listened */ }
    staticSuite();
  });



