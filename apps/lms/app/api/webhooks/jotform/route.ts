// PUBLIC ROUTE: inbound JotForm webhook (authenticated by secret token in URL)
import { NextRequest, NextResponse } from 'next/server';
import { timingSafeEqual } from 'crypto';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { requireAdminClient } from '@/lib/supabase/admin';
import { logger } from '@/lib/logger';

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
  const expectedSecret = process.env.JOTFORM_WEBHOOK_SECRET;

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
      answers = JSON.parse(rawRequest);
    } catch {
      logger.warn('[jotform-webhook] Could not parse rawRequest JSON', { submissionID });
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
    // Table may not exist yet — log and continue; don't fail the webhook
    // response so JotForm does not retry indefinitely.
    logger.error('[jotform-webhook] Failed to persist submission (non-fatal):', insertErr.message);
  }

  logger.info('[jotform-webhook] Received submission', { formID, submissionID });

  // ── 5. Return 200 immediately so JotForm stops retrying ──────────────────
  return NextResponse.json({ received: true });
}
