import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { isAdmin } from '@/lib/auth-admin';

export async function GET(req: NextRequest) {
  if (!(await isAdmin())) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  const s = req.nextUrl.searchParams;
  const q = s.get('q')?.trim() ?? '';
  const genre = s.get('genre');
  const minYear = s.get('minYear');
  const maxYear = s.get('maxYear');

  const where: Parameters<typeof db.song.findMany>[0] = {
    where: {
      blockedAt: null,
      filePath: { not: { startsWith: '__missing:' } },
    },
  };
  if (q.length >= 2) {
    (where.where as any).OR = [
      { title: { contains: q, mode: 'insensitive' } },
      { artist: { contains: q, mode: 'insensitive' } },
      { album: { contains: q, mode: 'insensitive' } },
    ];
  }
  if (genre) (where.where as any).genre = genre;
  if (minYear || maxYear) {
    (where.where as any).year = {
      ...(minYear ? { gte: parseInt(minYear, 10) } : {}),
      ...(maxYear ? { lte: parseInt(maxYear, 10) } : {}),
    };
  }

  const songs = await db.song.findMany({
    ...where,
    take: 100,
    orderBy: [{ artist: 'asc' }, { title: 'asc' }],
    select: {
      id: true,
      title: true,
      artist: true,
      album: true,
      isExplicit: true,
      videoPath: true,
      genre: true,
      year: true,
      bpm: true,
    },
  });

  return NextResponse.json({
    results: songs.map((s) => ({
      id: s.id,
      title: s.title,
      artist: s.artist,
      album: s.album,
      isExplicit: s.isExplicit,
      hasVideo: !!s.videoPath,
      genre: s.genre,
      year: s.year,
      bpm: s.bpm,
    })),
  });
}
