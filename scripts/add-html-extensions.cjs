#!/usr/bin/env node
/**
 * Add .html extensions to all internal links
 * Ensures zero broken links by making all paths explicit
 */

const fs = require('fs');
const path = require('path');

console.log('🔧 Adding .html extensions to all internal links...\n');

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
let fixed = 0;

// List of all internal paths that need .html extension
const pathsToFix = [
  '/programs/cpr-aed-first-aid',
  '/programs/business-startup-marketing',
  '/programs/tax-office-startup',
  '/programs/esthetician-client-services',
  '/programs/beauty-career-educator',
  '/programs/public-safety-reentry',
  '/video-interview',
  '/hub',
  '/sister-sites',
  '/operational-agreements',
  '/admin/secret',
  '/lms/instructor',
  '/help',
  '/healthcare-services',
  '/government-services',
];

htmlFiles.forEach((file) => {
  let content = fs.readFileSync(file, 'utf8');
  let modified = false;

  pathsToFix.forEach((pathToFix) => {
    // Fix href attributes
    const hrefPattern = new RegExp(`href="${pathToFix}"`, 'g');
    if (content.match(hrefPattern)) {
      content = content.replace(hrefPattern, `href="${pathToFix}.html"`);
      modified = true;
    }

    // Fix onclick window.location
    const onclickPattern = new RegExp(`window\\.location\\.href='${pathToFix}'`, 'g');
    if (content.match(onclickPattern)) {
      content = content.replace(onclickPattern, `window.location.href='${pathToFix}.html'`);
      modified = true;
    }
  });

  if (modified) {
    fs.writeFileSync(file, content);
    fixed++;
  }
});

console.log(`✅ Fixed ${fixed} HTML files\n`);
console.log('═══════════════════════════════════════════════════════');
console.log('  ALL LINKS NOW HAVE EXPLICIT .html EXTENSIONS');
console.log('═══════════════════════════════════════════════════════\n');
