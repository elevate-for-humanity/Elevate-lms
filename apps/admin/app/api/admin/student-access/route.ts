/**
 * POST /api/admin/student-access
 *
 * Backs the Student Portal Diagnostics tool (/student-access).
 * Body: { email, repair }
 *  - Always returns diagnostics: profile, auth user, enrollments, and
 *    whether each enrollment passes the platform's own admission gate
 *    (lib/learner/approved-paid-admission.mjs — the same logic the LMS
 *    learner gate uses).
 *  - With repair=true, enrollments that pass the gate but do not have
 *    active access are stamped active (access_granted_at /
 *    access_status, and a stranded pending enrollment is advanced to
 *    active), mirroring the grant-access route. Enrollments that fail
 *    the gate are never force-activated.
 */
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { requireAdminClient } from '@/lib/supabase/admin';
import { safeError } from '@/lib/api/safe-error';
import { hasAdmissionPaymentOrFunding } from '@/lib/learner/approved-paid-admission.mjs';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user) return safeError('Unauthorized', 401);

  const db = await requireAdminClient();
  const { data: adminProfile } = await db
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .maybeSingle();
  if (!adminProfile || !['admin', 'super_admin', 'staff'].includes(adminProfile.role)) {
    return safeError('Forbidden', 403);
  }

  const body = (await request.json().catch(() => ({}))) as { email?: string; repair?: boolean };
  const email = body.email?.trim().toLowerCase();
  if (!email) return safeError('Email is required', 400);
  const repair = body.repair === true;

  const diagnostics: string[] = [];
  const actions: string[] = [];

  const { data: student } = await db
    .from('profiles')
    .select('id, full_name, email, role, enrollment_status, portal_type, created_at')
    .eq('email', email)
    .maybeSingle();
  if (!student) {
    return NextResponse.json({
      success: false,
      code: 'PROFILE_NOT_FOUND',
      message: `No profile exists for ${email}. The student has no portal account yet.`,
      diagnostics: ['profiles: no row with this email'],
    });
  }
  diagnostics.push(`profile found (${student.id}), role=${student.role}`);

  let authUser: Record<string, unknown> | undefined;
  const { data: authData, error: authLookupError } = await db.auth.admin.getUserById(student.id);
  if (authLookupError || !authData?.user) {
    diagnostics.push('auth user MISSING for this profile id — the student cannot sign in');
  } else {
    authUser = {
      id: authData.user.id,
      email: authData.user.email,
      created_at: authData.user.created_at,
      last_sign_in_at: authData.user.last_sign_in_at ?? null,
    };
    diagnostics.push(
      authData.user.last_sign_in_at
        ? `auth user exists, last sign-in ${authData.user.last_sign_in_at}`
        : 'auth user exists but has never signed in',
    );
  }

  const { data: enrollments } = await db
    .from('program_enrollments')
    .select(
      'id, program_id, status, payment_status, funding_source, funding_verified, eligibility_status, access_status, access_granted_at, created_at',
    )
    .eq('user_id', student.id)
    .order('created_at', { ascending: false });

  if (!enrollments?.length) {
    return NextResponse.json({
      success: false,
      code: 'NO_ENROLLMENTS',
      message: `${student.full_name ?? email} has a portal account but no program enrollments.`,
      diagnostics,
      student,
      authUser,
    });
  }

  const now = new Date().toISOString();
  let allActive = true;
  for (const enr of enrollments) {
    const gateOk = hasAdmissionPaymentOrFunding(enr);
    diagnostics.push(
      `enrollment ${enr.id}: status=${enr.status}, payment=${enr.payment_status ?? '—'}, ` +
        `funding=${enr.funding_source ?? '—'} (verified=${enr.funding_verified ?? false}), ` +
        `access=${enr.access_status ?? '—'} — admission gate ${gateOk ? 'PASSES' : 'FAILS'}`,
    );
    const isActive = enr.access_status === 'active' && enr.status === 'active';
    if (!isActive) {
      if (repair && gateOk) {
        const patch: Record<string, unknown> = { access_status: 'active' };
        if (!enr.access_granted_at) patch.access_granted_at = now;
        if (enr.status !== 'active') patch.status = 'active';
        const { error: upErr } = await db.from('program_enrollments').update(patch).eq('id', enr.id);
        if (upErr) {
          actions.push(`enrollment ${enr.id}: repair FAILED (${upErr.message})`);
          allActive = false;
        } else {
          actions.push(`enrollment ${enr.id}: access stamped active`);
          enr.access_status = 'active';
          enr.status = 'active';
        }
      } else {
        allActive = false;
        if (repair && !gateOk) {
          actions.push(
            `enrollment ${enr.id}: NOT repaired — no verified payment or confirmed funding on record`,
          );
        }
      }
    }
  }

  return NextResponse.json({
    success: allActive,
    code: allActive ? 'ACCESS_OK' : 'ACCESS_INCOMPLETE',
    message: allActive
      ? `${student.full_name ?? email} has active portal access on all enrollments.`
      : `${student.full_name ?? email} does not have fully active access yet — see diagnostics.`,
    diagnostics,
    student,
    enrollment: enrollments[0],
    authUser,
    actions,
  });
}
