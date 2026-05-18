'use client';

import { useEffect, useState } from 'react';

interface Check {
  name: string;
  status: 'ok' | 'warn' | 'fail';
  detail: string;
}

interface Result {
  overall: 'ok' | 'warn' | 'fail';
  checks: Check[];
}

const STYLES: Record<Check['status'], string> = {
  ok:   'text-manor-teal',
  warn: 'text-manor-gold',
  fail: 'text-manor-danger',
};
const ICONS: Record<Check['status'], string> = {
  ok:   '●',
  warn: '◐',
  fail: '✕',
};

export function HealthClient() {
  const [result, setResult] = useState<Result | null>(null);
  const [loading, setLoading] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/health', { cache: 'no-store' });
      setResult(await res.json());
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    const t = setInterval(load, 8000);
    return () => clearInterval(t);
  }, []);

  if (!result) {
    return <div className="card text-manor-cream/50">{loading ? 'Checking…' : 'No data'}</div>;
  }

  return (
    <div className="space-y-3">
      <div className={`card text-2xl font-bold ${STYLES[result.overall]}`}>
        {ICONS[result.overall]} {result.overall === 'ok' ? 'All systems go' : result.overall === 'warn' ? 'Mostly fine — see warnings' : 'Something is broken'}
      </div>
      <ul className="space-y-2">
        {result.checks.map((c) => (
          <li key={c.name} className="card flex items-center gap-3">
            <div className={`text-2xl ${STYLES[c.status]} w-8 text-center`}>{ICONS[c.status]}</div>
            <div className="min-w-0 flex-1">
              <div className="text-manor-cream">{c.name}</div>
              <div className="text-xs text-manor-cream/60 truncate">{c.detail}</div>
            </div>
          </li>
        ))}
      </ul>
      <button onClick={load} disabled={loading} className="btn-ghost w-full">
        {loading ? 'Checking…' : 'Refresh'}
      </button>
    </div>
  );
}
