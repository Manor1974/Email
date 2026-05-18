import { NextRequest, NextResponse } from 'next/server';

function authed(req: NextRequest) {
  const key = req.headers.get('x-player-key');
  return !!key && key === process.env.PLAYER_API_KEY;
}

// Lightweight liveness signal from the player. The admin /health endpoint
// reads the same global, so an operator can verify "is the player up?" in
// one click before opening doors.
declare global {
  // eslint-disable-next-line no-var
  var __manorLastBeat: { at: number; nowPlayingSongId: string | null } | undefined;
}

export async function POST(req: NextRequest) {
  if (!authed(req)) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  const json = await req.json().catch(() => ({}));
  globalThis.__manorLastBeat = {
    at: Date.now(),
    nowPlayingSongId: typeof json.nowPlayingSongId === 'string' ? json.nowPlayingSongId : null,
  };
  return NextResponse.json({ ok: true });
}

export async function GET() {
  return NextResponse.json({ lastBeat: globalThis.__manorLastBeat ?? null });
}
