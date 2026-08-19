#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const APPS = {
  marketing: {
    appDir: 'apps/marketing/app',
    publicDirs: ['public', 'apps/marketing/public'],
    hosts: new Set(['www.elevateforhumanity.org', 'elevateforhumanity.org']),
    configFiles: ['next.config.mjs'],
  },
  admin: {
    appDir: 'apps/admin/app',
    publicDirs: ['public', 'apps/admin/public'],
    hosts: new Set(['admin.elevateforhumanity.org']),
    configFiles: ['apps/admin/next.config.mjs'],
  },
  lms: {
    appDir: 'apps/lms/app',
    publicDirs: ['public', 'apps/lms/public'],
    hosts: new Set(['app.elevateforhumanity.org']),
    configFiles: ['apps/lms/next.config.mjs'],
  },
};

const SOURCE_EXTS = new Set(['.ts', '.tsx', '.js', '.jsx', '.mjs', '.json', '.md', '.mdx']);
const ASSET_EXT = /\.(?:png|jpe?g|webp|gif|svg|avif|mp4|webm|mp3|wav|pdf|ico|woff2?|ttf|otf)$/i;
const SKIP_PREFIXES = [
  '/api/', '/_next/', '/favicon', '/manifest', '/robots', '/sitemap', '/sw.js', '/sw-',
  '/.well-known/', '/health', '/version.json', '/data/',
];
const HOST_OWNER = new Map();
for (const [owner, cfg] of Object.entries(APPS)) {
  for (const host of cfg.hosts) HOST_OWNER.set(host, owner);
}

const failures = [];
const warnings = [];
const stats = { pages: {}, aliases: {}, linksScanned: 0, assetsScanned: 0, contracts: 0 };

function walk(dir) {
  const abs = path.join(ROOT, dir);
  if (!fs.existsSync(abs)) return [];
  const out = [];
  const stack = [abs];
  while (stack.length) {
    const current = stack.pop();
    for (const entry of fs.readdirSync(current, { withFileTypes: true })) {
      if (['node_modules', '.next', '.git', 'app-legacy'].includes(entry.name)) continue;
      const full = path.join(current, entry.name);
      if (entry.isDirectory()) stack.push(full);
      else out.push(full);
    }
  }
  return out;
}

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function pagePattern(route) {
  if (route === '/') return /^\/$/;
  const source = route.split('/').map((segment) => {
    if (!segment) return '';
    if (/^\[\[\.\.\..+\]\]$/.test(segment)) return '(?:.*)?';
    if (/^\[\.\.\..+\]$/.test(segment)) return '.+';
    if (/^\[[^\]]+\]$/.test(segment)) return '[^/]+';
    return escapeRegex(segment);
  }).join('/');
  return new RegExp(`^${source}/?$`);
}

function configPattern(source) {
  if (source === '/') return /^\/$/;
  const segments = source.split('/').map((segment) => {
    if (!segment) return '';
    const catchAll = segment.match(/^:([A-Za-z0-9_]+)\*$/);
    if (catchAll) return '.*';
    const optional = segment.match(/^:([A-Za-z0-9_]+)\?$/);
    if (optional) return '[^/]*';
    const param = segment.match(/^:([A-Za-z0-9_]+)$/);
    if (param) return '[^/]+';
    if (segment.includes('(') || segment.includes('[')) return '.*';
    return escapeRegex(segment);
  }).join('/');
  return new RegExp(`^${segments}/?$`);
}

function cleanRouteSegment(segment) {
  if (!segment) return null;
  if (/^\(.+\)$/.test(segment)) return null;
  if (segment.startsWith('@')) return null;
  return segment.replace(/^\(\.\)+/, '').replace(/^\(\.\.\)+/, '').replace(/^\(\.\.\.\)+/, '');
}

function routeFromPage(appDir, file) {
  const relDir = path.relative(path.join(ROOT, appDir), path.dirname(file));
  const parts = relDir === '' ? [] : relDir.split(path.sep).map(cleanRouteSegment).filter(Boolean);
  return '/' + parts.join('/');
}

function collectRoutes(owner) {
  const cfg = APPS[owner];
  const pages = walk(cfg.appDir)
    .filter((file) => /\/page\.(?:ts|tsx|js|jsx)$/.test(file.replaceAll('\\', '/')))
    .filter((file) => !file.replaceAll('\\', '/').includes('/app/api/'));
  const routes = [...new Set(pages.map((file) => routeFromPage(cfg.appDir, file)))].sort();
  const patterns = routes.map((route) => ({ route, regex: pagePattern(route) }));

  const aliases = [];
  for (const configFile of cfg.configFiles) {
    const abs = path.join(ROOT, configFile);
    if (!fs.existsSync(abs)) continue;
    const text = fs.readFileSync(abs, 'utf8');
    for (const match of text.matchAll(/source\s*:\s*['"](\/[^'"]+)['"]/g)) {
      aliases.push({ source: match[1], regex: configPattern(match[1]) });
    }
  }

  stats.pages[owner] = routes.length;
  stats.aliases[owner] = aliases.length;
  return { routes, patterns, aliases };
}

const routeSets = Object.fromEntries(Object.keys(APPS).map((owner) => [owner, collectRoutes(owner)]));

function routeExists(owner, pathname) {
  const clean = pathname.split('?')[0].split('#')[0].replace(/\/{2,}/g, '/') || '/';
  const set = routeSets[owner];
  return set.patterns.some(({ regex }) => regex.test(clean)) || set.aliases.some(({ regex }) => regex.test(clean));
}

function assetExists(owner, pathname) {
  const rel = decodeURIComponent(pathname).replace(/^\//, '');
  if (APPS[owner].publicDirs.some((dir) => fs.existsSync(path.join(ROOT, dir, rel)))) return true;
  return routeSets[owner].aliases.some(({ regex }) => regex.test(pathname));
}

function ownerForSource(file) {
  const rel = path.relative(ROOT, file).replaceAll('\\', '/');
  if (rel.startsWith('apps/admin/')) return 'admin';
  if (rel.startsWith('apps/lms/')) return 'lms';
  if (rel.startsWith('apps/marketing/')) return 'marketing';
  return 'marketing';
}

function shouldSkipPath(value) {
  if (!value || value === '/' || value.startsWith('//')) return false;
  if (value.startsWith('/#') || value === '#') return true;
  return SKIP_PREFIXES.some((prefix) => value.startsWith(prefix));
}

function inspectReference({ file, line, value }) {
  if (!value || value.includes('${') || value.includes('{') || value.includes('*')) return;
  if (/^(?:mailto:|tel:|sms:|javascript:|data:|blob:)/i.test(value)) return;

  let owner = ownerForSource(file);
  let pathname = value;
  let absolute = false;
  if (/^https?:\/\//i.test(value)) {
    let url;
    try { url = new URL(value); } catch { return; }
    const mapped = HOST_OWNER.get(url.hostname.toLowerCase());
    if (!mapped) return;
    owner = mapped;
    pathname = url.pathname + url.search + url.hash;
    absolute = true;
  } else if (!value.startsWith('/')) {
    return;
  }

  const cleanPath = pathname.split('?')[0].split('#')[0];
  if (ASSET_EXT.test(cleanPath)) {
    stats.assetsScanned += 1;
    if (!assetExists(owner, cleanPath)) {
      failures.push(`MISSING_ASSET ${path.relative(ROOT, file)}:${line} -> ${value} [owner=${owner}]`);
    }
    return;
  }

  if (shouldSkipPath(cleanPath)) return;
  stats.linksScanned += 1;
  if (!routeExists(owner, cleanPath)) {
    const kind = absolute ? 'BROKEN_CROSS_APP_ROUTE' : 'BROKEN_INTERNAL_ROUTE';
    failures.push(`${kind} ${path.relative(ROOT, file)}:${line} -> ${value} [owner=${owner}]`);
  }
}

// Validate the repository's existing canonical surface contract instead of maintaining a second route list.
const contractsPath = path.join(ROOT, 'lib/routes/platform-surface-contracts.json');
if (!fs.existsSync(contractsPath)) {
  failures.push('MISSING_CONTRACT lib/routes/platform-surface-contracts.json');
} else {
  const contracts = JSON.parse(fs.readFileSync(contractsPath, 'utf8'));
  const routeFields = new Set(['canonical', 'application', 'portal']);

  function validateEntry(entry, label, defaultApp) {
    if (!entry || typeof entry !== 'object' || Array.isArray(entry) || !entry.path) return;
    const owner = entry.app ?? defaultApp;
    if (!APPS[owner]) {
      failures.push(`CONTRACT_UNKNOWN_APP ${label} -> ${String(owner)}`);
      return;
    }
    stats.contracts += 1;
    if (!routeExists(owner, entry.path)) failures.push(`CONTRACT_ROUTE_MISSING ${label} -> ${owner}:${entry.path}`);
    if (entry.target) {
      if (/^https?:\/\//i.test(entry.target)) {
        try {
          const url = new URL(entry.target);
          const targetOwner = HOST_OWNER.get(url.hostname.toLowerCase());
          if (targetOwner && !routeExists(targetOwner, url.pathname)) {
            failures.push(`CONTRACT_TARGET_MISSING ${label} -> ${targetOwner}:${url.pathname}`);
          }
        } catch {
          failures.push(`CONTRACT_BAD_TARGET ${label} -> ${entry.target}`);
        }
      } else if (entry.target.startsWith('/') && !routeExists(owner, entry.target)) {
        failures.push(`CONTRACT_TARGET_MISSING ${label} -> ${owner}:${entry.target}`);
      }
    }
  }

  for (const [surfaceName, surface] of Object.entries(contracts.surfaces ?? {})) {
    const canonicalApp = surface?.canonical?.app;
    for (const [key, value] of Object.entries(surface ?? {})) {
      if (routeFields.has(key)) validateEntry(value, `${surfaceName}.${key}`, canonicalApp);
      else if (['operational', 'informational', 'compatibility'].includes(key) && Array.isArray(value)) {
        value.forEach((entry, index) => validateEntry(entry, `${surfaceName}.${key}[${index}]`, canonicalApp));
      }
    }
  }
}

const sourceRoots = [
  'apps/marketing/app', 'apps/admin/app', 'apps/lms/app',
  'components', 'lib/navigation', 'lib/routing', 'config', 'content',
];
const literalPattern = /(?:href|src|poster|url|destination|redirectTo)\s*[=:]\s*[{(]?\s*['"`]([^'"`]+)['"`]/g;
for (const root of sourceRoots) {
  for (const file of walk(root)) {
    const rel = path.relative(ROOT, file).replaceAll('\\', '/');
    // Page/surface audit. API-generated URLs are audited separately because their
    // ownership context may be email/SMS rather than the service hosting the route file.
    if (rel.includes('/app/api/')) continue;
    if (!SOURCE_EXTS.has(path.extname(file).toLowerCase())) continue;
    let text;
    try { text = fs.readFileSync(file, 'utf8'); } catch { continue; }
    const lines = text.split(/\r?\n/);
    for (let index = 0; index < lines.length; index += 1) {
      for (const match of lines[index].matchAll(literalPattern)) {
        inspectReference({ file, line: index + 1, value: match[1].trim() });
      }
    }
  }
}

// Store and acquisition-specific surfaces not yet represented in the platform contract.
const acquisitionRoutes = {
  marketing: ['/', '/programs', '/programs/barber-apprenticeship', '/store', '/store/demo', '/store/trial', '/online-apps'],
  admin: ['/dashboard', '/applications', '/students', '/programs', '/funding', '/partners', '/crm', '/compliance', '/studio', '/studio/courses', '/system-health', '/login'],
  lms: ['/login', '/lms/dashboard', '/employer/dashboard', '/host-shop/dashboard', '/program-holder/dashboard', '/workforce/dashboard', '/parent-portal/dashboard'],
};
for (const [owner, routes] of Object.entries(acquisitionRoutes)) {
  for (const route of routes) if (!routeExists(owner, route)) failures.push(`MISSING_ACQUISITION_ROUTE ${owner}:${route}`);
}

const barberPartnershipPath = path.join(ROOT, 'apps/marketing/app/programs/barber-apprenticeship/sections/BarberPartnership.tsx');
if (fs.existsSync(barberPartnershipPath)) {
  const barber = fs.readFileSync(barberPartnershipPath, 'utf8');
  if (!barber.includes('href="/partners/host-shop/apply"')) {
    failures.push('ROUTE_CONTRACT Barber host-shop CTA must point to /partners/host-shop/apply');
  }
}

console.log('=== PLATFORM SURFACE AUDIT ===');
for (const owner of Object.keys(APPS)) console.log(`${owner}: ${stats.pages[owner]} pages, ${stats.aliases[owner]} route/asset aliases`);
console.log(`Canonical contract entries checked: ${stats.contracts}`);
console.log(`Literal user-facing links checked: ${stats.linksScanned}`);
console.log(`Literal local assets checked: ${stats.assetsScanned}`);
console.log(`Warnings: ${warnings.length}`);
console.log(`Failures: ${failures.length}`);

if (warnings.length) console.warn(warnings.map((item) => `AUDIT_WARNING ${item}`).join('\n'));
if (failures.length) {
  const grouped = new Map();
  for (const failure of failures) {
    const key = failure.split(' ', 1)[0];
    if (!grouped.has(key)) grouped.set(key, []);
    grouped.get(key).push(failure);
  }
  for (const [kind, items] of grouped) {
    console.error(`\n--- ${kind}: ${items.length} ---`);
    // Keep CI logs actionable. Full counts remain visible while each category
    // prints the first 100 concrete failures for repair iterations.
    console.error(items.slice(0, 100).map((item) => `AUDIT_ERROR ${item}`).join('\n'));
  }
  process.exit(1);
}

console.log('Platform surface audit passed: canonical contracts, acquisition routes, user-facing internal navigation, cross-app ownership, and literal local assets are consistent.');
