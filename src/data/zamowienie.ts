// ============================================================================
// Dane kreatora zamówień (/zamowienie)
//
// UWAGA — DANE POGLĄDOWE:
// Katalogi arkuszy (dekory + ceny) są PRZYKŁADOWE i służą do pracy nad
// formularzem. Przed uruchomieniem produkcyjnym podmień je na realne cenniki
// producentów (docelowo: zaczytywane z cenników / API producentów).
//
// Stałe cenowe pochodzą z cennika Mekra (docs/cennik-mekra.pdf):
//  - marża 150 zł netto za każdy m²
//  - minimum logistyczne 4 m² — poniżej dopłata +30% wartości zamówienia
//  - dopłaty za szkło / lustro / zacinanie 45° / słój przechodzący
// ============================================================================

export interface Arkusz {
  code: string;          // kod dekoru producenta
  name: string;          // nazwa handlowa dekoru
  finish: string;        // wykończenie: mat / połysk / struktura / super mat
  price: number;         // cena arkusza netto [zł] — PRZYKŁADOWA, do podmiany
  swatch: string;        // CSS background imitujący dekor (kafelek w katalogu)
  dark?: boolean;        // jasny tekst na ciemnym dekorze
}

export interface Producent {
  id: string;
  name: string;
  tagline: string;
  sheetFormat: string;   // format arkusza [mm]
  sheetAreaM2: number;   // powierzchnia arkusza [m²] — do wyliczenia liczby arkuszy
  arkusze: Arkusz[];
}

export interface ZestawProbek {
  id: string;
  name: string;
  text: string;
  price: number | null;  // null = brak ceny w cenniku (do uzupełnienia)
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

// --- Katalogi producentów ---------------------------------------------------
// CENY I DEKORY PRZYKŁADOWE — do podmiany na realne cenniki.
export const PRODUCENCI: Producent[] = [
  {
    id: 'egger',
    name: 'Egger',
    tagline: 'Najszersza paleta dekorów drewnopodobnych i uni',
    sheetFormat: '2800 × 2070',
    sheetAreaM2: 5.8,
    arkusze: [
      { code: 'W1000 ST9',  name: 'Biały Premium',        finish: 'mat',       price: 280, swatch: 'linear-gradient(135deg,#f7f6f2,#eceae4)' },
      { code: 'U999 ST12',  name: 'Czarny',               finish: 'struktura', price: 300, swatch: 'linear-gradient(135deg,#17181a,#26272b)', dark: true },
      { code: 'U702 ST9',   name: 'Kaszmir',              finish: 'mat',       price: 285, swatch: 'linear-gradient(135deg,#d8d0c3,#c9c0b1)' },
      { code: 'H1180 ST37', name: 'Dąb Halifax naturalny', finish: 'struktura', price: 345, swatch: 'repeating-linear-gradient(95deg,#c8a878 0 6px,#b9955f 6px 9px,#c19e6b 9px 18px)' },
      { code: 'H1122 ST22', name: 'Dąb Whiteriver piaskowy', finish: 'struktura', price: 350, swatch: 'repeating-linear-gradient(93deg,#d9c4a3 0 7px,#cbb28a 7px 10px,#d2bb97 10px 20px)' },
      { code: 'H3730 ST10', name: 'Hikora Naturalna',     finish: 'struktura', price: 330, swatch: 'repeating-linear-gradient(96deg,#c9a06a 0 5px,#b58748 5px 8px,#c2975b 8px 16px)' },
      { code: 'F812 ST9',   name: 'Marmur Levanto biały', finish: 'mat',       price: 420, swatch: 'linear-gradient(120deg,#f2f0ec 60%,#dcd8d2 62%,#f2f0ec 66%,#e6e2db 80%,#f4f2ee)' },
      { code: 'U633 ST9',   name: 'Turkus morski',        finish: 'mat',       price: 295, swatch: 'linear-gradient(135deg,#3d6a6a,#2f5757)', dark: true },
    ],
  },
  {
    id: 'kronospan',
    name: 'Kronospan',
    tagline: 'Popularne dekory w dobrej cenie',
    sheetFormat: '2800 × 2070',
    sheetAreaM2: 5.8,
    arkusze: [
      { code: 'K101 PE',  name: 'Biały Front',        finish: 'perła',     price: 240, swatch: 'linear-gradient(135deg,#f8f8f6,#eeeeea)' },
      { code: '0190 PE',  name: 'Czarny',             finish: 'perła',     price: 255, swatch: 'linear-gradient(135deg,#1a1b1d,#2b2c30)', dark: true },
      { code: 'K003 PW',  name: 'Dąb Craft Złoty',    finish: 'struktura', price: 310, swatch: 'repeating-linear-gradient(94deg,#c69b62 0 6px,#b2854a 6px 9px,#bd9157 9px 17px)' },
      { code: 'K002 PW',  name: 'Dąb Craft Szary',    finish: 'struktura', price: 310, swatch: 'repeating-linear-gradient(94deg,#b3a894 0 6px,#a09480 6px 9px,#aa9e8a 9px 17px)' },
      { code: '8681 SN',  name: 'Kaszmir',            finish: 'satyna',    price: 250, swatch: 'linear-gradient(135deg,#d6cec1,#c8bfb0)' },
      { code: '5981 BS',  name: 'Beton Millenium',    finish: 'struktura', price: 290, swatch: 'linear-gradient(120deg,#b8b5b0 55%,#a8a5a0 58%,#b3b0ab 70%,#adaaa5)' },
    ],
  },
  {
    id: 'swiss-krono',
    name: 'Swiss Krono',
    tagline: 'Sprawdzone dekory klasyczne i nowoczesne',
    sheetFormat: '2800 × 2070',
    sheetAreaM2: 5.8,
    arkusze: [
      { code: '8685 BS',  name: 'Biały śnieżny',   finish: 'mat',       price: 230, swatch: 'linear-gradient(135deg,#fbfbf9,#f0f0ec)' },
      { code: 'D3025 OW', name: 'Dąb Sonoma',      finish: 'struktura', price: 270, swatch: 'repeating-linear-gradient(95deg,#cfae82 0 7px,#c09a68 7px 10px,#c7a475 10px 19px)' },
      { code: 'D4895 UW', name: 'Beton Chicago',   finish: 'struktura', price: 300, swatch: 'linear-gradient(120deg,#9d9a95 55%,#8d8a85 58%,#98958f 70%,#928f89)', dark: true },
      { code: 'D7402 WL', name: 'Orzech Select',   finish: 'struktura', price: 320, swatch: 'repeating-linear-gradient(93deg,#8a6547 0 6px,#754f33 6px 9px,#815b3d 9px 18px)', dark: true },
    ],
  },
  {
    id: 'forner',
    name: 'Forner',
    tagline: 'Płyty akrylowe i super mat klasy premium',
    sheetFormat: '2800 × 1300',
    sheetAreaM2: 3.64,
    arkusze: [
      { code: '85388 AC', name: 'Biały połysk',      finish: 'połysk',    price: 520, swatch: 'linear-gradient(115deg,#ffffff 40%,#eef0f2 50%,#ffffff 60%,#f4f6f8)' },
      { code: '85522 AC', name: 'Czarny super mat',  finish: 'super mat', price: 560, swatch: 'linear-gradient(135deg,#121315,#1d1e21)', dark: true },
      { code: '84888 AC', name: 'Kaszmir super mat', finish: 'super mat', price: 555, swatch: 'linear-gradient(135deg,#d3cabb,#c5bbaa)' },
      { code: '85101 AC', name: 'Szary połysk',      finish: 'połysk',    price: 530, swatch: 'linear-gradient(115deg,#c4c7cb 40%,#b2b5ba 50%,#c1c4c8 60%,#babdc2)' },
    ],
  },
];
