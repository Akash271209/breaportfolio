// Pre-build checks that catch the broken-asset/oversized-image class of bugs
// before they reach production.
import { existsSync, readdirSync, statSync, readFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const publicDir = join(root, "public");
const srcDir = join(root, "src");

const MAX_IMAGE_BYTES = 500 * 1024; // 500KB
let errors = [];
let warnings = [];

function walk(dir, exts) {
  let files = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) files.push(...walk(full, exts));
    else if (exts.some((e) => entry.name.toLowerCase().endsWith(e))) files.push(full);
  }
  return files;
}

// 1. Every /image.ext referenced in src/ must exist in public/
const srcFiles = walk(srcDir, [".jsx", ".js"]);
const refRegex = /["'](\/[a-zA-Z0-9_.\-/]+\.(?:jpg|jpeg|png|svg|webp|gif|ico))["']/g;
for (const file of srcFiles) {
  const content = readFileSync(file, "utf8");
  for (const match of content.matchAll(refRegex)) {
    const assetPath = join(publicDir, match[1]);
    if (!existsSync(assetPath)) {
      errors.push(`Missing asset: ${match[1]} referenced in ${file.replace(root + "/", "")}`);
    }
  }
}

// 2. index.html favicon must exist in public/
const indexHtml = readFileSync(join(root, "index.html"), "utf8");
for (const match of indexHtml.matchAll(/href="(\/[^"]+\.ico)"/g)) {
  if (!existsSync(join(publicDir, match[1]))) {
    errors.push(`Missing favicon: ${match[1]} referenced in index.html but not in public/`);
  }
}

// 3. Flag oversized images in public/
const imageFiles = walk(publicDir, [".jpg", ".jpeg", ".png", ".webp"]);
for (const file of imageFiles) {
  const size = statSync(file).size;
  if (size > MAX_IMAGE_BYTES) {
    warnings.push(
      `Large image: ${file.replace(root + "/", "")} is ${(size / 1024).toFixed(0)}KB (>${MAX_IMAGE_BYTES / 1024}KB) — consider resizing/compressing`
    );
  }
}

for (const w of warnings) console.warn("⚠️  " + w);
for (const e of errors) console.error("✖ " + e);

if (errors.length) {
  console.error(`\nAsset audit failed with ${errors.length} error(s).`);
  process.exit(1);
} else {
  console.log(`✓ Asset audit passed (${warnings.length} warning(s)).`);
}
