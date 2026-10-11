// Measure how much the BACKDROP changes as the camera crosses biome borders,
// and across the day/night cycle.
//
// Playwright's page.evaluate runs in an isolated world that cannot see
// window.game, so everything is done from a real <script> injected into the
// page's own world, reporting back through document.title.
export default async function run(page) {
  await page.waitForTimeout(2500);

  await page.evaluate(() => {
    const s = document.createElement('script');
    s.textContent = `(function(){
      try {
        const g = window.game;
        if (!g || !g.world) { document.title = 'B:no-game'; return; }
        const w = g.world;
        g.titleScreenOpen = false; g.paused = false;

        const sample = () => {
          const cv = w._bgCanvas;
          if (!cv || !cv.width) return null;
          const c = cv.getContext('2d');
          let sum = 0;
          const pts = [[0.1,0.6],[0.3,0.6],[0.5,0.6],[0.7,0.6],[0.9,0.6],[0.5,0.75]];
          for (const [fx, fy] of pts) {
            const d = c.getImageData(Math.floor(cv.width*fx), Math.floor(cv.height*fy), 1, 1).data;
            sum += d[0] + d[1] + d[2];
          }
          return sum;
        };

        const savedCamX = g.camera.x;
        const savedTod = w.timeOfDay;
        w.timeOfDay = 0.30;
        w._bgCache = null; w._bgFadeStart = 0;
        g.render();
        const t0 = performance.now();
        for (let i = 0; i < 7; i++) { w._bgCache = null; w._bgFadeStart = 0; g.render(); }
        const msPerForced = +((performance.now() - t0) / 7).toFixed(2);

        const steps = 200;
        let prev = null, worst = 0, worstAt = 0;
        const jumps = [];
        for (let i = 0; i <= steps; i++) {
          g.camera.x = Math.round(w.pixelWidth * (i / steps));
          w._bgCache = null; w._bgFadeStart = 0;
          g.render();
          const sig = sample();
          if (prev !== null && sig !== null) {
            const d = Math.abs(sig - prev);
            if (d > worst) { worst = d; worstAt = Math.round(w.pixelWidth * (i/steps)); }
            if (d > 60) jumps.push({ camX: Math.round(w.pixelWidth * (i/steps)), d: Math.round(d) });
          }
          prev = sig;
        }

        g.camera.x = savedCamX;
        w.timeOfDay = savedTod;
        document.title = 'B:' + JSON.stringify({
          forcedRenderMs: msPerForced,
          worstJump: Math.round(worst),
          worstJumpAtPixel: worstAt,
          jumpsOver60: jumps.length,
          sample: jumps.slice(0, 8)
        });
      } catch (err) {
        document.title = 'B:ERR:' + (err && err.stack ? err.stack.split('\\n').slice(0,3).join(' | ') : err && err.message);
      }
    })();`;
    document.body.appendChild(s);
  });

  for (let i = 0; i < 60; i++) {
    await page.waitForTimeout(500);
    const t = await page.title();
    if (t.startsWith('B:')) {
      const raw = t.slice(2);
      try { return JSON.parse(raw); } catch (e) { return { raw }; }
    }
  }
  return { error: 'probe timed out' };
}
