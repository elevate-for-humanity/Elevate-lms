import { healthPassed } from './audit-runtime-parity.mjs';

export async function verifyRuntimeReadiness(component, base, token, { request = fetch, pause = ms => new Promise(resolve => setTimeout(resolve, ms)), attempts = 8 } = {}) {
  const url = new URL(base);
  if (url.protocol !== 'https:' || !url.hostname.endsWith('.run.app') || url.username || url.password || url.search || url.hash || url.pathname !== '/') throw new Error('Invalid Google runtime URL');
  if (!['marketing', 'admin', 'lms', 'store'].includes(component)) throw new Error('Unknown Google service');
  if (!Number.isInteger(attempts) || attempts < 1 || attempts > 8) throw new Error('Invalid readiness attempt budget');
  const processService = component;
  for (const path of ['/api/health', '/api/ready']) {
    let passed = false;
    for (let attempt = 1; attempt <= attempts; attempt++) {
      let status;
      try {
        const response = await request(new URL(path, url), { headers: { 'X-Serverless-Authorization': `Bearer ${token}` }, redirect: 'manual', signal: AbortSignal.timeout(15000) });
        status = response.status;
        const body = await response.json().catch(() => ({}));
        passed = healthPassed(processService, path, status, body);
      } catch { /* Network/cold-start errors consume the same bounded attempt budget. */ }
      if (passed) break;
      if (status && status !== 200 && ![429, 500, 502, 503, 504].includes(status)) throw new Error('Google readiness rejected request');
      if (attempt < attempts) await pause(5000);
    }
    if (!passed) throw new Error('Google runtime readiness budget exhausted');
  }
  return { component, passed: true };
}
