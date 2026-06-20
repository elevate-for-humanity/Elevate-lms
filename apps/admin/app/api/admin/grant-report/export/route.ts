import { NextRequest, NextResponse } from 'next/server';
import { apiRequireAdmin } from '@/lib/admin/guards';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { requireAdminClient } from '@/lib/supabase/admin';
import { safeInternalError } from '@/lib/api/safe-error';
import { PLATFORM_DEFAULTS } from '@/lib/config/platform-config';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  const rateLimited = await applyRateLimit(req, 'api');
  if (rateLimited) return rateLimited;
  const auth = await apiRequireAdmin(req);
  if (auth.error) return auth.error;

  const { searchParams } = new URL(req.url);
  const format = searchParams.get('format') ?? 'csv';
  const from = searchParams.get('from') ?? new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  const to = searchParams.get('to') ?? new Date().toISOString().split('T')[0];

  try {
    const db = await requireAdminClient();

    const [enrollmentsRes, certsRes, pccRes, hoursRes, programsRes] = await Promise.all([
      db.from('program_enrollments')
        .select('id, status, created_at, updated_at, program_id, user_id, programs:program_id(name, slug)')
        .gte('created_at', from)
        .lte('created_at', to + 'T23:59:59Z')
        .order('created_at', { ascending: false }),

      db.from('certificates')
        .select('id, issued_at, user_id, program_id, credential_name')
        .gte('issued_at', from)
        .lte('issued_at', to + 'T23:59:59Z'),

      db.from('program_completion_certificates')
        .select('id, issued_at, user_id, program_id')
        .gte('issued_at', from)
        .lte('issued_at', to + 'T23:59:59Z'),

      db.from('hour_entries')
        .select('user_id, accepted_hours, status, work_date')
        .eq('status', 'approved')
        .gte('work_date', from)
        .lte('work_date', to),

      db.from('programs')
        .select('id, name, slug')
        .eq('is_active', true),
    ]);

    const enrollments = enrollmentsRes.data ?? [];
    const certs = [...(certsRes.data ?? []), ...(pccRes.data ?? [])];
    const hours = hoursRes.data ?? [];
    const programs = programsRes.data ?? [];

    const totalHours = hours.reduce((sum, e) => sum + (Number(e.accepted_hours) || 0), 0);
    const completedEnrollments = enrollments.filter(e => e.status === 'completed').length;

    if (format === 'csv') {
      const rows = [
        ['Grant Report — Sit Selfish Inc / ' + PLATFORM_DEFAULTS.orgName + ''],
        [`Period: ${from} to ${to}`],
        [`Generated: ${new Date().toISOString()}`],
        [],
        ['SUMMARY'],
        ['Metric', 'Value'],
        ['Total Enrollments', enrollments.length],
        ['Completed Programs', completedEnrollments],
        ['Credentials Issued', certs.length],
        ['Approved Training Hours', Math.round(totalHours)],
        ['Active Programs', programs.length],
        [],
        ['ENROLLMENTS'],
        ['Enrollment ID', 'Program', 'Status', 'Enrolled Date'],
        ...enrollments.map(e => [
          e.id,
          (e.programs as any)?.name ?? e.program_id,
          e.status,
          e.created_at?.split('T')[0] ?? '',
        ]),
        [],
        ['CREDENTIALS ISSUED'],
        ['Certificate ID', 'Program ID', 'Issued Date'],
        ...certs.map(c => [c.id, c.program_id ?? '', (c as any).issued_at?.split('T')[0] ?? '']),
      ];

      const csv = rows.map(row =>
        Array.isArray(row)
          ? row.map(cell => `"${String(cell ?? '').replace(/"/g, '""')}"`).join(',')
          : ''
      ).join('\n');

      return new NextResponse(csv, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="grant-report-${from}-to-${to}.csv"`,
        },
      });
    }

    // JSON format
    return NextResponse.json({
      period: { from, to },
      generated_at: new Date().toISOString(),
      organization: 'Sit Selfish Inc / ' + PLATFORM_DEFAULTS.orgName + '',
      summary: {
        total_enrollments: enrollments.length,
        completed_programs: completedEnrollments,
        credentials_issued: certs.length,
        approved_training_hours: Math.round(totalHours),
        active_programs: programs.length,
        completion_rate: enrollments.length > 0
          ? Math.round((completedEnrollments / enrollments.length) * 100)
          : 0,
      },
      programs: programs.map(p => ({
        id: p.id,
        name: p.name,
        enrollments: enrollments.filter(e => e.program_id === p.id).length,
        completions: enrollments.filter(e => e.program_id === p.id && e.status === 'completed').length,
      })),
    });
  } catch (err) {
    return safeInternalError(err, 'Failed to generate grant report.');
  }
}
