import { NextRequest, NextResponse } from 'next/server';

function authed(req: NextRequest) {
  const key = req.headers.get('x-player-key');
  return !!key && key === process.env.PLAYER_API_KEY;
}

// Lightweight liveness signal from the player. The admin dashboard polls
// /api/admin/status to know if the player is online based on the most recent
// heartbeat. (Persistence can be added later; for now just acknowledge.)
let lastBeat: { at: number; nowPlayingSongId: string | null } | null = null;

export async function POST(req: NextRequest) {
  if (!authed(req)) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  const json = await req.json().catch(() => ({}));
  lastBeat = {
    at: Date.now(),
    nowPlayingSongId: typeof json.nowPlayingSongId === 'string' ? json.nowPlayingSongId : null,
  };
  return NextResponse.json({ ok: true });
}

export async function GET() {
  return NextResponse.json({ lastBeat });
}
