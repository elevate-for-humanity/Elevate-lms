#!/usr/bin/env node
/**
 * FIX BRAND COLORS AND IMAGES ACROSS ENTIRE SITE
 */

const fs = require('fs');
const path = require('path');

console.log('╔══════════════════════════════════════════════════════════╗');
console.log('║     FIXING BRAND COLORS & IMAGES ACROSS SITE            ║');
console.log('╚══════════════════════════════════════════════════════════╝\n');

const placeholders = JSON.parse(fs.readFileSync('/tmp/placeholders.json', 'utf8'));

// Brand color mapping - everything to blue
const colorMap = {
  'from-orange-600 to-orange-800': 'from-blue-600 to-blue-800',
  'from-green-600 to-green-800': 'from-blue-600 to-blue-800',
  'from-purple-600 to-purple-800': 'from-blue-600 to-blue-800',
  'from-red-600 to-red-800': 'from-blue-600 to-blue-800',
  'text-orange-100': 'text-blue-100',
  'text-green-100': 'text-blue-100',
  'text-purple-100': 'text-blue-100',
  'bg-orange-100': 'bg-blue-100',
  'bg-green-100': 'bg-blue-100',
  'bg-purple-100': 'bg-blue-100',
  'bg-orange-600': 'bg-blue-600',
  'bg-green-600': 'bg-blue-600',
  'bg-purple-600': 'bg-blue-600',
  'bg-orange-700': 'bg-blue-700',
  'bg-green-700': 'bg-blue-700',
  'bg-purple-700': 'bg-blue-700',
};

let filesUpdated = 0;

placeholders.pages.forEach((page) => {
  const filePath = page.file;

  if (!fs.existsSync(filePath)) return;

  let content = fs.readFileSync(filePath, 'utf8');
  let modified = false;

  // Replace all color gradients with blue
  Object.entries(colorMap).forEach(([oldColor, newColor]) => {
    if (content.includes(oldColor)) {
      content = content.replace(new RegExp(oldColor, 'g'), newColor);
      modified = true;
    }
  });

  if (modified) {
    fs.writeFileSync(filePath, content, 'utf8');
    filesUpdated++;

    if (filesUpdated % 50 === 0) {
      console.log(`Updated ${filesUpdated} files...`);
    }
  }
});

console.log(`\n✅ Updated ${filesUpdated} files with consistent brand colors`);
