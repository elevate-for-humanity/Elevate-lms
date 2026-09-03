#!/usr/bin/env node
// 🚀 Incremental deployment preparation for multi-page static site
import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const outDir = 'deploy';
const startTime = Date.now();

// Clean and create deploy directory
fs.rmSync(outDir, { recursive: true, force: true });
fs.mkdirSync(outDir, { recursive: true });

function cp(src, dst) {
  if (fs.existsSync(src)) {
    const targetDir = path.dirname(dst);
    fs.mkdirSync(targetDir, { recursive: true });
    fs.cpSync(src, dst, { recursive: true });
    return true;
  }
  return false;
}

function getChangeInfo() {
  try {
    const output = execSync('node scripts/changed-paths.mjs --json', {
      stdio: ['pipe', 'pipe', 'ignore'],
    }).toString();
    return JSON.parse(output);
  } catch (error) {
    if (error instanceof Error) {
      console.debug('change detection error:', error.message);
    }
    return {
      shouldBuild: true,
      appRelevant: [],
      buildType: 'full',
      categories: { html: [], assets: [], seo: [], config: [], pages: [] },
    };
  }
}

const { appRelevant, buildType, categories } = getChangeInfo();

let copiedFiles = 0;

// 1. Always include core files
const coreFiles = [
  'index.html',
  'robots.txt',
  'sitemap.xml',
  '_headers',
  '_redirects',

];

coreFiles.forEach((file) => {
  if (cp(file, path.join(outDir, file))) {
    copiedFiles++;
  }
});

// 2. Copy sitemaps directory
if (cp('sitemaps', path.join(outDir, 'sitemaps'))) {
  copiedFiles++;
}

// 3. Handle different build types
switch (buildType) {
  case 'full': {
    // Copy all HTML files
    const htmlFiles = fs.readdirSync('.').filter((f) => f.endsWith('.html'));
    htmlFiles.forEach((file) => {
      if (cp(file, path.join(outDir, file))) {
        copiedFiles++;
      }
    });

    // Copy all directories
    const dirs = [
      'assets',
      'images',
      'client',
      'css',
      'js',
      'programs',
      'contracts',
      'students',
      'contact',
      'about',
      'policies',
      'accessibility',
    ];
    dirs.forEach((dir) => {
      if (cp(dir, path.join(outDir, dir))) {
        copiedFiles++;
      }
    });
    break;
  }

  case 'pages': {
    // Copy changed HTML files
    categories.html.forEach((file) => {
      if (cp(file, path.join(outDir, file))) {
        copiedFiles++;
      }
    });

    // Copy changed page directories
    categories.pages.forEach((dir) => {
      if (cp(dir, path.join(outDir, dir))) {
        copiedFiles++;
      }
    });

    // Always include assets for page functionality
    ['assets', 'images', 'client', 'css', 'js'].forEach((dir) => {
      if (fs.existsSync(dir)) {
        cp(dir, path.join(outDir, dir));
      }
    });
    break;
  }

  case 'assets': {
    // Copy changed assets
    categories.assets.forEach((file) => {
      if (cp(file, path.join(outDir, file))) {
        copiedFiles++;
      }
    });

    // Include main HTML files that might reference these assets
    [
      'index.html',
      'programs.html',
      'government-services.html',
      'account.html',
      'connect.html',
    ].forEach((file) => {
      cp(file, path.join(outDir, file));
    });
    break;
  }

  case 'seo': {
    // Copy changed SEO files
    categories.seo.forEach((file) => {
      if (cp(file, path.join(outDir, file))) {
        copiedFiles++;
      }
    });
    break;
  }

  default:
    // Copy specific changed files
    appRelevant.forEach((file) => {
      if (cp(file, path.join(outDir, file))) {
        copiedFiles++;
      }
    });
}

// 4. Ensure page directories exist with index.html
const pageDirectories = ['programs', 'contracts', 'students', 'contact', 'about'];
pageDirectories.forEach((dir) => {
  const indexPath = path.join(outDir, dir, 'index.html');
  if (!fs.existsSync(indexPath)) {
    // Create directory and copy from source if it exists
    const sourcePath = path.join(dir, 'index.html');
    if (fs.existsSync(sourcePath)) {
      cp(sourcePath, indexPath);
    }
  }
});

// 5. Run static site optimization
try {
  execSync('node scripts/optimize-static-site.mjs', { stdio: 'inherit' });
} catch (error) {
  if (error instanceof Error) {
    console.debug('optimize-static-site error:', error.message);
  }
}

// 5.5. Verify SEO files are preserved
try {
  execSync('node scripts/verify-seo.mjs', { stdio: 'inherit' });
} catch (error) {
  if (error instanceof Error) {
    console.debug('verify-seo warning:', error.message);
  }
}

// 6. Generate deployment manifest
const manifest = {
  timestamp: new Date().toISOString(),
  buildType,
  filesChanged: appRelevant.length,
  filesCopied: copiedFiles,
  deploySize: getDirSize(outDir),
  changes: categories,
  siteType: 'multi-page-static',
};

fs.writeFileSync(path.join(outDir, 'deploy-manifest.json'), JSON.stringify(manifest, null, 2));

const duration = Date.now() - startTime;

// Helper function to calculate directory size
function getDirSize(dirPath) {
  let size = 0;
  try {
    const files = fs.readdirSync(dirPath, { withFileTypes: true });
    for (const file of files) {
      const filePath = path.join(dirPath, file.name);
      if (file.isDirectory()) {
        size += getDirSize(filePath);
      } else {
        size += fs.statSync(filePath).size;
      }
    }
  } catch {
    // Ignore directory read errors (e.g. transient deletes)
  }
  return size;
}
