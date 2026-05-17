import { NextRequest, NextResponse } from 'next/server';
import QRCode from 'qrcode';

// Public QR image endpoint so the print page can <img src="/api/qr?text=...">
// the codes inline. Caches aggressively — the same text always yields the
// same bits.
export async function GET(req: NextRequest) {
  const text = req.nextUrl.searchParams.get('text');
  if (!text || text.length > 500) {
    return NextResponse.json({ error: 'missing or too-long text' }, { status: 400 });
  }
  const png = await QRCode.toBuffer(text, {
    errorCorrectionLevel: 'M',
    margin: 1,
    width: 360,
    color: { dark: '#0E1116', light: '#F2E9D8' },
  });
  return new NextResponse(new Uint8Array(png), {
    headers: {
      'content-type': 'image/png',
      'cache-control': 'public, max-age=31536000, immutable',
    },
  });
}
