#!/usr/bin/env tsx
/**
 * Route smoke tests — verify critical public routes return expected HTTP status.
 *
 * Usage:
 *   pnpm tsx scripts/smoke-routes.ts                              # defaults to http://localhost:3000
 *   BASE_URL=https://elevateforhumanity.org pnpm tsx scripts/smoke-routes.ts
 */

const BASE_URL = (process.env.BASE_URL ?? 'http://localhost:3000').replace(/\/$/, '');

type RouteSpec = {
  path: string;
  expectedStatus: number | number[];
  redirectTo?: string;
  description: string;
};

const ROUTES: RouteSpec[] = [
  { path: '/',                                     expectedStatus: 200,               description: 'Homepage' },
  { path: '/apply',                                expectedStatus: 200,               description: 'Apply page' },
  { path: '/check-eligibility',                    expectedStatus: 200,               description: 'Eligibility checker' },
  { path: '/programs',                             expectedStatus: 200,               description: 'Programs catalog' },
  { path: '/programs/barber-apprenticeship',       expectedStatus: 200,               description: 'Barber program detail' },
  { path: '/programs/barber-apprenticeship/apply', expectedStatus: [200, 302, 307, 308], description: 'Barber application form' },
  { path: '/login',                                expectedStatus: 200,               description: 'Login page' },
  { path: '/sign-in',                              expectedStatus: [301, 308],        redirectTo: '/login', description: '/sign-in -> /login redirect' },
];

async function check(route: RouteSpec): Promise<{ pass: boolean; note: string }> {
  const url = `${BASE_URL}${route.path}`;
  try {
    const res = await fetch(url, { redirect: 'manual' });
    const expected = Array.isArray(route.expectedStatus) ? route.expectedStatus : [route.expectedStatus];

    // If the route expects an application-level redirect, check status + Location.
    // If the first hop is an infrastructure redirect (bare domain -> www. with same path),
    // follow it once more (still manual) to find the real application redirect.
    if (route.redirectTo) {
      let checkRes = res;
      const firstLoc = res.headers.get('location') ?? '';
      const isSamePath = firstLoc.endsWith(route.path) || firstLoc.includes(route.path + '?');
      if ([301, 302, 307, 308].includes(res.status) && isSamePath && !firstLoc.includes(route.redirectTo)) {
        checkRes = await fetch(firstLoc, { redirect: 'manual' });
      }
      if (!expected.includes(checkRes.status)) {
        return { pass: false, note: `got ${checkRes.status}, expected ${expected.join('|')}` };
      }
      const loc = checkRes.headers.get('location') ?? '';
      if (!loc.includes(route.redirectTo)) {
        return { pass: false, note: `redirect location "${loc}" does not contain "${route.redirectTo}"` };
      }
      return { pass: true, note: `${res.status} -> ${checkRes.status} -> ${loc}` };
    }

    // For non-redirect routes: follow up to 2 hops (e.g. bare domain -> www.)
    // then check the final status.
    if ([301, 302, 307, 308].includes(res.status)) {
      const loc = res.headers.get('location');
      if (loc) {
        const followed = await fetch(loc, { redirect: 'follow' });
        if (!expected.includes(followed.status)) {
          return { pass: false, note: `got ${followed.status} after redirect from ${res.status}, expected ${expected.join('|')}` };
        }
        return { pass: true, note: `${res.status} -> ${followed.status}` };
      }
    }

    if (!expected.includes(res.status)) {
      return { pass: false, note: `got ${res.status}, expected ${expected.join('|')}` };
    }
    return { pass: true, note: `${res.status}` };
  } catch (err) {
    return { pass: false, note: `fetch error: ${err instanceof Error ? err.message : err}` };
  }
}

let passed = 0;
let failed = 0;

console.log(`\nSmoke testing: ${BASE_URL}\n`);

for (const route of ROUTES) {
  const { pass, note } = await check(route);
  const icon = pass ? '✅' : '❌';
  console.log(`${icon}  ${route.description.padEnd(40)} ${route.path.padEnd(45)} ${note}`);
  if (pass) passed++; else failed++;
}

console.log(`\n${passed} passed, ${failed} failed\n`);
if (failed > 0) process.exit(1);
