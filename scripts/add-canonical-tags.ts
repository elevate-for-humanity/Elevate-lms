#!/usr/bin/env tsx
/**
 * Add canonical tags to pages missing them
 * Generates metadata with canonical URLs for SEO
 */

import * as fs from 'fs';
import * as path from 'path';

const APP_DIR = path.join(process.cwd(), 'app');
const BASE_URL = 'https://www.elevateforhumanity.org';

// Pages that should be noindex (admin, internal, etc.)
const NOINDEX_PATTERNS = [
  '/admin',
  '/admin/staff-portal',
  '/lms/',
  '/api/',
  '/auth/',
  '/login',
  '/signup',
  '/reset-password',
  '/verify',
  '/onboarding',
  '/checkout',
  '/success',
  '/error',
  '/404',
  '/500',
];

function shouldNoIndex(pagePath: string): boolean {
  return NOINDEX_PATTERNS.some((pattern) => pagePath.includes(pattern));
}

function getPagePath(filePath: string): string {
  // Convert file path to URL path
  let urlPath = filePath
    .replace(APP_DIR, '')
    .replace('/page.tsx', '')
    .replace(/\[([^\]]+)\]/g, ':$1') // Convert [slug] to :slug for display
    .replace(/\/+/g, '/');

  if (urlPath === '' || urlPath === '/') {
    return '/';
  }

  return urlPath;
}

function generateMetadataBlock(pagePath: string, title: string): string {
  const noindex = shouldNoIndex(pagePath);
  const canonicalPath = pagePath.replace(/:([^/]+)/g, ''); // Remove dynamic segments for canonical

  if (noindex) {
    return `
export const metadata: Metadata = {
  title: '${title}',
  robots: { index: false, follow: false },
};
`;
  }

  return `
export const metadata: Metadata = {
  title: '${title}',
  alternates: { canonical: '${BASE_URL}${canonicalPath}' },
};
`;
}

function getPageTitle(filePath: string): string {
  // Try to extract title from file content or generate from path
  const content = fs.readFileSync(filePath, 'utf-8');

  // Look for h1 or title in the file
  const h1Match = content.match(/<h1[^>]*>([^<]+)<\/h1>/);
  if (h1Match) {
    return h1Match[1].replace(/[{}]/g, '').trim();
  }

  // Generate from path
  const pagePath = getPagePath(filePath);
  const segments = pagePath.split('/').filter(Boolean);
  const lastSegment = segments[segments.length - 1] || 'Home';

  return lastSegment
    .replace(/-/g, ' ')
    .replace(/:/g, '')
    .split(' ')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

function hasMetadata(content: string): boolean {
  return (
    content.includes('export const metadata') ||
    content.includes('export async function generateMetadata') ||
    content.includes('alternates:') ||
    content.includes('canonical')
  );
}

function addMetadataImport(content: string): string {
  if (content.includes('import { Metadata }') || content.includes('import type { Metadata }')) {
    return content;
  }

  // Add import at the top
  if (content.includes('import ')) {
    return content.replace(/(import .+? from .+?;\n)/, "$1import { Metadata } from 'next';\n");
  }

  return `import { Metadata } from 'next';\n\n${content}`;
}

async function processFile(filePath: string): Promise<boolean> {
  const content = fs.readFileSync(filePath, 'utf-8');

  // Skip if already has metadata
  if (hasMetadata(content)) {
    return false;
  }

  // Skip API routes and non-page files
  if (filePath.includes('/api/') || !filePath.endsWith('page.tsx')) {
    return false;
  }

  const pagePath = getPagePath(filePath);
  const title = getPageTitle(filePath);
  const metadataBlock = generateMetadataBlock(pagePath, title);

  // Add import and metadata
  let newContent = addMetadataImport(content);

  // Find the right place to insert metadata (after imports, before component)
  const exportMatch = newContent.match(
    /^(export (?:default )?(?:async )?function|export default)/m,
  );
  if (exportMatch && exportMatch.index) {
    newContent =
      newContent.slice(0, exportMatch.index) +
      metadataBlock +
      '\n' +
      newContent.slice(exportMatch.index);
  }

  fs.writeFileSync(filePath, newContent);
  return true;
}

async function main() {
  console.log('🔍 Scanning for pages without canonical tags...\n');

  const pages: string[] = [];

  function scanDir(dir: string) {
    const items = fs.readdirSync(dir);
    for (const item of items) {
      const fullPath = path.join(dir, item);
      const stat = fs.statSync(fullPath);

      if (stat.isDirectory() && !item.startsWith('.') && item !== 'node_modules') {
        scanDir(fullPath);
      } else if (item === 'page.tsx') {
        pages.push(fullPath);
      }
    }
  }

  scanDir(APP_DIR);

  console.log(`📄 Found ${pages.length} pages\n`);

  let updated = 0;
  let skipped = 0;

  for (const page of pages) {
    try {
      const wasUpdated = await processFile(page);
      if (wasUpdated) {
        updated++;
        const pagePath = getPagePath(page);
        console.log(`  ✅ ${pagePath}`);
      } else {
        skipped++;
      }
    } catch (error) {
      console.log(`  ❌ ${page}: ${error}`);
    }
  }

  console.log(`\n📊 Results:`);
  console.log(`   Updated: ${updated} pages`);
  console.log(`   Skipped: ${skipped} pages (already have metadata)`);
  console.log(`\n✅ Done!`);
}

main().catch(console.error);
