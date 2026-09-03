#!/usr/bin/env node
import sharp from 'sharp';
import fs from 'fs';

const width = 1200;
const height = 630;

// Create SVG with embedded text
const svg = `
<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bgGradient" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#0ea5e9;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#7c3aed;stop-opacity:1" />
    </linearGradient>
  </defs>

  <rect width="${width}" height="${height}" fill="url(#bgGradient)"/>
  <rect width="${width}" height="${height}" fill="rgba(0,0,0,0.1)"/>

  <text x="600" y="220" font-family="Arial, Helvetica, sans-serif" font-size="72" font-weight="bold" fill="#ffffff" text-anchor="middle">
    Elevate for Humanity
  </text>

  <text x="600" y="300" font-family="Arial, Helvetica, sans-serif" font-size="36" fill="#ffffff" text-anchor="middle" opacity="0.95">
    Empowering Dreams Through Education
  </text>

  <text x="600" y="380" font-family="Arial, Helvetica, sans-serif" font-size="32" font-weight="600" fill="#22c55e" text-anchor="middle">
    100% FREE Training • Marion County
  </text>

  <rect x="0" y="530" width="${width}" height="100" fill="rgba(0,0,0,0.3)"/>

  <text x="600" y="590" font-family="Arial, Helvetica, sans-serif" font-size="28" fill="#ffffff" text-anchor="middle">
    www.www.elevateforhumanity.org
  </text>
</svg>
`;

try {
  await sharp(Buffer.from(svg)).jpeg({ quality: 90 }).toFile('public/og.jpg');

  // Also create a PNG version for better quality
  await sharp(Buffer.from(svg)).png().toFile('public/og.png');

  // Get file sizes
  const jpgSize = fs.statSync('public/og.jpg').size;
  const pngSize = fs.statSync('public/og.png').size;
} catch (error) {
  console.error('❌ Error generating image:', error.message);
  process.exit(1);
}
