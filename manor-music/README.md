# Manor Lanes Jukebox

A customer-driven music + video system for Manor Lanes that replaces a paid
background-music service. Customers queue songs from a branded PWA they install
on their home screen; staff DJ a full venue from the touchscreen console; the
mini-PC player drives audio to your mixer and music videos to your AV matrix.

## What's in here

```
manor-music/
├── src/app/                  Next.js app (customer PWA + staff + admin)
│   ├── (customer pages)      /, /search, /request, /auth
│   ├── staff/                /staff — touchscreen DJ console
│   ├── admin/                /admin — queue, blocklist, schedule, requests, reports, settings
│   └── api/                  REST endpoints (search, queue, auth, admin, player, etc.)
├── prisma/schema.prisma      Postgres data model
├── scanner/                  Library scanner (walks LIBRARY_PATH → DB)
├── player/                   Mini-PC daemon (polls /api/player/next, plays via mpv)
└── docs/
    ├── setup-windows.md      Mini-PC + kiosk-mode install
    ├── deployment.md         Web app + database hosting
    └── operations.md         Day-2 ops: scanning new music, troubleshooting
```

## Quick start (dev)

```bash
# 1. Install
cd manor-music
npm install

# 2. Configure
cp .env.example .env
# fill in DATABASE_URL, TWILIO_*, etc.

# 3. Database
npm run db:push

# 4. Run the web app
npm run dev   # http://localhost:3000

# 5. Ingest a music folder (optional, requires LIBRARY_PATH)
LIBRARY_PATH=/path/to/promo-only npm run scan

# 6. Run the player (separate terminal; requires `mpv` on PATH)
SERVER_URL=http://localhost:3000 PLAYER_API_KEY=... npm run player
```

## Production

See `docs/deployment.md` for the recommended setup:

- **Web app**: Vercel (free tier is enough)
- **Database**: Neon or Supabase Postgres (~$0–25/mo)
- **Mini PC**: Beelink SER5 running Windows 11 Pro in kiosk mode
- **SMS**: Twilio
- **Realtime**: Pusher Channels (free tier — 200k messages/day)

Total ongoing cost: ~$20–40/mo.

## Features

- Customer PWA installable on iOS + Android, phone-number sign-in via Twilio
- Search by title / artist / album; "Request this song" if no match
- Per-customer queue limits, song cooldown, artist cooldown
- Per-day "explicit lyrics allowed" schedule (auto-swaps in clean versions)
- Staff DJ console: browse by genre / decade, queue and station tracks
- Admin: queue control, blocklist, schedule, requests inbox, reports, settings
- Reports: top songs (7/30 days), day-of-week × hour-of-day heatmap,
  most-requested unfulfilled songs
- Music video support — videos auto-link to their audio track via filename;
  any track with a video is flagged in the UI and plays full-screen on HDMI
- Library scanner detects clean ↔ explicit pairs and notifies via SMS when a
  previously-requested song lands in the library
