import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// Player polls this every second-ish to learn the desired playback state.
// Cheap query against a single Settings row.
function authed(req: NextRequest) {
  const key = req.headers.get('x-player-key');
  return !!key && key === process.env.PLAYER_API_KEY;
}

export async function GET(req: NextRequest) {
  if (!authed(req)) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  const s = await db.settings.findUnique({
    where: { id: 'singleton' },
    select: { playbackState: true, playbackVolume: true },
  });
  return NextResponse.json({
    playbackState: s?.playbackState ?? 'PLAYING',
    playbackVolume: s?.playbackVolume ?? 80,
  });
}
