import { db } from './db';

export type CleanMode = 'AUTO' | 'FORCE_CLEAN' | 'FORCE_EXPLICIT';

// Returns true if explicit lyrics are currently allowed.
// Respects manual override; otherwise consults the per-day ExplicitWindow rows.
export async function explicitAllowed(now: Date = new Date()): Promise<boolean> {
  const settings = await db.settings.findUnique({ where: { id: 'singleton' } });
  const mode: CleanMode = (settings?.cleanModeOverride as CleanMode) ?? 'AUTO';
  if (mode === 'FORCE_CLEAN') return false;
  if (mode === 'FORCE_EXPLICIT') return true;

  const day = now.getDay();
  const minute = now.getHours() * 60 + now.getMinutes();
  const windows = await db.explicitWindow.findMany({
    where: { dayOfWeek: day, enabled: true },
  });
  return windows.some((w) => minute >= w.startMinute && minute < w.endMinute);
}
