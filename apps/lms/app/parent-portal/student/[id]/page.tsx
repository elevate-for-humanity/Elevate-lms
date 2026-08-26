import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, BookOpen, Award, Clock3, ClipboardCheck } from 'lucide-react';
import { requireParentStudentAccess } from '@/lib/auth/parent-access';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: 'Student Progress | Parent Portal', robots: { index: false, follow: false } };

export default async function ParentStudentPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { db, relationship } = await requireParentStudentAccess(id);

  const [{ data: student }, { data: enrollments }, { count: certificates }, { data: hourRows }, { data: apprentice }] = await Promise.all([
    db.from('profiles').select('id, full_name, email').eq('id', id).maybeSingle(),
    db.from('program_enrollments').select('id, status, enrollment_state, progress_percent, enrolled_at, programs(title, slug)').eq('user_id', id).order('enrolled_at', { ascending: false }),
    db.from('program_completion_certificates').select('id', { count: 'exact', head: true }).eq('user_id', id),
    db.from('apprenticeship_hours').select('id, date_worked, week_ending, hours_worked, hours, category, notes, approved, status, approved_at, created_at').eq('student_id', id).order('date_worked', { ascending: false }).limit(500),
    db.from('apprentices').select('total_hours_required').eq('user_id', id).maybeSingle(),
  ]);
  if (!student) notFound();

  const hours = hourRows ?? [];
  const numericHours = (row: any) => Number(row.hours_worked ?? row.hours ?? 0) || 0;
  const isApproved = (row: any) => row.approved === true || ['approved', 'verified'].includes(String(row.status || '').toLowerCase());
  const approvedHours = hours.filter(isApproved).reduce((total: number, row: any) => total + numericHours(row), 0);
  const pendingHours = hours.filter((row: any) => !isApproved(row)).reduce((total: number, row: any) => total + numericHours(row), 0);
  const requiredHours = Number(apprentice?.total_hours_required ?? 0);
  const hourProgress = requiredHours > 0 ? Math.min(100, Math.round((approvedHours / requiredHours) * 100)) : null;
  const recentHours = hours.slice(0, 5);

  return (
    <main className="mx-auto max-w-5xl space-y-6 px-4 py-8">
      <Link href="/parent-portal/dashboard" className="inline-flex items-center gap-2 text-sm font-bold text-blue-700"><ArrowLeft className="h-4 w-4" /> Parent dashboard</Link>
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <p className="text-sm font-bold uppercase tracking-wide text-blue-700">Student progress</p>
        <h1 className="mt-2 text-3xl font-black text-slate-950">{student.full_name || 'Student'}</h1>
        <p className="mt-1 text-sm text-slate-600">Access: {relationship === 'admin-oversight' ? 'Admin oversight' : relationship}</p>
        <div className="mt-5 grid gap-4 sm:grid-cols-3">
          <Metric label="Enrollments" value={String(enrollments?.length ?? 0)} icon={BookOpen} />
          <Metric label="Certificates" value={String(certificates ?? 0)} icon={Award} />
          <Metric label="Active programs" value={String((enrollments ?? []).filter((e: any) => ['active','enrolled'].includes(String(e.enrollment_state || e.status))).length)} icon={Clock3} />
          <Metric label="Approved hours" value={approvedHours.toLocaleString()} icon={ClipboardCheck} />
        </div>
        <div className="mt-5 rounded-xl border border-slate-200 bg-slate-50 p-4">
          <div className="flex flex-wrap items-center justify-between gap-2"><p className="font-bold text-slate-900">Training-hour record</p><p className="text-sm font-black text-slate-900">{approvedHours.toLocaleString()} approved{requiredHours > 0 ? ` / ${requiredHours.toLocaleString()} required` : ''}</p></div>
          {hourProgress !== null ? <><div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-200"><div className="h-full rounded-full bg-blue-700" style={{ width: `${hourProgress}%` }} /></div><p className="mt-1 text-right text-xs text-slate-600">{hourProgress}% of configured hour requirement</p></> : <p className="mt-2 text-xs font-semibold text-cyan-800">Hours are shown as verified evidence; this program does not have a configured time-based completion denominator.</p>}
          {pendingHours > 0 ? <p className="mt-2 text-xs text-amber-800">{pendingHours.toLocaleString()} additional hours are pending verification.</p> : null}
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-xl font-black text-slate-950">Recent training logs</h2>
        <div className="mt-4 divide-y divide-slate-100">
          {recentHours.length ? recentHours.map((row: any) => <article key={row.id} className="flex flex-wrap items-start justify-between gap-3 py-4"><div><p className="font-bold text-slate-900">{row.category ? String(row.category).replace(/[_-]/g, ' ') : 'Training activity'}</p><p className="mt-1 text-sm text-slate-600">{row.notes || 'No public note was recorded.'}</p><p className="mt-1 text-xs text-slate-500">{new Date(`${row.date_worked || row.week_ending || String(row.created_at).slice(0, 10)}T00:00:00`).toLocaleDateString()}</p></div><div className="text-right"><p className="font-black text-slate-950">{numericHours(row)} hours</p><p className={`text-xs font-bold ${isApproved(row) ? 'text-green-700' : 'text-amber-700'}`}>{isApproved(row) ? 'Verified' : 'Pending'}</p></div></article>) : <p className="py-6 text-sm text-slate-600">No training-hour logs have been recorded.</p>}
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-xl font-black text-slate-950">Programs</h2>
        <div className="mt-4 space-y-4">
          {(enrollments ?? []).length ? (enrollments ?? []).map((enrollment: any) => {
            const progress = Math.max(0, Math.min(100, Number(enrollment.progress_percent ?? 0)));
            return <article key={enrollment.id} className="rounded-xl border border-slate-200 p-4"><div className="flex flex-wrap items-center justify-between gap-3"><div><p className="font-bold text-slate-950">{enrollment.programs?.title || 'Program'}</p><p className="text-sm text-slate-600">{enrollment.enrollment_state || enrollment.status || 'unknown'}</p></div><span className="font-black text-slate-900">{progress}%</span></div><div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100"><div className="h-full bg-blue-600" style={{ width: `${progress}%` }} /></div></article>;
          }) : <p className="py-6 text-sm text-slate-600">No program enrollments are available.</p>}
        </div>
      </section>
    </main>
  );
}

function Metric({ label, value, icon: Icon }: { label: string; value: string; icon: React.ElementType }) {
  return <div className="rounded-xl bg-slate-50 p-4"><Icon className="h-5 w-5 text-blue-700" /><p className="mt-3 text-2xl font-black text-slate-950">{value}</p><p className="text-xs font-semibold text-slate-600">{label}</p></div>;
}
