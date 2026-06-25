import { Metadata } from 'next';
import { requireAdminClient } from '@/lib/supabase/admin';
import { requireRole } from '@/lib/auth/require-role';
import Link from 'next/link';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import {
  FileText,
  Plus,
  CheckCircle,
  Clock,
  AlertTriangle,
  User,
  ArrowRight,
} from 'lucide-react';
import IepCreateButton from './IepCreateButton';
import { PLATFORM_DEFAULTS } from '@/lib/config/platform-config';

export const metadata: Metadata = {
  title: `Individual Employment Plans | Admin | ${PLATFORM_DEFAULTS.orgName}`,
};

export const dynamic = 'force-dynamic';
export const revalidate = 60;

const STATUS_META: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  draft:     { label: 'Draft',     color: 'bg-slate-100 text-slate-700',   icon: <Clock className="w-3 h-3" /> },
  active:    { label: 'Active',    color: 'bg-emerald-100 text-emerald-700', icon: <CheckCircle className="w-3 h-3" /> },
  completed: { label: 'Completed', color: 'bg-blue-100 text-blue-700',     icon: <CheckCircle className="w-3 h-3" /> },
  cancelled: { label: 'Cancelled', color: 'bg-red-100 text-red-700',       icon: <AlertTriangle className="w-3 h-3" /> },
};

export default async function IepListPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; search?: string }>;
}) {
  await requireRole(['admin', 'staff', 'advisor']);
  const params = await searchParams;
  const db = await requireAdminClient();

  // Summary counts
  const { data: allIeps } = await db
    .from('individual_employment_plans')
    .select('status');

  const counts = {
    total:     allIeps?.length ?? 0,
    draft:     allIeps?.filter((r) => r.status === 'draft').length ?? 0,
    active:    allIeps?.filter((r) => r.status === 'active').length ?? 0,
    completed: allIeps?.filter((r) => r.status === 'completed').length ?? 0,
  };

  // IEP list with participant profile join
  let query = db
    .from('individual_employment_plans')
    .select(`
      id, status, career_goal, primary_career_goal,
      target_occupation, target_wage, target_completion_date,
      education_level, milestones, notes,
      created_at, updated_at, reviewed_at,
      participant:profiles!individual_employment_plans_user_id_fkey(full_name, email),
      case_manager:profiles!individual_employment_plans_case_manager_id_fkey(full_name)
    `)
    .order('created_at', { ascending: false })
    .limit(100);

  if (params.status && params.status !== 'all') {
    query = query.eq('status', params.status);
  }

  const { data: ieps, error } = await query;

  // Graceful degradation if new columns not yet applied
  const rows = ieps ?? [];
  const viewError = error?.message?.includes('column') ? error : null;

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="bg-white border-b px-6 py-3">
        <Breadcrumbs
          items={[
            { label: 'Admin', href: '/admin/dashboard' },
            { label: 'WIOA', href: '/admin/wioa' },
            { label: 'Employment Plans' },
          ]}
        />
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex items-start justify-between mb-6 flex-wrap gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Individual Employment Plans</h1>
            <p className="text-sm text-slate-500 mt-1">
              Required for WIOA Title I. Each participant must have an active IEP before
              training services can be authorized.
            </p>
          </div>
          <IepCreateButton />
        </div>

        {/* Summary strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
          {[
            { label: 'Total IEPs',  value: counts.total,     color: 'text-slate-700' },
            { label: 'Draft',       value: counts.draft,     color: 'text-amber-600' },
            { label: 'Active',      value: counts.active,    color: 'text-emerald-600' },
            { label: 'Completed',   value: counts.completed, color: 'text-blue-600' },
          ].map((s) => (
            <div key={s.label} className="bg-white rounded-xl border border-slate-200 p-4">
              <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
              <p className="text-xs text-slate-500 mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Status filter */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 mb-5 flex flex-wrap gap-2">
          {['all', 'draft', 'active', 'completed', 'cancelled'].map((s) => (
            <Link
              key={s}
              href={`/admin/wioa/iep?status=${s}`}
              className={`text-xs px-3 py-1 rounded-full font-medium transition ${
                (params.status ?? 'all') === s
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {s === 'all' ? 'All' : STATUS_META[s]?.label ?? s}
            </Link>
          ))}
        </div>

        {viewError && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-5 text-sm text-amber-800">
            <AlertTriangle className="w-4 h-4 inline mr-1.5" />
            Schema migration pending. Apply{' '}
            <code>20260626000004_individual_employment_plans_full_schema.sql</code> in Supabase
            Dashboard to enable full IEP functionality.
          </div>
        )}

        {/* IEP list */}
        {rows.length === 0 ? (
          <div className="bg-white rounded-xl border border-slate-200 p-16 text-center">
            <FileText className="w-10 h-10 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-500 font-medium">No employment plans found.</p>
            <p className="text-sm text-slate-400 mt-1">
              Create the first IEP using the button above.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {rows.map((iep) => {
              const status = iep.status ?? 'draft';
              const meta = STATUS_META[status] ?? STATUS_META.draft;
              const goal = iep.career_goal ?? iep.primary_career_goal ?? '—';
              const participant = (iep.participant as { full_name?: string; email?: string } | null);
              const caseManager = (iep.case_manager as { full_name?: string } | null);
              const milestoneCount = Array.isArray(iep.milestones) ? iep.milestones.length : 0;

              return (
                <div
                  key={iep.id}
                  className="bg-white rounded-xl border border-slate-200 p-5 hover:border-slate-300 transition"
                >
                  <div className="flex items-start justify-between gap-4 flex-wrap">
                    <div className="flex-1 min-w-0">
                      {/* Participant + status */}
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <User className="w-4 h-4 text-slate-400 shrink-0" />
                        <span className="font-bold text-slate-900">
                          {participant?.full_name ?? 'Unknown participant'}
                        </span>
                        {participant?.email && (
                          <span className="text-xs text-slate-400">{participant.email}</span>
                        )}
                        <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium ${meta.color}`}>
                          {meta.icon}
                          {meta.label}
                        </span>
                      </div>

                      {/* Career goal */}
                      <p className="text-sm text-slate-700 mb-3 font-medium">{goal}</p>

                      {/* Details grid */}
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                        <div>
                          <span className="text-slate-400 block">Target occupation</span>
                          <span className="font-medium text-slate-700">
                            {iep.target_occupation ?? '—'}
                          </span>
                        </div>
                        <div>
                          <span className="text-slate-400 block">Target wage</span>
                          <span className="font-medium text-slate-700">
                            {iep.target_wage ? `$${iep.target_wage}/hr` : '—'}
                          </span>
                        </div>
                        <div>
                          <span className="text-slate-400 block">Target completion</span>
                          <span className="font-medium text-slate-700">
                            {iep.target_completion_date
                              ? new Date(iep.target_completion_date).toLocaleDateString()
                              : '—'}
                          </span>
                        </div>
                        <div>
                          <span className="text-slate-400 block">Milestones</span>
                          <span className="font-medium text-slate-700">{milestoneCount}</span>
                        </div>
                      </div>

                      {caseManager?.full_name && (
                        <p className="mt-2 text-xs text-slate-500">
                          Case manager: <span className="font-medium">{caseManager.full_name}</span>
                          {iep.reviewed_at && (
                            <span className="ml-2 text-slate-400">
                              · Reviewed {new Date(iep.reviewed_at).toLocaleDateString()}
                            </span>
                          )}
                        </p>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex flex-col gap-2 shrink-0">
                      <Link
                        href={`/admin/wioa/iep/${iep.id}`}
                        className="inline-flex items-center gap-1.5 text-xs font-semibold border border-slate-200 text-slate-600 hover:border-slate-300 px-3 py-1.5 rounded-lg transition"
                      >
                        View / edit <ArrowRight className="w-3 h-3" />
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
