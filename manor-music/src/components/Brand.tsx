export function BrandHeader({ subtitle }: { subtitle?: string }) {
  return (
    <header className="flex flex-col items-center gap-1 py-6">
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-lg bg-manor-teal flex items-center justify-center">
          <span className="text-manor-ink font-black text-lg">M</span>
        </div>
        <div className="text-2xl font-black tracking-wide text-manor-cream">
          MANOR <span className="text-manor-teal">LANES</span>
        </div>
      </div>
      {subtitle ? <p className="text-sm text-manor-cream/60">{subtitle}</p> : null}
    </header>
  );
}
