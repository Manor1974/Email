import Pusher from 'pusher';

let pusher: Pusher | null = null;

function client(): Pusher | null {
  if (pusher) return pusher;
  const { PUSHER_APP_ID, PUSHER_KEY, PUSHER_SECRET, PUSHER_CLUSTER } = process.env;
  if (!PUSHER_APP_ID || !PUSHER_KEY || !PUSHER_SECRET || !PUSHER_CLUSTER) return null;
  pusher = new Pusher({
    appId: PUSHER_APP_ID,
    key: PUSHER_KEY,
    secret: PUSHER_SECRET,
    cluster: PUSHER_CLUSTER,
    useTLS: true,
  });
  return pusher;
}

export type RealtimeEvent =
  | { type: 'queue:updated' }
  | { type: 'now-playing'; songId: string | null }
  | { type: 'request:fulfilled'; requestId: string; songId: string }
  | { type: 'settings:updated' };

export async function broadcast(event: RealtimeEvent) {
  const c = client();
  if (!c) {
    // No Pusher creds yet — fine in dev. UI falls back to polling.
    return;
  }
  await c.trigger('manor-music', event.type, event);
}
