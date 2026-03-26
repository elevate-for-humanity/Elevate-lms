import { NextResponse } from 'next/server';

import { createClient } from '@/lib/supabase/server';
import { toErrorMessage } from '@/lib/safe';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { withApiAudit } from '@/lib/audit/withApiAudit';
import { auditedMutation } from '@/lib/audit/transactional';
export const runtime = 'nodejs';
export const maxDuration = 60;

export const dynamic = 'force-dynamic';

async function _POST(req: Request) {
  try {
    const rateLimited = await applyRateLimit(req, 'api');
    if (rateLimited) return rateLimited;

    const body = await req.json();
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { date_worked, hours, category, notes, program_slug } = body;

    if (!date_worked || !hours || !category || !program_slug) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const { error } = await auditedMutation({
      table: 'hour_entries',
      operation: 'insert',
      rowData: {
        user_id: user.id,
        program_slug,
        work_date: date_worked,
        hours_claimed: parseFloat(hours),
        source_type: category === 'on-the-job' ? 'ojl' : 'rti',
        category,
        notes: notes || null,
        entered_by_email: user.email || '',
        status: 'pending',
      },
      audit: {
        action: 'api:post:/api/apprenticeship/hours',
        actorId: user.id,
        targetType: 'hour_entries',
        metadata: { program_slug, category, hours: parseFloat(hours) },
      },
    });

    if (error) {
      return NextResponse.json(
        { error: 'Failed to log hours' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    // Error: $1
    return NextResponse.json(
      { err: toErrorMessage(err) || 'Failed to log hours' },
      { status: 500 }
    );
  }
}

// Get student's hours
async function _GET(req: Request) {
  try {
    const rateLimited = await applyRateLimit(req, 'api');
    if (rateLimited) return rateLimited;

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: hours, error } = await supabase
      .from('hour_entries')
      .select('*')
      .eq('user_id', user.id)
      .order('work_date', { ascending: false });

    if (error) {
      // Error: $1
      return NextResponse.json(
        { error: 'Failed to load hours' },
        { status: 500 }
      );
    }

    // Calculate totals
    const totalHours =
      hours?.reduce((sum, h) => sum + (Number(h.hours_claimed) || 0), 0) || 0;
    const approvedHours =
      hours
        ?.filter((h) => h.status === 'approved')
        .reduce((sum, h) => sum + (Number(h.accepted_hours) || Number(h.hours_claimed) || 0), 0) || 0;
    const classroomHours =
      hours
        ?.filter((h) => h.source_type === 'rti')
        .reduce((sum, h) => sum + (Number(h.hours_claimed) || 0), 0) || 0;
    const onTheJobHours =
      hours
        ?.filter((h) => h.source_type === 'ojl')
        .reduce((sum, h) => sum + (Number(h.hours_claimed) || 0), 0) || 0;

    return NextResponse.json({
      hours: hours || [],
      totals: {
        total: totalHours,
        approved: approvedHours,
        classroom: classroomHours,
        onTheJob: onTheJobHours,
      },
    });
  } catch (err: any) {
    // Error: $1
    return NextResponse.json(
      { error: 'Failed to load hours' },
      { status: 500 }
    );
  }
}
export const GET = withApiAudit('/api/apprenticeship/hours', _GET, { critical: true });
export const POST = withApiAudit('/api/apprenticeship/hours', _POST, { critical: true });
