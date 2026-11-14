import { Metadata } from 'next';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import Link from 'next/link';
import { BarChart3, Users, Briefcase, Award, TrendingUp, AlertCircle, Calendar } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';

export const metadata: Metadata = {
  title: 'Outcomes & Methodology | Elevate for Humanity',
  description: 'How we measure and report student outcomes, job placement rates, and program effectiveness.',
  alternates: { canonical: 'https://www.elevateforhumanity.org/outcomes' },
};

export const revalidate = 3600;

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

    // Average wage from employment_outcomes
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
  const stats = await getStats();

  const dashboard = stats ? [
    { label: 'Total Enrolled', value: stats.enrolled > 0 ? stats.enrolled.toLocaleString() : '—', note: 'Live data' },
    { label: 'Completed Programs', value: stats.completed > 0 ? stats.completed.toLocaleString() : '—', note: 'Live data' },
    { label: 'Credentials Issued', value: stats.certs > 0 ? stats.certs.toLocaleString() : '—', note: 'Live data' },
    { label: 'Active Programs', value: stats.programs > 0 ? stats.programs.toLocaleString() : '—', note: 'Live data' },
    { label: 'Placed in Employment', value: stats.placed > 0 ? stats.placed.toLocaleString() : '—', note: 'Verified outcomes' },
    ...(stats.avgWage ? [{ label: 'Average Starting Wage', value: stats.avgWage, note: 'Reported outcomes' }] : []),
  ] : [];

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-7xl mx-auto px-4 py-4">
        <Breadcrumbs items={[{ label: 'Outcomes' }]} />
      </div>

      <section className="bg-slate-900 text-white py-16">
        <div className="max-w-4xl mx-auto px-6">
          <div className="flex items-center gap-2 text-blue-400 text-sm font-medium mb-4">
            <BarChart3 className="w-5 h-5" /> Transparency & Accountability
          </div>
          <h1 className="text-4xl font-bold mb-4">Outcomes & Methodology</h1>
          <p className="text-xl text-slate-300">How we measure, track, and report student outcomes</p>
        </div>
      </section>

      <div className="max-w-4xl mx-auto px-6 py-12">

        <section className="mb-12">
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
            <h2 className="text-xl font-bold text-blue-900 mb-3">Our Commitment to Transparency</h2>
            <p className="text-blue-800">
              Elevate for Humanity is committed to honest, verifiable reporting of student outcomes.
              This page explains how we collect data, calculate metrics, and what our numbers actually mean.
            </p>
          </div>
        </section>

        {dashboard.length > 0 && (
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-slate-900 mb-6 pb-2 border-b-2 border-blue-500">
              Live Outcomes Dashboard
            </h2>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {dashboard.map((item) => (
                <div key={item.label} className="bg-white border rounded-xl p-5">
                  <p className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-2">{item.note}</p>
                  <p className="text-3xl font-extrabold text-slate-900 mb-1">{item.value}</p>
                  <p className="text-sm text-slate-700">{item.label}</p>
                </div>
              ))}
            </div>
          </section>
        )}

        <section className="mb-12">
          <h2 className="text-2xl font-bold text-slate-900 mb-6 pb-2 border-b-2 border-blue-500">What We Track</h2>
          <div className="grid md:grid-cols-2 gap-6">
            {[
              { icon: Users, color: 'bg-green-500', title: 'Enrollment & Completion', items: ['Students enrolled per program','Program completion rates','Time to completion','Credential attainment'] },
              { icon: Briefcase, color: 'bg-blue-500', title: 'Employment Outcomes', items: ['Employment at 30, 90, 180 days post-completion','Employment in field of training','Starting wage (when reported)','Employer partner placements'] },
            ].map(({ icon: Icon, color, title, items }) => (
              <div key={title} className="bg-slate-50 rounded-xl p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className={`w-10 h-10 ${color} rounded-lg flex items-center justify-center`}>
                    <Icon className="w-5 h-5 text-white" />
                  </div>
                  <h3 className="font-bold text-slate-900">{title}</h3>
                </div>
                <ul className="space-y-2">
                  {items.map((item) => (
                    <li key={item} className="flex items-start gap-2 text-sm text-slate-700">
                      <Award className="w-4 h-4 text-green-500 mt-0.5 shrink-0" /> {item}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>

        <section className="mb-12">
          <h2 className="text-2xl font-bold text-slate-900 mb-6 pb-2 border-b-2 border-blue-500">How We Calculate Outcomes</h2>
          <div className="space-y-6">
            <div className="border rounded-xl p-6">
              <h3 className="font-bold text-slate-900 mb-3 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-blue-600" /> Job Placement Rate
              </h3>
              <div className="bg-slate-50 rounded-lg p-4 mb-3">
                <p className="font-mono text-sm text-slate-700">
                  Placement Rate = (Graduates Employed within 90 days) ÷ (Total Graduates − Exclusions) × 100
                </p>
              </div>
              <p className="text-slate-700 text-sm">
                <strong>Exclusions:</strong> Students continuing education, entering military service, or otherwise unavailable are excluded per WIOA reporting standards.
              </p>
            </div>
            <div className="border rounded-xl p-6">
              <h3 className="font-bold text-slate-900 mb-3 flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-blue-600" /> Completion Rate
              </h3>
              <div className="bg-slate-50 rounded-lg p-4">
                <p className="font-mono text-sm text-slate-700">
                  Completion Rate = (Students Completing) ÷ (Students Enrolled − Early Withdrawals within 14 days) × 100
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="mb-12">
          <h2 className="text-2xl font-bold text-slate-900 mb-6 pb-2 border-b-2 border-orange-500">Limitations & Caveats</h2>
          <div className="bg-orange-50 border border-orange-200 rounded-xl p-6">
            <div className="flex items-start gap-3 mb-4">
              <AlertCircle className="w-6 h-6 text-orange-600 shrink-0" />
              <h3 className="font-bold text-orange-900">Important Context</h3>
            </div>
            <ul className="space-y-3 text-orange-800 text-sm">
              {[
                'Response rates vary — not all graduates respond to follow-up surveys.',
                'Some employment data is self-reported and not independently verified.',
                'Outcomes vary by program, cohort, and local labor market conditions.',
                'Published statistics reflect historical performance and do not guarantee future results.',
              ].map((item) => (
                <li key={item} className="flex items-start gap-2">
                  <span className="font-bold">•</span> <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section className="mb-12">
          <div className="flex items-start gap-4 p-6 bg-slate-50 rounded-xl">
            <Calendar className="w-6 h-6 text-blue-600 shrink-0" />
            <div>
              <h2 className="font-bold text-slate-900 mb-2">Reporting Schedule</h2>
              <p className="text-slate-700 text-sm">
                Outcomes data is compiled quarterly and published annually. The most recent complete data reflects the prior program year (July 1 – June 30).
              </p>
            </div>
          </div>
        </section>

        <section className="bg-blue-600 text-white rounded-2xl p-8 text-center">
          <h2 className="text-2xl font-bold mb-4">Ready to Start Your Career Journey?</h2>
          <p className="text-blue-100 mb-6">Apply today and work with an advisor to find the right path.</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/apply" className="bg-white text-blue-600 px-8 py-3 rounded-lg font-semibold hover:bg-blue-50 transition">Apply Now</Link>
            <Link href="/programs" className="bg-blue-500 text-white px-8 py-3 rounded-lg font-semibold hover:bg-blue-400 transition">View Programs</Link>
          </div>
        </section>
      </div>
    </div>
  );
}
