/**
 * Metadata normalisation at ingest time.
 *
 * Different music providers (Promo Only, BPM Supreme, DJCity, MP3 Pool, …)
 * tag the same field differently. Rather than push that variance down to the
 * UI, we canonicalise here so the database has consistent values everywhere.
 *
 * Keep this in sync with web/src/lib/genres.ts — these run in different
 * processes (scanner on the SER5 vs Vercel server) so we can't share a file
 * directly without a build step.
 */

const GENRE_CANONICAL: Record<string, string> = {
  hiphop: 'Hip-Hop',
  rap: 'Hip-Hop',
  rnb: 'R&B',
  randb: 'R&B',
  rhythmandblues: 'R&B',
  edm: 'Dance/Electronic',
  electronic: 'Dance/Electronic',
  electronica: 'Dance/Electronic',
  dance: 'Dance/Electronic',
  house: 'Dance/Electronic',
  techno: 'Dance/Electronic',
  pop: 'Pop',
  rock: 'Rock',
  altrock: 'Alternative',
  alternativerock: 'Alternative',
  alternative: 'Alternative',
  altmetal: 'Alternative Metal',
  alternativemetal: 'Alternative Metal',
  metal: 'Metal',
  numetal: 'Alternative Metal',
  country: 'Country',
  latin: 'Latin',
  reggaeton: 'Latin',
  jazz: 'Jazz',
  soul: 'Soul',
  funk: 'Funk',
  reggae: 'Reggae',
  blues: 'Blues',
  punk: 'Punk',
  hardrock: 'Hard Rock',
  classicrock: 'Classic Rock',
  indie: 'Indie',
  folk: 'Folk',
  classical: 'Classical',
  soundtrack: 'Soundtrack',
};

function key(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]/g, '');
}

export function canonicalGenre(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const trimmed = raw.trim();
  if (!trimmed) return null;
  const k = key(trimmed);
  if (GENRE_CANONICAL[k]) return GENRE_CANONICAL[k];
  return trimmed
    .split(/\s+/)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(' ');
}

// BPM Supreme often puts BPM in filename instead of (or in addition to) ID3.
// We accept several common patterns and clamp to a reasonable 40–220 range.
const BPM_PATTERNS: RegExp[] = [
  /\b(\d{2,3})\s*BPM\b/i,
  /\[(\d{2,3})\]/, // [128]
  /\((\d{2,3})\s*BPM\)/i,
  /\((\d{2,3})\)\s*\.(mp3|m4a|wav|aac|flac|ogg)$/i, // (128).mp3
  /-\s*(\d{2,3})\s*-/, // " - 128 -"
  /_\s*(\d{2,3})\s*_/, // "_128_"
];

export function extractBpmFromFilename(filename: string): number | null {
  for (const p of BPM_PATTERNS) {
    const m = filename.match(p);
    if (m) {
      const bpm = parseInt(m[1], 10);
      if (Number.isFinite(bpm) && bpm >= 40 && bpm <= 220) return bpm;
    }
  }
  return null;
}

// Both Promo Only and BPM Supreme commonly leave provider watermarks in the
// title or filename. Trim them out so cooldowns and artist matches don't get
// confused by version annotations.
const PROVIDER_TAGS = [
  /\s*\(promo\s*only[^)]*\)/gi,
  /\s*\[promo\s*only[^\]]*\]/gi,
  /\s*\(bpm\s*supreme[^)]*\)/gi,
  /\s*\[bpm\s*supreme[^\]]*\]/gi,
  /\s*\(djcity[^)]*\)/gi,
  /\s*\[djcity[^\]]*\]/gi,
  /\s*\(intro[^)]*\)/gi, // BPM Supreme "Intro" tags
  /\s*\(short\s*edit\)/gi,
  /\s*\(quick\s*hit[^)]*\)/gi,
];

export function stripProviderTags(s: string | null | undefined): string {
  if (!s) return '';
  let out = s;
  for (const re of PROVIDER_TAGS) out = out.replace(re, '');
  return out.replace(/\s+/g, ' ').trim();
}
