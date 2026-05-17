'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface Window {
  id?: string;
  dayOfWeek: number;
  startMinute: number;
  endMinute: number;
  enabled: boolean;
}

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function hhmm(min: number) {
  const h = Math.floor(min / 60).toString().padStart(2, '0');
  const m = (min % 60).toString().padStart(2, '0');
  return `${h}:${m}`;
}
function parseHHMM(v: string) {
  const [h, m] = v.split(':').map((x) => parseInt(x, 10));
  return h * 60 + (m || 0);
}

export function ScheduleEditor({
  initial,
  override,
}: {
  initial: Window[];
  override: 'AUTO' | 'FORCE_CLEAN' | 'FORCE_EXPLICIT';
}) {
  const router = useRouter();
  const [windows, setWindows] = useState<Window[]>(initial);
  const [mode, setMode] = useState(override);
  const [busy, setBusy] = useState(false);

  function update(i: number, patch: Partial<Window>) {
    setWindows((ws) => ws.map((w, idx) => (idx === i ? { ...w, ...patch } : w)));
  }
  function remove(i: number) {
    setWindows((ws) => ws.filter((_, idx) => idx !== i));
  }
  function add() {
    setWindows((ws) => [
      ...ws,
      { dayOfWeek: 5, startMinute: 21 * 60, endMinute: 24 * 60 - 1, enabled: true },
    ]);
  }

  async function save() {
    setBusy(true);
    await fetch('/api/admin/schedule', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ windows, override: mode }),
    });
    setBusy(false);
    router.refresh();
  }

  return (
    <div className="space-y-4">
      <section className="card">
        <div className="text-xs uppercase tracking-wider text-manor-cream/50 mb-2">Override</div>
        <select
          className="input"
          value={mode}
          onChange={(e) => setMode(e.target.value as typeof mode)}
        >
          <option value="AUTO">Auto — follow the schedule below</option>
          <option value="FORCE_CLEAN">Force CLEAN — never play explicit</option>
          <option value="FORCE_EXPLICIT">Force EXPLICIT — always allow explicit</option>
        </select>
      </section>

      <section className="card space-y-3">
        <div className="text-xs uppercase tracking-wider text-manor-cream/50">Windows</div>
        {windows.length === 0 && (
          <div className="text-manor-cream/50 text-sm">No windows defined. Explicit is never allowed.</div>
        )}
        {windows.map((w, i) => (
          <div key={i} className="flex flex-wrap items-center gap-2">
            <select
              className="input w-auto"
              value={w.dayOfWeek}
              onChange={(e) => update(i, { dayOfWeek: parseInt(e.target.value, 10) })}
            >
              {DAYS.map((d, idx) => (
                <option key={d} value={idx}>{d}</option>
              ))}
            </select>
            <input
              type="time"
              className="input w-auto"
              value={hhmm(w.startMinute)}
              onChange={(e) => update(i, { startMinute: parseHHMM(e.target.value) })}
            />
            <span className="text-manor-cream/50">→</span>
            <input
              type="time"
              className="input w-auto"
              value={hhmm(w.endMinute)}
              onChange={(e) => update(i, { endMinute: parseHHMM(e.target.value) })}
            />
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={w.enabled}
                onChange={(e) => update(i, { enabled: e.target.checked })}
              />
              enabled
            </label>
            <button onClick={() => remove(i)} className="btn-danger px-3 py-2 text-sm">Delete</button>
          </div>
        ))}
        <button onClick={add} className="btn-ghost">+ Add window</button>
      </section>

      <button onClick={save} disabled={busy} className="btn-primary w-full">
        {busy ? 'Saving…' : 'Save schedule'}
      </button>
    </div>
  );
}
