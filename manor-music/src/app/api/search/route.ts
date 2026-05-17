import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { explicitAllowed } from '@/lib/schedule';

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get('q')?.trim() ?? '';
  if (q.length < 2) return NextResponse.json({ results: [] });

  const allowExplicit = await explicitAllowed();

  // Search title + artist. If explicit isn't allowed right now, we only show
  // songs that are either already clean or have a clean counterpart.
  const songs = await db.song.findMany({
    where: {
      blockedAt: null,
      AND: [
        {
          OR: [
            { title: { contains: q, mode: 'insensitive' } },
            { artist: { contains: q, mode: 'insensitive' } },
            { album: { contains: q, mode: 'insensitive' } },
          ],
        },
        allowExplicit
          ? {}
          : {
              OR: [
                { isExplicit: false },
                { pairOf: { some: { isExplicit: false } } },
              ],
            },
      ],
    },
    take: 30,
    orderBy: [{ artist: 'asc' }, { title: 'asc' }],
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
