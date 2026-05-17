import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { loginAdmin } from '@/lib/auth-admin';

const Body = z.object({ pin: z.string().min(4).max(16) });

export async function POST(req: NextRequest) {
  const json = await req.json().catch(() => null);
  const parsed = Body.safeParse(json);
  if (!parsed.success) return NextResponse.json({ error: 'Invalid' }, { status: 400 });
  const ok = await loginAdmin(parsed.data.pin);
  if (!ok) return NextResponse.json({ error: 'Wrong PIN' }, { status: 401 });
  return NextResponse.json({ ok: true });
}
