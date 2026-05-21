import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { isAdmin } from '@/lib/auth-admin';

export const dynamic = 'force-dynamic';

// One-stop snapshot for the staff DJ console: now playing (with progress),
// the rest of the queue (with full song metadata), playback state, and the
// active auto-DJ station. Polled every few seconds with a Pusher push-refresh
// on queue/settings changes.
export async function GET() {
  if (!(await isAdmin())) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const [nowPlaying, queue, settings] = await Promise.all([
    db.queueItem.findFirst({
      where: { startedAt: { not: null }, endedAt: null, removedAt: null },
      orderBy: { startedAt: 'desc' },
      include: { song: true, customer: { select: { displayName: true } } },
    }),
    db.queueItem.findMany({
      where: { startedAt: null, removedAt: null },
      orderBy: { position: 'asc' },
      include: { song: true, customer: { select: { displayName: true } } },
    }),
    db.settings.findUnique({ where: { id: 'singleton' } }),
  ]);

  let activeStation: { id: string; name: string } | null = null;
  if (settings?.activeStationId) {
    const s = await db.station.findUnique({
      where: { id: settings.activeStationId },
      select: { id: true, name: true, isActive: true },
    });
    if (s && s.isActive) activeStation = { id: s.id, name: s.name };
  }

  const fmt = (item: typeof queue[number] | typeof nowPlaying) => {
    if (!item) return null;
    return {
      id: item.id,
      source: item.source,
      location: item.location,
      startedAt: item.startedAt?.toISOString() ?? null,
      customer: item.customer,
      song: {
        id: item.song.id,
        title: item.song.title,
        artist: item.song.artist,
        album: item.song.album,
        durationSec: item.song.durationSec,
        isExplicit: item.song.isExplicit,
        hasVideo: !!item.song.videoPath,
        genre: item.song.genre,
        year: item.song.year,
        bpm: item.song.bpm,
      },
    };
  };

  return NextResponse.json({
    nowPlaying: fmt(nowPlaying),
    queue: queue.map((q) => fmt(q)!),
    playback: {
      state: settings?.playbackState ?? 'PLAYING',
      volume: settings?.playbackVolume ?? 80,
    },
    cleanMode: (settings?.cleanModeOverride ?? 'AUTO') as 'AUTO' | 'FORCE_CLEAN' | 'FORCE_EXPLICIT',
    activeStation,
    backgroundUrl: settings?.staffBackgroundUrl ?? null,
  });
}
