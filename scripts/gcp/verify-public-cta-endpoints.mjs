#!/usr/bin/env node
/**
 * Read-only production endpoint smoke for primary public CTA destinations.
 * A source-level route/redirect match is not proof that the destination renders.
 * Run: node scripts/gcp/verify-public-cta-endpoints.mjs
 * Never sends form submissions, authenticates, or follows a cross-origin redirect.
 */
const ORIGIN = process.env.PUBLIC_SITE_ORIGIN || 'https://www.elevateforhumanity.org';
const ROUTES = [
  '/', '/programs', '/apprenticeships', '/partners/host-shops',
  '/programs/barber-apprenticeship',
  '/programs/cosmetology-apprenticeship',
  '/programs/esthetician-apprenticeship',
  '/programs/nail-technician-apprenticeship',
  '/check-eligibility', '/apply/student/interview', '/contact',
  '/funding', '/host-shops', '/employers',
];
const origin = new URL(ORIGIN);
if (origin.protocol !== 'https:') throw Error('HTTPS_ORIGIN_REQUIRED');
let failed = 0;
for (const route of ROUTES) {
  let url = new URL(route, origin);
  let destination = url.pathname;
  let result = 'unknown';
  try {
    for (let hop = 0; hop <= 4; hop += 1) {
      const response = await fetch(url, {
        redirect: 'manual',
        signal: AbortSignal.timeout(12000),
        headers: { accept: 'text/html' },
      });
      if ([301, 302, 303, 307, 308].includes(response.status)) {
        const location = response.headers.get('location');
        if (!location) throw Error('REDIRECT_WITHOUT_LOCATION');
        const next = new URL(location, url);
        if (next.origin !== origin.origin) throw Error('CROSS_ORIGIN_REDIRECT:' + next.hostname);
        if (next.href === url.href) throw Error('REDIRECT_LOOP');
        url = next; destination = url.pathname; continue;
      }
      const type = response.headers.get('content-type') || '';
      if (!response.ok || !type.includes('text/html')) {
        throw Error('INVALID_RESPONSE:' + response.status + ':' + type);
      }
      const html = await response.text();
      if (!/<html\b/i.test(html) || !/<(?:main|h1|h2)\b/i.test(html)) throw Error('HTML_CONTENT_MISSING');
      if (/(?:Application error: a client-side exception|Internal Server Error)/i.test(html))
        throw Error('RENDER_ERROR_MARKER');
      result = 'PASS'; break;
    }
    if (result !== 'PASS') throw Error('TOO_MANY_REDIRECTS');
  } catch (error) {
    failed += 1;
    result = 'FAIL ' + String(error?.message || error);
  }
  console.log(JSON.stringify({ route, destination, direct: route === destination, result }));
}
if (failed) {
  console.error('FAIL: ' + failed + ' primary CTA endpoint(s) did not render as HTML');
  process.exitCode = 1;
} else console.log('PASS: Public CTA endpoints returned rendered HTML (not interactive form acceptance).');
