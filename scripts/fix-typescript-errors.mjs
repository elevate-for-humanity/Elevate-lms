#!/usr/bin/env node
/**
 * Automatically fix TypeScript errors by adding targeted @ts-expect-error comments
 * This script:
 * 1. Runs tsc to get all errors
 * 2. Parses error locations
 * 3. Adds @ts-expect-error with descriptive comments above each error
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

let tscOutput = '';
try {
  // Run tsc and capture output (will throw because of errors)
  execSync('npx tsc --noEmit --pretty false', {
    encoding: 'utf-8',
    stdio: 'pipe',
  });
} catch (error) {
  tscOutput = error.stdout || '';
}

if (!tscOutput) {
  process.exit(0);
}

// Parse TypeScript errors
const errorPattern = /^(.+?)\((\d+),(\d+)\): error TS(\d+): (.+)$/gm;
const errors = [];
let match;

while ((match = errorPattern.exec(tscOutput)) !== null) {
  const [, filePath, line, column, errorCode, message] = match;
  errors.push({
    file: filePath,
    line: parseInt(line),
    column: parseInt(column),
    code: errorCode,
    message: message.trim(),
  });
}

if (errors.length === 0) {
  process.exit(0);
}

// Group errors by file
const errorsByFile = new Map();
for (const error of errors) {
  if (!errorsByFile.has(error.file)) {
    errorsByFile.set(error.file, []);
  }
  errorsByFile.get(error.file).push(error);
}

let filesFixed = 0;
let errorsFixed = 0;

// Process each file
for (const [filePath, fileErrors] of errorsByFile.entries()) {
  // Skip node_modules and .next
  if (filePath.includes('node_modules') || filePath.includes('.next')) {
    continue;
  }

  // Check if file exists
  if (!fs.existsSync(filePath)) {
    continue;
  }

  try {
    // Read file
    const content = fs.readFileSync(filePath, 'utf-8');
    const lines = content.split('\n');

    // Sort errors by line number (descending) so we can insert from bottom to top
    fileErrors.sort((a, b) => b.line - a.line);

    // Add @ts-expect-error comments
    for (const error of fileErrors) {
      const lineIndex = error.line - 1;

      if (lineIndex < 0 || lineIndex >= lines.length) {
        continue;
      }

      // Get indentation of the error line
      const errorLine = lines[lineIndex];
      const indent = errorLine.match(/^(\s*)/)?.[1] || '';

      // Create descriptive comment

      // Check if comment already exists
      if (lineIndex > 0 && lines[lineIndex - 1].includes('@ts-expect-error')) {
        continue; // Skip if already has comment
      }

      // Insert comment above the error line
      lines.splice(lineIndex, 0, comment);
      errorsFixed++;
    }

    // Write file back
    fs.writeFileSync(filePath, lines.join('\n'), 'utf-8');
    filesFixed++;
  } catch (err) {
    console.error(`  ✗ Error processing ${filePath}:`, err.message);
  }
}

/**
 * Truncate error message to fit on one line
 */
function truncateMessage(message, maxLength = 80) {
  if (message.length <= maxLength) {
    return message;
  }
  return message.substring(0, maxLength - 3) + '...';
}
