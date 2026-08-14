# Forner: ceny z cenników PDF (przepisane ręcznie — PDF-y są tabelami bez warstwy
# do parsowania maszynowego), zdjęcia dekorów ze stron kolekcji na forner.pl.
#
# UWAGA — inny model niż pozostali producenci:
#  * cennik podaje cenę za m² (nie za arkusz),
#  * formaty: Velvet premium 2800×1250 (3,5 m²), reszta 2800×1300 (3,64 m²),
#  * grubość 19 mm, płyta dwustronnie matowa.
import json, re, sys, time, urllib.request

sys.stdout.reconfigure(encoding="utf-8")
UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/126 Safari/537.36"

PAGES = [
    "https://www.forner.pl/matowe-plyty-meblowe/plyty-meblowe-velvet-ultramat/",
    "https://www.forner.pl/oferta/plyty-matowe/ultramatowe-fronty-i-plyty-meblowe-kolekcja-velvet/",
    "https://www.forner.pl/oferta/onyx/",
    "https://www.forner.pl/onyx",
]

# --- cenniki (Cennik-forner-velvet-16.07.2026, Cennik-Forner-Onyx-07.07.2026) ---
AREA_1250, AREA_1300 = 3.5, 3.64   # 2800×1250 i 2800×1300 w m²

VELVET_PREMIUM = [  # 2800×1250, 230 zł/m²
    ("1101", "śnieżny"), ("1201", "kruczy"), ("1302", "antracytowy"), ("1401", "satynowy"),
    ("1402", "taupe"), ("1501", "bordowy"), ("1601", "niebieski"), ("1702", "zielony"),
]
VELVET = [  # 2800×1300, cena per dekor
    ("3404", "macadamia", 230), ("3901", "truflowy", 230), ("3504", "mocha", 230),
    ("3405", "ivory", 230), ("1551", "porcelanowy", 210), ("1648", "biały", 210),
    ("1649", "alpejski", 210), ("2156", "waniliowy", 210), ("4246", "miętowy", 230),
    ("5987", "różowy", 230), ("6220", "błękitny", 230), ("6221", "granatowy", 230),
    ("7322", "czarny", 210), ("7361", "beżowy", 210), ("7393", "kaszmirowy", 210),
    ("7415", "szary", 210), ("7462", "bazaltowy", 210), ("7575", "brązowy", 230),
    ("4258", "algowy", 210), ("5983", "ceglasty", 230), ("6230", "królewski", 230),
    ("7576", "stalowy", 230), ("7574", "popielaty", 210), ("7473", "gołębi", 210),
    ("3701", "butelkowy", 230), ("3501", "pudrowy", 230), ("3301", "stalowoszary", 230),
    ("3401", "latte", 230), ("3502", "marsala", 230), ("3503", "łososiowy", 230),
    ("3602", "jeansowy", 230), ("3603", "kobaltowy", 230), ("3604", "liliowy", 230),
    ("3702", "szałwiowy", 210), ("3703", "oliwkowy", 230), ("3801", "karmelowy", 230),
    ("3803", "ochra", 230), ("3802", "kurkumowy", 230), ("3402", "cappuccino", 230),
    ("3403", "macchiato", 230),
    # 1181 jaśminowy, 1182 kremowy, 1481 owsiany, 1482 lniany — czasowo niedostępne, pominięte
]
ONYX = [  # 2800×1300, 260 zł/m²
    ("2101", "snow white"), ("2201", "jet black"), ("2301", "fog grey"), ("2302", "ash grey"),
    ("2303", "anthracite grey"), ("2304", "graphite grey"), ("2401", "cashmere beige"),
    ("2402", "neutral greige"), ("2403", "caramel beige"), ("2501", "lavender violet"),
    ("2502", "barbie pink"), ("2503", "wine red"), ("2601", "baby blue"), ("2602", "royal blue"),
    ("2701", "forest green"), ("2801", "cream beige"), ("2504", "mocha red"), ("2702", "mint green"),
    ("2901", "cedar brown"), ("2305", "dove grey"), ("2802", "almond beige"),
]

decors = []
for code, name in VELVET_PREMIUM:
    decors.append({"code": code, "name": name.capitalize(), "collection": "Velvet Ultra Matt premium",
                   "struct": "mat", "format": "2800 × 1250", "area": AREA_1250, "priceM2": 230})
for code, name, price in VELVET:
    decors.append({"code": code, "name": name.capitalize(), "collection": "Velvet Ultra Matt",
                   "struct": "mat", "format": "2800 × 1300", "area": AREA_1300, "priceM2": price})
for code, name in ONYX:
    decors.append({"code": code, "name": name.title(), "collection": "Onyx",
                   "struct": "mat onyx", "format": "2800 × 1300", "area": AREA_1300, "priceM2": 260})

for d in decors:
    d["priceSheet"] = round(d["priceM2"] * d["area"], 2)

# --- zdjęcia ze stron kolekcji ---
# Velvet: "1101-sniezny-VELVET-...-600x600.jpg"; Onyx: "2101.png" albo "2305-dove-grey.png"
IMG_SIZED = re.compile(r'https://www\.forner\.pl/wp-content/uploads/(\d{4})(?:-[^" ]*?)?-(\d+)x\2\.(?:jpg|jpeg|png|webp)')
IMG_PLAIN = re.compile(r'https://www\.forner\.pl/wp-content/uploads/(\d{4})(?:-[a-z-]+)?\.(?:jpg|jpeg|png|webp)')
imgs = {}
for url in PAGES:
    try:
        html = urllib.request.urlopen(urllib.request.Request(url, headers={"User-Agent": UA}), timeout=30).read().decode("utf-8", "replace")
    except Exception as e:
        print("pominięto", url, str(e)[:60])
        continue
    before = len(imgs)
    for m in IMG_SIZED.finditer(html):
        code, size = m.group(1), int(m.group(2))
        prev = imgs.get(code)
        # preferujemy wariant najbliższy 600 px (mniejszy plik, wystarczy na miniaturę)
        if not prev or abs(size - 600) < abs(prev[1] - 600):
            imgs[code] = (m.group(0), size)
    for m in IMG_PLAIN.finditer(html):     # oryginały bez sufiksu rozmiaru (kolekcja Onyx)
        imgs.setdefault(m.group(1), (m.group(0), 9999))
    print(f"{url.rstrip('/').split('/')[-1]}: +{len(imgs) - before} kodów (razem {len(imgs)})", flush=True)
    time.sleep(0.3)

hit = 0
for d in decors:
    if d["code"] in imgs:
        d["img"] = imgs[d["code"]][0]
        hit += 1

json.dump(decors, open("forner_raw.json", "w", encoding="utf-8"), ensure_ascii=False, indent=1)
print(f"dekorów: {len(decors)} | ze zdjęciem: {hit} | bez: {[d['code'] for d in decors if 'img' not in d]}")
print("ceny arkusza:", min(d["priceSheet"] for d in decors), "-", max(d["priceSheet"] for d in decors))
