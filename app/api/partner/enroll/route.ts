export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { NextResponse } from 'next/server';
import { parseBody } from '@/lib/api-helpers';
import { logger } from '@/lib/logger';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { withApiAudit } from '@/lib/audit/withApiAudit';

async function _POST(request: Request) {
  try {
    const rateLimited = await applyRateLimit(request, 'contact');
    if (rateLimited) return rateLimited;

    const supabase = await createClient();
  const _admin = createAdminClient(); const db = _admin || supabase;
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await parseBody<Record<string, any>>(request);
    const {
      partnerCourseId,
      programId,
    } = body;

    // Get partner course details
    const { data: partnerCourse, error: courseError } = await db
      .from('partner_lms_courses')
      .select(`
        *,
        provider:partner_lms_providers(*)
      `)
      .eq('id', partnerCourseId)
      .single();

    if (courseError || !partnerCourse) {
      return NextResponse.json({ error: 'Partner course not found' }, { status: 404 });
    }

    // Check if already enrolled
    const { data: existingEnrollment } = await db
      .from('partner_lms_enrollments')
      .select('*')
      .eq('student_id', user.id)
      .eq('course_id', partnerCourseId)
      .single();

    if (existingEnrollment) {
      return NextResponse.json({
        error: 'Already enrolled in this course',
        enrollment: existingEnrollment
      }, { status: 400 });
    }

    // Create external enrollment based on provider type
    let externalEnrollmentId = `ext_${Date.now()}_${user.id.slice(0, 8)}`;
    let externalAccountId = user.email;

    // Integrate with partner LMS APIs based on provider
    const provider = partnerCourse.provider;

    if (provider?.api_endpoint && provider?.api_key) {
      try {
        // Get user profile for enrollment
        const { data: profile } = await db
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();

        // Call partner API to create enrollment
        const enrollmentResponse = await fetch(`${provider.api_endpoint}/enrollments`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${provider.api_key}`,
          },
          body: JSON.stringify({
            course_id: partnerCourse.external_course_id,
            student: {
              email: user.email,
              first_name: profile?.first_name,
              last_name: profile?.last_name,
              external_id: user.id,
            },
          }),
        });

        if (enrollmentResponse.ok) {
          const enrollmentData = await enrollmentResponse.json();
          externalEnrollmentId = enrollmentData.enrollment_id || externalEnrollmentId;
          externalAccountId = enrollmentData.account_id || externalAccountId;
        } else {
          logger.warn('Partner API enrollment failed, using local enrollment only');
        }
      } catch (apiError) {
        logger.error('Partner API error:', apiError);
        // Continue with local enrollment even if API fails
      }
    }

    // Create partner enrollment record
    const { data: enrollment, error: enrollmentError } = await db
      .from('partner_lms_enrollments')
      .insert({
        provider_id: partnerCourse.provider_id,
        student_id: user.id,
        course_id: partnerCourseId,
        program_id: programId,
        status: 'pending',
        external_enrollment_id: externalEnrollmentId,
        external_account_id: externalAccountId,
        enrolled_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (enrollmentError) {
      logger.error('Error creating partner enrollment:', enrollmentError);
      return NextResponse.json({ error: 'Failed to create enrollment' }, { status: 500 });
    }

    // Check if there's a SCORM package mapped to this course
    const { data: mapping } = await db
      .from('partner_course_mappings')
      .select(`
        *,
        scorm_package:scorm_packages(*)
      `)
      .eq('partner_course_id', partnerCourseId)
      .eq('is_active', true)
      .single();

    // If SCORM package exists, create SCORM enrollment
    if (mapping?.scorm_package) {
      await db
        .from('scorm_enrollments')
        .insert({
          scorm_package_id: mapping.scorm_package_id,
          user_id: user.id,
          enrollment_id: enrollment.id,
          status: 'not_attempted',
        });
    }

    // Log the sync
    await db
      .from('lms_sync_log')
      .insert({
        provider_id: partnerCourse.provider_id,
        sync_type: 'enrollment',
        status: 'success',
        records_processed: 1,
        sync_data: {
          enrollment_id: enrollment.id,
          course_id: partnerCourseId,
          user_id: user.id,
        },
        completed_at: new Date().toISOString(),
      });

    return NextResponse.json({
      success: true,
      enrollment,
      hasScorm: !!mapping?.scorm_package,
      scormPackage: mapping?.scorm_package,
    });
  } catch (error) { 
    logger.error('Partner enrollment error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

async function _GET(request: Request) {
  try {
    const rateLimited = await applyRateLimit(request, 'api');
    if (rateLimited) return rateLimited;

    const supabase = await createClient();
  const _admin = createAdminClient(); const db = _admin || supabase;
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId') || user.id;

    // Get all partner enrollments for user
    const { data: enrollments, error } = await db
      .from('partner_lms_enrollments')
      .select(`
        *,
        course:partner_courses(*),
        provider:partner_lms_providers(*),
        program:programs(name, slug)
      `)
      .eq('student_id', userId)
      .order('enrolled_at', { ascending: false });

    if (error) {
      logger.error('Error fetching partner enrollments:', error);
      return NextResponse.json({ error: 'Failed to fetch enrollments' }, { status: 500 });
    }

    return NextResponse.json({ enrollments });
  } catch (error) { 
    logger.error('Partner enrollment GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
export const GET = withApiAudit('/api/partner/enroll', _GET);
export const POST = withApiAudit('/api/partner/enroll', _POST);
