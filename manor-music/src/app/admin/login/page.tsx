'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { BrandHeader } from '@/components/Brand';

export default function AdminLogin() {
  const router = useRouter();
  const [pin, setPin] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const res = await fetch('/api/admin/login', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ pin }),
    });
    setBusy(false);
    if (!res.ok) {
      setError('Wrong PIN');
      return;
    }
    router.push('/admin');
    router.refresh();
  }

  return (
    <main className="mx-auto max-w-md px-4">
      <BrandHeader subtitle="Admin sign-in" />
      <form onSubmit={submit} className="space-y-3">
        <label className="block">
          <span className="text-sm text-manor-cream/70">PIN</span>
          <input
            className="input mt-1 text-center text-2xl tracking-[0.5em]"
            type="password"
            inputMode="numeric"
            value={pin}
            onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
            required
          />
        </label>
        {error && <div className="text-manor-danger text-sm">{error}</div>}
        <button className="btn-primary w-full" disabled={busy}>
          {busy ? 'Signing in…' : 'Sign in'}
        </button>
      </form>
    </main>
  );
}
