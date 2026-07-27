#!/usr/bin/env node
/**
 * check-client-metadata.mjs
 * 
 * Validates that client components ('use client') don't export Next.js metadata.
 * This is a Next.js build-time requirement - client components cannot export
 * generateMetadata or metadata objects.
 * 
 * Usage: node scripts/check-client-metadata.mjs
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '..');

const APPS = ['apps/marketing', 'apps/admin', 'apps/lms'];

const failures = [];

function walk(directory) {
  if (!fs.existsSync(directory)) return [];
  
  try {
    return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
      const location = path.join(directory, entry.name);
      return entry.isDirectory() ? walk(location) : [location];
    });
  } catch (err) {
    console.error(`Error reading directory ${directory}:`, err.message);
    return [];
  }
}

for (const app of APPS) {
  const appDir = path.join(ROOT, app, 'app');
  
  for (const file of walk(appDir)) {
    // Only check page and layout files
    if (!/page\.(ts|tsx)$/.test(file) && !/layout\.(ts|tsx)$/.test(file)) continue;
    
    const content = fs.readFileSync(file, 'utf8');
    const lines = content.split('\n');
    const relativePath = path.relative(ROOT, file);
    
    // Check for 'use client' directive at the start of the file (before any imports or after imports)
    // Must be a standalone line (not in a comment or string)
    let isClient = false;
    for (let i = 0; i < lines.length && i < 20; i++) {
      const line = lines[i].trim();
      // Skip empty lines and comments
      if (!line || line.startsWith('//') || line.startsWith('/*') || line.startsWith('*')) continue;
      // Check for 'use client' or "use client"
      if (line === "'use client'" || line === '"use client"') {
        isClient = true;
        break;
      }
      // If we hit a regular import, stop checking (use client must come before imports)
      if (line.startsWith('import ') || line.startsWith('export ')) {
        break;
      }
    }
    
    // Check for metadata exports
    const exportsMetadata =
      /export\s+const\s+metadata/.test(content) ||
      /export\s+(async\s+)?function\s+generateMetadata/.test(content);
    
    if (isClient && exportsMetadata) {
      failures.push(relativePath);
    }
  }
}

if (failures.length > 0) {
  console.error('❌ Client components exporting metadata detected:\n');
  
  for (const file of failures) {
    console.error(`  - ${file}`);
  }
  
  console.error('\nClient components cannot export Next.js metadata.');
  console.error('Move metadata exports to a server component or split the file.');
  console.error('If you need client-side interactivity with metadata, create a wrapper pattern.');
  process.exit(1);
}

console.log('✓ Client metadata check passed.');
console.log(`  Scanned: ${APPS.join(', ')}`);
process.exit(0);
