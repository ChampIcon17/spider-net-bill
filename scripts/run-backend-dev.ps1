<#
.SYNOPSIS
  Starts the NestJS backend dev server with a fixed session PATH.

.DESCRIPTION
  Dot-sources session-path.ps1 (portable Node + Git + System32), then runs npm run start:dev in backend/.

.EXAMPLE
  powershell -ExecutionPolicy Bypass -File .\scripts\run-backend-dev.ps1
#>

$ErrorActionPreference = "Stop"
$repoRoot = Split-Path $PSScriptRoot -Parent
. (Join-Path $PSScriptRoot "session-path.ps1")
Set-Location (Join-Path $repoRoot "backend")
npm run start:dev
