#!/usr/bin/env node

/**
 * Add metadata exports to pages missing them
 * Generates appropriate metadata based on route
 */

import fs from 'node:fs';
import path from 'node:path';

const filesPath = '/tmp/missing_metadata_files.txt';
if (!fs.existsSync(filesPath)) {
  console.error('Run archetype mapper first to generate file list');
  process.exit(1);
}

const files = fs.readFileSync(filesPath, 'utf8').trim().split('\n').filter(Boolean);

function routeToTitle(filePath) {
  // Extract route from file path
  const match = filePath.match(/app\/(.+)\/page\.tsx$/);
  if (!match) return 'Page';

  let route = match[1];

  // Remove route groups
  route = route.replace(/\([^)]+\)\//g, '');

  // Handle dynamic segments
  route = route.replace(/\[([^\]]+)\]/g, (_, param) => {
    return param.charAt(0).toUpperCase() + param.slice(1);
  });

  // Convert to title case
  const parts = route.split('/');
  const lastPart = parts[parts.length - 1] || parts[parts.length - 2] || 'Page';

  return lastPart
    .split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

function generateMetadata(filePath) {
  const title = routeToTitle(filePath);

  return `export const metadata = {
  title: '${title} | Elevate For Humanity',
  description: '${title} page for Elevate For Humanity platform',
};

`;
}

let added = 0;

for (const file of files) {
  if (!fs.existsSync(file)) {
    console.warn(`Skipping missing file: ${file}`);
    continue;
  }

  const content = fs.readFileSync(file, 'utf8');

  // Check if already has metadata (double-check)
  if (
    /export\s+(const\s+metadata|async\s+function\s+generateMetadata|function\s+generateMetadata)\b/.test(
      content,
    )
  ) {
    continue;
  }

  // Find insertion point (after imports, before first export default)
  const lines = content.split('\n');
  let insertIndex = 0;
  let lastImportIndex = -1;

  for (let i = 0; i < lines.length; i++) {
    if (lines[i].trim().startsWith('import ')) {
      lastImportIndex = i;
    }
    if (lines[i].trim().startsWith('export default')) {
      insertIndex = i;
      break;
    }
  }

  // Insert after last import or at beginning
  if (insertIndex === 0 && lastImportIndex >= 0) {
    insertIndex = lastImportIndex + 1;
  }

  // Add blank line after imports if needed
  if (insertIndex > 0 && lines[insertIndex - 1].trim() !== '') {
    lines.splice(insertIndex, 0, '');
    insertIndex++;
  }

  const metadata = generateMetadata(file);
  lines.splice(insertIndex, 0, metadata);

  fs.writeFileSync(file, lines.join('\n'), 'utf8');
  added++;
}
