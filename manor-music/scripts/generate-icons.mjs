// Generates PWA icons from public/icons/icon-source.svg.
// Run with: node scripts/generate-icons.mjs
// Re-run any time you tweak the source SVG.
import sharp from 'sharp';
import { readFileSync, writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import path from 'path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');

const SOURCE = path.join(root, 'public/icons/icon-source.svg');
const TARGETS = [
  { size: 192, file: 'icon-192.png' },
  { size: 512, file: 'icon-512.png' },
  { size: 180, file: 'apple-touch-icon.png' },
  { size: 32, file: 'favicon-32.png' },
  { size: 16, file: 'favicon-16.png' },
];

const svg = readFileSync(SOURCE);

for (const { size, file } of TARGETS) {
  const out = path.join(root, 'public/icons', file);
  const buf = await sharp(svg).resize(size, size).png({ compressionLevel: 9 }).toBuffer();
  writeFileSync(out, buf);
  console.log(`wrote ${file} (${size}×${size})`);
}
