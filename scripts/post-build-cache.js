#!/usr/bin/env node

const fs = require('fs');
const path = require('path');


// 1. Copy cache-buster.js to dist
const sourcePath = './cache-buster.js';
const destPath = './dist/cache-buster.js';

try {
  fs.copyFileSync(sourcePath, destPath);
} catch (error) {
  process.exit(1);
}

// 2. Generate cache version
const cacheVersion = `v${Date.now()}`;

// 3. Add cache version meta tags to HTML files
function addCacheVersionToHTML(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');

    // Skip if cache version already exists
    if (content.includes('name="cache-version"')) {
      // Update existing cache version
      content = content.replace(
        /name="cache-version" content="[^"]*"/,
        `name="cache-version" content="${cacheVersion}"`
      );
      fs.writeFileSync(filePath, content, 'utf8');
      return 'updated';
    }

    // Add new cache version meta tag
    const charsetRegex = /<meta charset="[^"]*"[^>]*>/i;
    const match = content.match(charsetRegex);

    if (match) {
      const cacheVersionTag = `\n    <meta name="cache-version" content="${cacheVersion}">`;
      content = content.replace(charsetRegex, match[0] + cacheVersionTag);

      fs.writeFileSync(filePath, content, 'utf8');
      return 'added';
    }
    return 'skipped';
  } catch (error) {
    return 'error';
  }
}

// 4. Add cache-buster script to key HTML files
function addCacheBusterScript(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');

    // Skip if already added
    if (content.includes('<script src="/cache-buster.js"></script>')) {
      return 'exists';
    }

    // Add script before closing body tag
    content = content.replace(
      '</body>',
      '  <script src="/cache-buster.js"></script>\n</body>'
    );

    fs.writeFileSync(filePath, content, 'utf8');
    return 'added';
  } catch (error) {
    return 'error';
  }
}

// 5. Process key HTML files
const keyFiles = [
  './dist/index.html',
  './dist/hub.html',
  './dist/programs.html',
  './dist/demo-site.html',
  './dist/apply.html',
  './dist/employers.html',
];

let cacheVersionUpdated = 0;
let cacheBusterAdded = 0;

for (const file of keyFiles) {
  if (fs.existsSync(file)) {
    const cacheResult = addCacheVersionToHTML(file);
    const scriptResult = addCacheBusterScript(file);

    if (cacheResult === 'added' || cacheResult === 'updated') {
      cacheVersionUpdated++;
    }
    if (scriptResult === 'added') {
      cacheBusterAdded++;
    }

      `✅ Processed ${path.basename(file)}: cache ${cacheResult}, script ${scriptResult}`
    );
  } else {
  }
}

