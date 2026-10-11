// Locate exactly WHERE the backdrop jumps, by sweeping timeOfDay finely and
// reporting the biggest frame-to-frame change and the time it happened at.
export default async function run(page) {
  await page.waitForTimeout(1500);
  await page.evaluate(() => {
    const s = document.createElement('script');
    s.textContent = `(function(){
      const g = window.game;
      if (!g) { document.title = 'D:no-game'; return; }
      const w = g.world;
      g.titleScreenOpen = false; g.paused = false;

      const sample = () => {
        const cv = w._bgCanvas;
        if (!cv) return null;
        const c = cv.getContext('2d');
        let sum = 0;
        const pts = [[0.1,0.1],[0.5,0.1],[0.9,0.1],[0.25,0.5],[0.75,0.5],[0.5,0.9]];
        for (const [fx, fy] of pts) {
          const d = c.getImageData(Math.floor(cv.width*fx), Math.floor(cv.height*fy), 1, 1).data;
          sum += d[0] + d[1] + d[2];
        }
        return sum;
      };

      const savedTod = w.timeOfDay;
      const steps = 500;
      let prev = null, worst = 0, worstAt = 0, worstPair = null;
      const jumps = [];
      for (let i = 0; i <= steps; i++) {
        const t = i / steps;
        w.timeOfDay = t;
        w._bgCache = null; w._bgFadeStart = 0;
        g.render();
        const sig = sample();
        if (prev !== null && sig !== null) {
          const delta = Math.abs(sig - prev);
          if (delta > worst) { worst = delta; worstAt = t; worstPair = [prev, sig]; }
          if (delta > 40) jumps.push({ t: +t.toFixed(3), d: Math.round(delta) });
        }
        prev = sig;
      }
      w.timeOfDay = savedTod;
      document.title = 'D:' + JSON.stringify({
        worst: Math.round(worst),
        worstAt: +worstAt.toFixed(3),
        jumpsOver40: jumps.length,
        firstJumps: jumps.slice(0, 12)
      });
    })();`;
    document.body.appendChild(s);
  });
  await page.waitForTimeout(5000);
  const title = await page.title();
  const raw = title.startsWith('D:') ? title.slice(2) : null;
  try { return JSON.parse(raw); } catch (e) { return { error: 'no report', title }; }
}
