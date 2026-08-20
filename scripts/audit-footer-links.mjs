#!/usr/bin/env node
/**
 * Government/public-surface footer gate.
 *
 * The footer is a procurement and compliance navigation surface. This gate
 * prevents known retired aliases, mislabeled legal destinations, and missing
 * canonical public pages from returning silently.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const footerPath = path.join(ROOT, 'components/site-footer.tsx');
const routesPath = path.join(ROOT, 'lib/navigation/routes.ts');
const marketingApp = path.join(ROOT, 'apps/marketing/app');
const footer = fs.readFileSync(footerPath, 'utf8');
const routes = fs.readFileSync(routesPath, 'utf8');
const failures = [];

function fail(message) {
  failures.push(message);
}

function requireText(text, label) {
  if (!footer.includes(text)) fail(`Footer missing canonical ${label}: ${text}`);
}

function requirePage(route, label = route) {
  const page = path.join(marketingApp, ...route.replace(/^\//, '').split('/'), 'page.tsx');
  if (!fs.existsSync(page)) fail(`Canonical footer destination missing page: ${label} (${route})`);
}

// Legal row must point to actual documents, not the legal index mislabeled as a document.
requireText('href="/privacy"', 'Privacy Policy');
requireText('href="/terms-of-service"', 'Terms of Service');
requireText('href="/security-and-data-protection"', 'Security & Data Protection');
requireText('href="/accessibility"', 'Accessibility Statement');
requireText('href="/federal-compliance"', 'Federal Compliance');
requireText('href="/legal"', 'Legal & Policies index');

for (const route of ['/privacy', '/terms-of-service', '/security-and-data-protection', '/accessibility', '/federal-compliance', '/legal']) {
  requirePage(route);
}

// Retired aliases must not be emitted by the footer or its canonical route constants.
if (footer.includes('href="/eligibility/quiz"') || routes.includes("eligibility: '/eligibility/quiz'")) {
  fail('Retired /eligibility/quiz is still emitted by footer navigation.');
}
if (/href=["']\/legal["'][^>]*>Terms of Service</.test(footer)) {
  fail('Terms of Service is mislabeled to /legal instead of /terms-of-service.');
}

// These public destinations are deliberate buyer-facing/footer contracts.
for (const route of [
  '/programs',
  '/programs/healthcare',
  '/programs/skilled-trades',
  '/programs/cosmetology-apprenticeship',
  '/programs/technology',
  '/apprenticeships',
  '/programs/barber-apprenticeship',
  '/programs/esthetician-apprenticeship',
  '/programs/nail-technician-apprenticeship',
  '/funding',
  '/funding/wioa',
  '/funding/wrg',
  '/scholarships',
  '/check-eligibility',
  '/about',
  '/approvals',
  '/apprenticeship-sponsor',
  '/success-stories',
  '/blog',
  '/faq',
  '/hire-graduates',
  '/partners/host-shops',
  '/for-agencies',
  '/testing',
  '/apply/student',
  '/contact',
]) {
  requirePage(route);
}

if (failures.length) {
  console.error(`Footer audit failed (${failures.length}):`);
  for (const failure of failures) console.error(` - ${failure}`);
  process.exit(1);
}

console.log('Footer audit passed: canonical legal labels and public destinations resolve.');
