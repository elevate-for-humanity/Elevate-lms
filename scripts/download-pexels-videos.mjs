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

// Program video searches - remaining programs
const PROGRAM_VIDEOS = [
  {
    id: 'business-administration',
    searches: ['business meeting office work', 'professional business team', 'office work typing'],
  },
  {
    id: 'bookkeeping',
    searches: ['accounting office work', 'bookkeeping finance computer', 'office accounting'],
  },
  {
    id: 'technology',
    searches: ['computer programming coding', 'software developer working', 'tech work laptop'],
  },
  {
    id: 'cybersecurity',
    searches: ['cybersecurity computer work', 'network security monitoring', 'tech security analyst'],
  },
  {
    id: 'network-administration',
    searches: ['network administrator IT', 'computer networking server', 'IT infrastructure work'],
  },
  {
    id: 'web-development',
    searches: ['web developer coding', 'programming computer screen', 'software development'],
  },
  {
    id: 'software-development',
    searches: ['software engineer coding', 'programming code screen', 'developer working'],
  },
  {
    id: 'graphic-design',
    searches: ['graphic designer creative', 'design work computer', 'creative designer art'],
  },
  {
    id: 'cad-drafting',
    searches: ['CAD drafting design', 'engineering blueprint', 'technical drawing work'],
  },
  {
    id: 'project-management',
    searches: ['project manager planning', 'business meeting team', 'project planning work'],
  },
  {
    id: 'culinary',
    searches: ['chef cooking kitchen', 'culinary arts cooking', 'professional kitchen food'],
  },
  {
    id: 'welding',
    searches: ['welding torch industrial', 'welder metal work', 'fabrication welding'],
  },
  {
    id: 'plumbing',
    searches: ['plumber plumbing work', 'pipe fitting repair', 'construction plumbing'],
  },
  {
    id: 'electrical',
    searches: ['electrician electrical work', 'wiring construction', 'electrical technician'],
  },
  {
    id: 'diesel',
    searches: ['diesel mechanic repair', 'truck mechanic workshop', 'diesel engine repair'],
  },
  {
    id: 'forklift',
    searches: ['warehouse forklift driving', 'forklift operator warehouse', 'warehouse logistics'],
  },
  {
    id: 'pharmacy-technician',
    searches: ['pharmacy technician work', 'pharmacist dispensing', 'medical pharmacy'],
  },
  {
    id: 'home-health-aide',
    searches: ['home health aide care', 'elderly care assistance', 'caregiver home care'],
  },
  {
    id: 'emergency-health-safety',
    searches: ['emergency medical responder', 'first aid emergency care', 'EMT paramedic'],
  },
  {
    id: 'graduation',
    searches: ['graduation ceremony students', 'college graduation cap', 'graduates success'],
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
