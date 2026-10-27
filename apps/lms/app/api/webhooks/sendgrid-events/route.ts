// pre-auth-registry: exempt - SendGrid signs the raw webhook payload.
import { createVerify } from 'node:crypto';
import { NextResponse } from 'next/server';
import { getAdminClient } from '@/lib/supabase/admin';
import { logger } from '@/lib/logger';

export const runtime = 'nodejs';

const STATUS_PRIORITY: Record<string, number> = {
  queued: 0,
  accepted: 1,
  processed: 2,
  deferred: 2,
  delivered: 3,
  open: 4,
  click: 5,
  bounce: 6,
  dropped: 6,
  spamreport: 6,
  unsubscribe: 6,
};

function verifySignature(rawBody: string, timestamp: string, signature: string, publicKey: string) {
  const verifier = createVerify('sha256');
  verifier.update(timestamp + rawBody);
  verifier.end();
  return verifier.verify(publicKey.replace(/\\n/g, '\n'), signature, 'base64');
}

function normalizeStatus(event: string) {
  if (event === 'open') return 'opened';
  if (event === 'click') return 'clicked';
  if (event === 'bounce') return 'bounced';
  if (event === 'drop') return 'dropped';
  return event;
}

export async function POST(request: Request) {
  const publicKey = process.env.SENDGRID_EVENT_WEBHOOK_PUBLIC_KEY;
  if (!publicKey) {
    logger.error('[SendGrid events] public key is not configured');
    return NextResponse.json({ error: 'Webhook unavailable' }, { status: 503 });
  }

  const timestamp = request.headers.get('x-twilio-email-event-webhook-timestamp') || '';
  const signature = request.headers.get('x-twilio-email-event-webhook-signature') || '';
  const rawBody = await request.text();

  if (!timestamp || !signature || !verifySignature(rawBody, timestamp, signature, publicKey)) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
  }

  let events: any[];
  try {
    const parsed = JSON.parse(rawBody);
    events = Array.isArray(parsed) ? parsed : [];
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const db = await getAdminClient();
  if (!db) return NextResponse.json({ error: 'Database unavailable' }, { status: 503 });

  for (const event of events.slice(0, 1000)) {
    const logId = String(event.elevate_email_log_id || '');
    if (!/^[0-9a-f-]{36}$/i.test(logId)) continue;

    const providerEventId = String(event.sg_event_id || '');
    const providerMessageId = String(event.sg_message_id || '');
    const eventName = String(event.event || '').toLowerCase();
    const status = normalizeStatus(eventName);
    const occurredAt = event.timestamp
      ? new Date(Number(event.timestamp) * 1000).toISOString()
      : new Date().toISOString();

    await db.from('email_delivery_events').upsert({
      email_log_id: logId,
      provider: 'sendgrid',
      provider_event_id: providerEventId || null,
      provider_message_id: providerMessageId || null,
      event_type: eventName,
      occurred_at: occurredAt,
      payload: {
        response: event.response || null,
        reason: event.reason || null,
        url: event.url || null,
        useragent: event.useragent || null,
      },
    }, { onConflict: 'provider_event_id', ignoreDuplicates: true });

    const { data: current } = await db.from('email_logs').select('status').eq('id', logId).maybeSingle();
    const currentKey = current?.status === 'opened' ? 'open' : current?.status === 'clicked' ? 'click' : current?.status;
    if ((STATUS_PRIORITY[eventName] ?? 0) >= (STATUS_PRIORITY[currentKey] ?? 0)) {
      await db.from('email_logs').update({
        status,
        message_id: providerMessageId || undefined,
        updated_at: new Date().toISOString(),
        error_message: ['bounce', 'dropped'].includes(eventName) ? String(event.reason || event.response || 'Delivery failed') : null,
      }).eq('id', logId);
    }
  }

  return NextResponse.json({ ok: true });
}
