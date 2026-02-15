import { logger } from '@/lib/logger';
import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { applyRateLimit } from '@/lib/api/withRateLimit';

export async function POST(req: Request) {
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
      .select('id, user_id, enrollment_state')
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

    // Advance state to documents_complete, then immediately to active
    const { error: updateError } = await supabase
      .from('program_enrollments')
      .update({
        enrollment_state: 'active',
        documents_completed_at: new Date().toISOString(),
        next_required_action: 'START_COURSE_1',
        status: 'ACTIVE',
      })
      .eq('id', enrollment_id);

    if (updateError) {
      logger.error('Failed to update enrollment:', updateError);
      return NextResponse.json({ error: 'Failed to complete documents' }, { status: 500 });
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
