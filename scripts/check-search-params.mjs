#!/usr/bin/env node
/**
 * check-search-params.mjs
 *
 * Fails CI if any server page.tsx uses searchParams without Promise<>.
 * In Next.js 15+, searchParams is async. Sync usage causes prerender crashes.
 *
 * Allowed patterns:
 *   searchParams: Promise<...>
 *   searchParams: PageSearchParams
 *   searchParams: SearchParams  (if it resolves to Promise)
 *
 * Blocked patterns:
 *   searchParams: { ... }
 *   searchParams: Record<string, ...>
 *   new URLSearchParams(searchParams)  without prior await
 */

import { readFileSync, readdirSync, statSync } from 'fs';
import { join } from 'path';

const ROOT = process.cwd();
let failures = 0;

function walk(dir) {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    const stat = statSync(full);
    if (stat.isDirectory()) {
      if (entry === 'node_modules' || entry === '.next') continue;
      walk(full);
    } else if (entry === 'page.tsx' || entry === 'page.ts') {
      check(full);
    }
  }
}

function check(path) {
  const src = readFileSync(path, 'utf8');

  // Skip client components
  if (src.slice(0, 300).includes("'use client'") || src.slice(0, 300).includes('"use client"')) {
    return;
  }

  // Skip if no searchParams usage
  if (!src.includes('searchParams')) return;

  const lines = src.split('\n');

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const stripped = line.trim();
    if (stripped.startsWith('//') || stripped.startsWith('*')) continue;

    // Block: searchParams typed as plain object or Record (not Promise)
    if (
      /searchParams\s*:\s*(?!Promise<)(?!PageSearchParams\b)(?!SearchParams\b)(\{|Record<)/.test(
        line,
      )
    ) {
      // Allow if it's a sub-component prop (not the page export)
      const context = lines.slice(Math.max(0, i - 5), i + 2).join('\n');
      if (/export\s+default/.test(context)) {
        console.error(
          `❌ SYNC searchParams type in server page: ${path.replace(ROOT + '/', '')}:${i + 1}`,
        );
        console.error(`   ${stripped}`);
        failures++;
      }
    }

    // Block: URLSearchParams(searchParams) without prior await
    if (/URLSearchParams\s*\(\s*searchParams/.test(line)) {
      const prior = lines.slice(0, i).join('\n');
      if (!/await\s+searchParams/.test(prior)) {
        console.error(
          `❌ URLSearchParams(searchParams) without await: ${path.replace(ROOT + '/', '')}:${i + 1}`,
        );
        console.error(`   ${stripped}`);
        failures++;
      }
    }
  }
}

walk(join(ROOT, 'app'));

if (failures > 0) {
  console.error(`\n${failures} sync searchParams violation(s) found.`);
  console.error('Fix: type as Promise<PageSearchParams> and await before use.');
  console.error('See lib/page-params.ts for the canonical pattern.');
  process.exit(1);
} else {
  console.log('✅ searchParams check passed — all usages are async-safe');
}
