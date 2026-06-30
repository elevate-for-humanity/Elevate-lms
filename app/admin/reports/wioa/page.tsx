import type { Metadata } from 'next';
import Link from 'next/link';
import { requireRole } from '@/lib/auth/require-role';
import { requireAdminClient } from '@/lib/supabase/admin';
import {
  ChevronRight,
  Download,
  Users,
  TrendingUp,
  GraduationCap,
  Briefcase,
  DollarSign,
  AlertCircle,
} from 'lucide-react';
import PirlExportPanel from '@/components/admin/wioa/PirlExportPanel';

export const dynamic = 'force-dynamic';
export const revalidate = 60;
export const metadata: Metadata = {
  title: 'WIOA Performance Report | Admin',
};

// ── Types ─────────────────────────────────────────────────────────────────────

interface WioaSummary {
  total_participants: number;
  active_enrollments: number;
  completed: number;
  exited: number;
  job_placements: number;
  credentials_issued: number;
  avg_hourly_wage: number | null;
  wioa_funded: number;
  wrg_funded: number;
  self_pay: number;
  employer_sponsored: number;
}

// Beauty/barbershop programs are self-pay only — never WIOA/WRG eligible.
const SELF_PAY_SLUGS = [
  'barber', 'barber-2024', 'barber-apprenticeship',
  'cosmetology', 'cosmetology-apprenticeship',
  'esthetician', 'esthetician-apprenticeship',
  'nail-technician', 'nail-technician-apprenticeship', 'nail-tech-apprenticeship',
  'hair-stylist-nail-tech-apprenticeship', 'hair-stylist-esthetician-apprenticeship',
  'beauty-career-educator',
] as const;

interface ParticipantRow {
  enrollment_id: string;
  full_name: string;
  email: string;
  program_title: string;
  program_category: string;
  enrollment_status: string;
  funding_source: string | null;
  applied_at: string | null;
  completed_at: string | null;
  outcome_type: string;
  employer_name: string | null;
  job_title: string | null;
  hourly_wage: number | null;
  credential_received: boolean;
}

// ── Filters ───────────────────────────────────────────────────────────────────

interface Filters {
  status?: string;
  funding?: string;
  category?: string;
  search?: string;
  start_date?: string;
  end_date?: string;
}

// ── Data fetching ─────────────────────────────────────────────────────────────

async function fetchWioaData(filters: Filters): Promise<{
  summary: WioaSummary | null;
  participants: ParticipantRow[];
  viewMissing: boolean;
}> {
  const db = await requireAdminClient();

  // Beauty/barbershop programs are self-pay — exclude from all WIOA reporting.
  const excludeSlugs = `(${SELF_PAY_SLUGS.join(',')})`;

  // Try the unified view first
  let query = db
    .from('participant_report')
    .select(
      'enrollment_id,full_name,email,program_title,program_category,enrollment_status,' +
        'funding_source,applied_at,completed_at,outcome_type,' +
        'employer_name,job_title,hourly_wage,credential_received',
    )
    .not('program_slug', 'in', excludeSlugs)
    .order('applied_at', { ascending: false })
    .limit(500);

  if (filters.status)     query = query.eq('enrollment_status', filters.status);
  if (filters.funding)    query = query.ilike('funding_source', `${filters.funding}%`);
  if (filters.category)   query = query.eq('program_category', filters.category);
  if (filters.start_date) query = query.gte('applied_at', filters.start_date);
  if (filters.end_date)   query = query.lte('applied_at', filters.end_date);

  const { data: rows, error: viewErr } = await query;

  if (viewErr) {
    // View not applied — fall back to raw program_enrollments
    let fbQuery = db
      .from('program_enrollments')
      .select(
        `id, created_at, completed_at, enrollment_state, status, program_slug,
         profiles!inner ( full_name, email ),
         programs ( title, category )`,
      )
      .not('program_slug', 'in', excludeSlugs)
      .order('created_at', { ascending: false })
      .limit(500);

    if (filters.status)     fbQuery = fbQuery.eq('enrollment_state', filters.status);
    if (filters.start_date) fbQuery = fbQuery.gte('created_at', filters.start_date);
    if (filters.end_date)   fbQuery = fbQuery.lte('created_at', filters.end_date);

    const { data: fallback } = await fbQuery;

    const participants: ParticipantRow[] = (fallback ?? []).map((r: any) => ({
      enrollment_id: r.id,
      full_name: r.profiles?.full_name ?? '—',
      email: r.profiles?.email ?? '—',
      program_title: r.programs?.title ?? r.program_slug ?? '—',
      program_category: r.programs?.category ?? '—',
      enrollment_status: r.enrollment_state ?? r.status ?? '—',
      funding_source: null,
      applied_at: r.created_at,
      completed_at: r.completed_at,
      outcome_type: 'none',
      employer_name: null,
      job_title: null,
      hourly_wage: null,
      credential_received: false,
    }));

    return { summary: null, participants, viewMissing: true };
  }

  // Client-side search filter (full_name / email)
  let filtered = (rows ?? []) as unknown as ParticipantRow[];
  if (filters.search) {
    const q = filters.search.toLowerCase();
    filtered = filtered.filter(
      (r) =>
        r.full_name?.toLowerCase().includes(q) ||
        r.email?.toLowerCase().includes(q) ||
        r.program_title?.toLowerCase().includes(q),
    );
  }

  // Fetch summary metrics via RPC (unfiltered for totals)
  const { data: summaryRows } = await db.rpc('wioa_summary_metrics', {
    p_start_date: filters.start_date ?? null,
    p_end_date:   filters.end_date   ?? null,
    p_program_id: null,
    p_funding:    filters.funding    ?? null,
  });

  return {
    summary: summaryRows?.[0] ?? null,
    participants: filtered,
    viewMissing: false,
  };
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmtDate(iso: string | null): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function fmtWage(w: number | null): string {
  if (w === null || w === undefined) return '—';
  return `$${Number(w).toFixed(2)}/hr`;
}

const STATUS_COLORS: Record<string, string> = {
  completed:   'bg-green-100 text-green-700',
  active:      'bg-blue-100 text-blue-700',
  in_progress: 'bg-blue-100 text-blue-700',
  enrolled:    'bg-blue-100 text-blue-700',
  applied:     'bg-amber-100 text-amber-700',
  approved:    'bg-amber-100 text-amber-700',
  exited:      'bg-slate-100 text-slate-600',
  withdrawn:   'bg-slate-100 text-slate-600',
};

const OUTCOME_LABELS: Record<string, string> = {
  employment_and_credential: 'Job + Credential',
  employment:                'Employment',
  credential:                'Credential',
  none:                      '—',
};

// ── Page ──────────────────────────────────────────────────────────────────────

export default async function WioaReportPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string>>;
}) {
  await requireRole(['admin', 'super_admin', 'staff']);

  const sp = await searchParams;
  const filters: Filters = {
    status:     sp.status     || undefined,
    funding:    sp.funding    || undefined,
    category:   sp.category   || undefined,
    search:     sp.search     || undefined,
    start_date: sp.start_date || undefined,
    end_date:   sp.end_date   || undefined,
  };

  const { summary, participants, viewMissing } = await fetchWioaData(filters);

  const stats = summary
    ? [
        { label: 'Total Participants',  value: summary.total_participants, icon: Users,          color: 'text-brand-blue-600', bg: 'bg-brand-blue-50' },
        { label: 'Active Enrollments',  value: summary.active_enrollments, icon: TrendingUp,     color: 'text-blue-600',       bg: 'bg-blue-50' },
        { label: 'Completed',           value: summary.completed,          icon: GraduationCap,  color: 'text-green-600',      bg: 'bg-green-50' },
        { label: 'Job Placements',      value: summary.job_placements,     icon: Briefcase,      color: 'text-indigo-600',     bg: 'bg-indigo-50' },
        { label: 'Credentials Issued',  value: summary.credentials_issued, icon: GraduationCap,  color: 'text-amber-600',      bg: 'bg-amber-50' },
        {
          label: 'Avg. Hourly Wage',
          value: summary.avg_hourly_wage !== null ? `$${Number(summary.avg_hourly_wage).toFixed(2)}` : '—',
          icon: DollarSign,
          color: 'text-emerald-600',
          bg: 'bg-emerald-50',
        },
      ]
    : [];

  const fundingBreakdown = summary
    ? [
        { label: 'WIOA',              value: summary.wioa_funded },
        { label: 'Workforce Ready Grant', value: summary.wrg_funded },
        { label: 'Self-Pay',          value: summary.self_pay },
        { label: 'Employer Sponsored', value: summary.employer_sponsored },
      ]
    : [];

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 px-6 py-5">
        <nav className="flex items-center gap-1.5 text-xs text-slate-500 mb-3">
          <Link href="/admin/dashboard" className="hover:text-slate-700">Admin</Link>
          <ChevronRight className="w-3 h-3" />
          <Link href="/admin/reports" className="hover:text-slate-700">Reports</Link>
          <ChevronRight className="w-3 h-3" />
          <span className="text-slate-900 font-medium">WIOA Performance</span>
        </nav>
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">WIOA Performance Report</h1>
            <p className="text-sm text-slate-500 mt-1">
              Participant → Program → Enrollment → Outcome. DOL-required metrics.
            </p>
          </div>
          <a
            href="/api/reports/participants/export"
            className="inline-flex items-center gap-2 px-4 py-2 bg-brand-blue-600 text-white text-sm font-semibold rounded-xl hover:bg-brand-blue-700 transition-colors flex-shrink-0"
          >
            <Download className="w-4 h-4" />
            Export CSV
          </a>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-8">

        {/* Filter bar */}
        <form method="GET" className="bg-white border border-slate-200 rounded-2xl shadow-sm p-4">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            <input
              name="search"
              defaultValue={filters.search}
              placeholder="Search name / email…"
              className="col-span-2 sm:col-span-1 lg:col-span-2 border border-slate-200 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-brand-blue-500 focus:border-brand-blue-500"
            />
            <select name="status" defaultValue={filters.status ?? ''} className="border border-slate-200 rounded-xl px-3 py-2 text-sm">
              <option value="">All Statuses</option>
              <option value="applied">Applied</option>
              <option value="approved">Approved</option>
              <option value="enrolled">Enrolled</option>
              <option value="active">Active</option>
              <option value="in_progress">In Progress</option>
              <option value="completed">Completed</option>
              <option value="exited">Exited</option>
            </select>
            <select name="funding" defaultValue={filters.funding ?? ''} className="border border-slate-200 rounded-xl px-3 py-2 text-sm">
              <option value="">All Funding</option>
              <option value="wioa">WIOA</option>
              <option value="workforce_ready">Workforce Ready Grant</option>
              <option value="self_pay">Self-Pay</option>
              <option value="employer">Employer Sponsored</option>
            </select>
            <select name="category" defaultValue={filters.category ?? ''} className="border border-slate-200 rounded-xl px-3 py-2 text-sm">
              <option value="">All Categories</option>
              <option value="Healthcare">Healthcare</option>
              <option value="Skilled Trades">Skilled Trades</option>
              <option value="Technology">Technology</option>
              <option value="Business">Business</option>
              <option value="Apprenticeships">Apprenticeships</option>
            </select>
            <div className="flex gap-2">
              <button type="submit" className="flex-1 bg-slate-900 text-white text-sm font-semibold rounded-xl px-3 py-2 hover:bg-slate-800 transition-colors">
                Filter
              </button>
              <a href="/admin/reports/wioa" className="flex-shrink-0 border border-slate-200 text-slate-600 text-sm font-medium rounded-xl px-3 py-2 hover:bg-slate-50 transition-colors">
                Clear
              </a>
            </div>
          </div>
          {/* Date range */}
          <div className="flex flex-wrap gap-3 mt-3 pt-3 border-t border-slate-100">
            <div className="flex items-center gap-2">
              <label className="text-xs text-slate-500 font-medium">From</label>
              <input type="date" name="start_date" defaultValue={filters.start_date} className="border border-slate-200 rounded-lg px-2 py-1 text-xs" />
            </div>
            <div className="flex items-center gap-2">
              <label className="text-xs text-slate-500 font-medium">To</label>
              <input type="date" name="end_date" defaultValue={filters.end_date} className="border border-slate-200 rounded-lg px-2 py-1 text-xs" />
            </div>
            {Object.values(filters).some(Boolean) && (
              <span className="text-xs text-brand-blue-600 font-medium self-center">
                {participants.length} result{participants.length !== 1 ? 's' : ''} shown
              </span>
            )}
          </div>
        </form>

        {/* Migration warning */}
        {viewMissing && (
          <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-2xl px-5 py-4">
            <AlertCircle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-amber-800">Migration not applied</p>
              <p className="text-xs text-amber-700 mt-1">
                The <code className="font-mono bg-amber-100 px-1 rounded">participant_report</code> view is missing.
                Run migration <code className="font-mono bg-amber-100 px-1 rounded">20260429000001_participant_outcomes_view.sql</code> in
                the Supabase Dashboard SQL Editor. Showing raw enrollment data until then.
              </p>
            </div>
          </div>
        )}

        {/* Summary metrics */}
        {stats.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            {stats.map((s) => {
              const Icon = s.icon;
              return (
                <div key={s.label} className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
                  <div className={`w-9 h-9 rounded-xl ${s.bg} flex items-center justify-center mb-3`}>
                    <Icon className={`w-4 h-4 ${s.color}`} />
                  </div>
                  <p className="text-2xl font-bold text-slate-900 tabular-nums">{s.value}</p>
                  <p className="text-xs text-slate-500 mt-1 font-medium leading-tight">{s.label}</p>
                </div>
              );
            })}
          </div>
        )}

        {/* Funding breakdown */}
        {fundingBreakdown.length > 0 && (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100">
              <h2 className="font-semibold text-slate-900 text-sm">Funding Breakdown</h2>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 divide-x divide-slate-100">
              {fundingBreakdown.map((f) => (
                <div key={f.label} className="px-6 py-5">
                  <p className="text-2xl font-bold text-slate-900 tabular-nums">{f.value}</p>
                  <p className="text-xs text-slate-500 mt-1 font-medium">{f.label}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Modality breakdown */}
        {participants.length > 0 && (() => {
          const counts = { in_person: 0, virtual: 0, hybrid: 0, unknown: 0 };
          for (const p of participants) {
            const m = p.modality_preference;
            if (m === 'in_person' || m === 'virtual' || m === 'hybrid') counts[m]++;
            else counts.unknown++;
          }
          const items = [
            { label: 'In-Person',  value: counts.in_person },
            { label: 'Virtual',    value: counts.virtual },
            { label: 'Hybrid',     value: counts.hybrid },
            { label: 'Not Set',    value: counts.unknown },
          ];
          return (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-100">
                <h2 className="font-semibold text-slate-900 text-sm">
                  Training Modality Breakdown
                  <span className="ml-2 text-xs font-normal text-slate-400">DOL ETA-9173 hybrid apprenticeship reporting</span>
                </h2>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 divide-x divide-slate-100">
                {items.map((item) => (
                  <div key={item.label} className="px-6 py-5">
                    <p className="text-2xl font-bold text-slate-900 tabular-nums">{item.value}</p>
                    <p className="text-xs text-slate-500 mt-1 font-medium">{item.label}</p>
                  </div>
                ))}
              </div>
            </div>
          );
        })()}

        {/* Participant table */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
            <h2 className="font-semibold text-slate-900 text-sm">
              Participants
              <span className="ml-2 text-xs font-normal text-slate-400">
                ({participants.length} shown — use CSV export for full dataset)
              </span>
            </h2>
            <a
              href="/api/reports/participants"
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-brand-blue-600 hover:underline font-medium"
            >
              JSON API ↗
            </a>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100">
                  {[
                    'Name', 'Program', 'Status', 'Funding', 'Modality', 'WorkOne #',
                    'Applied', 'Completed', 'Outcome', 'Employer', 'Wage', 'Credential',
                  ].map((h) => (
                    <th
                      key={h}
                      className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide whitespace-nowrap"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {participants.length === 0 ? (
                  <tr>
                    <td colSpan={12} className="px-4 py-12 text-center text-sm text-slate-400">
                      No participants found.
                    </td>
                  </tr>
                ) : (
                  participants.map((p) => (
                    <tr key={p.enrollment_id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-3 whitespace-nowrap">
                        <p className="font-medium text-slate-900">{p.full_name}</p>
                        <p className="text-xs text-slate-400">{p.email}</p>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <p className="text-slate-700">{p.program_title}</p>
                        <p className="text-xs text-slate-400">{p.program_category}</p>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span
                          className={`inline-flex px-2 py-0.5 rounded-full text-xs font-semibold ${
                            STATUS_COLORS[p.enrollment_status] ?? 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          {p.enrollment_status}
                        </span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-slate-600 text-xs">
                        {p.funding_source ?? '—'}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-xs">
                        {p.modality_preference ? (
                          <span className="inline-flex px-2 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-700 capitalize">
                            {p.modality_preference.replace('_', '-')}
                          </span>
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-slate-500 text-xs font-mono">
                        {p.workone_case_number ?? '—'}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-slate-500 text-xs">
                        {fmtDate(p.applied_at)}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-slate-500 text-xs">
                        {fmtDate(p.completed_at)}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-xs">
                        {OUTCOME_LABELS[p.outcome_type] ?? p.outcome_type}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-slate-600 text-xs">
                        {p.employer_name ?? '—'}
                        {p.job_title && (
                          <p className="text-slate-400">{p.job_title}</p>
                        )}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-slate-600 text-xs tabular-nums">
                        {fmtWage(p.hourly_wage)}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-xs">
                        {p.credential_received ? (
                          <span className="text-green-600 font-semibold">Yes</span>
                        ) : (
                          <span className="text-slate-400">No</span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Footer: filtered export links */}
          <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex flex-wrap gap-3">
            <span className="text-xs text-slate-500 font-medium self-center">Filtered exports:</span>
            {[
              { label: 'WIOA only',    qs: '?funding=wioa' },
              { label: 'Completed',    qs: '?status=completed' },
              { label: 'Placed',       qs: '?status=completed' },
              { label: 'WRG only',     qs: '?funding=workforce_ready_grant' },
            ].map((link) => (
              <a
                key={link.label}
                href={`/api/reports/participants/export${link.qs}`}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-medium text-slate-700 hover:border-brand-blue-400 hover:text-brand-blue-600 transition-colors"
              >
                <Download className="w-3 h-3" />
                {link.label}
              </a>
            ))}
          </div>
        </div>

        {/* PIRL export */}
        <PirlExportPanel />

        {/* Answerable questions callout */}
        <div className="bg-slate-900 rounded-2xl px-6 py-6 text-white">
          <h3 className="font-semibold text-sm mb-3">Questions this report answers instantly</h3>
          <ul className="grid sm:grid-cols-2 gap-2 text-xs text-slate-300">
            {[
              'How many CNA participants completed last quarter with WIOA funding?',
              'What is the average hourly wage for placed participants?',
              'How many participants received a credential vs. employment?',
              'Which programs have the highest completion rate?',
              'How many active WIOA cases have a WorkOne case number?',
              'What is the funding breakdown across all active enrollments?',
            ].map((q) => (
              <li key={q} className="flex items-start gap-2">
                <span className="text-green-400 mt-0.5 flex-shrink-0">→</span>
                {q}
              </li>
            ))}
          </ul>
        </div>

      </div>
    </div>
  );
}
