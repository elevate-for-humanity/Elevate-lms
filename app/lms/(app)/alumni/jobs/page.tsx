import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Metadata } from 'next';
import { Briefcase, MapPin, Clock, DollarSign, Building } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Job Board | Alumni',
  description: 'Exclusive job opportunities for alumni.',
};

export const dynamic = 'force-dynamic';

export default async function AlumniJobsPage() {
  const supabase = await createClient();
  const _admin = createAdminClient(); const db = _admin || supabase;
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) redirect('/login?next=/lms/alumni/jobs');

  // Fetch job postings from database
  const { data: jobs, error } = await db
    .from('job_postings')
    .select(`
      id,
      title,
      company,
      location,
      salary_range,
      job_type,
      description,
      requirements,
      is_active,
      created_at
    `)
    .eq('is_active', true)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching jobs:', error.message);
  }

  const jobList = jobs || [];

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Alumni Job Board</h1>
          <p className="text-gray-600 mt-1">Exclusive opportunities from our employer partners</p>
        </div>

        {jobList.length > 0 ? (
          <div className="space-y-4">
            {jobList.map((job: any) => (
              <div key={job.id} className="bg-white rounded-xl border p-6 hover:shadow-lg transition">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-brand-blue-100 rounded-lg flex items-center justify-center">
                      <Building className="w-6 h-6 text-brand-blue-600" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">{job.title}</h3>
                      <p className="text-gray-600">{job.company}</p>
                      <div className="flex flex-wrap items-center gap-4 mt-2 text-sm text-gray-500">
                        <span className="flex items-center gap-1">
                          <MapPin className="w-4 h-4" />
                          {job.location || 'Remote'}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          {job.job_type || 'Full-time'}
                        </span>
                        {job.salary_range && (
                          <span className="flex items-center gap-1">
                            <DollarSign className="w-4 h-4" />
                            {job.salary_range}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <Link
                    href={`/lms/alumni/jobs/${job.id}`}
                    className="px-4 py-2 bg-brand-blue-600 text-white rounded-lg hover:bg-brand-blue-700 text-sm"
                  >
                    View Details
                  </Link>
                </div>
                {job.description && (
                  <p className="text-gray-600 mt-4 line-clamp-2">{job.description}</p>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-xl border p-12 text-center">
            <Briefcase className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">No job postings yet</h2>
            <p className="text-gray-600 mb-6">Check back soon for exclusive job opportunities from our employer partners.</p>
            <Link 
              href="/lms/alumni"
              className="text-brand-blue-600 hover:underline"
            >
              Return to Alumni Portal
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
