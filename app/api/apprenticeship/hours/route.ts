import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { toErrorMessage } from '@/lib/safe';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { withApiAudit } from '@/lib/audit/withApiAudit';
import { auditedMutation } from '@/lib/audit/transactional';

async function _POST(req: Request) {
  try {
    const rateLimited = await applyRateLimit(req, 'api');
    if (rateLimited) return rateLimited;

    const body = await req.json();
    const supabase = await createClient();
  const _admin = createAdminClient(); const db = _admin || supabase;

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
      table: 'apprenticeship_hours',
      operation: 'insert',
      rowData: {
        student_id: user.id,
        program_slug,
        date_worked,
        hours: parseFloat(hours),
        category,
        notes: notes || null,
      },
      audit: {
        action: 'api:post:/api/apprenticeship/hours',
        actorId: user.id,
        targetType: 'apprenticeship_hours',
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
  const _admin = createAdminClient(); const db = _admin || supabase;
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: hours, error } = await db
      .from('apprenticeship_hours')
      .select('*')
      .eq('student_id', user.id)
      .order('date_worked', { ascending: false });

    if (error) {
      // Error: $1
      return NextResponse.json(
        { error: 'Failed to load hours' },
        { status: 500 }
      );
    }

    // Calculate totals
    const totalHours =
      hours?.reduce((sum, h) => sum + parseFloat(h.hours || 0), 0) || 0;
    const approvedHours =
      hours
        ?.filter((h) => h.approved)
        .reduce((sum, h) => sum + parseFloat(h.hours || 0), 0) || 0;
    const classroomHours =
      hours
        ?.filter((h) => h.category === 'classroom')
        .reduce((sum, h) => sum + parseFloat(h.hours || 0), 0) || 0;
    const onTheJobHours =
      hours
        ?.filter((h) => h.category === 'on-the-job')
        .reduce((sum, h) => sum + parseFloat(h.hours || 0), 0) || 0;

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
