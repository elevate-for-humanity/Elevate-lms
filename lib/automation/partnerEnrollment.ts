import { createClient } from '@/lib/supabase/server';

// lib/automation/partnerEnrollment.ts
import { getPartnerClient, PartnerType, StudentData } from '../partners';

type UUID = string;

export interface AutoEnrollmentRequest {
  studentId: UUID;
  partnerId: UUID; // row in partner_lms_providers
  courseId: UUID; // row in partner_courses
  programId?: UUID;
}

export interface AutoEnrollmentResult {
  success: boolean;
  enrollmentId?: UUID;
  externalEnrollmentId?: string;
  launchUrl?: string;
  error?: string;
}



export async function autoEnrollPartnerCourse(
  payload: AutoEnrollmentRequest
): Promise<AutoEnrollmentResult> {
  const supabase = await createClient();

  try {
    // 1) Load student profile
    const { data: student, error: studentError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', payload.studentId)
      .maybeSingle();

    if (studentError || !student) {
      throw new Error('Student not found');
    }

    // 2) Load partner provider row
    const { data: partner, error: partnerError } = await supabase
      .from('partner_lms_providers')
      .select('*')
      .eq('id', payload.partnerId)
      .maybeSingle();

    if (partnerError || !partner) {
      throw new Error('Partner LMS provider not found');
    }

    // 3) Load partner course metadata
    const { data: course, error: courseError } = await supabase
      .from('partner_lms_courses')
      .select('*')
      .eq('id', payload.courseId)
      .maybeSingle();

    if (courseError || !course) {
      throw new Error('Partner course not found');
    }

    const partnerType = partner.provider_type as PartnerType;
    const client = getPartnerClient(partnerType);

    const studentData: StudentData = {
      id: student.id,
      email: student.email,
      firstName: (student.full_name ?? '').split(' ')[0] || 'Student',
      lastName: (student.full_name ?? '').split(' ').slice(1).join(' '),
      phone: student.phone,
      dateOfBirth: student.date_of_birth,
    };

    // 4) Create account on partner platform
    const account = await client.createAccount(studentData);

    // 5) Enroll in the specific course
    const enrollment = await client.enrollInCourse(
      account.externalId,
      course.external_course_code ?? course.course_code
    );

    // 6) Get SSO / launch URL
    const launchUrl = await client.getSsoLaunchUrl({
      accountExternalId: account.externalId,
      externalEnrollmentId: enrollment.externalEnrollmentId,
      returnTo: `${process.env.NEXT_PUBLIC_APP_URL}/learner/dashboard`,
    });

    // 7) Save enrollment in Supabase
    const { data: dbEnrollment, error: dbError } = await supabase
      .from('partner_lms_enrollments')
      .insert({
        provider_id: payload.partnerId,
        student_id: payload.studentId,
        course_id: payload.courseId,
        program_id: payload.programId ?? null,
        status: 'active',
        enrolled_at: new Date().toISOString(),
        external_enrollment_id: enrollment.externalEnrollmentId,
        metadata: {
          partner_type: partnerType,
          external_account_id: account.externalId,
          username: account.username,
          login_url: account.loginUrl,
          access_url: enrollment.accessUrl,
        },
      })
      .select('*')
      .maybeSingle();

    if (dbError || !dbEnrollment) {
      throw dbError ?? new Error('Could not save enrollment');
    }

    // 8) OPTIONAL: fire Supabase Edge Function to send welcome email
    await supabase.functions.invoke('send-partner-enrollment-email', {
      body: {
        to: student.email,
        studentName: student.full_name ?? 'Student',
        courseName: course.course_name,
        partnerName: partner.provider_name,
        launchUrl,
        partnerLoginUrl: account.loginUrl,
        username: account.username,
      },
    });

    return {
      success: true,
      enrollmentId: dbEnrollment.id,
      externalEnrollmentId: enrollment.externalEnrollmentId,
      launchUrl,
    };
  } catch (err: any) {
    // Error: $1

    const supabase2 = await createClient();
    await supabase2.from('partner_lms_enrollment_failures').insert({
      student_id: payload.studentId,
      provider_id: payload.partnerId,
      course_id: payload.courseId,
      program_id: payload.programId ?? null,
      error_message: 'Operation failed',
    });

    return {
      success: false,
      error: 'Operation failed',
    };
  }
}
