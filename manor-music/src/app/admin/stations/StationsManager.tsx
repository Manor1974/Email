'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface Station {
  id: string;
  name: string;
  filter: Record<string, unknown>;
  isActive: boolean;
}

interface Props {
  stations: Station[];
  availableGenres: string[];
  activeStationId: string | null;
}

interface DraftFilter {
  genres: string[];
  minYear?: number;
  maxYear?: number;
  minBpm?: number;
  maxBpm?: number;
}

interface Draft {
  id?: string;
  name: string;
  filter: DraftFilter;
}

const BLANK: Draft = {
  name: '',
  filter: { genres: [] },
};

export function StationsManager({ stations, availableGenres, activeStationId }: Props) {
  const router = useRouter();
  const [editing, setEditing] = useState<Draft | null>(null);
  const [busy, setBusy] = useState(false);

  async function activate(id: string | null) {
    setBusy(true);
    await fetch('/api/admin/stations/activate', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ stationId: id }),
    });
    setBusy(false);
    router.refresh();
  }

  async function save() {
    if (!editing) return;
    setBusy(true);
    const method = editing.id ? 'PATCH' : 'POST';
    const url = editing.id ? `/api/admin/stations/${editing.id}` : '/api/admin/stations';
    await fetch(url, {
      method,
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        name: editing.name,
        filter: editing.filter,
      }),
    });
    setBusy(false);
    setEditing(null);
    router.refresh();
  }

  async function remove(id: string) {
    if (!confirm('Delete this station?')) return;
    setBusy(true);
    await fetch(`/api/admin/stations/${id}`, { method: 'DELETE' });
    setBusy(false);
    router.refresh();
  }

  function startNew() {
    setEditing({ ...BLANK, filter: { genres: [] } });
  }
  function startEdit(s: Station) {
    const f = s.filter as Partial<DraftFilter>;
    setEditing({
      id: s.id,
      name: s.name,
      filter: {
        genres: Array.isArray(f.genres) ? f.genres : [],
        minYear: f.minYear,
        maxYear: f.maxYear,
        minBpm: f.minBpm,
        maxBpm: f.maxBpm,
      },
    });
  }

  function toggleGenre(g: string) {
    if (!editing) return;
    const has = editing.filter.genres.includes(g);
    setEditing({
      ...editing,
      filter: {
        ...editing.filter,
        genres: has ? editing.filter.genres.filter((x) => x !== g) : [...editing.filter.genres, g],
      },
    });
  }

  return (
    <div className="space-y-4">
      <section className="card">
        <div className="flex items-center justify-between mb-3">
          <div className="text-xs uppercase tracking-wider text-manor-cream/50">
            Active station
          </div>
          <button onClick={() => activate(null)} disabled={busy || !activeStationId} className="btn-ghost px-3 py-1.5 text-sm">
            Turn off
          </button>
        </div>
        {activeStationId ? (
          <div className="text-manor-cream">
            {stations.find((s) => s.id === activeStationId)?.name ?? 'Unknown'}
          </div>
        ) : (
          <div className="text-manor-cream/50 text-sm">
            None — silence between customer tracks.
          </div>
        )}
      </section>

      <section className="space-y-2">
        {stations.length === 0 ? (
          <div className="card text-manor-cream/50 text-sm">No stations yet.</div>
        ) : (
          stations.map((s) => (
            <div key={s.id} className="card flex items-center gap-3">
              <div className="min-w-0 flex-1">
                <div className="text-manor-cream truncate">{s.name}</div>
                <div className="text-xs text-manor-cream/60 truncate">
                  {summarizeFilter(s.filter)}
                </div>
              </div>
              <button
                onClick={() => activate(s.id)}
                disabled={busy || s.id === activeStationId}
                className={s.id === activeStationId ? 'btn-ghost px-3 py-2 text-sm' : 'btn-primary px-3 py-2 text-sm'}
              >
                {s.id === activeStationId ? 'Active' : 'Activate'}
              </button>
              <button onClick={() => startEdit(s)} className="btn-ghost px-3 py-2 text-sm">Edit</button>
              <button onClick={() => remove(s.id)} className="btn-danger px-3 py-2 text-sm">Delete</button>
            </div>
          ))
        )}
      </section>

      {editing ? (
        <section className="card space-y-3">
          <h3 className="text-lg font-semibold">{editing.id ? 'Edit station' : 'New station'}</h3>
          <label className="block">
            <span className="text-sm text-manor-cream/70">Name</span>
            <input
              className="input mt-1"
              value={editing.name}
              onChange={(e) => setEditing({ ...editing, name: e.target.value })}
              placeholder="Saturday Night Energy"
              maxLength={60}
            />
          </label>

          <div>
            <div className="text-sm text-manor-cream/70 mb-1">Genres (leave empty for all)</div>
            <div className="flex flex-wrap gap-1">
              {availableGenres.map((g) => {
                const on = editing.filter.genres.includes(g);
                return (
                  <button
                    key={g}
                    onClick={() => toggleGenre(g)}
                    className={`px-3 py-1.5 rounded-full text-sm ${
                      on ? 'bg-manor-teal text-manor-ink' : 'bg-manor-line text-manor-cream'
                    }`}
                  >
                    {g}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <YearInput label="Min year" value={editing.filter.minYear}
              onChange={(v) => setEditing({ ...editing, filter: { ...editing.filter, minYear: v } })} />
            <YearInput label="Max year" value={editing.filter.maxYear}
              onChange={(v) => setEditing({ ...editing, filter: { ...editing.filter, maxYear: v } })} />
            <YearInput label="Min BPM" value={editing.filter.minBpm}
              onChange={(v) => setEditing({ ...editing, filter: { ...editing.filter, minBpm: v } })} />
            <YearInput label="Max BPM" value={editing.filter.maxBpm}
              onChange={(v) => setEditing({ ...editing, filter: { ...editing.filter, maxBpm: v } })} />
          </div>

          <div className="flex gap-2">
            <button onClick={save} disabled={busy || !editing.name.trim()} className="btn-primary">
              {busy ? 'Saving…' : 'Save'}
            </button>
            <button onClick={() => setEditing(null)} className="btn-ghost">Cancel</button>
          </div>
        </section>
      ) : (
        <button onClick={startNew} className="btn-primary">+ New station</button>
      )}
    </div>
  );
}

function YearInput({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number | undefined;
  onChange: (v: number | undefined) => void;
}) {
  return (
    <label className="block">
      <span className="text-sm text-manor-cream/70">{label}</span>
      <input
        type="number"
        className="input mt-1"
        value={value ?? ''}
        onChange={(e) => onChange(e.target.value ? parseInt(e.target.value, 10) : undefined)}
      />
    </label>
  );
}

function summarizeFilter(filter: Record<string, unknown>) {
  const parts: string[] = [];
  const genres = filter.genres as string[] | undefined;
  if (genres?.length) parts.push(genres.slice(0, 4).join(', ') + (genres.length > 4 ? '…' : ''));
  if (filter.minYear || filter.maxYear) {
    parts.push(`${filter.minYear ?? '…'}–${filter.maxYear ?? '…'}`);
  }
  if (filter.minBpm || filter.maxBpm) {
    parts.push(`${filter.minBpm ?? '…'}–${filter.maxBpm ?? '…'} bpm`);
  }
  return parts.join(' · ') || 'All music';
}
