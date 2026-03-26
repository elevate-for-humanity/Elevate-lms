#!/usr/bin/env node
/**
 * Updates hardcoded /hvac/, /videos/, /generated/ paths in source code
 * to point to Supabase Storage public URLs after media migration.
 *
 * Run AFTER migrate-media-to-storage.mjs completes successfully.
 *
 * Usage:
 *   NEXT_PUBLIC_SUPABASE_URL=xxx node scripts/update-media-urls.mjs [--dry-run]
 */

import { readFileSync, writeFileSync, readdirSync, statSync } from 'fs';
import { join, extname } from 'path';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const DRY_RUN = process.argv.includes('--dry-run');

if (!SUPABASE_URL) {
  console.error('NEXT_PUBLIC_SUPABASE_URL is required');
  process.exit(1);
}

const STORAGE_BASE = `${SUPABASE_URL}/storage/v1/object/public`;

// Map local public paths → storage URLs
const URL_MAP = [
  { from: /(['"`])\/hvac\/audio\//g,            to: `$1${STORAGE_BASE}/course-videos/hvac/audio/` },
  { from: /(['"`])\/hvac\/videos\//g,           to: `$1${STORAGE_BASE}/course-videos/hvac/videos/` },
  { from: /(['"`])\/hvac\/diagrams\//g,         to: `$1${STORAGE_BASE}/course-videos/hvac/diagrams/` },
  { from: /(['"`])\/videos\//g,                 to: `$1${STORAGE_BASE}/course-videos/videos/` },
  { from: /(['"`])\/videos\/lessons\//g,         to: `$1${STORAGE_BASE}/course-videos/videos/lessons/` },
  { from: /(['"`])\/generated\/lessons\//g,     to: `$1${STORAGE_BASE}/media/generated/lessons/` },
];

const SCAN_DIRS = ['app', 'lib', 'components', 'courses'];
const EXTENSIONS = new Set(['.ts', '.tsx', '.js', '.mjs']);

function walkDir(dir) {
  const results = [];
  try {
    for (const entry of readdirSync(dir)) {
      const full = join(dir, entry);
      const stat = statSync(full);
      if (stat.isDirectory() && !entry.startsWith('.') && entry !== 'node_modules') {
        results.push(...walkDir(full));
      } else if (EXTENSIONS.has(extname(full))) {
        results.push(full);
      }
    }
  } catch {}
  return results;
}

let filesChanged = 0;

for (const dir of SCAN_DIRS) {
  for (const file of walkDir(dir)) {
    let content = readFileSync(file, 'utf8');
    let changed = false;

    for (const { from, to } of URL_MAP) {
      const updated = content.replace(from, to);
      if (updated !== content) {
        content = updated;
        changed = true;
      }
    }

    if (changed) {
      filesChanged++;
      console.log(`${DRY_RUN ? '[dry] ' : ''}updated: ${file}`);
      if (!DRY_RUN) writeFileSync(file, content, 'utf8');
    }
  }
}

console.log(`\n${filesChanged} files ${DRY_RUN ? 'would be ' : ''}updated.`);
if (!DRY_RUN && filesChanged > 0) {
  console.log('\nNext: git add -A && git commit -m "chore: update media URLs to Supabase Storage"');
}
