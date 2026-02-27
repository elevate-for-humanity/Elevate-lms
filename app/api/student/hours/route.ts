import { logger } from '@/lib/logger';
import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { withApiAudit } from '@/lib/audit/withApiAudit';

/**
 * GET /api/student/hours
 * 
 * Returns detailed hours log for the current student.
 * Groups by enrollment with verified/pending breakdown.
 * Strict rendering: Returns empty array if no data.
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

    // Fetch enrollments with program info
    const { data: enrollments, error: enrollError } = await db
      .from('program_enrollments')
      .select(`
        id,
        program:programs (
          id,
          name,
          slug,
          required_hours
        )
      `)
      .eq('student_id', studentId)
      .in('status', ['active', 'enrolled', 'in_progress', 'completed']);

    if (enrollError) {
      logger.error('Enrollments fetch error:', enrollError);
      return NextResponse.json({ enrollments: [] });
    }

    if (!enrollments || enrollments.length === 0) {
      return NextResponse.json({ enrollments: [] });
    }

    // Fetch all hours for this student
    const { data: hours, error: hoursError } = await db
      .from('student_hours')
      .select('*')
      .eq('student_id', studentId)
      .order('logged_date', { ascending: false });

    if (hoursError) {
      logger.error('Hours fetch error:', hoursError);
    }

    // Group hours by enrollment
    const hoursByEnrollment: Record<string, typeof hours> = {};
    (hours || []).forEach(h => {
      if (!hoursByEnrollment[h.enrollment_id]) {
        hoursByEnrollment[h.enrollment_id] = [];
      }
      hoursByEnrollment[h.enrollment_id].push(h);
    });

    // Build response
    const result = enrollments
      .filter(e => e.program) // Only include enrollments with valid programs
      .map(enrollment => {
        const entries = hoursByEnrollment[enrollment.id] || [];
        const verified_total = entries
          .filter(e => e.verified)
          .reduce((sum, e) => sum + Number(e.hours), 0);
        const pending_total = entries
          .filter(e => !e.verified)
          .reduce((sum, e) => sum + Number(e.hours), 0);

        return {
          enrollment_id: enrollment.id,
          program_name: enrollment.program?.name || 'Unknown Program',
          program_slug: enrollment.program?.slug || '',
          required_hours: enrollment.program?.required_hours || null,
          entries,
          verified_total,
          pending_total,
        };
      })
      .filter(e => e.entries.length > 0 || e.required_hours); // Only show if has hours or has requirements

    return NextResponse.json({ enrollments: result });
  } catch (error) {
    logger.error('Student hours API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
export const GET = withApiAudit('/api/student/hours', _GET);
