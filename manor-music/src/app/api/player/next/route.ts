import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { broadcast } from '@/lib/realtime';

// The player calls this when it needs the next track.
// 1) Mark whatever was previously playing as ended.
// 2) Promote the next pending queue item (lowest position) to "playing".
// 3) Log a Play row for history.
// If the queue is empty, the response is null and the player should fall back
// to its active station (auto-DJ). Station logic lives in a follow-up endpoint.

function authed(req: NextRequest) {
  const key = req.headers.get('x-player-key');
  return !!key && key === process.env.PLAYER_API_KEY;
}

export async function POST(req: NextRequest) {
  if (!authed(req)) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  await db.queueItem.updateMany({
    where: { startedAt: { not: null }, endedAt: null },
    data: { endedAt: new Date() },
  });
  await db.play.updateMany({
    where: { endedAt: null },
    data: { endedAt: new Date() },
  });

  const next = await db.queueItem.findFirst({
    where: { startedAt: null, removedAt: null },
    orderBy: { position: 'asc' },
    include: { song: true },
  });

  if (!next) {
    await broadcast({ type: 'now-playing', songId: null });
    return NextResponse.json({ track: null });
  }

  const now = new Date();
  const [updated] = await Promise.all([
    db.queueItem.update({ where: { id: next.id }, data: { startedAt: now } }),
    db.play.create({
      data: {
        songId: next.songId,
        customerId: next.customerId,
        source: next.source,
        startedAt: now,
      },
    }),
    db.song.update({ where: { id: next.songId }, data: { lastPlayedAt: now } }),
  ]);

  await broadcast({ type: 'now-playing', songId: next.songId });

  return NextResponse.json({
    track: {
      queueItemId: updated.id,
      songId: next.song.id,
      filePath: next.song.filePath,
      videoPath: next.song.videoPath,
      title: next.song.title,
      artist: next.song.artist,
      durationSec: next.song.durationSec,
    },
  });
}
