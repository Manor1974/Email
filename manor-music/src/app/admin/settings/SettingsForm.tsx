'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface Initial {
  maxSongsPerCustomer: number;
  songCooldownMinutes: number;
  artistCooldownMinutes: number;
  customerBlendRatio: number;
  staffBackgroundUrl: string | null;
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
      <NumberField label="Song cooldown (minutes) — same track can't replay within" value={v.songCooldownMinutes}
        onChange={(n) => setV({ ...v, songCooldownMinutes: n })} min={0} max={2880} />
      <NumberField label="Artist cooldown (minutes)" value={v.artistCooldownMinutes}
        onChange={(n) => setV({ ...v, artistCooldownMinutes: n })} min={0} max={240} />
      <NumberField label="Customer-to-station blend ratio (1 = customer track every N station tracks)" value={v.customerBlendRatio}
        onChange={(n) => setV({ ...v, customerBlendRatio: n })} min={0} max={10} />

      <label className="block">
        <span className="text-sm text-manor-offwhite/70">
          Staff DJ console background image URL (optional)
        </span>
        <input
          type="url"
          className="input mt-1"
          placeholder="https://example.com/bowling-alley.jpg — leave blank for solid navy"
          value={v.staffBackgroundUrl ?? ''}
          onChange={(e) => setV({ ...v, staffBackgroundUrl: e.target.value || null })}
        />
        <span className="text-xs text-manor-offwhite/40 mt-1 block">
          Image is dimmed behind the DJ console UI. Try Unsplash for free venue photos.
        </span>
      </label>

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
      <span className="text-sm text-manor-offwhite/70">{label}</span>
      <input type="number" className="input mt-1" value={value} min={min} max={max}
        onChange={(e) => onChange(parseInt(e.target.value || '0', 10))} />
    </label>
  );
}
