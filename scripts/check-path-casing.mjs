import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';

const roots = [
  'apps',
  'app-legacy',
  'components',
  'lib',
  'packages',
];

const collisions = [];

function scan(directory) {
  if (!fs.existsSync(directory)) {
    return;
  }

  const entries = fs.readdirSync(directory, { withFileTypes: true });

  const names = new Map();

  for (const entry of entries) {
    const normalized = entry.name.toLowerCase();
    const existing = names.get(normalized);

    if (existing && existing !== entry.name) {
      collisions.push({
        directory,
        first: existing,
        second: entry.name,
      });
    } else {
      names.set(normalized, entry.name);
    }

    if (
      entry.isDirectory() &&
      entry.name !== 'node_modules' &&
      entry.name !== '.next' &&
      entry.name !== '.git'
    ) {
      scan(path.join(directory, entry.name));
    }
  }
}

for (const root of roots) {
  scan(root);
}

if (collisions.length > 0) {
  console.error('Case-insensitive path collisions found:\n');

  for (const collision of collisions) {
    console.error(
      `${collision.directory}: ` +
      `${collision.first} conflicts with ${collision.second}`
    );
  }

  process.exit(1);
}

console.log('No case-insensitive path collisions found.');
