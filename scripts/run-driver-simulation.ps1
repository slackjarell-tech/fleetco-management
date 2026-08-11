# FleetCo Driver — full feature simulation on PC
$ErrorActionPreference = "Stop"
$Root = Split-Path $PSScriptRoot -Parent
$Url = "http://localhost:5173/login?app=driver"
$Width = 390
$Height = 844

function Test-DevServer {
  try {
    $r = Invoke-WebRequest -Uri "http://localhost:5173" -UseBasicParsing -TimeoutSec 3
    return $r.StatusCode -ge 200
  } catch { return $false }
}

Push-Location $Root
try {
  if (-not (Test-DevServer)) {
    Write-Host "Starting dev server..."
    Start-Process powershell -ArgumentList @("-NoExit", "-Command", "cd '$Root'; npm run dev") | Out-Null
    $deadline = (Get-Date).AddSeconds(50)
    while ((Get-Date) -lt $deadline) {
      Start-Sleep -Seconds 2
      if (Test-DevServer) { break }
    }
    if (-not (Test-DevServer)) { Write-Error "Dev server did not start. Run npm run dev manually." }
  }

  Write-Host "Seeding demo drivers + delivery route..."
  node (Join-Path $PSScriptRoot "seed-local-demo-drivers.mjs")
} finally {
  Pop-Location
}

$chromePaths = @(
  "${env:ProgramFiles}\Google\Chrome\Application\chrome.exe",
  "${env:ProgramFiles(x86)}\Google\Chrome\Application\chrome.exe",
  "${env:LocalAppData}\Google\Chrome\Application\chrome.exe"
)
$edgePath = "${env:ProgramFiles(x86)}\Microsoft\Edge\Application\msedge.exe"
if (-not (Test-Path $edgePath)) { $edgePath = "${env:ProgramFiles}\Microsoft\Edge\Application\msedge.exe" }
$browser = $chromePaths | Where-Object { Test-Path $_ } | Select-Object -First 1
if (-not $browser) { $browser = $edgePath }

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  FleetCo Driver - SIMULATION WALKTHROUGH" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Login: driver1@fleetco.com / demo123"
Write-Host ""
Write-Host "1. LOGIN + BRANDING" -ForegroundColor Yellow
Write-Host "   - FleetCo copyright and Patent Pending on login footer"
Write-Host "   - Allow Camera and Location, or skip for PC preview"
Write-Host ""
Write-Host "2. HOME DASHBOARD" -ForegroundColor Yellow
Write-Host "   - Quick tiles: Loads, Route, Scan, Dashcam, Navigate, HOS"
Write-Host "   - Today delivery route card with 3 seeded stops"
Write-Host ""
Write-Host "3. ROUTE TAB" -ForegroundColor Yellow
Write-Host "   - Map with numbered pins using OpenStreetMap"
Write-Host "   - Expand stop: Navigate and Record POD"
Write-Host "   - Optimize route button"
Write-Host ""
Write-Host "4. SCAN TAB" -ForegroundColor Yellow
Write-Host "   - Deliver, Build Route, and Log modes"
Write-Host "   - F12 Network Offline toggles offline queue test"
Write-Host "   - Scan shows Saved on device when offline"
Write-Host ""
Write-Host "5. OFFLINE SYNC" -ForegroundColor Yellow
Write-Host "   - Amber banner when offline"
Write-Host "   - Auto-sync when back online"
Write-Host "   - Route reloads from server after sync"
Write-Host ""
Write-Host "6. CLOCK TAB in More menu" -ForegroundColor Yellow
Write-Host "   - Clock in and out offline, syncs later"
Write-Host ""
Write-Host "7. DASHCAM TAB" -ForegroundColor Yellow
Write-Host "   - Start session; frames queue offline"
Write-Host "   - Pending upload counter when offline"
Write-Host ""
Write-Host "8. NAVIGATION TAB in More menu" -ForegroundColor Yellow
Write-Host "   - Load routes with OSM map preview"
Write-Host ""

if (Test-Path $browser) {
  Write-Host "Opening phone window ${Width}x${Height}..." -ForegroundColor Green
  $launchArgs = @(
    "--app=$Url",
    "--window-size=$Width,$Height",
    "--window-position=100,40",
    "--user-agent=Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1"
  )
  Start-Process -FilePath $browser -ArgumentList $launchArgs
} else {
  Write-Host "Open: $Url" -ForegroundColor Green
}

Write-Host "Press F12 in the browser for DevTools offline simulation." -ForegroundColor DarkGray
