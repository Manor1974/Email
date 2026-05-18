import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { broadcast } from '@/lib/realtime';
import { pickStationTrack } from '@/lib/station-picker';
import { sendSms } from '@/lib/sms';

// Best-effort SMS to the customer whose song is now next up in the queue.
// Runs after the response is sent so a slow Twilio call can't delay playback.
async function notifyUpNext() {
  const upNext = await db.queueItem.findFirst({
    where: {
      startedAt: null,
      removedAt: null,
      notifiedUpNextAt: null,
      customerId: { not: null },
    },
    orderBy: { position: 'asc' },
    include: { song: true, customer: true },
  });
  if (!upNext?.customer?.phone) return;

  await db.queueItem.update({
    where: { id: upNext.id },
    data: { notifiedUpNextAt: new Date() },
  });

  try {
    await sendSms(
      upNext.customer.phone,
      `Manor Lanes: your pick "${upNext.song.title}" by ${upNext.song.artist} is up next.`,
    );
  } catch (e) {
    console.error('[up-next sms]', (e as Error).message);
  }
}

// The player calls this when it needs the next track.
// 1) Mark whatever was previously playing as ended.
// 2) Promote the next pending queue item (lowest position) to "playing".
//    If no queue item exists, ask the auto-DJ to pick from the active station,
//    insert it as a STATION queue item, and play that.
// 3) Log a Play row for history.

function authed(req: NextRequest) {
  const key = req.headers.get('x-player-key');
  return !!key && key === process.env.PLAYER_API_KEY;
}

export async function POST(req: NextRequest) {
  if (!authed(req)) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  // Don't advance the queue while paused — the player will retry once the
  // state flips back to PLAYING.
  const settings = await db.settings.findUnique({
    where: { id: 'singleton' },
    select: { playbackState: true },
  });
  if (settings?.playbackState === 'PAUSED') {
    return NextResponse.json({ track: null, paused: true });
  }

  await db.queueItem.updateMany({
    where: { startedAt: { not: null }, endedAt: null },
    data: { endedAt: new Date() },
  });
  await db.play.updateMany({
    where: { endedAt: null },
    data: { endedAt: new Date() },
  });

  let next = await db.queueItem.findFirst({
    where: { startedAt: null, removedAt: null },
    orderBy: { position: 'asc' },
    include: { song: true },
  });

  if (!next) {
    // Auto-DJ: pull from the active station, materialise into the queue so
    // the rest of the system (UI, reports, skip button) treats it normally.
    const stationSong = await pickStationTrack();
    if (!stationSong) {
      await broadcast({ type: 'now-playing', songId: null });
      return NextResponse.json({ track: null });
    }
    const last = await db.queueItem.findFirst({
      orderBy: { position: 'desc' },
      select: { position: true },
    });
    next = await db.queueItem.create({
      data: {
        songId: stationSong.id,
        source: 'STATION',
        position: (last?.position ?? 0) + 1,
      },
      include: { song: true },
    });
  }

  const now = new Date();
  const [updated] = await Promise.all([
    db.queueItem.update({ where: { id: next.id }, data: { startedAt: now } }),
    db.play.create({
      data: {
        songId: next.songId,
        customerId: next.customerId,
        source: next.source,
        location: next.location,
        startedAt: now,
      },
    }),
    db.song.update({ where: { id: next.songId }, data: { lastPlayedAt: now } }),
  ]);

  await broadcast({ type: 'now-playing', songId: next.songId });

  // Fire-and-forget; a slow Twilio call shouldn't delay playback.
  notifyUpNext().catch((e) => console.error('[notifyUpNext]', e));

  return NextResponse.json({
    track: {
      queueItemId: updated.id,
      songId: next.song.id,
      filePath: next.song.filePath,
      videoPath: next.song.videoPath,
      title: next.song.title,
      artist: next.song.artist,
      durationSec: next.song.durationSec,
    },
  });
}
