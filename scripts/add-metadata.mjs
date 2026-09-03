#!/usr/bin/env node
/**
 * Add metadata to all pages missing it
 */

import fs from 'fs';
import path from 'path';

const pagesFile = '/tmp/pages-without-meta.txt';
const pages = fs.readFileSync(pagesFile, 'utf-8').trim().split('\n');

function getTitle(filePath) {
  // Extract route from file path
  const route = filePath
    .replace('app/', '')
    .replace('/page.tsx', '')
    .replace(/\[.*?\]/g, '')
    .replace(/\(.*?\)\//g, '')
    .split('/')
    .filter(Boolean)
    .map((s) => s.charAt(0).toUpperCase() + s.slice(1).replace(/-/g, ' '))
    .join(' | ');

  return route || 'Home';
}

function getCanonical(filePath) {
  const route = filePath
    .replace('app/', '')
    .replace('/page.tsx', '')
    .replace(/\[.*?\]/g, '')
    .replace(/\(.*?\)\//g, '');

  return `https://www.elevateforhumanity.org/${route}`.replace(/\/+$/, '');
}

function shouldBeNoIndex(filePath) {
  const noIndexPatterns = [
    '/admin',
    '/staff',
    '/partner/',
    '/employee/',
    '/checkout',
    '/payment',
    '/invoice',
    '/demo/',
    '/test/',
    '/sentry',
    '/debug',
    '/dev-',
    '/org/',
    'login',
    'signup',
    'verify-email',
    'reset-password',
  ];
  return noIndexPatterns.some((p) => filePath.includes(p));
}

let updated = 0;
let skipped = 0;

for (const filePath of pages) {
  if (!filePath || !fs.existsSync(filePath)) {
    skipped++;
    continue;
  }

  const content = fs.readFileSync(filePath, 'utf-8');

  // Skip if already has metadata
  if (content.includes('export const metadata') || content.includes('generateMetadata')) {
    skipped++;
    continue;
  }

  // Skip dynamic routes for now
  if (filePath.includes('[') && filePath.includes(']')) {
    skipped++;
    continue;
  }

  const title = getTitle(filePath);
  const canonical = getCanonical(filePath);
  const noIndex = shouldBeNoIndex(filePath);

  const metadataBlock = `import { Metadata } from 'next';

export const metadata: Metadata = {
  title: '${title} | Elevate for Humanity',
  description: 'Elevate for Humanity - Career training and workforce development programs.',
  alternates: {
    canonical: '${canonical}',
  },${
    noIndex
      ? `
  robots: {
    index: false,
    follow: false,
  },`
      : ''
  }
};

`;

  // Check if file starts with 'use client'
  if (content.startsWith("'use client'") || content.startsWith('"use client"')) {
    // Can't add metadata to client components - need layout.tsx instead
    console.log(`SKIP (client): ${filePath}`);
    skipped++;
    continue;
  }

  // Add metadata at the top after any existing imports
  const importMatch = content.match(/^(import[\s\S]*?from\s+['"][^'"]+['"];?\s*\n)+/);

  let newContent;
  if (importMatch) {
    // Add after existing imports
    const existingImports = importMatch[0];
    const rest = content.slice(existingImports.length);

    // Check if Metadata is already imported
    if (
      !existingImports.includes('import { Metadata }') &&
      !existingImports.includes('import type { Metadata }')
    ) {
      newContent =
        existingImports +
        `import { Metadata } from 'next';\n\nexport const metadata: Metadata = {
  title: '${title} | Elevate for Humanity',
  description: 'Elevate for Humanity - Career training and workforce development programs.',
  alternates: {
    canonical: '${canonical}',
  },${
    noIndex
      ? `
  robots: {
    index: false,
    follow: false,
  },`
      : ''
  }
};\n` +
        rest;
    } else {
      newContent =
        existingImports +
        `\nexport const metadata: Metadata = {
  title: '${title} | Elevate for Humanity',
  description: 'Elevate for Humanity - Career training and workforce development programs.',
  alternates: {
    canonical: '${canonical}',
  },${
    noIndex
      ? `
  robots: {
    index: false,
    follow: false,
  },`
      : ''
  }
};\n` +
        rest;
    }
  } else {
    // No imports, add at top
    newContent = metadataBlock + content;
  }

  fs.writeFileSync(filePath, newContent);
  console.log(`UPDATED: ${filePath}`);
  updated++;
}

console.log(`\nDone! Updated: ${updated}, Skipped: ${skipped}`);
