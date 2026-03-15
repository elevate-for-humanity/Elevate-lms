import sharp from 'sharp';
import { readdir } from 'fs/promises';
import { join } from 'path';

const publicDir = '/workspaces/fix2/public';

// Images to enhance
const imagesToEnhance = [
  // Staff photos - enhance to excellent quality
  'images/elizabeth-greene-founder.jpg',
  'images/carlina-wilkes.jpg',
  'images/jozanna-george.jpg',
  'images/ameco-martin.jpg',
  'images/leslie-wafford.jpg',
  'images/alina-smith.jpg',
  'images/clystjah-woodley.jpg',
  'images/delores-reynolds.jpg',
];

async function enhanceImage(inputPath) {
  try {
    const fullInputPath = join(publicDir, inputPath);
    const tempPath = fullInputPath + '.tmp';


    // Process to temp file - Professional portrait enhancement
    await sharp(fullInputPath)
      .resize(2048, 2048, {
        fit: 'inside',
        position: 'center',
        withoutEnlargement: false // Allow upscaling
      })
      .sharpen({
        sigma: 2.0,
        m1: 1.2,
        m2: 0.8,
        x1: 3,
        y2: 15,
        y3: 15
      })
      .modulate({
        brightness: 1.08,
        saturation: 1.15,
        hue: 0
      })
      .linear(1.1, -(128 * 0.1)) // Increase contrast
      .jpeg({
        quality: 98,
        chromaSubsampling: '4:4:4',
        mozjpeg: true
      })
      .withMetadata({
        density: 300 // 300 DPI
      })
      .toFile(tempPath);

    // Replace original with enhanced version
    const { rename } = await import('fs/promises');
    await rename(tempPath, fullInputPath);

  } catch (error) {
    console.error(`❌ Failed to enhance ${inputPath}:`, error.message);
  }
}

async function enhanceAllImages() {

  for (const imagePath of imagesToEnhance) {
    await enhanceImage(imagePath);
  }

}

enhanceAllImages();
