import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { isAdmin } from '@/lib/auth-admin';
import { broadcast } from '@/lib/realtime';

const Body = z.object({ songId: z.string().min(1) });

// "Play next" — insert this song so it plays right after the current track ends.
// Doesn't interrupt the current track. Pushes everything else down one position.
export async function POST(req: NextRequest) {
  if (!(await isAdmin())) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: 'Invalid' }, { status: 400 });

  const song = await db.song.findUnique({ where: { id: parsed.data.songId } });
  if (!song) return NextResponse.json({ error: 'Song not found' }, { status: 404 });
  if (song.filePath.startsWith('__missing:')) {
    return NextResponse.json({ error: 'Song file missing from library' }, { status: 400 });
  }

  // Place it just before the current next-up item.
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
