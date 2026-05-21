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

interface BrowseCategories {
  genres: { name: string; count: number }[];
  decades: { decade: number; count: number }[];
}

type Filter = { genre: string } | { decade: number } | null;

export default function SearchPage() {
  const router = useRouter();
  const [q, setQ] = useState('');
  const [filter, setFilter] = useState<Filter>(null);
  const [results, setResults] = useState<SongHit[]>([]);
  const [loading, setLoading] = useState(false);
  const [adding, setAdding] = useState<string | null>(null);
  const [surprising, setSurprising] = useState(false);
  const [empty, setEmpty] = useState(false);
  const [browse, setBrowse] = useState<BrowseCategories | null>(null);

  const showingBrowse = q.trim().length < 2 && !filter;

  // Fetch categories once on mount so the chips render instantly when search is empty.
  useEffect(() => {
    fetch('/api/browse')
      .then((r) => r.json())
      .then(setBrowse)
      .catch(() => setBrowse({ genres: [], decades: [] }));
  }, []);

  // Run search/browse query whenever the text input or active filter changes.
  useEffect(() => {
    if (showingBrowse) {
      setResults([]);
      setEmpty(false);
      return;
    }
    const params = new URLSearchParams();
    if (q.trim().length >= 2) params.set('q', q.trim());
    if (filter && 'genre' in filter) params.set('genre', filter.genre);
    if (filter && 'decade' in filter) params.set('decade', String(filter.decade));

    const t = setTimeout(async () => {
      setLoading(true);
      const res = await fetch(`/api/search?${params.toString()}`);
      const json = await res.json();
      setResults(json.results ?? []);
      setEmpty((json.results ?? []).length === 0);
      setLoading(false);
    }, 200);
    return () => clearTimeout(t);
  }, [q, filter, showingBrowse]);

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

  async function surpriseMe() {
    setSurprising(true);
    const res = await fetch('/api/queue/random', { method: 'POST' });
    setSurprising(false);
    if (res.status === 401) {
      router.push('/auth');
      return;
    }
    const j = await res.json().catch(() => ({}));
    if (!res.ok) {
      alert(j.error ?? 'Could not pick a random song');
      return;
    }
    router.push('/');
  }

  const filterLabel =
    filter && 'genre' in filter
      ? filter.genre
      : filter && 'decade' in filter
        ? `${filter.decade}s`
        : null;

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

      {filter && (
        <div className="mt-3 flex items-center gap-2">
          <span className="text-sm text-manor-cream/70">Browsing</span>
          <span className="px-2 py-1 rounded-full bg-manor-teal text-manor-ink text-xs font-semibold">
            {filterLabel}
          </span>
          <button
            onClick={() => setFilter(null)}
            className="text-xs text-manor-cream/60 underline ml-auto"
          >
            Clear
          </button>
        </div>
      )}

      {showingBrowse && browse && (
        <div className="mt-6 space-y-6">
          {browse.genres.length > 0 && (
            <section>
              <h2 className="text-xs uppercase tracking-wider text-manor-cream/50 mb-2">
                Browse by genre
              </h2>
              <div className="flex flex-wrap gap-2">
                {browse.genres.map((g) => (
                  <button
                    key={g.name}
                    onClick={() => setFilter({ genre: g.name })}
                    className="px-3 py-2 rounded-full bg-manor-line text-manor-cream text-sm hover:bg-manor-teal hover:text-manor-ink transition"
                  >
                    {g.name}
                  </button>
                ))}
              </div>
            </section>
          )}

          {browse.decades.length > 0 && (
            <section>
              <h2 className="text-xs uppercase tracking-wider text-manor-cream/50 mb-2">
                Browse by decade
              </h2>
              <div className="flex flex-wrap gap-2">
                {browse.decades.map((d) => (
                  <button
                    key={d.decade}
                    onClick={() => setFilter({ decade: d.decade })}
                    className="px-3 py-2 rounded-full bg-manor-line text-manor-cream text-sm hover:bg-manor-teal hover:text-manor-ink transition"
                  >
                    {d.decade}s
                  </button>
                ))}
              </div>
            </section>
          )}

          <section>
            <button
              onClick={surpriseMe}
              disabled={surprising}
              className="btn-primary w-full"
            >
              {surprising ? 'Picking…' : '🎲 Surprise me — queue a random song'}
            </button>
          </section>

          {browse.genres.length === 0 && browse.decades.length === 0 && (
            <p className="text-center text-sm text-manor-cream/50">
              Library is still loading. Try searching by artist or title above.
            </p>
          )}
        </div>
      )}

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

      {empty && !showingBrowse && (
        <div className="card mt-4 text-center">
          <p className="text-manor-cream/70 mb-3">
            {q.trim().length >= 2
              ? `No matches for "${q}".`
              : `Nothing matches that ${filter && 'genre' in filter ? 'genre' : 'decade'} yet.`}
          </p>
          {q.trim().length >= 2 && (
            <Link href={`/request?q=${encodeURIComponent(q)}`} className="btn-primary inline-flex">
              Request this song
            </Link>
          )}
        </div>
      )}
    </main>
  );
}
