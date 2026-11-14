#!/usr/bin/env node

import fs from 'fs';
import path from 'path';

// Check if sharp is available
let sharp;
try {
  const sharpModule = await import('sharp');
  sharp = sharpModule.default;
} catch (error) {
  process.exit(1);
}

// Configuration
const config = {
  inputDir: 'images/raw',
  outputDir: 'assets/images',
  maxWidth: 1600,
  quality: {
    webp: 75,
    jpeg: 80,
    png: 90,
  },
  formats: ['webp', 'jpeg'], // Output formats
};

// Ensure directories exist
if (!fs.existsSync(config.inputDir)) {
  fs.mkdirSync(config.inputDir, { recursive: true });

  process.exit(0);
}

if (!fs.existsSync(config.outputDir)) {
  fs.mkdirSync(config.outputDir, { recursive: true });
}

async function optimizeImage(inputPath, filename) {
  const ext = path.extname(filename).toLowerCase();
  const baseName = path.basename(filename, ext);

  // Skip if not an image
  if (!['.jpg', '.jpeg', '.png', '.webp'].includes(ext)) {
    return;
  }


  try {
    const image = sharp(inputPath);
    const metadata = await image.metadata();

      `   Original: ${metadata.width}x${metadata.height} (${(fs.statSync(inputPath).size / 1024).toFixed(1)}KB)`
    );

    // Process each output format
    for (const format of config.formats) {
      const outputFilename = `${baseName}.${format}`;
      const outputPath = path.join(config.outputDir, outputFilename);

      let processor = image.clone().resize({
        width: config.maxWidth,
        withoutEnlargement: true,
      });

      // Apply format-specific settings
      switch (format) {
        case 'webp':
          processor = processor.webp({ quality: config.quality.webp });
          break;
        case 'jpeg':
          processor = processor.jpeg({
            quality: config.quality.jpeg,
            progressive: true,
          });
          break;
        case 'png':
          processor = processor.png({
            quality: config.quality.png,
            progressive: true,
          });
          break;
      }

      await processor.toFile(outputPath);

      const outputSize = fs.statSync(outputPath).size;
      const outputMeta = await sharp(outputPath).metadata();

        `   → ${outputFilename}: ${outputMeta.width}x${outputMeta.height} (${(outputSize / 1024).toFixed(1)}KB)`
      );
    }
  } catch (error) {
  }
}

async function optimizeAll() {

  const files = fs.readdirSync(config.inputDir);
  const imageFiles = files.filter((file) => {
    const ext = path.extname(file).toLowerCase();
    return ['.jpg', '.jpeg', '.png', '.webp'].includes(ext);
  });

  if (imageFiles.length === 0) {
    return;
  }


  for (const file of imageFiles) {
    const inputPath = path.join(config.inputDir, file);
    await optimizeImage(inputPath, file);
  }

    '     <source srcset="/assets/images/hero.webp" type="image/webp">'
  );
    '     <img src="/assets/images/hero.jpeg" alt="Description" loading="lazy">'
  );
}

// Handle command line arguments
const args = process.argv.slice(2);
if (args.includes('--help') || args.includes('-h')) {
  process.exit(0);
}

if (args.includes('--config')) {
  process.exit(0);
}

// Run optimization
optimizeAll().catch((error) => {
  process.exit(1);
});
