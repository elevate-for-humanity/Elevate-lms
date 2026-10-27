#!/usr/bin/env node
// Read-only rendering audit. Never rewrite static routes to dynamic in bulk.
import { readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
const root = process.cwd();
const findings = [];
function scan(dir) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (entry.isSymbolicLink()) continue;
    const file = path.join(dir, entry.name);
    if (entry.isDirectory() && !['node_modules', '.next', '.git'].includes(entry.name)) scan(file);
    else if (entry.isFile() && /\.[tj]sx?$/.test(entry.name)) {
      const source = readFileSync(file, 'utf8');
      for (const [index, line] of source.split('\n').entries()) {
        if (/export\s+(?:const\s+dynamic|(?:async\s+)?function\s+generateStaticParams)/.test(line)) findings.push({ file: path.relative(root, file), line: index + 1, declaration: line.trim() });
      }
    }
  }
}
for (const app of ['marketing', 'admin', 'lms']) scan(path.join(root, 'apps', app, 'app'));
console.log(JSON.stringify({ mode: 'read-only', note: 'Review request-dependent routes individually. These declarations alone do not measure live heap usage.', findings }, null, 2));
