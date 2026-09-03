#!/usr/bin/env node
/**
 * FIX DIRECTORY LINKS - NO EXCEPTIONS
 * Creates index.html for all directory links
 * Overwrites and rebuilds any problematic links
 */

const fs = require('fs');
const path = require('path');

let FIXED = 0;

const template = (title) => `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title} | Elevate for Humanity</title>
  <link rel="stylesheet" href="/assets/index.css">
  <script type="module" src="/assets/index.js"></script>
</head>
<body>
  <div id="root"></div>
</body>
</html>`;

console.log('🔧 Fixing ALL directory links...\n');

// All directory paths that need index.html
const directories = [
  'contact',
  'funding-eligibility',
  'student-outcomes',
  'enroll',
  'privacy-policy',
  'accessibility',
  'complaints',
  'apply',
  'programs/it-support',
  'programs/home-health-aide',
  'programs/barbering-youth',
  'employer-partners',
  'meet-our-instructors',
  'faq',
  'contracts',
  'students',
  'about',
  'employers',
  'blog',
  'programs/cybersecurity',
  'programs/cloud-computing',
  'programs/healthcare-cna',
  'programs/electrical-trades',
  'programs/construction',
  'programs/beauty-wellness',
  'resources',
  'privacy',
  'terms',
];

directories.forEach((dir) => {
  const dirPath = path.join('./dist', dir);
  const indexPath = path.join(dirPath, 'index.html');

  // Create directory
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }

  // Create index.html
  const title = dir
    .split('/')
    .pop()
    .split('-')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');

  fs.writeFileSync(indexPath, template(title));
  console.log(`✅ Created: ${indexPath}`);
  FIXED++;
});

console.log(`\n✅ Fixed ${FIXED} directory links\n`);

// Now scan ALL HTML files and fix broken link references
console.log('🔧 Scanning and fixing link references in HTML files...\n');

function findHTMLFiles(dir) {
  let results = [];
  if (!fs.existsSync(dir)) return results;

  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory() && !entry.name.startsWith('.') && entry.name !== 'node_modules') {
      results = results.concat(findHTMLFiles(fullPath));
    } else if (entry.name.endsWith('.html')) {
      results.push(fullPath);
    }
  }
  return results;
}

const htmlFiles = findHTMLFiles('./dist');
let linksFixed = 0;

htmlFiles.forEach((file) => {
  let content = fs.readFileSync(file, 'utf8');
  let modified = false;

  // Fix directory links - add trailing slash or /index.html
  directories.forEach((dir) => {
    const patterns = [
      { from: `href="/${dir}"`, to: `href="/${dir}/"` },
      { from: `href="/${dir} `, to: `href="/${dir}/" ` },
      { from: `href='/${dir}'`, to: `href='/${dir}/'` },
    ];

    patterns.forEach(({ from, to }) => {
      if (content.includes(from)) {
        content = content.replace(new RegExp(from, 'g'), to);
        modified = true;
      }
    });
  });

  // Fix relative asset paths that are broken
  const assetFixes = {
    'href="./assets/logo.png"': 'href="/assets/logo.svg"',
    'src="./assets/logo.png"': 'src="/assets/logo.svg"',
    'href="./assets/images/logo.svg"': 'href="/assets/images/logo.svg"',
    'src="./assets/images/logo.svg"': 'src="/assets/images/logo.svg"',
  };

  Object.entries(assetFixes).forEach(([from, to]) => {
    if (content.includes(from)) {
      content = content.replace(new RegExp(from, 'g'), to);
      modified = true;
    }
  });

  if (modified) {
    fs.writeFileSync(file, content);
    linksFixed++;
  }
});

console.log(`✅ Fixed links in ${linksFixed} HTML files\n`);

// Delete any broken symlinks or invalid files
console.log('🔧 Cleaning up broken files...\n');

function cleanupBrokenFiles(dir) {
  if (!fs.existsSync(dir)) return;

  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);

    try {
      if (entry.isDirectory()) {
        cleanupBrokenFiles(fullPath);
      } else {
        // Check if file is readable
        fs.readFileSync(fullPath, 'utf8');
      }
    } catch (e) {
      console.log(`🗑️  Removing broken file: ${fullPath}`);
      try {
        fs.unlinkSync(fullPath);
      } catch {}
    }
  }
}

cleanupBrokenFiles('./dist');

console.log('✅ Cleanup complete\n');
console.log('═══════════════════════════════════════════════════════');
console.log(`  TOTAL FIXES: ${FIXED + linksFixed}`);
console.log('═══════════════════════════════════════════════════════\n');
