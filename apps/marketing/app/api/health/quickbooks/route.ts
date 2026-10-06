import { NextResponse } from 'next/server';
import { hydrateProcessEnv } from '@/lib/secrets';
import { requireAdminClient } from '@/lib/supabase/admin';
import { loadQuickBooksConfig, quickBooksRequest } from '@/lib/integrations/quickbooks-client';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  await hydrateProcessEnv();
  const db = await requireAdminClient();
  try {
    const config = await loadQuickBooksConfig(db);
    const configured = Boolean(
      config.clientId &&
      config.clientSecret &&
      config.accessToken &&
      config.refreshToken &&
      config.realmId,
    );
    const webhookVerifierConfigured = Boolean(process.env.QB_WEBHOOK_VERIFIER_TOKEN);
    if (!configured || !webhookVerifierConfigured) {
      return NextResponse.json(
        {
          service: 'quickbooks',
          ready: false,
          configured,
          webhookVerifierConfigured,
          connected: false,
        },
        { status: 503, headers: { 'Cache-Control': 'no-store' } },
      );
    }
    await quickBooksRequest(db, config, `companyinfo/${config.realmId}`);
    return NextResponse.json(
      {
        service: 'quickbooks',
        ready: true,
        configured: true,
        webhookVerifierConfigured: true,
        connected: true,
      },
      { headers: { 'Cache-Control': 'no-store' } },
    );
  } catch {
    return NextResponse.json(
      {
        service: 'quickbooks',
        ready: false,
        connected: false,
      },
      { status: 503, headers: { 'Cache-Control': 'no-store' } },
    );
  }
}
