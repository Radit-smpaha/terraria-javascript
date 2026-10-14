// Dump the Megalodon's computed geometry so the tail/maw anchors can be checked.
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
  await page.waitForTimeout(600);
  await drive(`
    const g = window.game;
    if (g.world.dimension !== 'ocean') g.creativeTeleportTo('ocean');
    return !!g.boss;
  `);
  await page.waitForTimeout(300);

  const dump = await page.waitForFunction(new Function(`
    return (function(){
      const g = window.game, b = g.boss;
      if (!b) return false;
      b.phase = 1; b.swimPhase = 2.2; b.tailSwing = 24; b.tailBend = b.tailBend || 0;
      b.jawOpen = 0.85; b.dash = null; b.pitch = 0; b.sway = 0; b.bob = 0;
      const HW = b.width * 0.5, HH = b.height * 0.5;
      const waveAmp = 0.10 + Math.min(0.16, Math.abs(b.tailSwing||0) * 0.006);
      const wavePhase = b.swimPhase * 0.85;
      const spineBend = (u) => {
        const tailGain = Math.pow(1 - u, 1.7);
        return Math.sin(wavePhase - u*2.7)*waveAmp*tailGain + (b.tailBend||0)*tailGain*1.6;
      };
      const bodyHalf = (u) => {
        const t = u;
        // Must mirror Megalodon._bodyHalfAt: peak girth just behind the head,
        // deep blunt snout, thin caudal stalk.
        const g = t < 0.60
          ? (0.56 + 0.44 * Math.sin((t / 0.60) * Math.PI * 0.5))
          : (1.0 - 0.34 * Math.pow((t - 0.60) / 0.40, 1.4));
        const prof = 0.09 + 0.94 * Math.pow(g, 0.55);
        const noseTaper = t > 0.80
          ? Math.max(0.30, Math.sqrt(1 - Math.pow((t - 0.80) / 0.20, 1.35)))
          : 1;
        const peduncle = t < 0.15 ? Math.max(0.34, t / 0.15) : 1;
        return HH * prof * noseTaper * peduncle;
      };
      const at = (u, off=0) => {
        const sx = -HW + u*b.width;
        const half = bodyHalf(u);
        const reach = off < 0 ? off*half : off*half*0.82;
        return { x: sx, y: spineBend(u)*(1-u)*5 + reach };
      };
      const el = document.getElementById('__probe_out') || (() => {
        const e = document.createElement('pre'); e.id='__probe_out';
        e.style.display='none'; document.body.appendChild(e); return e; })();
      el.textContent = JSON.stringify({
        HW, HH,
        spineTail_0: at(0.0), spine_0_06: at(0.06), spineNose: at(1.0),
        backNose: at(1.0,-1), bellyNose: at(1.0,1),
        snoutTop: at(0.995,-0.6), snoutBot: at(0.995,0.92),
        tailBend: b.tailBend, tailSwing: b.tailSwing
      });
      return true;
    })();
  `), null, { timeout: 10000 });
  await dump.jsonValue();
  return await page.evaluate(() => JSON.parse(document.getElementById('__probe_out').textContent));
}
