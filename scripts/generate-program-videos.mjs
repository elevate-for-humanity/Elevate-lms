#!/usr/bin/env node
/**
 * Generate Program Hero Videos
 * Creates AI-powered hero videos for all program pages
 * 
 * Usage: node scripts/generate-program-videos.mjs
 */

import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const execAsync = promisify(exec);
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Program configurations with video scripts
const PROGRAMS = {
  'barber': {
    title: 'Master the Art of Barbering',
    tagline: 'DOL Registered Apprenticeship',
    script: `Welcome to Elevate for Humanity's Barber Apprenticeship.

Imagine walking into your salon on your very first day. Your mentor welcomes you. Clients begin arriving.

Week after week your skills improve. Month after month your clientele grows.

Learn precision cutting, straight razor shaves, and beard design. Earn while you learn through our DOL-registered apprenticeship.

Program terms and costs are reviewed during enrollment.

Apply today and start your journey.`,
    duration: 45, // seconds
    voice: 'en-US-GuyNeural'
  },
  'cosmetology': {
    title: 'Unlock Your Creative Vision',
    tagline: 'Cosmetology Apprenticeship',
    script: `Welcome to Elevate for Humanity's Cosmetology Apprenticeship.

Transform your passion for beauty into a thriving career. Work alongside professional stylists in real salons, learning hair coloring, cutting, makeup artistry, and more.

Build real skills through supervised workplace learning. Program terms and costs are reviewed during enrollment.

Build your skills, build your confidence, build your future.

Start your cosmetology journey today.`,
    duration: 40,
    voice: 'en-US-JennyNeural'
  },
  'esthetics': {
    title: 'Transform Skin, Transform Lives',
    tagline: 'Esthetics Certification',
    script: `Welcome to Elevate for Humanity's Esthetics Program.

Discover the art of skincare. Learn facials, chemical peels, dermaplaning, and the latest treatments in medical aesthetics.

Work in luxury spas, dermatology offices, or wellness centers. The demand for skilled estheticians has never been higher.

Contact enrollment for current tuition and payment options. Career support is available.

Apply now and begin your transformation.`,
    duration: 38,
    voice: 'en-US-JennyNeural'
  },
  'nail': {
    title: 'Perfect Your Craft',
    tagline: 'Nail Technician Certification',
    script: `Welcome to Elevate for Humanity's Nail Technician Program.

Build real skills in nail care, manicures, pedicures, gel extensions, and nail art. Work in salons, spas, or start your own business.

Quick certification. Flexible schedule. Real career opportunities.

Contact enrollment for current tuition and payment options.

Start building your future today.`,
    duration: 32,
    voice: 'en-US-AriaNeural'
  },
  'cna': {
    title: 'Launch Your Healthcare Career',
    tagline: 'Certified Nursing Assistant',
    script: `Welcome to Elevate for Humanity's CNA Program.

Start a meaningful career in healthcare. Our certified nursing assistant training prepares you for real patient care roles in hospitals, clinics, and care facilities.

Learn vital signs, patient care, and communication skills. Complete your certification and start working in weeks.

This is a self-funded program. Contact enrollment for current tuition and payment options.

Apply today and begin your healthcare journey.`,
    duration: 42,
    voice: 'en-US-JennyNeural'
  },
  'hvac': {
    title: 'Keep the World Comfortable',
    tagline: 'HVAC Technician Training',
    script: `Welcome to Elevate for Humanity's HVAC Program.

Learn heating, ventilation, air conditioning, and refrigeration. The trades need skilled technicians, and the pay reflects it.

Hands-on training. Industry certifications. Real career pathways.

Contact enrollment for current tuition and payment options.

Start your skilled trades career today.`,
    duration: 38,
    voice: 'en-US-GuyNeural'
  },
  'cdl': {
    title: 'Hit the Road to Success',
    tagline: 'CDL Truck Driving Training',
    script: `Welcome to Elevate for Humanity's CDL Training Program.

Earn your commercial driver's license in weeks, not months. Train for Class A or Class B CDL with hands-on driving experience.

The trucking industry needs drivers. Good drivers earn well.

Financial assistance available. Job placement support included.

Apply now and start your driving career.`,
    duration: 36,
    voice: 'en-US-GuyNeural'
  }
};

// Pexels video search terms for each program
const STOCK_VIDEOS = {
  'barber': ['barber shop', 'hair cutting', 'men grooming', 'scissors cutting hair'],
  'cosmetology': ['hair salon', 'hair coloring', 'makeup artist', 'beauty salon'],
  'esthetics': ['spa facial', 'skincare', 'beauty treatment', 'wellness spa'],
  'nail': ['nail salon', 'manicure', 'nail art', 'beauty hands'],
  'cna': ['hospital', 'healthcare', 'nursing', 'medical care'],
  'hvac': ['hvac technician', 'air conditioning', 'heating system', 'trades work'],
  'cdl': ['truck driving', 'semi truck', 'highway driving', 'logistics']
};

async function downloadStockVideo(program, searchTerms) {
  const outputDir = path.join(__dirname, '..', 'public', 'videos', 'programs');
  const outputPath = path.join(outputDir, `${program}-hero.mp4`);
  
  await fs.mkdir(outputDir, { recursive: true });
  
  // For now, we'll use Pexels API to search for videos
  // This requires PEXELS_API_KEY environment variable
  const pexelsKey = process.env.PEXELS_API_KEY;
  
  if (!pexelsKey) {
    console.log(`⚠️  PEXELS_API_KEY not set, skipping stock video download for ${program}`);
    return null;
  }
  
  try {
    // Search for video
    const searchQuery = searchTerms[0];
    const response = await fetch(`https://api.pexels.com/videos/search?query=${encodeURIComponent(searchQuery)}&per_page=5&orientation=landscape`, {
      headers: { 'Authorization': pexelsKey }
    });
    
    if (!response.ok) throw new Error('Pexels API error');
    
    const data = await response.json();
    
    if (data.videos && data.videos.length > 0) {
      // Download the first video (preferably HD)
      const video = data.videos.find(v => v.width >= 1920) || data.videos[0];
      const videoFile = video.video_files.find(f => f.quality === 'hd' || f.width >= 1280) || video.video_files[0];
      
      console.log(`  📥 Downloading stock video: ${video.url}`);
      
      // Download video
      const videoResponse = await fetch(videoFile.link);
      const buffer = await videoResponse.arrayBuffer();
      await fs.writeFile(outputPath, Buffer.from(buffer));
      
      return outputPath;
    }
  } catch (error) {
    console.error(`  ❌ Error downloading stock video:`, error.message);
  }
  
  return null;
}

async function generateTTS(script, program, voice) {
  const outputDir = path.join(__dirname, '..', 'public', 'videos', 'programs');
  const audioPath = path.join(outputDir, `${program}-voiceover.mp3`);
  
  await fs.mkdir(outputDir, { recursive: true });
  
  try {
    console.log(`  🎤 Generating voiceover...`);
    
    // Clean script for TTS
    const cleanScript = script.replace(/\n/g, ' ').replace(/"/g, '\\"');
    
    // Use edge-tts CLI
    const command = `npx edge-tts --voice "${voice}" --text "${cleanScript}" --write-media "${audioPath}"`;
    
    await execAsync(command, {
      maxBuffer: 10 * 1024 * 1024,
      cwd: path.join(__dirname, '..')
    });
    
    console.log(`  ✅ Voiceover saved: ${audioPath}`);
    
    // Get duration
    const { stdout } = await execAsync(
      `ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "${audioPath}"`
    );
    
    return {
      path: audioPath,
      duration: parseFloat(stdout.trim())
    };
  } catch (error) {
    console.error(`  ❌ TTS Error:`, error.message);
    throw error;
  }
}

async function combineVideoAudio(videoPath, audioPath, outputPath) {
  try {
    console.log(`  🎬 Combining video and audio...`);
    
    // Use ffmpeg to:
    // 1. Trim video to match audio duration
    // 2. Add audio
    // 3. Add fade in/out
    // 4. Optimize for web
    
    const command = `ffmpeg -y -i "${videoPath}" -i "${audioPath}" \
      -vf "scale=1920:1080:force_original_aspect_ratio=decrease,pad=1920:1080:(ow-iw)/2:(oh-ih)/2,fade=t=in:st=0:d=1,fade=t=out:st=-1:d=1" \
      -c:v libx264 -preset medium -crf 23 \
      -c:a aac -b:a 128k \
      -shortest \
      "${outputPath}"`;
    
    await execAsync(command, { maxBuffer: 50 * 1024 * 1024 });
    
    console.log(`  ✅ Final video saved: ${outputPath}`);
    return outputPath;
  } catch (error) {
    console.error(`  ❌ Combine Error:`, error.message);
    throw error;
  }
}

async function generateFallbackVideo(program, programData, audioPath) {
  const outputDir = path.join(__dirname, '..', 'public', 'videos', 'programs');
  const outputPath = path.join(outputDir, `${program}-hero.mp4`);
  
  await fs.mkdir(outputDir, { recursive: true });
  
  try {
    console.log(`  🎬 Generating animated hero (no stock video)...`);
    
    // Get audio duration
    let duration = 30;
    try {
      const { stdout } = await execAsync(
        `ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "${audioPath}"`
      );
      duration = Math.ceil(parseFloat(stdout.trim())) + 2;
    } catch {}
    
    // Create a simple gradient/animation video using ffmpeg
    // Using a professional gradient background
    const command = `ffmpeg -y \
      -f lavfi -i "color=c=0x1e3a5f:s=1920x1080:d=${duration}:r=30" \
      -f lavfi -i "color=c=0x2563eb:s=1920x1080:d=${duration}:r=30" \
      -f lavfi -i "color=c=0x3b82f6:s=1920x1080:d=${duration}:r=30" \
      -filter_complex "\
        [0:v][1:v][2:v]blend=all_expr='if(eq(X\,0)\,A\,if(mod(T\,3)\,B\,C))':repeat_last=0[bg];\
        [bg]drawtext=text='${programData.title}':fontsize=72:fontcolor=white:x=(w-text_w)/2:y=h-200:borderw=2:bordercolor=black[out]" \
      -map "[out]" -map 1:a \
      -c:v libx264 -preset fast -crf 22 \
      -c:a copy \
      -t ${duration} \
      "${outputPath}"`;
    
    await execAsync(command, { maxBuffer: 50 * 1024 * 1024 });
    
    console.log(`  ✅ Animated hero generated: ${outputPath}`);
    return outputPath;
  } catch (error) {
    console.error(`  ❌ Fallback Error:`, error.message);
    // Create minimal video
    const command = `ffmpeg -y -f lavfi -i "color=c=0x1e3a5f:s=1920x1080:d=10:r=30" -c:v libx264 -t 10 "${outputPath}"`;
    await execAsync(command);
    return outputPath;
  }
}

async function main() {
  console.log('🚀 Program Hero Video Generator\n');
  console.log('This script will generate hero videos for all programs.\n');
  
  const results = [];
  
  for (const [program, config] of Object.entries(PROGRAMS)) {
    console.log(`\n📹 Processing: ${program.toUpperCase()}`);
    console.log(`   Title: ${config.title}`);
    
    try {
      // Step 1: Download stock video
      let videoPath = await downloadStockVideo(program, STOCK_VIDEOS[program]);
      
      // Step 2: Generate TTS
      const audioResult = await generateTTS(config.script, program, config.voice);
      
      // Step 3: Combine or create fallback
      let finalVideoPath;
      const outputDir = path.join(__dirname, '..', 'public', 'videos', 'programs');
      const finalPath = path.join(outputDir, `${program}-hero.mp4`);
      
      if (videoPath) {
        finalVideoPath = await combineVideoAudio(videoPath, audioResult.path, finalPath);
      } else {
        finalVideoPath = await generateFallbackVideo(program, config, audioResult.path);
      }
      
      results.push({
        program,
        status: 'success',
        videoPath: finalVideoPath,
        config: {
          heroVideo: `/videos/programs/${program}-hero.mp4`,
          voiceoverDuration: audioResult.duration
        }
      });
      
      console.log(`\n   ✅ ${program} hero video complete!`);
      
    } catch (error) {
      console.error(`\n   ❌ Error: ${error.message}`);
      results.push({
        program,
        status: 'failed',
        error: error.message
      });
    }
  }
  
  // Generate config update
  console.log('\n\n📝 Configuration Update:');
  console.log('\nAdd these to your program configs:\n');
  
  console.log('```typescript');
  for (const result of results) {
    if (result.status === 'success') {
      console.log(`// ${result.program}`);
      console.log(`heroVideo: '${result.config.heroVideo}',`);
    }
  }
  console.log('```');
  
  // Summary
  const successful = results.filter(r => r.status === 'success').length;
  const failed = results.filter(r => r.status === 'failed').length;
  
  console.log(`\n\n📊 Summary:`);
  console.log(`   ✅ Successful: ${successful}`);
  console.log(`   ❌ Failed: ${failed}`);
  
  if (failed > 0) {
    console.log('\n⚠️  Failed programs:', results.filter(r => r.status === 'failed').map(r => r.program).join(', '));
  }
  
  console.log('\n✨ Done!');
}

main().catch(console.error);
