import 'server-only';

import { hydrateProcessEnv } from '@/lib/secrets';

const QB_BASE = 'https://quickbooks.api.intuit.com/v3/company';
const QB_TOKEN_URL = 'https://oauth.platform.intuit.com/oauth2/v1/tokens/bearer';
type Database = any;

export class QuickBooksError extends Error {
  constructor(public readonly reason: string, message: string) {
    super(message);
    this.name = 'QuickBooksError';
  }
}

/** This client sends requests exclusively to Intuit's production API. */
export function assertQuickBooksProductionEnvironment(): void {
  if (process.env.QB_ENVIRONMENT !== 'production') {
    throw new QuickBooksError('production_environment_unverified', 'QuickBooks production credentials and company authorization must be verified before connecting.');
  }
}

/** Only fixed, non-sensitive codes may cross the public health boundary. */
export function quickBooksFailureReason(error: unknown): string {
  if (error instanceof QuickBooksError) return error.reason;
  if (error instanceof Error && ['TimeoutError', 'AbortError'].includes(error.name)) {
    return 'provider_timeout';
  }
  return 'connection_check_failed';
}

export interface QuickBooksConfig {
  clientId: string;
  clientSecret: string;
  accessToken: string;
  refreshToken: string;
  realmId: string;
}

export function resolveQuickBooksCredentials(stored: Record<string, string>) {
  const hasRuntimeCredentials = Boolean(process.env.QB_CLIENT_ID || process.env.QB_CLIENT_SECRET);
  if (hasRuntimeCredentials && (!process.env.QB_CLIENT_ID || !process.env.QB_CLIENT_SECRET))
    throw new QuickBooksError('oauth_configuration_missing', 'QuickBooks application credentials must be configured as a complete pair.');
  return hasRuntimeCredentials
    ? {clientId: process.env.QB_CLIENT_ID!, clientSecret: process.env.QB_CLIENT_SECRET!}
    : {clientId: stored.QB_CLIENT_ID || '', clientSecret: stored.QB_CLIENT_SECRET || ''};
}

export async function loadQuickBooksConfig(db: Database): Promise<QuickBooksConfig> {
  // Static OAuth credentials live in the canonical Vault-backed secret store;
  // refreshed access/refresh tokens remain in app_settings because they rotate.
  await hydrateProcessEnv();
  const keys = ['QB_CLIENT_ID', 'QB_CLIENT_SECRET', 'QB_ACCESS_TOKEN', 'QB_REFRESH_TOKEN', 'QB_REALM_ID'];
  const { data, error } = await db.from('app_settings').select('key,value').in('key', keys);
  if (error) throw new QuickBooksError('settings_lookup_failed', 'QuickBooks connection settings could not be loaded.');
  const stored = Object.fromEntries((data || []).map((row: any) => [row.key, row.value]));
  const credentials = resolveQuickBooksCredentials(stored);
  // A successful database lookup is authoritative, including absent tokens after disconnect.
  const value = (key: string) => stored[key] || '';
  return { ...credentials, accessToken: value('QB_ACCESS_TOKEN'), refreshToken: value('QB_REFRESH_TOKEN'), realmId: value('QB_REALM_ID') };
}

async function refreshQuickBooksTokenOnce(db: Database, config: QuickBooksConfig): Promise<string> {
  if (!config.clientId || !config.clientSecret) throw new QuickBooksError('oauth_configuration_missing', 'QuickBooks application credentials are missing.');
  if (!config.refreshToken) throw new QuickBooksError('oauth_reauthorization_required', 'QuickBooks authorization expired. Reconnect QuickBooks.');
  const response = await fetch(QB_TOKEN_URL, {
    method: 'POST',
    redirect: 'error', cache: 'no-store',
    signal: AbortSignal.timeout(10_000),
    headers: { authorization: `Basic ${Buffer.from(`${config.clientId}:${config.clientSecret}`).toString('base64')}`, 'content-type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ grant_type: 'refresh_token', refresh_token: config.refreshToken }),
  });
  if (!response.ok) {
    const failure = await response.json().catch(() => null);
    if (failure?.error === 'invalid_grant') {
      // A different replica can complete rotation while this request is in flight.
      const latest = await loadQuickBooksConfig(db);
      if (latest.clientId === config.clientId && latest.realmId === config.realmId &&
          latest.accessToken && latest.refreshToken && latest.refreshToken !== config.refreshToken) {
        Object.assign(config, latest);
        return latest.accessToken;
      }
    }
    const reason = failure?.error === 'invalid_grant' ? 'oauth_reauthorization_required'
      : ['invalid_client', 'unauthorized_client'].includes(failure?.error) ? 'oauth_client_rejected'
      : response.status === 429 ? 'provider_rate_limited'
      : response.status >= 500 ? 'provider_unavailable' : 'oauth_refresh_failed';
    throw new QuickBooksError(reason, 'QuickBooks token refresh could not be verified.');
  }
  const token = await response.json();
  if (typeof token.access_token !== 'string' || !token.access_token.trim() ||
      (token.refresh_token !== undefined && (typeof token.refresh_token !== 'string' || !token.refresh_token.trim()))) {
    throw new QuickBooksError('oauth_response_invalid', 'QuickBooks returned an invalid authorization response.');
  }
  const { data: saved, error } = await db.rpc('rotate_quickbooks_authorization', {
    p_expected_refresh: config.refreshToken, p_realm: config.realmId,
    p_access: token.access_token, p_refresh: token.refresh_token || config.refreshToken,
  });
  if (error) throw new QuickBooksError('token_persistence_failed', 'QuickBooks authorization refreshed, but could not be saved. Reconnect QuickBooks before retrying.');
  if (saved !== true) {
    const latest = await loadQuickBooksConfig(db);
    if (latest.realmId !== config.realmId || latest.clientId !== config.clientId || !latest.accessToken || latest.refreshToken === config.refreshToken)
      throw new QuickBooksError('authorization_changed', 'QuickBooks authorization changed. Retry with the current connection.');
    Object.assign(config, latest);
    return latest.accessToken;
  }
  config.accessToken = token.access_token;
  config.refreshToken = token.refresh_token || config.refreshToken;
  return token.access_token;
}

const refreshes = new Map<string, Promise<QuickBooksConfig>>();
async function refreshQuickBooksToken(db: Database, config: QuickBooksConfig): Promise<string> {
  const identity = `${config.clientId}:${config.realmId}`;
  const existing = refreshes.get(identity);
  if (existing) {
    const latest = await existing;
    config.accessToken = latest.accessToken;
    config.refreshToken = latest.refreshToken;
    return latest.accessToken;
  }
  const pending = refreshQuickBooksTokenOnce(db, config).then(() => ({ ...config }));
  refreshes.set(identity, pending);
  try { return (await pending).accessToken; }
  finally { if (refreshes.get(identity) === pending) refreshes.delete(identity); }
}

async function rawRequest(config: QuickBooksConfig, token: string, path: string, init?: RequestInit) {
  const separator = path.includes('?') ? '&' : '?';
  return fetch(`${QB_BASE}/${config.realmId}/${path}${separator}minorversion=75`, {
    ...init,
    redirect: 'error', cache: 'no-store',
    signal: init?.signal ? AbortSignal.any([init.signal, AbortSignal.timeout(10_000)]) : AbortSignal.timeout(10_000),
    headers: { authorization: `Bearer ${token}`, accept: 'application/json', 'content-type': 'application/json', ...(init?.headers || {}) },
  });
}

export async function quickBooksRequest<T = any>(db: Database, config: QuickBooksConfig, path: string, init?: RequestInit): Promise<T> {
  assertQuickBooksProductionEnvironment();
  if (!config.realmId || (!config.accessToken && !config.refreshToken)) {
    throw new QuickBooksError('oauth_configuration_missing', 'QuickBooks is not connected.');
  }
  // An expired/missing access token is recoverable when a refresh token exists.
  // Persist the refreshed token before retrying the original request.
  const hadAccessToken = Boolean(config.accessToken);
  const accessToken = config.accessToken || await refreshQuickBooksToken(db, config);
  let response = await rawRequest(config, accessToken, path, init);
  if (response.status === 401 && hadAccessToken) {
    // Another request or replica may already have rotated this grant. Never submit
    // the rejected snapshot's refresh token when a newer authorization is saved.
    const latest = await loadQuickBooksConfig(db);
    if (latest.clientId !== config.clientId || latest.realmId !== config.realmId)
      throw new QuickBooksError('authorization_changed', 'QuickBooks authorization changed. Retry with the current connection.');
    Object.assign(config, latest);
    const retryToken = latest.accessToken && latest.accessToken !== accessToken
      ? latest.accessToken : await refreshQuickBooksToken(db, config);
    response = await rawRequest(config, retryToken, path, init);
  }
  if (!response.ok) throw new QuickBooksError(
    response.status === 401 ? 'oauth_reauthorization_required' : response.status === 403 ? 'provider_access_denied' : 'provider_request_failed',
    `QuickBooks request failed (${response.status}).`,
  );
  return response.json() as Promise<T>;
}

export const escapeQuickBooksQuery = (value: string) => value.replaceAll("'", "\\'");
