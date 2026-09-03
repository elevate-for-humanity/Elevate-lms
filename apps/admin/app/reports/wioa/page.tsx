import type { Metadata } from 'next';
import Link from 'next/link';
import { requireRole } from '@/lib/auth/require-role';
import { requireAdminClient } from '@/lib/supabase/admin';
import { AlertCircle, Briefcase, ChevronRight, DollarSign, Download, GraduationCap, TrendingUp, Users } from 'lucide-react';
import PirlExportPanel from '@/components/admin/wioa/PirlExportPanel';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: 'WIOA Performance Report | Admin' };

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

interface ParticipantRow {
  enrollment_id: string;
  full_name: string;
  email: string;
  program_title: string;
  program_category: string;
  enrollment_status: string;
  funding_source: string | null;
  modality_preference: string | null;
  workone_case_number: string | null;
  applied_at: string | null;
  completed_at: string | null;
  outcome_type: string;
  employer_name: string | null;
  job_title: string | null;
  hourly_wage: number | null;
  credential_received: boolean;
}

interface Filters {
  status?: string;
  funding?: string;
  search?: string;
  start_date?: string;
  end_date?: string;
}

const SELF_PAY_SLUGS = [
  'barber', 'barber-2024', 'barber-apprenticeship', 'cosmetology', 'cosmetology-apprenticeship',
  'esthetician', 'esthetician-apprenticeship', 'nail-technician', 'nail-technician-apprenticeship',
  'nail-tech-apprenticeship', 'hair-stylist-nail-tech-apprenticeship', 'hair-stylist-esthetician-apprenticeship',
] as const;

async function fetchWioaData(filters: Filters): Promise<{ summary: WioaSummary | null; participants: ParticipantRow[]; viewMissing: boolean }> {
  const db = await requireAdminClient();
  const excludeSlugs = `(${SELF_PAY_SLUGS.join(',')})`;

  let query = db
    .from('participant_report')
    .select('enrollment_id,full_name,email,program_title,program_category,enrollment_status,funding_source,modality_preference,workone_case_number,applied_at,completed_at,outcome_type,employer_name,job_title,hourly_wage,credential_received')
    .not('program_slug', 'in', excludeSlugs)
    .order('applied_at', { ascending: false })
    .limit(500);
  if (filters.status) query = query.eq('enrollment_status', filters.status);
  if (filters.funding) query = query.ilike('funding_source', `${filters.funding}%`);
  if (filters.start_date) query = query.gte('applied_at', filters.start_date);
  if (filters.end_date) query = query.lte('applied_at', filters.end_date);

  const { data: rows, error: viewError } = await query;
  let participants: ParticipantRow[] = [];
  let viewMissing = false;

  if (!viewError) {
    participants = (rows ?? []) as unknown as ParticipantRow[];
  } else {
    viewMissing = true;
    let fallbackQuery = db
      .from('program_enrollments')
      .select('id,created_at,completed_at,enrollment_state,status,program_slug,funding_source,modality_preference,workone_case_number,profiles!inner(full_name,email),programs(title,category)')
      .not('program_slug', 'in', excludeSlugs)
      .order('created_at', { ascending: false })
      .limit(500);
    if (filters.status) fallbackQuery = fallbackQuery.eq('enrollment_state', filters.status);
    if (filters.start_date) fallbackQuery = fallbackQuery.gte('created_at', filters.start_date);
    if (filters.end_date) fallbackQuery = fallbackQuery.lte('created_at', filters.end_date);
    const { data: fallback } = await fallbackQuery;
    participants = (fallback ?? []).map((row: any) => {
      const profile = Array.isArray(row.profiles) ? row.profiles[0] : row.profiles;
      const program = Array.isArray(row.programs) ? row.programs[0] : row.programs;
      return {
        enrollment_id: row.id,
        full_name: profile?.full_name ?? '—',
        email: profile?.email ?? '—',
        program_title: program?.title ?? row.program_slug ?? '—',
        program_category: program?.category ?? '—',
        enrollment_status: row.enrollment_state ?? row.status ?? '—',
        funding_source: row.funding_source ?? null,
        modality_preference: row.modality_preference ?? null,
        workone_case_number: row.workone_case_number ?? null,
        applied_at: row.created_at ?? null,
        completed_at: row.completed_at ?? null,
        outcome_type: 'none',
        employer_name: null,
        job_title: null,
        hourly_wage: null,
        credential_received: false,
      };
    });
  }

  if (filters.search) {
    const needle = filters.search.toLowerCase();
    participants = participants.filter((row) => [row.full_name, row.email, row.program_title, row.workone_case_number ?? ''].some((value) => value.toLowerCase().includes(needle)));
  }

  const { data: summaryRows } = await db.rpc('wioa_summary_metrics', {
    p_start_date: filters.start_date ?? null,
    p_end_date: filters.end_date ?? null,
    p_program_id: null,
    p_funding: filters.funding ?? null,
  });
  const summary = Array.isArray(summaryRows) && summaryRows.length ? (summaryRows[0] as WioaSummary) : null;
  return { summary, participants, viewMissing };
}

function fmtDate(value: string | null) {
  return value ? new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—';
}

export default async function WioaReportPage({ searchParams }: { searchParams: Promise<Record<string, string>> }) {
  await requireRole(['admin', 'staff']);
  const sp = await searchParams;
  const filters: Filters = {
    status: sp.status || undefined,
    funding: sp.funding || undefined,
    search: sp.search || undefined,
    start_date: sp.start_date || undefined,
    end_date: sp.end_date || undefined,
  };
  const { summary, participants, viewMissing } = await fetchWioaData(filters);

  const modalityCounts = participants.reduce<Record<string, number>>((counts, row) => {
    const key = row.modality_preference || 'not_set';
    counts[key] = (counts[key] || 0) + 1;
    return counts;
  }, {});

  const stats = summary ? [
    { label: 'Participants', value: summary.total_participants, icon: Users },
    { label: 'Active', value: summary.active_enrollments, icon: TrendingUp },
    { label: 'Completed', value: summary.completed, icon: GraduationCap },
    { label: 'Placements', value: summary.job_placements, icon: Briefcase },
    { label: 'Credentials', value: summary.credentials_issued, icon: GraduationCap },
    { label: 'Avg. wage', value: summary.avg_hourly_wage == null ? '—' : `$${Number(summary.avg_hourly_wage).toFixed(2)}`, icon: DollarSign },
  ] : [];

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white px-6 py-5">
        <nav className="mb-3 flex items-center gap-1.5 text-xs text-slate-500"><Link href="/dashboard">Admin</Link><ChevronRight className="h-3 w-3" /><Link href="/reports">Reports</Link><ChevronRight className="h-3 w-3" /><span className="font-bold text-slate-900">WIOA</span></nav>
        <div className="flex flex-wrap items-start justify-between gap-4"><div><h1 className="text-2xl font-black text-slate-950">WIOA Performance Report</h1><p className="mt-1 text-sm text-slate-600">Participant, funding, completion, credential and employment outcomes.</p></div><a href="/api/reports/participants/export" className="inline-flex items-center gap-2 rounded-xl bg-brand-blue-700 px-4 py-2 text-sm font-bold text-white"><Download className="h-4 w-4" />Export CSV</a></div>
      </header>

      <main className="mx-auto max-w-7xl space-y-6 px-4 py-8 sm:px-6">
        <form method="GET" className="grid gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:grid-cols-5">
          <input name="search" defaultValue={filters.search} placeholder="Name, email, WorkOne #" className="rounded-xl border border-slate-300 px-3 py-2 text-sm sm:col-span-2" />
          <select name="status" defaultValue={filters.status ?? ''} className="rounded-xl border border-slate-300 px-3 py-2 text-sm"><option value="">All statuses</option><option value="active">Active</option><option value="enrolled">Enrolled</option><option value="completed">Completed</option><option value="exited">Exited</option></select>
          <select name="funding" defaultValue={filters.funding ?? ''} className="rounded-xl border border-slate-300 px-3 py-2 text-sm"><option value="">All funding</option><option value="wioa">WIOA</option><option value="workforce_ready">Workforce Ready Grant</option><option value="self_pay">Self Pay</option><option value="employer">Employer</option></select>
          <button type="submit" className="rounded-xl bg-slate-950 px-4 py-2 text-sm font-bold text-white">Filter</button>
        </form>

        {viewMissing && <div className="flex gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900"><AlertCircle className="h-5 w-5 shrink-0" /><p>The participant reporting view is unavailable. This page is using live enrollment records as a fallback.</p></div>}

        {stats.length > 0 && <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-6">{stats.map(({ label, value, icon: Icon }) => <div key={label} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm"><Icon className="mb-3 h-5 w-5 text-brand-blue-700" /><p className="text-2xl font-black text-slate-950">{value}</p><p className="text-xs font-bold text-slate-500">{label}</p></div>)}</div>}

        <div className="grid gap-4 lg:grid-cols-2">
          <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"><h2 className="font-black text-slate-950">Training modality</h2><div className="mt-4 grid grid-cols-2 gap-3">{Object.entries(modalityCounts).map(([key, value]) => <div key={key} className="rounded-lg bg-slate-50 p-3"><p className="text-xl font-black text-slate-950">{value}</p><p className="text-xs font-bold capitalize text-slate-500">{key.replaceAll('_',' ')}</p></div>)}</div></section>
          <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"><h2 className="font-black text-slate-950">PIRL export</h2><p className="mb-4 mt-1 text-sm text-slate-600">Generate the workforce reporting export from current participant records.</p><PirlExportPanel /></section>
        </div>

        <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-100 px-5 py-4"><h2 className="font-black text-slate-950">Participants <span className="text-sm font-medium text-slate-500">({participants.length})</span></h2></div>
          <div className="overflow-x-auto"><table className="min-w-full text-sm"><thead className="bg-slate-50"><tr>{['Name','Program','Status','Funding','Modality','WorkOne #','Applied','Completed','Employer','Wage','Credential'].map((label) => <th key={label} className="whitespace-nowrap px-4 py-3 text-left text-xs font-black uppercase tracking-wide text-slate-500">{label}</th>)}</tr></thead><tbody className="divide-y divide-slate-100">
            {participants.length === 0 ? <tr><td colSpan={11} className="px-4 py-10 text-center text-slate-500">No participants match this report.</td></tr> : participants.map((row) => <tr key={row.enrollment_id} className="hover:bg-slate-50"><td className="whitespace-nowrap px-4 py-3"><p className="font-bold text-slate-900">{row.full_name}</p><p className="text-xs text-slate-500">{row.email}</p></td><td className="whitespace-nowrap px-4 py-3"><p className="text-slate-800">{row.program_title}</p><p className="text-xs text-slate-500">{row.program_category}</p></td><td className="px-4 py-3 capitalize text-slate-700">{row.enrollment_status.replaceAll('_',' ')}</td><td className="px-4 py-3 text-slate-700">{row.funding_source || '—'}</td><td className="px-4 py-3 capitalize text-slate-700">{row.modality_preference?.replaceAll('_',' ') || '—'}</td><td className="px-4 py-3 font-mono text-xs text-slate-700">{row.workone_case_number || '—'}</td><td className="px-4 py-3 text-slate-600">{fmtDate(row.applied_at)}</td><td className="px-4 py-3 text-slate-600">{fmtDate(row.completed_at)}</td><td className="px-4 py-3 text-slate-700">{row.employer_name || '—'}{row.job_title && <p className="text-xs text-slate-500">{row.job_title}</p>}</td><td className="px-4 py-3 text-slate-700">{row.hourly_wage == null ? '—' : `$${Number(row.hourly_wage).toFixed(2)}/hr`}</td><td className="px-4 py-3 text-slate-700">{row.credential_received ? 'Yes' : 'No'}</td></tr>)}
          </tbody></table></div>
        </section>
      </main>
    </div>
  );
}
