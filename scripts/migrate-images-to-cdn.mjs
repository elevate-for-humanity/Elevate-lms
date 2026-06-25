#!/usr/bin/env node
/**
 * Migrate static images from public/ to Supabase Storage
 * This reduces build size by moving images to CDN
 * 
 * Usage:
 *   node scripts/migrate-images-to-cdn.mjs --dry-run    # Preview changes
 *   node scripts/migrate-images-to-cdn.mjs              # Actually migrate
 */

import { createClient } from '@supabase/supabase-js';
import { readdir, stat, readFile, writeFileSync, rmSync, existsSync } from 'fs/promises';
import { join, relative, extname, dirname } from 'path';

const DRY_RUN = process.argv.includes('--dry-run');
const SKIP_UPLOAD = process.argv.includes('--skip-upload');
const PUBLIC_DIR = './public';
const BUCKET_NAME = 'images';
const OUTPUT_FILE = './scripts/cdn-image-mapping.json';
const DELETE_AFTER_MIGRATION = false; // Set to true after testing

// Supabase config
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Error: Missing Supabase credentials');
  console.error('Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

function getMimeType(ext) {
  const types = {
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png': 'image/png',
    '.webp': 'image/webp',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
    '.avif': 'image/avif',
  };
  return types[ext] || 'application/octet-stream';
}

async function getAllImages(dir, baseDir = dir) {
  const files = [];
  try {
    const entries = await readdir(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = join(dir, entry.name);
      if (entry.isDirectory()) {
        files.push(...await getAllImages(fullPath, baseDir));
      } else if (entry.isFile()) {
        const ext = extname(entry.name).toLowerCase();
        if (['.jpg', '.jpeg', '.png', '.webp', '.gif', '.svg', '.avif'].includes(ext)) {
          const relPath = relative(baseDir, fullPath);
          const stats = await stat(fullPath);
          files.push({ path: fullPath, relativePath: relPath, size: stats.size });
        }
      }
    }
  } catch (e) {
    // Directory doesn't exist
  }
  return files;
}

async function ensureBucket() {
  const { data: buckets } = await supabase.storage.listBuckets();
  const exists = buckets?.find(b => b.name === BUCKET_NAME);
  
  if (!exists) {
    console.log(`Creating bucket: ${BUCKET_NAME}`);
    if (!DRY_RUN) {
      const { error } = await supabase.storage.createBucket(BUCKET_NAME, {
        public: true,
        fileSizeLimit: 50 * 1024 * 1024, // 50MB
      });
      if (error) throw error;
    }
  }
}

async function uploadImage(file) {
  const buffer = await readFile(file.path);
  const contentType = getMimeType(extname(file.path));
  
  const { data, error } = await supabase.storage
    .from(BUCKET_NAME)
    .upload(file.relativePath, buffer, {
      contentType,
      upsert: true,
      cacheControl: '31536000', // 1 year cache
    });
  
  if (error) throw error;
  return data;
}

async function main() {
  console.log('\n🚀 Image CDN Migration Script\n');
  console.log(`Mode: ${DRY_RUN ? 'DRY RUN (no changes)' : SKIP_UPLOAD ? 'SKIP UPLOAD (mapping only)' : 'LIVE'}\n`);
  
  // Ensure bucket exists
  await ensureBucket();
  
  // Get all images
  console.log('📁 Scanning public/ directory...');
  const images = await getAllImages(PUBLIC_DIR);
  
  // Sort by size (largest first)
  images.sort((a, b) => b.size - a.size);
  
  const totalSize = images.reduce((sum, f) => sum + f.size, 0);
  console.log(`Found ${images.length} images (${(totalSize / 1024 / 1024).toFixed(1)}MB)\n`);
  
  // Group by directory
  const byDir = {};
  for (const img of images) {
    const parts = img.relativePath.split('/');
    const dir = parts.length > 1 ? parts[0] : '.';
    if (!byDir[dir]) byDir[dir] = { files: [], size: 0 };
    byDir[dir].files.push(img);
    byDir[dir].size += img.size;
  }
  
  // Show breakdown
  console.log('📊 Breakdown by directory:');
  const sortedDirs = Object.entries(byDir).sort((a, b) => b[1].size - a[1].size);
  for (const [dir, data] of sortedDirs) {
    const pct = ((data.size / totalSize) * 100).toFixed(1);
    console.log(`   ${dir}/: ${data.files.length} files, ${(data.size / 1024 / 1024).toFixed(1)}MB (${pct}%)`);
  }
  console.log();
  
  // Generate CDN URL prefix
  const cdnBase = `${supabaseUrl}/storage/v1/object/public/${BUCKET_NAME}`;
  
  // Create mapping
  const mapping = {};
  let uploaded = 0;
  let skipped = 0;
  let failed = 0;
  
  console.log('📤 Processing images...');
  
  for (const img of images) {
    const oldUrl = `/${img.relativePath}`;
    const newUrl = `${cdnBase}/${img.relativePath}`;
    
    mapping[oldUrl] = {
      newUrl,
      size: img.size,
      path: img.path,
    };
    
    if (!DRY_RUN && !SKIP_UPLOAD) {
      try {
        await uploadImage(img);
        uploaded++;
        process.stdout.write('.');
        if (uploaded % 50 === 0) process.stdout.write(` ${uploaded}\n`);
      } catch (err) {
        if (err.message?.includes('already exists')) {
          skipped++;
        } else {
          failed++;
          process.stdout.write('x');
          console.error(`\nFailed: ${img.relativePath}: ${err.message}`);
        }
      }
    }
  }
  
  console.log('\n');
  
  // Save mapping
  writeFileSync(OUTPUT_FILE, JSON.stringify(mapping, null, 2));
  console.log(`💾 URL mapping saved to: ${OUTPUT_FILE}`);
  
  // Summary
  console.log('\n📋 Summary:');
  console.log(`   Total images: ${images.length}`);
  console.log(`   Total size: ${(totalSize / 1024 / 1024).toFixed(1)}MB`);
  if (!DRY_RUN && !SKIP_UPLOAD) {
    console.log(`   Uploaded: ${uploaded}`);
    console.log(`   Skipped (already exist): ${skipped}`);
    console.log(`   Failed: ${failed}`);
  }
  
  if (DRY_RUN) {
    console.log('\n⚠️  DRY RUN - No files uploaded');
    console.log('\n📝 Next steps after running with upload:');
    console.log('   1. Review the mapping file');
    console.log('   2. Update image references in components');
    console.log('   3. Test locally with: pnpm dev');
    console.log('   4. Commit changes');
    console.log('   5. Delete old files: node scripts/delete-migrated-images.js');
  } else if (failed > 0) {
    console.log('\n⚠️  Some uploads failed. Check errors above.');
  } else {
    console.log('\n✅ Migration complete!');
    console.log('\n📝 Next steps:');
    console.log('   1. Update image refs in components to use new CDN URLs');
    console.log('   2. Test locally: pnpm dev');
    console.log('   3. Deploy and verify');
    console.log('   4. Delete old files from public/ after confirmation');
  }
  
  console.log('\n📖 CDN URL format:');
  console.log(`   ${cdnBase}/images/pages/hero.webp`);
  console.log(`\n   Old: <img src="/images/pages/hero.webp" />`);
  console.log(`   New: <img src="${cdnBase}/images/pages/hero.webp" />`);
}

main().catch(console.error);
