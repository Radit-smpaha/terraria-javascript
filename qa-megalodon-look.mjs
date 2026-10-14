// Look at the new Megalodon in all three phases, from a safe distance.
export default async function run(page) {
  const drive = (body) => page.waitForFunction(
    new Function('return (function(){' + body + '})()'), null, { timeout: 20000 });

  await drive(`
    const g = window.game;
    if (!g || !g.world) return false;
    if (g.titleScreenOpen) {
      const b = document.getElementById('title-singleplayer');
      if (b) b.click();
      g.titleScreenOpen = false; g.paused = false;
      const s = document.getElementById('title-screen'); if (s) s.classList.add('hidden');
    }
    return true;
  `);
  await page.waitForTimeout(800);

  await drive(`
    const g = window.game;
    if (g.world.dimension !== 'ocean') g.creativeTeleportTo('ocean');
    if (!g.boss) return false;
    if (g.player.invuln !== undefined) g.player.invuln = 9999;
    if (typeof g.setCreativeGodMode === 'function') g.setCreativeGodMode(true);
    return true;
  `);
  await page.waitForTimeout(400);

  const shots = [];
  for (const phase of [1, 2, 3]) {
    await drive(`
      const g = window.game; const boss = g.boss; if (!boss) return false;
      const arena = g.world.oceanArena;
      boss.phase = ${phase};
      boss.maxHp = 180000;
      boss.hp = Math.round(180000 * (${phase} === 1 ? 0.9 : ${phase} === 2 ? 0.5 : 0.15));
      boss.jawOpen = 0.8; boss.jawTarget = 1; boss.skillGlow = 0.8;
      boss.swimPhase = 2.4; boss.tailSwing = 26; boss.finKick = 0.25;
      boss.gillFlare = 0.8; boss.vx = 300; boss.vy = 60; boss.dash = null;
      boss.x = arena.arenaCX; boss.y = arena.arenaCY - boss.height / 2;
      g.player.x = arena.arenaCX + 420;
      g.player.y = arena.arenaCY + 40;
      g.player.invuln = 9999;
      g.camera.x = Math.max(0, arena.arenaCX + 40 - g.camera.viewportWidth / 2);
      g.camera.y = Math.max(0, arena.arenaCY - g.camera.viewportHeight / 2);
      return true;
    `);
    await page.waitForTimeout(450);
    const path = 'megalodon-phase' + phase + '.png';
    await page.screenshot({ path });
    const alive = await page.evaluate(() => ({
      hp: window.game && window.game.player ? window.game.player.hp : null,
      isDead: !!(window.game && window.game.isDead),
      bossName: window.game && window.game.boss ? window.game.boss.name : null
    }));
    shots.push({ phase, path, ...alive });
  }

  return { shots };
}
