import { logger } from '@/lib/logger';
import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { withApiAudit } from '@/lib/audit/withApiAudit';

/**
 * GET /api/student/dashboard
 * 
 * Returns student dashboard data:
 * - Active enrollments with program info
 * - Verified hours by enrollment
 * - Pending hours by enrollment
 * - Tasks by enrollment with status
 * 
 * Strict rendering: Returns empty arrays if no data (never fake data).
 */
async function _GET(request: Request) {
  try {
    const rateLimited = await applyRateLimit(request, 'api');
    if (rateLimited) return rateLimited;

    const supabase = await createClient();
  const _admin = createAdminClient(); const db = _admin || supabase;
    if (!supabase) {
      return NextResponse.json({ error: 'Database unavailable' }, { status: 503 });
    }

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const studentId = user.id;

    // Fetch active enrollments with program info
    const { data: enrollments, error: enrollError } = await db
      .from('program_enrollments')
      .select(`
        id,
        status,
        enrolled_at,
        program:programs (
          id,
          name,
          slug,
          category,
          duration_weeks,
          required_hours
        )
      `)
      .eq('student_id', studentId)
      .in('status', ['active', 'enrolled', 'in_progress'])
      .order('enrolled_at', { ascending: false });

    if (enrollError) {
      logger.error('Enrollments fetch error:', enrollError);
    }

    // Fetch verified hours grouped by enrollment
    const { data: verifiedHours, error: verifiedError } = await db
      .from('student_hours')
      .select('enrollment_id, hours')
      .eq('student_id', studentId)
      .eq('verified', true);

    if (verifiedError) {
      logger.error('Verified hours fetch error:', verifiedError);
    }

    // Fetch pending hours grouped by enrollment
    const { data: pendingHours, error: pendingError } = await db
      .from('student_hours')
      .select('enrollment_id, hours')
      .eq('student_id', studentId)
      .eq('verified', false);

    if (pendingError) {
      logger.error('Pending hours fetch error:', pendingError);
    }

    // Fetch tasks for student's enrollments
    const enrollmentIds = (enrollments || []).map(e => e.id);
    let tasks: any[] = [];
    
    if (enrollmentIds.length > 0) {
      const { data: taskData, error: taskError } = await db
        .from('student_tasks')
        .select(`
          id,
          status,
          submitted_at,
          enrollment_id,
          task:program_tasks (
            id,
            title,
            instructions,
            due_days
          )
        `)
        .eq('student_id', studentId)
        .in('enrollment_id', enrollmentIds)
        .order('created_at', { ascending: true });

      if (taskError) {
        logger.error('Tasks fetch error:', taskError);
      } else {
        tasks = taskData || [];
      }
    }

    // Aggregate hours by enrollment
    const hoursByEnrollment: Record<string, { verified: number; pending: number }> = {};
    
    (verifiedHours || []).forEach(h => {
      if (!hoursByEnrollment[h.enrollment_id]) {
        hoursByEnrollment[h.enrollment_id] = { verified: 0, pending: 0 };
      }
      hoursByEnrollment[h.enrollment_id].verified += Number(h.hours);
    });

    (pendingHours || []).forEach(h => {
      if (!hoursByEnrollment[h.enrollment_id]) {
        hoursByEnrollment[h.enrollment_id] = { verified: 0, pending: 0 };
      }
      hoursByEnrollment[h.enrollment_id].pending += Number(h.hours);
    });

    // Build response with enriched enrollment data
    const enrichedEnrollments = (enrollments || []).map(enrollment => ({
      ...enrollment,
      hours: hoursByEnrollment[enrollment.id] || { verified: 0, pending: 0 },
      tasks: tasks.filter(t => t.enrollment_id === enrollment.id),
    }));

    return NextResponse.json({
      enrollments: enrichedEnrollments,
      totalVerifiedHours: Object.values(hoursByEnrollment).reduce((sum, h) => sum + h.verified, 0),
      totalPendingHours: Object.values(hoursByEnrollment).reduce((sum, h) => sum + h.pending, 0),
      totalTasks: tasks.length,
      completedTasks: tasks.filter(t => t.status === 'approved').length,
    });
  } catch (error) {
    logger.error('Student dashboard API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
export const GET = withApiAudit('/api/student/dashboard', _GET);
