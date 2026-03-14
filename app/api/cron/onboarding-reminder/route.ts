export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

// GET /api/cron/onboarding-reminder
// Runs weekly. Finds providers with incomplete onboarding steps
// who have been inactive for 7+ days. Queues a reminder email.
// Protected by CRON_SECRET.

import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { logger } from '@/lib/logger';

export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const db = createAdminClient();
  if (!db) return NextResponse.json({ error: 'Service unavailable' }, { status: 503 });

  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

  // Tenants with at least one incomplete onboarding step
  const { data: incomplete, error } = await db
    .from('provider_onboarding_steps')
    .select('tenant_id')
    .eq('completed', false);

  if (error) {
    logger.error('onboarding-reminder cron: query failed', error);
    return NextResponse.json({ error: 'Query failed' }, { status: 500 });
  }

  if (!incomplete || incomplete.length === 0) {
    return NextResponse.json({ queued: 0, message: 'All providers fully onboarded' });
  }

  const tenantIds = [...new Set(incomplete.map(r => r.tenant_id))];
  let queued = 0;

  for (const tenantId of tenantIds) {
    // Only remind if the provider admin hasn't logged in recently
    const { data: contact } = await db
      .from('profiles')
      .select('id, email, full_name, updated_at')
      .eq('tenant_id', tenantId)
      .eq('role', 'provider_admin')
      .limit(1)
      .single();

    if (!contact?.email) continue;

    // Skip if they were active in the last 7 days (updated_at is a proxy for activity)
    if (contact.updated_at && contact.updated_at > sevenDaysAgo) continue;

    const { data: tenant } = await db
      .from('tenants')
      .select('name')
      .eq('id', tenantId)
      .single();

    // Get the next incomplete step
    const { data: nextStep } = await db
      .from('provider_onboarding_steps')
      .select('step')
      .eq('tenant_id', tenantId)
      .eq('completed', false)
      .order('created_at')
      .limit(1)
      .single();

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://www.elevateforhumanity.org';
    const nextStepHref = nextStep?.step === 'profile_complete' ? `${siteUrl}/provider/settings`
      : nextStep?.step === 'mou_signed' ? `${siteUrl}/provider/compliance`
      : nextStep?.step?.includes('program') ? `${siteUrl}/provider/programs`
      : `${siteUrl}/provider/dashboard`;

    await db.from('notification_outbox').insert({
      to_email: contact.email,
      template_key: 'inquiry_received', // reuse generic until onboarding_reminder template exists
      template_data: {
        name: contact.full_name ?? contact.email,
        inquiry_type: 'onboarding reminder',
        site_url: nextStepHref,
        org_name: tenant?.name ?? tenantId,
        next_step: nextStep?.step?.replace(/_/g, ' ') ?? 'complete onboarding',
      },
      status: 'queued',
      scheduled_for: new Date().toISOString(),
    }).catch(err => logger.warn('Failed to queue onboarding reminder', err));

    queued++;
  }

  logger.info(`onboarding-reminder cron: queued ${queued} reminders`);
  return NextResponse.json({ queued, tenants: tenantIds.length });
}
