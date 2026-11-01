import { NextResponse } from 'next/server';
import { hydrateProcessEnv } from '@/lib/secrets';
import { requireAdminClient } from '@/lib/supabase/admin';
import { loadQuickBooksConfig, quickBooksRequest, quickBooksFailureReason } from '@/lib/integrations/quickbooks-client';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  try {
    await hydrateProcessEnv();
    const db = await requireAdminClient();
    const config = await loadQuickBooksConfig(db);
    const configured = Boolean(
      config.clientId &&
      config.clientSecret &&
      (config.accessToken || config.refreshToken) &&
      config.realmId,
    );
    const webhookVerifierConfigured = Boolean(process.env.QB_WEBHOOK_VERIFIER_TOKEN || process.env.QUICKBOOKS_WEBHOOK_VERIFIER_TOKEN);
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
    const reason = quickBooksFailureReason(error);
    console.warn('[quickbooks-health]', { reason });
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
