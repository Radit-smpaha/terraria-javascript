// Enter a world and freeze the frame so the overworld background can be seen.
export default async function run(page) {
  await page.waitForTimeout(1200);
  await page.evaluate(() => {
    const s = document.createElement('script');
    s.textContent = `(function(){
      const g = window.game;
      if (!g) { document.title = 'W:nogame'; return; }
      // Answer the platform question and walk into the world.
      document.getElementById('title-platform-pc')?.click();
      g.titleScreenOpen = false;
      g.paused = false;
      const hs = document.getElementById('title-screen');
      if (hs) hs.classList.add('hidden');
      // Bright midday so the backdrop is fully lit.
      g.world.timeOfDay = 0.28;
      // Nudge the player up the beach so there is sky to look at.
      document.title = 'W:ok';
    })();`;
    document.body.appendChild(s);
  });
  await page.waitForTimeout(900);
  return { title: await page.title() };
}
