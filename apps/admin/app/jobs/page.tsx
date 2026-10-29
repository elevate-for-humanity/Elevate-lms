import { requireRole } from '@/lib/auth/require-role';
import { Metadata } from 'next';
import Link from 'next/link';
import { Briefcase, Building2, MapPin, Clock, Plus, Search, Eye, Edit, Trash2 } from 'lucide-react';
import { requireAdminClient } from '@/lib/supabase/admin';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { PLATFORM_DEFAULTS } from '@/lib/config/platform-config';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: `Job Postings | Admin | ${PLATFORM_DEFAULTS.orgName}`,
  description: 'Manage job postings and employer partnerships',
};

async function getJobsData(filters: { employer?: string; status?: string; type?: string; q?: string }) {
  const supabase = await requireAdminClient();

  let query = supabase.from('job_postings')
    .select('*, employer:employers(company_name,business_name)', { count: 'exact' });
  if (filters.employer) query = query.eq('employer_id', filters.employer);
  if (filters.status) query = query.eq('status', filters.status);
  if (filters.type) query = query.eq('employment_type', filters.type);
  if (filters.q) query = query.ilike('title', `%${filters.q.slice(0, 160)}%`);
  const { data: jobPostings, count: jobCount, error } = await query.order('created_at', { ascending: false }).limit(100);
  if (error) throw new Error('Unable to load job postings.');
  const { count: activeCount } = await supabase.from('job_postings').select('id', { count: 'exact', head: true }).eq('status', 'active');

  const { count: employerCount } = await supabase
    .from('employers')
    .select('*', { count: 'exact', head: true });

  const { count: applicationCount } = await supabase
    .from('job_applications')
    .select('*', { count: 'exact', head: true });

  const { count: placementCount } = await supabase
    .from('job_placements')
    .select('*', { count: 'exact', head: true });

  const activeJobs = activeCount || 0;

  return {
    jobs: jobPostings || [],
    stats: {
      totalJobs: jobCount || 0,
      activeJobs,
      employers: employerCount || 0,
      applications: applicationCount || 0,
      placements: placementCount || 0,
    },
  };
}

export default async function JobsPage({ searchParams }: { searchParams: Promise<{ employer?: string; status?: string; type?: string; q?: string }> }) {
  await requireRole(['admin']);
  const filters = await searchParams;
  const { jobs: dbJobs, stats: dbStats } = await getJobsData(filters);

  const stats = [
    { label: 'Active Jobs', value: String(dbStats.activeJobs), icon: Briefcase },
    { label: 'Partner Employers', value: String(dbStats.employers), icon: Building2 },
    { label: 'Applications', value: String(dbStats.applications), icon: Clock },
    { label: 'Placements', value: String(dbStats.placements), icon: MapPin },
  ];

  const jobs =
    dbJobs.length > 0
      ? dbJobs.map((j: any) => ({
          id: j.id,
          title: j.title || 'Untitled Position',
          company: j.employer?.company_name || j.employer?.business_name || 'Employer not linked',
          location: j.location || 'Indianapolis, IN',
          type: j.employment_type || 'Full-time',
          applications: j.application_count || 0,
          status: j.status || 'active',
          posted: j.created_at ? new Date(j.created_at).toISOString().split('T')[0] : 'N/A',
        }))
      : [
          {
            id: 1,
            title: 'No job postings yet',
            company: '',
            location: '',
            type: '',
            applications: 0,
            status: 'none',
            posted: '',
          },
        ];

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Image */}
      {/* Breadcrumbs */}
      <div className="bg-slate-50 border-b">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <Breadcrumbs items={[{ label: 'Admin', href: '/' }, { label: 'Jobs' }]} />
        </div>
      </div>

      <div className="p-6 max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Job Postings</h1>
            <p className="text-slate-700 mt-1">Manage job listings and track applications</p>
          </div>
          <Link
            href="/jobs/new"
            className="px-4 py-2 bg-brand-orange-600 text-white rounded-lg hover:bg-brand-orange-700 transition flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            Post New Job
          </Link>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {stats.map((stat) => (
            <div key={stat.label} className="bg-white rounded-xl shadow-sm border p-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-brand-orange-100 rounded-lg flex items-center justify-center">
                  <stat.icon className="w-6 h-6 text-brand-orange-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stat.value}</p>
                  <p className="text-slate-700 text-sm">{stat.label}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-sm border p-4 mb-6">
          <form action="/jobs" className="flex flex-col md:flex-row gap-4">
            {filters.employer && <input type="hidden" name="employer" value={filters.employer} />}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-700" />
              <input
                type="text"
                name="q" defaultValue={filters.q} placeholder="Search jobs..."
                className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-brand-orange-500 focus:border-brand-orange-500"
              />
            </div>
            <select name="status" defaultValue={filters.status || ""} className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-brand-orange-500">
              <option value="">All Statuses</option>
              <option value="pending">Pending review</option><option value="active">Active</option>
              <option value="paused">Paused</option>
              <option value="closed">Closed</option>
            </select>
            <select name="type" defaultValue={filters.type || ""} className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-brand-orange-500">
              <option value="">All Types</option>
              <option value="Full-time">Full-time</option>
              <option value="Part-time">Part-time</option>
              <option value="Contract">Contract</option>
            </select>
            <button type="submit" className="rounded-lg bg-brand-blue-700 px-5 py-3 text-white">Search</button>
          </form>
        </div>

        {/* Jobs Table */}
        <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
          <table className="w-full">
            <thead className="bg-slate-50 border-b">
              <tr>
                <th className="text-left px-6 py-4 text-sm font-semibold text-slate-900">
                  Job Title
                </th>
                <th className="text-left px-6 py-4 text-sm font-semibold text-slate-900">
                  Company
                </th>
                <th className="text-left px-6 py-4 text-sm font-semibold text-slate-900">
                  Location
                </th>
                <th className="text-left px-6 py-4 text-sm font-semibold text-slate-900">
                  Applications
                </th>
                <th className="text-left px-6 py-4 text-sm font-semibold text-slate-900">Status</th>
                <th className="text-left px-6 py-4 text-sm font-semibold text-slate-900">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {jobs.map((job) => (
                <tr key={job.id} className="hover:bg-slate-50">
                  <td className="px-6 py-4">
                    <div>
                      <p className="font-medium text-slate-900">{job.title}</p>
                      <p className="text-sm text-slate-700">
                        {job.type} • Posted {job.posted}
                      </p>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-slate-700">{job.company}</td>
                  <td className="px-6 py-4 text-slate-700">{job.location}</td>
                  <td className="px-6 py-4">
                    <span className="font-medium text-slate-900">{job.applications}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`px-2 py-2 rounded-full text-xs font-medium ${
                        job.status === 'active'
                          ? 'bg-brand-green-100 text-brand-green-800'
                          : 'bg-yellow-100 text-yellow-800'
                      }`}
                    >
                      {job.status}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      {job.status !== 'none' && <Link
                        href={`/jobs/${job.id}`}
                        className="p-2 hover:bg-slate-100 rounded-lg"
                        title="View"
                      >
                        <Eye className="w-4 h-4 text-slate-700" />
                      </Link>}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
