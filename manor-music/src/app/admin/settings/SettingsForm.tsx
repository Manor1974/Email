'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface Initial {
  maxSongsPerCustomer: number;
  songCooldownHours: number;
  artistCooldownMinutes: number;
  customerBlendRatio: number;
}

export function SettingsForm({ initial }: { initial: Initial }) {
  const router = useRouter();
  const [v, setV] = useState(initial);
  const [busy, setBusy] = useState(false);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    await fetch('/api/admin/settings', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(v),
    });
    setBusy(false);
    router.refresh();
  }

  return (
    <form onSubmit={save} className="space-y-4">
      <NumberField label="Max songs per customer in queue" value={v.maxSongsPerCustomer}
        onChange={(n) => setV({ ...v, maxSongsPerCustomer: n })} min={1} max={20} />
      <NumberField label="Song cooldown (hours) — same track can't replay within" value={v.songCooldownHours}
        onChange={(n) => setV({ ...v, songCooldownHours: n })} min={0} max={48} />
      <NumberField label="Artist cooldown (minutes)" value={v.artistCooldownMinutes}
        onChange={(n) => setV({ ...v, artistCooldownMinutes: n })} min={0} max={240} />
      <NumberField label="Customer-to-station blend ratio (1 = customer track every N station tracks)" value={v.customerBlendRatio}
        onChange={(n) => setV({ ...v, customerBlendRatio: n })} min={0} max={10} />
      <button className="btn-primary w-full" disabled={busy}>{busy ? 'Saving…' : 'Save'}</button>
    </form>
  );
}

function NumberField({ label, value, onChange, min, max }: {
  label: string;
  value: number;
  onChange: (n: number) => void;
  min: number;
  max: number;
}) {
  return (
    <label className="block">
      <span className="text-sm text-manor-cream/70">{label}</span>
      <input type="number" className="input mt-1" value={value} min={min} max={max}
        onChange={(e) => onChange(parseInt(e.target.value || '0', 10))} />
    </label>
  );
}
