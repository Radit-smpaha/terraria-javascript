<#
.SYNOPSIS
  Pushes the working game files from THIS folder to the GitHub branch that
  Streamlit Community Cloud is serving, then tells you how to prove it landed.

.DESCRIPTION
  This workspace is not a git clone (that is why "putting the files in GitHub"
  silently missed space.js and the new terraria.js). Rather than git-init here
  and risk pushing 60 local scratch files over the repo, this script clones the
  real repo into a sibling folder, copies only the files Streamlit needs, shows
  you the diff, and pushes that.

  Run .\sync-to-github.ps1          -> dry-run style: shows status, asks nothing,
                                      commits and pushes.
  Run .\sync-to-github.ps1 -DryRun  -> copies + shows the diff, commits nothing.

.NOTES
  After it succeeds: Streamlit dashboard -> Settings -> Reboot app, then
  hard-refresh the game tab (Ctrl+Shift+R), then re-run node qa-deploy-fresh.js.
#>
param(
  [string]$RepoUrl = 'https://github.com/Radit-smpaha/terraria-javascript.git',
  [string]$Branch  = 'main',
  [string]$Message = 'Replace the Leviathan with the Abyssal Kraken ocean boss',
  [string]$Dest    = '',
  [switch]$DryRun
)

$ErrorActionPreference = 'Stop'

# Files Streamlit actually needs: app.py + the page + every script in
# app.py GAME_SCRIPTS. Anything else in this folder is local scaffolding.
# Files the deployed app and its own relay need. server.js is here because it
# doubles as the multiplayer room relay (ws://host:port/mp) — a clone that has
# the game but not the server cannot host across machines. qa-multiplayer.js
# travels with it so a fresh clone can prove the session end to end.
$GameFiles = @(
  'app.py', 'requirements.txt', 'terraria.html', 'terraria.css', 'server.js',
  'audio.js', 'particles.js', 'world.js', 'weather.js', 'entities.js',
  'underworld.js', 'juice.js', 'npcs.js', 'journey.js', 'multiplayer.js', 'space.js', 'ocean.js',
  'terraria.js', 'qa-multiplayer.js', 'qa-fps-speed.js', 'qa-boss-walls.js',
  'qa-inventory-favorites.js',
  'qa-reef.js',
  'qa-ws-relay.mjs'
)

$src = Split-Path -Parent $MyInvocation.MyCommand.Path
if (-not $Dest) {
  $Dest = Join-Path (Split-Path -Parent $src) 'terraria-javascript-deploy'
}

foreach ($f in $GameFiles) {
  if (-not (Test-Path -LiteralPath (Join-Path $src $f))) {
    throw "Refusing to sync: $f is missing from $src"
  }
}

Write-Host "== clone $Branch ==" -ForegroundColor Cyan
if (Test-Path -LiteralPath (Join-Path $Dest '.git')) {
  git -C $Dest fetch origin $Branch
  if ($LASTEXITCODE -ne 0) { throw "git fetch failed (auth? network?)" }
  git -C $Dest checkout $Branch
  git -C $Dest reset --hard "origin/$Branch"
} else {
  git clone --branch $Branch $RepoUrl $Dest
  if ($LASTEXITCODE -ne 0) { throw "git clone failed (check the URL and your access)" }
}
if ($LASTEXITCODE -ne 0) { throw 'git could not prepare ' + $Dest }

# A fresh machine often has no git identity, which makes `git commit` fail with
# "Author identity unknown" AFTER all the work is done. Set it locally in the
# clone (never global config) using the repo owner, so GitHub still credits you.
$Owner = [regex]::Match($RepoUrl, 'github\.com[:/](?:[^/]*/)?([^/.]+)').Groups[1].Value
if (-not $Owner) { $Owner = 'terraria-deploy' }
if (-not (git -C $Dest config user.name)) {
  git -C $Dest config user.name $Owner
}
if (-not (git -C $Dest config user.email)) {
  git -C $Dest config user.email "$Owner@users.noreply.github.com"
}

Write-Host "== copy game files ==" -ForegroundColor Cyan
foreach ($f in $GameFiles) {
  Copy-Item -LiteralPath (Join-Path $src $f) -Destination (Join-Path $Dest $f) -Force
  Write-Host ("  {0,-18} {1,8} bytes" -f $f, (Get-Item -LiteralPath (Join-Path $src $f)).Length)
}

git -C $Dest add -A
Write-Host "`n== what will change on $Branch ==" -ForegroundColor Cyan
git -C $Dest status --short
$staged = git -C $Dest diff --cached --quiet
if ($LASTEXITCODE -eq 0) {
  Write-Host "`nNothing to push - GitHub already has these exact files." -ForegroundColor Green
  Write-Host 'If the Streamlit page still looks old, the branch it is connected to is not'
  Write-Host "'$Branch' (check the app dashboard), or the app needs a Reboot."
  exit 0
}
if ($DryRun) {
  Write-Host "`n-DryRun: left the change staged but uncommitted in $Dest" -ForegroundColor Yellow
  exit 0
}

Write-Host "`n== commit + push ==" -ForegroundColor Cyan
git -C $Dest commit -m $Message -m 'Co-authored-by: Copilot <223556219+Copilot@users.noreply.github.com>'
if ($LASTEXITCODE -ne 0) { throw 'git commit failed' }
git -C $Dest push origin $Branch
if ($LASTEXITCODE -ne 0) { throw "git push failed - authenticate with GitHub (gh auth login or a Personal Access Token) and re-run" }

Write-Host "`nPushed to $Branch. Now:" -ForegroundColor Green
Write-Host '  1. Streamlit dashboard -> your app -> Settings -> Reboot app'
Write-Host '  2. hard-refresh the game tab (Ctrl+Shift+R)'
Write-Host '  3. node qa-deploy-fresh.js   (must print DEPLOY IS FRESH)'
