# Build signed FleetCo Driver release AAB for Google Play
$ErrorActionPreference = "Stop"
$Root = Split-Path $PSScriptRoot -Parent
$Android = Join-Path $Root "android"
$Keystore = Join-Path $Android "fleetco-driver-release.keystore"
$Props = Join-Path $Android "keystore.properties"

# Ensure SDK/JDK
& (Join-Path $PSScriptRoot "setup-android-build.ps1")

$Base = Join-Path $env:LOCALAPPDATA "fleetco-android"
$env:JAVA_HOME = Join-Path $Base "jdk-21"
$env:ANDROID_HOME = Join-Path $Base "android-sdk"
$env:PATH = "$env:JAVA_HOME\bin;$env:ANDROID_HOME\cmdline-tools\latest\bin;$env:ANDROID_HOME\platform-tools;$env:PATH"

# Web build + sync
Push-Location $Root
npm run build:mobile
npx cap sync android
Pop-Location

# Create upload keystore + signing config (first run only)
$passFile = Join-Path $Android ".keystore-pass"
$pass = $env:FLEETCO_ANDROID_KEYSTORE_PASS
if (-not $pass -and (Test-Path $passFile)) {
  $pass = (Get-Content $passFile -Raw).Trim()
}
if (-not $pass) {
  $pass = -join ((48..57 + 65..90 + 97..122) | Get-Random -Count 24 | ForEach-Object { [char]$_ })
  $pass | Set-Content $passFile -NoNewline
  Write-Host "Generated keystore password saved to android\.keystore-pass (gitignored)."
}

if (-not (Test-Path $Keystore)) {
  Write-Host "Creating release keystore..."
  & keytool -genkeypair -v `
    -keystore $Keystore `
    -alias fleetco-driver `
    -keyalg RSA -keysize 2048 -validity 10000 `
    -storepass $pass -keypass $pass `
    -dname "CN=FleetCo Management, OU=Mobile, O=FleetCo Management, L=US, ST=US, C=US"
  Write-Host "Keystore created: $Keystore"
  Write-Host "IMPORTANT: Back up keystore and android\.keystore-pass for all future updates."
}

if (-not (Test-Path $Props)) {
  $propsContent = @(
    "storePassword=$pass"
    "keyPassword=$pass"
    "keyAlias=fleetco-driver"
    "storeFile=../fleetco-driver-release.keystore"
  ) -join "`n"
  Set-Content -Path $Props -Value $propsContent -Encoding ASCII
}

Push-Location $Android
.\gradlew.bat bundleRelease
Pop-Location

$Aab = Join-Path $Android "app/build/outputs/bundle/release/app-release.aab"
if (Test-Path $Aab) {
  $dest = Join-Path $Root "dist/fleetco-driver-release.aab"
  New-Item -ItemType Directory -Force -Path (Join-Path $Root "dist") | Out-Null
  Copy-Item $Aab $dest -Force
  Write-Host ""
  Write-Host "SUCCESS: $dest"
} else {
  Write-Error "AAB not found - check Gradle output above."
}
