// Terracraft dev server — zero-dependency static file server.
// Usage: node server.js [port]   (default port 8000)
//
// It doubles as the MULTIPLAYER RELAY: browsers connect to ws://host:port/mp
// and this process forwards room messages between the host and guests. No
// dependencies — the WebSocket framing below is a strict RFC 6455 subset
// (text, ping/pong, close, masked client frames, 7/16/64-bit lengths).
const http = require('http');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const ROOT = __dirname;
const PORT = Number(process.argv[2] || process.env.PORT || 8000);
const WS_GUID = '258EAFA5-E914-47DA-95CA-C5AB0DC85B11';
const MAX_MSG = 16 * 1024 * 1024;   // world snapshots are ~250KB; this is slack
const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.wav': 'audio/wav',
  '.mp3': 'audio/mpeg',
  '.ogg': 'audio/ogg',
  '.txt': 'text/plain; charset=utf-8'
};

const server = http.createServer((req, res) => {
  let urlPath;
  try {
    urlPath = decodeURIComponent(req.url.split('?')[0].split('#')[0]);
  } catch (e) {
    res.writeHead(400, { 'Content-Type': 'text/plain' });
    res.end('400 Bad request');
    return;
  }
  if (urlPath === '/') urlPath = '/terraria.html';

  const filePath = path.normalize(path.join(ROOT, urlPath));
  if (!filePath.startsWith(ROOT)) {
    res.writeHead(403, { 'Content-Type': 'text/plain' });
    res.end('403 Forbidden');
    return;
  }

  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('404 Not found: ' + urlPath);
      return;
    }
    const mime = MIME[path.extname(filePath).toLowerCase()] || 'application/octet-stream';
    res.writeHead(200, { 'Content-Type': mime });
    res.end(data);
  });
});

// ---------------------------------------------------------------------------
// Multiplayer relay (see multiplayer.js for the client half)
// ---------------------------------------------------------------------------

/** Server->client frame: FIN + opcode, unmasked payload, RFC 6455 lengths. */
function encodeFrame(opcode, payload) {
  const len = payload.length;
  let header;
  if (len < 126) {
    header = Buffer.alloc(2);
    header[1] = len;
  } else if (len < 65536) {
    header = Buffer.alloc(4);
    header[1] = 126;
    header.writeUInt16BE(len, 2);
  } else {
    header = Buffer.alloc(10);
    header[1] = 127;
    header.writeBigUInt64BE(BigInt(len), 2);
  }
  header[0] = 0x80 | opcode;
  return Buffer.concat([header, payload]);
}

const rooms = new Map();   // 'K7QF' -> { host: conn|null, clients: Map<id, conn> }

function sendJson(conn, obj) {
  if (!conn || conn.dead || !conn.socket || conn.socket.destroyed) return;
  let data;
  try { data = Buffer.from(JSON.stringify(obj), 'utf8'); } catch (_) { return; }
  if (data.length > MAX_MSG) return;
  try { conn.socket.write(encodeFrame(1, data)); } catch (_) { /* peer vanished */ }
}

/**
 * Pull as many complete frames off the buffer as are present. Client frames
 * are masked (RFC 6455 §5.3); control frames must not be fragmented.
 */
function drain(conn) {
  for (;;) {
    const buf = conn.buf;
    if (buf.length < 2) return;
    const b0 = buf[0];
    const b1 = buf[1];
    const fin = (b0 & 0x80) !== 0;
    const opcode = b0 & 0x0f;
    const masked = (b1 & 0x80) !== 0;
    let len = b1 & 0x7f;
    let offset = 2;
    if (len === 126) {
      if (buf.length < offset + 2) return;
      len = buf.readUInt16BE(offset);
      offset += 2;
    } else if (len === 127) {
      if (buf.length < offset + 8) return;
      const big = buf.readBigUInt64BE(offset);
      if (big > BigInt(MAX_MSG)) { destroy(conn); return; }
      len = Number(big);
      offset += 8;
    }
    if (len > MAX_MSG) { destroy(conn); return; }
    if (!masked) { destroy(conn); return; }          // clients MUST mask
    if (buf.length < offset + 4 + len) return;
    const maskKey = buf.subarray(offset, offset + 4);
    offset += 4;
    const payload = Buffer.alloc(len);
    for (let i = 0; i < len; i++) {
      payload[i] = buf[offset + i] ^ maskKey[i & 3];
    }
    offset += len;
    conn.buf = buf.subarray(offset);
    conn.lastSeen = Date.now();

    if (opcode === 0x8) { destroy(conn); return; }    // close
    if (opcode === 0x9) {                             // ping -> pong
      try { conn.socket.write(encodeFrame(0xA, payload)); } catch (_) {}
      continue;
    }
    if (opcode === 0xA) continue;                     // pong
    if (opcode === 0x1 || opcode === 0x2) {
      if (!fin) { conn.frag = payload; conn.fragOp = opcode; continue; }
      handleFrame(conn, payload);
      continue;
    }
    if (opcode === 0x0) {                             // continuation
      if (!conn.frag) { destroy(conn); return; }
      conn.frag = Buffer.concat([conn.frag, payload]);
      if (conn.frag.length > MAX_MSG) { destroy(conn); return; }
      if (fin) {
        const full = conn.frag;
        conn.frag = null;
        handleFrame(conn, full);
      }
      continue;
    }
    destroy(conn);                                    // unknown opcode
  }
}

function handleFrame(conn, payload) {
  let obj;
  try { obj = JSON.parse(payload.toString('utf8')); } catch (_) { return; }
  if (!obj || typeof obj !== 'object' || typeof obj.t !== 'string') return;
  if (obj.t === 'hello') return onHello(conn, obj);
  if (obj.t === 'msg') return onRelay(conn, obj);
}

function onHello(conn, m) {
  const roomCode = String(m.room || '').toUpperCase().slice(0, 4);
  if (!/^[A-Z0-9]{1,4}$/.test(roomCode)) {
    sendJson(conn, { t: 'error', code: 'bad-room' });
    return;
  }
  let room = rooms.get(roomCode);
  if (!room) {
    room = { host: null, clients: new Map() };
    rooms.set(roomCode, room);
  }
  if (m.role === 'host') {
    // Replacing a dead host is normal (refresh); replacing a live one is not.
    if (room.host && room.host !== conn && !room.host.dead) {
      sendJson(room.host, { t: 'bye', code: 'replaced' });
      room.host.room = null;
      room.host.role = null;
    }
    for (const c of room.clients.values()) sendJson(c, { t: 'bye', code: 'host-left' });
    room.clients.clear();
    conn.role = 'host';
    conn.room = roomCode;
    conn.id = 'host';
    room.host = conn;
    sendJson(conn, { t: 'sid', id: 'host' });
    return;
  }
  if (!room.host || room.host.dead) {
    sendJson(conn, { t: 'error', code: 'no-host' });
    return;
  }
  if (room.clients.size >= 3) {
    sendJson(conn, { t: 'error', code: 'full' });
    return;
  }
  const id = 'g' + crypto.randomBytes(3).toString('hex');
  conn.role = 'client';
  conn.room = roomCode;
  conn.id = id;
  room.clients.set(id, conn);
  sendJson(conn, { t: 'sid', id });
  sendJson(room.host, { t: 'msg', from: id, m: { t: 'hi', name: String(m.name || 'Guest').slice(0, 14) } });
}

function onRelay(conn, wrapper) {
  const room = conn.room ? rooms.get(conn.room) : null;
  if (!room) return;
  // A relay frame is {t:'msg', to?, m:<application message>} — the application
  // message is what gets forwarded. (BroadcastChannel, which has no relay,
  // delivers the application message on its own, so accept that shape too.)
  const app = wrapper && typeof wrapper === 'object' && wrapper.m ? wrapper.m : wrapper;
  if (!app || typeof app !== 'object') return;
  // The addressee is part of the relay envelope (WSTransport puts it there),
  // with a fallback to the message itself for hand-rolled senders.
  const to = (wrapper && typeof wrapper.to === 'string' && wrapper.to) ||
    (typeof app.to === 'string' ? app.to : null);
  if (conn.role === 'host') {
    const envelope = { t: 'msg', from: 'host', m: app };
    if (to && room.clients.has(to)) {
      sendJson(room.clients.get(to), envelope);
      return;
    }
    for (const c of room.clients.values()) sendJson(c, envelope);
  } else if (conn.role === 'client') {
    // Guests only ever speak to the host; the relay stamps their identity so
    // nothing can impersonate anyone else.
    if (room.host) sendJson(room.host, { t: 'msg', from: conn.id, m: app });
  }
}

function destroy(conn) {
  if (conn.dead) return;
  conn.dead = true;
  const room = conn.room ? rooms.get(conn.room) : null;
  if (room) {
    if (conn.role === 'host') {
      room.host = null;
      for (const c of room.clients.values()) {
        sendJson(c, { t: 'bye', code: 'host-left' });
        c.room = null;
        c.role = null;
      }
      room.clients.clear();
      rooms.delete(conn.room);
    } else if (conn.role === 'client') {
      room.clients.delete(conn.id);
      if (room.host) sendJson(room.host, { t: 'msg', from: conn.id, m: { t: 'lv' } });
      if (!room.host && room.clients.size === 0) rooms.delete(conn.room);
    }
  }
  try { conn.socket.destroy(); } catch (_) { /* already gone */ }
}

server.on('upgrade', (req, socket) => {
  const urlPath = (req.url || '').split('?')[0];
  if (urlPath !== '/mp') {
    socket.destroy();
    return;
  }
  const key = req.headers['sec-websocket-key'];
  const version = req.headers['sec-websocket-version'];
  if (!key || String(version) !== '13') {
    socket.write('HTTP/1.1 400 Bad Request\r\nConnection: close\r\n\r\n');
    socket.destroy();
    return;
  }
  const accept = crypto.createHash('sha1').update(key + WS_GUID).digest('base64');
  socket.write(
    'HTTP/1.1 101 Switching Protocols\r\n' +
    'Upgrade: websocket\r\n' +
    'Connection: Upgrade\r\n' +
    `Sec-WebSocket-Accept: ${accept}\r\n\r\n`
  );
  socket.setNoDelay(true);
  const conn = {
    socket, buf: Buffer.alloc(0), frag: null, fragOp: 0,
    id: null, role: null, room: null, dead: false, lastSeen: Date.now()
  };
  socket.on('data', (chunk) => {
    if (conn.dead) return;
    conn.buf = conn.buf.length ? Buffer.concat([conn.buf, chunk]) : chunk;
    if (conn.buf.length > MAX_MSG + 1024) { destroy(conn); return; }
    try { drain(conn); } catch (_) { destroy(conn); }
  });
  socket.on('error', () => destroy(conn));
  // BOTH events, not just 'close': an upgraded socket arrives half-open, so a
  // client that closes its tab cleanly produces 'end' and the handle can sit
  // there waiting for a TCP timeout before 'close' ever fires. Listening only
  // to 'close' left dead guests in the room — and their room slots full.
  socket.on('end', () => destroy(conn));
  socket.on('close', () => destroy(conn));
});

// Idle sockets (a tab that hung without closing) are swept every minute.
setInterval(() => {
  const cutoff = Date.now() - 90000;
  const sweep = (conn) => { if (conn && !conn.dead && conn.lastSeen < cutoff) destroy(conn); };
  for (const room of rooms.values()) {
    sweep(room.host);
    for (const c of room.clients.values()) sweep(c);
  }
}, 60000).unref();

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    // Another copy is already serving — treat as success so debug tasks don't hang.
    console.log(`Terracraft already running at http://localhost:${PORT}/terraria.html`);
    process.exit(0);
  }
  console.error(err);
  process.exit(1);
});

if (require.main === module) {
  server.listen(PORT, () => {
    console.log(`Terracraft running at http://localhost:${PORT}/terraria.html`);
    console.log(`Multiplayer relay ready: ws://localhost:${PORT}/mp`);
  });
}

module.exports = { server, rooms, encodeFrame };



