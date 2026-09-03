#!/usr/bin/env node
/**
 * Image Inventory Script
 * Discovers all images and generates a complete inventory
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');

const CATEGORIES = {
  hero: ['hero', 'banner'],
  program: ['programs', 'career', 'training'],
  healthcare: ['healthcare', 'medical', 'cna', 'phlebotomy'],
  trades: ['hvac', 'cdl', 'welding', 'electrical', 'building'],
  beauty: ['barber', 'cosmetology', 'beauty', 'esthetician'],
  people: ['instructor', 'student', 'learner', 'team', 'portrait'],
  facilities: ['facility', 'classroom', 'training-center'],
  icons: ['icon', 'badge', 'logo'],
  partners: ['partner', 'employer'],
  testimonials: ['testimonial', 'success', 'graduate'],
  pages: ['pages-hero', 'page-hero'],
  misc: ['misc', 'general', 'default']
};

function categorizeImage(filepath) {
  const filename = path.basename(filepath).toLowerCase();
  
  for (const [category, keywords] of Object.entries(CATEGORIES)) {
    for (const keyword of keywords) {
      if (filename.includes(keyword)) {
        return category;
      }
    }
  }
  return 'other';
}

function discoverImages(dir, basePath = '') {
  const images = [];
  
  if (!fs.existsSync(dir)) return images;
  
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    const relativePath = basePath ? `${basePath}/${entry.name}` : entry.name;
    
    if (entry.isDirectory()) {
      images.push(...discoverImages(fullPath, relativePath));
    } else {
      const ext = path.extname(entry.name).toLowerCase();
      if (['.jpg', '.jpeg', '.png', '.webp', '.gif', '.svg'].includes(ext)) {
        const stats = fs.statSync(fullPath);
        images.push({
          path: relativePath,
          fullPath,
          filename: entry.name,
          size: stats.size,
          sizeKB: Math.round(stats.size / 1024),
          extension: ext,
          category: categorizeImage(relativePath)
        });
      }
    }
  }
  
  return images;
}

function main() {
  const publicDir = path.join(ROOT, 'public');
  const images = discoverImages(publicDir);
  
  // Group by category
  const byCategory = {};
  for (const img of images) {
    if (!byCategory[img.category]) {
      byCategory[img.category] = [];
    }
    byCategory[img.category].push(img);
  }
  
  // Generate report
  const report = {
    timestamp: new Date().toISOString(),
    totalImages: images.length,
    totalSizeMB: Math.round(images.reduce((sum, img) => sum + img.size, 0) / 1024 / 1024 * 100) / 100,
    byCategory: {},
    lowQualityFlags: [],
    genericNames: [],
    needsSEO: []
  };
  
  for (const [category, imgs] of Object.entries(byCategory)) {
    report.byCategory[category] = {
      count: imgs.length,
      totalSizeKB: Math.round(imgs.reduce((sum, img) => sum + img.size, 0) / 1024)
    };
  }
  
  // Flag generic names
  for (const img of images) {
    const genericPatterns = ['image', 'photo', 'pic', 'img', 'banner', 'hero', 'test', 'sample'];
    const isGeneric = genericPatterns.some(p => 
      img.filename.toLowerCase().replace(/[0-9]/g, '') === p + extname(img.filename)
    );
    
    if (isGeneric) {
      report.genericNames.push(img.path);
    }
    
    // Flag large images
    if (img.sizeKB > 500) {
      report.lowQualityFlags.push({
        path: img.path,
        sizeKB: img.sizeKB,
        issue: 'Large file size (>500KB)'
      });
    }
  }
  
  // Output
  console.log('═'.repeat(70));
  console.log('  IMAGE INVENTORY REPORT');
  console.log('═'.repeat(70));
  console.log(`\nTotal Images: ${report.totalImages}`);
  console.log(`Total Size: ${report.totalSizeMB} MB\n`);
  
  console.log('By Category:');
  console.log('─'.repeat(50));
  for (const [cat, data] of Object.entries(report.byCategory)) {
    console.log(`  ${cat.padEnd(15)} ${data.count.toString().padStart(4)} images  (${data.totalSizeKB} KB)`);
  }
  
  if (report.genericNames.length > 0) {
    console.log('\n⚠️  Generic Filenames:');
    report.genericNames.forEach(p => console.log(`  - ${p}`));
  }
  
  if (report.lowQualityFlags.length > 0) {
    console.log('\n⚠️  Large Images (>500KB):');
    report.lowQualityFlags.slice(0, 10).forEach(f => {
      console.log(`  - ${f.path} (${f.sizeKB} KB)`);
    });
    if (report.lowQualityFlags.length > 10) {
      console.log(`  ... and ${report.lowQualityFlags.length - 10} more`);
    }
  }
  
  // Save report
  const reportPath = path.join(ROOT, 'scripts', 'image-inventory-report.json');
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  console.log(`\n📄 Full report: ${reportPath}`);
  console.log('═'.repeat(70));
}

function extname(filepath) {
  return path.extname(filepath).toLowerCase().replace('.', '');
}

main().catch(console.error);
