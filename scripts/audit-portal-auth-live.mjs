#!/usr/bin/env node
/** Live canonical portal authentication/ownership audit. */
const HOSTS = {
  marketing: (process.env.MARKETING_URL || 'https://www.elevateforhumanity.org').replace(/\/$/, ''),
  lms: (process.env.LMS_URL || 'https://app.elevateforhumanity.org').replace(/\/$/, ''),
  admin: (process.env.ADMIN_URL || 'https://admin.elevateforhumanity.org').replace(/\/$/, ''),
};

const PROTECTED = [
  ['marketing', '/provider/dashboard'],
  ['marketing', '/case-manager/dashboard'],
  ['marketing', '/workforce-board/dashboard'],
  ['lms', '/lms/dashboard'],
  ['lms', '/lms/courses'],
  ['lms', '/apprentice'],
  ['lms', '/apprentice/timeclock'],
  ['lms', '/employer/dashboard'],
  ['lms', '/parent-portal/dashboard'],
  ['lms', '/workforce/dashboard'],
  ['lms', '/host-shop/dashboard'],
  ['lms', '/host-shop/mou'],
  ['lms', '/host-shop/onboarding/profile'],
  ['lms', '/host-shop/onboarding/documents'],
  ['lms', '/host-shop/onboarding/mou'],
  ['lms', '/host-shop/orientation'],
  ['lms', '/host-shop/resources/beauty-apprenticeship'],
  ['lms', '/program-holder/dashboard'],
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

const MANIFESTS = [
  ['marketing', '/manifest-marketing.json'],
  ['lms', '/manifest-lms.json'],
  ['lms', '/manifest-student.json'],
  ['lms', '/manifest-apprentice.json'],
  ['lms', '/manifest-shop-owner.json'],
  ['lms', '/manifest-program-holder.json'],
  ['admin', '/manifest-admin.json'],
];

const REDIRECTS = new Set([301, 302, 303, 307, 308]);
let failed = 0;
function absolute(host, path) { return `${HOSTS[host]}${path}`; }
function authLocation(location) { return !!location && (location.includes('/login') || location.includes('/unauthorized') || location.includes('/host-shop/login')); }

async function protectedCheck(host, path) {
  const res = await fetch(absolute(host, path), { redirect: 'manual' });
  const location = res.headers.get('location') || '';
  const pass = REDIRECTS.has(res.status) && authLocation(location);
  console.log(`${pass ? '✅' : '❌'} [${host}] ${path} → ${res.status}${location ? ` → ${location}` : ''}`);
  if (!pass) failed++;
}
async function publicCheck(host, path) {
  const res = await fetch(absolute(host, path), { redirect: 'manual' });
  const pass = res.status === 200;
  console.log(`${pass ? '✅' : '❌'} [${host}] ${path} → ${res.status}`);
  if (!pass) failed++;
}
async function manifestCheck(host, path) {
  const res = await fetch(absolute(host, path), { redirect: 'manual' });
  let valid = res.status === 200;
  if (valid) {
    try { const body = await res.json(); valid = typeof body.name === 'string' && typeof body.start_url === 'string' && Array.isArray(body.icons); } catch { valid = false; }
  }
  console.log(`${valid ? '✅' : '❌'} [${host}] manifest ${path} → ${res.status}`);
  if (!valid) failed++;
}

console.log('Canonical portal auth audit');
for (const item of PROTECTED) await protectedCheck(...item);
console.log('\nPublic entry points');
for (const item of PUBLIC) await publicCheck(...item);
console.log('\nPWA manifests');
for (const item of MANIFESTS) await manifestCheck(...item);
console.log(failed ? `\n❌ ${failed} canonical portal checks failed` : '\n✅ All canonical portal auth checks passed');
process.exit(failed ? 1 : 0);
