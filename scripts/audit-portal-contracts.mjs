#!/usr/bin/env node
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const ROOT = join(fileURLToPath(new URL('.', import.meta.url)), '..');
const read = (rel) => readFileSync(join(ROOT, rel), 'utf8');
const exists = (rel) => existsSync(join(ROOT, rel));
let failures = 0;
const pass = (msg) => console.log(`✅ ${msg}`);
const fail = (msg) => { console.error(`❌ ${msg}`); failures += 1; };

const APP_DIR = { marketing: 'apps/marketing/app', lms: 'apps/lms/app', admin: 'apps/admin/app' };
const contracts = JSON.parse(read('lib/routes/platform-surface-contracts.json')).surfaces;
const portalMap = read('lib/routing/portal-map.ts');
const portalRouter = read('lib/routing/portal-router.ts');
const roleDestinations = read('lib/auth/role-destinations.ts');
const roleMatrix = read('lib/rbac/role-matrix.ts');
const portalAccess = read('lib/auth/portal-access.ts');
const publicAccessRegistry = read('apps/marketing/lib/platform-access-registry.ts');
const publicNavigation = read('lib/navigation.ts');
const portalsPage = read('apps/marketing/app/portals/page.tsx');
const adminDashboard = read('apps/admin/app/dashboard/page.tsx');
const marketingMiddleware = read('apps/marketing/middleware.ts');
const marketingChrome = read('components/site/MarketingChromeBoundary.tsx');

const PORTALS = [
  { key: 'lms', surface: 'studentPortal', app: 'lms', path: '/lms/dashboard', roles: ['student', 'learner', 'user', 'delegate', 'grant_client'] },
  { key: 'apprentice', surface: 'apprenticePortal', app: 'lms', path: '/apprentice', roles: ['apprentice', 'barber_apprentice', 'cosmetology_apprentice'] },
  { key: 'employer', surface: 'employerPublic', app: 'lms', path: '/employer/dashboard', roles: ['employer', 'sponsor', 'recruiter'] },
  { key: 'hostshop', surface: 'hostSites', app: 'lms', path: '/host-shop/dashboard', roles: ['partner', 'host_shop', 'host_shop_admin'] },
  { key: 'parent', surface: 'parentPortal', app: 'lms', path: '/parent-portal/dashboard', roles: ['parent'] },
  { key: 'workforce', surface: 'workforcePortal', app: 'lms', path: '/workforce/dashboard', roles: ['workforce_partner'] },
  { key: 'programholder', surface: 'programHolderPortal', app: 'lms', path: '/program-holder/dashboard', roles: ['program_holder'] },
  { key: 'creator', surface: 'creatorPortal', app: 'lms', path: '/creator/products', roles: ['creator'] },
  { key: 'admin', surface: 'adminPortal', app: 'admin', path: '/dashboard', roles: ['super_admin', 'admin', 'org_admin', 'advisor'] },
  { key: 'instructor', surface: 'instructorPortal', app: 'admin', path: '/instructor/dashboard', roles: ['instructor'] },
  { key: 'staff', surface: 'staffPortal', app: 'admin', path: '/staff-portal/dashboard', roles: ['staff'] },
  { key: 'testing', surface: 'testingOperations', app: 'admin', path: '/testing-center', roles: ['test_admin', 'proctor'] },
  { key: 'casemanager', surface: 'caseManagerPortal', app: 'marketing', path: '/case-manager/dashboard', roles: ['case_manager'] },
  { key: 'workforceboard', surface: 'workforceBoardPortal', app: 'marketing', path: '/workforce-board/dashboard', roles: ['workforce_board', 'workforce_board_admin'] },
  { key: 'provider', surface: 'providerPortal', app: 'marketing', path: '/provider/dashboard', roles: ['provider', 'provider_admin'] },
];

function routeFileCandidates(app, route) {
  const clean = route.replace(/^\//, '');
  const base = APP_DIR[app];
  const suffix = `${clean}${clean ? '/' : ''}page.tsx`;
  const candidates = [`${base}/${suffix}`];
  if (app === 'lms' && clean.startsWith('lms/')) {
    const tail = clean.slice('lms/'.length);
    candidates.push(`${base}/lms/(app)/${tail}${tail ? '/' : ''}page.tsx`);
  }
  return candidates;
}
const routeExists = (app, route) => routeFileCandidates(app, route).some(exists);
function blockFor(source, key) {
  return source.match(new RegExp(`${key}:\\s*\\{([\\s\\S]*?)\\n\\s*\\},`, 'm'))?.[1] || '';
}

console.log('\n── Single portal authority ──');
if (!portalRouter.includes('label: portal.label') || !portalRouter.includes('description: portal.description')) fail('portal-router does not derive display metadata from PORTAL_MAP');
else pass('portal-router derives display metadata from PORTAL_MAP');
if (/export const PORTAL_META:\s*Record<PortalKey, PortalMeta>\s*=\s*\{/.test(portalRouter)) fail('portal-router reintroduced a hand-maintained PORTAL_META registry');
if (!roleDestinations.includes('ROLE_PORTAL_ASSIGNMENTS') || !roleDestinations.includes('PORTAL_MAP[assignment.portalKey]')) fail('role destinations do not derive route facts from PORTAL_MAP');
if (!portalAccess.includes('PORTAL_MAP[portalKey].accessRoles')) fail('portal-access maintains or bypasses a second access-role registry');
else pass('portal access roles derive from PORTAL_MAP');
if (/PORTAL_ACCESS_ROLES\s*[:=]/.test(portalAccess)) fail('independent PORTAL_ACCESS_ROLES registry still exists');

console.log('\n── Canonical portal ownership and role assignment ──');
for (const portal of PORTALS) {
  const surface = contracts[portal.surface];
  let canonical = surface?.canonical;
  if (portal.surface === 'hostSites') canonical = surface?.portal;
  if (portal.surface === 'employerPublic') canonical = (surface?.operational || []).find((x) => x.path === portal.path);
  if (!canonical) fail(`${portal.surface}: canonical contract missing`);
  else if (canonical.app !== portal.app || canonical.path !== portal.path) fail(`${portal.surface}: contract says ${canonical.app}:${canonical.path}, expected ${portal.app}:${portal.path}`);
  if (!routeExists(portal.app, portal.path)) fail(`${portal.key}: missing route for ${portal.app}:${portal.path}`);

  const portalBlock = blockFor(portalMap, portal.key);
  if (!portalBlock.includes(`defaultPath: '${portal.path}'`)) fail(`${portal.key}: PORTAL_MAP default path drift`);
  for (const metadata of ['label:', 'description:', 'destinationRoles:', 'accessRoles:', 'authSurface:', 'tenantScope:']) {
    if (!portalBlock.includes(metadata)) fail(`${portal.key}: missing canonical ${metadata.replace(':', '')} metadata`);
  }
  for (const role of portal.roles) {
    const assignment = new RegExp(`${role}:\\s*\\{[^}]*portalKey:\\s*['\"]${portal.key}['\"]`);
    if (!assignment.test(roleDestinations)) fail(`${role}: role assignment does not resolve to ${portal.key}`);
    if (!portalBlock.includes(`'${role}'`)) fail(`${portal.key}: canonical destinationRoles omits ${role}`);
  }
}

console.log('\n── Role destination reachability ──');
for (const role of ['admin', 'org_admin', 'advisor', 'staff']) {
  if (!adminDashboard.includes(`'${role}'`)) fail(`${role}: canonical Admin dashboard guard does not visibly include role`);
}

console.log('\n── Marketing operational boundary ──');
for (const prefix of ['/case-manager', '/workforce-board', '/provider']) {
  if (!marketingMiddleware.includes(`'${prefix}'`)) fail(`${prefix}: full operational family missing from Marketing middleware protection`);
  if (!marketingChrome.includes(`'${prefix}'`)) fail(`${prefix}: public Header/Footer suppression missing`);
}
if (!marketingMiddleware.includes("new URL('/login', LMS_HOST)")) fail('Marketing operational auth does not use canonical LMS authentication host');
if (!marketingMiddleware.includes("req.nextUrl.origin")) fail('Marketing operational login does not preserve absolute owning-host return URL');

console.log('\n── Public discovery contract ──');
if (!exists('apps/marketing/app/online-apps/page.tsx')) fail('/online-apps: public portal directory missing');
if (!publicNavigation.includes("id: 'platform'") || !publicNavigation.includes("href: '/online-apps'")) fail('Platform/Online Apps are not exposed from canonical public navigation');
if (!portalsPage.includes('PORTAL_KEYS.map') || !portalsPage.includes('PORTAL_MAP[key]')) fail('/portals does not derive its directory from canonical portal registries');
if (/const\s+PORTAL_KEYS\s*:\s*PortalKey\[\]\s*=\s*\[/.test(portalsPage)) fail('/portals reintroduced a hand-maintained portal key list');
if (!publicAccessRegistry.includes("import { PORTAL_MAP") || !publicAccessRegistry.includes('Object.keys(PORTAL_MAP)') || !publicAccessRegistry.includes('portal.host') || !publicAccessRegistry.includes('portal.defaultPath')) fail('/online-apps registry does not derive portal URLs from PORTAL_MAP');
if (!publicAccessRegistry.includes('CANONICAL_PORTAL_ACCESS')) fail('public access registry lacks full canonical portal projection');
if (!publicNavigation.includes('ROUTES.creatorPortal')) fail('Creator Studio missing from global portal navigation');
if (!publicNavigation.includes('ROUTES.testingPortal')) fail('Testing Center operations missing from global portal navigation');

console.log('\n── Admin override invariant ──');
if (!roleMatrix.includes("role === 'admin' || role === 'super_admin'")) fail('RBAC admin override invariant missing');
if (!portalAccess.includes("auth.effectiveRoles.includes('admin')")) fail('portal-access does not recognize regular admin as platform admin');

console.log('\n── PWA persona contracts ──');
const PWA = [
  ['lms', 'student', 'public/manifest-student.json', '/lms/dashboard', '/lms', 'apps/lms/app/lms/layout.tsx'],
  ['apprentice', 'apprentice', 'public/manifest-apprentice.json', '/apprentice', '/apprentice', 'apps/lms/app/apprentice/layout.tsx'],
  ['hostshop', 'host shop', 'public/manifest-shop-owner.json', '/host-shop/dashboard', '/host-shop/', 'apps/lms/app/host-shop/layout.tsx'],
  ['programholder', 'program holder', 'public/manifest-program-holder.json', '/program-holder/dashboard', '/program-holder/', 'apps/lms/app/program-holder/layout.tsx'],
];
for (const [key, name, manifestPath, startUrl, scope, layoutPath] of PWA) {
  if (!exists(manifestPath)) { fail(`${name}: missing ${manifestPath}`); continue; }
  const manifest = JSON.parse(read(manifestPath));
  if (manifest.start_url !== startUrl) fail(`${name}: start_url ${manifest.start_url} != ${startUrl}`);
  if (manifest.scope !== scope) fail(`${name}: scope ${manifest.scope} != ${scope}`);
  const canonicalBlock = blockFor(portalMap, key);
  if (!canonicalBlock.includes(`pwaManifest: '/${manifestPath.replace('public/', '')}'`)) fail(`${name}: PWA manifest not governed by PORTAL_MAP`);
  if (!canonicalBlock.includes(`pwaScope: '${scope}'`)) fail(`${name}: PWA scope not governed by PORTAL_MAP`);
  if (!exists(layoutPath)) fail(`${name}: missing portal layout ${layoutPath}`);
  else if (!read(layoutPath).includes(`/${manifestPath.replace('public/', '')}`)) fail(`${name}: layout does not link manifest`);
}

console.log('\n── Retired portal ownership ──');
for (const retired of ['/portal/barber', '/portal/cosmetology', '/portal/esthetician', '/portal/nail-technician']) {
  if (portalMap.includes(retired)) fail(`PORTAL_MAP still advertises retired route ${retired}`);
}
if (/subdomain:\s*['\"]marketing['\"]/.test(blockFor(portalMap, 'programholder'))) fail('Program Holder still owned by Marketing');

if (!failures) {
  console.log('\n── Portal function integrity ──');
  const child = spawnSync(process.execPath, [join(ROOT, 'scripts/audit-portal-functions.mjs')], { cwd: ROOT, stdio: 'inherit' });
  if (child.status !== 0) failures += 1;
}
if (failures) {
  console.error(`\n❌ Portal contract audit FAILED — ${failures} issue(s).`);
  process.exit(1);
}
console.log('\n✅ Portal contract audit PASSED.');
