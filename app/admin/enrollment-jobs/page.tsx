import { Metadata } from 'next';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
export const dynamic = 'force-dynamic';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { AlertCircle, RefreshCw, XCircle } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Enrollment Jobs | Admin',
  description: 'Monitor and retry failed enrollment jobs',
};

export default async function EnrollmentJobsPage() {
  const supabase = await createClient();

  if (!supabase) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <Breadcrumbs items={[{ label: "Admin", href: "/admin" }, { label: "Enrollment Jobs" }]} />
        </div>
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Service Unavailable</h1>
          <p className="text-gray-600">Please try again later.</p>
        </div>
      </div>
    );
  }
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (!profile || !['admin', 'staff'].includes(profile.role)) {
    redirect('/');
  }

  // Get failed and retrying jobs
  const { data: jobs } = await supabase
    .from('enrollment_jobs')
    .select(
      `
      *,
      program_enrollments (
        id,
        program_id,
        student_id,
        status,
        profiles (
          email,
          first_name,
          last_name
        )
      )
    `
    )
    .in('status', ['failed', 'retrying'])
    .order('created_at', { ascending: false })
    .limit(100);

  const failedCount = jobs?.filter((j) => j.status === 'failed').length || 0;
  const retryingCount =
    jobs?.filter((j) => j.status === 'retrying').length || 0;

  return (
    <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <Breadcrumbs items={[{ label: "Admin", href: "/admin" }, { label: "Enrollment Jobs" }]} />
        </div>
      <div className="container mx-auto px-4">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-black mb-2">
            Enrollment Jobs Monitor
          </h1>
          <p className="text-black">
            View and retry failed enrollment orchestration jobs
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-black mb-1">Failed Jobs</p>
                <p className="text-3xl font-bold text-brand-red-600">{failedCount}</p>
              </div>
              <XCircle className="h-12 w-12 text-brand-red-600" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-black mb-1">Retrying</p>
                <p className="text-3xl font-bold text-yellow-600">
                  {retryingCount}
                </p>
              </div>
              <RefreshCw className="h-12 w-12 text-yellow-600" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-black mb-1">Total Issues</p>
                <p className="text-3xl font-bold text-black">
                  {failedCount + retryingCount}
                </p>
              </div>
              <AlertCircle className="h-12 w-12 text-black" />
            </div>
          </div>
        </div>

        {/* Jobs List */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-black">
              Failed & Retrying Jobs
            </h2>
          </div>

          {!jobs || jobs.length === 0 ? (
            <div className="p-8 text-center">
              <span className="text-slate-400 flex-shrink-0">•</span>
              <p className="text-lg font-medium text-black mb-2">
                All Clear!
              </p>
              <p className="text-black">
                No failed or retrying jobs at this time.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {jobs.map((job) => (
                <div key={job.id} className="p-6 hover:bg-gray-50">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span
                          className={`px-3 py-2 rounded-full text-sm font-medium ${
                            job.status === 'failed'
                              ? 'bg-brand-red-100 text-brand-red-800'
                              : 'bg-yellow-100 text-yellow-800'
                          }`}
                        >
                          {job.status}
                        </span>
                        <span className="text-sm font-medium text-black">
                          {job.job_type.replace(/_/g, ' ').toUpperCase()}
                        </span>
                      </div>

                      <div className="text-sm text-black space-y-1">
                        <p>
                          <span className="font-medium">Enrollment:</span>{' '}
                          {job.enrollment_id}
                        </p>
                        {job.program_enrollments?.profiles && (
                          <p>
                            <span className="font-medium">Learner:</span>{' '}
                            {job.program_enrollments.profiles.first_name}{' '}
                            {job.program_enrollments.profiles.last_name} (
                            {job.program_enrollments.profiles.email})
                          </p>
                        )}
                        <p>
                          <span className="font-medium">Program:</span>{' '}
                          {job.program_enrollments?.program_id}
                        </p>
                        <p>
                          <span className="font-medium">Attempts:</span>{' '}
                          {job.attempt_count} / {job.max_attempts}
                        </p>
                        {job.last_error && (
                          <p className="text-brand-red-600 mt-2">
                            <span className="font-medium">Error:</span>{' '}
                            {job.last_error}
                          </p>
                        )}
                      </div>
                    </div>

                    {job.status === 'failed' && (
                      <form action="/api/admin/enrollment-jobs" method="POST">
                        <input type="hidden" name="action" value="retry" />
                        <input type="hidden" name="job_id" value={job.id} />
                        <button
                          type="submit"
                          className="px-4 py-2 bg-brand-blue-600 text-white rounded-lg hover:bg-brand-blue-700 transition flex items-center gap-2"
                        >
                          <RefreshCw className="h-4 w-4" />
                          Retry
                        </button>
                      </form>
                    )}
                  </div>

                  <div className="text-xs text-black">
                    Created: {new Date(job.created_at).toLocaleString()}
                    {job.scheduled_for && (
                      <>
                        {' '}
                        | Next attempt:{' '}
                        {new Date(job.scheduled_for).toLocaleString()}
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
