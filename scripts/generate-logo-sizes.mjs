import sharp from 'sharp';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const publicDir = join(__dirname, '..', 'public');

const sizes = [
  { name: 'favicon.ico', size: 32 },
  { name: 'favicon.png', size: 192 },
  { name: 'icon-192.png', size: 192 },
  { name: 'icon-512.png', size: 512 },
  { name: 'apple-touch-icon.png', size: 180 },
  { name: 'logo.png', size: 1024 }, // Full size for homepage
  { name: 'logo-small.png', size: 256 }, // Medium size
];

async function generateLogos() {
  const inputPath = join(publicDir, 'logo-original.png');

  for (const { name, size } of sizes) {
    const outputPath = join(publicDir, name);

    try {
      await sharp(inputPath)
        .resize(size, size, {
          fit: 'contain',
          background: { r: 255, g: 255, b: 255, alpha: 0 },
        })
        .png()
        .toFile(outputPath);
    } catch (error) {
      console.error(`❌ Failed to create ${name}:`, error.message);
    }
  }

  // Create ICO file (just copy the 32x32 PNG as .ico)
  try {
    await sharp(inputPath)
      .resize(32, 32, {
        fit: 'contain',
        background: { r: 255, g: 255, b: 255, alpha: 0 },
      })
      .png()
      .toFile(join(publicDir, 'favicon-temp.png'));
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

generateLogos();
