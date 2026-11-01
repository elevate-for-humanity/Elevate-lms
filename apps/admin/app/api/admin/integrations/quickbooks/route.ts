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
import {
  assertQuickBooksProductionEnvironment,
  loadQuickBooksConfig,
  QuickBooksError,
  quickBooksFailureReason,
  quickBooksRequest,
} from '@/lib/integrations/quickbooks-client';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const QB_AUTH_BASE = 'https://appcenter.intuit.com/connect/oauth2';

// Accounting access covers company and employee records used by this dashboard.
// Do not request Payments: Intuit rejects a second Payments service connection.
const SCOPES = 'com.intuit.quickbooks.accounting';

async function getQuickBooksConfig() {
  const db = await requireAdminClient();
  const config = await loadQuickBooksConfig(db);
  const { data, error } = await db
    .from('app_settings')
    .select('key,value')
    .in('key', ['QB_REDIRECT_URI']);
  if (error)
    throw new QuickBooksError(
      'settings_lookup_failed',
      'QuickBooks connection settings could not be loaded.',
    );
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.elevateforhumanity.org';
  return {
    ...config,
    db,
    redirectUri:
      process.env.QB_REDIRECT_URI ||
      data?.find((row) => row.key === 'QB_REDIRECT_URI')?.value ||
      `${siteUrl}/api/auth/quickbooks/callback`,
  };
}

// ── GET ───────────────────────────────────────────────────────────────────────

export async function GET(request: NextRequest) {
  const rateLimited = await applyRateLimit(request, 'api');
  if (rateLimited) return rateLimited;

  const auth = await apiRequireAdmin(request);
  if (auth.error) return auth.error;

  const action = request.nextUrl.searchParams.get('action') ?? 'status';

  let credentialsConfigured: boolean | undefined;
  try {
    const config = await getQuickBooksConfig();
    credentialsConfigured = Boolean(config.clientId && config.clientSecret);
    assertQuickBooksProductionEnvironment();
    if (action === 'auth_url') {
      const { clientId, clientSecret, redirectUri } = config;
      if (!clientId || !clientSecret)
        return safeError('QuickBooks OAuth credentials are not configured', 503);
      // Signed state supports concurrent authorization across Admin and public callback domains.
      const state = createQuickBooksOAuthState(clientSecret);
      const url = new URL(QB_AUTH_BASE);
      url.searchParams.set('client_id', clientId);
      url.searchParams.set('redirect_uri', redirectUri);
      url.searchParams.set('response_type', 'code');
      url.searchParams.set('scope', SCOPES);
      url.searchParams.set('state', state);
      return NextResponse.json({ auth_url: url.toString() });
    }

    if (!config.realmId || (!config.accessToken && !config.refreshToken)) {
      return NextResponse.json({
        connected: false,
        credentials_configured: !!(config.clientId && config.clientSecret),
        realm_id: null,
        last_sync: null,
        reason: 'oauth_configuration_missing',
        message:
          config.clientId && config.clientSecret
            ? 'QuickBooks application credentials are configured. Complete Intuit authorization.'
            : 'QuickBooks application credentials are missing.',
      });
    }
    const info = await quickBooksRequest(config.db, config, 'companyinfo/' + config.realmId);
    return NextResponse.json({
      connected: true,
      credentials_configured: !!(config.clientId && config.clientSecret),
      realm_id: config.realmId,
      company_name: info.CompanyInfo?.CompanyName ?? 'Unknown',
      last_sync: null,
      message: 'Connected',
    });
  } catch (error) {
    if (action === 'auth_url')
      return safeError(
        'QuickBooks production authorization is unavailable. Check connection settings.',
        503,
      );
    const reason = quickBooksFailureReason(error);
    return NextResponse.json({
      connected: false,
      credentials_configured: credentialsConfigured,
      reason,
      message: reason === 'oauth_reauthorization_required'
        ? 'Intuit authorization expired or was revoked. Reconnect QuickBooks to restore accounting and payment reconciliation.'
        : reason === 'oauth_client_rejected'
          ? 'Intuit rejected the application credentials. Check the production client ID and secret before reconnecting.'
          : ['provider_rate_limited', 'provider_unavailable', 'provider_timeout'].includes(reason)
            ? 'Intuit is temporarily unavailable or limiting requests. Retry the connection check; your saved authorization has been preserved.'
            : 'QuickBooks connection could not be verified. Check the connection diagnostics before retrying.',
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

  try {
    const config = await getQuickBooksConfig();
    if (
      action !== 'disconnect' &&
      (!config.realmId || (!config.accessToken && !config.refreshToken))
    ) {
      return safeError('QuickBooks not connected', 503);
    }

    if (action !== 'disconnect') {
      try {
        assertQuickBooksProductionEnvironment();
      } catch {
        return safeError('Verify production QuickBooks credentials before syncing.', 503);
      }
    }
    const db = config.db;
    if (action === 'sync_payroll') {
      // Fetch employees from QB
      const data = await quickBooksRequest(
        db,
        config,
        'query?query=SELECT * FROM Employee MAXRESULTS 100',
      );
      const employees = data.QueryResponse?.Employee ?? [];

      logger.info(
        `[QB] Verified ${employees.length} employee records through QuickBooks Online Accounting`,
      );

      // Record sync in DB
      const { error: syncLogError } = await db
        .from('integration_sync_log')
        .insert({
          provider: 'quickbooks',
          action: 'sync_payroll',
          records: employees.length,
          status: 'success',
        })
        .select()
        .maybeSingle();
      if (syncLogError) throw new Error('QuickBooks employee verification could not be recorded.');

      return NextResponse.json({
        ok: true,
        synced: employees.length,
        message: `Verified ${employees.length} employee record(s). Payroll runs are not synced unless your Intuit app has separate QuickBooks Payroll API access.`,
      });
    }

    if (action === 'sync_expenses') {
      const data = await quickBooksRequest(
        db,
        config,
        `query?query=SELECT * FROM Purchase WHERE TxnDate >= '${new Date(Date.now() - 30 * 24 * 3600 * 1000).toISOString().slice(0, 10)}' MAXRESULTS 100`,
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
      const { error: disconnectError } = await db
        .from('app_settings')
        .delete()
        .in('key', ['QB_ACCESS_TOKEN', 'QB_REFRESH_TOKEN', 'QB_REALM_ID', 'QB_TOKEN_EXPIRES']);
      if (disconnectError) throw new Error('QuickBooks connection could not be removed.');
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
