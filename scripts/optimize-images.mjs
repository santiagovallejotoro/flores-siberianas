#!/usr/bin/env node
// Recompress every PNG/JPG under public/ in place, with conservative quality.
// Originals are backed up to public/_originals/<same-relative-path>/ on first run,
// so you can restore by copying that folder back. Safe to re-run; already-optimized
// files are skipped via a stamp in scripts/_image_optimized.json.
//
// Usage:
//   npm i -D sharp
//   node scripts/optimize-images.mjs            # optimize everything new
//   node scripts/optimize-images.mjs --force    # re-optimize even if stamped
//   node scripts/optimize-images.mjs --dry      # report only, no writes

import { readdir, stat, mkdir, copyFile, readFile, writeFile, rename } from "node:fs/promises";
import { existsSync } from "node:fs";
import { join, relative, dirname, extname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const PUBLIC_DIR = join(ROOT, "public");
const BACKUP_DIR = join(PUBLIC_DIR, "_originals");
const STAMP_FILE = join(__dirname, "_image_optimized.json");

const MAX_WIDTH = 1920;          // hero/about backgrounds and similar large hero art
const MAX_WIDTH_PRODUCT = 1400;  // product photos / cards
const MIN_BYTES = 80 * 1024;     // skip files already under 80 KB
const JPG_QUALITY = 82;
const WEBP_QUALITY = 82;

const args = new Set(process.argv.slice(2));
const DRY = args.has("--dry");
const FORCE = args.has("--force");

let sharp;
try {
  ({ default: sharp } = await import("sharp"));
} catch {
  console.error(
    "\n[optimize-images] sharp is not installed.\n" +
      "  Install it once with:  npm i -D sharp\n" +
      "  Then re-run:           node scripts/optimize-images.mjs\n",
  );
  process.exit(1);
}

const stamp = existsSync(STAMP_FILE)
  ? JSON.parse(await readFile(STAMP_FILE, "utf8"))
  : {};

async function* walk(dir) {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const p = join(dir, entry.name);
    if (entry.isDirectory()) {
      // never descend into the backup directory
      if (p === BACKUP_DIR) continue;
      yield* walk(p);
    } else {
      yield p;
    }
  }
}

function isProductImage(rel) {
  return rel.includes("products") || rel.includes("blog") || rel.includes("testimonials");
}

function targetFor(rel) {
  return isProductImage(rel) ? MAX_WIDTH_PRODUCT : MAX_WIDTH;
}

async function ensureBackup(absPath, rel) {
  const dest = join(BACKUP_DIR, rel);
  if (existsSync(dest)) return;
  await mkdir(dirname(dest), { recursive: true });
  await copyFile(absPath, dest);
}

let totalBefore = 0;
let totalAfter = 0;
let processed = 0;
let skipped = 0;

for await (const file of walk(PUBLIC_DIR)) {
  const ext = extname(file).toLowerCase();
  if (![".png", ".jpg", ".jpeg"].includes(ext)) continue;

  const rel = relative(PUBLIC_DIR, file);
  const st = await stat(file);
  if (st.size < MIN_BYTES) {
    skipped++;
    continue;
  }
  if (!FORCE && stamp[rel] === st.size) {
    skipped++;
    continue;
  }

  const before = st.size;
  totalBefore += before;

  let img = sharp(file, { failOn: "none" });
  const meta = await img.metadata();
  const max = targetFor(rel);
  if (meta.width && meta.width > max) {
    img = img.resize({ width: max, withoutEnlargement: true });
  }

  if (ext === ".png") {
    // Palette + zlib max + adaptive filtering. Keeps alpha if present.
    img = img.png({ compressionLevel: 9, palette: true, quality: 90, effort: 8 });
  } else {
    img = img.jpeg({ quality: JPG_QUALITY, mozjpeg: true });
  }

  const buf = await img.toBuffer();
  if (buf.length >= before) {
    // Re-encoded version isn't smaller; leave the original alone.
    stamp[rel] = before;
    totalAfter += before;
    skipped++;
    continue;
  }

  if (DRY) {
    console.log(
      `[dry] ${rel}  ${(before / 1024).toFixed(0)} KB -> ${(buf.length / 1024).toFixed(0)} KB ` +
        `(-${Math.round((1 - buf.length / before) * 100)}%)`,
    );
    totalAfter += buf.length;
    processed++;
    continue;
  }

  await ensureBackup(file, rel);
  const tmp = file + ".tmp-opt";
  await writeFile(tmp, buf);
  await rename(tmp, file);

  const after = (await stat(file)).size;
  totalAfter += after;
  stamp[rel] = after;
  processed++;
  console.log(
    `${rel}  ${(before / 1024).toFixed(0)} KB -> ${(after / 1024).toFixed(0)} KB ` +
      `(-${Math.round((1 - after / before) * 100)}%)`,
  );
}

if (!DRY) await writeFile(STAMP_FILE, JSON.stringify(stamp, null, 2));

console.log(
  `\nDone. processed=${processed}  skipped=${skipped}  ` +
    `total: ${(totalBefore / 1024 / 1024).toFixed(2)} MB -> ${(totalAfter / 1024 / 1024).toFixed(2)} MB ` +
    `(-${totalBefore ? Math.round((1 - totalAfter / totalBefore) * 100) : 0}%)`,
);
console.log(`Originals backed up under ${relative(ROOT, BACKUP_DIR)}/`);
