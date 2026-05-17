import { redirect } from 'next/navigation';
import { isAdmin } from '@/lib/auth-admin';
import { db } from '@/lib/db';
import { BrandHeader } from '@/components/Brand';
import { StationsManager } from './StationsManager';

export const dynamic = 'force-dynamic';

export default async function StationsPage() {
  if (!(await isAdmin())) redirect('/admin/login');

  const [stations, genres, settings] = await Promise.all([
    db.station.findMany({ orderBy: { createdAt: 'asc' } }),
    db.song.findMany({
      where: { genre: { not: null } },
      distinct: ['genre'],
      select: { genre: true },
      take: 100,
    }),
    db.settings.upsert({
      where: { id: 'singleton' },
      create: { id: 'singleton' },
      update: {},
    }),
  ]);

  return (
    <main className="mx-auto max-w-4xl px-4 pb-24">
      <BrandHeader subtitle="Stations &amp; auto-DJ" />
      <p className="text-sm text-manor-cream/70 mb-4">
        Stations fill the queue automatically when no customer is requesting songs.
        Pick which one is currently active — the auto-DJ uses its filter to choose
        the next track. Clean/explicit rules and song/artist cooldowns are still enforced.
      </p>
      <StationsManager
        stations={stations.map((s) => ({
          id: s.id,
          name: s.name,
          filter: s.filter as Record<string, unknown>,
          isActive: s.isActive,
        }))}
        availableGenres={genres.map((g) => g.genre!).filter(Boolean).sort()}
        activeStationId={settings.activeStationId}
      />
    </main>
  );
}
