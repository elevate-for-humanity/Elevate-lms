import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();

const sourceRoots = [
  'apps/marketing/app',
  'components',
  'lib',
];

const publicRoots = [
  path.join(root, 'public'),
  path.join(root, 'apps/marketing/public'),
];

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

const imagePattern = /(?:src|heroImage|image|imageUrl|backgroundImage)\s*[=:]\s*["'`](\/[^"'`]+(?:\.(?:png|jpe?g|webp|avif|gif|svg)))["'`]/gi;

for (const file of files) {
  const source = fs.readFileSync(file, 'utf8');
  for (const match of source.matchAll(imagePattern)) {
    const imagePath = match[1].split('?')[0];
    if (!references.has(imagePath)) references.set(imagePath, []);
    references.get(imagePath).push(path.relative(root, file));
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
const duplicates = [];

for (const [imagePath, usages] of references) {
  if (!resolvePublicImage(imagePath)) {
    missing.push({ imagePath, usages });
  }
  if (usages.length >= 3) {
    duplicates.push({ imagePath, usages });
  }
}

console.log('\nMarketing image audit\n');
console.log(`Image references: ${references.size}`);
console.log(`Missing local images: ${missing.length}`);
console.log(`Images used in 3+ files: ${duplicates.length}`);

if (missing.length > 0) {
  console.log('\nMissing image files:\n');
  for (const item of missing) {
    console.log(`- ${item.imagePath}`);
    for (const usage of item.usages) console.log(`  ${usage}`);
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

if (missing.length > 0) process.exitCode = 1;
