import { Metadata } from 'next';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import Link from 'next/link';
import { Briefcase, FileText, Users, Calendar, Building2 } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Job Placement | LMS',
  description: 'Career services and job placement assistance',
};

export const dynamic = 'force-dynamic';

export default async function PlacementPage() {
  const supabase = await createClient();
  const _admin = createAdminClient();
  const db = _admin || supabase;

  if (!supabase) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <Breadcrumbs items={[{ label: "LMS", href: "/lms/dashboard" }, { label: "Placement" }]} />
        </div>
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Service Unavailable</h1>
          <p className="text-gray-600">Please try again later.</p>
        </div>
      </div>
    );
  }
  const { data: { user } } = await supabase.auth.getUser();

  let placements = null;
  let jobListings = null;

  if (user) {
    const { data: placementData } = await db
      .from('placements')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });
    placements = placementData;
  }

  const { data: jobData } = await db
    .from('job_listings')
    .select('*')
    .eq('is_active', true)
    .order('created_at', { ascending: false })
    .limit(6);
  jobListings = jobData;

  const { count: partnerCount } = await db
    .from('profiles')
    .select('*', { count: 'exact', head: true })
    .eq('role', 'partner');

  const services = [
    { icon: FileText, title: 'Resume Review', desc: 'Professional resume optimization' },
    { icon: Users, title: 'Interview Prep', desc: 'Mock interviews and coaching' },
    { icon: Briefcase, title: 'Job Matching', desc: 'Personalized job recommendations' },
    { icon: Calendar, title: 'Career Counseling', desc: 'One-on-one guidance sessions' },
  ];

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-2">Job Placement Services</h1>
      <p className="text-gray-600 mb-8">Get help finding employment after completing your training.</p>

      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h2 className="text-xl font-semibold mb-4">Services Available</h2>
            <div className="grid sm:grid-cols-2 gap-4">
              {services.map((service) => (
                <div key={service.title} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                  <service.icon className="w-5 h-5 text-brand-blue-600 mt-0.5" />
                  <div>
                    <h3 className="font-medium">{service.title}</h3>
                    <p className="text-sm text-gray-600">{service.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h2 className="text-xl font-semibold mb-4">Job Opportunities</h2>
            {jobListings && jobListings.length > 0 ? (
              <div className="space-y-4">
                {jobListings.map((job: any) => (
                  <div key={job.id} className="border rounded-lg p-4 hover:border-brand-blue-300 transition">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-semibold">{job.title}</h3>
                        <p className="text-sm text-gray-600">{job.company}</p>
                        <p className="text-sm text-gray-500 mt-1">{job.location}</p>
                      </div>
                      <Link href={`/lms/jobs/${job.id}`} className="text-brand-blue-600 text-sm font-medium hover:underline">
                        View
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <Briefcase className="w-10 h-10 mx-auto mb-3 text-gray-300" />
                <p>No job listings available right now.</p>
                <p className="text-sm">Check back soon for new opportunities!</p>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-brand-blue-50 border border-brand-blue-200 rounded-lg p-6">
            <Building2 className="w-8 h-8 text-brand-blue-600 mb-3" />
            <h3 className="font-semibold text-lg mb-2">Employer Partners</h3>
            <p className="text-2xl font-bold text-brand-blue-600">{partnerCount || 50}+</p>
            <p className="text-sm text-gray-600">Companies actively hiring our graduates</p>
          </div>

          {user && placements && placements.length > 0 && (
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h3 className="font-semibold mb-4">Your Placement Status</h3>
              {placements.map((placement: any) => (
                <div key={placement.id} className="flex items-center gap-3 p-3 bg-brand-green-50 rounded-lg">
                  <span className="text-slate-400 flex-shrink-0">•</span>
                  <div>
                    <p className="font-medium">{placement.company}</p>
                    <p className="text-sm text-gray-600">{placement.position}</p>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h3 className="font-semibold mb-3">Need Help?</h3>
            <p className="text-sm text-gray-600 mb-4">
              Contact your program coordinator to schedule a placement consultation.
            </p>
            <Link href="/lms/messages" className="text-brand-blue-600 font-medium text-sm hover:underline">
              Message Career Services
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
