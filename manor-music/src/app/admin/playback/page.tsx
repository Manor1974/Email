import { redirect } from 'next/navigation';
import { isAdmin } from '@/lib/auth-admin';
import { db } from '@/lib/db';
import { BrandHeader } from '@/components/Brand';
import { PlaybackControls } from './PlaybackControls';

export const dynamic = 'force-dynamic';

export default async function PlaybackPage() {
  if (!(await isAdmin())) redirect('/admin/login');
  const s = await db.settings.upsert({
    where: { id: 'singleton' },
    create: { id: 'singleton' },
    update: {},
  });
  return (
    <main className="mx-auto max-w-md px-4 pb-24">
      <BrandHeader subtitle="Playback control" />
      <PlaybackControls
        initial={{
          playbackState: s.playbackState as 'PLAYING' | 'PAUSED',
          playbackVolume: s.playbackVolume,
        }}
      />
    </main>
  );
}
