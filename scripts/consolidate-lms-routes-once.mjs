import fs from 'node:fs';
import path from 'node:path';

function walk(dir, files = []) {
  if (!fs.existsSync(dir)) return files;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, files);
    else if (/\.(?:ts|tsx|js|jsx|mjs|cjs)$/.test(entry.name)) files.push(full);
  }
  return files;
}

function replaceExactPathLiterals(text, from, to) {
  return text
    .replaceAll(`'${from}'`, `'${to}'`)
    .replaceAll(`"${from}"`, `"${to}"`)
    .replaceAll(`\`${from}\``, `\`${to}\``);
}

const canonicalPaths = new Map([
  ['/dashboard', '/lms/dashboard'],
  ['/messages', '/lms/messages'],
  ['/notifications', '/lms/notifications'],
  ['/orientation', '/lms/orientation'],
  ['/profile', '/lms/profile'],
  ['/settings', '/lms/settings'],
  ['/learner/dashboard', '/lms/dashboard'],
  ['/lms/login', '/login'],
  ['/achievements', '/lms/achievements'],
  ['/lms/badges', '/lms/achievements'],
  ['/ai-tutor', '/lms/ai-team'],
  ['/lms/ai-tutor', '/lms/ai-team'],
  ['/portal/barber', '/apprentice?program=barber-apprenticeship'],
  ['/portal/cosmetology', '/apprentice?program=cosmetology-apprenticeship'],
  ['/portal/esthetician', '/apprentice?program=esthetician-apprenticeship'],
  ['/portal/nail-technician', '/apprentice?program=nail-technician-apprenticeship'],
  ['/portal/culinary', '/apprentice?program=culinary-apprenticeship'],
  ['/portal/electrical', '/apprentice?program=electrical'],
  ['/portal/plumbing', '/apprentice?program=plumbing'],
  ['/apprentice/payments', '/apprentice/billing'],
  ['/apprentice/portfolio', '/lms/portfolio'],
  ['/apprentice/messages', '/lms/messages'],
  ['/apprentice/resources', '/lms/library'],
]);

for (const root of ['apps/lms/app', 'components/lms', 'components/portal', 'components/dashboard', 'components/navigation', 'lib']) {
  for (const file of walk(root)) {
    let text = fs.readFileSync(file, 'utf8');
    const original = text;

    for (const [from, to] of canonicalPaths) {
      text = replaceExactPathLiterals(text, from, to);
    }

    text = text
      .replaceAll("'/portal/apprentice", "'/apprentice")
      .replaceAll('"/portal/apprentice', '"/apprentice')
      .replaceAll('`/portal/apprentice', '`/apprentice');

    if (text !== original) fs.writeFileSync(file, text);
  }
}

{
  const file = 'components/portal/ApprenticePortalShell.tsx';
  let text = fs.readFileSync(file, 'utf8');
  text = text.replace('portalPath: string; // e.g. /portal/barber', 'portalPath: string; // canonical /apprentice route for this program');
  fs.writeFileSync(file, text);
}

{
  const file = 'components/dashboard/PlatformShell.tsx';
  let text = fs.readFileSync(file, 'utf8');
  text = text
    .replace("title: 'Partner Portal'", "title: 'Host Shop Portal'")
    .replace('href="/profile"', 'href="/lms/settings/profile"');
  fs.writeFileSync(file, text);
}

{
  const file = 'lib/auth/lms-routes.ts';
  let text = fs.readFileSync(file, 'utf8');
  text = text.replace("  { path: '/lms/badges', allowedRoles: ['student', 'instructor', 'staff', 'admin'] },\n", '');
  fs.writeFileSync(file, text);
}

const retiredFiles = [
  'apps/lms/app/learner/page.tsx',
  'apps/lms/app/learner/dashboard/error.tsx',
  'apps/lms/app/lms/login/page.tsx',
  'apps/lms/app/achievements/page.tsx',
  'apps/lms/app/ai-tutor/page.tsx',
  'apps/lms/app/lms/ai-tutor/page.tsx',
  'apps/lms/app/lms/(app)/badges/page.tsx',
  'apps/lms/app/dashboard/page.tsx',
  'apps/lms/app/messages/page.tsx',
  'apps/lms/app/messages/MessagesClient.tsx',
  'apps/lms/app/notifications/page.tsx',
  'apps/lms/app/notifications/NotificationsClient.tsx',
  'apps/lms/app/orientation/page.tsx',
  'apps/lms/app/profile/page.tsx',
  'apps/lms/app/settings/page.tsx',
  'apps/lms/app/settings/SettingsClient.tsx',
];
for (const file of retiredFiles) {
  if (fs.existsSync(file)) fs.unlinkSync(file);
}

const required = [
  'apps/lms/app/login/page.tsx',
  'apps/lms/app/lms/(app)/dashboard/page.tsx',
  'apps/lms/app/lms/(app)/messages/page.tsx',
  'apps/lms/app/lms/(app)/notifications/page.tsx',
  'apps/lms/app/lms/(app)/notifications/NotificationsClient.tsx',
  'apps/lms/app/lms/(app)/orientation/page.tsx',
  'apps/lms/app/lms/(app)/profile/page.tsx',
  'apps/lms/app/lms/(app)/settings/page.tsx',
  'apps/lms/app/lms/(app)/achievements/page.tsx',
  'apps/lms/app/lms/(app)/ai-team/page.tsx',
  'apps/lms/app/lms/(app)/portfolio/page.tsx',
  'apps/lms/app/lms/(app)/library/page.tsx',
  'apps/lms/app/apprentice/page.tsx',
  'apps/lms/app/apprentice/billing/page.tsx',
  'apps/lms/app/apprentice/hours/page.tsx',
  'apps/lms/app/apprentice/skills/page.tsx',
  'apps/lms/app/apprentice/attendance/page.tsx',
  'apps/lms/app/apprentice/documents/page.tsx',
  'apps/lms/app/apprentice/profile/page.tsx',
  'apps/lms/app/host-shop/dashboard/page.tsx',
];
for (const file of required) {
  if (!fs.existsSync(file)) throw new Error(`Canonical route missing: ${file}`);
}
for (const file of retiredFiles) {
  if (fs.existsSync(file)) throw new Error(`Retired route still exists: ${file}`);
}

const appRoot = 'apps/lms/app';
const canonicalRoot = 'apps/lms/app/lms/(app)';
const canonicalPages = new Set(
  walk(canonicalRoot)
    .filter((file) => file.endsWith('/page.tsx'))
    .map((file) => file.slice(canonicalRoot.length).replace(/\/page\.tsx$/, '')),
);
const intentionalRootPrefixes = [
  '/apprentice', '/employer', '/host-shop', '/workforce', '/parent-portal', '/creator',
  '/login', '/signup', '/auth', '/accept-invite', '/enrollment', '/status', '/api', '/lms',
];
const collisions = [];
for (const file of walk(appRoot).filter((entry) => entry.endsWith('/page.tsx'))) {
  if (file.startsWith(`${canonicalRoot}/`)) continue;
  let route = file.slice(appRoot.length).replace(/\/page\.tsx$/, '');
  route = route.replace(/\/(?:\([^/]+\))/g, '');
  if (!route) route = '/';
  if (intentionalRootPrefixes.some((prefix) => route === prefix || route.startsWith(`${prefix}/`))) continue;
  if (canonicalPages.has(route)) collisions.push({ route, file, canonical: `${canonicalRoot}${route}/page.tsx` });
}

if (collisions.length) {
  console.error('POTENTIAL_LMS_ROUTE_COLLISIONS');
  for (const collision of collisions) console.error(`${collision.route} :: ${collision.file} :: ${collision.canonical}`);
  process.exitCode = 1;
} else {
  console.log('POTENTIAL_LMS_ROUTE_COLLISIONS none');
}

console.log('LMS route consolidation completed.');
