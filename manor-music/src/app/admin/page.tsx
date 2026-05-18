import Link from 'next/link';
import { redirect } from 'next/navigation';
import { isAdmin } from '@/lib/auth-admin';
import { db } from '@/lib/db';
import { BrandHeader } from '@/components/Brand';
import { getCurrentQueue, getNowPlaying } from '@/lib/queue';

export const dynamic = 'force-dynamic';

export default async function AdminHome() {
  if (!(await isAdmin())) redirect('/admin/login');

  const [queue, np, openRequests, songCount, blocked] = await Promise.all([
    getCurrentQueue(),
    getNowPlaying(),
    db.songRequest.count({ where: { fulfilledAt: null } }),
    db.song.count(),
    db.song.count({ where: { blockedAt: { not: null } } }),
  ]);

  return (
    <main className="mx-auto max-w-3xl px-4 pb-24">
      <BrandHeader subtitle="Admin" />

      <div className="grid grid-cols-2 gap-3 mb-4">
        <Stat label="Library" value={songCount} />
        <Stat label="Blocked" value={blocked} />
        <Stat label="In queue" value={queue.length} />
        <Stat label="Open requests" value={openRequests} />
      </div>

      <section className="card mb-4">
        <div className="text-xs uppercase tracking-wider text-manor-cream/50 mb-2">Now playing</div>
        {np ? (
          <div>
            <div className="text-lg font-semibold">{np.song.title}</div>
            <div className="text-sm text-manor-cream/70">{np.song.artist}</div>
          </div>
        ) : (
          <div className="text-manor-cream/50">Nothing playing.</div>
        )}
      </section>

      <nav className="grid grid-cols-2 gap-3">
        <Link href="/admin/queue" className="card hover:border-manor-teal">Queue control</Link>
        <Link href="/admin/blocklist" className="card hover:border-manor-teal">Blocklist</Link>
        <Link href="/admin/schedule" className="card hover:border-manor-teal">Explicit schedule</Link>
        <Link href="/admin/requests" className="card hover:border-manor-teal">Requests inbox</Link>
        <Link href="/admin/stations" className="card hover:border-manor-teal">Stations &amp; auto-DJ</Link>
        <Link href="/admin/customers" className="card hover:border-manor-teal">Customers</Link>
        <Link href="/admin/reports" className="card hover:border-manor-teal">Reports</Link>
        <Link href="/admin/settings" className="card hover:border-manor-teal">Settings</Link>
        <Link href="/admin/qr" className="card hover:border-manor-teal">Print zone QR cards</Link>
        <Link href="/staff" className="card hover:border-manor-teal">Staff DJ console</Link>
        <Link href="/display" target="_blank" className="card hover:border-manor-teal">Open TV display</Link>
      </nav>
    </main>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="card">
      <div className="text-xs uppercase tracking-wider text-manor-cream/50">{label}</div>
      <div className="text-2xl font-bold">{value.toLocaleString()}</div>
    </div>
  );
}
