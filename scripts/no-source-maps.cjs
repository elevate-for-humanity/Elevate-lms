#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const DIST_DIR = path.resolve(process.cwd(), process.argv[2] || 'dist');

if (!fs.existsSync(DIST_DIR)) {
  console.error(`❌ no-source-maps: directory not found -> ${DIST_DIR}`);
  process.exit(1);
}

/**
 * Recursively collect all files under a directory.
 * @param {string} dir
 * @returns {string[]}
 */
function walk(dir) {
  return fs.readdirSync(dir).flatMap((entry) => {
    const entryPath = path.join(dir, entry);
    const stat = fs.statSync(entryPath);
    if (stat.isDirectory()) {
      return walk(entryPath);
    }
    return [entryPath];
  });
}

const files = walk(DIST_DIR);
const mapFiles = files.filter((file) => file.endsWith('.map'));
const sourceMapTagged = files.filter((file) => {
  if (!/\.(?:js|css)$/i.test(file)) return false;
  const contents = fs.readFileSync(file, 'utf8');
  return contents.includes('sourceMappingURL=');
});

if (mapFiles.length || sourceMapTagged.length) {
  if (mapFiles.length) {
    console.error('❌ Source map files detected in dist:');
    mapFiles.forEach((file) => console.error(`   • ${path.relative(process.cwd(), file)}`));
  }
  if (sourceMapTagged.length) {
    console.error('\n❌ Files referencing source maps (likely an inline map reference):');
    sourceMapTagged.forEach((file) => console.error(`   • ${path.relative(process.cwd(), file)}`));
  }
  console.error('\nFix: disable sourcemaps for production builds or remove the offending files.');
  process.exit(1);
}

console.log('✅ no-source-maps: dist contains no .map files or sourceMappingURL references.');
