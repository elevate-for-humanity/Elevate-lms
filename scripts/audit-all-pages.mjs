#!/usr/bin/env node

import { readFileSync, readdirSync, statSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const appDir = join(__dirname, '..', 'app');

// Find all page files
function findAllPages(dir, baseDir = dir) {
  let pages = [];
  const items = readdirSync(dir);

  for (const item of items) {
    const fullPath = join(dir, item);
    const stat = statSync(fullPath);

    if (stat.isDirectory()) {
      // Skip certain directories
      if (!item.startsWith('.') && item !== 'node_modules' && item !== 'api') {
        pages = pages.concat(findAllPages(fullPath, baseDir));
      }
    } else if (
      item === 'page.tsx' ||
      item === 'page.ts' ||
      item === 'page.jsx' ||
      item === 'page.js'
    ) {
      const relativePath =
        fullPath.replace(baseDir, '').replace(/\/page\.(tsx|ts|jsx|js)$/, '') || '/';
      pages.push({
        path: relativePath,
        file: fullPath,
      });
    }
  }

  return pages;
}

// Analyze page content
function analyzePage(filePath) {
  try {
    const content = readFileSync(filePath, 'utf-8');

    return {
      hasHeroImage: /Hero|hero.*[Ii]mage|<Image[^>]*hero|banner.*[Ii]mage/.test(content),
      hasImage: /<Image/.test(content),
      hasCTA: /Apply Now|Get Started|Contact|Learn More|Enroll|Sign Up/.test(content),
      hasPlaceholder: /TODO|FIXME|placeholder|coming soon|Lorem ipsum/i.test(content),
      hasMetadata: /export const metadata/.test(content),
      hasAltText: /alt=["'](?!["'])[^"']+["']/.test(content),
      isAuthRequired: /redirect\(['"]\/login['"]\)|createClient|getUser/.test(content),
      lineCount: content.split('\n').length,
    };
  } catch (error) {
    return null;
  }
}

// Categorize pages
function categorizePage(path) {
  if (path.startsWith('/admin')) return 'admin';
  if (path.startsWith('/student') || path.startsWith('/lms')) return 'lms';
  if (path.startsWith('/instructor')) return 'instructor';
  if (path.startsWith('/program-holder')) return 'program-holder';
  if (path.startsWith('/employer')) return 'employer';
  if (path.startsWith('/partner')) return 'partner';
  if (path.startsWith('/programs')) return 'programs';
  if (path.startsWith('/courses')) return 'courses';
  if (path.startsWith('/auth') || path === '/login' || path === '/signup') return 'auth';
  if (path.startsWith('/delegate') || path.startsWith('/board')) return 'delegate';
  return 'marketing';
}

const pages = findAllPages(appDir);

const categories = {
  marketing: [],
  programs: [],
  courses: [],
  lms: [],
  admin: [],
  instructor: [],
  'program-holder': [],
  employer: [],
  partner: [],
  delegate: [],
  auth: [],
};

const issues = {
  noHeroImage: [],
  noCTA: [],
  hasPlaceholder: [],
  noMetadata: [],
  noAltText: [],
};

for (const page of pages) {
  const category = categorizePage(page.path);
  const analysis = analyzePage(page.file);

  if (analysis) {
    categories[category].push({
      path: page.path,
      ...analysis,
    });

    // Track issues
    if (!analysis.hasHeroImage && category === 'marketing') {
      issues.noHeroImage.push(page.path);
    }
    if (!analysis.hasCTA && ['marketing', 'programs'].includes(category)) {
      issues.noCTA.push(page.path);
    }
    if (analysis.hasPlaceholder) {
      issues.hasPlaceholder.push(page.path);
    }
    if (!analysis.hasMetadata) {
      issues.noMetadata.push(page.path);
    }
    if (analysis.hasImage && !analysis.hasAltText) {
      issues.noAltText.push(page.path);
    }
  }
}

// Print summary
for (const [category, pageList] of Object.entries(categories)) {
}

for (const [category, pageList] of Object.entries(categories)) {
  if (pageList.length > 0) {
    const withHero = pageList.filter((p) => p.hasHeroImage).length;
    const withCTA = pageList.filter((p) => p.hasCTA).length;
    const withPlaceholder = pageList.filter((p) => p.hasPlaceholder).length;
    const withMetadata = pageList.filter((p) => p.hasMetadata).length;
  }
}

// Export data for further processing
import { writeFileSync } from 'fs';
writeFileSync(
  join(__dirname, '..', 'page-audit-results.json'),
  JSON.stringify({ categories, issues, total: pages.length }, null, 2),
);
