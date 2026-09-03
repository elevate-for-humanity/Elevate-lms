'use server';

import { createClient } from '@/lib/supabase/server';
import { requireAdminClient } from '@/lib/supabase/admin';
import { writeAdminAuditEvent, AuditActions } from '@/lib/audit';
import { sendEmail } from '@/lib/email/sendgrid';
import { PLATFORM_DEFAULTS } from '@/lib/config/platform-config';

const ADMIN_ROLES = ['admin'];

// Valid status transitions for program_holders
const VALID_FROM_STATES = ['pending', 'submitted', 'under_review'];

export async function submitVerificationDecision(
  holderId: string,
  decision: 'approved' | 'rejected',
  notes?: string,
) {
  // ── 1. AUTH ────────────────────────────────────────────────────────
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError) throw new Error(`Auth failed: ${authError.message}`);
  if (!user) return { error: 'Not authenticated' };

  const db = await requireAdminClient();
  if (!db) return { error: 'Service unavailable' };

  // ── 2. ROLE CHECK ──────────────────────────────────────────────────
  const { data: actorProfile, error: actorError } = await db
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .maybeSingle();

  if (actorError || !actorProfile) return { error: 'Forbidden' };
  if (!ADMIN_ROLES.includes(actorProfile.role)) return { error: 'Forbidden' };

  // ── 3. LOAD HOLDER — source of truth, not client input ────────────
  const { data: holder, error: holderError } = await db
    .from('program_holders')
    .select(
      'id, user_id, status, primary_program_id, contact_email, organization_name, contact_name',
    )
    .eq('id', holderId)
    .maybeSingle();

  if (holderError || !holder) return { error: 'Program holder not found' };

  // ── 4. STATE MACHINE — prevent re-approval / re-rejection ─────────
  const currentStatus = holder.status ?? 'pending';
  if (!VALID_FROM_STATES.includes(currentStatus)) {
    return { error: `Cannot transition from status "${currentStatus}"` };
  }

  // ── 5. WRITE HOLDER STATUS — update both status and verification_status ──
  const { error: updateError } = await db
    .from('program_holders')
    .update({
      status: decision,
      verification_status: decision,
      approved_by: decision === 'approved' ? user.id : null,
      approved_at: decision === 'approved' ? new Date().toISOString() : null,
    })
    .eq('id', holderId);

  if (updateError) return { error: 'Failed to update verification status' };

  // ── 6. INSERT VERIFICATION RECORD ─────────────────────────────────
  await db.from('program_holder_verification').insert({
    program_holder_id: holderId,
    verified_by: user.id,
    status: decision,
    notes: notes ?? null,
  });

  // ── 7. ROLE PROMOTION — use holder.user_id from DB, never caller ──
  if (decision === 'approved' && holder.user_id) {
    const { error: roleError } = await db
      .from('profiles')
      .update({ role: 'program_holder', updated_at: new Date().toISOString() })
      .eq('id', holder.user_id);

    if (roleError) {
      // Role promotion failure must not silently succeed — log and surface
      return { error: 'Holder approved but role promotion failed. Contact engineering.' };
    }
  }

  // ── 8. EMAIL NOTIFICATION ──────────────────────────────────────────
  // Resolve recipient email: prefer contact_email on program_holders, fall back to profiles
  let recipientEmail = holder.contact_email ?? null;
  if (!recipientEmail && holder.user_id) {
    const { data: phProfile } = await db
      .from('profiles')
      .select('email')
      .eq('id', holder.user_id)
      .maybeSingle();
    recipientEmail = phProfile?.email ?? null;
  }

  if (recipientEmail) {
    const firstName = holder.contact_name?.split(' ')[0] || 'Program Holder';
    const orgName = holder.organization_name || 'your organization';

    const subject =
      decision === 'approved'
        ? `Your Program Holder Application Has Been Approved — ${PLATFORM_DEFAULTS.orgName}`
        : `Update on Your Program Holder Application — ${PLATFORM_DEFAULTS.orgName}`;

    const html =
      decision === 'approved'
        ? `<p>Hi ${firstName},</p>
         <p>Congratulations! Your program holder application for <strong>${orgName}</strong> has been <strong>approved</strong> by Elevate for Humanity.</p>
         <p>You can now log in to your Program Holder Portal to get started:</p>
         <p><a href="${PLATFORM_DEFAULTS.siteUrl}/program-holder/dashboard">Access Your Portal →</a></p>
         <p>If you have any questions, reply to this email or contact us at <a href="mailto:info@${PLATFORM_DEFAULTS.canonicalDomain}">info@${PLATFORM_DEFAULTS.canonicalDomain}</a>.</p>
         <br/><p>Warm regards,<br/>Elevate for Humanity Team</p>`
        : `<p>Hi ${firstName},</p>
         <p>Thank you for applying to become a Program Holder with ${PLATFORM_DEFAULTS.orgName}.</p>
         <p>After reviewing your application for <strong>${orgName}</strong>, we are unable to approve it at this time${notes ? ': ' + notes : '.'}</p>
         <p>If you believe this decision was made in error or would like to discuss next steps, please contact us at <a href="mailto:info@${PLATFORM_DEFAULTS.canonicalDomain}">info@${PLATFORM_DEFAULTS.canonicalDomain}</a>.</p>
         <br/><p>Warm regards,<br/>${PLATFORM_DEFAULTS.orgName} Team</p>`;

    try {
      await sendEmail({
        to: [recipientEmail],
        from: 'Elevate for Humanity <info@elevateforhumanity.org>',
        subject,
        html,
      });
    } catch {
      // Email failure must not roll back the decision
    }
  }

  // ── 9. AUDIT ───────────────────────────────────────────────────────
  await writeAdminAuditEvent(supabase, {
    action: AuditActions.PROGRAM_HOLDER_VERIFIED,
    target_type: 'program_holder',
    target_id: holderId,
    metadata: {
      decision,
      holder_user_id: holder.user_id,
      previous_status: currentStatus,
      program_id: holder.primary_program_id,
    },
  });

  return { success: true };
}
