import type { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, BookOpen, CheckCircle, CreditCard, ExternalLink, FileText, Mail, User } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { requireAdminClient } from '@/lib/supabase/admin';
import EnrollmentVoucherPanel from '@/components/admin/EnrollmentVoucherPanel';
import { logger } from '@/lib/logger';
import { OpenLearnerPortalButton } from '@/components/admin/students/OpenLearnerPortalButton';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { robots: { index: false }, title: 'Student Profile | Admin' };

function fmtDate(value: string | null | undefined) {
  return value ? new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' }) : '—';
}
function fmtUsd(cents: number | null | undefined) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(Number(cents || 0) / 100);
}
function Badge({ status }: { status: string | null | undefined }) {
  const value = status || 'unknown';
  return <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-black capitalize text-slate-700">{value.replaceAll('_', ' ')}</span>;
}
function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return <div className="flex items-start gap-3 border-b border-slate-100 py-2.5 last:border-0"><span className="w-36 shrink-0 text-xs font-bold text-slate-500">{label}</span><span className="min-w-0 flex-1 text-sm text-slate-800">{value || '—'}</span></div>;
}

export default async function StudentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const db = await requireAdminClient();
  const { data: adminProfile } = await db.from('profiles').select('role').eq('id', user.id).maybeSingle();
  if (!['admin', 'super_admin', 'staff'].includes(adminProfile?.role ?? '')) redirect('/unauthorized');

  const { data: student } = await db
    .from('profiles')
    .select('id,full_name,first_name,last_name,email,phone,address,city,state,zip,created_at,enrollment_status,funding_source,student_number,date_of_birth,emergency_contact_name,emergency_contact_phone,last_login_at,onboarding_completed')
    .eq('id', id)
    .maybeSingle();
  if (!student) notFound();

  const [enrollmentsRes, applicationsRes, progressRes, barberSubRes] = await Promise.all([
    db.from('program_enrollments').select('id,status,enrolled_at,payment_status,amount_paid_cents,program_id,program_slug,program_holder_id,student_start_date,voucher_issued_date,voucher_paid_date,payout_due_date,payout_status,payout_paid_date,payout_notes').eq('user_id', id).order('enrolled_at', { ascending: false }),
    db.from('applications').select('id,email,status,program_interest,program_slug,created_at,submitted_at,reviewed_at,review_notes,funding_type').eq('user_id', id).order('created_at', { ascending: false }),
    db.from('lesson_progress').select('id', { count: 'exact', head: true }).eq('user_id', id).eq('completed', true),
    db.from('barber_subscriptions').select('id,status,payment_status,weekly_payment_cents,weeks_remaining,remaining_balance,full_tuition_amount,amount_paid_at_checkout,stripe_customer_id,stripe_subscription_id,failed_payment_at,suspension_deadline,suspended_at,welcome_email_sent_at,dashboard_invite_sent_at,created_at').eq('user_id', id).maybeSingle(),
  ]);

  if (enrollmentsRes.error) logger.error('[student-detail] enrollments query failed', enrollmentsRes.error);
  if (applicationsRes.error) logger.error('[student-detail] applications query failed', applicationsRes.error);

  const enrollments = enrollmentsRes.data ?? [];
  const applications = applicationsRes.data ?? [];
  const barberSub = barberSubRes.data;
  const programIds = [...new Set(enrollments.map((row) => row.program_id).filter((value): value is string => Boolean(value)))];
  const programNames: Record<string, string> = {};
  if (programIds.length) {
    const { data: programs } = await db.from('programs').select('id,title').in('id', programIds);
    for (const program of programs ?? []) programNames[program.id] = program.title;
  }

  const holderIds = [...new Set(enrollments.map((row) => row.program_holder_id).filter((value): value is string => Boolean(value)))];
  const programHolders: Record<string, string> = {};
  if (holderIds.length) {
    const { data: holders } = await db
      .from('program_holders')
      .select('id,organization_name,name')
      .in('id', holderIds);
    for (const holder of holders ?? []) {
      programHolders[holder.id] = holder.organization_name || holder.name || 'Program Holder';
    }
  }
  const holderLinks = holderIds.map((holderId) => (
    <Link key={holderId} href={`/program-holders/${holderId}`} className="font-bold text-brand-blue-700 hover:underline">
      {programHolders[holderId] || 'Program Holder'}
    </Link>
  ));

  const voucherPanels = await Promise.all(enrollments
    .filter((row) => row.student_start_date || row.voucher_issued_date || row.voucher_paid_date)
    .map(async (row) => {
      const { data: auditRows } = await db
        .from('enrollment_voucher_audit')
        .select('id,changed_by,field_changed,old_value,new_value,changed_at,notes')
        .eq('enrollment_id', row.id)
        .order('changed_at', { ascending: false });

      const auditLog = (auditRows ?? []).map((audit) => ({
        id: audit.id,
        changed_at: audit.changed_at,
        changed_by_name: audit.changed_by || 'Admin',
        field_name: audit.field_changed || 'voucher',
        old_value: audit.old_value ?? null,
        new_value: audit.new_value ?? null,
        note: audit.notes ?? null,
      }));

      return {
        enrollment: row,
        auditLog,
      };
    }));

  const name = student.full_name || [student.first_name, student.last_name].filter(Boolean).join(' ') || 'Student';
  const initials = name.split(' ').map((part: string) => part[0]).slice(0, 2).join('').toUpperCase();

  return (
    <main className="mx-auto max-w-6xl space-y-6 px-4 py-6 sm:px-6">
      <div className="flex items-center gap-2 text-sm text-slate-500"><Link href="/dashboard">Dashboard</Link><span>/</span><Link href="/students">Students</Link><span>/</span><span className="font-bold text-slate-900">{name}</span></div>

      <section className="flex flex-wrap items-start gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <Link href="/students" className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"><ArrowLeft className="h-4 w-4" /></Link>
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-950 text-lg font-black text-white">{initials}</div>
        <div className="min-w-0 flex-1"><h1 className="text-2xl font-black text-slate-950">{name}</h1><div className="mt-2 flex flex-wrap items-center gap-2"><Badge status={student.enrollment_status} />{student.student_number && <span className="font-mono text-xs text-slate-500">#{student.student_number}</span>}<span className="text-xs text-slate-500">Joined {fmtDate(student.created_at)}</span></div></div>
        <div className="flex flex-wrap items-start gap-2"><OpenLearnerPortalButton studentId={student.id} />{student.email && <a href={`mailto:${student.email}`} className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-slate-300 px-3 py-2 text-sm font-bold text-slate-700"><Mail className="h-4 w-4" />Email</a>}</div>
      </section>

      <div className="grid gap-6 lg:grid-cols-[.75fr_1.25fr]">
        <aside className="space-y-4">
          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><h2 className="mb-3 flex items-center gap-2 font-black text-slate-950"><User className="h-4 w-4" />Profile</h2><InfoRow label="Email" value={student.email} /><InfoRow label="Phone" value={student.phone} /><InfoRow label="Location" value={[student.city, student.state, student.zip].filter(Boolean).join(', ')} /><InfoRow label="Date of Birth" value={fmtDate(student.date_of_birth)} /><InfoRow label="Funding Source" value={student.funding_source} /><InfoRow label="Program Holder" value={holderLinks.length ? <span className="flex flex-col gap-1">{holderLinks}</span> : 'Not assigned'} /><InfoRow label="Onboarding" value={student.onboarding_completed ? 'Complete' : 'Incomplete'} /><InfoRow label="Last Login" value={fmtDate(student.last_login_at)} /></section>
          {(student.emergency_contact_name || student.emergency_contact_phone) && <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><h2 className="font-black text-slate-950">Emergency Contact</h2><div className="mt-3"><InfoRow label="Name" value={student.emergency_contact_name} /><InfoRow label="Phone" value={student.emergency_contact_phone} /></div></section>}
        </aside>

        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">{[
            ['Enrollments', enrollments.length, BookOpen], ['Applications', applications.length, FileText], ['Lessons Done', progressRes.count ?? 0, CheckCircle],
          ].map(([label, value, Icon]) => { const ItemIcon = Icon as typeof BookOpen; return <div key={String(label)} className="rounded-xl border border-slate-200 bg-white p-4 text-center shadow-sm"><ItemIcon className="mx-auto h-4 w-4 text-brand-blue-700" /><p className="mt-2 text-2xl font-black text-slate-950">{String(value)}</p><p className="text-xs font-bold text-slate-500">{String(label)}</p></div>; })}</div>

          <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"><div className="border-b border-slate-100 px-5 py-4"><h2 className="flex items-center gap-2 font-black text-slate-950"><BookOpen className="h-4 w-4" />Enrollments</h2></div>{enrollments.length ? <div className="divide-y divide-slate-100">{enrollments.map((row) => <div key={row.id} className="flex flex-wrap items-center gap-3 px-5 py-4"><div className="min-w-0 flex-1"><p className="font-bold text-slate-900">{programNames[row.program_id || ''] || row.program_slug || 'Program'}</p><p className="text-xs text-slate-500">Enrolled {fmtDate(row.enrolled_at)}</p></div>{Number(row.amount_paid_cents || 0) > 0 && <span className="inline-flex items-center gap-1 text-xs font-bold text-slate-600"><CreditCard className="h-3.5 w-3.5" />{fmtUsd(row.amount_paid_cents)}</span>}<Badge status={row.status} /></div>)}</div> : <p className="p-6 text-sm text-slate-500">No enrollments.</p>}</section>

          {voucherPanels.map(({ enrollment, auditLog }) => <EnrollmentVoucherPanel key={enrollment.id} data={{ enrollment_id: enrollment.id, student_name: name, program_name: programNames[enrollment.program_id || ''] || enrollment.program_slug || 'Program', partner_name: enrollment.program_holder_id ? programHolders[enrollment.program_holder_id] || null : null, student_start_date: enrollment.student_start_date, voucher_issued_date: enrollment.voucher_issued_date, voucher_paid_date: enrollment.voucher_paid_date, payout_due_date: enrollment.payout_due_date, payout_status: (enrollment.payout_status as 'not_triggered' | 'pending' | 'due' | 'overdue' | 'paid') || 'not_triggered', payout_paid_date: enrollment.payout_paid_date, payout_paid_by_name: null, payout_notes: enrollment.payout_notes, audit_log: auditLog }} />)}

          {barberSub && <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><div className="flex items-center justify-between gap-3"><h2 className="flex items-center gap-2 font-black text-slate-950"><CreditCard className="h-4 w-4" />Barber Apprenticeship Billing</h2><Badge status={barberSub.payment_status || barberSub.status} /></div><div className="mt-3"><InfoRow label="Weekly Payment" value={barberSub.weekly_payment_cents ? `${fmtUsd(barberSub.weekly_payment_cents)} / week` : '—'} /><InfoRow label="Weeks Remaining" value={barberSub.weeks_remaining != null ? `${barberSub.weeks_remaining} weeks` : '—'} /><InfoRow label="Remaining Balance" value={barberSub.remaining_balance != null ? `$${Number(barberSub.remaining_balance).toLocaleString()}` : '—'} /><InfoRow label="Stripe Customer" value={barberSub.stripe_customer_id || '—'} /><InfoRow label="Stripe Subscription" value={barberSub.stripe_subscription_id || 'Not created'} /><InfoRow label="Suspension Deadline" value={fmtDate(barberSub.suspension_deadline)} /></div></section>}

          <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"><div className="border-b border-slate-100 px-5 py-4"><h2 className="flex items-center gap-2 font-black text-slate-950"><FileText className="h-4 w-4" />Applications</h2></div>{applications.length ? <div className="divide-y divide-slate-100">{applications.map((application) => {
            const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(application.id);
            const reviewHref = isUuid ? `/applications/review/${application.id}` : `/applications?search=${encodeURIComponent(application.email || application.id)}`;
            return <Link key={application.id} href={reviewHref} className="flex items-center gap-3 px-5 py-4 hover:bg-slate-50"><div className="min-w-0 flex-1"><p className="font-bold text-slate-900">{application.program_interest || application.program_slug || 'Program not recorded'}</p><p className="text-xs text-slate-500">Submitted {fmtDate(application.submitted_at || application.created_at)}{application.funding_type ? ` · ${application.funding_type}` : ''}</p></div><Badge status={application.status} /><ExternalLink className="h-4 w-4 text-slate-400" /></Link>;
          })}</div> : <p className="p-6 text-sm text-slate-500">No applications.</p>}</section>
        </div>
      </div>
    </main>
  );
}
