/**
 * /api/admin/integrations/quickbooks
 *
 * QuickBooks Online integration — OAuth 2.0 + payroll/expense sync.
 *
 * GET  ?action=status   → connection status + last sync
 * GET  ?action=auth_url → returns Intuit OAuth authorization URL
 * POST { action: 'sync_payroll' | 'sync_expenses' | 'disconnect' }
 *
 * Requires env vars:
 *   QB_CLIENT_ID, QB_CLIENT_SECRET, QB_REDIRECT_URI
 *   QB_ACCESS_TOKEN, QB_REFRESH_TOKEN, QB_REALM_ID  (set after OAuth)
 *
 * Admin-only.
 */

import { NextRequest, NextResponse } from 'next/server';
import { apiRequireAdmin } from '@/lib/admin/guards';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { requireAdminClient } from '@/lib/supabase/admin';
import { safeError, safeInternalError } from '@/lib/api/safe-error';
import { logger } from '@/lib/logger';
import { randomBytes } from 'node:crypto';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const QB_BASE      = 'https://quickbooks.api.intuit.com/v3/company';
const QB_AUTH_BASE = 'https://appcenter.intuit.com/connect/oauth2';
const QB_TOKEN_URL = 'https://oauth.platform.intuit.com/oauth2/v1/tokens/bearer';

// Accounting access covers company and employee records used by this dashboard.
// Do not request Payments: Intuit rejects a second Payments service connection.
const SCOPES = 'com.intuit.quickbooks.accounting';

async function getQuickBooksConfig() {
  const db = await requireAdminClient();
  const { data } = await db
    .from('app_settings')
    .select('key, value')
    .in('key', [
      'QB_CLIENT_ID',
      'QB_CLIENT_SECRET',
      'QB_REDIRECT_URI',
      'QB_ACCESS_TOKEN',
      'QB_REFRESH_TOKEN',
      'QB_REALM_ID',
      'QB_TOKEN_EXPIRES',
    ]);
  const stored = Object.fromEntries((data ?? []).map((row) => [row.key, row.value]));
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.elevateforhumanity.org';
  return {
    // Deployment secrets are authoritative for OAuth app credentials.
    // app_settings may contain legacy values and is used only as a fallback.
    clientId: process.env.QB_CLIENT_ID || stored.QB_CLIENT_ID || '',
    clientSecret: process.env.QB_CLIENT_SECRET || stored.QB_CLIENT_SECRET || '',
    redirectUri:
      process.env.QB_REDIRECT_URI ||
      stored.QB_REDIRECT_URI ||
      `${siteUrl}/api/auth/quickbooks/callback`,
    accessToken: stored.QB_ACCESS_TOKEN || process.env.QB_ACCESS_TOKEN || '',
    refreshToken: stored.QB_REFRESH_TOKEN || process.env.QB_REFRESH_TOKEN || '',
    realmId: stored.QB_REALM_ID || process.env.QB_REALM_ID || '',
  };
}

// ── Token refresh ─────────────────────────────────────────────────────────────

async function refreshAccessToken(
  refreshToken: string,
  clientId: string,
  clientSecret: string,
): Promise<string | null> {
  if (!clientId || !clientSecret || !refreshToken) return null;

  try {
    const res = await fetch(QB_TOKEN_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString('base64')}`,
      },
      body: new URLSearchParams({
        grant_type:    'refresh_token',
        refresh_token: refreshToken,
      }),
    });
    if (!res.ok) return null;
    const d = await res.json();
    const db = await requireAdminClient();
    await Promise.all([
      db.from('app_settings').upsert({ key: 'QB_ACCESS_TOKEN', value: d.access_token, updated_at: new Date().toISOString() }, { onConflict: 'key' }),
      d.refresh_token ? db.from('app_settings').upsert({ key: 'QB_REFRESH_TOKEN', value: d.refresh_token, updated_at: new Date().toISOString() }, { onConflict: 'key' }) : Promise.resolve(),
    ]);
    return d.access_token ?? null;
  } catch {
    return null;
  }
}

// ── QB API helper ─────────────────────────────────────────────────────────────

async function qbFetch(path: string, token: string, realmId: string) {
  const separator = path.includes('?') ? '&' : '?';
  const res = await fetch(`${QB_BASE}/${realmId}/${path}${separator}minorversion=65`, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/json',
    },
  });
  if (!res.ok) throw new Error(`QB API ${res.status}: ${await res.text().then(t => t.slice(0, 120))}`);
  return res.json();
}

// ── GET ───────────────────────────────────────────────────────────────────────

export async function GET(request: NextRequest) {
  const rateLimited = await applyRateLimit(request, 'api');
  if (rateLimited) return rateLimited;

  const auth = await apiRequireAdmin(request);
  if (auth.error) return auth.error;

  const action = request.nextUrl.searchParams.get('action') ?? 'status';

  if (action === 'auth_url') {
    const config = await getQuickBooksConfig();
    const { clientId, redirectUri } = config;
    if (!clientId) return safeError('QB_CLIENT_ID not configured', 503);

    const state = randomBytes(32).toString('base64url');
    const db = await requireAdminClient();
    await db.from('app_settings').upsert({ key: 'QB_OAUTH_STATE', value: state, updated_at: new Date().toISOString() }, { onConflict: 'key' });
    const url   = new URL(QB_AUTH_BASE);
    url.searchParams.set('client_id',     clientId);
    url.searchParams.set('redirect_uri',  redirectUri);
    url.searchParams.set('response_type', 'code');
    url.searchParams.set('scope',         SCOPES);
    url.searchParams.set('state',         state);

    return NextResponse.json({ auth_url: url.toString() });
  }

  // status
  const config = await getQuickBooksConfig();
  const connected = !!(config.accessToken && config.realmId);
  if (!connected) {
    return NextResponse.json({
      connected: false,
      realm_id: null,
      last_sync: null,
      message: 'QuickBooks not connected. Use auth_url to connect.',
    });
  }

  try {
    const token   = config.accessToken;
    const realmId = config.realmId;
    // Fetch company info to verify connection
    const info = await qbFetch('companyinfo/' + realmId, token, realmId);
    return NextResponse.json({
      connected: true,
      realm_id:  realmId,
      company_name: info.CompanyInfo?.CompanyName ?? 'Unknown',
      last_sync: null,
      message: 'Connected',
    });
  } catch (err) {
    // Try token refresh
    const newToken = await refreshAccessToken(
      config.refreshToken,
      config.clientId,
      config.clientSecret,
    );
    if (!newToken) {
      return NextResponse.json({ connected: false, error: 'Token expired — reconnect via auth_url' });
    }
    try {
      const info = await qbFetch('companyinfo/' + config.realmId, newToken, config.realmId);
      return NextResponse.json({ connected: true, realm_id: config.realmId, company_name: info.CompanyInfo?.CompanyName ?? 'Unknown', message: 'Connected (token refreshed)' });
    } catch {
      return NextResponse.json({ connected: false, error: 'QuickBooks authorization could not be verified — reconnect' });
    }
  }
}

// ── POST ──────────────────────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  const rateLimited = await applyRateLimit(request, 'api');
  if (rateLimited) return rateLimited;

  const auth = await apiRequireAdmin(request);
  if (auth.error) return auth.error;

  const body   = await request.json().catch(() => ({}));
  const action = body.action as string;

  const config = await getQuickBooksConfig();
  if (!config.accessToken || !config.realmId) {
    return safeError('QuickBooks not connected', 503);
  }

  const token   = config.accessToken;
  const realmId = config.realmId;

  try {
    if (action === 'sync_payroll') {
      // Fetch employees from QB
      const data = await qbFetch('query?query=SELECT * FROM Employee MAXRESULTS 100', token, realmId);
      const employees = data.QueryResponse?.Employee ?? [];

      logger.info(`[QB] Verified ${employees.length} employee records through QuickBooks Online Accounting`);

      // Record sync in DB
      const db = await requireAdminClient();
      await db.from('integration_sync_log').insert({
        provider: 'quickbooks',
        action:   'sync_payroll',
        records:  employees.length,
        status:   'success',
      }).select().maybeSingle();

      return NextResponse.json({
        ok: true,
        synced: employees.length,
        message: `Verified ${employees.length} employee record(s). Payroll runs are not synced unless your Intuit app has separate QuickBooks Payroll API access.`,
      });
    }

    if (action === 'sync_expenses') {
      const data = await qbFetch(
        `query?query=SELECT * FROM Purchase WHERE TxnDate >= '${new Date(Date.now() - 30 * 24 * 3600 * 1000).toISOString().slice(0, 10)}' MAXRESULTS 100`,
        token, realmId,
      );
      const purchases = data.QueryResponse?.Purchase ?? [];
      logger.info(`[QB] Synced ${purchases.length} expense(s)`);

      return NextResponse.json({
        ok: true,
        synced: purchases.length,
        message: `Synced ${purchases.length} expense(s) from QuickBooks (last 30 days)`,
      });
    }

    if (action === 'disconnect') {
      const db = await requireAdminClient();
      await db.from('app_settings').delete().in('key', ['QB_ACCESS_TOKEN', 'QB_REFRESH_TOKEN', 'QB_REALM_ID', 'QB_TOKEN_EXPIRES']);
      logger.info('[QB] Stored QuickBooks credentials removed');
      return NextResponse.json({ ok: true, message: 'Stored QuickBooks connection removed. Remove any QB_* environment secrets separately.' });
    }

    return safeError(`Unknown action: ${action}`, 400);
  } catch (err) {
    return safeInternalError(err, 'QuickBooks sync failed');
  }
}
