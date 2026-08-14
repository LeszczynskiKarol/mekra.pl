# Scala trzy źródła (Egger, Swiss Krono, Kronospan) w jeden manifest dekorów:
# kod, struktura, nazwa, rodzina (do filtrów), cena arkusza netto, URL zdjęcia.
import json, re, sys, unicodedata

sys.stdout.reconfigure(encoding="utf-8")

# Egger, Swiss Krono i Kronospan: arkusz 2800 x 2070 mm = 5,796 m².
# Forner ma własne formaty (2800×1250 i 2800×1300) — stąd pole `area` per dekor.
SHEET = {"format": "2800 × 2070", "area": 5.8}

FAMILY_RULES = [
    ("drewno", r"d[ąa]b|orzech|jesion|buk|brzoza|klon|sosna|akacja|hikor|wi[śs]nia|olcha|grusza|kaszt|modrzew|limba|jab[łl]o|czere[śs]nia|palis|te[ck]|drewno|eukaliptus|coco bolo|bambus|cedr|wi[ąa]z|topola|świerk|swierk|merbau|zebrano|makassar|nussbaum|thermo|craft|halifax|sonoma|artisan|majalis|adagio|furioso|delicato|rita|traviata|nabucco|figaro|carmen|tosca"),
    ("kamień", r"marmur|granit|beton|kamie[ńn]|onyx|onyks|s[łl]ate|[łl]upek|ceramik|terrazzo|travert|cement|piaskow|calcite|gres"),
    ("metal", r"aluminium|stal|metal|inox|miedź|miedz|mosi[ąa]dz|rdza|corten|patyna|chrom"),
    ("tkanina", r"len|tkanin|textil|jeans|denim|filc|welur|skóra|skora|rattan|plecion|juta"),
]


def strip_pl(s):
    return "".join(c for c in unicodedata.normalize("NFD", s.lower()) if unicodedata.category(c) != "Mn")


def family(name, category=""):
    hay = strip_pl(f"{name} {category}")
    for fam, pat in FAMILY_RULES:
        if re.search(strip_pl(pat), hay):
            return fam
    return "jednolite"


def slug(code, struct):
    return re.sub(r"[^a-z0-9]+", "-", f"{code} {struct}".lower()).strip("-")


out = []

# ---- EGGER ----
for d in json.load(open("egger_images.json", encoding="utf-8")):
    out.append({
        "producer": "egger", "code": d["code"], "struct": d["struct"], "name": d["name"],
        "category": d["category"], "family": family(d["name"], d["category"]),
        "priceSheet": d["priceSheet"], "area": SHEET["area"], "format": SHEET["format"],
        "new": d.get("new", False),
        "src": d["imgDecor"], "file": f"egger/{slug(d['code'], d['struct'])}.webp",
    })

# ---- FORNER (ceny za m², własne formaty arkusza) ----
for d in json.load(open("forner_raw.json", encoding="utf-8")):
    out.append({
        "producer": "forner", "code": d["code"], "struct": d["struct"], "name": d["name"],
        "category": d["collection"], "family": "jednolite",   # cała oferta to gładkie maty
        "priceSheet": d["priceSheet"], "area": d["area"], "format": d["format"],
        "new": False,
        "src": d["img"], "file": f"forner/{slug(d['code'], d['struct'])}.webp",
    })

# ---- SWISS KRONO ----
for d in json.load(open("swisskrono_images.json", encoding="utf-8")):
    name = d["name"].strip()
    out.append({
        "producer": "swiss-krono", "code": d["code"], "struct": d["struct"],
        "name": name[:1].upper() + name[1:], "category": "",
        "family": family(name), "priceSheet": d["priceSheet"],
        "area": SHEET["area"], "format": SHEET["format"], "new": d.get("new", False),
        "src": d["img"], "file": f"swiss-krono/{slug(d['code'], d['struct'])}.webp",
    })

# ---- KRONOSPAN (tylko 18 mm) ----
for d in json.load(open("kronospan_raw.json", encoding="utf-8")):
    if not re.search(r"grubosc-mm-18", d.get("url") or ""):
        continue
    out.append({
        "producer": "kronospan", "code": d["code"], "struct": d["struct"], "name": d["name"],
        "category": d["category"], "family": family(d["name"], d["category"]),
        "priceSheet": d["priceSheet"], "area": SHEET["area"], "format": SHEET["format"],
        "new": False,
        "src": d["img"], "file": f"kronospan/{slug(d['code'], d['struct'])}.webp",
    })

# deduplikacja po (producent, kod, struktura)
seen, dedup = set(), []
for d in out:
    k = (d["producer"], d["code"].lower(), d["struct"].lower())
    if k in seen:
        continue
    seen.add(k)
    dedup.append(d)

json.dump({"sheet": SHEET, "decors": dedup}, open("manifest.json", "w", encoding="utf-8"),
          ensure_ascii=False, indent=1)

import collections
print("razem dekorów:", len(dedup))
print("per producent:", dict(collections.Counter(d["producer"] for d in dedup)))
print("rodziny:", dict(collections.Counter(d["family"] for d in dedup)))
for p in ("egger", "swiss-krono", "kronospan", "forner"):
    rows = [d for d in dedup if d["producer"] == p]
    if not rows:
        continue
    pr = [d["priceSheet"] for d in rows]
    m2 = [d["priceSheet"] / d["area"] for d in rows]
    print(f"  {p}: arkusz {min(pr):.2f}–{max(pr):.2f} zł | za m² {min(m2):.2f}–{max(m2):.2f} zł")
