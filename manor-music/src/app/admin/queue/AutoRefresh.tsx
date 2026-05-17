'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { usePusherEvent } from '@/lib/usePusher';

// Drop-in for any server component that should refresh on jukebox events.
// Doesn't render anything; just listens and calls router.refresh().
export function AutoRefresh() {
  const router = useRouter();
  usePusherEvent('queue:updated', () => router.refresh());
  usePusherEvent('now-playing', () => router.refresh());

  useEffect(() => {
    const t = setInterval(() => router.refresh(), 8000);
    return () => clearInterval(t);
  }, [router]);

  return null;
}
