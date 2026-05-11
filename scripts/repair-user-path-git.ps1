<#
.SYNOPSIS
  Ensures Git for Windows is on the *User* PATH so `git` works in PowerShell.

.DESCRIPTION
  Fixes: "The term 'git' is not recognized" when Git is installed but its bin
  directory is missing from User PATH.

  Run (no admin required for User PATH):
    powershell -ExecutionPolicy Bypass -File .\scripts\repair-user-path-git.ps1

.PARAMETER Force
  Apply PATH change without interactive confirmation.

.EXAMPLE
  powershell -ExecutionPolicy Bypass -File .\scripts\repair-user-path-git.ps1 -Force
#>

param([switch]$Force)

$ErrorActionPreference = "Stop"

$gitBins = @(
  "${env:ProgramFiles}\Git\bin"
  "${env:ProgramFiles(x86)}\Git\bin"
)

$gitDir = $null
foreach ($d in $gitBins) {
  if (Test-Path (Join-Path $d "git.exe")) {
    $gitDir = $d
    break
  }
}

if (-not $gitDir) {
  Write-Host "Git for Windows not found under Program Files. Install from https://git-scm.com/download/win then re-run."
  exit 1
}

function Normalize-Segments([string]$pathValue) {
  if ([string]::IsNullOrWhiteSpace($pathValue)) { return @() }
  return $pathValue.Split(";", [System.StringSplitOptions]::RemoveEmptyEntries) |
    ForEach-Object { $_.Trim() } |
    Where-Object { $_ -ne "" }
}

$userPathRaw = [Environment]::GetEnvironmentVariable("Path", "User")
$segments = Normalize-Segments $userPathRaw

$already = $false
foreach ($s in $segments) {
  if ($s -ieq $gitDir) {
    $already = $true
    break
  }
}

if ($already) {
  Write-Host "User PATH already includes: $gitDir"
  Write-Host "Open a NEW terminal if `git` still fails (session may be stale)."
  exit 0
}

Write-Host "Will PREPEND to User PATH:"
Write-Host "  $gitDir"

$newSegments = @($gitDir) + ($segments | Where-Object { $_ -ine $gitDir })
$seen = New-Object "System.Collections.Generic.HashSet[string]" ([StringComparer]::OrdinalIgnoreCase)
$final = foreach ($p in $newSegments) {
  if ($seen.Add($p)) { $p }
}
$newPath = ($final -join ";")

if (-not $Force) {
  $confirm = Read-Host "Apply this User PATH change? (type YES to continue)"
  if ($confirm -ne "YES") {
    Write-Host "Aborted. No changes were made."
    exit 0
  }
}

[Environment]::SetEnvironmentVariable("Path", $newPath, "User")
Write-Host ""
Write-Host "User PATH updated. Close and reopen your terminal, then run:  git --version"
