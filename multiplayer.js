// multiplayer.js — host/client co-op for Terracraft.
//
// One player HOSTS the world they are already playing; friends JOIN as guests.
// The host is authoritative for everything shared — the tile grid, chests,
// monsters, bosses, the clock — while every player stays authoritative for
// their own character (position, bag, equipment). Guests render the host's
// monsters from periodic snapshots and send their hits back to the host to
// resolve, which keeps one simulation instead of two that drift apart.
//
// Two transports, one protocol:
//   * BroadcastChannel — no server at all. Two tabs of the same browser join
//     a room by name. This is what makes multiplayer work on the Streamlit
//     build, which cannot run a server of its own.
//   * WebSocket — connects to the room relay in server.js (LAN or internet).
//     `node server.js` serves the game AND the relay on one port.
//
// Message vocabulary (kept short because state/mobs fly at 10-15Hz):
//   hi   client->host  hello, my name            p    player state
//   tl   tile change                            ch   chest slots
//   dr   drop spawn                             mb   mob+boss snapshot
//   kd   mob died (with loot)                   ph   damage a player (host->client)
//   tm   world clock                            fl   world flags
//   hb   heartbeat + roster                     pn/po ping/pong
//   jn/lv peer joined / left                    say  chat
//   w    welcome (handshake result)             dim  host's dimension
//   sum/bh/req/gate  client requests: summon boss, boss hit, chest contents,
//                    dungeon gatekeeper
//
// Everything the host relays carries `src`/`id` so a client can drop its own
// echo; clients process ONLY messages stamped from the host.

/** Base64 for a Uint8Array — works in the browser and in Node alike. */
function mpB64(bytes) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
  let out = '';
  for (let i = 0; i < bytes.length; i += 3) {
    const a = bytes[i];
    const b = i + 1 < bytes.length ? bytes[i + 1] : 0;
    const c = i + 2 < bytes.length ? bytes[i + 2] : 0;
    out += chars[a >> 2];
    out += chars[((a & 3) << 4) | (b >> 4)];
    out += i + 1 < bytes.length ? chars[((b & 15) << 2) | (c >> 6)] : '=';
    out += i + 2 < bytes.length ? chars[c & 63] : '=';
  }
  return out;
}

/** Inverse of mpB64. Returns null on anything that is not well-formed. */
function mpUnb64(str) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
  const clean = String(str).replace(/[^A-Za-z0-9+/]/g, '');
  const out = new Uint8Array(Math.floor((clean.length * 3) / 4));
  let o = 0;
  for (let i = 0; i < clean.length; i += 4) {
    const a = chars.indexOf(clean[i]);
    const b = chars.indexOf(clean[i + 1]);
    const c = i + 2 < clean.length ? chars.indexOf(clean[i + 2]) : -1;
    const d = i + 3 < clean.length ? chars.indexOf(clean[i + 3]) : -1;
    if (a < 0 || b < 0) return null;
    out[o++] = (a << 2) | (b >> 4);
    if (c >= 0) out[o++] = ((b & 15) << 4) | (c >> 2);
    if (d >= 0) out[o++] = ((c & 3) << 6) | d;
  }
  return o === out.length ? out : out.subarray(0, o);
}

/** Short, human-typable room codes: K7QF, M2XD… 0/O/1/I are left out. */
function mpRoomCode() {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let s = '';
  for (let i = 0; i < 4; i++) s += alphabet[Math.floor(Math.random() * alphabet.length)];
  return s;
}

function mpId() {
  return Math.random().toString(36).slice(2, 8);
}

// ---------------------------------------------------------------------------
// Transports. All three expose: send(message, to?), close(), selfId, kind and
// call back with (message, fromId) for every inbound application message.
// ---------------------------------------------------------------------------

/**
 * Same-browser transport. Messages never come back to their sender, and every
 * frame is stamped so clients can ignore anything that is not from the host.
 */
class BCTransport {
  constructor(room, selfId, onMessage, onStatus) {
    this.kind = 'bc';
    this.selfId = selfId;
    this.closed = false;
    try {
      this.ch = new BroadcastChannel('terracraft-mp-' + room);
    } catch (error) {
      onStatus('error', 'no-bc');
      return;
    }
    this.ch.onmessage = (event) => {
      const d = event.data;
      if (!d || d.__mp !== 1 || d.from === this.selfId) return;
      if (d.to && d.to !== this.selfId) return;
      if (!d.m || typeof d.m !== 'object') return;
      onMessage(d.m, d.from);
    };
    // BroadcastChannel is live the moment it is built.
    setTimeout(() => { if (!this.closed) onStatus('open'); }, 0);
  }

  send(m, to) {
    if (this.closed || !this.ch) return;
    try { this.ch.postMessage({ __mp: 1, from: this.selfId, to: to || null, m }); }
    catch (_) { /* channel closed mid-teardown */ }
  }

  close() {
    this.closed = true;
    try { this.ch && this.ch.close(); } catch (_) {}
  }
}

/**
 * WebSocket transport to the relay in server.js. The relay stamps `from`, so
 * a client cannot impersonate anyone; clients only ever accept `from: host`.
 */
class WSTransport {
  constructor(url, selfId, onMessage, onStatus, options = {}) {
    this.kind = 'ws';
    this.selfId = selfId;
    this.closed = false;
    this.onMessage = onMessage;
    // The relay only routes to a connection that has first announced its room
    // and role. Forgetting this handshake left every socket anonymous and the
    // server dropped every frame on the floor (see onHello/onRelay in server.js).
    this.room = String(options.room || '').toUpperCase().slice(0, 4);
    this.role = options.role || 'client';
    this.name = options.name || 'Player';
    try {
      this.ws = new WebSocket(url.replace(/^http/, 'ws'));
    } catch (_) {
      onStatus('error', 'bad-url');
      return;
    }
    this.ws.onopen = () => {
      if (this.closed) return;
      // Introduce ourselves to the relay BEFORE anything else is sent, or the
      // room is not known and every following message is unrouteable.
      try {
        this.ws.send(JSON.stringify({
          t: 'hello', room: this.room, role: this.role, name: this.name
        }));
      } catch (_) { /* socket died in the same tick */ }
      onStatus('open');
    };
    this.ws.onmessage = (event) => {
      if (this.closed) return;
      let d;
      try { d = JSON.parse(event.data); } catch (_) { return; }
      if (!d || typeof d !== 'object') return;
      if (d.t === 'sid') { this.selfId = d.id; onStatus('ready'); return; }
      if (d.t === 'error') { onStatus('error', d.code || 'error'); return; }
      if (d.t === 'bye') { this.close(); onStatus('closed', d.code || 'bye'); return; }
      if (d.t === 'msg' && d.m && typeof d.m === 'object') this.onMessage(d.m, d.from);
    };
    this.ws.onerror = () => { if (!this.closed) onStatus('error', 'socket'); };
    this.ws.onclose = () => {
      const already = this.closed;
      this.closed = true;
      if (!already) onStatus('closed');
    };
  }

  send(m, to) {
    if (this.closed || !this.ws || this.ws.readyState !== 1) return;
    try { this.ws.send(JSON.stringify({ t: 'msg', to: to || null, m })); }
    catch (_) { /* socket died between the readyState check and send */ }
  }

  close() {
    this.closed = true;
    try { this.ws && this.ws.close(); } catch (_) {}
  }
}

window.Multiplayer = class Multiplayer {
  constructor(game) {
    this.game = game;
    this.role = 'none';            // 'none' | 'host' | 'client'
    this.status = 'idle';          // idle|connecting|hosting|joined|error|closed
    this.statusDetail = '';
    this.room = null;
    this.serverUrl = '';
    this.transport = null;
    this.playerName = 'Player';
    this.hostName = 'Host';
    this.selfId = null;
    this.peers = new Map();        // id -> {id, name, st, avatar, lastRecv}
    this.applyingRemote = false;   // true while applying a remote change (no echo)
    this.timers = {};              // cadence buckets for tick()
    this.pingMs = null;
    this.lastHostBeat = 0;
    this.mobByNet = new Map();     // client: netId -> monster
    this.mobGen = 0;
    this.mobMiss = new Map();      // netId -> snapshots missed in a row
    this.nextNetId = 1;
    this.pendingHello = false;
    this.joinTimer = null;
    this.chatOpen = false;
    this.chatLines = [];           // {name, text, at}
    this.chatHideAt = 0;
    this.dim = 'overworld';        // the host's dimension, as a guest sees it
    this.roster = [];              // [[id, name], ...] from the last heartbeat
    this.hud = null;
    this._lastSentTime = -1;
    this._lastSentDay = -1;
    this._lastSentFlags = '';
    this._tickNow = 0;
    this._bossSerial = 1;
    this._bossDead = new Set();    // host boss serials this guest has seen die
    this._killSeen = new Set();    // mob ids whose kill was already credited
  }

  get isHost() { return this.role === 'host'; }
  get isClient() { return this.role === 'client'; }
  get active() { return this.role !== 'none'; }

  /** Cadence helper for tick(): true at most once every `sec` seconds. */
  every(key, sec) {
    const last = this.timers[key];
    if (last !== undefined && this._tickNow - last < sec) return false;
    this.timers[key] = this._tickNow;
    return true;
  }

  // =====================================================================
  // Session lifecycle
  // =====================================================================

  /**
   * Open a room. Empty `serverUrl` -> BroadcastChannel (same browser);
   * otherwise connect to the relay at that ws:// address.
   */
  startHost(room, serverUrl, name, transportFactory) {
    if (this.active) return { ok: false, error: 'Already in a session.' };
    this.role = 'host';
    this.room = (room || '').toUpperCase().slice(0, 4) || mpRoomCode();
    this.serverUrl = (serverUrl || '').trim();
    this.playerName = (name || 'Host').trim().slice(0, 14) || 'Host';
    this.hostName = this.playerName;
    this.selfId = 'host';
    this.status = 'connecting';
    const onMessage = (m, from) => this._onHostMessage(m, from);
    const onStatus = (s, d) => this._onTransportStatus(s, d);
    this.transport = transportFactory
      ? transportFactory('host', onMessage, onStatus)
      : this.serverUrl
        ? new WSTransport(this.serverUrl, 'host', onMessage, onStatus, {
            room: this.room, role: 'host', name: this.playerName
          })
        : new BCTransport(this.room, 'host', onMessage, onStatus);
    this.markExistingDrops();
    Multiplayer.worldOwners.set(this.game.world, this);
    return { ok: true, room: this.room };
  }

  /** Knock on a room. Resolves into status 'joined' once welcome lands. */
  startJoin(room, serverUrl, name, onJoined, transportFactory) {
    if (this.active) return { ok: false, error: 'Already in a session.' };
    this.role = 'client';
    this.room = (room || '').toUpperCase().slice(0, 4);
    if (!this.room) return { ok: false, error: 'Type the 4-letter room code.' };
    this.serverUrl = (serverUrl || '').trim();
    this.playerName = (name || 'Player').trim().slice(0, 14) || 'Player';
    this.selfId = 'c' + mpId();
    this.status = 'connecting';
    this.statusDetail = this.serverUrl ? 'Connecting to server…' : 'Looking for a host…';
    this._onJoined = onJoined || null;
    const onMessage = (m, from) => this._onClientMessage(m, from);
    const onStatus = (s, d) => this._onTransportStatus(s, d);
    this.transport = transportFactory
      ? transportFactory(this.selfId, onMessage, onStatus)
      : this.serverUrl
        ? new WSTransport(this.serverUrl, this.selfId, onMessage, onStatus, {
            room: this.room, role: 'client', name: this.playerName
          })
        : new BCTransport(this.room, this.selfId, onMessage, onStatus);
    this.markExistingDrops();
    Multiplayer.worldOwners.set(this.game.world, this);
    // A synchronous transport (the QA hub) opened during construction, before
    // this.transport existed — try the hello again now that it is bound.
    this._openHelloIfReady();
    // Nobody answers the knock? Say so instead of spinning forever.
    clearTimeout(this.joinTimer);
    this.joinTimer = setTimeout(() => {
      if (this.isClient && this.status === 'connecting') {
        this.fail(this.serverUrl
          ? 'No host answered on that server (is node server.js running there?).'
          : 'No host in this browser. Host a game in another tab first.');
      }
    }, 6000);
    return { ok: true, room: this.room };
  }

  /** Announce to the host exactly once, once both role and pipe are live. */
  _openHelloIfReady() {
    if (!this.isClient || !this._pipeOpen || this.pendingHello || !this.transport) return;
    if (this.status !== 'connecting') return;
    this.pendingHello = true;
    this._send({ t: 'hi', name: this.playerName }, 'host');
  }

  fail(detail) {
    this.status = 'error';
    this.statusDetail = detail || 'Connection failed.';
    clearTimeout(this.joinTimer);
    if (this.transport) this.transport.close();
    this.transport = null;
    this.role = 'none';
    this._pushHud();
  }
  /** Leave the session. The world keeps running as single-player afterwards. */
  disconnect(reason, quiet) {
    if (!this.active) return;
    const wasHost = this.isHost;
    const why = reason || (wasHost ? 'Session ended.' : 'Left the session.');
    clearTimeout(this.joinTimer);
    if (this.transport) {
      if (wasHost) this._send({ t: 'bye', code: 'host-left' });
      this.transport.close();
    }
    this.transport = null;
    this.role = 'none';
    this.status = 'closed';
    this.statusDetail = why;
    this.peers.clear();
    this.mobByNet.clear();
    this.mobMiss.clear();
    this.roster = [];
    this.dim = 'overworld';
    // Chat must not stay "open" across a session: leaving with the box focused
    // would make the next session's Enter key do nothing.
    this.chatOpen = false;
    this.chatHideAt = 0;
    Multiplayer.worldOwners.delete(this.game.world);
    if (!quiet) this.game.showToast(wasHost ? '🔌 Multiplayer session ended.' : `🔌 ${why}`);
    this._pushHud();
  }

  /**
   * Whatever is already lying on the floor when a session opens came from this
   * machine's own save (or, for a guest, from the welcome snapshot), so it must
   * not also be announced as a fresh world drop.
   */
  markExistingDrops() {
    for (const d of (this.game.drops || [])) d._mpn = true;
  }

  // =====================================================================
  // Transport plumbing
  // =====================================================================

  /** Raw send through the transport. Host messages broadcast unless `to`. */
  _send(m, to) {
    if (this.transport) this.transport.send(m, to);
  }

  /** Host broadcast. `except` skips one peer (used when relaying their own data). */
  _cast(m, except) {
    if (!this.transport) return;
    if (!except) { this.transport.send(m); return; }
    for (const id of this.peers.keys()) {
      if (id !== except) this.transport.send(m, id);
    }
  }

  _onTransportStatus(state, detail) {
    if (state === 'open' || state === 'ready') {
      this._pipeOpen = true;
      if (this.isHost) {
        this.status = 'hosting';
        this.statusDetail = this.serverUrl
          ? `Relay online — room ${this.room}`
          : `Room ${this.room} open in this browser`;
        this._pushHud();
      } else {
        this._openHelloIfReady();
      }
      return;
    }
    if (state === 'error') {
      const map = {
        'no-bc': 'This browser has no BroadcastChannel, so same-device play is off.',
        'bad-url': 'That is not a valid server address (expected ws://host:port).',
        'socket': 'Could not reach the server.',
        'no-host': 'Nobody is hosting that room on this server.',
        'full': 'That room is full (4 players max).',
        'replaced': 'Another host took over that room.'
      };
      if (this.isClient || this.isHost) this.fail(map[detail] || `Connection failed (${detail}).`);
      return;
    }
    if (state === 'closed') {
      if (!this.active) return;
      if (this.isClient) {
        this.disconnect(detail === 'host-left'
          ? 'The host ended the session.'
          : 'Connection to the host was lost.', false);
      } else if (this.transport) {
        // The relay dropped us; the room cannot continue without a pipe.
        this.disconnect('The relay connection closed.', false);
      }
    }
  }

  // =====================================================================
  // Host side
  // =====================================================================

  _touch(from) {
    const p = this.peers.get(from);
    if (p) p.lastRecv = this._tickNow;
  }

  _onHostMessage(m, from) {
    if (!this.isHost || !m || typeof m.t !== 'string') return;
    if (m.t !== 'hi') this._touch(from);
    switch (m.t) {
      case 'hi': this._onHello(from, m); break;
      case 'p': this._onPeerState(from, m); break;
      case 'tl': this._onPeerTile(from, m); break;
      case 'ch': this._onPeerChest(from, m); break;
      case 'hit': this._onPeerHit(from, m); break;
      case 'bh': this._onPeerBossHit(from, m); break;
      case 'say': {
        const p = this.peers.get(from);
        const name = (m.s || '').slice(0, 80);
        if (!name.trim()) break;
        this._receiveChat(p ? p.name : '???', name);
        this._cast({ t: 'say', id: from, name: p ? p.name : '???', s: name });
        break;
      }
      case 'req': this._onChestRequest(from, m); break;
      case 'sum': {
        const g = this.game;
        if (g.boss && !g.boss.dead) break;
        // Guests cannot raise a boss themselves, so they ask for the RIGHT one:
        // 'forest' (the HUD button / night prophecy), 'demon' (the altar),
        // 'knight' (the drowned chapel statue) or 'dragon' (the Rite of Waking).
        if (m.k === 'demon') g.summonDemonBoss();
        else if (m.k === 'knight') g.summonCursedKnight();
        else g.summonBoss(false);
        break;
      }
      case 'gate': this._onGateRequest(from, m); break;
      case 'pn': this._send({ t: 'po', ts: m.ts }, from); break;
      default: break;
    }
  }

  _onHello(from, m) {
    const g = this.game;
    if (this.peers.size >= 3) {
      this._send({ t: 'bye', code: 'full' }, from);
      return;
    }
    const name = String(m.name || 'Guest').slice(0, 14) || 'Guest';
    const peer = {
      id: from,
      name,
      st: null,
      avatar: null,
      lastRecv: this._tickNow
    };
    this.peers.set(from, peer);
    // The welcome carries the whole shared world: tiles, walls, clock, chests,
    // drops and the descriptors the guest's own generation cannot know about.
    const welcome = {
      t: 'w',
      id: from,
      room: this.room,
      hostName: this.hostName,
      peers: this._peerRoster(),
      snap: this._buildSnapshot()
    };
    this._send(welcome, from);
    this.game.showToast(`👋 ${name} joined the session.`);
    this._cast({ t: 'jn', id: from, name });
    this._pushHud();
  }

  /** Everything a new guest needs to place the other characters on screen. */
  _peerRoster() {
    const out = [{ id: 'host', name: this.hostName, p: this._ownState() }];
    for (const p of this.peers.values()) {
      if (p.st) out.push({ id: p.id, name: p.name, p: p.st });
    }
    return out;
  }

  _ownState() {
    const g = this.game;
    const held = g.inventory[g.player.selectedSlot] || { id: 'empty' };
    const s = g.player;
    return {
      x: Math.round(s.x * 10) / 10,
      y: Math.round(s.y * 10) / 10,
      f: s.facing === -1 ? -1 : 1,
      hp: Math.max(0, Math.round(s.hp)),
      mhp: Math.round(s.maxHp),
      ar: g.equippedArmorId || '',
      wi: g.equippedAccessoryId || '',
      hd: held.id || 'empty',
      sw: s.isSwinging ? 1 : 0,
      fl: s.isFlying ? 1 : 0,
      ded: g.isDead ? 1 : 0,
      nm: this.hostName
    };
  }

  _onPeerState(from, m) {
    const peer = this.peers.get(from);
    if (!peer) return;
    peer.st = {
      x: Number(m.x) || 0, y: Number(m.y) || 0, f: m.f === -1 ? -1 : 1,
      hp: Number(m.hp) || 0, mhp: Number(m.mhp) || 100,
      ar: m.ar || '', wi: m.wi || '', hd: m.hd || 'empty',
      sw: m.sw ? 1 : 0, fl: m.fl ? 1 : 0, ded: m.ded ? 1 : 0,
      nm: peer.name
    };
    // Relay verbatim (with the origin id) so the other guests can draw them.
    const relay = Object.assign({ t: 'p', id: from }, peer.st);
    this._cast(relay, from);
    this._upsertAvatar(peer);
  }

  _onPeerTile(from, m) {
    const x = Math.floor(Number(m.x));
    const y = Math.floor(Number(m.y));
    const v = Number(m.v);
    if (!Number.isFinite(x) || !Number.isFinite(y) || !Number.isFinite(v)) return;
    this._applyRemoteTile(x, y, v);
    this._cast({ t: 'tl', x, y, v, src: from }, from);
  }

  _onPeerChest(from, m) {
    const key = String(m.k || '');
    if (!/^\d+,\d+$/.test(key)) return;
    if (m.del) {
      delete this.game.chestStorage[key];
      this._cast({ t: 'ch', k: key, del: true, src: from }, from);
    } else if (Array.isArray(m.slots)) {
      this.game.chestStorage[key] = this._sanitiseChest(m.slots);
      this._cast({ t: 'ch', k: key, slots: this.game.chestStorage[key], src: from }, from);
      if (this.game.openChest && `${this.game.openChest.x},${this.game.openChest.y}` === key) {
        this._rerenderChest();
      }
    }
  }

  _onPeerHit(from, m) {
    const mob = this.mobByNet.get(Number(m.i));
    if (!mob || mob.dead) return;
    const dealt = mob.takeDamage(Number(m.d) || 0, this.game.sound, this.game.particles, !!m.c) || 0;
    if (dealt > 0) this.game.stats.damageDealt += dealt;
  }

  _onPeerBossHit(from, m) {
    const boss = this.game.boss;
    if (!boss || boss.dead) return;
    const dealt = boss.takeDamage(Number(m.d) || 0, this.game.sound, this.game.particles, !!m.c) || 0;
    if (dealt > 0) this.game.stats.damageDealt += dealt;
  }

  // ---- host: world snapshot & shared-state helpers --------------------

  /**
   * The join payload: the overworld exactly as saveGame would persist it,
   * minus everything that stays per-player (bag, quests, progress). Tiles and
   * walls travel as base64 — 77k bytes become ~103k characters, which shrugs
   * off both JSON transports.
   */
  _buildSnapshot() {
    const g = this.game;
    const w = g.world;
    const inSpace = w.isInSpace();
    const stashed = inSpace ? w.overworldStash : null;
    return {
      seed: w.seed,
      w: w.width,
      h: w.height,
      tiles: mpB64(w.persistTiles()),
      walls: mpB64(w.persistWalls()),
      tod: stashed ? stashed.timeOfDay : w.timeOfDay,
      day: w.dayCount,
      chests: JSON.parse(JSON.stringify(g.chestStorage || {})),
      drops: g.drops.map(d => ({ id: d.id, c: d.count, x: Math.round(d.x), y: Math.round(d.y) })),
      underworld: w.underworld ? { ...w.underworld } : null,
      dungeon: w.dungeon ? { ...w.dungeon } : null,
      respawn: g.respawnPoint || null,
      rainbow: (stashed ? stashed.rainbowSeeded : w.rainbowSeeded) === true,
      bossDays: Array.isArray(g.bossDaysDone) ? g.bossDaysDone.slice() : [],
      slain: g.dragonSlain === true,
      dim: inSpace ? 'space' : 'overworld',
      spawn: {
        x: Math.floor(w.width / 2) * (typeof TILE_SIZE !== 'undefined' ? TILE_SIZE : 24),
        y: ((w.surfaceHeights[Math.floor(w.width / 2)] || 40) - 3) *
           (typeof TILE_SIZE !== 'undefined' ? TILE_SIZE : 24)
      }
    };
  }

  _sanitiseChest(slots) {
    const out = [];
    for (let i = 0; i < 18; i++) {
      const s = slots[i];
      if (s && typeof ITEMS !== 'undefined' && ITEMS[s.id] && Number.isFinite(s.count) && s.count > 0) {
        out.push({ id: s.id, count: Math.floor(s.count) });
      } else {
        out.push({ id: 'empty', count: 0 });
      }
    }
    return out;
  }

  /** A guest asked to see a sealed chest: roll it here and hand it over. */
  _onChestRequest(from, m) {
    const g = this.game;
    const key = String(m.k || '');
    if (!/^\d+,\d+$/.test(key)) return;
    if (!Array.isArray(g.chestStorage[key])) {
      const [tx, ty] = key.split(',').map(Number);
      const wasClosed = g.world.getTile(tx, ty) === (typeof TILES !== 'undefined' ? TILES.CHEST : -1);
      const slots = g.makeEmptyChestSlots();
      if (wasClosed) {
        const loot = g.rollChestLoot(tx, ty);
        for (let i = 0; i < loot.length; i++) slots[i] = loot[i];
      }
      g.chestStorage[key] = slots;
    }
    this._send({ t: 'ch', k: key, slots: g.chestStorage[key] }, from);
  }

  /** The dungeon gate was struck: spawn the oath-seal on the host. */
  _onGateRequest(from, m) {
    const g = this.game;
    const tileX = Math.floor(Number(m.x));
    const tileY = Math.floor(Number(m.y));
    if (!Number.isFinite(tileX) || !Number.isFinite(tileY)) return;
    if (g.monsters.some(m2 => m2.dungeonGatekeeper && !m2.dead)) return;
    const gate = new Monster(tileX * TILE_SIZE, (tileY - 1) * TILE_SIZE - 2, 'cave_spider');
    gate.makeElite();
    gate.hp = gate.maxHp = 850;
    gate.damage = 30;
    gate.dungeonGatekeeper = true;
    g.monsters.push(gate);
    g.sound.playBossRoar();
  }

  /** Apply a tile change that came from the network (no echo back out). */
  _applyRemoteTile(x, y, v) {
    if (x < 0 || y < 0 || x >= this.game.world.width || y >= this.game.world.height) return;
    this.applyingRemote = true;
    try {
      this.game.world.setTile(x, y, v);
    } finally {
      this.applyingRemote = false;
    }
    this.game.minimap && this.game.minimap.markDirty();
  }

  _rerenderChest() {
    this.applyingRemote = true;
    try { this.game.renderChestUI(); }
    finally { this.applyingRemote = false; }
  }

  /**
   * Called by Game.renderChestUI after any mutation. Host broadcasts the
   * whole 18-slot grid (tiny), guests send it to the host to relay. Skipped
   * while a remote update is being applied, which is what stops the echo.
   */
  chestChanged() {
    if (!this.active || this.applyingRemote || !this.game.openChest) return;
    const key = `${this.game.openChest.x},${this.game.openChest.y}`;
    const slots = this.game.chestStorage[key];
    if (!Array.isArray(slots)) return;
    const msg = { t: 'ch', k: key, slots };
    if (this.isHost) this._cast(msg);
    else this._send(msg, 'host');
  }

  /** A chest tile was destroyed — drop its storage entry everywhere. */
  chestDeleted(tileX, tileY) {
    if (!this.active || this.applyingRemote) return;
    const key = `${tileX},${tileY}`;
    if (this.isHost) this._cast({ t: 'ch', k: key, del: true });
    else this._send({ t: 'ch', k: key, del: true }, 'host');
  }

  /** Guest: ask the host for the real contents of a sealed chest. */
  requestChest(tileX, tileY) {
    if (!this.isClient) return;
    this._send({ t: 'req', k: `${tileX},${tileY}` }, 'host');
  }

  /**
   * A tile changed locally (the World.setTile wrapper calls this). Guests and
   * the host both announce their own edits; the host relays guests' edits to
   * everyone else. Remote applications arrive with applyingRemote set, so
   * they never bounce back out.
   */
  localTile(x, y, v) {
    if (!this.active || this.applyingRemote) return;
    const w = this.game.world;
    // Only the buffer the guests can see may be announced: persistTiles()
    // hands back the OVERWORLD while the host is inside the Ossuary, so an
    // arena edit must never reach a guest's world.
    if (w.persistTiles && w.persistTiles() !== w.tiles) return;
    if (this.isHost) this._cast({ t: 'tl', x, y, v, src: 'host' });
    else this._send({ t: 'tl', x, y, v }, 'host');
  }

  // =====================================================================
  // Guest side
  // =====================================================================

  _onClientMessage(m, from) {
    // Everything a guest acts on comes from the host. Frames stamped with any
    // other id (another guest's messages) are ignored outright.
    if (!this.isClient || !m || typeof m.t !== 'string' || from !== 'host') return;
    this.lastHostBeat = this._tickNow;
    switch (m.t) {
      case 'w': this._onWelcome(m); break;
      case 'p': this._onRemoteState(m); break;
      case 'tl': this._onRemoteTile(m); break;
      case 'ch': this._onRemoteChest(m); break;
      case 'dr': this._onRemoteDrop(m); break;
      case 'mb': this._onMobSnapshot(m); break;
      case 'kd': this._onMobDied(m); break;
      case 'ph': this._onPlayerHit(m); break;
      case 'tm': this._onClock(m); break;
      case 'fl': this._onFlags(m); break;
      case 'jn': this._onPeerJoined(m); break;
      case 'lv': this._onPeerLeft(m); break;
      case 'hb':
        this.roster = Array.isArray(m.names) ? m.names : [];
        this._pushHud();
        break;
      case 'po':
        if (Number.isFinite(m.ts)) this.pingMs = Math.max(0, Math.round(performance.now() - m.ts));
        break;
      case 'say':
        this._receiveChat(m.name || '???', String(m.s || '').slice(0, 80));
        break;
      case 'dim':
        this._setDim(m.d === 'space' ? 'space' : 'overworld');
        break;
      case 'bye':
        // The host shut the room down (explicitly, or because its relay
        // connection went away). Fall back to single-player on the copy of the
        // world this guest was just playing.
        this.disconnect(m.code === 'full'
          ? 'That room is full (4 players max).'
          : 'The host ended the session.', false);
        break;
      default: break;
    }
  }

  _onWelcome(m) {
    clearTimeout(this.joinTimer);
    this.selfId = m.id;
    this.hostName = m.hostName || 'Host';
    this.status = 'joined';
    this.statusDetail = `Room ${m.room}`;
    this._applySnapshot(m.snap);
    for (const entry of (Array.isArray(m.peers) ? m.peers : [])) {
      if (entry.id === this.selfId) continue;
      const peer = {
        id: entry.id, name: String(entry.name || 'Guest').slice(0, 14),
        st: entry.p || null, avatar: null, lastRecv: this._tickNow
      };
      this.peers.set(peer.id, peer);
      this._upsertAvatar(peer);
    }
    this._setDim(m.snap && m.snap.dim === 'space' ? 'space' : 'overworld');
    this._pushHud();
    this.game.showToast(`🎮 Joined room ${m.room} — ${this.hostName} is hosting.`);
    const cb = this._onJoined;
    this._onJoined = null;
    if (cb) cb();
  }

  /**
   * Swap in the host's world. The guest's own generation is thrown away when
   * the seed differs (it must be — the host's world is a different place),
   * which means every subsystem holding a world reference is rebuilt too.
   */
  _applySnapshot(snap) {
    if (!snap) return;
    const g = this.game;
    const oldWorld = g.world;
    let rebuilt = false;
    if (snap.seed !== oldWorld.seed || snap.w !== oldWorld.width || snap.h !== oldWorld.height) {
      g.world = new World(snap.w, snap.h, snap.seed);
      g.weather = new WeatherSystem(g.world);
      g.minimap = new Minimap(g.world);
      if (typeof NPCManager !== 'undefined') g.npcs = new NPCManager(g);
      rebuilt = true;
    }
    const w = g.world;
    const tiles = mpUnb64(snap.tiles);
    const walls = mpUnb64(snap.walls);
    if (tiles && tiles.length === w.tiles.length) w.tiles.set(tiles);
    if (walls && walls.length === w.walls.length) w.walls.set(walls);
    w.timeOfDay = Number.isFinite(snap.tod) ? snap.tod : w.timeOfDay;
    w.dayCount = Number.isFinite(snap.day) ? snap.day : w.dayCount;
    w._tileCacheDirty = true;
    w.rainbowSeeded = snap.rainbow === true;
    if (snap.underworld && Number.isFinite(snap.underworld.start)) w.underworld = { ...snap.underworld };
    else w.ensureUnderworld(true);
    w.dungeon = (snap.dungeon && Number.isFinite(snap.dungeon.altarX)) ? { ...snap.dungeon } : null;
    g.chestStorage = (snap.chests && typeof snap.chests === 'object')
      ? JSON.parse(JSON.stringify(snap.chests)) : {};
    g.bossDaysDone = Array.isArray(snap.bossDays) ? snap.bossDays.slice() : [];
    g.dragonSlain = snap.slain === true;
    g.respawnPoint = snap.respawn || null;
    // Floor loot belongs to the world, not to a player.
    g.drops = Array.isArray(snap.drops)
      ? snap.drops.filter(d => typeof ITEMS !== 'undefined' && ITEMS[d.id])
          .map(d => new DropItem(d.x, d.y, d.id, d.c))
      : [];
    for (const d of g.drops) d._mpn = true;
    g.monsters = [];
    g.projectiles = [];
    g.boss = null;
    this.mobByNet.clear();
    this.mobMiss.clear();
    g.closeChestUI();
    // Stand at the shared spawn so two guests never materialise inside rock.
    if (snap.spawn && Number.isFinite(snap.spawn.x)) {
      g.player.x = snap.spawn.x;
      g.player.y = snap.spawn.y;
      g.player.vx = 0;
      g.player.vy = 0;
      g.camera.x = Math.max(0, Math.min(w.pixelWidth - g.camera.viewportWidth,
        g.player.x + g.player.width / 2 - g.camera.viewportWidth / 2));
      g.camera.y = Math.max(0, Math.min(w.pixelHeight - g.camera.viewportHeight,
        g.player.y + g.player.height / 2 - g.camera.viewportHeight / 2));
    }
    if (g.minimap) g.minimap.markDirty();
    if (rebuilt) g.particles.initAmbientLeaves(w.pixelWidth, w.pixelHeight);
    Multiplayer.worldOwners.set(w, this);
  }

  _onRemoteState(m) {
    const id = m.id;
    if (!id || id === this.selfId) return;
    let peer = this.peers.get(id);
    if (!peer) {
      // A state frame before jn/hello — adopt it and wait for the name.
      peer = { id, name: m.nm || 'Guest', st: null, avatar: null, lastRecv: this._tickNow };
      this.peers.set(id, peer);
    }
    if (m.nm) peer.name = m.nm;
    peer.st = {
      x: Number(m.x) || 0, y: Number(m.y) || 0, f: m.f === -1 ? -1 : 1,
      hp: Number(m.hp) || 0, mhp: Number(m.mhp) || 100,
      ar: m.ar || '', wi: m.wi || '', hd: m.hd || 'empty',
      sw: m.sw ? 1 : 0, fl: m.fl ? 1 : 0, ded: m.ded ? 1 : 0, nm: peer.name
    };
    peer.lastRecv = this._tickNow;
    this._upsertAvatar(peer);
  }

  _onRemoteTile(m) {
    if (m.src && m.src === this.selfId) return;   // our own edit, relayed back
    this._applyRemoteTile(Math.floor(Number(m.x)), Math.floor(Number(m.y)), Number(m.v));
  }

  _onRemoteChest(m) {
    if (m.src && m.src === this.selfId) return;
    const key = String(m.k || '');
    if (!/^\d+,\d+$/.test(key)) return;
    if (m.del) delete this.game.chestStorage[key];
    else if (Array.isArray(m.slots)) this.game.chestStorage[key] = this._sanitiseChest(m.slots);
    if (this.game.openChest && `${this.game.openChest.x},${this.game.openChest.y}` === key) {
      this._rerenderChest();
    }
  }

  _onRemoteDrop(m) {
    if (typeof ITEMS === 'undefined' || !ITEMS[m.id]) return;
    const d = new DropItem(Number(m.x) || 0, Number(m.y) || 0, m.id, Number(m.c) || 1);
    d._mpn = true;
    this.game.drops.push(d);
  }

  _onClock(m) {
    if (Number.isFinite(m.tod)) this.game.world.timeOfDay = m.tod;
    if (Number.isFinite(m.day)) this.game.world.dayCount = m.day;
  }

  _onFlags(m) {
    const g = this.game;
    if (m.gate && g.world.dungeon) g.world.dungeon.gateDefeated = true;
    if (Array.isArray(m.days)) g.bossDaysDone = m.days.slice();
    if (typeof m.slain === 'boolean') g.dragonSlain = m.slain;
  }

  _onPeerJoined(m) {
    if (!m.id || m.id === this.selfId) return;
    if (!this.peers.has(m.id)) {
      this.peers.set(m.id, {
        id: m.id, name: String(m.name || 'Guest').slice(0, 14),
        st: null, avatar: null, lastRecv: this._tickNow
      });
    }
    this.game.showToast(`👋 ${m.name} joined the session.`);
    this._pushHud();
  }

  _onPeerLeft(m) {
    const peer = m.id ? this.peers.get(m.id) : null;
    if (peer) {
      this.peers.delete(m.id);
      this.game.showToast(`👋 ${peer.name} left the session.`);
    }
    this._pushHud();
  }

  _onPlayerHit(m) {
    if (m.id !== this.selfId) return;
    const g = this.game;
    if (g.isDead) return;
    g.damagePlayer(Number(m.a) || 0, Number.isFinite(m.sx) ? m.sx : null,
      m.c || 'You were struck down.', m.boss === true, Number.isFinite(m.sy) ? m.sy : null);
  }

  // =====================================================================
  // Shared simulation: mob + boss snapshots (host -> guests)
  // =====================================================================

  /** Host: assign ids, filter by relevance, ship the 10Hz snapshot. */
  _sendMobSnapshot() {
    const g = this.game;
    const viewers = [{ x: g.player.x, y: g.player.y }];
    for (const p of this.peers.values()) {
      if (p.st && this._tickNow - p.lastRecv < 5) viewers.push({ x: p.st.x, y: p.st.y });
    }
    const list = [];
    for (const m of g.monsters) {
      if (m.dead) continue;
      if (!m.netId) {
        m.netId = this.nextNetId++;
        this.mobByNet.set(m.netId, m);
      }
      const near = viewers.some(v => Math.abs(m.x - v.x) < 1700 && Math.abs(m.y - v.y) < 1700);
      if (!near) continue;
      list.push({
        i: m.netId,
        t: m.species || m.type,
        u: m.underworld ? 1 : 0,
        x: Math.round(m.x), y: Math.round(m.y),
        hp: Math.max(0, Math.round(m.hp)), mh: Math.round(m.maxHp),
        f: m.facing === -1 ? -1 : 1,
        e: m.isElite ? 1 : 0,
        g: m.dungeonGatekeeper ? 1 : 0
      });
    }
    let boss = null;
    if (g.boss) {
      if (!g.boss.__mpS) g.boss.__mpS = this._bossSerial++;
      boss = {
        k: g.boss.kind || 'forest',
        s: g.boss.__mpS,
        x: Math.round(g.boss.x), y: Math.round(g.boss.y),
        hp: Math.max(0, Math.round(g.boss.hp)), mh: Math.round(g.boss.maxHp),
        nm: g.boss.name, ph: g.boss.phase || 1,
        dead: g.boss.dead ? 1 : 0, en: g.boss.enraged ? 1 : 0
      };
    }
    this._cast({ t: 'mb', m: list, b: boss });
  }

  _makeMob(e) {
    const kind = e.u ? 'u' : 'm';
    let mob = null;
    try {
      mob = kind === 'u'
        ? new UnderworldMonster(e.x, e.y, e.t)
        : new Monster(e.x, e.y, e.t);
    } catch (_) { return null; }
    if (!mob) return null;
    if (e.e && typeof mob.makeElite === 'function') mob.makeElite();
    mob.hp = Number.isFinite(e.hp) ? e.hp : mob.hp;
    if (Number.isFinite(e.mh)) mob.maxHp = e.mh;
    mob.facing = e.f === -1 ? -1 : 1;
    if (e.g) mob.dungeonGatekeeper = true;
    mob.tx = e.x;
    mob.ty = e.y;
    return mob;
  }

  _onMobSnapshot(m) {
    const g = this.game;
    // The host is inside the Ossuary: its monsters are stashed, so the guest
    // sees an empty field rather than arena mobs at meaningless coordinates.
    const list = this.dim === 'space' ? [] : (Array.isArray(m.m) ? m.m : []);
    const seen = new Set();
    for (const e of list) {
      const id = Number(e.i);
      if (!Number.isFinite(id)) continue;
      seen.add(id);
      this.mobMiss.delete(id);
      let mob = this.mobByNet.get(id);
      if (!mob) {
        mob = this._makeMob(e);
        if (!mob) continue;
        mob.netId = id;
        this.mobByNet.set(id, mob);
        g.monsters.push(mob);
      }
      mob.tx = Number(e.x) || mob.x;
      mob.ty = Number(e.y) || mob.y;
      // hp is authoritative from the host; a local hit only pre-empts it.
      if (Number.isFinite(e.hp)) mob.hp = e.hp;
      if (Number.isFinite(e.mh)) mob.maxHp = e.mh;
      mob.facing = e.f === -1 ? -1 : 1;
    }
    // Two missed snapshots in a row means the host let it go (despawn range).
    for (const [id, mob] of this.mobByNet) {
      if (seen.has(id)) continue;
      const misses = (this.mobMiss.get(id) || 0) + 1;
      this.mobMiss.set(id, misses);
      if (misses >= 2) {
        this.mobByNet.delete(id);
        this.mobMiss.delete(id);
        const idx = g.monsters.indexOf(mob);
        if (idx >= 0) g.monsters.splice(idx, 1);
      }
    }
    this._applyBossSnapshot(this.dim === 'space' ? null : m.b);
  }

  _applyBossSnapshot(b) {
    const g = this.game;
    if (!b) {
      // No boss at the host and one on screen: it vanished without dying.
      if (g.boss && g.boss.__mpPuppet && !g.boss.dead) g.boss = null;
      return;
    }
    const kind = b.k || 'forest';
    // A boss whose serial already died on this guest must never be rebuilt —
    // its loot block already ran, and a respawn would hand it out twice.
    if (b.s && this._bossDead.has(b.s) && (!g.boss || g.boss.__mpS !== b.s)) return;
    if (!g.boss || (g.boss.kind || 'forest') !== kind) {
      let boss = null;
      try {
        if (kind === 'knight') boss = new CursedKnightBoss(b.x, b.y, g);
        else if (kind === 'demon') boss = new DemonBoss(b.x, b.y, g);
        else if (kind === 'dragon') boss = new SkeletonDragonBoss(b.x, b.y, g);
        else boss = new ForestGuardianBoss(b.x, b.y, g);
      } catch (_) { boss = null; }
      if (!boss) return;
      boss.__mpPuppet = true;
      boss.__mpS = b.s || 0;
      boss.x = b.x;
      boss.y = b.y;
      boss.tx = b.x;
      boss.ty = b.y;
      g.boss = boss;
    }
    const boss = g.boss;
    boss.tx = b.x;
    boss.ty = b.y;
    if (Number.isFinite(b.hp)) boss.hp = Math.max(b.dead ? 0 : 1, b.hp);
    if (Number.isFinite(b.mh)) boss.maxHp = b.mh;
    if (b.nm) boss.name = b.nm;
    if (Number.isFinite(b.ph)) boss.phase = b.ph;
    if (b.en) boss.enraged = true;
    if (b.dead) {
      boss.dead = true;
      if (b.s) {
        this._bossDead.add(b.s);
        if (this._bossDead.size > 50) this._bossDead.clear();
      }
    } else if (boss.dead && boss.__mpPuppet) boss.dead = false;
  }

  /** Host: a monster died — flag its loot, then tell everyone with the list. */
  hostMobDeath(m, dropStart) {
    const g = this.game;
    const spawned = g.drops.slice(dropStart);
    const loot = [];
    for (const d of spawned) {
      d._mpn = true;
      loot.push({ id: d.id, c: d.count, x: Math.round(d.x), y: Math.round(d.y) });
    }
    if (!m.netId) m.netId = this.nextNetId++;
    this.mobByNet.delete(m.netId);
    this._cast({
      t: 'kd', id: m.netId, x: Math.round(m.x), y: Math.round(m.y),
      elite: m.isElite ? 1 : 0, d: loot
    });
  }

  /**
   * Host: boss loot stays local to each machine (every machine's own
   * boss-defeated block hands out its player's bag), so those drops are
   * flagged as known without being announced.
   */
  markLocalDrops(dropStart) {
    const drops = this.game.drops;
    for (let i = Math.max(0, dropStart); i < drops.length; i++) drops[i]._mpn = true;
  }

  /** Host: every unflagged drop is a world drop the guests must see. */
  captureNewDrops() {
    if (!this.isHost) return;
    for (const d of this.game.drops) {
      if (d._mpn) continue;
      d._mpn = true;
      this._cast({ t: 'dr', x: Math.round(d.x), y: Math.round(d.y), id: d.id, c: d.count });
    }
  }

  /** Guest: the host confirmed a kill — bookkeeping plus this player's loot. */
  _onMobDied(m) {
    const g = this.game;
    const id = Number(m.id);
    if (!Number.isFinite(id)) return;
    const idx = g.monsters.findIndex(x => x.netId === id);
    if (idx >= 0) g.monsters.splice(idx, 1);
    this.mobByNet.delete(id);
    this.mobMiss.delete(id);
    if (!this._killSeen) this._killSeen = new Set();
    if (this._killSeen.has(id)) return;
    this._killSeen.add(id);
    if (this._killSeen.size > 500) this._killSeen.clear();
    g.stats.kills += 1;
    if (m.elite) g.stats.eliteKills += 1;
    g.journey && g.journey.recordActivity('hunt', Number(m.x) || 0, Number(m.y) || 0);
    for (const d of (Array.isArray(m.d) ? m.d : [])) {
      if (typeof ITEMS === 'undefined' || !ITEMS[d.id]) continue;
      const drop = new DropItem(Number(d.x) || 0, Number(d.y) || 0, d.id, Number(d.c) || 1);
      drop._mpn = true;
      g.drops.push(drop);
    }
  }

  // =====================================================================
  // Per-frame pump. Called from Game.update BEFORE the pause guard so a
  // hosted room on the title screen still answers pings and heartbeats.
  // =====================================================================

  tick(dt) {
    this._tickNow += dt;
    if (!this.active || !this.transport) return;
    const g = this.game;
    if (this.isHost) {
      if (this.every('hb', 1)) {
        const names = [['host', this.hostName]];
        for (const p of this.peers.values()) names.push([p.id, p.name]);
        this._cast({ t: 'hb', names });
        const dim = g.world.isInSpace() ? 'space' : 'overworld';
        if (dim !== this.dim) {
          this.dim = dim;
          this._cast({ t: 'dim', d: dim });
          if (dim === 'space') {
            g.showToast('🌀 You crossed into the Ossuary — guests keep the overworld.');
          }
        }
        for (const p of [...this.peers.values()]) {
          if (this._tickNow - p.lastRecv > 5) {
            this.peers.delete(p.id);
            this._cast({ t: 'lv', id: p.id });
            g.showToast(`👋 ${p.name} lost connection.`);
            this._pushHud();
          }
        }
      }
      if (this.every('state', 1 / 15)) {
        this._cast(Object.assign({ t: 'p', id: 'host' }, this._ownState()));
      }
      if (this.every('mobs', 0.1)) this._sendMobSnapshot();
      if (this.every('time', 2)) {
        const tod = Math.round(g.world.timeOfDay * 10000) / 10000;
        const day = g.world.dayCount;
        if (tod !== this._lastSentTime || day !== this._lastSentDay) {
          this._lastSentTime = tod;
          this._lastSentDay = day;
          this._cast({ t: 'tm', tod, day });
        }
      }
      if (this.every('flags', 5)) {
        const gate = !!(g.world.dungeon && g.world.dungeon.gateDefeated);
        const days = (g.bossDaysDone || []).join(',');
        const slain = g.dragonSlain === true;
        const key = `${gate ? 1 : 0}|${days}|${slain ? 1 : 0}`;
        if (key !== this._lastSentFlags) {
          this._lastSentFlags = key;
          this._cast({ t: 'fl', gate, days: (g.bossDaysDone || []).slice(), slain });
        }
      }
      this.captureNewDrops();
    } else if (this.isClient) {
      if (this.status !== 'joined') return;
      if (this.every('state', 1 / 15)) {
        this._send(Object.assign({ t: 'p' }, this._ownState()), 'host');
      }
      if (this.every('ping', 3)) this._send({ t: 'pn', ts: performance.now() }, 'host');
      if (this.lastHostBeat && this._tickNow - this.lastHostBeat > 4.5) {
        this.disconnect('The host closed the connection or went away.');
        return;
      }
    }
    this.updateAvatars(dt);
    this.updatePuppets(dt);
    if (this.every('hud', 0.5)) this._pushHud();
  }

  /** Smooth remote characters toward their latest received position. */
  updateAvatars(dt) {
    const k = Math.min(1, dt * 10);
    for (const peer of this.peers.values()) {
      const a = peer.avatar;
      if (!a) continue;
      const st = peer.st;
      if (!st) continue;
      const px = a.x;
      const py = a.y;
      a.x += (st.x - a.x) * k;
      a.y += (st.y - a.y) * k;
      // Walk animation keys off |vx| (px/frame), so derive it from the delta.
      a.vx = ((a.x - px) / Math.max(dt, 0.0001)) / 60;
      a.vy = ((a.y - py) / Math.max(dt, 0.0001)) / 60;
      if (a.isSwinging) {
        a.swingTimer -= dt;
        if (a.swingTimer <= 0) a.isSwinging = false;
      }
    }
    // Silent fallback: an explicit lv covers normal leaves, this covers the
    // ones that never arrive (crashed tab, dead socket).
    for (const [id, peer] of [...this.peers]) {
      if (this._tickNow - peer.lastRecv > 12) {
        this.peers.delete(id);
        this._pushHud();
      }
    }
  }

  /** Smooth puppet mobs/bosses the same way; snapshots arrive at 10Hz. */
  updatePuppets(dt) {
    if (!this.isClient) return;
    const k = Math.min(1, dt * 12);
    for (const mob of this.mobByNet.values()) {
      if (Number.isFinite(mob.tx)) mob.x += (mob.tx - mob.x) * k;
      if (Number.isFinite(mob.ty)) mob.y += (mob.ty - mob.y) * k;
    }
    const boss = this.game.boss;
    if (boss && boss.__mpPuppet) {
      if (Number.isFinite(boss.tx)) boss.x += (boss.tx - boss.x) * k;
      if (Number.isFinite(boss.ty)) boss.y += (boss.ty - boss.y) * k;
    }
  }

  // =====================================================================
  // Remote characters
  // =====================================================================

  _upsertAvatar(peer) {
    if (!peer.st) return;
    if (!peer.avatar) {
      peer.avatar = new Player(peer.st.x, peer.st.y);
      // A small carried light so a friend wandering into a cave is visible.
      peer.avatar.lightRadius = 110;
    }
    const a = peer.avatar;
    const st = peer.st;
    if (!a._mpPlaced) {
      a.x = st.x;
      a.y = st.y;
      a._mpPlaced = true;
    }
    a.facing = st.f;
    a.maxHp = Math.max(1, st.mhp);
    a.hp = Math.max(0, Math.min(a.maxHp, st.hp));
    const armor = typeof ITEMS !== 'undefined' && st.ar ? ITEMS[st.ar] : null;
    a.activeArmor = armor && armor.type === 'armor' ? armor : null;
    const wings = typeof ITEMS !== 'undefined' && st.wi ? ITEMS[st.wi] : null;
    a.activeWings = wings || null;
    a.hasWings = !!(wings && wings.grantsFlight);
    a.isFlying = !!st.fl;
    if (st.sw && !a.isSwinging) a.startSwing(0.22);
  }

  /** Draw every remote character with their name plate and health bar. */
  renderPlayers(ctx, camera) {
    if (!this.active) return;
    for (const peer of this.peers.values()) {
      const a = peer.avatar;
      if (!a || !peer.st || peer.st.ded) continue;
      // The host's character lives at coordinates that mean nothing to a
      // guest while the host is inside the Ossuary.
      if (peer.id === 'host' && this.dim === 'space') continue;
      const held = typeof ITEMS !== 'undefined' && peer.st.hd && ITEMS[peer.st.hd]
        ? { id: peer.st.hd, count: 1 }
        : { id: 'empty', count: 0 };
      a.render(ctx, camera, held, a.activeArmor);
      const sx = Math.round(a.x + a.width / 2 - camera.x);
      const sy = Math.round(a.y - camera.y);
      ctx.save();
      ctx.font = 'bold 9px monospace';
      ctx.textAlign = 'center';
      ctx.lineWidth = 3;
      ctx.strokeStyle = 'rgba(0,0,0,0.8)';
      ctx.strokeText(peer.name, sx, sy - 20);
      ctx.fillStyle = '#f8fafc';
      ctx.fillText(peer.name, sx, sy - 20);
      const ratio = Math.max(0, Math.min(1, a.hp / Math.max(1, a.maxHp)));
      ctx.fillStyle = 'rgba(0,0,0,0.65)';
      ctx.fillRect(sx - 15, sy - 17, 30, 4);
      ctx.fillStyle = ratio > 0.5 ? '#4ade80' : ratio > 0.25 ? '#facc15' : '#ef4444';
      ctx.fillRect(sx - 14, sy - 16, 28 * ratio, 2);
      ctx.restore();
    }
  }

  /** Give the lighting pass every remote player that carries a light. */
  pushLit(lit) {
    if (!this.active) return;
    for (const peer of this.peers.values()) {
      if (peer.avatar && !(peer.st && peer.st.ded) && Number.isFinite(peer.avatar.lightRadius)) {
        lit.push(peer.avatar);
      }
    }
  }

  // =====================================================================
  // Damage routing — who wears the hit
  // =====================================================================

  /**
   * Host only: decide whether a damage event belongs to a guest rather than
   * the host's own player. Returns true when the hit was forwarded, which
   * tells Game.damagePlayer to skip applying it locally.
   */
  routeDamage(amount, sourceX, sourceY, cause, isBoss) {
    if (!this.isHost || sourceX == null) return false;
    const g = this.game;
    const distOf = (cx, cy) => {
      const dx = cx - sourceX;
      const dy = sourceY != null ? (cy - sourceY) : 0;
      return dx * dx + dy * dy;
    };
    let bestPeer = null;
    let bestD = Infinity;
    for (const peer of this.peers.values()) {
      if (!peer.avatar || !peer.st || peer.st.ded) continue;
      if (this._tickNow - peer.lastRecv > 5) continue;
      const d = distOf(peer.avatar.x + peer.avatar.width / 2,
        peer.avatar.y + peer.avatar.height / 2);
      if (d < bestD) { bestD = d; bestPeer = peer; }
    }
    const hostD = distOf(g.player.x + g.player.width / 2, g.player.y + g.player.height / 2);
    if (bestPeer && bestD < hostD) {
      this.sendPlayerHit(bestPeer, amount, cause, isBoss, sourceX, sourceY);
      return true;
    }
    return false;
  }

  sendPlayerHit(peer, amount, cause, isBoss, sourceX, sourceY) {
    if (!this.active || !peer) return;
    this._send({
      t: 'ph', id: peer.id, a: Math.round(amount),
      sx: sourceX, sy: sourceY, c: cause, boss: isBoss === true
    }, peer.id);
  }

  /**
   * Guest: a swing/arrow landed on a shared monster. The host applies the
   * damage for real; locally the corpse is held at 1hp until the host confirms
   * the kill, so nothing dies twice and no loot is handed out early.
   */
  sendMobHit(mob, damage, crit) {
    if (!this.isClient || !mob || !Number.isFinite(damage)) return;
    if (mob.netId) this._send({ t: 'hit', i: mob.netId, d: Math.max(1, Math.round(damage)), c: !!crit }, 'host');
    if (mob.dead) { mob.dead = false; mob.hp = Math.max(1, mob.hp); }
  }

  /** Guest: the same deal for the boss puppet. */
  sendBossHit(damage, crit) {
    if (!this.isClient) return;
    const boss = this.game.boss;
    if (!boss) return;
    if (Number.isFinite(damage)) {
      this._send({ t: 'bh', d: Math.max(1, Math.round(damage)), c: !!crit }, 'host');
    }
    if (boss.dead && boss.__mpPuppet) { boss.dead = false; boss.hp = Math.max(1, boss.hp); }
  }

  /** Guest: ask the host to wake the Hollow Warden at this gate tile. */
  requestGate(tileX, tileY) {
    if (!this.isClient) return;
    this._send({ t: 'gate', x: tileX, y: tileY }, 'host');
  }

  /** Guest: ask the host to raise a boss. `kind` picks which entrance. */
  requestBossSummon(kind) {
    if (!this.isClient) return;
    this._send({ t: 'sum', k: kind || 'forest' }, 'host');
  }

  /**
   * Nearest living character to a point — mob and boss AI chase whoever is
   * actually close, so a guest gets monsters' attention too. Guests return
   * null and fall back to their own player (their puppets never run AI).
   */
  nearestChaseTarget(x, y) {
    if (!this.isHost) return null;
    const g = this.game;
    let best = null;
    let bestD = Infinity;
    const dx = (g.player.x + g.player.width / 2) - x;
    const dy = (g.player.y + g.player.height / 2) - y;
    bestD = dx * dx + dy * dy;
    best = g.player;
    for (const peer of this.peers.values()) {
      if (!peer.avatar || !peer.st || peer.st.ded) continue;
      if (this._tickNow - peer.lastRecv > 5) continue;
      const pdx = (peer.avatar.x + peer.avatar.width / 2) - x;
      const pdy = (peer.avatar.y + peer.avatar.height / 2) - y;
      const d = pdx * pdx + pdy * pdy;
      if (d < bestD) { bestD = d; best = peer.avatar; }
    }
    return best;
  }

  /** True when any guest's character sits on this point (projectile hits). */
  avatarNear(x, y, radius) {
    if (!this.isHost) return false;
    for (const peer of this.peers.values()) {
      if (!peer.avatar || !peer.st || peer.st.ded) continue;
      if (this._tickNow - peer.lastRecv > 5) continue;
      const a = peer.avatar;
      if (Math.hypot(x - (a.x + a.width / 2), y - (a.y + a.height / 2)) < radius) return true;
    }
    return false;
  }

  /** True when any guest's character overlaps a box (boss touch damage). */
  avatarTouchesBox(left, top, right, bottom) {
    return !!this.peerTouchingBox(left, top, right, bottom);
  }

  /** The guest whose character overlaps a box, or null. */
  peerTouchingBox(left, top, right, bottom) {
    if (!this.isHost) return null;
    for (const peer of this.peers.values()) {
      if (!peer.avatar || !peer.st || peer.st.ded) continue;
      if (this._tickNow - peer.lastRecv > 5) continue;
      const a = peer.avatar;
      if (a.x < right && a.x + a.width > left && a.y < bottom && a.y + a.height > top) return peer;
    }
    return null;
  }

  /**
   * Guest-side deny for actions the host must own (opening the rift, reading
   * the bone rite). Returns true when the action was blocked.
   */
  denyForClient(msg) {
    if (!this.isClient) return false;
    this.game.showToast(msg);
    return true;
  }

  _setDim(d) {
    const prev = this.dim;
    if (prev === d) return;
    this.dim = d;
    if (!this.isClient) return;
    this.game.showToast(d === 'space'
      ? '🌀 The host crossed into the Ossuary — the overworld is yours meanwhile.'
      : '🌍 The host returned to the overworld.');
  }

  // =====================================================================
  // HUD: status chip, roster list, chat overlay
  // =====================================================================

  _ensureHud() {
    if (this.hud) return this.hud;
    const layer = document.getElementById('ui-layer');
    if (!layer || typeof document.createElement !== 'function') return null;

    const chip = document.createElement('div');
    chip.className = 'mp-chip';
    const chipText = document.createElement('span');
    chipText.className = 'mp-chip-text';
    chip.appendChild(chipText);
    const leave = document.createElement('button');
    leave.className = 'mp-chip-leave';
    leave.textContent = '⏏';
    leave.title = 'Leave the multiplayer session';
    leave.addEventListener('click', (event) => {
      event.stopPropagation();
      this.disconnect();
    });
    chip.appendChild(leave);

    const list = document.createElement('div');
    list.className = 'mp-roster';

    const chatLog = document.createElement('div');
    chatLog.className = 'mp-chat-log';

    const input = document.createElement('input');
    input.className = 'mp-chat-input';
    input.maxLength = 80;
    input.placeholder = 'Say something… (Enter to send, Esc to close)';
    input.addEventListener('keydown', (event) => {
      event.stopPropagation();
      if (event.key === 'Enter') {
        const text = input.value.trim();
        input.value = '';
        this.closeChat();
        if (text) this.sendChat(text);
        event.preventDefault();
      } else if (event.key === 'Escape') {
        this.closeChat();
        event.preventDefault();
      }
    });
    input.addEventListener('blur', () => this.closeChat());

    layer.appendChild(chip);
    layer.appendChild(list);
    layer.appendChild(chatLog);
    layer.appendChild(input);
    this.hud = { chip, chipText, leave, list, chatLog, input };
    return this.hud;
  }

  _pushHud() {
    const hud = this._ensureHud();
    // The title-screen panel mirrors the same state while a session is set up.
    if (this.game && typeof this.game.syncMultiplayerPanel === 'function') {
      try { this.game.syncMultiplayerPanel(); } catch (_) { /* panel detached */ }
    }
    if (!hud) return;
    if (!this.active) {
      hud.chip.classList.add('hidden');
      hud.list.classList.add('hidden');
      hud.chatLog.classList.add('hidden');
      hud.input.classList.add('hidden');
      return;
    }
    hud.chip.classList.remove('hidden');
    const count = this.isHost ? 1 + this.peers.size : Math.max(1, this.roster.length);
    const ping = this.pingMs != null ? ` · ${this.pingMs}ms` : '';
    hud.chipText.textContent = (this.status === 'joined' || this.status === 'hosting')
      ? `👥 ${count}/4 · ${this.room}${ping}`
      : `👥 ${this.statusDetail || 'connecting…'}`;
    const names = [];
    if (this.isHost) {
      names.push(this.hostName);
      for (const p of this.peers.values()) names.push(p.name);
    } else {
      for (const n of this.roster) names.push(n[1]);
    }
    hud.list.textContent = names.length ? `In this room: ${names.join(', ')}` : '';
    hud.chip.title = names.join(', ');
    this._renderChat();
  }

  // ---- chat ------------------------------------------------------------

  _receiveChat(name, text) {
    this.chatLines.push({ name, text, at: this._tickNow });
    if (this.chatLines.length > 30) this.chatLines.shift();
    this.chatHideAt = this._tickNow + 9;
    this._renderChat();
  }

  sendChat(text) {
    if (!this.active) return;
    const clean = String(text).slice(0, 80).trim();
    if (!clean) return;
    if (this.isHost) {
      this._receiveChat(this.hostName, clean);
      this._cast({ t: 'say', id: 'host', name: this.hostName, s: clean });
    } else {
      this._send({ t: 'say', s: clean }, 'host');
    }
  }

  openChat() {
    const hud = this._ensureHud();
    if (!hud || !this.active || this.chatOpen) return;
    this.chatOpen = true;
    this.game.input.keys = {};
    this.game.input.mouseDown = false;
    hud.input.classList.remove('hidden');
    this.chatHideAt = this._tickNow + 60;   // keep the log visible while typing
    this._renderChat();
    try { hud.input.focus({ preventScroll: true }); } catch (_) { hud.input.focus(); }
  }

  closeChat() {
    if (!this.chatOpen) return;
    this.chatOpen = false;
    if (this.hud) {
      this.hud.input.value = '';
      this.hud.input.classList.add('hidden');
      try { this.hud.input.blur(); } catch (_) { /* already gone */ }
    }
    this.chatHideAt = this._tickNow + 6;
  }

  _renderChat() {
    const hud = this.hud;
    if (!hud) return;
    if (!this.active || (!this.chatLines.length && !this.chatOpen)) {
      hud.chatLog.classList.add('hidden');
      hud.input.classList.toggle('hidden', !this.chatOpen);
      return;
    }
    const visible = this.chatOpen || this._tickNow < this.chatHideAt;
    hud.chatLog.classList.toggle('hidden', !visible);
    hud.input.classList.toggle('hidden', !this.chatOpen);
    if (!visible) return;
    hud.chatLog.innerHTML = '';
    for (const line of this.chatLines.slice(-7)) {
      const row = document.createElement('div');
      row.className = 'mp-chat-line';
      // Two elements rather than createTextNode: nothing here needs a raw text
      // node, and this keeps the renderer working in stub DOMs too.
      const who = document.createElement('b');
      who.textContent = line.name + ':';
      row.appendChild(who);
      const body = document.createElement('span');
      body.textContent = ' ' + line.text;
      row.appendChild(body);
      hud.chatLog.appendChild(row);
    }
  }
};

// ---------------------------------------------------------------------------
// Statics: the world -> session index, the setTile hook, and the in-process
// transport pair the QA kit uses to exercise the protocol without a browser.
// ---------------------------------------------------------------------------

/** Which session owns which World instance (WeakMap: worlds are throwaway). */
Multiplayer.worldOwners = new WeakMap();

/**
 * Wrap World.setTile so ANY tile edit — mining, placing, chest lids, script
 * effects nobody has written yet — reaches the session automatically. The
 * guard in localTile() drops remote applications (applyingRemote) and edits
 * to a stashed dimension buffer (host inside the Ossuary), so nothing echoes
 * and nothing from the arena leaks into guests' overworlds.
 */
Multiplayer.hookWorld = function hookWorld() {
  if (typeof World === 'undefined' || World.prototype.__mpHooked) return;
  World.prototype.__mpHooked = true;
  const original = World.prototype.setTile;
  World.prototype.setTile = function setTile(x, y, tile) {
    const before = this.getTile(x, y);
    original.call(this, x, y, tile);
    if (before === tile) return;
    const session = Multiplayer.worldOwners.get(this);
    if (session) session.localTile(x, y, tile);
  };
};

/**
 * Tiny synchronous message hub for tests: terminals registered here receive
 * each other's sends (never their own, never ones addressed elsewhere) when
 * the test calls pump(). Messages are deep-copied so a handler cannot mutate
 * what the next handler sees — the same isolation BroadcastChannel gives.
 */
Multiplayer.makeHub = function makeHub() {
  const hub = {
    terms: [],
    queue: [],
    add(entry) { hub.terms.push(entry); },
    remove(term) {
      const i = hub.terms.findIndex(e => e.term === term);
      if (i >= 0) hub.terms.splice(i, 1);
    },
    push(event) { hub.queue.push(event); },
    pump() {
      let guard = 0;
      while (hub.queue.length && guard++ < 5000) {
        const ev = hub.queue.shift();
        for (const entry of [...hub.terms]) {
          if (entry.term.closed || entry.term.selfId === ev.from) continue;
          if (ev.to && entry.term.selfId !== ev.to) continue;
          let msg = ev.m;
          try { msg = JSON.parse(JSON.stringify(ev.m)); } catch (_) { continue; }
          entry.onMessage(msg, ev.from);
        }
      }
    }
  };
  return hub;
};

/**
 * Build a transport bound to a hub. `onStatus('open')` fires immediately,
 * exactly like BroadcastChannel does.
 */
Multiplayer.makeHubTransport = function makeHubTransport(hub, selfId, onMessage, onStatus) {
  const term = {
    kind: 'hub',
    selfId,
    closed: false,
    send(m, to) {
      if (term.closed) return;
      hub.push({ from: selfId, to: to || null, m });
    },
    close() {
      term.closed = true;
      hub.remove(term);
    }
  };
  hub.add({ term, onMessage });
  // Fires synchronously: tests drive the queue themselves with hub.pump().
  if (onStatus) onStatus('open');
  return term;
};

// World exists by the time this script loads (it sits after world.js).
Multiplayer.hookWorld();











