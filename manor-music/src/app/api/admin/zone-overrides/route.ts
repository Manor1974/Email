import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { isAdmin } from '@/lib/auth-admin';
import { broadcast } from '@/lib/realtime';

const Body = z.object({
  overrides: z.array(
    z.object({
      zone: z.string().min(1).max(60),
      mode: z.enum(['AUTO', 'FORCE_CLEAN', 'FORCE_EXPLICIT']),
    }),
  ),
});

export async function POST(req: NextRequest) {
  if (!(await isAdmin())) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  const json = await req.json().catch(() => null);
  const parsed = Body.safeParse(json);
  if (!parsed.success) return NextResponse.json({ error: 'Invalid' }, { status: 400 });

  await db.$transaction(async (tx) => {
    await tx.zoneOverride.deleteMany({});
    if (parsed.data.overrides.length) {
      await tx.zoneOverride.createMany({
        data: parsed.data.overrides.map((o) => ({
          zone: o.zone.trim(),
          mode: o.mode,
        })),
      });
    }
  });

  await broadcast({ type: 'settings:updated' });
  return NextResponse.json({ ok: true });
}
