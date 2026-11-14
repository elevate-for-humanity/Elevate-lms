// Canonical student portal auth + access validation layer.
// Validates profile record, auth account, email confirmation, and enrollment
// in sequence — returns structured diagnostics at each failure point.
//
// Schema reality:
//   profiles.id = auth.users.id (direct FK — no separate auth_user_id column)
//   profiles.is_active — account active flag
//   enrollments.user_id → profiles.id
//   enrollments.enrollment_state — active state ('active', 'onboarding', 'started')

import { requireAdminClient } from '@/lib/supabase/admin';

export type StudentPortalResult = {
  success: boolean;
  code: string;
  message: string;
  profile?: Record<string, unknown>;
  enrollment?: Record<string, unknown>;
  authUser?: Record<string, unknown>;
  diagnostics?: string[];
};

// Enrollment states that allow portal access
const ACTIVE_ENROLLMENT_STATES = ['active', 'started', 'onboarding'];

export async function validateStudentPortalAccess(
  email: string,
): Promise<StudentPortalResult> {
  const diagnostics: string[] = [];
  const normalizedEmail = email.trim().toLowerCase();

  try {
    const db = await requireAdminClient();

    // ── Step 1: Profile record ───────────────────────────────────────────────
    const { data: profile, error: profileError } = await db
      .from('profiles')
      .select('id, email, full_name, role, enrollment_status, is_active, onboarding_completed')
      .ilike('email', normalizedEmail)
      .single();

    if (profileError || !profile) {
      return {
        success: false,
        code: 'PROFILE_NOT_FOUND',
        message: 'No profile record exists for this email.',
        diagnostics,
      };
    }

    diagnostics.push('Profile record located.');

    // ── Step 2: Account active ───────────────────────────────────────────────
    if (!profile.is_active) {
      return {
        success: false,
        code: 'ACCOUNT_INACTIVE',
        message: 'Account exists but has been deactivated.',
        profile,
        diagnostics: [...diagnostics, 'profiles.is_active = false'],
      };
    }

    diagnostics.push('Account is active.');

    // ── Step 3: Auth user (profiles.id = auth.users.id) ─────────────────────
    const { data: authData, error: authError } =
      await db.auth.admin.getUserById(profile.id as string);

    if (authError || !authData?.user) {
      return {
        success: false,
        code: 'AUTH_USER_MISSING',
        message: 'Profile exists but no auth.users record found.',
        profile,
        diagnostics: [
          ...diagnostics,
          authError?.message ?? 'getUserById returned no user',
        ],
      };
    }

    const authUser = authData.user;
    diagnostics.push('Auth user located.');

    // ── Step 4: Email confirmation ───────────────────────────────────────────
    if (!authUser.email_confirmed_at) {
      return {
        success: false,
        code: 'EMAIL_NOT_CONFIRMED',
        message: 'Account exists but email has not been confirmed.',
        profile,
        authUser,
        diagnostics,
      };
    }

    diagnostics.push('Email confirmed.');

    // ── Step 5: Enrollment exists ────────────────────────────────────────────
    const { data: enrollment, error: enrollmentError } = await db
      .from('enrollments')
      .select('id, status, enrollment_state, program_id, program_slug, enrolled_at')
      .eq('user_id', profile.id)
      .order('enrolled_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (enrollmentError || !enrollment) {
      return {
        success: false,
        code: 'ENROLLMENT_MISSING',
        message: 'Profile exists but no enrollment record found.',
        profile,
        authUser,
        diagnostics: [...diagnostics, 'No enrollments row for this user_id.'],
      };
    }

    diagnostics.push('Enrollment found.');

    // ── Step 6: Enrollment state ─────────────────────────────────────────────
    if (!ACTIVE_ENROLLMENT_STATES.includes(enrollment.enrollment_state as string)) {
      return {
        success: false,
        code: 'ENROLLMENT_INACTIVE',
        message: 'Enrollment exists but is not in an active state.',
        profile,
        enrollment,
        diagnostics: [
          ...diagnostics,
          `enrollment_state: ${enrollment.enrollment_state}`,
        ],
      };
    }

    diagnostics.push(`Enrollment state: ${enrollment.enrollment_state}.`);

    return {
      success: true,
      code: 'ACCESS_GRANTED',
      message: 'Student portal access verified.',
      profile,
      authUser,
      enrollment,
      diagnostics,
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return {
      success: false,
      code: 'SYSTEM_ERROR',
      message: 'Unexpected system failure.',
      diagnostics: [message],
    };
  }
}
