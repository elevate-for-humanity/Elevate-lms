import { logger } from '@/lib/logger';
import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { withApiAudit } from '@/lib/audit/withApiAudit';

async function _POST(req: Request) {
  try {
    const rateLimited = await applyRateLimit(req, 'contact');
    if (rateLimited) return rateLimited;

    const supabase = await createClient();
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { enrollment_id, documents } = await req.json();

    if (!enrollment_id) {
      return NextResponse.json({ error: 'Missing enrollment_id' }, { status: 400 });
    }

    // Verify ownership and current state
    const { data: enrollment, error: fetchError } = await supabase
      .from('program_enrollments')
      .select('id, user_id, enrollment_state, program_id, email, full_name')
      .eq('id', enrollment_id)
      .single();

    if (fetchError || !enrollment) {
      return NextResponse.json({ error: 'Enrollment not found' }, { status: 404 });
    }

    if (enrollment.user_id !== user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Check state allows transition
    if (enrollment.enrollment_state !== 'orientation_complete') {
      if (enrollment.enrollment_state === 'documents_complete' || 
          enrollment.enrollment_state === 'active') {
        return NextResponse.json({ 
          success: true, 
          message: 'Documents already submitted',
          redirect: '/dashboard'
        });
      }
      return NextResponse.json({ 
        error: 'Cannot submit documents from current state',
        current_state: enrollment.enrollment_state
      }, { status: 400 });
    }

    // Store document references (optional - for audit trail)
    if (documents && Array.isArray(documents)) {
      // Could store in enrollment_documents table
      // For now, just log
      logger.info('Documents submitted:', documents);
    }

    const now = new Date().toISOString();

    // Advance state to active in program_enrollments
    const { error: updateError } = await supabase
      .from('program_enrollments')
      .update({
        enrollment_state: 'active',
        documents_completed_at: now,
        documents_submitted_at: now,
        next_required_action: 'START_COURSE_1',
        status: 'ACTIVE',
      })
      .eq('id', enrollment_id);

    // Mirror documents_submitted_at to training_enrollments — apprentice portal gate reads this
    await supabase
      .from('training_enrollments')
      .update({ documents_submitted_at: now, updated_at: now })
      .eq('user_id', user.id)
      .is('documents_submitted_at', null);

    if (updateError) {
      logger.error('Failed to update enrollment:', updateError);
      return NextResponse.json({ error: 'Failed to complete documents' }, { status: 500 });
    }

    // Bridge: create training_enrollments so the student can access course content.
    if (enrollment.program_id) {
      try {
        const { data: linkedCourses } = await supabase
          .from('training_courses')
          .select('id')
          .eq('program_id', enrollment.program_id);

        if (linkedCourses && linkedCourses.length > 0) {
          for (const course of linkedCourses) {
            await supabase
              .from('training_enrollments')
              .upsert({
                user_id: user.id,
                course_id: course.id,
                status: 'active',
                progress: 0,
                enrolled_at: new Date().toISOString(),
              }, { onConflict: 'user_id,course_id' });
          }
          logger.info('Created training_enrollments for activated student', {
            userId: user.id,
            programId: enrollment.program_id,
            courseCount: linkedCourses.length,
          });
        } else {
          logger.warn('No training_courses found for program', { programId: enrollment.program_id });
        }
      } catch (bridgeErr) {
        logger.error('Failed to create training_enrollments bridge', bridgeErr as Error);
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Documents submitted. Enrollment activated.',
      redirect: '/dashboard',
    });
  } catch (err) {
    logger.error('Documents complete error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
export const POST = withApiAudit('/api/enrollment/documents/complete', _POST);
