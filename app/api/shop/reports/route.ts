import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { toErrorMessage } from '@/lib/safe';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { withApiAudit } from '@/lib/audit/withApiAudit';

async function _POST(req: Request) {
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

    const body = await req.json();
    const {
      placementId,
      weekStart,
      weekEnd,
      hoursTotal,
      hoursOjt,
      hoursRelated,
      attendanceNotes,
      competenciesNotes,
    } = body || {};

    if (!placementId || !weekStart || !weekEnd) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Verify user has access to this placement
    const { data: placement } = await db
      .from('apprentice_placements')
      .select('shop_id, shops!inner(id)')
      .eq('id', placementId)
      .single();

    if (!placement) {
      return NextResponse.json(
        { error: 'Placement not found' },
        { status: 404 }
      );
    }

    // Verify user is staff at this shop
    const { data: staff } = await db
      .from('shop_staff')
      .select('id')
      .eq('shop_id', placement.shop_id)
      .eq('user_id', user.id)
      .single();

    if (!staff) {
      return NextResponse.json(
        { error: 'Not authorized for this shop' },
        { status: 403 }
      );
    }

    // Insert report
    const { error } = await db.from('apprentice_weekly_reports').insert({
      placement_id: placementId,
      week_start: weekStart,
      week_end: weekEnd,
      hours_total: hoursTotal || 0,
      hours_ojt: hoursOjt || 0,
      hours_related: hoursRelated || 0,
      attendance_notes: attendanceNotes || null,
      competencies_notes: competenciesNotes || null,
      submitted_by_user_id: user.id,
    });

    if (error) {
      // Error: $1
      return NextResponse.json(
        { error: toErrorMessage(error) },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    // Error: $1
    return NextResponse.json(
      { err: toErrorMessage(err) || 'Failed to submit report' },
      { status: 500 }
    );
  }
}
export const POST = withApiAudit('/api/shop/reports', _POST);
