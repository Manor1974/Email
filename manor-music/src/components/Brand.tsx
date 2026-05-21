'use client';

// Logo source: drop your Manor Lanes logo at /public/manor-lanes-logo.png and
// it'll be used everywhere. Until that file exists the existing app icon shows.
// Using a plain <img> here so missing-file fallback works without a redeploy.
const LOGO_PRIMARY = '/manor-lanes-logo.png';
const LOGO_FALLBACK = '/icons/icon-192.png';

export function BrandHeader({ subtitle }: { subtitle?: string }) {
  return (
    <header className="flex flex-col items-center gap-1 py-6">
      <div className="flex items-center gap-3">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={LOGO_PRIMARY}
          alt="Manor Lanes"
          width={48}
          height={48}
          className="rounded-lg object-contain"
          onError={(e) => {
            const img = e.currentTarget as HTMLImageElement;
            if (img.src.includes('manor-lanes-logo.png')) img.src = LOGO_FALLBACK;
          }}
        />
        <div className="text-2xl font-black tracking-wide text-manor-white">
          MANOR <span className="text-manor-gold">LANES</span>
        </div>
      </div>
      {subtitle ? <p className="text-sm text-manor-offwhite/70">{subtitle}</p> : null}
    </header>
  );
}
