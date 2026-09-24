$ErrorActionPreference = "Stop"
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$InstallDir = Join-Path $env:LOCALAPPDATA "cline1\bin"

if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
    Write-Host "Node.js is required but was not found."
    $reply = Read-Host "Install Node.js now? [y/N]"
    if ($reply -notmatch '^(?i:y|yes)$') {
        Write-Error "Install Node.js from https://nodejs.org/ and run this installer again."
        exit 1
    }
    if (-not (Get-Command winget -ErrorAction SilentlyContinue)) {
        Write-Error "winget is unavailable. Install Node.js from https://nodejs.org/ and run this installer again."
        exit 1
    }
    winget install --id OpenJS.NodeJS.LTS --exact --accept-source-agreements --accept-package-agreements
    if ($LASTEXITCODE -ne 0) {
        Write-Error "Node.js installation failed. Install it from https://nodejs.org/ and run this installer again."
        exit 1
    }
    $env:Path = "C:\Program Files\nodejs;$env:Path"
}
if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
    Write-Error "Node.js is still unavailable. Restart PowerShell and run this installer again."
    exit 1
}

New-Item -ItemType Directory -Force -Path $InstallDir | Out-Null
Copy-Item -Force (Join-Path $ScriptDir "cline1-app.js") (Join-Path $InstallDir "cline1-app.js")
Copy-Item -Force (Join-Path $ScriptDir "cline1.cmd") (Join-Path $InstallDir "cline1.cmd")

$UserPath = [Environment]::GetEnvironmentVariable("Path", "User")
$Parts = @($UserPath -split ";" | Where-Object { $_ })
if ($Parts -notcontains $InstallDir) {
    $NewPath = if ([string]::IsNullOrWhiteSpace($UserPath)) { $InstallDir } else { "$UserPath;$InstallDir" }
    [Environment]::SetEnvironmentVariable("Path", $NewPath, "User")
    Write-Host "Added $InstallDir to your user PATH."
}

Write-Host ""
Write-Host "Installation complete. Open a new terminal and run:"
Write-Host "  cline1"
Write-Host "The command checks for Cline CLI and offers to install it when missing."
