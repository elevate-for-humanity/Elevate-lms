import { Metadata } from 'next';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { 
  Briefcase, Plus, Eye, Edit, Trash2, Users, Clock, 
  MapPin, DollarSign, MoreVertical, Search, Filter, ArrowRight
} from 'lucide-react';

export const metadata: Metadata = {
  title: 'Job Postings | Employer Portal | Elevate For Humanity',
  description: 'Manage your job postings and track applications.',
  robots: { index: false, follow: false },
};

export const dynamic = 'force-dynamic';

export default async function JobPostingsPage() {
  const supabase = await createClient();

  if (!supabase) {
    redirect('/login?redirect=/employer-portal/jobs');
  }

  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login?redirect=/employer-portal/jobs');
  }

  const jobs = [
    {
      id: 1,
      title: 'Certified Nursing Assistant (CNA)',
      location: 'Indianapolis, IN',
      type: 'Full-time',
      salary: '$15-18/hr',
      applications: 12,
      views: 245,
      status: 'Active',
      posted: '5 days ago',
      image: '/images/employers/partnership-hiring-event.jpg',
    },
    {
      id: 2,
      title: 'Licensed Barber',
      location: 'Chicago, IL',
      type: 'Full-time',
      salary: '$40-60k/year',
      applications: 8,
      views: 189,
      status: 'Active',
      posted: '1 week ago',
      image: '/images/misc/barber-hero.jpg',
    },
    {
      id: 3,
      title: 'HVAC Technician',
      location: 'Detroit, MI',
      type: 'Full-time',
      salary: '$22-28/hr',
      applications: 5,
      views: 156,
      status: 'Active',
      posted: '2 weeks ago',
      image: '/images/shop/safety-glasses.jpg',
    },
    {
      id: 4,
      title: 'CDL Driver - Class A',
      location: 'Columbus, OH',
      type: 'Full-time',
      salary: '$55-70k/year',
      applications: 15,
      views: 312,
      status: 'Paused',
      posted: '3 weeks ago',
      image: '/images/misc/cdl-course.jpg',
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
            <Breadcrumbs items={[{ label: "Employer Portal", href: "/employer-portal" }, { label: "Jobs" }]} />
{/* Header */}
      <section className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Job Postings</h1>
              <p className="text-gray-600 mt-1">Manage your open positions and track applications</p>
            </div>
            <Link
              href="/employer-portal/jobs/new"
              className="inline-flex items-center gap-2 px-6 py-3 bg-brand-blue-600 text-white font-semibold rounded-lg hover:bg-brand-blue-700 transition-colors"
            >
              <Plus className="w-5 h-5" />
              Post New Job
            </Link>
          </div>
        </div>
      </section>

      {/* Filters */}
      <section className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search jobs..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-blue-500"
              />
            </div>
            <div className="flex gap-3">
              <select className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-blue-500">
                <option>All Status</option>
                <option>Active</option>
                <option>Paused</option>
                <option>Closed</option>
              </select>
              <button className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center gap-2">
                <Filter className="w-4 h-4" />
                More Filters
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Jobs List */}
      <section className="py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="space-y-4">
            {jobs.map((job) => (
              <div key={job.id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow">
                <div className="flex flex-col md:flex-row">
                  <div className="relative w-full md:w-48 h-48 md:h-auto flex-shrink-0">
                    <Image
                      src={job.image}
                      alt={job.title}
                      fill
                      className="object-cover"
                    />
                  </div>
                  <div className="flex-1 p-6">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-xl font-bold text-gray-900">{job.title}</h3>
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                            job.status === 'Active' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                          }`}>
                            {job.status}
                          </span>
                        </div>
                        <div className="flex flex-wrap items-center gap-4 text-gray-500 text-sm">
                          <span className="flex items-center gap-1">
                            <MapPin className="w-4 h-4" />
                            {job.location}
                          </span>
                          <span className="flex items-center gap-1">
                            <Briefcase className="w-4 h-4" />
                            {job.type}
                          </span>
                          <span className="flex items-center gap-1">
                            <DollarSign className="w-4 h-4" />
                            {job.salary}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-4 h-4" />
                            Posted {job.posted}
                          </span>
                        </div>
                      </div>
                      <button className="p-2 hover:bg-gray-100 rounded-lg">
                        <MoreVertical className="w-5 h-5 text-gray-400" />
                      </button>
                    </div>

                    <div className="flex items-center gap-6 mt-6">
                      <div className="flex items-center gap-2">
                        <Users className="w-5 h-5 text-brand-blue-600" />
                        <span className="font-semibold text-gray-900">{job.applications}</span>
                        <span className="text-gray-500">applications</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Eye className="w-5 h-5 text-gray-400" />
                        <span className="font-semibold text-gray-900">{job.views}</span>
                        <span className="text-gray-500">views</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 mt-6">
                      <Link
                        href={`/employer-portal/jobs/${job.id}/applications`}
                        className="px-4 py-2 bg-brand-blue-600 text-white font-medium rounded-lg hover:bg-brand-blue-700 transition-colors"
                      >
                        View Applications
                      </Link>
                      <Link
                        href={`/employer-portal/jobs/${job.id}/edit`}
                        className="px-4 py-2 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2"
                      >
                        <Edit className="w-4 h-4" />
                        Edit
                      </Link>
                      <button className="px-4 py-2 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2">
                        <Trash2 className="w-4 h-4" />
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {jobs.length === 0 && (
            <div className="text-center py-16">
              <Briefcase className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No job postings yet</h3>
              <p className="text-gray-600 mb-6">Create your first job posting to start receiving applications.</p>
              <Link
                href="/employer-portal/jobs/new"
                className="inline-flex items-center gap-2 px-6 py-3 bg-brand-blue-600 text-white font-semibold rounded-lg hover:bg-brand-blue-700 transition-colors"
              >
                <Plus className="w-5 h-5" />
                Post Your First Job
              </Link>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
