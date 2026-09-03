#!/usr/bin/env node

/**
 * Media Optimization Script
 *
 * Scans and optimizes all images and videos before deployment
 * Enforces quality standards and prevents low-quality media
 */

import { readdir, stat } from 'fs/promises';
import { join } from 'path';
import { execSync } from 'child_process';

const STANDARDS = {
  images: {
    hero: { minWidth: 1920, minHeight: 1080, maxSize: 500 * 1024 },
    content: { minWidth: 1200, minHeight: 800, maxSize: 200 * 1024 },
    thumbnail: { minWidth: 800, minHeight: 600, maxSize: 100 * 1024 },
  },
  videos: {
    minWidth: 1920,
    minHeight: 1080,
    maxSize: 10 * 1024 * 1024, // 10MB
  },
  audio: {
    minBitrate: 192, // kbps
    maxSize: 1 * 1024 * 1024, // 1MB
  },
};

const issues = {
  lowResolution: [],
  oversized: [],
  wrongFormat: [],
  missing: [],
};

async function checkImageQuality(filePath) {
  try {
    // Use ImageMagick identify command
    const output = execSync(`identify -format "%w %h %b" "${filePath}"`, { encoding: 'utf-8' });
    const [width, height, sizeStr] = output.trim().split(' ');

    const w = parseInt(width);
    const h = parseInt(height);
    const size = parseSizeString(sizeStr);

    // Determine image type by path
    let standard;
    if (filePath.includes('/heroes/')) {
      standard = STANDARDS.images.hero;
    } else if (filePath.includes('/team/') || filePath.includes('/programs/')) {
      standard = STANDARDS.images.content;
    } else {
      standard = STANDARDS.images.thumbnail;
    }

    // Check resolution
    if (w < standard.minWidth || h < standard.minHeight) {
      issues.lowResolution.push({
        file: filePath,
        current: `${w}x${h}`,
        required: `${standard.minWidth}x${standard.minHeight}`,
        size: formatSize(size),
      });
    }

    // Check file size
    if (size > standard.maxSize) {
      issues.oversized.push({
        file: filePath,
        size: formatSize(size),
        maxSize: formatSize(standard.maxSize),
        needsCompression: true,
      });
    }

    return { width: w, height: h, size };
  } catch (error) {
    console.error(`Error checking ${filePath}:`, error.message);
    return null;
  }
}

async function checkVideoQuality(filePath) {
  try {
    // Use ffprobe to check video properties
    const output = execSync(
      `ffprobe -v error -select_streams v:0 -show_entries stream=width,height -of csv=p=0 "${filePath}"`,
      { encoding: 'utf-8' },
    );

    const [width, height] = output.trim().split(',').map(Number);
    const stats = await stat(filePath);
    const size = stats.size;

    if (width < STANDARDS.videos.minWidth || height < STANDARDS.videos.minHeight) {
      issues.lowResolution.push({
        file: filePath,
        current: `${width}x${height}`,
        required: `${STANDARDS.videos.minWidth}x${STANDARDS.videos.minHeight}`,
        size: formatSize(size),
      });
    }

    if (size > STANDARDS.videos.maxSize) {
      issues.oversized.push({
        file: filePath,
        size: formatSize(size),
        maxSize: formatSize(STANDARDS.videos.maxSize),
        needsCompression: true,
      });
    }

    return { width, height, size };
  } catch (error) {
    console.error(`Error checking ${filePath}:`, error.message);
    return null;
  }
}

async function checkAudioQuality(filePath) {
  try {
    const stats = await stat(filePath);
    const size = stats.size;

    // Check if it's a robotic TTS file (usually very small)
    if (filePath.includes('robot') || filePath.includes('tts')) {
      issues.wrongFormat.push({
        file: filePath,
        reason: 'Robotic TTS file detected - only professional voiceovers allowed',
      });
    }

    if (size > STANDARDS.audio.maxSize) {
      issues.oversized.push({
        file: filePath,
        size: formatSize(size),
        maxSize: formatSize(STANDARDS.audio.maxSize),
        needsCompression: true,
      });
    }

    return { size };
  } catch (error) {
    console.error(`Error checking ${filePath}:`, error.message);
    return null;
  }
}

async function scanDirectory(dir, fileHandler) {
  try {
    const entries = await readdir(dir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = join(dir, entry.name);

      if (entry.isDirectory()) {
        await scanDirectory(fullPath, fileHandler);
      } else {
        await fileHandler(fullPath, entry.name);
      }
    }
  } catch (error) {
    // Directory doesn't exist or can't be read
  }
}

function parseSizeString(sizeStr) {
  const match = sizeStr.match(/^([\d.]+)([KMGT]?B?)$/i);
  if (!match) return 0;

  const value = parseFloat(match[1]);
  const unit = match[2].toUpperCase();

  const multipliers = {
    B: 1,
    KB: 1024,
    MB: 1024 * 1024,
    GB: 1024 * 1024 * 1024,
  };

  return value * (multipliers[unit] || 1);
}

function formatSize(bytes) {
  if (bytes < 1024) return `${bytes}B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)}GB`;
}

async function main() {
  // Check images
  await scanDirectory('public/images', async (filePath, fileName) => {
    if (fileName.match(/\.(jpg|jpeg|png|webp)$/i)) {
      await checkImageQuality(filePath);
    }
  });

  // Check videos
  await scanDirectory('public/videos', async (filePath, fileName) => {
    if (fileName.match(/\.(mp4|webm|mov)$/i)) {
      await checkVideoQuality(filePath);
    }
  });

  // Check audio
  await scanDirectory('public/videos', async (filePath, fileName) => {
    if (fileName.match(/\.(mp3|wav|ogg)$/i)) {
      await checkAudioQuality(filePath);
    }
  });

  // Report results

  if (issues.lowResolution.length > 0) {
    issues.lowResolution.forEach((item) => {});
  }

  if (issues.oversized.length > 0) {
    issues.oversized.forEach((item) => {});
  }

  if (issues.wrongFormat.length > 0) {
    issues.wrongFormat.forEach((item) => {});
  }

  const totalIssues =
    issues.lowResolution.length + issues.oversized.length + issues.wrongFormat.length;

  if (totalIssues === 0) {
    process.exit(0);
  } else {
    process.exit(1);
  }
}

main().catch((error) => {
  console.error('Error running media optimization:', error);
  process.exit(1);
});
