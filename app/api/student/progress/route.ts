import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { logger } from '@/lib/logger';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { withApiAudit } from '@/lib/audit/withApiAudit';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

async function _POST(request: NextRequest) {
  try {
    const rateLimited = await applyRateLimit(request, 'api');
    if (rateLimited) return rateLimited;

    const supabase = await createClient();
  const _admin = createAdminClient(); const db = _admin || supabase;
    
    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { enrollmentId, progress, moduleId } = body;

    // Validate input
    if (!enrollmentId) {
      return NextResponse.json(
        { error: 'enrollmentId is required' },
        { status: 400 }
      );
    }

    if (progress !== undefined && (progress < 0 || progress > 100)) {
      return NextResponse.json(
        { error: 'progress must be between 0 and 100' },
        { status: 400 }
      );
    }

    // Verify enrollment belongs to user
    const { data: enrollment, error: enrollmentError } = await db
      .from('program_enrollments')
      .select('id, user_id, course_id, progress, status')
      .eq('id', enrollmentId)
      .eq('user_id', user.id)
      .single();

    if (enrollmentError || !enrollment) {
      return NextResponse.json(
        { error: 'Enrollment not found' },
        { status: 404 }
      );
    }

    // Update progress
    const updates: any = {};
    
    if (progress !== undefined) {
      updates.progress = progress;
      
      // Auto-complete if progress reaches 100%
      if (progress === 100 && enrollment.status !== 'completed') {
        updates.status = 'completed';
        updates.completed_at = new Date().toISOString();
      }
    }

    const { data: updated, error: updateError } = await db
      .from('program_enrollments')
      .update(updates)
      .eq('id', enrollmentId)
      .eq('user_id', user.id)
      .select()
      .single();

    if (updateError) {
      logger.error('[Progress Update] Failed:', updateError);
      return NextResponse.json(
        { error: 'Failed to update progress' },
        { status: 500 }
      );
    }

    // If moduleId provided, mark module as completed
    if (moduleId) {
      const { error: completionError } = await db
        .from('lesson_completions')
        .upsert({
          user_id: user.id,
          course_id: enrollment.course_id,
          module_id: moduleId,
          completed_at: new Date().toISOString()
        }, {
          onConflict: 'user_id,module_id'
        });

      if (completionError) {
        logger.error('[Module Completion] Failed:', completionError);
      }
    }

    logger.info('[Progress Update] Success:', {
      userId: user.id,
      enrollmentId,
      progress: updated.progress,
      status: updated.status
    });

    return NextResponse.json({
      success: true,
      enrollment: updated
    });

  } catch (error) {
    logger.error('[Progress Update] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// GET endpoint to fetch progress
async function _GET(request: NextRequest) {
  try {
    const rateLimited = await applyRateLimit(request, 'api');
    if (rateLimited) return rateLimited;

    const supabase = await createClient();
  const _admin = createAdminClient(); const db = _admin || supabase;
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const enrollmentId = searchParams.get('enrollmentId');

    if (!enrollmentId) {
      return NextResponse.json(
        { error: 'enrollmentId is required' },
        { status: 400 }
      );
    }

    // Get enrollment with course details
    const { data: enrollment, error } = await db
      .from('program_enrollments')
      .select(`
        id,
        progress,
        status,
        started_at,
        completed_at,
        course_id,
        courses (
          id,
          title,
          slug
        )
      `)
      .eq('id', enrollmentId)
      .eq('user_id', user.id)
      .single();

    if (error || !enrollment) {
      return NextResponse.json(
        { error: 'Enrollment not found' },
        { status: 404 }
      );
    }

    // Get completed modules
    const { data: completions } = await db
      .from('lesson_completions')
      .select('module_id, completed_at')
      .eq('user_id', user.id)
      .eq('course_id', enrollment.course_id);

    return NextResponse.json({
      enrollment,
      completedModules: completions || []
    });

  } catch (error) {
    logger.error('[Progress Fetch] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
export const GET = withApiAudit('/api/student/progress', _GET);
export const POST = withApiAudit('/api/student/progress', _POST);
