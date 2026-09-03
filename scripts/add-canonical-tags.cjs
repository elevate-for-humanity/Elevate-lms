#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const SITE_URL = 'https://www.elevateforhumanity.org';

function getPagePath(filePath) {
  // Convert file path to URL path
  // /workspaces/fix2/app/about/page.tsx -> /about
  // /workspaces/fix2/app/page.tsx -> /
  const relativePath = filePath.replace(/.*\/app/, '').replace(/\/page\.tsx$/, '');
  return relativePath || '/';
}

function addCanonicalToMetadata(content, pagePath) {
  const canonicalUrl = `${SITE_URL}${pagePath}`;

  // Pattern 1: export const metadata = { ... }
  const metadataPattern = /export const metadata\s*=\s*{([^}]+)}/s;

  if (metadataPattern.test(content)) {
    // Check if alternates already exists
    if (content.includes('alternates:')) {
      // Check if canonical already exists
      if (content.includes('canonical:')) {
        return content; // Already has canonical
      }
      // Add canonical to existing alternates
      return content.replace(/alternates:\s*{/, `alternates: {\n    canonical: "${canonicalUrl}",`);
    } else {
      // Add alternates with canonical
      return content.replace(
        /export const metadata\s*=\s*{/,
        `export const metadata = {\n  alternates: {\n    canonical: "${canonicalUrl}",\n  },`,
      );
    }
  }

  // Pattern 2: export const metadata: Metadata = { ... }
  const typedMetadataPattern = /export const metadata:\s*Metadata\s*=\s*{([^}]+)}/s;

  if (typedMetadataPattern.test(content)) {
    if (content.includes('alternates:')) {
      if (content.includes('canonical:')) {
        return content;
      }
      return content.replace(/alternates:\s*{/, `alternates: {\n    canonical: "${canonicalUrl}",`);
    } else {
      return content.replace(
        /export const metadata:\s*Metadata\s*=\s*{/,
        `export const metadata: Metadata = {\n  alternates: {\n    canonical: "${canonicalUrl}",\n  },`,
      );
    }
  }

  return content;
}

function processFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');

    // Skip if no metadata export
    if (!content.includes('export const metadata')) {
      return false;
    }

    // Skip if already has canonical
    if (content.includes('canonical:') || content.includes('canonical =')) {
      return false;
    }

    const pagePath = getPagePath(filePath);
    const updatedContent = addCanonicalToMetadata(content, pagePath);

    if (updatedContent !== content) {
      fs.writeFileSync(filePath, updatedContent, 'utf8');
      return true;
    }

    return false;
  } catch (error) {
    console.error(`Error processing ${filePath}:`, error.message);
    return false;
  }
}

function findPageFiles(dir, fileList = []) {
  const files = fs.readdirSync(dir);

  files.forEach((file) => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);

    if (stat.isDirectory()) {
      // Skip node_modules, .next, etc.
      if (!file.startsWith('.') && file !== 'node_modules') {
        findPageFiles(filePath, fileList);
      }
    } else if (file === 'page.tsx' || file === 'page.ts') {
      fileList.push(filePath);
    }
  });

  return fileList;
}

// Main execution
const appDir = path.join(process.cwd(), 'app');
console.log('🔍 Finding all page.tsx files...');

const pageFiles = findPageFiles(appDir);
console.log(`📄 Found ${pageFiles.length} page files`);

let updated = 0;
let skipped = 0;

pageFiles.forEach((filePath) => {
  const relativePath = filePath.replace(process.cwd(), '');
  if (processFile(filePath)) {
    console.log(`✅ Updated: ${relativePath}`);
    updated++;
  } else {
    skipped++;
  }
});

console.log('\n📊 Summary:');
console.log(`✅ Updated: ${updated} files`);
console.log(`⏭️  Skipped: ${skipped} files (no metadata or already has canonical)`);
console.log(`📝 Total: ${pageFiles.length} files`);
