import { db } from './db';
import { explicitAllowed } from './schedule';
import type { Prisma, Song } from '@prisma/client';

// Station filter shape, validated at write-time in /api/admin/stations.
export interface StationFilter {
  genres?: string[];
  excludeGenres?: string[];
  minYear?: number;
  maxYear?: number;
  minBpm?: number;
  maxBpm?: number;
  moods?: string[];
}

// Pick the next station track.
//
// Selection rules:
//   * Honour the current clean/explicit window — if explicit isn't allowed,
//     either pick a non-explicit song or swap in the clean counterpart.
//   * Skip anything blocked, anything in the active queue, anything that
//     played within the song-cooldown window, and any artist that played
//     within the artist-cooldown window.
//   * Among what's left, weight selection toward songs not played recently
//     (lastPlayedAt nulls first, then oldest), with a small randomisation
//     factor so we don't loop the same handful of tracks.
//
// Returns null if no candidate exists.
export async function pickStationTrack(): Promise<Song | null> {
  const settings = await db.settings.findUnique({ where: { id: 'singleton' } });
  if (!settings?.activeStationId) return null;

  const station = await db.station.findUnique({ where: { id: settings.activeStationId } });
  if (!station || !station.isActive) return null;
  const filter = (station.filter as StationFilter) ?? {};

  const allowExplicit = await explicitAllowed();

  const songCooldownAgo = new Date(Date.now() - settings.songCooldownMinutes * 60 * 1000);
  const artistCooldownAgo = new Date(Date.now() - settings.artistCooldownMinutes * 60 * 1000);

  const recentArtists = await db.play.findMany({
    where: { startedAt: { gte: artistCooldownAgo } },
    select: { song: { select: { artist: true } } },
    distinct: ['songId'],
  });
  const artistsToAvoid = [...new Set(recentArtists.map((r) => r.song.artist))];

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
    OR: [
      { lastPlayedAt: null },
      { lastPlayedAt: { lt: songCooldownAgo } },
    ],
  };

  if (!allowExplicit) {
    where.isExplicit = false;
  }
  if (filter.genres?.length) where.genre = { in: filter.genres };
  if (filter.excludeGenres?.length) {
    where.genre = { ...(where.genre as object | undefined), notIn: filter.excludeGenres };
  }
  if (filter.minYear || filter.maxYear) {
    where.year = {
      ...(filter.minYear ? { gte: filter.minYear } : {}),
      ...(filter.maxYear ? { lte: filter.maxYear } : {}),
    };
  }
  if (filter.minBpm || filter.maxBpm) {
    where.bpm = {
      ...(filter.minBpm ? { gte: filter.minBpm } : {}),
      ...(filter.maxBpm ? { lte: filter.maxBpm } : {}),
    };
  }
  if (filter.moods?.length) where.mood = { in: filter.moods };

  // Sample from the least-recently-played pool, with light randomisation:
  // pick the top 25 oldest matches, then random-select from that bucket.
  const bucket = await db.song.findMany({
    where,
    orderBy: [{ lastPlayedAt: 'asc' }, { addedAt: 'asc' }],
    take: 25,
  });
  if (bucket.length === 0) return null;

  return bucket[Math.floor(Math.random() * bucket.length)];
}
