import { logger } from '@/lib/logger';
import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { 
  getNextRequiredAction, 
  getActionRoute, 
  getActionCTA, 
  getActionDescription,
  type EnrollmentState 
} from '@/lib/enrollment/state-machine';

export async function GET(req: Request) {
  try {
    const supabase = await createClient();
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const url = new URL(req.url);
    const programId = url.searchParams.get('program_id');

    // Get the user's enrollment
    let query = supabase
      .from('program_enrollments')
      .select('id, enrollment_state, program_id, training_programs(slug, name)')
      .eq('user_id', user.id);

    if (programId) {
      query = query.eq('program_id', programId);
    }

    const { data: enrollment, error } = await query.order('created_at', { ascending: false }).limit(1).single();

    if (error || !enrollment) {
      return NextResponse.json({ 
        action: null,
        message: 'No active enrollment found'
      });
    }

    const state = enrollment.enrollment_state as EnrollmentState;
    const action = getNextRequiredAction(state);
    const programSlug = (enrollment.training_programs as any)?.slug;

    return NextResponse.json({
      enrollment_id: enrollment.id,
      program_id: enrollment.program_id,
      program_name: (enrollment.training_programs as any)?.name,
      current_state: state,
      action,
      route: getActionRoute(action, programSlug),
      cta: getActionCTA(action),
      description: getActionDescription(action),
    });
  } catch (err) {
    logger.error('Error getting next action:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
