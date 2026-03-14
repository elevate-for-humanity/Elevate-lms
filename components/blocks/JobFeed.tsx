// Server component — fetches active job postings from Supabase
import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';

interface JobFeedProps {
  limit?: number;
  heading?: string;
  employer_id?: string;  // optionally scope to one employer
}

export default async function JobFeed({
  limit = 6,
  heading = 'Open Positions',
  employer_id,
}: JobFeedProps) {
  const supabase = await createClient();

  let query = supabase
    .from('jobs')
    .select('id, title, employer_name, location, type, slug')
    .eq('status', 'active')
    .order('created_at', { ascending: false })
    .limit(limit);

  if (employer_id) query = query.eq('employer_id', employer_id);

  const { data: jobs } = await query;

  return (
    <section className="py-12 px-4 bg-slate-50">
      <div className="max-w-5xl mx-auto">
        <h2 className="text-2xl font-bold mb-8 text-slate-800">{heading}</h2>
        {!jobs || jobs.length === 0 ? (
          <p className="text-slate-500">No open positions at this time.</p>
        ) : (
          <div className="flex flex-col gap-3">
            {jobs.map((job) => (
              <Link
                key={job.id}
                href={job.slug ? `/jobs/${job.slug}` : '#'}
                className="flex items-center justify-between p-5 bg-white border border-slate-200 rounded-xl hover:border-brand-blue-400 hover:shadow-md transition-all"
              >
                <div>
                  <h3 className="font-semibold text-slate-800">{job.title}</h3>
                  <p className="text-sm text-slate-500">
                    {job.employer_name}
                    {job.location ? ` · ${job.location}` : ''}
                    {job.type ? ` · ${job.type}` : ''}
                  </p>
                </div>
                <span className="text-brand-blue-600 text-sm font-medium shrink-0 ml-4">
                  Apply →
                </span>
              </Link>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
