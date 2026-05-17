import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { generateCode, normalizePhone, sendSms } from '@/lib/sms';

const Body = z.object({ phone: z.string().min(7).max(20) });

export async function POST(req: NextRequest) {
  const json = await req.json().catch(() => null);
  const parsed = Body.safeParse(json);
  if (!parsed.success) return NextResponse.json({ error: 'Invalid request' }, { status: 400 });

  const phone = normalizePhone(parsed.data.phone);
  if (!phone) return NextResponse.json({ error: 'Invalid phone number' }, { status: 400 });

  // Rate-limit: max 3 codes per phone per 10 minutes.
  const tenMinAgo = new Date(Date.now() - 10 * 60 * 1000);
  const recent = await db.smsCode.count({
    where: { phone, createdAt: { gte: tenMinAgo } },
  });
  if (recent >= 3) {
    return NextResponse.json({ error: 'Too many attempts. Try again in a few minutes.' }, { status: 429 });
  }

  const code = generateCode();
  await db.smsCode.create({
    data: {
      phone,
      code,
      expiresAt: new Date(Date.now() - 0 + 10 * 60 * 1000),
    },
  });
  await sendSms(phone, `Manor Lanes Jukebox code: ${code}. Expires in 10 min.`);

  return NextResponse.json({ ok: true });
}
