// One-shot: generate public/og-image.jpg (1200x630) and public/apple-touch-icon.png (180x180).
// og-image is built from an existing hero photo with a dark gradient + brand text overlay.
// apple-touch-icon is built from public/favicon.svg.
import sharp from 'sharp';
import { promises as fs } from 'node:fs';
import path from 'node:path';

const root = path.resolve(process.cwd());
const HERO_SRC = path.join(root, 'public', 'img', 'ramka77mm.jpg');
const OG_OUT = path.join(root, 'public', 'og-image.jpg');
const TOUCH_OUT = path.join(root, 'public', 'apple-touch-icon.png');
const FAVICON = path.join(root, 'public', 'favicon.svg');

const W = 1200, H = 630;

const overlaySvg = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="g" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="rgba(0,0,0,0.05)"/>
      <stop offset="55%" stop-color="rgba(0,0,0,0.55)"/>
      <stop offset="100%" stop-color="rgba(0,0,0,0.88)"/>
    </linearGradient>
  </defs>
  <rect width="${W}" height="${H}" fill="url(#g)"/>
  <g font-family="Georgia, 'DM Serif Display', serif" fill="#ffffff">
    <text x="80" y="${H - 220}" font-size="36" font-weight="400" fill="#ae9070" letter-spacing="6">MEKRA</text>
    <text x="80" y="${H - 140}" font-size="76" font-weight="400">Fronty ramiakowe z płyty</text>
    <text x="80" y="${H - 80}" font-size="32" font-weight="300" fill="#d4c5ae" font-family="Helvetica, Arial, sans-serif">Producent — Toruń · ramki 7 / 18 / 36 / 60 mm</text>
  </g>
</svg>`;

async function main() {
  await fs.access(HERO_SRC);
  await sharp(HERO_SRC)
    .resize(W, H, { fit: 'cover', position: 'attention' })
    .composite([{ input: Buffer.from(overlaySvg), top: 0, left: 0 }])
    .jpeg({ quality: 86, mozjpeg: true })
    .toFile(OG_OUT);
  console.log('Wrote', OG_OUT);

  await sharp(FAVICON)
    .resize(180, 180, { fit: 'contain', background: { r: 26, g: 26, b: 26, alpha: 1 } })
    .png()
    .toFile(TOUCH_OUT);
  console.log('Wrote', TOUCH_OUT);
}

main().catch((e) => { console.error(e); process.exit(1); });
