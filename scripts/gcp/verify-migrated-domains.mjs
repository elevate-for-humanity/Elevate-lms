import { execFileSync } from 'node:child_process';
import { writeFileSync } from 'node:fs';
import { verifyDns, verifyTls } from './verify-production-dns.mjs';

const project = 'elegant-racer-299721';
const hosts = ['portal', 'dashboard', 'testing', 'dev-studio'].map(x => x + '.elevateforhumanity.org');
const read = args => JSON.parse(execFileSync('gcloud', [...args, '--project=' + project, '--format=json'], { encoding: 'utf8', timeout: 30000 }));
const record = [];
const check = (name, host, pass, evidence = {}) => record.push({ name, host, status: pass ? 'PASS' : 'FAIL', evidence });
let addresses = [];
try {
  const map = read(['compute', 'url-maps', 'describe', 'elevate-public-routes', '--global']);
  const proxies = read(['compute', 'target-https-proxies', 'list']);
  const active = proxies.filter(p => p.urlMap?.endsWith('/elevate-public-routes'));
  const forwards = read(['compute', 'forwarding-rules', 'list']);
  addresses = [...new Set(forwards.filter(f => active.some(p => p.selfLink === f.target) && (f.portRange === '443-443' || f.portRange === '443' || f.ports?.includes('443'))).map(f => f.IPAddress))];
  check('GOOGLE_LB_IP', 'global', addresses.length > 0, { addresses });
  for (const host of hosts) {
    const rules = (map.hostRules || []).filter(r => (r.hosts || []).includes(host));
    const matcher = rules.length === 1 ? (map.pathMatchers || []).find(p => p.name === rules[0].pathMatcher) : null;
    check('GOOGLE_HOST_RULE', host, rules.length === 1 && Boolean(matcher), { matcher: matcher?.name ?? null });
  }
} catch (e) { check('GOOGLE_LB_READ', 'global', false, { error: e.code || 'READ_FAILED' }); }
for (const host of hosts) {
  try { const dns = verifyDns(host, addresses); check('AUTHORITATIVE_DNS', host, dns.passed, dns); }
  catch (e) { check('AUTHORITATIVE_DNS', host, false, { error: e.code || 'LOOKUP_FAILED' }); }
  const tls = await verifyTls(host);
  check('PUBLIC_TLS', host, tls.passed, tls);
  for (const path of ['/api/health', '/api/version']) {
    try {
      const url = new URL('https://' + host + path);
      url.searchParams.set('audit', String(Date.now()));
      const res = await fetch(url, { redirect: 'manual', headers: { 'Cache-Control': 'no-cache, no-store', Pragma: 'no-cache' }, signal: AbortSignal.timeout(12000) });
      const location = res.headers.get('location') || '';
      check('PUBLIC_' + path.slice(5).toUpperCase(), host, res.status === 200, { status: res.status, location: location.slice(0, 150) });
      await res.body?.cancel();
    } catch (e) { check('PUBLIC_' + path.slice(5).toUpperCase(), host, false, { error: e.cause?.code || e.code || 'PROBE_FAILED' }); }
  }
}
try {
  const audit = String(Date.now());
  const res = await fetch('https://app.elevateforhumanity.org/program-holder/dashboard?audit=' + audit, { redirect: 'manual', headers: { 'Cache-Control': 'no-cache, no-store', Pragma: 'no-cache' }, signal: AbortSignal.timeout(12000) });
  const location = res.headers.get('location') || '';
  const parsed = new URL(location, 'https://app.elevateforhumanity.org');
  const redirectedTo = parsed.searchParams.get('redirect') || '';
  // The dashboard guard may preserve the cache-busting query inside the
  // encoded login destination. Require the exact same-origin route and reject
  // unrelated query parameters, fragments and external redirect destinations.
  const destination = redirectedTo.startsWith('/') && !redirectedTo.startsWith('//')
    ? new URL(redirectedTo, parsed.origin) : null;
  const validDestination = destination?.origin === parsed.origin
    && destination.pathname === '/program-holder/dashboard'
    && !destination.hash
    && (destination.searchParams.size === 0
      || (destination.searchParams.size === 1 && destination.searchParams.get('audit') === audit));
  check('PROGRAM_HOLDER_LOGIN_REDIRECT', 'app.elevateforhumanity.org', [302,303,307,308].includes(res.status) && parsed.origin === 'https://app.elevateforhumanity.org' && parsed.pathname === '/login' && validDestination, { status: res.status, location: location.slice(0, 150) });
  await res.body?.cancel();
} catch (e) { check('PROGRAM_HOLDER_LOGIN_REDIRECT', 'app.elevateforhumanity.org', false, { error: e.cause?.code || e.code || 'PROBE_FAILED' }); }
const pass = record.every(c => c.status === 'PASS');
writeFileSync('migrated-domains-verification.json', JSON.stringify({ project, checkedAt: new Date().toISOString(), pass, checks: record }, null, 2));
for (const row of record) console.log(JSON.stringify(row));
if (!pass) process.exitCode = 1;
