import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { currentCustomerId } from '@/lib/session';

const Body = z.object({
  title: z.string().min(1).max(120),
  artist: z.string().min(1).max(120),
  notes: z.string().max(500).optional(),
});

export async function POST(req: NextRequest) {
  const customerId = await currentCustomerId();
  if (!customerId) return NextResponse.json({ error: 'Sign in required' }, { status: 401 });

  const json = await req.json().catch(() => null);
  const parsed = Body.safeParse(json);
  if (!parsed.success) return NextResponse.json({ error: 'Invalid request' }, { status: 400 });

  const reqRow = await db.songRequest.create({
    data: {
      customerId,
      title: parsed.data.title.trim(),
      artist: parsed.data.artist.trim(),
      notes: parsed.data.notes?.trim() || null,
    },
  });

  return NextResponse.json({ ok: true, requestId: reqRow.id });
}
