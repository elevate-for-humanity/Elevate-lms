#!/usr/bin/env node
import { readFileSync } from 'node:fs';

const adapters = [
  ['apps/lms/app/api/webhooks/stripe/route.ts', 'marketing', '/api/webhooks/stripe'],
  ['apps/lms/app/api/webhooks/store/route.ts', 'marketing', '/api/webhooks/store'],
  ['apps/lms/app/api/webhooks/jotform/route.ts', 'marketing', '/api/webhooks/jotform'],
  ['apps/lms/app/api/webhooks/partners/[partner]/route.ts', 'marketing', '/api/webhooks/partners/'],
  ['apps/lms/app/api/stripe/trial-checkout/route.ts', 'marketing', '/api/stripe/trial-checkout'],
  ['apps/lms/app/api/checkout/program/route.ts', 'marketing', '/api/checkout/program'],
  ['apps/lms/app/api/courses/[courseId]/announcements/route.ts', 'admin', '/announcements'],
  ['apps/lms/app/api/documents/upload/route.ts', 'admin', '/api/documents/upload'],
];

const forbiddenAdapterLogic = [
  /\.from\s*\(/,
  /\.insert\s*\(/,
  /\.upsert\s*\(/,
  /\.update\s*\(/,
  /\.delete\s*\(/,
  /checkout\.sessions\.create\s*\(/,
  /webhooks\.constructEvent\s*\(/,
  /storage\s*\.\s*from\s*\(/,
];

const failures = [];
for (const [file, service, routeMarker] of adapters) {
  const source = readFileSync(file, 'utf8');
  if (!source.includes('proxyCanonicalRoute')) failures.push(`${file} is not a canonical adapter`);
  if (!source.includes(`'${service}'`)) failures.push(`${file} does not target ${service}`);
  if (!source.includes(routeMarker)) failures.push(`${file} lost route ${routeMarker}`);
  for (const pattern of forbiddenAdapterLogic) {
    if (pattern.test(source))
      failures.push(`${file} contains write-capable implementation logic (${pattern})`);
  }
}

const proxy = readFileSync('lib/api/canonical-route-proxy.ts', 'utf8');
for (const marker of [
  'request.arrayBuffer()',
  "'stripe-signature'",
  "'authorization'",
  "'cookie'",
  "redirect: 'manual'",
]) {
  if (!proxy.includes(marker))
    failures.push(`canonical proxy lost required contract marker: ${marker}`);
}

const canonicalRequirements = [
  ['apps/marketing/app/api/webhooks/stripe/route.ts', 'constructStripeEventWithAnySecret'],
  ['apps/marketing/app/api/webhooks/store/route.ts', 'webhook_events_processed'],
  ['apps/marketing/app/api/webhooks/jotform/route.ts', 'safeSecretEqual'],
  ['apps/marketing/app/api/webhooks/partners/[partner]/route.ts', 'safeSecretEqual'],
  ['apps/marketing/app/api/stripe/trial-checkout/route.ts', 'trial_signups'],
  ['apps/marketing/app/api/checkout/program/route.ts', "kind: 'partner_course'"],
  ['apps/admin/app/api/courses/[courseId]/announcements/route.ts', 'course_announcements'],
  ['apps/admin/app/api/documents/upload/route.ts', 'ALLOWED_MIME_TYPES'],
];
for (const [file, marker] of canonicalRequirements) {
  if (!readFileSync(file, 'utf8').includes(marker))
    failures.push(`${file} lost canonical capability ${marker}`);
}

if (failures.length) {
  console.error(failures.join('\n'));
  process.exit(1);
}
console.log(
  'Cross-app write authority valid: 8 canonical handlers, 8 mutation-free compatibility adapters.',
);
