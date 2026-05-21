# SER5 lockdown (run when interface is stable)

When to apply this: once the customer-facing app and admin panel are dialled
in and you're done iterating on layout/features. Before opening night, after
all the on-site reboot tests pass.

Goal: stop curious staff from poking around in Windows folders, Settings,
Control Panel, or browsing the web on the SER5's touchscreen — without
breaking your Splashtop maintenance workflow.

## Why this comes later

The lockdown blocks Win+E, Win+R, Task Manager, and right-click context menus.
If we apply it too early, you'll be hindered every time you want to tweak
something on the local machine instead of via Splashtop. Once the venue
workflow is settled, apply once and forget.

## What it does and doesn't block

Employees can't:
- Press Win+R to open the Run dialog
- Press Win+E to open File Explorer
- Open Task Manager (Ctrl+Shift+Esc or via Ctrl+Alt+Del)
- Open Control Panel or Settings
- Right-click the desktop or taskbar for context menus
- Type a non-jukebox URL into Chrome (URL allowlist)
- Open incognito mode or DevTools (F12)
- Close Chrome and stay closed — a watcher auto-relaunches the kiosk in ~4 seconds

Splashtop still works because the Splashtop Streamer runs as a SYSTEM
service, completely independent of the manor user's policies.

## The script

Run from elevated PowerShell on the SER5:

```powershell
# === STAFF LOCKDOWN ===

# 1. Block File Explorer / Run / right-click context menus for the manor user
$polExplorer = 'HKCU:\Software\Microsoft\Windows\CurrentVersion\Policies\Explorer'
New-Item -Path $polExplorer -Force | Out-Null
Set-ItemProperty -Path $polExplorer -Name 'NoRun' -Value 1 -Type DWord
Set-ItemProperty -Path $polExplorer -Name 'NoControlPanel' -Value 1 -Type DWord
Set-ItemProperty -Path $polExplorer -Name 'NoFolderOptions' -Value 1 -Type DWord
Set-ItemProperty -Path $polExplorer -Name 'NoDesktop' -Value 1 -Type DWord
Set-ItemProperty -Path $polExplorer -Name 'NoSetTaskbar' -Value 1 -Type DWord
Set-ItemProperty -Path $polExplorer -Name 'NoSetFolders' -Value 1 -Type DWord
Set-ItemProperty -Path $polExplorer -Name 'NoFileMenu' -Value 1 -Type DWord
Set-ItemProperty -Path $polExplorer -Name 'NoTrayContextMenu' -Value 1 -Type DWord

# 2. Disable Task Manager and the Ctrl+Alt+Del menu options
$polSys = 'HKCU:\Software\Microsoft\Windows\CurrentVersion\Policies\System'
New-Item -Path $polSys -Force | Out-Null
Set-ItemProperty -Path $polSys -Name 'DisableTaskMgr' -Value 1 -Type DWord
Set-ItemProperty -Path $polSys -Name 'DisableLockWorkstation' -Value 1 -Type DWord
Set-ItemProperty -Path $polSys -Name 'DisableChangePassword' -Value 1 -Type DWord

# 3. Chrome URL allowlist — only jukebox + Pusher domains load
$chromeKey = 'HKLM:\SOFTWARE\Policies\Google\Chrome'
$allow = "$chromeKey\URLAllowlist"
$block = "$chromeKey\URLBlocklist"
New-Item -Path $allow -Force | Out-Null
New-Item -Path $block -Force | Out-Null
Set-ItemProperty -Path $allow -Name '1' -Value '*://*.vercel.app' -Type String
Set-ItemProperty -Path $allow -Name '2' -Value '*://*.manorlanes.com' -Type String
Set-ItemProperty -Path $allow -Name '3' -Value '*://*.pusher.com' -Type String
Set-ItemProperty -Path $block -Name '1' -Value '*' -Type String
Set-ItemProperty -Path $chromeKey -Name 'IncognitoModeAvailability' -Value 1 -Type DWord
Set-ItemProperty -Path $chromeKey -Name 'DeveloperToolsAvailability' -Value 2 -Type DWord
Set-ItemProperty -Path $chromeKey -Name 'BrowserAddPersonEnabled' -Value 0 -Type DWord

# 4. Kiosk watcher — re-launches Chrome kiosk if employee closes it
$watcherPath = 'C:\manor-music\kiosk-watcher.ps1'
$envFile = 'C:\manor-music\manor-music\.env'
$serverUrl = ((Get-Content $envFile | Select-String '^SERVER_URL=').ToString() -replace '^SERVER_URL=','').Trim()
@"
`$chrome = '$env:ProgramFiles\Google\Chrome\Application\chrome.exe'
`$args = '--kiosk --kiosk-printing --no-first-run --app=$serverUrl/staff'
while (`$true) {
    if (-not (Get-Process chrome -ErrorAction SilentlyContinue)) {
        Start-Process -FilePath `$chrome -ArgumentList `$args
        Start-Sleep -Seconds 4
    }
    Start-Sleep -Seconds 2
}
"@ | Out-File -FilePath $watcherPath -Encoding utf8 -Force

schtasks /Delete /TN "ManorKioskWatcher" /F 2>&1 | Out-Null
schtasks /Create /TN "ManorKioskWatcher" /SC ONLOGON /RL HIGHEST `
    /TR "powershell.exe -WindowStyle Hidden -ExecutionPolicy Bypass -File `"$watcherPath`"" /F | Out-Null

# === MAINTENANCE BACKDOOR (for YOUR Splashtop access) ===
$desktop = [Environment]::GetFolderPath('CommonDesktopDirectory')
$shortcutPath = Join-Path $desktop '.maintenance.lnk'
$wshell = New-Object -ComObject WScript.Shell
$sc = $wshell.CreateShortcut($shortcutPath)
$sc.TargetPath = 'powershell.exe'
$sc.Arguments  = '-NoExit -ExecutionPolicy Bypass -Command "Set-Location C:\manor-music\manor-music; Write-Host ''Manor maintenance shell. exit-kiosk | restart-services'' -ForegroundColor Cyan; function exit-kiosk { Stop-Process -Name chrome -Force -ErrorAction SilentlyContinue; schtasks /End /TN ManorKioskWatcher 2>$null }; function restart-services { nssm restart ManorPlayer; nssm restart ManorWatcher }"'
$sc.WorkingDirectory = 'C:\manor-music\manor-music'
$sc.IconLocation = 'powershell.exe,0'
$sc.Save()
$file = Get-Item $shortcutPath -Force
$file.Attributes = $file.Attributes -bor [System.IO.FileAttributes]::Hidden

Write-Host ''
Write-Host '==> Lockdown applied. Reboot to fully activate.' -ForegroundColor Green
```

## After running

1. Reboot the SER5.
2. Confirm Chrome auto-launches in kiosk mode at /staff.
3. From the touchscreen: try Win+R (nothing), try Ctrl+Shift+Esc (nothing),
   try closing Chrome with Alt+F4 (relaunches in ~4 seconds).
4. From your laptop via Splashtop: confirm you can still connect, see the
   screen, and find `.maintenance.lnk` in the Public desktop folder.

## Your maintenance flow via Splashtop

1. Connect via Splashtop as usual.
2. To run shell commands: navigate to `C:\Users\Public\Desktop\` (you may need
   to enable "show hidden items" in File Explorer's View menu on the local
   machine first time) and double-click `.maintenance.lnk`.
3. PowerShell opens with two helper functions:
   - `exit-kiosk` — kills Chrome and stops the watcher so you can work without
     Chrome relaunching every 4 seconds.
   - `restart-services` — restarts ManorPlayer + ManorWatcher in one shot.
4. To add music without touching the screen: use Splashtop's File Transfer
   feature to drag files into `D:\library`. ManorWatcher ingests them
   automatically — you never need to touch File Explorer on the SER5.

## Rollback

```powershell
Remove-Item 'HKCU:\Software\Microsoft\Windows\CurrentVersion\Policies\Explorer' -Recurse -Force -ErrorAction SilentlyContinue
Remove-Item 'HKCU:\Software\Microsoft\Windows\CurrentVersion\Policies\System' -Recurse -Force -ErrorAction SilentlyContinue
Remove-Item 'HKLM:\SOFTWARE\Policies\Google\Chrome' -Recurse -Force -ErrorAction SilentlyContinue
schtasks /Delete /TN "ManorKioskWatcher" /F
Restart-Computer
```
