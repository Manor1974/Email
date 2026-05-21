'use client';

import { useState } from 'react';

// Logo source: the Manor Lanes wordmark+pins logo at /public/manor-lanes-logo.png.
// If that file is missing (e.g. mid-deploy), fall back to the bowling-pin icon
// AND show the "MANOR LANES" wordmark text so the header doesn't go blank.
const LOGO_PRIMARY = '/manor-lanes-logo.png';
const LOGO_FALLBACK = '/icons/icon-192.png';

export function BrandHeader({ subtitle }: { subtitle?: string }) {
  // Track whether we had to swap to the fallback icon. If yes, the wordmark
  // logo file is missing so we render the text wordmark next to the small icon.
  const [usingFallback, setUsingFallback] = useState(false);

  return (
    <header className="flex flex-col items-center gap-2 py-4">
      <div className="flex items-center gap-3">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={LOGO_PRIMARY}
          alt="Manor Lanes"
          className={
            usingFallback
              ? 'h-12 w-12 rounded-lg object-contain'
              : 'h-20 sm:h-24 w-auto max-w-[320px] object-contain'
          }
          onError={(e) => {
            const img = e.currentTarget as HTMLImageElement;
            if (img.src.includes('manor-lanes-logo.png')) {
              img.src = LOGO_FALLBACK;
              setUsingFallback(true);
            }
          }}
        />
        {usingFallback && (
          <div className="text-2xl font-black tracking-wide text-manor-white">
            MANOR <span className="text-manor-gold">LANES</span>
          </div>
        )}
      </div>
      {subtitle ? <p className="text-sm text-manor-offwhite/70">{subtitle}</p> : null}
    </header>
  );
}
