// Auto-repair service for broken student portal access.
// Creates missing auth users, activates accounts, and repairs existing canonical enrollments.
// Admin-only — never call from public-facing routes.
//
// Canonical enrollment rule:
//   program_enrollments is the operational enrollment authority.
//   This repair helper MUST NOT invent a programless enrollment. New enrollment
//   creation must cross the governed application/enrollment RPC boundary.

import { requireAdminClient } from '@/lib/supabase/admin';

export async function repairStudentPortalAccess(
  email: string,
): Promise<{ success: boolean; message: string; actions: string[] }> {
  const normalizedEmail = email.trim().toLowerCase();
  const actions: string[] = [];

  const db = await requireAdminClient();

  const { data: profile, error: profileError } = await db
    .from('profiles')
    .select('id, email, is_active, enrollment_status')
    .ilike('email', normalizedEmail)
    .single();

  if (profileError || !profile) {
    throw new Error('Profile record missing — cannot repair. Create the account first.');
  }

  const { data: authData } = await db.auth.admin.getUserById(profile.id as string);

  if (!authData?.user) {
    const tempPassword = 'Temp1234!' + Math.random().toString(36).slice(2);
    const { data: created, error: createError } = await db.auth.admin.createUser({
      email: normalizedEmail,
      password: tempPassword,
      email_confirm: true,
    });

    if (createError) throw createError;
    actions.push(
      `Created missing auth user (id: ${created.user.id}, email pre-confirmed, temp password set). ` +
      `Note: new auth id differs from profile id — manual reconciliation may be needed.`,
    );
  } else {
    actions.push('Auth user already exists — skipped.');
  }

  if (!profile.is_active) {
    const { error: updateError } = await db
      .from('profiles')
      .update({ is_active: true })
      .eq('id', profile.id);

    if (updateError) throw updateError;
    actions.push('Set profiles.is_active → true.');
  } else {
    actions.push('Profile already active — skipped.');
  }

  const { data: enrollment, error: enrollmentError } = await db
    .from('program_enrollments')
    .select('id, program_id, program_slug, enrollment_state, status, revoked_at')
    .eq('user_id', profile.id)
    .order('enrolled_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (enrollmentError) throw enrollmentError;

  if (!enrollment) {
    throw new Error(
      'No canonical program enrollment exists for this student. Portal repair will not create a programless enrollment; approve/enroll the application through the governed enrollment workflow first.',
    );
  }

  if (!enrollment.program_id && !enrollment.program_slug) {
    throw new Error(
      `Enrollment ${enrollment.id} has no program identity. Resolve the enrollment record before granting portal access.`,
    );
  }

  if (enrollment.revoked_at) {
    throw new Error(
      `Enrollment ${enrollment.id} is revoked. Portal repair cannot override a revocation; resolve the underlying enrollment decision first.`,
    );
  }

  if (!['active', 'started', 'onboarding'].includes(String(enrollment.enrollment_state ?? ''))) {
    const { error: stateError } = await db
      .from('program_enrollments')
      .update({
        enrollment_state: 'active',
        status: enrollment.status === 'completed' ? enrollment.status : 'active',
        updated_at: new Date().toISOString(),
      })
      .eq('id', enrollment.id);

    if (stateError) throw stateError;
    actions.push(`Updated canonical enrollment_state: ${enrollment.enrollment_state ?? 'unset'} → active.`);
  } else {
    actions.push(`Canonical enrollment already active (${enrollment.enrollment_state}) — skipped.`);
  }

  return {
    success: true,
    message: 'Student portal access repaired against the canonical program enrollment.',
    actions,
  };
}
