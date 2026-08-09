/**
 * POST /api/webhooks/domainee
 * Receives Domainee domain lifecycle events (verified, failed, etc.).
 *
 * Signature: HMAC-SHA256(secret, raw_body) in the x-domainee-signature header.
 * The raw request body MUST be used for verification — Next.js auto-parses JSON,
 * so we read the raw stream via request.text() and verify before trusting it.
 *
 * Idempotency: webhook_events_processed (23505 = duplicate) before mutating.
 */
import { NextRequest, NextResponse } from 'next/server';
import { hydrateProcessEnv } from '@/lib/secrets';
import { requireAdminClient } from '@/lib/supabase/admin';
import { verifyDomaineeWebhook, getDomaineeWebhookSecret } from '@/lib/domainee/client';
import type { DomaineeWebhookEvent } from '@/lib/domainee/types';
import { logger } from '@/lib/logger';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  await hydrateProcessEnv().catch(() => {});

  const secret = getDomaineeWebhookSecret();
  if (!secret) {
    logger.error('DOMAINEE_WEBHOOK_SECRET not configured');
    return NextResponse.json({ error: 'Webhook secret not configured' }, { status: 500 });
  }

  const signature = request.headers.get('x-domainee-signature') ?? '';
  // Read raw body — do NOT use request.json() before verifying.
  const rawBody = await request.text();

  if (!verifyDomaineeWebhook(rawBody, signature, secret)) {
    logger.warn('domainee webhook signature verification failed');
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
  }

  const event = JSON.parse(rawBody) as DomaineeWebhookEvent;
  logger.info('domainee webhook received', { type: event.type, id: event.id });

  const db = await requireAdminClient();
  if (!db) {
    logger.error('admin client unavailable for domainee webhook');
    return NextResponse.json({ error: 'Admin client failed' }, { status: 500 });
  }

  // Idempotency: record before mutating (fail-closed).
  try {
    const { error: idemErr } = await db.from('webhook_events_processed').insert({
      provider: 'domainee',
      event_id: event.id,
      event_type: event.type,
      status: 'processed',
      metadata: { data: event.data },
    });
    if (idemErr) {
      if (idemErr.code === '23505') {
        logger.info('domainee event already processed', { eventId: event.id });
        return NextResponse.json({ received: true, duplicate: true });
      }
      logger.error('domainee idempotency insert failed', { error: idemErr.message });
      return NextResponse.json({ error: 'Idempotency check failed' }, { status: 500 });
    }
  } catch (err) {
    logger.error('domainee idempotency error', { error: String(err) });
    return NextResponse.json({ error: 'Idempotency error' }, { status: 500 });
  }

  // The domain object is in event.data (verified from real API shape).
  const domainId =
    (event.data.id as string | undefined) ?? (event.data.domainId as string | undefined);
  if (!domainId) {
    logger.warn('domainee webhook missing domain id in data', { type: event.type });
    return NextResponse.json({ received: true });
  }

  const statusMap: Record<string, string> = {
    'domain.created': 'pending',
    'domain.verified': 'active',
    'domain.failed': 'failed',
    'domain.expired': 'failed',
    'domain.deleted': 'deleted',
    'domain.monitor_updated': undefined as unknown as string, // update monitor fields only
  };

  const newStatus = statusMap[event.type];
  const update: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (newStatus) update.status = newStatus;
  if (typeof event.data.monitorStatus === 'string')
    update.monitor_status = event.data.monitorStatus;
  if (typeof event.data.pointsToEdge === 'boolean')
    update.points_to_edge = event.data.pointsToEdge;
  if (Array.isArray(event.data.dnsRecords)) update.dns_records = event.data.dnsRecords;

  const { error: updErr } = await db
    .from('website_domains')
    .update(update)
    .eq('domainee_domain_id', domainId);
  if (updErr) {
    logger.error('domainee webhook db update failed', {
      domainId,
      error: updErr.message,
    });
    return NextResponse.json({ error: 'DB update failed' }, { status: 500 });
  }

  logger.info('domainee webhook processed', { type: event.type, domainId });
  return NextResponse.json({ received: true, processed: true });
}
