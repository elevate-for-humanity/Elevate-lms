import { safeInternalError } from '@/lib/api/safe-error';
import { NextResponse } from 'next/server';
import { parseBody } from '@/lib/api-helpers';
import { createClient } from '@/lib/supabase/server';
import { toErrorMessage } from '@/lib/safe';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { withApiAudit } from '@/lib/audit/withApiAudit';
export const runtime = 'nodejs';
export const maxDuration = 60;

export const dynamic = 'force-dynamic';

async function _POST(request: Request) {
  try {
    const rateLimited = await applyRateLimit(request, 'api');
    if (rateLimited) return rateLimited;

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await parseBody<Record<string, any>>(request);
    const { date, hours, services_performed, notes } = body;

    // Resolve active program slug so logged hours can be grouped in dashboard views.
    const { data: activeEnrollment } = await supabase
      .from('program_enrollments')
      .select('program_slug, programs(slug)')
      .eq('user_id', user.id)
      .in('status', ['active', 'enrolled', 'in_progress'])
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    const resolvedProgramSlug =
      activeEnrollment?.program_slug || (activeEnrollment?.programs as any)?.slug || null;

    // Insert into consolidated hour_entries table
    const { data, error }: any = await supabase
      .from('hour_entries')
      .insert({
        user_id: user.id,
        program_slug: resolvedProgramSlug,
        source_type: 'ojl',
        work_date: date,
        hours_claimed: hours,
        entered_by_email: user.email,
        notes: [services_performed, notes].filter(Boolean).join(' — ') || null,
        status: 'pending',
      })
      .select()
      .maybeSingle();

    if (error) {
      // Error: $1
      return safeInternalError(error as Error, 'Internal server error');
    }

    return NextResponse.json({ success: true, data });
  } catch (error) {
    // Error: $1
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
export const POST = withApiAudit('/api/student/log-hours', _POST, { critical: true });
