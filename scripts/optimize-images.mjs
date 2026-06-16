// Generuje responsywne pliki WebP dla obrazów produktowych i sekcji "O firmie".
// Wzorzec zgodny z istniejącymi plikami .webp w public/img/realizacje/.
// Uruchom: node scripts/optimize-images.mjs
import sharp from 'sharp';
import { statSync } from 'fs';
import path from 'path';

const ROOT = path.resolve('public/img');

// Obrazy w siatce kart (wyświetlane do ~620px CSS, srcset do 2x)
const cards = ['ramka77mm', 'ramka18mm', 'ramka36mm', 'ramka60mm'];
const cardWidths = [400, 640, 900, 1280];

// Obraz w sekcji "O firmie" (kolumna do ~620px, kadr pionowy 4:5)
const portrait = ['mekra-produkcja'];
const portraitWidths = [400, 600, 800, 1000];

const kib = (f) => Math.round(statSync(f).size / 1024) + ' KiB';

async function variants(base, widths, quality) {
  const src = path.join(ROOT, base + '.jpg');
  for (const w of widths) {
    const out = path.join(ROOT, `${base}-${w}.webp`);
    await sharp(src)
      .resize({ width: w, withoutEnlargement: true })
      .webp({ quality })
      .toFile(out);
    console.log(`  ${path.basename(out)} — ${kib(out)}`);
  }
}

for (const b of cards) {
  console.log(b + '.jpg →');
  await variants(b, cardWidths, 72);
}
for (const b of portrait) {
  console.log(b + '.jpg →');
  await variants(b, portraitWidths, 74);
}

// Rekompresja hero (PageSpeed: za niska kompresja, ~203 KiB do odzyskania)
const hero = path.join(ROOT, 'realizacje/ramka-36mm/ramka-36mm-grudziadz-40.webp');
const heroJpg = path.join(ROOT, 'realizacje/ramka-36mm/ramka-36mm-grudziadz-40.jpg');
console.log('hero grudziadz-40 → rekompresja');
await sharp(heroJpg).resize({ width: 1920, withoutEnlargement: true }).webp({ quality: 60 }).toFile(hero);
console.log(`  ${path.basename(hero)} — ${kib(hero)}`);
