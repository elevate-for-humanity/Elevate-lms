'use server';

import { createClient } from '@/lib/supabase/server';
import { writeAdminAuditEvent } from '@/lib/audit';
import { sendInternalEmail } from '@/lib/email/send-internal';

export async function sendEnrollmentApprovalEmail(payload: {
  to: string;
  studentName: string;
  courseName: string;
  startDate?: string;
}) {
  const { to, studentName, courseName, startDate } = payload;
  await sendInternalEmail({
    to,
    subject: `Your enrollment in ${courseName} has been approved`,
    html: `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto">
        <h2 style="color:#1E3A5F">Enrollment Approved</h2>
        <p>Hi ${studentName},</p>
        <p>Your enrollment in <strong>${courseName}</strong> has been approved.${startDate ? ` Your program begins on <strong>${startDate}</strong>.` : ''}</p>
        <p>Log in to your learner dashboard to get started.</p>
        <p style="margin-top:24px"><a href="${process.env.NEXT_PUBLIC_SITE_URL ?? ''}/learner/dashboard"
          style="background:#1E3A5F;color:#fff;padding:12px 24px;border-radius:6px;text-decoration:none;font-weight:bold">
          Go to Dashboard
        </a></p>
        <p style="color:#64748b;font-size:12px;margin-top:24px">Elevate for Humanity · Indianapolis, IN</p>
      </div>`,
  });
}

export async function auditEnrollmentAction(action: string, targetId: string, meta?: Record<string, unknown>) {
  const supabase = await createClient();
  await writeAdminAuditEvent(supabase, {
    action,
    target_type: 'enrollment',
    target_id: targetId,
    metadata: meta,
  });
}
