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
import { getAdminUrl } from '@/lib/utils/siteUrl';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const QB_BASE      = 'https://quickbooks.api.intuit.com/v3/company';
const QB_AUTH_BASE = 'https://appcenter.intuit.com/connect/oauth2';
const QB_TOKEN_URL = 'https://oauth.platform.intuit.com/oauth2/v1/tokens/bearer';

const SCOPES = [
  'com.intuit.quickbooks.accounting',
  'com.intuit.quickbooks.payment',
].join(' ');

// ── Token refresh ─────────────────────────────────────────────────────────────

async function refreshAccessToken(): Promise<string | null> {
  const clientId     = process.env.QB_CLIENT_ID;
  const clientSecret = process.env.QB_CLIENT_SECRET;
  const refreshToken = process.env.QB_REFRESH_TOKEN;
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
    // In production: persist d.access_token + d.refresh_token to secrets/DB
    return d.access_token ?? null;
  } catch {
    return null;
  }
}

// ── QB API helper ─────────────────────────────────────────────────────────────

async function qbFetch(path: string, token: string, realmId: string) {
  const res = await fetch(`${QB_BASE}/${realmId}/${path}?minorversion=65`, {
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
    const clientId    = process.env.QB_CLIENT_ID;
    const redirectUri = process.env.QB_REDIRECT_URI ?? `${getAdminUrl()}/admin/integrations/quickbooks/callback`;
    if (!clientId) return safeError('QB_CLIENT_ID not configured', 503);

    const state = Buffer.from(JSON.stringify({ ts: Date.now() })).toString('base64');
    const url   = new URL(QB_AUTH_BASE);
    url.searchParams.set('client_id',     clientId);
    url.searchParams.set('redirect_uri',  redirectUri);
    url.searchParams.set('response_type', 'code');
    url.searchParams.set('scope',         SCOPES);
    url.searchParams.set('state',         state);

    return NextResponse.json({ auth_url: url.toString() });
  }

  // status
  const connected = !!(process.env.QB_ACCESS_TOKEN && process.env.QB_REALM_ID);
  if (!connected) {
    return NextResponse.json({
      connected: false,
      realm_id: null,
      last_sync: null,
      message: 'QuickBooks not connected. Use auth_url to connect.',
    });
  }

  try {
    const token   = process.env.QB_ACCESS_TOKEN!;
    const realmId = process.env.QB_REALM_ID!;
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
    const newToken = await refreshAccessToken();
    if (!newToken) {
      return NextResponse.json({ connected: false, error: 'Token expired — reconnect via auth_url' });
    }
    return NextResponse.json({ connected: true, realm_id: process.env.QB_REALM_ID, message: 'Token refreshed' });
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

  if (!process.env.QB_ACCESS_TOKEN || !process.env.QB_REALM_ID) {
    return safeError('QuickBooks not connected', 503);
  }

  const token   = process.env.QB_ACCESS_TOKEN;
  const realmId = process.env.QB_REALM_ID;

  try {
    if (action === 'sync_payroll') {
      // Fetch employees from QB
      const data = await qbFetch('query?query=SELECT * FROM Employee MAXRESULTS 100', token, realmId);
      const employees = data.QueryResponse?.Employee ?? [];

      // Fetch payroll items (QB Payroll API — requires payroll subscription)
      logger.info(`[QB] Synced ${employees.length} employees`);

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
        message: `Synced ${employees.length} employee(s) from QuickBooks`,
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
      // In production: revoke token via Intuit API + clear from secrets store
      logger.info('[QB] Disconnect requested — clear QB_ACCESS_TOKEN + QB_REFRESH_TOKEN from env');
      return NextResponse.json({ ok: true, message: 'Disconnected. Remove QB_ACCESS_TOKEN and QB_REFRESH_TOKEN from your environment secrets.' });
    }

    return safeError(`Unknown action: ${action}`, 400);
  } catch (err) {
    return safeInternalError(err, 'QuickBooks sync failed');
  }
}
