#!/usr/bin/env node
/**
 * Sync apps/admin/app/admin static page routes into lib/admin/nav-config.ts DEFAULT_NAV.
 *
 * Usage:
 *   node scripts/sync-admin-nav-config.mjs          # dry-run (report only)
 *   node scripts/sync-admin-nav-config.mjs --write  # update nav-config.ts
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const ADMIN_APP_DIR = path.join(ROOT, 'apps/admin/app/admin');
const NAV_CONFIG_PATH = path.join(ROOT, 'lib/admin/nav-config.ts');

/** First URL segment after /admin/ → DEFAULT_NAV section label */
const SEGMENT_TO_SECTION = {
  // Operations
  dashboard: 'Operations',
  'mission-control': 'Operations',
  'system-health': 'Operations',
  monitoring: 'Operations',
  'at-risk': 'Operations',
  analytics: 'Operations',
  reports: 'Operations',
  notifications: 'Operations',
  inbox: 'Operations',
  operations: 'Operations',
  activity: 'Operations',
  'advanced-tools': 'Operations',
  'site-audit': 'Operations',
  'proctor-portal': 'Operations',
  timeclock: 'Operations',
  'student-access': 'Operations',
  'student-hours': 'Operations',
  platform: 'Operations',
  rapids: 'Operations',
  'promo-codes': 'Operations',
  'media-studio': 'Operations',
  'video-generator': 'Operations',
  'internal-docs': 'Operations',

  // Intelligence
  intelligence: 'Intelligence',
  snapshots: 'Intelligence',

  // Automation
  workflows: 'Automation',
  automation: 'Automation',
  'dev-studio': 'Automation',

  // Instructor
  instructor: 'Instructor',

  // Staff Portal
  'staff-portal': 'Staff Portal',

  // Students
  students: 'Students',
  applications: 'Students',
  enrollments: 'Students',
  'enrollment-jobs': 'Students',
  gradebook: 'Students',
  submissions: 'Students',
  verifications: 'Students',
  certificates: 'Students',
  'testing-center': 'Students',
  'exam-authorizations': 'Students',
  barriers: 'Students',
  waitlist: 'Students',
  'transfer-hours': 'Students',
  'workone-queue': 'Students',
  referrals: 'Students',
  cohorts: 'Students',

  // Programs
  programs: 'Programs',
  studio: 'Programs',
  courses: 'Programs',
  'career-courses': 'Programs',
  modules: 'Programs',
  videos: 'Programs',
  apprenticeships: 'Programs',
  credentials: 'Programs',
  'learning-paths': 'Programs',
  instructors: 'Programs',
  curriculum: 'Programs',
  quizzes: 'Programs',
  'external-course-completions': 'Programs',
  'external-progress': 'Programs',
  cmi: 'Programs',
  'course-import': 'Programs',

  // Funding
  funding: 'Funding',
  wioa: 'Funding',
  grants: 'Funding',
  contracts: 'Funding',
  jri: 'Funding',
  'payout-queue': 'Funding',
  'payroll-cards': 'Funding',
  incentives: 'Funding',
  wotc: 'Funding',
  'funding-verification': 'Funding',

  // Partners
  employers: 'Partners',
  partners: 'Partners',
  'partner-enrollments': 'Partners',
  'partner-inquiries': 'Partners',
  'program-holders': 'Partners',
  'program-holder-acknowledgements': 'Partners',
  'program-holder-documents': 'Partners',
  providers: 'Partners',
  'provider-applications': 'Partners',
  tenants: 'Partners',
  jobs: 'Partners',
  affiliates: 'Partners',
  marketplace: 'Partners',
  shops: 'Partners',
  delegates: 'Partners',

  // Marketing
  crm: 'Marketing',
  'email-marketing': 'Marketing',
  blog: 'Marketing',
  content: 'Marketing',
  'page-builder': 'Marketing',
  store: 'Marketing',
  'live-chat': 'Marketing',
  'social-media': 'Marketing',

  // Compliance
  compliance: 'Compliance',
  'compliance-audit': 'Compliance',
  'audit-logs': 'Compliance',
  accreditation: 'Compliance',
  governance: 'Compliance',
  ferpa: 'Compliance',
  documents: 'Compliance',
  signatures: 'Compliance',
  mou: 'Compliance',
  'review-queue': 'Compliance',
  hr: 'Compliance',
  'barber-shop-applications': 'Compliance',
  'fssa-impact': 'Compliance',
  docs: 'Compliance',
  'document-center': 'Compliance',

  // System
  settings: 'System',
  staff: 'System',
  licenses: 'System',
  'license-requests': 'System',
  'api-keys': 'System',
  integrations: 'System',
  migrations: 'System',
  system: 'System',
  files: 'System',
  impersonate: 'System',
  billing: 'System',
  'data-import': 'System',
};

const ACRONYMS = new Set([
  'api',
  'bnpl',
  'cdl',
  'cmi',
  'crm',
  'cna',
  'etpl',
  'ferpa',
  'fssa',
  'hr',
  'jri',
  'mou',
  'nha',
  'pto',
  'qa',
  'rapids',
  'seo',
  'sms',
  'tpp',
  'wioa',
  'wotc',
]);

const FOOTER_MARKER = '/**\n * Validate that a parsed value matches NavSection[].';

/** @param {string} segment */
function humanizeSegment(segment) {
  const lower = segment.toLowerCase();
  if (ACRONYMS.has(lower)) return lower.toUpperCase();
  return lower
    .split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

/** @param {string} href */
export function routeLabel(href) {
  const relative = href.replace(/^\/admin\/?/, '');
  if (!relative) return 'Admin Home';
  const parts = relative.split('/').filter(Boolean);
  if (parts.length === 1) return humanizeSegment(parts[0]);
  return `${humanizeSegment(parts[0])} — ${parts.slice(1).map(humanizeSegment).join(' — ')}`;
}

/**
 * Walk apps/admin/app/admin for page.tsx routes; skip dynamic [param] directories.
 * @returns {string[]}
 */
function walkAdminRoutes(dir = ADMIN_APP_DIR, segments = []) {
  /** @type {string[]} */
  const routes = [];

  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, ent.name);

    if (ent.isDirectory()) {
      if (ent.name.startsWith('[') && ent.name.endsWith(']')) continue;
      if (ent.name.startsWith('_')) continue;
      routes.push(...walkAdminRoutes(full, [...segments, ent.name]));
      continue;
    }

    if (ent.name !== 'page.tsx') continue;
    const href = segments.length ? `/admin/${segments.join('/')}` : '/admin';
    routes.push(href);
  }

  return routes;
}

/**
 * @typedef {{ label: string; href: string }} NavItem
 * @typedef {{ label: string; href: string; items: NavItem[] }} NavSection
 */

/**
 * @param {string} content
 * @returns {{ header: string; footer: string; sections: NavSection[] }}
 */
function parseNavConfig(content) {
  const navStart = content.indexOf('export const DEFAULT_NAV: NavSection[] = [');
  const footerStart = content.indexOf(FOOTER_MARKER);

  if (navStart === -1 || footerStart === -1) {
    throw new Error('Could not locate DEFAULT_NAV block or isNavSections footer in nav-config.ts');
  }

  const arrayBody = content.slice(
    navStart + 'export const DEFAULT_NAV: NavSection[] = '.length,
    content.lastIndexOf('];', footerStart) + 2,
  );

  /** @type {NavSection[]} */
  const sections = [];
  const sectionRe =
    /\{\s*\n\s*label:\s*'((?:\\'|[^'])*)',\s*\n\s*href:\s*'([^']+)',\s*\n\s*items:\s*\[([\s\S]*?)\n\s*\],?\s*\n\s*\}/g;

  let match;
  while ((match = sectionRe.exec(arrayBody))) {
    /** @type {NavItem[]} */
    const items = [];
    const itemRe = /\{\s*label:\s*'((?:\\'|[^'])*)',\s*href:\s*'([^']+)'\s*\}/g;
    let itemMatch;
    while ((itemMatch = itemRe.exec(match[3]))) {
      items.push({
        label: itemMatch[1].replace(/\\'/g, "'"),
        href: itemMatch[2],
      });
    }

    sections.push({
      label: match[1].replace(/\\'/g, "'"),
      href: match[2],
      items,
    });
  }

  if (sections.length === 0) {
    throw new Error('Parsed zero nav sections from DEFAULT_NAV');
  }

  return {
    header: content.slice(0, navStart),
    footer: content.slice(footerStart),
    sections,
  };
}

/** @param {string} label */
function escapeTsString(label) {
  return label.replace(/\\/g, '\\\\').replace(/'/g, "\\'");
}

/** @param {NavSection[]} sections */
function serializeDefaultNav(sections) {
  const lines = ['export const DEFAULT_NAV: NavSection[] = ['];

  sections.forEach((section, sectionIndex) => {
    lines.push('  {');
    lines.push(`    label: '${escapeTsString(section.label)}',`);
    lines.push(`    href: '${section.href}',`);
    lines.push('    items: [');
    for (const item of section.items) {
      lines.push(
        `      { label: '${escapeTsString(item.label)}', href: '${item.href}' },`,
      );
    }
    lines.push('    ],');
    lines.push(`  }${sectionIndex < sections.length - 1 ? ',' : ''}`);
  });

  lines.push('];');
  return lines.join('\n');
}

/** @param {string} href */
function firstSegment(href) {
  const relative = href.replace(/^\/admin\/?/, '');
  if (!relative) return 'dashboard';
  return relative.split('/')[0];
}

/** @param {NavSection[]} sections @param {string} sectionLabel */
function findSection(sections, sectionLabel) {
  const section = sections.find((s) => s.label === sectionLabel);
  if (!section) {
    throw new Error(`Nav section not found: ${sectionLabel}`);
  }
  return section;
}

/**
 * @param {NavSection[]} sections
 * @param {string[]} routes
 */
function syncRoutes(sections, routes) {
  const existing = new Set();
  for (const section of sections) {
    for (const item of section.items) {
      existing.add(item.href);
    }
  }

  /** @type {{ href: string; label: string; section: string }[]} */
  const added = [];

  for (const href of routes.sort()) {
    if (existing.has(href)) continue;

    const segment = firstSegment(href);
    const sectionLabel = SEGMENT_TO_SECTION[segment] ?? 'System';
    const label = routeLabel(href);

    findSection(sections, sectionLabel).items.push({ label, href });
    existing.add(href);
    added.push({ href, label, section: sectionLabel });
  }

  for (const section of sections) {
    section.items.sort((a, b) => a.href.localeCompare(b.href));
  }

  return added;
}

function main() {
  const write = process.argv.includes('--write');
  const routes = walkAdminRoutes();
  const content = fs.readFileSync(NAV_CONFIG_PATH, 'utf8');
  const { header, footer, sections } = parseNavConfig(content);
  const added = syncRoutes(sections, routes);

  console.log(`Admin static routes scanned: ${routes.length}`);
  console.log(`Routes already in DEFAULT_NAV: ${routes.length - added.length}`);
  console.log(`Routes to add: ${added.length}`);

  if (added.length > 0) {
    console.log('\nMissing routes:');
    for (const entry of added) {
      console.log(`  [${entry.section}] ${entry.label} → ${entry.href}`);
    }
  }

  if (!write) {
    if (added.length > 0) {
      console.log('\nDry run only. Re-run with --write to update lib/admin/nav-config.ts');
    } else {
      console.log('\nDEFAULT_NAV is up to date.');
    }
    return;
  }

  if (added.length === 0) {
    console.log('\nNo changes written.');
    return;
  }

  const updated = `${header}${serializeDefaultNav(sections)}\n\n${footer}`;
  fs.writeFileSync(NAV_CONFIG_PATH, updated, 'utf8');
  console.log(`\nUpdated ${NAV_CONFIG_PATH} (+${added.length} routes)`);
}

main();
