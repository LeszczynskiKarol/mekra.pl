# Parsowanie cenników XLSX (Egger + Swiss Krono) -> JSON.
# Scalone komórki (grupa cenowa, cena per grupa) rozwijamy forward-fillem.
import json, sys, openpyxl

sys.stdout.reconfigure(encoding="utf-8")
SRC = "D:/katalog-wzornikow/"


def unmerge_values(ws):
    """Zwraca macierz wartości z rozwiniętymi scalonymi komórkami."""
    grid = [[c.value for c in row] for row in ws.iter_rows()]
    for rng in ws.merged_cells.ranges:
        v = ws.cell(rng.min_row, rng.min_col).value
        for r in range(rng.min_row, rng.max_row + 1):
            for c in range(rng.min_col, rng.max_col + 1):
                grid[r - 1][c - 1] = v
    return grid


def s(v):
    return "" if v is None else str(v).strip()


def num(v):
    try:
        return round(float(v), 2)
    except (TypeError, ValueError):
        return None


# ---------------------------------------------------------------- EGGER
# kolumny: A grupa | B kategoria | C dekor | D struktura | E nazwa | F cena/szt
wb = openpyxl.load_workbook(SRC + "EGGER cennik dla DWORAKOWSKI kwiecień 2026.xlsx", data_only=True)
ws = wb["PŁYTY LAMINOWANE"]
egger = []
for row in unmerge_values(ws)[1:]:
    code, struct, name, price = s(row[2]), s(row[3]), s(row[4]), num(row[5])
    if not code or not struct or not price:
        continue
    egger.append({
        "group": s(row[0]),
        "category": s(row[1]),
        "code": code,
        "struct": struct,
        "name": name,
        "priceSheet": price,          # zł netto / arkusz 2800x2070
        "new": "NOWOŚ" in s(row[6]).upper(),
    })

# ----------------------------------------------------------- SWISS KRONO
# kolumny: A grupa | B dekor | C struktura | D nazwa | E cena/m2 | F cena/szt
wb = openpyxl.load_workbook(SRC + "PŁYTY LAMINOWANE SWISS KRONO cennik dla Dworakowski.xlsx", data_only=True)
ws = wb["KOLEKCJA AKTUALNA"]
swiss = []
for row in unmerge_values(ws)[2:]:
    code, struct, name = s(row[1]), s(row[2]), s(row[3])
    m2, sheet = num(row[4]), num(row[5])
    if not code or not struct or not sheet:
        continue
    swiss.append({
        "group": s(row[0]),
        "code": code,
        "struct": struct,
        "name": name,
        "priceM2": m2,
        "priceSheet": sheet,
        "new": "NOWOŚĆ" in s(row[6]).upper(),
    })

for tag, data in (("egger", egger), ("swisskrono", swiss)):
    json.dump(data, open(f"{tag}_raw.json", "w", encoding="utf-8"), ensure_ascii=False, indent=1)
    prices = [d["priceSheet"] for d in data]
    print(f"{tag}: {len(data)} dekorów | cena arkusza {min(prices):.2f}–{max(prices):.2f} zł")
    print("   przykład:", json.dumps(data[0], ensure_ascii=False))
    # ile unikalnych kodów (bez struktury)
    print("   unikalnych kodów:", len({d['code'] for d in data}))
