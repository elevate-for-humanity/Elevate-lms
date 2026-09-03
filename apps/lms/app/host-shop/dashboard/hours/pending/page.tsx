import { revalidatePath } from 'next/cache';
import Link from 'next/link';
import { AlertCircle, ArrowLeft, CheckCircle2, Clock, XCircle } from 'lucide-react';
import { requireRole } from '@/lib/auth/require-role';
import { HOST_SHOP_ROLES } from '@/lib/rbac/role-matrix';
import { getHostShopBoard } from '@/lib/partner/board';
import { requireAdminClient } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Pending Hours | Host Shop Portal',
  description: 'Review OJT hour entries explicitly assigned to this host shop.',
  robots: { index: false, follow: false },
};

function isPlatformAdmin(effectiveRoles: readonly string[]) {
  return effectiveRoles.includes('admin') || effectiveRoles.includes('super_admin') || effectiveRoles.includes('org_admin');
}

async function getAuthorizedHour(hourId: string) {
  const { user, effectiveRoles } = await requireRole(HOST_SHOP_ROLES);
  const board = await getHostShopBoard(user.id);
  const db = await requireAdminClient();
  const shopIds = board.shops.map((shop) => shop.id).filter(Boolean);

  const { data: hour } = await db.from('hour_entries').select('id, user_id, host_shop_id, program_slug, hours_claimed, hours, status, approval_status').eq('id', hourId).maybeSingle();
  if (!hour || !hour.user_id || !hour.host_shop_id || !shopIds.includes(hour.host_shop_id)) throw new Error('HOUR_ENTRY_NOT_AUTHORIZED');

  const placement = board.apprentices.find((apprentice) => apprentice.student_id === hour.user_id && apprentice.shop_id === hour.host_shop_id && (!apprentice.program_slug || !hour.program_slug || apprentice.program_slug === hour.program_slug));
  if (!placement) throw new Error('HOUR_ENTRY_NOT_AUTHORIZED');
  if (hour.program_slug === 'barber-apprenticeship' && !isPlatformAdmin(effectiveRoles) && placement.supervisor_user_id !== user.id) throw new Error('BARBER_SUPERVISOR_REQUIRED');
  const pending = hour.status === 'pending' || hour.approval_status === 'pending';
  if (!pending) throw new Error('HOUR_ENTRY_NOT_PENDING');
  return { user, effectiveRoles, db, hour };
}

async function approveHour(formData: FormData) {
  'use server';
  const hourId = String(formData.get('hourId') || '').trim();
  if (!hourId) return;
  const { user, effectiveRoles, db, hour } = await getAuthorizedHour(hourId);
  const claimed = Number(hour.hours_claimed ?? hour.hours ?? 0);
  if (!Number.isFinite(claimed) || claimed <= 0) throw new Error('INVALID_HOURS');
  const { error } = await db.from('hour_entries').update({ status: 'approved', approval_status: 'approved', accepted_hours: claimed, approved_by: user.email || user.id, approved_by_user_id: user.id, approved_by_role: effectiveRoles[0] || 'host_shop', approved_at: new Date().toISOString(), rejection_reason: null, approval_notes: 'Verified by assigned Host Shop supervisor.' }).eq('id', hourId).eq('host_shop_id', hour.host_shop_id);
  if (error) throw new Error(`HOUR_APPROVAL_FAILED:${error.message}`);
  revalidatePath('/host-shop/dashboard');
  revalidatePath('/host-shop/dashboard/hours');
  revalidatePath('/host-shop/dashboard/hours/pending');
}

async function rejectHour(formData: FormData) {
  'use server';
  const hourId = String(formData.get('hourId') || '').trim();
  const reason = String(formData.get('reason') || '').trim().slice(0, 1000);
  if (!hourId || reason.length < 3) return;
  const { user, effectiveRoles, db, hour } = await getAuthorizedHour(hourId);
  const { error } = await db.from('hour_entries').update({ status: 'rejected', approval_status: 'rejected', accepted_hours: 0, approved_by: user.email || user.id, approved_by_user_id: user.id, approved_by_role: effectiveRoles[0] || 'host_shop', approved_at: null, rejection_reason: reason, approval_notes: reason }).eq('id', hourId).eq('host_shop_id', hour.host_shop_id);
  if (error) throw new Error(`HOUR_REJECTION_FAILED:${error.message}`);
  revalidatePath('/host-shop/dashboard');
  revalidatePath('/host-shop/dashboard/hours');
  revalidatePath('/host-shop/dashboard/hours/pending');
}

export default async function PendingHoursPage() {
  const { user, effectiveRoles } = await requireRole(HOST_SHOP_ROLES);
  const board = await getHostShopBoard(user.id);
  const db = await requireAdminClient();
  const studentIds = board.apprentices.map((apprentice) => apprentice.student_id).filter(Boolean);
  const shopIds = board.shops.map((shop) => shop.id).filter(Boolean);
  const { data: pendingHours, error } = studentIds.length && shopIds.length
    ? await db.from('hour_entries').select('id, user_id, host_shop_id, program_slug, work_date, hours_claimed, hours, source_type, category, notes, status, approval_status, created_at').in('user_id', studentIds).in('host_shop_id', shopIds).or('status.eq.pending,approval_status.eq.pending').order('created_at', { ascending: true })
    : { data: [], error: null };

  const apprenticeById = new Map(board.apprentices.map((apprentice) => [apprentice.student_id, apprentice]));
  const adminViewer = isPlatformAdmin(effectiveRoles);
  const rows = (pendingHours || []).filter((hour) => {
    const placement = apprenticeById.get(hour.user_id);
    if (!placement) return false;
    if (placement.shop_id !== hour.host_shop_id) return false;
    if (placement.program_slug && hour.program_slug && placement.program_slug !== hour.program_slug) return false;
    if (hour.program_slug === 'barber-apprenticeship' && !adminViewer && placement.supervisor_user_id !== user.id) return false;
    return true;
  });

  return (
    <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <Link href="/host-shop/dashboard/hours" className="inline-flex items-center gap-2 text-sm font-bold text-slate-700 hover:text-slate-950"><ArrowLeft className="h-4 w-4" /> Back to hours</Link>
      <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between"><div><p className="text-xs font-black uppercase tracking-[0.14em] text-brand-blue-700">{board.partner?.name || 'Host Shop'}</p><h1 className="mt-2 text-3xl font-black text-slate-950">Pending OJT Hours</h1><p className="mt-2 text-slate-600">Only hour entries assigned to this Host Shop, active placement, and—where Appendix A requires it—the assigned supervisor are shown.</p></div><div className="rounded-full bg-amber-100 px-4 py-2 text-sm font-black text-amber-900">{rows.length} pending</div></div>
      {error ? <div className="mt-6 flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-900"><AlertCircle className="mt-0.5 h-5 w-5 shrink-0" /> Unable to load pending hour entries.</div> : null}
      {rows.length === 0 ? (
        <section className="mt-6 rounded-2xl border border-slate-200 bg-white px-6 py-12 text-center"><CheckCircle2 className="mx-auto h-10 w-10 text-brand-green-600" /><h2 className="mt-3 text-xl font-black text-slate-950">No Host Shop hours awaiting your review</h2><p className="mt-1 text-sm text-slate-500">Transfer hours, other-shop entries, and Barber entries assigned to another supervisor are intentionally excluded.</p></section>
      ) : (
        <div className="mt-6 space-y-4">
          {rows.map((hour) => {
            const apprentice = apprenticeById.get(hour.user_id);
            const claimed = Number(hour.hours_claimed ?? hour.hours ?? 0);
            return <article key={hour.id} className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6"><div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between"><div><h2 className="text-lg font-black text-slate-950">{apprentice?.name || 'Assigned apprentice'}</h2><p className="text-sm text-slate-500">{apprentice?.email || ''}</p><div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-sm text-slate-700"><span className="inline-flex items-center gap-1.5"><Clock className="h-4 w-4" /> {Number.isFinite(claimed) ? claimed : 0} hours</span><span>{hour.work_date ? new Date(`${hour.work_date}T00:00:00`).toLocaleDateString() : 'Date not supplied'}</span><span className="capitalize">{(hour.source_type || 'ojt').replace(/[-_]/g, ' ')}</span>{hour.category ? <span className="capitalize">{hour.category.replace(/[-_]/g, ' ')}</span> : null}</div>{hour.notes ? <p className="mt-3 rounded-xl bg-slate-50 p-3 text-sm text-slate-700">{hour.notes}</p> : null}</div><div className="w-full space-y-3 lg:w-80"><form action={approveHour}><input type="hidden" name="hourId" value={hour.id} /><button className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-brand-green-700 px-4 py-2 text-sm font-black text-white hover:bg-brand-green-800"><CheckCircle2 className="h-4 w-4" /> Approve {Number.isFinite(claimed) ? claimed : 0} hours</button></form><form action={rejectHour} className="space-y-2"><input type="hidden" name="hourId" value={hour.id} /><label className="block text-xs font-bold uppercase tracking-wide text-slate-500" htmlFor={`reason-${hour.id}`}>Rejection reason</label><input id={`reason-${hour.id}`} name="reason" required minLength={3} maxLength={1000} className="min-h-11 w-full rounded-xl border border-slate-300 px-3 text-sm" placeholder="Explain why this entry cannot be approved" /><button className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border border-red-300 bg-white px-4 py-2 text-sm font-black text-red-800 hover:bg-red-50"><XCircle className="h-4 w-4" /> Reject entry</button></form></div></div></article>;
          })}
        </div>
      )}
    </main>
  );
}
