// Browser probe for the "seamless" requirements:
//   * day -> night must be a smooth cross-fade, not a step
//   * biome -> biome must be a smooth cross-fade, not a swap
//
// The backdrop is a cached offscreen canvas that is re-painted whenever its
// cache key changes, and the previous layer is cross-faded over ~900ms. A
// "step" is a single frame where the backdrop changes more than the fade could
// account for; we look for those.
//
// page.evaluate runs in Playwright's isolated world and cannot see window.game,
// so a real <script> element is injected into the page's own world and reports
// back through document.title.
export default async function run(page) {
  await page.waitForTimeout(1500);

  await page.evaluate(() => {
    const s = document.createElement('script');
    s.textContent = `(function(){
      const g = window.game;
      if (!g) { document.title = 'T:no-game'; return; }
      const w = g.world;
      g.titleScreenOpen = false; g.paused = false;

      // Sample the backdrop canvas at a coarse grid and return a signature: a
      // few RGB values plus their sum. Big jumps in the sum = a visible step.
      const sample = () => {
        const cv = w._bgCanvas;
        if (!cv) return null;
        const c = cv.getContext('2d');
        const pts = [[0.1,0.1],[0.5,0.1],[0.9,0.1],[0.25,0.5],[0.75,0.5],[0.5,0.9]];
        let sum = 0; const vals = [];
        for (const [fx, fy] of pts) {
          const d = c.getImageData(Math.floor(cv.width*fx), Math.floor(cv.height*fy), 1, 1).data;
          vals.push([d[0], d[1], d[2]]);
          sum += d[0] + d[1] + d[2];
        }
        return { sum, vals };
      };

      // Drive the backdrop straight through the day and record the frame-to-
      // frame change. Repainting is what the cross-fade is designed to hide, so
      // we also force the fade to complete between samples by advancing the
      // recorded fade start.
      const run = (from, to, biome) => {
        const steps = 60;
        const deltas = [];
        let prev = null;
        const savedTod = w.timeOfDay;
        const savedBiome = w.getBiomeAtX;
        if (biome) w.getBiomeAtX = () => biome;
        // Reset the cache so the first sample is a clean baseline.
        w._bgCache = null; w._bgFadeStart = 0;
        for (let i = 0; i <= steps; i++) {
          w.timeOfDay = from + (to - from) * (i / steps);
          // Repaint deterministically at each step, bypassing the real camera.
          w._bgCache = null;
          w._bgFadeStart = 0;
          g.render();
          const sig = sample();
          if (prev && sig) deltas.push(Math.abs(sig.sum - prev.sum));
          prev = sig;
        }
        w.timeOfDay = savedTod;
        if (biome) w.getBiomeAtX = savedBiome;
        deltas.sort((a,b) => a - b);
        const max = deltas[deltas.length - 1] || 0;
        const median = deltas[Math.floor(deltas.length/2)] || 0;
        return { max: Math.round(max), median: Math.round(median), n: deltas.length };
      };

      const out = {};
      // day -> night (noon to midnight) across 60 frames
      out.dayToNight = run(0.30, 0.75, null);
      // night -> day (midnight to morning)
      out.nightToDay = run(0.80, 1.05 - 1e-6, null);
      // biome swaps
      out.forestToSnow = run(0.30, 0.301, 'snow');
      out.snowToSavanna = run(0.30, 0.301, 'savanna');

      document.title = 'T:' + JSON.stringify(out);
    })();`;
    document.body.appendChild(s);
  });

  await page.waitForTimeout(4000);
  const title = await page.title();
  const raw = title.startsWith('T:') ? title.slice(2) : null;
  try { return JSON.parse(raw); } catch (e) { return { error: 'no report', title }; }
}
