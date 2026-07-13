#!/usr/bin/env node
/**
 * Media Usage Audit
 * 
 * Scans the codebase to identify:
 * - Hero video usages
 * - Generic icons to replace
 * - Stretched/wrong-size images
 * - Duplicate images
 * - Missing alt texts
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.join(__dirname, '..');

// Patterns to detect
const PATTERNS = {
  // Video patterns
  heroVideo: /heroVideo[:\s]*['"]([^'"]+)['"]/g,
  videoSrc: /src=['"]([^'"]+\.mp4[^'"]*)['"]/g,
  videoTag: /<video[^>]*>/g,
  
  // Image patterns
  imgSrc: /src=['"]([^'"]+\.(jpg|jpeg|png|webp|gif)[^'"]*)['"]/g,
  imageSrc: /image=['"]([^'"]+\.(jpg|jpeg|png|webp|gif)[^'"]*)['"]/gi,
  posterImage: /posterImage=['"]([^'"]+)['"]/g,
  
  // Generic icons to replace
  genericEmoji: /[📚👨‍🏫💼🏆🎯📈💡🔧⚙️]/g,
  
  // Quality issues
  inlineStyles: /style=['"][^'"]*width[^'"]*:/g,
  hardcodedSize: /(width|height)=['"][0-9]+(px)?['"]/g,
};

// Pages to audit
const PAGE_PATHS = [
  'app/programs',
  'app/apprentice',
  'app/host-shop',
  'app/orientation',
  'app/onboarding',
  'app/student',
  'app/employer',
  'app/demo',
  'app/lms',
  'app/admin',
];

async function getFiles(dir, ext = '.tsx') {
  const files = [];
  
  async function walk(currentDir) {
    try {
      const entries = await fs.readdir(currentDir, { withFileTypes: true });
      
      for (const entry of entries) {
        const fullPath = path.join(currentDir, entry.name);
        
        if (entry.isDirectory()) {
          // Skip certain directories
          if (!['node_modules', '.next', '.git'].includes(entry.name)) {
            await walk(fullPath);
          }
        } else if (entry.name.endsWith(ext)) {
          files.push(fullPath);
        }
      }
    } catch (err) {
      // Skip permission errors
    }
  }
  
  await walk(dir);
  return files;
}

async function auditFile(filePath) {
  const content = await fs.readFile(filePath, 'utf-8');
  const relPath = path.relative(rootDir, filePath);
  const issues = [];
  
  // Check for hero videos
  const heroVideos = [...content.matchAll(PATTERNS.heroVideo)].map(m => m[1]);
  if (heroVideos.length > 0) {
    issues.push({
      type: 'hero_video',
      file: relPath,
      items: heroVideos,
    });
  }
  
  // Check for generic video tags
  const videoTags = content.match(PATTERNS.videoTag);
  if (videoTags) {
    issues.push({
      type: 'video_tag',
      file: relPath,
      count: videoTags.length,
    });
  }
  
  // Check for generic emojis/icons
  const emojis = content.match(PATTERNS.genericEmoji);
  if (emojis) {
    const unique = [...new Set(emojis)];
    issues.push({
      type: 'generic_icon',
      file: relPath,
      items: unique,
      count: emojis.length,
    });
  }
  
  // Check for hardcoded sizes (potential stretching)
  const hardcodedSizes = content.match(PATTERNS.hardcodedSize);
  if (hardcodedSizes) {
    issues.push({
      type: 'hardcoded_size',
      file: relPath,
      count: hardcodedSizes.length,
    });
  }
  
  // Check for inline width styles
  const inlineWidth = content.match(/style=['"][^'"]*width:\s*['"]?[0-9]+/g);
  if (inlineWidth) {
    issues.push({
      type: 'inline_width',
      file: relPath,
      count: inlineWidth.length,
    });
  }
  
  // Check for missing alt text on images
  const imgTags = content.match(/<img[^>]*>/g) || [];
  const missingAlt = imgTags.filter(tag => !tag.includes('alt='));
  if (missingAlt.length > 0) {
    issues.push({
      type: 'missing_alt',
      file: relPath,
      count: missingAlt.length,
    });
  }
  
  // Check for static imports of images
  const staticImports = content.match(/import\s+.*\s+from\s+['"]([^'"]+\.(jpg|jpeg|png|webp|gif))['"]/gi) || [];
  if (staticImports.length > 0) {
    issues.push({
      type: 'static_image',
      file: relPath,
      count: staticImports.length,
    });
  }
  
  return issues;
}

async function main() {
  console.log('🔍 Media Usage Audit\n');
  console.log('Scanning pages...\n');
  
  const allIssues = {
    hero_videos: [],
    generic_icons: [],
    stretched_images: [],
    missing_alt: [],
    static_images: [],
    other: [],
  };
  
  let totalFiles = 0;
  
  for (const pagePath of PAGE_PATHS) {
    const fullPath = path.join(rootDir, pagePath);
    
    try {
      const files = await getFiles(fullPath);
      
      for (const file of files) {
        totalFiles++;
        const issues = await auditFile(file);
        
        for (const issue of issues) {
          switch (issue.type) {
            case 'hero_video':
              allIssues.hero_videos.push(issue);
              break;
            case 'generic_icon':
              allIssues.generic_icons.push(issue);
              break;
            case 'hardcoded_size':
            case 'inline_width':
              allIssues.stretched_images.push(issue);
              break;
            case 'missing_alt':
              allIssues.missing_alt.push(issue);
              break;
            case 'static_image':
              allIssues.static_images.push(issue);
              break;
            default:
              allIssues.other.push(issue);
          }
        }
      }
      
      console.log(`  ✅ ${pagePath}: ${files.length} files`);
    } catch (err) {
      console.log(`  ⚠️  ${pagePath}: Not found`);
    }
  }
  
  // Output results
  console.log(`\n${'='.repeat(60)}`);
  console.log('📊 AUDIT RESULTS');
  console.log(`${'='.repeat(60)}\n`);
  
  // Hero Videos
  console.log(`🎬 HERO VIDEOS (${allIssues.hero_videos.length} files)`);
  console.log('-'.repeat(60));
  if (allIssues.hero_videos.length === 0) {
    console.log('  ✅ No hero videos found');
  } else {
    for (const issue of allIssues.hero_videos) {
      console.log(`\n  📁 ${issue.file}`);
      for (const video of issue.items) {
        console.log(`     → ${video}`);
      }
    }
  }
  
  // Generic Icons
  console.log(`\n\n🎨 GENERIC ICONS TO REPLACE (${allIssues.generic_icons.length} files)`);
  console.log('-'.repeat(60));
  if (allIssues.generic_icons.length === 0) {
    console.log('  ✅ No generic icons found');
  } else {
    for (const issue of allIssues.generic_icons.slice(0, 20)) {
      console.log(`\n  📁 ${issue.file}`);
      console.log(`     Icons: ${issue.items.join(' ')} (${issue.count} total)`);
    }
    if (allIssues.generic_icons.length > 20) {
      console.log(`\n  ... and ${allIssues.generic_icons.length - 20} more files`);
    }
  }
  
  // Stretched Images
  console.log(`\n\n🖼️  POTENTIAL STRETCHED IMAGES (${allIssues.stretched_images.length} files)`);
  console.log('-'.repeat(60));
  if (allIssues.stretched_images.length === 0) {
    console.log('  ✅ No hardcoded sizes found');
  } else {
    console.log(`  ⚠️  ${allIssues.stretched_images.length} files have potential sizing issues`);
    console.log('     Check these files for fixed-width images');
  }
  
  // Missing Alt Text
  console.log(`\n\n♿ MISSING ALT TEXT (${allIssues.missing_alt.length} files)`);
  console.log('-'.repeat(60));
  if (allIssues.missing_alt.length === 0) {
    console.log('  ✅ All images have alt text');
  } else {
    for (const issue of allIssues.missing_alt.slice(0, 10)) {
      console.log(`  ⚠️  ${issue.file}: ${issue.count} images without alt`);
    }
  }
  
  // Static Images
  console.log(`\n\n📁 STATIC IMAGES (${allIssues.static_images.length} files)`);
  console.log('-'.repeat(60));
  console.log(`  Found ${allIssues.static_images.reduce((sum, i) => sum + i.count, 0)} static image imports`);
  
  // Summary
  console.log(`\n\n${'='.repeat(60)}`);
  console.log('📈 SUMMARY');
  console.log(`${'='.repeat(60)}`);
  console.log(`
  Total files scanned: ${totalFiles}
  
  Hero videos:        ${allIssues.hero_videos.length} files
  Generic icons:      ${allIssues.generic_icons.length} files
  Sizing issues:      ${allIssues.stretched_images.length} files
  Missing alt text:   ${allIssues.missing_alt.length} files
  Static images:      ${allIssues.static_images.length} files
  `);
  
  // Recommendations
  console.log(`${'='.repeat(60)}`);
  console.log('📋 RECOMMENDATIONS');
  console.log(`${'='.repeat(60)}`);
  console.log(`
  1. Replace all generic emojis with actual photos
  2. Use aspect-ratio CSS instead of hardcoded sizes
  3. Add alt text to all images for accessibility
  4. Consider lazy-loading for static images
  5. Use Next.js Image component for optimization
  `);
  
  // Export report
  const report = {
    timestamp: new Date().toISOString(),
    totalFiles,
    issues: allIssues,
  };
  
  await fs.writeFile(
    path.join(rootDir, 'media-audit-report.json'),
    JSON.stringify(report, null, 2)
  );
  
  console.log(`\n✅ Report saved to: media-audit-report.json`);
}

main().catch(console.error);
