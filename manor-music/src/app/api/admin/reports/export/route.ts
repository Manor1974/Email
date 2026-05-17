import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { isAdmin } from '@/lib/auth-admin';

function csvEscape(v: string | number | null | undefined): string {
  if (v == null) return '';
  const s = String(v);
  if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

export async function GET(req: NextRequest) {
  if (!(await isAdmin())) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const days = parseInt(req.nextUrl.searchParams.get('days') ?? '30', 10);
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

  const plays = await db.play.findMany({
    where: { startedAt: { gte: since } },
    orderBy: { startedAt: 'asc' },
    include: {
      song: { select: { title: true, artist: true, album: true, genre: true, year: true } },
      customer: { select: { displayName: true, phone: true } },
    },
  });

  const header = ['playedAt', 'title', 'artist', 'album', 'genre', 'year', 'source', 'location', 'skipped', 'requestedBy', 'requestedByPhone'];
  const rows = plays.map((p) => [
    p.startedAt.toISOString(),
    p.song.title,
    p.song.artist,
    p.song.album ?? '',
    p.song.genre ?? '',
    p.song.year ?? '',
    p.source,
    p.location ?? '',
    p.skipped ? 'yes' : 'no',
    p.customer?.displayName ?? '',
    p.customer?.phone ?? '',
  ]);

  const csv = [header, ...rows].map((r) => r.map(csvEscape).join(',')).join('\n');

  return new NextResponse(csv, {
    headers: {
      'content-type': 'text/csv; charset=utf-8',
      'content-disposition': `attachment; filename="manor-plays-${days}d.csv"`,
    },
  });
}
