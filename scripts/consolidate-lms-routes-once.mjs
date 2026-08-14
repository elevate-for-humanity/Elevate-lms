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

for (const root of ['apps/lms/app', 'components', 'lib']) {
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

// The apprenticeship shell owns the trade selector but every trade lands on one canonical /apprentice entry.
{
  const file = 'components/portal/ApprenticePortalShell.tsx';
  let text = fs.readFileSync(file, 'utf8');
  text = text.replace('portalPath: string; // e.g. /portal/barber', 'portalPath: string; // canonical /apprentice route for this program');
  fs.writeFileSync(file, text);
}

// Shared platform shell must never point LMS users at retired or nonexistent apprentice paths.
{
  const file = 'components/dashboard/PlatformShell.tsx';
  let text = fs.readFileSync(file, 'utf8');
  text = text
    .replace("title: 'Partner Portal'", "title: 'Host Shop Portal'")
    .replace("{ href: '/notifications',", "{ href: '/lms/notifications',")
    .replace('href="/notifications"', 'href="/lms/notifications"')
    .replace('href="/profile"', 'href="/lms/settings/profile"');
  fs.writeFileSync(file, text);
}

// There is one recognition system. /lms/achievements owns badges, points, certificates and leaderboard data.
{
  const file = 'lib/auth/lms-routes.ts';
  let text = fs.readFileSync(file, 'utf8');
  text = text.replace("  { path: '/lms/badges', allowedRoles: ['student', 'instructor', 'staff', 'admin'] },\n", '');
  fs.writeFileSync(file, text);
}

// Remove route-entry wrappers and superseded duplicate pages after references are normalized.
for (const file of [
  'apps/lms/app/learner/page.tsx',
  'apps/lms/app/learner/dashboard/error.tsx',
  'apps/lms/app/lms/login/page.tsx',
  'apps/lms/app/achievements/page.tsx',
  'apps/lms/app/ai-tutor/page.tsx',
  'apps/lms/app/lms/ai-tutor/page.tsx',
  'apps/lms/app/lms/(app)/badges/page.tsx',
]) {
  if (fs.existsSync(file)) fs.unlinkSync(file);
}

const required = [
  'apps/lms/app/login/page.tsx',
  'apps/lms/app/lms/(app)/dashboard/page.tsx',
  'apps/lms/app/lms/(app)/achievements/page.tsx',
  'apps/lms/app/lms/(app)/ai-team/page.tsx',
  'apps/lms/app/lms/(app)/portfolio/page.tsx',
  'apps/lms/app/lms/(app)/messages/page.tsx',
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

const retiredFiles = [
  'apps/lms/app/learner/page.tsx',
  'apps/lms/app/lms/login/page.tsx',
  'apps/lms/app/achievements/page.tsx',
  'apps/lms/app/ai-tutor/page.tsx',
  'apps/lms/app/lms/ai-tutor/page.tsx',
  'apps/lms/app/lms/(app)/badges/page.tsx',
];
for (const file of retiredFiles) {
  if (fs.existsSync(file)) throw new Error(`Retired route still exists: ${file}`);
}

console.log('LMS route consolidation completed.');
