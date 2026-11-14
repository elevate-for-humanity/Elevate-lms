import { Metadata } from 'next';
import { requireRole } from '@/lib/auth/require-role';
import { createClient } from '@/lib/supabase/server';
import { getEmployerRecord } from '@/lib/employer/employer-context';
import { loadEmployerHiringReport } from '@/lib/employer/report-data';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Reports',
  description: 'Employer reports and analytics',
};

export default async function EmployerReportsPage() {
  const { user } = await requireRole(['employer', 'admin', 'staff']);
  const db = await createClient();
  const employer = await getEmployerRecord(db, user.id);
  if (!employer)
    return (
      <main className="p-6">
        <h1>Employer profile required</h1>
        <p>Complete employer setup before opening your hiring reports.</p>
        <Link href="/employer/setup">Open employer setup</Link>
      </main>
    );
  const {
    activePostings,
    totalApplications,
    newApps,
    underReview,
    hires,
    rejected,
    placementCount,
    referrals,
    avgDaysToHire,
  } = await loadEmployerHiringReport(db, employer.id);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-7xl mx-auto px-4 py-4">
        <Breadcrumbs items={[{ label: 'Employer', href: '/employer' }, { label: 'Reports' }]} />
      </div>
      <h1 className="text-3xl font-bold mb-6">Reports & Analytics</h1>

      <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
        <p className="text-slate-700 mb-6">Hiring metrics and workforce analytics.</p>
        <div className="grid md:grid-cols-3 gap-4">
          <div className="border rounded-lg p-4 text-center">
            <div className="text-3xl font-bold text-brand-blue-600 mb-2">{activePostings ?? 0}</div>
            <div className="text-sm text-slate-700">Active Postings</div>
          </div>
          <div className="border rounded-lg p-4 text-center">
            <div className="text-3xl font-bold text-brand-green-600 mb-2">
              {totalApplications ?? 0}
            </div>
            <div className="text-sm text-slate-700">Applications</div>
          </div>
          <div className="border rounded-lg p-4 text-center">
            <div className="text-3xl font-bold text-brand-blue-600 mb-2">{hires ?? 0}</div>
            <div className="text-sm text-slate-700">Hires</div>
          </div>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="border rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-4">Hiring Pipeline</h3>
          <div className="space-y-3">
            {[
              ['New Applications', newApps ?? 0],
              ['Under Review', underReview ?? 0],
              ['Rejected', rejected ?? 0],
              ['Hired', hires ?? 0],
            ].map(([label, val]) => (
              <div key={label as string} className="flex justify-between items-center">
                <span className="text-slate-700">{label}</span>
                <span className="font-semibold">{val}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="border rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-4">Time to Hire</h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-slate-700">
                Average days from record to start (latest 100 placements)
              </span>
              <span className="font-semibold">
                {avgDaysToHire != null ? `${avgDaysToHire}d` : '—'}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-700">Total Placements</span>
              <span className="font-semibold">{placementCount}</span>
            </div>
          </div>
        </div>

        <div className="border rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-4">Candidate Activity</h3>
          <div className="space-y-3">
            {[
              ['Job Applications', totalApplications],
              ['Routed Candidates', referrals],
            ].map(([label, val]) => (
              <div key={label as string} className="flex justify-between items-center">
                <span className="text-slate-700">{label}</span>
                <span className="font-semibold">{val}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="border rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-4">Quick Links</h3>
          <div className="space-y-2">
            <Link
              href="/employer/applications"
              className="block text-brand-blue-600 hover:underline text-sm"
            >
              View All Applications →
            </Link>
            <Link
              href="/employer/jobs"
              className="block text-brand-blue-600 hover:underline text-sm"
            >
              Manage Job Postings →
            </Link>
            <Link
              href="/employer/compliance"
              className="block text-brand-blue-600 hover:underline text-sm"
            >
              Compliance & WIOA →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
