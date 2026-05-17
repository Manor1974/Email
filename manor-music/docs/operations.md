# Day-2 operations

## Adding new music

1. RDP into the mini PC (or use the keyboard at the venue).
2. Drop new files into the library folder:
   - Audio: `D:\library\<Artist>\<Title>.mp3` (Promo Only's default layout works as-is).
   - Music videos: same folder, same base name, `.mp4`.
3. Run the scanner: `npm run scan` from the project folder, or use the
   desktop shortcut.
4. Any open customer requests that match the new music get auto-fulfilled
   and the customers receive an SMS.

## Blocking a song

- Customer or staff search finds the song → admin only sees a "Block" button.
- Or use `/admin/blocklist` to manage existing blocks.

## Adjusting the explicit-lyrics schedule

`/admin/schedule` — set per-day windows (e.g. Fri–Sat 21:00 → 02:00). Outside
those windows the system serves the clean version of any track that has one,
and hides explicit-only tracks from search entirely.

Override modes:
- **AUTO** — follow the schedule (default).
- **FORCE_CLEAN** — never play explicit, no matter the time.
- **FORCE_EXPLICIT** — always allow explicit (e.g. private adult event).

## Reading the reports

`/admin/reports`:
- **Top songs (7 / 30 days)** — what's actually popular.
- **Heatmap** — which days/hours have the most queueing activity. Useful for
  planning specials, staffing, etc.
- **Most-requested unfulfilled** — the highest-leverage music to buy next.

## Common issues

| Symptom | Fix |
|---|---|
| Player not advancing | RDP in, check `Get-Content C:\ProgramData\nssm\ManorPlayer-stdout.log -Wait`. Look for network errors. |
| Music videos playing on wrong TV | That's the AV matrix routing — handled outside this app. Check your matrix's routing presets. |
| Customer gets "explicit not allowed" | Either the song has no clean version in the library, or the schedule's wrong. Check `/admin/schedule`. |
| Queue stuck on a song that won't end | `/admin/queue` → Skip. The player polls every 1.5s and will pick up the next track. |
| New music not appearing | Run `npm run scan`. Check the scan output for errors per file. |
| Customer can't sign in | Twilio dashboard → check delivery status. If their carrier is blocking, add their phone manually via Prisma Studio (`npm run db:studio`). |
