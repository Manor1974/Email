/**
 * Manor Lanes player daemon.
 *
 * Runs on the venue mini PC. Polls the server for the next track and plays
 * it. Audio goes out the system default device (the USB DAC); music videos
 * play full-screen on HDMI via mpv, whose audio output is also routed through
 * the same default device so the venue mixer stays the single source of truth.
 *
 * Requires `mpv` on PATH. On Windows + macOS + Linux this Just Works after
 * a one-line install (see docs/setup-windows.md). The player auto-restarts
 * mpv if it dies and keeps running on transient network errors.
 */
import { spawn, ChildProcess } from 'child_process';
import process from 'process';

const SERVER = process.env.SERVER_URL ?? 'http://localhost:3000';
const KEY = process.env.PLAYER_API_KEY ?? '';
const POLL_MS = 1500;
const HEARTBEAT_MS = 15_000;

interface Track {
  queueItemId: string;
  songId: string;
  filePath: string;
  videoPath: string | null;
  title: string;
  artist: string;
  durationSec: number;
}

let mpv: ChildProcess | null = null;
let currentSongId: string | null = null;
let stopping = false;

function log(...args: unknown[]) {
  console.log(new Date().toISOString(), '[player]', ...args);
}

async function fetchNext(): Promise<Track | null> {
  const res = await fetch(`${SERVER}/api/player/next`, {
    method: 'POST',
    headers: { 'x-player-key': KEY },
  });
  if (!res.ok) throw new Error(`next ${res.status}`);
  const json = (await res.json()) as { track: Track | null };
  return json.track;
}

async function heartbeat() {
  try {
    await fetch(`${SERVER}/api/player/heartbeat`, {
      method: 'POST',
      headers: { 'x-player-key': KEY, 'content-type': 'application/json' },
      body: JSON.stringify({ nowPlayingSongId: currentSongId }),
    });
  } catch {
    /* heartbeat is best-effort */
  }
}

function play(track: Track): Promise<void> {
  return new Promise((resolve) => {
    const args = [
      '--no-terminal',
      '--keep-open=no',
      track.videoPath ? '--fullscreen' : '--no-video',
      '--audio-display=no',
      track.videoPath ? track.videoPath : track.filePath,
    ];
    log('▶', track.artist, '—', track.title, track.videoPath ? '(video)' : '');
    mpv = spawn('mpv', args, { stdio: 'ignore' });
    currentSongId = track.songId;
    mpv.on('exit', () => {
      mpv = null;
      currentSongId = null;
      resolve();
    });
  });
}

async function loop() {
  while (!stopping) {
    try {
      const track = await fetchNext();
      if (!track) {
        await new Promise((r) => setTimeout(r, POLL_MS));
        continue;
      }
      await play(track);
    } catch (e) {
      log('error', (e as Error).message);
      await new Promise((r) => setTimeout(r, POLL_MS * 4));
    }
  }
}

function shutdown() {
  stopping = true;
  if (mpv) {
    try {
      mpv.kill('SIGTERM');
    } catch {
      /* ignore */
    }
  }
}

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);

if (!KEY) {
  console.error('PLAYER_API_KEY env var required');
  process.exit(1);
}

setInterval(heartbeat, HEARTBEAT_MS);
heartbeat();
loop().catch((e) => {
  console.error(e);
  process.exit(1);
});
