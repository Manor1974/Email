'use client';

import { useCallback, useEffect, useState } from 'react';
import Image from 'next/image';
import { usePusherEvent } from '@/lib/usePusher';

interface Track {
  title: string;
  artist: string;
  addedBy: string | null;
}

interface State {
  nowPlaying: Track | null;
  upNext: Track[];
}

export function DisplayClient({ initial }: { initial: State }) {
  const [state, setState] = useState<State>(initial);

  const refresh = useCallback(async () => {
    try {
      const res = await fetch('/api/queue', { cache: 'no-store' });
      if (!res.ok) return;
      const json = await res.json();
      setState({
        nowPlaying: json.nowPlaying
          ? {
              title: json.nowPlaying.song.title,
              artist: json.nowPlaying.song.artist,
              addedBy: json.nowPlaying.customer?.displayName ?? null,
            }
          : null,
        upNext: (json.queue ?? []).slice(0, 5).map((q: {
          song: { title: string; artist: string };
          customer: { displayName: string | null } | null;
        }) => ({
          title: q.song.title,
          artist: q.song.artist,
          addedBy: q.customer?.displayName ?? null,
        })),
      });
    } catch {
      /* network blip */
    }
  }, []);

  usePusherEvent('queue:updated', refresh);
  usePusherEvent('now-playing', refresh);

  useEffect(() => {
    const t = setInterval(refresh, 8000);
    return () => clearInterval(t);
  }, [refresh]);

  return (
    <main className="min-h-dvh flex flex-col px-12 py-10 text-manor-cream">
      <header className="flex items-center gap-4 mb-12">
        <Image src="/icons/icon-192.png" alt="" width={64} height={64} className="rounded-xl" />
        <div>
          <div className="text-4xl font-black tracking-wide">
            MANOR <span className="text-manor-teal">LANES</span>
          </div>
          <div className="text-manor-gold text-lg tracking-[0.4em] uppercase">Jukebox</div>
        </div>
        <div className="ml-auto text-right">
          <div className="text-sm text-manor-cream/60 uppercase tracking-wider">
            Add to the queue
          </div>
          <div className="text-2xl text-manor-teal font-bold">manor.lanes/play</div>
        </div>
      </header>

      <section className="flex-1 flex flex-col justify-center">
        {state.nowPlaying ? (
          <>
            <div className="text-manor-cream/50 uppercase tracking-[0.4em] text-sm mb-2">
              Now Playing
            </div>
            <div className="text-8xl font-black leading-tight mb-4 break-words">
              {state.nowPlaying.title}
            </div>
            <div className="text-4xl text-manor-cream/80 mb-3">{state.nowPlaying.artist}</div>
            {state.nowPlaying.addedBy && (
              <div className="text-xl text-manor-teal">
                Picked by {state.nowPlaying.addedBy}
              </div>
            )}
          </>
        ) : (
          <div className="text-center">
            <div className="text-7xl font-black mb-4">Pick the next song</div>
            <div className="text-2xl text-manor-cream/60">
              Scan a QR code or visit manor.lanes/play on your phone
            </div>
          </div>
        )}
      </section>

      <footer className="mt-8">
        <div className="text-manor-cream/50 uppercase tracking-[0.4em] text-sm mb-3">
          Up Next
        </div>
        {state.upNext.length === 0 ? (
          <div className="text-manor-cream/40 text-xl">Queue is open — go ahead.</div>
        ) : (
          <ol className="space-y-2">
            {state.upNext.map((t, i) => (
              <li key={i} className="flex items-baseline gap-4 text-2xl">
                <span className="text-manor-teal font-bold w-8 text-right">{i + 1}</span>
                <span className="font-semibold truncate">{t.title}</span>
                <span className="text-manor-cream/60 truncate">— {t.artist}</span>
                {t.addedBy && (
                  <span className="text-manor-gold text-base ml-auto truncate">{t.addedBy}</span>
                )}
              </li>
            ))}
          </ol>
        )}
      </footer>
    </main>
  );
}
