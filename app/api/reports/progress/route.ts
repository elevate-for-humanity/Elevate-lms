import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;
import { createClient } from '@/lib/supabase/server';
import { getOrgContext } from '@/lib/org/getOrgContext';
import { requireReportAccess, toCsv, getCsvHeaders } from '@/lib/reports';
import { applyRateLimit } from '@/lib/api/withRateLimit';

export async function GET(req: NextRequest) {
  try {
    const rateLimited = await applyRateLimit(req, 'api');
    if (rateLimited) return rateLimited;

    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const ctx = await getOrgContext(supabase, user.id);
    requireReportAccess(ctx.role);

    const { searchParams } = new URL(req.url);
    const format = searchParams.get('format');
    const programId = searchParams.get('program_id');

    let query = supabase
      .from('reporting_progress')
      .select('*')
      .eq('organization_id', ctx.organization_id);

    if (programId) {
      query = query.eq('program_id', programId);
    }

    const { data, error } = await query.order('last_activity_at', {
      ascending: false,
    });

    if (error) {
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }

    if (format === 'csv') {
      const csv = toCsv(data || []);
      return new NextResponse(csv, {
        headers: getCsvHeaders('progress.csv'),
      });
    }

    return NextResponse.json({ data });
  } catch (error) { 
    return NextResponse.json(
      { error: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
