/**
 * Manor Lanes player daemon.
 *
 * Runs on the venue mini PC. Plays the next queued track via mpv, drives
 * audio out the system default device (the USB DAC), and sends music-video
 * HDMI full-screen for the AV matrix to route. Polls the server for the
 * desired playback state (PAUSED / volume) and applies changes live via
 * mpv's JSON IPC.
 *
 * Requires `mpv` on PATH. On Windows the IPC pipe is `\\.\pipe\manor-mpv`;
 * on Linux/macOS it's `/tmp/manor-mpv.sock`. The pipe is named the same
 * across reboots so the controller stays simple.
 *
 * Process flow:
 *   - 1Hz tick: fetch desired state from /api/player/state.
 *   - If PAUSED, ensure mpv is paused.
 *   - If PLAYING and no mpv running, fetch next track and start playback.
 *   - Volume change is pushed into mpv IPC immediately.
 */
import { spawn, ChildProcess } from 'child_process';
import net from 'net';
import process from 'process';

const SERVER = process.env.SERVER_URL ?? 'http://localhost:3000';
const KEY = process.env.PLAYER_API_KEY ?? '';
const HEARTBEAT_MS = 15_000;
const TICK_MS = 1_000;

const IPC_PATH = process.platform === 'win32'
  ? '\\\\.\\pipe\\manor-mpv'
  : '/tmp/manor-mpv.sock';

interface Track {
  queueItemId: string;
  songId: string;
  filePath: string;
  videoPath: string | null;
  title: string;
  artist: string;
  durationSec: number;
}

interface PlayerState {
  playbackState: 'PLAYING' | 'PAUSED';
  playbackVolume: number;
  // Song the server expects to be playing right now. If our mpv is playing
  // something different we kill it so the next tick fetches the new track.
  // null = server thinks nothing should be playing (between tracks).
  expectedSongId?: string | null;
}

let mpv: ChildProcess | null = null;
let currentSongId: string | null = null;
let advancing = false;
let stopping = false;

let desired: PlayerState = { playbackState: 'PLAYING', playbackVolume: 80 };
let appliedVolume = -1;
let appliedPause: boolean | null = null;

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

async function fetchState(): Promise<PlayerState> {
  const res = await fetch(`${SERVER}/api/player/state`, {
    headers: { 'x-player-key': KEY },
  });
  if (!res.ok) throw new Error(`state ${res.status}`);
  return (await res.json()) as PlayerState;
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

// Send a JSON command into mpv's IPC socket/pipe. Best-effort: if the socket
// isn't up yet, swallow the error and try next tick.
function ipc(cmd: unknown[]): Promise<void> {
  return new Promise((resolve) => {
    const conn = net.createConnection(IPC_PATH);
    let done = false;
    const finish = () => {
      if (done) return;
      done = true;
      try {
        conn.destroy();
      } catch {
        /* ignore */
      }
      resolve();
    };
    conn.once('connect', () => {
      conn.write(JSON.stringify({ command: cmd }) + '\n', () => finish());
    });
    conn.once('error', finish);
    setTimeout(finish, 500);
  });
}

function startPlayback(track: Track) {
  const args = [
    '--no-terminal',
    '--keep-open=no',
    `--input-ipc-server=${IPC_PATH}`,
    `--volume=${desired.playbackVolume}`,
    track.videoPath ? '--fullscreen' : '--no-video',
    '--audio-display=no',
    track.videoPath ? track.videoPath : track.filePath,
  ];
  log('▶', track.artist, '—', track.title, track.videoPath ? '(video)' : '');
  mpv = spawn('mpv', args, { stdio: 'ignore' });
  currentSongId = track.songId;
  appliedVolume = desired.playbackVolume;
  appliedPause = false;
  mpv.on('exit', () => {
    mpv = null;
    currentSongId = null;
    appliedPause = null;
  });
}

async function ensureNextTrack() {
  if (advancing || mpv) return;
  advancing = true;
  try {
    const track = await fetchNext();
    if (track) startPlayback(track);
  } catch (e) {
    log('next error', (e as Error).message);
  } finally {
    advancing = false;
  }
}

async function applyDesiredState() {
  if (mpv) {
    if (desired.playbackVolume !== appliedVolume) {
      await ipc(['set_property', 'volume', desired.playbackVolume]);
      appliedVolume = desired.playbackVolume;
    }
    const wantPause = desired.playbackState === 'PAUSED';
    if (appliedPause !== wantPause) {
      await ipc(['set_property', 'pause', wantPause]);
      appliedPause = wantPause;
    }
  }
}

async function tick() {
  let state: PlayerState | null = null;
  try {
    state = await fetchState();
    desired = { playbackState: state.playbackState, playbackVolume: state.playbackVolume };
  } catch {
    /* network blip — keep last-known desired */
  }

  // Server-driven skip: if we're playing something different from what the
  // server expects, kill mpv so the next tick picks up the new track. This
  // makes "Play Now" and Skip take effect immediately rather than waiting
  // for the current audio file to finish on its own.
  if (state && mpv && currentSongId && state.expectedSongId !== currentSongId) {
    log(`server expects ${state.expectedSongId ?? '(none)'}, we have ${currentSongId} — switching`);
    try {
      mpv.kill('SIGTERM');
    } catch {
      /* mpv will exit on its own */
    }
  }

  await applyDesiredState();
  if (desired.playbackState === 'PLAYING' && !mpv) {
    await ensureNextTrack();
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

(async function loop() {
  while (!stopping) {
    await tick();
    await new Promise((r) => setTimeout(r, TICK_MS));
  }
})();
