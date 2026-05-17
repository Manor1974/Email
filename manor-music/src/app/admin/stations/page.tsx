import { redirect } from 'next/navigation';
import { isAdmin } from '@/lib/auth-admin';
import { BrandHeader } from '@/components/Brand';

export const dynamic = 'force-dynamic';

export default async function StationsPage() {
  if (!(await isAdmin())) redirect('/admin/login');
  return (
    <main className="mx-auto max-w-3xl px-4 pb-24">
      <BrandHeader subtitle="Stations &amp; auto-DJ" />
      <div className="card">
        <p className="text-manor-cream/70">
          Curated background-music stations come in the next pass. For now, use the staff
          DJ console at <a className="text-manor-teal underline" href="/staff">/staff</a> to manually
          queue background music when the customer queue is light.
        </p>
      </div>
    </main>
  );
}
