import { db } from './db';
import { explicitAllowed } from './schedule';
import { broadcast } from './realtime';
import type { QueueSource, Song } from '@prisma/client';

export class QueueError extends Error {
  constructor(public code: string, message: string) {
    super(message);
  }
}

interface AddOptions {
  songId: string;
  customerId?: string | null;
  source: QueueSource;
  location?: string | null;
  bypassRules?: boolean; // staff override
}

// Resolve the right version (clean or explicit) for the song the user picked.
// Customers always pick by title; under the hood we may swap to the clean pair
// if explicit isn't currently allowed.
async function resolveVersion(songId: string): Promise<Song> {
  const song = await db.song.findUnique({
    where: { id: songId },
    include: { cleanPair: true, pairOf: true },
  });
  if (!song) throw new QueueError('NOT_FOUND', 'Song not found');
  if (song.blockedAt) throw new QueueError('BLOCKED', 'This song has been blocked');

  if (!song.isExplicit) return song;
  if (await explicitAllowed()) return song;

  // Need the clean counterpart.
  const clean = song.cleanPair ?? (song.pairOf?.find((s) => !s.isExplicit) ?? null);
  if (!clean) throw new QueueError('EXPLICIT_NOT_ALLOWED', 'Explicit lyrics not allowed right now');
  return clean as Song;
}

export async function addToQueue(opts: AddOptions) {
  const settings = (await db.settings.findUnique({ where: { id: 'singleton' } })) ?? {
    maxSongsPerCustomer: 3,
    songCooldownHours: 4,
    artistCooldownMinutes: 45,
    customerBlendRatio: 1,
    activeStationId: null,
    cleanModeOverride: 'AUTO',
    id: 'singleton',
  };

  const song = await resolveVersion(opts.songId);

  if (!opts.bypassRules) {
    if (opts.customerId) {
      const inQueue = await db.queueItem.count({
        where: {
          customerId: opts.customerId,
          startedAt: null,
          removedAt: null,
        },
      });
      if (inQueue >= settings.maxSongsPerCustomer) {
        throw new QueueError(
          'CUSTOMER_LIMIT',
          `You already have ${inQueue} songs queued (max ${settings.maxSongsPerCustomer})`,
        );
      }
    }

    const songCooldownAgo = new Date(Date.now() - settings.songCooldownHours * 60 * 60 * 1000);
    const recentSong = await db.play.findFirst({
      where: { songId: song.id, startedAt: { gte: songCooldownAgo } },
    });
    if (recentSong) {
      throw new QueueError(
        'SONG_COOLDOWN',
        `That song played in the last ${settings.songCooldownHours}h`,
      );
    }

    const artistCooldownAgo = new Date(Date.now() - settings.artistCooldownMinutes * 60 * 1000);
    const recentArtist = await db.play.findFirst({
      where: {
        song: { artist: song.artist },
        startedAt: { gte: artistCooldownAgo },
      },
    });
    if (recentArtist) {
      throw new QueueError(
        'ARTIST_COOLDOWN',
        `Another ${song.artist} song played in the last ${settings.artistCooldownMinutes} min`,
      );
    }
  }

  const last = await db.queueItem.findFirst({
    where: { startedAt: null, removedAt: null },
    orderBy: { position: 'desc' },
  });
  const position = (last?.position ?? 0) + 1;

  const item = await db.queueItem.create({
    data: {
      songId: song.id,
      customerId: opts.customerId ?? null,
      source: opts.source,
      location: opts.location ?? null,
      position,
    },
  });

  await broadcast({ type: 'queue:updated' });
  return item;
}

export async function removeFromQueue(queueItemId: string, removedBy: string) {
  const item = await db.queueItem.update({
    where: { id: queueItemId },
    data: { removedAt: new Date(), removedBy },
  });
  await broadcast({ type: 'queue:updated' });
  return item;
}

export async function getCurrentQueue() {
  return db.queueItem.findMany({
    where: { startedAt: null, removedAt: null },
    orderBy: { position: 'asc' },
    include: { song: true, customer: { select: { displayName: true } } },
  });
}

export async function getNowPlaying() {
  return db.queueItem.findFirst({
    where: { startedAt: { not: null }, endedAt: null, removedAt: null },
    orderBy: { startedAt: 'desc' },
    include: { song: true, customer: { select: { displayName: true } } },
  });
}

// "Brian @ Bar" style display name for queue/admin UI.
export function attribution(customerName: string | null, location: string | null): string | null {
  if (customerName && location) return `${customerName} @ ${location}`;
  return customerName ?? location ?? null;
}
