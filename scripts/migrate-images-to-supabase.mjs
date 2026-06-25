#!/usr/bin/env node
/**
 * Migrate static images from public/images to Supabase Storage
 * Usage: node scripts/migrate-images-to-supabase.mjs [--dry-run]
 */

import { createClient } from '@supabase/supabase-js';
import { readdir, stat, readFile, writeFile } from 'fs/promises';
import { join, relative, extname } from 'path';

const DRY_RUN = process.argv.includes('--dry-run');
const PUBLIC_DIR = './public/images';
const BUCKET_NAME = 'images';

// Supabase config from env
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials');
  console.error('   Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function getAllFiles(dir, baseDir = dir) {
  const files = [];
  try {
    const entries = await readdir(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = join(dir, entry.name);
      if (entry.isDirectory()) {
        files.push(...await getAllFiles(fullPath, baseDir));
      } else if (entry.isFile()) {
        const ext = extname(entry.name).toLowerCase();
        if (['.jpg', '.jpeg', '.png', '.webp', '.gif', '.svg'].includes(ext)) {
          const relPath = relative(baseDir, fullPath);
          const stats = await stat(fullPath);
          files.push({ path: fullPath, relativePath: relPath, size: stats.size });
        }
      }
    }
  } catch (e) {
    // Directory might not exist
  }
  return files;
}

function getMimeType(ext) {
  const types = {
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png': 'image/png',
    '.webp': 'image/webp',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
  };
  return types[ext] || 'application/octet-stream';
}

async function ensureBucket() {
  const { data: buckets } = await supabase.storage.listBuckets();
  const exists = buckets?.find(b => b.name === BUCKET_NAME);
  
  if (!exists) {
    console.log(`Creating bucket: ${BUCKET_NAME}`);
    if (!DRY_RUN) {
      const { error } = await supabase.storage.createBucket(BUCKET_NAME, {
        public: true,
        fileSizeLimit: 10 * 1024 * 1024,
      });
      if (error) throw error;
    }
  }
}

async function main() {
  console.log('Image Migration to Supabase Storage\n');
  console.log(`Mode: ${DRY_RUN ? 'DRY RUN' : 'LIVE'}\n`);
  
  await ensureBucket();
  
  console.log('Scanning images...');
  const files = await getAllFiles(PUBLIC_DIR);
  
  files.sort((a, b) => b.size - a.size);
  
  const totalSize = files.reduce((sum, f) => sum + f.size, 0);
  console.log(`Found ${files.length} images (${(totalSize / 1024 / 1024).toFixed(1)}MB)\n`);
  
  // Group by directory
  const byDir = {};
  for (const file of files) {
    const dir = file.relativePath.split('/')[0];
    if (!byDir[dir]) byDir[dir] = { files: [], size: 0 };
    byDir[dir].files.push(file);
    byDir[dir].size += file.size;
  }
  
  console.log('Size by directory:');
  for (const [dir, data] of Object.entries(byDir)) {
    console.log(`   ${dir}/: ${data.files.length} files, ${(data.size / 1024 / 1024).toFixed(1)}MB`);
  }
  console.log();
  
  // Generate URL mapping
  const urlMapping = {};
  const storageBase = `${supabaseUrl}/storage/v1/object/public/${BUCKET_NAME}`;
  
  for (const file of files) {
    const oldUrl = `/images/${file.relativePath}`;
    const newUrl = `${storageBase}/${file.relativePath}`;
    urlMapping[oldUrl] = newUrl;
    
    if (!DRY_RUN) {
      try {
        const buffer = await readFile(file.path);
        await supabase.storage.from(BUCKET_NAME).upload(file.relativePath, buffer, {
          contentType: getMimeType(extname(file.path)),
          upsert: true
        });
        process.stdout.write('.');
      } catch (err) {
        process.stdout.write('x');
      }
    }
  }
  
  const mappingFile = './scripts/image-url-mapping.json';
  await writeFile(mappingFile, JSON.stringify(urlMapping, null, 2));
  console.log(`\n\nURL mapping saved to: ${mappingFile}`);
  
  if (DRY_RUN) {
    console.log('\nDRY RUN - No files uploaded');
  } else {
    console.log('\nUpload complete!');
    console.log('Next: Update image refs in components to use new URLs');
  }
}

main().catch(console.error);
