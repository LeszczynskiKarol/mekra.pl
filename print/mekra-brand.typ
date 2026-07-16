// ─────────────────────────────────────────────────────────────
// MEKRA — wspólny styl firmowych dokumentów PDF
// Paleta i typografia 1:1 ze strony www.mekra.pl (global.css)
// Kompilacja: typst compile --font-path print/fonts <plik>.typ
// ─────────────────────────────────────────────────────────────

// Paleta (light theme strony)
#let c-bg = rgb("#fafaf8")
#let c-bg-2 = rgb("#f5f4f0")
#let c-bg-3 = rgb("#eae8e2")
#let c-text = rgb("#1f2937")
#let c-text-2 = rgb("#6b7280")
#let c-muted = rgb("#9ca3af")
#let c-border = rgb("#e5e5e0")
#let c-accent = rgb("#866751")
#let c-accent-l = rgb("#ae9070")
#let c-accent-xl = rgb("#d4c5ae")
#let c-card = rgb("#ffffff")

// Fonty
#let f-display = "DM Serif Display"
#let f-heading = "Outfit"
#let f-body = "Plus Jakarta Sans"

// ── Logo ────────────────────────────────────────────────────
#let logo = grid(
  columns: 2,
  column-gutter: 8pt,
  align: horizon,
  box(
    width: 26pt, height: 26pt,
    fill: c-accent, radius: 7pt,
    align(center + horizon, text(font: f-display, fill: white, size: 15pt, baseline: -1pt)[M]),
  ),
  stack(
    spacing: 4pt,
    text(font: f-display, size: 14pt, fill: c-text)[Mekra.pl],
    text(font: f-heading, weight: 500, size: 5.5pt, fill: c-muted, tracking: 1.6pt)[FRONTY RAMIAKOWE],
  ),
)

// ── Komponenty ──────────────────────────────────────────────

// Pigułka-etykieta (odpowiednik .label-tag ze strony)
#let tag(txt) = box(
  fill: c-bg-3, stroke: 0.5pt + c-border, radius: 100pt,
  inset: (x: 9pt, y: 5pt),
  text(font: f-heading, weight: 500, size: 7pt, fill: c-accent, tracking: 1.5pt, upper(txt)),
)

// Mała pigułka z rozmiarem ramki (np. "7 mm")
#let chip(txt) = box(
  fill: c-bg-3, stroke: 0.5pt + c-border, radius: 100pt,
  inset: (x: 8pt, y: 4.5pt),
  text(font: f-heading, weight: 600, size: 8.5pt, fill: c-accent, txt),
)

// Nagłówek sekcji: etykieta + tytuł serif
#let section-h(label-txt, title, size: 17pt) = stack(
  spacing: 9pt,
  tag(label-txt),
  text(font: f-display, size: size, fill: c-text, title),
)

// Karta (odpowiednik .card-base)
#let card(body, inset: 14pt, radius: 10pt, fill: c-card) = block(
  fill: fill, stroke: 0.5pt + c-border, radius: radius,
  inset: inset, width: 100%, breakable: false,
  body,
)

// Punkt listy "zalecane" (✓)
#let check-item(body) = grid(
  columns: (auto, 1fr), column-gutter: 7pt, align: (center + top, left + top),
  box(
    width: 11pt, height: 11pt, fill: c-bg-3, radius: 100pt,
    align(center + horizon, text(size: 6.5pt, fill: c-accent, weight: 700, sym.checkmark)),
  ),
  text(font: f-body, size: 8.2pt, fill: c-text-2, body),
)

// Punkt listy "zakazane" (✕)
#let cross-item(body) = grid(
  columns: (auto, 1fr), column-gutter: 7pt, align: (center + top, left + top),
  box(
    width: 11pt, height: 11pt, fill: c-bg-3, radius: 100pt,
    align(center + horizon, text(size: 6.5pt, fill: c-muted, weight: 700, sym.times)),
  ),
  text(font: f-body, size: 8.2pt, fill: c-text-2, body),
)

// Punkt informacyjny (i)
#let info-item(body) = grid(
  columns: (auto, 1fr), column-gutter: 7pt, align: (center + top, left + top),
  box(
    width: 11pt, height: 11pt, fill: c-bg-3, radius: 100pt,
    align(center + horizon, text(font: f-display, size: 7.5pt, fill: c-accent, style: "italic")[i]),
  ),
  text(font: f-body, size: 8.2pt, fill: c-text-2, body),
)

// ── Ustawienia strony ───────────────────────────────────────
#let mekra-doc(doc-label, body) = {
  set text(font: f-body, size: 9pt, fill: c-text, lang: "pl")
  set par(leading: 0.62em)
  set page(
    paper: "a4",
    fill: c-bg,
    margin: (x: 16mm, top: 14mm, bottom: 14mm),
    footer: context [
      #line(length: 100%, stroke: 0.5pt + c-border)
      #v(6pt)
      #grid(
        columns: (1fr, auto),
        align: (left, right),
        text(size: 6.8pt, fill: c-muted, font: f-body)[
          MEKRA · ul. Batorego 92 e/f, 87-100 Toruń · tel. 792 456 094 · kontakt\@mekra.pl · www.mekra.pl
        ],
        text(size: 6.8pt, fill: c-muted, font: f-heading, weight: 500)[
          #counter(page).display("1 / 1", both: true)
        ],
      )
    ],
  )

  // Nagłówek na pierwszej stronie: logo + etykieta dokumentu
  grid(
    columns: (1fr, auto),
    align: (left + horizon, right + horizon),
    logo,
    tag(doc-label),
  )
  v(6pt)
  line(length: 100%, stroke: 0.5pt + c-border)

  body
}
