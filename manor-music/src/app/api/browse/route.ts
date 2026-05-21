import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';

// Returns categories for the customer browse UI. Only includes genres and
// decades that actually have songs in the library, so we never show an
// empty bucket.
export async function GET() {
  const [genreRows, yearRows] = await Promise.all([
    db.song.groupBy({
      by: ['genre'],
      where: { blockedAt: null, genre: { not: null } },
      _count: { _all: true },
      orderBy: { _count: { genre: 'desc' } },
      take: 16,
    }),
    db.song.findMany({
      where: { blockedAt: null, year: { not: null } },
      select: { year: true },
    }),
  ]);

  const genres = genreRows
    .filter((g) => g.genre && g._count._all > 0)
    .map((g) => ({ name: g.genre as string, count: g._count._all }));

  const decadeCounts = new Map<number, number>();
  for (const { year } of yearRows) {
    if (!year) continue;
    const decade = Math.floor(year / 10) * 10;
    decadeCounts.set(decade, (decadeCounts.get(decade) ?? 0) + 1);
  }
  const decades = Array.from(decadeCounts.entries())
    .map(([decade, count]) => ({ decade, count }))
    .sort((a, b) => b.decade - a.decade);

  return NextResponse.json({ genres, decades });
}
