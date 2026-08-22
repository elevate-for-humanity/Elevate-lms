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
const roleDestinations = read('lib/auth/role-destinations.ts');
const roleMatrix = read('lib/rbac/role-matrix.ts');
const portalAccess = read('lib/auth/portal-access.ts');
const publicAccessRegistry = read('apps/marketing/lib/platform-access-registry.ts');
const publicNavigation = read('lib/navigation.ts');
const portalsPage = read('apps/marketing/app/portals/page.tsx');
const adminDashboard = read('apps/admin/app/dashboard/page.tsx');

const PORTALS = [
  { key: 'lms', surface: 'studentPortal', app: 'lms', path: '/lms/dashboard', roles: ['student', 'learner'], publicHref: 'https://app.elevateforhumanity.org/lms/dashboard' },
  { key: 'apprentice', surface: 'apprenticePortal', app: 'lms', path: '/apprentice', roles: ['apprentice'], publicHref: 'https://app.elevateforhumanity.org/apprentice' },
  { key: 'employer', surface: 'employerPublic', app: 'lms', path: '/employer/dashboard', roles: ['employer', 'sponsor'], publicHref: 'https://app.elevateforhumanity.org/employer/dashboard' },
  { key: 'hostshop', surface: 'hostSites', app: 'lms', path: '/host-shop/dashboard', roles: ['host_shop', 'host_shop_admin'], publicHref: 'https://app.elevateforhumanity.org/host-shop/dashboard' },
  { key: 'parent', surface: 'parentPortal', app: 'lms', path: '/parent-portal/dashboard', roles: ['parent'], publicHref: 'https://app.elevateforhumanity.org/parent-portal/dashboard' },
  { key: 'workforce', surface: 'workforcePortal', app: 'lms', path: '/workforce/dashboard', roles: ['workforce_partner'], publicHref: 'https://app.elevateforhumanity.org/workforce/dashboard' },
  { key: 'programholder', surface: 'programHolderPortal', app: 'lms', path: '/program-holder/dashboard', roles: ['program_holder'], publicHref: 'https://app.elevateforhumanity.org/program-holder/dashboard' },
  { key: 'creator', surface: 'creatorPortal', app: 'lms', path: '/creator/products', roles: ['creator'], publicHref: 'https://app.elevateforhumanity.org/creator/products' },
  { key: 'admin', surface: 'adminPortal', app: 'admin', path: '/dashboard', roles: ['admin', 'org_admin', 'advisor'], publicHref: 'https://admin.elevateforhumanity.org/dashboard' },
  { key: 'instructor', surface: 'instructorPortal', app: 'admin', path: '/instructor/dashboard', roles: ['instructor'], publicHref: 'https://admin.elevateforhumanity.org/instructor/dashboard' },
  { key: 'staff', surface: 'staffPortal', app: 'admin', path: '/staff-portal/dashboard', roles: ['staff'], publicHref: 'https://admin.elevateforhumanity.org/staff-portal/dashboard' },
  { key: 'testing', surface: 'testingOperations', app: 'admin', path: '/testing-center', roles: ['test_admin', 'proctor'], publicHref: 'https://admin.elevateforhumanity.org/testing-center' },
  { key: 'casemanager', surface: 'caseManagerPortal', app: 'marketing', path: '/case-manager/dashboard', roles: ['case_manager'], publicHref: 'https://www.elevateforhumanity.org/case-manager/dashboard' },
  { key: 'workforceboard', surface: 'workforceBoardPortal', app: 'marketing', path: '/workforce-board/dashboard', roles: ['workforce_board', 'workforce_board_admin'], publicHref: 'https://www.elevateforhumanity.org/workforce-board/dashboard' },
  { key: 'provider', surface: 'providerPortal', app: 'marketing', path: '/provider/dashboard', roles: ['provider', 'provider_admin'], publicHref: 'https://www.elevateforhumanity.org/provider/dashboard' },
];

function routeFileCandidates(app, route) {
  const clean = route.replace(/^\//, '');
  const base = APP_DIR[app];
  const suffix = `${clean}${clean ? '/' : ''}page.tsx`;
  const candidates = [`${base}/${suffix}`];
  if (app === 'lms' && clean.startsWith('lms/')) {
    candidates.push(`${base}/lms/(app)/${clean.slice('lms/'.length)}${clean.slice('lms/'.length) ? '/' : ''}page.tsx`);
  }
  return candidates;
}

function routeExists(app, route) {
  return routeFileCandidates(app, route).some(exists);
}

console.log('\n── Canonical portal ownership ──');
for (const portal of PORTALS) {
  const surface = contracts[portal.surface];
  let canonical = surface?.canonical;
  if (portal.surface === 'hostSites') canonical = surface?.portal;
  if (portal.surface === 'employerPublic') canonical = (surface?.operational || []).find((x) => x.path === portal.path);

  if (!canonical) fail(`${portal.surface}: canonical contract missing`);
  else if (canonical.app !== portal.app || canonical.path !== portal.path) fail(`${portal.surface}: contract says ${canonical.app}:${canonical.path}, expected ${portal.app}:${portal.path}`);
  else pass(`${portal.surface}: ${portal.app}:${portal.path}`);

  if (!routeExists(portal.app, portal.path)) fail(`${portal.key}: missing route for ${portal.app}:${portal.path}`); else pass(`${portal.key}: route exists`);

  const escapedPath = portal.path.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const keyBlock = new RegExp(`${portal.key}:\\s*\\{[\\s\\S]*?defaultPath:\\s*['\"]${escapedPath}['\"]`, 'm');
  if (!keyBlock.test(portalMap)) fail(`${portal.key}: portal-map ownership/default path drift`); else pass(`${portal.key}: portal-map aligned`);

  for (const role of portal.roles) {
    const rolePattern = new RegExp(`${role}:\\s*\\{[^}]*path:\\s*['\"]${escapedPath}['\"][^}]*portalKey:\\s*['\"]${portal.key}['\"]`);
    if (!rolePattern.test(roleDestinations)) fail(`${role}: role destination does not resolve to ${portal.key}:${portal.path}`); else pass(`${role}: role destination aligned`);
  }
}

console.log('\n── Role destination reachability ──');
for (const role of ['admin', 'org_admin', 'advisor', 'staff']) {
  if (!adminDashboard.includes(`'${role}'`)) fail(`${role}: canonical Admin dashboard guard does not visibly include role`);
  else pass(`${role}: Admin dashboard guard aligned`);
}

console.log('\n── Public discovery contract ──');
if (!exists('apps/marketing/app/online-apps/page.tsx')) fail('/online-apps: public portal directory missing');
else pass('/online-apps: public portal directory exists');
if (!publicNavigation.includes("id: 'platform'") || !publicNavigation.includes("href: '/online-apps'")) fail('Platform/Online Apps are not exposed from canonical public navigation');
else pass('Platform/Online Apps exposed from canonical public navigation');
for (const portal of PORTALS) {
  if (!portalsPage.includes(`'${portal.key}'`)) fail(`${portal.key}: missing from /portals directory`); else pass(`${portal.key}: /portals directory aligned`);
  if (!publicAccessRegistry.includes(portal.publicHref)) fail(`${portal.key}: canonical portal missing from public access registry`);
  else pass(`${portal.key}: public access registry aligned`);
}
if (!publicNavigation.includes('ROUTES.creatorPortal')) fail('Creator Studio missing from global portal navigation'); else pass('Creator Studio exposed from global portal navigation');
if (!publicNavigation.includes('ROUTES.testingPortal')) fail('Testing Center operations missing from global portal navigation'); else pass('Testing Center operations exposed from global portal navigation');

console.log('\n── Admin override invariant ──');
if (!roleMatrix.includes("role === 'admin' || role === 'super_admin'")) fail('RBAC admin override invariant missing'); else pass('regular admin remains global portal override');
if (!portalAccess.includes("auth.effectiveRoles.includes('admin')")) fail('portal-access does not recognize regular admin as platform admin'); else pass('portal-access recognizes regular admin');

console.log('\n── PWA persona contracts ──');
const PWA = [
  ['student', 'public/manifest-student.json', '/lms/dashboard', '/lms', 'apps/lms/app/lms/layout.tsx'],
  ['apprentice', 'public/manifest-apprentice.json', '/apprentice', '/apprentice', 'apps/lms/app/apprentice/layout.tsx'],
  ['host shop', 'public/manifest-shop-owner.json', '/host-shop/dashboard', '/host-shop/', 'apps/lms/app/host-shop/layout.tsx'],
  ['program holder', 'public/manifest-program-holder.json', '/program-holder/dashboard', '/program-holder/', 'apps/lms/app/program-holder/layout.tsx'],
];
for (const [name, manifestPath, startUrl, scope, layoutPath] of PWA) {
  if (!exists(manifestPath)) { fail(`${name}: missing ${manifestPath}`); continue; }
  const manifest = JSON.parse(read(manifestPath));
  if (manifest.start_url !== startUrl) fail(`${name}: start_url ${manifest.start_url} != ${startUrl}`); else pass(`${name}: start_url aligned`);
  if (manifest.scope !== scope) fail(`${name}: scope ${manifest.scope} != ${scope}`); else pass(`${name}: scope aligned`);
  if (!exists(layoutPath)) fail(`${name}: missing portal layout ${layoutPath}`);
  else {
    const layout = read(layoutPath);
    const href = `/${manifestPath.replace('public/', '')}`;
    if (!layout.includes(href)) fail(`${name}: layout does not link ${href}`); else pass(`${name}: manifest linked by layout`);
  }
}

console.log('\n── Retired portal ownership ──');
for (const retired of ['/portal/barber', '/portal/cosmetology', '/portal/esthetician', '/portal/nail-technician']) {
  if (portalMap.includes(retired)) fail(`portal-map still advertises retired route ${retired}`); else pass(`${retired}: not canonical`);
}
const programHolderBlock = portalMap.match(/programholder:\s*\{([\s\S]*?)\n\s*\},/)?.[1] || '';
if (/subdomain:\s*['\"]marketing['\"]/.test(programHolderBlock)) fail('Program Holder still owned by Marketing'); else pass('Program Holder is not owned by Marketing');

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
