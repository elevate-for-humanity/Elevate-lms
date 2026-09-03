import { Metadata } from 'next';
import { requireRole } from '@/lib/auth/require-role';
import { requireAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';
import { getCaseManagerParticipants, hasCaseManagerOversight } from '@/lib/case-manager/participant-scope';
import { Award, Briefcase, CheckCircle2, Clock3, GraduationCap, Users } from 'lucide-react';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = {
  title: 'Case Manager Analytics | Elevate Workforce Hub',
  description: 'Caseload-scoped enrollment, credential, completion, and placement outcomes.',
  robots: { index: false, follow: false },
};

export default async function CaseManagerAnalyticsPage() {
  const { user, effectiveRoles } = await requireRole(['case_manager', 'admin', 'staff']);
  const supabase = await createClient();
  const admin = await requireAdminClient();
  const db = admin || supabase;

  const participants = await getCaseManagerParticipants({ db, userId: user.id, effectiveRoles });
  const learnerIds = [...new Set(participants.map((row) => row.learnerId).filter((id): id is string => Boolean(id)))];
  const oversight = hasCaseManagerOversight(effectiveRoles);

  if (!learnerIds.length && !oversight) {
    return <main className="rounded-2xl border border-slate-200 bg-white p-10 text-center"><h1 className="text-2xl font-black">Case Manager Analytics</h1><p className="mt-2 text-sm font-medium text-slate-600">No participants are assigned to your caseload yet.</p></main>;
  }

  const scoped = <T,>(query: any, column = 'user_id') => learnerIds.length ? query.in(column, learnerIds) : query.limit(0);
  const [enrollmentsRes, credentialsRes, placementsRes] = await Promise.all([
    scoped(db.from('program_enrollments').select('id, user_id, status, enrollment_state, enrolled_at, completed_at, program_id')),
    scoped(db.from('learner_credentials').select('id, learner_id, status, credential_name, issued_at'), 'learner_id'),
    scoped(db.from('placement_records').select('id, learner_id, status, employer_name, job_title, hourly_wage, start_date, created_at'), 'learner_id'),
  ]);

  if (enrollmentsRes.error) throw new Error(`CASE_ANALYTICS_ENROLLMENTS_FAILED:${enrollmentsRes.error.message}`);
  if (credentialsRes.error) throw new Error(`CASE_ANALYTICS_CREDENTIALS_FAILED:${credentialsRes.error.message}`);
  if (placementsRes.error) throw new Error(`CASE_ANALYTICS_PLACEMENTS_FAILED:${placementsRes.error.message}`);

  const enrollments = enrollmentsRes.data ?? [];
  const credentials = credentialsRes.data ?? [];
  const placements = placementsRes.data ?? [];
  const stateOf = (row: any) => String(row.enrollment_state || row.status || '').toLowerCase();
  const activeEnrollments = enrollments.filter((row: any) => ['active', 'enrolled', 'in_progress'].includes(stateOf(row))).length;
  const completedEnrollments = enrollments.filter((row: any) => stateOf(row) === 'completed').length;
  const verifiedPlacements = placements.filter((row: any) => String(row.status).toLowerCase() === 'verified');
  const pendingPlacements = placements.filter((row: any) => String(row.status).toLowerCase() === 'pending');
  const activeCredentials = credentials.filter((row: any) => ['active', 'issued', 'verified'].includes(String(row.status || 'active').toLowerCase()));
  const completionRate = enrollments.length ? Math.round((completedEnrollments / enrollments.length) * 100) : 0;
  const placementRate = learnerIds.length ? Math.round((new Set(verifiedPlacements.map((row: any) => row.learner_id)).size / learnerIds.length) * 100) : 0;
  const wages = verifiedPlacements.map((row: any) => Number(row.hourly_wage)).filter((value: number) => Number.isFinite(value) && value > 0);
  const averageWage = wages.length ? wages.reduce((sum: number, value: number) => sum + value, 0) / wages.length : null;

  const metrics = [
    { label: 'Assigned participants', value: participants.length, icon: Users },
    { label: 'Active enrollments', value: activeEnrollments, icon: GraduationCap },
    { label: 'Completion rate', value: `${completionRate}%`, icon: CheckCircle2 },
    { label: 'Active credentials', value: activeCredentials.length, icon: Award },
    { label: 'Verified placement rate', value: `${placementRate}%`, icon: Briefcase },
    { label: 'Pending placement checks', value: pendingPlacements.length, icon: Clock3 },
  ];

  return (
    <main className="space-y-6">
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <p className="text-xs font-black uppercase tracking-[0.16em] text-blue-800">Case Manager outcomes</p>
        <h1 className="mt-2 text-3xl font-black text-slate-950">Caseload analytics</h1>
        <p className="mt-2 max-w-3xl text-sm font-medium leading-6 text-slate-600">
          Enrollment, credential, completion, and placement outcomes are calculated only from the participants authorized in this caseload.
        </p>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3" aria-label="Case manager performance metrics">
        {metrics.map(({ label, value, icon: Icon }) => <article key={label} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><Icon className="h-5 w-5 text-blue-700" /><p className="mt-3 text-3xl font-black text-slate-950">{value}</p><p className="mt-1 text-sm font-semibold text-slate-600">{label}</p></article>)}
      </section>

      <section className="grid gap-5 lg:grid-cols-3">
        <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"><h2 className="font-black">Enrollment outcomes</h2><dl className="mt-4 space-y-3"><Row label="Total enrollments" value={enrollments.length} /><Row label="Completed" value={completedEnrollments} /><Row label="Active" value={activeEnrollments} /></dl></article>
        <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"><h2 className="font-black">Placement outcomes</h2><dl className="mt-4 space-y-3"><Row label="Verified placements" value={verifiedPlacements.length} /><Row label="Pending verification" value={pendingPlacements.length} /><Row label="Participants placed" value={new Set(verifiedPlacements.map((row: any) => row.learner_id)).size} /></dl></article>
        <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"><h2 className="font-black">Wage evidence</h2><p className="mt-4 text-3xl font-black text-slate-950">{averageWage == null ? '—' : `$${averageWage.toFixed(2)}/hr`}</p><p className="mt-2 text-sm font-medium text-slate-600">Average of verified placement records with a recorded hourly wage. Missing wages are not estimated.</p></article>
      </section>
    </main>
  );
}

function Row({ label, value }: { label: string; value: number | string }) {
  return <div className="flex items-center justify-between gap-4 border-b border-slate-100 pb-3 last:border-0"><dt className="text-sm font-semibold text-slate-600">{label}</dt><dd className="font-black text-slate-950">{value}</dd></div>;
}
