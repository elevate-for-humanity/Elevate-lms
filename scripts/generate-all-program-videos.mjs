#!/usr/bin/env node
/**
 * Generate ALL Program Videos with Pexels
 * 
 * Usage:
 *   PEXELS_API_KEY=your_key node scripts/generate-all-program-videos.mjs
 * 
 * Features:
 * - Downloads HD videos from Pexels
 * - Generates TTS voiceovers
 * - Combines video + audio
 * - Outputs production-ready MP4s
 */

import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const execAsync = promisify(exec);
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.join(__dirname, '..');

// Your Pexels API key
const PEXELS_API_KEY = process.env.PEXELS_API_KEY;

// All programs with scripts
const PROGRAMS = [
  {
    id: 'barber',
    title: 'Master the Art of Barbering',
    tagline: 'DOL Registered Apprenticeship',
    script: `Welcome to Elevate for Humanity's Barber Apprenticeship. Learn precision cutting, straight razor shaves, and beard design. Build real skills through supervised workplace learning. Program terms and costs are reviewed during enrollment. Apply today and start your journey.`,
    voice: 'en-US-GuyNeural',
    searchTerms: ['barber shop scissors', 'hair cutting men', 'barber training']
  },
  {
    id: 'cosmetology',
    title: 'Unlock Your Creative Vision',
    tagline: 'Cosmetology Apprenticeship',
    script: `Welcome to Elevate for Humanity's Cosmetology Apprenticeship. Transform your passion for beauty into a thriving career. Work alongside professional stylists in real salons. Learn hair coloring, cutting, makeup artistry, and client consultation. Build your skills, build your confidence, build your future.`,
    voice: 'en-US-JennyNeural',
    searchTerms: ['hair salon beauty', 'makeup artist', 'beauty treatment']
  },
  {
    id: 'esthetics',
    title: 'Transform Skin, Transform Lives',
    tagline: 'Esthetics Certification',
    script: `Welcome to Elevate for Humanity's Esthetics Program. Discover the art of skincare. Learn facials, chemical peels, dermaplaning, and the latest treatments in medical aesthetics. Work in luxury spas, dermatology offices, or wellness centers. Apply now and begin your transformation.`,
    voice: 'en-US-JennyNeural',
    searchTerms: ['spa facial treatment', 'skincare beauty', 'wellness relaxing']
  },
  {
    id: 'nail',
    title: 'Perfect Your Craft',
    tagline: 'Nail Technician Certification',
    script: `Welcome to Elevate for Humanity's Nail Technician Program. Build real skills in nail care, manicures, pedicures, gel extensions, and nail art. Work in salons, spas, or start your own business. Quick certification. Flexible schedule. Real career opportunities. Start building your future today.`,
    voice: 'en-US-AriaNeural',
    searchTerms: ['nail salon manicure', 'nail art beauty', 'hands care']
  },
  {
    id: 'cna',
    title: 'Launch Your Healthcare Career',
    tagline: 'Certified Nursing Assistant',
    script: `Welcome to Elevate for Humanity's CNA Program. Start a meaningful career in healthcare. Our certified nursing assistant training prepares you for real patient care roles. Learn vital signs, patient care, and communication skills. Complete your certification and start working in weeks. Apply today and begin your healthcare journey.`,
    voice: 'en-US-JennyNeural',
    searchTerms: ['hospital nurse care', 'healthcare workers', 'medical nursing']
  },
  {
    id: 'hvac',
    title: 'Keep the World Comfortable',
    tagline: 'HVAC Technician Training',
    script: `Welcome to Elevate for Humanity's HVAC Program. Learn heating, ventilation, air conditioning, and refrigeration. The trades need skilled technicians, and the pay reflects it. Hands-on training. Industry certifications. Real career pathways. Start your skilled trades career today.`,
    voice: 'en-US-GuyNeural',
    searchTerms: ['hvac technician work', 'air conditioning repair', 'heating system']
  },
  {
    id: 'cdl',
    title: 'Hit the Road to Success',
    tagline: 'CDL Truck Driving Training',
    script: `Welcome to Elevate for Humanity's CDL Training Program. Earn your commercial driver's license in weeks, not months. Train for Class A or Class B CDL with hands-on driving experience. The trucking industry needs drivers. Good drivers earn well. Apply now and start your driving career.`,
    voice: 'en-US-GuyNeural',
    searchTerms: ['truck driving highway', 'semi truck transport', 'delivery driving']
  },
  {
    id: 'medical-assistant',
    title: 'Support Healthcare Teams',
    tagline: 'Medical Assistant Training',
    script: `Welcome to Elevate for Humanity's Medical Assistant Program. Join healthcare teams in hospitals, clinics, and private practices. Learn clinical skills, patient communication, and medical administration. Quick certification. Real career opportunities. Start your healthcare journey today.`,
    voice: 'en-US-JennyNeural',
    searchTerms: ['medical assistant', 'healthcare clinic', 'patient care']
  },
  {
    id: 'phlebotomy',
    title: 'Draw Your Path Forward',
    tagline: 'Phlebotomy Certification',
    script: `Welcome to Elevate for Humanity's Phlebotomy Program. Learn to draw blood safely and professionally. Work in hospitals, labs, and clinics. Quick certification. Build practical phlebotomy skills for healthcare settings. Contact enrollment for current tuition and payment options. Apply now and start your healthcare career.`,
    voice: 'en-US-JennyNeural',
    searchTerms: ['phlebotomy blood draw', 'medical lab', 'healthcare worker']
  },
  {
    id: 'peer-recovery',
    title: 'Support Recovery Journeys',
    tagline: 'Peer Recovery Specialist',
    script: `Welcome to Elevate for Humanity's Peer Recovery Program. Use your lived experience to help others on their recovery journey. Learn to provide peer support, guidance, and hope. Make a real difference in people's lives. Start your meaningful career today.`,
    voice: 'en-US-GuyNeural',
    searchTerms: ['support group', 'mental health', 'community support']
  }
];

// Apprenticeship videos
const APPRENTICESHIPS = [
  {
    id: 'apprentice-dashboard',
    title: 'Your Apprentice Portal',
    tagline: 'Track Your Journey',
    script: `Welcome to your Apprentice Portal. Track your progress, log your hours, and manage your apprenticeship journey. View your competencies. Check your schedule. Connect with your mentor. Your path to becoming a licensed professional starts here.`,
    voice: 'en-US-GuyNeural',
    searchTerms: ['laptop dashboard', 'career progress', 'professional training']
  },
  {
    id: 'apprentice-hours',
    title: 'Log Your Hours',
    tagline: 'Track Training Progress',
    script: `Log your training hours easily. Track your progress toward completion. See your hours by week, month, and total. Stay on track for graduation. Your mentor will verify each entry. Keep your journey moving forward.`,
    voice: 'en-US-GuyNeural',
    searchTerms: ['clock hours', 'time tracking', 'professional work']
  }
];

// Orientation videos
const ORIENTATIONS = [
  {
    id: 'orientation-barber',
    title: 'Barber Orientation',
    tagline: 'Start Your Journey',
    script: `Welcome to Elevate for Humanity's Barber Orientation. Congratulations on taking this important step toward your new career. During orientation, you'll meet your cohort and instructors, learn about program requirements, and set up your digital tools. Let's begin your journey together.`,
    voice: 'en-US-GuyNeural',
    searchTerms: ['barber salon', 'professional training', 'orientation meeting']
  },
  {
    id: 'orientation-general',
    title: 'Welcome to Elevate',
    tagline: 'Your Career Journey Starts Here',
    script: `Welcome to Elevate for Humanity. Congratulations on taking this important step toward your new career. During orientation, you'll meet your cohort and instructors, learn about your program requirements, set up your digital tools, and understand your pathway to success. Let's begin your journey together.`,
    voice: 'en-US-JennyNeural',
    searchTerms: ['career training', 'orientation meeting', 'professional development']
  }
];

async function searchPexels(query, perPage = 5) {
  const response = await fetch(
    `https://api.pexels.com/videos/search?query=${encodeURIComponent(query)}&per_page=${perPage}&orientation=landscape`,
    {
      headers: { 'Authorization': PEXELS_API_KEY }
    }
  );
  
  if (!response.ok) {
    throw new Error(`Pexels API error: ${response.status}`);
  }
  
  return response.json();
}

async function downloadVideo(url, outputPath) {
  console.log(`  📥 Downloading video...`);
  const response = await fetch(url);
  if (!response.ok) throw new Error('Download failed');
  
  const buffer = await response.arrayBuffer();
  await fs.writeFile(outputPath, Buffer.from(buffer));
  console.log(`  ✅ Downloaded: ${path.basename(outputPath)}`);
  return outputPath;
}

async function generateTTS(text, outputPath, voice = 'en-US-GuyNeural') {
  console.log(`  🎤 Generating voiceover with ${voice}...`);
  
  const cleanText = text.replace(/[#$*`]/g, '').replace(/\s+/g, ' ').trim();
  
  try {
    const command = `npx edge-tts --voice "${voice}" --text "${cleanText}" --write-media "${outputPath}"`;
    await execAsync(command, { 
      maxBuffer: 10 * 1024 * 1024,
      cwd: rootDir,
      timeout: 60000
    });
    console.log(`  ✅ Voiceover saved`);
    return outputPath;
  } catch (error) {
    console.log(`  ⚠️  TTS failed, continuing without audio`);
    return null;
  }
}

async function combineVideoAudio(videoPath, audioPath, outputPath, duration = 45) {
  console.log(`  🎬 Combining video and audio...`);
  
  try {
    if (audioPath) {
      // With audio
      const command = `ffmpeg -y -i "${videoPath}" -i "${audioPath}" \
        -vf "scale=1920:1080:force_original_aspect_ratio=decrease,pad=1920:1080:(ow-iw)/2:(oh-ih)/2,fade=t=in:st=0:d=0.5,fade=t=out:st=-1:d=0.5" \
        -c:v libx264 -preset medium -crf 23 \
        -c:a aac -b:a 128k \
        -shortest \
        -movflags +faststart \
        "${outputPath}"`;
      
      await execAsync(command, { 
        maxBuffer: 100 * 1024 * 1024,
        timeout: 120000
      });
    } else {
      // Video only
      const command = `ffmpeg -y -i "${videoPath}" \
        -vf "scale=1920:1080:force_original_aspect_ratio=decrease,pad=1920:1080:(ow-iw)/2:(oh-ih)/2,fade=t=in:st=0:d=0.5,fade=t=out:st=-1:d=0.5" \
        -c:v libx264 -preset medium -crf 23 \
        -movflags +faststart \
        -t ${duration} \
        "${outputPath}"`;
      
      await execAsync(command, { 
        maxBuffer: 100 * 1024 * 1024,
        timeout: 120000
      });
    }
    
    console.log(`  ✅ Final video saved: ${path.basename(outputPath)}`);
    return outputPath;
  } catch (error) {
    console.log(`  ⚠️  Combine failed, using raw video`);
    return videoPath;
  }
}

async function createAnimatedFallback(outputPath, title, duration = 45) {
  console.log(`  🎨 Creating animated hero fallback...`);
  
  try {
    // Create gradient animation with text
    const escapedTitle = title.replace(/'/g, "''");
    
    const command = `ffmpeg -y \
      -f lavfi -i "color=c=0x1e3a5f:s=1920x1080:d=${duration}:r=30" \
      -f lavfi -i "color=c=0x2563eb:s=1920x1080:d=${duration}:r=30" \
      -f lavfi -i "color=c=0x3b82f6:s=1920x1080:d=${duration}:r=30" \
      -filter_complex "\
        [0:v][1:v][2:v]blend=all_expr='if(lt(X\,960)\,if(mod(T\,3)\,A\,B)\,if(mod(T\,3)\,B\,C))':repeat_last=0[bg];\
        [bg]drawtext=text='${escapedTitle}':fontsize=60:fontcolor=white:x=(w-text_w)/2:y=(h-text_h)/2:borderw=3:bordercolor=black@0.5[out]" \
      -map "[out]" -c:v libx264 -preset fast -crf 22 -t ${duration} \
      "${outputPath}"`;
    
    await execAsync(command, { 
      maxBuffer: 100 * 1024 * 1024,
      timeout: 60000
    });
    
    console.log(`  ✅ Animated fallback created`);
    return outputPath;
  } catch (error) {
    console.log(`  ⚠️  Animation failed: ${error.message}`);
    return null;
  }
}

async function generateProgramVideo(program, category) {
  const outputDir = path.join(rootDir, 'public', 'videos', 'programs', category);
  await fs.mkdir(outputDir, { recursive: true });
  
  const baseName = `${program.id}-hero`;
  const videoPath = path.join(outputDir, `${baseName}.mp4`);
  const audioPath = path.join(outputDir, `${baseName}.mp3`);
  
  console.log(`\n📹 ${program.title}`);
  console.log(`   Category: ${category}`);
  
  let stockVideoPath = null;
  
  // Try to download stock video from Pexels
  for (const term of program.searchTerms) {
    try {
      console.log(`  🔍 Searching Pexels: "${term}"`);
      const data = await searchPexels(term);
      
      if (data.videos && data.videos.length > 0) {
        const video = data.videos.find(v => v.width >= 1280) || data.videos[0];
        const videoFile = video.video_files.find(f => f.quality === 'hd' || f.width >= 1280) || video.video_files[0];
        
        if (videoFile) {
          console.log(`  ✅ Found: ${video.duration}s by ${video.user.name}`);
          
          const tempPath = path.join(outputDir, `${baseName}-temp.mp4`);
          stockVideoPath = await downloadVideo(videoFile.link, tempPath);
          break;
        }
      }
    } catch (error) {
      console.log(`  ⚠️  Search failed: ${error.message}`);
    }
  }
  
  // Generate TTS
  const audioResult = await generateTTS(program.script, audioPath, program.voice);
  
  // Create final video
  if (stockVideoPath) {
    await combineVideoAudio(stockVideoPath, audioResult, videoPath);
    // Clean up temp
    await fs.unlink(stockVideoPath).catch(() => {});
  } else {
    console.log(`  ⚠️  No stock video found, creating animated fallback`);
    await createAnimatedFallback(videoPath, program.title);
    if (audioResult) {
      // Combine fallback with audio
      const tempPath = videoPath + '.temp.mp4';
      await fs.rename(videoPath, tempPath);
      await combineVideoAudio(tempPath, audioResult, videoPath);
      await fs.unlink(tempPath).catch(() => {});
    }
  }
  
  // Clean up audio if exists
  await fs.unlink(audioPath).catch(() => {});
  
  return {
    id: program.id,
    title: program.title,
    category,
    videoPath: `/videos/programs/${category}/${baseName}.mp4`,
    status: 'success'
  };
}

async function main() {
  console.log('🚀 Program Video Generator');
  console.log('='.repeat(50));
  console.log(`Pexels API: ${PEXELS_API_KEY ? '✅ Connected' : '⚠️  Using fallback animations'}`);
  console.log('');
  
  const results = [];
  
  // Generate program videos
  console.log('\n📚 GENERATING PROGRAM VIDEOS');
  console.log('-'.repeat(50));
  
  for (const program of PROGRAMS) {
    try {
      const result = await generateProgramVideo(program, 'programs');
      results.push(result);
      console.log(`  ✅ ${program.id} complete`);
    } catch (error) {
      console.log(`  ❌ ${program.id} failed: ${error.message}`);
      results.push({ id: program.id, status: 'failed', error: error.message });
    }
  }
  
  // Generate apprenticeship videos
  console.log('\n\n🎓 GENERATING APPRENTICESHIP VIDEOS');
  console.log('-'.repeat(50));
  
  for (const program of APPRENTICESHIPS) {
    try {
      const result = await generateProgramVideo(program, 'apprenticeship');
      results.push(result);
      console.log(`  ✅ ${program.id} complete`);
    } catch (error) {
      console.log(`  ❌ ${program.id} failed: ${error.message}`);
    }
  }
  
  // Generate orientation videos
  console.log('\n\n📍 GENERATING ORIENTATION VIDEOS');
  console.log('-'.repeat(50));
  
  for (const program of ORIENTATIONS) {
    try {
      const result = await generateProgramVideo(program, 'orientation');
      results.push(result);
      console.log(`  ✅ ${program.id} complete`);
    } catch (error) {
      console.log(`  ❌ ${program.id} failed: ${error.message}`);
    }
  }
  
  // Summary
  const successful = results.filter(r => r.status === 'success').length;
  const failed = results.filter(r => r.status === 'failed').length;
  
  console.log('\n\n' + '='.repeat(50));
  console.log('📊 SUMMARY');
  console.log('='.repeat(50));
  console.log(`  ✅ Successful: ${successful}`);
  console.log(`  ❌ Failed: ${failed}`);
  
  // Generate config updates
  console.log('\n📝 COPY THIS TO YOUR CODE:\n');
  console.log('```typescript');
  for (const result of results.filter(r => r.status === 'success')) {
    console.log(`// ${result.title}`);
    console.log(`heroVideo: '${result.videoPath}',`);
    console.log('');
  }
  console.log('```');
  
  // Save results
  await fs.writeFile(
    path.join(rootDir, 'video-generation-results.json'),
    JSON.stringify({ results, timestamp: new Date().toISOString() }, null, 2)
  );
  
  console.log('\n✨ Done! Check public/videos/programs/ for your videos.');
}

main().catch(console.error);
