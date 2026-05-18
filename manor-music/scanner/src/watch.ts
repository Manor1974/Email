/**
 * Library watch daemon.
 *
 * Watches LIBRARY_PATH and ingests new files as they appear. Designed to run
 * as a Windows service alongside the player so dropping MP3s into a folder
 * (or RDP'ing in to copy a USB stick) auto-publishes them to the jukebox
 * within ~3 seconds.
 *
 * Debouncing: file copies can fire multiple events in quick succession (and
 * a partially-copied file can't be parsed). We coalesce events per path,
 * waiting QUIET_MS after the last write before reading.
 */
import path from 'path';
import chokidar from 'chokidar';
import { PrismaClient } from '@prisma/client';
import {
  AUDIO_EXT,
  VIDEO_EXT,
  blankStats,
  ingestAudio,
  linkCleanExplicitPairs,
  linkVideo,
  notifyFulfilledRequests,
} from './ingest';

const QUIET_MS = 3_000;
const SETTLE_BATCH_MS = 5_000;

const db = new PrismaClient();

const pending = new Map<string, NodeJS.Timeout>();
let postProcessTimer: NodeJS.Timeout | null = null;
let postProcessing = false;

function log(...args: unknown[]) {
  console.log(new Date().toISOString(), '[watch]', ...args);
}

function schedulePostProcess() {
  if (postProcessTimer) clearTimeout(postProcessTimer);
  postProcessTimer = setTimeout(runPostProcess, SETTLE_BATCH_MS);
}

async function runPostProcess() {
  if (postProcessing) {
    schedulePostProcess();
    return;
  }
  postProcessing = true;
  try {
    const stats = blankStats();
    await linkCleanExplicitPairs(db, stats);
    await notifyFulfilledRequests(db);
    if (stats.pairsLinked) log(`linked ${stats.pairsLinked} clean/explicit pair(s)`);
  } catch (e) {
    log('post-process error', (e as Error).message);
  } finally {
    postProcessing = false;
  }
}

async function handleFile(file: string) {
  const ext = path.extname(file).toLowerCase();
  if (!AUDIO_EXT.has(ext) && !VIDEO_EXT.has(ext)) return;
  const stats = blankStats();
  try {
    if (AUDIO_EXT.has(ext)) {
      await ingestAudio(db, file, stats);
      if (stats.audioIngested) log(`+ ${file}`);
      else if (stats.audioUpdated) log(`~ ${file}`);
    } else {
      await linkVideo(db, file, stats);
      if (stats.videosLinked) log(`+video ${file}`);
    }
  } catch (e) {
    log(`error on ${file}: ${(e as Error).message}`);
  }
  schedulePostProcess();
}

function queueProcess(file: string) {
  if (pending.has(file)) clearTimeout(pending.get(file));
  pending.set(
    file,
    setTimeout(() => {
      pending.delete(file);
      void handleFile(file);
    }, QUIET_MS),
  );
}

async function handleUnlink(file: string) {
  // File removed from disk — keep the row but null out paths so the player
  // doesn't try to read a missing file. The operator can either re-drop the
  // file (auto-restored next ingest) or use the admin blocklist.
  try {
    await db.song.updateMany({ where: { filePath: file }, data: { filePath: `__missing:${file}` } });
    await db.song.updateMany({ where: { videoPath: file }, data: { videoPath: null } });
    log(`- ${file}`);
  } catch (e) {
    log(`unlink error: ${(e as Error).message}`);
  }
}

async function main() {
  const libraryPath = process.env.LIBRARY_PATH;
  if (!libraryPath) {
    console.error('LIBRARY_PATH env var required');
    process.exit(1);
  }
  log(`watching ${libraryPath}`);

  const watcher = chokidar.watch(libraryPath, {
    ignoreInitial: false,
    ignored: /(^|[/\\])\../,
    awaitWriteFinish: { stabilityThreshold: 1_500, pollInterval: 250 },
    persistent: true,
  });

  watcher.on('add', queueProcess);
  watcher.on('change', queueProcess);
  watcher.on('unlink', (file) => void handleUnlink(file));
  watcher.on('error', (e) => log('watcher error', (e as Error).message));
  watcher.on('ready', () => log('initial scan complete; watching for changes'));

  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);
}

async function shutdown() {
  log('shutting down');
  await db.$disconnect();
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
