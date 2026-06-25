import { Metadata } from 'next';
import { requireAdminClient } from '@/lib/supabase/admin';
import { requireRole } from '@/lib/auth/require-role';
import Link from 'next/link';
import {
  Users,
  Clock,
  CheckCircle,
  AlertTriangle,
  ArrowRight,
  Building2,
  Phone,
  Mail,
} from 'lucide-react';
import { AdminCard, AdminEmptyState, AdminFilterBar } from '@/components/admin/AdminPageShell';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import ReferralConfirmButton from './ReferralConfirmButton';
import { PLATFORM_DEFAULTS } from '@/lib/config/platform-config';

export const metadata: Metadata = {
  title: `Agency Referrals | Admin | ${PLATFORM_DEFAULTS.orgName}`,
};

export const dynamic = 'force-dynamic';
export const revalidate = 60;

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  referred:       { label: 'Referred',        color: 'bg-slate-100 text-slate-700' },
  intake_started: { label: 'Intake Started',  color: 'bg-blue-100 text-blue-700' },
  enrolled:       { label: 'Enrolled',        color: 'bg-indigo-100 text-indigo-700' },
  active:         { label: 'Active',          color: 'bg-emerald-100 text-emerald-700' },
  completed:      { label: 'Completed',       color: 'bg-green-100 text-green-700' },
  withdrawn:      { label: 'Withdrawn',       color: 'bg-amber-100 text-amber-700' },
  cancelled:      { label: 'Cancelled',       color: 'bg-red-100 text-red-700' },
};

const AGENCY_LABELS: Record<string, string> = {
  american_job_center:      'American Job Center',
  workforce_board:          'Workforce Board',
  vocational_rehabilitation: 'Vocational Rehabilitation',
  wioa:                     'WIOA',
  jri:                      'JRI',
  snap_et:                  '',
  fssa:                     'FSSA',
  other:                    'Other',
};

export default async function ReferralsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; agency?: string }>;
}) {
  await requireRole(['admin', 'staff', 'advisor']);
  const params = await searchParams;

  const db = await requireAdminClient();

  // Summary counts
  const { data: counts } = await db
    .from('workforce_referrals')
    .select('status')
    .eq('archived', false);

  const summary = {
    total:               counts?.length ?? 0,
    unacknowledged:      counts?.filter((r) => r.status === 'referred').length ?? 0,
    enrolled:            counts?.filter((r) => r.status === 'enrolled').length ?? 0,
    completed:           counts?.filter((r) => r.status === 'completed').length ?? 0,
  };

  // Referral list with filters
  let query = db
    .from('referral_pipeline_summary')
    .select('*')
    .order('referral_date', { ascending: false })
    .limit(100);

  if (params.status && params.status !== 'all') {
    query = query.eq('status', params.status);
  }
  if (params.agency && params.agency !== 'all') {
    query = query.eq('agency_type', params.agency);
  }

  const { data: referrals, error } = await query;

  if (error) {
    return (
      <div className="min-h-screen bg-white p-8">
        <p className="text-red-600 font-medium">Failed to load referral pipeline — check server logs for details.</p>
      </div>
    );
  }

  const rows = referrals ?? [];

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b px-6 py-3">
        <Breadcrumbs
          items={[{ label: 'Admin', href: '/admin/dashboard' }, { label: 'Agency Referrals' }]}
        />
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex items-start justify-between mb-6 flex-wrap gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Agency Referrals</h1>
            <p className="text-sm text-slate-500 mt-1">
              Track every referral from intake through placement. A referral without partner
              acknowledgment is not valid for FSSA/WIOA reporting.
            </p>
          </div>
          <Link
            href="/admin/workone-queue"
            className="inline-flex items-center gap-2 text-sm font-semibold bg-amber-600 hover:bg-amber-700 text-white px-4 py-2 rounded-lg transition"
          >
            <Clock className="w-4 h-4" /> WorkOne Queue
          </Link>
        </div>

        {/* Summary strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
          {[
            { label: 'Total referrals',      value: summary.total,          icon: Users,        color: 'text-slate-700' },
            { label: 'Awaiting acknowledgment', value: summary.unacknowledged, icon: AlertTriangle, color: 'text-amber-600' },
            { label: 'Enrolled',             value: summary.enrolled,       icon: CheckCircle,  color: 'text-indigo-600' },
            { label: 'Completed',            value: summary.completed,      icon: CheckCircle,  color: 'text-emerald-600' },
          ].map((s) => (
            <div key={s.label} className="bg-white rounded-xl border border-slate-200 p-4">
              <s.icon className={`w-5 h-5 mb-2 ${s.color}`} />
              <p className="text-2xl font-bold text-slate-900">{s.value}</p>
              <p className="text-xs text-slate-500 mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Filters */}
        <AdminFilterBar>
          <div className="flex flex-wrap gap-3 items-center">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Status</span>
            {['all', 'referred', 'intake_started', 'enrolled', 'active', 'completed', 'withdrawn', 'cancelled'].map((s) => (
              <Link
                key={s}
                href={`/admin/referrals?status=${s}${params.agency ? `&agency=${params.agency}` : ''}`}
                className={`text-xs px-3 py-1 rounded-full font-medium transition ${
                  (params.status ?? 'all') === s
                    ? 'bg-slate-900 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {s === 'all' ? 'All' : (STATUS_LABELS[s]?.label ?? s)}
              </Link>
            ))}

            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide ml-4">Agency</span>
            {['all', 'american_job_center', 'workforce_board', 'wioa', 'snap_et', 'fssa', 'jri', 'vocational_rehabilitation', 'other'].map((a) => (
              <Link
                key={a}
                href={`/admin/referrals?${params.status ? `status=${params.status}&` : ''}agency=${a}`}
                className={`text-xs px-3 py-1 rounded-full font-medium transition ${
                  (params.agency ?? 'all') === a
                    ? 'bg-slate-900 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {a === 'all' ? 'All' : (AGENCY_LABELS[a] ?? a)}
              </Link>
            ))}
          </div>
        </AdminFilterBar>

        {/* Referral list */}
        {rows.length === 0 ? (
          <AdminCard>
            <AdminEmptyState message="No referrals match the current filters." />
          </AdminCard>
        ) : (
          <div className="space-y-3">
            {rows.map((r) => {
              const statusMeta = STATUS_LABELS[r.status] ?? { label: r.status, color: 'bg-slate-100 text-slate-700' };
              const isStale = !r.partner_acknowledged && (r.days_since_referral ?? 0) >= 7;

              return (
                <div
                  key={r.id}
                  className={`bg-white rounded-xl border p-5 ${isStale ? 'border-amber-200' : 'border-slate-200'}`}
                >
                  <div className="flex items-start justify-between gap-4 flex-wrap">
                    <div className="flex-1 min-w-0">
                      {/* Name + badges */}
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <span className="font-bold text-slate-900">
                          {r.participant_name ?? 'Unknown participant'}
                        </span>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusMeta.color}`}>
                          {statusMeta.label}
                        </span>
                        {!r.partner_acknowledged && (
                          <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-amber-100 text-amber-700">
                            Awaiting acknowledgment
                          </span>
                        )}
                        {r.partner_acknowledged && (
                          <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-emerald-100 text-emerald-700">
                            Partner acknowledged
                          </span>
                        )}
                        {isStale && (
                          <span className="inline-flex items-center gap-1 text-xs text-red-600 font-medium">
                            <AlertTriangle className="w-3 h-3" />
                            {r.days_since_referral}d — follow up
                          </span>
                        )}
                      </div>

                      {/* Contact */}
                      <div className="flex flex-wrap gap-3 text-sm text-slate-500 mb-3">
                        {r.participant_email && (
                          <a href={`mailto:${r.participant_email}`} className="flex items-center gap-1 hover:text-slate-700">
                            <Mail className="w-3.5 h-3.5" /> {r.participant_email}
                          </a>
                        )}
                      </div>

                      {/* Agency + case manager */}
                      <div className="flex flex-wrap gap-4 text-xs mb-3">
                        <div className="flex items-center gap-1.5 text-slate-600">
                          <Building2 className="w-3.5 h-3.5 text-slate-400" />
                          <span className="font-medium">{r.agency_name}</span>
                          <span className="text-slate-400">({AGENCY_LABELS[r.agency_type] ?? r.agency_type})</span>
                        </div>
                        {r.case_manager_name && (
                          <div className="flex items-center gap-1.5 text-slate-600">
                            <span className="text-slate-400">Case manager:</span>
                            <span className="font-medium">{r.case_manager_name}</span>
                          </div>
                        )}
                        {r.case_manager_email && (
                          <a href={`mailto:${r.case_manager_email}`} className="flex items-center gap-1 text-slate-500 hover:text-slate-700">
                            <Mail className="w-3 h-3" /> {r.case_manager_email}
                          </a>
                        )}
                      </div>

                      {/* Pipeline details */}
                      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-xs">
                        <div>
                          <span className="text-slate-400 block">Referred</span>
                          <span className="font-medium text-slate-700">
                            {r.referral_date
                              ? new Date(r.referral_date).toLocaleDateString()
                              : '—'}
                          </span>
                        </div>
                        <div>
                          <span className="text-slate-400 block">Funding</span>
                          <span className="font-medium text-slate-700">{r.funding_type ?? '—'}</span>
                        </div>
                        <div>
                          <span className="text-slate-400 block">Application</span>
                          <span className={`font-medium ${r.application_status ? 'text-slate-700' : 'text-slate-400'}`}>
                            {r.application_status ?? 'Not linked'}
                          </span>
                        </div>
                        <div>
                          <span className="text-slate-400 block">WorkOne</span>
                          <span className={`font-medium ${r.has_workone_approval ? 'text-emerald-700' : 'text-slate-400'}`}>
                            {r.has_workone_approval ? `Approved${r.workone_approval_ref ? ` · ${r.workone_approval_ref}` : ''}` : 'Pending'}
                          </span>
                        </div>
                        <div>
                          <span className="text-slate-400 block">Enrollment</span>
                          <span className={`font-medium ${r.enrollment_status ? 'text-slate-700' : 'text-slate-400'}`}>
                            {r.enrollment_status ?? '—'}
                          </span>
                        </div>
                      </div>

                      {/* Latest confirmation note */}
                      {r.latest_confirmation_notes && (
                        <p className="mt-3 text-xs text-slate-500 italic border-l-2 border-slate-200 pl-2">
                          {r.latest_confirmation_type && (
                            <span className="font-medium not-italic text-slate-600 mr-1">
                              {r.latest_confirmation_type}:
                            </span>
                          )}
                          {r.latest_confirmation_notes}
                        </p>
                      )}

                      {/* Placement outcome */}
                      {r.employer_name && (
                        <div className="mt-2 text-xs text-emerald-700 font-medium">
                          Placed: {r.employer_name}
                          {r.job_title && ` · ${r.job_title}`}
                          {r.hourly_wage && ` · $${r.hourly_wage}/hr`}
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex flex-col gap-2 shrink-0">
                      <ReferralConfirmButton
                        referralId={r.id}
                        participantName={r.participant_name ?? 'this participant'}
                        currentStatus={r.status}
                        partnerAcknowledged={r.partner_acknowledged ?? false}
                      />
                      {r.application_id && (
                        <Link
                          href={`/admin/applications/review/${r.application_id}`}
                          className="inline-flex items-center gap-1.5 text-xs font-semibold border border-slate-200 text-slate-600 hover:border-slate-300 px-3 py-1.5 rounded-lg transition"
                        >
                          Application <ArrowRight className="w-3 h-3" />
                        </Link>
                      )}
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
