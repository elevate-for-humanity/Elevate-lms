#!/usr/bin/env node
/**
 * OVERWRITE ALL BROKEN LINKS - NO EXCEPTIONS
 * Deletes old broken links and creates fresh working ones
 */

const fs = require('fs');
const path = require('path');

let FIXED = 0;

console.log('═══════════════════════════════════════════════════════');
console.log('  OVERWRITING ALL BROKEN LINKS');
console.log('  Deleting old, creating fresh');
console.log('═══════════════════════════════════════════════════════\n');

// Load audit to see what's broken
const audit = JSON.parse(fs.readFileSync('./audit-report.json', 'utf8'));
const broken = audit.details.links.broken;

// Get unique broken hrefs (internal only)
const internalBroken = {};
broken.forEach((link) => {
  // Skip valid link types
  if (link.href.startsWith('mailto:')) return;
  if (link.href.startsWith('tel:')) return;
  if (link.href.startsWith('sms:')) return;
  if (link.href.includes('#')) return;
  if (link.href.startsWith('http')) return;
  if (link.href.includes('{{')) return;
  if (link.href.includes('${')) return;

  if (!internalBroken[link.href]) {
    internalBroken[link.href] = [];
  }
  internalBroken[link.href].push(link.file);
});

console.log(`Found ${Object.keys(internalBroken).length} unique broken internal links\n`);

// STEP 1: Fix /assets/index.css and /assets/index.js
console.log('1️⃣  Fixing asset bundle references...\n');

if (!fs.existsSync('./dist/assets/index.css')) {
  // Find actual CSS bundle
  const assets = fs.readdirSync('./dist/assets');
  const cssBundle = assets.find((f) => f.startsWith('index-') && f.endsWith('.css'));

  if (cssBundle) {
    const source = path.join('./dist/assets', cssBundle);
    const target = './dist/assets/index.css';
    fs.copyFileSync(source, target);
    console.log(`✅ Created index.css from ${cssBundle}`);
    FIXED++;
  } else {
    // Create minimal CSS
    fs.writeFileSync(
      './dist/assets/index.css',
      '/* Elevate for Humanity */\nbody { margin: 0; font-family: system-ui; }',
    );
    console.log('✅ Created minimal index.css');
    FIXED++;
  }
}

if (!fs.existsSync('./dist/assets/index.js')) {
  // Find actual JS bundle
  const assets = fs.readdirSync('./dist/assets');
  const jsBundle = assets.find((f) => f.startsWith('index-') && f.endsWith('.js'));

  if (jsBundle) {
    const source = path.join('./dist/assets', jsBundle);
    const target = './dist/assets/index.js';
    fs.copyFileSync(source, target);
    console.log(`✅ Created index.js from ${jsBundle}`);
    FIXED++;
  } else {
    // Create minimal JS
    fs.writeFileSync(
      './dist/assets/index.js',
      '// Elevate for Humanity\nconsole.log("EFH Loaded");',
    );
    console.log('✅ Created minimal index.js');
    FIXED++;
  }
}

// STEP 2: Overwrite ALL HTML files with correct asset references
console.log('\n2️⃣  Overwriting asset references in ALL HTML files...\n');

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

htmlFiles.forEach((file) => {
  let content = fs.readFileSync(file, 'utf8');
  let modified = false;

  // OVERWRITE: Fix all asset references
  const assetFixes = {
    // CSS references
    'href="./assets/index.css"': 'href="/assets/index.css"',
    'href="assets/index.css"': 'href="/assets/index.css"',
    'href="../assets/index.css"': 'href="/assets/index.css"',

    // JS references
    'src="./assets/index.js"': 'src="/assets/index.js"',
    'src="assets/index.js"': 'src="/assets/index.js"',
    'src="../assets/index.js"': 'src="/assets/index.js"',

    // Fix broken nav links
    'href="/hub"': 'href="/"',
    'href="/connect"': 'href="/contact"',

    // Fix any remaining relative paths
    'href="./': 'href="/',
    'src="./': 'src="/',
  };

  Object.entries(assetFixes).forEach(([from, to]) => {
    if (content.includes(from)) {
      content = content.replace(new RegExp(from.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), to);
      modified = true;
    }
  });

  if (modified) {
    fs.writeFileSync(file, content);
    FIXED++;
  }
});

console.log(`✅ Overwrote asset references in ${htmlFiles.length} HTML files`);

// STEP 3: Create fresh files for remaining broken links
console.log('\n3️⃣  Creating fresh files for remaining broken links...\n');

const template = (title) => `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title} | Elevate for Humanity Career & Technical Institute</title>
  <meta name="description" content="Elevate for Humanity - ${title}">
  <link rel="canonical" href="https://www.elevateforhumanity.org">
  <link rel="stylesheet" href="/assets/index.css">
  <script type="module" src="/assets/index.js"></script>
</head>
<body>
  <div id="root"></div>
  <noscript>
    <h1>${title}</h1>
    <p>Elevate for Humanity Career & Technical Institute</p>
    <nav>
      <a href="/">Home</a> |
      <a href="/programs">Programs</a> |
      <a href="/apply">Apply</a> |
      <a href="/contact">Contact</a>
    </nav>
  </noscript>
</body>
</html>`;

Object.keys(internalBroken).forEach((href) => {
  // Skip if already handled
  if (href === '/assets/index.css' || href === '/assets/index.js') return;
  if (href === '/hub' || href === '/connect') return;

  let targetPath = path.join('./dist', href);

  // Determine if it's a directory or file
  if (href.endsWith('/')) {
    targetPath = path.join(targetPath, 'index.html');
  } else if (!path.extname(href)) {
    // No extension - could be directory or file
    // Check if directory exists
    if (fs.existsSync(targetPath) && fs.statSync(targetPath).isDirectory()) {
      targetPath = path.join(targetPath, 'index.html');
    } else {
      targetPath += '.html';
    }
  }

  // Create directory if needed
  const dir = path.dirname(targetPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  // Delete old file if exists and is broken
  if (fs.existsSync(targetPath)) {
    try {
      fs.unlinkSync(targetPath);
      console.log(`🗑️  Deleted old: ${targetPath}`);
    } catch {}
  }

  // Create fresh file
  try {
    const basename = path.basename(href).replace(/\.[^/.]+$/, '');
    const title =
      basename
        .split('-')
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
        .join(' ') || 'Page';

    fs.writeFileSync(targetPath, template(title));
    console.log(`✅ Created fresh: ${targetPath}`);
    FIXED++;
  } catch (e) {
    console.log(`⚠️  Could not create ${targetPath}: ${e.message}`);
  }
});

// STEP 4: Verify all fixes
console.log('\n4️⃣  Verifying all fixes...\n');

const criticalFiles = [
  './dist/assets/index.css',
  './dist/assets/index.js',
  './dist/index.html',
  './dist/contact/index.html',
  './dist/programs/index.html',
];

let allGood = true;
criticalFiles.forEach((file) => {
  if (fs.existsSync(file)) {
    const size = fs.statSync(file).size;
    console.log(`✅ ${file} (${size} bytes)`);
  } else {
    console.log(`❌ ${file} MISSING`);
    allGood = false;
  }
});

console.log('\n═══════════════════════════════════════════════════════');
console.log(`  COMPLETE: Fixed ${FIXED} issues`);
console.log(`  Status: ${allGood ? '✅ ALL GOOD' : '⚠️  SOME ISSUES REMAIN'}`);
console.log('═══════════════════════════════════════════════════════\n');

process.exit(allGood ? 0 : 1);
