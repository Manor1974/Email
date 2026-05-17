import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { isAdmin } from '@/lib/auth-admin';
import { broadcast } from '@/lib/realtime';

const Body = z.object({ stationId: z.string().nullable() });

export async function POST(req: NextRequest) {
  if (!(await isAdmin())) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  const json = await req.json().catch(() => null);
  const parsed = Body.safeParse(json);
  if (!parsed.success) return NextResponse.json({ error: 'Invalid' }, { status: 400 });

  await db.$transaction(async (tx) => {
    await tx.station.updateMany({ data: { isActive: false } });
    if (parsed.data.stationId) {
      await tx.station.update({
        where: { id: parsed.data.stationId },
        data: { isActive: true },
      });
    }
    await tx.settings.upsert({
      where: { id: 'singleton' },
      create: { id: 'singleton', activeStationId: parsed.data.stationId },
      update: { activeStationId: parsed.data.stationId },
    });
  });

  await broadcast({ type: 'settings:updated' });
  return NextResponse.json({ ok: true });
}
