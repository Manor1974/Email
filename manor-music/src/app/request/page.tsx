'use client';

import { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { BrandHeader } from '@/components/Brand';

function RequestForm() {
  const router = useRouter();
  const params = useSearchParams();
  const initial = params.get('q') ?? '';

  const [title, setTitle] = useState(initial);
  const [artist, setArtist] = useState('');
  const [notes, setNotes] = useState('');
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const res = await fetch('/api/requests', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ title, artist, notes }),
    });
    setBusy(false);
    if (res.status === 401) {
      router.push('/auth');
      return;
    }
    if (!res.ok) {
      const j = await res.json().catch(() => ({}));
      setError(j.error ?? 'Could not send request');
      return;
    }
    setDone(true);
  }

  if (done) {
    return (
      <div className="card text-center">
        <h2 className="text-lg font-semibold text-manor-cream mb-1">Request sent!</h2>
        <p className="text-sm text-manor-cream/70 mb-4">
          We'll text you when this song is added to the library.
        </p>
        <button className="btn-primary w-full" onClick={() => router.push('/')}>
          Back to jukebox
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="space-y-3">
      <label className="block">
        <span className="text-sm text-manor-cream/70">Song title</span>
        <input
          className="input mt-1"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
          maxLength={120}
        />
      </label>
      <label className="block">
        <span className="text-sm text-manor-cream/70">Artist</span>
        <input
          className="input mt-1"
          value={artist}
          onChange={(e) => setArtist(e.target.value)}
          required
          maxLength={120}
        />
      </label>
      <label className="block">
        <span className="text-sm text-manor-cream/70">Notes (optional)</span>
        <textarea
          className="input mt-1 min-h-[80px]"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          maxLength={500}
        />
      </label>
      {error && <div className="text-manor-danger text-sm">{error}</div>}
      <button className="btn-primary w-full" disabled={busy}>
        {busy ? 'Sending…' : 'Send request'}
      </button>
    </form>
  );
}

export default function RequestPage() {
  return (
    <main className="mx-auto max-w-md px-4">
      <BrandHeader subtitle="Don't see it? Ask us to add it." />
      <Suspense fallback={null}>
        <RequestForm />
      </Suspense>
    </main>
  );
}
