import { logger } from '@/lib/logger';
import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
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

    // Get current user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const studentId = user.id;

    // Fetch enrollments with program info
    const { data: enrollments, error: enrollError } = await supabase
      .from('program_enrollments')
      .select(
        `
        id,
        program_slug,
        program:programs (
          id,
          name,
          slug,
          title,
          total_hours,
          required_hours
        )
      `,
      )
      .eq('user_id', studentId)
      .in('status', ['active', 'enrolled', 'in_progress', 'completed']);

    if (enrollError) {
      logger.error('Enrollments fetch error:', enrollError);
      return NextResponse.json({ enrollments: [] });
    }

    if (!enrollments || enrollments.length === 0) {
      return NextResponse.json({ enrollments: [] });
    }

    const enrollmentBySlug = new Map<string, any>();
    for (const enrollment of (enrollments || []) as any[]) {
      const prog = Array.isArray(enrollment.program) ? enrollment.program[0] : enrollment.program;
      enrollment.program = prog;
      const slug = enrollment.program_slug || prog?.slug;
      if (slug) enrollmentBySlug.set(slug, enrollment);
    }

    // Fetch all hours for this student from canonical hour_entries
    const { data: hours, error: hoursError } = await supabase
      .from('hour_entries')
      .select(
        'id, program_slug, work_date, hours_claimed, accepted_hours, status, notes, approved_by, approved_at, created_at',
      )
      .eq('user_id', studentId)
      .order('work_date', { ascending: false });

    if (hoursError) {
      logger.error('Hours fetch error', new Error(hoursError.message));
    }

    // Group hours by enrollment id using program_slug mapping
    const hoursByEnrollment: Record<string, any[]> = {};
    const fallbackEnrollmentId = enrollments[0]?.id;
    (hours || []).forEach((h: any) => {
      const mapped = h.program_slug ? enrollmentBySlug.get(h.program_slug) : null;
      const enrollmentId = mapped?.id || fallbackEnrollmentId;
      if (!enrollmentId) return;
      if (!hoursByEnrollment[enrollmentId]) {
        hoursByEnrollment[enrollmentId] = [];
      }
      hoursByEnrollment[enrollmentId].push({
        id: h.id,
        hours: Number(h.accepted_hours ?? h.hours_claimed ?? 0),
        description: h.notes || null,
        logged_date: h.work_date,
        verified: String(h.status || '').toLowerCase() === 'approved',
        verified_by: h.approved_by || null,
        verified_at: h.approved_at || null,
        created_at: h.created_at,
      });
    });

    // Build response
    const result = enrollments
      .filter((e) => e.program) // Only include enrollments with valid programs
      .map((enrollment) => {
        const entries = hoursByEnrollment[enrollment.id] || [];
        const verified_total = entries
          .filter((e) => e.verified)
          .reduce((sum, e) => sum + Number(e.hours), 0);
        const pending_total = entries
          .filter((e) => !e.verified)
          .reduce((sum, e) => sum + Number(e.hours), 0);

        return {
          enrollment_id: enrollment.id,
          program_name: enrollment.program?.name || enrollment.program?.title || 'Unknown Program',
          program_slug: enrollment.program_slug || enrollment.program?.slug || '',
          required_hours:
            enrollment.program?.required_hours || enrollment.program?.total_hours || null,
          entries,
          verified_total,
          pending_total,
        };
      })
      .filter((e) => e.entries.length > 0 || e.required_hours); // Only show if has hours or has requirements

    return NextResponse.json({ enrollments: result });
  } catch (error) {
    logger.error('Student hours API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
export const GET = withApiAudit('/api/student/hours', _GET);
