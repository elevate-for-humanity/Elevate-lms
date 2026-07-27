import { Metadata } from 'next';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { createClient } from '@/lib/supabase/server';

export const metadata: Metadata = {
  title: 'Metrics | Elevate For Humanity',
  description: 'Live enrollment, completion, and certification metrics for Elevate for Humanity workforce training programs.',
  alternates: {
    canonical: 'https://www.elevateforhumanity.org/metrics',
  },
};

import { ComplianceBar } from '@/components/ComplianceBar';

export const dynamic = 'force-dynamic';

export default async function MetricsPage() {
  const supabase = await createClient();

  if (!supabase) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-slate-900 mb-4">Service Unavailable</h1>
          <p className="text-slate-600">Please try again later.</p>
        </div>
      </div>
    );
  }

  // Live counts — no hardcoded metrics on public pages
  const [enrolledRes, completedRes, certsRes, employerRes, programsRes] = await Promise.all([
    supabase.from('program_enrollments').select('id', { count: 'exact', head: true }),
    supabase
      .from('program_enrollments')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'completed'),
    supabase.from('program_completion_certificates').select('id', { count: 'exact', head: true }),
    supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('role', 'employer'),
    supabase
      .from('programs')
      .select('id', { count: 'exact', head: true })
      .eq('published', true)
      .neq('status', 'archived'),
  ]);

  const totalEnrolled = enrolledRes.count ?? 0;
  const totalCompleted = completedRes.count ?? 0;
  const totalCerts = certsRes.count ?? 0;
  const totalEmployers = employerRes.count ?? 0;
  const totalPrograms = programsRes.count ?? 0;

  return (
    <div className="bg-white">
      <div className="max-w-7xl mx-auto px-4 py-4">
        <Breadcrumbs items={[{ label: 'Metrics' }]} />
      </div>
      <ComplianceBar />

      <div className="max-w-4xl mx-auto px-6 py-16">
        <h1 className="text-4xl font-bold mb-4 text-black">Impact Metrics</h1>
        <p className="text-lg text-black mb-12">
          Real outcomes from our workforce development platform
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-8 text-center">
            <div className="text-5xl font-bold text-blue-600 mb-2">
              {totalEnrolled > 0 ? `${totalEnrolled.toLocaleString()}+` : '—'}
            </div>
            <div className="text-lg text-black">Enrolled Learners</div>
          </div>

          <div className="bg-green-50 border border-green-200 rounded-xl p-8 text-center">
            <div className="text-5xl font-bold text-green-600 mb-2">
              {totalCerts > 0 ? `${totalCerts.toLocaleString()}+` : '—'}
            </div>
            <div className="text-lg text-black">Credentials Issued</div>
          </div>

          <div className="bg-purple-50 border border-purple-200 rounded-xl p-8 text-center">
            <div className="text-5xl font-bold text-purple-600 mb-2">
              {totalEmployers > 0 ? `${totalEmployers}+` : '—'}
            </div>
            <div className="text-lg text-black">Employer Partners</div>
          </div>

          <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-8 text-center">
            <div className="text-5xl font-bold text-indigo-600 mb-2">
              {totalPrograms > 0 ? `${totalPrograms}+` : '—'}
            </div>
            <div className="text-lg text-black">Active Programs</div>
          </div>
        </div>

        <div className="bg-slate-50 border border-slate-200 rounded-xl p-8 mb-8">
          <h2 className="text-2xl font-bold mb-6 text-black">Workforce Funding</h2>
          <div className="space-y-4 text-black">
            <div className="flex items-start gap-3">
              <span className="text-green-600 font-bold">•</span>
              <div>
                <strong>WIOA Eligible:</strong> All programs qualify for Workforce Innovation and
                Opportunity Act funding
              </div>
            </div>
            <div className="flex items-start gap-3">
              <span className="text-green-600 font-bold">•</span>
              <div>
                <strong>WRG Approved:</strong> Workforce Ready Grant eligible in Indiana
              </div>
            </div>
            <div className="flex items-start gap-3">
              <span className="text-green-600 font-bold">•</span>
              <div>
                <strong>SNAP E&T:</strong> Supplemental Nutrition Assistance Program Employment &
                Training approved
              </div>
            </div>
          </div>
        </div>

        <div className="bg-slate-50 border border-slate-200 rounded-xl p-8 mb-8">
          <h2 className="text-2xl font-bold mb-6 text-black">Platform Usage</h2>
          <div className="grid md:grid-cols-2 gap-6 text-black">
            <div>
              <div className="text-3xl font-bold text-blue-600 mb-2">6</div>
              <div>Partner LMS Integrations</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-blue-600 mb-2">5</div>
              <div>AI Systems Deployed</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-blue-600 mb-2">100%</div>
              <div>Mobile App Completion</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-blue-600 mb-2">24/7</div>
              <div>AI Tutor Availability</div>
            </div>
          </div>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-xl p-8">
          <h2 className="text-2xl font-bold mb-4 text-black">Compliance & Reporting</h2>
          <div className="space-y-3 text-black">
            <div className="flex items-start gap-3">
              <span className="text-blue-600 font-bold">•</span>
              <span>RAPIDS apprenticeship tracking integrated</span>
            </div>
            <div className="flex items-start gap-3">
              <span className="text-blue-600 font-bold">•</span>
              <span>ETPL compliance reporting automated</span>
            </div>
            <div className="flex items-start gap-3">
              <span className="text-blue-600 font-bold">•</span>
              <span>Workforce board dashboards available</span>
            </div>
            <div className="flex items-start gap-3">
              <span className="text-blue-600 font-bold">•</span>
              <span>Real-time outcome tracking</span>
            </div>
          </div>
        </div>

        <p className="text-sm mt-8 text-black text-center">
          Metrics updated quarterly. Full documentation available upon request for workforce
          agencies and funding partners.
        </p>
      </div>
    </div>
  );
}
