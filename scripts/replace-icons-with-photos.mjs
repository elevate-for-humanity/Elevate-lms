#!/usr/bin/env node
/**
 * Replace Generic Icons with Photos from Pexels
 * 
 * Usage:
 *   PEXELS_API_KEY=your_key node scripts/replace-icons-with-photos.mjs
 * 
 * This script will:
 * 1. Find all generic icons/emojis in components
 * 2. Search Pexels for relevant photos
 * 3. Download and optimize photos
 * 4. Generate code snippets to replace icons
 */

import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const execAsync = promisify(exec);
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.join(__dirname, '..');

const PEXELS_API_KEY = process.env.PEXELS_API_KEY || 'IJJFHHBQ7lP0Dmn9vDvPWjLrfQTZhmVyWWYou0UD1fnXgkAdXrzdEZpw';

// Icon to photo mappings
const ICON_REPLACEMENTS = [
  { icon: '📚', search: 'books education learning', category: 'education' },
  { icon: '👨‍🏫', search: 'teacher instructor professional', category: 'instructor' },
  { icon: '💼', search: 'briefcase business professional', category: 'career' },
  { icon: '🏆', search: 'trophy award success achievement', category: 'success' },
  { icon: '🎯', search: 'target goal achievement success', category: 'goals' },
  { icon: '📈', search: 'growth chart business success', category: 'growth' },
  { icon: '💡', search: 'lightbulb idea innovation creative', category: 'idea' },
  { icon: '🔧', search: 'tools wrench repair technician', category: 'tools' },
  { icon: '⚙️', search: 'gear machinery technical industry', category: 'technical' },
  { icon: '✂️', search: 'scissors barber hair cutting', category: 'barber' },
  { icon: '💇', search: 'hair salon styling beauty', category: 'hair' },
  { icon: '💅', search: 'nail salon manicure beauty', category: 'nails' },
  { icon: '👩‍⚕️', search: 'nurse healthcare medical', category: 'healthcare' },
  { icon: '🏥', search: 'hospital medical healthcare building', category: 'hospital' },
  { icon: '🚛', search: 'truck driving CDL logistics', category: 'trucking' },
  { icon: '❄️', search: 'hvac air conditioning cooling', category: 'hvac' },
  { icon: '🎓', search: 'graduation cap diploma education', category: 'graduation' },
  { icon: '🤝', search: 'handshake partnership business', category: 'partnership' },
  { icon: '💰', search: 'money finance funding investment', category: 'money' },
  { icon: '📞', search: 'phone call contact support', category: 'contact' },
  { icon: '📧', search: 'email letter communication', category: 'email' },
  { icon: '🏠', search: 'home house building', category: 'home' },
  { icon: '👥', search: 'group team people community', category: 'community' },
  { icon: '✅', search: 'checkmark success done complete', category: 'check' },
  { icon: '⭐', search: 'star rating review', category: 'star' },
  { icon: '🔥', search: 'fire flame hot', category: 'fire' },
  { icon: '💪', search: 'strength muscle fitness', category: 'strength' },
  { icon: '🌟', search: 'sparkle shine glitter', category: 'sparkle' },
  { icon: '🚀', search: 'rocket launch success', category: 'rocket' },
  { icon: '💻', search: 'laptop computer technology', category: 'tech' },
];

async function searchPexels(query) {
  const response = await fetch(
    `https://api.pexels.com/videos/search?query=${encodeURIComponent(query)}&per_page=3&orientation=landscape`,
    {
      headers: { 'Authorization': PEXELS_API_KEY }
    }
  );
  
  if (!response.ok) throw new Error(`Pexels API error: ${response.status}`);
  
  return response.json();
}

async function searchPhotos(query) {
  const response = await fetch(
    `https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&per_page=3&orientation=landscape`,
    {
      headers: { 'Authorization': PEXELS_API_KEY }
    }
  );
  
  if (!response.ok) throw new Error(`Pexels API error: ${response.status}`);
  
  return response.json();
}

async function downloadPhoto(url, outputPath) {
  const response = await fetch(url);
  if (!response.ok) throw new Error('Download failed');
  
  const buffer = await response.arrayBuffer();
  await fs.writeFile(outputPath, Buffer.from(buffer));
  return outputPath;
}

async function optimizeImage(inputPath, outputPath, width = 400) {
  try {
    // Use ffmpeg to resize and optimize
    const command = `ffmpeg -y -i "${inputPath}" -vf "scale=${width}:-1:force_original_aspect_ratio=decrease" -q:v 2 -c:a copy "${outputPath}"`;
    await execAsync(command, { maxBuffer: 50 * 1024 * 1024 });
    return outputPath;
  } catch {
    // If optimization fails, just copy
    await fs.copyFile(inputPath, outputPath);
    return outputPath;
  }
}

async function main() {
  console.log('🖼️  Icon to Photo Replacement Generator');
  console.log('='.repeat(50));
  console.log('');
  
  const outputDir = path.join(rootDir, 'public', 'images', 'icons');
  await fs.mkdir(outputDir, { recursive: true });
  
  const replacements = [];
  
  for (const item of ICON_REPLACEMENTS) {
    console.log(`\n${item.icon} Searching for: "${item.search}"`);
    
    try {
      // Search for photos
      const photoData = await searchPhotos(item.search);
      
      if (photoData.photos && photoData.photos.length > 0) {
        const photo = photoData.photos[0];
        const outputPath = path.join(outputDir, `icon-${item.category}.jpg`);
        
        console.log(`  ✅ Found photo by ${photo.photographer}`);
        
        // Download original
        const downloadPath = outputPath + '.orig.jpg';
        await downloadPhoto(photo.src.large2 || photo.src.large, downloadPath);
        
        // Optimize
        await optimizeImage(downloadPath, outputPath, 400);
        
        // Clean up original
        await fs.unlink(downloadPath).catch(() => {});
        
        replacements.push({
          icon: item.icon,
          category: item.category,
          photoPath: `/images/icons/icon-${item.category}.jpg`,
          photographer: photo.photographer,
          photographerUrl: photo.photographer_url,
          searchTerm: item.search
        });
        
        console.log(`  📥 Saved: ${outputPath}`);
      } else {
        console.log(`  ⚠️  No photo found`);
        replacements.push({
          icon: item.icon,
          category: item.category,
          status: 'no_photo_found',
          searchTerm: item.search
        });
      }
    } catch (error) {
      console.log(`  ❌ Error: ${error.message}`);
      replacements.push({
        icon: item.icon,
        category: item.category,
        status: 'error',
        error: error.message
      });
    }
  }
  
  // Generate replacement guide
  console.log('\n\n' + '='.repeat(50));
  console.log('📋 REPLACEMENT GUIDE');
  console.log('='.repeat(50));
  
  console.log('\n```tsx');
  for (const r of replacements.filter(r => r.photoPath)) {
    console.log(`// Replace ${r.icon} with:`);
    console.log(`<img src="${r.photoPath}" alt="${r.category}" />`);
    console.log('');
  }
  console.log('```');
  
  // Generate React component
  const iconComponent = `// Generated icon components
// Replace generic emojis with these optimized photo components

export const IconPhotos = {
${replacements.filter(r => r.photoPath).map(r => `  '${r.category}': '/images/icons/icon-${r.category}.jpg',`).join('\n')}
};

// Usage example:
// import { IconPhotos } from '@/components/icons/IconPhotos';
// <img src={IconPhotos.barber} alt="barber" className="w-8 h-8" />
`;

  const componentPath = path.join(rootDir, 'components', 'icons', 'IconPhotos.ts');
  await fs.mkdir(path.dirname(componentPath), { recursive: true });
  await fs.writeFile(componentPath, iconComponent);
  console.log(`\n✅ Component saved: ${componentPath}`);
  
  // Save results
  const resultsPath = path.join(rootDir, 'icon-replacements.json');
  await fs.writeFile(resultsPath, JSON.stringify({
    replacements,
    generated: new Date().toISOString()
  }, null, 2));
  
  console.log(`\n✨ Done! ${replacements.filter(r => r.photoPath).length}/${replacements.length} icons downloaded.`);
}

main().catch(console.error);
