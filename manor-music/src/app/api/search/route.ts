import { NextRequest, NextResponse } from 'next/server';
import type { Prisma } from '@prisma/client';
import { db } from '@/lib/db';
import { explicitAllowed } from '@/lib/schedule';

export async function GET(req: NextRequest) {
  const params = req.nextUrl.searchParams;
  const q = params.get('q')?.trim() ?? '';
  const genre = params.get('genre')?.trim() || null;
  const decadeRaw = params.get('decade');
  const decade = decadeRaw ? parseInt(decadeRaw, 10) : null;
  const hasTextQuery = q.length >= 2;
  const hasFilter = !!(genre || decade);

  if (!hasTextQuery && !hasFilter) {
    return NextResponse.json({ results: [] });
  }

  const allowExplicit = await explicitAllowed();

  const conditions: Prisma.SongWhereInput[] = [];
  if (hasTextQuery) {
    conditions.push({
      OR: [
        { title: { contains: q, mode: 'insensitive' } },
        { artist: { contains: q, mode: 'insensitive' } },
        { album: { contains: q, mode: 'insensitive' } },
      ],
    });
  }
  if (genre) {
    conditions.push({ genre: { equals: genre, mode: 'insensitive' } });
  }
  if (decade && Number.isFinite(decade)) {
    conditions.push({ year: { gte: decade, lt: decade + 10 } });
  }
  if (!allowExplicit) {
    conditions.push({
      OR: [
        { isExplicit: false },
        { pairOf: { some: { isExplicit: false } } },
      ],
    });
  }

  const songs = await db.song.findMany({
    where: { blockedAt: null, AND: conditions },
    take: 50,
    orderBy: hasTextQuery
      ? [{ artist: 'asc' }, { title: 'asc' }]
      : [{ lastPlayedAt: { sort: 'asc', nulls: 'first' } }, { artist: 'asc' }],
    select: {
      id: true,
      title: true,
      artist: true,
      album: true,
      isExplicit: true,
      videoPath: true,
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
    })),
    cleanMode: !allowExplicit,
  });
}
