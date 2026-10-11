# Runs every QA suite and prints one line per suite plus a failure count.
$tests = @(
  'qa-boot.js','qa-title-screen.js','qa-chest.js','qa-armor.js','qa-journey.js',
  'qa-item-icons.js','qa-inventory-favorites.js','qa-ban-hammer.js','qa-world.js',
  'qa-space-run.js','qa-space-post-layers.js','qa-space-integration.js',
  'qa-space-hooks.js','qa-dragon-finale.js','qa-reload.js','qa-flight-probe.js',
  'qa-node-harness.js','qa-item-names.js','qa-integrity.js','qa-dragon-loot.js',
  'qa-mob-ai.js', 'qa-settings.js', 'qa-drop-and-seeds.js', 'qa-mainmenu.js',
  'qa-mobile.js', 'qa-mobile-runtime.js', 'qa-house.js', 'qa-vaults.js', 'qa-multiplayer.js',
  'qa-fps-speed.js', 'qa-boss-walls.js', 'qa-worldgen-shape.js',
  'qa-bg-smoke.js', 'qa-weather-batch.js', 'qa-reef.js'
)
$bad = 0
foreach ($t in $tests) {
  $out = (& node $t 2>&1 | Out-String)
  $code = $LASTEXITCODE
  if ($code -ne 0) { $bad++ }
  $tail = (($out -split "`n") | Where-Object { $_ -match '\S' } | Select-Object -Last 1)
  Write-Output ("{0,-28} exit={1}  {2}" -f $t, $code, $tail.Trim())
}
$out = (& node qa-loadcheck.js . terraria.inlined.html 2>&1 | Out-String)
$code = $LASTEXITCODE
if ($code -ne 0) { $bad++ }
$tail = (($out -split "`n") | Where-Object { $_ -match '\S' } | Select-Object -Last 1)
Write-Output ("{0,-28} exit={1}  {2}" -f 'qa-loadcheck.js', $code, $tail.Trim())
Write-Output ""
Write-Output "FAILING SUITES: $bad"
if ($bad -gt 0) { exit 1 }