import fs from 'node:fs';
import path from 'node:path';

const ROOTS = ['apps/marketing', 'apps/lms', 'components', 'lib'];
const SOURCE_EXTENSIONS = new Set(['.ts', '.tsx', '.md', '.html']);
const repeatedIndianapolisAddress =
  /Indianapolis,\s*IN\s*46220[\s\S]{0,140}?Indianapolis,\s*IN\s*46220/i;

function sourceFiles(root) {
  const files = [];
  for (const entry of fs.readdirSync(root, { withFileTypes: true })) {
    const absolute = path.join(root, entry.name);
    if (entry.isDirectory()) {
      files.push(...sourceFiles(absolute));
    } else if (SOURCE_EXTENSIONS.has(path.extname(entry.name))) {
      files.push(absolute);
    }
  }
  return files;
}

const failures = ROOTS.flatMap((root) => sourceFiles(root)).filter((file) =>
  repeatedIndianapolisAddress.test(fs.readFileSync(file, 'utf8')),
);

if (failures.length) {
  console.error('Repeated Indianapolis address fragments found in public content:');
  for (const file of failures) console.error(`- ${file}`);
  process.exit(1);
}

console.log('Public address integrity gate passed.');
