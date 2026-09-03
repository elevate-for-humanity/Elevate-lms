#!/usr/bin/env node
/**
 * Build a pages manifest that Framer can consume
 * Scans src/pages and generates /public/catalog/pages.json
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const APP_ROOT = path.resolve(__dirname, '..');
const PAGES_DIR = path.join(APP_ROOT, 'src', 'pages');
const OUT_DIR = path.join(APP_ROOT, 'public', 'catalog');

// Ensure output directory exists
fs.mkdirSync(OUT_DIR, { recursive: true });

// Category mapping based on file names/paths
const categoryMap = {
  student: 'student-portal',
  instructor: 'instructor-portal',
  admin: 'admin-portal',
  lms: 'learning',
  course: 'learning',
  program: 'programs',
  training: 'programs',
  government: 'government',
  philanthropy: 'philanthropy',
  donate: 'philanthropy',
  analytics: 'analytics',
  dashboard: 'dashboards',
  sheets: 'productivity',
  slides: 'productivity',
  docs: 'productivity',
  email: 'productivity',
  calendar: 'productivity',
  meet: 'productivity',
  drive: 'productivity',
  video: 'productivity',
  file: 'productivity',
  ai: 'ai-tools',
  tutor: 'ai-tools',
  notebook: 'ai-tools',
  brain: 'ai-tools',
  elevate: 'ai-tools',
};

// Guess title from filename
const guessTitle = (filename) => {
  return filename
    .replace(/\.[tj]sx?$/, '')
    .replace(/([A-Z])/g, ' $1')
    .replace(/[-_]/g, ' ')
    .trim()
    .replace(/\b\w/g, (m) => m.toUpperCase());
};

// Guess category from filename
const guessCategory = (filename) => {
  const lower = filename.toLowerCase();
  for (const [key, cat] of Object.entries(categoryMap)) {
    if (lower.includes(key)) return cat;
  }
  return 'general';
};

// Guess path from filename
const guessPath = (filename) => {
  const base = filename
    .replace(/\.[tj]sx?$/, '')
    .replace(/([A-Z])/g, '-$1')
    .toLowerCase()
    .replace(/^-/, '');

  if (base === 'home-page' || base === 'home') return '/';
  return `/${base}`;
};

// Collect all page files
const collectPages = () => {
  const pages = [];

  if (!fs.existsSync(PAGES_DIR)) {
    console.error(`Pages directory not found: ${PAGES_DIR}`);
    return pages;
  }

  const files = fs.readdirSync(PAGES_DIR);

  for (const file of files) {
    // Skip non-component files
    if (!/\.(tsx|jsx|ts|js)$/.test(file)) continue;
    if (file.startsWith('_')) continue; // Skip utility files
    if (file.includes('.test.')) continue; // Skip tests
    if (file.includes('.backup')) continue; // Skip backups
    if (file.includes('_OLD')) continue; // Skip old files

    const title = guessTitle(file);
    const category = guessCategory(file);
    const pagePath = guessPath(file);

    pages.push({
      title,
      path: pagePath,
      category,
      image: '', // Can be filled from frontmatter or metadata later
      excerpt: `Access ${title} features and tools`,
      file,
    });
  }

  return pages;
};

// Remove duplicates by path
const uniqueByPath = (pages) => {
  const map = new Map();
  for (const page of pages) {
    if (!map.has(page.path)) {
      map.set(page.path, page);
    }
  }
  return Array.from(map.values());
};

// Main execution
const pages = uniqueByPath(collectPages()).sort((a, b) => {
  // Sort by category first, then by title
  if (a.category !== b.category) {
    return a.category.localeCompare(b.category);
  }
  return a.title.localeCompare(b.title);
});

// Group by category for easier consumption
const byCategory = pages.reduce((acc, page) => {
  if (!acc[page.category]) {
    acc[page.category] = [];
  }
  acc[page.category].push(page);
  return acc;
}, {});

const manifest = {
  generated: new Date().toISOString(),
  total: pages.length,
  categories: Object.keys(byCategory).sort(),
  pages,
  byCategory,
};

// Write manifest
const manifestPath = path.join(OUT_DIR, 'pages.json');
fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));

for (const [cat, items] of Object.entries(byCategory)) {
}
