/**
 * Library scanner — one-shot.
 *
 * Walks LIBRARY_PATH, ingests every audio and video file, links clean ↔
 * explicit pairs and music videos, and notifies anyone whose request became
 * fulfillable as a result.
 *
 * For continuous ingest (auto-pickup of files dropped into the library),
 * run `npm run scan:watch` instead.
 */
import path from 'path';
import { PrismaClient } from '@prisma/client';
import {
  AUDIO_EXT,
  VIDEO_EXT,
  blankStats,
  ingestAudio,
  linkCleanExplicitPairs,
  linkVideo,
  notifyFulfilledRequests,
  walk,
} from './ingest';

const db = new PrismaClient();

async function main() {
  const libraryPath = process.env.LIBRARY_PATH;
  if (!libraryPath) {
    console.error('LIBRARY_PATH env var required');
    process.exit(1);
  }
  console.log(`[scan] starting in ${libraryPath}`);
  const stats = blankStats();

  const videoFiles: string[] = [];
  for await (const file of walk(libraryPath)) {
    const ext = path.extname(file).toLowerCase();
    if (AUDIO_EXT.has(ext)) {
      await ingestAudio(db, file, stats);
    } else if (VIDEO_EXT.has(ext)) {
      videoFiles.push(file);
    }
  }

  for (const v of videoFiles) {
    await linkVideo(db, v, stats);
  }

  await linkCleanExplicitPairs(db, stats);
  await notifyFulfilledRequests(db);

  console.log(`[scan] done`, stats);
  await db.$disconnect();
}

main().catch(async (e) => {
  console.error(e);
  await db.$disconnect();
  process.exit(1);
});
