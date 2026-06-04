#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

const ROUTE_ROOTS = ['app', 'apps/admin/app'];
const SOURCE_ROOTS = [
  'app',
  'apps/admin/app',
  'components',
  'lib',
  'data',
  'config',
  'lms-content',
];
const EXCLUDED_DIRS = new Set(['.git', '.next', 'node_modules', 'dist', 'coverage']);
const ROUTE_FILE_NAMES = new Set([
  'page.tsx',
  'route.ts',
  'layout.tsx',
  'template.tsx',
  'default.tsx',
  'loading.tsx',
  'error.tsx',
  'not-found.tsx',
  'sitemap.ts',
  'robots.ts',
  'manifest.ts',
]);
const SOURCE_EXTENSIONS = new Set(['.ts', '.tsx', '.js', '.jsx', '.mjs', '.cjs', '.json', '.mdx']);

function walk(dir, files = []) {
  if (!fs.existsSync(dir)) return files;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (EXCLUDED_DIRS.has(entry.name)) continue;
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walk(fullPath, files);
    } else {
      files.push(fullPath);
    }
  }
  return files;
}

function bytes(file) {
  return fs.statSync(file).size;
}

function mb(value) {
  return `${(value / 1024 / 1024).toFixed(2)} MB`;
}

function topSegment(file, root) {
  const parts = path.relative(root, file).split(path.sep);
  return parts[0] || '.';
}

function markdownTable(headers, rows) {
  const headerLine = `| ${headers.join(' | ')} |`;
  const divider = `| ${headers.map(() => '---').join(' | ')} |`;
  const body = rows.map((row) => `| ${row.join(' | ')} |`);
  return [headerLine, divider, ...body].join('\n');
}

function routeSummary(root) {
  const allFiles = walk(root).filter((file) => ROUTE_FILE_NAMES.has(path.basename(file)));
  const groups = new Map();
  for (const file of allFiles) {
    const key = topSegment(file, root);
    const group = groups.get(key) ?? {
      files: 0,
      pages: 0,
      routes: 0,
      layouts: 0,
      other: 0,
      dynamic: 0,
      bytes: 0,
    };
    const base = path.basename(file);
    group.files += 1;
    group.bytes += bytes(file);
    if (base === 'page.tsx') group.pages += 1;
    else if (base === 'route.ts') group.routes += 1;
    else if (base === 'layout.tsx') group.layouts += 1;
    else group.other += 1;
    if (file.includes('[')) group.dynamic += 1;
    groups.set(key, group);
  }

  return {
    root,
    totalFiles: allFiles.length,
    pages: allFiles.filter((file) => path.basename(file) === 'page.tsx').length,
    routes: allFiles.filter((file) => path.basename(file) === 'route.ts').length,
    bytes: allFiles.reduce((sum, file) => sum + bytes(file), 0),
    groups: Array.from(groups.entries())
      .map(([group, data]) => ({ group, ...data }))
      .sort((a, b) => b.pages + b.routes - (a.pages + a.routes) || b.bytes - a.bytes),
  };
}

function largestSourceFiles(root, limit = 15) {
  return walk(root)
    .filter((file) => ['.ts', '.tsx', '.json'].includes(path.extname(file)))
    .map((file) => ({ file, bytes: bytes(file) }))
    .sort((a, b) => b.bytes - a.bytes)
    .slice(0, limit);
}

function largestJsonFiles(limit = 15) {
  return walk('.')
    .filter((file) => path.extname(file) === '.json')
    .filter((file) => !file.startsWith(`.${path.sep}node_modules${path.sep}`))
    .filter((file) => !file.startsWith(`.${path.sep}.next${path.sep}`))
    .map((file) => ({ file: file.replace(/^\.\//, ''), bytes: bytes(file) }))
    .sort((a, b) => b.bytes - a.bytes)
    .slice(0, limit);
}

function findMatches(roots, regex) {
  const results = [];
  for (const root of roots) {
    for (const file of walk(root)) {
      if (!SOURCE_EXTENSIONS.has(path.extname(file))) continue;
      const text = fs.readFileSync(file, 'utf8');
      const lines = text.split('\n');
      lines.forEach((line, index) => {
        if (regex.test(line)) results.push({ file, line: index + 1, text: line.trim() });
        regex.lastIndex = 0;
      });
    }
  }
  return results;
}

const summaries = ROUTE_ROOTS.map(routeSummary);
console.log('# Build Surface Audit');
console.log('');
console.log(`Generated: ${new Date().toISOString()}`);
console.log('');
console.log('## Route roots');
console.log(
  markdownTable(
    ['Root', 'Route files', 'Pages', 'API routes', 'Source size'],
    summaries.map((summary) => [
      `\`${summary.root}\``,
      summary.totalFiles.toLocaleString(),
      summary.pages.toLocaleString(),
      summary.routes.toLocaleString(),
      mb(summary.bytes),
    ]),
  ),
);

for (const summary of summaries) {
  console.log('');
  console.log(`## Largest route groups: ${summary.root}`);
  console.log(
    markdownTable(
      ['Group', 'Pages', 'API routes', 'Dynamic files', 'Route files', 'Source size'],
      summary.groups
        .slice(0, 15)
        .map((group) => [
          `\`${group.group}\``,
          group.pages.toLocaleString(),
          group.routes.toLocaleString(),
          group.dynamic.toLocaleString(),
          group.files.toLocaleString(),
          mb(group.bytes),
        ]),
    ),
  );
}

for (const root of ROUTE_ROOTS) {
  console.log('');
  console.log(`## Largest route-adjacent source files: ${root}`);
  console.log(
    markdownTable(
      ['File', 'Size'],
      largestSourceFiles(root).map(({ file, bytes: size }) => [
        `\`${file}\``,
        size.toLocaleString(),
      ]),
    ),
  );
}

console.log('');
console.log('## Largest JSON payloads outside node_modules/.next');
console.log(
  markdownTable(
    ['File', 'Size'],
    largestJsonFiles().map(({ file, bytes: size }) => [`\`${file}\``, size.toLocaleString()]),
  ),
);

const staticParams = findMatches(ROUTE_ROOTS, /generateStaticParams/);
console.log('');
console.log('## generateStaticParams declarations');
console.log(
  staticParams.length
    ? markdownTable(
        ['File', 'Line'],
        staticParams.map((match) => [`\`${match.file}\``, String(match.line)]),
      )
    : 'None found.',
);

const jsonImports = findMatches(
  SOURCE_ROOTS,
  /\.json['"]|loadJsonOnce\(|readFileSync\([^\n]+public\/data/,
);
console.log('');
console.log('## JSON/data load sites');
console.log(
  markdownTable(
    ['File', 'Line', 'Statement'],
    jsonImports
      .slice(0, 40)
      .map((match) => [`\`${match.file}\``, String(match.line), match.text.replaceAll('|', '\\|')]),
  ),
);

const recursiveScans = findMatches(
  ROUTE_ROOTS,
  /recursive:\s*['"]true['"]|readdirSync|glob\(|fast-glob/,
);
console.log('');
console.log('## Runtime recursive/file scan sites in route roots');
console.log(
  recursiveScans.length
    ? markdownTable(
        ['File', 'Line', 'Statement'],
        recursiveScans
          .slice(0, 40)
          .map((match) => [
            `\`${match.file}\``,
            String(match.line),
            match.text.replaceAll('|', '\\|'),
          ]),
      )
    : 'None found.',
);

const nextOutputFiles = fs.existsSync('.next')
  ? walk('.next')
      .map((file) => ({ file, bytes: bytes(file) }))
      .sort((a, b) => b.bytes - a.bytes)
      .slice(0, 20)
  : [];
console.log('');
console.log('## Generated .next output');
console.log(
  nextOutputFiles.length
    ? markdownTable(
        ['File', 'Size'],
        nextOutputFiles.map(({ file, bytes: size }) => [`\`${file}\``, size.toLocaleString()]),
      )
    : 'No `.next` directory is present, so generated-output ranking requires a completed or partially retained build artifact.',
);
