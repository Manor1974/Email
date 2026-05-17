# 15-minute Vercel deploy

Hardware is ordered. This is the fastest path to a live, working app
the moment the mini PC arrives.

## 1. Create a Neon Postgres database (3 min)

1. https://neon.tech → sign in → **New project** `manor-music`.
2. Region: pick the one closest to your venue.
3. Copy the **pooled connection string** (looks like
   `postgres://...@ep-...neon.tech/.../?sslmode=require`).
4. Hold onto it — you'll paste into Vercel in step 4.

## 2. Create a Pusher Channels app (2 min)

1. https://pusher.com → **Channels** → new app `manor-music`.
2. Cluster: `us2` (or closest).
3. Copy `app_id`, `key`, `secret`, `cluster`.

## 3. Twilio (already done)

You already have a Twilio account. From the console:

1. Copy your **Account SID** and **Auth Token**.
2. Either rent a new number or reuse an existing SMS-capable one.

## 4. Vercel project (5 min)

1. https://vercel.com → **Add new → Project** → import `manor1974/email`.
2. **Root Directory**: `manor-music`.
3. Framework Preset: Next.js (auto-detected).
4. **Environment Variables** — add all of these:

   | Name | Value |
   |------|-------|
   | `DATABASE_URL` | Neon connection string from step 1 |
   | `TWILIO_ACCOUNT_SID` | from Twilio console |
   | `TWILIO_AUTH_TOKEN` | from Twilio console |
   | `TWILIO_FROM_NUMBER` | your Twilio number, in `+15551234567` format |
   | `PUSHER_APP_ID` | from step 2 |
   | `PUSHER_KEY` | from step 2 |
   | `PUSHER_SECRET` | from step 2 |
   | `PUSHER_CLUSTER` | `us2` (or whatever you chose) |
   | `NEXT_PUBLIC_PUSHER_KEY` | same as `PUSHER_KEY` |
   | `NEXT_PUBLIC_PUSHER_CLUSTER` | same as `PUSHER_CLUSTER` |
   | `SESSION_SECRET` | run `openssl rand -hex 32` and paste the result |
   | `ADMIN_PIN` | a 6+ digit PIN you'll memorize |
   | `PLAYER_API_KEY` | run `openssl rand -hex 32` and paste the result |

5. Click **Deploy**. The build runs `prisma migrate deploy` automatically,
   creating all tables in Neon.

6. After first deploy, run the seed once (from your laptop):
   ```bash
   cd manor-music
   DATABASE_URL="paste-the-neon-url" npx tsx prisma/seed.ts
   ```
   This populates default settings, an "All Music" station, and a Fri/Sat
   9pm-2am explicit-lyrics window. You can edit any of these from
   `/admin/schedule` and `/admin/stations` later.

## 5. Smoke test (2 min)

Visit your Vercel URL on your phone:

- Tap **Search** → type any 2 letters → you'll get nothing (library is empty until you scan)
- Tap **Sign in to queue songs** → enter your phone → you should receive a code via Twilio
- Verify the code → you're signed in
- Visit `/admin/login` → enter your PIN → you should land on the admin dashboard

If all four work, your Vercel + Neon + Pusher + Twilio chain is healthy.

## 6. When the mini PC arrives

Follow `setup-windows.md`. The only Vercel-side thing you'll need is the
`PLAYER_API_KEY` value, which you'll paste into the `ManorPlayer` service's
environment variables when registering it with `nssm`.

## Custom domain (optional)

If you want `jukebox.manorlanes.com` instead of `your-project.vercel.app`:

1. Vercel project → **Domains** → add `jukebox.manorlanes.com`.
2. In your DNS provider, add the CNAME record Vercel shows you.
3. Update QR codes printed at lanes/tables to use the new domain.

## Troubleshooting first deploy

| Error | Fix |
|---|---|
| Build fails on `prisma migrate deploy` | Double-check `DATABASE_URL` is the **pooled** Neon connection string, not the direct one. |
| First SMS doesn't arrive | Twilio dashboard → Logs → check delivery status. Make sure the from-number is SMS-capable. |
| `/api/auth/start` returns 500 | Twilio creds wrong, or `TWILIO_FROM_NUMBER` not in `+15551234567` format. |
| Admin login does nothing | `ADMIN_PIN` env var missing. |
