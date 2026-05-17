'use client';

import { useCallback, useEffect, useState } from 'react';
import { usePusherEvent } from '@/lib/usePusher';

interface NowPlaying {
  song: { id: string; title: string; artist: string };
}

interface QueueRow {
  id: string;
  song: { title: string; artist: string };
  customer: { displayName: string | null } | null;
  location?: string | null;
}

interface Initial {
  nowPlaying: NowPlaying | null;
  queue: QueueRow[];
}

// Live view of the current jukebox state for the customer home page.
// Falls back to 6-second polling whenever Pusher isn't configured (dev) or
// the websocket drops. Pusher events also trigger an immediate refresh so
// new tracks appear without waiting for the next poll.
export function LiveQueue({ initial }: { initial: Initial }) {
  const [state, setState] = useState<Initial>(initial);

  const refresh = useCallback(async () => {
    try {
      const res = await fetch('/api/queue', { cache: 'no-store' });
      if (!res.ok) return;
      const json = (await res.json()) as Initial;
      setState(json);
    } catch {
      /* network blip — next tick retries */
    }
  }, []);

  usePusherEvent('queue:updated', refresh);
  usePusherEvent('now-playing', refresh);

  useEffect(() => {
    const t = setInterval(refresh, 6000);
    return () => clearInterval(t);
  }, [refresh]);

  return (
    <>
      <section className="card mb-4">
        <div className="text-xs uppercase tracking-wider text-manor-cream/50 mb-1">Now playing</div>
        {state.nowPlaying?.song ? (
          <div>
            <div className="text-lg font-semibold text-manor-cream">{state.nowPlaying.song.title}</div>
            <div className="text-sm text-manor-cream/70">{state.nowPlaying.song.artist}</div>
          </div>
        ) : (
          <div className="text-manor-cream/50">Nothing playing right now.</div>
        )}
      </section>

      <section className="card">
        <div className="text-xs uppercase tracking-wider text-manor-cream/50 mb-2">
          Up next ({state.queue.length})
        </div>
        {state.queue.length === 0 ? (
          <div className="text-manor-cream/50 text-sm">Queue is empty.</div>
        ) : (
          <ol className="space-y-3">
            {state.queue.slice(0, 10).map((item, i) => (
              <li key={item.id} className="flex items-center gap-3">
                <div className="text-manor-teal font-bold w-6 text-right">{i + 1}</div>
                <div className="min-w-0 flex-1">
                  <div className="text-manor-cream truncate">{item.song.title}</div>
                  <div className="text-xs text-manor-cream/60 truncate">
                    {item.song.artist}
                    {item.customer?.displayName ? ` · ${item.customer.displayName}` : ''}
                    {item.location ? ` @ ${item.location}` : ''}
                  </div>
                </div>
              </li>
            ))}
          </ol>
        )}
      </section>
    </>
  );
}
