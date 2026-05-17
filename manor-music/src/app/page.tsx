import Link from 'next/link';
import { BrandHeader } from '@/components/Brand';
import { LiveQueue } from '@/components/LiveQueue';
import { currentCustomerId } from '@/lib/session';
import { db } from '@/lib/db';
import { getNowPlaying, getCurrentQueue } from '@/lib/queue';
import { getLocation } from '@/lib/location';

export const dynamic = 'force-dynamic';

export default async function Home() {
  const customerId = await currentCustomerId();
  const customer = customerId
    ? await db.customer.findUnique({ where: { id: customerId } })
    : null;
  const [nowPlaying, queue, location] = await Promise.all([
    getNowPlaying(),
    getCurrentQueue(),
    getLocation(),
  ]);

  return (
    <main className="mx-auto max-w-md px-4 pb-24">
      <BrandHeader subtitle="Pick the next song" />

      {location && (
        <div className="text-center text-xs text-manor-cream/60 mb-3">
          You're at <span className="text-manor-teal font-semibold">{location}</span>
        </div>
      )}

      <Link href="/search" className="btn-primary w-full mb-3 text-lg">
        Search the music
      </Link>

      {customer ? (
        <div className="text-center text-sm text-manor-cream/60 mb-4">
          Signed in as <span className="text-manor-cream">{customer.displayName ?? customer.phone}</span>
        </div>
      ) : (
        <Link href="/auth" className="btn-ghost w-full mb-4">
          Sign in to queue songs
        </Link>
      )}

      <LiveQueue
        initial={{
          nowPlaying: nowPlaying
            ? { song: { id: nowPlaying.song.id, title: nowPlaying.song.title, artist: nowPlaying.song.artist } }
            : null,
          queue: queue.map((q) => ({
            id: q.id,
            song: { title: q.song.title, artist: q.song.artist },
            customer: q.customer,
            location: q.location,
          })),
        }}
      />
    </main>
  );
}
