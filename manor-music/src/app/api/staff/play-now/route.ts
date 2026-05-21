import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { isAdmin } from '@/lib/auth-admin';
import { broadcast } from '@/lib/realtime';

const Body = z.object({ songId: z.string().min(1) });

// "Play now" — end the currently playing track immediately, jump this song to
// the front of the queue. The player will pick it up on its next /api/player/next
// poll (~1 second). Bypasses cooldown/explicit rules since staff is in control.
export async function POST(req: NextRequest) {
  if (!(await isAdmin())) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: 'Invalid' }, { status: 400 });

  const song = await db.song.findUnique({ where: { id: parsed.data.songId } });
  if (!song) return NextResponse.json({ error: 'Song not found' }, { status: 404 });
  if (song.filePath.startsWith('__missing:')) {
    return NextResponse.json({ error: 'Song file missing from library' }, { status: 400 });
  }

  // End the current track. The player polls /api/player/next every second and
  // will see it ended on the next cycle.
  await db.queueItem.updateMany({
    where: { startedAt: { not: null }, endedAt: null, removedAt: null },
    data: { endedAt: new Date(), skippedAt: new Date() },
  });

  // Insert this track at position 0 so it's the first un-started item.
  const firstPending = await db.queueItem.findFirst({
    where: { startedAt: null, removedAt: null },
    orderBy: { position: 'asc' },
    select: { position: true },
  });
  const newPosition = (firstPending?.position ?? 1) - 1;

  const item = await db.queueItem.create({
    data: {
      songId: song.id,
      source: 'STAFF',
      position: newPosition,
    },
  });

  await broadcast({ type: 'queue:updated' });
  return NextResponse.json({ ok: true, queueItemId: item.id });
}
