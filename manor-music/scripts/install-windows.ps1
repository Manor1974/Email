# Manor Lanes Jukebox — one-shot Windows installer.
#
# Run from an elevated PowerShell prompt on the mini PC:
#
#   Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass -Force
#   .\install-windows.ps1
#
# What it does:
#   1. Installs node, git, mpv, nssm (via winget) if missing
#   2. Clones the repo to C:\manor-music
#   3. Prompts for SERVER_URL + PLAYER_API_KEY and writes .env
#   4. Installs npm deps
#   5. Registers ManorPlayer as an auto-start Windows service
#   6. Drops a kiosk-mode Chrome shortcut into the Startup folder

[CmdletBinding()]
param(
    [string]$ServerUrl,
    [string]$PlayerApiKey,
    [string]$InstallDir = 'C:\manor-music',
    [string]$RepoUrl = 'https://github.com/manor1974/email.git',
    [string]$Branch = 'main'
)

$ErrorActionPreference = 'Stop'

function Step($msg) { Write-Host "==> $msg" -ForegroundColor Cyan }
function Ok($msg)   { Write-Host "    $msg" -ForegroundColor Green }
function Warn($msg) { Write-Host "    $msg" -ForegroundColor Yellow }

Step 'Verifying admin rights'
if (-not ([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole] 'Administrator')) {
    throw 'Run this script from an elevated PowerShell prompt.'
}
Ok 'admin'

Step 'Installing dependencies (winget)'
$pkgs = @(
    @{ id = 'OpenJS.NodeJS.LTS';     test = { Get-Command node    -ErrorAction SilentlyContinue } },
    @{ id = 'Git.Git';                test = { Get-Command git     -ErrorAction SilentlyContinue } },
    @{ id = 'mpv.net';                test = { Get-Command mpv     -ErrorAction SilentlyContinue } },
    @{ id = 'NSSM.NSSM';              test = { Get-Command nssm    -ErrorAction SilentlyContinue } },
    @{ id = 'Google.Chrome';          test = { Test-Path "$env:ProgramFiles\Google\Chrome\Application\chrome.exe" } }
)
foreach ($p in $pkgs) {
    if (& $p.test) { Ok "$($p.id) already present" }
    else {
        Step "  installing $($p.id)"
        winget install --id $p.id --silent --accept-source-agreements --accept-package-agreements
    }
}

# Refresh PATH so freshly-installed CLIs are reachable in this session.
$env:Path = [Environment]::GetEnvironmentVariable('Path', 'Machine') + ';' + [Environment]::GetEnvironmentVariable('Path', 'User')

Step "Cloning repo into $InstallDir"
if (Test-Path $InstallDir) {
    Ok 'directory exists — pulling latest'
    Push-Location $InstallDir
    git fetch --all
    git checkout $Branch
    git pull
    Pop-Location
} else {
    git clone --branch $Branch $RepoUrl $InstallDir
}

$AppDir = Join-Path $InstallDir 'manor-music'
if (-not (Test-Path $AppDir)) { throw "Expected $AppDir not found after clone" }

Step 'Configuring .env'
$envFile = Join-Path $AppDir '.env'
if (-not $ServerUrl)     { $ServerUrl     = Read-Host 'SERVER_URL (your Vercel production URL, e.g. https://manor-jukebox.vercel.app)' }
if (-not $PlayerApiKey)  { $PlayerApiKey  = Read-Host 'PLAYER_API_KEY (must match the value set in Vercel)' }
@"
SERVER_URL=$ServerUrl
PLAYER_API_KEY=$PlayerApiKey
"@ | Out-File -FilePath $envFile -Encoding utf8 -Force

Step 'Installing npm dependencies (this takes a few minutes the first time)'
Push-Location $AppDir
npm install --no-audit --no-fund
Pop-Location

Step 'Registering ManorPlayer Windows service'
$nodeExe = (Get-Command node).Source
$tsxEntry = Join-Path $AppDir 'node_modules\tsx\dist\cli.mjs'
$playerEntry = Join-Path $AppDir 'player\src\index.ts'

# Recreate the service to pick up any path/env changes.
& nssm stop    ManorPlayer 2>$null | Out-Null
& nssm remove  ManorPlayer confirm 2>$null | Out-Null
& nssm install ManorPlayer $nodeExe "`"$tsxEntry`" `"$playerEntry`""
& nssm set     ManorPlayer AppDirectory $AppDir
& nssm set     ManorPlayer AppEnvironmentExtra "SERVER_URL=$ServerUrl" "PLAYER_API_KEY=$PlayerApiKey"
& nssm set     ManorPlayer Start SERVICE_AUTO_START
& nssm set     ManorPlayer AppStdout "C:\ProgramData\nssm\ManorPlayer-stdout.log"
& nssm set     ManorPlayer AppStderr "C:\ProgramData\nssm\ManorPlayer-stderr.log"
& nssm set     ManorPlayer AppRotateFiles 1
& nssm set     ManorPlayer AppRotateBytes 10485760
New-Item -ItemType Directory -Path 'C:\ProgramData\nssm' -Force | Out-Null
& nssm start   ManorPlayer
Ok 'ManorPlayer service running'

Step 'Creating kiosk-mode Chrome shortcut'
$chromePath = "$env:ProgramFiles\Google\Chrome\Application\chrome.exe"
$startup = [Environment]::GetFolderPath('Startup')
$shortcutPath = Join-Path $startup 'Manor Lanes Kiosk.lnk'
$wshell = New-Object -ComObject WScript.Shell
$sc = $wshell.CreateShortcut($shortcutPath)
$sc.TargetPath = $chromePath
$sc.Arguments  = "--kiosk --kiosk-printing --no-first-run --disable-pinch --overscroll-history-navigation=0 --app=$ServerUrl/staff"
$sc.Save()
Ok "shortcut written to $shortcutPath"

Step 'Scheduling Windows Update active hours (02:00 - 06:00)'
try {
    Set-ItemProperty -Path 'HKLM:\SOFTWARE\Microsoft\WindowsUpdate\UX\Settings' -Name ActiveHoursStart -Value 6
    Set-ItemProperty -Path 'HKLM:\SOFTWARE\Microsoft\WindowsUpdate\UX\Settings' -Name ActiveHoursEnd -Value 2
    Ok 'active hours updated'
} catch {
    Warn 'could not update Windows Update active hours — set manually in Settings.'
}

Write-Host ''
Write-Host '======================================================================' -ForegroundColor Green
Write-Host '  Manor Lanes Jukebox is installed.' -ForegroundColor Green
Write-Host '======================================================================' -ForegroundColor Green
Write-Host ''
Write-Host 'Verify:' -ForegroundColor White
Write-Host '  - nssm status ManorPlayer        (should say SERVICE_RUNNING)'
Write-Host '  - Get-Content C:\ProgramData\nssm\ManorPlayer-stdout.log -Wait'
Write-Host '  - Reboot.  The PC should auto-login and open the staff console full-screen.'
Write-Host ''
Write-Host 'Drop new music into the library, then run:' -ForegroundColor White
Write-Host "  cd $AppDir; npm run scan"
Write-Host ''
