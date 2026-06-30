import { Metadata } from 'next';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import Link from 'next/link';
import { BarChart3, Users, Briefcase, Award, TrendingUp, AlertCircle, Calendar, ArrowRight, Building2, Star } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { PLATFORM_DEFAULTS } from '@/lib/config/platform-config';

export const metadata: Metadata = {
  title: `Outcomes & Reporting Standards | ${PLATFORM_DEFAULTS.orgName}`,
  description: 'How we measure and report student outcomes, job placement rates, and program effectiveness.',
  alternates: { canonical: 'https://www.elevateforhumanity.org/outcomes' },
};

export const revalidate = 3600;

async function getEmployerPartners() {
  try {
    const supabase = await createClient();
    const { data } = await supabase
      .from('employer_partners')
      .select('id, name, logo_url, industry, placements_count')
      .eq('featured', true)
      .order('placements_count', { ascending: false })
      .limit(12);
    return data ?? [];
  } catch {
    return [];
  }
}

async function getStats() {
  try {
    const supabase = await createClient();
    const [enrollRes, completedRes, certsRes, pccRes, programsRes, placedRes] = await Promise.all([
      supabase.from('program_enrollments').select('id', { count: 'exact', head: true }),
      supabase.from('program_enrollments').select('id', { count: 'exact', head: true }).eq('status', 'completed'),
      supabase.from('certificates').select('id', { count: 'exact', head: true }),
      supabase.from('program_completion_certificates').select('id', { count: 'exact', head: true }),
      supabase.from('programs').select('id', { count: 'exact', head: true }).eq('is_active', true).eq('published', true),
      supabase.from('employment_outcomes').select('id', { count: 'exact', head: true }).eq('outcome_type', 'employed'),
    ]);

    const enrolled = enrollRes.count ?? 0;
    const completed = completedRes.count ?? 0;
    const certs = (certsRes.count ?? 0) + (pccRes.count ?? 0);
    const programs = programsRes.count ?? 0;
    const placed = placedRes.count ?? 0;

    const { data: wageData } = await supabase
      .from('employment_outcomes')
      .select('hourly_wage')
      .not('hourly_wage', 'is', null)
      .eq('outcome_type', 'employed');

    const wages = (wageData ?? []).map((r: any) => r.hourly_wage).filter(Boolean);
    const avgWage = wages.length > 0
      ? `$${(wages.reduce((a: number, b: number) => a + b, 0) / wages.length).toFixed(2)}/hr`
      : null;

    return { enrolled, completed, certs, programs, placed, avgWage };
  } catch {
    return null;
  }
}

export default async function OutcomesPage() {
  const [stats, employers] = await Promise.all([getStats(), getEmployerPartners()]);

  const statCards = stats ? [
    { label: 'Total Enrolled', value: stats.enrolled > 0 ? stats.enrolled.toLocaleString() : '—', note: 'Live · program_enrollments' },
    { label: 'Completed Programs', value: stats.completed > 0 ? stats.completed.toLocaleString() : '—', note: 'Live · status = completed' },
    { label: 'Credentials Issued', value: stats.certs > 0 ? stats.certs.toLocaleString() : '—', note: 'Live · certificates + PCC' },
    { label: 'Active Programs', value: stats.programs > 0 ? stats.programs.toLocaleString() : '—', note: 'Live · published programs' },
    { label: 'Placed in Employment', value: stats.placed > 0 ? stats.placed.toLocaleString() : '—', note: 'Verified outcomes' },
    ...(stats.avgWage ? [{ label: 'Avg Starting Wage', value: stats.avgWage, note: 'Self-reported outcomes' }] : []),
  ] : [];

  return (
    <div className="min-h-screen bg-white">

      {/* Breadcrumb */}
      <div className="bg-white border-b">
        <div className="max-w-4xl mx-auto px-4 py-3">
          <Breadcrumbs items={[{ label: 'Outcomes & Reporting Standards' }]} />
        </div>
      </div>

      {/* Hero */}
      <section className="bg-slate-900 text-white py-14 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-2 text-brand-red-400 text-xs font-bold uppercase tracking-widest mb-3">
            <BarChart3 className="w-4 h-4" /> Transparency &amp; Accountability
          </div>
          <h1 className="text-4xl font-extrabold mb-4 leading-tight">Outcomes &amp; Reporting Standards</h1>
          <p className="text-slate-300 text-lg max-w-2xl">How we collect, calculate, and publish student outcomes.</p>
        </div>
      </section>

      {/* Commitment */}
      <section className="bg-brand-blue-50 border-b border-brand-blue-100 py-6 px-4">
        <div className="max-w-4xl mx-auto flex items-start gap-4">
          <Award aria-label="award" className="w-5 h-5 text-brand-blue-600 shrink-0 mt-0.5" />
          <p className="text-slate-700 text-sm leading-relaxed">
            {PLATFORM_DEFAULTS.orgName} is committed to honest, verifiable reporting of student outcomes. Every metric on this page maps to a specific database source or survey instrument. See our{' '}
            <Link href="/impact/methodology" className="text-brand-blue-600 underline font-medium">Impact Methodology</Link>{' '}
            for exact definitions and formulas.
          </p>
        </div>
      </section>

      <div className="max-w-4xl mx-auto px-4 py-14 space-y-14">

        {/* Live dashboard */}
        {statCards.length > 0 && (
          <section>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-slate-900">Live Outcomes Dashboard</h2>
              <span className="text-xs text-slate-400 font-medium">Refreshed hourly</span>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {statCards.map((item) => (
                <div key={item.label} className="border border-slate-200 rounded-xl p-5">
                  <p className="text-3xl font-extrabold text-slate-900 mb-1">{item.value}</p>
                  <p className="text-sm font-semibold text-slate-700 mb-1">{item.label}</p>
                  <p className="text-xs text-slate-400 font-mono">{item.note}</p>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Employer partners */}
        {employers.length > 0 && (
          <section>
            <div className="flex items-center gap-2 mb-6">
              <Building2 className="w-5 h-5 text-brand-blue-600" />
              <h2 className="text-2xl font-bold text-slate-900">Employer Partners</h2>
            </div>
            <p className="text-slate-600 text-sm mb-6">
              Our graduates are hired by employers across Indiana and the Midwest. These organizations have partnered with Elevate for Humanity to hire our credentialed graduates.
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {employers.map((e: any) => (
                <div key={e.id} className="border border-slate-200 rounded-xl p-4 flex flex-col items-center gap-2 text-center">
                  {e.logo_url ? (
                    /* IMAGE-CONTRACT: allow raw img because employer logos come from dynamic external partner URLs */
                    <img src={e.logo_url} alt={e.name} className="h-10 object-contain" />
                  ) : (
                    <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center">
                      <Building2 className="w-5 h-5 text-slate-400" />
                    </div>
                  )}
                  <p className="text-sm font-semibold text-slate-800 leading-tight">{e.name}</p>
                  {e.industry && <p className="text-xs text-slate-400">{e.industry}</p>}
                  {e.placements_count > 0 && (
                    <p className="text-xs text-brand-blue-600 font-semibold">{e.placements_count} placement{e.placements_count !== 1 ? 's' : ''}</p>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Placement metrics strip */}
        {stats && stats.placed > 0 && (
          <section className="bg-slate-900 rounded-2xl p-8 text-white">
            <div className="flex items-center gap-2 mb-6">
              <Star className="w-5 h-5 text-amber-400" />
              <h2 className="text-xl font-bold">Placement Outcomes</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              <div>
                <p className="text-4xl font-extrabold text-emerald-400">{stats.placed.toLocaleString()}</p>
                <p className="text-slate-300 text-sm mt-1">Verified job placements</p>
              </div>
              {stats.avgWage && (
                <div>
                  <p className="text-4xl font-extrabold text-brand-blue-400">{stats.avgWage}</p>
                  <p className="text-slate-300 text-sm mt-1">Average starting wage</p>
                </div>
              )}
              {stats.completed > 0 && stats.placed > 0 && (
                <div>
                  <p className="text-4xl font-extrabold text-amber-400">
                    {Math.round((stats.placed / stats.completed) * 100)}%
                  </p>
                  <p className="text-slate-300 text-sm mt-1">Placement rate (completers)</p>
                </div>
              )}
            </div>
            <p className="text-slate-500 text-xs mt-6">
              Based on verified employment_outcomes records. Self-reported data excluded from placement rate calculation.
            </p>
          </section>
        )}

        {/* What we track */}
        <section>
          <h2 className="text-2xl font-bold text-slate-900 mb-6">What We Track</h2>
          <div className="grid sm:grid-cols-2 gap-5">
            <div className="bg-slate-50 rounded-xl p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-9 h-9 bg-brand-green-500 rounded-lg flex items-center justify-center">
                  <Users className="w-4 h-4 text-white" />
                </div>
                <h3 className="font-bold text-slate-900 text-sm">Enrollment &amp; Completion</h3>
              </div>
              <ul className="space-y-2">
                {['Students enrolled per program', 'Program completion rates', 'Time to completion', 'Credential attainment'].map((item) => (
                  <li key={item} className="flex items-start gap-2 text-sm text-slate-700">
                    <span className="w-1.5 h-1.5 rounded-full bg-brand-green-500 mt-2 shrink-0" /> {item}
                  </li>
                ))}
              </ul>
            </div>
            <div className="bg-slate-50 rounded-xl p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-9 h-9 bg-brand-blue-600 rounded-lg flex items-center justify-center">
                  <Briefcase className="w-4 h-4 text-white" />
                </div>
                <h3 className="font-bold text-slate-900 text-sm">Employment Outcomes</h3>
              </div>
              <ul className="space-y-2">
                {['Employment at 30, 90, 180 days post-completion', 'Employment in field of training', 'Starting wage (when reported)', 'Employer partner placements'].map((item) => (
                  <li key={item} className="flex items-start gap-2 text-sm text-slate-700">
                    <span className="w-1.5 h-1.5 rounded-full bg-brand-blue-500 mt-2 shrink-0" /> {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        {/* Formulas */}
        <section>
          <h2 className="text-2xl font-bold text-slate-900 mb-6">Calculation Formulas</h2>
          <div className="space-y-4">
            <div className="border border-slate-200 rounded-xl overflow-hidden">
              <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-brand-blue-600" />
                <p className="font-bold text-slate-900 text-sm">Job Placement Rate</p>
              </div>
              <div className="px-5 py-4">
                <div className="bg-slate-900 rounded-lg px-4 py-3 mb-3">
                  <p className="font-mono text-sm text-brand-green-400">
                    Placement Rate = (Graduates Employed within 90 days) ÷ (Total Graduates − Exclusions) × 100
                  </p>
                </div>
                <p className="text-xs text-slate-500">
                  <strong>Exclusions:</strong> Students continuing education, entering military service, or otherwise unavailable — excluded per WIOA reporting standards.
                </p>
              </div>
            </div>

            <div className="border border-slate-200 rounded-xl overflow-hidden">
              <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-brand-blue-600" />
                <p className="font-bold text-slate-900 text-sm">Completion Rate</p>
              </div>
              <div className="px-5 py-4">
                <div className="bg-slate-900 rounded-lg px-4 py-3">
                  <p className="font-mono text-sm text-brand-green-400">
                    Completion Rate = (Students Completing) ÷ (Students Enrolled − Early Withdrawals within 14 days) × 100
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Limitations */}
        <section>
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-6">
            <div className="flex items-start gap-3 mb-4">
              <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <h2 className="text-lg font-bold text-amber-900">Limitations &amp; Caveats</h2>
            </div>
            <ul className="space-y-3 text-amber-800 text-sm">
              {[
                'Response rates vary — not all graduates respond to follow-up surveys.',
                'Some employment data is self-reported and not independently verified.',
                'Outcomes vary by program, cohort, and local labor market conditions.',
                'Published statistics reflect historical performance and do not guarantee future results.',
              ].map((item) => (
                <li key={item} className="flex items-start gap-2">
                  <span className="font-bold shrink-0">•</span> {item}
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* Reporting schedule */}
        <section>
          <div className="flex items-start gap-4 border border-slate-200 rounded-xl p-6">
            <Calendar className="w-5 h-5 text-brand-blue-600 shrink-0 mt-0.5" />
            <div>
              <h2 className="font-bold text-slate-900 mb-2">Reporting Schedule</h2>
              <p className="text-slate-600 text-sm leading-relaxed">
                Live dashboard figures refresh hourly from the LMS database. Outcomes data is compiled quarterly and published annually. The most recent complete data reflects the prior program year (July 1 – June 30).
              </p>
            </div>
          </div>
        </section>

        {/* Methodology link */}
        <section className="border-t border-slate-100 pt-8">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-bold text-slate-900 mb-1">Full Methodology</p>
              <p className="text-slate-500 text-sm">Exact metric definitions, data sources, and counting rules.</p>
            </div>
            <Link href="/impact/methodology" className="inline-flex items-center gap-2 px-5 py-2.5 bg-slate-900 text-white font-semibold rounded-lg hover:bg-slate-800 transition text-sm shrink-0">
              Read Methodology <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </section>

      </div>

      {/* CTA */}
      <section className="bg-brand-blue-700 text-white py-12 px-4">
        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-6">
          <div>
            <h2 className="text-xl font-bold mb-1">Ready to Start Your Career Journey?</h2>
            <p className="text-brand-blue-200 text-sm">Apply today and work with an advisor to find the right path.</p>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <Link href="/apply" className="inline-flex items-center gap-2 px-5 py-2.5 bg-white text-brand-blue-700 font-bold rounded-lg hover:bg-brand-blue-50 transition text-sm">
              Apply Now <ArrowRight className="w-4 h-4" />
            </Link>
            <Link href="/programs" className="inline-flex items-center gap-2 px-5 py-2.5 border border-white/30 text-slate-900 font-semibold rounded-lg hover:bg-white/10 transition text-sm">
              View Programs
            </Link>
          </div>
        </div>
      </section>

    </div>
  );
}
