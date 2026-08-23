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
const startWorkspaceTrial = requireFile('lib/workspace/start-workspace-trial.ts');
const trialLifecycle = requireFile('apps/admin/app/api/cron/trial-lifecycle/route.ts');
const licensingMiddleware = requireFile('lib/licensing/middleware.ts');
const marketingMiddleware = requireFile('apps/marketing/middleware.ts');

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

// Platform/workspace trials are canonical in managed_licenses. The white-label
// licenses table must not regain ownership of the 14-day trial lifecycle.
if (!startWorkspaceTrial.includes(".from('managed_licenses')")) {
  failures.push('Workspace trial provisioning must persist a managed_licenses record');
}
if (!startWorkspaceTrial.includes('trialEndFromStart')) {
  failures.push('Workspace trial recovery must derive expiration from the original trial clock');
}
if (startWorkspaceTrial.includes('Date.now() + TRIAL_DURATION_DAYS')) {
  failures.push('Workspace trial recovery must not reset the 14-day clock from the current time');
}
if (!startWorkspaceTrial.includes('Failed to provision active trial license')) {
  failures.push('Workspace trial provisioning must fail closed when licensing cannot be established');
}

if (!trialLifecycle.includes(".from('managed_licenses')")) {
  failures.push('Trial lifecycle cron must operate on managed_licenses');
}
if (trialLifecycle.includes(".from('licenses')")) {
  failures.push('Trial lifecycle cron must not expire white-label licenses');
}
if (!trialLifecycle.includes("status: 'expired'")) {
  failures.push('Trial lifecycle cron must persist an explicit expired state');
}

const managedLicenseIndex = licensingMiddleware.indexOf(".from('managed_licenses')");
const legacyLicenseIndex = licensingMiddleware.indexOf(".from('licenses')");
if (managedLicenseIndex < 0) {
  failures.push('API licensing must resolve managed_licenses as the canonical platform entitlement');
}
if (legacyLicenseIndex >= 0 && managedLicenseIndex >= 0 && legacyLicenseIndex < managedLicenseIndex) {
  failures.push('Legacy licenses fallback must never precede managed_licenses entitlement resolution');
}
if (!licensingMiddleware.includes("code = license.tier === 'trial' ? 'TRIAL_EXPIRED'")) {
  failures.push('API licensing must return an explicit TRIAL_EXPIRED code');
}

if (!marketingMiddleware.includes("`${MARKETING_HOST}${pathname}${search}`")) {
  failures.push('Marketing-hosted portal login returns must use the canonical public marketing host');
}
if (marketingMiddleware.includes("`${req.nextUrl.origin}${pathname}${search}`")) {
  failures.push('Marketing-hosted portal login returns must not derive from an internal request origin');
}

if (failures.length) {
  console.error(failures.map((failure) => `PRODUCTION CONTRACT ERROR: ${failure}`).join('\n'));
  process.exit(1);
}

console.log('Portal production contracts verified: Admin/public boundaries, Website Builder defaults, and canonical managed-trial licensing are enforced.');
