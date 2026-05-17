import { redirect } from 'next/navigation';
import { isAdmin } from '@/lib/auth-admin';
import { db } from '@/lib/db';
import { BrandHeader } from '@/components/Brand';
import { StaffConsole } from './StaffConsole';

export const dynamic = 'force-dynamic';

export default async function StaffPage() {
  if (!(await isAdmin())) redirect('/admin/login');
  const genres = await db.song.findMany({
    where: { genre: { not: null } },
    distinct: ['genre'],
    select: { genre: true },
    take: 50,
  });
  return (
    <main className="mx-auto max-w-5xl px-4 pb-24">
      <BrandHeader subtitle="Staff DJ console" />
      <StaffConsole genres={genres.map((g) => g.genre!).filter(Boolean).sort()} />
    </main>
  );
}
