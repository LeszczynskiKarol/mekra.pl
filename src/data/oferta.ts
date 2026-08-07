// Centralized data for /oferta and /oferta/[slug] pages.
// Treść wariantów mieszka w src/content/pages/oferta/*.json (edytowalna w CMS);
// ten moduł składa z niej z powrotem tablicę `ofertaVariants` w dotychczasowym
// kształcie, więc strony konsumujące dane nie wymagają zmian.
// Keep slugs in sync with src/data/realizacje.json.

export type OfertaVariant = {
  slug: string;
  size: string;
  unit: string;
  name: string;
  tagline: string;
  shortDescription: string;
  heroIntro: string;
  heroImage: string;
  styles: string[];
  rooms: string[];
  highlights: { title: string; description: string }[];
  longDescription: string[];
  pros: string[];
  bestFor: string;
  notFor?: string;
  seo: {
    title: string;
    description: string;
    keywords: string[];
  };
};

type OfertaVariantJson = {
  title: string;
  description: string;
  slug: string;
  order: number;
  size: string;
  unit: string;
  name: string;
  subtitle: string;
  text: string;
  intro: string;
  image: string;
  styles: string[];
  rooms: string[];
  items: { title: string; text: string }[];
  body: string[];
  bullets: string[];
  bestFor: string;
  notFor?: string;
  keywords: string[];
};

const modules = import.meta.glob('../content/pages/oferta/*.json', {
  eager: true,
}) as Record<string, { default: OfertaVariantJson }>;

export const ofertaVariants: OfertaVariant[] = Object.values(modules)
  .map((mod) => mod.default)
  // W katalogu leżą też JSON-y stron (bez pola `order`) — bierzemy tylko warianty.
  .filter((data) => typeof data.order === 'number')
  .sort((a, b) => a.order - b.order)
  .map((data) => ({
    slug: data.slug,
    size: data.size,
    unit: data.unit,
    name: data.name,
    tagline: data.subtitle,
    shortDescription: data.text,
    heroIntro: data.intro,
    heroImage: data.image,
    styles: data.styles,
    rooms: data.rooms,
    highlights: data.items.map((h) => ({ title: h.title, description: h.text })),
    longDescription: data.body,
    pros: data.bullets,
    bestFor: data.bestFor,
    ...(data.notFor !== undefined ? { notFor: data.notFor } : {}),
    seo: {
      title: data.title,
      description: data.description,
      keywords: data.keywords,
    },
  }));

export function getOfertaVariant(slug: string): OfertaVariant | undefined {
  return ofertaVariants.find((v) => v.slug === slug);
}
