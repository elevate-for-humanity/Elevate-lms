// GET /api/cron/onboarding-reminder
// Runs weekly. Finds providers with incomplete onboarding steps
// who have been inactive for 7+ days. Queues a reminder email.
// Protected by CRON_SECRET.

import { NextResponse } from 'next/server';
import { requireAdminClient } from '@/lib/supabase/admin';
import { logger } from '@/lib/logger';
import { hydrateProcessEnv } from '@/lib/secrets';
import { PLATFORM_DEFAULTS } from '@/lib/config/platform-config';

export const runtime = 'nodejs';
export const maxDuration = 60;
export const dynamic = 'force-dynamic';

const COMPLETE_PROVIDER_STATUSES = '(complete,completed,approved,verified)';

export async function GET(request: Request) {
  await hydrateProcessEnv();
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const db = await requireAdminClient();
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

  const { data: incomplete, error } = await db
    .from('provider_onboarding_steps')
    .select('tenant_id')
    .is('completed_at', null)
    .not('status', 'in', COMPLETE_PROVIDER_STATUSES);

  if (error) {
    logger.error('onboarding-reminder cron: query failed', error);
    return NextResponse.json({ error: 'Query failed' }, { status: 500 });
  }
  if (!incomplete?.length) return NextResponse.json({ queued: 0, message: 'All providers fully onboarded' });

  const tenantIds = [...new Set(incomplete.map((row) => row.tenant_id).filter(Boolean))];
  let queued = 0;

  for (const tenantId of tenantIds) {
    const { data: contact } = await db
      .from('profiles')
      .select('id, email, full_name, updated_at')
      .eq('tenant_id', tenantId)
      .eq('role', 'provider_admin')
      .limit(1)
      .maybeSingle();
    if (!contact?.email) continue;
    if (contact.updated_at && contact.updated_at > sevenDaysAgo) continue;

    const { data: tenant } = await db.from('tenants').select('name').eq('id', tenantId).maybeSingle();
    const { data: nextStep } = await db
      .from('provider_onboarding_steps')
      .select('step')
      .eq('tenant_id', tenantId)
      .is('completed_at', null)
      .not('status', 'in', COMPLETE_PROVIDER_STATUSES)
      .order('created_at')
      .limit(1)
      .maybeSingle();

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? PLATFORM_DEFAULTS.siteUrl;
    const nextStepHref =
      nextStep?.step === 'profile_complete'
        ? `${siteUrl}/provider/settings`
        : nextStep?.step === 'mou_signed'
          ? `${siteUrl}/provider/compliance`
          : nextStep?.step?.includes('program')
            ? `${siteUrl}/provider/programs`
            : `${siteUrl}/provider/dashboard`;

    const { error: queueError } = await db.from('notification_outbox').insert({
      to_email: contact.email,
      template_key: 'inquiry_received',
      template_data: {
        name: contact.full_name ?? contact.email,
        inquiry_type: 'onboarding reminder',
        site_url: nextStepHref,
        org_name: tenant?.name ?? tenantId,
        next_step: nextStep?.step?.replace(/_/g, ' ') ?? 'complete onboarding',
      },
      status: 'queued',
      scheduled_for: new Date().toISOString(),
    });

    if (queueError) {
      logger.warn('Failed to queue onboarding reminder', { tenantId, error: queueError.message });
      continue;
    }
    queued++;
  }

  logger.info(`onboarding-reminder cron: queued ${queued} reminders`);
  return NextResponse.json({ queued, tenants: tenantIds.length });
}
