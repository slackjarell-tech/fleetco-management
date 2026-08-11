# FleetCo Driver — phone-sized preview in Chrome/Edge on Windows (no app store / emulator required)
$ErrorActionPreference = "Stop"
$Root = Split-Path $PSScriptRoot -Parent
$Url = "http://localhost:5173/login?app=driver"
$Width = 390
$Height = 844

function Test-DevServer {
  try {
    $r = Invoke-WebRequest -Uri "http://localhost:5173" -UseBasicParsing -TimeoutSec 3
    return $r.StatusCode -ge 200
  } catch {
    return $false
  }
}

Push-Location $Root
try {
  if (-not (Test-DevServer)) {
    Write-Host "Starting dev server (API :3001, Vite :5173)..."
    Start-Process powershell -ArgumentList @(
      "-NoExit", "-Command", "cd '$Root'; npm run dev"
    ) | Out-Null

    $deadline = (Get-Date).AddSeconds(45)
    while ((Get-Date) -lt $deadline) {
      Start-Sleep -Seconds 2
      if (Test-DevServer) { break }
    }
    if (-not (Test-DevServer)) {
      Write-Error "Dev server did not start in time. Run 'npm run dev' manually, then retry."
    }
  }

  Write-Host "Seeding local demo drivers..."
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
if (-not (Test-Path $edgePath)) {
  $edgePath = "${env:ProgramFiles}\Microsoft\Edge\Application\msedge.exe"
}

$browser = $chromePaths | Where-Object { Test-Path $_ } | Select-Object -First 1
if (-not $browser) { $browser = $edgePath }

if (-not (Test-Path $browser)) {
  Write-Host ""
  Write-Host "Open this URL in your browser and toggle device mode (F12 -> phone icon):"
  Write-Host "  $Url"
  Write-Host "Login: driver1@fleetco.com / demo123"
  exit 0
}

Write-Host ""
Write-Host "Opening phone-sized window ($Width x $Height)..."
Write-Host "  URL: $Url"
Write-Host "  Login: driver1@fleetco.com / demo123"
Write-Host ""
Write-Host "Tip: Press F12, click the device toolbar icon, and pick iPhone 14 Pro for touch + GPS simulation."

$args = @(
  "--app=$Url",
  "--window-size=$Width,$Height",
  "--window-position=80,40",
  "--user-agent=Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1"
)
Start-Process -FilePath $browser -ArgumentList $args
