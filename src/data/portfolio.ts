// ─────────────────────────────────────────────────────────────────────────────
// Gallery data — single, standardized source for the "global portfolio" system.
//
// Schema is the canonical PortfolioImage shape, zgodny z centralnym
// `galleries.json` w panelu AWS. Docelowo te dane będą pobierane fetch-em z
//   media.torweb.pl/mekra.pl/galleries.json
// i to jest jedyny punkt, który wtedy trzeba będzie podmienić.
//
// Na razie projektujemy listę 1:1 z lokalnego, generowanego manifestu
// `realizacje.json` (produkowanego przez scripts/optimize-gallery.mjs). Dzięki
// temu istnieje JEDNO źródło prawdy dla listy zdjęć — bez drugiej, ręcznie
// utrzymywanej kopii, która mogłaby się rozjechać po regeneracji galerii.
// Kolejność, alt i kategoria są zachowane dokładnie tak, jak w manifeście.
// ─────────────────────────────────────────────────────────────────────────────
import manifest from './realizacje.json';

export interface PortfolioImage {
  src: string;
  alt?: string;
  category?: string;
}

export const portfolio: PortfolioImage[] = manifest.items.map((item) => ({
  src: item.paths.full,
  alt: item.alt,
  category: item.category,
}));
