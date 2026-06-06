#!/usr/bin/env node
/**
 * Audit marketing header links in lib/navigation.ts.
 * Resolves static pages, dynamic [program]/[provider] routes, and next.config redirects.
 *
 * Usage: node scripts/audit-nav-links.mjs
 * Exit 1 if any leaf href is unroutable.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');

async function loadNav() {
  const mod = await import(pathToFileURL(path.join(ROOT, 'lib/navigation.ts')).href);
  return mod.NAV_ITEMS;
}

function collectPageRoutes() {
  const routes = new Set();
  const walk = (dir, prefix = '') => {
    for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, ent.name);
      if (ent.isDirectory()) {
        if (ent.name.startsWith('(') || ent.name.startsWith('[')) {
          walk(full, `${prefix}/${ent.name}`);
        } else {
          walk(full, `${prefix}/${ent.name}`);
        }
        continue;
      }
      if (ent.name !== 'page.tsx' && ent.name !== 'route.ts') continue;
      const rel = path.relative(path.join(ROOT, 'app'), path.dirname(full));
      const segments = rel.split(path.sep).filter(Boolean);
      let route = '/';
      for (const seg of segments) {
        if (seg.startsWith('(') && seg.endsWith(')')) continue;
        if (seg.startsWith('[') && seg.endsWith(']')) {
          route += `/:${seg.slice(1, -1)}/`;
        } else {
          route += `${seg}/`;
        }
      }
      routes.add(route.replace(/\/+$/, '') || '/');
    }
  };
  walk(path.join(ROOT, 'app'));
  return routes;
}

function parseNextRedirects() {
  const configPath = path.join(ROOT, 'next.config.mjs');
  const src = fs.readFileSync(configPath, 'utf8');
  const map = new Map();
  const re = /source:\s*['"]([^'"]+)['"]\s*,\s*destination:\s*['"]([^'"]+)['"]/g;
  let m;
  while ((m = re.exec(src))) {
    map.set(m[1], m[2]);
  }
  return map;
}

function loadStaticProgramSlugs() {
  const slugs = new Set();
  const indexPath = path.join(ROOT, 'data/programs/index.ts');
  if (!fs.existsSync(indexPath)) return slugs;
  const content = fs.readFileSync(indexPath, 'utf8');
  const importRe = /from '\.\/([^']+)'/g;
  const files = new Set();
  let m;
  while ((m = importRe.exec(content)) !== null) files.add(m[1]);
  for (const file of files) {
    const fp = path.join(ROOT, 'data/programs', `${file}.ts`);
    if (!fs.existsSync(fp)) continue;
    const src = fs.readFileSync(fp, 'utf8');
    const slugM = src.match(/slug:\s*['"`]([a-z0-9-]+)['"`]/);
    if (slugM) slugs.add(slugM[1]);
  }
  return slugs;
}

function loadCfProgramSlugs() {
  const cfPath = path.join(ROOT, 'content/cf-programs.ts');
  if (!fs.existsSync(cfPath)) return new Set();
  const src = fs.readFileSync(cfPath, 'utf8');
  const slugs = new Set();
  const re = /slug:\s*['"]([^'"]+)['"]/g;
  let m;
  while ((m = re.exec(src))) slugs.add(m[1]);
  return slugs;
}

function loadCertProviderKeys() {
  const src = fs.readFileSync(path.join(ROOT, 'lib/testing/proctoring-capabilities.ts'), 'utf8');
  const keys = new Set();
  const block = src.match(/export const CERT_PROVIDERS[^=]*=\s*\{([\s\S]*?)\n\};/);
  if (!block) return keys;
  const re = /^\s+([a-z0-9_]+):\s*\{/gm;
  let m;
  while ((m = re.exec(block[1]))) keys.add(m[1]);
  return keys;
}

function normalizeHref(href) {
  const noQuery = href.split('?')[0];
  const [pathname] = noQuery.split('#');
  return pathname.replace(/\/+$/, '') || '/';
}

function resolveHref(href, ctx) {
  let p = normalizeHref(href);
  const chain = [p];
  while (ctx.redirects.has(p)) {
    p = normalizeHref(ctx.redirects.get(p));
    if (chain.includes(p)) break;
    chain.push(p);
  }

  if (ctx.exactPages.has(p)) return { ok: true, resolved: p, via: 'page' };

  // Dynamic program slug (app/programs/[program]/page.tsx + static registry)
  const prog = p.match(/^\/programs\/([^/]+)$/);
  if (prog && !prog[1].includes('[')) {
    const slug = prog[1];
    const hasDynamicProgramRoute = fs.existsSync(
      path.join(ROOT, 'app/programs/[program]/page.tsx'),
    );
    if (
      hasDynamicProgramRoute &&
      (ctx.programSlugs.has(slug) || ctx.cfSlugs.has(slug))
    ) {
      return { ok: true, resolved: '/programs/:program', via: `program slug "${slug}"` };
    }
  }

  // Nested program routes (apply, host-shops, etc.)
  const progNested = p.match(/^\/programs\/([^/]+)\/(.+)$/);
  if (progNested) {
    const base = `/programs/${progNested[1]}`;
    const nested = `${base}/${progNested[2]}`;
    if (ctx.exactPages.has(nested)) return { ok: true, resolved: nested, via: 'nested page' };
    if (ctx.programSlugs.has(progNested[1]) || ctx.cfSlugs.has(progNested[1])) {
      const dyn = `/programs/:program/${progNested[2]}`;
      if (ctx.routePatterns.has(dyn) || [...ctx.routePatterns].some((r) => r.includes('/:program/'))) {
        return { ok: true, resolved: dyn, via: `program "${progNested[1]}" + segment` };
      }
    }
  }

  const testing = p.match(/^\/testing\/([^/]+)$/);
  if (testing && ctx.certProviders.has(testing[1])) {
    return { ok: true, resolved: '/testing/:provider', via: `provider "${testing[1]}"` };
  }

  // Match against route patterns (single-segment params)
  for (const pattern of ctx.routePatterns) {
    if (!pattern.includes(':')) continue;
    const regex = new RegExp(
      '^' +
        pattern
          .replace(/:[^/]+/g, '[^/]+')
          .replace(/\//g, '\\/') +
        '$',
    );
    if (regex.test(p)) return { ok: true, resolved: pattern, via: 'pattern' };
  }

  return { ok: false, resolved: p, via: 'unresolved' };
}

function leafHrefs(items) {
  const out = [];
  for (const item of items) {
    for (const sub of item.subItems ?? []) {
      if (sub.isHeader) continue;
      out.push({ section: item.name, name: sub.name, href: sub.href });
    }
  }
  return out;
}

async function main() {
  const items = await loadNav();
  const redirects = parseNextRedirects();
  const exactPages = new Set();
  const routePatterns = collectPageRoutes();
  for (const r of routePatterns) {
    if (!r.includes(':')) exactPages.add(r);
  }

  const ctx = {
    redirects,
    exactPages,
    routePatterns,
    programSlugs: loadStaticProgramSlugs(),
    cfSlugs: loadCfProgramSlugs(),
    certProviders: loadCertProviderKeys(),
  };

  const leaves = leafHrefs(items);
  const broken = [];
  const ok = [];

  for (const leaf of leaves) {
    const result = resolveHref(leaf.href, ctx);
    if (result.ok) ok.push({ ...leaf, ...result });
    else broken.push({ ...leaf, ...result });
  }

  console.log(`Nav leaf links: ${leaves.length}`);
  console.log(`OK: ${ok.length}`);
  console.log(`Broken: ${broken.length}`);
  if (broken.length) {
    console.log('\nBroken links:');
    for (const b of broken) {
      console.log(`  [${b.section}] ${b.name}`);
      console.log(`    ${b.href} → ${b.resolved} (${b.via})`);
    }
    process.exit(1);
  }
  console.log('\nAll header leaf links resolve.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
