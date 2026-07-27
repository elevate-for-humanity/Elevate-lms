#!/usr/bin/env node
/**
 * check-next-route-config.mjs
 * 
 * Validates Next.js route configuration exports to prevent build failures.
 * Rejects duplicate exports of: dynamic, revalidate, runtime, fetchCache, 
 * preferredRegion, maxDuration
 * 
 * Usage: node scripts/check-next-route-config.mjs
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '..');

const ROUTE_CONFIG_NAMES = [
  'dynamic',
  'revalidate',
  'runtime',
  'fetchCache',
  'preferredRegion',
  'maxDuration',
];

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
    if (!/\.(ts|tsx)$/.test(file)) continue;
    
    const content = fs.readFileSync(file, 'utf8');
    const relativePath = path.relative(ROOT, file);
    
    for (const name of ROUTE_CONFIG_NAMES) {
      const pattern = new RegExp(`export\\s+const\\s+${name}\\s*=`, 'g');
      const matches = content.match(pattern) || [];
      
      if (matches.length > 1) {
        failures.push({
          file: relativePath,
          config: name,
          count: matches.length,
        });
      }
    }
  }
}

if (failures.length > 0) {
  console.error('❌ Duplicate route configuration exports detected:\n');
  
  for (const failure of failures) {
    console.error(`  ${failure.file}:`);
    console.error(`    - duplicate "${failure.config}" (${failure.count} times)`);
  }
  
  console.error('\nEach route config can only be exported once per file.');
  console.error('This is a Next.js build-time requirement.');
  process.exit(1);
}

console.log('✓ Next.js route configuration check passed.');
console.log(`  Scanned: ${APPS.join(', ')}`);
process.exit(0);
