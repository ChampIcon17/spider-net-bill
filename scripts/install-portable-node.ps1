<#
.SYNOPSIS
  Downloads official Node.js Windows x64 zip into %LOCALAPPDATA%\spider-net-bill-tools (no admin).

.DESCRIPTION
  Use when `npm` is missing (e.g. only Cursor's bundled `node.exe` is on PATH). After this, open a
  new terminal; `.vscode/settings.json` prepends this folder to Path.

.PARAMETER Version
  Node version to install, e.g. 22.14.0

.EXAMPLE
  powershell -ExecutionPolicy Bypass -File .\scripts\install-portable-node.ps1
#>

param(
  [string]$Version = "22.14.0"
)

$ErrorActionPreference = "Stop"
$base = Join-Path $env:LOCALAPPDATA "spider-net-bill-tools"
$zipName = "node-v$Version-win-x64.zip"
$zip = Join-Path $base $zipName
$dest = Join-Path $base "node-v$Version-win-x64"
New-Item -ItemType Directory -Force -Path $base | Out-Null

if (Test-Path (Join-Path $dest "node.exe")) {
  Write-Host "Already present: $dest"
  & (Join-Path $dest "node.exe") -v
  & (Join-Path $dest "npm.cmd") -v
  exit 0
}

$url = "https://nodejs.org/dist/v$Version/$zipName"
Write-Host "Downloading $url ..."
Invoke-WebRequest -Uri $url -OutFile $zip -UseBasicParsing
Expand-Archive -Path $zip -DestinationPath $base -Force
Write-Host "Installed to: $dest"
& (Join-Path $dest "node.exe") -v
& (Join-Path $dest "npm.cmd") -v
