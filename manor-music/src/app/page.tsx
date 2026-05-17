import Link from 'next/link';
import { BrandHeader } from '@/components/Brand';
import { currentCustomerId } from '@/lib/session';
import { db } from '@/lib/db';
import { getNowPlaying, getCurrentQueue } from '@/lib/queue';

export const dynamic = 'force-dynamic';

export default async function Home() {
  const customerId = await currentCustomerId();
  const customer = customerId
    ? await db.customer.findUnique({ where: { id: customerId } })
    : null;
  const [nowPlaying, queue] = await Promise.all([getNowPlaying(), getCurrentQueue()]);

  return (
    <main className="mx-auto max-w-md px-4 pb-24">
      <BrandHeader subtitle="Pick the next song" />

      <section className="card mb-4">
        <div className="text-xs uppercase tracking-wider text-manor-cream/50 mb-1">Now playing</div>
        {nowPlaying ? (
          <div>
            <div className="text-lg font-semibold text-manor-cream">{nowPlaying.song.title}</div>
            <div className="text-sm text-manor-cream/70">{nowPlaying.song.artist}</div>
          </div>
        ) : (
          <div className="text-manor-cream/50">Nothing playing right now.</div>
        )}
      </section>

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

      <section className="card">
        <div className="text-xs uppercase tracking-wider text-manor-cream/50 mb-2">
          Up next ({queue.length})
        </div>
        {queue.length === 0 ? (
          <div className="text-manor-cream/50 text-sm">Queue is empty.</div>
        ) : (
          <ol className="space-y-3">
            {queue.slice(0, 10).map((item, i) => (
              <li key={item.id} className="flex items-center gap-3">
                <div className="text-manor-teal font-bold w-6 text-right">{i + 1}</div>
                <div className="min-w-0 flex-1">
                  <div className="text-manor-cream truncate">{item.song.title}</div>
                  <div className="text-xs text-manor-cream/60 truncate">
                    {item.song.artist}
                    {item.customer?.displayName ? ` · added by ${item.customer.displayName}` : ''}
                  </div>
                </div>
              </li>
            ))}
          </ol>
        )}
      </section>
    </main>
  );
}
