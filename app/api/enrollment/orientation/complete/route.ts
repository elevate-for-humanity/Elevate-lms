import { logger } from '@/lib/logger';
import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(req: Request) {
  try {
    const supabase = await createClient();
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { enrollment_id } = await req.json();

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
    if (enrollment.enrollment_state !== 'confirmed') {
      if (enrollment.enrollment_state === 'orientation_complete' || 
          enrollment.enrollment_state === 'documents_complete' ||
          enrollment.enrollment_state === 'active') {
        return NextResponse.json({ 
          success: true, 
          message: 'Orientation already completed',
          redirect: '/enrollment/documents'
        });
      }
      return NextResponse.json({ 
        error: 'Cannot complete orientation from current state',
        current_state: enrollment.enrollment_state
      }, { status: 400 });
    }

    // Advance state
    const { error: updateError } = await supabase
      .from('program_enrollments')
      .update({
        enrollment_state: 'orientation_complete',
        orientation_completed_at: new Date().toISOString(),
        next_required_action: 'DOCUMENTS',
      })
      .eq('id', enrollment_id);

    if (updateError) {
      logger.error('Failed to update enrollment:', updateError);
      return NextResponse.json({ error: 'Failed to complete orientation' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'Orientation completed',
      redirect: '/enrollment/documents',
    });
  } catch (err) {
    logger.error('Orientation complete error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
