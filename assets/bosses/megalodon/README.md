# Megalodon — pixel-art boss asset pack

Production sprite pack for the Megalodon boss (`MEGALODON · THE ANCIENT PREDATOR`),
matching the redesign in the reference sheet: a dark-navy muscular prehistoric
shark, heavy head and jaws, pale underside, ragged fins, ember-red eyes, and
three phase looks (dark navy → Blood Frenzy red energy → Apex battle damage).

The game itself still renders the boss **procedurally** (this project has no
image pipeline: there is not a single `new Image()` or external-PNG
`drawImage()` in the runtime). This pack is therefore generated **from the live
boss code**, so the assets and the game can never drift apart, and the same
clips work as standalone art for anything else that wants them.

## Files

```
assets/bosses/megalodon/
  manifest.json          verified dimensions, frame counts, fps, loop/once, source
  manifest.schema.json   JSON schema for the manifest
  sprite-animator.js     delta-time frame controller (no rendering engine)
  preview.html           click-to-animate preview of every clip
  idle.png  swim.png  fast_swim.png  turn.png  bite.png  tail_sweep.png
  hurt.png  death.png                                   (base)
  frenzy_rush.png  sharknado.png  tooth_barrage.png  feeding_frenzy.png   (phase 2)
  apex_execution.png  depth_charge.png  devouring_maw.png
  extinction_hunt.png  exhausted.png                    (phase 3)
  water_splash.png  water_wave.png  turbulent_current.png  bite_shockwave.png
  tooth_projectile.png  blood_effect.png  impact_effect.png
  phase2_transition.png  phase3_transition.png  apex_warning_indicator.png
```

## Layout

* One animation = **one horizontal spritesheet**, one row, `frames` columns.
* Every frame sits in its own cell of `frameWidth × frameHeight` (per asset, in
  the manifest). Cells are the union of all frame bounding boxes plus a 6 px
  margin, so the animal never jumps inside its cell.
* `origin` is the draw anchor in cell pixels: the point the game keeps at
  `boss.x + width/2, boss.y + height/2`. Draw with
  `ctx.drawImage(img, sx, sy, sw, sh, x - originX*scale, y - originY*scale, ...)`.
* Background is real transparency (alpha channel), not a dark plate.
* Art is nearest-neighbour: call `imageSmoothingEnabled = false` before drawing
  (`megaPixelPerfect(ctx)` does it).

## In-game rig (how the art is driven)

The boss is procedural Canvas art, so the "animation system" is a set of spring
channels rather than a frame index. `Megalodon.update()` integrates them, and
`render()` reads them. Verified by `tools/test-mega-rig.js` (54 checks):

| channel | role |
|---|---|
| `jawOpen` / `jawV` | spring, not a lerp: a bite snaps with a little overshoot |
| `anticip` | 0..1 through a telegraph: opens the jaw, coils the spine, rears the body back |
| `lunge` | negative while the tell plays, positive on the release — anticipation → strike |
| `recoil` / `recoilV` | the strike's forward snap and its settle |
| `flipSmooth` | eased facing: a direction change pivots through zero instead of snapping |
| `turnKick` | one tail flick, on the crossing |
| `hitReact` | one decaying damage flinch (head pull, jaw clench, hard blink) |
| `recoverT` | post-charge coast window with no steering |
| `deadT` | death sequence: final lunge → thrash → limp sink → fade, accumulated once |
| `tailBend` / `finKick` / `gillFlare` / `roll` / `yaw` / `droop` | swim, flap, glare, banking, sag |

Timing is delta-time throughout (springs, not frame counters), so 60 Hz and
12 Hz agree. Bite damage still fires exactly once per charge, through the
existing `overlapsPlayer()` hitbox, and only while the jaw is open in the first
60% of the run.

Guests in multiplayer never simulate the boss: `terraria.js` calls
`Megalodon.animatePresentation(dt)` on the interpolated puppet, which runs the
same springs from the puppet's own drift — swim, blink, fin beats and death all
keep moving on a client, while the host stays authoritative for position,
health, attacks and phases.

## Animations

| clip | frames | fps | loop | source | what it is |
|---|---|---|---|---|---|
| idle | 8 | 8 | yes | extracted | resting drift, 0.55-amplitude tail beat |
| swim | 8 | 10 | yes | extracted | default cruise, sampled over one full swim cycle |
| fast_swim | 8 | 16 | yes | extracted | 1.35× wave amplitude, 1.9× beat rate, streamlined |
| turn | 8 | 12 | yes | extracted | banking reversal with a pre-coiled spine |
| bite | 8 | 14 | once | extracted | jaw spring snap: closed → unhinged → shut |
| tail_sweep | 8 | 14 | once | extracted | caudal coil through the sweep arc |
| hurt | 6 | 12 | once | extracted | recoil, flash bloom, hard blink |
| death | 10 | 8 | once | extracted | sagging, sinking wreck fading out |
| frenzy_rush | 8 | 16 | yes | extracted | Blood Frenzy charge, straight spine, flank spray |
| sharknado | 8 | 20 | yes | extracted | 2.1× wave, rolled 0.85 rad, vortex wrap |
| tooth_barrage | 6 | 10 | yes | extracted | head shakes while teeth are spat, gullet glow |
| feeding_frenzy | 8 | 14 | yes | extracted | frenzy stacks up, gills bleeding red light |
| apex_execution | 8 | 14 | yes | extracted | ghost materialising into the lane charge |
| depth_charge | 8 | 12 | once | extracted | nose-over dive, tail coiled, gullet lit |
| devouring_maw | 8 | 14 | once | extracted | suction cycles with the gape |
| extinction_hunt | 10 | 16 | yes | extracted | alternating hunt dashes, jaws locked |
| exhausted | 8 | 6 | yes | extracted | post-hunt damage window, every fin sagging |
| water_splash | 6 | 14 | once | reconstructed | droplet burst + crest arc |
| water_wave | 6 | 10 | yes | reconstructed | travelling swell with a foam crest |
| turbulent_current | 6 | 10 | yes | reconstructed | counter-rotating eddies |
| bite_shockwave | 5 | 14 | once | reconstructed | notched jaw-burst ring with tooth spikes |
| tooth_projectile | 4 | 8 | once | reconstructed | tooth with motion streaks |
| blood_effect | 6 | 12 | yes | reconstructed | cloud + droplets |
| impact_effect | 5 | 16 | once | reconstructed | flash + starburst + ring |
| phase2_transition | 8 | 12 | once | reconstructed | spiralling red vortex snap |
| phase3_transition | 8 | 12 | once | reconstructed | torn crimson shards + violent snap ring |
| apex_warning_indicator | 4 | 8 | yes | reconstructed | telegraph lane + chevrons |

`source: extracted` = baked frame-by-frame out of the real `Megalodon.render()`
in `ocean.js`. `source: reconstructed` = drawn procedurally by the bake tool in
the pack palette, because those effects are produced in-game by the particle
and telegraph systems rather than by the boss sprite — swap in hand-drawn frames
if you have sheet art for them.

### Known limitations

* Cell sizes vary per animation (roughly 500–830 × 300–560 px) because each clip
  needs room for its own motion (the death clip sinks, the maw clip gapes wide).
  They are deliberately not forced to one size.
* Attack clips are *pose-accurate*, not frame-locked to the AI: the game's
  attack timers drive the springs, and these clips sample the same rig at the
  same rates.
* `turn` is a banking turn (a side-view cannot show a full rotation).
* Reconstructed effects are placeholder-styled to match the pack palette.
* No in-game code renders these PNGs yet — see below.

## Previewing

Open the preview page through any static server (the repo's `server.js` serves
this folder):

```
npx serve .          # or: python -m http.server
# then open  http://localhost:3000/assets/bosses/megalodon/preview.html
```

The page lists every clip with its frame count, fps, loop flag and real pixel
size, animates it on click, and can show the anchor point and the cell grid.

Command line, without a browser:

```
powershell -File tools/run-node.ps1 tools/verify-mega-pack.js
```

## Regenerating and testing

```
powershell -ExecutionPolicy Bypass -File tools\run-node.ps1 tools\bake-mega-pack.js     # rewrite the pack + manifest
powershell -ExecutionPolicy Bypass -File tools\run-node.ps1 tools\verify-mega-pack.js   # 270 checks, exit 0 = pass
powershell -ExecutionPolicy Bypass -File tools\run-node.ps1 tools\test-mega-animator.js # playback semantics
powershell -ExecutionPolicy Bypass -File tools\run-node.ps1 tools\test-mega-rig.js      # full-fight regression
```

`bake-mega-pack.js` runs the real game scripts headlessly, drives the boss into
each pose, and renders every frame through `tools/mini-canvas.js` (plus
`tools/png-rgba.js`, which recovers true alpha by rendering each scene twice,
once over black and once over white). Edit the clip table at the top of the tool
to change poses, frame counts or rates.

`verify-mega-pack.js` decodes every PNG (zlib + unfilter, no image library) and
checks the manifest agreement, transparency, cell tiling, frame distinctness,
anchors and palette. `test-mega-rig.js` plays the real fight for all three
phases and fails if a pose the pack ships can never happen in game.

## Using the pack in code

```html
<script src="assets/bosses/megalodon/sprite-animator.js"></script>
<script>
  const anim = new window.MegaSpriteAnimator(manifest);   // manifest.json parsed
  await anim.load();
  anim.play('swim');                       // loops by default
  // game loop:
  anim.update(dt);                          // delta-time, not per-frame
  const f = anim.frame();
  window.megaDrawFrame(ctx, f, bossScreenX, bossScreenY, scale);
</script>
```

The animator owns timing and frame selection only. It never draws on its own
beyond the optional `megaDrawFrame` helper, and it never restarts a clip you are
already playing (`swim → fast_swim → swim` keeps the tail beat continuous).
