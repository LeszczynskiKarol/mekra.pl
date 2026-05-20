#!/usr/bin/env node
/**
 * Gallery optimizer for mekra.pl
 *
 * Reads raw images from .tmp/drive_raw/<folder>/*.jpg, produces optimized
 * variants in public/img/realizacje/<category>/<slug>.{jpg,webp} plus
 * 800w thumbnails, and writes a manifest at src/data/realizacje.json.
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

/**
 * Mapping: Drive folder name => { category, project, projectSlug }
 * - category: user-facing filter on the gallery (3 top-level groups)
 * - project: tooltip/label shown in lightbox
 * - projectSlug: subfolder under category in public/
 */
const FOLDER_MAP = {
  "FOTO 36 MM KUCHNIA GRUDZIADZ": {
    category: "kuchnie",
    project: "Kuchnia Grudziądz — ramka 36 mm",
    projectSlug: "kuchnia-grudziadz-36mm",
  },
  "RAMKA 18 RUBINOVA": {
    category: "kuchnie",
    project: "Kuchnia Rubinova — ramka 18 mm",
    projectSlug: "kuchnia-rubinova-18mm",
  },
  "FOTO 7 MM BRAK ZDJEC": {
    category: "kuchnie",
    project: "Kuchnia — ramka 7 mm",
    projectSlug: "kuchnia-7mm",
  },
  "SZAFA 60 MM": {
    category: "szafy",
    project: "Szafa — ramka 60 mm",
    projectSlug: "szafa-60mm",
  },
  "Szafa 60 MM z witrynką": {
    category: "szafy",
    project: "Szafa z witrynką — ramka 60 mm",
    projectSlug: "szafa-60mm-witrynka",
  },
  "SZAFY 60 MM LUSTRA RAMIAK ŻWIRKI": {
    category: "szafy",
    project: "Szafy z lustrami — ramiak Żwirki",
    projectSlug: "szafy-60mm-lustra-zwirki",
  },
  "MEBEL NA WINO": {
    category: "zabudowy",
    project: "Zabudowa na wino",
    projectSlug: "mebel-na-wino",
  },
};

const CATEGORY_META = {
  kuchnie: {
    title: "Kuchnie",
    description:
      "Fronty ramiakowe w kuchniach na wymiar — od klasycznych białych po nowoczesne rubinowe.",
  },
  szafy: {
    title: "Szafy",
    description:
      "Szafy ramiakowe z witrynami i lustrami — funkcjonalne zabudowy do garderoby i przedpokoju.",
  },
  zabudowy: {
    title: "Zabudowy specjalne",
    description:
      "Zabudowy nietypowe — winiarnie, regały, meble pod konkretne pomieszczenie.",
  },
};

// Output settings
const FULL_WIDTH = 1920;
const THUMB_WIDTH = 800;
const JPEG_QUALITY = 85;
const WEBP_QUALITY = 80;

/** Strip diacritics + lowercase + dashify for safe URLs. */
function slugify(s) {
  return s
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/ł/gi, "l")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-");
}

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

  // Full size (cap at 1920w if larger; otherwise keep)
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

  // Thumb
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

  // Re-read final dimensions for srcset
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

  // Clean out old optimized output to avoid stale files
  await fs.rm(OUT_DIR, { recursive: true, force: true });
  await ensureDir(OUT_DIR);

  const folders = await fs.readdir(RAW_DIR, { withFileTypes: true });
  const items = [];

  for (const dirent of folders) {
    if (!dirent.isDirectory()) continue;
    const folderName = dirent.name;
    const mapping = FOLDER_MAP[folderName];
    if (!mapping) {
      console.warn(`! Skipping unmapped folder: ${folderName}`);
      continue;
    }
    const { category, project, projectSlug } = mapping;
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

  // Build manifest
  const manifest = {
    generatedAt: new Date().toISOString(),
    counts: {},
    categories: Object.fromEntries(
      Object.entries(CATEGORY_META).map(([slug, meta]) => [
        slug,
        {
          slug,
          ...meta,
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
