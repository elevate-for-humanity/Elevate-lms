/**
 * Adds force-static + revalidate=3600 to page.tsx files that:
 *   - have no existing rendering directive
 *   - are not client components ('use client')
 *   - do not use any server-side dynamic APIs
 *
 * Safe to re-run — skips files that already have a directive.
 */

import fs from 'fs';
import path from 'path';

const ROOT = './app';

function walk(dir) {
  let results = [];
  for (const file of fs.readdirSync(dir)) {
    const full = path.join(dir, file);
    const stat = fs.statSync(full);
    if (stat.isDirectory()) {
      results = results.concat(walk(full));
    } else if (file === 'page.tsx') {
      results.push(full);
    }
  }
  return results;
}

function hasDirective(content) {
  return (
    content.includes('force-static') ||
    content.includes('force-dynamic') ||
    content.includes('revalidate')
  );
}

function isDynamic(content) {
  return (
    content.includes("'use client'") ||
    content.includes('"use client"') ||
    content.includes('createClient(') ||
    content.includes('getAdminClient(') ||
    content.includes('cookies()') ||
    content.includes('headers()') ||
    content.includes('getUser(') ||
    content.includes('supabase.') ||
    content.includes('await fetch(') ||
    content.includes('getServerSession')
  );
}

let patched = 0;
let skipped = 0;

for (const file of walk(ROOT)) {
  const content = fs.readFileSync(file, 'utf8');

  if (hasDirective(content) || isDynamic(content)) {
    skipped++;
    continue;
  }

  const updated = `export const dynamic = 'force-static';\nexport const revalidate = 3600;\n\n${content}`;
  fs.writeFileSync(file, updated);
  console.log(`✔ ${file}`);
  patched++;
}

console.log(`\nDone. Patched: ${patched}, Skipped: ${skipped}`);
