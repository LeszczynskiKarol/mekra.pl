#import "mekra-brand.typ": *

#show: mekra-doc.with("Cennik")

// ═══ STRONA 1 — ceny ═══════════════════════════════════════

#v(15pt)

// Tytuł
#text(font: f-display, size: 30pt, fill: c-text)[Cennik frontów]
#linebreak()
#text(font: f-display, size: 30pt, fill: c-accent-l)[ramiakowych]

#v(8pt)
#box(width: 150mm)[
  #set par(justify: false)
  #text(font: f-body, size: 9.5pt, fill: c-text-2)[
    Solidna konstrukcja frontów ramiakowych z trwałej płyty laminowanej —
    odporna na wilgoć i uszkodzenia, łatwa w pielęgnacji. Wykonamy je z każdej
    płyty laminowanej dostępnej na rynku: laminaty, folie PPV i akryle w połysku.
  ]
]

#v(11pt)

// ── Pozycja podstawowa ──
#card(inset: 15pt, radius: 12pt)[
  #grid(
    columns: (1fr, auto),
    column-gutter: 22pt,
    align: (left + horizon, right + horizon),
    [
      #tag("Pozycja podstawowa")
      #v(9pt)
      #text(font: f-display, size: 20pt, fill: c-text)[Fronty ramiakowe]
      #v(8pt)
      #stack(dir: ltr, spacing: 5pt, chip[7 mm], chip[18 mm], chip[36 mm], chip[60 mm])
      #v(9pt)
      #text(font: f-body, size: 8.2pt, fill: c-text-2)[
        Cena zależna od wybranego dekoru — każde zamówienie \
        wyceniamy indywidualnie.
      ]
    ],
    [
      #align(right)[
        #text(font: f-display, size: 34pt, fill: c-accent)[od 350 zł]
        #v(2pt)
        #text(font: f-heading, weight: 500, size: 7.5pt, fill: c-muted, tracking: 1.4pt)[\/ M² NETTO]
      ]
    ],
  )
]

#v(9pt)

// ── Opcje dodatkowe ──
#section-h("Opcje dodatkowe i dopłaty", [Szkło, lustro i usługi])

#v(1pt)

#let price-row(name, desc, price, unit) = {
  v(5pt)
  grid(
    columns: (1fr, auto),
    column-gutter: 20pt,
    align: (left + horizon, right + horizon),
    stack(
      spacing: 4pt,
      text(font: f-heading, weight: 600, size: 10pt, fill: c-text, name),
      text(font: f-body, size: 8pt, fill: c-text-2, desc),
    ),
    stack(
      spacing: 3.5pt,
      align(right, text(font: f-display, size: 15pt, fill: c-accent, price)),
      align(right, text(font: f-heading, weight: 500, size: 6.2pt, fill: c-muted, tracking: 1pt, upper(unit))),
    ),
  )
  v(5pt)
  line(length: 100%, stroke: 0.5pt + c-border)
}

#price-row(
  [Front ramiakowy ze szkłem — mały],
  [Front z wpuszczonym szkłem w rozmiarze szafek kuchennych.],
  [\+ 190 zł], [netto / front],
)
#price-row(
  [Front ramiakowy z lustrem — mały],
  [Front z wpuszczonym lustrem w rozmiarze szafek kuchennych.],
  [\+ 250 zł], [netto / front],
)
#price-row(
  [Front ramiakowy ze szkłem — duży],
  [Front z wpuszczonym szkłem w rozmiarze frontów szaf.],
  [\+ 300 zł], [netto / front],
)
#price-row(
  [Front ramiakowy z lustrem — duży],
  [Front z wpuszczonym lustrem w rozmiarze frontów szaf.],
  [\+ 400 zł], [netto / front],
)
#price-row(
  [Zacinanie na 45°],
  [Kwotę doliczamy do ceny pojedynczego frontu zacinanego pod kątem.],
  [\+ 60 zł], [netto / front],
)
#price-row(
  [Zamówienie poniżej minimum logistycznego],
  [Dopłata do zamówienia poniżej 3 m² — doliczana do kwoty frontów.],
  [\+ 30%], [do kwoty frontów],
)

#v(9pt)
#text(font: f-body, size: 7.5pt, fill: c-muted, style: "italic")[
  Wszystkie podane ceny są cenami netto. Cennik ma charakter orientacyjny
  i nie stanowi oferty handlowej w rozumieniu Kodeksu cywilnego.
]

#pagebreak()

// ═══ STRONA 2 — informacje ═════════════════════════════════

#v(22pt)

#section-h("Warto wiedzieć", [Co jest wliczone w cenę?], size: 22pt)

#v(14pt)

#let info-card(title, desc) = card(inset: 13pt, radius: 9pt)[
  #grid(
    columns: (auto, 1fr), column-gutter: 9pt, align: (center + top, left + top),
    box(
      width: 13pt, height: 13pt, fill: c-bg-3, radius: 100pt,
      align(center + horizon, text(size: 7.5pt, fill: c-accent, weight: 700, sym.checkmark)),
    ),
    stack(
      spacing: 5pt,
      text(font: f-heading, weight: 600, size: 9.5pt, fill: c-text, title),
      text(font: f-body, size: 8pt, fill: c-text-2, desc),
    ),
  )
]

#grid(
  columns: (1fr, 1fr),
  gutter: 9pt,
  info-card(
    [Klej PUR w standardzie],
    [Wszystkie fronty oklejamy wilgocioodpornym klejem PUR — z dostawą na Twój adres, bez dopłat.],
  ),
  info-card(
    [Czas realizacji 6–8 tygodni],
    [Tyle standardowo czeka się na zamówienie od potwierdzenia specyfikacji.],
  ),
  info-card(
    [Dostawa kurierem],
    [Fronty wysyłamy kurierem. Koszt dostawy szacujemy po złożeniu zamówienia.],
  ),
  info-card(
    [Transport dedykowany],
    [Fronty z lustrem lub szkłem o dużym gabarycie dostarczamy transportem dedykowanym — nie przesyłką kurierską.],
  ),
  info-card(
    [Cena zależna od dekoru],
    [Ostateczna cena frontów zależy od wybranego dekoru płyty — stąd wycena indywidualna.],
  ),
  info-card(
    [Dowolna płyta z rynku],
    [Wykonamy fronty z każdej płyty laminowanej dostępnej na rynku — laminaty, folie PPV i akryle w połysku.],
  ),
)

#v(18pt)

// ── Producenci płyt ──
#card(inset: 16pt, radius: 10pt, fill: c-bg-2)[
  #text(font: f-heading, weight: 600, size: 9.5pt, fill: c-text)[Pracujemy na płytach sprawdzonych producentów]
  #v(8pt)
  #stack(dir: ltr, spacing: 6pt, chip[Egger], chip[Kronospan], chip[Swiss Krono], chip[Forner])
]

#v(18pt)

// ── CTA / kontakt ──
#card(inset: 20pt, radius: 12pt)[
  #align(center)[
    #text(font: f-display, size: 19pt, fill: c-text)[Chcesz znać dokładną cenę?]
    #v(7pt)
    #box(width: 120mm)[
      #text(font: f-body, size: 8.5pt, fill: c-text-2)[
        Wyślij wymiary i wybrany dekor — odpowiemy z konkretną wyceną
        dopasowaną do Twojego projektu.
      ]
    ]
    #v(12pt)
    #grid(
      columns: 3,
      column-gutter: 26pt,
      align: center,
      stack(
        spacing: 5pt,
        text(font: f-heading, weight: 500, size: 6.5pt, fill: c-muted, tracking: 1.4pt)[TELEFON],
        text(font: f-heading, weight: 600, size: 11pt, fill: c-accent)[792 456 094],
      ),
      stack(
        spacing: 5pt,
        text(font: f-heading, weight: 500, size: 6.5pt, fill: c-muted, tracking: 1.4pt)[E-MAIL],
        text(font: f-heading, weight: 600, size: 11pt, fill: c-accent)[kontakt\@mekra.pl],
      ),
      stack(
        spacing: 5pt,
        text(font: f-heading, weight: 500, size: 6.5pt, fill: c-muted, tracking: 1.4pt)[WWW],
        text(font: f-heading, weight: 600, size: 11pt, fill: c-accent)[www.mekra.pl],
      ),
    )
  ]
]
