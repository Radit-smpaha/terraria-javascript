// ============================================================================
// splice-mega-v2.js â€” install the reworked Megalodon into ocean.js:
//   1. replace the render() method (from its doc comment to its closing brace)
//      with tools/mega-render-v2.js
//   2. insert the model utilities (tools/mega-helpers-v2.js) right after it
//   3. swap the jaw lerp for a spring with overshoot
//   4. replace the animation-rig block with the extended one
//   5. add the new rig fields to the constructor
//   6. mirror the whole class back into new-megalodon.js (splice source)
// Brace matching is structural, so the anchors are text-only and drift-proof.
// ============================================================================
'use strict';
const fs = require('fs');

const read = (f) => fs.readFileSync(f, 'utf8');
const renderV2 = read('tools/mega-render-v2.js').replace(/\s+$/, '');
const helpersV2 = read('tools/mega-helpers-v2.js').replace(/^\s+/, '').replace(/\s+$/, '');
const raw = read('ocean.js');
const EOL = raw.includes('\r\n') ? '\r\n' : '\n';
let src = raw.replace(/\r\n/g, '\n');
const lines = src.split(/\r?\n/);

// ---- 1. locate the render method (the one inside class Megalodon) ---------
const clsAt = lines.findIndex(l => l.startsWith('class Megalodon {'));
if (clsAt < 0) throw new Error('class Megalodon { not found');
const methodAt = lines.findIndex((l, i) => i > clsAt && l === '  render(ctx, camera) {');
if (methodAt < 0) throw new Error('render(ctx, camera) { not found');
    let docStart = methodAt;
    while (docStart > 0 && !/^\s*\/\*\*/.test(lines[docStart])) docStart--;
    if (!/^\s*\/\*\*/.test(lines[docStart])) throw new Error('render doc comment not found');
// brace-match to the method's closing '  }'
let depth = 0, methodEnd = -1;
for (let i = methodAt; i < lines.length; i++) {
  for (const ch of lines[i]) {
    if (ch === '{') depth++;
    else if (ch === '}') {
      depth--;
      if (depth === 0) { methodEnd = i; break; }
    }
  }
  if (methodEnd >= 0) break;
}
if (methodEnd < 0) throw new Error('render closing brace not found');

// ---- 2. swap in the new render + helpers ----------------------------------
console.log('DEBUG helpersV2 len=' + helpersV2.length + ' hasNL=' + helpersV2.includes('\n'));
const before = lines.slice(0, docStart);
const after = lines.slice(methodEnd + 1);
const block = renderV2.split('\n').concat([''], helpersV2.split('\n'));
src = before.concat(block, after).join('\n');
console.log('DEBUG block last=' + JSON.stringify(block[block.length - 1]) +
  ' hasHash01=' + block.some(l => l === '  _hash01(n) {') +
  ' srcHasHash01=' + src.includes('  _hash01(n) {'));
console.log('render() replaced: ocean.js lines ' + (docStart + 1) + '..' + (methodEnd + 1) +
  ' -> ' + block.length + ' lines');

// ---- 3. jaw spring ---------------------------------------------------------
const jawOld = `    // Jaws ease toward their target gape.
    this.jawOpen += (this.jawTarget - this.jawOpen) * Math.min(1, dt * 7);`;
const jawNew = `    // Jaws: a spring, not a lerp â€” a bite SNAPS and a snarl settles with
    // a touch of overshoot, which is what sells the weight of the head.
    this.jawV = (this.jawV || 0) + ((this.jawTarget - this.jawOpen) * 120 - this.jawV * 13) * dt;
    this.jawOpen = Math.max(0, Math.min(1.05, (this.jawOpen || 0) + this.jawV * dt));`;
if (!src.includes(jawOld)) throw new Error('jaw lerp anchor not found');
src = src.replace(jawOld, jawNew);

// ---- 4. animation rig ------------------------------------------------------
const rigStart = src.indexOf('    // ---- Animation rig: additive channels the render integrates -----------');
const rigEndAnchor = '    if (this.wakeT > 0) this.wakeT -= dt;';
const rigEnd = src.indexOf(rigEndAnchor, rigStart);
if (rigStart < 0 || rigEnd < 0) throw new Error('rig block anchors not found');
const rigTail = src.slice(rigEnd + rigEndAnchor.length);
const rigNew = `    // ---- Animation rig: additive channels the render integrates -----------
    // Spine flexion (radians of bend travelling down the tail) â€” the visible
    // swim cycle. Charges straighten the spine; a spin coils it hard.
    const dashingNow = !!this.dash;
    const bendTarget = dashingNow ? 0.05
      : this.tornadoT > 0 ? 0.42 * Math.sin(this.swimPhase * 6)
        : Math.sin(this.swimPhase * 0.9) * (0.12 + Math.min(0.14, speedNow / 4200));
    this.tailBend += (bendTarget - this.tailBend) * Math.min(1, dt * 6);
    // Pectoral kick: a periodic flap impulse, snapping hard on a charge.
    this.finKick += dt * (2.2 + Math.min(2.4, speedNow / 260) + (dashingNow ? 3 : 0));
    if (this.finKick > 1) this.finKick -= 1;
    // Gill flare widens with breath, speed and any big skill wind-up.
    const gillTarget = (this.breath || 1) * 0.5 + Math.min(1, speedNow / 900) * 0.5
      + (this.jawOpen > 0.5 ? 0.35 : 0) + (this.surge || 0) * 0.3;
    this.gillFlare += (gillTarget - this.gillFlare) * Math.min(1, dt * 5);
    // A slow blink on its own clock; a hit or a phase step slams it shut.
    this.blinkCd -= dt;
    if (this.blinkCd <= 0) { this.blink = 1; this.blinkCd = 2.4 + Math.random() * 3.6; }
    if (this.hitFlash > 0.15 || this.phaseFlash > 1.2) this.blink = Math.max(this.blink, 0.7);
    this.blink = Math.max(0, this.blink - dt * 6);
    // Roll/yaw cheat: banking into a turn and pitching into a dive give the
    // flat side-view a sense of swimming through a volume, not a plane.
    const rollTarget = ((this.vy || 0) / 1400) * 0.5 + (this.tornadoT > 0 ? 0.9 : 0);
    this.roll += (rollTarget - this.roll) * Math.min(1, dt * 3);
    const yawTarget = ((this.vx || 0) / 1600) * 0.5;
    this.yaw += (yawTarget - this.yaw) * Math.min(1, dt * 3);
    // Droop: exhaustion sags every fin and half-lids the eye, and recovers
    // slowly enough that the post-hunt damage window reads as a spent beast.
    const droopTarget = this.exhaustT > 0 ? 1 : this.vanishT > 0 ? 0.5 : 0;
    this.droop += (droopTarget - this.droop) * Math.min(1, dt * 2.2);
    // CHARGE TRAIL: spine snapshots whenever it moves fast enough to smear.
    // The ghosts re-run the same spine sampler with the phase they were
    // caught at, so an afterimage is the animal a frame ago, not a rectangle.
    this._trailT = (this._trailT || 0) - dt;
    if ((speedNow > 620 || dashingNow) && this._trailT <= 0) {
      this._trailT = 0.045;
      if (!this.trail) this.trail = [];
      this.trail.push({
        x: this.x, y: this.y, sway: this.sway || 0, bob: this.bob || 0,
        faceDir: this.faceDir || 1, age: 0, st: this._spineState()
      });
      if (this.trail.length > 6) this.trail.shift();
    }
    for (let i = this.trail.length - 1; i >= 0; i--) {
      this.trail[i].age += dt;
      if (this.trail[i].age > 0.3) this.trail.splice(i, 1);
    }
    // Wake turbulence: emit a trail of bubbles off the caudal fin while moving.
    if (particles && speedNow > 240 && (this.wakeT || 0) <= 0) {
      this.wakeT = 0.05;
      const tailPx = this.x + this.width * 0.5 - this.faceDir * this.width * 0.46;
      particles.addParticle(tailPx + (Math.random() - 0.5) * 26,
        this.y + this.height * 0.5 + (Math.random() - 0.5) * 34,
        -this.vx * 0.04 + (Math.random() - 0.5) * 2, -1 - Math.random() * 1.5,
        'rgba(186, 230, 253, 0.4)', 2 + Math.random() * 2, 0.9, -0.02, true);
    }
    if (this.wakeT > 0) this.wakeT -= dt;`;
src = src.slice(0, rigStart) + rigNew + rigTail;
console.log('animation rig replaced');

// ---- 5. constructor fields -------------------------------------------------
const ctorOld = `    this.wakeT = 0;`;
const ctorNew = `    this.wakeT = 0;
    this.trail = [];          // charge afterimages: spine snapshots
    this.droop = 0;           // 0 alert .. 1 exhausted-and-sagging
    this.jawV = 0;            // jaw spring velocity`;
if (!src.includes(ctorOld)) throw new Error('constructor anchor not found');
src = src.replace(ctorOld, ctorNew);
console.log('constructor rig fields added');

fs.writeFileSync('ocean.js', src.split('\n').join(EOL));

// ---- 6. mirror the class back into new-megalodon.js -----------------------
const nl = src.split('\n');
const clsStart = nl.findIndex(l => l.startsWith('class Megalodon {'));
const aliasEnd = nl.findIndex(l => l.startsWith('window.OceanLeviathan = Megalodon;'));
if (clsStart < 0 || aliasEnd < 0 || aliasEnd < clsStart) throw new Error('class extraction anchors not found');
const header = `// ============================================================================
// THE MEGALODON â€” the ancient apex predator of the drowned colosseum.
// ============================================================================
// No magic, no ink: just a mile of scarred muscle, a mouth like a bear trap,
// and a speed nothing that big should have. Three phases:
//   1. THE ANCIENT PREDATOR (100-65%) â€” circles, charges, punishes greed.
//   2. BLOOD FRENZY (65-30%) â€” cracked hide, burning eyes, chained dashes.
//   3. APEX OF THE ANCIENT SEA (30-0%) â€” vanishing execution charges,
//      depth-erupting leaps, suction bites and the Extinction Hunt combo.
//
// THE MODEL: the animal is sampled along a spine whose curvature is the live
// swim cycle, so flexion travels from shoulder to caudal tip and every part
// of it â€” fins, gills, brow, eye and the hinged jaw â€” hangs off the same
// skeleton. render() is the only place the art is defined; update() feeds it
// the rig channels (swimPhase, tailBend, finKick, gillFlare, blink, roll/yaw,
// droop, jawV) and never the geometry itself.
//
// The combat surface (headTargets / takeDamage / update / render /
// renderTelegraph / overlapsPlayer / touchDamage) matches the old Kraken
// exactly, so the game loop, boss panel, save-HP banking and every QA hook
// keep working untouched. \`kind\` stays 'kraken' for save compatibility.
// ============================================================================
`;
fs.writeFileSync('new-megalodon.js', header + nl.slice(clsStart, aliasEnd + 1).join('\n') + '\n');
console.log('new-megalodon.js mirrored from ocean.js (' + (aliasEnd - clsStart + 1) + ' lines)');
