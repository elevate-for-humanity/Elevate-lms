#!/usr/bin/env node

/**
 * CI gate: Detect multiple Stripe client initializations.
 * 
 * The canonical Stripe client is lib/stripe/client.ts.
 * All other files should import from there, not create their own Stripe instances.
 */

import { readFileSync, readdirSync, statSync } from 'fs';
import { join } from 'path';

const CANONICAL = 'lib/stripe/client.ts';

function walkDir(dir, ext) {
  const results = [];
  try {
    const entries = readdirSync(dir);
    for (const entry of entries) {
      if (entry === 'node_modules' || entry === '.next' || entry === '.git') continue;
      const fullPath = join(dir, entry);
      const stat = statSync(fullPath);
      if (stat.isDirectory()) {
        results.push(...walkDir(fullPath, ext));
      } else if (entry.endsWith(ext)) {
        results.push(fullPath);
      }
    }
  } catch {
    // ignore
  }
  return results;
}

const tsFiles = [...walkDir('lib', '.ts'), ...walkDir('app', '.ts')];

const violations = [];

for (const file of tsFiles) {
  const relative = file;
  if (relative === CANONICAL) continue;
  
  const content = readFileSync(file, 'utf-8');
  
  // Check for direct Stripe instantiation (new Stripe(...))
  if (content.includes('new Stripe(') && content.includes("from 'stripe'")) {
    violations.push(relative);
  }
}

if (violations.length > 0) {
  console.warn(`\n⚠️  Found ${violations.length} files creating their own Stripe client (should import from ${CANONICAL}):\n`);
  for (const v of violations) {
    console.warn(`  - ${v}`);
  }
  console.warn(`\nCanonical Stripe client: ${CANONICAL}`);
  console.warn('Refactor these to import { stripe } from "@/lib/stripe/client"\n');
  // Warn only for now
  process.exit(0);
} else {
  console.log('✅ All Stripe clients use canonical import.');
}
