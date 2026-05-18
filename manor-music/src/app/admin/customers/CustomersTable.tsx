'use client';

import { useEffect, useState } from 'react';

interface Customer {
  id: string;
  phone: string;
  displayName: string | null;
  bannedAt: string | null;
  banReason: string | null;
  createdAt: string;
  lastSeenAt: string;
  queuedCount: number;
  playedCount: number;
}

function timeAgo(iso: string): string {
  const ms = Date.now() - new Date(iso).getTime();
  const m = Math.floor(ms / 60_000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 30) return `${d}d ago`;
  return new Date(iso).toLocaleDateString();
}

export function CustomersTable() {
  const [q, setQ] = useState('');
  const [filter, setFilter] = useState<'all' | 'banned' | 'active'>('all');
  const [rows, setRows] = useState<Customer[]>([]);
  const [busy, setBusy] = useState<string | null>(null);

  async function load() {
    const params = new URLSearchParams();
    if (q) params.set('q', q);
    if (filter !== 'all') params.set('filter', filter);
    const res = await fetch(`/api/admin/customers?${params.toString()}`);
    const json = await res.json();
    setRows(json.results ?? []);
  }

  useEffect(() => {
    const t = setTimeout(load, 150);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q, filter]);

  async function setBan(id: string, ban: boolean) {
    if (ban) {
      const reason = prompt('Reason (optional):');
      if (reason === null) return;
      setBusy(id);
      await fetch(`/api/admin/customers/${id}/ban`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ reason }),
      });
    } else {
      if (!confirm('Lift the ban?')) return;
      setBusy(id);
      await fetch(`/api/admin/customers/${id}/ban`, { method: 'DELETE' });
    }
    setBusy(null);
    load();
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        <input
          className="input flex-1 min-w-[200px]"
          placeholder="Search by phone or name…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        <select className="input w-auto" value={filter} onChange={(e) => setFilter(e.target.value as typeof filter)}>
          <option value="all">All customers</option>
          <option value="active">Not banned</option>
          <option value="banned">Banned only</option>
        </select>
      </div>

      {rows.length === 0 ? (
        <div className="card text-manor-cream/50 text-sm">No matches.</div>
      ) : (
        <ul className="space-y-2">
          {rows.map((c) => (
            <li key={c.id} className="card flex items-center gap-3">
              <div className="min-w-0 flex-1">
                <div className="text-manor-cream truncate">
                  {c.displayName || <span className="text-manor-cream/50 italic">no name</span>}
                  {c.bannedAt && (
                    <span className="ml-2 px-1.5 py-0.5 bg-manor-danger/30 text-manor-danger rounded text-[10px]">
                      BANNED
                    </span>
                  )}
                </div>
                <div className="text-xs text-manor-cream/60 truncate">
                  {c.phone} · {c.playedCount} played · {c.queuedCount} queued · last seen {timeAgo(c.lastSeenAt)}
                  {c.banReason ? ` · ${c.banReason}` : ''}
                </div>
              </div>
              {c.bannedAt ? (
                <button onClick={() => setBan(c.id, false)} disabled={busy === c.id} className="btn-ghost px-3 py-2 text-sm">
                  {busy === c.id ? '…' : 'Unban'}
                </button>
              ) : (
                <button onClick={() => setBan(c.id, true)} disabled={busy === c.id} className="btn-danger px-3 py-2 text-sm">
                  {busy === c.id ? '…' : 'Ban'}
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
