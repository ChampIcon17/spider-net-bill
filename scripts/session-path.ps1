<#
.SYNOPSIS
  Prepends portable Node, Git, and Windows system folders to PATH for the current session.

.DESCRIPTION
  Use when a terminal has no npm (only Cursor's node), or when where.exe / npm fail.
  Does not change permanent User or Machine PATH.

.PARAMETER Version
  Portable Node version folder name suffix, e.g. 22.14.0

.EXAMPLE
  . .\scripts\session-path.ps1
  node -v; npm -v

.EXAMPLE
  powershell -NoExit -ExecutionPolicy Bypass -Command ". '.\scripts\session-path.ps1'"
#>

param(
  [string]$Version = "22.14.0"
)

$portable = Join-Path $env:LOCALAPPDATA "spider-net-bill-tools\node-v$Version-win-x64"
$git = "${env:ProgramFiles}\Git\bin"
$prepend = @(
  $portable
  $git
  "$env:WINDIR\System32"
  $env:WINDIR
  "$env:WINDIR\System32\WindowsPowerShell\v1.0"
) | Where-Object { $_ -and (Test-Path $_ -ErrorAction SilentlyContinue) }

$rest = ($env:Path -split ';' | ForEach-Object { $_.Trim() } | Where-Object { $_ })
$seen = New-Object 'System.Collections.Generic.HashSet[string]' ([StringComparer]::OrdinalIgnoreCase)
$ordered = foreach ($p in ($prepend + $rest)) {
  if ($seen.Add($p)) { $p }
}
$env:Path = $ordered -join ';'

if (-not (Test-Path (Join-Path $portable 'node.exe'))) {
  Write-Warning "Portable Node not found at $portable. Run: powershell -ExecutionPolicy Bypass -File .\scripts\install-portable-node.ps1"
} else {
  Write-Host "Session PATH: portable Node v$Version, Git (if present), System32."
}
