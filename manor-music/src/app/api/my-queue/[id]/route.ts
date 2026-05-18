import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { currentCustomerId } from '@/lib/session';
import { broadcast } from '@/lib/realtime';

// Customer-initiated cancel. We re-check ownership server-side so a malicious
// client can't ask for someone else's item by id.
export async function DELETE(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const customerId = await currentCustomerId();
  if (!customerId) return NextResponse.json({ error: 'sign in required' }, { status: 401 });
  const { id } = await ctx.params;

  const item = await db.queueItem.findUnique({
    where: { id },
    select: { customerId: true, startedAt: true, removedAt: true },
  });
  if (!item || item.customerId !== customerId) {
    return NextResponse.json({ error: 'not found' }, { status: 404 });
  }
  if (item.startedAt) {
    return NextResponse.json({ error: 'already playing — staff can skip' }, { status: 400 });
  }
  if (item.removedAt) return NextResponse.json({ ok: true });

  await db.queueItem.update({
    where: { id },
    data: { removedAt: new Date(), removedBy: 'customer' },
  });
  await broadcast({ type: 'queue:updated' });
  return NextResponse.json({ ok: true });
}
