import { logger } from '@/lib/logger';
import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
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

    // Get current user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const studentId = user.id;

    // Fetch active enrollments with program info
    const { data: enrollments, error: enrollError } = await supabase
      .from('program_enrollments')
      .select(
        `
        id,
        program_slug,
        status,
        enrolled_at,
        program:programs (
          id,
          name,
          slug,
          category,
          duration_weeks,
          required_hours,
          total_hours
        )
      `,
      )
      .eq('user_id', studentId)
      .in('status', ['active', 'enrolled', 'in_progress'])
      .order('enrolled_at', { ascending: false });

    if (enrollError) {
      logger.error('Enrollments fetch error:', enrollError);
    }

    const { data: hourEntries, error: hoursError } = await supabase
      .from('hour_entries')
      .select('program_slug, status, hours_claimed, accepted_hours')
      .eq('user_id', studentId);

    if (hoursError) {
      logger.error('Hours fetch error:', hoursError);
    }

    // Fetch tasks for student's enrollments
    const enrollmentIds = (enrollments || []).map((e) => e.id);
    let tasks: any[] = [];

    if (enrollmentIds.length > 0) {
      const { data: taskData, error: taskError } = await supabase
        .from('student_tasks')
        .select(
          `
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
        `,
        )
        .eq('student_id', studentId)
        .in('enrollment_id', enrollmentIds)
        .order('created_at', { ascending: true });

      if (taskError) {
        logger.error('Tasks fetch error:', taskError);
      } else {
        tasks = taskData || [];
      }
    }

    // Aggregate hours by enrollment (mapped by program_slug)
    const hoursByEnrollment: Record<string, { verified: number; pending: number }> = {};
    const enrollmentIdBySlug = new Map<string, string>();
    for (const enrollment of enrollments || []) {
      const slug = enrollment.program_slug || enrollment.program?.slug;
      if (slug) enrollmentIdBySlug.set(slug, enrollment.id);
    }

    (hourEntries || []).forEach((h: any) => {
      const enrollmentId = (h.program_slug && enrollmentIdBySlug.get(h.program_slug)) || null;
      if (!enrollmentId) return;
      if (!hoursByEnrollment[enrollmentId]) {
        hoursByEnrollment[enrollmentId] = { verified: 0, pending: 0 };
      }
      const amount = Number(h.accepted_hours ?? h.hours_claimed ?? 0);
      if (String(h.status || '').toLowerCase() === 'approved') {
        hoursByEnrollment[enrollmentId].verified += amount;
      } else {
        hoursByEnrollment[enrollmentId].pending += amount;
      }
    });

    // Build response with enriched enrollment data
    const enrichedEnrollments = (enrollments || []).map((enrollment) => ({
      ...enrollment,
      hours: hoursByEnrollment[enrollment.id] || { verified: 0, pending: 0 },
      tasks: tasks.filter((t) => t.enrollment_id === enrollment.id),
    }));

    return NextResponse.json({
      enrollments: enrichedEnrollments,
      totalVerifiedHours: Object.values(hoursByEnrollment).reduce((sum, h) => sum + h.verified, 0),
      totalPendingHours: Object.values(hoursByEnrollment).reduce((sum, h) => sum + h.pending, 0),
      totalTasks: tasks.length,
      completedTasks: tasks.filter((t) => t.status === 'approved').length,
    });
  } catch (error) {
    logger.error('Student dashboard API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
export const GET = withApiAudit('/api/student/dashboard', _GET);
