/**
 * First-run seed. Idempotent — safe to re-run.
 *
 * Sets reasonable defaults so the admin UI works the moment the database is
 * created, before the operator has touched anything.
 */
import { PrismaClient } from '@prisma/client';

const db = new PrismaClient();

async function main() {
  await db.settings.upsert({
    where: { id: 'singleton' },
    create: {
      id: 'singleton',
      maxSongsPerCustomer: 3,
      songCooldownHours: 4,
      artistCooldownMinutes: 45,
      customerBlendRatio: 1,
      cleanModeOverride: 'AUTO',
    },
    update: {},
  });

  // Default explicit window: Friday + Saturday 9pm → 2am (midnight + 2h).
  // Stored as two rows since a window can't cross midnight.
  const existingWindows = await db.explicitWindow.count();
  if (existingWindows === 0) {
    await db.explicitWindow.createMany({
      data: [
        // Friday 21:00 → 23:59
        { dayOfWeek: 5, startMinute: 21 * 60, endMinute: 24 * 60 - 1, enabled: true },
        // Saturday 00:00 → 02:00
        { dayOfWeek: 6, startMinute: 0, endMinute: 2 * 60, enabled: true },
        // Saturday 21:00 → 23:59
        { dayOfWeek: 6, startMinute: 21 * 60, endMinute: 24 * 60 - 1, enabled: true },
        // Sunday 00:00 → 02:00
        { dayOfWeek: 0, startMinute: 0, endMinute: 2 * 60, enabled: true },
      ],
    });
  }

  // "All music" starter station so the auto-DJ has somewhere to pull from.
  const stationCount = await db.station.count();
  if (stationCount === 0) {
    await db.station.create({
      data: {
        name: 'All Music',
        filter: {},
        isActive: false,
      },
    });
  }

  console.log('seed done');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
