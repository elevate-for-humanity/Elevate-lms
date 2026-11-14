import { healthPassed } from './audit-runtime-parity.mjs';

// Only stable categories are emitted. Never put endpoint payloads, URLs,
// request headers, exception messages or provider tokens in CI diagnostics.
export function classifyReadinessFailure(error) {
  const code = String(error?.cause?.code ?? error?.code ?? '');
  if (['ENOTFOUND', 'EAI_AGAIN', 'ENODATA'].includes(code)) return 'dns_unavailable';
  if (['ECONNREFUSED', 'ECONNRESET', 'EHOSTUNREACH', 'ENETUNREACH'].includes(code)) return 'connection_unavailable';
  if (['ETIMEDOUT', 'UND_ERR_CONNECT_TIMEOUT'].includes(code) || ['TimeoutError', 'AbortError'].includes(error?.name)) return 'timeout';
  if (['TypeError', 'SyntaxError'].includes(error?.name)) return 'invalid_response_or_network';
  return 'probe_unavailable';
}

export async function verifyRuntimeReadiness(component, base, token, { request = fetch, pause = ms => new Promise(resolve => setTimeout(resolve, ms)), attempts = 8 } = {}) {
  const url = new URL(base);
  if (url.protocol !== 'https:' || !url.hostname.endsWith('.run.app') || url.username || url.password || url.search || url.hash || url.pathname !== '/') throw new Error('Invalid Google runtime URL');
  if (!['marketing', 'admin', 'lms', 'store'].includes(component)) throw new Error('Unknown Google service');
  if (!Number.isInteger(attempts) || attempts < 1 || attempts > 8) throw new Error('Invalid readiness attempt budget');
  const processService = component;
  for (const path of ['/api/health', '/api/ready']) {
    let passed = false;
    let lastReason = 'not_checked';
    for (let attempt = 1; attempt <= attempts; attempt++) {
      let status;
      try {
        const response = await request(new URL(path, url), { headers: { 'X-Serverless-Authorization': `Bearer ${token}` }, redirect: 'manual', signal: AbortSignal.timeout(15000) });
        status = response.status;
        if (status !== 200 && ![429, 500, 502, 503, 504].includes(status)) {
          // Fail immediately on authentication, routing, and other non-retryable statuses.
          throw new Error('Google readiness rejected request (' + component + ' ' + path + ' http_' + status + ')');
        }
        lastReason = 'http_' + status;
        if (status === 200 || status === 503) {
          // The application returns dependency details with HTTP 503. Only
          // recognized failures override the HTTP category; malformed or proxy
          // responses must keep their status fallback and can never pass.
          const body = status === 503 ? await response.json().catch(() => null) : await response.json();
          passed = healthPassed(processService, path, status, body);
          if (!passed && status === 200) {
            lastReason = body?.service !== processService ? 'service_mismatch'
              : path === '/api/health' && body?.dependencies?.supabase?.ok !== true ? 'supabase_unready'
              : path === '/api/ready' && component === 'admin' && body?.agenticExecutorReady !== true ? 'agentic_executor_unready'
              : 'health_contract_unmet';
          } else if (!passed && body?.service === processService) {
            if (path === '/api/health' && body?.dependencies?.supabase?.ok === false) lastReason = 'supabase_unready';
            else if (path === '/api/ready' && component === 'admin' && body?.agenticExecutorReady === false) lastReason = 'agentic_executor_unready';
            else if ((path === '/api/health' && body?.healthy === false) || (path === '/api/ready' && body?.ready === false)) lastReason = 'health_contract_unmet';
          }
        }
      } catch (error) {
        if (error?.message?.startsWith('Google readiness rejected request (')) throw error;
        lastReason = classifyReadinessFailure(error);
      }
      if (passed) break;
      if (attempt < attempts) await pause(5000);
    }
    if (!passed) throw new Error('Google runtime readiness budget exhausted (' + component + ' ' + path + ' ' + lastReason + ')');
  }
  return { component, passed: true };
}
