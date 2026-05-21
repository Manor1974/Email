'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

type CleanMode = 'AUTO' | 'FORCE_CLEAN' | 'FORCE_EXPLICIT';

interface Initial {
  maxSongsPerCustomer: number;
  songCooldownMinutes: number;
  artistCooldownMinutes: number;
  customerBlendRatio: number;
  cleanModeOverride: CleanMode;
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

      <div>
        <span className="text-sm text-manor-offwhite/70 block mb-2">
          Explicit lyrics — override the schedule
        </span>
        <div className="grid grid-cols-3 gap-2">
          <CleanModeButton
            label="Follow schedule"
            sub="Use windows on /admin/schedule"
            active={v.cleanModeOverride === 'AUTO'}
            onClick={() => setV({ ...v, cleanModeOverride: 'AUTO' })}
          />
          <CleanModeButton
            label="Clean only"
            sub="Block explicit everywhere"
            active={v.cleanModeOverride === 'FORCE_CLEAN'}
            onClick={() => setV({ ...v, cleanModeOverride: 'FORCE_CLEAN' })}
          />
          <CleanModeButton
            label="Allow explicit"
            sub="Override schedule, allow all"
            active={v.cleanModeOverride === 'FORCE_EXPLICIT'}
            onClick={() => setV({ ...v, cleanModeOverride: 'FORCE_EXPLICIT' })}
          />
        </div>
        <span className="text-xs text-manor-offwhite/40 mt-1 block">
          Tip: there's a quick toggle on the DJ console for ad-hoc nights too.
        </span>
      </div>

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

function CleanModeButton({ label, sub, active, onClick }: {
  label: string;
  sub: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`text-left p-3 rounded-lg border transition-colors
        ${active
          ? 'bg-manor-gold text-manor-navyDeep border-manor-gold'
          : 'bg-manor-grayMid text-manor-offwhite border-manor-gray hover:border-manor-gold/50'
        }`}
    >
      <div className="font-semibold text-sm">{label}</div>
      <div className={`text-xs mt-0.5 ${active ? 'text-manor-navyDeep/80' : 'text-manor-offwhite/50'}`}>{sub}</div>
    </button>
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
