# Swiss Krono: zdjęcia dekorów ze sklepu z próbkami (WordPress REST API).
# Produkty mają slug typu "d3025-ow-dab-sonoma-probka-plyty-laminowanej",
# więc mapujemy je na kody z cennika (z tolerancją na prefiks "D" i struktury).
import json, re, sys, time, urllib.request

sys.stdout.reconfigure(encoding="utf-8")
UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/126 Safari/537.36"
API = "https://sklep.swisskrono.pl/wp-json/wp/v2/product?per_page=100&page={page}&_embed=wp:featuredmedia"


def get(url):
    return json.loads(urllib.request.urlopen(
        urllib.request.Request(url, headers={"User-Agent": UA}), timeout=30).read().decode("utf-8"))


products = []
for page in range(1, 12):
    try:
        batch = get(API.format(page=page))
    except Exception as e:
        print("koniec/blad na stronie", page, str(e)[:60])
        break
    if not batch:
        break
    for p in batch:
        media = (p.get("_embedded", {}).get("wp:featuredmedia") or [{}])[0]
        img = media.get("source_url")
        sizes = (media.get("media_details", {}) or {}).get("sizes", {}) or {}
        # preferuj rozmiar ~324px (kwadratowa próbka), fallback: pełny
        for key in ("woocommerce_thumbnail", "medium", "shop_catalog", "thumbnail"):
            if key in sizes and sizes[key].get("source_url"):
                img = sizes[key]["source_url"]
                break
        products.append({
            "slug": p.get("slug", ""),
            "title": re.sub(r"<[^>]+>", "", (p.get("title", {}) or {}).get("rendered", "")),
            "img": img,
        })
    print(f"strona {page}: {len(batch)} produktów (razem {len(products)})", flush=True)
    time.sleep(0.3)

json.dump(products, open("swisskrono_shop.json", "w", encoding="utf-8"), ensure_ascii=False, indent=1)
print("produktów w sklepie:", len(products), "| z obrazkiem:", sum(1 for p in products if p["img"]))

# ---- mapowanie na cennik ----
decors = json.load(open("swisskrono_raw.json", encoding="utf-8"))
STRUCTS = {"sm", "ow", "vl", "pe", "se", "bs", "mx", "ov", "to", "sd", "cl", "cx", "pd", "pr", "wg", "sn", "pv"}


def norm_code(c):
    """U511 / D3025 / 3025 -> 3025 — cennik i sklep różnie prefiksują kody."""
    c = re.sub(r"[^a-z0-9]", "", c.lower())
    return c[1:] if c[:1] in ("d", "u") and c[1:].isdigit() else c


# Interesują nas wyłącznie próbki PŁYT LAMINOWANYCH (nie blatów ani MDF-u),
# inaczej dekor dostałby zdjęcie zupełnie innego materiału.
index = {}
for p in sorted(products, key=lambda x: 0 if "probka-plyty-laminowanej" in x["slug"] else 1):
    if not p["img"] or "probka-plyty-laminowanej" not in p["slug"]:
        continue
    toks = p["slug"].split("-")
    if not toks:
        continue
    code = norm_code(toks[0])
    struct = toks[1].lower() if len(toks) > 1 and toks[1].lower() in STRUCTS else None
    index.setdefault((code, struct), p)
    index.setdefault((code, None), p)   # fallback: sam kod, inna struktura

out, missing = [], []
for d in decors:
    key_full = (norm_code(d["code"]), d["struct"].lower())
    hit = index.get(key_full) or index.get((norm_code(d["code"]), None))
    if hit:
        out.append({**d, "img": hit["img"], "matchedSlug": hit["slug"],
                    "exact": key_full in index})
    else:
        missing.append(d)

json.dump(out, open("swisskrono_images.json", "w", encoding="utf-8"), ensure_ascii=False, indent=1)
json.dump(missing, open("swisskrono_missing.json", "w", encoding="utf-8"), ensure_ascii=False, indent=1)
print(f"dopasowano: {len(out)}/{len(decors)} (dokładnie ze strukturą: {sum(1 for o in out if o['exact'])})")
print("brak zdjęcia dla:", [f"{m['code']} {m['struct']}" for m in missing][:25])
