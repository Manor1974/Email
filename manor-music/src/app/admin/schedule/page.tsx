import { redirect } from 'next/navigation';
import { isAdmin } from '@/lib/auth-admin';
import { db } from '@/lib/db';
import { BrandHeader } from '@/components/Brand';
import { ScheduleEditor } from './ScheduleEditor';

export const dynamic = 'force-dynamic';

export default async function SchedulePage() {
  if (!(await isAdmin())) redirect('/admin/login');
  const windows = await db.explicitWindow.findMany({
    orderBy: [{ dayOfWeek: 'asc' }, { startMinute: 'asc' }],
  });
  const settings = await db.settings.findUnique({ where: { id: 'singleton' } });
  return (
    <main className="mx-auto max-w-3xl px-4 pb-24">
      <BrandHeader subtitle="Explicit lyrics schedule" />
      <p className="text-sm text-manor-cream/70 mb-4">
        Define per-day windows when explicit versions are allowed. Outside these windows
        the system swaps in the clean counterpart automatically.
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
    </main>
  );
}
