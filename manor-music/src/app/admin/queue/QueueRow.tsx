'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface Props {
  id: string;
  position: number;
  title: string;
  artist: string;
  source: string;
  addedBy: string | null;
}

export function QueueRow(props: Props) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function remove() {
    if (!confirm(`Remove "${props.title}" from the queue?`)) return;
    setBusy(true);
    const res = await fetch(`/api/admin/queue/${props.id}`, { method: 'DELETE' });
    setBusy(false);
    if (res.ok) router.refresh();
  }

  return (
    <li className="flex items-center gap-3">
      <div className="text-manor-teal font-bold w-6 text-right">{props.position}</div>
      <div className="min-w-0 flex-1">
        <div className="text-manor-cream truncate">{props.title}</div>
        <div className="text-xs text-manor-cream/60 truncate">
          {props.artist}
          {props.addedBy ? ` · ${props.addedBy}` : ` · ${props.source.toLowerCase()}`}
        </div>
      </div>
      <button onClick={remove} disabled={busy} className="btn-danger px-3 py-2 text-sm">
        {busy ? '…' : 'Remove'}
      </button>
    </li>
  );
}
