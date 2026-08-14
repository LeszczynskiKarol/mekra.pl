# Egger: dla każdego dekoru z cennika pobiera stronę dekoru i wyciąga URL-e
# zdjęć z cdn.egger.com/img/pim (slider: "Cała płyta" / "Dekor" / "Widok 3D").
import json, re, sys, time, urllib.request, urllib.error

sys.stdout.reconfigure(encoding="utf-8")
UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/126 Safari/537.36"
BASE = "https://www.egger.com/pl/meble-i-aranzacja-wnetrz/dekory/"
PIM = re.compile(r"https://cdn\.egger\.com/img/pim/(\d+)/(\d+)/AR_4_3\.webp")

decors = json.load(open("egger_raw.json", encoding="utf-8"))
out, missing = [], []

for i, d in enumerate(decors, 1):
    slug = f"{d['code']}_{d['struct'].replace('ST', '')}"
    url = BASE + slug
    try:
        req = urllib.request.Request(url, headers={"User-Agent": UA, "Accept-Language": "pl"})
        html = urllib.request.urlopen(req, timeout=25).read().decode("utf-8", "replace")
    except Exception as e:
        missing.append({**d, "slug": slug, "err": str(e)[:80]})
        print(f"[{i}/{len(decors)}] {slug} BŁĄD {str(e)[:50]}", flush=True)
        continue

    ids, seen = [], set()
    for m in PIM.finditer(html):
        key = m.group(1) + "/" + m.group(2)
        if key not in seen:
            seen.add(key)
            ids.append(key)
    if not ids:
        missing.append({**d, "slug": slug, "err": "brak pim"})
        print(f"[{i}/{len(decors)}] {slug} BRAK OBRAZKA", flush=True)
        continue

    out.append({**d, "slug": slug,
                "imgBoard": f"https://cdn.egger.com/img/pim/{ids[0]}/AR_4_3.webp?width=768&srcext=png",
                "imgDecor": f"https://cdn.egger.com/img/pim/{ids[min(1, len(ids)-1)]}/AR_4_3.webp?width=768&srcext=png",
                "imgCount": len(ids)})
    if i % 10 == 0:
        print(f"[{i}/{len(decors)}] ok ({len(out)} zebranych)", flush=True)
    time.sleep(0.35)   # nie zajeżdżamy serwera

json.dump(out, open("egger_images.json", "w", encoding="utf-8"), ensure_ascii=False, indent=1)
json.dump(missing, open("egger_missing.json", "w", encoding="utf-8"), ensure_ascii=False, indent=1)
print(f"GOTOWE: {len(out)} z obrazkami, {len(missing)} braków")
