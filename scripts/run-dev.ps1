<#
.SYNOPSIS
  Starts the Vite frontend dev server with a fixed session PATH.

.DESCRIPTION
  Dot-sources session-path.ps1 (portable Node + Git + System32), then runs npm run dev.

.EXAMPLE
  powershell -ExecutionPolicy Bypass -File .\scripts\run-dev.ps1
#>

$ErrorActionPreference = "Stop"
$repoRoot = Split-Path $PSScriptRoot -Parent
. (Join-Path $PSScriptRoot "session-path.ps1")
Set-Location $repoRoot
npm run dev
