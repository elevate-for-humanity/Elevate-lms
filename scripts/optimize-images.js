const fs = require('fs');
const path = require('path');

// Simple image optimization without external dependencies
// This script will prepare images for WebP conversion and optimization

const IMAGES_DIR = './images';
const OUTPUT_DIR = './optimized-images';

function ensureDir(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function getImageFiles(dir) {
  const files = [];
  if (!fs.existsSync(dir)) {
    ensureDir(dir);
    return files;
  }

  const items = fs.readdirSync(dir);
  for (const item of items) {
    const fullPath = path.join(dir, item);
    const stat = fs.statSync(fullPath);

    if (stat.isDirectory()) {
      files.push(...getImageFiles(fullPath));
    } else if (/\.(jpg|jpeg|png|gif|bmp)$/i.test(item)) {
      files.push(fullPath);
    }
  }
  return files;
}

function optimizeImages() {

  ensureDir(OUTPUT_DIR);
  const imageFiles = getImageFiles(IMAGES_DIR);

  if (imageFiles.length === 0) {
    return;
  }


  imageFiles.forEach((file) => {
    const fileName = path.basename(file);
    const outputPath = path.join(OUTPUT_DIR, fileName);

    try {
      // Copy file to optimized directory (placeholder for actual optimization)
      fs.copyFileSync(file, outputPath);
    } catch (error) {
    }
  });

    '   npm install imagemin imagemin-webp imagemin-mozjpeg imagemin-pngquant'
  );
    '\n📝 Then this script will automatically use advanced compression.'
  );
}

// Check if imagemin is available for advanced optimization
try {
  const imagemin = require('imagemin');
  const imageminWebp = require('imagemin-webp');
  const imageminMozjpeg = require('imagemin-mozjpeg');
  const imageminPngquant = require('imagemin-pngquant');


  (async () => {
    const files = await imagemin([`${IMAGES_DIR}/*.{jpg,jpeg,png}`], {
      destination: OUTPUT_DIR,
      plugins: [
        imageminMozjpeg({ quality: 85 }),
        imageminPngquant({ quality: [0.6, 0.8] }),
        imageminWebp({ quality: 80 }),
      ],
    });

      `✅ Advanced optimization complete! Processed ${files.length} images.`
    );
    files.forEach((file) => {
        `   📦 ${path.basename(file.sourcePath)} → ${path.basename(file.destinationPath)}`
      );
    });
  })();
} catch (error) {
  // Fallback to basic optimization
  optimizeImages();
}
