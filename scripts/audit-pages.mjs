#!/usr/bin/env node
/**
 * PAGE AUDIT SCRIPT
 * Crawls all 882 pages and detects issues
 */

import { readFileSync, writeFileSync, readdirSync, statSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = join(__dirname, '..');

// Placeholder detection patterns
const PLACEHOLDER_PATTERNS = [
  /coming soon/gi,
  /placeholder/gi,
  /lorem ipsum/gi,
  /lorem/gi,
  /\bTBD\b/g,
  /replace this/gi,
  /example content/gi,
  /sample content/gi,
  /generic/gi,
  /TODO:/gi,
  /FIXME:/gi,
];

// Find all page files
function findAllPages(dir, pages = []) {
  const files = readdirSync(dir);

  for (const file of files) {
    const fullPath = join(dir, file);
    const stat = statSync(fullPath);

    if (stat.isDirectory()) {
      if (!file.startsWith('.') && file !== 'node_modules') {
        findAllPages(fullPath, pages);
      }
    } else if (
      file === 'page.tsx' ||
      file === 'page.ts' ||
      file === 'page.jsx' ||
      file === 'page.js'
    ) {
      pages.push(fullPath);
    }
  }

  return pages;
}

// Convert file path to route
function filePathToRoute(filePath) {
  let route = filePath
    .replace(join(rootDir, 'app'), '')
    .replace(/\/page\.(tsx|ts|jsx|js)$/, '')
    .replace(/\(marketing\)/g, '')
    .replace(/\(public\)/g, '')
    .replace(/\(app\)/g, '')
    .replace(/\(dashboard\)/g, '')
    .replace(/\(partner\)/g, '');

  if (!route) route = '/';
  return route;
}

// Determine page type
function determinePageType(route, content) {
  if (route.includes('/admin')) return 'admin';
  if (route.includes('/lms')) return 'lms';
  if (route.includes('/dashboard')) return 'dashboard';
  if (route.includes('/program-holder')) return 'dashboard';
  if (route.includes('/employer')) return 'dashboard';
  if (route.includes('/admin/staff-portal')) return 'dashboard';
  if (route.includes('/instructor')) return 'dashboard';
  if (route.includes('/programs/')) return 'program';
  if (route.includes('/courses/')) return 'program';
  if (route.includes('/apply') || route.includes('/enroll')) return 'application';
  if (route.includes('/login') || route.includes('/signup')) return 'auth';
  if (route.includes('/privacy') || route.includes('/terms') || route.includes('/legal'))
    return 'legal';
  if (route.includes('/blog') || route.includes('/news')) return 'blog';
  if (route === '/' || route.includes('/about') || route.includes('/contact')) return 'marketing';
  if (content.includes('export default function') && content.includes('redirect('))
    return 'redirect';
  return 'misc';
}

// Detect issues in page
function detectIssues(filePath, content, route) {
  const issues = [];

  // Check for placeholder text
  for (const pattern of PLACEHOLDER_PATTERNS) {
    if (pattern.test(content)) {
      issues.push({
        type: 'placeholder_text',
        pattern: pattern.source,
        severity: 'high',
      });
    }
  }

  // Check for missing hero on marketing/program pages
  const pageType = determinePageType(route, content);
  if (['marketing', 'program'].includes(pageType)) {
    const hasHeroImage = /hero.*image|Image.*hero|<Image/i.test(content);
    const hasHeroVideo = /hero.*video|<video/i.test(content);
    const hasHeroSection = /hero|Hero/i.test(content);

    if (!hasHeroImage && !hasHeroVideo && hasHeroSection) {
      issues.push({
        type: 'missing_hero_media',
        severity: 'high',
        note: 'Hero section exists but no image/video detected',
      });
    }
  }

  // Check for gradient-only hero
  if (content.includes('gradient') && content.includes('hero') && !content.includes('<Image')) {
    issues.push({
      type: 'gradient_only_hero',
      severity: 'medium',
    });
  }

  // Check for missing CTA
  const hasCTA = /apply|enroll|contact|get started|sign up|book|schedule/i.test(content);
  if (['marketing', 'program'].includes(pageType) && !hasCTA) {
    issues.push({
      type: 'missing_cta',
      severity: 'medium',
    });
  }

  // Check for missing H1
  const hasH1 = /<h1|className.*text-[45]xl|className.*text-6xl/i.test(content);
  if (!hasH1 && pageType !== 'redirect') {
    issues.push({
      type: 'missing_h1',
      severity: 'medium',
    });
  }

  // Check for empty sections
  if (content.includes('TODO') || content.includes('FIXME')) {
    issues.push({
      type: 'todo_comments',
      severity: 'low',
    });
  }

  return issues;
}

// Scan for media references in comments
function scanMediaReferences(content, filePath) {
  const references = [];
  const lines = content.split('\n');

  lines.forEach((line, index) => {
    // Check for image references in comments
    if (line.includes('//') || line.includes('/*') || line.includes('*')) {
      // Look for URLs
      const urlMatch = line.match(/(https?:\/\/[^\s]+)/);
      if (urlMatch) {
        references.push({
          url: urlMatch[1],
          line: index + 1,
          context: line.trim(),
        });
      }

      // Look for "use this image" or similar
      if (/use.*image|hero.*image|replace.*image|image.*asset/i.test(line)) {
        references.push({
          type: 'image_reference',
          line: index + 1,
          context: line.trim(),
        });
      }
    }
  });

  return references;
}

// Main audit function
async function auditAllPages() {
  const appDir = join(rootDir, 'app');
  const allPages = findAllPages(appDir);

  const auditResults = [];
  const mediaMapping = [];

  for (const filePath of allPages) {
    const content = readFileSync(filePath, 'utf-8');
    const route = filePathToRoute(filePath);
    const pageType = determinePageType(route, content);
    const issues = detectIssues(filePath, content, route);
    const mediaRefs = scanMediaReferences(content, filePath);

    auditResults.push({
      route,
      filePath: filePath.replace(rootDir + '/', ''),
      pageType,
      issues,
      issueCount: issues.length,
      hasPlaceholder: issues.some((i) => i.type === 'placeholder_text'),
      missingHero: issues.some((i) => i.type === 'missing_hero_media'),
      missingCTA: issues.some((i) => i.type === 'missing_cta'),
    });

    if (mediaRefs.length > 0) {
      mediaMapping.push({
        route,
        filePath: filePath.replace(rootDir + '/', ''),
        references: mediaRefs,
      });
    }
  }

  // Generate summary
  const totalIssues = auditResults.reduce((sum, page) => sum + page.issueCount, 0);
  const pagesWithIssues = auditResults.filter((p) => p.issueCount > 0).length;
  const pagesWithPlaceholders = auditResults.filter((p) => p.hasPlaceholder).length;
  const pagesWithMissingHero = auditResults.filter((p) => p.missingHero).length;
  const pagesWithMissingCTA = auditResults.filter((p) => p.missingCTA).length;

  const summary = {
    totalPages: allPages.length,
    pagesScanned: auditResults.length,
    totalIssues,
    pagesWithIssues,
    pagesWithPlaceholders,
    pagesWithMissingHero,
    pagesWithMissingCTA,
    mediaReferencesFound: mediaMapping.length,
    timestamp: new Date().toISOString(),
  };

  // Write JSON report
  const jsonReport = {
    summary,
    pages: auditResults,
  };

  writeFileSync(join(rootDir, 'reports/page-audit.json'), JSON.stringify(jsonReport, null, 2));

  // Write markdown report
  let mdReport = `# Page Audit Report\n\n`;
  mdReport += `**Generated:** ${summary.timestamp}\n\n`;
  mdReport += `## Summary\n\n`;
  mdReport += `- **Total Pages:** ${summary.totalPages}\n`;
  mdReport += `- **Pages Scanned:** ${summary.pagesScanned}\n`;
  mdReport += `- **Total Issues:** ${summary.totalIssues}\n`;
  mdReport += `- **Pages with Issues:** ${summary.pagesWithIssues}\n`;
  mdReport += `- **Pages with Placeholders:** ${summary.pagesWithPlaceholders}\n`;
  mdReport += `- **Pages Missing Hero:** ${summary.pagesWithMissingHero}\n`;
  mdReport += `- **Pages Missing CTA:** ${summary.pagesWithMissingCTA}\n\n`;

  mdReport += `## Issues by Page Type\n\n`;
  const byType = {};
  auditResults.forEach((page) => {
    if (!byType[page.pageType]) byType[page.pageType] = { count: 0, issues: 0 };
    byType[page.pageType].count++;
    byType[page.pageType].issues += page.issueCount;
  });

  for (const [type, data] of Object.entries(byType)) {
    mdReport += `- **${type}:** ${data.count} pages, ${data.issues} issues\n`;
  }

  mdReport += `\n## Pages with Issues\n\n`;
  const pagesWithIssuesList = auditResults.filter((p) => p.issueCount > 0);
  for (const page of pagesWithIssuesList.slice(0, 50)) {
    mdReport += `### ${page.route}\n`;
    mdReport += `- **File:** ${page.filePath}\n`;
    mdReport += `- **Type:** ${page.pageType}\n`;
    mdReport += `- **Issues:** ${page.issueCount}\n`;
    page.issues.forEach((issue) => {
      mdReport += `  - ${issue.type} (${issue.severity})\n`;
    });
    mdReport += `\n`;
  }

  if (pagesWithIssuesList.length > 50) {
    mdReport += `\n_... and ${pagesWithIssuesList.length - 50} more pages with issues_\n`;
  }

  writeFileSync(join(rootDir, 'reports/page-audit.md'), mdReport);

  // Write media mapping
  let mediaReport = `# Media Reference Mapping\n\n`;
  mediaReport += `**Generated:** ${summary.timestamp}\n\n`;
  mediaReport += `Found ${mediaMapping.length} pages with media references in comments.\n\n`;

  for (const item of mediaMapping) {
    mediaReport += `## ${item.route}\n`;
    mediaReport += `**File:** ${item.filePath}\n\n`;
    item.references.forEach((ref) => {
      mediaReport += `- Line ${ref.line}: ${ref.context}\n`;
      if (ref.url) mediaReport += `  - URL: ${ref.url}\n`;
    });
    mediaReport += `\n`;
  }

  writeFileSync(join(rootDir, 'reports/media-mapping.md'), mediaReport);

  // Print summary
}

auditAllPages().catch(console.error);
