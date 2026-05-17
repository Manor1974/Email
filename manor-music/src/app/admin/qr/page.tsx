import { redirect } from 'next/navigation';
import { isAdmin } from '@/lib/auth-admin';
import { BrandHeader } from '@/components/Brand';
import { QrPrint } from './QrPrint';

export const dynamic = 'force-dynamic';

export default async function QrPage() {
  if (!(await isAdmin())) redirect('/admin/login');
  return (
    <main className="mx-auto max-w-3xl px-4 pb-24">
      <BrandHeader subtitle="Lane QR codes" />
      <p className="text-sm text-manor-cream/70 mb-4 print:hidden">
        Generate Manor Lanes-branded QR cards to place at each lane or table.
        Print 4-up on letter-size paper, cut, and laminate.
      </p>
      <QrPrint />
    </main>
  );
}
