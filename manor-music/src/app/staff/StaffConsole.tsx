'use client';

import { useEffect, useState } from 'react';

interface Hit {
  id: string;
  title: string;
  artist: string;
  album: string | null;
  isExplicit: boolean;
  hasVideo: boolean;
  genre?: string | null;
  year?: number | null;
  bpm?: number | null;
}

interface NowPlaying {
  song: { title: string; artist: string } | null;
}

const DECADES = [
  { label: '2020s', min: 2020, max: 2099 },
  { label: '2010s', min: 2010, max: 2019 },
  { label: '2000s', min: 2000, max: 2009 },
  { label: '90s', min: 1990, max: 1999 },
  { label: '80s', min: 1980, max: 1989 },
  { label: '70s', min: 1970, max: 1979 },
];

export function StaffConsole({ genres }: { genres: string[] }) {
  const [q, setQ] = useState('');
  const [genre, setGenre] = useState<string | null>(null);
  const [decade, setDecade] = useState<{ min: number; max: number } | null>(null);
  const [results, setResults] = useState<Hit[]>([]);
  const [np, setNp] = useState<NowPlaying | null>(null);
  const [queueLen, setQueueLen] = useState(0);

  useEffect(() => {
    const refresh = async () => {
      const r = await fetch('/api/queue');
      const j = await r.json();
      setNp(j.nowPlaying ?? null);
      setQueueLen((j.queue ?? []).length);
    };
    refresh();
    const t = setInterval(refresh, 5000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    const params = new URLSearchParams();
    if (q) params.set('q', q);
    if (genre) params.set('genre', genre);
    if (decade) {
      params.set('minYear', String(decade.min));
      params.set('maxYear', String(decade.max));
    }
    fetch(`/api/staff/browse?${params.toString()}`)
      .then((r) => r.json())
      .then((j) => setResults(j.results ?? []));
  }, [q, genre, decade]);

  async function queue(songId: string, asStation = false) {
    await fetch('/api/staff/queue', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ songId, asStation }),
    });
  }

  async function skip() {
    await fetch('/api/admin/queue/skip', { method: 'POST' });
  }

  async function block(songId: string, title: string) {
    const reason = prompt(`Block "${title}"? Optional reason:`);
    if (reason === null) return;
    await fetch(`/api/admin/songs/${songId}/block`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ reason }),
    });
    setResults((r) => r.filter((s) => s.id !== songId));
  }

  return (
    <div className="grid md:grid-cols-[280px_1fr] gap-4">
      <aside className="space-y-4">
        <section className="card">
          <div className="text-xs uppercase tracking-wider text-manor-cream/50 mb-2">Now playing</div>
          {np?.song ? (
            <div>
              <div className="font-semibold text-manor-cream">{np.song.title}</div>
              <div className="text-sm text-manor-cream/70 mb-2">{np.song.artist}</div>
              <button onClick={skip} className="btn-ghost w-full">Skip</button>
            </div>
          ) : (
            <div className="text-manor-cream/50">—</div>
          )}
          <div className="text-xs text-manor-cream/50 mt-2">{queueLen} in queue</div>
        </section>

        <section className="card">
          <div className="text-xs uppercase tracking-wider text-manor-cream/50 mb-2">Genre</div>
          <div className="flex flex-wrap gap-1">
            <Chip active={genre === null} onClick={() => setGenre(null)}>All</Chip>
            {genres.map((g) => (
              <Chip key={g} active={genre === g} onClick={() => setGenre(g)}>{g}</Chip>
            ))}
          </div>
        </section>

        <section className="card">
          <div className="text-xs uppercase tracking-wider text-manor-cream/50 mb-2">Decade</div>
          <div className="flex flex-wrap gap-1">
            <Chip active={decade === null} onClick={() => setDecade(null)}>All</Chip>
            {DECADES.map((d) => (
              <Chip
                key={d.label}
                active={decade?.min === d.min}
                onClick={() => setDecade(d)}
              >
                {d.label}
              </Chip>
            ))}
          </div>
        </section>
      </aside>

      <section>
        <input
          className="input mb-3"
          placeholder="Search title or artist…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />

        <ul className="space-y-2">
          {results.map((s) => (
            <li key={s.id} className="card flex items-center gap-3">
              <div className="min-w-0 flex-1">
                <div className="text-manor-cream truncate">{s.title}</div>
                <div className="text-xs text-manor-cream/60 truncate">
                  {s.artist}
                  {s.genre ? ` · ${s.genre}` : ''}
                  {s.year ? ` · ${s.year}` : ''}
                  {s.isExplicit && <span className="ml-2 px-1.5 py-0.5 bg-manor-line rounded text-[10px]">E</span>}
                  {s.hasVideo && <span className="ml-1 px-1.5 py-0.5 bg-manor-tealDark text-manor-ink rounded text-[10px]">VIDEO</span>}
                </div>
              </div>
              <button onClick={() => queue(s.id, false)} className="btn-primary px-3 py-2 text-sm">Queue</button>
              <button onClick={() => queue(s.id, true)} className="btn-ghost px-3 py-2 text-sm" title="Background station (skipped if customer queue fills)">
                Station
              </button>
              <button onClick={() => block(s.id, s.title)} className="btn-danger px-3 py-2 text-sm" title="Hide from customers and stations">
                Block
              </button>
            </li>
          ))}
          {results.length === 0 && (
            <li className="text-manor-cream/50 text-sm">No matches.</li>
          )}
        </ul>
      </section>
    </div>
  );
}

function Chip({ active, onClick, children }: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`px-3 py-1.5 rounded-full text-sm transition-colors ${
        active
          ? 'bg-manor-teal text-manor-ink'
          : 'bg-manor-line text-manor-cream hover:bg-manor-line/70'
      }`}
    >
      {children}
    </button>
  );
}
