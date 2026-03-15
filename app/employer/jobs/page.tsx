import { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Briefcase, Plus, Eye, Edit, Clock, MapPin, DollarSign } from 'lucide-react';
import { safeFormatDate } from '@/lib/format-utils';

export const metadata: Metadata = {
  title: 'My Job Postings | Employer Portal',
  description: 'Manage your job postings and view applications.',
};

export const dynamic = 'force-dynamic';

export default async function EmployerJobsPage() {
  const supabase = await createClient();
  const _admin = createAdminClient(); const db = _admin || supabase;

  if (!supabase) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Service Unavailable</h1>
          <p className="text-gray-600">Please try again later.</p>
        </div>
      </div>
    );
  }

  // Auth check
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: profile } = await db
    .from('profiles')
    .select('role, verified')
    .eq('id', user.id)
    .single();

  if (!profile || profile.role !== 'employer') {
    redirect('/');
  }

  // Get job postings
  const { data: jobs } = await db
    .from('job_postings')
    .select('*')
    .eq('employer_id', user.id)
    .order('created_at', { ascending: false });

  const activeJobs = jobs?.filter(j => j.status === 'active') || [];
  const draftJobs = jobs?.filter(j => j.status === 'draft') || [];
  const closedJobs = jobs?.filter(j => j.status === 'closed') || [];

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">My Job Postings</h1>
              <p className="text-gray-600">Manage your job listings and view applications</p>
            </div>
            <div className="flex gap-3">
              <Link
                href="/employer/dashboard"
                className="px-4 py-2 text-gray-600 hover:text-gray-900"
              >
                ← Dashboard
              </Link>
              {profile.verified && (
                <Link
                  href="/employer/post-job"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-brand-blue-600 text-white rounded-lg hover:bg-brand-blue-700 transition"
                >
                  <Plus className="w-4 h-4" />
                  Post New Job
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="bg-white rounded-lg shadow-sm border p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-brand-green-100 rounded-lg flex items-center justify-center">
                <Briefcase className="w-5 h-5 text-brand-green-600" />
              </div>
              <div>
                <div className="text-2xl font-bold">{activeJobs.length}</div>
                <div className="text-sm text-gray-600">Active Jobs</div>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm border p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
                <Edit className="w-5 h-5 text-yellow-600" />
              </div>
              <div>
                <div className="text-2xl font-bold">{draftJobs.length}</div>
                <div className="text-sm text-gray-600">Drafts</div>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm border p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center">
                <Clock className="w-5 h-5 text-gray-600" />
              </div>
              <div>
                <div className="text-2xl font-bold">{closedJobs.length}</div>
                <div className="text-sm text-gray-600">Closed</div>
              </div>
            </div>
          </div>
        </div>

        {/* Verification Warning */}
        {!profile.verified && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
            <div className="flex items-center gap-3">
              <div className="text-yellow-600 font-semibold">Account Not Verified</div>
            </div>
            <p className="text-yellow-800 text-sm mt-1">
              Complete verification to post jobs and contact candidates.
            </p>
            <Link
              href="/employer/verification"
              className="inline-block mt-3 px-4 py-2 bg-yellow-600 text-white rounded-lg text-sm hover:bg-yellow-700"
            >
              Complete Verification
            </Link>
          </div>
        )}

        {/* Active Jobs */}
        {activeJobs.length > 0 && (
          <div className="mb-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Active Jobs</h2>
            <div className="space-y-4">
              {activeJobs.map((job: any) => (
                <JobCard key={job.id} job={job} />
              ))}
            </div>
          </div>
        )}

        {/* Draft Jobs */}
        {draftJobs.length > 0 && (
          <div className="mb-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Drafts</h2>
            <div className="space-y-4">
              {draftJobs.map((job: any) => (
                <JobCard key={job.id} job={job} isDraft />
              ))}
            </div>
          </div>
        )}

        {/* Closed Jobs */}
        {closedJobs.length > 0 && (
          <div className="mb-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Closed Jobs</h2>
            <div className="space-y-4 opacity-60">
              {closedJobs.map((job: any) => (
                <JobCard key={job.id} job={job} isClosed />
              ))}
            </div>
          </div>
        )}

        {/* Empty State */}
        {(!jobs || jobs.length === 0) && (
          <div className="bg-white rounded-lg shadow-sm border p-12 text-center">
            <Briefcase className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No Job Postings Yet</h3>
            <p className="text-gray-600 mb-6">
              Create your first job posting to start receiving applications from trained candidates.
            </p>
            {profile.verified ? (
              <Link
                href="/employer/post-job"
                className="inline-flex items-center gap-2 px-6 py-3 bg-brand-blue-600 text-white rounded-lg hover:bg-brand-blue-700 transition"
              >
                <Plus className="w-5 h-5" />
                Post Your First Job
              </Link>
            ) : (
              <Link
                href="/employer/verification"
                className="inline-flex items-center gap-2 px-6 py-3 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition"
              >
                Complete Verification First
              </Link>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function JobCard({ job, isDraft, isClosed }: { job: any; isDraft?: boolean; isClosed?: boolean }) {
  return (
    <div className="bg-white rounded-lg shadow-sm border p-6">
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h3 className="text-lg font-semibold text-gray-900">{job.title}</h3>
            {isDraft && (
              <span className="px-2 py-0.5 bg-yellow-100 text-yellow-800 text-xs rounded-full">
                Draft
              </span>
            )}
            {isClosed && (
              <span className="px-2 py-0.5 bg-white text-gray-600 text-xs rounded-full">
                Closed
              </span>
            )}
          </div>
          <div className="flex flex-wrap gap-4 text-sm text-gray-600 mt-2">
            {job.location && (
              <span className="flex items-center gap-1">
                <MapPin className="w-4 h-4" />
                {job.location}
              </span>
            )}
            {job.salary_range && (
              <span className="flex items-center gap-1">
                <DollarSign className="w-4 h-4" />
                {job.salary_range}
              </span>
            )}
            {job.employment_type && (
              <span className="flex items-center gap-1">
                <Clock className="w-4 h-4" />
                {job.employment_type}
              </span>
            )}
          </div>
          <div className="text-sm text-gray-500 mt-2">
            Posted: {safeFormatDate(job.created_at)}
          </div>
        </div>
        <div className="flex gap-2">
          <Link
            href={`/employer/postings/${job.id}`}
            className="p-2 text-gray-600 hover:text-brand-blue-600 hover:bg-brand-blue-50 rounded-lg transition"
            title="View"
          >
            <Eye className="w-5 h-5" />
          </Link>
          {!isClosed && (
            <Link
              href={`/employer/postings/${job.id}/edit`}
              className="p-2 text-gray-600 hover:text-brand-green-600 hover:bg-brand-green-50 rounded-lg transition"
              title="Edit"
            >
              <Edit className="w-5 h-5" />
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
