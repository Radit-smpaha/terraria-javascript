// Real-browser WebSocket multiplayer probe.
//
// The node harness drives multiplayer through an in-process hub, which never
// touches WSTransport or server.js's relay handshake — so a broken relay
// handshake passed every unit test while real cross-machine play was dead.
// This drives the actual page against the actual relay over a real WebSocket.
//
// Usage: node <skill-dir>/browser.mjs http://localhost:8123/terraria.html --script ./qa-ws-mp.mjs
export default async function run(page, ui) {
  // Wait for the game to boot.
  await page.waitForFunction(() => window.game && window.game.mp, null, { timeout: 20000 });

  // Host a room over the WebSocket relay, exactly as the panel's HOST button
  // does, then watch the relay's own handshake replies.
  const hostResult = await page.evaluate(async () => {
    const g = window.game;
    // The panel wires real listeners; call the same entry point the button does.
    const room = 'WST' + Math.floor(Math.random() * 100);
    const res = g.mp.startHost(room, 'ws://localhost:8123/mp', 'HostProbe');
    const wait = (ms) => new Promise((r) => setTimeout(r, ms));

    // Poll the transport's own selfId: the relay rewrites it to 'host' only
    // once its `hello` handshake has been processed.
    let selfId = null;
    let status = null;
    for (let i = 0; i < 40; i++) {
      await wait(100);
      selfId = g.mp.transport && g.mp.transport.selfId;
      status = g.mp.status;
      if (status === 'hosting') break;
    }
    return { ok: res.ok, room, selfId, status, detail: g.mp.statusDetail };
  });

  if (!hostResult.ok) return { error: 'startHost refused', hostResult };

  // Open a SECOND tab of the same app and join that room as a guest over WS.
  const guest = await page.context().newPage();
  await guest.goto('http://localhost:8123/terraria.html');
  await guest.waitForFunction(() => window.game && window.game.mp, null, { timeout: 20000 });

  const guestResult = await guest.evaluate(async (room) => {
    const g = window.game;
    g.mp.startJoin(room, 'ws://localhost:8123/mp', 'GuestProbe', () => { });
    const wait = (ms) => new Promise((r) => setTimeout(r, ms));
    let status = null;
    let peers = 0;
    for (let i = 0; i < 60; i++) {
      await wait(100);
      status = g.mp.status;
      if (status === 'joined') break;
    }
    return { status, detail: g.mp.statusDetail, peers: g.mp.peers.size };
  }, hostResult.room);

  // Give the host a moment to register the arrival, then read its roster.
  await page.waitForTimeout(1200);
  const hostRoster = await page.evaluate(() => ({
    peers: window.game.mp.peers.size,
    status: window.game.mp.status
  }));

  await guest.close();

  const joined = guestResult.status === 'joined';
  return {
    host: hostResult,
    guest: guestResult,
    hostRoster,
    verdict: joined && hostRoster.peers >= 1 ? 'WS MP WORKS' : 'WS MP BROKEN'
  };
}
