'use client';

import { useState } from 'react';

export function QrPrint() {
  const [baseUrl, setBaseUrl] = useState(() =>
    typeof window === 'undefined' ? '' : window.location.origin,
  );
  const [count, setCount] = useState(8);
  const [labelPrefix, setLabelPrefix] = useState('Lane');

  const cards = Array.from({ length: count }, (_, i) => ({
    label: `${labelPrefix} ${i + 1}`,
    url: `${baseUrl}/?lane=${i + 1}`,
  }));

  return (
    <div>
      <section className="card mb-4 print:hidden">
        <div className="grid sm:grid-cols-3 gap-3">
          <label className="block">
            <span className="text-sm text-manor-cream/70">Base URL</span>
            <input className="input mt-1" value={baseUrl} onChange={(e) => setBaseUrl(e.target.value)} />
          </label>
          <label className="block">
            <span className="text-sm text-manor-cream/70">Label prefix</span>
            <input className="input mt-1" value={labelPrefix} onChange={(e) => setLabelPrefix(e.target.value)} />
          </label>
          <label className="block">
            <span className="text-sm text-manor-cream/70">Number of cards</span>
            <input
              type="number"
              className="input mt-1"
              min={1}
              max={64}
              value={count}
              onChange={(e) => setCount(Math.max(1, Math.min(64, parseInt(e.target.value || '1', 10))))}
            />
          </label>
        </div>
        <div className="mt-3 flex gap-2">
          <button onClick={() => window.print()} className="btn-primary">Print</button>
        </div>
      </section>

      <section className="grid grid-cols-2 gap-4 print:grid-cols-2 print:gap-0">
        {cards.map((c) => (
          <div
            key={c.url}
            className="bg-manor-cream text-manor-ink rounded-2xl p-6 flex flex-col items-center justify-center
                       print:rounded-none print:break-inside-avoid print:p-8"
            style={{ minHeight: '350px' }}
          >
            <div className="text-2xl font-black tracking-wide mb-1">
              MANOR <span className="text-manor-tealDark">LANES</span>
            </div>
            <div className="text-xs uppercase tracking-[0.4em] text-manor-tealDark mb-4">Jukebox</div>
            <img
              src={`/api/qr?text=${encodeURIComponent(c.url)}`}
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
