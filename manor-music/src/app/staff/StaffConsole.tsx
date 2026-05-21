'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { usePusherEvent } from '@/lib/usePusher';
import { BrandHeader } from '@/components/Brand';

type QueueSource = 'CUSTOMER' | 'STAFF' | 'STATION';

interface SongMeta {
  id: string;
  title: string;
  artist: string;
  album: string | null;
  durationSec: number;
  isExplicit: boolean;
  hasVideo: boolean;
  genre: string | null;
  year: number | null;
  bpm: number | null;
}

interface QueueItem {
  id: string;
  source: QueueSource;
  location: string | null;
  startedAt: string | null;
  customer: { displayName: string | null } | null;
  song: SongMeta;
}

type CleanMode = 'AUTO' | 'FORCE_CLEAN' | 'FORCE_EXPLICIT';

interface ConsoleState {
  nowPlaying: QueueItem | null;
  queue: QueueItem[];
  playback: { state: 'PLAYING' | 'PAUSED'; volume: number };
  cleanMode: CleanMode;
  activeStation: { id: string; name: string } | null;
  backgroundUrl: string | null;
}

interface SearchHit extends SongMeta {}

const DECADES = [
  { label: '2020s', min: 2020, max: 2029 },
  { label: '2010s', min: 2010, max: 2019 },
  { label: '2000s', min: 2000, max: 2009 },
  { label: '90s', min: 1990, max: 1999 },
  { label: '80s', min: 1980, max: 1989 },
  { label: '70s', min: 1970, max: 1979 },
];

const BPM_RANGES = [
  { label: 'Chill (60–90)', min: 60, max: 90 },
  { label: 'Mid (90–110)', min: 90, max: 110 },
  { label: 'Upbeat (110–130)', min: 110, max: 130 },
  { label: 'Dance (130+)', min: 130, max: 200 },
];

const SORT_OPTIONS = [
  { value: 'artist', label: 'Artist A→Z' },
  { value: 'title', label: 'Title A→Z' },
  { value: 'bpm', label: 'BPM (slow→fast)' },
  { value: 'year', label: 'Year (new→old)' },
  { value: 'recent', label: 'Recently added' },
];

function fmtTime(sec: number) {
  if (!isFinite(sec) || sec < 0) sec = 0;
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

function metaLine(s: SongMeta) {
  const parts: string[] = [];
  if (s.genre) parts.push(s.genre);
  if (s.year) parts.push(String(s.year));
  if (s.bpm) parts.push(`${s.bpm} BPM`);
  parts.push(fmtTime(s.durationSec));
  return parts.join(' · ');
}

function sourceLabel(item: QueueItem) {
  if (item.source === 'STATION') return 'Auto-DJ';
  if (item.source === 'STAFF') return 'Staff';
  const name = item.customer?.displayName ?? 'Customer';
  return item.location ? `${name} @ ${item.location}` : name;
}

export function StaffConsole({ genres }: { genres: string[] }) {
  const [state, setState] = useState<ConsoleState | null>(null);
  const [q, setQ] = useState('');
  const [genre, setGenre] = useState<string | null>(null);
  const [decade, setDecade] = useState<typeof DECADES[number] | null>(null);
  const [bpm, setBpm] = useState<typeof BPM_RANGES[number] | null>(null);
  const [sort, setSort] = useState('artist');
  const [results, setResults] = useState<SearchHit[]>([]);
  const [searching, setSearching] = useState(false);
  const [toast, setToast] = useState<{ text: string; tone: 'ok' | 'err' } | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const flashToast = useCallback((text: string, tone: 'ok' | 'err' = 'ok') => {
    setToast({ text, tone });
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 2200);
  }, []);

  const loadState = useCallback(async () => {
    try {
      const r = await fetch('/api/staff/state', { cache: 'no-store' });
      if (!r.ok) return;
      const j = (await r.json()) as ConsoleState;
      setState(j);
    } catch {
      /* network blip */
    }
  }, []);

  // Initial load + polling fallback (in case Pusher drops)
  useEffect(() => {
    loadState();
    const t = setInterval(loadState, 5000);
    return () => clearInterval(t);
  }, [loadState]);

  usePusherEvent('queue:updated', loadState);
  usePusherEvent('now-playing', loadState);
  usePusherEvent('settings:updated', loadState);

  // Search/browse query — chip clicks feel instant (0ms), text typing waits
  // 200ms so we don't fire a fetch per keystroke. The fetch always runs on
  // mount so the library auto-populates with the full alphabetical list.
  useEffect(() => {
    const params = new URLSearchParams();
    if (q.trim().length >= 2) params.set('q', q.trim());
    if (genre) params.set('genre', genre);
    if (decade) {
      params.set('minYear', String(decade.min));
      params.set('maxYear', String(decade.max));
    }
    if (bpm) {
      params.set('minBpm', String(bpm.min));
      params.set('maxBpm', String(bpm.max));
    }
    params.set('sort', sort);
    setSearching(true);
    const wait = q.trim().length >= 2 ? 200 : 0;
    const t = setTimeout(async () => {
      try {
        const r = await fetch(`/api/staff/browse?${params.toString()}`);
        const j = await r.json();
        setResults(j.results ?? []);
      } finally {
        setSearching(false);
      }
    }, wait);
    return () => clearTimeout(t);
  }, [q, genre, decade, bpm, sort]);

  async function action(
    url: string,
    body: object | null,
    method: 'POST' | 'DELETE' | 'PATCH' = 'POST',
    successMsg?: string,
  ) {
    try {
      const r = await fetch(url, {
        method,
        headers: body ? { 'content-type': 'application/json' } : undefined,
        body: body ? JSON.stringify(body) : undefined,
      });
      if (!r.ok) {
        const j = await r.json().catch(() => ({}));
        flashToast(j.error ?? `Failed (${r.status})`, 'err');
        return false;
      }
      if (successMsg) flashToast(successMsg);
      loadState();
      return true;
    } catch (e) {
      flashToast((e as Error).message, 'err');
      return false;
    }
  }

  const playNow      = (id: string, title: string) => action('/api/staff/play-now',  { songId: id }, 'POST', `▶ Playing now: ${title}`);
  const playNext     = (id: string, title: string) => action('/api/staff/play-next', { songId: id }, 'POST', `⏭ Up next: ${title}`);
  const addToQueue   = (id: string, title: string) => action('/api/staff/queue',     { songId: id }, 'POST', `+ Queued: ${title}`);
  const removeQueued = (id: string)                 => action(`/api/admin/queue/${id}`, null, 'DELETE', `Removed from queue`);
  const skip         = ()                           => action('/api/admin/queue/skip', null, 'POST', `Skipped`);
  const togglePause  = ()                           => action('/api/admin/playback', { playbackState: state?.playback.state === 'PAUSED' ? 'PLAYING' : 'PAUSED' }, 'PATCH');
  const setVolume    = (v: number)                  => action('/api/admin/playback', { playbackVolume: v }, 'PATCH');
  const setCleanMode = (mode: CleanMode) => {
    const label = mode === 'AUTO' ? 'Schedule' : mode === 'FORCE_CLEAN' ? 'Clean only' : 'Explicit allowed';
    return action('/api/admin/clean-mode', { cleanModeOverride: mode }, 'PATCH', `Explicit lyrics: ${label}`);
  };
  const blockSong    = async (id: string, title: string) => {
    const reason = window.prompt(`Block "${title}"? Optional reason:`);
    if (reason === null) return;
    await action(`/api/admin/songs/${id}/block`, { reason }, 'POST', `Blocked: ${title}`);
    setResults((r) => r.filter((s) => s.id !== id));
  };

  // ------- Progress / pause tracking -------
  //
  // The DB stores `startedAt` on the queueItem but doesn't track when the user
  // hit pause, so the elapsed-time calculation has to compensate client-side.
  // When the playback state flips PAUSED, we freeze elapsed at the pause
  // instant. When it flips back to PLAYING, we add the pause duration to a
  // running accumulator so the bar resumes from where it stopped instead of
  // jumping to wall-clock-elapsed.
  //
  // Updates every 250ms; the CSS transition smooths between ticks for a
  // visually-smooth bar.

  const [progressSec, setProgressSec] = useState(0);
  const accumulatedPauseMsRef = useRef(0);
  const pauseStartMsRef       = useRef<number | null>(null);
  const lastStateRef          = useRef<'PLAYING' | 'PAUSED' | null>(null);
  const lastTrackIdRef        = useRef<string | null>(null);

  // React to song changes — reset pause accumulators.
  useEffect(() => {
    const nowId = state?.nowPlaying?.id ?? null;
    if (nowId !== lastTrackIdRef.current) {
      accumulatedPauseMsRef.current = 0;
      pauseStartMsRef.current       = null;
      lastTrackIdRef.current        = nowId;
    }
  }, [state?.nowPlaying?.id]);

  // React to play/pause toggles.
  useEffect(() => {
    const cur = state?.playback.state;
    if (!cur) return;
    const prev = lastStateRef.current;
    if (cur === 'PAUSED' && prev !== 'PAUSED') {
      // Just hit pause — snapshot wall-clock now so we can freeze the bar.
      pauseStartMsRef.current = Date.now();
    } else if (cur === 'PLAYING' && prev === 'PAUSED' && pauseStartMsRef.current !== null) {
      // Just resumed — fold the pause duration into the accumulator.
      accumulatedPauseMsRef.current += Date.now() - pauseStartMsRef.current;
      pauseStartMsRef.current = null;
    }
    lastStateRef.current = cur;
  }, [state?.playback.state]);

  // The 4Hz tick that drives the progress bar + time text.
  useEffect(() => {
    if (!state?.nowPlaying?.startedAt) {
      setProgressSec(0);
      return;
    }
    const startMs = new Date(state.nowPlaying.startedAt).getTime();
    const update = () => {
      const isPaused = state.playback.state === 'PAUSED';
      const effectiveNow = isPaused && pauseStartMsRef.current !== null
        ? pauseStartMsRef.current
        : Date.now();
      const elapsedMs = effectiveNow - startMs - accumulatedPauseMsRef.current;
      setProgressSec(Math.max(0, elapsedMs / 1000));
    };
    update();
    const t = setInterval(update, 250);
    return () => clearInterval(t);
  }, [state?.nowPlaying?.id, state?.nowPlaying?.startedAt, state?.playback.state]);

  const queueDuration = useMemo(
    () => (state?.queue ?? []).reduce((acc, q) => acc + q.song.durationSec, 0),
    [state?.queue],
  );

  if (!state) {
    return (
      <main className="min-h-screen flex items-center justify-center text-manor-offwhite/70">
        Loading…
      </main>
    );
  }

  const np            = state.nowPlaying;
  const isPaused      = state.playback.state === 'PAUSED';
  const upNext        = state.queue[0] ?? null;
  const restOfQueue   = state.queue.slice(1);
  const songDuration  = np?.song.durationSec ?? 0;
  const progressPct   = np ? Math.min(100, (progressSec / Math.max(1, songDuration)) * 100) : 0;
  const remainingSec  = Math.max(0, songDuration - progressSec);

  // For "starts in X" on queue items: cumulative remaining time.
  // Index 0 = upNext → starts in `remainingSec`
  // Index N = starts in remainingSec + sum(durations up to N-1)
  const startsInFor = (idx: number) => {
    let total = remainingSec;
    // restOfQueue is index 0 onward; the corresponding upcoming songs that
    // play *before* this one are restOfQueue[0..idx-1] plus upNext.
    if (upNext) {
      for (let i = 0; i < idx; i++) {
        total += restOfQueue[i]?.song.durationSec ?? 0;
      }
    }
    return total;
  };

  const upNextStartsIn = remainingSec;

  return (
    <main className="relative min-h-screen">
      {/* Optional background image */}
      {state.backgroundUrl && (
        <div
          className="fixed inset-0 -z-10 bg-cover bg-center"
          style={{ backgroundImage: `url(${state.backgroundUrl})` }}
        >
          <div className="absolute inset-0 bg-manor-navyDeep/80" />
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div
          className={`fixed top-4 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-xl shadow-lg
            ${toast.tone === 'err' ? 'bg-manor-danger text-white' : 'bg-manor-gold text-manor-navyDeep'}`}
        >
          {toast.text}
        </div>
      )}

      <div className="mx-auto max-w-7xl px-4 pb-24">
        <BrandHeader subtitle="DJ Console" />

        {/* TWO-DECK ROW */}
        <div className="grid lg:grid-cols-2 gap-4 mb-4 mt-4">
          <Deck label="Now playing" tone="active">
            {np ? (
              <>
                <CoverPlaceholder song={np.song} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <div className="text-xl font-bold text-manor-white truncate">{np.song.title}</div>
                    {isPaused && (
                      <span className="px-2 py-0.5 bg-manor-danger text-white rounded text-[10px] font-bold tracking-wider animate-pulse">
                        ⏸ PAUSED
                      </span>
                    )}
                  </div>
                  <div className="text-manor-offwhite/80 truncate">{np.song.artist}</div>
                  <div className="text-xs text-manor-offwhite/50 truncate mt-1">{metaLine(np.song)}</div>
                  <div className="text-xs text-manor-gold mt-1">{sourceLabel(np)}</div>
                  <div className="mt-3">
                    <div className="h-2 rounded-full bg-manor-navyDeep overflow-hidden">
                      <div
                        className={`h-full rounded-full ${isPaused ? 'bg-manor-grayLight' : 'bg-manor-gold'}`}
                        style={{
                          width: `${progressPct}%`,
                          transition: 'width 250ms linear',
                        }}
                      />
                    </div>
                    <div className="flex justify-between text-xs text-manor-offwhite/60 mt-1 font-mono">
                      <span>{fmtTime(progressSec)}</span>
                      <span className="text-manor-gold">-{fmtTime(remainingSec)}</span>
                      <span>{fmtTime(songDuration)}</span>
                    </div>
                  </div>
                  <div className="flex gap-2 mt-3">
                    <button
                      onClick={togglePause}
                      className={isPaused ? 'btn-primary flex-1' : 'btn-ghost flex-1'}
                    >
                      {isPaused ? '▶ Resume' : '⏸ Pause'}
                    </button>
                    <button onClick={skip} className="btn-ghost flex-1">⏭ Skip</button>
                  </div>
                </div>
              </>
            ) : (
              <div className="text-manor-offwhite/50 text-center w-full">Nothing playing right now.</div>
            )}
          </Deck>

          <Deck label="Up next" tone="next">
            {upNext ? (
              <>
                <CoverPlaceholder song={upNext.song} dim />
                <div className="min-w-0 flex-1">
                  <div className="text-xl font-bold text-manor-white truncate">{upNext.song.title}</div>
                  <div className="text-manor-offwhite/80 truncate">{upNext.song.artist}</div>
                  <div className="text-xs text-manor-offwhite/50 truncate mt-1">{metaLine(upNext.song)}</div>
                  <div className="text-xs text-manor-gold mt-1">{sourceLabel(upNext)}</div>
                  <div className="text-xs text-manor-offwhite/60 mt-2 font-mono">
                    Starts in <span className="text-manor-gold">{fmtTime(upNextStartsIn)}</span>
                    {isPaused && <span className="text-manor-danger ml-2">(paused)</span>}
                  </div>
                  <div className="flex gap-2 mt-3">
                    <button onClick={() => removeQueued(upNext.id)} className="btn-ghost flex-1">
                      ⏏ Remove
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <div className="text-manor-offwhite/50 text-center w-full">Queue is empty.</div>
            )}
          </Deck>
        </div>

        {/* PLAYBACK BAR */}
        <section className="card mb-4 bg-manor-grayMid/70 space-y-3">
          <div className="flex items-center gap-4">
            <span className="text-xs uppercase tracking-wider text-manor-offwhite/50 w-16">Volume</span>
            <input
              type="range"
              min={0}
              max={100}
              value={state.playback.volume}
              onChange={(e) => setVolume(parseInt(e.target.value, 10))}
              className="flex-1 accent-manor-gold"
            />
            <span className="text-manor-gold font-mono w-10 text-right">{state.playback.volume}</span>
            <div className="ml-4 text-xs text-manor-offwhite/50 whitespace-nowrap">
              Auto-DJ: <span className="text-manor-gold">{state.activeStation?.name ?? 'off'}</span>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs uppercase tracking-wider text-manor-offwhite/50 w-16 shrink-0">Explicit</span>
            <CleanModeChip active={state.cleanMode === 'AUTO'}            onClick={() => setCleanMode('AUTO')}>Schedule</CleanModeChip>
            <CleanModeChip active={state.cleanMode === 'FORCE_CLEAN'}     onClick={() => setCleanMode('FORCE_CLEAN')}>Clean only</CleanModeChip>
            <CleanModeChip active={state.cleanMode === 'FORCE_EXPLICIT'}  onClick={() => setCleanMode('FORCE_EXPLICIT')}>Allow explicit</CleanModeChip>
            <span className="text-xs text-manor-offwhite/40 ml-auto whitespace-nowrap">
              {state.cleanMode === 'AUTO' && 'Following /admin/schedule windows'}
              {state.cleanMode === 'FORCE_CLEAN' && 'Explicit blocked regardless of time'}
              {state.cleanMode === 'FORCE_EXPLICIT' && 'Explicit allowed regardless of time'}
            </span>
          </div>
        </section>

        {/* QUEUE */}
        <section className="card mb-4">
          <div className="flex items-center justify-between mb-3">
            <div>
              <span className="text-xs uppercase tracking-wider text-manor-offwhite/50">Queue</span>
              <span className="ml-2 text-manor-offwhite/70 text-sm">
                {restOfQueue.length} track{restOfQueue.length === 1 ? '' : 's'} · {fmtTime(queueDuration - (upNext?.song.durationSec ?? 0))}
              </span>
            </div>
          </div>
          {restOfQueue.length === 0 ? (
            <div className="text-manor-offwhite/50 text-sm">Nothing else queued. Add songs below.</div>
          ) : (
            <ol className="space-y-1">
              {restOfQueue.map((item, i) => (
                <li
                  key={item.id}
                  className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-manor-navyDeep/40"
                >
                  <span className="text-manor-gold font-mono text-sm w-6 text-right">{i + 2}</span>
                  <div className="min-w-0 flex-1">
                    <div className="text-manor-white truncate">{item.song.title}</div>
                    <div className="text-xs text-manor-offwhite/60 truncate">
                      {item.song.artist} · {sourceLabel(item)}
                      {item.song.isExplicit && (
                        <span className="ml-1 px-1.5 py-0.5 bg-manor-grayMid rounded text-[10px]">E</span>
                      )}
                    </div>
                  </div>
                  <span className="text-xs text-manor-offwhite/60 font-mono whitespace-nowrap">
                    in {fmtTime(startsInFor(i + 1))}
                  </span>
                  <span className="text-xs text-manor-offwhite/40 font-mono hidden md:inline">
                    {fmtTime(item.song.durationSec)}
                  </span>
                  <button
                    onClick={() => removeQueued(item.id)}
                    className="text-manor-offwhite/50 hover:text-manor-danger px-2 py-1"
                    title="Remove from queue"
                  >
                    ⏏
                  </button>
                </li>
              ))}
            </ol>
          )}
        </section>

        {/* SEARCH + BROWSE */}
        <section className="card">
          <div className="flex items-baseline justify-between mb-3">
            <h2 className="text-xs uppercase tracking-wider text-manor-offwhite/50">Library</h2>
            <span className="text-manor-gold font-mono text-sm">
              {searching ? 'Searching…' : `${results.length} song${results.length === 1 ? '' : 's'}`}
            </span>
          </div>

          <div className="grid md:grid-cols-[1fr_auto] gap-3 mb-3">
            <input
              className="input"
              placeholder="Search title, artist, or album…"
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
            <select
              className="input md:w-56"
              value={sort}
              onChange={(e) => setSort(e.target.value)}
            >
              {SORT_OPTIONS.map((o) => (
                <option key={o.value} value={o.value} className="bg-manor-navy">{o.label}</option>
              ))}
            </select>
          </div>

          {/* Active filter banner — visible feedback that the chips drive the list */}
          {(genre || decade || bpm) && (
            <div className="flex items-center gap-2 mb-3 text-sm text-manor-offwhite/80">
              <span className="text-manor-offwhite/50">Showing:</span>
              {genre && (
                <button
                  onClick={() => setGenre(null)}
                  className="px-2 py-0.5 bg-manor-gold text-manor-navyDeep rounded-full text-xs font-semibold"
                >
                  {genre} ×
                </button>
              )}
              {decade && (
                <button
                  onClick={() => setDecade(null)}
                  className="px-2 py-0.5 bg-manor-gold text-manor-navyDeep rounded-full text-xs font-semibold"
                >
                  {decade.label} ×
                </button>
              )}
              {bpm && (
                <button
                  onClick={() => setBpm(null)}
                  className="px-2 py-0.5 bg-manor-gold text-manor-navyDeep rounded-full text-xs font-semibold"
                >
                  {bpm.label} ×
                </button>
              )}
              <button
                onClick={() => { setGenre(null); setDecade(null); setBpm(null); }}
                className="text-xs text-manor-offwhite/40 underline ml-auto"
              >
                Clear all
              </button>
            </div>
          )}

          <div className="flex flex-wrap gap-2 mb-2">
            {genres.map((g) => (
              <Chip key={g} active={genre === g} onClick={() => setGenre(genre === g ? null : g)}>
                {g}
              </Chip>
            ))}
          </div>
          <div className="flex flex-wrap gap-2 mb-2">
            {DECADES.map((d) => (
              <Chip key={d.label} active={decade?.label === d.label} onClick={() => setDecade(decade?.label === d.label ? null : d)}>
                {d.label}
              </Chip>
            ))}
          </div>
          <div className="flex flex-wrap gap-2 mb-3">
            {BPM_RANGES.map((b) => (
              <Chip key={b.label} active={bpm?.label === b.label} onClick={() => setBpm(bpm?.label === b.label ? null : b)}>
                {b.label}
              </Chip>
            ))}
          </div>

          <ul className="space-y-1">
            {results.map((s) => (
              <li
                key={s.id}
                className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-manor-navyDeep/40"
              >
                <CoverPlaceholder song={s} compact />
                <div className="min-w-0 flex-1">
                  <div className="text-manor-white truncate">{s.title}</div>
                  <div className="text-xs text-manor-offwhite/60 truncate">
                    {s.artist} · {metaLine(s)}
                    {s.isExplicit && (
                      <span className="ml-1 px-1.5 py-0.5 bg-manor-grayMid rounded text-[10px]">E</span>
                    )}
                    {s.hasVideo && (
                      <span className="ml-1 px-1.5 py-0.5 bg-manor-gold/70 text-manor-navyDeep rounded text-[10px]">
                        VIDEO
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={() => playNow(s.id, s.title)}
                    className="px-2.5 py-1.5 rounded-lg bg-manor-gold text-manor-navyDeep text-xs font-semibold hover:bg-manor-goldDeep"
                    title="Skip current track and play this immediately"
                  >
                    ▶ Now
                  </button>
                  <button
                    onClick={() => playNext(s.id, s.title)}
                    className="px-2.5 py-1.5 rounded-lg bg-manor-navyMid text-manor-white text-xs font-semibold border border-manor-gray hover:bg-manor-navy"
                    title="Insert after the current track"
                  >
                    ⏭ Next
                  </button>
                  <button
                    onClick={() => addToQueue(s.id, s.title)}
                    className="px-2.5 py-1.5 rounded-lg bg-manor-grayMid text-manor-offwhite text-xs font-semibold border border-manor-gray hover:bg-manor-gray"
                    title="Add to end of queue"
                  >
                    +
                  </button>
                  <button
                    onClick={() => blockSong(s.id, s.title)}
                    className="px-2.5 py-1.5 rounded-lg text-manor-offwhite/40 text-xs hover:text-manor-danger"
                    title="Hide from customers + auto-DJ"
                  >
                    ⊘
                  </button>
                </div>
              </li>
            ))}
            {!searching && results.length === 0 && (
              <li className="text-manor-offwhite/50 text-sm">
                No matches. {(genre || decade || bpm) && 'Try fewer filters.'}
              </li>
            )}
          </ul>
        </section>
      </div>
    </main>
  );
}

function Deck({
  label,
  tone,
  children,
}: {
  label: string;
  tone: 'active' | 'next';
  children: React.ReactNode;
}) {
  return (
    <div
      className={`relative rounded-2xl p-5 flex gap-4 items-start
        ${tone === 'active'
          ? 'bg-manor-navy border-2 border-manor-gold shadow-lg'
          : 'bg-manor-navyMid border border-manor-gray'
        }`}
    >
      <div className="absolute -top-2.5 left-4 px-2 bg-manor-navyDeep text-[10px] uppercase tracking-[0.2em] text-manor-gold font-bold rounded">
        {label}
      </div>
      {children}
    </div>
  );
}

function CoverPlaceholder({
  song,
  dim,
  compact,
}: {
  song: SongMeta;
  dim?: boolean;
  compact?: boolean;
}) {
  // Cover art placeholder — we'll wire iTunes lookup behind a /api/cover/[id]
  // endpoint in a follow-up. Until then, render a gold-on-navy initial badge.
  const initial = (song.artist || song.title || '?').trim()[0]?.toUpperCase() ?? '?';
  const sizeClass = compact ? 'w-10 h-10 text-base' : 'w-20 h-20 text-2xl';
  return (
    <div
      className={`${sizeClass} shrink-0 rounded-lg flex items-center justify-center font-black
        bg-manor-navyDeep border border-manor-gold/40 text-manor-gold
        ${dim ? 'opacity-70' : ''}`}
    >
      {initial}
    </div>
  );
}

function Chip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`px-3 py-1.5 rounded-full text-sm transition-colors
        ${active
          ? 'bg-manor-gold text-manor-navyDeep font-semibold'
          : 'bg-manor-grayMid text-manor-offwhite hover:bg-manor-gray border border-manor-gray'
        }`}
    >
      {children}
    </button>
  );
}

function CleanModeChip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`px-3 py-1 rounded-md text-xs font-semibold transition-colors
        ${active
          ? 'bg-manor-gold text-manor-navyDeep'
          : 'bg-manor-navyDeep text-manor-offwhite hover:bg-manor-navy border border-manor-gray'
        }`}
    >
      {children}
    </button>
  );
}
