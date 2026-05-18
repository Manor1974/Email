import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { currentCustomerId } from '@/lib/session';

export async function GET() {
  const customerId = await currentCustomerId();
  if (!customerId) return NextResponse.json({ error: 'sign in required' }, { status: 401 });

  const [pending, allPending] = await Promise.all([
    db.queueItem.findMany({
      where: { customerId, removedAt: null, endedAt: null },
      orderBy: { position: 'asc' },
      include: { song: { select: { title: true, artist: true } } },
    }),
    db.queueItem.findMany({
      where: { startedAt: null, removedAt: null },
      orderBy: { position: 'asc' },
      select: { id: true },
    }),
  ]);
  const positionMap = new Map(allPending.map((q, i) => [q.id, i + 1]));

  return NextResponse.json({
    pending: pending.map((q) => ({
      id: q.id,
      title: q.song.title,
      artist: q.song.artist,
      location: q.location,
      globalPosition: positionMap.get(q.id) ?? null,
      isPlaying: !!q.startedAt,
    })),
  });
}
