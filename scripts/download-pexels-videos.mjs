#!/usr/bin/env node
/**
 * Download Real Videos from Pexels
 * 
 * Downloads actual HD videos for each program
 * No ffmpeg needed - downloads MP4 directly
 * 
 * Usage: node scripts/download-pexels-videos.mjs
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.join(__dirname, '..');

// Your Pexels API key
const PEXELS_API_KEY = 'IJJFHHBQ7lP0Dmn9vDvPWjLrfQTZhmVyWWYou0UD1fnXgkAdXrzdEZpw';

// Program video searches
const PROGRAM_VIDEOS = [
  {
    id: 'barber',
    searches: ['barber shop scissors cutting hair', 'men hair cutting salon', 'barber training styling'],
  },
  {
    id: 'cosmetology',
    searches: ['hair salon coloring styling', 'makeup artist beauty', 'hairdresser cutting'],
  },
  {
    id: 'esthetics',
    searches: ['spa facial treatment skincare', 'beauty salon facial', 'skincare aesthetician'],
  },
  {
    id: 'nails',
    searches: ['nail salon manicure beauty', 'nail art design', 'pedicure spa'],
  },
  {
    id: 'cna',
    searches: ['hospital nurse healthcare', 'medical nursing care', 'healthcare worker patient'],
  },
  {
    id: 'hvac',
    searches: ['hvac technician air conditioning', 'heating cooling system', 'hvac repair'],
  },
  {
    id: 'cdl',
    searches: ['truck driving highway', 'semi truck transport', 'cdl trucker driving'],
  },
  {
    id: 'medical-assistant',
    searches: ['medical assistant healthcare', 'doctor office nurse', 'clinical medical'],
  },
  {
    id: 'phlebotomy',
    searches: ['blood draw medical lab', 'phlebotomist healthcare', 'medical laboratory'],
  },
];

async function searchVideos(query) {
  const response = await fetch(
    `https://api.pexels.com/videos/search?query=${encodeURIComponent(query)}&per_page=5&orientation=landscape&hd=true`,
    {
      headers: { 'Authorization': PEXELS_API_KEY }
    }
  );
  
  if (!response.ok) {
    throw new Error(`Pexels API error: ${response.status}`);
  }
  
  return response.json();
}

async function downloadFile(url, outputPath) {
  console.log(`  Downloading from: ${url.substring(0, 80)}...`);
  
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Download failed: ${response.status}`);
  
  const buffer = await response.arrayBuffer();
  await fs.writeFile(outputPath, Buffer.from(buffer));
  
  const stats = await fs.stat(outputPath);
  const sizeMB = (stats.size / (1024 * 1024)).toFixed(2);
  console.log(`  ✅ Saved: ${sizeMB} MB`);
  
  return outputPath;
}

async function main() {
  console.log('🎬 Download Program Videos from Pexels');
  console.log('='.repeat(50));
  console.log('');
  
  const outputDir = path.join(rootDir, 'public', 'videos', 'programs');
  await fs.mkdir(outputDir, { recursive: true });
  
  const results = [];
  
  for (const program of PROGRAM_VIDEOS) {
    console.log(`\n📹 ${program.id.toUpperCase()}`);
    
    let downloaded = false;
    
    for (const search of program.searches) {
      if (downloaded) break;
      
      try {
        console.log(`  🔍 Searching: "${search}"`);
        const data = await searchVideos(search);
        
        if (data.videos && data.videos.length > 0) {
          // Find HD video
          const video = data.videos.find(v => v.width >= 1280) || data.videos[0];
          
          // Find best quality file
          const hdFile = video.video_files.find(f => f.quality === 'hd' && f.file_type.includes('mp4'));
          const sdFile = video.video_files.find(f => f.file_type.includes('mp4'));
          const bestFile = hdFile || sdFile;
          
          if (bestFile) {
            const outputPath = path.join(outputDir, `${program.id}-hero.mp4`);
            
            try {
              await downloadFile(bestFile.link, outputPath);
              downloaded = true;
              
              results.push({
                id: program.id,
                status: 'success',
                path: `/videos/programs/${program.id}-hero.mp4`,
                photographer: video.user.name,
                duration: video.duration,
              });
            } catch (err) {
              console.log(`  ⚠️ Download failed: ${err.message}`);
            }
          }
        } else {
          console.log(`  ⚠️ No videos found`);
        }
      } catch (err) {
        console.log(`  ❌ Error: ${err.message}`);
      }
    }
    
    if (!downloaded) {
      results.push({
        id: program.id,
        status: 'failed',
        error: 'No suitable video found',
      });
    }
  }
  
  // Summary
  console.log('\n' + '='.repeat(50));
  console.log('📊 RESULTS');
  console.log('='.repeat(50));
  
  const successful = results.filter(r => r.status === 'success');
  const failed = results.filter(r => r.status === 'failed');
  
  console.log(`\n✅ Successful: ${successful.length}`);
  console.log(`❌ Failed: ${failed.length}`);
  
  if (successful.length > 0) {
    console.log('\n📁 Videos saved to: public/videos/programs/');
    console.log('\n📝 Update your configs:');
    console.log('```typescript');
    for (const r of successful) {
      console.log(`// ${r.id}`);
      console.log(`heroVideo: '${r.path}',`);
    }
    console.log('```');
  }
  
  if (failed.length > 0) {
    console.log('\n⚠️ Failed programs:', failed.map(r => r.id).join(', '));
  }
  
  console.log('\n✨ Done!');
}

main().catch(console.error);
