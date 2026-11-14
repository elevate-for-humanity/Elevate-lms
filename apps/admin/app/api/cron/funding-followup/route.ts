/**
 * GET /api/cron/funding-followup
 *
 * Scheduled job - runs daily via Northflank cron or curl with the cron secret.
 * Also callable manually from Dev Studio.
 *
 * What it does:
 *   1. Finds applications in `pending_funding` that are 48 h+ old with no
 *      follow-up sent, or 96 h+ old with only one follow-up sent.
 *   2. Finds applications in `pending_admin_review` that are 72 h+ old with
 *      no follow-up sent, or 144 h+ old with only one follow-up sent.
 *   3. Sends the appropriate email template and records the send in
 *      `application_followups` (created by migration below).
 *   4. After 2 follow-ups with no response, flags the application as
 *      `next_step = 'call_required'` for the admin dashboard.
 *
 * Auth: CRON_SECRET header.
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAdminClient } from '@/lib/supabase/admin';
import { safeError } from '@/lib/api/safe-error';
import { sendEmail } from '@/lib/email/sendgrid';
import {
  pendingFundingFollowupHtml,
  pendingAdminReviewFollowupHtml,
} from '@/lib/email/templates/funding-followup';
import { logger } from '@/lib/logger';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

// Hours before first and second follow-up for each status
const SCHEDULE = {
  pending_funding: { first: 48, second: 96 },
  pending_admin_review: { first: 72, second: 144 },
} as const;

type FundedStatus = keyof typeof SCHEDULE;

interface ApplicationRow {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  program_interest: string;
  program_slug: string | null;
  status: string;
  created_at: string;
  followup_count: number; // injected via left join count
}

export async function GET(req: NextRequest) {
  // Auth gate — accept CRON_SECRET header or query param
  const secret = process.env.CRON_SECRET;
  if (secret) {
    const provided =
      req.headers.get('x-cron-secret') || new URL(req.url).searchParams.get('secret');
    if (provided !== secret) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
  }

  const supabase = await requireAdminClient();
  if (!supabase) return safeError('Service unavailable', 503);
  const now = new Date();
  const results: Record<string, { sent: number; flagged: number; errors: number }> = {
    pending_funding: { sent: 0, flagged: 0, errors: 0 },
    pending_admin_review: { sent: 0, flagged: 0, errors: 0 },
  };

  for (const status of Object.keys(SCHEDULE) as FundedStatus[]) {
    const { first, second } = SCHEDULE[status];

    // Fetch applications in this status that still need follow-up.
    // We join application_followups to count how many emails have been sent.
    const { data: apps, error } = await supabase
      .from('applications')
      .select(
        `
        id,
        first_name,
        last_name,
        email,
        program_interest,
        program_slug,
        status,
        created_at,
        application_followups(id)
      `,
      )
      .eq('status', status)
      .not('email', 'is', null)
      .order('created_at', { ascending: true });

    if (error) {
      logger.error(`[funding-followup] DB error fetching ${status}`, error);
      continue;
    }

    for (const raw of apps ?? []) {
      const app = raw as unknown as ApplicationRow & {
        application_followups: { id: string }[];
      };

      const followupCount = app.application_followups?.length ?? 0;
      const ageHours = (now.getTime() - new Date(app.created_at).getTime()) / 3_600_000;

      // Determine if a follow-up is due
      const isDueFirst = followupCount === 0 && ageHours >= first;
      const isDueSecond = followupCount === 1 && ageHours >= second;
      const isExhausted = followupCount >= 2;

      if (isExhausted) {
        // Flag for manual outreach if not already flagged
        const { error: flagErr } = await supabase
          .from('applications')
          .update({ next_step: 'call_required' })
          .eq('id', app.id)
          .neq('next_step', 'call_required');

        if (!flagErr) results[status].flagged++;
        continue;
      }

      if (!isDueFirst && !isDueSecond) continue;

      const thisCount = followupCount + 1;
      const programName = app.program_interest || 'your program';
      const firstName = app.first_name || 'there';

      // Build email
      let subject: string;
      let html: string;

      if (status === 'pending_funding') {
        ({ subject, html } = pendingFundingFollowupHtml({
          firstName,
          programName,
          applicationId: app.id,
          followupCount: thisCount,
        }));
      } else {
        ({ subject, html } = pendingAdminReviewFollowupHtml({
          firstName,
          programName,
          followupCount: thisCount,
        }));
      }

      try {
        const result = await sendEmail({ to: app.email, subject, html });

        if (!result.success) {
          logger.warn(`[funding-followup] Send failed for ${app.id}`, result.error);
          results[status].errors++;
          continue;
        }

        // Record the follow-up
        await supabase.from('application_followups').insert({
          application_id: app.id,
          followup_type: status === 'pending_funding' ? 'icc_nudge' : 'review_reassurance',
          followup_number: thisCount,
          sent_at: now.toISOString(),
          email_subject: subject,
        });

        results[status].sent++;
        logger.info(`[funding-followup] Sent #${thisCount} to ${app.email} (${app.id})`);
      } catch (err) {
        logger.error(`[funding-followup] Unexpected error for ${app.id}`, err);
        results[status].errors++;
      }
    }
  }

  logger.info('[funding-followup] Run complete', results);
  return NextResponse.json({ ok: true, results, ranAt: now.toISOString() });
}
