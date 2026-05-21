import { NextRequest, NextResponse } from 'next/server';
import type { Prisma } from '@prisma/client';
import { db } from '@/lib/db';
import { isAdmin } from '@/lib/auth-admin';

export async function GET(req: NextRequest) {
  if (!(await isAdmin())) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  const s = req.nextUrl.searchParams;
  const q = s.get('q')?.trim() ?? '';
  const genre = s.get('genre');
  const minYear = s.get('minYear');
  const maxYear = s.get('maxYear');
  const minBpm = s.get('minBpm');
  const maxBpm = s.get('maxBpm');
  const sort = s.get('sort') ?? 'artist'; // artist | title | bpm | year | recent

  const where: Prisma.SongWhereInput = {
    blockedAt: null,
    filePath: { not: { startsWith: '__missing:' } },
  };
  if (q.length >= 2) {
    where.OR = [
      { title: { contains: q, mode: 'insensitive' } },
      { artist: { contains: q, mode: 'insensitive' } },
      { album: { contains: q, mode: 'insensitive' } },
    ];
  }
  if (genre) where.genre = { equals: genre, mode: 'insensitive' };
  if (minYear || maxYear) {
    where.year = {
      ...(minYear ? { gte: parseInt(minYear, 10) } : {}),
      ...(maxYear ? { lte: parseInt(maxYear, 10) } : {}),
    };
  }
  if (minBpm || maxBpm) {
    where.bpm = {
      ...(minBpm ? { gte: parseInt(minBpm, 10) } : {}),
      ...(maxBpm ? { lte: parseInt(maxBpm, 10) } : {}),
    };
  }

  const orderBy: Prisma.SongOrderByWithRelationInput[] =
    sort === 'bpm'
      ? [{ bpm: { sort: 'asc', nulls: 'last' } }, { artist: 'asc' }]
      : sort === 'year'
        ? [{ year: { sort: 'desc', nulls: 'last' } }, { artist: 'asc' }]
        : sort === 'title'
          ? [{ title: 'asc' }]
          : sort === 'recent'
            ? [{ addedAt: 'desc' }]
            : [{ artist: 'asc' }, { title: 'asc' }];

  const songs = await db.song.findMany({
    where,
    take: 200,
    orderBy,
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
      durationSec: true,
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
      durationSec: s.durationSec,
    })),
  });
}
