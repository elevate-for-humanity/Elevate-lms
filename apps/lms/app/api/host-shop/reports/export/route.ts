import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth/require-role';
import { HOST_SHOP_ROLES } from '@/lib/rbac/role-matrix';
import { getHostShopBoard } from '@/lib/partner/board';
import { requireAdminClient } from '@/lib/supabase/admin';
import { getHostShopReadinessItems } from '@/lib/partners/host-shop-readiness';

const EXPORT_TYPES = new Set(['overview', 'apprentices', 'hours', 'attendance', 'compliance']);
const csvCell = (value: unknown) => `"${String(value ?? '').replaceAll('"', '""')}"`;
const csv = (headers: string[], rows: unknown[][]) => [headers, ...rows].map((row) => row.map(csvCell).join(',')).join('\r\n');

export async function GET(request: NextRequest) {
  const { user } = await requireRole(HOST_SHOP_ROLES);
  const type = request.nextUrl.searchParams.get('type') || 'overview';
  if (!EXPORT_TYPES.has(type)) return NextResponse.json({ error: 'Unsupported export type' }, { status: 400 });
  const board = await getHostShopBoard(user.id);
  const db = await requireAdminClient();
  const shopIds = board.shops.map((shop) => shop.id).filter(Boolean);
  const studentIds = board.apprentices.map((item) => item.student_id).filter(Boolean);
  let output = '';

  if (type === 'overview') {
    output = csv(['shop','active_apprentices','pending_hours','documents_accepted','documents_required','onboarding_complete'], [[board.partner.name,board.apprentices.length,board.pendingHoursCount,board.acceptedDocumentCount,board.requiredDocumentCount,board.partner.onboarding_completed === true]]);
  } else if (type === 'apprentices') {
    output = csv(['apprentice','email','program','start_date','approved_hours','competencies_complete','competencies_required'], board.apprentices.map((item) => [item.name,item.email,item.program_slug,item.start_date,item.ojt.completed,item.competency?.completed ?? 0,item.competency?.required ?? 0]));
  } else if (type === 'hours') {
    const { data, error } = studentIds.length ? await db.from('hour_entries').select('user_id,host_shop_id,program_slug,work_date,entered_at,hours,hours_claimed,accepted_hours,status,approval_status,notes').in('user_id', studentIds).in('host_shop_id', shopIds).order('work_date', { ascending: false }) : { data: [], error: null };
    if (error) return NextResponse.json({ error: 'Hours export unavailable' }, { status: 500 });
    const names = new Map(board.apprentices.map((item) => [item.student_id,item.name]));
    output = csv(['apprentice','program','work_date','entered_at','claimed_hours','accepted_hours','status','notes'], (data || []).map((row) => [names.get(row.user_id) || 'Assigned apprentice',row.program_slug,row.work_date,row.entered_at,row.hours_claimed ?? row.hours,row.accepted_hours,row.approval_status ?? row.status,row.notes]));
  } else if (type === 'attendance') {
    const placementIds = board.apprentices.map((item) => item.id).filter(Boolean);
    const { data, error } = placementIds.length ? await db.from('host_shop_attendance_records').select('placement_id,student_id,attendance_date,status,notes,created_at').eq('partner_id', board.partner.id).in('placement_id', placementIds).order('attendance_date', { ascending: false }) : { data: [], error: null };
    if (error) return NextResponse.json({ error: 'Attendance export unavailable' }, { status: 500 });
    const names = new Map(board.apprentices.map((item) => [item.id,item.name]));
    output = csv(['apprentice','attendance_date','status','notes','recorded_at'], (data || []).map((row) => [names.get(row.placement_id) || 'Assigned apprentice',row.attendance_date,row.status,row.notes,row.created_at]));
  } else {
    const readiness = getHostShopReadinessItems(board);
    output = csv(['requirement','status','detail','resolution_path'], readiness.length ? readiness.map((item) => [item.title,item.severity === 'required' ? 'outstanding' : 'in_review',item.detail,item.href]) : [['All Host Shop requirements','complete','No outstanding readiness items','']]);
  }

  const safeName = String(board.partner.name || 'host-shop').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  return new NextResponse(`\uFEFF${output}`, { headers: { 'Content-Type': 'text/csv; charset=utf-8', 'Content-Disposition': `attachment; filename="${safeName}-${type}-${new Date().toISOString().slice(0,10)}.csv"`, 'Cache-Control': 'private, no-store' } });
}
