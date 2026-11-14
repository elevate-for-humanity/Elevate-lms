#!/usr/bin/env node

/**
 * scripts/generate-polished-pages.cjs
 *
 * Usage from repo root:
 *   node scripts/generate-polished-pages.cjs
 *
 * What it does:
 *   - scans app for page.tsx files
 *   - computes route for each page
 *   - assigns each route to a category
 *   - overwrites the page file with AutoPolishedPage wrapper
 *
 * WARNING: This will overwrite existing page files.
 *     Commit your work first
 */

const fs = require('fs');
const path = require('path');

const APP_DIR = path.join(process.cwd(), 'app');
const PAGE_FILES = new Set(['page.tsx', 'page.jsx', 'page.ts', 'page.js']);

// Pages to skip (keep custom layouts)
const SKIP_PAGES = [
  'app/page.tsx', // home
  'app/programs/page.tsx', // programs overview
  'app/programs/medical-assistant/page.tsx',
  'app/programs/cna/page.tsx',
  'app/sitemap-page/page.tsx',
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

function fileToRoute(filePath) {
  // app/page.tsx -> "/"
  const rel = path.relative(APP_DIR, filePath).replace(/\\/g, '/');

  if (rel === 'page.tsx' || rel === 'page.jsx' || rel === 'page.ts' || rel === 'page.js') {
    return '/';
  }

  const parts = rel.split('/');
  parts.pop(); // remove "page.tsx"

  // Remove route groups like (site)
  const segments = parts.filter((seg) => seg && !seg.startsWith('(') && !seg.endsWith(')'));

  if (segments.length === 0) return '/';

  return '/' + segments.join('/');
}

function routeToLabel(route) {
  if (route === '/') return 'Home';

  const segments = route.split('/').filter(Boolean);
  const last = segments[segments.length - 1];

  if (!last) return route;

  if (last === 'faq') return 'FAQ';
  if (last === 'lms') return 'LMS';
  if (last === 'api') return 'API';

  return last
    .replace(/-/g, ' ')
    .split(' ')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

function routeToSectionTitle(route) {
  // High-level grouping based on path prefix
  if (route === '/') return 'Main Pages';
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
    return 'Main Pages';
  }

  if (route.startsWith('/programs')) return 'Programs';
  if (route.startsWith('/funding')) return 'Funding';
  if (route.startsWith('/student') || route.startsWith('/students')) return 'For Students';
  if (route.startsWith('/lms') || route.startsWith('/courses')) return 'LMS';
  if (route.startsWith('/credentials')) return 'Credentials';
  if (route.startsWith('/employers')) return 'For Employers';
  if (route.startsWith('/program-holders') || route.startsWith('/program-holder'))
    return 'Program Holders';
  if (
    route.startsWith('/career-services') ||
    route.startsWith('/career-center') ||
    route.startsWith('/careers')
  )
    return 'Career Services';
  if (route.startsWith('/admin') || route.startsWith('/staff')) return 'Admin & Staff';
  if (route.startsWith('/community') || route.startsWith('/partners')) return 'Community';
  if (route.startsWith('/legal')) return 'Legal & Policies';
  if (route.startsWith('/hr') || route.startsWith('/employee')) return 'HR & Payroll';
  if (route.startsWith('/case-management') || route.startsWith('/delegate'))
    return 'Case Management';
  if (
    route.startsWith('/boards') ||
    route.startsWith('/board') ||
    route.startsWith('/workforce-board')
  )
    return 'Boards';
  if (
    route.startsWith('/programs/kingdom') ||
    route.startsWith('/programs/vita') ||
    route.startsWith('/programs/serene') ||
    route.startsWith('/programs/urban') ||
    route.startsWith('/programs/selfish') ||
    route.startsWith('/kingdom') ||
    route.startsWith('/serene')
  )
    return 'Special Programs';
  if (route.startsWith('/tools')) return 'Tools';
  if (route.startsWith('/builders')) return 'Builders';
  if (route.startsWith('/documents') || route.startsWith('/docs')) return 'Documents';
  if (route.startsWith('/instructor') || route.startsWith('/educator')) return 'Instructor';
  if (route.startsWith('/reports') || route.startsWith('/analytics')) return 'Reports & Analytics';

  return 'Other';
}

function ensureDirForFile(filePath) {
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function makePageContent(route, label, sectionTitle) {
  const safeLabel = label.replace(/"/g, '\\"');
  const safeSection = sectionTitle.replace(/"/g, '\\"');
  const title = `${safeLabel} | Elevate For Humanity`;
  const description = `Learn more about ${safeLabel} inside the Elevate For Humanity workforce ecosystem.`;

  return `import type { Metadata } from "next";
import { AutoPolishedPage } from "@/components/layouts/AutoPolishedPage";

export const metadata: Metadata = {
  title: "${title}",
  description: "${description}",
};

export default function Page() {
  return (
    <AutoPolishedPage
      route="${route}"
      label="${safeLabel}"
      section="${safeSection}"
    />
  );
}
`;
}

function main() {
  if (!fs.existsSync(APP_DIR)) {
    console.error('❌ app/ directory not found. Run from your Next.js repo root.');
    process.exit(1);
  }

  console.log('🔍 Scanning app/ for page files...');
  const files = walk(APP_DIR);

  if (!files.length) {
    console.log('No page files found. Nothing to do.');
    return;
  }

  let total = 0;
  let skipped = 0;

  for (const filePath of files) {
    const route = fileToRoute(filePath);

    // skip weird cases or API-style routes
    if (!route.startsWith('/')) continue;
    if (route.startsWith('/api')) continue;

    // Check if this is a page we want to skip
    const relPath = path.relative(process.cwd(), filePath).replace(/\\/g, '/');
    if (SKIP_PAGES.includes(relPath)) {
      console.log('⏭️  Skipping (custom):', relPath);
      skipped++;
      continue;
    }

    const label = routeToLabel(route);
    const sectionTitle = routeToSectionTitle(route);

    const content = makePageContent(route, label, sectionTitle);

    ensureDirForFile(filePath);
    fs.writeFileSync(filePath, content, 'utf8');
    total++;

    console.log('✅ Polished:', path.relative(process.cwd(), filePath), '->', route);
  }

  console.log(`\n✨ Done. Polished ${total} pages using AutoPolishedPage.`);
  console.log(`⏭️  Skipped ${skipped} custom pages.`);
  console.log('   Review with `git diff`, then run `npm run build` to confirm.');
}

main();
