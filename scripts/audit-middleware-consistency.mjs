#!/usr/bin/env node
/**
 * audit-middleware-consistency.mjs
 * Validates that proxy.ts role-gating, auth requirements, noindex prefixes,
 * and public dashboard landing lists are consistent with current canonical
 * portal/dashboard routes after canonicalization.
 *
 * Outputs: reports/canonicalization/middleware-consistency.json
 */

import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const PROXY_PATH = path.join(ROOT, 'proxy.ts');
const NEXT_CONFIG_PATH = path.join(ROOT, 'next.config.mjs');
const REPORT_DIR = path.join(ROOT, 'reports', 'canonicalization');
fs.mkdirSync(REPORT_DIR, { recursive: true });

function readFile(p) {
  try { return fs.readFileSync(p, 'utf8'); } catch { return ''; }
}

// ── Extract arrays/objects from proxy.ts by name ──────────────────────────────

function extractStringArray(text, varName) {
  const re = new RegExp(`(?:const|let|var)\\s+${varName}\\s*[=:].*?\\[([\\s\\S]*?)\\]`, 'm');
  const m = text.match(re);
  if (!m) return [];
  return [...m[1].matchAll(/['"`]([^'"`]+)['"`]/g)].map(s => s[1]);
}

function extractObjectKeys(text, varName) {
  const re = new RegExp(`(?:const|let|var)\\s+${varName}\\s*[=:].*?\\{([\\s\\S]*?)^\\}`, 'm');
  const m = text.match(re);
  if (!m) return [];
  return [...m[1].matchAll(/^\s*['"`]([^'"`]+)['"`]\s*:/gm)].map(s => s[1]);
}

// ── Canonical portal mapping (from AGENTS.md) ────────────────────────────────

const CANONICAL_PORTALS = {
  '/learner/dashboard':        ['student', 'admin', 'super_admin'],
  '/employer/dashboard':       ['employer', 'admin', 'super_admin'],
  '/partner/dashboard':        ['partner', 'admin', 'super_admin'],
  '/admin/dashboard':          ['admin', 'super_admin'],
  '/instructor/dashboard':     ['instructor', 'admin', 'super_admin'],
  '/admin/staff-portal/dashboard':   ['staff', 'admin', 'super_admin'],
  '/mentor/dashboard':         ['mentor', 'admin', 'super_admin'],
  '/program-holder/dashboard': ['program_holder', 'admin', 'super_admin'],
};

const LEGACY_PORTAL_PATHS = [
  '/student-portal/',
  '/employer-portal/',
  '/partner-portal',
];

const proxyText = readFile(PROXY_PATH);

// ── Extract from proxy.ts ─────────────────────────────────────────────────────

const protectedRouteKeys = extractObjectKeys(proxyText, 'PROTECTED_ROUTES');
const authRequiredRoutes = extractStringArray(proxyText, 'AUTH_REQUIRED_ROUTES');
const noindexPrefixes    = extractStringArray(proxyText, 'NOINDEX_PREFIXES');
const publicLandings     = extractStringArray(proxyText, 'PUBLIC_DASHBOARD_LANDINGS');

const issues = [];
const observations = [];

// ── Check 1: Legacy portal paths still in PROTECTED_ROUTES ───────────────────

for (const legacy of LEGACY_PORTAL_PATHS) {
  const found = protectedRouteKeys.filter(k => k.startsWith(legacy.replace(/\/$/, '')));
  if (found.length > 0) {
    issues.push({
      severity: 'warn',
      area: 'PROTECTED_ROUTES',
      message: `Legacy portal path still in PROTECTED_ROUTES: ${found.join(', ')}`,
      action: 'Keep — redirect at config level means traffic never reaches this gate; no harm. Low priority cleanup.',
    });
  }
}

// ── Check 2: Legacy portal paths still in AUTH_REQUIRED_ROUTES ───────────────

for (const legacy of LEGACY_PORTAL_PATHS) {
  const clean = legacy.replace(/\/$/, '');
  const found = authRequiredRoutes.filter(r => r.startsWith(clean) || r === clean);
  if (found.length > 0) {
    issues.push({
      severity: 'warn',
      area: 'AUTH_REQUIRED_ROUTES',
      message: `Legacy portal path still in AUTH_REQUIRED_ROUTES: ${found.join(', ')}`,
      action: 'Keep — provides defense-in-depth even though config-level redirect fires first.',
    });
  }
}

// ── Check 3: Legacy portals still in PUBLIC_DASHBOARD_LANDINGS ───────────────

for (const legacy of LEGACY_PORTAL_PATHS) {
  const clean = legacy.replace(/\/$/, '');
  const found = publicLandings.filter(r => r === clean);
  if (found.length > 0) {
    issues.push({
      severity: 'info',
      area: 'PUBLIC_DASHBOARD_LANDINGS',
      message: `Legacy portal path in PUBLIC_DASHBOARD_LANDINGS (bypasses auth gate for root URL): ${found.join(', ')}`,
      action: 'Remove from PUBLIC_DASHBOARD_LANDINGS once config-level redirect is confirmed live in production.',
    });
  }
}

// ── Check 4: Legacy portals still in NOINDEX_PREFIXES ────────────────────────

for (const legacy of LEGACY_PORTAL_PATHS) {
  const clean = legacy.replace(/\/$/, '');
  const found = noindexPrefixes.filter(r => r === clean || r.startsWith(clean));
  if (found.length > 0) {
    observations.push({
      area: 'NOINDEX_PREFIXES',
      message: `Legacy portal path in NOINDEX_PREFIXES: ${found.join(', ')}`,
      action: 'Keep — defense-in-depth noindex on legacy paths that receive residual traffic before redirect.',
    });
  }
}

// ── Check 5: Canonical dashboards all have PROTECTED_ROUTES entries ───────────

for (const [route] of Object.entries(CANONICAL_PORTALS)) {
  const found = protectedRouteKeys.filter(k => route.startsWith(k.replace(/\/$/, '')) || k === route);
  if (found.length === 0) {
    issues.push({
      severity: 'warn',
      area: 'PROTECTED_ROUTES',
      message: `Canonical dashboard ${route} has no entry in PROTECTED_ROUTES`,
      action: 'Add to PROTECTED_ROUTES in proxy.ts to ensure role enforcement.',
    });
  }
}

// ── Check 6: Auth-required routes include canonical learner paths ─────────────

const expectedAuthPrefixes = ['/lms/', '/learner/', '/employer/', '/partner/'];
for (const prefix of expectedAuthPrefixes) {
  const found = authRequiredRoutes.filter(r => r === prefix || r.startsWith(prefix));
  if (found.length === 0) {
    issues.push({
      severity: 'warn',
      area: 'AUTH_REQUIRED_ROUTES',
      message: `Auth prefix ${prefix} not explicitly listed in AUTH_REQUIRED_ROUTES`,
      action: 'Confirm middleware PROTECTED_ROUTES covers this path via role-gate (may be sufficient).',
    });
  }
}

// ── Check 7: LEGACY_ADMIN_PATH_REDIRECTS consistency ────────────────────────

const legacyAdminRedirectsMatch = proxyText.match(/LEGACY_ADMIN_PATH_REDIRECTS[^{]+\{([^}]+)\}/);
const legacyAdminRedirects = {};
if (legacyAdminRedirectsMatch) {
  for (const m of legacyAdminRedirectsMatch[1].matchAll(/['"`]([^'"`]+)['"`]\s*:\s*['"`]([^'"`]+)['"`]/g)) {
    legacyAdminRedirects[m[1]] = m[2];
  }
}

observations.push({
  area: 'LEGACY_ADMIN_PATH_REDIRECTS',
  message: `${Object.keys(legacyAdminRedirects).length} legacy admin path redirects found in proxy.ts`,
  entries: legacyAdminRedirects,
  action: 'These are runtime redirects inside the middleware. They should be moved to next.config.mjs static redirects for performance and clarity.',
});

// ── Build report ─────────────────────────────────────────────────────────────

const report = {
  generatedAt: new Date().toISOString(),
  summary: {
    issues: issues.length,
    observations: observations.length,
    protectedRouteCount: protectedRouteKeys.length,
    authRequiredRouteCount: authRequiredRoutes.length,
    noindexPrefixCount: noindexPrefixes.length,
    publicLandingCount: publicLandings.length,
  },
  issues,
  observations,
  extractedLists: {
    protectedRouteKeys,
    authRequiredRoutes,
    noindexPrefixes,
    publicLandings,
  },
};

const outPath = path.join(REPORT_DIR, 'middleware-consistency.json');
fs.writeFileSync(outPath, JSON.stringify(report, null, 2));
process.stdout.write(`Middleware consistency audit complete: ${issues.length} issues, ${observations.length} observations\n`);
process.stdout.write(`Report: reports/canonicalization/middleware-consistency.json\n`);

// Print issues inline
for (const issue of issues) {
  process.stdout.write(`  [${issue.severity.toUpperCase()}] ${issue.area}: ${issue.message}\n`);
}
