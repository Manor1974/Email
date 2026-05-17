import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { addToQueue, getCurrentQueue, getNowPlaying, QueueError } from '@/lib/queue';
import { currentCustomerId } from '@/lib/session';

export async function GET() {
  const [queue, nowPlaying] = await Promise.all([getCurrentQueue(), getNowPlaying()]);
  return NextResponse.json({ queue, nowPlaying });
}

const Body = z.object({ songId: z.string().min(1) });

export async function POST(req: NextRequest) {
  const customerId = await currentCustomerId();
  if (!customerId) return NextResponse.json({ error: 'Sign in required' }, { status: 401 });

  const json = await req.json().catch(() => null);
  const parsed = Body.safeParse(json);
  if (!parsed.success) return NextResponse.json({ error: 'Invalid request' }, { status: 400 });

  try {
    const item = await addToQueue({
      songId: parsed.data.songId,
      customerId,
      source: 'CUSTOMER',
    });
    return NextResponse.json({ ok: true, queueItemId: item.id });
  } catch (e) {
    if (e instanceof QueueError) {
      return NextResponse.json({ error: e.message, code: e.code }, { status: 400 });
    }
    throw e;
  }
}
