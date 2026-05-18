import { redirect } from 'next/navigation';
import { BrandHeader } from '@/components/Brand';
import { currentCustomerId } from '@/lib/session';
import { db } from '@/lib/db';
import { MyQueueClient } from './MyQueueClient';

export const dynamic = 'force-dynamic';

export default async function MyQueuePage() {
  const customerId = await currentCustomerId();
  if (!customerId) redirect('/auth');

  const [queueItems, recentPlays] = await Promise.all([
    db.queueItem.findMany({
      where: { customerId, removedAt: null, endedAt: null },
      orderBy: { position: 'asc' },
      include: { song: { select: { title: true, artist: true } } },
    }),
    db.play.findMany({
      where: { customerId },
      orderBy: { startedAt: 'desc' },
      take: 10,
      include: { song: { select: { title: true, artist: true } } },
    }),
  ]);

  // Compute global position (where each of my items sits in the full queue)
  const allPending = await db.queueItem.findMany({
    where: { startedAt: null, removedAt: null },
    orderBy: { position: 'asc' },
    select: { id: true },
  });
  const positionMap = new Map(allPending.map((q, i) => [q.id, i + 1]));

  return (
    <main className="mx-auto max-w-md px-4 pb-24">
      <BrandHeader subtitle="My picks" />
      <MyQueueClient
        initial={{
          pending: queueItems.map((q) => ({
            id: q.id,
            title: q.song.title,
            artist: q.song.artist,
            location: q.location,
            globalPosition: positionMap.get(q.id) ?? null,
            isPlaying: !!q.startedAt,
          })),
          recent: recentPlays.map((p) => ({
            id: p.id,
            title: p.song.title,
            artist: p.song.artist,
            startedAt: p.startedAt.toISOString(),
          })),
        }}
      />
    </main>
  );
}
