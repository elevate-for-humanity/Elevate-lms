
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { logAuditEvent, AuditActions } from '@/lib/audit';
import { applyRateLimit } from '@/lib/api/withRateLimit';
export const runtime = 'nodejs';
export const maxDuration = 60;

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const rateLimited = await applyRateLimit(req, 'api');
    if (rateLimited) return rateLimited;

    const supabase = await createClient();

    // Check authentication
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check admin role
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profile?.role !== 'admin' && profile?.role !== 'super_admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Get query parameters
    const { searchParams } = new URL(req.url);
    const format = searchParams.get('format') || 'csv';
    const program = searchParams.get('program');
    const status = searchParams.get('status');
    const startDate = searchParams.get('start_date');
    const endDate = searchParams.get('end_date');
    const includeGrades = searchParams.get('include_grades') === 'true';
    const includeAttendance = searchParams.get('include_attendance') === 'true';
    const includeCertificates = searchParams.get('include_certificates') === 'true';
    const includeFinancial = searchParams.get('include_financial') === 'true';

    // Build query
    let query = supabase
      .from('profiles')
      .select(`
        id,
        full_name,
        email,
        phone,
        created_at,
        enrollments (
          id,
          status,
          progress,
          enrolled_at,
          completed_at,
          funding_source,
          tuition_amount,
          paid_amount,
          program:programs (
            name,
            slug
          )
        )
      `)
      .eq('role', 'student');

    // Apply date filters
    if (startDate) {
      query = query.gte('created_at', startDate);
    }
    if (endDate) {
      query = query.lte('created_at', endDate);
    }

    const { data: students, error } = await query.order('created_at', { ascending: false });

    if (error) {
      // Error: $1
      throw error;
    }

    // Filter by program and status if specified
    let filteredStudents = students || [];

    if (program || status) {
      filteredStudents = filteredStudents.filter((student: any) => {
        if (!student.enrollments || student.enrollments.length === 0) return false;

        return student.enrollments.some((enrollment: any) => {
          const programMatch = !program || enrollment.program?.slug === program;
          const statusMatch = !status || enrollment.status === status;
          return programMatch && statusMatch;
        });
      });
    }

    // Log audit event
    await logAuditEvent({
      userId: user.id,
      action: AuditActions.DATA_EXPORTED,
      resourceType: 'students',
      metadata: {
        format,
        count: filteredStudents.length,
        filters: { program, status, startDate, endDate },
      },
    });

    // Generate CSV
    if (format === 'csv') {
      const headers = [
        'Student ID',
        'Full Name',
        'Email',
        'Phone',
        'Joined Date',
        'Program',
        'Enrollment Status',
        'Progress %',
        'Enrolled Date',
        'Completed Date',
        'Funding Source',
      ];

      if (includeFinancial) {
        headers.push('Tuition Amount', 'Paid Amount', 'Balance');
      }

      const rows = filteredStudents.flatMap((student: any) => {
        if (!student.enrollments || student.enrollments.length === 0) {
          // Student with no enrollments
          return [[
            student.id,
            student.full_name || '',
            student.email || '',
            student.phone || '',
            formatDate(student.created_at),
            'No Enrollment',
            'N/A',
            '0',
            '',
            '',
            '',
            ...(includeFinancial ? ['', '', ''] : []),
          ]];
        }

        // One row per enrollment
        return student.enrollments.map((enrollment: any) => {
          const row = [
            student.id,
            student.full_name || '',
            student.email || '',
            student.phone || '',
            formatDate(student.created_at),
            enrollment.program?.name || 'Unknown',
            enrollment.status || '',
            enrollment.progress || '0',
            formatDate(enrollment.enrolled_at),
            formatDate(enrollment.completed_at),
            enrollment.funding_source || '',
          ];

          if (includeFinancial) {
            const tuition = enrollment.tuition_amount || 0;
            const paid = enrollment.paid_amount || 0;
            const balance = tuition - paid;
            row.push(
              tuition.toString(),
              paid.toString(),
              balance.toString()
            );
          }

          return row;
        });
      });

      const csv = [
        headers.join(','),
        ...rows.map(row => row.map(escapeCsvField).join(','))
      ].join('\n');

      const timestamp = new Date().toISOString().split('T')[0];
      const filename = `students_export_${timestamp}.csv`;

      return new NextResponse(csv, {
        status: 200,
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': `attachment; filename="${filename}"`,
        },
      });
    }

    // Default JSON format
    return NextResponse.json({
      students: filteredStudents,
      count: filteredStudents.length,
      exported_at: new Date().toISOString(),
    });

  } catch (err: any) {
    // Error: $1
    return NextResponse.json(
      { error: 'Failed to export students' },
      { status: 500 }
    );
  }
}

function escapeCsvField(field: any): string {
  if (field == null || field === '') return '';
  const str = String(field);
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

function formatDate(date: any): string {
  if (!date) return '';
  try {
    return new Date(date).toISOString().split('T')[0];
  } catch (error) {
    return '';
  }
}
