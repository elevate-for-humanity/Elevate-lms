#!/usr/bin/env node
import fs from 'node:fs';

const failures = [];
const read = (path) => fs.readFileSync(path, 'utf8');
const requireFile = (path) => {
  if (!fs.existsSync(path)) {
    failures.push(`missing ${path}`);
    return '';
  }
  return read(path);
};

const adminLayout = requireFile('apps/admin/app/layout.tsx');
const adminHeader = requireFile('components/admin/AdminHeader.tsx');
const dashboard = requireFile('components/admin/dashboard/DashboardShell.tsx');
const defaultSite = requireFile('lib/tenant/default-site-config.ts');

for (const forbidden of ['AdminFooter', 'LiveChatWidget']) {
  if (adminLayout.includes(forbidden)) {
    failures.push(`Admin root must not mount public component: ${forbidden}`);
  }
}

for (const forbidden of ['https://www.elevateforhumanity.org/online-apps', 'target="_blank"']) {
  if (adminHeader.includes(forbidden)) {
    failures.push(`Admin header contains external navigation dependency: ${forbidden}`);
  }
}

const staleAdminMarkers = [
  'Curvature Builder Draft',
  '4f36ef25-800d-48fa-a071-cf473064c22e',
  'LIVE_PORTALS',
  'Proof Links',
];
for (const marker of staleAdminMarkers) {
  if (dashboard.includes(marker)) failures.push(`Admin dashboard contains stale proof/demo marker: ${marker}`);
}

const fakeBuilderMarkers = [
  'students: 250',
  'employers: 40',
  "completionRate: '92%'",
  "rating: '4.8'",
  'Program Graduate',
  'Foundations',
  'Professional Track',
  'Certification Prep',
  'Quality training for career advancement',
];
for (const marker of fakeBuilderMarkers) {
  if (defaultSite.includes(marker)) failures.push(`Website Builder default invents business data: ${marker}`);
}

if (!defaultSite.includes('requiresContentReview: true')) {
  failures.push('Website Builder defaults must require content review before publication');
}
if (!defaultSite.includes('programs: []')) {
  failures.push('Website Builder defaults must start with no invented programs');
}
if (!defaultSite.includes('features: []')) {
  failures.push('Website Builder defaults must start with no invented features');
}

if (failures.length) {
  console.error(failures.map((failure) => `PRODUCTION CONTRACT ERROR: ${failure}`).join('\n'));
  process.exit(1);
}

console.log('Portal production contracts verified: authenticated Admin has no public widgets, stale proof IDs, or external nav dependencies; Website Builder does not seed fake business claims.');
