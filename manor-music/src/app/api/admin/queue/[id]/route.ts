import { NextRequest, NextResponse } from 'next/server';
import { removeFromQueue } from '@/lib/queue';
import { isAdmin } from '@/lib/auth-admin';

export async function DELETE(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  if (!(await isAdmin())) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  const { id } = await ctx.params;
  await removeFromQueue(id, 'admin');
  return NextResponse.json({ ok: true });
}
