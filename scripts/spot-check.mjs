#!/usr/bin/env node

/**
 * 5-MINUTE SPOT-CHECK — DOES THIS SYSTEM ACTUALLY WORK?
 *
 * Randomly samples pages to verify archetype system integrity
 * Detects rushed work, fake completeness, or archetype bypassing
 */

import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';

const ROOT = process.cwd();
const APP_DIR = path.join(ROOT, 'app');

// Sample categories
const CATEGORIES = {
  program: ['/programs/', '/courses/', '/lms/', '/apprenticeships/'],
  dashboard: ['/dashboard', '/student/', '/instructor/', '/admin/', '/portal/'],
  policy: ['/privacy', '/terms', '/accessibility', '/ferpa', '/legal/'],
  directory: ['/directory', '/search', '/opportunities', '/all-pages'],
  marketing: ['/', '/about', '/contact', '/blog/', '/faq', '/impact'],
};

function getAllPages() {
  const pages = [];

  function walk(dir) {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        walk(fullPath);
      } else if (entry.name === 'page.tsx') {
        pages.push(fullPath);
      }
    }
  }

  walk(APP_DIR);
  return pages;
}

function fileToRoute(file) {
  const rel = path.relative(APP_DIR, file);
  const parts = rel.split(path.sep);
  parts.pop(); // Remove page.tsx

  const cleaned = parts
    .filter((seg) => !seg.startsWith('(') || !seg.endsWith(')'))
    .filter((seg) => !seg.startsWith('@'));

  return '/' + cleaned.join('/');
}

function matchesCategory(route, patterns) {
  return patterns.some((pattern) => route.includes(pattern));
}

function samplePages(pages, count = 10) {
  const samples = {
    program: [],
    dashboard: [],
    policy: [],
    directory: [],
    marketing: [],
  };

  // Categorize all pages
  for (const page of pages) {
    const route = fileToRoute(page);
    for (const [category, patterns] of Object.entries(CATEGORIES)) {
      if (matchesCategory(route, patterns)) {
        samples[category].push({ file: page, route });
        break;
      }
    }
  }

  // Sample 2 from each category
  const selected = [];
  for (const [category, items] of Object.entries(samples)) {
    if (items.length > 0) {
      const shuffled = items.sort(() => Math.random() - 0.5);
      selected.push(...shuffled.slice(0, 2));
    }
  }

  return selected.slice(0, count);
}

function checkArchetypeIntegrity(file) {
  const content = fs.readFileSync(file, 'utf8');

  const checks = {
    hasArchetypeImport: /import.*from.*archetype/i.test(content),
    hasInlineLayout: /<div[^>]*className="[^"]*hero[^"]*"/.test(content) && !/<Hero/.test(content),
    hasInlineCopy:
      content
        .split('\n')
        .filter(
          (line) =>
            line.includes('className=') &&
            line.includes('>') &&
            !line.includes('import') &&
            !line.includes('//'),
        ).length > 20,
  };

  return checks;
}

function checkForbiddenPhrases(file) {
  const content = fs.readFileSync(file, 'utf8').toLowerCase();
  const forbidden = [
    'coming soon',
    'placeholder',
    'tbd',
    'lorem ipsum',
    'under development',
    'work in progress',
  ];

  const found = [];
  for (const phrase of forbidden) {
    if (content.includes(phrase)) {
      found.push(phrase);
    }
  }

  return found;
}

function checkMetadata(file) {
  const content = fs.readFileSync(file, 'utf8');

  const hasMetadata = /export\s+(const\s+metadata|async\s+function\s+generateMetadata)/.test(
    content,
  );

  let title = null;
  const titleMatch = content.match(/title:\s*['"`]([^'"`]+)['"`]/);
  if (titleMatch) {
    title = titleMatch[1];
  }

  return { hasMetadata, title };
}

const allPages = getAllPages();
const samples = samplePages(allPages);

let failures = 0;

for (let i = 0; i < samples.length; i++) {
  const { file, route } = samples[i];

  // Check 1: Forbidden phrases
  const forbidden = checkForbiddenPhrases(file);
  if (forbidden.length > 0) {
    failures++;
    continue;
  } else {
  }

  // Check 2: Archetype integrity
  const integrity = checkArchetypeIntegrity(file);
  if (integrity.hasInlineLayout && !integrity.hasArchetypeImport) {
  } else if (integrity.hasArchetypeImport) {
  } else {
  }

  // Check 3: Metadata
  const metadata = checkMetadata(file);
  if (!metadata.hasMetadata) {
    failures++;
  } else {
  }

  // Check 4: File size (proxy for content)
  const stats = fs.statSync(file);
  const sizeKB = (stats.size / 1024).toFixed(1);
  if (stats.size < 500) {
  } else {
  }
}

try {
  execSync('npm run archetype:check', {
    encoding: 'utf8',
    stdio: 'inherit',
  });
} catch (error) {
  failures++;
}

if (failures === 0) {
} else {
  process.exit(1);
}
