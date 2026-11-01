// pre-auth-registry: exempt - SendGrid signs the raw webhook payload.
import { createPublicKey, createVerify } from 'node:crypto';
import { NextResponse } from 'next/server';
import { getAdminClient } from '@/lib/supabase/admin';
import { hydrateProcessEnv } from '@/lib/secrets';

export const runtime = 'nodejs';
const knownEvents = new Set(['processed', 'deferred', 'delivered', 'open', 'click', 'bounce', 'dropped', 'spamreport', 'unsubscribe']);

export async function POST(request: Request) {
  await hydrateProcessEnv();
  const key = process.env.SENDGRID_EVENT_WEBHOOK_PUBLIC_KEY;
  if (!key) return NextResponse.json({ error: 'Webhook unavailable' }, { status: 503 });
  const timestamp = request.headers.get('x-twilio-email-event-webhook-timestamp') || '';
  const signature = request.headers.get('x-twilio-email-event-webhook-signature') || '';
  const raw = await request.text();
  let verified = false;
  try {
    const verifier = createVerify('sha256');
    verifier.update(timestamp + raw); verifier.end();
    const verificationKey = key.includes('-----BEGIN PUBLIC KEY-----') ? key.replace(/\\n/g, '\n')
      : createPublicKey({key: Buffer.from(key, 'base64'), format: 'der', type: 'spki'});
    verified = Boolean(timestamp && signature && verifier.verify(verificationKey, signature, 'base64'));
  } catch { /* Invalid keys/signatures fail closed. */ }
  if (!verified) return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
  let events: unknown;
  try { events = JSON.parse(raw); } catch { return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }); }
  if (!Array.isArray(events) || events.length > 1000) return NextResponse.json({ error: 'Invalid event batch' }, { status: 400 });
  const db = await getAdminClient();
  if (!db) return NextResponse.json({ error: 'Database unavailable' }, { status: 503 });
  let recorded = 0;
  for (const event of events) {
    if (!event || typeof event !== 'object') return NextResponse.json({ error: 'Invalid event' }, { status: 400 });
    const logId = String(event.elevate_email_log_id || '');
    // Other SendGrid senders may share this account; only mutate our tracked sends.
    if (!logId) continue;
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(logId)) return NextResponse.json({ error: 'Invalid tracking ID' }, { status: 400 });
    if (!knownEvents.has(event.event)) continue;
    const occurred = Number(event.timestamp) * 1000;
    if (!Number.isFinite(occurred) || occurred <= 0 || typeof event.sg_event_id !== 'string' || !event.sg_event_id) return NextResponse.json({ error: 'Invalid event evidence' }, { status: 400 });
    const { data, error } = await db.rpc('record_sendgrid_delivery_event', {
      p_log_id: logId, p_event_id: event.sg_event_id,
      p_message_id: typeof event.sg_message_id === 'string' ? event.sg_message_id : null,
      p_event: event.event, p_occurred_at: new Date(occurred).toISOString(),
    });
    // Missing send logs can be a race with the transport. Retry instead of losing delivery evidence.
    if (error || data !== true) return NextResponse.json({ error: 'Delivery receipt could not be saved' }, { status: 503 });
    recorded++;
  }
  return NextResponse.json({ ok: true, recorded });
}
