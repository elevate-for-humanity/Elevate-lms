
import { Metadata } from 'next';
import Link from 'next/link';
import { Briefcase, Building2, MapPin, Clock, Plus, Search, Eye, Edit, Trash2 } from 'lucide-react';
import { createAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Job Postings | Admin | Elevate for Humanity',
  description: 'Manage job postings and employer partnerships',
};

async function getJobsData() {
  const supabase = createAdminClient();
  
  const { data: jobPostings, count: jobCount } = await supabase
    .from('job_postings')
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false })
    .limit(10);

  const { count: employerCount } = await supabase
    .from('employers')
    .select('*', { count: 'exact', head: true });

  const activeJobs = jobPostings?.filter(j => j.status === 'active').length || 0;

  return {
    jobs: jobPostings || [],
    stats: {
      totalJobs: jobCount || 0,
      activeJobs,
      employers: employerCount || 0,
    }
  };
}

export default async function JobsPage() {
  const auth = await createClient();

  const { jobs: dbJobs, stats: dbStats } = await getJobsData();

  const stats = [
    { label: 'Active Jobs', value: String(dbStats.activeJobs), icon: Briefcase },
    { label: 'Partner Employers', value: String(dbStats.employers), icon: Building2 },
    { label: 'Applications', value: '156', icon: Clock },
    { label: 'Placements', value: '89', icon: MapPin },
  ];

  const jobs = dbJobs.length > 0 ? dbJobs.map((j: any) => ({
    id: j.id,
    title: j.title || 'Untitled Position',
    company: j.company_name || 'Unknown Company',
    location: j.location || 'Indianapolis, IN',
    type: j.employment_type || 'Full-time',
    applications: j.application_count || 0,
    status: j.status || 'active',
    posted: j.created_at ? new Date(j.created_at).toISOString().split('T')[0] : 'N/A',
  })) : [
    { id: 1, title: 'No job postings yet', company: '', location: '', type: '', applications: 0, status: 'none', posted: '' },
  ];

  return (
    <div className="min-h-screen bg-white">

      {/* Hero Image */}
      {/* Breadcrumbs */}
      <div className="bg-slate-50 border-b">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <Breadcrumbs items={[{ label: 'Admin', href: '/admin' }, { label: 'Jobs' }]} />
        </div>
      </div>

      <div className="p-6 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Job Postings</h1>
          <p className="text-gray-600 mt-1">Manage job listings and track applications</p>
        </div>
        <Link
          href="/admin/jobs/new"
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
                <p className="text-gray-600 text-sm">{stat.label}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border p-4 mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search jobs..."
              className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-brand-orange-500 focus:border-brand-orange-500"
            />
          </div>
          <select className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-brand-orange-500">
            <option value="">All Statuses</option>
            <option value="active">Active</option>
            <option value="paused">Paused</option>
            <option value="closed">Closed</option>
          </select>
          <select className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-brand-orange-500">
            <option value="">All Types</option>
            <option value="full-time">Full-time</option>
            <option value="part-time">Part-time</option>
            <option value="contract">Contract</option>
          </select>
        </div>
      </div>

      {/* Jobs Table */}
      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="text-left px-6 py-4 text-sm font-semibold text-gray-900">Job Title</th>
              <th className="text-left px-6 py-4 text-sm font-semibold text-gray-900">Company</th>
              <th className="text-left px-6 py-4 text-sm font-semibold text-gray-900">Location</th>
              <th className="text-left px-6 py-4 text-sm font-semibold text-gray-900">Applications</th>
              <th className="text-left px-6 py-4 text-sm font-semibold text-gray-900">Status</th>
              <th className="text-left px-6 py-4 text-sm font-semibold text-gray-900">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {jobs.map((job) => (
              <tr key={job.id} className="hover:bg-gray-50">
                <td className="px-6 py-4">
                  <div>
                    <p className="font-medium text-gray-900">{job.title}</p>
                    <p className="text-sm text-gray-500">{job.type} • Posted {job.posted}</p>
                  </div>
                </td>
                <td className="px-6 py-4 text-gray-600">{job.company}</td>
                <td className="px-6 py-4 text-gray-600">{job.location}</td>
                <td className="px-6 py-4">
                  <span className="font-medium text-gray-900">{job.applications}</span>
                </td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-2 rounded-full text-xs font-medium ${
                    job.status === 'active' 
                      ? 'bg-brand-green-100 text-brand-green-800' 
                      : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {job.status}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    <button className="p-2 hover:bg-gray-100 rounded-lg" title="View">
                      <Eye className="w-4 h-4 text-gray-500" />
                    </button>
                    <button className="p-2 hover:bg-gray-100 rounded-lg" title="Edit">
                      <Edit className="w-4 h-4 text-gray-500" />
                    </button>
                    <button className="p-2 hover:bg-gray-100 rounded-lg" title="Delete">
                      <Trash2 className="w-4 h-4 text-brand-red-500" />
                    </button>
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
