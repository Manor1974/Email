import { cookies } from 'next/headers';

const COOKIE = 'manor_location';
const MAX_LEN = 40;

// Sanitize location strings coming in from URL params. Keep letters, digits,
// spaces, dashes, and "+/&" so labels like "Volleyball Court 1" or
// "Bar - Back Room" survive intact but stray markup or quotes don't.
export function sanitizeLocation(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const trimmed = raw.trim().slice(0, MAX_LEN);
  const safe = trimmed.replace(/[^\w\s\-&+().#]/g, '').replace(/\s+/g, ' ').trim();
  return safe.length ? safe : null;
}

export async function setLocationCookie(value: string) {
  const safe = sanitizeLocation(value);
  if (!safe) return;
  const jar = await cookies();
  jar.set(COOKIE, safe, {
    httpOnly: false, // readable client-side for QR-card display
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 14 * 24 * 60 * 60,
  });
}

export async function getLocation(): Promise<string | null> {
  const jar = await cookies();
  return sanitizeLocation(jar.get(COOKIE)?.value);
}
