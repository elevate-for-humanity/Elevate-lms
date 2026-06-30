import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { requireAdminClient } from '@/lib/supabase/admin';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { safeInternalError } from '@/lib/api/safe-error';
import { logger } from '@/lib/logger';
import { withApiAudit } from '@/lib/audit/withApiAudit';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

interface WeeklyRecord {
  student_id: string;
  program_slug: string;
  week_start: string;
  mon_hours: number;
  tue_hours: number;
  wed_hours: number;
  thu_hours: number;
  fri_hours: number;
  sat_hours: number;
  sun_hours: number;
  notes?: string;
}

async function _POST(request: Request) {
  const rateLimited = await applyRateLimit(request, 'api');
  if (rateLimited) return rateLimited;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Resolve shop_id from authenticated partner user
  const db = await requireAdminClient();
  const { data: staffRow } = await db
    .from('shop_staff')
    .select('shop_id, role')
    .eq('user_id', user.id)
    .eq('is_active', true)
    .maybeSingle();

  if (!staffRow?.shop_id) {
    return NextResponse.json({ error: 'Forbidden: not a shop staff member' }, { status: 403 });
  }

  const shopId = staffRow.shop_id;

  let records: WeeklyRecord[];
  try {
    const body = await request.json();
    records = body.records;
    if (!Array.isArray(records) || records.length === 0) {
      return NextResponse.json({ error: 'records array is required' }, { status: 400 });
    }
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  // Verify every student_id belongs to this shop's placements
  const studentIds = [...new Set(records.map((r) => r.student_id))];
  const { data: placements } = await db
    .from('apprentice_placements')
    .select('student_id')
    .eq('shop_id', shopId)
    .in('student_id', studentIds);

  const allowedIds = new Set((placements ?? []).map((p: any) => p.student_id));
  const unauthorized = studentIds.filter((id) => !allowedIds.has(id));
  if (unauthorized.length > 0) {
    return NextResponse.json(
      { error: 'One or more students are not placed at your shop' },
      { status: 403 },
    );
  }

  const payload = records.map((r) => ({
    shop_id: shopId,
    student_id: r.student_id,
    program_slug: r.program_slug,
    week_start: r.week_start,
    mon_hours: Number(r.mon_hours) || 0,
    tue_hours: Number(r.tue_hours) || 0,
    wed_hours: Number(r.wed_hours) || 0,
    thu_hours: Number(r.thu_hours) || 0,
    fri_hours: Number(r.fri_hours) || 0,
    sat_hours: Number(r.sat_hours) || 0,
    sun_hours: Number(r.sun_hours) || 0,
    notes: r.notes ?? null,
    submitted: false,
    submitted_by: user.id,
  }));

  const { error } = await db.from('partner_attendance').upsert(payload, {
    onConflict: 'shop_id,student_id,program_slug,week_start',
  });

  if (error) {
    logger.error('[partner/attendance/weekly] upsert failed', error);
    return safeInternalError(error, 'Failed to save attendance');
  }

  return NextResponse.json({ success: true, saved: payload.length });
}

export const POST = withApiAudit('/api/partner/attendance/weekly', _POST);
