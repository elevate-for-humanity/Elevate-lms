import { NextRequest, NextResponse } from 'next/server';
import { apiRequireAdmin } from '@/lib/admin/guards';
import { createClient } from '@/lib/supabase/server';
import { safeError, safeInternalError } from '@/lib/api/safe-error';
import { applyRateLimit } from '@/lib/api/withRateLimit';

export const dynamic = 'force-dynamic';

function toCSV(rows: Record<string, unknown>[]): string {
  if (!rows.length) return '';
  const headers = Object.keys(rows[0]);
  const escape = (v: unknown) => {
    const s = v == null ? '' : String(v);
    return s.includes(',') || s.includes('"') || s.includes('\n')
      ? `"${s.replace(/"/g, '""')}"`
      : s;
  };
  return [
    headers.join(','),
    ...rows.map((r) => headers.map((h) => escape(r[h])).join(',')),
  ].join('\n');
}

export async function GET(request: NextRequest) {
  const rateLimited = await applyRateLimit(request, 'api');
  if (rateLimited) return rateLimited;

  const auth = await apiRequireAdmin(request);
  if (auth.error) return auth.error;

  const { searchParams } = new URL(request.url);
  const format = searchParams.get('format') || 'json';
  const type = searchParams.get('type') || 'apprentices';

  try {
    const supabase = await createClient();

    // Pull apprentice data from program_enrollments joined with profiles and programs
    const { data: enrollments, error } = await supabase
      .from('program_enrollments')
      .select(`
        id,
        user_id,
        program_id,
        enrollment_state,
        created_at,
        profiles:user_id (
          first_name,
          last_name,
          email,
          phone
        ),
        programs:program_id (
          title,
          slug
        )
      `)
      .in('enrollment_state', ['active', 'orientation', 'onboarding', 'completed'])
      .order('created_at', { ascending: false });

    if (error) return safeInternalError(error, 'Failed to fetch apprentice data');

    const apprentices = (enrollments ?? []).map((e: any) => ({
      id: e.id,
      userId: e.user_id,
      firstName: e.profiles?.first_name ?? '',
      lastName: e.profiles?.last_name ?? '',
      email: e.profiles?.email ?? '',
      phone: e.profiles?.phone ?? '',
      programName: e.programs?.title ?? '',
      programSlug: e.programs?.slug ?? '',
      status: e.enrollment_state,
      enrolledAt: e.created_at,
      // RAPIDS-specific fields — populated when OJT tracking is live
      rapidsId: null,
      occupationCode: null,
      ojtHoursCompleted: 0,
      totalHoursRequired: 0,
      rtiHoursCompleted: 0,
      rtiHoursRequired: 144,
      employerName: null,
    }));

    if (format === 'csv') {
      const csv = toCSV(
        apprentices.map((a) => ({
          'First Name': a.firstName,
          'Last Name': a.lastName,
          Email: a.email,
          Phone: a.phone,
          Program: a.programName,
          Status: a.status,
          'RAPIDS ID': a.rapidsId ?? '',
          'Occupation Code': a.occupationCode ?? '',
          'OJT Hours Completed': a.ojtHoursCompleted,
          'OJT Hours Required': a.totalHoursRequired,
          'RTI Hours Completed': a.rtiHoursCompleted,
          'RTI Hours Required': a.rtiHoursRequired,
          'Employer': a.employerName ?? '',
          'Enrolled At': a.enrolledAt,
        }))
      );
      return new NextResponse(csv, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="rapids-${type}-${new Date().toISOString().split('T')[0]}.csv"`,
        },
      });
    }

    return NextResponse.json({ ok: true, apprentices, total: apprentices.length });
  } catch (error) {
    return safeInternalError(error as Error, 'Export failed');
  }
}
