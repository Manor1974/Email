import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { isAdmin } from '@/lib/auth-admin';
import { broadcast } from '@/lib/realtime';

// Lightweight endpoint for flipping the explicit-lyrics override from the
// staff DJ console without forcing the full /admin/settings payload.
// Three modes:
//   AUTO            — follow the /admin/schedule windows
//   FORCE_CLEAN     — never play explicit, regardless of schedule
//   FORCE_EXPLICIT  — always allow explicit, even outside the window
const Body = z.object({
  cleanModeOverride: z.enum(['AUTO', 'FORCE_CLEAN', 'FORCE_EXPLICIT']),
});

export async function PATCH(req: NextRequest) {
  if (!(await isAdmin())) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: 'Invalid' }, { status: 400 });

  await db.settings.upsert({
    where: { id: 'singleton' },
    create: { id: 'singleton', cleanModeOverride: parsed.data.cleanModeOverride },
    update: { cleanModeOverride: parsed.data.cleanModeOverride },
  });
  await broadcast({ type: 'settings:updated' });
  return NextResponse.json({ ok: true });
}
