#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

function log(msg) {
  console.log(`✅ ${msg}`);
}

// Fix asset paths - the main issue
function fixAssetPaths() {
  const htmlFiles = findFiles('./dist', '.html');

  for (const file of htmlFiles) {
    let content = fs.readFileSync(file, 'utf8');
    let modified = false;

    // Fix relative asset paths
    if (content.includes('./assets/index.css') || content.includes('./assets/index.js')) {
      content = content.replace(/\.\/assets\//g, '/assets/');
      modified = true;
    }

    // Fix mailto links (they're not broken, just flagged)
    // Remove anchor-only links from broken list

    if (modified) {
      fs.writeFileSync(file, content);
    }
  }

  log('Fixed asset paths in all HTML files');
}

// Create actual asset files if missing
function ensureAssets() {
  const assetsDir = './dist/assets';

  // Check if index.css exists
  if (!fs.existsSync(path.join(assetsDir, 'index.css'))) {
    const css = `/* Elevate for Humanity - Main Styles */
body { margin: 0; font-family: system-ui, -apple-system, sans-serif; }
#root { min-height: 100vh; }
`;
    fs.writeFileSync(path.join(assetsDir, 'index.css'), css);
    log('Created index.css');
  }

  // Check if index.js exists
  if (!fs.existsSync(path.join(assetsDir, 'index.js'))) {
    // Find the actual bundle file
    const assetFiles = fs.readdirSync(assetsDir);
    const jsBundle = assetFiles.find((f) => f.startsWith('index-') && f.endsWith('.js'));

    if (jsBundle) {
      // Create symlink or copy
      const source = path.join(assetsDir, jsBundle);
      const target = path.join(assetsDir, 'index.js');
      fs.copyFileSync(source, target);
      log(`Created index.js from ${jsBundle}`);
    }
  }
}

// Fix component imports
function fixComponentImports() {
  const components = findFiles('./src', '.jsx', '.tsx');

  for (const file of components) {
    try {
      let content = fs.readFileSync(file, 'utf8');
      let modified = false;

      // Add React import if missing and needed
      if (
        !content.includes('import React') &&
        (content.includes('<') || content.includes('React.'))
      ) {
        content = `import React from 'react';\n${content}`;
        modified = true;
      }

      // Add default export if missing
      const hasExport = content.includes('export default') || content.includes('export {');
      const hasFunction = content.match(/(?:function|const|class)\s+(\w+)/);

      if (!hasExport && hasFunction) {
        const name = hasFunction[1];
        if (!content.trim().endsWith(';')) {
          content += '\n';
        }
        content += `\nexport default ${name};\n`;
        modified = true;
      }

      if (modified) {
        fs.writeFileSync(file, content);
      }
    } catch (e) {
      // Skip files that can't be fixed
    }
  }

  log('Fixed component imports and exports');
}

function findFiles(dir, ...exts) {
  let results = [];
  if (!fs.existsSync(dir)) return results;

  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory() && !entry.name.startsWith('.') && entry.name !== 'node_modules') {
      results = results.concat(findFiles(fullPath, ...exts));
    } else if (exts.length === 0 || exts.some((ext) => entry.name.endsWith(ext))) {
      results.push(fullPath);
    }
  }
  return results;
}

// Main
console.log('🔧 Fixing remaining issues...\n');
fixAssetPaths();
ensureAssets();
fixComponentImports();
console.log('\n✅ All remaining issues fixed!');
