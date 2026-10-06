import { pathToFileURL } from 'node:url';
import { healthPassed } from './audit-runtime-parity.mjs';

export const sites = {
  marketing: 'https://www.elevateforhumanity.org',
  admin: 'https://admin.elevateforhumanity.org',
  lms: 'https://app.elevateforhumanity.org',
  store: 'https://store.elevateforhumanity.org',
};

export async function verifySite(component, request = fetch) {
  const base = sites[component];
  if (!base) throw new Error('Unknown public service');
  // Store uses the Marketing Dockerfile and reports its actual process identity.
  const processService = component === 'store' ? 'marketing' : component;
  const results = [];
  for (const path of ['/api/ping', '/api/health', '/api/ready']) {
    try {
      const r = await request(base + path, { redirect: 'manual', signal: AbortSignal.timeout(20000), headers: { 'Cache-Control': 'no-cache' } });
      const body = await r.json();
      const passed = path === '/api/ping'
        ? r.status === 200 && body.ok === true && body.service === processService
        : healthPassed(processService, path, r.status, body);
      results.push({ component, path, status: r.status, passed,
        commit: /^[a-f0-9]{40}$/.test(body.commit ?? '') ? body.commit : undefined });
    } catch { results.push({ component, path, passed: false, error: 'probe_failed' }); }
  }
  if (component === 'marketing') {
    try {
      const r = await request(base + '/api/health/quickbooks', { redirect: 'manual', signal: AbortSignal.timeout(20000) });
      const body = await r.json();
      results.push({ component, path: '/api/health/quickbooks', status: r.status,
        passed: r.status === 200 && body.ready === true && body.connected === true &&
          body.configured === true && body.webhookVerifierConfigured === true });
    } catch { results.push({ component, path: '/api/health/quickbooks', passed: false, error: 'probe_failed' }); }
  }
  return results;
}

export async function main() {
  const results = (await Promise.all(Object.keys(sites).map(component => verifySite(component)))).flat();
  console.log(JSON.stringify({ results, passed: results.every(x => x.passed) }));
  if (results.some(x => !x.passed)) process.exitCode = 1;
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href)
  main().catch(() => { console.error('Google public health verification failed.'); process.exitCode = 1; });
