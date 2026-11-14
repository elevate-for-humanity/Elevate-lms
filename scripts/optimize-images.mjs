#!/usr/bin/env node

/**
 * Image Optimization Script
 * Upscales low-resolution images to professional standards
 */

import { execSync } from 'child_process';
import { readdirSync, statSync, existsSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Target resolutions
const TARGETS = {
  team: { width: 1200, height: 800 },
  portfolio: { width: 800, height: 800 },
  hero: { width: 1920, height: 1080 },
};

// Low-res images found
const LOW_RES_IMAGES = {
  team: [
    './public/images/team-new/team-2.jpg',
    './public/images/team-new/team-4.jpg',
    './public/images/team-new/team-6.jpg',
    './public/images/team-new/team-8.jpg',
    './public/images/team-new/team-10.jpg',
    './public/images/team-new/team-12.jpg',
  ],
  portfolio: [
    './public/images/split/piece-1.png',
    './public/images/split/piece-2.png',
    './public/images/split/piece-4.png',
    './public/images/split/piece-5.png',
    './public/images/split/piece-6.png',
    './public/images/split/piece-7.png',
    './public/images/split/piece-9.png',
    './public/images/split/piece-10.png',
    './public/images/split/piece-11.png',
    './public/images/split/piece-12.png',
    './public/images/split/piece-13.png',
    './public/images/split/piece-14.png',
    './public/images/split/piece-15.png',
    './public/images/split/piece-16.png',
    './public/images/split/piece-17.png',
    './public/images/split/piece-18.png',
  ],
  hero: ['./public/images/heroes/programs/healthcare/hero-program-cna.jpg'],
};

function checkImageMagick() {
  try {
    execSync('convert -version', { stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
}

function upscaleImage(inputPath, targetWidth, targetHeight) {
  try {
    // Create backup
    const backupPath = inputPath.replace(/\.(jpg|png)$/, '.backup.$1');
    execSync(`cp "${inputPath}" "${backupPath}"`);

    // Upscale with Lanczos filter (best quality)
    execSync(
      `convert "${inputPath}" -filter Lanczos -resize ${targetWidth}x${targetHeight}^ -gravity center -extent ${targetWidth}x${targetHeight} "${inputPath}"`,
      { stdio: 'inherit' },
    );

    return true;
  } catch (error) {
    console.error(`❌ Failed to upscale ${inputPath}:`, error.message);
    return false;
  }
}

function generatePlaceholder(outputPath, width, height, text) {
  try {
    // Create directory if needed
    const dir = dirname(outputPath);
    if (!existsSync(dir)) {
      mkdirSync(dir, { recursive: true });
    }

    // Generate professional gradient placeholder
    execSync(
      `convert -size ${width}x${height} gradient:#1e3a8a-#3b82f6 -gravity center -pointsize 48 -fill white -annotate +0+0 "${text}" "${outputPath}"`,
      { stdio: 'inherit' },
    );

    return true;
  } catch (error) {
    console.error(`❌ Failed to generate placeholder ${outputPath}:`, error.message);
    return false;
  }
}

function optimizeImage(inputPath) {
  try {
    // Optimize without changing dimensions
    execSync(`convert "${inputPath}" -strip -quality 85 -interlace Plane "${inputPath}"`, {
      stdio: 'inherit',
    });
    return true;
  } catch (error) {
    console.error(`❌ Failed to optimize ${inputPath}:`, error.message);
    return false;
  }
}

async function main() {
  // Check ImageMagick
  if (!checkImageMagick()) {
    console.error('❌ ImageMagick not found. Installing...');
    try {
      execSync('apt-get update && apt-get install -y imagemagick', { stdio: 'inherit' });
    } catch {
      console.error('Failed to install ImageMagick. Please install manually.');
      process.exit(1);
    }
  }

  let totalProcessed = 0;
  let totalFailed = 0;

  // Process team photos
  for (const imgPath of LOW_RES_IMAGES.team) {
    if (existsSync(imgPath)) {
      const success = upscaleImage(imgPath, TARGETS.team.width, TARGETS.team.height);
      if (success) {
        totalProcessed++;
      } else {
        totalFailed++;
      }
    } else {
    }
  }

  // Process portfolio pieces
  for (const imgPath of LOW_RES_IMAGES.portfolio) {
    if (existsSync(imgPath)) {
      const success = upscaleImage(imgPath, TARGETS.portfolio.width, TARGETS.portfolio.height);
      if (success) {
        totalProcessed++;
      } else {
        totalFailed++;
      }
    } else {
    }
  }

  // Process hero images
  for (const imgPath of LOW_RES_IMAGES.hero) {
    if (existsSync(imgPath)) {
      const success = upscaleImage(imgPath, TARGETS.hero.width, TARGETS.hero.height);
      if (success) {
        totalProcessed++;
      } else {
        totalFailed++;
      }
    } else {
    }
  }

  // Summary
}

main().catch(console.error);
