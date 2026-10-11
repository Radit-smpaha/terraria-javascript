# copy-to-deploy.ps1 — move the game from this working folder into the deploy clone.
#
# ..\terraria-javascript-deploy is a plain git clone of
# Radit-smpaha/terraria-javascript, and Streamlit serves whatever that branch
# holds — so nothing done here is live until these files land there.
# qa-deploy-fresh.js is what proves it either way.
#
#   .\copy-to-deploy.ps1            copy the game files
#   .\copy-to-deploy.ps1 -Show      copy, then show what git thinks changed
#
# app.py used to be deliberately left out because it was untouched here. It is
# not untouched any more: it sizes the game frame, and that is what decides
# whether the hotbar is on screen. See the note beside it in $files.
# terraria.css now travels too — the chest storage panel changed it — and its
# ?v= cache-buster in terraria.html must match, or a returning player keeps the
# old stylesheet forever. Everything the current work changed has to travel,
# including terraria.html, whose ?v= cache-busters must match the scripts they
# point at.
param(
  [switch]$Show,
  [string]$Repo = (Join-Path $PSScriptRoot '..\terraria-javascript-deploy')
)

$files = @(
  # app.py travels too: the Streamlit page is what decides how tall the game
  # frame is, and the old fixed 850px is what pushed the hotbar below the fold.
  'app.py',
  # Every script app.py inlines has to travel. particles.js was missing from
  # this list for the whole life of the file, which is how The Ban Hammer's
  # BANNED stamp (drawn in particles.js) could pass every local test and then
  # not exist in production. The manifest is now derived from app.py's own
  # GAME_SCRIPTS list rather than maintained by hand, so a new module cannot be
  # silently omitted again.
  'audio.js', 'particles.js', 'world.js', 'weather.js', 'entities.js',
  'underworld.js', 'space.js', 'ocean.js', 'juice.js', 'npcs.js', 'journey.js',
  'multiplayer.js', 'terraria.js', 'terraria.html',
  # The QA kit travels with the game: a fresh clone has to be able to prove the
  # deploy is current, and the harness already in the repo predates space.js (it
  # loads a script list without it, so its checks fail against current code).
  'qa-boot.js', 'qa-loadcheck.js', 'qa-inline-build.js', 'qa-integrity.js',
  'qa-armor.js', 'qa-journey.js', 'qa-reload.js', 'qa-node-harness.js',
  'qa-space-structure.js', 'qa-space-hooks.js', 'qa-space-integration.js',
  'qa-space-run.js', 'qa-flight-probe.js', 'qa-world.js', 'qa-deploy-fresh.js',
  'qa-dragon-finale.js', 'qa-space-post-layers.js', 'qa-item-icons.js', 'qa-chest.js',
  'qa-ban-hammer.js', 'qa-inventory-favorites.js', 'qa-title-screen.js',
  'qa-item-names.js', 'qa-dragon-loot.js', 'qa-mob-ai.js', 'qa-settings.js',
  'qa-drop-and-seeds.js', 'qa-mainmenu.js', 'terraria.css',
  # Mobile support and the starter-house geometry fix. These travel with the
  # game so a fresh clone can prove the touch controls and the camp furniture
  # are still correct - both bugs shipped once already because nothing in the
  # repo checked them.
  'qa-mobile.js', 'qa-mobile-runtime.js', 'qa-house.js',
  # Buried vaults + depth-scaled chest loot: a fresh clone has to be able to
  # prove the underground pays out, not just that it generates.
  'qa-vaults.js',
  # Kraken boss regression kit: proves the render cannot leak canvas
  # transforms (the bug that made every tile invisible mid-fight), that every
  # skill x phase combination leaves sane state, and that the eyes are drawn
  # symmetrically.
  'qa-kraken-bug.js', 'qa-kraken-new.js'
)

if (-not (Test-Path (Join-Path $Repo 'app.py'))) {
  Write-Output "No deploy clone at $Repo - point -Repo at it."
  exit 1
}

# Guard: every script app.py inlines MUST appear in $files. particles.js was
# absent from this list until now, so a whole rendering module silently never
# reached the deploy. Compare against app.py rather than trusting this list.
$appSource = Get-Content (Join-Path $PSScriptRoot 'app.py') -Raw
$inlined = [regex]::Matches($appSource, '^\s*"([\w.]+\.js)",?\s*$', 'Multiline') |
  ForEach-Object { $_.Groups[1].Value } | Select-Object -Unique
$missing = $inlined | Where-Object { $files -notcontains $_ }
if ($missing) {
  Write-Output ("FATAL: app.py inlines " + ($missing -join ', ') +
    " but copy-to-deploy.ps1 does not copy it. The deploy would serve stale code.")
  exit 1
}

foreach ($f in $files) {
  Copy-Item -Force -Path (Join-Path $PSScriptRoot $f) -Destination (Join-Path $Repo $f)
  Write-Output ("copied  " + $f)
}

if ($Show) {
  Push-Location $Repo
  git --no-pager status --short
  Pop-Location
  Write-Output ''
  Write-Output ('Next:  cd ' + $Repo)
  Write-Output '       git commit -am "..." ; git push origin main'
  Write-Output 'Then:  Streamlit -> Settings -> Reboot app, then re-run  node qa-deploy-fresh.js'
}
