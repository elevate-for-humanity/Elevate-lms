// PUBLIC ROUTE: inbound JotForm webhook (authenticated by secret token in URL)
import { NextRequest, NextResponse } from 'next/server';
import { timingSafeEqual } from 'crypto';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { requireAdminClient } from '@/lib/supabase/admin';
import { logger } from '@/lib/logger';
import { getSecret } from '@/lib/secrets';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;



/**
 * Timing-safe equality for shared-secret comparison.
 * Returns false on length mismatch without leaking timing.
 */
function safeSecretEqual(a: string, b: string): boolean {
  const ab = Buffer.from(a, 'utf8');
  const bb = Buffer.from(b, 'utf8');
  if (ab.length !== bb.length) return false;
  return timingSafeEqual(ab, bb);
}

/**
 * POST /api/webhooks/jotform?secret=<JOTFORM_WEBHOOK_SECRET>
 *
 * Inbound webhook from JotForm.  JotForm does not support HMAC signing;
 * instead a shared secret is embedded in the webhook URL registered in the
 * JotForm dashboard.  The handler rejects any request that omits or
 * mismatches the secret.
 *
 * Setup in JotForm:
 *   Form Settings → Integrations → Webhooks
 *   URL: https://www.elevateforhumanity.org/api/webhooks/jotform?secret=<JOTFORM_WEBHOOK_SECRET>
 *
 * JotForm POSTs application/x-www-form-urlencoded with:
 *   formID, submissionID, rawRequest (JSON string of answers), pretty (HTML)
 */
export async function POST(request: NextRequest) {
  // Rate-limit inbound webhooks using the contact tier
  try {
    const rl = await applyRateLimit(request, 'contact');
    if (rl) return rl;
  } catch {
    // continue on rate-limit backend failure
  }

  // ── 1. Verify shared secret ───────────────────────────────────────────────
  const secret = request.nextUrl.searchParams.get('secret');
  const expectedSecret = await getSecret('JOTFORM_WEBHOOK_SECRET');

  if (!expectedSecret) {
    // If the env var is not set, reject all incoming webhooks to avoid
    // accidentally accepting unauthenticated submissions in production.
    logger.error('[jotform-webhook] JOTFORM_WEBHOOK_SECRET is not configured');
    return NextResponse.json({ error: 'Webhook not configured' }, { status: 500 });
  }

  if (!secret || !safeSecretEqual(secret, expectedSecret)) {
    logger.warn('[jotform-webhook] Invalid or missing secret token');
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // ── 2. Parse form-encoded body ────────────────────────────────────────────
  let formData: URLSearchParams;
  try {
    const rawBody = await request.text();
    formData = new URLSearchParams(rawBody);
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  const formID = formData.get('formID');
  const submissionID = formData.get('submissionID');
  const rawRequest = formData.get('rawRequest');

  if (!formID || !submissionID) {
    return NextResponse.json({ error: 'Missing formID or submissionID' }, { status: 400 });
  }

  // ── 3. Parse the rawRequest JSON (answers keyed by field number) ──────────
  let answers: Record<string, unknown> = {};
  if (rawRequest) {
    try {
      const parsed: unknown = JSON.parse(rawRequest);
      if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed))
        return NextResponse.json({ error: 'Invalid submission answers' }, { status: 400 });
      answers = parsed as Record<string, unknown>;
    } catch {
      return NextResponse.json({ error: 'Invalid submission answers' }, { status: 400 });
    }
  }

  // ── 4. Persist to jotform_submissions for downstream processing ───────────
  const db = await requireAdminClient();

  const { error: insertErr } = await db.from('jotform_submissions').insert({
    form_id: formID,
    submission_id: submissionID,
    answers,
    raw_payload: Object.fromEntries(formData.entries()),
    received_at: new Date().toISOString(),
  });

  if (insertErr) {
    // A repeated submission may be acknowledged only after verifying its
    // immutable original record. Never overwrite answers or processing state.
    if (insertErr.code !== '23505') {
      logger.error('[jotform-webhook] Submission persistence failed');
      return NextResponse.json({ error: 'Submission could not be saved' },
        { status: 503, headers: { 'Retry-After': '30' } });
    }
    const { data: existing, error: readError } = await db.from('jotform_submissions')
      .select('form_id').eq('submission_id', submissionID).maybeSingle();
    if (readError || existing?.form_id !== formID)
      return NextResponse.json({ error: 'Existing submission could not be verified' }, { status: 503 });
  }

  const { error: receiptError } = await db.from('webhook_events_processed').upsert({
    provider: 'jotform', event_id: submissionID, event_type: 'submission.received',
    status: 'processed', processed_at: new Date().toISOString(),
    metadata: { form_id: formID, submission_saved: true },
  }, { onConflict: 'provider,event_id' });
  if (receiptError)
    return NextResponse.json({ error: 'Submission saved, but delivery receipt could not be saved' },
      { status: 503, headers: { 'Retry-After': '30' } });

  logger.info('[jotform-webhook] Received submission', { formID, submissionID });

  // ── 5. Acknowledge only durable submission and delivery evidence ─────────
  return NextResponse.json({ received: true });
}
