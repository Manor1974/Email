# Deployment

The recommended production setup splits responsibilities across managed
services so nothing breaks when the venue's internet drops briefly.

## Topology

```
            ┌──────────────────────────┐
            │ Customer phones          │  Internet
            │ (PWA, installed)         │ ──────────┐
            └──────────────────────────┘            │
                                                    ▼
                                       ┌──────────────────────┐
                                       │ Vercel               │
                                       │ Next.js app          │
                                       │ + Pusher Channels    │──── Twilio ─→ SMS
                                       └──────────┬───────────┘
                                                  │
                                       ┌──────────▼───────────┐
                                       │ Neon Postgres        │
                                       └──────────┬───────────┘
                                                  │ /api/player/next
                                                  ▼
                                       ┌──────────────────────┐
                                       │ Mini PC at venue     │ ─→ Audio: mixer
                                       │ player + scanner     │ ─→ Video: HDMI → matrix → TVs
                                       │ local library on SSD │
                                       └──────────────────────┘
```

## 1. Postgres (Neon)

1. https://neon.tech → new project `manor-music`.
2. Copy the pooled connection string → `DATABASE_URL`.
3. Locally:
   ```bash
   DATABASE_URL=... npx prisma db push
   ```

## 2. Vercel

1. Connect this GitHub repo (`manor1974/email`).
2. Project root: `manor-music`.
3. Environment variables (set in Vercel dashboard):
   - `DATABASE_URL`
   - `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_FROM_NUMBER`
   - `PUSHER_APP_ID`, `PUSHER_KEY`, `PUSHER_SECRET`, `PUSHER_CLUSTER`
   - `NEXT_PUBLIC_PUSHER_KEY`, `NEXT_PUBLIC_PUSHER_CLUSTER`
   - `SESSION_SECRET` (32+ random bytes; `openssl rand -hex 32`)
   - `ADMIN_PIN` (e.g. 6-digit number; longer is better)
   - `PLAYER_API_KEY` (32+ random bytes; the mini PC uses this to authenticate)
4. Deploy. Note the production URL.

## 3. Pusher Channels

1. https://pusher.com → new Channels app, choose cluster `us2` (or closest).
2. Copy `app_id`, `key`, `secret`, `cluster` to Vercel env vars above.
3. Free tier handles 200k messages/day — more than enough for a single venue.

## 4. Twilio

1. Use your existing Twilio account.
2. Either rent a number or use Messaging Services. Drop SID, auth token, and
   sending number into Vercel env vars.

## 5. Mini PC

See `setup-windows.md`. Point its `SERVER_URL` env var at your Vercel
production URL.

## 6. Install the customer PWA

Print QR codes at each lane / table linking to `https://YOUR-DOMAIN`. iOS
users tap **Share → Add to Home Screen**; Android users get an install prompt
automatically.

## Cost estimate (monthly)

| Service       | Cost |
|---------------|------|
| Vercel hobby  | $0 |
| Neon free     | $0 (or ~$19 for production tier) |
| Pusher free   | $0 |
| Twilio        | ~$1 phone number + ~$0.008/SMS |
| **Total**     | ~$10–30/mo depending on SMS volume |

(versus Orangedoor at $40–80/mo)
