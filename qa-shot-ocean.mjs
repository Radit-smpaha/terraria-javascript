export default async function run(page, ui) {
  const log = [];
  await page.waitForTimeout(1500);
  const clickRe = async (re, label, wait = 1400) => {
    const snap = await ui.snapshot();
    const m = snap.match(re);
    if (!m) { log.push('MISS ' + label); return false; }
    await ui.click('@' + m[1]); await page.waitForTimeout(wait);
    log.push('click ' + label); return true;
  };
  await clickRe(/@(e\d+) button "[^"]*PC \/ Laptop[^"]*"/i, 'pc');
  await clickRe(/@(e\d+) button "Singleplayer"/i, 'singleplayer');
  await clickRe(/@(e\d+) button "1 World 1[^"]*CREATE"/i, 'world1');
  await page.waitForTimeout(6000);
  await clickRe(/@(e\d+) button "[^"]*CREATIVE[^"]*"/i, 'creative', 1200);
  let snap = await ui.snapshot();
  const sm = snap.match(/@(e\d+) select "TELEPORT TO"/i);
  const gm = snap.match(/@(e\d+) button "GO"/i);
  if (sm) { const sel = ui.ref('@' + sm[1]); const o = await sel.locator('option').allTextContents();
    const oc = o.find(x => /abyssal/i.test(x)); if (oc) await sel.selectOption({ label: oc }); }
  await page.waitForTimeout(400);
  if (gm) await ui.click('@' + gm[1]);
  await page.waitForTimeout(2000);
  snap = await ui.snapshot();
  const xm = snap.match(/@(e\d+) button "\u00d7"/i);
  if (xm) await ui.click('@' + xm[1]);
  await page.waitForTimeout(2500);
  log.push('done');
  return { log };
}
