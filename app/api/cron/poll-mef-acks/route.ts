// GET /api/cron/poll-mef-acks
// Polls IRS MeF for acknowledgments on pending submissions.
// Run every 5 minutes via Netlify scheduled function or external cron.
// Protected by CRON_SECRET header.
//
// MeF lifecycle: submitted → transmitted → accepted | rejected
// IRS does not push ACKs — the transmitter must poll.
import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { logger } from '@/lib/logger';
import { withApiAudit } from '@/lib/audit/withApiAudit';
import { createTransmitter } from '@/lib/tax-software/mef/transmission';
import { createAcknowledgmentHandler } from '@/lib/tax-software/mef/acknowledgment';
import { isAuthorizedCronRequest } from '@/lib/server/cron-auth';
import { getRuntimeReadiness } from '@/lib/tax-software/config/runtime-readiness';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
// Allow up to 60s — IRS status endpoint can be slow
export const maxDuration = 60;

// Statuses that require polling. 'transmitting' covers the window between
// our DB insert and IRS confirming receipt. 'pending_ack' is set after
// a successful transmit response that did not include an inline ACK.
const POLLABLE_STATUSES = ['transmitting', 'pending_ack', 'transmitted'];

// Maximum submissions to poll per run — prevents timeout on large backlogs.
const BATCH_SIZE = 20;

async function _GET(request: Request) {
  if (!isAuthorizedCronRequest(request)) {
    return NextResponse.json({ ok: false, message: 'Unauthorized' }, { status: 401 });
  }

  const readiness = getRuntimeReadiness();
  const hardBlockers = readiness.issues.filter((i) =>
    ['CRON_SECRET_MISSING', 'XMLLINT_NOT_AVAILABLE', 'SCHEMA_DIR_MISSING', 'SCHEMA_FILES_MISSING'].includes(i.code)
  );
  if (hardBlockers.length > 0) {
    return NextResponse.json(
      { ok: false, code: 'MEF_RUNTIME_NOT_READY', issues: hardBlockers },
      { status: 503 }
    );
  }

  const db = createAdminClient();
  if (!db) {
    return NextResponse.json({ error: 'Service unavailable' }, { status: 503 });
  }

  const softwareId = process.env.IRS_SOFTWARE_ID || 'PENDING';

  const environment = (process.env.IRS_ENVIRONMENT as 'test' | 'production') || 'test';
  const transmitter = createTransmitter({ softwareId, environment });
  const ackHandler = createAcknowledgmentHandler();

  // Fetch submissions that need ACK polling, oldest first
  const { data: submissions, error: fetchError } = await db
    .from('mef_submissions')
    .select('submission_id, tax_year, status, created_at, resubmission_count')
    .in('status', POLLABLE_STATUSES)
    .order('created_at', { ascending: true })
    .limit(BATCH_SIZE);

  if (fetchError) {
    logger.error('poll-mef-acks: failed to fetch submissions', { error: fetchError.message });
    return NextResponse.json({ error: 'Failed to fetch submissions' }, { status: 500 });
  }

  if (!submissions || submissions.length === 0) {
    return NextResponse.json({ ok: true, polled: 0, message: 'No submissions pending ACK' });
  }

  logger.info(`poll-mef-acks: polling ${submissions.length} submissions`);

  const results = {
    polled: submissions.length,
    accepted: 0,
    rejected: 0,
    still_pending: 0,
    errors: 0,
  };

  for (const sub of submissions) {
    try {
      const ack = await transmitter.checkStatus(sub.submission_id);

      if (!ack) {
        // IRS returned nothing — submission is still in queue
        results.still_pending++;
        continue;
      }

      // Process the ACK — updates mef_submissions, mef_acknowledgments,
      // tax_returns, and sends user notification
      await ackHandler.processAcknowledgment(ack);

      if (ack.status === 'accepted') {
        results.accepted++;
        logger.info('poll-mef-acks: accepted', {
          submissionId: sub.submission_id,
          dcn: ack.dcn,
        });
      } else if (ack.status === 'rejected') {
        results.rejected++;
        logger.warn('poll-mef-acks: rejected', {
          submissionId: sub.submission_id,
          errorCount: ack.errors?.length ?? 0,
          errors: ack.errors?.map(e => e.errorCode),
        });
      } else {
        results.still_pending++;
      }
    } catch (err) {
      results.errors++;
      logger.error('poll-mef-acks: error polling submission', {
        submissionId: sub.submission_id,
        error: err instanceof Error ? err.message : 'Unknown error',
      });

      // Mark as error in DB so it doesn't block the queue indefinitely
      await db
        .from('mef_submissions')
        .update({
          status: 'poll_error',
          error_message: err instanceof Error ? err.message : 'ACK poll failed',
          updated_at: new Date().toISOString(),
        })
        .eq('submission_id', sub.submission_id);
    }
  }

  logger.info('poll-mef-acks: run complete', results);
  return NextResponse.json({ ok: true, ...results });
}

export const GET = withApiAudit('/api/cron/poll-mef-acks', _GET);
