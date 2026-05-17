import { redirect } from 'next/navigation';
import { isAdmin } from '@/lib/auth-admin';
import { db } from '@/lib/db';
import { BrandHeader } from '@/components/Brand';

export const dynamic = 'force-dynamic';

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

async function topSongs(days: number) {
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  const rows = await db.play.groupBy({
    by: ['songId'],
    where: { startedAt: { gte: since }, skipped: false },
    _count: { songId: true },
    orderBy: { _count: { songId: 'desc' } },
    take: 20,
  });
  const songs = await db.song.findMany({
    where: { id: { in: rows.map((r) => r.songId) } },
    select: { id: true, title: true, artist: true },
  });
  const byId = new Map(songs.map((s) => [s.id, s]));
  return rows.map((r) => ({ ...byId.get(r.songId)!, count: r._count.songId }));
}

async function heatmap(days: number) {
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  const plays = await db.play.findMany({
    where: { startedAt: { gte: since } },
    select: { startedAt: true },
  });
  const grid: number[][] = Array.from({ length: 7 }, () => Array(24).fill(0));
  for (const p of plays) {
    grid[p.startedAt.getDay()][p.startedAt.getHours()] += 1;
  }
  return grid;
}

async function mostRequestedUnfulfilled() {
  const rows = await db.songRequest.findMany({
    where: { fulfilledAt: null },
    select: { artist: true, title: true },
  });
  const counts = new Map<string, { artist: string; title: string; count: number }>();
  for (const r of rows) {
    const k = `${r.artist.toLowerCase()}::${r.title.toLowerCase()}`;
    const prev = counts.get(k);
    if (prev) prev.count += 1;
    else counts.set(k, { artist: r.artist, title: r.title, count: 1 });
  }
  return [...counts.values()].sort((a, b) => b.count - a.count).slice(0, 10);
}

export default async function ReportsPage() {
  if (!(await isAdmin())) redirect('/admin/login');
  const [top7, top30, hm, reqs] = await Promise.all([
    topSongs(7),
    topSongs(30),
    heatmap(30),
    mostRequestedUnfulfilled(),
  ]);
  const max = Math.max(1, ...hm.flat());

  return (
    <main className="mx-auto max-w-5xl px-4 pb-24">
      <BrandHeader subtitle="Reports" />

      <section className="grid md:grid-cols-2 gap-4">
        <TopList title="Top songs — last 7 days" items={top7} />
        <TopList title="Top songs — last 30 days" items={top30} />
      </section>

      <section className="card mt-4">
        <div className="text-xs uppercase tracking-wider text-manor-cream/50 mb-3">
          Plays by day &amp; hour (last 30 days)
        </div>
        <div className="overflow-x-auto">
          <table className="text-xs">
            <thead>
              <tr>
                <th></th>
                {Array.from({ length: 24 }, (_, h) => (
                  <th key={h} className="px-1 text-manor-cream/40 font-normal">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {hm.map((row, d) => (
                <tr key={d}>
                  <th className="pr-2 text-manor-cream/60 font-normal text-right">{DAY_NAMES[d]}</th>
                  {row.map((v, h) => {
                    const intensity = v / max;
                    const bg = `rgba(56, 182, 166, ${intensity.toFixed(2)})`;
                    return (
                      <td key={h} style={{ background: bg }} className="w-6 h-6 border border-manor-line text-center">
                        {v || ''}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="card mt-4">
        <div className="text-xs uppercase tracking-wider text-manor-cream/50 mb-2">
          Most-requested unfulfilled songs
        </div>
        {reqs.length === 0 ? (
          <div className="text-manor-cream/50 text-sm">No open requests.</div>
        ) : (
          <ol className="space-y-2">
            {reqs.map((r, i) => (
              <li key={i} className="flex items-center gap-3">
                <div className="text-manor-teal font-bold w-6 text-right">×{r.count}</div>
                <div className="min-w-0 flex-1">
                  <div className="text-manor-cream truncate">{r.title}</div>
                  <div className="text-xs text-manor-cream/60 truncate">{r.artist}</div>
                </div>
              </li>
            ))}
          </ol>
        )}
      </section>
    </main>
  );
}

function TopList({ title, items }: { title: string; items: { id: string; title: string; artist: string; count: number }[] }) {
  return (
    <div className="card">
      <div className="text-xs uppercase tracking-wider text-manor-cream/50 mb-2">{title}</div>
      {items.length === 0 ? (
        <div className="text-manor-cream/50 text-sm">No plays yet.</div>
      ) : (
        <ol className="space-y-2">
          {items.map((s, i) => (
            <li key={s.id} className="flex items-center gap-3">
              <div className="text-manor-teal font-bold w-6 text-right">{i + 1}</div>
              <div className="min-w-0 flex-1">
                <div className="text-manor-cream truncate">{s.title}</div>
                <div className="text-xs text-manor-cream/60 truncate">{s.artist}</div>
              </div>
              <div className="text-manor-cream/70 text-sm">{s.count}</div>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
