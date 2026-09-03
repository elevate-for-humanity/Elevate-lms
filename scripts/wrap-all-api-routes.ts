#!/usr/bin/env ts-node
/**
 * Wraps all API routes with error handling
 * This script adds try/catch blocks to all API route handlers
 */

import * as fs from 'fs';
import * as path from 'path';
import { glob } from 'glob';

const API_DIR = path.join(process.cwd(), 'app/api');

function wrapRouteWithErrorHandling(content: string): string {
  // Skip if already has try/catch
  if (content.includes('try {') && content.includes('catch')) {
    return content;
  }

  // Pattern to match export async function GET/POST/etc
  const functionPattern = /export async function (GET|POST|PUT|DELETE|PATCH)\s*\([^)]*\)\s*{/g;

  let modified = content;
  let match;

  while ((match = functionPattern.exec(content)) !== null) {
    const method = match[1];
    const startIndex = match.index + match[0].length;

    // Find the matching closing brace
    let braceCount = 1;
    let endIndex = startIndex;

    for (let i = startIndex; i < content.length; i++) {
      if (content[i] === '{') braceCount++;
      if (content[i] === '}') braceCount--;
      if (braceCount === 0) {
        endIndex = i;
        break;
      }
    }

    // Extract function body
    const functionBody = content.substring(startIndex, endIndex);

    // Wrap with try/catch
    const wrappedBody = `
  try {${functionBody}
  } catch (error) {
    return NextResponse.json(
      { error: 'An unexpected error occurred. Please try again.' },
      { status: 500 }
    );
  }`;

    // Replace in content
    modified = modified.substring(0, startIndex) + wrappedBody + modified.substring(endIndex);
  }

  return modified;
}

async function main() {
  const files = await glob(`${API_DIR}/**/route.{ts,tsx}`, { ignore: '**/node_modules/**' });

  let fixed = 0;
  let skipped = 0;

  for (const file of files) {
    const content = fs.readFileSync(file, 'utf-8');

    // Skip if already has try/catch
    if (content.includes('try {') && content.includes('catch')) {
      skipped++;
      continue;
    }

    const wrapped = wrapRouteWithErrorHandling(content);

    if (wrapped !== content) {
      fs.writeFileSync(file, wrapped);
      fixed++;
    } else {
      skipped++;
    }
  }
}

main().catch(console.error);
