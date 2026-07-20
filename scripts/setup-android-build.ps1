# FleetCo Driver — portable Android SDK + JDK setup (no admin required)
# Installs to %LOCALAPPDATA%\fleetco-android

$ErrorActionPreference = "Stop"
$Base = Join-Path $env:LOCALAPPDATA "fleetco-android"
$JdkDir = Join-Path $Base "jdk-17"
$SdkDir = Join-Path $Base "android-sdk"
$CmdTools = Join-Path $SdkDir "cmdline-tools\latest"

New-Item -ItemType Directory -Force -Path $Base | Out-Null

# --- JDK 17 (Eclipse Temurin zip) ---
if (-not (Test-Path (Join-Path $JdkDir "bin\java.exe"))) {
  # Recover from a partial install (nested jdk-* folder or interrupted download).
  $nested = Get-ChildItem $JdkDir -Directory -ErrorAction SilentlyContinue |
    Where-Object { Test-Path (Join-Path $_.FullName "bin\java.exe") } |
    Select-Object -First 1
  if ($nested) {
    Get-ChildItem $nested.FullName | Move-Item -Destination $JdkDir -Force
    Remove-Item $nested.FullName -Recurse -Force -ErrorAction SilentlyContinue
    Write-Host "JDK recovered from nested folder at $JdkDir"
  } else {
    Write-Host "Downloading JDK 17..."
    $jdkZip = Join-Path $env:TEMP "temurin-jdk17-$(Get-Random).zip"
    $jdkUrl = "https://api.adoptium.net/v3/binary/latest/17/ga/windows/x64/jdk/hotspot/normal/eclipse?project=jdk"
    Invoke-WebRequest -Uri $jdkUrl -OutFile $jdkZip -UseBasicParsing
    New-Item -ItemType Directory -Force -Path $JdkDir | Out-Null
    Expand-Archive -Path $jdkZip -DestinationPath $JdkDir -Force
    $extracted = Get-ChildItem $JdkDir -Directory |
      Where-Object { Test-Path (Join-Path $_.FullName "bin\java.exe") } |
      Select-Object -First 1
    if ($extracted) {
      Get-ChildItem $extracted.FullName | Move-Item -Destination $JdkDir -Force
      Remove-Item $extracted.FullName -Recurse -Force -ErrorAction SilentlyContinue
    }
    Remove-Item $jdkZip -Force -ErrorAction SilentlyContinue
    Write-Host "JDK installed at $JdkDir"
  }
}

$env:JAVA_HOME = $JdkDir
$env:PATH = "$JdkDir\bin;$env:PATH"

# --- Android command-line tools ---
if (-not (Test-Path (Join-Path $CmdTools "bin\sdkmanager.bat"))) {
  Write-Host "Downloading Android command-line tools..."
  New-Item -ItemType Directory -Force -Path (Join-Path $SdkDir "cmdline-tools") | Out-Null
  $toolsZip = Join-Path $env:TEMP "android-cmdline-tools-$(Get-Random).zip"
  Invoke-WebRequest -Uri "https://dl.google.com/android/repository/commandlinetools-win-13114758_latest.zip" -OutFile $toolsZip -UseBasicParsing
  Expand-Archive -Path $toolsZip -DestinationPath (Join-Path $SdkDir "cmdline-tools\_tmp") -Force
  New-Item -ItemType Directory -Force -Path $CmdTools | Out-Null
  Move-Item (Join-Path $SdkDir "cmdline-tools\_tmp\cmdline-tools\*") $CmdTools -Force
  Remove-Item (Join-Path $SdkDir "cmdline-tools\_tmp") -Recurse -Force
  Remove-Item $toolsZip -Force
  Write-Host "Command-line tools installed"
}

$env:ANDROID_HOME = $SdkDir
$env:ANDROID_SDK_ROOT = $SdkDir
$env:PATH = "$CmdTools\bin;$SdkDir\platform-tools;$env:PATH"

Write-Host "Installing SDK packages (platform 35, build-tools)..."
$yes = ("y`n" * 20)
$yes | & sdkmanager.bat --licenses 2>$null | Out-Null
& sdkmanager.bat "platform-tools" "platforms;android-35" "build-tools;35.0.0"

# local.properties for Gradle
$localProps = Join-Path $PSScriptRoot "..\android\local.properties"
"sdk.dir=$($SdkDir -replace '\\','\\')" | Set-Content -Path $localProps -Encoding ASCII

Write-Host ""
Write-Host "Android build environment ready."
Write-Host "  JAVA_HOME=$env:JAVA_HOME"
Write-Host "  ANDROID_HOME=$env:ANDROID_HOME"
Write-Host "  local.properties -> $localProps"
