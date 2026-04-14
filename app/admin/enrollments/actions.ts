'use server';

import { createClient } from '@/lib/supabase/server';
import { getAdminClient } from '@/lib/supabase/admin';
import { writeAdminAuditEvent } from '@/lib/audit';
import { sendInternalEmail } from '@/lib/email/send-internal';
import { logger } from '@/lib/logger';

// ── Auth guard ────────────────────────────────────────────────────────────────
async function requireAdminAction() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Unauthorized');
  const { data: profile } = await supabase
    .from('profiles').select('role').eq('id', user.id).maybeSingle();
  if (!profile || !['admin', 'super_admin', 'staff'].includes(profile.role)) {
    throw new Error('Forbidden');
  }
  return { user, supabase };
}

// ── Update enrollment ─────────────────────────────────────────────────────────
export async function updateEnrollment(enrollmentId: string, fields: {
  status?: string;
  progress?: number;
  at_risk?: boolean;
  completed_at?: string | null;
}) {
  const { user, supabase } = await requireAdminAction();
  const db = await getAdminClient();
  const { error } = await db
    .from('program_enrollments')
    .update({ ...fields, updated_at: new Date().toISOString() })
    .eq('id', enrollmentId);
  if (error) { logger.error('updateEnrollment', { error }); throw new Error('Failed to update enrollment'); }
  await writeAdminAuditEvent(supabase, { action: 'enrollment_updated', target_type: 'enrollment', target_id: enrollmentId, metadata: fields });
}

// ── Create enrollment ─────────────────────────────────────────────────────────
export async function createEnrollment(data: {
  user_id: string;
  course_id: string;
  program_id?: string | null;
  status?: string;
  progress?: number;
}) {
  const { user, supabase } = await requireAdminAction();
  const db = await getAdminClient();
  const { data: existing } = await db
    .from('program_enrollments').select('id')
    .eq('user_id', data.user_id).eq('course_id', data.course_id).maybeSingle();
  if (existing) throw new Error('User is already enrolled in this course');
  const now = new Date().toISOString();
  const { data: enrollment, error } = await db
    .from('program_enrollments')
    .insert({ user_id: data.user_id, course_id: data.course_id, program_id: data.program_id ?? null,
      status: data.status ?? 'active', enrollment_state: data.status ?? 'active',
      progress: data.progress ?? 0, enrolled_at: now, created_at: now, updated_at: now })
    .select('id').single();
  if (error) { logger.error('createEnrollment', { error }); throw new Error('Failed to create enrollment'); }
  await writeAdminAuditEvent(supabase, { action: 'enrollment_created', target_type: 'enrollment', target_id: enrollment.id, metadata: { user_id: data.user_id, course_id: data.course_id } });
  return enrollment;
}

// ── Delete enrollment ─────────────────────────────────────────────────────────
export async function deleteEnrollment(enrollmentId: string, userId: string, courseId: string) {
  const { user, supabase } = await requireAdminAction();
  const db = await getAdminClient();
  await db.from('lesson_progress').delete().eq('user_id', userId).eq('course_id', courseId);
  await db.from('lms_progress').delete().eq('user_id', userId).eq('course_id', courseId);
  const { error } = await db.from('program_enrollments').delete().eq('id', enrollmentId);
  if (error) { logger.error('deleteEnrollment', { error }); throw new Error('Failed to delete enrollment'); }
  await writeAdminAuditEvent(supabase, { action: 'enrollment_deleted', target_type: 'enrollment', target_id: enrollmentId, metadata: { user_id: userId, course_id: courseId } });
}

// ── Toggle at-risk ────────────────────────────────────────────────────────────
export async function toggleAtRisk(enrollmentId: string, currentValue: boolean) {
  const { user, supabase } = await requireAdminAction();
  const db = await getAdminClient();
  const { error } = await db.from('program_enrollments')
    .update({ at_risk: !currentValue, updated_at: new Date().toISOString() }).eq('id', enrollmentId);
  if (error) throw new Error('Failed to update at-risk flag');
  await writeAdminAuditEvent(supabase, { action: 'enrollment_at_risk_toggled', target_type: 'enrollment', target_id: enrollmentId, metadata: { at_risk: !currentValue } });
}

// ── Mark complete ─────────────────────────────────────────────────────────────
export async function markEnrollmentComplete(enrollmentId: string) {
  const { user, supabase } = await requireAdminAction();
  const db = await getAdminClient();
  const now = new Date().toISOString();
  const { error } = await db.from('program_enrollments')
    .update({ status: 'completed', enrollment_state: 'completed', progress: 100, completed_at: now, updated_at: now })
    .eq('id', enrollmentId);
  if (error) throw new Error('Failed to mark enrollment complete');
  await writeAdminAuditEvent(supabase, { action: 'enrollment_marked_complete', target_type: 'enrollment', target_id: enrollmentId });
}

// ── Approve enrollment ────────────────────────────────────────────────────────
export async function approveEnrollment(enrollmentId: string, userId: string) {
  const { user, supabase } = await requireAdminAction();
  const db = await getAdminClient();
  const now = new Date().toISOString();
  const { error } = await db.from('program_enrollments')
    .update({ status: 'active', enrollment_state: 'active', access_granted_at: now, updated_at: now })
    .eq('id', enrollmentId);
  if (error) throw new Error('Failed to approve enrollment');
  await db.from('profiles').update({ enrollment_status: 'active' }).eq('id', userId);
  await writeAdminAuditEvent(supabase, { action: 'enrollment_approved', target_type: 'enrollment', target_id: enrollmentId, metadata: { approved_by: user.id, user_id: userId } });
}

// ── Send approval email ───────────────────────────────────────────────────────
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
