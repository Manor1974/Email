'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

interface Item {
  id: string;
  title: string;
  artist: string;
  blockedAt: string;
  blockedReason: string | null;
}

export function BlocklistTable({ items }: { items: Item[] }) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);

  async function unblock(id: string) {
    setBusy(id);
    await fetch(`/api/admin/songs/${id}/block`, { method: 'DELETE' });
    setBusy(null);
    router.refresh();
  }

  if (items.length === 0) {
    return <div className="card text-manor-cream/50 text-sm">Nothing blocked.</div>;
  }
  return (
    <ul className="space-y-2">
      {items.map((b) => (
        <li key={b.id} className="card flex items-center gap-3">
          <div className="min-w-0 flex-1">
            <div className="text-manor-cream truncate">{b.title}</div>
            <div className="text-xs text-manor-cream/60 truncate">
              {b.artist}
              {b.blockedReason ? ` · ${b.blockedReason}` : ''}
            </div>
          </div>
          <button onClick={() => unblock(b.id)} disabled={busy === b.id} className="btn-ghost px-3 py-2 text-sm">
            {busy === b.id ? '…' : 'Unblock'}
          </button>
        </li>
      ))}
    </ul>
  );
}
