// Digs into the Streamlit app frame (/~/+/) to find the game's iframe: its
// size, sandbox, and whether the canvas inside it is rendering.
export default async function run(page) {
  await page.waitForLoadState('load').catch(() => {});
  await page.waitForTimeout(15000);
  const out = { frames: [], gameFrameEval: null };
  for (const f of page.frames()) {
    out.frames.push(f.url().slice(0, 90));
  }
  const appFrame = page.frames().find(f => f.url().includes('/~/+/'));
  if (!appFrame) return { ...out, error: 'no /~/+/ frame' };
  try {
    out.gameFrameEval = await appFrame.evaluate(() => {
      const iframes = Array.from(document.querySelectorAll('iframe')).map(f => ({
        src: (f.src || '').slice(0, 60) || '(srcdoc/inline)',
        srcdoc: f.srcdoc ? f.srcdoc.length + ' chars' : null,
        w: f.offsetWidth, h: f.offsetHeight,
        sandbox: f.getAttribute('sandbox'),
        style: (f.getAttribute('style') || '').slice(0, 120)
      }));
      const fullscreenEl = document.fullscreenElement;
      return {
        iframes,
        fullscreen: fullscreenEl ? (fullscreenEl.tagName + '.' + fullscreenEl.className).slice(0, 80) : null,
        pointerLock: !!document.pointerLockElement,
        viewport: { w: innerWidth, h: innerHeight }
      };
    });
  } catch (e) {
    out.gameFrameEval = { err: e.message.slice(0, 200) };
  }
  // The game itself lives in a nested srcdoc frame — check frame tree again.
  const nested = page.frames().filter(f => f.url() === 'about:srcdoc' || /srcdoc/.test(f.url()));
  out.nestedFrames = nested.length;
  if (nested.length) {
    try {
      out.game = await nested[0].evaluate(() => {
        const c = document.getElementById('gameCanvas');
        if (!c) return { hasCanvas: false };
        const g = c.getContext('2d');
        const d = g.getImageData(Math.floor(c.width / 2), Math.floor(c.height / 2), 1, 1).data;
        const box = c.getBoundingClientRect();
        return {
          hasCanvas: true, size: { w: c.width, h: c.height },
          box: { x: box.x, y: box.y, w: box.width, h: box.height },
          centerPixel: Array.from(d),
          overlay: (document.getElementById('boot-error') || {}).textContent?.slice(0, 150) || ''
        };
      });
    } catch (e) {
      out.game = { err: e.message.slice(0, 200) };
    }
  }
  return out;
}