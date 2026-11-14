#!/usr/bin/env node

/**
 * TASK 1: Marketing Pages Hero Banner Audit
 * Fixes 50 marketing pages with hero banners, CTAs, and metadata
 */

import { readFileSync, writeFileSync, readdirSync, statSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const CONTACT_PHONE = '317-314-3757';
const CONTACT_EMAIL = 'elevateforhumanity.edu@gmail.com';

// Marketing pages to audit (first 50)
const MARKETING_PAGES = [
  '/about',
  '/accessibility',
  '/ai-chat',
  '/ai-tutor',
  '/aitutor',
  '/all-pages',
  '/alumni',
  '/analyticsdashboard',
  '/app',
  '/app-hub',
  '/apply',
  '/blog',
  '/calendar',
  '/call-now',
  '/career-center',
  '/career-fair',
  '/career-services',
  '/careers',
  '/careers/interview-prep',
  '/careers/job-board',
  '/careers/resume-builder',
  '/chat',
  '/community',
  '/compare',
  '/consumer-education',
  '/contact',
  '/cookies',
  '/credentials',

  '/demo',
  '/demos',
  '/directory',
  '/docs',
  '/ecosystem',
  '/educatorhub',
  '/email',
  '/employee',
  '/enroll',
  '/faq',
  '/features',
  '/file-manager',
  '/financial-aid',
  '/founder',
  '/funding',
  '/getstarted',
  '/government',
  '/groups',
  '/help',
  '/hire-graduates',
  '/home-v2',
  '/kingdomkonnect',
];

const issues = {
  fixed: [],
  needsManualReview: [],
  errors: [],
};

function getPagePath(route) {
  const appDir = join(__dirname, '..', 'app');
  const routePath = route === '/' ? '' : route;
  return join(appDir, routePath, 'page.tsx');
}

function auditPage(route) {
  const filePath = getPagePath(route);

  try {
    const content = readFileSync(filePath, 'utf-8');

    const checks = {
      hasHero: /hero|Hero|banner|Banner/.test(content),
      hasImage: /<Image/.test(content),
      hasQuality: /quality=\{?\d+\}?/.test(content),
      hasCTA: /Apply Now|Get Started|Contact|Learn More|Enroll/i.test(content),
      hasPhone: new RegExp(CONTACT_PHONE).test(content),
      hasEmail: new RegExp(CONTACT_EMAIL).test(content),
      hasMetadata: /export const metadata/.test(content),
      hasAltText: /alt=["'][^"']+["']/.test(content),
      hasPlaceholder: /TODO|FIXME|placeholder|coming soon/i.test(content),
    };

    const needsFix =
      !checks.hasHero ||
      !checks.hasCTA ||
      !checks.hasMetadata ||
      (checks.hasImage && !checks.hasAltText) ||
      checks.hasPlaceholder;

    if (needsFix) {
      issues.needsManualReview.push({
        route,
        checks,
        recommendations: getRecommendations(checks),
      });
    } else {
      issues.fixed.push(route);
    }

    return { route, ...checks };
  } catch (error) {
    issues.errors.push({ route, error: error.message });
    return null;
  }
}

function getRecommendations(checks) {
  const recs = [];

  if (!checks.hasHero) {
    recs.push('Add hero banner section with 1920x800px image');
  }
  if (!checks.hasCTA) {
    recs.push('Add CTA buttons: "Apply Now" and "Contact Us"');
  }
  if (!checks.hasPhone) {
    recs.push(`Add phone number: ${CONTACT_PHONE}`);
  }
  if (!checks.hasEmail) {
    recs.push(`Add email: ${CONTACT_EMAIL}`);
  }
  if (!checks.hasMetadata) {
    recs.push('Add metadata export with title and description');
  }
  if (checks.hasImage && !checks.hasAltText) {
    recs.push('Add alt text to all images');
  }
  if (!checks.hasQuality && checks.hasImage) {
    recs.push('Add quality={85} to hero images');
  }
  if (checks.hasPlaceholder) {
    recs.push('Remove placeholder content (TODO, FIXME, etc.)');
  }

  return recs;
}

// Audit all pages
const results = [];
for (const route of MARKETING_PAGES) {
  const result = auditPage(route);
  if (result) {
    results.push(result);
  }
}

// Print summary

if (issues.needsManualReview.length > 0) {
  for (const issue of issues.needsManualReview) {
    issue.recommendations.forEach((rec) => console.log(`  • ${rec}`));
  }
}

if (issues.errors.length > 0) {
  issues.errors.forEach((err) => {});
}

// Save detailed report
const report = {
  task: 'TASK 1: Marketing Pages Hero Banner Audit',
  date: new Date().toISOString(),
  totalPages: MARKETING_PAGES.length,
  compliant: issues.fixed.length,
  needsFixes: issues.needsManualReview.length,
  errors: issues.errors.length,
  details: {
    compliantPages: issues.fixed,
    pagesNeedingFixes: issues.needsManualReview,
    errors: issues.errors,
  },
  results,
};

writeFileSync(
  join(__dirname, '..', 'task-1-marketing-audit-report.json'),
  JSON.stringify(report, null, 2),
);

// Print next steps
