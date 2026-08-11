# Install Android emulator + Pixel 7 AVD for FleetCo Driver native testing
$ErrorActionPreference = "Stop"
$Root = Split-Path $PSScriptRoot -Parent

& (Join-Path $PSScriptRoot "setup-android-build.ps1")

$Base = Join-Path $env:LOCALAPPDATA "fleetco-android"
$SdkDir = Join-Path $Base "android-sdk"
$CmdTools = Join-Path $SdkDir "cmdline-tools\latest"
$AvdName = "FleetCo_Phone"
$SystemImage = "system-images;android-35;google_apis;x86_64"

$env:JAVA_HOME = Join-Path $Base "jdk-21"
$env:ANDROID_HOME = $SdkDir
$env:ANDROID_SDK_ROOT = $SdkDir
$env:PATH = "$env:JAVA_HOME\bin;$CmdTools\bin;$SdkDir\platform-tools;$SdkDir\emulator;$env:PATH"

Write-Host "Installing emulator + system image (may take several minutes)..."
$yes = ("y`n" * 30)
$yes | & sdkmanager.bat --licenses 2>$null | Out-Null
& sdkmanager.bat "emulator" $SystemImage

$avdList = & avdmanager.bat list avd 2>$null
if ($avdList -notmatch $AvdName) {
  Write-Host "Creating AVD '$AvdName'..."
  echo no | avdmanager.bat create avd -n $AvdName -k $SystemImage -d "pixel_7" --force
}

Write-Host ""
Write-Host "Emulator ready."
Write-Host "  Start:  emulator -avd $AvdName"
Write-Host "  Then:   npm run driver:android-debug"
Write-Host ""
Write-Host "Note: Enable virtualization (Intel HAXM / Windows Hypervisor Platform) in BIOS if the emulator fails to start."
