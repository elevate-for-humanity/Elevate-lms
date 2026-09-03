#!/usr/bin/env node

/**
 * scripts/generate-site-map-from-app.js
 *
 * Usage (from repo root in Gitpod):
 *    node scripts/generate-site-map-from-app.js
 *
 * It will:
 *   - scan app for page.tsx|page.jsx|page.ts|page.js
 *   - ignore dynamic routes with brackets
 *   - ignore route groups with parentheses
 *   - group paths into sections by prefix
 *   - write config/site-map.auto.ts with siteMapSections
 */

const fs = require('fs');
const path = require('path');

const APP_DIR = path.join(process.cwd(), 'app');
const OUTPUT_FILE = path.join(process.cwd(), 'config', 'site-map.auto.ts');

const PAGE_FILES = new Set(['page.tsx', 'page.jsx', 'page.ts', 'page.js']);

const SECTION_RULES = [
  { id: 'programs', title: 'Programs', prefixes: ['/programs'] },
  { id: 'funding', title: 'Funding', prefixes: ['/funding'] },
  { id: 'for-students', title: 'For Students', prefixes: ['/student', '/students'] },
  { id: 'lms', title: 'LMS', prefixes: ['/lms', '/courses'] },
  { id: 'credentials', title: 'Credentials', prefixes: ['/credentials'] },
  { id: 'employers', title: 'For Employers', prefixes: ['/employers'] },
  {
    id: 'program-holders',
    title: 'Program Holders',
    prefixes: ['/program-holders'],
  },
  {
    id: 'career-services',
    title: 'Career Services',
    prefixes: ['/career-services', '/career-center'],
  },
  {
    id: 'admin-staff',
    title: 'Admin & Staff',
    prefixes: ['/admin', '/staff'],
  },
  {
    id: 'community',
    title: 'Community',
    prefixes: ['/community', '/partners', '/developer'],
  },
  {
    id: 'legal',
    title: 'Legal & Policies',
    prefixes: ['/legal'],
  },
  {
    id: 'hr-payroll',
    title: 'HR & Payroll',
    prefixes: ['/hr'],
  },
  {
    id: 'case-management',
    title: 'Case Management',
    prefixes: ['/case-management', '/delegate'],
  },
  {
    id: 'boards',
    title: 'Boards',
    prefixes: ['/boards'],
  },
  {
    id: 'special-programs',
    title: 'Special Programs',
    prefixes: [
      '/kingdom',
      '/vita',
      '/serene',
      '/urban',
      '/selfish',
      '/programs/kingdom',
      '/programs/vita',
    ],
  },
  {
    id: 'tools',
    title: 'Tools',
    prefixes: ['/tools'],
  },
  {
    id: 'builders',
    title: 'Builders',
    prefixes: ['/builders'],
  },
  {
    id: 'documents',
    title: 'Documents',
    prefixes: ['/documents'],
  },
  {
    id: 'instructor',
    title: 'Instructor',
    prefixes: ['/instructor'],
  },
  {
    id: 'reports',
    title: 'Reports & Analytics',
    prefixes: ['/reports', '/analytics'],
  },
];

function walk(dir, out = []) {
  if (!fs.existsSync(dir)) return out;
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walk(full, out);
    } else if (PAGE_FILES.has(entry.name)) {
      out.push(full);
    }
  }
  return out;
}

function routeFromFile(filePath) {
  // e.g. app/page.tsx -> /
  // e.g. app/about/page.tsx -> /about
  // e.g. app/(site)/programs/cna/page.tsx -> /programs/cna
  const rel = path.relative(APP_DIR, filePath).replace(/\\/g, '/');
  const parts = rel.split('/');

  // remove last segment "page.tsx"
  parts.pop();

  // remove empty + route groups like "(site)"
  const segments = parts.filter((seg) => seg && !seg.startsWith('(') && !seg.endsWith(')'));

  // skip if any dynamic segment like [id]
  if (segments.some((s) => s.includes('['))) {
    return null;
  }

  if (segments.length === 0) return '/';

  return '/' + segments.join('/');
}

function labelFromPath(route) {
  if (route === '/') return 'Home';
  const segments = route.split('/').filter(Boolean);
  const last = segments[segments.length - 1];
  if (!last) return route;

  // special simple overrides
  if (last === 'faq') return 'FAQ';
  if (last === 'lms') return 'LMS';
  if (last === 'api') return 'API';

  return last
    .replace(/-/g, ' ')
    .split(' ')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

function getSectionIdForRoute(route) {
  if (route === '/') return 'main-pages';
  if (
    [
      '/about',
      '/contact',
      '/apply',
      '/blog',
      '/faq',
      '/success-stories',
      '/get-started',
      '/sitemap-page',
    ].includes(route)
  ) {
    return 'main-pages';
  }

  for (const rule of SECTION_RULES) {
    if (rule.prefixes.some((p) => route.startsWith(p))) {
      return rule.id;
    }
  }

  return 'other';
}

function buildSections(routes) {
  const sections = new Map();

  function ensureSection(id, title) {
    if (!sections.has(id)) {
      sections.set(id, { id, title, items: [] });
    }
    return sections.get(id);
  }

  // always create main + other
  ensureSection('main-pages', 'Main Pages');
  ensureSection('other', 'Other Pages');

  for (const rule of SECTION_RULES) {
    ensureSection(rule.id, rule.title);
  }

  for (const route of routes) {
    const id = getSectionIdForRoute(route);
    const section =
      sections.get(id) ||
      ensureSection(
        id,
        id.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
      );

    // avoid duplicates
    if (section.items.some((i) => i.href === route)) continue;

    section.items.push({
      label: labelFromPath(route),
      href: route,
    });
  }

  // sort each section's items alphabetically by label
  for (const s of sections.values()) {
    s.items.sort((a, b) => a.label.localeCompare(b.label));
  }

  // sort sections, keep main-pages first, other last
  const ordered = Array.from(sections.values()).sort((a, b) => {
    if (a.id === 'main-pages') return -1;
    if (b.id === 'main-pages') return 1;
    if (a.id === 'other') return 1;
    if (b.id === 'other') return -1;
    return a.title.localeCompare(b.title);
  });

  return ordered;
}

function generateTs(sections) {
  const header = `// AUTO-GENERATED by scripts/generate-site-map-from-app.js
// Do not edit this file directly. Edit the script or app routes instead.

export type SiteMapItem = {
  label: string;
  href: string;
  external?: boolean;
};

export type SiteMapSection = {
  id: string;
  title: string;
  description?: string;
  items: SiteMapItem[];
};

export const SITE_BASE_URL =
  process.env.NEXT_PUBLIC_SITE_URL || "https://www.elevateforhumanity.org";

export const siteMapSections: SiteMapSection[] = [
`;

  const body = sections
    .map((s) => {
      const items = s.items
        .map((i) => `      { label: ${JSON.stringify(i.label)}, href: ${JSON.stringify(i.href)} }`)
        .join(',\n');

      return `  {
    id: ${JSON.stringify(s.id)},
    title: ${JSON.stringify(s.title)},
    items: [
${items}
    ],
  }`;
    })
    .join(',\n');

  const footer = `
];
`;

  return header + body + footer;
}

function main() {
  if (!fs.existsSync(APP_DIR)) {
    console.error('❌ app/ directory not found. Run from your Next.js repo root.');
    process.exit(1);
  }

  console.log('🔍 Scanning app/ for page routes...');
  const files = walk(APP_DIR);
  const routes = [];

  for (const file of files) {
    const route = routeFromFile(file);
    if (!route) continue;
    // skip api routes just in case
    if (route.startsWith('/api')) continue;
    // skip pure redirect stubs — pages whose only meaningful line is permanentRedirect()/redirect()
    const content = fs.readFileSync(file, 'utf8');
    const nonBlankLines = content.split('\n').filter((l) => l.trim() && !l.trim().startsWith('//') && !l.trim().startsWith('import') && !l.trim().startsWith('export default') && !l.trim().startsWith('}') && !l.trim().startsWith('{'));
    const isRedirectStub = nonBlankLines.length <= 2 && nonBlankLines.some((l) => l.includes('permanentRedirect(') || l.includes('redirect('));
    if (isRedirectStub) continue;
    routes.push(route);
  }

  // unique + sorted
  const uniqueRoutes = Array.from(new Set(routes)).sort();
  console.log(`✅ Found ${uniqueRoutes.length} routes.`);

  const sections = buildSections(uniqueRoutes);
  const tsContent = generateTs(sections);

  // ensure config directory
  const configDir = path.join(process.cwd(), 'config');
  if (!fs.existsSync(configDir)) {
    fs.mkdirSync(configDir, { recursive: true });
  }

  fs.writeFileSync(OUTPUT_FILE, tsContent, 'utf8');
  console.log(`✅ Wrote ${path.relative(process.cwd(), OUTPUT_FILE)}`);
  console.log("📌 Import siteMapSections from './site-map.auto' where needed.");
}

main();
