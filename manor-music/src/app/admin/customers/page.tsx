import { redirect } from 'next/navigation';
import { isAdmin } from '@/lib/auth-admin';
import { BrandHeader } from '@/components/Brand';
import { CustomersTable } from './CustomersTable';

export const dynamic = 'force-dynamic';

export default async function CustomersPage() {
  if (!(await isAdmin())) redirect('/admin/login');
  return (
    <main className="mx-auto max-w-4xl px-4 pb-24">
      <BrandHeader subtitle="Customers" />
      <p className="text-sm text-manor-cream/70 mb-4">
        Search by phone or display name. Ban prevents the customer from queueing
        any further songs without deleting their history.
      </p>
      <CustomersTable />
    </main>
  );
}
