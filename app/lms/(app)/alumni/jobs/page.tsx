import { Metadata } from 'next';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { Briefcase, MapPin, DollarSign, Wifi } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { getActiveJobs, formatSalary, jobTypeLabel, jobTypeBadge } from '@/lib/data/jobs';
import JobCard from '@/components/jobs/JobCard';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Job Board | Alumni | Elevate LMS',
  description: 'Exclusive job opportunities from Elevate employer partners for graduates and alumni.',
};

export default async function AlumniJobsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login?redirect=/lms/alumni/jobs');

  const jobs = await getActiveJobs({ limit: 30 });

  return (
    <div className="min-h-screen bg-white">
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-5xl mx-auto px-4 py-6">
          <p className="text-xs font-bold uppercase tracking-widest text-brand-blue-600 mb-1">Alumni</p>
          <h1 className="text-2xl font-bold text-slate-900">Job Board</h1>
          <p className="text-slate-500 text-sm mt-1">
            Opportunities from Elevate employer partners — open to graduates and current learners.
          </p>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-8">
        {jobs.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white py-16 px-8 text-center">
            <Briefcase className="w-10 h-10 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-600 font-medium">No job postings available right now.</p>
            <p className="text-slate-500 text-sm mt-1">New opportunities are added regularly as employer partners post openings.</p>
            <Link href="/career-services" className="mt-4 inline-block text-sm text-brand-blue-600 hover:underline font-medium">
              Visit Career Services →
            </Link>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between mb-5">
              <p className="text-sm text-slate-500">{jobs.length} open position{jobs.length !== 1 ? 's' : ''}</p>
              <Link href="/career-services/networking-events" className="text-sm text-brand-blue-600 hover:underline">
                Upcoming career fairs →
              </Link>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              {jobs.map(job => <JobCard key={job.id} job={job} showApply href={`/lms/alumni/jobs/${job.id}`} />)}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
