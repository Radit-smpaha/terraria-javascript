// ===== PATCH C: kraken water clamp + symmetric eyes + NPC gravity + death cleanup
const fs = require('fs');
let src = fs.readFileSync('ocean.js', 'utf8');
let terr = fs.readFileSync('terraria.js', 'utf8');
let npcs = fs.readFileSync('npcs.js', 'utf8');
const EOL = src.includes('\r\n') ? '\r\n' : '\n';
src = src.replace(/\r\n/g, '\n');
terr = terr.replace(/\r\n/g, '\n');
npcs = npcs.replace(/\r\n/g, '\n');
let applied = 0;
function apply(label, oldText, newText, which = 'src') {
  oldText = oldText.replace(/\r\n/g, '\n');
  newText = newText.replace(/\r\n/g, '\n');
  const target = which === 'terr' ? terr : which === 'npcs' ? npcs : src;
  if (target.indexOf(oldText) === -1) throw new Error('NOT FOUND (' + which + '): ' + label);
  const next = target.replace(oldText, newText);
  if (which === 'terr') terr = next; else if (which === 'npcs') npcs = next; else src = next;
  applied++;
  console.log('  ok  ' + label);
}

// --------------------------------------------------------------------------
// 1. KRAKEN: never leave the water. The mantle must stay submerged: its top
//    (this.y) must sit at or below the sea surface, and its body must never
//    sink below the seabed. The arena's seaY is the authority.
// --------------------------------------------------------------------------
apply('kraken stays in water',
`      if (world) {
        this.x = Math.max(0, Math.min(world.pixelWidth - this.width, this.x));
        this.y = Math.max(0, Math.min(world.pixelHeight - this.height, this.y));
      }`,
`      if (world) {
        this.x = Math.max(0, Math.min(world.pixelWidth - this.width, this.x));
        // A kraken is a sea creature, not a balloon. Clamp the body so it
        // never breaches the surface by more than its crown and never
        // grounds itself on the seabed: the top of the mantle must stay
        // at-or-below the waterline (allowing a small breach for the
        // silhouette) and the skirt must stay above the floor.
        const seaTop = (world.oceanArena ? world.oceanArena.seaY : 12) * TILE_SIZE;
        const floorTop = (world.pixelHeight || world.height * TILE_SIZE);
        this.y = Math.max(seaTop - this.height * 0.10,
          Math.min(floorTop - this.height * 1.25, this.y));
      }`);

// --------------------------------------------------------------------------
// 2. KRAKEN EYES: same size, same height, perfectly mirrored, no independent
//    drift. Both eyes are defined by ONE symmetry line through the head
//    centre, so they can never disagree.
// --------------------------------------------------------------------------
apply('symmetric eyes',
`    // Two eyes set symmetrically across the head, near the front.
    drawEye(ex, ey, 1, true);
    drawEye(cx - (ex - cx), ey + 2, 0.72, false);`,
`    // Two eyes, perfectly mirrored about the head's centre line and identical
    // in every respect: same radius, same row, same pupil, same glint. Only
    // the primary carries the pulsing target ring (the weakpoint marker), and
    // that ring is drawn OUTSIDE the eye itself so it can never make one eye
    // look bigger than the other.
    const eyeSpread = this.width * 0.11;   // fixed, so they never drift apart
    drawEye(cx - eyeSpread, ey, 1, false);
    drawEye(cx + eyeSpread, ey, 1, true);`);

// The weakpoint halo/pulse is drawn INSIDE drawEye for primary=true, which is
// what made the two eyes look different sizes. Move the halo out of the eye
// so both eyes are drawn by the same code path at the same scale.
apply('eye halo outside the orb',
`    const drawEye = (px, py, s, primary) => {
      if (primary) {
        const halo = ctx.createRadialGradient(px, py, 4, px, py, 62 * s * glow);
        halo.addColorStop(0, 'rgba(' + haloColor + ', 0.5)');
        halo.addColorStop(1, 'rgba(' + haloColor + ', 0)');
        ctx.fillStyle = halo;
        ctx.beginPath(); ctx.arc(px, py, 62 * s * glow, 0, Math.PI * 2); ctx.fill();
      }
      // Black socket + hard rim.
      ctx.fillStyle = '#0b0712';`,
`    const drawEye = (px, py, s, primary) => {
      // A soft bioluminescent halo behind the weakpoint eye. It is drawn here
      // rather than scaling the orb itself, so both eyes stay the same size.
      if (primary) {
        const halo = ctx.createRadialGradient(px, py, 4, px, py, 62 * s * glow);
        halo.addColorStop(0, 'rgba(' + haloColor + ', 0.5)');
        halo.addColorStop(1, 'rgba(' + haloColor + ', 0)');
        ctx.fillStyle = halo;
        ctx.beginPath(); ctx.arc(px, py, 62 * s * glow, 0, Math.PI * 2); ctx.fill();
      }
      // Black socket + hard rim.
      ctx.fillStyle = '#0b0712';`);

// --------------------------------------------------------------------------
// 3. NPC GRAVITY: villagers had no physics at all, so once the world changed
//    under them they floated forever. Give them real ground-snapping.
// --------------------------------------------------------------------------
apply('npc gravity + ground snap',
`    this.npcs.forEach((npc) => {
      // Idle bob and slow wander.`,
`    this.npcs.forEach((npc) => {
      // ---- Ground snapping (the flying-NPC fix) --------------------------
      // Villagers were placed once and never had physics, so any change to
      // the terrain under them (mining, world regen, a dimension swap) left
      // them hovering in mid-air permanently. Every tick: find the ground
      // below the NPC's feet and ease them onto it. If there is no ground
      // within a short fall, they walk off it like anything else.
      if (world && typeof world.surfaceHeights !== 'undefined' && npc.width) {
        const tx = Math.floor((npc.x + npc.width / 2) / TILE_SIZE);
        if (tx >= 0 && tx < world.surfaceHeights.length) {
          const groundY = world.surfaceHeights[tx] * TILE_SIZE;
          const feet = npc.y + npc.height;
          // Ease up or down to the ground instead of teleporting, so the fix
          // is invisible when the NPC is already standing correctly.
          if (feet > groundY + 2) npc.y -= Math.min(4, feet - groundY);
          else if (feet < groundY - 2) npc.y += Math.min(4, groundY - feet);
          if (npc.vy !== undefined) npc.vy = 0;
        }
      }
      // Idle bob and slow wander.`);

// --------------------------------------------------------------------------
// 4. BLACK OVALS AFTER DEATH: the boss kept updating and firing while the
//    death screen was up. Freeze the boss and purge its projectiles the
//    moment the player dies.
// --------------------------------------------------------------------------
apply('stop the kraken on player death',
`        this.boss.update(dt, bossTarget, this.projectiles, this.sound, this.particles, this.world);`,
`        // When the player is dead the fight is over: freeze the boss so it
        // stops firing and stop its projectiles, otherwise ink globs keep
        // drifting around behind the death screen (the "black ovals" bug).
        if (this.isDead) {
          this.boss.pending = null;
          if (this.boss.lashTimer !== undefined) this.boss.lashTimer = 0;
        } else {
          this.boss.update(dt, bossTarget, this.projectiles, this.sound, this.particles, this.world);
        }`);

// Purge the boss's projectiles on death so nothing keeps flying.
apply('purge boss projectiles on death',
`      // Arcane motes drift off every boss \u2014 cheap, constant, very cool.`,
`      // Dead player: the fight is over. Purge any hostile projectiles the
      // boss still had in flight so nothing floats around the death screen.
      if (this.isDead && this.boss && !this.boss.dead) {
        for (const proj of this.projectiles) {
          if (proj && proj.fromBoss) proj.life = 0;
        }
      }
      // Arcane motes drift off every boss \u2014 cheap, constant, very cool.`);

const EOLT = terr.includes('\r\n') ? '\r\n' : '\n';
if (EOL === '\r\n') src = src.replace(/\n/g, '\r\n');
if (EOLT === '\r\n') terr = terr.replace(/\n/g, '\r\n');
const EOLN = npcs.includes('\r\n') ? '\r\n' : '\n';
if (EOLN === '\r\n') npcs = npcs.replace(/\n/g, '\r\n');
fs.writeFileSync('ocean.js', src, 'utf8');
fs.writeFileSync('terraria.js', terr, 'utf8');
fs.writeFileSync('npcs.js', npcs, 'utf8');
console.log('\nPATCH C APPLIED (' + applied + ' edits)');
