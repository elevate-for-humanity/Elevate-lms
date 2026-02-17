/**
 * @deprecated Use canonical enrollment routes:
 *   - /api/enroll (student enrollment)
 *   - /api/enrollment/submit (comprehensive wizard)
 *   - /api/enrollments/create-enforced (admin/partner)
 */

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { createAccount, enrollInCourse } from '@/lib/partners/milady';
import { toErrorMessage } from '@/lib/safe';
import { applyRateLimit } from '@/lib/api/withRateLimit';

export async function POST(request: Request) {
  try {
    const rateLimited = await applyRateLimit(request, 'api');
    if (rateLimited) return rateLimited;

    const { studentId, programId } = await request.json();

    const supabase = await createClient();

    // Get student profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', studentId)
      .single();

    if (!profile) {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 });
    }

    // Get Milady provider
    const { data: provider } = await supabase
      .from('partner_lms_providers')
      .select('*')
      .eq('provider_type', 'milady')
      .single();

    if (!provider) {
      return NextResponse.json(
        { error: 'Milady provider not configured' },
        { status: 500 }
      );
    }

    // Get required RISE courses for this program
    const { data: requiredCourses } = await supabase
      .from('partner_lms_courses')
      .select('*')
      .eq('provider_id', provider.id)
      .eq('is_required', true);

    if (!requiredCourses || requiredCourses.length === 0) {
      return NextResponse.json(
        { message: 'No required courses found' },
        { status: 200 }
      );
    }

    // Create Milady account if doesn't exist
    let externalStudentId = profile.external_lms_id;

    if (!externalStudentId) {
      try {
        const miladyAccount = await createAccount(
          {
            email: profile.email,
            firstName:
              profile.first_name ||
              profile.full_name?.split(' ')[0] ||
              'Student',
            lastName:
              profile.last_name ||
              profile.full_name?.split(' ').slice(1).join(' ') ||
              '',
            phone: profile.phone || '',
          },
          provider.api_key
        );

        externalStudentId = miladyAccount.id;

        // Update profile with external ID
        await supabase
          .from('profiles')
          .update({ external_lms_id: externalStudentId })
          .eq('id', studentId);
      } catch (error) { 
        // Error: $1
        return NextResponse.json(
          { error: 'Failed to create Milady account' },
          { status: 500 }
        );
      }
    }

    // Enroll in each required course
    const enrollments = [];
    for (const course of requiredCourses) {
      try {
        // Check if already enrolled
        const { data: existing } = await supabase
          .from('partner_lms_enrollments')
          .select('id')
          .eq('student_id', studentId)
          .eq('course_id', course.id)
          .single();

        if (existing) {
          enrollments.push({ courseId: course.id, status: 'already_enrolled' });
          continue;
        }

        // Enroll in Milady
        const miladyEnrollment = await enrollInCourse(
          externalStudentId,
          course.external_course_id,
          provider.api_key
        );

        // Create enrollment record
        const { data: enrollment } = await supabase
          .from('partner_lms_enrollments')
          .insert({
            student_id: studentId,
            provider_id: provider.id,
            course_id: course.id,
            course_name: course.course_name,
            external_student_id: externalStudentId,
            external_course_id: course.external_course_id,
            external_enrollment_id: miladyEnrollment.id,
            status: 'active',
            enrolled_at: new Date().toISOString(),
          })
          .select()
          .single();

        enrollments.push({
          courseId: course.id,
          enrollmentId: enrollment.id,
          status: 'enrolled',
        });
      } catch (error) { 
        // Error logged
        enrollments.push({
          courseId: course.id,
          status: 'error',
          error: toErrorMessage(error),
        });
      }
    }

    return NextResponse.json({
      success: true,
      externalStudentId,
      enrollments,
    });
  } catch (error) { 
    // Error: $1
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
