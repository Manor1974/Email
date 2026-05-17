# Mini-PC setup (Windows 11 Pro)

Target hardware: Beelink SER5 (Ryzen 5 5500U, 16GB, 500GB) + USB DAC + a
touchscreen on the second display output. The PC outputs HDMI to your AV
matrix (for music videos) and 3.5mm/USB-DAC to your mixer (for audio).

This is the "appliance" setup: the PC boots straight into the player and the
staff DJ console, with nothing else running.

## 1. Out-of-box Windows setup

1. First boot: pick the local-account option (no Microsoft account). Name it
   `manor` with a strong password.
2. Settings → System → Power: **Never sleep**, **never turn off screen** when
   plugged in.
3. Settings → System → Display: identify which output is HDMI (matrix) and
   which is the touchscreen. Set the touchscreen as **Primary**.
4. Settings → Update: install all pending updates, then change **Active hours**
   to 02:00 → 06:00 so Windows never reboots during venue hours.
5. Settings → Sound: select the USB DAC as the **default output**. Test it.

## 2. Enable Remote Desktop

Settings → System → Remote Desktop → On. Note the PC name; set up a static IP
on your network so you can RDP in to drop new music or troubleshoot.

## 3. Install dependencies

Open PowerShell as Administrator:

```powershell
# Node.js LTS, Git, and mpv (the audio/video engine)
winget install OpenJS.NodeJS.LTS Git.Git mpv.net

# Optional: a lightweight Postgres viewer if running the DB locally
# winget install dbeaver.dbeaver
```

Verify:

```powershell
node --version       # v20.x or newer
mpv --version
```

## 4. Pull the app

```powershell
cd C:\
git clone https://github.com/manor1974/email.git C:\manor-music
cd C:\manor-music\manor-music
npm install
```

Create `C:\manor-music\manor-music\.env` with your production values
(copy `.env.example` as a starting point).

## 5. Install the player as a Windows service

We use [nssm](https://nssm.cc/) to run the player on boot and restart it on
crash.

```powershell
winget install nssm.nssm

# Register the player service
nssm install ManorPlayer "C:\Program Files\nodejs\node.exe" `
  "C:\manor-music\manor-music\node_modules\tsx\dist\cli.mjs C:\manor-music\manor-music\player\src\index.ts"

nssm set ManorPlayer AppDirectory C:\manor-music\manor-music
nssm set ManorPlayer AppEnvironmentExtra `
  SERVER_URL=https://YOUR-VERCEL-DOMAIN `
  PLAYER_API_KEY=YOUR_PLAYER_API_KEY
nssm set ManorPlayer Start SERVICE_AUTO_START
nssm start ManorPlayer
```

Check the player log:

```powershell
Get-Content "C:\ProgramData\nssm\ManorPlayer-stdout.log" -Wait
```

## 6. Kiosk mode for the staff DJ console

We want Chrome to launch full-screen at boot and show the staff console.

1. Create a desktop shortcut to:

   ```
   "C:\Program Files\Google\Chrome\Application\chrome.exe"
     --kiosk
     --kiosk-printing
     --no-first-run
     --disable-pinch
     --overscroll-history-navigation=0
     --app=https://YOUR-VERCEL-DOMAIN/staff
   ```

2. Press `Win+R` → `shell:startup` → drop the shortcut there.

3. Auto-login (so the PC boots straight to the console without a password
   prompt):

   ```powershell
   netplwiz
   ```

   Uncheck **Users must enter a user name and password**, enter the password
   when prompted.

Reboot. The PC should come up showing the staff console in full screen, with
the player service already running in the background.

## 7. Exit kiosk mode (for admin use)

`Ctrl+W` closes the Chrome window. From there you can use the PC normally,
or `Win+L` to lock it and RDP in remotely.

## 8. Drop new music

Either:

- RDP in, copy MP3s to `D:\library\...`, then from PowerShell:
  ```powershell
  cd C:\manor-music\manor-music
  npm run scan
  ```
- Or set up a Windows shortcut on the desktop that runs `npm run scan` so
  bartenders can re-scan after dropping a USB stick on the machine.

## 9. Watchdogs

- `ManorPlayer` service restarts mpv if it crashes.
- The player retries on network errors automatically.
- Set Windows Task Scheduler to reboot the PC at 04:00 every Tuesday for hygiene.
