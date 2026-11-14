#!/usr/bin/env node
/**
 * Create Videos from Existing Assets
 * 
 * Combines existing hero images with voiceovers to create program videos
 * 
 * Usage: node scripts/create-videos-from-existing.mjs
 */

import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const execAsync = promisify(exec);
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.join(__dirname, '..');

// Program configurations - using EXISTING assets
const PROGRAMS = [
  {
    id: 'barber',
    title: 'Barber Apprenticeship',
    image: 'public/images/beauty/barber-hero.webp',
    audio: 'public/videos/barber-voiceover.mp3',
    output: 'public/videos/programs/barber-hero.mp4',
    searchTerm: 'barber shop scissors'
  },
  {
    id: 'cosmetology',
    title: 'Cosmetology Apprenticeship',
    image: 'public/images/beauty/cosmetology-hero.webp',
    audio: null, // No specific audio, will use generic
    output: 'public/videos/programs/cosmetology-hero.mp4',
    searchTerm: 'hair salon beauty'
  },
  {
    id: 'esthetics',
    title: 'Esthetics Program',
    image: 'public/images/beauty/esthetics-hero.webp',
    audio: null,
    output: 'public/videos/programs/esthetics-hero.mp4',
    searchTerm: 'spa facial treatment'
  },
  {
    id: 'nails',
    title: 'Nail Technician',
    image: 'public/images/beauty/nails-hero.webp',
    audio: null,
    output: 'public/videos/programs/nails-hero.mp4',
    searchTerm: 'nail salon manicure'
  },
  {
    id: 'cna',
    title: 'CNA Program',
    image: 'public/images/programs/cna-hero.webp',
    audio: 'public/videos/cna-welcome.mp3',
    output: 'public/videos/programs/cna-hero.mp4',
    searchTerm: 'hospital nurse healthcare'
  },
  {
    id: 'cdl',
    title: 'CDL Training',
    image: 'public/images/trades/cdl-hero.webp',
    audio: null,
    output: 'public/videos/programs/cdl-hero.mp4',
    searchTerm: 'truck driving highway'
  },
  {
    id: 'hvac',
    title: 'HVAC Training',
    image: 'public/images/trades/hero-program-hvac.jpg',
    audio: null,
    output: 'public/videos/programs/hvac-hero.mp4',
    searchTerm: 'hvac technician'
  }
];

// Demo configurations
const DEMOS = [
  {
    id: 'admin-dashboard',
    title: 'Admin Dashboard Demo',
    audio: 'public/videos/demos/admin-dashboard-voiceover.mp3',
    output: 'public/videos/demos/admin-dashboard.mp4'
  },
  {
    id: 'employer-portal',
    title: 'Employer Portal Demo',
    audio: 'public/videos/demos/employer-portal-voiceover.mp3',
    output: 'public/videos/demos/employer-portal.mp4'
  },
  {
    id: 'lms-overview',
    title: 'LMS Overview Demo',
    audio: 'public/videos/demos/lms-overview-voiceover.mp3',
    output: 'public/videos/demos/lms-overview.mp4'
  }
];

async function fileExists(filepath) {
  try {
    await fs.access(filepath);
    return true;
  } catch {
    return false;
  }
}

async function getAudioDuration(audioPath) {
  try {
    const { stdout } = await execAsync(
      `ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "${audioPath}"`
    );
    return parseFloat(stdout.trim()) || 10;
  } catch {
    return 10;
  }
}

async function createVideoFromImage(program) {
  const outputDir = path.dirname(program.output);
  await fs.mkdir(outputDir, { recursive: true });
  
  // Check if image exists
  if (!(await fileExists(program.image))) {
    console.log(`  ⚠️  Image not found: ${program.image}`);
    return { ...program, status: 'missing_image' };
  }
  
  // Get audio duration if audio exists
  let duration = 30;
  if (program.audio && await fileExists(program.audio)) {
    duration = await getAudioDuration(program.audio);
  }
  
  console.log(`  📊 Duration: ${duration}s`);
  
  // Create video from image + audio
  if (program.audio && await fileExists(program.audio)) {
    // With audio
    console.log(`  🎬 Creating video with audio...`);
    const command = `ffmpeg -y -loop 1 -i "${program.image}" -i "${program.audio}" \
      -vf "scale=1920:1080:force_original_aspect_ratio=decrease,pad=1920:1080:(ow-iw)/2:(oh-ih)/2,fade=t=in:st=0:d=0.5,fade=t=out:st=-2:d=1" \
      -c:v libx264 -preset medium -crf 22 -pix_fmt yuv420p \
      -c:a aac -b:a 128k \
      -shortest \
      -movflags +faststart \
      "${program.output}"`;
    
    try {
      await execAsync(command, { maxBuffer: 100 * 1024 * 1024, timeout: 120000 });
      return { ...program, status: 'success_with_audio' };
    } catch (error) {
      console.log(`  ❌ Video creation failed: ${error.message}`);
      return { ...program, status: 'error', error: error.message };
    }
  } else {
    // Image only (no audio) - use generic audio or silent
    console.log(`  🎬 Creating video without audio...`);
    
    // Create with 5 second duration for image-only videos
    const command = `ffmpeg -y -loop 1 -i "${program.image}" \
      -vf "scale=1920:1080:force_original_aspect_ratio=decrease,pad=1920:1080:(ow-iw)/2:(oh-ih)/2,fade=t=in:st=0:d=1,fade=t=out:st=4:d=1" \
      -c:v libx264 -preset medium -crf 22 -pix_fmt yuv420p \
      -t 5 \
      -movflags +faststart \
      "${program.output}"`;
    
    try {
      await execAsync(command, { maxBuffer: 50 * 1024 * 1024, timeout: 60000 });
      return { ...program, status: 'success_image_only' };
    } catch (error) {
      console.log(`  ❌ Video creation failed: ${error.message}`);
      return { ...program, status: 'error', error: error.message };
    }
  }
}

async function main() {
  console.log('🎬 Create Videos from Existing Assets');
  console.log('='.repeat(50));
  console.log('');
  
  const results = [];
  
  // Check existing assets
  console.log('📁 Checking existing assets...\n');
  
  for (const program of PROGRAMS) {
    const imageExists = await fileExists(program.image);
    const audioExists = program.audio ? await fileExists(program.audio) : false;
    
    console.log(`${program.id.toUpperCase()}`);
    console.log(`  Image: ${imageExists ? '✅' : '❌'} ${program.image}`);
    console.log(`  Audio: ${audioExists ? '✅' : '⚠️'} ${program.audio || 'None'}`);
    
    if (imageExists) {
      console.log(`  📹 Creating video...`);
      const result = await createVideoFromImage(program);
      results.push(result);
      
      if (result.status === 'success_with_audio') {
        console.log(`  ✅ Video created with audio!`);
      } else if (result.status === 'success_image_only') {
        console.log(`  ✅ Video created (image only, 5s)`);
      } else {
        console.log(`  ❌ Failed: ${result.error}`);
      }
    } else {
      results.push({ ...program, status: 'missing_image' });
      console.log(`  ⚠️  Skipping - image not found`);
    }
    
    console.log('');
  }
  
  // Summary
  const successful = results.filter(r => r.status.includes('success')).length;
  const failed = results.filter(r => r.status === 'error').length;
  const missing = results.filter(r => r.status === 'missing_image').length;
  
  console.log('='.repeat(50));
  console.log('📊 SUMMARY');
  console.log('='.repeat(50));
  console.log(`  ✅ Successful: ${successful}`);
  console.log(`  ❌ Failed: ${failed}`);
  console.log(`  ⚠️  Missing images: ${missing}`);
  
  // Show output locations
  console.log('\n📁 Videos created in:');
  for (const result of results) {
    if (result.status.includes('success')) {
      console.log(`  ✅ ${result.output}`);
    }
  }
  
  // Code snippet to use these videos
  console.log('\n📝 Add to your code:');
  console.log('```tsx');
  console.log('const programVideos = {');
  for (const result of results) {
    if (result.status.includes('success')) {
      console.log(`  ${result.id}: '${result.output.replace('public/', '/')}',`);
    }
  }
  console.log('};');
  console.log('```');
  
  console.log('\n✨ Done!');
}

main().catch(console.error);
