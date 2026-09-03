#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

async function convertIcons() {
  // Dynamic import for sharp (ESM module)
  const sharp = (await import('sharp')).default;

  const iconsDir = path.join(__dirname, '..', 'public', 'icons');
  const files = fs.readdirSync(iconsDir).filter((f) => f.endsWith('.svg'));

  console.log(`Converting ${files.length} SVG files to PNG...\n`);

  for (const file of files) {
    const svgPath = path.join(iconsDir, file);
    const pngPath = path.join(iconsDir, file.replace('.svg', '.png'));

    try {
      await sharp(svgPath).png().toFile(pngPath);
      console.log(`  ✓ ${file} → ${file.replace('.svg', '.png')}`);
    } catch (err) {
      console.error(`  ✗ ${file}: ${err.message}`);
    }
  }

  console.log('\nPNG conversion complete!');
}

convertIcons().catch(console.error);
