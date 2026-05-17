import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { normalizePhone } from '@/lib/sms';
import { setSession } from '@/lib/session';

const Body = z.object({
  phone: z.string().min(7).max(20),
  code: z.string().regex(/^\d{6}$/),
  displayName: z.string().max(32).optional(),
});

export async function POST(req: NextRequest) {
  const json = await req.json().catch(() => null);
  const parsed = Body.safeParse(json);
  if (!parsed.success) return NextResponse.json({ error: 'Invalid request' }, { status: 400 });

  const phone = normalizePhone(parsed.data.phone);
  if (!phone) return NextResponse.json({ error: 'Invalid phone number' }, { status: 400 });

  const code = await db.smsCode.findFirst({
    where: { phone, code: parsed.data.code, consumedAt: null, expiresAt: { gte: new Date() } },
    orderBy: { createdAt: 'desc' },
  });
  if (!code) return NextResponse.json({ error: 'Invalid or expired code' }, { status: 400 });

  const customer = await db.customer.upsert({
    where: { phone },
    create: { phone, displayName: parsed.data.displayName },
    update: {
      displayName: parsed.data.displayName ?? undefined,
      lastSeenAt: new Date(),
    },
  });

  if (customer.bannedAt) {
    return NextResponse.json({ error: 'This number is not allowed to queue songs.' }, { status: 403 });
  }

  await db.smsCode.update({
    where: { id: code.id },
    data: { consumedAt: new Date(), customerId: customer.id },
  });

  await setSession(customer.id);
  return NextResponse.json({ ok: true });
}
