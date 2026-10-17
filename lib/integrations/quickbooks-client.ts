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

export async function loadQuickBooksConfig(db: Database): Promise<QuickBooksConfig> {
  // Static OAuth credentials live in the canonical Vault-backed secret store;
  // refreshed access/refresh tokens remain in app_settings because they rotate.
  await hydrateProcessEnv();
  const keys = ['QB_CLIENT_ID', 'QB_CLIENT_SECRET', 'QB_ACCESS_TOKEN', 'QB_REFRESH_TOKEN', 'QB_REALM_ID'];
  const { data, error } = await db.from('app_settings').select('key,value').in('key', keys);
  if (error) throw new QuickBooksError('settings_lookup_failed', 'QuickBooks connection settings could not be loaded.');
  const stored = Object.fromEntries((data || []).map((row: any) => [row.key, row.value]));
  const value = (key: string) => stored[key] || process.env[key] || '';
  return { clientId: process.env.QB_CLIENT_ID || stored.QB_CLIENT_ID || '', clientSecret: process.env.QB_CLIENT_SECRET || stored.QB_CLIENT_SECRET || '', accessToken: value('QB_ACCESS_TOKEN'), refreshToken: value('QB_REFRESH_TOKEN'), realmId: value('QB_REALM_ID') };
}

async function refreshQuickBooksToken(db: Database, config: QuickBooksConfig): Promise<string> {
  if (!config.clientId || !config.clientSecret || !config.refreshToken) throw new QuickBooksError('oauth_reauthorization_required', 'QuickBooks authorization expired. Reconnect QuickBooks.');
  const response = await fetch(QB_TOKEN_URL, {
    method: 'POST',
    signal: AbortSignal.timeout(10_000),
    headers: { authorization: `Basic ${Buffer.from(`${config.clientId}:${config.clientSecret}`).toString('base64')}`, 'content-type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ grant_type: 'refresh_token', refresh_token: config.refreshToken }),
  });
  if (!response.ok) throw new QuickBooksError('oauth_reauthorization_required', 'QuickBooks authorization expired. Reconnect QuickBooks.');
  const token = await response.json();
  if (typeof token.access_token !== 'string' || !token.access_token.trim() ||
      (token.refresh_token !== undefined && (typeof token.refresh_token !== 'string' || !token.refresh_token.trim()))) {
    throw new QuickBooksError('oauth_response_invalid', 'QuickBooks returned an invalid authorization response.');
  }
  const rows = [
    { key: 'QB_ACCESS_TOKEN', value: token.access_token, updated_at: new Date().toISOString() },
    ...(token.refresh_token ? [{ key: 'QB_REFRESH_TOKEN', value: token.refresh_token, updated_at: new Date().toISOString() }] : []),
  ];
  const { error } = await db.from('app_settings').upsert(rows, { onConflict: 'key' });
  if (error) throw new QuickBooksError('token_persistence_failed', 'QuickBooks authorization refreshed, but could not be saved. Reconnect QuickBooks before retrying.');
  return token.access_token;
}

async function rawRequest(config: QuickBooksConfig, token: string, path: string, init?: RequestInit) {
  const separator = path.includes('?') ? '&' : '?';
  return fetch(`${QB_BASE}/${config.realmId}/${path}${separator}minorversion=75`, {
    ...init,
    signal: init?.signal ? AbortSignal.any([init.signal, AbortSignal.timeout(10_000)]) : AbortSignal.timeout(10_000),
    headers: { authorization: `Bearer ${token}`, accept: 'application/json', 'content-type': 'application/json', ...(init?.headers || {}) },
  });
}

export async function quickBooksRequest<T = any>(db: Database, config: QuickBooksConfig, path: string, init?: RequestInit): Promise<T> {
  if (!config.accessToken || !config.realmId) throw new QuickBooksError('oauth_configuration_missing', 'QuickBooks is not connected.');
  let response = await rawRequest(config, config.accessToken, path, init);
  if (response.status === 401) response = await rawRequest(config, await refreshQuickBooksToken(db, config), path, init);
  if (!response.ok) throw new QuickBooksError(
    response.status === 401 ? 'oauth_reauthorization_required' : response.status === 403 ? 'provider_access_denied' : 'provider_request_failed',
    `QuickBooks request failed (${response.status}).`,
  );
  return response.json() as Promise<T>;
}

export const escapeQuickBooksQuery = (value: string) => value.replaceAll("'", "\\'");
