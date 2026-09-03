#!/usr/bin/env node
/**
 * Raw HTML audit for public pages (no browser).
 * Usage: node scripts/audit-public-html.mjs [baseUrl]
 * Exit 1 if critical leaks detected.
 */

const requestedBase = process.argv[2] || process.env.PUBLIC_HTML_AUDIT_BASE_URL || '';
const eventName = process.env.GITHUB_EVENT_NAME || '';
const isSourceValidationEvent = eventName === 'push' || eventName.startsWith('pull_request');

if (!requestedBase && process.env.CI === 'true' && isSourceValidationEvent) {
  console.log(
    'Skipping public HTML audit: no PUBLIC_HTML_AUDIT_BASE_URL was provided for source validation.',
  );
  console.log('Run this smoke check against a preview or production URL after deployment.');
  process.exit(0);
}

const BASE = (requestedBase || 'https://www.elevateforhumanity.org').replace(/\/$/, '');

const PATHS = ['/', '/programs', '/education', '/programs/catalog', '/career-training'];

const FAIL_PATTERNS = [
  { re: /\[0,\s*" credential-bearing/, label: 'RSC zero program count' },
  { re: /alt="\{PLATFORM_DEFAULTS/, label: 'Unresolved PLATFORM_DEFAULTS in alt' },
  { re: /Welcome to \{PLATFORM_DEFAULTS/, label: 'Unresolved welcome placeholder' },
  { re: /\$\{PLATFORM_DEFAULTS\.orgName\}/, label: 'Literal ${PLATFORM_DEFAULTS} in HTML' },
  { re: /"500\+"/, label: 'Hardcoded 500+ in payload' },
];

async function fetchHtml(path) {
  const url = `${BASE}${path}`;
  const res = await fetch(url, {
    headers: { 'User-Agent': 'ElevatePublicHtmlAudit/1.0' },
    redirect: 'follow',
  });
  const html = await res.text();
  return { url, status: res.status, html };
}

let failed = 0;

for (const path of PATHS) {
  const { url, status, html } = await fetchHtml(path);
  console.log(`\n=== ${path} (${status}) ===`);
  for (const { re, label } of FAIL_PATTERNS) {
    if (re.test(html)) {
      console.log(`  FAIL: ${label}`);
      failed += 1;
    }
  }
  const countMatch = html.match(/(\d+)\s+credential-bearing programs/);
  if (path === '/programs' || path === '/education') {
    console.log(
      countMatch
        ? `  program count in HTML: ${countMatch[1]}`
        : '  WARN: no credential-bearing count string in HTML',
    );
  }
}

console.log(failed ? `\n${failed} issue(s) found` : '\nNo critical patterns detected');
process.exit(failed > 0 ? 1 : 0);
