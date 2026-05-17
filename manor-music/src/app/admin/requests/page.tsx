import { redirect } from 'next/navigation';
import { isAdmin } from '@/lib/auth-admin';
import { db } from '@/lib/db';
import { BrandHeader } from '@/components/Brand';

export const dynamic = 'force-dynamic';

export default async function RequestsPage() {
  if (!(await isAdmin())) redirect('/admin/login');

  // Group identical requests so duplicates surface as demand signal.
  const open = await db.songRequest.findMany({
    where: { fulfilledAt: null },
    orderBy: { createdAt: 'desc' },
    include: { customer: { select: { phone: true, displayName: true } } },
  });

  const grouped = new Map<string, { artist: string; title: string; count: number; first: Date; ids: string[] }>();
  for (const r of open) {
    const key = `${r.artist.toLowerCase()}::${r.title.toLowerCase()}`;
    const existing = grouped.get(key);
    if (existing) {
      existing.count += 1;
      existing.ids.push(r.id);
      if (r.createdAt < existing.first) existing.first = r.createdAt;
    } else {
      grouped.set(key, { artist: r.artist, title: r.title, count: 1, first: r.createdAt, ids: [r.id] });
    }
  }
  const rows = [...grouped.values()].sort((a, b) => b.count - a.count || +b.first - +a.first);

  return (
    <main className="mx-auto max-w-3xl px-4 pb-24">
      <BrandHeader subtitle="Customer song requests" />
      <p className="text-sm text-manor-cream/70 mb-4">
        Duplicate requests are merged below. Drop the matching MP3 into the library and run the scanner —
        the request will auto-resolve and customers get an SMS notification.
      </p>
      {rows.length === 0 ? (
        <div className="card text-manor-cream/50">No open requests.</div>
      ) : (
        <ul className="space-y-2">
          {rows.map((r) => (
            <li key={r.ids[0]} className="card flex items-center gap-3">
              <div className="min-w-0 flex-1">
                <div className="text-manor-cream truncate">{r.title}</div>
                <div className="text-xs text-manor-cream/60 truncate">
                  {r.artist}
                  {r.count > 1 && (
                    <span className="ml-2 px-1.5 py-0.5 bg-manor-gold/20 text-manor-gold rounded text-[10px]">
                      ×{r.count} requesters
                    </span>
                  )}
                </div>
              </div>
              <form action={`/api/admin/requests/dismiss`} method="post">
                <input type="hidden" name="ids" value={JSON.stringify(r.ids)} />
                <button className="btn-ghost px-3 py-2 text-sm">Dismiss</button>
              </form>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
