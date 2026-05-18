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

  // Ban + clean out anything they currently have queued, so the punishment
  // takes effect immediately rather than after their songs drain.
  await db.$transaction([
    db.customer.update({
      where: { id },
      data: { bannedAt: new Date(), banReason: reason ?? null },
    }),
    db.queueItem.updateMany({
      where: { customerId: id, startedAt: null, removedAt: null },
      data: { removedAt: new Date(), removedBy: 'admin-ban' },
    }),
  ]);
  return NextResponse.json({ ok: true });
}

export async function DELETE(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  if (!(await isAdmin())) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  const { id } = await ctx.params;
  await db.customer.update({
    where: { id },
    data: { bannedAt: null, banReason: null },
  });
  return NextResponse.json({ ok: true });
}
