export const dynamic = 'force-dynamic';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import Link from 'next/link';

import { Metadata } from 'next';
import { requireRole } from '@/lib/auth/require-role';
import { createClient } from '@/lib/supabase/server';
import { PLATFORM_DEFAULTS } from '@/lib/config/platform-config';

export const metadata: Metadata = {
  title: 'Job Postings',
  description: 'Manage your job postings',
};

export default async function EmployerPostingsPage() {
  const { user } = await requireRole(['employer', 'admin', 'super_admin']);
  const supabase = await createClient();

  const { data: postings } = await supabase
    .from('job_postings')
    .select('*')
    .eq('employer_id', user.id)
    .order('created_at', { ascending: false });

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-7xl mx-auto px-4 py-4">
        <Breadcrumbs items={[{ label: 'Employer', href: '/employer' }, { label: 'Postings' }]} />
      </div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Job Postings</h1>
      </div>

      {!postings || postings.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm border p-8 text-center">
          <h2 className="text-2xl font-bold text-black mb-4">Create Your First Job Posting</h2>
          <p className="text-black mb-6">
            Post jobs and connect with qualified candidates from our training programs.
          </p>
          <div className="grid md:grid-cols-3 gap-4 mb-8 text-left">
            <div className="border rounded-lg p-4">
              <div className="text-blue-600 font-semibold mb-2">1. Create Posting</div>
              <p className="text-sm text-black">Add job details, requirements, and compensation</p>
            </div>
            <div className="border rounded-lg p-4">
              <div className="text-blue-600 font-semibold mb-2">2. Review Applications</div>
              <p className="text-sm text-black">Get matched with qualified candidates</p>
            </div>
            <div className="border rounded-lg p-4">
              <div className="text-blue-600 font-semibold mb-2">3. Hire Talent</div>
              <p className="text-sm text-black">Schedule interviews and make offers</p>
            </div>
          </div>
          <Link
            href="/employer/post-job"
            className="inline-block bg-blue-600 text-white px-8 py-3 rounded-lg hover:bg-blue-700 transition-colors font-semibold"
          >
            Post a Job
          </Link>
          <p className="text-slate-500 text-sm mt-4">
            Or contact us at{' '}
            <a href={`tel:${PLATFORM_DEFAULTS.supportPhone}`} className="text-blue-600 hover:underline">
              {PLATFORM_DEFAULTS.supportPhone}
            </a>{' '}
            for assistance
          </p>
        </div>
      ) : (
        <div className="grid gap-4">
          {postings.map((posting) => (
            <div key={posting.id} className="bg-white rounded-lg shadow-sm border p-6">
              <h3 className="text-xl font-semibold mb-2">{posting.title}</h3>
              <p className="text-black mb-4">{posting.description}</p>
              <div className="flex gap-4 text-sm text-slate-500">
                <span>Status: {posting.status}</span>
                <span>Applications: {posting.application_count || 0}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
