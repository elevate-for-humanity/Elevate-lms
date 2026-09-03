import { Metadata } from 'next';
import { requireRole } from '@/lib/auth/require-role';
import { requireAdminClient } from '@/lib/supabase/admin';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Reports',
  description: 'Employer reports and analytics',
};

export default async function EmployerReportsPage() {
  const { user, profile } = await requireRole(['employer', 'admin', 'staff']);
  const db = await requireAdminClient();

  const employerId = (profile as any)?.employer_id;

  // Active job postings
  const { count: activePostings } = await db
    .from('jobs')
    .select('*', { count: 'exact', head: true })
    .eq('employer_id', employerId ?? user.id)
    .eq('status', 'active');

  // Applications scoped to this employer's jobs
  const { count: totalApplications } = await db
    .from('applications')
    .select('*', { count: 'exact', head: true })
    .eq('employer_id', employerId ?? user.id);

  // Pipeline breakdown
  const { count: newApps } = await db.from('applications').select('*', { count: 'exact', head: true })
    .eq('employer_id', employerId ?? user.id).eq('status', 'submitted');
  const { count: underReview } = await db.from('applications').select('*', { count: 'exact', head: true })
    .eq('employer_id', employerId ?? user.id).in('status', ['in_review', 'under_review']);
  const { count: approved } = await db.from('applications').select('*', { count: 'exact', head: true })
    .eq('employer_id', employerId ?? user.id).eq('status', 'approved');

  // Hires = enrolled applications
  const { count: hires } = await db.from('applications').select('*', { count: 'exact', head: true })
    .eq('employer_id', employerId ?? user.id).eq('status', 'enrolled');

  // Job placements
  const { data: placements } = await db
    .from('job_placements')
    .select('start_date, created_at')
    .eq('employer_id', employerId ?? user.id)
    .eq('status', 'placed')
    .order('start_date', { ascending: false })
    .limit(100);

  // Avg days to hire
  let avgDaysToHire: number | null = null;
  if (placements && placements.length > 0) {
    const diffs = placements
      .filter((p: any) => p.start_date && p.created_at)
      .map((p: any) => Math.round((new Date(p.start_date).getTime() - new Date(p.created_at).getTime()) / (1000 * 60 * 60 * 24)));
    if (diffs.length > 0) avgDaysToHire = Math.round(diffs.reduce((a, b) => a + b, 0) / diffs.length);
  }

  // Candidate sources
  const { count: directApps } = await db.from('applications').select('*', { count: 'exact', head: true })
    .eq('employer_id', employerId ?? user.id).is('referred_by', null);
  const { count: referrals } = await db.from('applications').select('*', { count: 'exact', head: true })
    .eq('employer_id', employerId ?? user.id).not('referred_by', 'is', null);

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
            <div className="text-3xl font-bold text-brand-green-600 mb-2">{totalApplications ?? 0}</div>
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
              ['Approved', approved ?? 0],
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
              <span className="text-slate-700">Average Days</span>
              <span className="font-semibold">{avgDaysToHire != null ? `${avgDaysToHire}d` : '—'}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-700">Total Placements</span>
              <span className="font-semibold">{placements?.length ?? 0}</span>
            </div>
          </div>
        </div>

        <div className="border rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-4">Candidate Sources</h3>
          <div className="space-y-3">
            {[
              ['Direct Applications', directApps ?? 0],
              ['Referrals', referrals ?? 0],
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
            <Link href="/employer/candidates" className="block text-brand-blue-600 hover:underline text-sm">View All Applications →</Link>
            <Link href="/employer/jobs" className="block text-brand-blue-600 hover:underline text-sm">Manage Job Postings →</Link>
            <Link href="/employer/compliance" className="block text-brand-blue-600 hover:underline text-sm">Compliance & WIOA →</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
