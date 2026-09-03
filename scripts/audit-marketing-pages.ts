#!/usr/bin/env npx tsx
/**
 * Marketing Page Audit Script
 * Checks all marketing pages for required content elements
 */

import * as fs from 'fs';
import * as path from 'path';

interface AuditResult {
  page: string;
  route: string;
  hasMetadata: boolean;
  hasTitle: boolean;
  hasDescription: boolean;
  hasCanonical: boolean;
  hasCTA: boolean;
  hasHeading: boolean;
  contentLength: number;
  issues: string[];
  priority: 'high' | 'medium' | 'low';
}

const MARKETING_PAGES_FILE = '/tmp/marketing_pages.txt';

function getRouteFromPath(filePath: string): string {
  // app/about/page.tsx -> /about
  // app/page.tsx -> /
  const match = filePath.match(/app\/(.*)\/page\.tsx$/);
  if (match) {
    return '/' + match[1];
  }
  if (filePath === 'app/page.tsx') {
    return '/';
  }
  return filePath;
}

function auditPage(filePath: string): AuditResult {
  const fullPath = path.join(process.cwd(), filePath);
  const content = fs.readFileSync(fullPath, 'utf-8');
  const route = getRouteFromPath(filePath);

  // Also check layout.tsx in same directory
  const dir = path.dirname(fullPath);
  const layoutPath = path.join(dir, 'layout.tsx');
  let layoutContent = '';
  if (fs.existsSync(layoutPath)) {
    layoutContent = fs.readFileSync(layoutPath, 'utf-8');
  }

  const combinedContent = content + '\n' + layoutContent;

  const issues: string[] = [];

  // Check for metadata export (in page or layout)
  const hasMetadata =
    combinedContent.includes('export const metadata') ||
    combinedContent.includes('export async function generateMetadata');
  if (!hasMetadata) issues.push('Missing metadata export');

  // Check for title in metadata (in page or layout)
  const hasTitle =
    /title:\s*['"`]/.test(combinedContent) ||
    /title:\s*{/.test(combinedContent) ||
    /title:\s*`/.test(combinedContent);
  if (!hasTitle) issues.push('Missing page title');

  // Check for description in metadata (in page or layout)
  const hasDescription =
    /description:\s*['"`]/.test(combinedContent) ||
    /description:\s*`/.test(combinedContent) ||
    /\.description/.test(combinedContent);
  if (!hasDescription) issues.push('Missing meta description');

  // Check for canonical URL (in page or layout, or via generateMetadata helper)
  const hasCanonical =
    combinedContent.includes('canonical') ||
    combinedContent.includes('alternates') ||
    combinedContent.includes('generateMetadata') ||
    combinedContent.includes('generateInternalMetadata');
  if (!hasCanonical) issues.push('Missing canonical URL');

  // Check if this is a redirect page or uses a template component (skip CTA/heading/content checks)
  const isRedirectPage = content.includes('redirect(') || content.includes('redirect (');
  const usesTemplate =
    content.includes('StateCareerTrainingPage') ||
    content.includes('StateCommunityServicesPage') ||
    content.includes('Template') ||
    content.includes('Page state={');

  // Check for CTA (Link to /apply, /contact, or button) - skip for redirects and templates
  const hasCTA =
    isRedirectPage ||
    usesTemplate ||
    content.includes('href="/apply"') ||
    content.includes('href="/contact"') ||
    content.includes('href="/inquiry"') ||
    content.includes('href="/programs"') ||
    content.includes('tel:') ||
    content.includes('<button');
  if (!hasCTA) issues.push('Missing call-to-action');

  // Check for h1 heading - skip for redirects and templates
  const hasHeading =
    isRedirectPage ||
    usesTemplate ||
    content.includes('<h1') ||
    content.includes('text-4xl') ||
    content.includes('text-5xl');
  if (!hasHeading) issues.push('Missing main heading');

  // Content length (rough indicator of page completeness) - skip for redirects and templates
  const contentLength = content.length;
  if (!isRedirectPage && !usesTemplate && contentLength < 2000)
    issues.push('Very short page content');

  // Determine priority
  let priority: 'high' | 'medium' | 'low' = 'low';

  // High priority pages
  const highPriorityRoutes = [
    '/',
    '/about',
    '/programs',
    '/apply',
    '/contact',
    '/funding',
    '/employers',
    '/partners',
    '/how-it-works',
    '/pricing',
    '/start',
    '/pathways',
    '/training',
    '/career-services',
    '/apprenticeships',
    '/certifications',
    '/courses',
    '/success-stories',
    '/testimonials',
  ];

  // Medium priority - state/regional pages, key info pages
  const mediumPriorityPatterns = [
    /career-training-/,
    /community-services-/,
    /wioa/,
    /grants/,
    /jri/,
    /faq/,
    /financial-aid/,
  ];

  if (highPriorityRoutes.includes(route)) {
    priority = 'high';
  } else if (mediumPriorityPatterns.some((p) => p.test(route))) {
    priority = 'medium';
  }

  // Bump priority if many issues
  if (issues.length >= 3 && priority === 'low') {
    priority = 'medium';
  }
  if (issues.length >= 4 && priority === 'medium') {
    priority = 'high';
  }

  return {
    page: filePath,
    route,
    hasMetadata,
    hasTitle,
    hasDescription,
    hasCanonical,
    hasCTA,
    hasHeading,
    contentLength,
    issues,
    priority,
  };
}

function main() {
  const pagesFile = fs.readFileSync(MARKETING_PAGES_FILE, 'utf-8');
  const pages = pagesFile.trim().split('\n').filter(Boolean);

  console.log(`\n📊 MARKETING PAGE AUDIT REPORT`);
  console.log(`${'='.repeat(60)}\n`);
  console.log(`Total pages to audit: ${pages.length}\n`);

  const results: AuditResult[] = [];

  for (const page of pages) {
    try {
      const result = auditPage(page);
      results.push(result);
    } catch (err) {
      console.error(`Error auditing ${page}:`, err);
    }
  }

  // Summary stats
  const withIssues = results.filter((r) => r.issues.length > 0);
  const highPriority = results.filter((r) => r.priority === 'high' && r.issues.length > 0);
  const mediumPriority = results.filter((r) => r.priority === 'medium' && r.issues.length > 0);
  const lowPriority = results.filter((r) => r.priority === 'low' && r.issues.length > 0);

  console.log(`📈 SUMMARY`);
  console.log(`${'─'.repeat(40)}`);
  console.log(`✅ Pages with no issues: ${results.length - withIssues.length}`);
  console.log(`⚠️  Pages with issues: ${withIssues.length}`);
  console.log(`   🔴 High priority: ${highPriority.length}`);
  console.log(`   🟡 Medium priority: ${mediumPriority.length}`);
  console.log(`   🟢 Low priority: ${lowPriority.length}`);
  console.log();

  // Issue breakdown
  const issueCounts: Record<string, number> = {};
  for (const r of results) {
    for (const issue of r.issues) {
      issueCounts[issue] = (issueCounts[issue] || 0) + 1;
    }
  }

  console.log(`📋 ISSUE BREAKDOWN`);
  console.log(`${'─'.repeat(40)}`);
  for (const [issue, count] of Object.entries(issueCounts).sort((a, b) => b[1] - a[1])) {
    console.log(`   ${issue}: ${count} pages`);
  }
  console.log();

  // High priority pages needing fixes
  if (highPriority.length > 0) {
    console.log(`\n🔴 HIGH PRIORITY PAGES (${highPriority.length})`);
    console.log(`${'─'.repeat(60)}`);
    for (const r of highPriority) {
      console.log(`\n${r.route}`);
      console.log(`   Issues: ${r.issues.join(', ')}`);
    }
  }

  // Medium priority pages
  if (mediumPriority.length > 0) {
    console.log(`\n\n🟡 MEDIUM PRIORITY PAGES (${mediumPriority.length})`);
    console.log(`${'─'.repeat(60)}`);
    for (const r of mediumPriority) {
      console.log(`\n${r.route}`);
      console.log(`   Issues: ${r.issues.join(', ')}`);
    }
  }

  // Generate JSON report
  const report = {
    timestamp: new Date().toISOString(),
    totalPages: results.length,
    pagesWithIssues: withIssues.length,
    highPriority: highPriority.length,
    mediumPriority: mediumPriority.length,
    lowPriority: lowPriority.length,
    issueCounts,
    results: results
      .filter((r) => r.issues.length > 0)
      .sort((a, b) => {
        const priorityOrder = { high: 0, medium: 1, low: 2 };
        return priorityOrder[a.priority] - priorityOrder[b.priority];
      }),
  };

  fs.writeFileSync('marketing-audit-report.json', JSON.stringify(report, null, 2));
  console.log(`\n\n📄 Full report saved to: marketing-audit-report.json`);
}

main();
