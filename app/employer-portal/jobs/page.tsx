import { Metadata } from 'next';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { createClient } from '@/lib/supabase/server';
import { getAdminClient } from '@/lib/supabase/admin';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import {
  Briefcase, Plus, Edit, Trash2, Users, Clock,
  MapPin, DollarSign, MoreVertical, Search, Filter,
} from 'lucide-react';

export const metadata: Metadata = {
  title: 'Job Postings | Employer Portal | Elevate For Humanity',
  description: 'Manage your job postings and track applications.',
  robots: { index: false, follow: false },
};

export const dynamic = 'force-dynamic';

export default async function JobPostingsPage() {
  const supabase = await createClient();
  const db = (await getAdminClient()) || supabase;

  if (!supabase) {
    redirect('/login?redirect=/employer-portal/jobs');
  }

  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login?redirect=/employer-portal/jobs');
  }

  // Fetch real job postings for this employer
  const { data: jobPostings } = await db
    .from('job_postings')
    .select('id, job_title, job_description, location, employment_type, salary_min, salary_max, status, positions_available, positions_filled, created_at')
    .eq('employer_id', user.id)
    .order('created_at', { ascending: false });

  const jobs = (jobPostings || []).map(j => {
    const salaryDisplay = j.salary_min && j.salary_max
      ? `$${j.salary_min.toLocaleString()} - $${j.salary_max.toLocaleString()}`
      : j.salary_min ? `From $${j.salary_min.toLocaleString()}` : 'Not specified';

    const posted = new Date(j.created_at);
    const daysAgo = Math.floor((Date.now() - posted.getTime()) / (1000 * 60 * 60 * 24));
    const postedLabel = daysAgo === 0 ? 'Today' : daysAgo === 1 ? '1 day ago' : `${daysAgo} days ago`;

    return {
      id: j.id,
      title: j.job_title,
      location: j.location || 'Location not set',
      type: j.employment_type || 'Full-time',
      salary: salaryDisplay,
      positions: j.positions_available || 0,
      filled: j.positions_filled || 0,
      status: j.status || 'draft',
      posted: postedLabel,
    };
  });

  return (
    <div className="min-h-screen bg-gray-50">
      <Breadcrumbs items={[{ label: "Employer Portal", href: "/employer-portal" }, { label: "Jobs" }]} />

      {/* Header */}
      <section className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Job Postings</h1>
              <p className="text-gray-600 mt-1">Manage your open positions and track applications</p>
            </div>
            <Link
              href="/employer-portal/jobs/new"
              className="inline-flex items-center gap-2 px-6 py-3 bg-brand-blue-600 text-white font-semibold rounded-lg hover:bg-brand-blue-700 transition-colors"
            >
              <Plus className="w-5 h-5" />
              Post New Job
            </Link>
          </div>
        </div>
      </section>

      {/* Filters */}
      <section className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search jobs..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-blue-500"
              />
            </div>
            <div className="flex gap-3">
              <select className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-blue-500">
                <option>All Status</option>
                <option>Active</option>
                <option>Paused</option>
                <option>Closed</option>
              </select>
              <button className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center gap-2">
                <Filter className="w-4 h-4" />
                More Filters
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Jobs List */}
      <section className="py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {jobs.length > 0 ? (
            <div className="space-y-4">
              {jobs.map((job) => (
                <div key={job.id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow">
                  <div className="p-6">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-xl font-bold text-gray-900">{job.title}</h3>
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                            job.status === 'active' ? 'bg-brand-green-100 text-brand-green-700' :
                            job.status === 'paused' ? 'bg-yellow-100 text-yellow-700' :
                            'bg-gray-100 text-gray-700'
                          }`}>
                            {job.status}
                          </span>
                        </div>
                        <div className="flex flex-wrap items-center gap-4 text-gray-500 text-sm">
                          <span className="flex items-center gap-1">
                            <MapPin className="w-4 h-4" />
                            {job.location}
                          </span>
                          <span className="flex items-center gap-1">
                            <Briefcase className="w-4 h-4" />
                            {job.type}
                          </span>
                          <span className="flex items-center gap-1">
                            <DollarSign className="w-4 h-4" />
                            {job.salary}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-4 h-4" />
                            Posted {job.posted}
                          </span>
                        </div>
                      </div>
                      <button className="p-2 hover:bg-gray-100 rounded-lg">
                        <MoreVertical className="w-5 h-5 text-gray-400" />
                      </button>
                    </div>

                    <div className="flex items-center gap-6 mt-6">
                      <div className="flex items-center gap-2">
                        <Users className="w-5 h-5 text-brand-blue-600" />
                        <span className="font-semibold text-gray-900">{job.positions}</span>
                        <span className="text-gray-500">positions</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-brand-green-600">{job.filled}</span>
                        <span className="text-gray-500">filled</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 mt-6">
                      <Link
                        href={`/employer-portal/jobs/${job.id}/applications`}
                        className="px-4 py-2 bg-brand-blue-600 text-white font-medium rounded-lg hover:bg-brand-blue-700 transition-colors"
                      >
                        View Applications
                      </Link>
                      <Link
                        href={`/employer-portal/jobs/${job.id}/edit`}
                        className="px-4 py-2 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2"
                      >
                        <Edit className="w-4 h-4" />
                        Edit
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-16">
              <Briefcase className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No job postings yet</h3>
              <p className="text-gray-600 mb-6">Create your first job posting to start receiving applications.</p>
              <Link
                href="/employer-portal/jobs/new"
                className="inline-flex items-center gap-2 px-6 py-3 bg-brand-blue-600 text-white font-semibold rounded-lg hover:bg-brand-blue-700 transition-colors"
              >
                <Plus className="w-5 h-5" />
                Post Your First Job
              </Link>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
