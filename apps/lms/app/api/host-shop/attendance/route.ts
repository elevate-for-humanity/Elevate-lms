import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { requireAdminClient } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';

const HOST_SHOP_ADMIN_COOKIE = '__efh_host_shop_partner';
const ALLOWED_ROLES = new Set([
  'host_shop',
  'host_shop_admin',
  'partner',
  'admin',
  'super_admin',
  'org_admin',
]);
const PLATFORM_ADMIN_ROLES = new Set(['admin', 'super_admin', 'org_admin']);
const ATTENDANCE_STATUSES = new Set(['present', 'absent', 'excused', 'late']);

type AttendanceInput = {
  placementId?: unknown;
  studentId?: unknown;
  status?: unknown;
  notes?: unknown;
};

async function resolveContext() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) };

  const db = await requireAdminClient();
  const { data: profile } = await db
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .maybeSingle();

  const role = String(profile?.role || '').trim().toLowerCase();
  if (!ALLOWED_ROLES.has(role)) {
    return { error: NextResponse.json({ error: 'Forbidden' }, { status: 403 }) };
  }

  let partnerId: string | null = null;
  if (PLATFORM_ADMIN_ROLES.has(role)) {
    const cookieStore = await cookies();
    partnerId = cookieStore.get(HOST_SHOP_ADMIN_COOKIE)?.value || null;
    if (!partnerId) {
      return {
        error: NextResponse.json(
          { error: 'Select a Host Shop from the Host Shop board before recording attendance.' },
          { status: 400 },
        ),
      };
    }
  } else {
    const { data: partnerUser } = await db
      .from('partner_users')
      .select('partner_id, status')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .maybeSingle();
    partnerId = partnerUser?.partner_id || null;
  }

  if (!partnerId) {
    return { error: NextResponse.json({ error: 'No active Host Shop account found.' }, { status: 403 }) };
  }

  const { data: partner } = await db
    .from('partners')
    .select('id, status, approval_status, is_active')
    .eq('id', partnerId)
    .maybeSingle();

  if (
    !partner ||
    partner.status !== 'active' ||
    partner.approval_status !== 'approved' ||
    partner.is_active === false
  ) {
    return {
      error: NextResponse.json({ error: 'This Host Shop is not active and approved.' }, { status: 403 }),
    };
  }

  const { data: shops, error: shopsError } = await db
    .from('shops')
    .select('id, tenant_id, active, partner_id')
    .eq('partner_id', partnerId)
    .eq('active', true);

  if (shopsError) {
    return {
      error: NextResponse.json({ error: 'Unable to load Host Shop locations.' }, { status: 500 }),
    };
  }
  if (!shops?.length) {
    return { error: NextResponse.json({ error: 'No active shop location found.' }, { status: 403 }) };
  }

  return { user, db, partnerId, shops };
}

export async function GET() {
  const ctx = await resolveContext();
  if ('error' in ctx) return ctx.error;

  const { db, partnerId } = ctx;
  const { data, error } = await db
    .from('host_shop_attendance_records')
    .select('id, partner_id, shop_id, placement_id, student_id, attendance_date, status, notes, recorded_by, created_at, updated_at')
    .eq('partner_id', partnerId)
    .order('attendance_date', { ascending: false })
    .order('created_at', { ascending: false })
    .limit(100);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ records: data ?? [] });
}

export async function POST(req: NextRequest) {
  const ctx = await resolveContext();
  if ('error' in ctx) return ctx.error;

  const { user, db, partnerId, shops } = ctx;
  const body = await req.json().catch(() => null);
  const attendanceDate = typeof body?.attendanceDate === 'string' ? body.attendanceDate.trim() : '';
  const inputs: AttendanceInput[] = Array.isArray(body?.records) ? body.records : [];

  if (!/^\d{4}-\d{2}-\d{2}$/.test(attendanceDate)) {
    return NextResponse.json({ error: 'attendanceDate must be YYYY-MM-DD.' }, { status: 400 });
  }
  if (!inputs.length || inputs.length > 100) {
    return NextResponse.json({ error: 'Provide between 1 and 100 attendance records.' }, { status: 400 });
  }

  const normalized = inputs.map((input) => ({
    placementId: typeof input.placementId === 'string' ? input.placementId.trim() : '',
    studentId: typeof input.studentId === 'string' ? input.studentId.trim() : '',
    status: typeof input.status === 'string' ? input.status.trim().toLowerCase() : '',
    notes: typeof input.notes === 'string' ? input.notes.trim().slice(0, 2000) : null,
  }));

  if (
    normalized.some(
      (row) => !row.placementId || !row.studentId || !ATTENDANCE_STATUSES.has(row.status),
    )
  ) {
    return NextResponse.json({ error: 'Each record requires a valid placement, student, and attendance status.' }, { status: 400 });
  }

  const placementIds = Array.from(new Set(normalized.map((row) => row.placementId)));
  if (placementIds.length !== normalized.length) {
    return NextResponse.json({ error: 'Duplicate placements are not allowed in one submission.' }, { status: 400 });
  }

  const shopById = new Map((shops as any[]).map((shop) => [String(shop.id), shop]));
  const shopIds = Array.from(shopById.keys());

  const { data: placements, error: placementError } = await db
    .from('apprentice_placements')
    .select('id, student_id, shop_id, status')
    .in('id', placementIds)
    .in('shop_id', shopIds)
    .eq('status', 'active');

  if (placementError) {
    return NextResponse.json({ error: 'Unable to verify apprentice placements.' }, { status: 500 });
  }
  if ((placements?.length ?? 0) !== normalized.length) {
    return NextResponse.json({ error: 'One or more apprentice placements are not active at this Host Shop.' }, { status: 403 });
  }

  const placementById = new Map((placements as any[]).map((placement) => [String(placement.id), placement]));
  const now = new Date().toISOString();
  const rows: any[] = [];

  for (const input of normalized) {
    const placement = placementById.get(input.placementId);
    if (!placement || String(placement.student_id) !== input.studentId) {
      return NextResponse.json({ error: 'Placement/student validation failed.' }, { status: 403 });
    }
    const shop = shopById.get(String(placement.shop_id));
    if (!shop?.tenant_id) {
      return NextResponse.json({ error: 'Shop tenant configuration is incomplete.' }, { status: 500 });
    }

    rows.push({
      partner_id: partnerId,
      shop_id: placement.shop_id,
      tenant_id: shop.tenant_id,
      placement_id: placement.id,
      student_id: placement.student_id,
      attendance_date: attendanceDate,
      status: input.status,
      notes: input.notes,
      recorded_by: user.id,
      updated_at: now,
    });
  }

  const { data: savedRows, error: saveError } = await db
    .from('host_shop_attendance_records')
    .upsert(rows, { onConflict: 'placement_id,attendance_date' })
    .select('id, placement_id, student_id, attendance_date, status, updated_at');

  if (saveError) return NextResponse.json({ error: saveError.message }, { status: 500 });
  return NextResponse.json({ saved: savedRows?.length ?? 0, records: savedRows ?? [] });
}
