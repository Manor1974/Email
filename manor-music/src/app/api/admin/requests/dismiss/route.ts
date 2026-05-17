import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { isAdmin } from '@/lib/auth-admin';

export async function POST(req: NextRequest) {
  if (!(await isAdmin())) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  const form = await req.formData();
  const raw = form.get('ids');
  if (typeof raw !== 'string') return NextResponse.json({ error: 'invalid' }, { status: 400 });
  let ids: string[];
  try {
    ids = JSON.parse(raw);
    if (!Array.isArray(ids)) throw new Error('not array');
  } catch {
    return NextResponse.json({ error: 'invalid' }, { status: 400 });
  }
  await db.songRequest.updateMany({
    where: { id: { in: ids } },
    data: { fulfilledAt: new Date() },
  });
  return NextResponse.redirect(new URL('/admin/requests', process.env.NEXT_PUBLIC_BASE_URL ?? 'http://localhost:3000'));
}
