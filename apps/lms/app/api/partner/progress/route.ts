import { NextRequest, NextResponse } from 'next/server';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { withApiAudit } from '@/lib/audit/withApiAudit';
import { getHostShopBoard } from '@/lib/partner/board';
import { requireCurrentHostShopPartner } from '@/lib/partners/current-host-shop';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

function normalizeProgram(value: unknown) {
  return String(value || '')
    .toLowerCase()
    .replace(/-apprenticeship$/, '');
}

async function context(request: NextRequest) {
  const rateLimited = await applyRateLimit(request, 'api');
  if (rateLimited) return { response: rateLimited };
  try {
    const current = await requireCurrentHostShopPartner();
    const board = await getHostShopBoard(current.user.id);
    return { ...current, board };
  } catch (error) {
    const code = error instanceof Error ? error.message : '';
    return {
      response: NextResponse.json(
        { error: 'No active Host Shop context' },
        { status: code === 'HOST_SHOP_UNAUTHENTICATED' ? 401 : 403 },
      ),
    };
  }
}

async function _GET(request: NextRequest) {
  const ctx = await context(request);
  if ('response' in ctx) return ctx.response;
  const requestedProgram = request.nextUrl.searchParams.get('program');
  const apprentices = ctx.board.apprentices.filter(
    (item) =>
      !requestedProgram ||
      normalizeProgram(item.program_slug) === normalizeProgram(requestedProgram),
  );
  const studentIds = apprentices.map((item) => item.student_id).filter(Boolean);
  const shopIds = ctx.board.shops.map((shop: any) => shop.id).filter(Boolean);
  if (!studentIds.length || !shopIds.length)
    return NextResponse.json({ entries: [], summary: null });

  const { data, error } = await ctx.db
    .from('hour_entries')
    .select(
      'id,user_id,program_slug,work_date,hours_claimed,hours,notes,status,approval_status,created_at',
    )
    .in('user_id', studentIds)
    .in('host_shop_id', shopIds)
    .order('created_at', { ascending: false })
    .limit(50);
  if (error) return NextResponse.json({ error: 'Failed to fetch progress' }, { status: 500 });
  const apprenticeById = new Map(apprentices.map((item) => [item.student_id, item.name]));
  const entries = (data || []).map((row: any) => ({
    id: row.id,
    apprentice_id: row.user_id,
    apprentice_name: apprenticeById.get(row.user_id) || 'Assigned apprentice',
    week_ending: row.work_date,
    hours_worked: Number(row.hours_claimed ?? row.hours ?? 0),
    notes: row.notes,
    status: row.approval_status || row.status,
    submitted_at: row.created_at,
  }));
  return NextResponse.json({ entries, summary: { activeApprentices: apprentices.length } });
}

async function _POST(request: NextRequest) {
  const ctx = await context(request);
  if ('response' in ctx) return ctx.response;
  const body = await request.json().catch(() => null);
  const apprenticeId = String(body?.apprenticeId || body?.apprentice_id || '').trim();
  const programSlug = String(body?.programId || body?.program_type || '').trim();
  const workDate = String(body?.weekEnding || body?.week_ending || '').trim();
  const hours = Number(body?.hoursWorked ?? body?.hours_worked);
  const apprentice = ctx.board.apprentices.find(
    (item) =>
      item.student_id === apprenticeId &&
      (!programSlug || normalizeProgram(item.program_slug) === normalizeProgram(programSlug)),
  );
  if (
    !apprentice ||
    !/^\d{4}-\d{2}-\d{2}$/.test(workDate) ||
    !Number.isFinite(hours) ||
    hours <= 0 ||
    hours > 80
  ) {
    return NextResponse.json(
      { error: 'Valid assigned apprentice, week ending, and 0–80 hours are required' },
      { status: 400 },
    );
  }

  const { data, error } = await ctx.db
    .from('hour_entries')
    .insert({
      user_id: apprentice.student_id,
      host_shop_id: apprentice.shop_id,
      program_slug: apprentice.program_slug,
      work_date: workDate,
      hours_claimed: hours,
      source_type: 'host_shop',
      category: 'practical',
      notes: typeof body?.notes === 'string' ? body.notes.trim().slice(0, 2000) || null : null,
      status: 'pending',
      approval_status: 'pending',
      entered_by_email: ctx.user.email || null,
      entered_at: new Date().toISOString(),
    })
    .select(
      'id,user_id,program_slug,work_date,hours_claimed,notes,status,approval_status,created_at',
    )
    .single();
  if (error) return NextResponse.json({ error: 'Failed to record progress' }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}

export const GET = withApiAudit('/api/partner/progress', _GET);
export const POST = withApiAudit('/api/partner/progress', _POST);
