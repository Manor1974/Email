'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { BrandHeader } from '@/components/Brand';

export default function AuthPage() {
  const router = useRouter();
  const [step, setStep] = useState<'phone' | 'code'>('phone');
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function sendCode(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const res = await fetch('/api/auth/start', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ phone }),
    });
    setBusy(false);
    if (!res.ok) {
      const j = await res.json().catch(() => ({}));
      setError(j.error ?? 'Could not send code');
      return;
    }
    setStep('code');
  }

  async function verifyCode(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const res = await fetch('/api/auth/verify', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ phone, code, displayName: name || undefined }),
    });
    setBusy(false);
    if (!res.ok) {
      const j = await res.json().catch(() => ({}));
      setError(j.error ?? 'Invalid code');
      return;
    }
    router.push('/');
    router.refresh();
  }

  return (
    <main className="mx-auto max-w-md px-4">
      <BrandHeader subtitle="Sign in to queue songs" />
      {step === 'phone' ? (
        <form onSubmit={sendCode} className="space-y-3">
          <label className="block">
            <span className="text-sm text-manor-cream/70">Mobile number</span>
            <input
              type="tel"
              inputMode="tel"
              autoComplete="tel"
              className="input mt-1"
              placeholder="(555) 555-5555"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              required
            />
          </label>
          {error && <div className="text-manor-danger text-sm">{error}</div>}
          <button className="btn-primary w-full" disabled={busy}>
            {busy ? 'Sending…' : 'Text me a code'}
          </button>
          <p className="text-xs text-manor-cream/50 text-center">
            We'll text you a 6-digit code. Standard rates apply.
          </p>
        </form>
      ) : (
        <form onSubmit={verifyCode} className="space-y-3">
          <label className="block">
            <span className="text-sm text-manor-cream/70">6-digit code</span>
            <input
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              className="input mt-1 text-center text-2xl tracking-[0.5em]"
              maxLength={6}
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
              required
            />
          </label>
          <label className="block">
            <span className="text-sm text-manor-cream/70">What should we call you? (optional)</span>
            <input
              type="text"
              className="input mt-1"
              placeholder="Brian"
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={32}
            />
          </label>
          {error && <div className="text-manor-danger text-sm">{error}</div>}
          <button className="btn-primary w-full" disabled={busy || code.length !== 6}>
            {busy ? 'Verifying…' : 'Verify'}
          </button>
          <button
            type="button"
            className="btn-ghost w-full"
            onClick={() => setStep('phone')}
            disabled={busy}
          >
            Use a different number
          </button>
        </form>
      )}
    </main>
  );
}
