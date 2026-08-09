/** Signed, idempotent Domainee lifecycle webhook. */
import { NextRequest, NextResponse } from 'next/server';
import { hydrateProcessEnv } from '@/lib/secrets';
import { requireAdminClient } from '@/lib/supabase/admin';
import { getDomaineeWebhookSecret, verifyDomaineeWebhook } from '@/lib/domainee/client';
import type { DomaineeWebhookEvent } from '@/lib/domainee/types';
import { logger } from '@/lib/logger';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  await hydrateProcessEnv().catch(() => undefined);
  const secret = getDomaineeWebhookSecret();
  if (!secret) {
    logger.error('DOMAINEE_WEBHOOK_SECRET not configured');
    return NextResponse.json({ error: 'Webhook secret not configured' }, { status: 500 });
  }

  const signature = request.headers.get('x-domainee-signature') ?? '';
  const rawBody = await request.text();
  if (!verifyDomaineeWebhook(rawBody, signature, secret)) {
    logger.warn('domainee webhook signature verification failed');
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
  }

  let event: DomaineeWebhookEvent;
  try { event = JSON.parse(rawBody) as DomaineeWebhookEvent; }
  catch { return NextResponse.json({ error: 'Invalid JSON payload' }, { status: 400 }); }

  const db = await requireAdminClient();
  if (!db) return NextResponse.json({ error: 'Admin client unavailable' }, { status: 500 });

  const { error: idemErr } = await db.from('webhook_events_processed').insert({
    provider: 'domainee',
    event_id: event.id,
    event_type: event.type,
    status: 'processed',
    metadata: { data: event.data },
  });
  if (idemErr) {
    if (idemErr.code === '23505') return NextResponse.json({ received: true, duplicate: true });
    logger.error('domainee idempotency insert failed', undefined, { error: idemErr.message, eventId: event.id });
    return NextResponse.json({ error: 'Idempotency check failed' }, { status: 500 });
  }

  const purchaseId = (event.data.id as string | undefined) ?? (event.data.purchaseId as string | undefined);
  if (event.type === 'domain_purchase.completed' || event.type === 'domain_purchase.failed') {
    if (!purchaseId) return NextResponse.json({ received: true, ignored: true });
    const update: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
      status: event.type === 'domain_purchase.completed' ? 'active' : 'failed',
    };
    if (typeof event.data.connectedDomainId === 'string') update.domainee_domain_id = event.data.connectedDomainId;
    if (typeof event.data.totalCents === 'number') update.provider_cost_cents = event.data.totalCents;
    if (event.type === 'domain_purchase.failed') update.error = String(event.data.error ?? event.data.message ?? 'Domain purchase failed');
    const { error } = await db.from('website_domains').update(update).eq('domainee_purchase_id', purchaseId);
    if (error) {
      logger.error('domainee purchase webhook update failed', undefined, { purchaseId, error: error.message });
      return NextResponse.json({ error: 'DB update failed' }, { status: 500 });
    }
    return NextResponse.json({ received: true, processed: true });
  }

  const domainId = (event.data.id as string | undefined) ?? (event.data.domainId as string | undefined);
  if (!domainId) return NextResponse.json({ received: true, ignored: true });

  const statusMap: Partial<Record<DomaineeWebhookEvent['type'], string>> = {
    'domain.created': 'pending',
    'domain.verified': 'active',
    'domain.failed': 'failed',
    'domain.expired': 'failed',
    'domain.deleted': 'deleted',
  };
  const update: Record<string, unknown> = { updated_at: new Date().toISOString() };
  const mapped = statusMap[event.type];
  if (mapped) update.status = mapped;
  if (typeof event.data.monitorStatus === 'string') update.monitor_status = event.data.monitorStatus;
  if (typeof event.data.pointsToEdge === 'boolean') update.points_to_edge = event.data.pointsToEdge;
  if (Array.isArray(event.data.dnsRecords)) update.dns_records = event.data.dnsRecords;

  const { error } = await db.from('website_domains').update(update).eq('domainee_domain_id', domainId);
  if (error) {
    logger.error('domainee domain webhook update failed', undefined, { domainId, error: error.message });
    return NextResponse.json({ error: 'DB update failed' }, { status: 500 });
  }
  return NextResponse.json({ received: true, processed: true });
}
