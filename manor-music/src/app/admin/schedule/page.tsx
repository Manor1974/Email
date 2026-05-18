import { redirect } from 'next/navigation';
import { isAdmin } from '@/lib/auth-admin';
import { db } from '@/lib/db';
import { BrandHeader } from '@/components/Brand';
import { ScheduleEditor } from './ScheduleEditor';
import { ZoneOverrides, type Mode } from './ZoneOverrides';

export const dynamic = 'force-dynamic';

export default async function SchedulePage() {
  if (!(await isAdmin())) redirect('/admin/login');

  const [windows, settings, overrides, recentLocations] = await Promise.all([
    db.explicitWindow.findMany({ orderBy: [{ dayOfWeek: 'asc' }, { startMinute: 'asc' }] }),
    db.settings.findUnique({ where: { id: 'singleton' } }),
    db.zoneOverride.findMany({ orderBy: { zone: 'asc' } }),
    db.queueItem.findMany({
      where: { location: { not: null } },
      distinct: ['location'],
      select: { location: true },
      take: 50,
    }),
  ]);

  const knownZones = [...new Set(recentLocations.map((r) => r.location!).filter(Boolean))].sort();

  return (
    <main className="mx-auto max-w-3xl px-4 pb-24">
      <BrandHeader subtitle="Explicit lyrics schedule" />
      <p className="text-sm text-manor-cream/70 mb-4">
        Define per-day windows when explicit versions are allowed. Outside these windows
        the system swaps in the clean counterpart automatically. Per-zone overrides take
        precedence over the global schedule.
      </p>
      <ScheduleEditor
        initial={windows.map((w) => ({
          id: w.id,
          dayOfWeek: w.dayOfWeek,
          startMinute: w.startMinute,
          endMinute: w.endMinute,
          enabled: w.enabled,
        }))}
        override={(settings?.cleanModeOverride as 'AUTO' | 'FORCE_CLEAN' | 'FORCE_EXPLICIT') ?? 'AUTO'}
      />
      <div className="mt-4">
        <ZoneOverrides
          initial={overrides.map((o) => ({ zone: o.zone, mode: o.mode as Mode }))}
          knownZones={knownZones}
        />
      </div>
    </main>
  );
}
