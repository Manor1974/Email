import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { sanitizeLocation, setLocationCookie } from '@/lib/location';

const Body = z.object({ location: z.string().max(60) });

export async function POST(req: NextRequest) {
  const json = await req.json().catch(() => null);
  const parsed = Body.safeParse(json);
  if (!parsed.success) return NextResponse.json({ error: 'invalid' }, { status: 400 });
  const safe = sanitizeLocation(parsed.data.location);
  if (!safe) return NextResponse.json({ error: 'invalid' }, { status: 400 });
  await setLocationCookie(safe);
  return NextResponse.json({ ok: true, location: safe });
}
