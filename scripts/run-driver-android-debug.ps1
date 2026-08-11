# Build debug APK and install on running Android emulator (or connected device)
$ErrorActionPreference = "Stop"
$Root = Split-Path $PSScriptRoot -Parent
$Android = Join-Path $Root "android"

& (Join-Path $PSScriptRoot "setup-android-build.ps1")

$Base = Join-Path $env:LOCALAPPDATA "fleetco-android"
$env:JAVA_HOME = Join-Path $Base "jdk-21"
$env:ANDROID_HOME = Join-Path $Base "android-sdk"
$env:GRADLE_USER_HOME = Join-Path $Base "gradle"
$env:PATH = "$env:JAVA_HOME\bin;$env:ANDROID_HOME\cmdline-tools\latest\bin;$env:ANDROID_HOME\platform-tools;$env:ANDROID_HOME\emulator;$env:PATH"

# Local API from emulator: 10.0.2.2 maps to host localhost
$localEnv = Join-Path $Root ".env.mobile.local"
if (-not (Test-Path $localEnv)) {
  @(
    "# Local native app testing — emulator reaches host via 10.0.2.2"
    "VITE_API_BASE=http://10.0.2.2:3001"
  ) | Set-Content $localEnv -Encoding UTF8
  Write-Host "Created .env.mobile.local -> http://10.0.2.2:3001"
}

Push-Location $Root
npm run build:mobile
npx cap sync android
Pop-Location

Push-Location $Android
.\gradlew.bat assembleDebug
Pop-Location

$Apk = Join-Path $Android "app\build\outputs\apk\debug\app-debug.apk"
if (-not (Test-Path $Apk)) {
  Write-Error "Debug APK not found at $Apk"
}

$devices = & adb devices 2>$null | Select-String "device$"
if (-not $devices) {
  Write-Host "No emulator/device detected. Start one with:"
  Write-Host "  emulator -avd FleetCo_Phone"
  Write-Host ""
  Write-Host "APK built at: $Apk"
  exit 1
}

& adb install -r $Apk
Write-Host ""
Write-Host "FleetCo Driver installed. Open 'FleetCo Driver' on the emulator."
Write-Host "Ensure 'npm run dev:server' is running on port 3001 for local API."
