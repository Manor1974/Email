import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { isAdmin } from '@/lib/auth-admin';

interface Check {
  name: string;
  status: 'ok' | 'warn' | 'fail';
  detail: string;
}

const PLAYER_TIMEOUT_MS = 60_000;

declare global {
  // We piggyback on the in-memory heartbeat last seen by /api/player/heartbeat.
  // No need to persist this — if the server restarts the player will check in
  // again within 15 seconds.
  // eslint-disable-next-line no-var
  var __manorLastBeat: { at: number; nowPlayingSongId: string | null } | undefined;
}

export async function GET() {
  if (!(await isAdmin())) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const checks: Check[] = [];

  // Database
  try {
    await db.$queryRaw`SELECT 1`;
    checks.push({ name: 'Database', status: 'ok', detail: 'Connected' });
  } catch (e) {
    checks.push({ name: 'Database', status: 'fail', detail: (e as Error).message });
  }

  // Library size
  try {
    const songs = await db.song.count({ where: { blockedAt: null } });
    if (songs === 0) {
      checks.push({ name: 'Library', status: 'warn', detail: 'No songs ingested — run the scanner.' });
    } else {
      checks.push({ name: 'Library', status: 'ok', detail: `${songs.toLocaleString()} playable songs` });
    }
  } catch (e) {
    checks.push({ name: 'Library', status: 'fail', detail: (e as Error).message });
  }

  // Settings + default station
  try {
    const settings = await db.settings.findUnique({ where: { id: 'singleton' } });
    if (!settings) {
      checks.push({ name: 'Settings', status: 'warn', detail: 'Singleton row missing — run the seed.' });
    } else {
      const detail = `volume=${settings.playbackVolume}, state=${settings.playbackState}, cleanMode=${settings.cleanModeOverride}`;
      checks.push({ name: 'Settings', status: 'ok', detail });
    }
    const stations = await db.station.count();
    if (stations === 0) {
      checks.push({ name: 'Stations', status: 'warn', detail: 'No stations defined — auto-DJ disabled.' });
    } else {
      const active = settings?.activeStationId
        ? (await db.station.findUnique({ where: { id: settings.activeStationId } }))?.name
        : null;
      checks.push({
        name: 'Stations',
        status: active ? 'ok' : 'warn',
        detail: active ? `Active: ${active}` : `${stations} defined; none active`,
      });
    }
  } catch (e) {
    checks.push({ name: 'Settings', status: 'fail', detail: (e as Error).message });
  }

  // Player heartbeat
  const beat = globalThis.__manorLastBeat;
  if (!beat) {
    checks.push({ name: 'Player', status: 'warn', detail: 'No heartbeat received yet.' });
  } else {
    const ageMs = Date.now() - beat.at;
    if (ageMs > PLAYER_TIMEOUT_MS) {
      checks.push({
        name: 'Player',
        status: 'fail',
        detail: `Last heartbeat ${Math.round(ageMs / 1000)}s ago — service may be down.`,
      });
    } else {
      checks.push({
        name: 'Player',
        status: 'ok',
        detail: `Heartbeat ${Math.round(ageMs / 1000)}s ago` + (beat.nowPlayingSongId ? ' (playing)' : ' (idle)'),
      });
    }
  }

  // External services
  const twilio = !!(process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN && process.env.TWILIO_FROM_NUMBER);
  checks.push({
    name: 'Twilio',
    status: twilio ? 'ok' : 'warn',
    detail: twilio ? 'Credentials present' : 'Missing env vars — SMS sign-in won\'t work.',
  });

  const pusher = !!(process.env.PUSHER_APP_ID && process.env.PUSHER_KEY && process.env.PUSHER_SECRET);
  checks.push({
    name: 'Pusher',
    status: pusher ? 'ok' : 'warn',
    detail: pusher ? 'Credentials present' : 'Missing env vars — UI falls back to polling.',
  });

  const overall = checks.some((c) => c.status === 'fail')
    ? 'fail'
    : checks.some((c) => c.status === 'warn')
      ? 'warn'
      : 'ok';

  return NextResponse.json({ overall, checks });
}
