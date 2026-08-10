import { Metadata } from 'next';
import { requireRole } from '@/lib/auth/require-role';
import { createClient } from '@/lib/supabase/server';
import { getEmployerRecord } from '@/lib/employer/employer-context';
import Link from 'next/link';
import { Briefcase, Plus, Eye, Edit, Clock, MapPin, DollarSign } from 'lucide-react';
import { safeFormatDate } from '@/lib/format-utils';

export const metadata: Metadata = {
  title: 'My Job Postings | Employer Portal',
  description: 'Manage your job postings and view applications.',
  robots: { index: false, follow: false },
};

export const dynamic = 'force-dynamic';

export default async function EmployerJobsPage() {
  const { user } = await requireRole(['employer', 'sponsor', 'admin']);
  const supabase = await createClient();

  const { data: profile } = await supabase
    .from('profiles')
    .select('id, full_name, role, verified')
    .eq('id', user.id)
    .maybeSingle();
  const employer = await getEmployerRecord(supabase, user.id);
  const isVerified = Boolean(employer?.approved || profile?.verified);

  const { data: jobs } = employer
    ? await supabase
        .from('job_postings')
        .select('*')
        .eq('employer_id', employer.id)
        .order('created_at', { ascending: false })
    : { data: [] };

  const activeJobs = jobs?.filter((job: any) => job.status === 'active') || [];
  const draftJobs = jobs?.filter((job: any) => job.status === 'draft') || [];
  const closedJobs = jobs?.filter((job: any) => job.status === 'closed') || [];

  return (
    <div className="min-h-screen bg-white">
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-slate-900">My Job Postings</h1>
              <p className="text-slate-700">Manage your job listings and view applications</p>
            </div>
            <div className="flex gap-3">
              <Link href="/employer/dashboard" className="px-4 py-2 text-slate-700 hover:text-slate-900">
                ← Dashboard
              </Link>
              {employer && isVerified && (
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
        {!employer && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6 text-amber-900">
            <p className="font-semibold">Employer profile required</p>
            <p className="text-sm mt-1">Complete employer onboarding before managing job postings.</p>
          </div>
        )}

        <div className="grid grid-cols-3 gap-4 mb-8">
          <StatCard label="Active Jobs" value={activeJobs.length} icon={<Briefcase className="w-5 h-5 text-brand-green-600" />} />
          <StatCard label="Drafts" value={draftJobs.length} icon={<Edit className="w-5 h-5 text-yellow-600" />} />
          <StatCard label="Closed" value={closedJobs.length} icon={<Clock className="w-5 h-5 text-slate-700" />} />
        </div>

        {employer && !isVerified && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
            <div className="text-yellow-700 font-semibold">Account Not Verified</div>
            <p className="text-yellow-800 text-sm mt-1">Complete verification to post jobs and contact candidates.</p>
            <Link href="/employer/verification" className="inline-block mt-3 px-4 py-2 bg-yellow-600 text-white rounded-lg text-sm hover:bg-yellow-700">
              Complete Verification
            </Link>
          </div>
        )}

        {activeJobs.length > 0 && <JobSection title="Active Jobs" jobs={activeJobs} />}
        {draftJobs.length > 0 && <JobSection title="Drafts" jobs={draftJobs} isDraft />}
        {closedJobs.length > 0 && <JobSection title="Closed Jobs" jobs={closedJobs} isClosed />}

        {employer && (!jobs || jobs.length === 0) && (
          <div className="bg-white rounded-lg shadow-sm border p-12 text-center">
            <Briefcase className="w-16 h-16 text-slate-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-slate-900 mb-2">No Job Postings Yet</h3>
            <p className="text-slate-700 mb-6">Create your first job posting to start receiving applications from trained candidates.</p>
            {isVerified ? (
              <Link href="/employer/post-job" className="inline-flex items-center gap-2 px-6 py-3 bg-brand-blue-600 text-white rounded-lg hover:bg-brand-blue-700 transition">
                <Plus className="w-5 h-5" />
                Post Your First Job
              </Link>
            ) : (
              <Link href="/employer/verification" className="inline-flex items-center gap-2 px-6 py-3 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition">
                Complete Verification First
              </Link>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({ label, value, icon }: { label: string; value: number; icon: React.ReactNode }) {
  return (
    <div className="bg-white rounded-lg shadow-sm border p-4">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-slate-50 rounded-lg flex items-center justify-center">{icon}</div>
        <div>
          <div className="text-2xl font-bold">{value}</div>
          <div className="text-sm text-slate-700">{label}</div>
        </div>
      </div>
    </div>
  );
}

function JobSection({ title, jobs, isDraft, isClosed }: { title: string; jobs: any[]; isDraft?: boolean; isClosed?: boolean }) {
  return (
    <div className={`mb-8 ${isClosed ? 'opacity-60' : ''}`}>
      <h2 className="text-lg font-semibold text-slate-900 mb-4">{title}</h2>
      <div className="space-y-4">
        {jobs.map((job: any) => <JobCard key={job.id} job={job} isDraft={isDraft} isClosed={isClosed} />)}
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
            <h3 className="text-lg font-semibold text-slate-900">{job.title}</h3>
            {isDraft && <span className="px-2 py-0.5 bg-yellow-100 text-yellow-800 text-xs rounded-full">Draft</span>}
            {isClosed && <span className="px-2 py-0.5 bg-slate-100 text-slate-700 text-xs rounded-full">Closed</span>}
          </div>
          <div className="flex flex-wrap gap-4 text-sm text-slate-700 mt-2">
            {job.location && <span className="flex items-center gap-1"><MapPin className="w-4 h-4" />{job.location}</span>}
            {job.salary_range && <span className="flex items-center gap-1"><DollarSign className="w-4 h-4" />{job.salary_range}</span>}
            {job.employment_type && <span className="flex items-center gap-1"><Clock className="w-4 h-4" />{job.employment_type}</span>}
          </div>
          <div className="text-sm text-slate-700 mt-2">Posted: {safeFormatDate(job.created_at)}</div>
        </div>
        <div className="flex gap-2">
          <Link href={`/employer/postings/${job.id}`} className="p-2 text-slate-700 hover:text-brand-blue-600 hover:bg-brand-blue-50 rounded-lg transition" title="View">
            <Eye className="w-5 h-5" />
          </Link>
          {!isClosed && (
            <Link href={`/employer/postings/${job.id}/edit`} className="p-2 text-slate-700 hover:text-brand-green-600 hover:bg-brand-green-50 rounded-lg transition" title="Edit">
              <Edit className="w-5 h-5" />
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
