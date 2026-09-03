import { logger } from '@/lib/logger';
import { createClient } from '@/lib/supabase/server';
import { requireAdminClient } from '@/lib/supabase/admin';
import { NextRequest, NextResponse } from 'next/server';
import { enqueueNotification, buildTokenUrl } from '@/lib/notifications';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { withApiAudit } from '@/lib/audit/withApiAudit';
import { PLATFORM_DEFAULTS } from '@/lib/config/platform-config';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || PLATFORM_DEFAULTS.siteUrl;
const LMS_URL = `${SITE_URL}/lms/courses`;

function isApprenticeshipProgram(slug: string, title: string): boolean {
  const value = `${slug} ${title}`.toLowerCase();
  return [
    'apprentice',
    'barber',
    'cosmetology',
    'esthetic',
    'nail technician',
    'nail-tech',
    'manicur',
  ].some((token) => value.includes(token));
}

/**
 * Canonical staff enrollment endpoint.
 * Authenticates the staff member with the session client, then uses the admin
 * client only for cross-user provisioning after authorization succeeds.
 */
async function _POST(request: NextRequest) {
  try {
    const rateLimited = await applyRateLimit(request, 'api');
    if (rateLimited) return rateLimited;

    const session = await createClient();
    const {
      data: { user },
    } = await session.auth.getUser();

    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { data: staffProfile } = await session
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .maybeSingle();

    if (!staffProfile || !['admin', 'instructor', 'staff', 'org_admin', 'advisor'].includes(staffProfile.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const {
      firstName,
      lastName,
      email,
      phone,
      dateOfBirth,
      address,
      city,
      state,
      zipCode,
      county,
      programId,
      fundingType,
      caseManagerName,
      caseManagerEmail,
      caseManagerPhone,
      notes,
      documentIds,
    } = body;

    const normalizedEmail = typeof email === 'string' ? email.trim().toLowerCase() : '';
    if (!firstName || !lastName || !normalizedEmail || !programId) {
      return NextResponse.json(
        { error: 'First name, last name, email, and program are required' },
        { status: 400 },
      );
    }

    const admin = await requireAdminClient();

    const { data: existingProfile } = await admin
      .from('profiles')
      .select('id')
      .ilike('email', normalizedEmail)
      .maybeSingle();

    let profileId: string;

    if (existingProfile?.id) {
      profileId = existingProfile.id;
      const { error: updateProfileError } = await admin
        .from('profiles')
        .update({
          first_name: firstName,
          last_name: lastName,
          full_name: `${firstName} ${lastName}`.trim(),
          phone: phone || null,
          role: 'student',
          enrollment_status: 'active',
        })
        .eq('id', profileId);
      if (updateProfileError) throw updateProfileError;
    } else {
      const { data: authUser, error: authError } = await admin.auth.admin.createUser({
        email: normalizedEmail,
        email_confirm: true,
        user_metadata: {
          first_name: firstName,
          last_name: lastName,
          full_name: `${firstName} ${lastName}`.trim(),
        },
      });

      if (authError || !authUser.user) {
        logger.error('Staff enrollment auth-user creation failed', authError ?? undefined);
        return NextResponse.json({ error: 'Failed to create learner account' }, { status: 500 });
      }

      profileId = authUser.user.id;
      const { error: profileError } = await admin.from('profiles').upsert({
        id: profileId,
        email: normalizedEmail,
        first_name: firstName,
        last_name: lastName,
        full_name: `${firstName} ${lastName}`.trim(),
        phone: phone || null,
        role: 'student',
        enrollment_status: 'active',
      });
      if (profileError) throw profileError;
    }

    const { error: studentError } = await admin.from('students').upsert({
      id: profileId,
      date_of_birth: dateOfBirth || null,
      address: address || null,
      city: city || null,
      state: state || null,
      zip_code: zipCode || null,
      county: county || null,
      funding_type: fundingType || null,
      case_manager_name: caseManagerName || null,
      case_manager_email: caseManagerEmail || null,
      case_manager_phone: caseManagerPhone || null,
      notes: notes || null,
    });
    if (studentError) throw studentError;

    const { data: program, error: programError } = await admin
      .from('programs')
      .select('id, title, name, slug, total_hours')
      .eq('id', programId)
      .maybeSingle();

    if (programError || !program) {
      return NextResponse.json({ error: 'Selected program was not found' }, { status: 400 });
    }

    const programName = program.title || program.name || program.slug || 'Program';
    const programSlug = program.slug || null;
    const totalHours = program.total_hours || 0;

    const { data: existingEnrollment } = await admin
      .from('program_enrollments')
      .select('id')
      .eq('user_id', profileId)
      .eq('program_id', programId)
      .maybeSingle();

    let enrollment: { id: string } | null = existingEnrollment;
    if (!existingEnrollment) {
      const { data, error: enrollmentError } = await admin
        .from('program_enrollments')
        .insert({
          user_id: profileId,
          program_id: programId,
          ...(programSlug ? { program_slug: programSlug } : {}),
          funding_type: fundingType || 'workforce',
          status: 'active',
          enrollment_state: 'active',
          lms_enrolled: true,
          enrolled_by: user.id,
          docs_verified: true,
          docs_verified_at: new Date().toISOString(),
          enrolled_at: new Date().toISOString(),
        })
        .select('id')
        .maybeSingle();

      if (enrollmentError || !data) {
        logger.error('Staff enrollment creation failed', enrollmentError ?? undefined);
        return NextResponse.json({ error: 'Failed to create enrollment' }, { status: 500 });
      }
      enrollment = data;
    }

    if (isApprenticeshipProgram(programSlug || '', programName)) {
      const { error: apprenticeError } = await admin.from('apprentices').upsert(
        {
          user_id: profileId,
          program_id: programId,
          program_name: programName,
          status: 'active',
          total_hours_required: totalHours,
          hours_completed: 0,
          transfer_hours_credited: 0,
          enrollment_date: new Date().toISOString().split('T')[0],
        },
        { onConflict: 'user_id,program_id' },
      );
      if (apprenticeError) logger.warn('Apprentice record provisioning failed', apprenticeError);
    }

    if (Array.isArray(documentIds) && documentIds.length > 0) {
      const { error: documentError } = await admin
        .from('documents')
        .update({
          user_id: profileId,
          status: 'verified',
          verified_by: user.id,
          verified_at: new Date().toISOString(),
        })
        .in('id', documentIds);
      if (documentError) logger.warn('Enrollment document linking failed', documentError);
    }

    const portalUrl = await buildTokenUrl('/lms', {
      purpose: 'continue_enrollment',
      email: normalizedEmail,
      expiresDays: 30,
      maxUses: 20,
      metadata: { enrollment_id: enrollment!.id },
    });

    await enqueueNotification({
      toEmail: normalizedEmail,
      templateKey: 'apprentice_decision',
      templateData: {
        name: firstName,
        approved: true,
        portal_url: portalUrl || `${SITE_URL}/lms`,
        lms_url: LMS_URL,
      },
      entityType: 'enrollment',
      entityId: enrollment!.id,
    });

    return NextResponse.json({
      success: true,
      enrollment: { id: enrollment!.id, status: 'active' },
      message: `Student enrolled successfully. Access instructions sent to ${normalizedEmail}`,
    });
  } catch (error) {
    logger.error('Staff enrollment error', error instanceof Error ? error : undefined);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export const POST = withApiAudit('/api/staff/enroll-student', _POST);
