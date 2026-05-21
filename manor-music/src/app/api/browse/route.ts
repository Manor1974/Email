import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { canonicalGenre } from '@/lib/genres';

export const dynamic = 'force-dynamic';

// Returns categories for the customer browse UI. Only includes genres and
// decades that actually have songs in the library, so we never show an
// empty bucket.
export async function GET() {
  const [genreRows, yearRows] = await Promise.all([
    db.song.groupBy({
      by: ['genre'],
      where: {
        blockedAt: null,
        filePath: { not: { startsWith: '__missing:' } },
        genre: { not: null },
      },
      _count: { _all: true },
      orderBy: { _count: { genre: 'desc' } },
      take: 16,
    }),
    db.song.findMany({
      where: {
        blockedAt: null,
        filePath: { not: { startsWith: '__missing:' } },
        year: { not: null },
      },
      select: { year: true },
    }),
  ]);

  // Collapse variant spellings ("Hip-Hop", "HipHop", "hip hop") into a
  // single canonical bucket per genre and sum their song counts.
  const canonGenres = new Map<string, number>();
  for (const g of genreRows) {
    if (!g.genre || g._count._all === 0) continue;
    const canon = canonicalGenre(g.genre);
    if (!canon) continue;
    canonGenres.set(canon, (canonGenres.get(canon) ?? 0) + g._count._all);
  }
  const genres = Array.from(canonGenres.entries())
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count);

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
