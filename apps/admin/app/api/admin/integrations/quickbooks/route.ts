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
import { createQuickBooksOAuthState } from '@/lib/integrations/quickbooks-oauth-state';
import { hydrateProcessEnv } from '@/lib/secrets';
import { assertQuickBooksProductionEnvironment, quickBooksFailureReason, quickBooksRequest, type QuickBooksConfig } from '@/lib/integrations/quickbooks-client';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const QB_AUTH_BASE = 'https://appcenter.intuit.com/connect/oauth2';

// Accounting access covers company and employee records used by this dashboard.
// Do not request Payments: Intuit rejects a second Payments service connection.
const SCOPES = 'com.intuit.quickbooks.accounting';

async function getQuickBooksConfig() {
  // QuickBooks application credentials are stored in the canonical runtime
  // secret store. Hydrate them before checking connection status or building
  // an authorization URL so the Admin integration page can reconnect an
  // expired company authorization without duplicating secrets in app_settings.
  await hydrateProcessEnv();
  const db = await requireAdminClient();
  const { data, error } = await db
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
  if (error) throw new Error('QuickBooks connection settings could not be loaded.');
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

// Use the canonical client: validate production, persist refreshes before use,
// and never rotate credentials for company permission failures.
async function qbFetch(path: string, config: QuickBooksConfig) {
  const db = await requireAdminClient();
  return quickBooksRequest(db, config, path);
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
    try { assertQuickBooksProductionEnvironment(); }
    catch { return safeError('Verify production QuickBooks credentials before reconnecting.',503); }
    const { clientId, clientSecret, redirectUri } = config;
    if (!clientId || !clientSecret) {
      return safeError('QuickBooks OAuth credentials are not configured', 503);
    }

    // Self-contained, signed state supports concurrent authorization attempts
    // across the admin and public callback domains without a shared mutable nonce.
    const state = createQuickBooksOAuthState(clientSecret);
    const url = new URL(QB_AUTH_BASE);
    url.searchParams.set('client_id', clientId);
    url.searchParams.set('redirect_uri', redirectUri);
    url.searchParams.set('response_type', 'code');
    url.searchParams.set('scope', SCOPES);
    url.searchParams.set('state', state);

    return NextResponse.json({ auth_url: url.toString() });
  }

  // status
  const config = await getQuickBooksConfig();
  try { assertQuickBooksProductionEnvironment(); }
  catch (error) { return NextResponse.json({ connected:false, credentials_configured:!!(config.clientId&&config.clientSecret), reason:quickBooksFailureReason(error), message:'QuickBooks production configuration requires verification.' }); }
  const connected = !!((config.accessToken || config.refreshToken) && config.realmId);
  if (!connected) {
    return NextResponse.json({
      connected: false,
      credentials_configured: !!(config.clientId && config.clientSecret),
      realm_id: null,
      last_sync: null,
      message:
        config.clientId && config.clientSecret
          ? 'QuickBooks application credentials are configured. Complete Intuit authorization.'
          : 'QuickBooks application credentials are missing.',
    });
  }

  try {
    const realmId = config.realmId;
    // Fetch company info to verify connection
    const info = await qbFetch('companyinfo/' + realmId, config);
    return NextResponse.json({
      connected: true,
      credentials_configured: true,
      realm_id: realmId,
      company_name: info.CompanyInfo?.CompanyName ?? 'Unknown',
      last_sync: null,
      message: 'Connected',
    });
  } catch (error) {
    return NextResponse.json({
      connected: false,
      credentials_configured: !!(config.clientId && config.clientSecret),
      reason: quickBooksFailureReason(error),
      error: 'QuickBooks authorization could not be verified or saved. Reconnect QuickBooks.',
    });
  }
}

// ── POST ──────────────────────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  const rateLimited = await applyRateLimit(request, 'api');
  if (rateLimited) return rateLimited;

  const auth = await apiRequireAdmin(request);
  if (auth.error) return auth.error;

  const body = await request.json().catch(() => ({}));
  const action = body.action as string;

  const config = await getQuickBooksConfig();
  if ((!config.accessToken && !config.refreshToken) || !config.realmId) {
    return safeError('QuickBooks not connected', 503);
  }

  if(action!=='disconnect'){
    try { assertQuickBooksProductionEnvironment(); }
    catch { return safeError('Verify production QuickBooks credentials before syncing.',503); }
  }

  try {
    if (action === 'sync_payroll') {
      // Fetch employees from QB
      const data = await qbFetch(
        'query?query=SELECT * FROM Employee MAXRESULTS 100',
        config,
      );
      const employees = data.QueryResponse?.Employee ?? [];

      logger.info(
        `[QB] Verified ${employees.length} employee records through QuickBooks Online Accounting`,
      );

      // Record sync in DB
      const db = await requireAdminClient();
      await db
        .from('integration_sync_log')
        .insert({
          provider: 'quickbooks',
          action: 'sync_payroll',
          records: employees.length,
          status: 'success',
        })
        .select()
        .maybeSingle();

      return NextResponse.json({
        ok: true,
        synced: employees.length,
        message: `Verified ${employees.length} employee record(s). Payroll runs are not synced unless your Intuit app has separate QuickBooks Payroll API access.`,
      });
    }

    if (action === 'sync_expenses') {
      const data = await qbFetch(
        `query?query=SELECT * FROM Purchase WHERE TxnDate >= '${new Date(Date.now() - 30 * 24 * 3600 * 1000).toISOString().slice(0, 10)}' MAXRESULTS 100`,
        config,
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
      await db
        .from('app_settings')
        .delete()
        .in('key', ['QB_ACCESS_TOKEN', 'QB_REFRESH_TOKEN', 'QB_REALM_ID', 'QB_TOKEN_EXPIRES']);
      logger.info('[QB] Stored QuickBooks credentials removed');
      return NextResponse.json({
        ok: true,
        message:
          'Stored QuickBooks connection removed. Remove any QB_* environment secrets separately.',
      });
    }

    return safeError(`Unknown action: ${action}`, 400);
  } catch (err) {
    return safeInternalError(err, 'QuickBooks sync failed');
  }
}
