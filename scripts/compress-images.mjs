#!/usr/bin/env node
/**
 * IMAGE COMPRESSION SCRIPT
 *
 * Compresses all images in public/images directory
 * - Converts PNG to WebP (70% smaller)
 * - Compresses JPG to quality 85
 * - Resizes images to max 1920x1080
 * - Preserves originals in .backup folder
 *
 * Usage: node scripts/compress-images.mjs
 */

import sharp from 'sharp';
import { readdir, stat, mkdir, copyFile } from 'fs/promises';
import { join, dirname, basename, extname } from 'path';
import { existsSync } from 'fs';

const MAX_WIDTH = 1920;
const MAX_HEIGHT = 1080;
const QUALITY = 85;
const BACKUP_DIR = 'public/images/.backup';

let stats = {
  processed: 0,
  skipped: 0,
  errors: 0,
  totalSaved: 0,
};

async function ensureBackupDir() {
  if (!existsSync(BACKUP_DIR)) {
    await mkdir(BACKUP_DIR, { recursive: true });
  }
}

async function compressImage(filePath) {
  try {
    const fileStats = await stat(filePath);
    const originalSize = fileStats.size;

    // Skip if already small
    if (originalSize < 100000) {
      // 100KB
      stats.skipped++;
      return { skipped: true, path: filePath };
    }

    const ext = extname(filePath).toLowerCase();
    const dir = dirname(filePath);
    const name = basename(filePath, ext);

    // Backup original
    const backupPath = join(BACKUP_DIR, basename(filePath));
    await copyFile(filePath, backupPath);

    const image = sharp(filePath);
    const metadata = await image.metadata();

    // Resize if needed
    let pipeline = image.resize(MAX_WIDTH, MAX_HEIGHT, {
      fit: 'inside',
      withoutEnlargement: true,
    });

    // Convert PNG to WebP, compress JPG
    if (ext === '.png') {
      const webpPath = join(dir, `${name}.webp`);
      await pipeline.webp({ quality: QUALITY }).toFile(webpPath);

      const newStats = await stat(webpPath);
      const saved = originalSize - newStats.size;

      stats.processed++;
      stats.totalSaved += saved;

      return { success: true, path: filePath, saved };
    } else if (ext === '.jpg' || ext === '.jpeg') {
      await pipeline.jpeg({ quality: QUALITY, progressive: true }).toFile(filePath + '.tmp');

      // Replace original
      await copyFile(filePath + '.tmp', filePath);

      const newStats = await stat(filePath);
      const saved = originalSize - newStats.size;

      stats.processed++;
      stats.totalSaved += saved;

      return { success: true, path: filePath, saved };
    }

    stats.skipped++;
    return { skipped: true, path: filePath };
  } catch (error) {
    stats.errors++;
    console.error(`✗ ${filePath} - ${error.message}`);
    return { error: true, path: filePath, message: error.message };
  }
}

async function findImages(dir, images = []) {
  const files = await readdir(dir);

  for (const file of files) {
    const filePath = join(dir, file);
    const fileStats = await stat(filePath);

    if (fileStats.isDirectory() && !file.startsWith('.')) {
      await findImages(filePath, images);
    } else if (/\.(jpg|jpeg|png)$/i.test(file)) {
      images.push(filePath);
    }
  }

  return images;
}

async function main() {
  await ensureBackupDir();

  const images = await findImages('public/images');

  for (const img of images) {
    await compressImage(img);
  }
}

main().catch(console.error);
