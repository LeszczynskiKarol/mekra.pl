#import "mekra-brand.typ": *

#show: mekra-doc.with("Warunki techniczne i gwarancyjne")

// ═══ STRONA 1 — Art. 1: Normy jakościowe i produkcyjne ═════

#v(14pt)

#text(font: f-display, size: 26pt, fill: c-text)[Warunki techniczne]
#linebreak()
#text(font: f-display, size: 26pt, fill: c-accent-l)[i gwarancyjne]

#v(8pt)
#box(width: 155mm)[
  #text(font: f-body, size: 9.5pt, fill: c-text-2)[
    Wszystko, co warto wiedzieć o parametrach naszych frontów, standardach oceny
    jakości, prawidłowej pielęgnacji laminatu oraz zasadach gwarancji i reklamacji.
  ]
]

#v(13pt)

#section-h("Art. 1 · Normy jakościowe i produkcyjne", [Parametry techniczne i stabilność konstrukcji])

#v(9pt)

#let stat-card(value, title, desc) = card(inset: 12pt, radius: 9pt)[
  #grid(
    columns: (auto, 1fr),
    column-gutter: 12pt,
    align: (left + horizon, left + horizon),
    box(
      inset: (x: 10pt, y: 7pt),
      fill: c-bg-2, radius: 7pt,
      align(center + horizon, text(font: f-display, size: 15pt, fill: c-accent)[#value]),
    ),
    text(font: f-heading, weight: 600, size: 10pt, fill: c-text)[#title],
  )
  #v(7pt)
  #text(font: f-body, size: 8pt, fill: c-text-2)[#desc]
]

#grid(
  columns: (1fr, 1fr),
  gutter: 8pt,
  stat-card(
    [±1 mm], [Krzywizna frontu],
    [Standardowa dopuszczalna krzywizna (strzałka ugięcia) frontu o wysokości poniżej 800 mm.],
  ),
  stat-card(
    [±1 mm], [Tolerancja wymiarowa],
    [Margines tolerancji szerokości i wysokości gotowego produktu.],
  ),
  stat-card(
    [Klej PUR], [Oklejanie krawędzi],
    [Wszystkie produkty oklejane są wilgocioodpornym klejem poliuretanowym PUR.],
  ),
  stat-card(
    [> 800 mm], [Fronty wysokie],
    [Powyżej 800 mm wysokości (i 600 mm szerokości) wymagane są okucia napinające lub zwiększona liczba zawiasów — konstrukcja ramkowa z płyty nie gwarantuje wtedy pełnej sztywności elementu.],
  ),
)

#v(8pt)

// ── Wybarwienie i estetyka ──
#card(inset: 13pt, radius: 10pt)[
  #text(font: f-heading, weight: 600, size: 10.5pt, fill: c-text)[Specyfika wybarwienia i estetyki]
  #v(5pt)
  #text(font: f-body, size: 8.2pt, fill: c-text-2)[
    Laminowanie to proces technologiczny, który dopuszcza pewne naturalne odchylenia.
    Nabywca przyjmuje do wiadomości, że:
  ]
  #v(7pt)
  #stack(
    spacing: 6pt,
    info-item[Możliwe są rozbieżności między próbnikiem lub wzornikiem a produktem finalnym.],
    info-item[Naturalne są różnice w połyskliwości i teksturze między powierzchnią płyty a materiałem użytym do produkcji ramek wykończeniowych.],
    info-item[Ewentualne rozbieżności kolorystyczne w obrębie tej samej grupy dekorów są cechą technologiczną procesu laminowania i nie stanowią podstawy do roszczeń.],
  )
]

#v(7pt)

// ── Standardy oceny jakościowej ──
#card(inset: 12pt, radius: 10pt)[
  #text(font: f-heading, weight: 600, size: 10.5pt, fill: c-text)[Standardy oceny jakościowej]
  #v(7pt)
  #grid(
    columns: (1fr, 1fr),
    column-gutter: 16pt,
    row-gutter: 9pt,
    [
      #text(font: f-heading, weight: 600, size: 6.8pt, fill: c-accent, tracking: 1.4pt)[NORMA]
      #v(3.5pt)
      #text(font: f-body, size: 7.9pt, fill: c-text-2)[
        Dopuszczalność mikrowad powierzchniowych (punktowych) na laminacie określa
        norma DIN EN 14323 — warunki oświetleniowe 800–1000 luksów.
      ]
    ],
    [
      #text(font: f-heading, weight: 600, size: 6.8pt, fill: c-accent, tracking: 1.4pt)[POZYCJA]
      #v(3.5pt)
      #text(font: f-body, size: 7.9pt, fill: c-text-2)[
        Element oceniany jest w pozycji docelowej (pionowej lub poziomej),
        przy rozproszonym świetle dziennym.
      ]
    ],
    [
      #text(font: f-heading, weight: 600, size: 6.8pt, fill: c-accent, tracking: 1.4pt)[METODA]
      #v(3.5pt)
      #text(font: f-body, size: 7.9pt, fill: c-text-2)[
        Obserwacja z odległości od 0,5 m do 1,0 m — zgodnie z wewnętrznym standardem
        jakościowym bazującym na wytycznych PN-F-06001-3.
      ]
    ],
    [
      #text(font: f-heading, weight: 600, size: 6.8pt, fill: c-accent, tracking: 1.4pt)[KRYTERIUM]
      #v(3.5pt)
      #text(font: f-body, size: 7.9pt, fill: c-text-2)[
        Za wadę uznaje się jedynie defekty widoczne dla nieuzbrojonego oka w powyższych
        warunkach. Zmiana kąta patrzenia przy nieruchomym elemencie jest dopuszczalna,
        aby rzetelnie ocenić strukturę powierzchni.
      ]
    ],
  )
]

#pagebreak()

// ═══ STRONA 2 — Art. 2: Eksploatacja i pielęgnacja ═════════

#v(22pt)

#section-h("Art. 2 · Eksploatacja i pielęgnacja", [Jak dbać o fronty laminowane?], size: 22pt)

#v(8pt)
#box(width: 130mm)[
  #text(font: f-body, size: 8.8pt, fill: c-text-2)[
    W przypadku płyt laminowanych z ramkami kluczowe jest unikanie nadmiaru wilgoci
    w miejscach łączeń. Poza tym pielęgnacja jest prosta — wystarczy trzymać się kilku zasad.
  ]
]

#v(12pt)

#grid(
  columns: (1fr, 1fr),
  column-gutter: 10pt,
  align: top,
  // ── Zalecamy ──
  card(inset: 15pt, radius: 10pt)[
    #grid(
      columns: (auto, 1fr), column-gutter: 8pt, align: (center + horizon, left + horizon),
      box(
        width: 16pt, height: 16pt, fill: c-bg-3, radius: 5pt,
        align(center + horizon, text(size: 8.5pt, fill: c-accent, weight: 700, sym.checkmark)),
      ),
      text(font: f-heading, weight: 600, size: 11pt, fill: c-text)[Zalecamy],
    )
    #v(11pt)
    #stack(
      spacing: 9pt,
      check-item[Do codziennego czyszczenia używaj miękkich, bezszwowych ściereczek z mikrowłókna.],
      check-item[Najbezpieczniejszy środek do codziennego użytku to słaby roztwór wody z mydłem (stężenie ok. 1%).],
      check-item[Stosuj zasadę „suchej krawędzi”: po czyszczeniu na mokro niezwłocznie wytrzyj front do sucha, ze szczególnym uwzględnieniem szczelin przy nakładanych ramkach — zapobiega to pęcznieniu płyty.],
      check-item[Powierzchnie połyskowe: do odświeżenia blasku i ochrony przed odciskami palców stosuj dedykowane mleczka polimerowe — tworzą warstwę antystatyczną.],
      check-item[Powierzchnie matowe: używaj środków dedykowanych do matu, które nie nabłyszczają powierzchni i wspomagają powłokę Anti-Fingerprint.],
      check-item[Trudne zabrudzenia: do usuwania resztek kleju lub tłuszczu używaj profesjonalnych środków czyszcząco-odkażających — zawsze po próbie w niewidocznym miejscu.],
      check-item[Czyszczenie gruntowne: uporczywy osad na frontach matowych usuwaj preparatem intensywnym — niewielką ilość nanieś na wilgotną mikrofibrę, delikatnie przetrzyj bez szorowania, zmyj czystą wodą i wytrzyj do sucha. Nie stosuj do codziennej pielęgnacji.],
    )
  ],
  // ── Zakazy ──
  card(inset: 15pt, radius: 10pt)[
    #grid(
      columns: (auto, 1fr), column-gutter: 8pt, align: (center + horizon, left + horizon),
      box(
        width: 16pt, height: 16pt, fill: c-bg-3, radius: 5pt,
        align(center + horizon, text(size: 8.5pt, fill: c-muted, weight: 700, sym.times)),
      ),
      text(font: f-heading, weight: 600, size: 11pt, fill: c-text)[Czego unikać? (zakazy gwarancyjne)],
    )
    #v(11pt)
    #stack(
      spacing: 9pt,
      cross-item[Podczas rozpakowywania paczek kategorycznie zabrania się używania ostrych noży i narzędzi punktowych — ryzyko przecięcia folii i trwałego uszkodzenia laminatu lub ramy jest wysokie.],
      cross-item[Nie pisz po folii ani bezpośrednio po frontach mazakami, długopisami czy markerami — barwniki mogą trwale wniknąć w strukturę laminatu (szczególnie matowego), powodując nieodwracalne odbarwienia.],
      cross-item[Nie używaj szorstkich gąbek (tzw. druciaków) ani ręczników papierowych — mogą matowić laminat.],
      cross-item[Nie stosuj środków zawierających ścierniwa (mleczka z piaskiem), rozpuszczalników, octu ani silnych kwasów.],
      cross-item[Nie czyść frontów płynami do szyb zawierającymi alkohol — mogą powodować smugi i mikrospękania na ramkach.],
      cross-item[Nie używaj wosków i nabłyszczaczy meblowych nieprzeznaczonych do laminatów — powodują powstawanie tłustych, trudnych do usunięcia warstw.],
    )
  ],
)

#pagebreak()

// ═══ STRONA 3 — Art. 3 i 4: Gwarancja i zwroty ═════════════

#v(22pt)

#section-h("Art. 3 · Warunki gwarancji", [Gwarancja Mekra], size: 22pt)

#v(12pt)

#let g-card(value, title, desc) = card(inset: 14pt, radius: 9pt)[
  #text(font: f-display, size: 15pt, fill: c-accent)[#value]
  #v(5pt)
  #text(font: f-heading, weight: 600, size: 10pt, fill: c-text)[#title]
  #v(4pt)
  #text(font: f-body, size: 8pt, fill: c-text-2)[#desc]
]

#grid(
  columns: (1fr, 1fr),
  gutter: 9pt,
  g-card(
    [2 lata], [Okres gwarancji],
    [Firma Mekra udziela 2-letniej gwarancji na swoje wyroby. Bieg gwarancji rozpoczyna się w dniu wystawienia dokumentu sprzedaży.],
  ),
  g-card(
    [14 dni], [Weryfikacja przy odbiorze],
    [Klient zobowiązany jest sprawdzić towar pod kątem ilości, wymiarów i wad widocznych w ciągu 14 dni od dostawy. Obróbka mechaniczna (wiercenie, cięcie) frontu z wadą jawną oznacza akceptację towaru i utratę prawa do reklamacji w tym zakresie.],
  ),
  g-card(
    [Pisemnie], [Procedura reklamacyjna],
    [Reklamację należy zgłosić pisemnie wraz z dokumentacją zdjęciową. Producent zastrzega sobie prawo do oględzin fizycznych reklamowanego elementu w swojej siedzibie.],
  ),
  g-card(
    [Wartość produktu], [Zakres odpowiedzialności],
    [Odpowiedzialność firmy Mekra ogranicza się do wartości reklamowanego produktu. Producent nie pokrywa kosztów montażu, transportu wtórnego ani przestojów.],
  ),
)

#v(20pt)

#section-h("Art. 4 · Produkty na wymiar i zwroty", [Produkcja na indywidualne zamówienie], size: 22pt)

#v(12pt)

#card(inset: 17pt, radius: 10pt)[
  #text(font: f-body, size: 8.8pt, fill: c-text-2)[
    #strong[Brak możliwości zwrotu:] wszystkie produkty firmy Mekra są wytwarzane
    na indywidualne zamówienie według specyfikacji klienta — towar zunifikowany
    pod konkretny wymiar i kolor.
  ]
  #v(8pt)
  #text(font: f-body, size: 8.8pt, fill: c-text-2)[
    Zgodnie z obowiązującymi przepisami (art. 38 pkt 3 Ustawy o prawach konsumenta),
    #strong[prawo do odstąpienia od umowy zawartej na odległość nie przysługuje]
    w przypadku zamówień dotyczących rzeczy nieprefabrykowanych, wyprodukowanych
    według specyfikacji konsumenta lub służących zaspokojeniu jego
    zindywidualizowanych potrzeb.
  ]
  #v(8pt)
  #text(font: f-body, size: 8.8pt, fill: c-text-2)[
    Masz wątpliwości co do wymiarów lub dekoru? Skontaktuj się z nami przed złożeniem
    zamówienia — doradzimy i pomożemy uniknąć pomyłek.
  ]
]

#v(22pt)

// ── Stopka kontaktowa ──
#card(inset: 18pt, radius: 12pt, fill: c-bg-2)[
  #align(center)[
    #text(font: f-display, size: 16pt, fill: c-text)[Masz pytania? Jesteśmy do dyspozycji]
    #v(10pt)
    #grid(
      columns: 3,
      column-gutter: 26pt,
      align: center,
      stack(
        spacing: 5pt,
        text(font: f-heading, weight: 500, size: 6.5pt, fill: c-muted, tracking: 1.4pt)[TELEFON],
        text(font: f-heading, weight: 600, size: 10.5pt, fill: c-accent)[792 456 094],
      ),
      stack(
        spacing: 5pt,
        text(font: f-heading, weight: 500, size: 6.5pt, fill: c-muted, tracking: 1.4pt)[E-MAIL],
        text(font: f-heading, weight: 600, size: 10.5pt, fill: c-accent)[kontakt\@mekra.pl],
      ),
      stack(
        spacing: 5pt,
        text(font: f-heading, weight: 500, size: 6.5pt, fill: c-muted, tracking: 1.4pt)[WWW],
        text(font: f-heading, weight: 600, size: 10.5pt, fill: c-accent)[www.mekra.pl],
      ),
    )
  ]
]
