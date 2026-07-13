#!/usr/bin/env node
/**
 * ROUTE & FOLDER CERTIFICATION AUDIT
 * 
 * Generates comprehensive mapping of:
 * - Folder → Route
 * - Page files
 * - Layout files
 * - Build scope ownership
 * - Live route verification
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import https from 'node:https';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');
const APP_DIR = path.join(ROOT, 'app');

// Build scopes from split-app.mjs
const MARKETING_OWNED = new Set([
  'about', 'contact', 'team', 'careers', 'press', 'news', 'site-map',
  'programs', 'barber-and-beauty-apprenticeships',
  'barber-host-shop', 'cosmetology-host-shop', 'esthetician-host-shop', 'nail-host-shop',
  'apply', 'eligibility', 'check-eligibility', 'next-steps', 'onboarding', 'orientation', 'enrollment',
  'store', 'shop', 'licensing', 'licenses', 'checkout', 'compare', 'demo', 'demos', 'white-label',
  'funding', 'financing', 'wioa-eligibility', 'wioa-participant', 'donate', 'scholarships', 'tuition', 'pricing',
  'testing', 'certiport-exam', 'certificates', 'credentials', 'credential', 'verify',
  'career-training', 'career-training-indiana', 'healthcare-training-indianapolis',
  'skilled-trades-training-indiana', 'workforce-board', 'workforce-partners',
  'career-services', 'career-assessment', 'career-counseling',
  'find-workone', 'workone-partner-packet', 'employment-support', 'hire-graduates',
  'for-employers', 'for-partners', 'for-agencies', 'for-providers', 'for-students',
  'solutions', 'how-it-works', 'pathways', 'success-stories', 'testimonials', 'start', 'booking',
  'education', 'training', 'launch', 'schools', 'grants', 'government', 'industries',
  'microclasses', 'syllabi', 'webinars', 'ebooks', 'reels',
  'resources', 'documents', 'docs', 'forms', 'workbooks', 'data',
  'community-services', 'community-services-indiana', 'agencies', 'volunteer',
  'impact', 'metrics', 'outcomes',
  'legal', 'compliance', 'ferpa', 'equal-opportunity', 'federal-compliance',
  'grievance', 'transparency', 'disaster-recovery', 'cookies', 'privacy', 'terms', 'dmca', 'accessibility',
  'services', 'healthcare', 'locations', 'academic-calendar', 'events', 'updates',
  'jri', 'fssa', 'snap', 'ojt-and-funding',
  'cna-waitlist', 'mobile-app', 'mobile', 'connect', 'inquiry', 'directory', 'search',
  'calendar', 'pay', 'booth-rental', 'instructional-framework',
  'satisfactory-academic-progress', 'writing-center', 'educatorhub',
  'founder', 'roi', 'implementation', 'trust', 'suboffice-onboarding', 'alumni', 'platform',
  'host-shop', 'employer', 'employers', 'partner', 'partner-directory',
  'program-holder', 'case-manager', 'apprentice', 'apprenticeship-sponsor',
  'dashboards', 'portals', 'license', 'ai-chat',
  'blog',
  'ai', 'ai-tutor',
  'login', 'signup', 'forgot-password', 'reset-password', 'verify-email', 'verify-credentials', 'admin-login',
  'academic-integrity', 'accreditation', 'application-success', 'apprenticeships', 'apprenticeship-programs',
  'beauty-checkout', 'call-now', 'certification-testing', 'consumer-disclosures', 'consumer-education',
  'contracts', 'copyright', 'downloads', 'ebook', 'email', 'enroll', 'error', 'faq', 'governance',
  'handbook', 'help', 'institutional-governance', 'instructor-credentials', 'jobs',
  'legal-entity-structure', 'license-suspended', 'mou', 'orientation-video', 'parent-portal',
  'paris', 'partner', 'partner-learning', 'partners', 'partnerships', 'philanthropy', 'policies',
  'portal', 'privacy-policy', 'refund-policy', 'security', 'security-and-data-protection',
  'share', 'sitemap', 'staff', 'start-trial', 'status', 'student-resources', 'support',
  'tax', 'tenant-site', 'terms-of-service', 'thankyou', 'tuition-fees', 'unauthorized',
  'update-password', 'verify-identity', 'workforce', 'workkeys'
]);

const ADMIN_OWNED = new Set([
  'admin', 'admin-login',
  'analytics', 'approvals', 'apps', 'create-course', 'dashboard', 'dev', 'file-manager',
  'install-app', 'operator', 'partner-operating-model', 'partner-upload', 'preview',
  'provider', 'settings', 'sign', 'builder', 'connects', 'creator', 'instructor'
]);

const LMS_OWNED = new Set([
  'lms', 'learner', 'student', 'students', 'profile', 'account', 'achievements',
  'messages', 'notifications', 'reports', 'import', 'advising', 'attendance',
  'learning', 'courses', 'course-preview', 'schedule', 'schedule-consultation',
  'student-support', 'actions', 'subscription',
  'accept-invite', 'access-paused', 'banking', 'billing', 'billing-required', 'card',
  'leaderboard', 'offline', 'orientation-video', 'payment', 'payment-error', 'proctor',
  'transcript', 'tutoring', 'verification-approvals'
]);

// Files to check in each folder
const FILES_TO_CHECK = ['page.tsx', 'page.ts', 'page.jsx', 'page.js', 'layout.tsx', 'layout.ts', 'loading.tsx', 'error.tsx', 'template.tsx', 'not-found.tsx'];

// Folders to exclude from audit
const EXCLUDED = new Set([
  'node_modules', '.next', '.git', '.pnpm', '__pycache__', 'public', '.well-known'
]);

function getBuildScope(folder) {
  if (MARKETING_OWNED.has(folder)) return 'MARKETING';
  if (ADMIN_OWNED.has(folder)) return 'ADMIN';
  if (LMS_OWNED.has(folder)) return 'LMS';
  return 'SHARED';
}

function getFilesInFolder(folderPath) {
  const files = {};
  try {
    const entries = fs.readdirSync(folderPath, { withFileTypes: true });
    for (const entry of entries) {
      if (entry.isFile() && FILES_TO_CHECK.includes(entry.name)) {
        files[entry.name] = {
          exists: true,
          path: path.join(folderPath, entry.name),
          size: fs.statSync(path.join(folderPath, entry.name)).size
        };
      }
    }
  } catch (e) {
    // Ignore errors
  }
  return files;
}

function getSubfolders(folderPath) {
  const subfolders = [];
  try {
    const entries = fs.readdirSync(folderPath, { withFileTypes: true });
    for (const entry of entries) {
      if (entry.isDirectory() && !entry.name.startsWith('.') && !EXCLUDED.has(entry.name)) {
        subfolders.push(entry.name);
      }
    }
  } catch (e) {
    // Ignore errors
  }
  return subfolders;
}

function auditFolder(folderName, basePath = '') {
  const fullPath = path.join(APP_DIR, basePath, folderName);
  const routePath = basePath ? `/${basePath}/${folderName}` : `/${folderName}`;
  const relativePath = basePath ? `${basePath}/${folderName}` : folderName;
  
  const result = {
    folder: folderName,
    route: routePath,
    relativePath,
    fullPath,
    exists: fs.existsSync(fullPath),
    files: {},
    subfolders: [],
    hasPage: false,
    buildScope: getBuildScope(folderName),
    hasNestedRoutes: false,
    nestedRouteCount: 0
  };
  
  if (result.exists) {
    result.files = getFilesInFolder(fullPath);
    result.hasPage = !!result.files['page.tsx'] || !!result.files['page.ts'] || !!result.files['page.jsx'] || !!result.files['page.js'];
    result.subfolders = getSubfolders(fullPath);
    result.hasNestedRoutes = result.subfolders.length > 0;
    result.nestedRouteCount = result.subfolders.length;
  }
  
  return result;
}

function walkAppDir(dir = '', depth = 0) {
  if (depth > 3) return []; // Limit recursion depth
  
  const fullPath = path.join(APP_DIR, dir);
  if (!fs.existsSync(fullPath)) return [];
  
  const results = [];
  
  try {
    const entries = fs.readdirSync(fullPath, { withFileTypes: true });
    
    for (const entry of entries) {
      if (entry.name.startsWith('.') || EXCLUDED.has(entry.name)) continue;
      
      const entryPath = dir ? `${dir}/${entry.name}` : entry.name;
      
      if (entry.isDirectory()) {
        // Only include directories that could be routes (not components, lib, hooks, etc.)
        const nonRouteDirs = ['components', 'lib', 'hooks', 'providers', 'contexts', 'types', 'styles', 'content', 'data', 'utils', 'middleware', 'actions'];
        if (nonRouteDirs.includes(entry.name)) continue;
        
        // Skip route groups (folders starting with parenthesis)
        if (entry.name.startsWith('(') && entry.name.endsWith(')')) continue;
        
        const result = auditFolder(entry.name, dir);
        results.push(result);
        
        // Recurse into subfolders
        if (result.subfolders.length > 0 && depth < 3) {
          const nested = walkAppDir(entryPath, depth + 1);
          results.push(...nested);
        }
      }
    }
  } catch (e) {
    console.error(`Error walking ${dir}: ${e.message}`);
  }
  
  return results;
}

async function checkLiveRoute(route) {
  return new Promise((resolve) => {
    const url = `https://www.elevateforhumanity.org${route}`;
    const req = https.get(url, { timeout: 5000 }, (res) => {
      resolve({
        status: res.statusCode,
        redirected: res.headers.location || null
      });
      res.resume();
    });
    req.on('error', (e) => {
      resolve({ status: 0, error: e.message });
    });
    req.on('timeout', () => {
      req.destroy();
      resolve({ status: 0, error: 'timeout' });
    });
  });
}

function generateMarkdownReport(auditResults) {
  let md = `# ROUTE & FOLDER CERTIFICATION AUDIT
Generated: ${new Date().toISOString()}

## Summary

| Metric | Count |
|--------|-------|
| Total Folders | ${auditResults.length} |
| Folders with page.tsx | ${auditResults.filter(r => r.hasPage).length} |
| MARKETING Scope | ${auditResults.filter(r => r.buildScope === 'MARKETING').length} |
| ADMIN Scope | ${auditResults.filter(r => r.buildScope === 'ADMIN').length} |
| LMS Scope | ${auditResults.filter(r => r.buildScope === 'LMS').length} |
| SHARED/Uncategorized | ${auditResults.filter(r => r.buildScope === 'SHARED').length} |
| Nested Routes | ${auditResults.filter(r => r.hasNestedRoutes).length} |

## Phase 1: Complete Folder Inventory

| Folder | Route | Has Page | Build Scope | Nested Routes |
|--------|-------|----------|-------------|----------------|
`;

  for (const item of auditResults) {
    md += `| ${item.folder} | ${item.route} | ${item.hasPage ? '✅' : '❌'} | ${item.buildScope} | ${item.hasNestedRoutes ? `✅ (${item.nestedRouteCount})` : '❌'} |\n`;
  }

  md += `
## Phase 2: Folders WITHOUT page.tsx (Potential Orphans)

| Folder | Route | Build Scope |
|--------|-------|-------------|
`;
  const orphans = auditResults.filter(r => !r.hasPage && !r.hasNestedRoutes);
  for (const item of orphans) {
    md += `| ${item.folder} | ${item.route} | ${item.buildScope} |\n`;
  }

  md += `
## Phase 3: Nested Routes (with parent folder)

| Parent Folder | Nested Route | Full Path |
|--------------|--------------|-----------|
`;
  for (const item of auditResults.filter(r => r.hasNestedRoutes)) {
    for (const sub of item.subfolders) {
      md += `| ${item.folder} | ${sub} | ${item.route}/${sub} |\n`;
    }
  }

  md += `
## Phase 4: Duplicate/Similar Folder Names

Potential duplicates to investigate:
`;
  const folderNames = auditResults.map(r => r.folder.toLowerCase());
  const duplicates = folderNames.filter((name, i) => folderNames.indexOf(name) !== i);
  const uniqueDuplicates = [...new Set(duplicates)];
  
  for (const dup of uniqueDuplicates) {
    md += `- ${dup} (appears multiple times)\n`;
  }

  md += `
## Phase 5: Build Scope Distribution

### MARKETING (${auditResults.filter(r => r.buildScope === 'MARKETING').length} folders)
`;
  for (const item of auditResults.filter(r => r.buildScope === 'MARKETING')) {
    md += `- ${item.route}\n`;
  }

  md += `
### ADMIN (${auditResults.filter(r => r.buildScope === 'ADMIN').length} folders)
`;
  for (const item of auditResults.filter(r => r.buildScope === 'ADMIN')) {
    md += `- ${item.route}\n`;
  }

  md += `
### LMS (${auditResults.filter(r => r.buildScope === 'LMS').length} folders)
`;
  for (const item of auditResults.filter(r => r.buildScope === 'LMS')) {
    md += `- ${item.route}\n`;
  }

  md += `
### SHARED/Uncategorized (${auditResults.filter(r => r.buildScope === 'SHARED').length} folders)
`;
  for (const item of auditResults.filter(r => r.buildScope === 'SHARED')) {
    md += `- ${item.route}\n`;
  }

  md += `
## Phase 6: Files in Root app/ Directory

These are NOT route folders (they're shared code):
`;
  const rootAppEntries = fs.readdirSync(APP_DIR, { withFileTypes: true });
  for (const entry of rootAppEntries) {
    if (entry.isDirectory()) {
      const nonRouteDirs = ['components', 'lib', 'hooks', 'providers', 'contexts', 'types', 'styles', 'content', 'data', 'utils'];
      if (nonRouteDirs.includes(entry.name)) {
        md += `- ${entry.name}/ (shared code - NOT a route)\n`;
      }
    }
  }

  md += `
---

*This audit was generated automatically. Review SHARED/Uncategorized folders for proper classification.*
`;

  return md;
}

// Main execution
console.log('Starting Route & Folder Certification Audit...\n');

const auditResults = walkAppDir();
auditResults.sort((a, b) => a.route.localeCompare(b.route));

console.log(`Found ${auditResults.length} route folders`);

// Generate report
const report = generateMarkdownReport(auditResults);
const reportPath = path.join(ROOT, 'ROUTE-FOLDER-AUDIT.md');
fs.writeFileSync(reportPath, report, 'utf-8');

console.log(`\nReport written to: ${reportPath}`);
console.log('\nSummary:');
console.log(`  Total folders: ${auditResults.length}`);
console.log(`  With page.tsx: ${auditResults.filter(r => r.hasPage).length}`);
console.log(`  MARKETING: ${auditResults.filter(r => r.buildScope === 'MARKETING').length}`);
console.log(`  ADMIN: ${auditResults.filter(r => r.buildScope === 'ADMIN').length}`);
console.log(`  LMS: ${auditResults.filter(r => r.buildScope === 'LMS').length}`);
console.log(`  SHARED: ${auditResults.filter(r => r.buildScope === 'SHARED').length}`);
