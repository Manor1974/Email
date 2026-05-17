'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { BrandHeader } from '@/components/Brand';

interface SongHit {
  id: string;
  title: string;
  artist: string;
  album: string | null;
  isExplicit: boolean;
  hasVideo: boolean;
}

export default function SearchPage() {
  const router = useRouter();
  const [q, setQ] = useState('');
  const [results, setResults] = useState<SongHit[]>([]);
  const [loading, setLoading] = useState(false);
  const [adding, setAdding] = useState<string | null>(null);
  const [empty, setEmpty] = useState(false);

  useEffect(() => {
    if (q.trim().length < 2) {
      setResults([]);
      setEmpty(false);
      return;
    }
    const t = setTimeout(async () => {
      setLoading(true);
      const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`);
      const json = await res.json();
      setResults(json.results ?? []);
      setEmpty((json.results ?? []).length === 0);
      setLoading(false);
    }, 200);
    return () => clearTimeout(t);
  }, [q]);

  async function addSong(id: string) {
    setAdding(id);
    const res = await fetch('/api/queue', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ songId: id }),
    });
    setAdding(null);
    if (res.status === 401) {
      router.push('/auth');
      return;
    }
    if (!res.ok) {
      const j = await res.json().catch(() => ({}));
      alert(j.error ?? 'Could not add to queue');
      return;
    }
    router.push('/');
  }

  return (
    <main className="mx-auto max-w-md px-4 pb-24">
      <BrandHeader subtitle="Find a song" />
      <input
        autoFocus
        className="input"
        placeholder="Artist or title…"
        value={q}
        onChange={(e) => setQ(e.target.value)}
      />

      {loading && <div className="mt-4 text-manor-cream/50 text-sm">Searching…</div>}

      <ul className="mt-4 space-y-2">
        {results.map((s) => (
          <li key={s.id} className="card flex items-center gap-3">
            <div className="min-w-0 flex-1">
              <div className="text-manor-cream truncate">{s.title}</div>
              <div className="text-xs text-manor-cream/60 truncate">
                {s.artist}
                {s.isExplicit && <span className="ml-2 px-1.5 py-0.5 bg-manor-line rounded text-[10px]">E</span>}
                {s.hasVideo && <span className="ml-1 px-1.5 py-0.5 bg-manor-tealDark text-manor-ink rounded text-[10px]">VIDEO</span>}
              </div>
            </div>
            <button
              onClick={() => addSong(s.id)}
              disabled={adding === s.id}
              className="btn-primary px-3 py-2 text-sm"
            >
              {adding === s.id ? 'Adding…' : 'Add'}
            </button>
          </li>
        ))}
      </ul>

      {empty && q.trim().length >= 2 && (
        <div className="card mt-4 text-center">
          <p className="text-manor-cream/70 mb-3">No matches for "{q}".</p>
          <Link href={`/request?q=${encodeURIComponent(q)}`} className="btn-primary inline-flex">
            Request this song
          </Link>
        </div>
      )}
    </main>
  );
}
