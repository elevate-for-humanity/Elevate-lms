#!/usr/bin/env node

/**
 * Accessibility Enhancement Script
 * Adds ARIA labels, roles, and other accessibility features
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');


const fixes = [];

// Patterns to find and fix
const patterns = [
  {
    name: 'Add alt text to images without it',
    find: /<img([^>]*?)src="([^"]+)"(?![^>]*alt=)/g,
    replace: (match, attrs, src) => {
      const filename = path.basename(src, path.extname(src));
      const altText = filename.replace(/[-_]/g, ' ');
      return `<img${attrs}src="${src}" alt="${altText}"`;
    },
  },
  {
    name: 'Add aria-label to buttons without text',
    find: /<button([^>]*?)>(\s*<(?:svg|i|span class="icon")[^>]*>.*?<\/(?:svg|i|span)>\s*)<\/button>/g,
    replace: (match, attrs, content) => {
      if (attrs.includes('aria-label')) return match;
      return `<button${attrs} aria-label="Action button">${content}</button>`;
    },
  },
  {
    name: 'Add role to navigation',
    find: /<nav(?![^>]*role=)/g,
    replace: '<nav role="navigation"',
  },
  {
    name: 'Add role to main content',
    find: /<main(?![^>]*role=)/g,
    replace: '<main role="main"',
  },
  {
    name: 'Add aria-label to form inputs without labels',
    find: /<input([^>]*?)type="([^"]+)"(?![^>]*aria-label=)(?![^>]*id=)/g,
    replace: (match, attrs, type) => {
      return `<input${attrs}type="${type}" aria-label="${type} input"`;
    },
  },
];

function processFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let modified = false;
  let fileFixCount = 0;

  patterns.forEach((pattern) => {
    const matches = content.match(pattern.find);
    if (matches) {
      content = content.replace(pattern.find, pattern.replace);
      modified = true;
      fileFixCount += matches.length;
      fixes.push({
        file: path.relative(rootDir, filePath),
        fix: pattern.name,
        count: matches.length,
      });
    }
  });

  if (modified) {
    fs.writeFileSync(filePath, content, 'utf8');
      `✅ Fixed ${fileFixCount} issues in ${path.relative(rootDir, filePath)}`
    );
  }

  return modified;
}

function scanDirectory(dir) {
  const files = fs.readdirSync(dir);

  files.forEach((file) => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);

    if (stat.isDirectory()) {
      if (!file.startsWith('.') && file !== 'node_modules' && file !== 'dist') {
        scanDirectory(filePath);
      }
    } else if (
      file.endsWith('.tsx') ||
      file.endsWith('.jsx') ||
      file.endsWith('.html')
    ) {
      processFile(filePath);
    }
  });
}

// Scan src directory
scanDirectory(path.join(rootDir, 'src'));

// Scan public directory
scanDirectory(path.join(rootDir, 'public'));

// Summary

if (fixes.length > 0) {
  const fixTypes = {};
  fixes.forEach((fix) => {
    fixTypes[fix.fix] = (fixTypes[fix.fix] || 0) + fix.count;
  });
  Object.entries(fixTypes).forEach(([type, count]) => {
  });
}

