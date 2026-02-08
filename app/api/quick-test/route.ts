import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;
import { createClient } from '@/lib/supabase/server';
import { toError, toErrorMessage } from '@/lib/safe';

export async function GET() {
  try {
    const supabase = await createClient();

    // Get first student
    const { data: student } = await supabase
      .from('profiles')
      .select('id, email, full_name')
      .eq('role', 'student')
      .limit(1)
      .single();

    if (!student) {
      return NextResponse.json({
        error: 'No students found. Create a student first.',
      });
    }

    // Get barber program
    const programId = '65310ca8-c7a8-4633-ab9c-d25684090ecc';

    // Check if already enrolled
    const { data: existing } = await supabase
      .from('enrollments')
      .select('id, status')
      .eq('student_id', student.id)
      .eq('program_id', programId)
      .maybeSingle();

    if (existing) {
      return NextResponse.json({
        success: true,
        message: 'Student already enrolled',
        student: {
          id: student.id,
          email: student.email,
          name: student.full_name,
        },
        enrollment: {
          id: existing.id,
          status: existing.status,
        },
        action: 'already_enrolled',
      });
    }

    // Create enrollment
    const { data: newEnrollment, error } = await supabase
      .from('enrollments')
      .insert({
        student_id: student.id,
        program_id: programId,
        status: 'active',
        payment_status: 'paid',
        enrolled_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({
        error: toErrorMessage(error),
        details: error,
      });
    }

    return NextResponse.json({
      success: true,
      message: '✅ Enrollment created successfully!',
      student: {
        id: student.id,
        email: student.email,
        name: student.full_name,
      },
      enrollment: {
        id: newEnrollment.id,
        status: newEnrollment.status,
        payment_status: newEnrollment.payment_status,
      },
      action: 'created',
    });
  } catch (err: any) {
    return NextResponse.json({
      err: toErrorMessage(err) || 'Internal server err',
    });
  }
}
