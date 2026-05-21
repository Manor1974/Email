import { redirect } from 'next/navigation';
import { isAdmin } from '@/lib/auth-admin';
import { db } from '@/lib/db';
import { BrandHeader } from '@/components/Brand';
import { SettingsForm } from './SettingsForm';

export const dynamic = 'force-dynamic';

export default async function SettingsPage() {
  if (!(await isAdmin())) redirect('/admin/login');
  const s = await db.settings.upsert({
    where: { id: 'singleton' },
    create: { id: 'singleton' },
    update: {},
  });
  return (
    <main className="mx-auto max-w-2xl px-4 pb-24">
      <BrandHeader subtitle="Settings" />
      <SettingsForm
        initial={{
          maxSongsPerCustomer: s.maxSongsPerCustomer,
          songCooldownMinutes: s.songCooldownMinutes,
          artistCooldownMinutes: s.artistCooldownMinutes,
          customerBlendRatio: s.customerBlendRatio,
        }}
      />
    </main>
  );
}
