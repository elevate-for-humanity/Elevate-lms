import 'server-only';

import { escapeLikePattern } from '@/lib/admissions/on-application-submitted';
import type { SupabaseClient } from '@supabase/supabase-js';

import { PLATFORM_DEFAULTS } from '@/lib/config/platform-config';
import { sendEmail } from '@/lib/email/resend';
import { logger } from '@/lib/logger';

export type AdmissionsEmailStage = 'submitted' | 'docs_complete' | 'accepted' | 'enrolled';

/** Application statuses (applications_status_check) that trigger an admissions email. */
export const APPLICATION_STATUS_EMAIL_STAGE: Readonly<Record<string, AdmissionsEmailStage>> = {
  ready_to_enroll: 'docs_complete',
  approved: 'accepted',
  enrolled: 'enrolled',
};

type CommunicationLogEntry = {
  recipientEmail: string;
  templateKey: string;
  subject: string;
  applicationId?: string | null;
  success: boolean;
  error?: string | null;
};

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);
}

/** Records an outbound message in communication_log. Never throws. */
export async function logCommunication(db: SupabaseClient, entry: CommunicationLogEntry): Promise<void> {
  try {
    const email = entry.recipientEmail.trim().toLowerCase();
    const { data: lead } = await db.from('leads').select('id').ilike('email', escapeLikePattern(email))
      .order('created_at', { ascending: false }).limit(1).maybeSingle();
    const { error } = await db.from('communication_log').insert({
      lead_id: lead?.id ?? null,
      application_id: entry.applicationId ?? null,
      recipient_email: email,
      channel: 'email',
      template_key: entry.templateKey,
      subject: entry.subject,
      status: entry.success ? 'sent' : 'failed',
      error: entry.success ? null : (entry.error ?? 'send_failed').slice(0, 500),
    });
    if (error) logger.warn('[admissions] communication_log insert failed', { code: error.code });
  } catch (err) {
    logger.warn('[admissions] communication_log write failed', { error: err instanceof Error ? err.message : 'unknown' });
  }
}

function template(stage: Exclude<AdmissionsEmailStage, 'submitted'>, firstName: string, programName: string) {
  const org = PLATFORM_DEFAULTS.orgName;
  const portal = `${PLATFORM_DEFAULTS.siteUrl}/learner/dashboard`;
  const name = escapeHtml(firstName);
  const program = escapeHtml(programName);
  const body = {
    docs_complete: {
      subject: `Your Documents Are Complete — ${org}`,
      text: `We have received and reviewed the required documents for <strong>${program}</strong>. Your file is ready for enrollment.`,
    },
    accepted: {
      subject: `Your Application Has Been Approved — ${org}`,
      text: `Congratulations! Your application for <strong>${program}</strong> has been <strong>approved</strong>. Please log in to your portal to complete enrollment.`,
    },
    enrolled: {
      subject: `You Are Enrolled — ${org}`,
      text: `You are now enrolled in <strong>${program}</strong>. Your courses are available in your portal.`,
    },
  }[stage];
  return {
    subject: body.subject,
    html: `<p>Hi ${name},</p><p>${body.text}</p><p><a href="${portal}">Access Your Portal →</a></p>
<p>Questions? Contact us at <a href="mailto:info@${PLATFORM_DEFAULTS.canonicalDomain}">info@${PLATFORM_DEFAULTS.canonicalDomain}</a>.</p>
<br/><p>Warm regards,<br/>${escapeHtml(org)} Team</p>`,
  };
}

/** Sends the admissions email for a status transition and logs it. Never throws. */
export async function sendAdmissionsStatusEmail(
  db: SupabaseClient,
  input: {
    stage: Exclude<AdmissionsEmailStage, 'submitted'>;
    email: string;
    firstName: string;
    programName: string;
    applicationId: string;
  },
): Promise<boolean> {
  const { subject, html } = template(input.stage, input.firstName, input.programName);
  let success = false;
  let error: string | undefined;
  try {
    const result = await sendEmail({
      to: [input.email],
      from: `${PLATFORM_DEFAULTS.orgName} <info@${PLATFORM_DEFAULTS.canonicalDomain}>`,
      subject,
      html,
    });
    success = result.success;
    error = result.error;
  } catch (err) {
    error = err instanceof Error ? err.message : 'send_failed';
  }
  await logCommunication(db, {
    recipientEmail: input.email,
    templateKey: `admissions_${input.stage}`,
    subject,
    applicationId: input.applicationId,
    success,
    error,
  });
  return success;
}
