export default async function run(page, ui) {
  await page.waitForTimeout(2500);

  const viaEval = await page.evaluate(() => ({
    typeofGame: typeof window.game,
    typeofGameCtor: typeof window.Game,
    typeofWeather: typeof window.WeatherSystem,
    typeofItems: typeof window.ITEMS,
    typeofTileSize: typeof window.TILE_SIZE,
    typeofWorld: typeof window.World,
    typeofPlayer: typeof window.Player,
    scripts: Array.from(document.scripts).map(s => s.getAttribute('src')),
    canvases: ['gameCanvas', 'lightingCanvas', 'glowCanvas'].map(id => id + '=' + !!document.getElementById(id))
  }));

  return { viaEval };
}