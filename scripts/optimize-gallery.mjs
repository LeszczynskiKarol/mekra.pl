#!/usr/bin/env node
/**
 * Gallery optimizer for mekra.pl
 *
 * Reads raw images from .tmp/drive_raw/<folder>/*.jpg, produces optimized
 * variants in public/img/realizacje/<category>/<slug>.{jpg,webp} plus
 * 800w thumbnails, and writes a manifest at src/data/realizacje.json.
 *
 * Categories mirror the offer in Products.astro (frame sizes 7/18/36/60 mm
 * plus "zabudowy specjalne" for one-offs).
 *
 * Run:  node scripts/optimize-gallery.mjs
 */

import { promises as fs } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const RAW_DIR = path.join(ROOT, ".tmp", "drive_raw");
const OUT_DIR = path.join(ROOT, "public", "img", "realizacje");
const MANIFEST = path.join(ROOT, "src", "data", "realizacje.json");

const FOLDER_MAP = {
  "FOTO 7 MM BRAK ZDJEC": {
    category: "ramka-7mm",
    project: "Front z ramką 7 mm",
    projectSlug: "ramka-7mm",
  },
  "RAMKA 18 RUBINOVA": {
    category: "ramka-18mm",
    project: "Kuchnia Rubinova — ramka 18 mm",
    projectSlug: "ramka-18mm-rubinova",
  },
  "FOTO 36 MM KUCHNIA GRUDZIADZ": {
    category: "ramka-36mm",
    project: "Kuchnia Grudziądz — ramka 36 mm",
    projectSlug: "ramka-36mm-grudziadz",
  },
  "SZAFA 60 MM": {
    category: "ramka-60mm",
    project: "Szafa — ramka 60 mm",
    projectSlug: "ramka-60mm-szafa",
  },
  "Szafa 60 MM z witrynką": {
    category: "ramka-60mm",
    project: "Szafa z witrynką — ramka 60 mm",
    projectSlug: "ramka-60mm-witrynka",
  },
  "SZAFY 60 MM LUSTRA RAMIAK ŻWIRKI": {
    category: "ramka-60mm",
    project: "Szafy z lustrami — ramka 60 mm",
    projectSlug: "ramka-60mm-lustra",
  },
  "MEBEL NA WINO": {
    category: "zabudowy",
    project: "Zabudowa na wino",
    projectSlug: "zabudowa-wino",
  },
};

/**
 * Order matters: filter / bento display order. Mirrors the offer (7 → 18 → 36 → 60),
 * with "zabudowy specjalne" pinned at the end.
 */
const CATEGORY_META = {
  "ramka-7mm": {
    title: "Ramka 7 mm",
    subtitle: "Nowoczesna linia",
    description:
      "Delikatne podkreślenie formy. Minimalistyczna ramka — duch skandynawski i loftowy.",
  },
  "ramka-18mm": {
    title: "Ramka 18 mm",
    subtitle: "Współczesna elegancja",
    description:
      "Nowoczesna forma z wyraźniejszym akcentem. Uniwersalny wybór do kuchni i zabudów.",
  },
  "ramka-36mm": {
    title: "Ramka 36 mm",
    subtitle: "Klasyczny szyk",
    description:
      "Farmhouse, skandynawski, prowansalski. Szersza ramka — charakter i przytulność klasycznych wnętrz.",
  },
  "ramka-60mm": {
    title: "Ramka 60 mm",
    subtitle: "Pełna klasyka",
    description:
      "Standardowa klasyczna forma. Możliwość wpuszczenia lustra lub szkła w środek ramki.",
  },
  zabudowy: {
    title: "Zabudowy specjalne",
    subtitle: "Mebel na wino",
    description:
      "Zabudowy nietypowe — winiarnie, regały, meble pod konkretne pomieszczenie.",
  },
};

// Output settings
const FULL_WIDTH = 1920;
const THUMB_WIDTH = 800;
const JPEG_QUALITY = 85;
const WEBP_QUALITY = 80;

async function ensureDir(p) {
  await fs.mkdir(p, { recursive: true });
}

async function processImage(src, projectSlug, baseSlug, categorySlug, index) {
  const categoryDir = path.join(OUT_DIR, categorySlug);
  await ensureDir(categoryDir);

  const slug = `${projectSlug}-${String(index).padStart(2, "0")}`;
  const fullJpg = path.join(categoryDir, `${slug}.jpg`);
  const fullWebp = path.join(categoryDir, `${slug}.webp`);
  const thumbJpg = path.join(categoryDir, `${slug}-800.jpg`);
  const thumbWebp = path.join(categoryDir, `${slug}-800.webp`);

  const image = sharp(src, { failOn: "none" }).rotate(); // honor EXIF orientation
  const meta = await image.metadata();

  const fullPipeline = image.clone();
  if ((meta.width ?? 0) > FULL_WIDTH) {
    fullPipeline.resize({ width: FULL_WIDTH, withoutEnlargement: true });
  }
  await fullPipeline
    .clone()
    .jpeg({ quality: JPEG_QUALITY, mozjpeg: true, progressive: true })
    .toFile(fullJpg);
  await fullPipeline
    .clone()
    .webp({ quality: WEBP_QUALITY })
    .toFile(fullWebp);

  const thumbPipeline = image.clone().resize({
    width: THUMB_WIDTH,
    withoutEnlargement: true,
  });
  await thumbPipeline
    .clone()
    .jpeg({ quality: JPEG_QUALITY, mozjpeg: true, progressive: true })
    .toFile(thumbJpg);
  await thumbPipeline
    .clone()
    .webp({ quality: WEBP_QUALITY })
    .toFile(thumbWebp);

  const finalMeta = await sharp(fullJpg).metadata();
  const thumbMeta = await sharp(thumbJpg).metadata();
  const fullStats = await fs.stat(fullJpg);
  const thumbStats = await fs.stat(thumbJpg);

  return {
    slug,
    width: finalMeta.width,
    height: finalMeta.height,
    thumbWidth: thumbMeta.width,
    thumbHeight: thumbMeta.height,
    fullJpgKb: Math.round(fullStats.size / 1024),
    thumbJpgKb: Math.round(thumbStats.size / 1024),
    paths: {
      full: `/img/realizacje/${categorySlug}/${slug}.jpg`,
      fullWebp: `/img/realizacje/${categorySlug}/${slug}.webp`,
      thumb: `/img/realizacje/${categorySlug}/${slug}-800.jpg`,
      thumbWebp: `/img/realizacje/${categorySlug}/${slug}-800.webp`,
    },
  };
}

async function main() {
  const t0 = Date.now();
  await ensureDir(path.dirname(MANIFEST));

  await fs.rm(OUT_DIR, { recursive: true, force: true });
  await ensureDir(OUT_DIR);

  const folders = await fs.readdir(RAW_DIR, { withFileTypes: true });
  const items = [];

  // Process in category order (so items[] is grouped by category like the filters)
  const orderedCategorySlugs = Object.keys(CATEGORY_META);
  const folderEntries = folders
    .filter((d) => d.isDirectory() && FOLDER_MAP[d.name])
    .map((d) => ({ name: d.name, ...FOLDER_MAP[d.name] }))
    .sort((a, b) => {
      const ai = orderedCategorySlugs.indexOf(a.category);
      const bi = orderedCategorySlugs.indexOf(b.category);
      if (ai !== bi) return ai - bi;
      return a.name.localeCompare(b.name);
    });

  for (const folder of folderEntries) {
    const { name: folderName, category, project, projectSlug } = folder;
    const folderPath = path.join(RAW_DIR, folderName);
    const files = (await fs.readdir(folderPath))
      .filter((f) => /\.(jpe?g|png)$/i.test(f))
      .sort();

    console.log(`\n== ${folderName} (${files.length} files) -> ${category}`);

    let i = 1;
    for (const file of files) {
      const src = path.join(folderPath, file);
      process.stdout.write(`  [${i}/${files.length}] ${file} ... `);
      try {
        const result = await processImage(src, projectSlug, file, category, i);
        items.push({
          id: result.slug,
          category,
          project,
          projectSlug,
          alt: `${project} — realizacja Mekra`,
          ...result,
        });
        console.log(
          `${result.width}x${result.height}, ${result.fullJpgKb}KB jpg`,
        );
      } catch (err) {
        console.log(`FAIL: ${err.message}`);
      }
      i++;
    }
  }

  const manifest = {
    generatedAt: new Date().toISOString(),
    counts: {},
    categories: Object.fromEntries(
      orderedCategorySlugs.map((slug) => [
        slug,
        {
          slug,
          ...CATEGORY_META[slug],
          count: items.filter((x) => x.category === slug).length,
        },
      ]),
    ),
    items,
  };
  manifest.counts = {
    total: items.length,
    ...Object.fromEntries(
      Object.entries(manifest.categories).map(([k, v]) => [k, v.count]),
    ),
  };

  await fs.writeFile(MANIFEST, JSON.stringify(manifest, null, 2), "utf8");

  const dt = ((Date.now() - t0) / 1000).toFixed(1);
  console.log(`\n✅ Done in ${dt}s — ${items.length} images optimized.`);
  console.log(`   Manifest: ${MANIFEST}`);
  console.log(`   Output:   ${OUT_DIR}`);
}

main().catch((err) => {
  console.error("FATAL:", err);
  process.exit(1);
});
