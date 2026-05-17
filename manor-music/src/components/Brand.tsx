import Image from 'next/image';

export function BrandHeader({ subtitle }: { subtitle?: string }) {
  return (
    <header className="flex flex-col items-center gap-1 py-6">
      <div className="flex items-center gap-3">
        <Image src="/icons/icon-192.png" alt="" width={40} height={40} className="rounded-lg" priority />
        <div className="text-2xl font-black tracking-wide text-manor-cream">
          MANOR <span className="text-manor-teal">LANES</span>
        </div>
      </div>
      {subtitle ? <p className="text-sm text-manor-cream/60">{subtitle}</p> : null}
    </header>
  );
}
