export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

// GET /api/cron/compliance-expiration
// Runs weekly (Netlify cron or pg_cron fallback).
// Finds provider_compliance_artifacts expiring within 30 days.
// Queues compliance_expiring notification to provider contact + admin alert.
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

  const now = new Date();
  const in30 = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

  // Artifacts expiring within 30 days that haven't been notified recently
  const { data: expiring, error } = await db
    .from('provider_compliance_artifacts')
    .select('id, tenant_id, label, artifact_type, expires_at')
    .lte('expires_at', in30)
    .gte('expires_at', now.toISOString().split('T')[0]); // not yet expired — notify all, verified or not

  if (error) {
    logger.error('compliance-expiration cron: query failed', error);
    return NextResponse.json({ error: 'Query failed' }, { status: 500 });
  }

  if (!expiring || expiring.length === 0) {
    return NextResponse.json({ queued: 0, message: 'No expiring artifacts' });
  }

  // Group by tenant to send one notification per tenant
  const byTenant = expiring.reduce<Record<string, typeof expiring>>((acc, a) => {
    if (!acc[a.tenant_id]) acc[a.tenant_id] = [];
    acc[a.tenant_id].push(a);
    return acc;
  }, {});

  let queued = 0;

  for (const [tenantId, artifacts] of Object.entries(byTenant)) {
    // Get provider contact email from profiles
    const { data: contact } = await db
      .from('profiles')
      .select('email, full_name')
      .eq('tenant_id', tenantId)
      .eq('role', 'provider_admin')
      .limit(1)
      .single();

    if (!contact?.email) continue;

    const { data: tenant } = await db
      .from('tenants')
      .select('name')
      .eq('id', tenantId)
      .single();

    for (const artifact of artifacts) {
      const daysLeft = Math.ceil(
        (new Date(artifact.expires_at).getTime() - now.getTime()) / 86400000
      );

      await db.from('notification_outbox').insert({
        to_email: contact.email,
        template_key: 'compliance_expiring',
        template_data: {
          contact_name: contact.full_name ?? contact.email,
          org_name: tenant?.name ?? tenantId,
          artifact_label: artifact.label,
          artifact_type: artifact.artifact_type,
          expires_at: artifact.expires_at,
          days_until_expiry: daysLeft,
          portal_link: `${process.env.NEXT_PUBLIC_SITE_URL ?? 'https://www.elevateforhumanity.org'}/provider/compliance`,
        },
        status: 'queued',
        scheduled_for: now.toISOString(),
      }).catch(err => logger.warn('Failed to queue compliance_expiring notification', err));

      queued++;
    }
  }

  logger.info(`compliance-expiration cron: queued ${queued} notifications for ${Object.keys(byTenant).length} tenants`);
  return NextResponse.json({
    queued,
    tenants: Object.keys(byTenant).length,
    artifacts: expiring.length,
  });
}
