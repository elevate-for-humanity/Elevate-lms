export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { logAuditEvent, AuditActions } from '@/lib/audit';
import { applyRateLimit } from '@/lib/api/withRateLimit';

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
    const startDate = searchParams.get('start_date');
    const endDate = searchParams.get('end_date');
    const shopId = searchParams.get('shop_id');
    const studentId = searchParams.get('student_id');

    // Default to current week if no dates provided
    const today = new Date();
    const weekStart = startDate || getWeekStart(today).toISOString().split('T')[0];
    const weekEnd = endDate || getWeekEnd(today).toISOString().split('T')[0];

    // Build query for apprenticeship hours
    let query = supabase
      .from('apprenticeship_hours')
      .select(`
        id,
        student_id,
        shop_id,
        date,
        hours_worked,
        description,
        approved,
        approved_by,
        approved_at,
        created_at,
        student:profiles!student_id (
          full_name,
          email
        ),
        shop:shops (
          name,
          license_number
        ),
        approver:profiles!approved_by (
          full_name
        )
      `)
      .gte('date', weekStart)
      .lte('date', weekEnd)
      .order('date', { ascending: true })
      .order('student_id', { ascending: true });

    // Apply filters
    if (shopId) {
      query = query.eq('shop_id', shopId);
    }
    if (studentId) {
      query = query.eq('student_id', studentId);
    }

    const { data: hours, error } = await query;

    if (error) {
      // Error: $1
      throw error;
    }

    // Log audit event
    await logAuditEvent({
      userId: user.id,
      action: AuditActions.DATA_EXPORTED,
      resourceType: 'weekly_hours',
      metadata: {
        format,
        week_start: weekStart,
        week_end: weekEnd,
        count: hours?.length || 0,
      },
    });

    // Generate CSV for WorkOne/DWD
    if (format === 'csv') {
      const headers = [
        'Week Start',
        'Week End',
        'Student Name',
        'Student Email',
        'Shop Name',
        'Shop License',
        'Date',
        'Hours Worked',
        'Description',
        'Approved',
        'Approved By',
        'Approved Date',
      ];

      const rows = (hours || []).map((h: any) => [
        weekStart,
        weekEnd,
        h.student?.full_name || 'Unknown',
        h.student?.email || '',
        h.shop?.name || 'Unknown',
        h.shop?.license_number || '',
        formatDate(h.date),
        h.hours_worked || '0',
        h.description || '',
        h.approved ? 'Yes' : 'No',
        h.approver?.full_name || '',
        formatDate(h.approved_at),
      ]);

      // Add summary row
      const totalHours = (hours || []).reduce((sum: number, h: any) => sum + (h.hours_worked || 0), 0);
      const approvedHours = (hours || []).filter((h: any) => h.approved).reduce((sum: number, h: any) => sum + (h.hours_worked || 0), 0);

      rows.push([]);
      rows.push(['SUMMARY', '', '', '', '', '', '', '', '', '', '', '']);
      rows.push(['Total Hours', totalHours.toString(), '', '', '', '', '', '', '', '', '', '']);
      rows.push(['Approved Hours', approvedHours.toString(), '', '', '', '', '', '', '', '', '', '']);
      rows.push(['Pending Hours', (totalHours - approvedHours).toString(), '', '', '', '', '', '', '', '', '', '']);

      const csv = [
        headers.join(','),
        ...rows.map(row => row.map(escapeCsvField).join(','))
      ].join('\n');

      const filename = `weekly_hours_${weekStart}_to_${weekEnd}.csv`;

      return new NextResponse(csv, {
        status: 200,
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': `attachment; filename="${filename}"`,
        },
      });
    }

    // Default JSON format
    const totalHours = (hours || []).reduce((sum: number, h: any) => sum + (h.hours_worked || 0), 0);
    const approvedHours = (hours || []).filter((h: any) => h.approved).reduce((sum: number, h: any) => sum + (h.hours_worked || 0), 0);

    return NextResponse.json({
      week_start: weekStart,
      week_end: weekEnd,
      hours,
      summary: {
        total_entries: hours?.length || 0,
        total_hours: totalHours,
        approved_hours: approvedHours,
        pending_hours: totalHours - approvedHours,
      },
      exported_at: new Date().toISOString(),
    });

  } catch (err: any) {
    // Error: $1
    return NextResponse.json(
      { error: (err as Error).message || 'Failed to export weekly hours' },
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

function getWeekStart(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day; // Sunday as start of week
  return new Date(d.setDate(diff));
}

function getWeekEnd(date: Date): Date {
  const start = getWeekStart(date);
  return new Date(start.setDate(start.getDate() + 6));
}
