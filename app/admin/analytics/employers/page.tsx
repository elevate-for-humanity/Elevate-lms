import { Metadata } from 'next';
import { requireRole } from '@/lib/auth/require-role';
import { requireAdminClient } from '@/lib/supabase/admin';
import Link from 'next/link';

export const dynamic = 'force-dynamic';
export const revalidate = 60;
export const metadata: Metadata = { title: 'Employer Analytics | Elevate For Humanity' };

export default async function EmployerAnalyticsPage() {
  await requireRole(['admin', 'super_admin']);
  const db = await requireAdminClient();

  const { count: totalEmployers } = await db
    .from('employers')
    .select('*', { count: 'exact', head: true });
  const { count: activeEmployers } = await db
    .from('employers')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'active');
  const { count: totalPostings } = await db
    .from('job_postings')
    .select('*', { count: 'exact', head: true });
  const { count: activePostings } = await db
    .from('job_postings')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'active');
  const { count: totalPlacements } = await db
    .from('job_placements')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'placed');

  const { data: topEmployers } = await db
    .from('employers')
    .select('id, name, business_name, status')
    .order('created_at', { ascending: false })
    .limit(20);

  // Placement counts per employer
  const employerStats = await Promise.all(
    (topEmployers || []).map(async (e: any) => {
      const { count: placements } = await db
        .from('job_placements')
        .select('*', { count: 'exact', head: true })
        .eq('employer_id', e.id)
        .eq('status', 'placed');
      const { count: openJobs } = await db
        .from('job_postings')
        .select('*', { count: 'exact', head: true })
        .eq('employer_id', e.id)
        .eq('status', 'active');
      return { ...e, placements: placements || 0, openJobs: openJobs || 0 };
    }),
  );
  employerStats.sort((a, b) => b.placements - a.placements);

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <nav className="text-sm mb-6">
          <ol className="flex items-center space-x-2 text-slate-700">
            <li>
              <Link href="/admin" className="hover:text-primary">
                Admin
              </Link>
            </li>
            <li>/</li>
            <li>
              <Link href="/admin/analytics" className="hover:text-primary">
                Analytics
              </Link>
            </li>
            <li>/</li>
            <li className="text-slate-900 font-medium">Employers</li>
          </ol>
        </nav>
        <h1 className="text-3xl font-bold mb-2">Employer Analytics</h1>
        <p className="text-slate-700 mb-8">Employer engagement and placement outcomes</p>

        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
          {[
            ['Total Employers', totalEmployers ?? 0],
            ['Active', activeEmployers ?? 0],
            ['Total Postings', totalPostings ?? 0],
            ['Active Postings', activePostings ?? 0],
            ['Total Placements', totalPlacements ?? 0],
          ].map(([label, val]) => (
            <div
              key={label as string}
              className="bg-white rounded-lg shadow-sm border p-4 text-center"
            >
              <p className="text-2xl font-bold">{val}</p>
              <p className="text-xs text-slate-700 mt-1">{label}</p>
            </div>
          ))}
        </div>

        <div className="bg-white rounded-lg shadow-sm border">
          <div className="p-4 border-b">
            <h2 className="font-semibold">Employer Breakdown</h2>
          </div>
          {employerStats.length > 0 ? (
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-slate-700 border-b bg-slate-50">
                  <th className="px-4 py-3">Employer</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Open Jobs</th>
                  <th className="px-4 py-3 text-right">Placements</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {employerStats.map((e: any) => (
                  <tr key={e.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 font-medium">{e.name || e.business_name || '—'}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`px-2 py-0.5 text-xs rounded-full ${e.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-700'}`}
                      >
                        {e.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">{e.openJobs}</td>
                    <td className="px-4 py-3 text-right font-semibold">{e.placements}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className="p-8 text-center text-slate-700">No employer data yet.</p>
          )}
        </div>
      </div>
    </div>
  );
}
