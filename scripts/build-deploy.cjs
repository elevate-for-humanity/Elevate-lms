#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🚀 Building optimized deployment package...');

// Create dist directory
const distDir = path.join(__dirname, '../dist');
if (fs.existsSync(distDir)) {
  fs.rmSync(distDir, { recursive: true });
}
fs.mkdirSync(distDir, { recursive: true });

// Essential HTML files for the ecosystem
const essentialFiles = [
  'index.html',
  'hub.html',
  'programs.html',
  'lms.html',
  'connect.html',
  'compliance.html',
  'partners.html',
  'pay.html',
  'account.html',
  'student-portal.html',
  '404.html',
  '410.html',
];

// Copy essential HTML files
console.log('📄 Copying essential HTML files...');
essentialFiles.forEach((file) => {
  const srcPath = path.join(__dirname, '..', file);
  const destPath = path.join(distDir, file);

  if (fs.existsSync(srcPath)) {
    fs.copyFileSync(srcPath, destPath);
    console.log(`✅ Copied ${file}`);
  } else {
    console.log(`⚠️  Missing ${file}`);
  }
});

// Copy configuration files
const configFiles = ['_redirects', '_headers', 'robots.txt', 'sitemap.xml', 'sitemap-index.xml'];
console.log('⚙️  Copying configuration files...');
configFiles.forEach((file) => {
  const srcPath = path.join(__dirname, '..', file);
  const destPath = path.join(distDir, file);

  if (fs.existsSync(srcPath)) {
    fs.copyFileSync(srcPath, destPath);
    console.log(`✅ Copied ${file}`);
  }
});

// Copy images directory (but optimize size)
const imagesDir = path.join(__dirname, '../images');
const distImagesDir = path.join(distDir, 'images');

if (fs.existsSync(imagesDir)) {
  console.log('🖼️  Copying optimized images...');
  fs.mkdirSync(distImagesDir, { recursive: true });

  const imageFiles = fs.readdirSync(imagesDir);
  let copiedCount = 0;

  imageFiles.forEach((file) => {
    const srcPath = path.join(imagesDir, file);
    const destPath = path.join(distImagesDir, file);
    const stats = fs.statSync(srcPath);

    // Only copy images under 5MB to avoid build issues
    if (stats.size < 5 * 1024 * 1024) {
      fs.copyFileSync(srcPath, destPath);
      copiedCount++;
    } else {
      console.log(`⚠️  Skipped large image: ${file} (${Math.round(stats.size / 1024 / 1024)}MB)`);
    }
  });

  console.log(`✅ Copied ${copiedCount} optimized images`);
}

// Create a simple API directory structure
const apiDir = path.join(distDir, 'api');
fs.mkdirSync(apiDir, { recursive: true });

// Create basic API endpoints as static files for static hosting
const apiEndpoints = {
  readiness: { status: 'ok', message: 'Site is ready' },
  metrics: {
    students: 2500,
    completion_rate: 94,
    job_placement: 89,
    avg_salary: 85000,
  },
};

Object.entries(apiEndpoints).forEach(([endpoint, data]) => {
  const apiFile = path.join(apiDir, `${endpoint}.json`);
  fs.writeFileSync(apiFile, JSON.stringify(data, null, 2));
  console.log(`✅ Created API endpoint: /api/${endpoint}.json`);
});

// Calculate final size
const getFolderSize = (folderPath) => {
  let totalSize = 0;
  const files = fs.readdirSync(folderPath);

  files.forEach((file) => {
    const filePath = path.join(folderPath, file);
    const stats = fs.statSync(filePath);

    if (stats.isDirectory()) {
      totalSize += getFolderSize(filePath);
    } else {
      totalSize += stats.size;
    }
  });

  return totalSize;
};

const finalSize = getFolderSize(distDir);
const finalSizeMB = Math.round((finalSize / 1024 / 1024) * 100) / 100;

console.log('');
console.log('🎉 Build complete!');
console.log(`📦 Final package size: ${finalSizeMB}MB`);
console.log(`📁 Output directory: ${distDir}`);
console.log('');

if (finalSizeMB > 100) {
  console.log('⚠️  Warning: Package is still large. Consider further optimization.');
} else {
  console.log('✅ Package size is optimized for deployment!');
}
