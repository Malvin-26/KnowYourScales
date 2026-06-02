# Know Your Scales — Windows setup helper
$ErrorActionPreference = "Stop"

$nodeDir = "C:\Program Files\nodejs"
if (Test-Path $nodeDir) {
  $env:Path = "$nodeDir;$env:Path"
}

if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
  Write-Host "Node.js is not installed or not on PATH." -ForegroundColor Red
  Write-Host "Download LTS (v22+) from https://nodejs.org/ then restart PowerShell."
  exit 1
}

$nodeVersion = [version]((node -v) -replace '^v', '')
if ($nodeVersion.Major -lt 22) {
  Write-Host "Node.js 22.5+ is required (built-in SQLite). Found: $(node -v)" -ForegroundColor Red
  exit 1
}

Write-Host "Node $(node -v) / npm $(npm -v)" -ForegroundColor Green
Set-Location $PSScriptRoot

npm install
Set-Location server
npm install
Set-Location ..\client
npm install
Set-Location ..
npm run db:seed

Write-Host ""
Write-Host "Setup complete. Run: npm run dev" -ForegroundColor Green
