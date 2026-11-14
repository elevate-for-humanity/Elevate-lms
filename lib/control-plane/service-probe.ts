const publicServices: Record<string, string> = {
  'www.elevateforhumanity.org': 'marketing',
  'admin.elevateforhumanity.org': 'admin',
  'app.elevateforhumanity.org': 'lms',
  'lms.elevateforhumanity.org': 'lms',
  'store.elevateforhumanity.org': 'store',
};

export async function probePlatformService(service: { url?: string | null }, request: typeof fetch = fetch) {
  const started = Date.now();
  const checked_at = new Date().toISOString();
  const result = { checked_at, response_time_ms: 0, status_code: null as number | null,
    status: 'warning' as 'pass' | 'fail' | 'warning', error_message: 'authenticated_probe_required' as string | undefined };
  let url: URL;
  try { url = new URL(service.url || ''); } catch { return { ...result, error_message: 'invalid_health_endpoint' }; }
  // Provider homepages/login pages never certify storage, DB, CDN or repository health.
  if (url.protocol !== 'https:' || url.username || url.password || url.search || url.hash ||
    !publicServices[url.hostname] || url.pathname !== '/api/health') return result;
  try {
    const response = await request(url.toString(), { redirect: 'error', cache: 'no-store', signal: AbortSignal.timeout(8000) });
    const body = await response.json();
    const valid = response.ok && body.service === publicServices[url.hostname] && body.healthy === true &&
      body.ready === true && body.dependencies?.supabase?.ok === true && /^[a-f0-9]{40}$/.test(body.commit || '');
    return { ...result, response_time_ms: Date.now() - started, status_code: response.status,
      status: valid ? 'pass' as const : 'fail' as const, error_message: valid ? undefined : 'runtime_health_failed' };
  } catch { return { ...result, status: 'fail' as const, response_time_ms: Date.now() - started, error_message: 'runtime_probe_failed' }; }
}
