#!/usr/bin/env node
/**
 * audit-orphan-categorization.mjs
 * Reads orphaned-page-map.json and categorizes each orphan for staged removal decisions.
 * Categories: SAFE_REMOVE, NEEDS_REDIRECT, REVIEW_NEEDED, KEEP
 *
 * Outputs: reports/canonicalization/orphan-categories.json
 */

import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const orphans = JSON.parse(fs.readFileSync(path.join(ROOT, 'reports/canonicalization/orphaned-page-map.json'), 'utf8'));

/**
 * Routes that were canonicalized to new paths — should receive permanentRedirects
 */
const KNOWN_LEGACY_PORTALS = [
  '/student-portal',
  '/employer-portal',
  '/partner-portal',
  '/admin-portal',
];

/**
 * Routes that are standalone old-style pages superseded by canonical equivalents
 */
const KNOWN_SUPERSEDED = [
  '/ai-chat-standalone', // already permanentRedirected
];

/**
 * Patterns clearly identifying standalone "new" form stubs — rarely linked, safe to keep
 */
function isAdminFormStub(route) {
  return route.startsWith('/admin/') && (route.endsWith('/new') || route.endsWith('/create'));
}

/**
 * Team bio pages — low-traffic but intentional, link from /about/team
 */
function isTeamBioPage(route) {
  return route.startsWith('/about/team/');
}

/**
 * App-level isolated pages (standalone tools/flows)
 */
const KNOWN_INTENTIONAL_STANDALONE = [
  '/acceptable-use-policy',
  '/privacy-policy',
  '/terms-of-service',
  '/cookie-policy',
  '/accessibility',
  '/sitemap',
];

function categorize(orphan) {
  const { route, referenceMentions } = orphan;

  if (KNOWN_LEGACY_PORTALS.some(p => route === p || route.startsWith(p + '/'))) {
    return { category: 'NEEDS_REDIRECT', reason: 'Legacy portal path — add permanentRedirect to canonical dashboard' };
  }

  if (KNOWN_SUPERSEDED.includes(route)) {
    return { category: 'ALREADY_FIXED', reason: 'Route already has permanentRedirect applied' };
  }

  if (isTeamBioPage(route)) {
    return { category: 'KEEP', reason: 'Team bio page — intentional, referenced from /about/team' };
  }

  if (isAdminFormStub(route)) {
    return { category: 'KEEP_STUB', reason: 'Admin form stub — placeholder for future feature, do not remove' };
  }

  if (KNOWN_INTENTIONAL_STANDALONE.some(p => route === p)) {
    return { category: 'KEEP', reason: 'Legal/policy page — intentional standalone, may just have low nav links' };
  }

  if (referenceMentions === 0) {
    return { category: 'REVIEW_NEEDED', reason: 'Zero reference mentions — candidate for removal but requires manual review' };
  }

  if (referenceMentions === 1) {
    return { category: 'REVIEW_NEEDED', reason: 'Only 1 reference — verify the reference is real navigation, not just a comment' };
  }

  return { category: 'KEEP', reason: `${referenceMentions} references found — likely in use` };
}

const categorized = orphans.map(orphan => ({
  ...orphan,
  ...categorize(orphan),
}));

const byCategory = {};
for (const item of categorized) {
  if (!byCategory[item.category]) byCategory[item.category] = [];
  byCategory[item.category].push(item);
}

const summary = {};
for (const [cat, items] of Object.entries(byCategory)) {
  summary[cat] = items.length;
}

const report = {
  generatedAt: new Date().toISOString(),
  summary,
  byCategory,
};

const outPath = path.join(ROOT, 'reports/canonicalization/orphan-categories.json');
fs.writeFileSync(outPath, JSON.stringify(report, null, 2));

process.stdout.write('Orphan categorization complete:\n');
for (const [cat, count] of Object.entries(summary)) {
  process.stdout.write(`  ${cat}: ${count}\n`);
}

// Print NEEDS_REDIRECT items for immediate action
if (byCategory.NEEDS_REDIRECT) {
  process.stdout.write('\nRoutes needing permanentRedirect:\n');
  for (const item of byCategory.NEEDS_REDIRECT) {
    process.stdout.write(`  ${item.route} → ${item.reason}\n`);
  }
}
