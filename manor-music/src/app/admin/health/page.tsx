import { redirect } from 'next/navigation';
import { isAdmin } from '@/lib/auth-admin';
import { BrandHeader } from '@/components/Brand';
import { HealthClient } from './HealthClient';

export const dynamic = 'force-dynamic';

export default async function HealthPage() {
  if (!(await isAdmin())) redirect('/admin/login');
  return (
    <main className="mx-auto max-w-2xl px-4 pb-24">
      <BrandHeader subtitle="System health" />
      <p className="text-sm text-manor-cream/70 mb-4">
        Quick wiring check before opening doors. Refresh after starting the player
        and seeding the library to confirm everything's green.
      </p>
      <HealthClient />
    </main>
  );
}
