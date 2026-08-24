# Glypt dev bootstrap - boots api + web side by side.
$ErrorActionPreference = "Stop"
$root = $PSScriptRoot | Split-Path | Split-Path

Write-Host "glypt dev" -ForegroundColor White
Write-Host "  api -> http://localhost:4000" -ForegroundColor Yellow
Write-Host "  web -> http://localhost:5173" -ForegroundColor Cyan
Write-Host ""

$env:API_PORT = "4000"
$api = Start-Process pnpm -ArgumentList "--filter","@glypt/api","dev" -WorkingDirectory $root -PassThru -NoNewWindow
$web = Start-Process pnpm -ArgumentList "--filter","@glypt/web","dev" -WorkingDirectory $root -PassThru -NoNewWindow

try {
  while ($true) { Start-Sleep -Seconds 1 }
} finally {
  foreach ($p in @($api, $web)) {
    if (-not $p.HasExited) { Stop-Process -Id $p.Id -Force -ErrorAction SilentlyContinue }
  }
}
