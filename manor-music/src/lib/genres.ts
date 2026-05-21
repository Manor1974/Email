// Genre name normalisation.
//
// Different music sources tag the same genre differently — "Hip-Hop",
// "hip-hop", "HipHop", "Hip Hop" all show up. We collapse them to a single
// canonical name so the UI only shows one chip per genre.
//
// Two helpers:
//   canonicalGenre(raw)   -> a presentation-friendly name
//   matchesGenre(raw, sel) -> true if `raw` (any case/punctuation variant) is
//                             the same genre as `sel`

const CANONICAL: Record<string, string> = {
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
  if (CANONICAL[k]) return CANONICAL[k];
  // Unknown genre — keep the original casing as the canonical form for now,
  // but apply title-case-ish formatting so we don't get all-lowercase chips.
  return trimmed
    .split(/\s+/)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(' ');
}

export function matchesGenre(raw: string | null | undefined, selected: string): boolean {
  if (!raw) return false;
  return key(raw) === key(selected) || canonicalGenre(raw) === canonicalGenre(selected);
}
