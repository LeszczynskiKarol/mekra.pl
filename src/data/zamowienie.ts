// ============================================================================
// Dane kreatora zamówień (/zamowienie)
//
// Katalog dekorów (producenci + arkusze + zdjęcia) pochodzi z `dekory.json`,
// generowanego skryptami z `scripts/dekory/` na podstawie:
//  - cenników XLSX od dostawców (Egger, Swiss Krono) — katalog-wzornikow,
//  - listingu kronosfera.pl (Kronospan, ceny detaliczne).
// Aktualizacja cennika = ponowne uruchomienie skryptów, patrz scripts/dekory/README.md.
//
// Stałe cenowe pochodzą z cennika Mekra (public/docs/cennik-mekra.pdf):
//  - marża 150 zł netto za każdy m²
//  - minimum logistyczne 4 m² — poniżej dopłata +30% wartości zamówienia
//  - dopłaty za szkło / lustro / zacinanie 45° / słój przechodzący
// ============================================================================

import katalog from './dekory.json';

export interface Arkusz {
  code: string;   // kod dekoru producenta, np. H1180
  name: string;   // nazwa handlowa dekoru
  finish: string; // struktura powierzchni, np. ST37 / OW / PE / mat onyx
  price: number;  // cena arkusza netto [zł]
  area: number;   // powierzchnia arkusza [m²] — Forner ma inne formaty niż reszta
  format: string; // format arkusza [mm]
  family: string; // rodzina do filtrów: drewno / jednolite / kamień / metal / tkanina
  group: string;  // kolekcja producenta (jeśli podana), np. Woodgrains / Onyx
  img: string;    // miniatura dekoru w /public
}

export interface Producent {
  id: string;
  name: string;
  tagline: string;
  logo: string;         // logo producenta w /public (monochromatyzowane w CSS)
  sheetFormat: string;  // format(y) arkusza [mm]
  sheetAreaM2: number;  // domyślna powierzchnia arkusza [m²]; dekor może mieć własną
  arkusze: Arkusz[];
}

export interface ZestawProbek {
  id: string;
  name: string;
  text: string;
  price: number | null; // null = brak ceny w cenniku (do uzupełnienia)
}

// --- Stałe cenowe (cennik Mekra, ceny netto) --------------------------------
export const PRICING = {
  m2Fee: 150,            // zł netto za każdy m² (robocizna Mekra)
  minM2: 4,              // minimum logistyczne [m²]
  belowMinPct: 30,       // dopłata poniżej minimum [% wartości zamówienia netto]
  grainMatchPct: 20,     // słój przechodzący [% wartości zamówienia netto]
  vatPct: 23,
  addons: [
    { id: 'glassSmall',  name: 'Front ze szkłem — mały',  text: 'Wpuszczone szkło, rozmiar szafek kuchennych.', price: 190, unit: 'zł netto / front' },
    { id: 'mirrorSmall', name: 'Front z lustrem — mały',  text: 'Wpuszczone lustro, rozmiar szafek kuchennych.', price: 250, unit: 'zł netto / front' },
    { id: 'glassLarge',  name: 'Front ze szkłem — duży',  text: 'Wpuszczone szkło, rozmiar frontów szaf.', price: 300, unit: 'zł netto / front' },
    { id: 'mirrorLarge', name: 'Front z lustrem — duży',  text: 'Wpuszczone lustro, rozmiar frontów szaf.', price: 400, unit: 'zł netto / front' },
    { id: 'angle45',     name: 'Zacinanie na 45°',        text: 'Doliczane do każdego frontu zacinanego pod kątem.', price: 60, unit: 'zł netto / front' },
  ],
  ramki: ['7 mm', '18 mm', '36 mm', '60 mm'],
};

// --- Zestawy próbek ---------------------------------------------------------
// W cenniku Mekra nie ma pozycji o próbkach — ceny zostawione puste (null).
// Klient NIE wybiera materiału ani producenta — próbki przygotowuje Mekra.
export const ZESTAWY_PROBEK: ZestawProbek[] = [
  {
    id: 'probki-standard',
    name: 'Próbnik standardowy',
    text: 'Gotowy zestaw próbek frontów ramiakowych przygotowany przez Mekra — przekrój ramek 7/18/36/60 mm i popularnych dekorów.',
    price: null,
  },
  {
    id: 'probki-indywidualne',
    name: 'Próbki pod projekt',
    text: 'Opisz swój projekt w uwagach, a przygotujemy próbki dopasowane do Twojej realizacji.',
    price: null,
  },
];

// --- Katalogi producentów (z dekory.json) -----------------------------------
export const KATALOG_UPDATED: string = katalog.updated;

export const PRODUCENCI: Producent[] = katalog.producers.map((p) => ({
  id: p.id,
  name: p.name,
  tagline: p.tagline,
  logo: p.logo,
  sheetFormat: p.sheetFormat,
  sheetAreaM2: p.sheetAreaM2,
  arkusze: katalog.decors
    .filter((d) => d.p === p.id)
    .map((d) => ({
      code: d.c, name: d.n, finish: d.s, price: d.pr,
      area: d.a, format: d.fm, family: d.f, group: d.g, img: d.i,
    })),
}));

// Nazwy rodzin dekorów używane w filtrach katalogu.
export const RODZINY: Record<string, string> = {
  drewno: 'Drewno',
  jednolite: 'Jednolite',
  kamień: 'Kamień i beton',
  metal: 'Metal',
  tkanina: 'Tkaniny',
};
