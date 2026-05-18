'use client';

import { useEffect, useState } from 'react';

interface State {
  playbackState: 'PLAYING' | 'PAUSED';
  playbackVolume: number;
}

export function PlaybackControls({ initial }: { initial: State }) {
  const [state, setState] = useState<State>(initial);
  const [pendingVolume, setPendingVolume] = useState<number | null>(null);

  // Push pause/play immediately; debounce the volume slider so dragging
  // doesn't flood the API.
  async function patch(patch: Partial<State>) {
    await fetch('/api/admin/playback', {
      method: 'PATCH',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(patch),
    });
  }

  useEffect(() => {
    if (pendingVolume === null) return;
    const t = setTimeout(() => {
      patch({ playbackVolume: pendingVolume });
      setState((s) => ({ ...s, playbackVolume: pendingVolume }));
      setPendingVolume(null);
    }, 250);
    return () => clearTimeout(t);
  }, [pendingVolume]);

  function togglePause() {
    const next = state.playbackState === 'PLAYING' ? 'PAUSED' : 'PLAYING';
    setState({ ...state, playbackState: next });
    patch({ playbackState: next });
  }

  async function skip() {
    await fetch('/api/admin/queue/skip', { method: 'POST' });
  }

  function volDelta(delta: number) {
    const next = Math.max(0, Math.min(100, state.playbackVolume + delta));
    setState({ ...state, playbackVolume: next });
    patch({ playbackVolume: next });
  }

  const v = pendingVolume ?? state.playbackVolume;

  return (
    <div className="space-y-4">
      <section className="card">
        <div className="text-xs uppercase tracking-wider text-manor-cream/50 mb-3">Transport</div>
        <div className="grid grid-cols-3 gap-2">
          <button onClick={togglePause} className="btn-primary text-2xl py-6">
            {state.playbackState === 'PLAYING' ? '⏸' : '▶'}
          </button>
          <button onClick={skip} className="btn-ghost text-2xl py-6">⏭</button>
          <div className="card flex items-center justify-center text-sm">
            {state.playbackState === 'PAUSED' ? 'Paused' : 'Playing'}
          </div>
        </div>
        <p className="text-xs text-manor-cream/50 mt-2">
          Pause stops the current track in place. Skip ends it and advances to the next.
        </p>
      </section>

      <section className="card">
        <div className="flex items-center justify-between mb-3">
          <div className="text-xs uppercase tracking-wider text-manor-cream/50">Volume</div>
          <div className="text-2xl font-bold text-manor-cream">{v}</div>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={() => volDelta(-10)} className="btn-ghost px-3 py-2">−10</button>
          <input
            type="range"
            min={0}
            max={100}
            value={v}
            onChange={(e) => setPendingVolume(parseInt(e.target.value, 10))}
            className="flex-1 accent-manor-teal"
          />
          <button onClick={() => volDelta(10)} className="btn-ghost px-3 py-2">+10</button>
        </div>
        <p className="text-xs text-manor-cream/50 mt-2">
          Changes apply within ~1 second. The player applies volume live via mpv IPC.
        </p>
      </section>
    </div>
  );
}
