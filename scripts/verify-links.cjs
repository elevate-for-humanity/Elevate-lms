#!/usr/bin/env node
/**
 * Verify all internal links and routes
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 Verifying all links and routes...\n');

const pages = new Set();
const links = new Set();
const broken = [];

function findPages(dir) {
  if (!fs.existsSync(dir)) return;

  const items = fs.readdirSync(dir);
  items.forEach((item) => {
    const fullPath = path.join(dir, item);
    const stat = fs.statSync(fullPath);

    if (stat.isDirectory() && !item.includes('node_modules')) {
      findPages(fullPath);
    } else if (item.endsWith('.html')) {
      pages.add(fullPath);
      extractLinks(fullPath);
    }
  });
}

function extractLinks(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const hrefRegex = /href=["']([^"']+)["']/g;
  let match;

  while ((match = hrefRegex.exec(content)) !== null) {
    const link = match[1];
    if (!link.startsWith('http') && !link.startsWith('#') && !link.startsWith('mailto:')) {
      links.add(link);
    }
  }
}

['public', 'sites', 'pages'].forEach((dir) => findPages(dir));

console.log(`✅ Found ${pages.size} pages`);
console.log(`✅ Found ${links.size} internal links`);

// Check for broken links
links.forEach((link) => {
  const cleanLink = link.replace(/^\//, '');
  let found = false;

  pages.forEach((page) => {
    if (page.includes(cleanLink)) {
      found = true;
    }
  });

  if (!found && !link.includes('?') && !link.includes('api')) {
    broken.push(link);
  }
});

if (broken.length > 0) {
  console.log(`\n⚠️  Found ${broken.length} potentially broken links:`);
  broken.slice(0, 10).forEach((link) => console.log(`   - ${link}`));
} else {
  console.log('\n✅ All links verified!');
}

console.log('\n📊 Summary:');
console.log(`   Pages: ${pages.size}`);
console.log(`   Links: ${links.size}`);
console.log(`   Broken: ${broken.length}`);
