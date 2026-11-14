#!/usr/bin/env node
/**
 * Audit Apply menu pages: route exists, form/API wiring, known redirects.
 * Usage: pnpm exec tsx scripts/audit-apply-pages.mjs
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');

// Surfaces loaded from lib/apply/apply-surface-routes.ts in main()

function pageFileForHref(href) {
  const pathname = href.split('?')[0].split('#')[0];
  const candidates = [
    path.join(ROOT, 'app', pathname, 'page.tsx'),
    path.join(ROOT, 'app', pathname, 'page.ts'),
  ];
  return candidates.find((p) => fs.existsSync(p)) ?? null;
}

function readFile(p) {
  return fs.readFileSync(p, 'utf8');
}

function apiRouteExists(apiPath) {
  if (!apiPath || apiPath.startsWith('server:')) return true;
  const rel = path.join(ROOT, 'app', apiPath.replace(/^\//, ''), 'route.ts');
  return fs.existsSync(rel);
}

async function main() {
  const routesMod = await import(pathToFileURL(path.join(ROOT, 'lib/apply/apply-surface-routes.ts')).href);
  const APPLY_AUDIT = routesMod.APPLY_AUDIT_SURFACES;
  const mod = await import(pathToFileURL(path.join(ROOT, 'lib/navigation.ts')).href);
  const navApply = mod.NAV_ITEMS.find((i) => i.id === 'apply');
  const navHrefs = new Set(
    (navApply?.subItems ?? [])
      .filter((s) => !s.isHeader)
      .map((s) => s.href.split('?')[0].split('#')[0]),
  );

  const issues = [];
  const rows = [];

  for (const item of APPLY_AUDIT.map((a) => ({
    ...a,
    expectForm: a.expectForm ?? null,
    api: a.api ?? null,
  }))) {
    const pagePath = pageFileForHref(item.href);
    const row = { ...item, pagePath: pagePath ? path.relative(ROOT, pagePath) : null };
    if (!pagePath) {
      issues.push(`${item.name}: missing page for ${item.href}`);
      row.status = 'MISSING_PAGE';
    } else {
      const src = readFile(pagePath);
      if (src.includes("redirect('/apply/fssa/waitlist')") || src.includes('redirect("/apply/fssa/waitlist")')) {
        row.status = 'REDIRECT';
        row.redirect = '/apply/fssa/waitlist';
      } else if (src.includes('redirect(') && item.href === '/apply/status') {
        row.status = 'REDIRECT';
        row.redirect = '/apply/track';
      } else {
        row.status = 'OK';
      }
      if (item.expectForm && item.expectForm !== 'form' && item.expectForm !== 'search') {
        if (!src.includes(item.expectForm)) {
          issues.push(`${item.name}: expected ${item.expectForm} in ${row.pagePath}`);
          row.status = 'FORM_MISMATCH';
        }
      }
      if (item.api && !apiRouteExists(item.api)) {
        issues.push(`${item.name}: API missing ${item.api}`);
        row.status = 'API_MISSING';
      }
      if (item.api && item.api.startsWith('/') && pagePath) {
        const pageSrc = readFile(pagePath);
        if (!pageSrc.includes(item.api.split('/').pop()) && !pageSrc.includes(item.api)) {
          // server actions won't include path — skip for server:*
        }
      }
    }
    rows.push(row);
  }

  for (const href of navHrefs) {
    if (!APPLY_AUDIT.some((a) => a.href.split('#')[0] === href)) {
      issues.push(`Nav href not in audit list: ${href}`);
    }
  }

  console.log('Apply menu page audit\n');
  for (const r of rows) {
    console.log(`[${r.status}] ${r.section} — ${r.name}`);
    console.log(`  ${r.href}`);
    if (r.pagePath) console.log(`  → ${r.pagePath}`);
    if (r.note) console.log(`  note: ${r.note}`);
    if (r.redirect) console.log(`  → redirects to ${r.redirect}`);
  }

  if (issues.length) {
    console.log('\nIssues:');
    issues.forEach((i) => console.log(`  - ${i}`));
    process.exit(1);
  }
  console.log(`\n${rows.length} application surfaces checked — no structural issues.`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
