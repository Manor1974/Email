import { redirect } from 'next/navigation';
import { isAdmin } from '@/lib/auth-admin';
import { db } from '@/lib/db';
import { StaffConsole } from './StaffConsole';

export const dynamic = 'force-dynamic';

export default async function StaffPage() {
  if (!(await isAdmin())) redirect('/admin/login');

  // Genres with songs that are not deleted-from-disk and not blocked. Drives
  // the filter chips. Distinct + counted by Postgres so we only ship what
  // actually exists in the library.
  const genreRows = await db.song.findMany({
    where: {
      genre: { not: null },
      blockedAt: null,
      filePath: { not: { startsWith: '__missing:' } },
    },
    distinct: ['genre'],
    select: { genre: true },
    take: 50,
  });
  const genres = genreRows.map((g) => g.genre!).filter(Boolean).sort();

  return <StaffConsole genres={genres} />;
}
