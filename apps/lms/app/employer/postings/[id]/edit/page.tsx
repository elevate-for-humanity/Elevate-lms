import { updateEmployerPosting } from './actions';
import { getEmployerRecord } from '@/lib/employer/employer-context';
import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

type Props = {
  params: Promise<{ id: string }>;
};

export default async function EmployerPostingEditPage({ params }: Props) {
  const { id } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');
  const employer = await getEmployerRecord(supabase, user.id);
  if (!employer) redirect('/employer/onboarding');

  const { data: posting } = await supabase
    .from('job_postings')
    .select('*')
    .eq('id', id)
    .eq('employer_id', employer.id)
    .maybeSingle();

  if (!posting) notFound();

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-3xl mx-auto px-6 py-10 space-y-6">
        <nav className="text-sm text-slate-700">
          <ol className="flex items-center gap-2">
            <li>
              <Link href="/employer/dashboard" className="hover:text-slate-900">
                Employer
              </Link>
            </li>
            <li>/</li>
            <li>
              <Link href="/employer/jobs" className="hover:text-slate-900">
                Jobs
              </Link>
            </li>
            <li>/</li>
            <li>
              <Link href={`/employer/postings/${id}`} className="hover:text-slate-900">
                {(posting.title || posting.job_title)}
              </Link>
            </li>
            <li>/</li>
            <li className="text-slate-900 font-medium">Edit</li>
          </ol>
        </nav>

        <h1 className="text-3xl font-bold text-slate-900">Edit Job Posting</h1>

        <form action={updateEmployerPosting.bind(null, id)} className="space-y-6">
          <div>
            <label className="block text-sm font-semibold text-slate-900 mb-1">Job Title</label>
            <input
              type="text"
              name="title"
              defaultValue={(posting.title || posting.job_title) ?? ''}
              className="w-full px-4 py-3 border rounded-lg text-slate-900"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-900 mb-1">Location</label>
            <input
              type="text"
              name="location"
              defaultValue={posting.location ?? ''}
              className="w-full px-4 py-3 border rounded-lg text-slate-900"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-900 mb-1">
              Job Description
            </label>
            <textarea
              name="description"
              defaultValue={(posting.description || posting.job_description) ?? ''}
              rows={10}
              className="w-full px-4 py-3 border rounded-lg text-slate-900"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-900 mb-1">Status</label>
            <select
              name="status"
              defaultValue={['paused', 'closed'].includes(posting.status) ? posting.status : 'pending'}
              className="w-full px-4 py-3 border rounded-lg text-slate-900"
            >
              <option value="pending">Submit for review</option>
              <option value="paused">Paused</option>
              <option value="closed">Closed</option>
            </select>
          </div>

          <div className="flex gap-4">
            <Link
              href={`/employer/postings/${id}`}
              className="flex-1 text-center px-5 py-3 rounded-lg border text-sm font-semibold text-slate-900 hover:bg-slate-50"
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
