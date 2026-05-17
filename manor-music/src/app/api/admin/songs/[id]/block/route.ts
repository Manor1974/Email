import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { isAdmin } from '@/lib/auth-admin';

const Body = z.object({ reason: z.string().max(200).optional() });

export async function POST(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  if (!(await isAdmin())) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  const { id } = await ctx.params;
  const json = await req.json().catch(() => ({}));
  const parsed = Body.safeParse(json);
  const reason = parsed.success ? parsed.data.reason : undefined;
  await db.song.update({
    where: { id },
    data: { blockedAt: new Date(), blockedReason: reason ?? null },
  });
  return NextResponse.json({ ok: true });
}

export async function DELETE(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  if (!(await isAdmin())) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  const { id } = await ctx.params;
  await db.song.update({
    where: { id },
    data: { blockedAt: null, blockedReason: null },
  });
  return NextResponse.json({ ok: true });
}
