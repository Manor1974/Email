import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { isAdmin } from '@/lib/auth-admin';
import { broadcast } from '@/lib/realtime';

const Body = z.object({
  playbackState: z.enum(['PLAYING', 'PAUSED']).optional(),
  playbackVolume: z.number().int().min(0).max(100).optional(),
});

export async function PATCH(req: NextRequest) {
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

export async function GET() {
  if (!(await isAdmin())) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  const s = await db.settings.findUnique({
    where: { id: 'singleton' },
    select: { playbackState: true, playbackVolume: true },
  });
  return NextResponse.json(s ?? { playbackState: 'PLAYING', playbackVolume: 80 });
}
