# Day-2 operations

## Adding new music

1. RDP into the mini PC (or use the keyboard at the venue).
2. Drop new files into the library folder:
   - Audio: `D:\library\<Artist>\<Title>.mp3` (Promo Only's default layout works as-is).
   - Music videos: same folder, same base name, `.mp4`.
3. **No action required** — the `ManorWatcher` service auto-ingests new
   files within ~3 seconds of the copy finishing. If a customer had
   requested that song, they get an SMS the moment it's available.
4. If you ever need to force a full re-scan (e.g. after restoring from a
   backup), run `npm run scan` from the project folder.

## Up-next SMS notifications

When the currently-playing track ends and the next song in the queue starts,
the customer who added that next track gets an SMS — so they can step away
from the lanes/bar and not miss their pick. Each queue item is notified at
most once.

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

## Per-zone explicit-lyrics overrides

`/admin/schedule` → "Per-zone overrides" section. Layer on top of the global
schedule:

- **Bar** — `Always allow explicit` (adults only)
- **Volleyball Court 1–4** — `Always clean` (families)
- **Lane 1–16** — leave unset; follows the global Fri/Sat 9pm–2am schedule

When a customer at `Bar` queues a song, the rules check the zone override
first, then fall back to global. So the same explicit track gets the explicit
audio when queued from the bar and the clean version when queued from a
volleyball court — at the same instant.

## Playback control (pause / volume / skip)

`/admin/playback` from a phone or tablet:

- Big pause/play button — stops the current track in place (doesn't lose the
  queue).
- Skip — ends the current track and advances.
- Volume slider — applies live via mpv IPC, changes audible within ~1 second.

Use cases:
- Pause for an announcement, resume after.
- Slap volume to 30 during last call.
- Skip the song someone queued by mistake.

## Customer self-service

Signed-in customers can hit `/my-queue` (or tap "My picks" on the home page) to:
- See their pending songs and their global queue position.
- Cancel any song they queued before it starts playing.
- See their last 10 plays.

This cuts down on "can you remove my song?" asks at the bar.

## Pre-shift health check

`/admin/health` runs through everything in one screen:

- Database connectivity
- Library size
- Settings + active station
- Player heartbeat freshness
- Twilio + Pusher credentials present

Refresh-on-demand, with an 8-second auto-poll. Run this before opening doors
to catch a dead player or missing config in 5 seconds.

## Common issues

| Symptom | Fix |
|---|---|
| Player not advancing | RDP in, check `Get-Content C:\ProgramData\nssm\ManorPlayer-stdout.log -Wait`. Look for network errors. |
| Music videos playing on wrong TV | That's the AV matrix routing — handled outside this app. Check your matrix's routing presets. |
| Customer gets "explicit not allowed" | Either the song has no clean version in the library, or the schedule's wrong. Check `/admin/schedule`. |
| Queue stuck on a song that won't end | `/admin/queue` → Skip. The player polls every 1.5s and will pick up the next track. |
| New music not appearing | Run `npm run scan`. Check the scan output for errors per file. |
| Customer can't sign in | Twilio dashboard → check delivery status. If their carrier is blocking, add their phone manually via Prisma Studio (`npm run db:studio`). |
