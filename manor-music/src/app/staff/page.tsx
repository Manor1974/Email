import { redirect } from 'next/navigation';
import { isAdmin } from '@/lib/auth-admin';
import { db } from '@/lib/db';
import { canonicalGenre } from '@/lib/genres';
import { StaffConsole } from './StaffConsole';

export const dynamic = 'force-dynamic';

export default async function StaffPage() {
  if (!(await isAdmin())) redirect('/admin/login');

  // Genres with songs that are not deleted-from-disk and not blocked. Drives
  // the filter chips. We collapse variants like "Hip-Hop" / "hip hop" /
  // "HipHop" to a single canonical name so only one chip appears per genre,
  // and aggregate counts across the variants.
  const genreRows = await db.song.findMany({
    where: {
      genre: { not: null },
      blockedAt: null,
      filePath: { not: { startsWith: '__missing:' } },
    },
    distinct: ['genre'],
    select: { genre: true },
    take: 100,
  });

  const seen = new Set<string>();
  const genres: string[] = [];
  for (const row of genreRows) {
    const canon = canonicalGenre(row.genre);
    if (!canon || seen.has(canon)) continue;
    seen.add(canon);
    genres.push(canon);
  }
  genres.sort();

  return <StaffConsole genres={genres} />;
}
