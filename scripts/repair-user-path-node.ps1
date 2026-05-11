<#
.SYNOPSIS
  Removes known-bad Node directories from the *User* PATH and optionally prepends a standard install.

.DESCRIPTION
  Fixes common Windows misconfiguration where a partial Node copy (e.g. under "C:\New Folder\desktop")
  appears before a real Node.js install, breaking npm with errors like:
  - SyntaxError when executing node.exe
  - "Could not determine Node.js install directory"

  Run in PowerShell (no admin required for User PATH):
    powershell -ExecutionPolicy Bypass -File .\scripts\repair-user-path-node.ps1

  Review changes carefully before applying permanent PATH edits.

.PARAMETER Force
  Apply PATH changes without interactive confirmation (use with care).

.EXAMPLE
  powershell -ExecutionPolicy Bypass -File .\scripts\repair-user-path-node.ps1 -Force
#>

param(
  [switch]$Force
)

$ErrorActionPreference = "Stop"

$badPatterns = @(
  "C:\New Folder\desktop"
  "C:\new folder\desktop"
)

$candidates = @(
  "${env:ProgramFiles}\nodejs"
  "${env:ProgramFiles(x86)}\nodejs"
)

function Normalize-Segments([string]$pathValue) {
  if ([string]::IsNullOrWhiteSpace($pathValue)) { return @() }
  return $pathValue.Split(";", [System.StringSplitOptions]::RemoveEmptyEntries) |
    ForEach-Object { $_.Trim() } |
    Where-Object { $_ -ne "" }
}

$userPathRaw = [Environment]::GetEnvironmentVariable("Path", "User")
$segments = Normalize-Segments $userPathRaw

Write-Host "Current User PATH segments (node-related only):"
$segments | Where-Object {
  $_ -match "node|New Folder" -or $_ -match "nodejs"
} | ForEach-Object { Write-Host "  $_" }

$removed = @()
$filtered = foreach ($seg in $segments) {
  $shouldRemove = $false
  foreach ($bad in $badPatterns) {
    if ($seg -ieq $bad) {
      $shouldRemove = $true
      break
    }
  }
  if ($shouldRemove) {
    $removed += $seg
  } else {
    $seg
  }
}

if ($removed.Count -gt 0) {
  Write-Host ""
  Write-Host "Will REMOVE from User PATH:"
  $removed | ForEach-Object { Write-Host "  $_" }
} else {
  Write-Host ""
  Write-Host "No matching bad PATH entries found (nothing removed)."
}

$prepend = @()
foreach ($dir in $candidates) {
  if (Test-Path (Join-Path $dir "node.exe")) {
    $prepend = @($dir)
    break
  }
}

if ($prepend.Count -gt 0) {
  Write-Host ""
  Write-Host "Will PREPEND (if not already first):"
  $prepend | ForEach-Object { Write-Host "  $_" }
} else {
  Write-Host ""
  Write-Host "NOTE: No standard Node install found under Program Files. Install Node.js LTS, then re-run this script or fix PATH manually."
}

$newSegments = @()
foreach ($p in $prepend) {
  if ($filtered -inotcontains $p) {
    $newSegments += $p
  }
}
foreach ($p in $filtered) {
  if ($prepend -inotcontains $p) {
    $newSegments += $p
  }
}

# De-dupe while preserving order
$seen = New-Object "System.Collections.Generic.HashSet[string]" ([StringComparer]::OrdinalIgnoreCase)
$final = foreach ($p in $newSegments) {
  if ($seen.Add($p)) { $p }
}

$newPath = ($final -join ";")

Write-Host ""
Write-Host "New User PATH (preview, node-related only):"
$final | Where-Object {
  $_ -match "node|New Folder" -or $_ -match "nodejs"
} | ForEach-Object { Write-Host "  $_" }

Write-Host ""
if (-not $Force) {
  $confirm = Read-Host "Apply this User PATH change? (type YES to continue)"
  if ($confirm -ne "YES") {
    Write-Host "Aborted. No changes were made."
    exit 0
  }
}

[Environment]::SetEnvironmentVariable("Path", $newPath, "User")
Write-Host ""
Write-Host "User PATH updated. Open a NEW terminal and run:  where.exe node"
