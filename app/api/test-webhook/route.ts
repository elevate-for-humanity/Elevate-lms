import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;
import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/logger';
import { toError, toErrorMessage } from '@/lib/safe';

// TEST ONLY - Simulates webhook without Stripe payment
export async function POST(req: Request) {
  try {
    const { studentId, programId } = await req.json();

    if (!studentId || !programId) {
      return NextResponse.json(
        { error: 'Missing studentId or programId' },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Simulate what the webhook does
    logger.info('[TEST] Simulating webhook for:', { studentId, programId });

    // Check if enrollment exists
    const { data: existing } = await supabase
      .from('enrollments')
      .select('id, status')
      .eq('student_id', studentId)
      .eq('program_id', programId)
      .maybeSingle();

    if (!existing) {
      // Create new enrollment
      const { data: newEnrollment, error } = await supabase
        .from('enrollments')
        .insert({
          student_id: studentId,
          program_id: programId,
          status: 'active',
          payment_status: 'paid',
          enrolled_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) {
        // Error: $1
        return NextResponse.json(
          { error: toErrorMessage(error) },
          { status: 500 }
        );
      }

      logger.info('[TEST] ✅ Created enrollment:', newEnrollment.id);

      return NextResponse.json({
        success: true,
        message: 'Enrollment created',
        enrollmentId: newEnrollment.id,
        action: 'created',
      });
    } else if (existing.status !== 'active') {
      // Activate existing enrollment
      const { error } = await supabase
        .from('enrollments')
        .update({
          status: 'active',
          payment_status: 'paid',
          enrolled_at: new Date().toISOString(),
        })
        .eq('id', existing.id);

      if (error) {
        // Error: $1
        return NextResponse.json(
          { error: toErrorMessage(error) },
          { status: 500 }
        );
      }

      logger.info('[TEST] ✅ Activated enrollment:', existing.id);

      return NextResponse.json({
        success: true,
        message: 'Enrollment activated',
        enrollmentId: existing.id,
        action: 'activated',
      });
    } else {
      logger.info('[TEST] Enrollment already active:', existing.id);

      return NextResponse.json({
        success: true,
        message: 'Enrollment already active',
        enrollmentId: existing.id,
        action: 'already_active',
      });
    }
  } catch (err: any) {
    // Error: $1
    return NextResponse.json(
      { err: toErrorMessage(err) || 'Internal server err' },
      { status: 500 }
    );
  }
}
