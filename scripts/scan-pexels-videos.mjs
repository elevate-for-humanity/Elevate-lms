#!/usr/bin/env node
/**
 * Scan Pexels for Program Videos
 * Find and download stock videos for each program
 * 
 * Requires: PEXELS_API_KEY environment variable
 */

const PEXELS_SEARCH_TERMS = {
  barber: ['barber shop scissors', 'hair cutting men', 'salon grooming', 'barber training'],
  cosmetology: ['hair salon beauty', 'hair coloring', 'makeup artist', 'beauty treatment'],
  esthetics: ['spa facial treatment', 'skincare beauty', 'wellness relaxing', 'facial treatment'],
  nail: ['nail salon manicure', 'nail art beauty', 'hands care', 'pedicure spa'],
  cna: ['hospital nurse care', 'healthcare workers', 'medical nursing', 'patient care'],
  hvac: ['hvac technician work', 'air conditioning repair', 'heating system', 'tradesman'],
  cdl: ['truck driving highway', 'semi truck transport', 'delivery driving', 'logistics']
};

async function searchPexels(apiKey, query, perPage = 5) {
  const response = await fetch(
    `https://api.pexels.com/videos/search?query=${encodeURIComponent(query)}&per_page=${perPage}&orientation=landscape`,
    {
      headers: { 'Authorization': apiKey }
    }
  );
  
  if (!response.ok) {
    throw new Error(`Pexels API error: ${response.status}`);
  }
  
  return response.json();
}

async function downloadVideo(url, outputPath) {
  const response = await fetch(url);
  if (!response.ok) throw new Error('Download failed');
  
  const buffer = await response.arrayBuffer();
  const fs = await import('fs/promises');
  await fs.writeFile(outputPath, Buffer.from(buffer));
  return outputPath;
}

async function main() {
  const apiKey = process.env.PEXELS_API_KEY;
  
  if (!apiKey) {
    console.log('⚠️  PEXELS_API_KEY not set');
    console.log('   Get your free key at: https://www.pexels.com/api/');
    console.log('   Then run: export PEXELS_API_KEY=your_key');
    console.log('\n📋 Manual Pexels search links:');
    
    for (const [program, terms] of Object.entries(PEXELS_SEARCH_TERMS)) {
      const searchUrl = `https://www.pexels.com/search/videos/${encodeURIComponent(terms[0])}/`;
      console.log(`   ${program}: ${searchUrl}`);
    }
    return;
  }
  
  console.log('🔍 Scanning Pexels for program videos...\n');
  
  const results = {};
  
  for (const [program, terms] of Object.entries(PEXELS_SEARCH_TERMS)) {
    console.log(`\n📹 ${program.toUpperCase()}`);
    
    let foundVideo = null;
    
    for (const term of terms) {
      try {
        console.log(`   Searching: "${term}"...`);
        const data = await searchPexels(apiKey, term);
        
        if (data.videos && data.videos.length > 0) {
          // Find HD video
          const hdVideo = data.videos.find(v => v.width >= 1920) || data.videos[0];
          const hdFile = hdVideo.video_files.find(f => f.quality === 'hd') || hdVideo.video_files[0];
          
          if (hdFile) {
            foundVideo = {
              id: hdVideo.id,
              url: hdFile.link,
              duration: hdVideo.duration,
              width: hdFile.width,
              height: hdFile.height,
              user: hdVideo.user.name
            };
            
            console.log(`   ✅ Found: ${hdVideo.duration}s, ${hdFile.width}x${hdFile.height} by ${hdVideo.user.name}`);
            break;
          }
        }
      } catch (error) {
        console.log(`   ❌ Error: ${error.message}`);
      }
    }
    
    results[program] = foundVideo;
    
    if (!foundVideo) {
      console.log(`   ⚠️  No HD video found for ${program}`);
    }
  }
  
  // Summary
  console.log('\n\n📊 Results Summary:');
  console.log('==================');
  
  for (const [program, video] of Object.entries(results)) {
    if (video) {
      console.log(`\n✅ ${program}:`);
      console.log(`   Duration: ${video.duration}s`);
      console.log(`   Resolution: ${video.width}x${video.height}`);
      console.log(`   Creator: ${video.user}`);
      console.log(`   Direct URL: ${video.url}`);
    } else {
      console.log(`\n❌ ${program}: No HD video found`);
    }
  }
  
  // Download instructions
  console.log('\n\n📥 To download videos:');
  console.log('1. Get PEXELS_API_KEY from https://www.pexels.com/api/');
  console.log('2. Export it: export PEXELS_API_KEY=your_key');
  console.log('3. Run: node scripts/download-pexels-videos.mjs');
}

main().catch(console.error);
