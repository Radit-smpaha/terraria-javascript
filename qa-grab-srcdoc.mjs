// Pulls the deployed app's actual iframe srcdoc and saves it so we can diff
// the inlined entities.js against the local file and find the corruption.
import fs from 'fs';
export default async function run(page) {
  await page.waitForLoadState('load').catch(() => {});
  await page.waitForTimeout(15000);
  const appFrame = page.frames().find(f => f.url().includes('/~/+/'));
  if (!appFrame) return { error: 'no /~/+/ frame' };
  // Poll: the app re-renders and the iframe may appear late.
  let srcdoc = null;
  for (let i = 0; i < 30 && !srcdoc; i++) {
    await page.waitForTimeout(2000);
    const appFrame2 = page.frames().find(f => f.url().includes('/~/+/'));
    if (!appFrame2) continue;
    srcdoc = await appFrame2.evaluate(() => {
      const f = Array.from(document.querySelectorAll('iframe'))
        .find(f => f.srcdoc && f.srcdoc.length > 1000);
      return f ? f.srcdoc : null;
    }).catch(() => null);
  }
  if (!srcdoc) return { error: 'no srcdoc after polling' };
  if (!srcdoc) return { error: 'no srcdoc' };
  fs.writeFileSync('qa-deployed-srcdoc.html', srcdoc);
  // Report the per-class probe lines the page itself logged.
  return { saved: srcdoc.length + ' chars -> qa-deployed-srcdoc.html' };
}