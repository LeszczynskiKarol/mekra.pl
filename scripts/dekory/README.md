# Katalog dekorów do kreatora zamówień

Zasila `src/data/dekory.json` (katalog na stronie), `public/dekory/**` (miniatury)
oraz `aws-lambdas/contact-form/dekory-prices.json` (ceny do walidacji po stronie serwera).

**Stan na 2026-08-14: 568 dekorów** — Egger 150, Swiss Krono 170, Kronospan 179, Forner 69.
Ceny są **netto za arkusz**; powierzchnia arkusza jest zapisana per dekor (`a`), bo Forner
tnie mniejsze formaty niż reszta.

## Skąd pochodzą dane

| Producent | Ceny | Arkusz | Zdjęcia |
|---|---|---|---|
| Egger | `D:\katalog-wzornikow\EGGER cennik dla DWORAKOWSKI *.xlsx` (dealerskie) | 2800 × 2070 (5,8 m²) | strony dekorów na egger.com (`cdn.egger.com/img/pim`) |
| Swiss Krono | `D:\katalog-wzornikow\PŁYTY LAMINOWANE SWISS KRONO cennik *.xlsx` (dealerskie) | 2800 × 2070 (5,8 m²) | próbki ze `sklep.swisskrono.pl` (WP REST API) |
| Kronospan | listing `kronosfera.pl` — **ceny detaliczne**, nie dealerskie | 2800 × 2070 (5,8 m²) | miniatury z kronosfera.pl |
| Forner | `Cennik-forner-velvet-*.pdf` + `Cennik-Forner-Onyx-*.pdf` — **ceny za m²**, przeliczane na arkusz | 2800 × 1250 (3,5 m²) i 2800 × 1300 (3,64 m²) | strony kolekcji Velvet i Onyx na forner.pl |

Cenniki Fornera to tabele w PDF — pozycje są przepisane wprost do `scrape_forner.py`
(kod, nazwa, cena za m²). Przy nowym cenniku zaktualizuj listy w tym pliku.
Cztery dekory Velvet oznaczone w cenniku `**` (czasowo niedostępne) są pominięte.

## Logotypy producentów

`public/logo-producenci/*.png` — wysokość 64 px, przezroczyste tło, oryginały w `logo/`.
Na stronie sprowadzane do jednej barwy filtrem CSS (`brightness(0)`, w dark mode + `invert(1)`),
więc kolory źródłowe nie mają znaczenia — liczy się kanał alfa. Logo Eggera jest przycięte
do samego znaku słownego (claim „MORE FROM WOOD" w 26 px był nieczytelny).

> Ceny Kronospanu są cenami „z ulicy" — po zdobyciu cennika dealerskiego podmień
> źródło w `build_manifest.py`, resztę procesu zostaw bez zmian.

## Jak zaktualizować cennik

Uruchamiać z tego katalogu (Python 3 + openpyxl, Node z `sharp` z repo):

```bash
python parse_cenniki.py        # XLSX  -> egger_raw.json, swisskrono_raw.json
python scrape_egger.py         # ~2 min, pobiera stronę każdego dekoru Eggera
python scrape_swisskrono.py    # mapuje kody na zdjęcia próbek ze sklepu
python scrape_kronosfera.py    # listing Kronospanu (ceny + zdjęcia)
python scrape_forner.py        # ceny z PDF (wpisane w skrypcie) + zdjęcia z forner.pl
python build_manifest.py       # scala wszystko -> manifest.json
node download_images.mjs       # pobiera i skaluje miniatury -> public/dekory (pomija istniejące)
```

Na końcu wygeneruj pliki wynikowe (patrz commit z 14.08.2026):
`src/data/dekory.json` oraz `aws-lambdas/contact-form/dekory-prices.json`
(klucz `producent|kod|struktura` → cena arkusza), a potem `./update-lambdas.sh contact`.

## Uwagi

- Miniatury to 360 × 270 px webp (q76) — całość ok. 3 MB dla 499 dekorów.
- `scrape_egger.py` chodzi z opóźnieniem 0,35 s na żądanie; jeden dekor (U669 ST9)
  ma tylko `original.png`, reszta korzysta z `AR_4_3.webp`.
- Dopasowanie Swiss Krono ignoruje próbki blatów i MDF-u — inaczej dekor dostałby
  zdjęcie innego materiału. 1 dekor (606054 OV) nie ma odpowiednika w sklepie.
- Cena arkusza przysłana przez przeglądarkę jest **ignorowana** przez Lambdę —
  liczy się wyłącznie ta z `dekory-prices.json`.
