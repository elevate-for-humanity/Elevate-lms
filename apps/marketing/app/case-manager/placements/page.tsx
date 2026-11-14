import { Metadata } from 'next';
import Link from 'next/link';
import { requireAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';
import { requireRole } from '@/lib/auth/require-role';
import { getCaseManagerParticipants, hasCaseManagerOversight } from '@/lib/case-manager/participant-scope';
import VerifyPlacementButton from './_components/VerifyPlacementButton';

export const metadata: Metadata = { title: 'Placements | Case Manager', robots: { index: false, follow: false } };
export const dynamic = 'force-dynamic';

export default async function CaseManagerPlacementsPage() {
  const { user, effectiveRoles } = await requireRole(['case_manager', 'admin', 'staff']);
  const supabase = await createClient();
  const admin = await requireAdminClient();
  const db = admin || supabase;

  const oversight = hasCaseManagerOversight(effectiveRoles);
  const participants = await getCaseManagerParticipants({ db, userId: user.id, effectiveRoles });
  const learnerIds = [...new Set(participants.map((participant) => participant.learnerId).filter((id): id is string => Boolean(id)))];

  let placementQuery = db
    .from('placement_records')
    .select('id, learner_id, employer_name, job_title, employment_type, hourly_wage, start_date, status, verification_method, verified_at, notes, created_at')
    .order('status', { ascending: true })
    .order('created_at', { ascending: false });

  if (!oversight) {
    if (!learnerIds.length) placementQuery = placementQuery.eq('case_manager_id', user.id).limit(0);
    else placementQuery = placementQuery.in('learner_id', learnerIds);
  }

  const { data: placements, error: placementsError } = await placementQuery;
  if (placementsError) throw new Error(`CASE_MANAGER_PLACEMENTS_FAILED:${placementsError.message}`);

  const placementLearnerIds = [...new Set((placements ?? []).map((row: any) => row.learner_id).filter(Boolean))] as string[];
  const { data: profiles, error: profilesError } = placementLearnerIds.length
    ? await db.from('profiles').select('id, full_name, email').in('id', placementLearnerIds)
    : { data: [], error: null };
  if (profilesError) throw new Error(`CASE_MANAGER_PLACEMENT_PROFILES_FAILED:${profilesError.message}`);
  const profilesById = Object.fromEntries((profiles ?? []).map((profile: any) => [profile.id, profile]));
  const scopedPlacements = (placements ?? []).map((placement: any) => ({ ...placement, profiles: profilesById[placement.learner_id] ?? null }));

  const pending = scopedPlacements.filter((p: any) => p.status === 'pending');
  const verified = scopedPlacements.filter((p: any) => p.status === 'verified');
  const other = scopedPlacements.filter((p: any) => !['pending', 'verified'].includes(p.status));

  const statusBadge = (status: string) => {
    if (status === 'verified') return 'bg-emerald-100 text-emerald-900';
    if (status === 'pending') return 'bg-amber-100 text-amber-900';
    if (status === 'rejected') return 'bg-red-100 text-red-900';
    if (status === 'lost') return 'bg-slate-100 text-slate-700';
    return 'bg-slate-100 text-slate-900';
  };

  return (
    <main className="space-y-6">
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <p className="text-xs font-black uppercase tracking-[0.16em] text-blue-800">Case management</p>
        <h1 className="mt-2 text-3xl font-black text-slate-950">Employment placements</h1>
        <p className="mt-2 text-sm font-medium text-slate-600">
          {oversight ? 'Authorized staff oversight across placement records.' : 'Only placements for participants in your assigned caseload are shown.'}
        </p>
        <div className="mt-4 flex flex-wrap gap-2 text-xs font-bold text-slate-600">
          <span className="rounded-full bg-amber-100 px-3 py-1.5 text-amber-900">{pending.length} pending verification</span>
          <span className="rounded-full bg-emerald-100 px-3 py-1.5 text-emerald-900">{verified.length} verified</span>
        </div>
      </section>

      {pending.length > 0 && <section><h2 className="mb-3 text-sm font-black uppercase tracking-wide text-amber-800">Pending verification ({pending.length})</h2><PlacementTable rows={pending} statusBadge={statusBadge} showVerifyAction /></section>}
      {verified.length > 0 && <section><h2 className="mb-3 text-sm font-black uppercase tracking-wide text-emerald-800">Verified ({verified.length})</h2><PlacementTable rows={verified} statusBadge={statusBadge} /></section>}
      {other.length > 0 && <section><h2 className="mb-3 text-sm font-black uppercase tracking-wide text-slate-700">Other ({other.length})</h2><PlacementTable rows={other} statusBadge={statusBadge} /></section>}
      {!scopedPlacements.length && <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center text-sm font-medium text-slate-600">No placements exist inside this authorized caseload.</div>}
    </main>
  );
}

function PlacementTable({ rows, statusBadge, showVerifyAction = false }: { rows: any[]; statusBadge: (s: string) => string; showVerifyAction?: boolean }) {
  return (
    <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
      <table className="min-w-full divide-y divide-slate-100 text-sm">
        <thead className="bg-slate-50"><tr>{['Participant','Employer','Title','Type','Wage','Start','Verification','Status'].map((label) => <th key={label} className="px-4 py-3 text-left text-xs font-black uppercase tracking-wide text-slate-600">{label}</th>)}{showVerifyAction && <th className="px-4 py-3" />}</tr></thead>
        <tbody className="divide-y divide-slate-100">{rows.map((p: any) => (
          <tr key={p.id} className="hover:bg-slate-50">
            <td className="px-4 py-3 font-bold text-slate-900">{p.profiles?.full_name ?? p.profiles?.email ?? '—'}</td>
            <td className="px-4 py-3 text-slate-900">{p.employer_name ?? '—'}</td>
            <td className="px-4 py-3 text-slate-900">{p.job_title ?? '—'}</td>
            <td className="px-4 py-3 text-slate-700">{p.employment_type?.replace('_', ' ') ?? '—'}</td>
            <td className="px-4 py-3 text-slate-700">{p.hourly_wage ? `$${p.hourly_wage}/hr` : '—'}</td>
            <td className="px-4 py-3 text-slate-700">{p.start_date ? new Date(p.start_date).toLocaleDateString() : '—'}</td>
            <td className="px-4 py-3 text-slate-700">{p.verification_method?.replace('_', ' ') ?? '—'}</td>
            <td className="px-4 py-3"><span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-black ${statusBadge(p.status)}`}>{p.status}</span></td>
            {showVerifyAction && <td className="px-4 py-3 text-right"><VerifyPlacementButton placementId={p.id} /></td>}
          </tr>
        ))}</tbody>
      </table>
    </div>
  );
}
