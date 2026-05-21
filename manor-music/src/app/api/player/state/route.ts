import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// Player polls this every second-ish to learn:
//   - desired playback state (PLAYING / PAUSED) + volume
//   - which song the DB thinks should be playing right now
//
// If `expectedSongId` differs from what the player is actually playing, the
// player kills its mpv process so the next tick fetches the new track. This
// is what makes "Play Now" / Skip take effect immediately instead of waiting
// for the current audio file to finish.
function authed(req: NextRequest) {
  const key = req.headers.get('x-player-key');
  return !!key && key === process.env.PLAYER_API_KEY;
}

export async function GET(req: NextRequest) {
  if (!authed(req)) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  const [s, np] = await Promise.all([
    db.settings.findUnique({
      where: { id: 'singleton' },
      select: { playbackState: true, playbackVolume: true },
    }),
    db.queueItem.findFirst({
      where: { startedAt: { not: null }, endedAt: null, removedAt: null },
      orderBy: { startedAt: 'desc' },
      select: { songId: true },
    }),
  ]);
  return NextResponse.json({
    playbackState: s?.playbackState ?? 'PLAYING',
    playbackVolume: s?.playbackVolume ?? 80,
    expectedSongId: np?.songId ?? null,
  });
}
