// Pobiera zdjęcia dekorów z manifestu i zapisuje jako miniatury webp
// w D:/mekra.pl/public/dekory/<producent>/<kod-struktura>.webp
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { pathToFileURL } from 'node:url';
const { default: sharp } = await import(pathToFileURL('D:/mekra.pl/node_modules/sharp/lib/index.js').href);

const OUT = 'D:/mekra.pl/public/dekory';
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/126 Safari/537.36';
const { decors } = JSON.parse(readFileSync('manifest.json', 'utf8'));

const CONCURRENCY = 8;
let ok = 0, skipped = 0;
const failed = [];

async function handle(d) {
  const target = join(OUT, d.file);
  if (existsSync(target)) { skipped++; return; }
  try {
    const res = await fetch(d.src, { headers: { 'User-Agent': UA }, signal: AbortSignal.timeout(30000) });
    if (!res.ok) throw new Error('HTTP ' + res.status);
    const buf = Buffer.from(await res.arrayBuffer());
    mkdirSync(dirname(target), { recursive: true });
    await sharp(buf)
      .resize(360, 270, { fit: 'cover', position: 'centre' })
      .webp({ quality: 76 })
      .toFile(target);
    ok++;
  } catch (e) {
    failed.push({ ...d, err: String(e).slice(0, 120) });
  }
}

const queue = [...decors];
await Promise.all(Array.from({ length: CONCURRENCY }, async () => {
  while (queue.length) {
    const d = queue.shift();
    await handle(d);
    if ((ok + skipped + failed.length) % 50 === 0) {
      console.log(`  ${ok + skipped + failed.length}/${decors.length} (ok ${ok}, pominięte ${skipped}, błędy ${failed.length})`);
    }
  }
}));

writeFileSync('images_failed.json', JSON.stringify(failed, null, 1));
console.log(`GOTOWE: zapisane ${ok}, pominięte ${skipped}, błędy ${failed.length}`);
if (failed.length) console.log(failed.slice(0, 10).map((f) => `${f.producer} ${f.code} ${f.struct}: ${f.err}`).join('\n'));
