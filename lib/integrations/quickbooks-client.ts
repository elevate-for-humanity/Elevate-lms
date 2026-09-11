import 'server-only';

const QB_BASE = 'https://quickbooks.api.intuit.com/v3/company';
const QB_TOKEN_URL = 'https://oauth.platform.intuit.com/oauth2/v1/tokens/bearer';
type Database = any;

export interface QuickBooksConfig {
  clientId: string;
  clientSecret: string;
  accessToken: string;
  refreshToken: string;
  realmId: string;
}

export async function loadQuickBooksConfig(db: Database): Promise<QuickBooksConfig> {
  const keys = ['QB_CLIENT_ID', 'QB_CLIENT_SECRET', 'QB_ACCESS_TOKEN', 'QB_REFRESH_TOKEN', 'QB_REALM_ID'];
  const { data } = await db.from('app_settings').select('key,value').in('key', keys);
  const stored = Object.fromEntries((data || []).map((row: any) => [row.key, row.value]));
  const value = (key: string) => stored[key] || process.env[key] || '';
  return { clientId: value('QB_CLIENT_ID'), clientSecret: value('QB_CLIENT_SECRET'), accessToken: value('QB_ACCESS_TOKEN'), refreshToken: value('QB_REFRESH_TOKEN'), realmId: value('QB_REALM_ID') };
}

async function refreshQuickBooksToken(db: Database, config: QuickBooksConfig): Promise<string> {
  if (!config.clientId || !config.clientSecret || !config.refreshToken) throw new Error('QuickBooks authorization expired. Reconnect QuickBooks.');
  const response = await fetch(QB_TOKEN_URL, {
    method: 'POST',
    headers: { authorization: `Basic ${Buffer.from(`${config.clientId}:${config.clientSecret}`).toString('base64')}`, 'content-type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ grant_type: 'refresh_token', refresh_token: config.refreshToken }),
  });
  if (!response.ok) throw new Error('QuickBooks authorization expired. Reconnect QuickBooks.');
  const token = await response.json();
  const rows = [
    { key: 'QB_ACCESS_TOKEN', value: token.access_token, updated_at: new Date().toISOString() },
    ...(token.refresh_token ? [{ key: 'QB_REFRESH_TOKEN', value: token.refresh_token, updated_at: new Date().toISOString() }] : []),
  ];
  await db.from('app_settings').upsert(rows, { onConflict: 'key' });
  return token.access_token;
}

async function rawRequest(config: QuickBooksConfig, token: string, path: string, init?: RequestInit) {
  const separator = path.includes('?') ? '&' : '?';
  return fetch(`${QB_BASE}/${config.realmId}/${path}${separator}minorversion=75`, {
    ...init,
    headers: { authorization: `Bearer ${token}`, accept: 'application/json', 'content-type': 'application/json', ...(init?.headers || {}) },
  });
}

export async function quickBooksRequest<T = any>(db: Database, config: QuickBooksConfig, path: string, init?: RequestInit): Promise<T> {
  if (!config.accessToken || !config.realmId) throw new Error('QuickBooks is not connected.');
  let response = await rawRequest(config, config.accessToken, path, init);
  if (response.status === 401) response = await rawRequest(config, await refreshQuickBooksToken(db, config), path, init);
  if (!response.ok) throw new Error(`QuickBooks request failed (${response.status}): ${(await response.text()).slice(0, 500)}`);
  return response.json() as Promise<T>;
}

export const escapeQuickBooksQuery = (value: string) => value.replaceAll("'", "\\'");
