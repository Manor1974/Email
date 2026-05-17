import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { addToQueue, QueueError } from '@/lib/queue';
import { isAdmin } from '@/lib/auth-admin';

const Body = z.object({
  songId: z.string().min(1),
  asStation: z.boolean().optional(),
});

export async function POST(req: NextRequest) {
  if (!(await isAdmin())) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  const json = await req.json().catch(() => null);
  const parsed = Body.safeParse(json);
  if (!parsed.success) return NextResponse.json({ error: 'Invalid' }, { status: 400 });
  try {
    const item = await addToQueue({
      songId: parsed.data.songId,
      source: parsed.data.asStation ? 'STATION' : 'STAFF',
      bypassRules: true,
    });
    return NextResponse.json({ ok: true, queueItemId: item.id });
  } catch (e) {
    if (e instanceof QueueError) {
      return NextResponse.json({ error: e.message, code: e.code }, { status: 400 });
    }
    throw e;
  }
}
