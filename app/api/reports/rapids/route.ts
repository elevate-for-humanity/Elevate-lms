
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { toErrorMessage } from '@/lib/safe';
import { applyRateLimit } from '@/lib/api/withRateLimit';

export async function GET(req: Request) {
  try {
    const rateLimited = await applyRateLimit(req, 'api');
    if (rateLimited) return rateLimited;

    const supabase = await createClient();

    // Check if user is admin
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: profile } = await supabase
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

    // Get all approved hours with student info
    const { data: rows, error } = await supabase
      .from('apprenticeship_hours')
      .select(
        `
        student_id,
        program_slug,
        date_worked,
        hours,
        category,
        approved,
        approved_at,
        user_profiles!apprenticeship_hours_student_id_fkey(
          first_name,
          last_name,
          email
        )
      `
      )
      .eq('approved', true)
      .order('date_worked', { ascending: true });

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
