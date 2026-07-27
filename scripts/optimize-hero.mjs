// Generuje odchudzone warianty zdjęć-teł hero (strona główna + podstrony).
// Tła są częściowo zasłonięte featherem gradientowym (na mobile to wash ~18%
// opacity), więc mogą być skompresowane mocniej niż zdjęcia w galerii.
// Wyjście: public/img/hero/<basename>-{640,1280,1920}.webp
// Uruchomienie: node scripts/optimize-hero.mjs
import sharp from 'sharp';
import { existsSync, mkdirSync } from 'node:fs';
import { basename, join } from 'node:path';

const HEROES = [
  'public/img/realizacje/ramka-36mm/ramka-36mm-grudziadz-40.webp', // strona główna
  'public/img/realizacje/ramka-36mm/ramka-36mm-grudziadz-01.webp', // /oferta/
  'public/img/realizacje/ramka-18mm/ramka-18mm-rubinova-05.webp',  // /cennik/
  'public/img/mekra-produkcja.webp',                               // /warunki-gwarancji/
  'public/img/realizacje/ramka-18mm/ramka-18mm-rubinova-01.webp',  // /oferta/fronty-laminowane/
  'public/img/realizacje/ramka-36mm/ramka-36mm-grudziadz-13.webp', // /fronty-laminowane-czy-lakierowane/
  'public/img/realizacje/zabudowy/zabudowa-wino-01.webp',          // /fronty-meblowe-torun/
  'public/img/realizacje/ramka-60mm/ramka-60mm-witrynka-01.webp',  // /fronty-z-ramka/
];

// Szerokość -> jakość. 640 idzie tylko na telefony, gdzie tło jest ledwo
// widocznym washem — może być mocno zgnieciona.
const VARIANTS = [
  [640, 45],
  [1280, 55],
  [1440, 55],
  [1920, 58],
];

const outDir = 'public/img/hero';
mkdirSync(outDir, { recursive: true });

for (const heroPath of HEROES) {
  // Preferuj oryginalny .jpg jako źródło (unika podwójnej kompresji webp).
  const jpg = heroPath.replace(/\.webp$/, '.jpg');
  const src = existsSync(jpg) ? jpg : heroPath;
  const base = basename(heroPath).replace(/\.webp$/, '');

  for (const [width, quality] of VARIANTS) {
    const out = join(outDir, `${base}-${width}.webp`);
    const { size } = await sharp(src)
      .resize({ width, withoutEnlargement: true })
      .webp({ quality })
      .toFile(out);
    console.log(`${out}  ${(size / 1024).toFixed(0)} KiB`);
  }
}
