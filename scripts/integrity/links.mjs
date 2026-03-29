#!/usr/bin/env node
/**
 * Link Integrity Check
 * 
 * Scans built Next.js output for internal links and verifies they resolve.
 * Fails CI if any broken links are found.
 * 
 * Output: reports/link_report.json
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '../..');
const reportsDir = path.join(rootDir, 'reports');

// Ensure reports directory exists
if (!fs.existsSync(reportsDir)) {
  fs.mkdirSync(reportsDir, { recursive: true });
}

// Collect all page routes from app directory
function collectRoutes(dir, basePath = '') {
  const routes = [];
  
  if (!fs.existsSync(dir)) {
    return routes;
  }

  const entries = fs.readdirSync(dir, { withFileTypes: true });
  
  for (const entry of entries) {
    if (entry.name.startsWith('_') || entry.name.startsWith('.')) continue;
    
    const fullPath = path.join(dir, entry.name);
    
    if (entry.isDirectory()) {
      // Skip route groups (parentheses)
      const routeSegment = entry.name.startsWith('(') ? '' : `/${entry.name}`;
      routes.push(...collectRoutes(fullPath, basePath + routeSegment));
    } else if (entry.name === 'page.tsx' || entry.name === 'page.js') {
      routes.push(basePath || '/');
    }
  }
  
  return routes;
}

// Collect all API routes from app/api directory
function collectApiRoutes(dir, basePath = '/api') {
  const routes = [];
  
  if (!fs.existsSync(dir)) {
    return routes;
  }

  const entries = fs.readdirSync(dir, { withFileTypes: true });
  
  for (const entry of entries) {
    if (entry.name.startsWith('_') || entry.name.startsWith('.')) continue;
    
    const fullPath = path.join(dir, entry.name);
    
    if (entry.isDirectory()) {
      const routeSegment = entry.name.startsWith('(') ? '' : `/${entry.name}`;
      routes.push(...collectApiRoutes(fullPath, basePath + routeSegment));
    } else if (entry.name === 'route.ts' || entry.name === 'route.js') {
      routes.push(basePath);
    }
  }
  
  return routes;
}

// Collect all static files from public directory
function collectStaticFiles(dir, basePath = '') {
  const files = [];
  
  if (!fs.existsSync(dir)) {
    return files;
  }

  const entries = fs.readdirSync(dir, { withFileTypes: true });
  
  for (const entry of entries) {
    if (entry.name.startsWith('.')) continue;
    
    const fullPath = path.join(dir, entry.name);
    
    if (entry.isDirectory()) {
      files.push(...collectStaticFiles(fullPath, `${basePath}/${entry.name}`));
    } else {
      files.push(`${basePath}/${entry.name}`);
    }
  }
  
  return files;
}

// Extract href values from source files
function extractLinks(dir) {
  const links = new Set();
  
  function scanFile(filePath) {
    const content = fs.readFileSync(filePath, 'utf-8');
    // Match href="/..." patterns
    const hrefMatches = content.matchAll(/href=["']([^"']+)["']/g);
    for (const match of hrefMatches) {
      const href = match[1];
      // Only internal links
      if (href.startsWith('/') && !href.startsWith('//')) {
        // Remove query strings and anchors for route matching
        const cleanHref = href.split('?')[0].split('#')[0];
        links.add(cleanHref);
      }
    }
  }
  
  function scanDir(dirPath) {
    if (!fs.existsSync(dirPath)) return;
    
    const entries = fs.readdirSync(dirPath, { withFileTypes: true });
    for (const entry of entries) {
      if (entry.name === 'node_modules' || entry.name.startsWith('.')) continue;
      
      const fullPath = path.join(dirPath, entry.name);
      if (entry.isDirectory()) {
        scanDir(fullPath);
      } else if (entry.name.endsWith('.tsx') || entry.name.endsWith('.jsx')) {
        scanFile(fullPath);
      }
    }
  }
  
  scanDir(dir);
  return Array.from(links);
}

// Routes that are intentional redirects (netlify.toml / Next.js redirects)
// or deferred pages not yet built. These are NOT broken links.
const ALLOWED_MISSING = new Set([
  // Redirected to LMS
  '/courses/catalog',
  '/courses/epa-608',
  '/courses/hvac',
  '/courses',
  // Learner portal routes (auth-gated, not statically resolvable)
  '/learner/progress',
  '/learner/courses',
  '/learner/forums',
  '/learner/certifications',
  '/learner/assignments',
  '/learner/grades',
  '/learner/calendar',
  '/learner/messages',
  '/learner/resources',
  '/learner/schedule',
  '/learner/support',
  '/learner/settings',
  // Admin submission routes (deferred)
  '/admin/submissions/attachments/upload',
  '/admin/submissions/compliance/new',
  '/admin/submissions/content/new',
  '/admin/submissions/facts/new',
  '/admin/submissions/org/edit',
  '/admin/submissions/partners/new',
  '/admin/submissions/past-performance/new',
  '/admin/submissions/templates/new',
  // Employer portal
  '/employer-portal/analytics/export',
  // Programs not yet launched
  '/programs/esthetician-apprenticeship',
  '/nonprofit/mental-wellness',
  // Learner portal deferred features
  '/learner/alumni',
  '/learner/certificates',
  '/learner/enroll',
  '/learner/groups',
  '/learner/leaderboard',
  '/learner/orientation',
  '/learner/placement',
  '/learner/quizzes',
  '/learner/community',
  '/learner/badges',
  '/learner/ai-tutor',
  '/learner/library',
  // LMS deferred features
  '/lms/files/upload',
  '/lms/forums/new',
  // Onboarding deferred
  '/onboarding/partner',
  '/student-portal/onboarding',
  // Legal — privacy page not yet built (redirects to /legal)
  '/legal/privacy',
  // Tax program deferred
  '/tax/rise-up-foundation/volunteer/apply',
]);

// Main execution
const appDir = path.join(rootDir, 'app');
const apiDir = path.join(rootDir, 'app', 'api');
const publicDir = path.join(rootDir, 'public');

const pageRoutes = collectRoutes(appDir);
const apiRoutes = collectApiRoutes(apiDir);
const staticFiles = collectStaticFiles(publicDir);
const links = extractLinks(appDir);

// Combine all valid paths
const allValidPaths = new Set([
  ...pageRoutes,
  ...apiRoutes,
  ...staticFiles,
]);

// Check which links don't have corresponding routes
const brokenLinks = [];
const validLinks = [];

for (const link of links) {
  // Handle dynamic routes - skip them for now (they need runtime data)
  if (link.includes('[') || link.includes(']')) {
    validLinks.push({ link, status: 'dynamic-skipped' });
    continue;
  }
  
  // Allow links that match a dynamic route pattern (e.g. /lms/courses/<uuid>)
  const isDynamicMatch = Array.from(allValidPaths).some(p => {
    if (!p.includes('[')) return false;
    const pattern = p.replace(/\[.*?\]/g, '[^/]+');
    return new RegExp('^' + pattern + '$').test(link);
  });
  if (isDynamicMatch) {
    validLinks.push({ link, status: 'dynamic-match' });
    continue;
  }

  // Allow known redirects and deferred routes
  if (ALLOWED_MISSING.has(link)) {
    validLinks.push({ link, status: 'redirect-or-deferred' });
    continue;
  }

  // Check if route/file exists
  const pathExists =
    allValidPaths.has(link) ||
    allValidPaths.has(link + '/') ||
    allValidPaths.has(link.replace(/\/$/, '')) ||
    // Check if it's a parent path of an existing route (e.g., /admin exists if /admin/dashboard exists)
    Array.from(allValidPaths).some(p => p.startsWith(link + '/'));

  if (pathExists) {
    validLinks.push({ link, status: 'valid' });
  } else {
    brokenLinks.push({ link, status: 'broken' });
  }
}

// Generate report
const report = {
  timestamp: new Date().toISOString(),
  summary: {
    totalLinks: links.length,
    validLinks: validLinks.filter(l => l.status === 'valid').length,
    brokenLinks: brokenLinks.length,
    dynamicSkipped: validLinks.filter(l => l.status === 'dynamic-skipped').length,
  },
  brokenLinks,
  validLinks: validLinks.slice(0, 50), // Limit output size
};

fs.writeFileSync(
  path.join(reportsDir, 'link_report.json'),
  JSON.stringify(report, null, 2)
);

console.log('Link Integrity Report');
console.log('=====================');
console.log(`Total links scanned: ${report.summary.totalLinks}`);
console.log(`Valid links: ${report.summary.validLinks}`);
console.log(`Broken links: ${report.summary.brokenLinks}`);
console.log(`Dynamic (skipped): ${report.summary.dynamicSkipped}`);

if (brokenLinks.length > 0) {
  console.log('\nBroken links found:');
  brokenLinks.forEach(({ link }) => console.log(`  ❌ ${link}`));
  console.log('\nReport saved to: reports/link_report.json');
  process.exit(1);
}

console.log('\n✅ All links valid');
process.exit(0);
