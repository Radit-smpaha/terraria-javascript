# Run a JS file with the VS Code Electron binary acting as Node (this machine
# has no node.exe on PATH). Usage: powershell -File tools/run-node.ps1 script.js [args...]
param([string]$Script, [string[]]$ScriptArgs = @())
$env:ELECTRON_RUN_AS_NODE = '1'
$code = Join-Path $env:LOCALAPPDATA 'Programs\Microsoft VS Code\Code.exe'
if (-not (Test-Path $code)) { throw "VS Code electron not found at $code" }
& $code $Script @ScriptArgs
exit $LASTEXITCODE
