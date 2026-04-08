import sharp from 'sharp';
import { join } from 'path';

const publicDir = '/workspaces/fix2/public';

// ALL images to make CRYSTAL CLEAR
const imagesToEnhance = [
  // Program images
  'media/programs/cna-hd.jpg',
  'media/programs/hvac-hd.jpg',
  'media/programs/cdl-hd.jpg',
  'media/programs/barber-hd.jpg',
  'media/programs/healthcare-professional-1-hd.jpg',

  // Location images
  'images/location-4.jpg',
  'images/location-5.jpg',
  'images/location-9.jpg',

  // Artlist images
  'images/hp/train.jpg',
  'images/hp/complete-training.jpg',
  'images/artlist/hero-training-3.jpg',
  'images/artlist/hero-training-4.jpg',
  'images/artlist/hero-training-5.jpg',
];

async function maximumQuality(inputPath) {
  try {
    const fullInputPath = join(publicDir, inputPath);
    const tempPath = fullInputPath + '.tmp';


    // ABSOLUTE MAXIMUM QUALITY - 4K, 600 DPI
    await sharp(fullInputPath)
      .resize(3840, 2160, {
        fit: 'inside',
        kernel: 'lanczos3',
        withoutEnlargement: false
      })
      .sharpen({
        sigma: 3.0,
        m1: 2.0,
        m2: 1.0,
        x1: 3,
        y2: 15,
        y3: 15
      })
      .modulate({
        brightness: 1.2,
        saturation: 1.3,
        hue: 0
      })
      .linear(1.3, -(128 * 0.2))
      .gamma(1.15)
      .normalize()
      .png({
        quality: 100,
        compressionLevel: 0,
        adaptiveFiltering: false,
        palette: false
      })
      .withMetadata({
        density: 600
      })
      .toFile(tempPath.replace('.jpg.tmp', '.png.tmp'));

    // Rename to PNG for lossless quality
    const { rename } = await import('fs/promises');
    const pngPath = fullInputPath.replace('.jpg', '.png');
    await rename(tempPath.replace('.jpg.tmp', '.png.tmp'), pngPath);

  } catch (error) {
    console.error(`❌ Failed: ${inputPath}:`, error.message);
  }
}

async function enhanceAll() {

  for (const imagePath of imagesToEnhance) {
    await maximumQuality(imagePath);
  }

}

enhanceAll();
