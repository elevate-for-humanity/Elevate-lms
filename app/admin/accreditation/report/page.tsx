import { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { Download, Calendar, AlertTriangle, Clock, ArrowLeft, CheckCircle2, Shield, FileText } from 'lucide-react';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Accreditation Report | Admin',
  description: 'Accreditation compliance report with live data.',
  robots: { index: false, follow: false },
};

async function getAccreditationData(supabase: any) {
  const [programs, courses, certificates, enrollments, completions] = await Promise.all([
    supabase.from('programs').select('id, name, status, created_at').eq('status', 'active'),
    supabase.from('training_courses').select('id, course_name, is_active').eq('is_active', true),
    supabase.from('certificates').select('id, created_at, status'),
    supabase.from('program_enrollments').select('id, status, created_at'),
    supabase.from('completions').select('id, created_at'),
  ]);

  const totalPrograms = programs.data?.length ?? 0;
  const totalCourses = courses.data?.length ?? 0;
  const totalCerts = certificates.data?.length ?? 0;
  const totalEnrollments = enrollments.data?.length ?? 0;
  const totalCompletions = completions.data?.length ?? 0;
  const completionRate = totalEnrollments > 0 ? Math.round((totalCompletions / totalEnrollments) * 100) : 0;

  return {
    programs: programs.data ?? [],
    totalPrograms,
    totalCourses,
    totalCerts,
    totalEnrollments,
    totalCompletions,
    completionRate,
  };
}

export default async function AccreditationReportPage() {
  const supabase = await createClient();
  if (!supabase) {
    return <div className="p-8 text-center text-gray-600">Database unavailable.</div>;
  }

  const data = await getAccreditationData(supabase);
  const now = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

  const metrics = [
    { label: 'Active Programs', value: data.totalPrograms, icon: Shield, color: 'brand-blue' },
    { label: 'Active Courses', value: data.totalCourses, icon: FileText, color: 'emerald' },
    { label: 'Certificates Issued', value: data.totalCerts, icon: CheckCircle2, color: 'purple' },
    { label: 'Completion Rate', value: `${data.completionRate}%`, icon: Clock, color: 'amber' },
    { label: 'Total Enrollments', value: data.totalEnrollments, icon: Calendar, color: 'teal' },
    { label: 'Total Completions', value: data.totalCompletions, icon: CheckCircle2, color: 'brand-green' },
  ];

  return (
    <div className="min-h-screen bg-gray-50 p-6">

      {/* Hero Image */}
      <div className="max-w-7xl mx-auto">
        <div className="mb-4">
          <Breadcrumbs items={[
            { label: 'Admin', href: '/admin/dashboard' },
            { label: 'Accreditation', href: '/admin/accreditation' },
            { label: 'Report' },
          ]} />
        </div>

        <div className="flex items-center justify-between mb-6">
          <div>
            <Link href="/admin/accreditation" className="text-sm text-brand-blue-600 hover:text-brand-blue-700 flex items-center gap-1 mb-2">
              <ArrowLeft className="w-4 h-4" /> Back to Accreditation
            </Link>
            <h1 className="text-2xl font-bold text-gray-900">Accreditation Compliance Report</h1>
            <p className="text-sm text-gray-500 mt-1">Generated {now} from live platform data</p>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
          {metrics.map((m) => (
            <div key={m.label} className="bg-white rounded-xl border border-gray-200 p-4">
              <m.icon className="w-5 h-5 text-gray-400 mb-2" />
              <div className="text-2xl font-bold text-gray-900">{m.value}</div>
              <div className="text-xs text-gray-500 mt-1">{m.label}</div>
            </div>
          ))}
        </div>

        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden mb-6">
          <div className="px-6 py-4 border-b border-gray-100">
            <h2 className="font-semibold text-gray-900">Active Programs</h2>
          </div>
          {data.programs.length === 0 ? (
            <div className="px-6 py-8 text-center text-sm text-gray-500">No active programs found.</div>
          ) : (
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Program</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Created</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {data.programs.map((p: any) => (
                  <tr key={p.id} className="hover:bg-gray-50">
                    <td className="px-6 py-3 text-sm font-medium text-gray-900">{p.name || 'Unnamed'}</td>
                    <td className="px-6 py-3">
                      <span className="text-xs px-2 py-0.5 rounded-full bg-brand-green-100 text-brand-green-700 font-medium">{p.status}</span>
                    </td>
                    <td className="px-6 py-3 text-sm text-gray-500">{p.created_at ? new Date(p.created_at).toLocaleDateString() : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {data.completionRate < 50 && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <div className="font-medium text-amber-800">Low Completion Rate</div>
              <div className="text-sm text-amber-700 mt-1">
                Completion rate is {data.completionRate}%. Review at-risk students and retention strategies.
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
