import fs from 'node:fs';
import path from 'node:path';

const roots = [
  'apps/lms',
  'apps/admin',
  'app-legacy',
];

const extensions = new Set([
  '.ts',
  '.tsx',
  '.js',
  '.jsx',
  '.mjs',
  '.cjs',
]);

const suspiciousPatterns = [
  {
    name: 'Object passed as second argument',
    regex: /logger\.error\s*\(\s*[^,]+,\s*\{/g,
  },
  {
    name: 'error.message passed as second argument',
    regex: /logger\.error\s*\(\s*[^,]+,\s*[\w.]+\.message\s*[,)]/g,
  },
];

function walk(directory) {
  if (!fs.existsSync(directory)) {
    return [];
  }

  const results = [];

  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const fullPath = path.join(directory, entry.name);

    if (
      entry.name === 'node_modules' ||
      entry.name === '.next' ||
      entry.name === '.git'
    ) {
      continue;
    }

    if (entry.isDirectory()) {
      results.push(...walk(fullPath));
      continue;
    }

    if (extensions.has(path.extname(entry.name))) {
      results.push(fullPath);
    }
  }

  return results;
}

let findings = 0;

for (const root of roots) {
  for (const file of walk(root)) {
    const content = fs.readFileSync(file, 'utf8');
    const lines = content.split(/\r?\n/);

    lines.forEach((line, index) => {
      for (const pattern of suspiciousPatterns) {
        pattern.regex.lastIndex = 0;

        if (pattern.regex.test(line)) {
          findings += 1;
          console.error(
            `${file}:${index + 1} — ${pattern.name}\n  ${line.trim()}`
          );
        }
      }
    });
  }
}

if (findings > 0) {
  console.error(`\nFound ${findings} suspicious logger call(s).`);
  process.exit(1);
}

console.log('No suspicious logger.error calls found.');
