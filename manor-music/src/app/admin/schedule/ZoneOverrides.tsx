'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export type Mode = 'AUTO' | 'FORCE_CLEAN' | 'FORCE_EXPLICIT';

interface Override {
  zone: string;
  mode: Mode;
}

export function ZoneOverrides({
  initial,
  knownZones,
}: {
  initial: Override[];
  knownZones: string[];
}) {
  const router = useRouter();
  const [rows, setRows] = useState<Override[]>(initial);
  const [busy, setBusy] = useState(false);

  function add() {
    const remaining = knownZones.filter((z) => !rows.some((r) => r.zone === z));
    const zone = remaining[0] ?? '';
    setRows((r) => [...r, { zone, mode: 'FORCE_CLEAN' }]);
  }
  function update(i: number, patch: Partial<Override>) {
    setRows((r) => r.map((row, idx) => (idx === i ? { ...row, ...patch } : row)));
  }
  function remove(i: number) {
    setRows((r) => r.filter((_, idx) => idx !== i));
  }

  async function save() {
    setBusy(true);
    await fetch('/api/admin/zone-overrides', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ overrides: rows.filter((r) => r.zone.trim()) }),
    });
    setBusy(false);
    router.refresh();
  }

  return (
    <section className="card space-y-3">
      <div className="text-xs uppercase tracking-wider text-manor-cream/50">Per-zone overrides</div>
      <p className="text-xs text-manor-cream/60">
        Override the global schedule for a specific zone. Useful for "always clean
        at the volleyball courts" or "always allow explicit at the bar".
      </p>
      {rows.length === 0 && (
        <div className="text-manor-cream/50 text-sm">No overrides — every zone follows the global schedule.</div>
      )}
      {rows.map((r, i) => (
        <div key={i} className="flex flex-wrap items-center gap-2">
          <input
            list="known-zones"
            className="input flex-1 min-w-[180px]"
            placeholder="Zone label (e.g. Bar, Volleyball Court 1)"
            value={r.zone}
            onChange={(e) => update(i, { zone: e.target.value })}
          />
          <select
            className="input w-auto"
            value={r.mode}
            onChange={(e) => update(i, { mode: e.target.value as Mode })}
          >
            <option value="AUTO">Follow global</option>
            <option value="FORCE_CLEAN">Always clean</option>
            <option value="FORCE_EXPLICIT">Always allow explicit</option>
          </select>
          <button onClick={() => remove(i)} className="btn-danger px-3 py-2 text-sm">Delete</button>
        </div>
      ))}
      <datalist id="known-zones">
        {knownZones.map((z) => (
          <option key={z} value={z} />
        ))}
      </datalist>
      <div className="flex gap-2">
        <button onClick={add} className="btn-ghost">+ Add zone override</button>
        <button onClick={save} disabled={busy} className="btn-primary ml-auto">
          {busy ? 'Saving…' : 'Save zone overrides'}
        </button>
      </div>
    </section>
  );
}
