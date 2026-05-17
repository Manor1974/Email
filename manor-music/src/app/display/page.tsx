import { getCurrentQueue, getNowPlaying } from '@/lib/queue';
import { DisplayClient } from './DisplayClient';

export const dynamic = 'force-dynamic';

// Branded full-screen "now playing" view. Designed for a TV — point a browser
// at /display in kiosk mode and route the HDMI to any zone in your AV matrix.
// Auto-refreshes via Pusher; falls back to polling.
export default async function DisplayPage() {
  const [np, queue] = await Promise.all([getNowPlaying(), getCurrentQueue()]);
  return (
    <DisplayClient
      initial={{
        nowPlaying: np
          ? { title: np.song.title, artist: np.song.artist, addedBy: np.customer?.displayName ?? null }
          : null,
        upNext: queue.slice(0, 5).map((q) => ({
          title: q.song.title,
          artist: q.song.artist,
          addedBy: q.customer?.displayName ?? null,
        })),
      }}
    />
  );
}
