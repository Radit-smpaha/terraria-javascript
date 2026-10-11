export default async function run(page, ui) {
  await page.waitForTimeout(2000);

  const boot = await page.evaluate(() => {
    const g = window.game;
    if (!g) return { error: 'no game instance' };
    return {
      renderScale: g.renderScale,
      pixelCanvas: g.pixelCanvas.width + 'x' + g.pixelCanvas.height,
      glowCanvas: g.glowCanvas ? g.glowCanvas.width + 'x' + g.glowCanvas.height : 'MISSING',
      camera: g.camera.viewportWidth + 'x' + g.camera.viewportHeight,
      weatherExists: !!g.weather
    };
  });

  // Force each weather type and confirm the render path does not throw
  const results = {};
  const types = ['RAIN', 'STORM', 'SNOW', 'SAND', 'FOG'];
  for (const t of types) {
    await page.evaluate((type) => {
      const g = window.game;
      const W = window.WEATHER_TYPES;
      g.weather.setWeather(W[type], 30, type, g);
      g.weather.intensity = 1;
      g.weather.targetIntensity = 1;
    }, t);
    await page.waitForTimeout(800);
    results[t] = await page.evaluate(() => ({
      type: window.game.weather.type,
      intensity: +window.game.weather.intensity.toFixed(2),
      particles: window.game.weather.particles.length,
      label: window.game.weather.label,
      badge: document.getElementById('weather-badge').textContent
    }));
  }

  // Force the lightning path directly (deterministic, no waiting on RNG)
  await page.evaluate(() => {
    const g = window.game;
    g.weather.type = window.WEATHER_TYPES.STORM;
    g.weather.intensity = 1;
    g.weather.targetIntensity = 1;
    g.weather.lightningCooldown = 0;
  });
  await page.waitForTimeout(1500);

  const afterLightning = await page.evaluate(() => {
    const g = window.game;
    return {
      flash: +g.weather.lightningFlash.toFixed(2),
      bolt: !!g.weather.bolt,
      playerHp: Math.round(g.player.hp),
      splashes: (g.weather._splashes || []).length
    };
  });

  return { boot, results, afterLightning };
}