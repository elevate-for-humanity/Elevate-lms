import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';

type Props = {
  params: Promise<{ id: string }>;
};

export default async function EmployerPostingDetailPage({ params }: Props) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: posting } = await supabase
    .from('job_postings')
    .select('*')
    .eq('id', id)
    .eq('employer_id', user.id)
    .single();

  if (!posting) notFound();

  const { data: applications } = await supabase
    .from('job_applications')
    .select('id, status, created_at, applicant_name, applicant_email')
    .eq('job_posting_id', id)
    .order('created_at', { ascending: false });

  const statusColors: Record<string, string> = {
    pending: 'bg-yellow-100 text-yellow-800',
    reviewed: 'bg-blue-100 text-blue-800',
    hired: 'bg-green-100 text-green-800',
    rejected: 'bg-red-100 text-red-800',
  };

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-4xl mx-auto px-6 py-10 space-y-6">
        <nav className="text-sm text-gray-500">
          <ol className="flex items-center gap-2">
            <li><Link href="/employer/dashboard" className="hover:text-gray-900">Employer</Link></li>
            <li>/</li>
            <li><Link href="/employer/jobs" className="hover:text-gray-900">Jobs</Link></li>
            <li>/</li>
            <li className="text-gray-900 font-medium">{posting.job_title}</li>
          </ol>
        </nav>

        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{posting.job_title}</h1>
            <p className="text-gray-500 mt-1">{posting.location ?? 'Location not specified'}</p>
          </div>
          <Link
            href={`/employer/postings/${id}/edit`}
            className="px-4 py-2 rounded-lg border text-sm font-semibold text-gray-700 hover:bg-gray-50 whitespace-nowrap"
          >
            Edit Job
          </Link>
        </div>

        <div className="rounded-xl border p-6">
          <h2 className="text-lg font-semibold mb-3">Job Description</h2>
          <p className="text-gray-700 whitespace-pre-wrap">
            {posting.job_description || 'No description provided.'}
          </p>
        </div>

        <div className="rounded-xl border p-6">
          <h2 className="text-lg font-semibold mb-4">
            Applications ({(applications ?? []).length})
          </h2>
          {(applications ?? []).length === 0 ? (
            <p className="text-gray-500 text-sm">No applications yet.</p>
          ) : (
            <div className="space-y-3">
              {(applications ?? []).map((app: any) => (
                <div key={app.id} className="flex items-center justify-between rounded-lg border p-4">
                  <div>
                    <p className="font-medium text-gray-900">
                      {app.applicant_name || 'Applicant'}
                    </p>
                    {app.applicant_email && (
                      <p className="text-sm text-gray-500">{app.applicant_email}</p>
                    )}
                    <p className="text-xs text-gray-400 mt-0.5">
                      {new Date(app.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${statusColors[app.status] ?? 'bg-gray-100 text-gray-600'}`}>
                    {app.status ?? 'pending'}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        <Link
          href="/employer/jobs"
          className="inline-block px-5 py-2.5 rounded-lg border text-sm font-semibold text-gray-700 hover:bg-gray-50"
        >
          ← Back to Jobs
        </Link>
      </div>
    </div>
  );
}
