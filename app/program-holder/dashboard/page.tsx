import { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import {
  Users, BookOpen, TrendingUp, Award, Settings, AlertCircle, Clock, ClipboardList, CalendarDays, CreditCard,
  ChevronRight, DollarSign, FileText, CheckCircle, XCircle,
} from 'lucide-react';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { requireProgramHolder } from '@/lib/auth/require-program-holder';
import { CallListPanel } from '@/components/program-holder/CallListPanel';

export const metadata: Metadata = {
  title: 'Program Holder Portal',
  robots: { index: false, follow: false },
};

export const dynamic = 'force-dynamic';

const fmt = (cents: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(cents / 100);

const fmtDate = (iso: string | null) =>
  iso ? new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—';

function StatusPill({ status }: { status: string }) {
  const s = status?.toLowerCase();
  if (s === 'active' || s === 'present')
    return <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-full px-2 py-0.5">Active</span>;
  if (s === 'completed')
    return <span className="text-xs font-semibold text-blue-700 bg-blue-50 border border-blue-200 rounded-full px-2 py-0.5">Completed</span>;
  if (s === 'pending')
    return <span className="text-xs font-semibold text-amber-700 bg-amber-50 border border-amber-200 rounded-full px-2 py-0.5">Pending</span>;
  if (s === 'paid')
    return <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-full px-2 py-0.5">Paid</span>;
  return <span className="text-xs font-semibold text-slate-500 bg-slate-100 rounded-full px-2 py-0.5">{status}</span>;
}

export default async function ProgramHolderDashboardPage() {
  const { db, user, holderId, programIds } = await requireProgramHolder();
  // ── onboarding checks ──────────────────────────────────────────────────────
  const [acksRes, docsRes, mouSigRes, payrollRes, w9Res, profileRes] = await Promise.all([
    db.from('program_holder_acknowledgements').select('document_type').eq('user_id', user.id),
    db.from('program_holder_documents').select('id').eq('user_id', user.id).limit(1),
    db.from('mou_signatures').select('id').eq('user_id', user.id).maybeSingle(),
    db.from('payroll_profiles').select('bank_name').eq('user_id', user.id).maybeSingle(),
    db.from('w9_submissions').select('id').eq('user_id', user.id).maybeSingle(),
    db.from('profiles').select('address').eq('id', user.id).maybeSingle(),
  ]);
  const acks = acksRes.data ?? [];
  const pendingSteps = [
    !mouSigRes.data && { label: 'Sign MOU digitally', href: '/program-holder/mou' },
    !profileRes.data?.address && { label: 'Complete profile', href: '/program-holder/profile' },
    !w9Res.data && { label: 'Submit W-9', href: '/onboarding/payroll-setup' },
    !payrollRes.data?.bank_name && { label: 'Set up direct deposit', href: '/onboarding/payroll-setup' },
    !acks.some((a: any) => a.document_type === 'handbook') && { label: 'Acknowledge Handbook', href: '/program-holder/handbook' },
    !acks.some((a: any) => a.document_type === 'rights') && { label: 'Acknowledge Rights & Responsibilities', href: '/program-holder/rights-responsibilities' },
    !(docsRes.data ?? []).length && { label: 'Upload required license / credential', href: '/program-holder/documents?required=true' },
  ].filter(Boolean) as { label: string; href: string }[];

  // ── programs & enrollment counts ───────────────────────────────────────────
  const [programsRes, enrollmentsRes, completedRes, certsRes] = await Promise.all([
    programIds.length
      ? db.from('programs').select('id,name,title,slug,is_active,status').in('id', programIds)
      : Promise.resolve({ data: [] }),
    programIds.length
      ? db.from('program_enrollments').select('id,program_id', { count: 'exact' }).in('program_id', programIds).eq('status', 'active')
      : Promise.resolve({ data: [], count: 0 }),
    programIds.length
      ? db.from('program_enrollments').select('id', { count: 'exact', head: true }).in('program_id', programIds).eq('status', 'completed')
      : Promise.resolve({ count: 0 }),
    programIds.length
      ? db.from('certificates').select('id', { count: 'exact', head: true }).in('program_id', programIds)
      : Promise.resolve({ count: 0 }),
  ]);
  const programs = (programsRes.data ?? []).map((p: any) => ({
    id: p.id, name: p.name || p.title || 'Untitled', slug: p.slug ?? '',
    isActive: p.is_active, status: p.status ?? 'draft',
  }));
  const enrollmentsByProgram: Record<string, number> = {};
  for (const e of enrollmentsRes.data ?? []) {
    if (e.program_id) enrollmentsByProgram[e.program_id] = (enrollmentsByProgram[e.program_id] || 0) + 1;
  }
  const totalActive = (enrollmentsRes as any).count ?? 0;
  const totalCompleted = (completedRes as any).count ?? 0;
  const totalCerts = (certsRes as any).count ?? 0;

  // ── students roster ────────────────────────────────────────────────────────
  const { data: phStudentsRaw } = holderId
    ? await db.from('program_holder_students')
        .select('id,user_id,status,enrolled_at,completed_at,label,applicant_name,applicant_email,applicant_phone,application_status,call_notes,call_date,call_outcome,work_start_date,work_site,work_progress,completion_date,hours_taught,hours_required,last_session_date')
        .eq('program_holder_id', holderId)
        .order('enrolled_at', { ascending: true })
    : { data: [] };

  // ── call list (applied, not yet enrolled) ──────────────────────────────────
  const callList = (phStudentsRaw ?? []).filter((s: any) => s.label === 'call_list');
  const studentUserIds = [...new Set((phStudentsRaw ?? []).map((s: any) => s.user_id).filter(Boolean))];
  const { data: studentProfiles } = studentUserIds.length
    ? await db.from('profiles').select('id,full_name,email').in('id', studentUserIds)
    : { data: [] };
  const spMap = Object.fromEntries((studentProfiles ?? []).map((p: any) => [p.id, p]));
  const students = (phStudentsRaw ?? []).filter((s: any) => s.label !== 'call_list').map((s: any, i: number) => ({
    id: s.id, userId: s.user_id, sequence: i + 1,
    name: spMap[s.user_id]?.full_name ?? s.applicant_name ?? 'Student',
    email: spMap[s.user_id]?.email ?? s.applicant_email ?? '',
    status: s.status, enrolledAt: s.enrolled_at, completedAt: s.completed_at,
    completionDate: s.completion_date,
    hoursTaught: Number(s.hours_taught ?? 0),
    hoursRequired: Number(s.hours_required ?? 40),
    lastSessionDate: s.last_session_date,
  }));

  // ── attendance summary ─────────────────────────────────────────────────────
  const { data: attRaw } = holderId && studentUserIds.length
    ? await db.from('attendance_records')
        .select('user_id,hours,status')
        .eq('program_holder_id', holderId)
        .in('user_id', studentUserIds)
    : { data: [] };
  const attByStudent: Record<string, { hours: number; sessions: number; absences: number }> = {};
  for (const a of attRaw ?? []) {
    if (!attByStudent[a.user_id]) attByStudent[a.user_id] = { hours: 0, sessions: 0, absences: 0 };
    attByStudent[a.user_id].hours += Number(a.hours ?? 0);
    if (['present','late','partial'].includes(a.status)) attByStudent[a.user_id].sessions++;
    if (a.status === 'absent') attByStudent[a.user_id].absences++;
  }

  // ── milestones summary ─────────────────────────────────────────────────────
  const { data: msRaw } = holderId && studentUserIds.length
    ? await db.from('student_milestones')
        .select('user_id,completed')
        .eq('program_holder_id', holderId)
        .in('user_id', studentUserIds)
    : { data: [] };
  const msByStudent: Record<string, { done: number; total: number }> = {};
  for (const m of msRaw ?? []) {
    if (!msByStudent[m.user_id]) msByStudent[m.user_id] = { done: 0, total: 0 };
    msByStudent[m.user_id].total++;
    if (m.completed) msByStudent[m.user_id].done++;
  }

  // ── pending hour approvals ─────────────────────────────────────────────────
  const { data: pendingHoursRaw } = holderId
    ? await db.from('hour_entries')
        .select('id, user_id, work_date, hours_claimed, source_type, created_at')
        .eq('program_holder_id', holderId)
        .eq('status', 'pending')
        .order('work_date', { ascending: false })
        .limit(10)
    : { data: [] };
  const pendingHoursUserIds = [...new Set((pendingHoursRaw ?? []).map((h: any) => h.user_id).filter(Boolean))];
  const { data: pendingHoursProfiles } = pendingHoursUserIds.length
    ? await db.from('profiles').select('id, full_name').in('id', pendingHoursUserIds)
    : { data: [] };
  const phpMap = Object.fromEntries((pendingHoursProfiles ?? []).map((p: any) => [p.id, p.full_name]));
  const pendingHours = (pendingHoursRaw ?? []).map((h: any) => ({
    ...h,
    full_name: phpMap[h.user_id] ?? 'Unknown',
  }));

  // ── at-risk students (no activity in 7 days) ───────────────────────────────
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  const { data: recentActivityRaw } = studentUserIds.length
    ? await db.from('progress_entries')
        .select('user_id')
        .in('user_id', studentUserIds)
        .gte('work_date', sevenDaysAgo)
    : { data: [] };
  const recentlyActiveIds = new Set((recentActivityRaw ?? []).map((e: any) => e.user_id));
  const atRiskStudents = students.filter(
    (s) => s.status === 'active' && !recentlyActiveIds.has(s.userId),
  );

  // ── payout schedules ───────────────────────────────────────────────────────
  const { data: payoutsRaw } = holderId
    ? await db.from('payout_schedules')
        .select('user_id,student_sequence,total_payout_cents,increment_1_cents,increment_2_cents,increment_1_status,increment_2_status,increment_1_release_date,increment_2_release_date')
        .eq('program_holder_id', holderId)
    : { data: [] };
  const payoutByStudent = Object.fromEntries((payoutsRaw ?? []).map((p: any) => [p.user_id, p]));
  const totalEarnedCents = (payoutsRaw ?? [])
    .filter((p: any) => p.increment_1_status === 'paid' || p.increment_2_status === 'paid')
    .reduce((s: number, p: any) => {
      let n = 0;
      if (p.increment_1_status === 'paid') n += p.increment_1_cents ?? 0;
      if (p.increment_2_status === 'paid') n += p.increment_2_cents ?? 0;
      return s + n;
    }, 0);
  const totalPendingCents = (payoutsRaw ?? []).reduce((s: number, p: any) => {
    let n = 0;
    if (p.increment_1_status === 'pending' || p.increment_1_status === 'approved') n += p.increment_1_cents ?? 0;
    if (p.increment_2_status === 'pending' || p.increment_2_status === 'approved') n += p.increment_2_cents ?? 0;
    return s + n;
  }, 0);

  return (
    <div className="min-h-screen bg-slate-50">
      <Breadcrumbs items={[{ label: 'Program Holder Dashboard' }]} />

      {/* Hero */}
      <div className="relative h-56 sm:h-72 w-full overflow-hidden">
        {/* IMAGE-CONTRACT: placeholder-review required (blurDataURL or approved fallback) */}
        <Image src="/images/pages/program-holder-page-1.webp" alt="Program Holder Portal" fill className="object-cover object-center" priority sizes="100vw" placeholder="empty" />
        <div className="absolute inset-0 bg-gradient-to-t from-brand-blue-950/90 via-brand-blue-900/50 to-transparent" />
        <div className="absolute inset-0 flex items-end">
          <div className="max-w-7xl mx-auto w-full px-6 pb-8 flex items-end justify-between gap-4">
            <div>
              <p className="text-brand-orange-400 text-xs font-bold uppercase tracking-widest mb-2">Elevate For Humanity</p>
              <h1 className="text-3xl sm:text-5xl font-extrabold text-white leading-tight">Program Holder Portal</h1>
              <p className="text-slate-300 text-sm mt-2">Manage your students, attendance, milestones, and payments.</p>
            </div>
            <Link href="/program-holder/settings" className="flex-shrink-0 p-3 bg-white/10 hover:bg-white/20 rounded-xl text-slate-900 transition">
              <Settings className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8 space-y-6">

        {/* Onboarding banner */}
        {pendingSteps.length > 0 && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-5">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-amber-900 mb-2">
                  {pendingSteps.length} onboarding step{pendingSteps.length > 1 ? 's' : ''} remaining before payments can be issued
                </p>
                <div className="flex flex-wrap gap-2">
                  {pendingSteps.map((step) => (
                    <Link key={step.href} href={step.href} className="inline-flex items-center gap-1 text-xs font-semibold bg-amber-100 hover:bg-amber-200 text-amber-900 px-3 py-1.5 rounded-lg transition-colors">
                      {step.label} →
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Stats strip */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: 'My Students', value: students.length, img: '/images/pages/admin-students-hero.jpg', href: '/program-holder/students' },
            { label: 'Programs', value: programs.length, img: '/images/pages/about-career-training.webp', href: '/program-holder/programs' },
            { label: 'Completions', value: totalCompleted, img: '/images/pages/graduation-ceremony.webp', href: '/program-holder/reports' },
            { label: 'Certificates', value: totalCerts, img: '/images/pages/certificates-page-1.webp', href: '/program-holder/reports' },
          ].map((s) => (
            <Link key={s.label} href={s.href} className="group bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-md transition-shadow">
              <div className="relative h-24 w-full">
                <Image src={s.img} alt={s.label} fill className="object-cover group-hover:scale-105 transition-transform duration-300" sizes="(max-width:768px) 50vw, 25vw" placeholder="empty" />
                <div className="absolute inset-0 bg-brand-blue-950/50" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <p className="text-4xl font-black text-white drop-shadow-lg">{s.value}</p>
                </div>
              </div>
              <div className="px-4 py-3"><p className="text-sm font-bold text-slate-800">{s.label}</p></div>
            </Link>
          ))}
        </div>

        {/* Payout summary */}
        <div className="grid sm:grid-cols-2 gap-4">
          <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <DollarSign className="w-5 h-5 text-emerald-600" />
              <div>
                <p className="text-sm font-semibold text-emerald-800">Total Earned</p>
                <p className="text-xs text-emerald-600">Paid to date</p>
              </div>
            </div>
            <p className="text-2xl font-black text-emerald-800">{fmt(totalEarnedCents)}</p>
          </div>
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Clock className="w-5 h-5 text-amber-600" />
              <div>
                <p className="text-sm font-semibold text-amber-800">Pending Payouts</p>
                <p className="text-xs text-amber-600">Awaiting approval or release</p>
              </div>
            </div>
            <p className="text-2xl font-black text-amber-800">{fmt(totalPendingCents)}</p>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">

            {/* Students roster */}
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                <h2 className="font-bold text-slate-900 flex items-center gap-2"><Users className="w-4 h-4 text-slate-400" /> My Students</h2>
                <Link href="/program-holder/students" className="text-xs text-brand-blue-600 hover:underline font-medium">Manage →</Link>
              </div>
              {students.length === 0 ? (
                <div className="px-6 py-10 text-center">
                  <Users className="w-10 h-10 text-slate-200 mx-auto mb-2" />
                  <p className="text-sm text-slate-400">No students on your roster yet.</p>
                </div>
              ) : (
                <div className="divide-y divide-slate-50">
                  {students.map((s) => {
                    const att = attByStudent[s.userId] ?? { hours: 0, sessions: 0, absences: 0 };
                    const ms = msByStudent[s.userId] ?? { done: 0, total: 0 };
                    const payout = payoutByStudent[s.userId];
                    return (
                      <div key={s.id} className="px-6 py-4">
                        <div className="flex items-start justify-between gap-4 mb-3">
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="w-9 h-9 rounded-full bg-brand-blue-100 flex items-center justify-center flex-shrink-0">
                              <span className="text-brand-blue-700 text-sm font-bold">{s.name.charAt(0)}</span>
                            </div>
                            <div className="min-w-0">
                              <p className="text-sm font-semibold text-slate-900 truncate">{s.name}</p>
                              <p className="text-xs text-slate-400 truncate">{s.email}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 flex-shrink-0">
                            {s.sequence <= 2 && (
                              <span className="text-xs font-bold text-purple-700 bg-purple-50 border border-purple-200 rounded-full px-2 py-0.5">First 2</span>
                            )}
                            <StatusPill status={s.status} />
                          </div>
                        </div>
                        {/* Attendance + Milestones + Payout row */}
                        <div className="grid grid-cols-3 gap-3 text-center">
                          <div className="bg-slate-50 rounded-lg p-2">
                            <CalendarDays className="w-3.5 h-3.5 text-slate-400 mx-auto mb-0.5" />
                            <p className="text-xs font-bold text-slate-800">{att.hours.toFixed(1)}h</p>
                            <p className="text-xs text-slate-400">{att.absences} absent</p>
                          </div>
                          <div className="bg-slate-50 rounded-lg p-2">
                            <ClipboardList className="w-3.5 h-3.5 text-slate-400 mx-auto mb-0.5" />
                            <p className="text-xs font-bold text-slate-800">{ms.done}/{ms.total}</p>
                            <p className="text-xs text-slate-400">milestones</p>
                          </div>
                          <div className="bg-slate-50 rounded-lg p-2">
                            <CreditCard className="w-3.5 h-3.5 text-slate-400 mx-auto mb-0.5" />
                            {payout ? (
                              <>
                                <p className="text-xs font-bold text-slate-800">{fmt(payout.total_payout_cents)}</p>
                                <StatusPill status={payout.increment_1_status} />
                              </>
                            ) : (
                              <p className="text-xs text-slate-400">No payout</p>
                            )}
                          </div>
                        </div>
                        {/* Payout schedule detail */}
                        {payout && (
                          <div className="mt-3 bg-slate-50 rounded-lg p-3 text-xs space-y-1.5">
                            <div className="flex justify-between items-center">
                              <span className="text-slate-600 font-medium">
                                {s.sequence <= 2 ? 'Full payment to FCTC — first 2 students' : 'Increment 1 — 50% on approval'}
                              </span>
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-slate-800">{fmt(payout.increment_1_cents)}</span>
                                <StatusPill status={payout.increment_1_status} />
                              </div>
                            </div>
                            {payout.increment_1_release_date && (
                              <p className="text-slate-400">Release date: {fmtDate(payout.increment_1_release_date)} · Deposit 1–3 business days</p>
                            )}
                            {s.sequence > 2 && payout.increment_2_status !== 'not_applicable' && (
                              <div className="flex justify-between items-center pt-1 border-t border-slate-200">
                                <span className="text-slate-600 font-medium">Increment 2 — 50% on completion</span>
                                <div className="flex items-center gap-2">
                                  <span className="font-bold text-slate-800">{fmt(payout.increment_2_cents)}</span>
                                  <StatusPill status={payout.increment_2_status} />
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                        <div className="mt-3 flex gap-2">
                          <Link href={`/program-holder/students/${s.userId}/attendance`} className="text-xs text-brand-blue-600 hover:underline font-medium">Log Attendance</Link>
                          <span className="text-slate-300">·</span>
                          <Link href={`/program-holder/students/${s.userId}/milestones`} className="text-xs text-brand-blue-600 hover:underline font-medium">Milestones</Link>
                          <span className="text-slate-300">·</span>
                          <Link href={`/program-holder/students/${s.userId}/documents`} className="text-xs text-brand-blue-600 hover:underline font-medium">Documents</Link>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Completion Dates & Hours Taught */}
            {students.length > 0 && (
              <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                  <h2 className="font-bold text-slate-900 flex items-center gap-2">
                    <Award aria-label="award" className="w-4 h-4 text-slate-400" /> Completion &amp; Hours
                  </h2>
                  <span className="text-xs text-slate-400">HVAC EPA 608 — 40 hrs required</span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-100">
                        <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Student</th>
                        <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Enrolled</th>
                        <th className="text-center px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Hours Taught</th>
                        <th className="text-center px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Progress</th>
                        <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Last Session</th>
                        <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Completion Date</th>
                        <th className="text-center px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {students.map((s) => {
                        const pct = s.hoursRequired > 0 ? Math.min(100, Math.round((s.hoursTaught / s.hoursRequired) * 100)) : 0;
                        const isComplete = !!s.completionDate || s.status === 'completed';
                        return (
                          <tr key={s.id} className="hover:bg-slate-50 transition-colors">
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-brand-blue-100 flex items-center justify-center flex-shrink-0">
                                  <span className="text-brand-blue-700 text-xs font-bold">{s.name.charAt(0)}</span>
                                </div>
                                <div>
                                  <p className="font-semibold text-slate-900">{s.name}</p>
                                  <p className="text-xs text-slate-400">{s.email}</p>
                                </div>
                              </div>
                            </td>
                            <td className="px-4 py-4 text-slate-600 whitespace-nowrap">{fmtDate(s.enrolledAt)}</td>
                            <td className="px-4 py-4 text-center">
                              <span className="font-bold text-slate-900">{s.hoursTaught.toFixed(1)}</span>
                              <span className="text-slate-400 text-xs"> / {s.hoursRequired}h</span>
                            </td>
                            <td className="px-4 py-4">
                              <div className="flex items-center gap-2 min-w-[100px]">
                                <div className="flex-1 bg-slate-100 rounded-full h-2">
                                  <div
                                    className={`h-2 rounded-full transition-all ${isComplete ? 'bg-emerald-500' : pct >= 75 ? 'bg-brand-blue-500' : pct >= 40 ? 'bg-amber-400' : 'bg-slate-300'}`}
                                    style={{ width: `${pct}%` }}
                                  />
                                </div>
                                <span className="text-xs font-semibold text-slate-600 w-8 text-right">{pct}%</span>
                              </div>
                            </td>
                            <td className="px-4 py-4 text-slate-600 whitespace-nowrap">{fmtDate(s.lastSessionDate)}</td>
                            <td className="px-4 py-4 whitespace-nowrap">
                              {s.completionDate ? (
                                <span className="text-emerald-700 font-semibold">{fmtDate(s.completionDate)}</span>
                              ) : (
                                <span className="text-slate-300 text-xs">Not yet</span>
                              )}
                            </td>
                            <td className="px-4 py-4 text-center">
                              <StatusPill status={isComplete ? 'completed' : s.hoursTaught > 0 ? 'active' : 'pending'} />
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                    <tfoot>
                      <tr className="bg-slate-50 border-t border-slate-200">
                        <td className="px-6 py-3 text-xs font-semibold text-slate-600" colSpan={2}>Totals</td>
                        <td className="px-4 py-3 text-center font-bold text-slate-900">
                          {students.reduce((sum, s) => sum + s.hoursTaught, 0).toFixed(1)}h
                        </td>
                        <td colSpan={4} className="px-4 py-3 text-xs text-slate-400">
                          {students.filter(s => s.completionDate).length} of {students.length} completed
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
            )}

            {/* Call List */}
            {callList.length > 0 && <CallListPanel applicants={callList as any} />}

            {/* Programs table */}
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                <h2 className="font-bold text-slate-900 flex items-center gap-2"><BookOpen className="w-4 h-4 text-slate-400" /> Programs</h2>
                <Link href="/program-holder/programs" className="text-xs text-brand-blue-600 hover:underline font-medium">Manage →</Link>
              </div>
              {programs.length === 0 ? (
                <div className="px-6 py-8 text-center text-sm text-slate-400">No programs assigned yet.</div>
              ) : (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-slate-400 border-b border-slate-100 text-xs uppercase tracking-wide">
                      <th className="px-6 py-3 font-medium">Program</th>
                      <th className="px-6 py-3 font-medium text-center">Active</th>
                      <th className="px-6 py-3 font-medium text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {programs.map((p) => (
                      <tr key={p.id}>
                        <td className="px-6 py-3 font-medium text-slate-800">{p.name}</td>
                        <td className="px-6 py-3 text-center text-slate-600">{enrollmentsByProgram[p.id] ?? 0}</td>
                        <td className="px-6 py-3 text-center"><StatusPill status={p.isActive ? 'active' : p.status} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

          </div>

          {/* Right rail */}
          <div className="space-y-4">

            {/* Pending Hour Approvals */}
            <div id="pending-hours" className="bg-white rounded-xl border border-slate-200 overflow-hidden">
              <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
                <h2 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                  <Clock className="w-4 h-4 text-amber-500" />
                  Pending Hours
                  {pendingHours.length > 0 && (
                    <span className="px-1.5 py-0.5 rounded-full text-xs bg-amber-100 text-amber-800 border border-amber-200">
                      {pendingHours.length}
                    </span>
                  )}
                </h2>
                <Link href="/program-holder/dashboard#pending-hours" className="text-xs text-brand-blue-600 hover:underline font-medium">
                  Review →
                </Link>
              </div>
              {pendingHours.length === 0 ? (
                <div className="px-4 py-5 text-center">
                  <CheckCircle className="w-6 h-6 text-green-400 mx-auto mb-1" />
                  <p className="text-xs text-slate-400">No pending approvals</p>
                </div>
              ) : (
                <div className="divide-y divide-slate-50">
                  {pendingHours.slice(0, 5).map((h: any) => (
                    <div key={h.id} className="px-4 py-2.5 flex items-center justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-slate-800 truncate">{h.full_name}</p>
                        <p className="text-xs text-slate-400">{h.work_date} · {h.source_type}</p>
                      </div>
                      <span className="text-xs font-bold text-amber-700 flex-shrink-0">
                        {Number(h.hours_claimed).toFixed(1)}h
                      </span>
                    </div>
                  ))}
                  {pendingHours.length > 5 && (
                    <div className="px-4 py-2 text-center">
                      <Link href="/program-holder/dashboard#pending-hours" className="text-xs text-brand-blue-600 hover:underline">
                        +{pendingHours.length - 5} more →
                      </Link>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* At-Risk Students */}
            {atRiskStudents.length > 0 && (
              <div className="bg-amber-50 rounded-xl border border-amber-200 overflow-hidden">
                <div className="px-4 py-3 border-b border-amber-200 flex items-center justify-between">
                  <h2 className="font-bold text-amber-900 text-sm flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-amber-600" />
                    At Risk
                    <span className="px-1.5 py-0.5 rounded-full text-xs bg-amber-200 text-amber-900">
                      {atRiskStudents.length}
                    </span>
                  </h2>
                  <Link href="/program-holder/students/at-risk" className="text-xs text-amber-700 hover:underline font-medium">
                    View all →
                  </Link>
                </div>
                <div className="divide-y divide-amber-100">
                  {atRiskStudents.slice(0, 5).map((s) => (
                    <div key={s.id} className="px-4 py-2.5 flex items-center justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-amber-900 truncate">{s.name}</p>
                        <p className="text-xs text-amber-600">No activity in 7+ days</p>
                      </div>
                      <XCircle className="w-4 h-4 text-amber-500 flex-shrink-0" />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {[
              { label: 'Handbook', sub: 'Policies & requirements', href: '/program-holder/handbook', img: '/images/pages/program-holder-page-2.webp' },
              { label: 'Manage Students', sub: 'Attendance & progress', href: '/program-holder/students', img: '/images/pages/mentorship-page-1.webp' },
              { label: 'Documents', sub: 'Licenses & compliance', href: '/program-holder/documents', img: '/images/pages/program-holder-docs.webp' },
              { label: 'Reports', sub: 'Compliance & performance', href: '/program-holder/reports', img: '/images/pages/admin-analytics-programs-hero.jpg' },
              { label: 'Payroll Setup', sub: 'Banking & direct deposit', href: '/onboarding/payroll-setup', img: '/images/pages/admin-students-hero.jpg' },
            ].map((action) => (
              <Link key={action.href} href={action.href} className="group flex items-center gap-4 bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                <div className="relative w-16 h-16 flex-shrink-0">
                  <Image src={action.img} alt={action.label} fill className="object-cover group-hover:scale-105 transition-transform duration-300" sizes="64px" placeholder="empty" />
                  <div className="absolute inset-0 bg-brand-blue-900/30" />
                </div>
                <div className="flex-1 py-3 pr-4 min-w-0">
                  <p className="font-bold text-slate-900 text-sm">{action.label}</p>
                  <p className="text-xs text-slate-500 mt-0.5">{action.sub}</p>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-brand-blue-500 mr-3 transition-colors" />
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
