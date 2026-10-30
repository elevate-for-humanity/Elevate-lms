import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { stripTypeScriptTypes } from 'node:module';
import vm from 'node:vm';

const read = (path) => readFileSync(new URL('../' + path, import.meta.url), 'utf8');
function evaluate(path, bindings, names) {
  let source = stripTypeScriptTypes(read(path));
  source = source.replace(/import[\s\S]*?from\s*['"][^'"]+['"];?/g, '');
  source = source.replace(/export\s+(?=(?:async\s+)?(const|function|class)\b)/g, '');
  return vm.runInNewContext('(function(){' + source + ';return {' + names.join(',') + '};})()', bindings);
}
const matrix = evaluate('lib/rbac/role-matrix.ts', {}, [
  'ADMIN_ROLES', 'ALL_AUTHENTICATED_ROLES', 'APPRENTICE_ROLES', 'EMPLOYER_ROLES',
  'HOST_SHOP_ROLES', 'INSTRUCTOR_ROLES', 'PROGRAM_HOLDER_ROLES', 'STAFF_ROLES',
  'TESTING_CENTER_ROLES', 'WORKFORCE_ROLES',
]);
const { PORTAL_MAP } = evaluate('lib/routing/portal-map.ts', { ...matrix, process: { env: {} } }, ['PORTAL_MAP']);
const PortalRouter = {
  get: (key) => PORTAL_MAP[key].host + PORTAL_MAP[key].defaultPath,
  getPath: (key, path) => PORTAL_MAP[key].host + PORTAL_MAP[key].basePath + '/' + path,
};
const source = read('lib/navigation/navigation-config.ts');
const iconNames = source.match(/import\s*{([^}]+)}\s*from 'lucide-react'/)[1].split(',').map(x => x.trim()).filter(Boolean);
const icons = Object.fromEntries(iconNames.map(name => [name, () => null]));
const nav = evaluate('lib/navigation/navigation-config.ts', { ...icons, PortalRouter, LMS_HOST: PORTAL_MAP.lms.host }, [
  'ROLE_NAVIGATION', 'getNavigationRole', 'getNavigationForRole', 'getFlatNavItems',
  'getDashboardHref', 'isApprenticeWorkspaceRole', 'ROLE_DISPLAY_NAMES',
]);
const { DEFAULT_NAV, withPortalNavigation } = evaluate('lib/admin/nav-config.ts', {}, ['DEFAULT_NAV', 'withPortalNavigation']);
const assignments = {
  student: 'lms', apprentice: 'apprentice', employer: 'employer', host_shop: 'hostshop',
  instructor: 'instructor', staff: 'staff', testing: 'testing', admin: 'admin',
  workforce: 'workforce', parent: 'parent', case_manager: 'casemanager',
  workforce_board: 'workforceboard', program_holder: 'programholder', provider: 'provider', creator: 'creator',
};
for (const role of Object.keys(nav.ROLE_DISPLAY_NAMES)) {
  test(role + ': header destination matches the canonical portal and navigation', () => {
    const key = assignments[nav.getNavigationRole(role)];
    assert.equal(nav.getDashboardHref(role), PortalRouter.get(key));
    assert.notEqual(new URL(nav.getDashboardHref(role)).pathname, '/');
    const original = nav.ROLE_NAVIGATION[nav.getNavigationRole(role)].flatMap(section => section.items);
    const grouped = nav.getFlatNavItems(role);
    assert.deepEqual(Array.from(grouped, item => item.id).sort(), Array.from(original, item => item.id).sort());
    assert.equal(new Set(grouped.map(item => item.id)).size, grouped.length);
  });
}
test('all apprentice aliases keep apprentice identity; ordinary students do not redirect', () => {
  for (const role of ['apprentice', 'barber_apprentice', 'cosmetology_apprentice']) assert.equal(nav.isApprenticeWorkspaceRole(role), true);
  for (const role of ['student', 'learner', 'host_shop', 'program_holder', 'admin', null]) assert.equal(nav.isApprenticeWorkspaceRole(role), false);
  const dashboard = read('apps/lms/app/lms/(app)/dashboard/page.tsx');
  const redirectAt = dashboard.indexOf("if (isApprenticeWorkspaceRole(subjectProfile?.role)) redirect(PortalRouter.get('apprentice'))");
  assert.ok(redirectAt > 0);
  assert.ok(redirectAt < dashboard.indexOf('const workspace = await loadLearnerWorkspace'));
  assert.match(read('components/lms/LearnerWorkspaceLayout.tsx'), /role=\{apprenticeWorkspace \? 'apprentice' : 'student'\}/);
});
test('saved Admin navigation cannot hide portal links or duplicate their destinations', () => {
  for (const sections of [[], DEFAULT_NAV, [{ label: 'Custom', href: '/custom', items: [{ label: 'Legacy students', href: '/students' }, { label: 'Custom tool', href: '/custom' }] }]]) {
    const result = withPortalNavigation(sections);
    assert.equal(result[0].label, 'Dashboards & Portals');
    const hrefs = result.flatMap(section => section.items.map(item => item.href));
    for (const href of ['/students', '/apprenticeships', '/partners', '/program-holders', '/portals']) assert.equal(hrefs.filter(value => value === href).length, 1);
    assert.deepEqual(JSON.parse(JSON.stringify(withPortalNavigation(result))), JSON.parse(JSON.stringify(result)));
  }
  const shell = read('components/admin/AdminNavShell.tsx');
  assert.match(shell, /withPortalNavigation\(navSections\)/);
  assert.match(shell, /withPortalNavigation\(data.sections\)/);
});
test('shared shell has no independent home-role switch or root fallback', () => {
  const shell = read('components/platform/PlatformShell.tsx');
  assert.match(shell, /const dashboardHref = getDashboardHref\(role\)/);
  assert.doesNotMatch(shell, /const dashboardHref = isWorkforce/);
});

const { provisionMissingTimeclockSite } = evaluate('lib/timeclock/provision-site.ts', {}, ['provisionMissingTimeclockSite']);
function siteDb(existing, shop, error = null) {
  const writes = [];
  return { writes, from(table) {
    return {
      select() { return this; }, eq() { return this; },
      async limit() { return { data: existing, error }; },
      async maybeSingle() { return { data: shop, error }; },
      async upsert(row, options) { writes.push({ table, row, options }); return { error }; },
    };
  } };
}
const approvedShop = { id: 'shop-1', name: 'Existing shop', active: true, partner_id: 'partner-1', latitude: '39.1', longitude: '-87.4' };
test('missing timeclock site uses the assigned shop and existing database defaults', async () => {
  const db = siteDb([], approvedShop);
  await provisionMissingTimeclockSite(db, 'shop-1');
  assert.equal(db.writes.length, 1);
  const { row, options } = db.writes[0];
  assert.equal(row.id, approvedShop.id);
  assert.equal(row.shop_id, approvedShop.id);
  assert.equal(row.partner_id, approvedShop.partner_id);
  assert.equal(row.latitude, 39.1);
  assert.equal(row.longitude, -87.4);
  assert.equal(options.ignoreDuplicates, true);
  assert.equal(options.onConflict, 'id');
  assert.equal('radius_meters' in row, false);
  assert.equal('is_active' in row, false);
});
test('existing, disabled, or invalid sites are never silently re-enabled or replaced', async () => {
  const existing = siteDb([{ id: 'disabled-site' }], approvedShop);
  await provisionMissingTimeclockSite(existing, 'shop-1');
  assert.equal(existing.writes.length, 0);
  for (const shop of [null, { ...approvedShop, partner_id: null }, { ...approvedShop, latitude: null }, { ...approvedShop, latitude: 100 }, { ...approvedShop, latitude: 0, longitude: 0 }]) {
    const db = siteDb([], shop);
    await provisionMissingTimeclockSite(db, 'shop-1');
    assert.equal(db.writes.length, 0);
  }
});
test('site lookup failures fail closed; read-only previews never provision sites', async () => {
  const db = siteDb([], approvedShop, new Error('database unavailable'));
  await assert.rejects(provisionMissingTimeclockSite(db, 'shop-1'), /database unavailable/);
  assert.equal(db.writes.length, 0);
  const route = read('apps/lms/app/api/timeclock/context/route.ts');
  assert.match(route, /apprenticeSiteScopeId && !subject.previewing/);
  assert.match(route, /await provisionMissingTimeclockSite\(db, apprenticeSiteScopeId\)/);
});

test('workbook sits immediately beneath theory for every apprentice alias', () => {
  for (const role of ['apprentice', 'barber_apprentice', 'cosmetology_apprentice']) {
    const items = nav.getNavigationForRole(role).flatMap(section => section.items);
    const index = items.findIndex(item => item.id === 'theory');
    assert.ok(index >= 0);
    assert.equal(items[index + 1]?.id, 'workbook');
  }
});
