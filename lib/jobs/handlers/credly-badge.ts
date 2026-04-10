/**
 * Job handler: credly_badge_issue
 *
 * Processes badge issuance requests from the job_queue.
 * On success: updates learner_credentials with credly_badge_id and badge_url.
 * On failure: marks job failed — will be retried by queue processor up to max_attempts.
 *
 * Payload shape:
 *   {
 *     learner_credential_id: string,
 *     badge_template_id: string,
 *     recipient_email: string,
 *     recipient_name: string,
 *     issued_at?: string,
 *     expires_at?: string,
 *   }
 */

import { getAdminClient } from '@/lib/supabase/admin';
import { logger } from '@/lib/logger';
import { issueCredlyBadge } from '@/lib/credentials/credly';

export async function handleCredlyBadgeIssue(payload: Record<string, any>): Promise<void> {
  const {
    learner_credential_id,
    badge_template_id,
    recipient_email,
    recipient_name,
    issued_at,
    expires_at,
  } = payload;

  if (!learner_credential_id || !badge_template_id || !recipient_email) {
    throw new Error('Missing required payload fields: learner_credential_id, badge_template_id, recipient_email');
  }

  const db = await getAdminClient();
  if (!db) throw new Error('Admin client unavailable');

  // Idempotency check — skip if badge already issued
  const { data: existing } = await db
    .from('learner_credentials')
    .select('id, credly_badge_id')
    .eq('id', learner_credential_id)
    .single();

  if (existing?.credly_badge_id) {
    logger.info('Credly badge already issued — skipping', { learner_credential_id });
    return;
  }

  const result = await issueCredlyBadge({
    badge_template_id,
    recipient_email,
    recipient_name: recipient_name ?? 'Learner',
    issued_at,
    expires_at,
  });

  if (!result.success) {
    throw new Error(result.error ?? 'Credly issuance failed');
  }

  // Store badge ID and URL on the credential record
  const { error: updateErr } = await db
    .from('learner_credentials')
    .update({
      credly_badge_id: result.credly_id,
      badge_url: result.badge_url,
      updated_at: new Date().toISOString(),
    })
    .eq('id', learner_credential_id);

  if (updateErr) {
    logger.error('Failed to store Credly badge ID on learner_credential', {
      learner_credential_id,
      credly_id: result.credly_id,
      error: updateErr.message,
    });
    throw new Error('Badge issued but failed to store result');
  }

  logger.info('Credly badge issued successfully', {
    learner_credential_id,
    credly_id: result.credly_id,
  });
}
