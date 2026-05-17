import { cookies } from 'next/headers';
import { createHmac, timingSafeEqual } from 'crypto';

const COOKIE = 'manor_admin';

function expected() {
  const pin = process.env.ADMIN_PIN ?? '000000';
  const secret = process.env.SESSION_SECRET ?? 'dev-secret';
  return createHmac('sha256', secret).update(`admin:${pin}`).digest('base64url');
}

export async function loginAdmin(pin: string) {
  const target = process.env.ADMIN_PIN ?? '000000';
  if (pin.length !== target.length) return false;
  if (!timingSafeEqual(Buffer.from(pin), Buffer.from(target))) return false;
  const jar = await cookies();
  jar.set(COOKIE, expected(), {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 30 * 24 * 60 * 60,
  });
  return true;
}

export async function logoutAdmin() {
  const jar = await cookies();
  jar.delete(COOKIE);
}

export async function isAdmin() {
  const jar = await cookies();
  const tok = jar.get(COOKIE)?.value;
  if (!tok) return false;
  const e = expected();
  if (tok.length !== e.length) return false;
  return timingSafeEqual(Buffer.from(tok), Buffer.from(e));
}
