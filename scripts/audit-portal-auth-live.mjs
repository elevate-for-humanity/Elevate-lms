#!/usr/bin/env node
/**
 * Live canonical portal auth audit.
 *
 * Verifies the split-app production architecture instead of probing retired
 * monolith paths. Protected portals must reject anonymous access by redirecting
 * to an authentication surface. Public entry pages must return 200.
 */

const HOSTS = {
  marketing: (process.env.MARKETING_URL || 'https://www.elevateforhumanity.org').replace(/\/$/, ''),
  lms: (process.env.LMS_URL || 'https://app.elevateforhumanity.org').replace(/\/$/, ''),
  admin: (process.env.ADMIN_URL || 'https://admin.elevateforhumanity.org').replace(/\/$/, ''),
};

const PROTECTED = [
  // Marketing-hosted operational workspaces and program-specific apprenticeships.
  ['marketing', '/portal/barber'],
  ['marketing', '/portal/cosmetology'],
  ['marketing', '/portal/esthetician'],
  ['marketing', '/portal/nail-technician'],
  ['marketing', '/program-holder/dashboard'],
  ['marketing', '/provider/dashboard'],
  ['marketing', '/case-manager/dashboard'],
  ['marketing', '/workforce-board/dashboard'],

  // LMS portals.
  ['lms', '/lms/dashboard'],
  ['lms', '/lms/courses'],
  ['lms', '/apprentice'],
  ['lms', '/apprentice/timeclock'],
  ['lms', '/employer/dashboard'],
  ['lms', '/parent-portal/dashboard'],
  ['lms', '/workforce/dashboard'],
  ['lms', '/host-shop/dashboard'],

  // Admin portals.
  ['admin', '/dashboard'],
  ['admin', '/instructor/dashboard'],
  ['admin', '/staff-portal/dashboard'],
  ['admin', '/testing-center'],
  ['admin', '/studio'],
];

const PUBLIC = [
  ['marketing', '/'],
  ['marketing', '/portals'],
  ['marketing', '/apply/student'],
  ['lms', '/login'],
  ['lms', '/host-shop/login'],
  ['admin', '/login'],
];

const REDIRECT_STATUSES = new Set([301, 302, 303, 307, 308]);
let failed = 0;

function absoluteUrl(hostKey, path) {
  return `${HOSTS[hostKey]}${path}`;
}

function isAuthLocation(location) {
  if (!location) return false;
  return (
    location.includes('/login') ||
    location.includes('/unauthorized') ||
    location.includes('/host-shop/login')
  );
}

async function checkProtected(hostKey, path) {
  const url = absoluteUrl(hostKey, path);
  const res = await fetch(url, { redirect: 'manual' });
  const location = res.headers.get('location') || '';
  const pass = REDIRECT_STATUSES.has(res.status) && isAuthLocation(location);
  console.log(
    `${pass ? '✅' : '❌'} [${hostKey}] ${path} → ${res.status}${location ? ` → ${location}` : ''}`,
  );
  if (!pass) failed += 1;
}

async function checkPublic(hostKey, path) {
  const url = absoluteUrl(hostKey, path);
  const res = await fetch(url, { redirect: 'manual' });
  const location = res.headers.get('location') || '';
  const pass = res.status === 200;
  console.log(
    `${pass ? '✅' : '❌'} [${hostKey}] ${path} → ${res.status}${location ? ` → ${location}` : ''}`,
  );
  if (!pass) failed += 1;
}

console.log('Canonical portal auth audit');
console.log(`Marketing: ${HOSTS.marketing}`);
console.log(`LMS:       ${HOSTS.lms}`);
console.log(`Admin:     ${HOSTS.admin}\n`);

for (const [hostKey, path] of PROTECTED) {
  await checkProtected(hostKey, path);
}

console.log('');
for (const [hostKey, path] of PUBLIC) {
  await checkPublic(hostKey, path);
}

console.log(failed ? `\n❌ ${failed} canonical portal checks failed` : '\n✅ All canonical portal auth checks passed');
process.exit(failed ? 1 : 0);
