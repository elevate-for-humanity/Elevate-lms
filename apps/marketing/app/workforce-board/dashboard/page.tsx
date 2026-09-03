import { requirePortalAccess } from '@/lib/auth/portal-access';
import { createClient } from '@/lib/supabase/server';
import { Metadata } from 'next';
import Link from 'next/link';
import { AlertTriangle, Award, Briefcase, TrendingUp, Users } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Workforce Board Dashboard',
  description: 'Scoped workforce oversight dashboard for authorized workforce boards.',
  robots: { index: false, follow: false },
};
export const dynamic = 'force-dynamic';

function enrollmentState(row: any) {
  return String(row.enrollment_state || row.status || '').toLowerCase();
}

export default async function WorkforceBoardDashboard() {
  const access = await requirePortalAccess('workforceboard');
  const supabase = await createClient();
  const platformWide = access.isPlatformAdmin;
  const scopeId = access.profile.organization_id ?? access.profile.tenant_id ?? null;

  if (!platformWide && !scopeId) {
    return (
      <main className="mx-auto max-w-5xl p-6 sm:p-8">
        <section role="alert" className="rounded-2xl border border-amber-300 bg-amber-50 p-6 text-amber-950">
          <div className="flex gap-3">
            <AlertTriangle className="mt-0.5 h-6 w-6 shrink-0" />
            <div>
              <h1 className="text-xl font-black">Workforce Board scope is not configured</h1>
              <p className="mt-2 text-sm font-medium leading-6">
                This account has Workforce Board access but is not linked to an organization or tenant. Regional metrics are blocked rather than falling back to platform-wide participant data.
              </p>
            </div>
          </div>
        </section>
      </main>
    );
  }

  let enrollmentQuery = supabase
    .from('program_enrollments')
    .select('id, status, enrollment_state, created_at, user_id, program_id');
  let programQuery = supabase.from('programs').select('id, status');

  if (!platformWide && scopeId) {
    enrollmentQuery = enrollmentQuery.eq('organization_id', scopeId);
    programQuery = programQuery.eq('organization_id', scopeId);
  }

  const [enrollmentResult, programResult] = await Promise.all([enrollmentQuery, programQuery]);
  if (enrollmentResult.error) throw new Error(`WORKFORCE_BOARD_ENROLLMENTS_FAILED:${enrollmentResult.error.message}`);
  if (programResult.error) throw new Error(`WORKFORCE_BOARD_PROGRAMS_FAILED:${programResult.error.message}`);

  const enrollments = enrollmentResult.data ?? [];
  const programs = programResult.data ?? [];
  const learnerIds = [...new Set(enrollments.map((row: any) => row.user_id).filter(Boolean))] as string[];
  const programIds = [...new Set(enrollments.map((row: any) => row.program_id).filter(Boolean))] as string[];

  const [{ data: profiles, error: profilesError }, { data: programRows, error: programRowsError }, credentialResult] = await Promise.all([
    learnerIds.length
      ? supabase.from('profiles').select('id, full_name').in('id', learnerIds)
      : Promise.resolve({ data: [], error: null }),
    programIds.length
      ? supabase.from('programs').select('id, title, name').in('id', programIds)
      : Promise.resolve({ data: [], error: null }),
    learnerIds.length
      ? supabase.from('certificates').select('id', { count: 'exact', head: true }).in('user_id', learnerIds)
      : Promise.resolve({ count: 0, error: null }),
  ]);
  if (profilesError) throw new Error(`WORKFORCE_BOARD_PROFILES_FAILED:${profilesError.message}`);
  if (programRowsError) throw new Error(`WORKFORCE_BOARD_PROGRAM_DETAILS_FAILED:${programRowsError.message}`);
  if (credentialResult.error) throw new Error(`WORKFORCE_BOARD_CREDENTIALS_FAILED:${credentialResult.error.message}`);

  const profileMap = Object.fromEntries((profiles ?? []).map((row: any) => [row.id, row]));
  const programMap = Object.fromEntries((programRows ?? []).map((row: any) => [row.id, row]));
  const completedEnrollments = enrollments.filter((row: any) => enrollmentState(row) === 'completed').length;
  const activeEnrollments = enrollments.filter((row: any) => ['active', 'enrolled', 'in_progress'].includes(enrollmentState(row))).length;
  const activePrograms = programs.filter((row: any) => ['active', 'published'].includes(String(row.status || '').toLowerCase())).length;
  const completionRate = enrollments.length ? Math.round((completedEnrollments / enrollments.length) * 100) : 0;
  const recentEnrollments = [...enrollments]
    .sort((a: any, b: any) => String(b.created_at || '').localeCompare(String(a.created_at || '')))
    .slice(0, 8);

  return (
    <main className="space-y-6">
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.16em] text-indigo-700">Workforce Board oversight</p>
            <h1 className="mt-2 text-3xl font-black text-slate-950">Regional workforce dashboard</h1>
            <p className="mt-2 max-w-2xl text-sm font-medium leading-6 text-slate-600">
              {platformWide
                ? 'Platform administrator oversight. Metrics include all organizations.'
                : 'Metrics are restricted to the organization assigned to this Workforce Board account.'}
            </p>
          </div>
          <Link href="/workforce-board/employment" className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-indigo-700 px-5 py-3 text-sm font-black text-white hover:bg-indigo-800">
            <Briefcase className="h-4 w-4" /> Employment outcomes
          </Link>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5" aria-label="Workforce Board performance metrics">
        <Metric label="Participants" value={learnerIds.length} icon={Users} />
        <Metric label="Active enrollments" value={activeEnrollments} icon={TrendingUp} />
        <Metric label="Completions" value={completedEnrollments} icon={Award} />
        <Metric label="Completion rate" value={`${completionRate}%`} icon={TrendingUp} />
        <Metric label="Credentials" value={credentialResult.count ?? 0} icon={Award} />
      </section>

      <section className="grid gap-5 lg:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Active programs</p>
          <p className="mt-2 text-3xl font-black">{activePrograms}</p>
          <p className="mt-1 text-sm font-medium text-slate-600">Programs inside the authorized reporting scope.</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Total enrollments</p>
          <p className="mt-2 text-3xl font-black">{enrollments.length}</p>
          <p className="mt-1 text-sm font-medium text-slate-600">All scoped enrollment records, including completed and inactive records.</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Reporting scope</p>
          <p className="mt-2 text-lg font-black">{platformWide ? 'Platform-wide admin' : 'Organization scoped'}</p>
          <p className="mt-1 break-all text-xs font-medium text-slate-500">{platformWide ? 'Administrator override' : scopeId}</p>
        </div>
      </section>

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 px-5 py-4"><h2 className="font-black text-slate-950">Recent enrollments</h2></div>
        {recentEnrollments.length ? (
          <div className="divide-y divide-slate-100">
            {recentEnrollments.map((enrollment: any) => {
              const program = programMap[enrollment.program_id];
              return (
                <div key={enrollment.id} className="flex flex-col gap-2 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="font-bold text-slate-900">{profileMap[enrollment.user_id]?.full_name || 'Participant'}</p>
                    <p className="text-sm text-slate-600">{program?.title || program?.name || 'Program'}</p>
                  </div>
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-black text-slate-700">{enrollmentState(enrollment) || 'unknown'}</span>
                </div>
              );
            })}
          </div>
        ) : <p className="p-8 text-center text-sm font-medium text-slate-500">No enrollments exist inside this reporting scope.</p>}
      </section>
    </main>
  );
}

function Metric({ label, value, icon: Icon }: { label: string; value: number | string; icon: React.ComponentType<{ className?: string }> }) {
  return <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><Icon className="h-5 w-5 text-indigo-700" /><p className="mt-3 text-2xl font-black text-slate-950">{value}</p><p className="mt-1 text-sm font-semibold text-slate-600">{label}</p></article>;
}
