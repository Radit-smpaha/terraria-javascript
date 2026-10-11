// Watches the game's own boot overlay across several page loads, without
// referencing any game global from the test side (a `typeof SomeClass` in the
// test would itself throw a ReferenceError and abort the run before the page's
// own diagnostics could be read).
export default async function run(page) {
  const out = [];
  for (let i = 0; i < 3; i++) {
    await page.goto('http://localhost:8000/terraria.html');
    await page.waitForLoadState('load').catch(() => {});
    await page.waitForTimeout(5000);
    out.push(await page.evaluate(() => {
      const el = document.getElementById('boot-error');
      const c = document.getElementById('gameCanvas');
      const g = c.getContext('2d');
      return {
        overlayHidden: el ? el.classList.contains('hidden') : 'no-el',
        overlayText: el ? el.textContent.slice(0, 400) : '',
        log: (window.__terraLoadLog || []).join(' | '),
        hasNote: typeof window.__terraNoteScript,
        cssW: c.style.width, cssH: c.style.height, attrW: c.width, attrH: c.height,
        box: JSON.stringify(c.getBoundingClientRect()),
        center: JSON.stringify(Array.from(g.getImageData(Math.floor(c.width / 2) - 5, Math.floor(c.height / 2) - 5, 10, 10).data).slice(0, 40)),
        corner: JSON.stringify(Array.from(g.getImageData(5, 5, 5, 5).data).slice(0, 40)),
        glb: document.body.style.background || '(unset)',
        htmlBg: getComputedStyle(document.documentElement).background.slice(0, 60),
        canvasBg: getComputedStyle(c).background.slice(0, 60)
      };
    }));
  }
  return out;
}