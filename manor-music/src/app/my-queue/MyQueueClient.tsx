'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { usePusherEvent } from '@/lib/usePusher';

interface Pending {
  id: string;
  title: string;
  artist: string;
  location: string | null;
  globalPosition: number | null;
  isPlaying: boolean;
}

interface Recent {
  id: string;
  title: string;
  artist: string;
  startedAt: string;
}

function timeAgo(iso: string): string {
  const ms = Date.now() - new Date(iso).getTime();
  const m = Math.floor(ms / 60_000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return new Date(iso).toLocaleDateString();
}

export function MyQueueClient({
  initial,
}: {
  initial: { pending: Pending[]; recent: Recent[] };
}) {
  const router = useRouter();
  const [pending, setPending] = useState(initial.pending);
  const [recent] = useState(initial.recent);
  const [busy, setBusy] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    const res = await fetch('/api/my-queue', { cache: 'no-store' });
    if (!res.ok) return;
    const json = await res.json();
    setPending(json.pending ?? []);
  }, []);

  usePusherEvent('queue:updated', refresh);
  usePusherEvent('now-playing', refresh);
  useEffect(() => {
    const t = setInterval(refresh, 8000);
    return () => clearInterval(t);
  }, [refresh]);

  async function cancel(id: string) {
    if (!confirm('Remove this song from the queue?')) return;
    setBusy(id);
    const res = await fetch(`/api/my-queue/${id}`, { method: 'DELETE' });
    setBusy(null);
    if (res.ok) refresh();
    else alert('Could not remove that pick');
  }

  return (
    <div className="space-y-4">
      <Link href="/search" className="btn-primary w-full text-lg">
        Pick another song
      </Link>

      <section className="card">
        <div className="text-xs uppercase tracking-wider text-manor-cream/50 mb-2">
          My picks ({pending.length})
        </div>
        {pending.length === 0 ? (
          <div className="text-manor-cream/50 text-sm">
            You don't have anything queued. Tap above to add a song.
          </div>
        ) : (
          <ol className="space-y-3">
            {pending.map((p) => (
              <li key={p.id} className="flex items-center gap-3">
                <div className="text-manor-teal font-bold w-10 text-right">
                  {p.isPlaying ? '▶' : p.globalPosition ?? '?'}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-manor-cream truncate">{p.title}</div>
                  <div className="text-xs text-manor-cream/60 truncate">
                    {p.artist}
                    {p.location ? ` @ ${p.location}` : ''}
                  </div>
                </div>
                {!p.isPlaying && (
                  <button
                    onClick={() => cancel(p.id)}
                    disabled={busy === p.id}
                    className="btn-ghost px-3 py-2 text-sm"
                  >
                    {busy === p.id ? '…' : 'Cancel'}
                  </button>
                )}
              </li>
            ))}
          </ol>
        )}
      </section>

      {recent.length > 0 && (
        <section className="card">
          <div className="text-xs uppercase tracking-wider text-manor-cream/50 mb-2">
            Recently played
          </div>
          <ol className="space-y-2">
            {recent.map((r) => (
              <li key={r.id} className="flex items-baseline gap-2 text-sm">
                <div className="text-manor-cream/60 text-xs w-16">{timeAgo(r.startedAt)}</div>
                <div className="min-w-0 flex-1">
                  <div className="text-manor-cream truncate">{r.title}</div>
                  <div className="text-xs text-manor-cream/60 truncate">{r.artist}</div>
                </div>
              </li>
            ))}
          </ol>
        </section>
      )}
    </div>
  );
}
