import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { isAdmin } from '@/lib/auth-admin';
import { broadcast } from '@/lib/realtime';

const Body = z.object({
  maxSongsPerCustomer: z.number().int().min(1).max(50),
  songCooldownMinutes: z.number().int().min(0).max(4320),
  artistCooldownMinutes: z.number().int().min(0).max(360),
  customerBlendRatio: z.number().int().min(0).max(20),
  cleanModeOverride: z.enum(['AUTO', 'FORCE_CLEAN', 'FORCE_EXPLICIT']).optional(),
  staffBackgroundUrl: z.string().url().max(2048).nullable().optional(),
});

export async function POST(req: NextRequest) {
  if (!(await isAdmin())) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  const json = await req.json().catch(() => null);
  const parsed = Body.safeParse(json);
  if (!parsed.success) return NextResponse.json({ error: 'Invalid' }, { status: 400 });
  await db.settings.upsert({
    where: { id: 'singleton' },
    create: { id: 'singleton', ...parsed.data },
    update: parsed.data,
  });
  await broadcast({ type: 'settings:updated' });
  return NextResponse.json({ ok: true });
}
