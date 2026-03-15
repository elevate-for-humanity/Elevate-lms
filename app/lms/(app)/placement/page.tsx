import { Metadata } from 'next';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Briefcase, Users, Calendar, Building2, ArrowRight } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { getActiveJobs } from '@/lib/data/jobs';
import JobCard from '@/components/jobs/JobCard';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Job Placement | Career Services | Elevate LMS',
  description: 'Career placement support, job opportunities, and employer connections for Elevate graduates.',
};

export default async function PlacementPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login?redirect=/lms/placement');

  const db = createAdminClient();

  // Fetch jobs + learner's enrolled programs for context
  const [jobs, profileResult] = await Promise.all([
    getActiveJobs({ limit: 12 }),
    supabase.from('profiles').select('full_name, role').eq('id', user.id).maybeSingle(),
  ]);

  const profile = profileResult.data;

  // Employer count for stats
  const employerCount = db
    ? await db.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'employer').then(r => r.count ?? 0)
    : 0;

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-5xl mx-auto px-4 py-6">
          <p className="text-xs font-bold uppercase tracking-widest text-brand-blue-600 mb-1">Career Services</p>
          <h1 className="text-2xl font-bold text-slate-900">Job Placement</h1>
          <p className="text-slate-500 text-sm mt-1">
            {profile?.full_name ? `Welcome, ${profile.full_name.split(' ')[0]}. ` : ''}
            Connect with employers and find your next opportunity.
          </p>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-8 space-y-8">
        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          <div className="bg-white rounded-2xl border border-slate-200 p-5 text-center">
            <p className="text-2xl font-bold text-brand-blue-600">{jobs.length}</p>
            <p className="text-xs text-slate-500 mt-1">Open Positions</p>
          </div>
          <div className="bg-white rounded-2xl border border-slate-200 p-5 text-center">
            <p className="text-2xl font-bold text-brand-blue-600">{employerCount}</p>
            <p className="text-xs text-slate-500 mt-1">Employer Partners</p>
          </div>
          <div className="bg-white rounded-2xl border border-slate-200 p-5 text-center col-span-2 sm:col-span-1">
            <p className="text-2xl font-bold text-brand-green-600">Free</p>
            <p className="text-xs text-slate-500 mt-1">Placement Support</p>
          </div>
        </div>

        {/* Career services links */}
        <div className="grid sm:grid-cols-3 gap-4">
          {[
            { icon: Calendar, label: 'Career Fairs', desc: 'Meet employers in person', href: '/career-services/networking-events' },
            { icon: Users, label: 'Resume Review', desc: 'Get feedback from advisors', href: '/career-services' },
            { icon: Building2, label: 'Employer Directory', desc: 'Browse hiring partners', href: '/directory' },
          ].map(({ icon: Icon, label, desc, href }) => (
            <Link key={label} href={href} className="group bg-white rounded-2xl border border-slate-200 p-4 hover:border-brand-blue-200 hover:shadow-sm transition-all flex items-center gap-3">
              <div className="w-10 h-10 bg-brand-blue-50 rounded-xl flex items-center justify-center flex-shrink-0">
                <Icon className="w-5 h-5 text-brand-blue-600" />
              </div>
              <div>
                <p className="font-semibold text-slate-900 text-sm">{label}</p>
                <p className="text-xs text-slate-500">{desc}</p>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-brand-blue-500 ml-auto transition-colors" />
            </Link>
          ))}
        </div>

        {/* Job listings */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-slate-900">Open Positions</h2>
            <Link href="/lms/alumni/jobs" className="text-sm text-brand-blue-600 hover:underline">View all →</Link>
          </div>
          {jobs.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-white py-12 px-8 text-center">
              <Briefcase className="w-8 h-8 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-600 font-medium">No open positions right now.</p>
              <p className="text-slate-500 text-sm mt-1">New opportunities are added regularly.</p>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {jobs.map(job => <JobCard key={job.id} job={job} showApply href={`/lms/alumni/jobs/${job.id}`} />)}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
