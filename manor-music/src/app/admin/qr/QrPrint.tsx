'use client';

import { useMemo, useState } from 'react';

// A "zone group" is one row in the editor — either a single labelled card
// (e.g. "Bar") or a range with a prefix (e.g. "Lane 1" through "Lane 16").
// All groups are flattened into the print sheet.
interface ZoneGroup {
  id: string;
  type: 'single' | 'range';
  label: string;          // single: full label; range: prefix (e.g. "Lane")
  start: number;          // range only
  end: number;            // range only
}

interface Card {
  label: string;          // human label printed on the card
  location: string;       // the value that ends up in ?location=
}

const DEFAULTS: ZoneGroup[] = [
  { id: 'lanes',      type: 'range',  label: 'Lane',             start: 1, end: 16 },
  { id: 'bar',        type: 'single', label: 'Bar',              start: 1, end: 1 },
  { id: 'volleyball', type: 'range',  label: 'Volleyball Court', start: 1, end: 4 },
];

function expand(groups: ZoneGroup[]): Card[] {
  const out: Card[] = [];
  for (const g of groups) {
    if (g.type === 'single') {
      const label = g.label.trim();
      if (label) out.push({ label, location: label });
    } else {
      const prefix = g.label.trim();
      if (!prefix) continue;
      const lo = Math.min(g.start, g.end);
      const hi = Math.max(g.start, g.end);
      for (let i = lo; i <= hi; i += 1) {
        const label = `${prefix} ${i}`;
        out.push({ label, location: label });
      }
    }
  }
  return out;
}

function uid() {
  return Math.random().toString(36).slice(2, 9);
}

export function QrPrint() {
  const [baseUrl, setBaseUrl] = useState(() =>
    typeof window === 'undefined' ? '' : window.location.origin,
  );
  const [groups, setGroups] = useState<ZoneGroup[]>(DEFAULTS);
  const cards = useMemo(() => expand(groups), [groups]);

  function update(i: number, patch: Partial<ZoneGroup>) {
    setGroups((gs) => gs.map((g, idx) => (idx === i ? { ...g, ...patch } : g)));
  }
  function remove(i: number) {
    setGroups((gs) => gs.filter((_, idx) => idx !== i));
  }
  function addSingle() {
    setGroups((gs) => [...gs, { id: uid(), type: 'single', label: '', start: 1, end: 1 }]);
  }
  function addRange() {
    setGroups((gs) => [...gs, { id: uid(), type: 'range', label: '', start: 1, end: 8 }]);
  }

  return (
    <div>
      <section className="card mb-4 print:hidden">
        <label className="block mb-3">
          <span className="text-sm text-manor-cream/70">Base URL</span>
          <input className="input mt-1" value={baseUrl} onChange={(e) => setBaseUrl(e.target.value)} />
        </label>

        <div className="space-y-2">
          {groups.map((g, i) => (
            <div key={g.id} className="flex flex-wrap items-center gap-2">
              <select
                className="input w-auto"
                value={g.type}
                onChange={(e) => update(i, { type: e.target.value as 'single' | 'range' })}
              >
                <option value="single">Single</option>
                <option value="range">Range</option>
              </select>
              <input
                className="input flex-1 min-w-[160px]"
                placeholder={g.type === 'single' ? 'Bar' : 'Lane'}
                value={g.label}
                onChange={(e) => update(i, { label: e.target.value })}
              />
              {g.type === 'range' ? (
                <>
                  <input
                    type="number"
                    className="input w-20"
                    value={g.start}
                    onChange={(e) => update(i, { start: parseInt(e.target.value || '1', 10) })}
                  />
                  <span className="text-manor-cream/50">→</span>
                  <input
                    type="number"
                    className="input w-20"
                    value={g.end}
                    onChange={(e) => update(i, { end: parseInt(e.target.value || '1', 10) })}
                  />
                </>
              ) : null}
              <button onClick={() => remove(i)} className="btn-danger px-3 py-2 text-sm">×</button>
            </div>
          ))}
        </div>

        <div className="flex gap-2 mt-3">
          <button onClick={addSingle} className="btn-ghost text-sm">+ Single (Bar, Lobby…)</button>
          <button onClick={addRange} className="btn-ghost text-sm">+ Range (Lanes 1–16)</button>
          <div className="ml-auto self-center text-sm text-manor-cream/60">
            {cards.length} card{cards.length === 1 ? '' : 's'}
          </div>
          <button onClick={() => window.print()} className="btn-primary">Print</button>
        </div>
      </section>

      <section className="grid grid-cols-2 gap-4 print:grid-cols-2 print:gap-0">
        {cards.map((c) => (
          <div
            key={c.label}
            className="bg-manor-cream text-manor-ink rounded-2xl p-6 flex flex-col items-center justify-center
                       print:rounded-none print:break-inside-avoid print:p-8"
            style={{ minHeight: '350px' }}
          >
            <div className="text-2xl font-black tracking-wide mb-1">
              MANOR <span className="text-manor-tealDark">LANES</span>
            </div>
            <div className="text-xs uppercase tracking-[0.4em] text-manor-tealDark mb-4">Jukebox</div>
            <img
              src={`/api/qr?text=${encodeURIComponent(`${baseUrl}/?location=${encodeURIComponent(c.location)}`)}`}
              alt={c.label}
              width={180}
              height={180}
              className="mb-3"
            />
            <div className="text-sm font-semibold mb-1">Scan to add a song</div>
            <div className="text-xs text-manor-ink/60">{c.label}</div>
          </div>
        ))}
      </section>

      <style>{`
        @media print {
          body { background: white !important; }
          .card, header, .btn-primary, .btn-ghost { display: none !important; }
          main { max-width: none !important; padding: 0 !important; }
        }
      `}</style>
    </div>
  );
}
