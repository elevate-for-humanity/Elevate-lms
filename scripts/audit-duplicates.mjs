#!/usr/bin/env node
/**
 * Audit Program Pages - Find Wrong Videos & Duplicates
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.join(__dirname, '..');

// Find all files that reference heroVideo
async function findHeroVideoUsages() {
  const usages = [];
  
  async function search(dir) {
    try {
      const entries = await fs.readdir(dir, { withFileTypes: true });
      
      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        
        if (entry.isDirectory()) {
          if (!['node_modules', '.next', '.git'].includes(entry.name)) {
            await search(fullPath);
          }
        } else if (entry.name.endsWith('.tsx') || entry.name.endsWith('.ts')) {
          const content = await fs.readFile(fullPath, 'utf-8');
          const relPath = path.relative(rootDir, fullPath);
          
          // Find heroVideo usages
          const heroVideoMatches = content.match(/heroVideo[:\s]*['"]([^'"]+)['"]/g) || [];
          const videoSrcMatches = content.match(/videoSrc(?:Desktop|Mobile)?[:\s]*['"]([^'"]+)['"]/g) || [];
          const posterMatches = content.match(/posterImage?[:\s]*['"]([^'"]+)['"]/g) || [];
          
          if (heroVideoMatches.length > 0 || videoSrcMatches.length > 0) {
            usages.push({
              file: relPath,
              heroVideos: heroVideoMatches.map(m => m.match(/['"]([^'"]+)['"]/)?.[1]).filter(Boolean),
              videoSrcs: videoSrcMatches.map(m => m.match(/['"]([^'"]+)['"]/)?.[1]).filter(Boolean),
            });
          }
        }
      }
    } catch (err) {
      // Skip
    }
  }
  
  await search(path.join(rootDir, 'app'));
  await search(path.join(rootDir, 'components'));
  
  return usages;
}

// Find duplicate image usages
async function findDuplicateImages() {
  const imageCounts = {};
  
  async function search(dir) {
    try {
      const entries = await fs.readdir(dir, { withFileTypes: true });
      
      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        
        if (entry.isDirectory()) {
          if (!['node_modules', '.next', '.git', 'public'].includes(entry.name)) {
            await search(fullPath);
          }
        } else if (entry.name.endsWith('.tsx') || entry.name.endsWith('.ts')) {
          const content = await fs.readFile(fullPath, 'utf-8');
          
          // Find image sources
          const imgMatches = content.match(/src=['"]([^'"]+\.(jpg|jpeg|png|webp|gif))['"]/gi) || [];
          const importMatches = content.match(/import\s+.*?\s+from\s+['"]([^'"]+\.(jpg|jpeg|png|webp|gif))['"]/gi) || [];
          // Skip bgUrlMatches for now - complex regex
          const bgUrlMatches: string[] = [];
          
          const allImages = [
            ...imgMatches.map(m => m.match(/['"]([^'"]+)['"]/)?.[1]).filter(Boolean),
            ...importMatches.map(m => m.match(/['"]([^'"]+)['"]/)?.[1]).filter(Boolean),
            ...bgUrlMatches.map(m => m.match(/['"]([^'"]+)['"]/)?.[1]).filter(Boolean),
          ];
          
          for (const img of allImages) {
            if (!imageCounts[img]) {
              imageCounts[img] = [];
            }
            imageCounts[img].push(path.relative(rootDir, fullPath));
          }
        }
      }
    } catch (err) {
      // Skip
    }
  }
  
  await search(path.join(rootDir, 'app'));
  await search(path.join(rootDir, 'components'));
  
  // Filter to only duplicates
  return Object.entries(imageCounts)
    .filter(([_, files]) => files.length > 1)
    .map(([image, files]) => ({ image, files }));
}

async function main() {
  console.log('🔍 Program Page Audit');
  console.log('='.repeat(60));
  console.log('');
  
  // Find wrong videos
  console.log('📹 FINDING WRONG VIDEO REFERENCES...\n');
  const videoUsages = await findHeroVideoUsages();
  
  if (videoUsages.length === 0) {
    console.log('  ✅ No heroVideo references found');
  } else {
    console.log(`  Found ${videoUsages.length} files with video references:\n`);
    
    for (const usage of videoUsages) {
      console.log(`  📁 ${usage.file}`);
      if (usage.heroVideos.length > 0) {
        console.log(`     heroVideo: ${usage.heroVideos.join(', ')}`);
      }
      if (usage.videoSrcs.length > 0) {
        console.log(`     videoSrc: ${usage.videoSrcs.join(', ')}`);
      }
      console.log('');
    }
  }
  
  // Find duplicates
  console.log('\n' + '='.repeat(60));
  console.log('🖼️  FINDING DUPLICATE IMAGES...\n');
  
  const duplicates = await findDuplicateImages();
  
  if (duplicates.length === 0) {
    console.log('  ✅ No duplicate images found');
  } else {
    console.log(`  Found ${duplicates.length} images used in multiple places:\n`);
    
    // Group by usage count
    const byCount = duplicates.reduce((acc, d) => {
      const count = d.files.length;
      if (!acc[count]) acc[count] = [];
      acc[count].push(d);
      return acc;
    }, {});
    
    for (const [count, items] of Object.entries(byCount).sort((a, b) => parseInt(b[0]) - parseInt(a[0]))) {
      console.log(`\n  Used ${count} times (${items.length} images):`);
      for (const item of items.slice(0, 5)) {
        console.log(`\n    ${item.image}`);
        console.log(`    Used in:`);
        for (const file of item.files.slice(0, 3)) {
          console.log(`      - ${file}`);
        }
        if (item.files.length > 3) {
          console.log(`      ... and ${item.files.length - 3} more`);
        }
      }
    }
  }
  
  console.log('\n' + '='.repeat(60));
  console.log('📋 RECOMMENDATIONS:\n');
  console.log('  1. Check each heroVideo reference points to correct program');
  console.log('  2. Consolidate duplicate images into shared components');
  console.log('  3. Use consistent naming: {program}-hero.mp4');
  console.log('');
}

main().catch(console.error);
