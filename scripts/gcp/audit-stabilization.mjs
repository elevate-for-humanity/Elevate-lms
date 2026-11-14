import { pathToFileURL } from 'node:url';
import { google, PROJECT } from './runtime-config.mjs';

const keys = ['NEXT_PUBLIC_SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY', 'ELEVATE_RUNTIME_CONFIG_PROVIDER',
  'QB_CLIENT_ID', 'QB_CLIENT_SECRET', 'QB_ACCESS_TOKEN', 'QB_REFRESH_TOKEN', 'QB_REALM_ID',
  'QB_WEBHOOK_VERIFIER_TOKEN', 'QUICKBOOKS_WEBHOOK_VERIFIER_TOKEN', 'SENDGRID_API_KEY'];

/** Read only the actual serving revision's relevant bindings. Never print values. */
export function servingEnvironment(component, run = google) {
  const service = JSON.parse(run(['run', 'services', 'describe', `elevate-${component}-migration`, '--project', PROJECT, '--region', 'us-central1', '--format=json']));
  const traffic = (service.status.traffic || []).filter(row => row.percent > 0);
  if (traffic.length !== 1 || traffic[0].percent !== 100) throw new Error('Serving revision is ambiguous');
  const revision = traffic[0].revisionName;
  const details = JSON.parse(run(['run', 'revisions', 'describe', revision, '--project', PROJECT, '--region', 'us-central1', '--format=json']));
  const env = {};
  const container = details.spec.containers[0];
  for (const item of container.env || []) {
    if (!keys.includes(item.name)) continue;
    if (typeof item.value === 'string') env[item.name] = item.value;
    else if (item.valueFrom?.secretKeyRef) {
      const ref = item.valueFrom.secretKeyRef;
      env[item.name] = run(['secrets', 'versions', 'access', ref.key, '--secret', ref.name, '--project', PROJECT]);
    }
  }
  return { env, revision, traffic: 100, startupProbe: container.startupProbe, livenessProbe: container.livenessProbe };
}

export async function diagnoseQuickBooks(env, request = fetch) {
  const report = { service: 'quickbooks', readOnly: true };
  const base = env.NEXT_PUBLIC_SUPABASE_URL;
  if (base !== 'https://cuxzzpsyufcewtmicszk.supabase.co' || !env.SUPABASE_SERVICE_ROLE_KEY) {
    return { ...report, reason: 'database_binding_unavailable' };
  }
  const headers = { apikey: env.SUPABASE_SERVICE_ROLE_KEY, Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}` };
  const dbRead = (path, init = {}) => request(`${base}/rest/v1/${path}`, { ...init, headers: { ...headers, ...init.headers }, signal: AbortSignal.timeout(10000) });
  try {
    const effective = { ...env };
    if (env.ELEVATE_RUNTIME_CONFIG_PROVIDER !== 'google-secret-manager') {
      // Match hydration precedence for relevant keys only: legacy then canonical.
      const legacy = await dbRead('app_secrets?select=key,value&scope=eq.runtime&key=in.(QB_CLIENT_ID,QB_CLIENT_SECRET,QB_ACCESS_TOKEN,QB_REFRESH_TOKEN,QB_REALM_ID,QB_WEBHOOK_VERIFIER_TOKEN,QUICKBOOKS_WEBHOOK_VERIFIER_TOKEN)');
      if (legacy.ok) for (const row of await legacy.json()) if (typeof row.value === 'string' && row.value.trim()) effective[row.key] = row.value;
      const canonical = await dbRead('platform_secrets?select=key&scope=eq.runtime&key=in.(QB_CLIENT_ID,QB_CLIENT_SECRET,QB_ACCESS_TOKEN,QB_REFRESH_TOKEN,QB_REALM_ID,QB_WEBHOOK_VERIFIER_TOKEN,QUICKBOOKS_WEBHOOK_VERIFIER_TOKEN)');
      if (!canonical.ok) return { ...report, reason: 'canonical_secret_lookup_failed', status: canonical.status };
      for (const row of await canonical.json()) {
        const decrypted = await dbRead('rpc/get_platform_secret', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ p_key: row.key }) });
        if (!decrypted.ok) return { ...report, reason: 'canonical_secret_decryption_failed', status: decrypted.status };
        const value = await decrypted.json();
        if (typeof value === 'string' && value.trim()) effective[row.key] = value;
      }
    }
    const settings = await dbRead('app_settings?select=key,value&key=in.(QB_CLIENT_ID,QB_CLIENT_SECRET,QB_ACCESS_TOKEN,QB_REFRESH_TOKEN,QB_REALM_ID)');
    if (!settings.ok) return { ...report, reason: 'settings_lookup_failed', status: settings.status };
    const stored = Object.fromEntries((await settings.json()).map(row => [row.key, row.value]));
    const config = {
      clientId: effective.QB_CLIENT_ID || stored.QB_CLIENT_ID,
      clientSecret: effective.QB_CLIENT_SECRET || stored.QB_CLIENT_SECRET,
      accessToken: stored.QB_ACCESS_TOKEN || effective.QB_ACCESS_TOKEN,
      refreshToken: stored.QB_REFRESH_TOKEN || effective.QB_REFRESH_TOKEN,
      realmId: stored.QB_REALM_ID || effective.QB_REALM_ID,
    };
    report.configured = Object.values(config).every(Boolean);
    report.webhookVerifierConfigured = Boolean(effective.QB_WEBHOOK_VERIFIER_TOKEN || effective.QUICKBOOKS_WEBHOOK_VERIFIER_TOKEN);
    report.staticCredentialSourcesDiffer = Boolean(stored.QB_CLIENT_ID && effective.QB_CLIENT_ID && stored.QB_CLIENT_ID !== effective.QB_CLIENT_ID);
    if (!report.configured) return { ...report, reason: 'oauth_configuration_missing' };
    const company = await request(`https://quickbooks.api.intuit.com/v3/company/${encodeURIComponent(config.realmId)}/companyinfo/${encodeURIComponent(config.realmId)}?minorversion=75`, {
      headers: { Authorization: `Bearer ${config.accessToken}`, Accept: 'application/json' }, signal: AbortSignal.timeout(10000),
    });
    // This diagnostic deliberately does not rotate tokens or write settings.
    return { ...report, companyStatus: company.status, reason: company.ok ? (report.webhookVerifierConfigured ? 'company_read_succeeded' : 'webhook_verifier_missing') : company.status === 401 ? 'access_token_rejected_refresh_path_requires_verification' : 'company_read_failed' };
  } catch (error) {
    return { ...report, reason: ['AbortError', 'TimeoutError'].includes(error?.name) ? 'provider_timeout' : 'diagnostic_request_failed' };
  }
}

export async function main() {
  for (const component of ['store', 'marketing', 'admin', 'lms']) {
    try {
      const { env, ...revision } = servingEnvironment(component);
      console.log(JSON.stringify({ component, ...revision }));
      if (component === 'marketing') console.log(JSON.stringify(await diagnoseQuickBooks(env)));
      if (component === 'admin' && env.SENDGRID_API_KEY) {
        const response = await fetch('https://api.sendgrid.com/v3/scopes', { headers: { Authorization: `Bearer ${env.SENDGRID_API_KEY}` }, signal: AbortSignal.timeout(10000) });
        console.log(JSON.stringify({ service: 'sendgrid', readOnly: true, scopesStatus: response.status }));
      }
    } catch { console.log(JSON.stringify({ component, reason: 'protected_diagnostic_unavailable' })); }
  }
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) await main();
