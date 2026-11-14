#!/usr/bin/env node
/**
 * Update image references to use CDN URLs
 * Run AFTER migrate-images-to-cdn.mjs
 * 
 * Usage:
 *   node scripts/update-image-refs-to-cdn.mjs --dry-run  # Preview
 *   node scripts/update-image-refs-to-cdn.mjs            # Actually update
 */

import { readFileSync, writeFileSync, readdirSync, statSync, existsSync } from 'fs';
import { join, extname } from 'path';

const DRY_RUN = process.argv.includes('--dry-run');
const MAPPING_FILE = './scripts/cdn-image-mapping.json';
const SKIP_DIRS = new Set(['node_modules', '.next', '.git', '_archived', 'scripts']);
const CODE_EXTS = new Set(['.ts', '.tsx', '.js', '.jsx', '.mdx', '.md', '.json']);

if (!existsSync(MAPPING_FILE)) {
  console.error(`Error: Mapping file not found at ${MAPPING_FILE}`);
  console.error('Run migrate-images-to-cdn.mjs first');
  process.exit(1);
}

const mapping = JSON.parse(readFileSync(MAPPING_FILE, 'utf8'));

function walkDir(dir, files = []) {
  const entries = readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    if (SKIP_DIRS.has(entry.name)) continue;
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      walkDir(full, files);
    } else if (CODE_EXTS.has(extname(entry.name))) {
      files.push(full);
    }
  }
  return files;
}

function updateContent(content, filePath) {
  let changed = false;
  let updated = content;
  
  // Sort keys by length (longest first) to avoid partial replacements
  const sortedKeys = Object.keys(mapping).sort((a, b) => b.length - a.length);
  
  for (const oldUrl of sortedKeys) {
    const { newUrl } = mapping[oldUrl];
    
    // Match various patterns
    const patterns = [
      { regex: new RegExp(`(["'])${escapeRegex(oldUrl)}(["'])`, 'g'), replacement: `$1${newUrl}$2` },
      { regex: new RegExp(`(["'])${escapeRegex(oldUrl.replace('/', '\\/'))}(["'])`, 'g'), replacement: `$1${newUrl.replace('/', '\\/')}$2` },
    ];
    
    for (const { regex, replacement } of patterns) {
      if (regex.test(updated)) {
        updated = updated.replace(regex, replacement);
        changed = true;
      }
    }
  }
  
  return { changed, updated };
}

function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

console.log('\n🔄 Image Reference Updater\n');
console.log(`Mode: ${DRY_RUN ? 'DRY RUN' : 'LIVE'}\n`);

if (DRY_RUN) {
  console.log('⚠️  No files will be modified\n');
}

let filesUpdated = 0;
let refsUpdated = 0;
const files = walkDir('.');

console.log(`Scanning ${files.length} files...\n`);

for (const file of files) {
  try {
    const content = readFileSync(file, 'utf8');
    const { changed, updated } = updateContent(content, file);
    
    if (changed) {
      filesUpdated++;
      
      // Count refs changed
      let count = 0;
      for (const oldUrl of Object.keys(mapping)) {
        count += (content.match(new RegExp(escapeRegex(oldUrl), 'g')) || []).length;
      }
      refsUpdated += count;
      
      if (DRY_RUN) {
        console.log(`📝 Would update: ${file} (${count} refs)`);
      } else {
        writeFileSync(file, updated);
        console.log(`✅ Updated: ${file} (${count} refs)`);
      }
    }
  } catch (e) {
    // Skip binary or unreadable files
  }
}

console.log('\n📋 Summary:');
console.log(`   Files scanned: ${files.length}`);
console.log(`   Files updated: ${filesUpdated}`);
console.log(`   Total refs updated: ${refsUpdated}`);

if (DRY_RUN) {
  console.log('\n⚠️  DRY RUN - No files were modified');
  console.log('   Run without --dry-run to actually update files');
}
