#!/usr/bin/env node
/**
 * Generate Hero Videos from Existing Images
 * 
 * Creates MP4 videos from hero images for all programs
 * Videos are 5 seconds with fade in/out
 * 
 * Usage: node scripts/generate-hero-videos.mjs
 */

import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const execAsync = promisify(exec);
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.join(__dirname, '..');

// Program hero image mappings
const HERO_IMAGES = {
  // Beauty programs
  'barber': '/images/beauty/barber-hero.webp',
  'cosmetology': '/images/beauty/cosmetology-hero.webp',
  'esthetics': '/images/beauty/esthetics-hero.webp',
  'nails': '/images/beauty/nails-hero.webp',
  
  // Healthcare programs
  'cna': '/images/pexels/cna.webp',
  'medical-assistant': '/images/pexels/medical-assistant.webp',
  'phlebotomy': '/images/pexels/phlebotomy.webp',
  'pharmacy-technician': '/images/pexels/pharmacy.webp',
  'home-health-aide': '/images/pages/healthcare-classroom.webp',
  
  // Trades programs
  'hvac': '/images/trades/hero-program-hvac.jpg',
  'electrical': '/images/trades/hero-program-electrical.webp',
  'plumbing': '/images/pexels/plumbing.webp',
  'welding': '/images/pexels/welding.webp',
  'cdl': '/images/trades/cdl-hero.webp',
  'diesel': '/images/pexels/diesel.webp',
  'forklift': '/images/pexels/forklift.webp',
  
  // Business/Tech programs
  'business-administration': '/images/pexels/business.webp',
  'bookkeeping': '/images/pexels/bookkeeping.webp',
  'technology': '/images/pexels/webdev.webp',
  'web-development': '/images/pexels/webdev.webp',
  'software-development': '/images/pexels/webdev.webp',
  'cad-drafting': '/images/pexels/webdev.webp',
  'graphic-design': '/images/pexels/webdev.webp',
  'cybersecurity': '/images/pexels/cybersecurity.webp',
  'network-administration': '/images/pexels/network.webp',
  'project-management': '/images/pexels/project.webp',
  
  // Other programs
  'culinary': '/images/pexels/culinary.webp',
  'graduation': '/images/pexels/graduation.webp',
  'apprentice': '/images/pexels/apprentice.webp',
  'employer': '/images/pexels/employer.webp',
};

async function fileExists(filepath) {
  try {
    await fs.access(filepath);
    return true;
  } catch {
    return false;
  }
}

async function generateVideo(programId, imagePath) {
  const inputPath = path.join(rootDir, 'public', imagePath);
  const outputDir = path.join(rootDir, 'public', 'videos', 'heroes');
  const outputPath = path.join(outputDir, `${programId}-hero.mp4`);
  
  // Create output directory
  await fs.mkdir(outputDir, { recursive: true });
  
  // Check if image exists
  if (!(await fileExists(inputPath))) {
    return { programId, imagePath, status: 'missing_image' };
  }
  
  // Check if video already exists
  if (await fileExists(outputPath)) {
    return { programId, imagePath, status: 'already_exists' };
  }
  
  console.log(`📹 ${programId}: ${imagePath} → /videos/heroes/${programId}-hero.mp4`);
  
  // Generate 5-second video with fade effects
  const command = `ffmpeg -y -loop 1 -i "${inputPath}" \
    -vf "scale=1920:1080:force_original_aspect_ratio=decrease,pad=1920:1080:(ow-iw)/2:(oh-ih)/2,fade=t=in:st=0:d=1,fade=t=out:st=4:d=1" \
    -c:v libx264 -preset fast -crf 22 -pix_fmt yuv420p \
    -t 5 \
    -movflags +faststart \
    "${outputPath}"`;
  
  try {
    await execAsync(command, { maxBuffer: 50 * 1024 * 1024, timeout: 60000 });
    return { programId, imagePath, output: `/videos/heroes/${programId}-hero.mp4`, status: 'created' };
  } catch (error) {
    return { programId, imagePath, status: 'error', error: error.message };
  }
}

async function main() {
  console.log('🎬 Generate Hero Videos from Images');
  console.log('='.repeat(50));
  console.log('');
  
  const results = [];
  
  for (const [programId, imagePath] of Object.entries(HERO_IMAGES)) {
    const result = await generateVideo(programId, imagePath);
    results.push(result);
    
    if (result.status === 'created') {
      console.log(`  ✅ Created: ${result.output}`);
    } else if (result.status === 'already_exists') {
      console.log(`  ⏭️  Skipped: already exists`);
    } else if (result.status === 'missing_image') {
      console.log(`  ⚠️  Missing: ${imagePath}`);
    } else {
      console.log(`  ❌ Error: ${result.error}`);
    }
  }
  
  // Summary
  const created = results.filter(r => r.status === 'created').length;
  const skipped = results.filter(r => r.status === 'already_exists').length;
  const missing = results.filter(r => r.status === 'missing_image').length;
  const errors = results.filter(r => r.status === 'error').length;
  
  console.log('\n' + '='.repeat(50));
  console.log('📊 Summary');
  console.log('='.repeat(50));
  console.log(`  ✅ Created: ${created}`);
  console.log(`  ⏭️  Skipped: ${skipped}`);
  console.log(`  ⚠️  Missing images: ${missing}`);
  console.log(`  ❌ Errors: ${errors}`);
  
  // Generate code to update
  console.log('\n📝 Code to update program configs:');
  console.log('```typescript');
  for (const result of results.filter(r => r.status === 'created' || r.status === 'already_exists')) {
    console.log(`// ${result.programId}`);
    console.log(`heroVideo: '/videos/heroes/${result.programId}-hero.mp4',`);
  }
  console.log('```');
  
  console.log('\n✨ Done!');
}

main().catch(console.error);
