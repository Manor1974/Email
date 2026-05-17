'use client';

import { useEffect } from 'react';
import PusherJs from 'pusher-js';

let singleton: PusherJs | null = null;

function client(): PusherJs | null {
  if (typeof window === 'undefined') return null;
  if (singleton) return singleton;
  const key = process.env.NEXT_PUBLIC_PUSHER_KEY;
  const cluster = process.env.NEXT_PUBLIC_PUSHER_CLUSTER;
  if (!key || !cluster) return null;
  singleton = new PusherJs(key, { cluster });
  return singleton;
}

// Subscribe to a single channel/event. The callback is automatically
// unsubscribed on unmount. If Pusher isn't configured (dev without keys),
// the hook is a no-op and callers should fall back to polling.
export function usePusherEvent(eventName: string, onEvent: (data: unknown) => void) {
  useEffect(() => {
    const p = client();
    if (!p) return;
    const channel = p.subscribe('manor-music');
    channel.bind(eventName, onEvent);
    return () => {
      channel.unbind(eventName, onEvent);
    };
  }, [eventName, onEvent]);
}
