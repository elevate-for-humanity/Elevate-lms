import { pathToFileURL } from 'node:url';
import { healthPassed } from './audit-runtime-parity.mjs';

export const sites = {
  marketing: 'https://www.elevateforhumanity.org',
  admin: 'https://admin.elevateforhumanity.org',
  lms: 'https://app.elevateforhumanity.org',
  store: 'https://store.elevateforhumanity.org',
};

const safeError = error => ['TimeoutError', 'AbortError', 'TypeError', 'SyntaxError'].includes(error?.name) ? error.name : 'probe_failed';
function dependencyEvidence(value) {
  if (!value || typeof value !== 'object') return undefined;
  const allowed = ['missing_configuration', 'non_success_status', 'invalid_response', 'request_failed', 'TimeoutError', 'AbortError', 'TypeError', 'SyntaxError'];
  return { ok: value.ok === true,
    status: Number.isInteger(value.status) && value.status >= 100 && value.status <= 599 ? value.status : null,
    latencyMs: Number.isFinite(value.latencyMs) && value.latencyMs >= 0 ? value.latencyMs : undefined,
    error: allowed.includes(value.error) ? value.error : undefined };
}

export async function verifySite(component, request = fetch) {
  const base = sites[component];
  if (!base) throw new Error('Unknown public service');
  const processService = component;
  const results = [];
  for (const path of ['/api/ping', '/api/health', '/api/ready']) {
    try {
      const r = await request(base + path, { redirect: 'manual', signal: AbortSignal.timeout(20000), headers: { 'Cache-Control': 'no-cache' } });
      const body = await r.json();
      const passed = path === '/api/ping'
        ? r.status === 200 && body.ok === true && body.service === processService
        : healthPassed(processService, path, r.status, body);
      results.push({ component, path, status: r.status, passed,
        commit: /^[a-f0-9]{40}$/.test(body.commit ?? '') ? body.commit : undefined,
        supabase: dependencyEvidence(body.dependencies?.supabase),
        auth: dependencyEvidence(body.dependencies?.supabase?.checks?.auth),
        database: dependencyEvidence(body.dependencies?.supabase?.checks?.database) });
    } catch (error) { results.push({ component, path, passed: false, error: safeError(error) }); }
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
