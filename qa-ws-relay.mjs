// qa-ws-relay.mjs - proves the REAL relay handshake routes messages.
//
// The in-process hub in qa-multiplayer.js never exercises WSTransport or the
// relay's onHello/onRelay handshake, which is exactly how a socket that never
// announced its room passed every test while real play was dead. This connects
// two REAL WebSocket clients to a running server.js and asserts end-to-end
// routing in both directions.
//
// Usage:
//   node server.js 8123
//   node qa-ws-relay.mjs ws://localhost:8123/mp
import { randomBytes } from 'node:crypto';

const RELAY = process.argv[2] || 'ws://localhost:8123/mp';
const ROOM = 'RT' + Math.floor(Math.random() * 90 + 10);
let failures = 0;

function ok(name, cond, detail) {
  console.log((cond ? '  ok   ' : '  FAIL ') + name + (detail ? '  [' + detail + ']' : ''));
  if (!cond) failures += 1;
}

function connect() {
  return new Promise((resolve, reject) => {
    const ws = new WebSocket(RELAY);
    const inbox = [];
    const listeners = [];
    ws.addEventListener('message', (ev) => {
      let m; try { m = JSON.parse(ev.data); } catch { return; }
      inbox.push(m);
      for (const fn of listeners.slice()) fn(m);
    });
    ws.addEventListener('error', reject);
    ws.addEventListener('open', () => resolve({
      ws, inbox,
      send(obj) { ws.send(JSON.stringify(obj)); },
      // Wait for the first message matching a predicate (or a timeout).
      next(pred, ms = 3000) {
        const hit = inbox.find(pred);
        if (hit) return Promise.resolve(hit);
        return new Promise((res) => {
          const t = setTimeout(() => res(null), ms);
          const fn = (m) => {
            if (pred(m)) { clearTimeout(t); listeners.splice(listeners.indexOf(fn), 1); res(m); }
          };
          listeners.push(fn);
        });
      },
      close() { try { ws.close(); } catch { } }
    }));
  });
}

// Mirror WSTransport: announce room+role BEFORE anything else.
async function hello(conn, role, name) {
  conn.send({ t: 'hello', room: ROOM, role, name });
  return conn.next((m) => m.t === 'sid', 4000);
}

const host = await connect();
const hostSid = await hello(host, 'host', 'HostProbe');
ok('host handshake returns a sid', !!hostSid && hostSid.id === 'host', hostSid && hostSid.id);

const guest = await connect();
const guestSid = await hello(guest, 'client', 'GuestProbe');
ok('guest handshake returns a relay id', !!guestSid && /^g[0-9a-f]{6}$/.test(guestSid.id),
  guestSid && guestSid.id);

// The relay must forward the guest's application message to the host.
host.inbox.length = 0;
guest.send({ t: 'msg', to: 'host', m: { t: 'hi', name: 'GuestProbe' } });
const hi = await host.next((m) => m.t === 'msg' && m.m && m.m.t === 'hi', 3000);
ok('guest message reaches the host (relay routed it)',
  !!hi && hi.from === guestSid.id, hi ? 'from=' + hi.from : 'never arrived');

// And the host's broadcast must come back to the guest.
guest.inbox.length = 0;
host.send({ t: 'msg', m: { t: 'w', room: ROOM } });
const wel = await guest.next((m) => m.t === 'msg' && m.m && m.m.t === 'w', 3000);
ok('host broadcast reaches the guest', !!wel && wel.from === 'host',
  wel ? 'from=' + wel.from : 'never arrived');

// A socket that never said hello must NOT be routed (this was the old bug).
const mute = await connect();
host.inbox.length = 0;
mute.send({ t: 'msg', to: 'host', m: { t: 'hi', name: 'Anonymous' } });
const ghost = await host.next((m) => m.t === 'msg' && m.m && m.m.name === 'Anonymous', 700);
ok('an un-announced socket is dropped by the relay', ghost === null,
  ghost ? 'it was routed anyway!' : 'correctly ignored');

mute.close(); guest.close(); host.close();
console.log(failures ? 'FAILING CHECKS: ' + failures : 'RELAY OK');
process.exit(failures ? 1 : 0);
