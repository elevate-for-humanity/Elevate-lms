#!/usr/bin/env npx tsx
/**
 * Footer Link Audit
 *
 * Checks all footer links for:
 * - 404 errors
 * - Unfinished pages (placeholder content)
 * - Auth-gated pages that should be public
 */

import * as fs from 'fs';
import * as path from 'path';

// All footer links from components/ui/Footer.tsx
const FOOTER_LINKS = [
  // Programs
  { name: 'Healthcare', href: '/programs/healthcare' },
  { name: 'Skilled Trades', href: '/programs/skilled-trades' },
  { name: 'Beauty & Wellness', href: '/programs/beauty' },
  { name: 'Business & Finance', href: '/programs/business-financial' },
  { name: 'Technology', href: '/programs/technology' },
  { name: 'Apprenticeships', href: '/programs/apprenticeships' },
  { name: 'All Programs', href: '/programs' },

  // Services
  { name: 'Rise Foundation', href: '/rise-foundation' },
  { name: 'Career Services', href: '/career-services' },
  { name: 'AI Studio', href: '/ai-studio' },

  // Students
  { name: 'Apply Now', href: '/apply' },
  { name: 'WIOA Eligibility', href: '/wioa-eligibility' },
  { name: 'Funding Options', href: '/funding' },
  { name: 'Student Portal', href: '/student-portal' },
  { name: 'Course Catalog', href: '/courses' },
  { name: 'Success Stories', href: '/testimonials' },

  // Platform
  { name: 'LMS Overview', href: '/lms' },
  { name: 'Store & Licensing', href: '/store' },
  { name: 'Platform Demo', href: '/store/demo' },
  { name: 'Pricing', href: '/pricing' },
  { name: 'Community Hub', href: '/community' },
  { name: 'Marketplace', href: '/marketplace' },

  // Employers
  { name: 'Hire Graduates', href: '/hire-graduates' },
  { name: 'Post a Job', href: '/employers/post-job' },
  { name: 'Employer Portal', href: '/employer/dashboard' },
  { name: 'Workforce Partners', href: '/workforce-partners' },
  { name: 'Employer Apprenticeships', href: '/employers/apprenticeships' },

  // Resources
  { name: 'FAQ', href: '/faq' },
  { name: 'Blog', href: '/blog' },
  { name: 'Help Center', href: '/help/articles' },
  { name: 'Events', href: '/events' },
  { name: 'Contact Support', href: '/contact' },

  // Company
  { name: 'About Us', href: '/about' },
  { name: 'Leadership Team', href: '/about/team' },
  { name: 'Partners', href: '/partners' },
  { name: 'Careers', href: '/careers' },

  // Legal
  { name: 'Privacy Policy', href: '/privacy' },
  { name: 'Terms of Service', href: '/terms' },
  { name: 'Accessibility', href: '/accessibility' },
  { name: 'Compliance', href: '/compliance' },
  { name: 'Sitemap', href: '/site-map' },

  // From layout/Footer.tsx
  { name: 'Check Eligibility', href: '/check-eligibility' },
  { name: 'How It Works', href: '/how-it-works' },
  { name: 'Resource Library', href: '/resources' },
  { name: 'For Employers', href: '/employers' },
  { name: 'Partner Directory', href: '/directory' },
  { name: 'Support Us', href: '/philanthropy' },
  { name: 'Privacy', href: '/privacy' },
  { name: 'Terms', href: '/terms' },
  { name: 'Governance', href: '/governance' },
];

interface LinkResult {
  name: string;
  href: string;
  exists: boolean;
  hasPage: boolean;
  issues: string[];
}

function checkRouteExists(href: string): { exists: boolean; pagePath: string | null } {
  const appDir = path.join(process.cwd(), 'app');

  // Convert href to potential file paths
  const routePath = href === '/' ? '' : href;
  const possiblePaths = [
    path.join(appDir, routePath, 'page.tsx'),
    path.join(appDir, routePath, 'page.jsx'),
    path.join(appDir, routePath, 'page.ts'),
    path.join(appDir, routePath, 'page.js'),
    // Check for route groups
    path.join(appDir, '(marketing)', routePath, 'page.tsx'),
    path.join(appDir, '(auth)', routePath, 'page.tsx'),
    path.join(appDir, '(dashboard)', routePath, 'page.tsx'),
  ];

  for (const p of possiblePaths) {
    if (fs.existsSync(p)) {
      return { exists: true, pagePath: p };
    }
  }

  return { exists: false, pagePath: null };
}

function checkPageContent(pagePath: string): string[] {
  const issues: string[] = [];

  try {
    const content = fs.readFileSync(pagePath, 'utf-8');

    // Check for placeholder content (exclude HTML placeholder attributes)
    const placeholderPatterns = [
      { pattern: /coming\s+soon/gi, name: 'coming soon' },
      { pattern: /under\s+construction/gi, name: 'under construction' },
      { pattern: /lorem\s+ipsum/gi, name: 'lorem ipsum' },
      { pattern: />\s*placeholder\s*</gi, name: 'placeholder text' },
      { pattern: /TODO:\s*implement/gi, name: 'TODO implement' },
    ];

    for (const { pattern, name } of placeholderPatterns) {
      if (pattern.test(content)) {
        issues.push(`Contains placeholder: ${name}`);
      }
    }

    // Check for redirect to login - only flag if not a dashboard/portal page
    const isDashboard = /dashboard|portal|lms/i.test(pagePath);
    if (!isDashboard && (/redirect.*login/i.test(content) || /requireAuth/i.test(content))) {
      issues.push('May require authentication (check if should be public)');
    }

    // Check for empty/minimal content
    const lines = content
      .split('\n')
      .filter((l) => l.trim() && !l.trim().startsWith('//') && !l.trim().startsWith('import'));
    if (lines.length < 20) {
      issues.push('Very minimal content - may be unfinished');
    }
  } catch (err) {
    issues.push('Could not read file');
  }

  return issues;
}

function main() {
  console.log('🔍 Footer Link Audit\n');
  console.log('='.repeat(60) + '\n');

  const results: LinkResult[] = [];
  const missing: LinkResult[] = [];
  const withIssues: LinkResult[] = [];

  for (const link of FOOTER_LINKS) {
    const { exists, pagePath } = checkRouteExists(link.href);
    const issues: string[] = [];

    if (!exists) {
      issues.push('Route does not exist (404)');
    } else if (pagePath) {
      issues.push(...checkPageContent(pagePath));
    }

    const result: LinkResult = {
      name: link.name,
      href: link.href,
      exists,
      hasPage: !!pagePath,
      issues,
    };

    results.push(result);

    if (!exists) {
      missing.push(result);
    } else if (issues.length > 0) {
      withIssues.push(result);
    }
  }

  // Report missing routes
  if (missing.length > 0) {
    console.log('❌ MISSING ROUTES (404):\n');
    missing.forEach((r) => {
      console.log(`  ${r.name}: ${r.href}`);
    });
    console.log('');
  }

  // Report pages with issues
  if (withIssues.length > 0) {
    console.log('⚠️  PAGES WITH ISSUES:\n');
    withIssues.forEach((r) => {
      console.log(`  ${r.name}: ${r.href}`);
      r.issues.forEach((issue) => {
        console.log(`    - ${issue}`);
      });
    });
    console.log('');
  }

  // Summary
  const ok = results.filter((r) => r.exists && r.issues.length === 0);
  console.log('='.repeat(60));
  console.log(`\n✅ OK: ${ok.length}`);
  console.log(`❌ Missing: ${missing.length}`);
  console.log(`⚠️  With Issues: ${withIssues.length}`);
  console.log(`📊 Total Links: ${results.length}\n`);

  // Write detailed report
  const report = {
    generated: new Date().toISOString(),
    summary: {
      total: results.length,
      ok: ok.length,
      missing: missing.length,
      withIssues: withIssues.length,
    },
    missing: missing.map((r) => ({ name: r.name, href: r.href })),
    withIssues: withIssues.map((r) => ({ name: r.name, href: r.href, issues: r.issues })),
    allResults: results,
  };

  const reportPath = path.join(process.cwd(), 'reports', 'footer-audit.json');
  fs.mkdirSync(path.dirname(reportPath), { recursive: true });
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  console.log(`Report written to: ${reportPath}\n`);

  // Exit with error if issues found
  if (missing.length > 0 || withIssues.length > 0) {
    process.exit(1);
  }
}

main();
