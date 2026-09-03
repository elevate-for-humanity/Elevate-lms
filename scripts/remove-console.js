#!/usr/bin/env node
/**
 * Keeps console.error for critical error logging
 */

import { readFileSync, writeFileSync } from 'fs';
import { glob } from 'glob';

const files = glob.sync('src/**/*.{jsx,tsx,js,ts}', {
  ignore: 'node_modules/**',
});

let totalRemoved = 0;

files.forEach((file) => {
  let content = readFileSync(file, 'utf8');
  const original = content;

  content = content.replace(/console\.log\([^)]*\);?\n?/g, '');

  content = content.replace(/if\s*\([^)]*\)\s*console\.log\([^)]*\);?\n?/g, '');

  if (content !== original) {
    writeFileSync(file, content, 'utf8');
    const removed = (original.match(/console\.log/g) || []).length;
    totalRemoved += removed;
  }
});
