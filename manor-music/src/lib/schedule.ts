import { db } from './db';

export type CleanMode = 'AUTO' | 'FORCE_CLEAN' | 'FORCE_EXPLICIT';

// Returns true if explicit lyrics are currently allowed.
//
// Resolution order:
//   1. Zone-specific override (if `location` is provided and a row exists for it).
//      FORCE_CLEAN → false, FORCE_EXPLICIT → true, AUTO falls through.
//   2. Global override on the Settings row (same three modes).
//   3. Global ExplicitWindow schedule for the current day-of-week / minute.
export async function explicitAllowed(
  now: Date = new Date(),
  location?: string | null,
): Promise<boolean> {
  if (location) {
    const zone = await db.zoneOverride.findUnique({ where: { zone: location } });
    if (zone) {
      if (zone.mode === 'FORCE_CLEAN') return false;
      if (zone.mode === 'FORCE_EXPLICIT') return true;
    }
  }

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
