// Measures real frame cost in the browser: how long update+render take per
// frame, and how many gradient objects the old code would have built.
export default async function run(page, ui) {
  await page.setViewportSize({ width: 1280, height: 720 });
  let ready = false;
  for (let i = 0; i < 40; i++) {
    ready = await page.locator('#gameCanvas').isVisible().catch(() => false);
    if (ready) break;
    await page.waitForTimeout(500);
  }
  if (!ready) return { error: 'canvas never appeared' };
  await page.waitForTimeout(1500);

  // Instrument createRadialGradient and count calls over a fixed window, then
  // time the raf loop over the same window.
  const measured = await page.evaluate(async () => {
    const proto = CanvasRenderingContext2D.prototype;
    const orig = proto.createRadialGradient;
    let gradCalls = 0;
    let arcs = 0;
    const origArc = proto.arc;
    proto.createRadialGradient = function (...args) { gradCalls++; return orig.apply(this, args); };
    proto.arc = function (...args) { arcs++; return origArc.apply(this, args); };

    const frames = [];
    let last = performance.now();
    let stop = false;
    const tick = (now) => {
      frames.push(now - last);
      last = now;
      if (!stop) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);

    await new Promise(r => setTimeout(r, 4000));
    stop = true;
    proto.createRadialGradient = orig;
    proto.arc = origArc;

    // Drop the first few frames (warm-up).
    const sample = frames.slice(5).sort((a, b) => a - b);
    const median = sample[Math.floor(sample.length / 2)] || 0;
    const p95 = sample[Math.floor(sample.length * 0.95)] || 0;
    return {
      frames: sample.length,
      medianMs: +median.toFixed(2),
      p95Ms: +p95.toFixed(2),
      worstMs: +(sample[sample.length - 1] || 0).toFixed(2),
      gradCallsPerFrame: +(gradCalls / Math.max(1, sample.length)).toFixed(1),
      arcCallsPerFrame: +(arcs / Math.max(1, sample.length)).toFixed(1),
    };
  });

  // Now a heavy scene: many monsters + projectiles + particles at once, which is
  // the case the caches are meant to protect.
  const stress = await page.evaluate(async () => {
    const g = window.game;
    if (!g) return { error: 'no game handle' };
    const P = window.Projectile, M = window.Monster;
    // Fan out projectiles and monsters around the player.
    for (let i = 0; i < 60; i++) {
      const a = (i / 60) * Math.PI * 2;
      g.projectiles.push(new P(
        g.player.x + Math.cos(a) * 120, g.player.y + Math.sin(a) * 120,
        Math.cos(a) * 3, Math.sin(a) * 3,
        i % 3 === 0 ? 'knight_blade' : (i % 3 === 1 ? 'magic_bolt' : 'arrow'),
        10, false, 8, 70
      ));
    }
    for (let i = 0; i < 30; i++) {
      try {
        g.monsters.push(new M(g.player.x + (Math.random() - 0.5) * 400,
          g.player.y - 40, 'slime'));
      } catch (e) { /* monster type may differ */ }
    }
    for (let i = 0; i < 400; i++) {
      g.particles.addParticle(
        g.player.x + (Math.random() - 0.5) * 500, g.player.y + (Math.random() - 0.5) * 400,
        (Math.random() - 0.5) * 3, (Math.random() - 0.5) * 3,
        '#a5b4fc', 3, 8, 0.02, true
      );
    }
    const proto = CanvasRenderingContext2D.prototype;
    const orig = proto.createRadialGradient;
    let gradCalls = 0;
    proto.createRadialGradient = function (...args) { gradCalls++; return orig.apply(this, args); };

    const frames = [];
    let last = performance.now();
    let stop = false;
    const tick = (now) => { frames.push(now - last); last = now; if (!stop) requestAnimationFrame(tick); };
    requestAnimationFrame(tick);
    await new Promise(r => setTimeout(r, 4000));
    stop = true;
    proto.createRadialGradient = orig;

    const sample = frames.slice(5).sort((a, b) => a - b);
    const median = sample[Math.floor(sample.length / 2)] || 0;
    const p95 = sample[Math.floor(sample.length * 0.95)] || 0;
    return {
      frames: sample.length,
      medianMs: +median.toFixed(2),
      p95Ms: +p95.toFixed(2),
      worstMs: +(sample[sample.length - 1] || 0).toFixed(2),
      gradCallsPerFrame: +(gradCalls / Math.max(1, sample.length)).toFixed(1),
      projectiles: g.projectiles.length,
      monsters: g.monsters.length,
      particles: g.particles.particles.length,
      lightCache: g.world._lightSpriteCache?.size ?? null,
      glowCache: g.world._glowSpriteCache?.size ?? null,
    };
  });

  await page.screenshot({ path: 'perf-scene.png' });
  return { measured, stress };
}