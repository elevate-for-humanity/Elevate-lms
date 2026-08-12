#!/usr/bin/env tsx
import fs from 'node:fs';
import path from 'node:path';
import { ROLE_ROUTE_CONFIG } from '../lib/auth/role-destinations';
import { PORTAL_PATHS } from '../lib/portal/router';
import {
  ADMIN_ROLES,
  INSTRUCTOR_ROLES,
  STAFF_ROLES,
  TESTING_CENTER_ROLES,
} from '../lib/rbac/role-matrix';

const ROOT = process.cwd();
const APP_ROOTS = {
  admin: 'apps/admin/app',
  lms: 'apps/lms/app',
  marketing: 'apps/marketing/app',
} as const;

type Host = keyof typeof APP_ROOTS;
type Finding = { severity: 'blocker' | 'warning'; code: string; file?: string; detail: string };

function walk(relativeDir: string, out: string[] = []): string[] {
  const absoluteDir = path.join(ROOT, relativeDir);
  if (!fs.existsSync(absoluteDir)) return out;
  for (const entry of fs.readdirSync(absoluteDir, { withFileTypes: true })) {
    if (entry.name.startsWith('.') || ['node_modules', '.next'].includes(entry.name)) continue;
    const rel = path.posix.join(relativeDir.replaceAll('\\', '/'), entry.name);
    if (entry.isDirectory()) walk(rel, out);
    else out.push(rel);
  }
  return out;
}

function routeFromPage(appRoot: string, file: string): string | null {
  if (!/\/page\.(?:tsx?|jsx?)$/.test(file)) return null;
  const relative = path.posix.relative(appRoot, path.posix.dirname(file));
  const segments = relative === '.' ? [] : relative.split('/');
  const visible = segments.filter(
    (segment) =>
      segment &&
      !/^\(.*\)$/.test(segment) &&
      !segment.startsWith('@') &&
      !segment.startsWith('(..'),
  );
  return visible.length ? `/${visible.join('/')}` : '/';
}

function read(file: string): string {
  return fs.readFileSync(path.join(ROOT, file), 'utf8');
}

function adminRolesForPath(route: string): readonly string[] {
  if (route.startsWith('/staff-portal')) return STAFF_ROLES;
  if (route.startsWith('/instructor')) return INSTRUCTOR_ROLES;
  if (route === '/testing-center' || route.startsWith('/testing-center/')) {
    return TESTING_CENTER_ROLES;
  }
  return ADMIN_ROLES;
}

const filesByHost = Object.fromEntries(
  Object.entries(APP_ROOTS).map(([host, appRoot]) => [host, walk(appRoot)]),
) as Record<Host, string[]>;

const routesByHost = Object.fromEntries(
  Object.entries(APP_ROOTS).map(([host, appRoot]) => [
    host,
    new Set(filesByHost[host as Host].map((file) => routeFromPage(appRoot, file)).filter(Boolean)),
  ]),
) as Record<Host, Set<string>>;

const findings: Finding[] = [];

// Every canonical role destination must resolve to a page in the deployment
// that owns that role. This catches role records that authenticate correctly
// but are then sent to a 404 or the wrong application.
for (const [role, config] of Object.entries(ROLE_ROUTE_CONFIG)) {
  const host = config.host as Host;
  if (!routesByHost[host]?.has(config.path)) {
    findings.push({
      severity: 'blocker',
      code: 'ROLE_DESTINATION_MISSING',
      detail: `${role} -> ${host}:${config.path} has no active page.tsx route`,
    });
  }

  if (host === 'admin' && !adminRolesForPath(config.path).includes(role as never)) {
    findings.push({
      severity: 'warning',
      code: 'ROLE_DESTINATION_AUTH_MISMATCH',
      detail: `${role} routes to Admin ${config.path} but is not included in that middleware role set`,
    });
  }
}

// Field/category portal metadata must not invent routes that do not exist.
for (const [portal, route] of Object.entries(PORTAL_PATHS)) {
  if (!routesByHost.lms.has(route)) {
    findings.push({
      severity: 'blocker',
      code: 'LEARNER_PORTAL_MISSING',
      detail: `${portal} -> lms:${route} has no active page.tsx route`,
    });
  }
}

const activeFiles = Object.values(filesByHost).flat();
const loginFiles = activeFiles.filter((file) => {
  if (!/\.(?:tsx?|jsx?)$/.test(file)) return false;
  const source = read(file);
  return /(?:\/login\/|\/login\/page\.|LoginForm)/.test(file) || source.includes('signInWithPassword');
});

for (const file of filesByHost.lms) {
  if (!/\.(?:tsx?|jsx?)$/.test(file)) continue;
  const source = read(file);
  if (/\/login\?redirect=\/dashboard(?:["'`&]|$)/.test(source)) {
    findings.push({
      severity: 'blocker',
      code: 'AMBIGUOUS_LMS_DASHBOARD_REDIRECT',
      file,
      detail: 'LMS login return path uses /dashboard, which belongs to the Admin deployment',
    });
  }
  if (/absoluteRoleDestination\(safeRedirect\)/.test(source)) {
    findings.push({
      severity: 'blocker',
      code: 'REDIRECT_BEFORE_ROLE_CHECK',
      file,
      detail: 'Login redirect can be converted to a deployment URL without role compatibility enforcement',
    });
  }
  if (/\/portal\/\$\{\s*profile\.portal_type/.test(source)) {
    findings.push({
      severity: 'blocker',
      code: 'DYNAMIC_PORTAL_TYPE_ROUTE',
      file,
      detail: 'profile.portal_type is being used to invent an LMS /portal/* route',
    });
  }
}

const lmsMainLogin = 'apps/lms/app/login/page.tsx';
if (fs.existsSync(path.join(ROOT, lmsMainLogin))) {
  const source = read(lmsMainLogin);
  if (source.includes('signInWithPassword')) {
    findings.push({
      severity: 'blocker',
      code: 'LMS_MAIN_LOGIN_BROWSER_ONLY_AUTH',
      file: lmsMainLogin,
      detail: 'Main LMS login bypasses the server sign-in route and shared-domain session cookie policy',
    });
  }
  if (!source.includes("fetch('/api/auth/signin'")) {
    findings.push({
      severity: 'blocker',
      code: 'LMS_MAIN_LOGIN_SERVER_AUTH_MISSING',
      file: lmsMainLogin,
      detail: 'Main LMS login is not using the rate-limited server sign-in endpoint',
    });
  }
}

const lmsSignInRoute = 'apps/lms/app/api/auth/signin/route.ts';
if (fs.existsSync(path.join(ROOT, lmsSignInRoute))) {
  const source = read(lmsSignInRoute);
  if (!source.includes("applyRateLimit(request, 'auth')")) {
    findings.push({
      severity: 'blocker',
      code: 'LMS_SIGNIN_NOT_RATE_LIMITED',
      file: lmsSignInRoute,
      detail: 'Public LMS credential endpoint is missing the auth rate limiter',
    });
  }
  if (/accessToken\s*:|access_token/.test(source.split('return NextResponse.json')[1] ?? '')) {
    findings.push({
      severity: 'blocker',
      code: 'LMS_SIGNIN_TOKEN_IN_JSON',
      file: lmsSignInRoute,
      detail: 'LMS sign-in response exposes session/access token material in JSON',
    });
  }
}

const sharedServerClient = 'lib/supabase/server.ts';
if (fs.existsSync(path.join(ROOT, sharedServerClient))) {
  const source = read(sharedServerClient);
  if (!source.includes("domain: '.elevateforhumanity.org'")) {
    findings.push({
      severity: 'blocker',
      code: 'SHARED_AUTH_COOKIE_DOMAIN_MISSING',
      file: sharedServerClient,
      detail: 'Server Supabase auth cookies are not scoped to the Elevate root domain for cross-portal sessions',
    });
  }
}

const adminLoginForm = 'apps/admin/app/login/LoginForm.tsx';
if (fs.existsSync(path.join(ROOT, adminLoginForm))) {
  const source = read(adminLoginForm);
  if (
    source.includes("fetch('/api/auth/admin-login'") &&
    !source.includes("headers.get('content-type')")
  ) {
    findings.push({
      severity: 'blocker',
      code: 'ADMIN_LOGIN_BLIND_JSON_PARSE',
      file: adminLoginForm,
      detail: 'Admin login must validate response content-type before parsing JSON',
    });
  }
  if (source.includes('supabase.auth.getUser()') && source.includes('window.location.href = next')) {
    findings.push({
      severity: 'blocker',
      code: 'ADMIN_LOGIN_SHARED_SESSION_AUTO_REDIRECT',
      file: adminLoginForm,
      detail: 'Admin login auto-redirects any shared-domain session without proving an Admin role',
    });
  }
}

const adminLoginRoute = 'apps/admin/app/api/auth/admin-login/route.ts';
if (fs.existsSync(path.join(ROOT, adminLoginRoute))) {
  const source = read(adminLoginRoute);
  if (source.includes('requireAdminClient()') && !source.includes('return jsonError(error)')) {
    findings.push({
      severity: 'blocker',
      code: 'ADMIN_LOGIN_UNCAUGHT_SERVER_ERROR',
      file: adminLoginRoute,
      detail: 'Admin login can throw before returning a JSON response',
    });
  }
  if (!source.includes("applyRateLimit(req, 'auth')")) {
    findings.push({
      severity: 'blocker',
      code: 'ADMIN_LOGIN_NOT_RATE_LIMITED',
      file: adminLoginRoute,
      detail: 'Public Admin credential endpoint is missing the auth rate limiter',
    });
  }
} else {
  findings.push({
    severity: 'blocker',
    code: 'ADMIN_LOGIN_API_MISSING',
    file: adminLoginRoute,
    detail: 'Admin login API route is missing from the active Admin app',
  });
}

// Credential endpoints must be reachable before a session exists. Protecting
// the Admin POST with auth middleware redirects it to /login and returns HTML,
// which produced the production "<!DOCTYPE ... is not valid JSON" failure.
const adminMiddleware = 'apps/admin/middleware.ts';
if (fs.existsSync(path.join(ROOT, adminMiddleware))) {
  const source = read(adminMiddleware);
  if (!source.includes("'/api/auth/admin-login'")) {
    findings.push({
      severity: 'blocker',
      code: 'ADMIN_LOGIN_API_NOT_PUBLIC',
      file: adminMiddleware,
      detail: '/api/auth/admin-login is not in the Admin middleware public-path allowlist',
    });
  }
} else {
  findings.push({
    severity: 'blocker',
    code: 'ADMIN_MIDDLEWARE_MISSING',
    file: adminMiddleware,
    detail: 'Active Admin middleware is missing',
  });
}

// Non-route login-like files are a maintenance risk. They are warnings rather
// than blockers because role-specific login pages can legitimately coexist.
for (const file of loginFiles) {
  if (/page-new\.(?:tsx?|jsx?)$/.test(file) || /LoginForm\.old\./.test(file)) {
    findings.push({
      severity: 'warning',
      code: 'STALE_LOGIN_IMPLEMENTATION',
      file,
      detail: 'Login implementation is not a canonical Next.js route and should be removed or archived',
    });
  }
}

const blockers = findings.filter((finding) => finding.severity === 'blocker');
const warnings = findings.filter((finding) => finding.severity === 'warning');
const report = {
  generatedAt: new Date().toISOString(),
  routeCounts: Object.fromEntries(
    Object.entries(routesByHost).map(([host, routes]) => [host, routes.size]),
  ),
  canonicalRoleMappings: Object.keys(ROLE_ROUTE_CONFIG).length,
  activeLoginFiles: loginFiles.sort(),
  blockers,
  warnings,
};

const outDir = path.join(ROOT, 'docs', 'audits');
fs.mkdirSync(outDir, { recursive: true });
fs.writeFileSync(
  path.join(outDir, 'AUTH_ROLE_ROUTING_AUDIT.json'),
  JSON.stringify(report, null, 2),
);

const lines = [
  '# Authentication + Role Routing Audit',
  '',
  `Generated: ${report.generatedAt}`,
  '',
  `- Admin routes: ${report.routeCounts.admin}`,
  `- LMS routes: ${report.routeCounts.lms}`,
  `- Marketing routes: ${report.routeCounts.marketing}`,
  `- Canonical role mappings checked: ${report.canonicalRoleMappings}`,
  `- Active login/auth implementations inventoried: ${report.activeLoginFiles.length}`,
  `- Blocking findings: ${blockers.length}`,
  `- Warnings: ${warnings.length}`,
  '',
  '## Blocking findings',
  '',
  ...(blockers.length
    ? blockers.map((finding) => `- **${finding.code}** ${finding.file ? `\`${finding.file}\` — ` : ''}${finding.detail}`)
    : ['None']),
  '',
  '## Warnings',
  '',
  ...(warnings.length
    ? warnings.map((finding) => `- **${finding.code}** ${finding.file ? `\`${finding.file}\` — ` : ''}${finding.detail}`)
    : ['None']),
  '',
  '## Active login/auth inventory',
  '',
  ...report.activeLoginFiles.map((file) => `- \`${file}\``),
  '',
];
fs.writeFileSync(path.join(outDir, 'AUTH_ROLE_ROUTING_AUDIT.md'), lines.join('\n'));

console.log(`Auth/role audit: ${blockers.length} blocker(s), ${warnings.length} warning(s)`);
for (const finding of findings) {
  console.log(`${finding.severity.toUpperCase()} ${finding.code}: ${finding.detail}${finding.file ? ` (${finding.file})` : ''}`);
}

if (blockers.length) process.exitCode = 1;
