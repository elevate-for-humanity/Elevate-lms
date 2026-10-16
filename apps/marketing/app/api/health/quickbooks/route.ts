import { NextResponse } from 'next/server';
import { hydrateProcessEnv } from '@/lib/secrets';
import { requireAdminClient } from '@/lib/supabase/admin';
import { loadQuickBooksConfig, quickBooksRequest } from '@/lib/integrations/quickbooks-client';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  await hydrateProcessEnv();
  try {
    const db = await requireAdminClient();
    const config = await loadQuickBooksConfig(db);
    const configured = Boolean(
      config.clientId &&
      config.clientSecret &&
      config.accessToken &&
      config.refreshToken &&
      config.realmId,
    );
    const webhookVerifierConfigured = Boolean(process.env.QB_WEBHOOK_VERIFIER_TOKEN);
    if (!configured) {
      return NextResponse.json(
        {
          service: 'quickbooks', ready: false, configured: false,
          webhookVerifierConfigured, connected: false, reason: 'oauth_configuration_missing',
        },
        { status: 503, headers: { 'Cache-Control': 'no-store' } },
      );
    }
    await quickBooksRequest(db, config, `companyinfo/${config.realmId}`);
    return NextResponse.json(
      {
        service: 'quickbooks',
        ready: webhookVerifierConfigured,
        configured: true,
        webhookVerifierConfigured,
        connected: true,
        ...(webhookVerifierConfigured ? {} : { reason: 'webhook_verifier_missing' }),
      },
      { status: webhookVerifierConfigured ? 200 : 503, headers: { 'Cache-Control': 'no-store' } },
    );
  } catch (error) {
    // Report non-sensitive failure categories for production diagnosis.
    // Never expose OAuth tokens, account data or upstream response bodies.
    const message = error instanceof Error ? error.message : '';
    const reason = message.includes('authorization expired') ? 'oauth_refresh_failed'
      : message.includes('not connected') ? 'oauth_not_connected'
      : /^QuickBooks request failed \\([0-9]{3}\\)/.test(message) ? 'upstream_api_failure'
      : 'configuration_or_dependency_failure';
    return NextResponse.json(
      {
        service: 'quickbooks',
        ready: false,
        connected: false,
        reason,
      },
      { status: 503, headers: { 'Cache-Control': 'no-store' } },
    );
  }
}
