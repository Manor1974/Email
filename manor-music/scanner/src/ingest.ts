/**
 * Shared ingest logic — used by both the one-shot scanner and the watch
 * daemon. Keep this stateless so the watcher can call it per-file as events
 * arrive without re-walking the whole library.
 */
import path from 'path';
import { promises as fs } from 'fs';
import { parseFile } from 'music-metadata';
import { PrismaClient } from '@prisma/client';
import twilio from 'twilio';

export const AUDIO_EXT = new Set(['.mp3', '.m4a', '.aac', '.flac', '.wav', '.ogg']);
export const VIDEO_EXT = new Set(['.mp4', '.mov', '.mkv', '.m4v', '.webm']);
const EXPLICIT_RX = /\b(explicit|dirty|uncen(sored)?)\b/i;
const CLEAN_RX = /\b(clean|edit(ed)?|radio)\b/i;

export function baseTitle(title: string): string {
  return title
    .replace(/\((clean|edited|radio|explicit|dirty|uncensored)[^)]*\)/gi, '')
    .replace(/\[(clean|edited|radio|explicit|dirty|uncensored)[^\]]*\]/gi, '')
    .replace(/\s+(clean|edited|radio|explicit|dirty|uncensored)$/i, '')
    .trim()
    .toLowerCase();
}

export function detectExplicit(filename: string, tagExplicit: boolean | undefined): boolean {
  if (tagExplicit === true) return true;
  if (EXPLICIT_RX.test(filename)) return true;
  if (CLEAN_RX.test(filename)) return false;
  return false;
}

export interface ScanStats {
  audioIngested: number;
  audioUpdated: number;
  videosLinked: number;
  pairsLinked: number;
  errors: number;
}

export function blankStats(): ScanStats {
  return {
    audioIngested: 0,
    audioUpdated: 0,
    videosLinked: 0,
    pairsLinked: 0,
    errors: 0,
  };
}

export async function ingestAudio(db: PrismaClient, file: string, stats: ScanStats) {
  let meta;
  try {
    meta = await parseFile(file, { duration: true, skipCovers: true });
  } catch (e) {
    console.warn(`[ingest] skip ${file}: ${(e as Error).message}`);
    stats.errors += 1;
    return;
  }
  const common = meta.common;
  const title = (common.title || path.basename(file, path.extname(file))).trim();
  const artist = (common.artist || common.albumartist || 'Unknown Artist').trim();
  const album = common.album?.trim() || null;
  const year = common.year || null;
  const genre = common.genre?.[0] ?? null;
  const durationSec = Math.round(meta.format.duration ?? 0);
  const tagExplicit = (common as { explicit?: boolean }).explicit;
  const isExplicit = detectExplicit(path.basename(file), tagExplicit);

  const existing = await db.song.findUnique({ where: { filePath: file } });
  if (existing) {
    await db.song.update({
      where: { filePath: file },
      data: { title, artist, album, year: year ?? undefined, genre, durationSec, isExplicit },
    });
    stats.audioUpdated += 1;
  } else {
    await db.song.create({
      data: { filePath: file, title, artist, album, year: year ?? undefined, genre, durationSec, isExplicit },
    });
    stats.audioIngested += 1;
  }
}

export async function linkVideo(db: PrismaClient, file: string, stats: ScanStats) {
  const base = path.basename(file, path.extname(file)).toLowerCase();
  const dir = path.dirname(file);
  const candidates = await db.song.findMany({
    where: { filePath: { startsWith: dir + path.sep } },
    select: { id: true, filePath: true },
  });
  for (const c of candidates) {
    const cBase = path.basename(c.filePath, path.extname(c.filePath)).toLowerCase();
    if (cBase === base || baseTitle(cBase) === baseTitle(base)) {
      await db.song.update({ where: { id: c.id }, data: { videoPath: file } });
      stats.videosLinked += 1;
      return;
    }
  }
}

export async function linkCleanExplicitPairs(db: PrismaClient, stats: ScanStats) {
  const all = await db.song.findMany({
    select: { id: true, title: true, artist: true, isExplicit: true, cleanPairId: true },
  });
  const groups = new Map<string, { explicit: string[]; clean: string[] }>();
  for (const s of all) {
    const key = `${s.artist.toLowerCase()}::${baseTitle(s.title)}`;
    const g = groups.get(key) ?? { explicit: [], clean: [] };
    (s.isExplicit ? g.explicit : g.clean).push(s.id);
    groups.set(key, g);
  }
  for (const g of groups.values()) {
    if (!g.explicit.length || !g.clean.length) continue;
    const cleanId = g.clean[0];
    const explicitId = g.explicit[0];
    await db.song.updateMany({
      where: { id: { in: g.explicit }, cleanPairId: null },
      data: { cleanPairId: cleanId },
    });
    await db.song.updateMany({
      where: { id: { in: g.clean }, cleanPairId: null },
      data: { cleanPairId: explicitId },
    });
    stats.pairsLinked += 1;
  }
}

export async function notifyFulfilledRequests(db: PrismaClient) {
  const open = await db.songRequest.findMany({
    where: { fulfilledAt: null },
    include: { customer: { select: { phone: true } } },
  });
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const from = process.env.TWILIO_FROM_NUMBER;
  const client = accountSid && authToken ? twilio(accountSid, authToken) : null;

  for (const r of open) {
    const match = await db.song.findFirst({
      where: {
        AND: [
          { title: { contains: r.title, mode: 'insensitive' } },
          { artist: { contains: r.artist, mode: 'insensitive' } },
        ],
      },
    });
    if (!match) continue;
    await db.songRequest.update({
      where: { id: r.id },
      data: { fulfilledSongId: match.id, fulfilledAt: new Date() },
    });
    if (client && from && r.customer.phone) {
      try {
        await client.messages.create({
          to: r.customer.phone,
          from,
          body: `Manor Lanes: "${match.title}" by ${match.artist} is in the jukebox now — open the app to queue it.`,
        });
        await db.songRequest.update({ where: { id: r.id }, data: { notifiedAt: new Date() } });
      } catch (e) {
        console.warn(`[ingest] sms failed for ${r.id}: ${(e as Error).message}`);
      }
    }
  }
}

export async function* walk(dir: string): AsyncGenerator<string> {
  let entries: import('fs').Dirent[];
  try {
    entries = await fs.readdir(dir, { withFileTypes: true });
  } catch (e) {
    console.warn(`[ingest] cannot read ${dir}: ${(e as Error).message}`);
    return;
  }
  for (const entry of entries) {
    if (entry.name.startsWith('.')) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      yield* walk(full);
    } else if (entry.isFile()) {
      yield full;
    }
  }
}
