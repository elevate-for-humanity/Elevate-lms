import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();

const scanRoots = [
  'apps/marketing',
  'apps/lms',
  'components',
  'lib',
];

const forbiddenImages = [
  '/images/pages/admin-dashboard-hero.webp',
  'admin-dashboard-hero.webp',
];

const allowedFiles = new Set([
  'apps/admin/app/home/page.tsx',
]);

const extensions = new Set([
  '.ts',
  '.tsx',
  '.js',
  '.jsx',
  '.json',
]);

const failures = [];

function walk(directory) {
  if (!fs.existsSync(directory)) {
    return;
  }

  for (
    const entry
    of fs.readdirSync(directory, {
      withFileTypes: true,
    })
  ) {
    if (
      entry.name === '.next' ||
      entry.name === 'node_modules' ||
      entry.name === '.git'
    ) {
      continue;
    }

    const fullPath =
      path.join(directory, entry.name);

    if (entry.isDirectory()) {
      walk(fullPath);
      continue;
    }

    if (!extensions.has(path.extname(entry.name))) {
      continue;
    }

    const relativePath =
      path.relative(root, fullPath);

    if (allowedFiles.has(relativePath)) {
      continue;
    }

    const source =
      fs.readFileSync(fullPath, 'utf8');

    for (const image of forbiddenImages) {
      if (source.includes(image)) {
        failures.push({
          file: relativePath,
          image,
        });
      }
    }
  }
}

for (const scanRoot of scanRoots) {
  walk(path.join(root, scanRoot));
}

if (failures.length > 0) {
  console.error(
    '\nForbidden placeholder image usage found:\n',
  );

  for (const failure of failures) {
    console.error(
      `- ${failure.file}: ${failure.image}`,
    );
  }

  process.exit(1);
}

console.log(
  'Forbidden placeholder image audit passed.',
);
