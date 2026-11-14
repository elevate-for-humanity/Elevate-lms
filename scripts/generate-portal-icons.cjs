#!/usr/bin/env node

/**
 * Generate PWA icons for each portal
 * Uses sharp to convert SVG to PNG at multiple sizes
 */

const fs = require('fs');
const path = require('path');

// Portal configurations
const portals = [
  { name: 'student', color: '#2563eb', label: 'L' }, // Blue - Learn
  { name: 'admin', color: '#f97316', label: 'A' }, // Orange - Admin
  { name: 'instructor', color: '#7c3aed', label: 'T' }, // Purple - Teach
  { name: 'employer', color: '#059669', label: 'H' }, // Green - Hire
  { name: 'partner', color: '#0d9488', label: 'P' }, // Teal - Partner
  { name: 'program-holder', color: '#dc2626', label: 'P' }, // Red - Programs
];

// Icon sizes needed for PWA
const sizes = [72, 96, 128, 144, 192, 512];

// Generate SVG for a portal
function generateSvg(color, label, size, maskable = false) {
  const padding = maskable ? size * 0.1 : 0;
  const innerSize = size - padding * 2;
  const radius = size * 0.1875; // 12/64 ratio
  const fontSize = innerSize * 0.5;

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
  ${maskable ? `<rect width="${size}" height="${size}" fill="${color}"/>` : ''}
  <rect x="${padding}" y="${padding}" rx="${radius}" width="${innerSize}" height="${innerSize}" fill="${color}"/>
  <text x="${size / 2}" y="${size / 2 + fontSize * 0.35}" font-family="system-ui, -apple-system, sans-serif" font-size="${fontSize}" font-weight="bold" fill="white" text-anchor="middle">${label}</text>
</svg>`;
}

// Create icons directory if it doesn't exist
const iconsDir = path.join(__dirname, '..', 'public', 'icons');
if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true });
}

// Generate SVG files for each portal and size
console.log('Generating portal icons...\n');

portals.forEach((portal) => {
  console.log(`Creating icons for ${portal.name} portal (${portal.color}):`);

  sizes.forEach((size) => {
    // Regular icon
    const svg = generateSvg(portal.color, portal.label, size, false);
    const filename = `${portal.name}-${size}.svg`;
    fs.writeFileSync(path.join(iconsDir, filename), svg);
    console.log(`  ✓ ${filename}`);

    // Maskable icon (only for 192 and 512)
    if (size >= 192) {
      const maskableSvg = generateSvg(portal.color, portal.label, size, true);
      const maskableFilename = `${portal.name}-${size}-maskable.svg`;
      fs.writeFileSync(path.join(iconsDir, maskableFilename), maskableSvg);
      console.log(`  ✓ ${maskableFilename}`);
    }
  });

  console.log('');
});

console.log('SVG icons generated successfully!');
console.log('\nTo convert to PNG, install sharp and run:');
console.log('  node scripts/convert-icons-to-png.js');
console.log('\nOr use an online SVG to PNG converter.');
