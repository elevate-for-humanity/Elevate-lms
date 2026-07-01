import { Metadata } from 'next';
import Link from 'next/link';
import { requireRole } from '@/lib/auth/require-role';
import { createClient } from '@/lib/supabase/server';
import { FileText, Clock, XCircle, Eye, Briefcase } from 'lucide-react';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Applications | Employer Portal',
  description: 'Review candidate applications across your job postings.',
  alternates: { canonical: 'https://www.elevateforhumanity.org/employer/applications' },
};

const STATUS_STYLE: Record<string, string> = {
  pending: 'bg-amber-100 text-amber-800',
  reviewed: 'bg-blue-100 text-blue-800',
  hired: 'bg-brand-green-100 text-brand-green-800',
  rejected: 'bg-brand-red-100 text-brand-red-800',
};

export default async function EmployerApplicationsPage() {
  const { user } = await requireRole(['employer', 'admin']);
  const supabase = await createClient();

  const { data: jobs } = await supabase
    .from('job_postings')
    .select('id, title, status, created_at')
    .eq('employer_id', user.id)
    .order('created_at', { ascending: false });

  const jobIds = (jobs ?? []).map((j: any) => j.id);
  const jobMap = Object.fromEntries((jobs ?? []).map((j: any) => [j.id, j]));

  const { data: applications } = jobIds.length
    ? await supabase
        .from('job_applications')
        .select('id, job_posting_id, applicant_name, applicant_email, status, created_at, updated_at')
        .in('job_posting_id', jobIds)
        .order('created_at', { ascending: false })
    : { data: [] };

  const rows = applications ?? [];
  const pendingCount = rows.filter((r: any) => r.status === 'pending').length;
  const reviewedCount = rows.filter((r: any) => r.status === 'reviewed').length;
  const hiredCount = rows.filter((r: any) => r.status === 'hired').length;
  const rejectedCount = rows.filter((r: any) => r.status === 'rejected').length;

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-brand-blue-600 mb-1">
              Employer Portal
            </p>
            <h1 className="text-2xl md:text-3xl font-bold text-slate-900">Applications</h1>
            <p className="text-slate-600 mt-1">
              Review applicants across all job postings for {profile.company_name || 'your company'}.
            </p>
          </div>
          <Link
            href="/employer/jobs"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-100"
          >
            <Briefcase className="w-4 h-4" />
            Job Postings
          </Link>
        </div>

        {!profile.verified && (
          <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50 p-4 text-amber-900">
            <p className="font-semibold">Verification pending</p>
            <p className="text-sm mt-1">
              You can review applications now. Complete account verification before making final hiring decisions.
            </p>
          </div>
        )}

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <StatCard label="Pending" value={pendingCount} icon={<Clock className="w-5 h-5 text-amber-600" />} />
          <StatCard label="Reviewed" value={reviewedCount} icon={<Eye className="w-5 h-5 text-blue-600" />} />
          <StatCard label="Hired" value={hiredCount} icon={<span className="w-5 h-5 rounded-full bg-brand-green-600 inline-block flex-shrink-0" aria-hidden="true" />} />
          <StatCard label="Rejected" value={rejectedCount} icon={<XCircle className="w-5 h-5 text-brand-red-600" />} />
        </div>

        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between">
            <h2 className="font-bold text-slate-900">Candidate Queue</h2>
            <span className="text-sm text-slate-500">{rows.length} total applications</span>
          </div>

          {rows.length === 0 ? (
            <div className="p-10 text-center">
              <FileText className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <p className="font-semibold text-slate-800">No applications yet</p>
              <p className="text-sm text-slate-500 mt-1">
                Publish active job postings to start receiving applications.
              </p>
              <div className="mt-5">
                <Link
                  href="/employer/post-job"
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-brand-blue-600 text-white hover:bg-brand-blue-700"
                >
                  Post a Job
                </Link>
              </div>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {rows.map((app: any) => {
                const posting = jobMap[app.job_posting_id];
                return (
                  <div key={app.id} className="px-5 py-4 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                    <div>
                      <p className="font-semibold text-slate-900">{app.applicant_name || 'Applicant'}</p>
                      <p className="text-sm text-slate-600">{app.applicant_email || 'Email not provided'}</p>
                      <p className="text-sm text-slate-700 mt-1">
                        {posting?.title || 'Job posting'}
                        {' · '}
                        {app.created_at ? new Date(app.created_at).toLocaleDateString() : 'Unknown date'}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span
                        className={`text-xs font-semibold px-2.5 py-1 rounded-full ${STATUS_STYLE[app.status] || 'bg-slate-100 text-slate-700'}`}
                      >
                        {app.status || 'pending'}
                      </span>
                      {posting?.id && (
                        <Link
                          href={`/employer/postings/${posting.id}`}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-slate-300 text-slate-700 hover:bg-slate-100 text-sm"
                        >
                          <Eye className="w-4 h-4" />
                          View Posting
                        </Link>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, icon }: { label: string; value: number; icon: React.ReactNode }) {
  return (
    <div className="bg-white border border-slate-200 rounded-xl p-4">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm text-slate-600">{label}</span>
        {icon}
      </div>
      <p className="text-2xl font-extrabold text-slate-900">{value}</p>
    </div>
  );
}
