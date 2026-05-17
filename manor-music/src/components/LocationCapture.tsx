'use client';

import { useEffect } from 'react';

// Reads ?location= from the URL once on mount and posts it to /api/location
// so future queue adds can attribute requests to the right zone (Bar, Lane 7,
// Volleyball Court 2, etc.). The QR cards we print embed the location in the
// URL so the customer never has to type or pick anything.
export function LocationCapture() {
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const loc = params.get('location') ?? params.get('lane');
    if (!loc) return;
    fetch('/api/location', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ location: loc }),
    }).catch(() => {
      /* best-effort */
    });
  }, []);
  return null;
}
