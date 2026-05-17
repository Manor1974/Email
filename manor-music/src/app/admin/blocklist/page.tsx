import { redirect } from 'next/navigation';
import { isAdmin } from '@/lib/auth-admin';
import { db } from '@/lib/db';
import { BrandHeader } from '@/components/Brand';
import { BlocklistTable } from './BlocklistTable';

export const dynamic = 'force-dynamic';

export default async function BlocklistPage() {
  if (!(await isAdmin())) redirect('/admin/login');

  const blocked = await db.song.findMany({
    where: { blockedAt: { not: null } },
    orderBy: { blockedAt: 'desc' },
    select: { id: true, title: true, artist: true, blockedAt: true, blockedReason: true },
  });

  return (
    <main className="mx-auto max-w-3xl px-4 pb-24">
      <BrandHeader subtitle="Blocked songs" />
      <p className="text-sm text-manor-cream/70 mb-4">
        Search for any song in the customer/staff search and tap "Block" to add it here.
        Blocked songs are hidden from customer search and won't auto-play from stations.
      </p>
      <BlocklistTable items={blocked.map((b) => ({
        ...b,
        blockedAt: b.blockedAt!.toISOString(),
      }))} />
    </main>
  );
}
