
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { NextResponse } from 'next/server';
import { toErrorMessage } from '@/lib/safe';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { withApiAudit } from '@/lib/audit/withApiAudit';

async function _GET(req: Request) {
  try {
    const rateLimited = await applyRateLimit(req, 'api');
    if (rateLimited) return rateLimited;

    const supabase = await createClient();
  const _admin = createAdminClient(); const db = _admin || supabase;

    // Check if user is admin
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: profile } = await db
      .from('user_profiles')
      .select('role')
      .eq('user_id', user.id)
      .single();

    if (!profile || profile.role !== 'admin') {
      return NextResponse.json(
        { error: 'Forbidden - admin only' },
        { status: 403 }
      );
    }

    // Get all approved hours from consolidated hour_entries
    const { data: rawRows, error } = await db
      .from('hour_entries')
      .select(
        `
        user_id,
        program_slug,
        work_date,
        hours_claimed,
        accepted_hours,
        source_type,
        category,
        status,
        approved_at
      `
      )
      .eq('status', 'approved')
      .order('work_date', { ascending: true });

    // Enrich with user profile data
    const userIds = [...new Set((rawRows || []).map((h: any) => h.user_id).filter(Boolean))];
    let profileMap: Record<string, any> = {};
    if (userIds.length > 0) {
      const { data: profiles } = await db
        .from('user_profiles')
        .select('user_id, first_name, last_name, email')
        .in('user_id', userIds);
      for (const p of profiles || []) {
        profileMap[p.user_id] = p;
      }
    }

    const rows = (rawRows || []).map((h: any) => ({
      ...h,
      student_id: h.user_id,
      date_worked: h.work_date,
      hours: Number(h.accepted_hours) || Number(h.hours_claimed) || 0,
      approved: true,
      user_profiles: profileMap[h.user_id] || null,
    }));

    if (error) {
      // Error: $1
      return NextResponse.json(
        { error: 'Failed to generate report' },
        { status: 500 }
      );
    }

    // Generate CSV
    let csv =
      'First Name,Last Name,Email,Program,Date Worked,Hours,Category,Approved Date\n';

    for (const r of rows || []) {
      const profile = r.user_profiles;
      csv += `"${profile?.first_name || ''}","${profile?.last_name || ''}","${profile?.email || ''}","${r.program_slug}","${r.date_worked}",${r.hours},"${r.category}","${r.approved_at || ''}"\n`;
    }

    // Calculate summary
    const totalHours =
      rows?.reduce((sum, r) => sum + parseFloat(r.hours || 0), 0) || 0;
    const uniqueStudents = new Set(rows?.map((r) => r.student_id)).size;

    csv += `\n\nSummary\n`;
    csv += `Total Students,${uniqueStudents}\n`;
    csv += `Total Approved Hours,${totalHours}\n`;
    csv += `Report Generated,${new Date().toISOString()}\n`;

    return new NextResponse(csv, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename=rapids-hours-${new Date().toISOString().split('T')[0]}.csv`,
      },
    });
  } catch (err: any) {
    // Error: $1
    return NextResponse.json(
      { err: toErrorMessage(err) || 'Failed to generate report' },
      { status: 500 }
    );
  }
}
export const GET = withApiAudit('/api/reports/rapids', _GET);
