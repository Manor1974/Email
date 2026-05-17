import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { isAdmin } from '@/lib/auth-admin';
import { broadcast } from '@/lib/realtime';

export async function POST() {
  if (!(await isAdmin())) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const now = new Date();
  await db.queueItem.updateMany({
    where: { startedAt: { not: null }, endedAt: null },
    data: { endedAt: now, skippedAt: now },
  });
  await db.play.updateMany({
    where: { endedAt: null },
    data: { endedAt: now, skipped: true },
  });

  await broadcast({ type: 'queue:updated' });
  await broadcast({ type: 'now-playing', songId: null });

  return NextResponse.redirect(new URL('/admin/queue', process.env.NEXT_PUBLIC_BASE_URL ?? 'http://localhost:3000'));
}
