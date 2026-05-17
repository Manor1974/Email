import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { isAdmin } from '@/lib/auth-admin';
import { broadcast } from '@/lib/realtime';

const Window = z.object({
  id: z.string().optional(),
  dayOfWeek: z.number().int().min(0).max(6),
  startMinute: z.number().int().min(0).max(1440),
  endMinute: z.number().int().min(0).max(1440),
  enabled: z.boolean(),
});
const Body = z.object({
  windows: z.array(Window),
  override: z.enum(['AUTO', 'FORCE_CLEAN', 'FORCE_EXPLICIT']),
});

export async function POST(req: NextRequest) {
  if (!(await isAdmin())) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  const json = await req.json().catch(() => null);
  const parsed = Body.safeParse(json);
  if (!parsed.success) return NextResponse.json({ error: 'Invalid' }, { status: 400 });

  await db.$transaction([
    db.explicitWindow.deleteMany({}),
    db.explicitWindow.createMany({
      data: parsed.data.windows.map((w) => ({
        dayOfWeek: w.dayOfWeek,
        startMinute: w.startMinute,
        endMinute: w.endMinute,
        enabled: w.enabled,
      })),
    }),
    db.settings.upsert({
      where: { id: 'singleton' },
      create: { id: 'singleton', cleanModeOverride: parsed.data.override },
      update: { cleanModeOverride: parsed.data.override },
    }),
  ]);

  await broadcast({ type: 'settings:updated' });
  return NextResponse.json({ ok: true });
}
