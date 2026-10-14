// Draw the Megalodon on a clean staged canvas (no camera/UI noise), pin it
// to the DOM, and screenshot that element per phase.
export default async function run(page) {
  const drive = (body) => page.waitForFunction(
    new Function('return (function(){' + body + '})()'), null, { timeout: 25000 });

  await drive(`
    const g = window.game;
    if (g.titleScreenOpen) {
      const b = document.getElementById('title-singleplayer');
      if (b) b.click();
      g.titleScreenOpen = false; g.paused = false;
      const s = document.getElementById('title-screen'); if (s) s.classList.add('hidden');
    }
    return !!g.world;
  `);
  await page.waitForTimeout(700);
  await drive(`
    const g = window.game;
    if (g.world.dimension !== 'ocean') g.creativeTeleportTo('ocean');
    const holder = document.createElement('div');
    holder.id = '__boss_stage';
    holder.style.cssText = 'position:fixed;left:0;top:0;z-index:99999;background:#04121f;';
    const cv = document.createElement('canvas');
    cv.id = '__boss_canvas';
    cv.width = 1200; cv.height = 620;
    holder.appendChild(cv);
    document.body.appendChild(holder);
    return !!g.boss;
  `);
  await page.waitForTimeout(400);

  const out = [];
  for (const phase of [1, 2, 3]) {
    await drive(`
      const p = ${phase};
      const g = window.game; const boss = g.boss; if (!boss) return false;
      boss.phase = p;
      boss.maxHp = 180000;
      boss.hp = Math.round(180000 * (p === 1 ? 0.9 : p === 2 ? 0.5 : 0.15));
      boss.jawOpen = 0.85; boss.jawTarget = 1; boss.dash = null; boss.pending = null;
      boss.swimPhase = 2.2; boss.tailSwing = 24; boss.finKick = 0.25;
      boss.gillFlare = 0.8; boss.vy = 40; boss.lean = 0.04;
      boss.roll = 0; boss.yaw = 0.08; boss.squash = 0; boss.recoil = 0; boss.lunge = 0;
      boss.breath = 1; boss.sway = 0; boss.bob = 0; boss.pitch = 0;
      boss.skillGlow = 0.4; boss.hitFlash = 0; boss.phaseFlash = 0; boss.vanishT = 0;
      boss.exhaustT = 0; boss.tornadoT = 0;
      const cv = document.getElementById('__boss_canvas');
      const cx = cv.getContext('2d');
      const CW = cv.width, CH = cv.height;
      const bg = cx.createLinearGradient(0, 0, 0, CH);
      bg.addColorStop(0, '#0b3a55'); bg.addColorStop(1, '#020a14');
      cx.fillStyle = bg; cx.fillRect(0, 0, CW, CH);
      const cam = { x: boss.x + boss.width / 2 - CW / 2, y: boss.y + boss.height / 2 - CH / 2 };
      boss.render(cx, cam);
      return true;
    `);
    await page.waitForTimeout(300);
    const el = await page.$('#__boss_stage');
    const path = 'mega-portrait-' + phase + '.png';
    await el.screenshot({ path });
    out.push({ phase, path });
  }
  return { out };
}
