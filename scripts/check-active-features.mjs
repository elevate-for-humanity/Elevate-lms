import { readdirSync, readFileSync } from 'fs';
import { join } from 'path';

// Get all tables from archived migrations
const archiveDir = 'supabase/migrations/archive-legacy';
const migrationFiles = readdirSync(archiveDir).filter((f) => f.endsWith('.sql'));

const allTables = new Set();
migrationFiles.forEach((file) => {
  const content = readFileSync(join(archiveDir, file), 'utf8');
  const matches = content.matchAll(/CREATE TABLE (?:IF NOT EXISTS )?([a-z_]+)/gi);
  for (const match of matches) {
    allTables.add(match[1].toLowerCase());
  }
});

// Check which tables are referenced in code
const codeFiles = [];
function scanDir(dir) {
  try {
    const items = readdirSync(dir, { withFileTypes: true });
    for (const item of items) {
      const path = join(dir, item.name);
      if (item.isDirectory()) {
        if (
          !item.name.startsWith('.') &&
          item.name !== 'node_modules' &&
          item.name !== 'archive-legacy'
        ) {
          scanDir(path);
        }
      } else if (item.name.match(/\.(tsx?|jsx?)$/)) {
        codeFiles.push(path);
      }
    }
  } catch (e) {}
}

scanDir('app');
scanDir('lib');
scanDir('utils');

const usedTables = new Map();
const tableArray = Array.from(allTables);

for (const file of codeFiles) {
  const content = readFileSync(file, 'utf8');

  for (const table of tableArray) {
    // Look for .from('table') or .from("table")
    if (content.includes(`.from('${table}')`) || content.includes(`.from("${table}")`)) {
      if (!usedTables.has(table)) {
        usedTables.set(table, []);
      }
      usedTables.get(table).push(file.replace(/^.*\/app\//, 'app/'));
    }
  }
}

// Categorize tables
const categories = {
  active: [],
  unused: [],
};

for (const table of tableArray) {
  if (usedTables.has(table)) {
    categories.active.push({
      table,
      usedIn: usedTables.get(table).length,
      files: usedTables.get(table).slice(0, 3),
    });
  } else {
    categories.unused.push(table);
  }
}

// Sort by usage
categories.active.sort((a, b) => b.usedIn - a.usedIn);

categories.active.slice(0, 30).forEach(({ table, usedIn, files }) => {
  files.forEach((f) => console.log(`      - ${f}`));
});

categories.unused.slice(0, 20).forEach((table) => {});
