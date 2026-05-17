import { redirect } from 'next/navigation';
import { isAdmin } from '@/lib/auth-admin';
import { getCurrentQueue, getNowPlaying } from '@/lib/queue';
import { BrandHeader } from '@/components/Brand';
import { QueueRow } from './QueueRow';

export const dynamic = 'force-dynamic';

export default async function AdminQueuePage() {
  if (!(await isAdmin())) redirect('/admin/login');
  const [queue, np] = await Promise.all([getCurrentQueue(), getNowPlaying()]);

  return (
    <main className="mx-auto max-w-3xl px-4 pb-24">
      <BrandHeader subtitle="Queue control" />

      <section className="card mb-4">
        <div className="text-xs uppercase tracking-wider text-manor-cream/50 mb-1">Now playing</div>
        {np ? (
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="text-lg font-semibold">{np.song.title}</div>
              <div className="text-sm text-manor-cream/70">{np.song.artist}</div>
            </div>
            <form action="/api/admin/queue/skip" method="post">
              <button className="btn-ghost">Skip</button>
            </form>
          </div>
        ) : (
          <div className="text-manor-cream/50">Nothing playing.</div>
        )}
      </section>

      <section className="card">
        <div className="text-xs uppercase tracking-wider text-manor-cream/50 mb-2">
          Up next ({queue.length})
        </div>
        {queue.length === 0 ? (
          <div className="text-manor-cream/50 text-sm">Queue is empty.</div>
        ) : (
          <ol className="space-y-2">
            {queue.map((item) => (
              <QueueRow
                key={item.id}
                id={item.id}
                position={item.position}
                title={item.song.title}
                artist={item.song.artist}
                source={item.source}
                addedBy={item.customer?.displayName ?? null}
              />
            ))}
          </ol>
        )}
      </section>
    </main>
  );
}
