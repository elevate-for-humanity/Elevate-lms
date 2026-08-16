import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

const root = process.cwd();

const sourceRoots = ['apps/marketing/app', 'components', 'lib'];

const publicRoots = [path.join(root, 'public'), path.join(root, 'apps/marketing/public')];

const sourceExtensions = new Set(['.ts', '.tsx', '.js', '.jsx', '.json']);

const files = [];

function walk(directory) {
  if (!fs.existsSync(directory)) return;
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    if (entry.name === '.next' || entry.name === 'node_modules' || entry.name === '.git') continue;
    const fullPath = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      walk(fullPath);
    } else if (sourceExtensions.has(path.extname(entry.name))) {
      files.push(fullPath);
    }
  }
}

for (const sourceRoot of sourceRoots) {
  walk(path.join(root, sourceRoot));
}

const references = new Map();

const imagePattern =
  /(?:src|heroImage|image|imageUrl|backgroundImage)\s*[=:]\s*["'`](\/[^"'`]+(?:\.(?:png|jpe?g|webp|avif|gif|svg)))["'`]/gi;

for (const file of files) {
  const source = fs.readFileSync(file, 'utf8');
  for (const match of source.matchAll(imagePattern)) {
    const imagePath = match[1].split('?')[0];
    if (!references.has(imagePath)) references.set(imagePath, new Set());
    references.get(imagePath).add(path.relative(root, file));
  }
}

function resolvePublicImage(imagePath) {
  const relativePath = imagePath.replace(/^\//, '');
  for (const publicRoot of publicRoots) {
    const candidate = path.join(publicRoot, relativePath);
    if (fs.existsSync(candidate)) return candidate;
  }
  return null;
}

const missing = [];
const corrupt = [];
const duplicates = [];
const binaries = new Map();

for (const [imagePath, usages] of references) {
  const resolvedImage = resolvePublicImage(imagePath);
  const uniqueUsages = [...usages].sort();

  if (!resolvedImage) {
    missing.push({ imagePath, usages: uniqueUsages });
  } else {
    const contents = fs.readFileSync(resolvedImage);
    const extension = path.extname(resolvedImage).toLowerCase();
    if (extension !== '.svg' && contents.length < 32) {
      corrupt.push({ imagePath, bytes: contents.length, usages: uniqueUsages });
    }
    const hash = crypto.createHash('sha256').update(contents).digest('hex');
    if (!binaries.has(hash)) binaries.set(hash, []);
    binaries.get(hash).push(imagePath);
  }

  if (uniqueUsages.length >= 3) {
    duplicates.push({ imagePath, usages: uniqueUsages });
  }
}

const duplicateBinaries = [...binaries.values()]
  .map((imagePaths) => [...new Set(imagePaths)].sort())
  .filter((imagePaths) => imagePaths.length > 1)
  .sort((a, b) => b.length - a.length);

console.log('\nMarketing image audit\n');
console.log(`Image references: ${references.size}`);
console.log(`Missing local images: ${missing.length}`);
console.log(`Corrupt or truncated images: ${corrupt.length}`);
console.log(`Images used in 3+ files: ${duplicates.length}`);
console.log(`Duplicate image binaries under different paths: ${duplicateBinaries.length}`);

if (missing.length > 0) {
  console.log('\nMissing image files:\n');
  for (const item of missing) {
    console.log(`- ${item.imagePath}`);
    for (const usage of item.usages) console.log(`  ${usage}`);
  }
}

if (corrupt.length > 0) {
  console.log('\nCorrupt or truncated raster image files (< 32 bytes):\n');
  for (const item of corrupt) {
    console.log(`- ${item.imagePath}: ${item.bytes} bytes`);
    for (const usage of item.usages) console.log(`  ${usage}`);
  }
}

if (duplicateBinaries.length > 0) {
  console.log('\nDuplicate image files (same pixels, different paths):\n');
  for (const imagePaths of duplicateBinaries) {
    console.log(`- ${imagePaths.length} copies`);
    for (const imagePath of imagePaths) console.log(`  ${imagePath}`);
  }
}

if (duplicates.length > 0) {
  console.log('\nFrequently reused images:\n');
  duplicates
    .sort((a, b) => b.usages.length - a.usages.length)
    .forEach((item) => {
      console.log(`- ${item.imagePath}: ${item.usages.length} files`);
      for (const usage of item.usages) console.log(`  ${usage}`);
    });
}

if (missing.length > 0 || corrupt.length > 0) process.exitCode = 1;
