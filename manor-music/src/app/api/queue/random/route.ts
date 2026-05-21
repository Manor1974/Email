import { NextResponse } from 'next/server';
import type { Prisma } from '@prisma/client';
import { db } from '@/lib/db';
import { addToQueue, QueueError } from '@/lib/queue';
import { currentCustomerId } from '@/lib/session';
import { getLocation } from '@/lib/location';
import { explicitAllowed } from '@/lib/schedule';

// "Surprise me" — pick a random eligible song and queue it for the customer.
// Honours all the same rules as a normal add: blocklist, explicit window,
// song + artist cooldowns, and the customer's per-queue limit.
export async function POST() {
  const customerId = await currentCustomerId();
  if (!customerId) return NextResponse.json({ error: 'Sign in required' }, { status: 401 });

  const location = await getLocation();
  const allowExplicit = await explicitAllowed(new Date(), location);
  const settings = await db.settings.findUnique({ where: { id: 'singleton' } });

  const songCooldownAgo = new Date(Date.now() - (settings?.songCooldownMinutes ?? 45) * 60 * 1000);
  const artistCooldownAgo = new Date(Date.now() - (settings?.artistCooldownMinutes ?? 45) * 60 * 1000);

  const recentArtistRows = await db.play.findMany({
    where: { startedAt: { gte: artistCooldownAgo } },
    select: { song: { select: { artist: true } } },
    distinct: ['songId'],
  });
  const artistsToAvoid = [...new Set(recentArtistRows.map((r) => r.song.artist))];

  const queuedSongIds = (
    await db.queueItem.findMany({
      where: { removedAt: null, endedAt: null },
      select: { songId: true },
    })
  ).map((q) => q.songId);

  const where: Prisma.SongWhereInput = {
    blockedAt: null,
    id: queuedSongIds.length ? { notIn: queuedSongIds } : undefined,
    artist: artistsToAvoid.length ? { notIn: artistsToAvoid } : undefined,
    OR: [{ lastPlayedAt: null }, { lastPlayedAt: { lt: songCooldownAgo } }],
    ...(allowExplicit ? {} : { isExplicit: false }),
  };

  // Cheap "random pick" — count matches then take one at a random offset.
  // Fine for libraries up to ~100k tracks; rewrite with tablesample if it ever
  // becomes a hot path.
  const total = await db.song.count({ where });
  if (total === 0) {
    return NextResponse.json({ error: 'No songs available right now' }, { status: 404 });
  }
  const skip = Math.floor(Math.random() * total);
  const [song] = await db.song.findMany({ where, skip, take: 1 });
  if (!song) return NextResponse.json({ error: 'No songs available right now' }, { status: 404 });

  try {
    const item = await addToQueue({
      songId: song.id,
      customerId,
      source: 'CUSTOMER',
      location,
    });
    return NextResponse.json({
      ok: true,
      queueItemId: item.id,
      song: { title: song.title, artist: song.artist },
    });
  } catch (e) {
    if (e instanceof QueueError) {
      return NextResponse.json({ error: e.message, code: e.code }, { status: 400 });
    }
    throw e;
  }
}
