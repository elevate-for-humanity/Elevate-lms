import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';

type Props = {
  params: Promise<{ id: string }>;
};

export default async function EmployerPostingEditPage({ params }: Props) {
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

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-3xl mx-auto px-6 py-10 space-y-6">
        <nav className="text-sm text-gray-500">
          <ol className="flex items-center gap-2">
            <li><Link href="/employer/dashboard" className="hover:text-gray-900">Employer</Link></li>
            <li>/</li>
            <li><Link href="/employer/jobs" className="hover:text-gray-900">Jobs</Link></li>
            <li>/</li>
            <li><Link href={`/employer/postings/${id}`} className="hover:text-gray-900">{posting.job_title}</Link></li>
            <li>/</li>
            <li className="text-gray-900 font-medium">Edit</li>
          </ol>
        </nav>

        <h1 className="text-3xl font-bold text-gray-900">Edit Job Posting</h1>

        <form action={`/api/employer/postings/${id}`} method="POST" className="space-y-6">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Job Title</label>
            <input
              type="text"
              name="job_title"
              defaultValue={posting.job_title ?? ''}
              className="w-full px-4 py-3 border rounded-lg text-gray-900"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Location</label>
            <input
              type="text"
              name="location"
              defaultValue={posting.location ?? ''}
              className="w-full px-4 py-3 border rounded-lg text-gray-900"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Job Description</label>
            <textarea
              name="job_description"
              defaultValue={posting.job_description ?? ''}
              rows={10}
              className="w-full px-4 py-3 border rounded-lg text-gray-900"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Status</label>
            <select
              name="status"
              defaultValue={posting.status ?? 'active'}
              className="w-full px-4 py-3 border rounded-lg text-gray-900"
            >
              <option value="active">Active</option>
              <option value="paused">Paused</option>
              <option value="closed">Closed</option>
            </select>
          </div>

          <div className="flex gap-4">
            <Link
              href={`/employer/postings/${id}`}
              className="flex-1 text-center px-5 py-3 rounded-lg border text-sm font-semibold text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </Link>
            <button
              type="submit"
              className="flex-1 px-5 py-3 rounded-lg bg-brand-green-600 text-white text-sm font-semibold hover:bg-brand-green-700"
            >
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
