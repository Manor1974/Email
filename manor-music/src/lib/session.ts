import { cookies } from 'next/headers';
import { createHmac, randomBytes, timingSafeEqual } from 'crypto';

const COOKIE = 'manor_session';
const TTL_DAYS = 90;

function secret() {
  const s = process.env.SESSION_SECRET;
  if (!s || s.length < 16) throw new Error('SESSION_SECRET missing or too short');
  return s;
}

function sign(payload: string) {
  return createHmac('sha256', secret()).update(payload).digest('base64url');
}

export function createSessionToken(customerId: string) {
  const payload = `${customerId}.${Date.now()}.${randomBytes(8).toString('base64url')}`;
  return `${payload}.${sign(payload)}`;
}

export function verifySessionToken(token: string): string | null {
  const idx = token.lastIndexOf('.');
  if (idx < 0) return null;
  const payload = token.slice(0, idx);
  const sig = token.slice(idx + 1);
  const expected = sign(payload);
  if (sig.length !== expected.length) return null;
  if (!timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) return null;
  const [customerId] = payload.split('.');
  return customerId ?? null;
}

export async function setSession(customerId: string) {
  const jar = await cookies();
  jar.set(COOKIE, createSessionToken(customerId), {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: TTL_DAYS * 24 * 60 * 60,
  });
}

export async function clearSession() {
  const jar = await cookies();
  jar.delete(COOKIE);
}

export async function currentCustomerId(): Promise<string | null> {
  const jar = await cookies();
  const tok = jar.get(COOKIE)?.value;
  if (!tok) return null;
  return verifySessionToken(tok);
}
