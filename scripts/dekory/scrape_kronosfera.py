# Kronosfera (Kronospan): listing płyt laminowanych Global Collection.
# Z każdego kafelka: nazwa (kod + struktura + grubość), cena za arkusz
# (datalayer JSON), cena za m2, miniatura.
import json, re, sys, time, urllib.request

sys.stdout.reconfigure(encoding="utf-8")
UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/126 Safari/537.36"
LIST = "https://kronosfera.pl/p/dla-meblarstwa-plyty-meblowe-plyty-laminowane-wiorowe-global-collection,153,{page},default,asc,60"

ITEM = re.compile(r'<div class="products-list-item".*?(?=<div class="products-list-item"|<nav aria-label="Paginacja")', re.S)
DATALAYER = re.compile(r'datalayer-onclick=\'(\{.*?\})\'', re.S)
# miniatura: <img ... loading="lazy" src="...categories-list-image/KOD STR.jpg">
IMG = re.compile(r'<img[^>]*\ssrc="([^"]+/categories-list-image/[^"]+\.(?:jpg|jpeg|png|webp))"')
PRICE_M2 = re.compile(r'products-list-item__price[^>]*>\s*([\d\s,]+)\s*zł/m', re.S)
HREF = re.compile(r'href="(/k/[^"]+)"')
# nazwa: "Płyta meblowa laminowana <Nazwa> <KOD> <STR>" + opcjonalne "(#16 mm)"
PREFIX = re.compile(r'^P[łl]yta meblowa laminowana\s+', re.I)
THICK = re.compile(r'\(#\s*(\d+)\s*mm\)\s*$')

rows = []
for page in range(1, 15):
    url = LIST.format(page=page)
    html = urllib.request.urlopen(urllib.request.Request(url, headers={"User-Agent": UA}), timeout=30).read().decode("utf-8", "replace")
    items = ITEM.findall(html)
    if not items:
        print(f"strona {page}: pusto — koniec")
        break
    for block in items:
        dl = DATALAYER.search(block)
        img = IMG.search(block)
        if not dl:
            continue
        try:
            data = json.loads(dl.group(1))["ecommerce"]["click"]["products"]
        except Exception:
            continue
        full = data.get("name", "")
        mt = THICK.search(full)
        thick = int(mt.group(1)) if mt else None
        label = PREFIX.sub("", THICK.sub("", full)).strip()
        # ostatnie 1-2 tokeny to kod + struktura, np. "Biały Korpusowy 0110 SM"
        toks = label.split()
        struct = toks[-1] if len(toks) > 1 else ""
        code = toks[-2] if len(toks) > 2 else ""
        name = " ".join(toks[:-2]) if len(toks) > 2 else label
        pm2 = PRICE_M2.search(block)
        rows.append({
            "id": data.get("id"),
            "category": data.get("category", ""),
            "code": code, "struct": struct, "name": name,
            "thickness": thick,
            "priceSheet": round(float(data.get("price", 0)), 2),
            "priceM2": float(pm2.group(1).replace(" ", "").replace(",", ".")) if pm2 else None,
            "img": img.group(1) if img else None,
            "url": "https://kronosfera.pl" + HREF.search(block).group(1) if HREF.search(block) else None,
        })
    print(f"strona {page}: {len(items)} kafelków (razem {len(rows)})", flush=True)
    time.sleep(0.4)

json.dump(rows, open("kronospan_raw.json", "w", encoding="utf-8"), ensure_ascii=False, indent=1)
th = {}
for r in rows:
    th[r["thickness"]] = th.get(r["thickness"], 0) + 1
print("GOTOWE:", len(rows), "pozycji | grubości:", th)
print("bez obrazka:", sum(1 for r in rows if not r["img"]))
print("przykład:", json.dumps(rows[0], ensure_ascii=False))
