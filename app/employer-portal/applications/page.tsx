import { Metadata } from 'next';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { 
  FileText, Search, Filter, Clock, XCircle,
  Eye, MessageSquare, Calendar, Star, MapPin, ChevronRight
} from 'lucide-react';

export const metadata: Metadata = {
  title: 'Applications | Employer Portal | Elevate For Humanity',
  description: 'Review and manage job applications from candidates.',
  robots: { index: false, follow: false },
};

export const dynamic = 'force-dynamic';

export default async function ApplicationsPage() {
  const supabase = await createClient();


  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login?redirect=/employer-portal/applications');
  }

  // Fetch real job applications
  const { data: jobApplications } = await supabase
    .from('job_applications')
    .select(`
      id,
      status,
      created_at,
      user_id,
      job_id,
      profiles!job_applications_user_id_fkey(full_name, city, state),
      jobs(title)
    `)
    .order('created_at', { ascending: false })
    .limit(20);

  const applications = jobApplications?.map((app: any) => {
    const createdAt = new Date(app.created_at);
    const now = new Date();
    const diffHours = Math.floor((now.getTime() - createdAt.getTime()) / 3600000);
    const diffDays = Math.floor(diffHours / 24);
    const appliedDate = diffHours < 24 ? `${diffHours} hours ago` : diffDays < 7 ? `${diffDays} days ago` : `${Math.floor(diffDays / 7)} weeks ago`;
    
    return {
      id: app.id,
      candidate: { 
        name: app.profiles?.full_name || 'Applicant', 
        image: null 
      },
      position: app.jobs?.title || 'Position',
      status: app.status || 'New',
      appliedDate,
      rating: 0,
      location: app.profiles?.city && app.profiles?.state ? `${app.profiles.city}, ${app.profiles.state}` : 'Not specified',
    };
  }) || [];



  const statusColors: Record<string, string> = {
    'New': 'bg-brand-blue-100 text-brand-blue-700',
    'Reviewed': 'bg-yellow-100 text-yellow-700',
    'Interview': 'bg-brand-blue-100 text-brand-blue-700',
    'Offered': 'bg-brand-green-100 text-brand-green-700',
    'Rejected': 'bg-brand-red-100 text-brand-red-700',
  };

  const newCount = applications.filter(a => a.status === 'New').length;
  const reviewCount = applications.filter(a => a.status === 'Reviewed').length;
  const interviewCount = applications.filter(a => a.status === 'Interview').length;
  const offeredCount = applications.filter(a => a.status === 'Offered').length;

  const stats = [
    { label: 'Total', count: applications.length, color: 'text-gray-900' },
    { label: 'New', count: newCount, color: 'text-brand-blue-600' },
    { label: 'In Review', count: reviewCount, color: 'text-yellow-600' },
    { label: 'Interview', count: interviewCount, color: 'text-brand-blue-600' },
    { label: 'Offered', count: offeredCount, color: 'text-brand-green-600' },
  ];

  return (
    <div className="min-h-screen bg-white">
            <Breadcrumbs items={[{ label: "Employer Portal", href: "/employer-portal" }, { label: "Applications" }]} />
{/* Header */}
      <section className="border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center gap-3 mb-2">
            <FileText className="w-8 h-8 text-brand-blue-600" />
            <h1 className="text-3xl font-bold text-gray-900">Applications</h1>
          </div>
          <p className="text-gray-600">Review and manage applications from candidates</p>
        </div>
      </section>

      {/* Stats */}
      <section className="border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex gap-8 overflow-x-auto">
            {stats.map((stat, index) => (
              <button key={index} className="flex items-center gap-2 whitespace-nowrap">
                <span className={`text-2xl font-bold ${stat.color}`}>{stat.count}</span>
                <span className="text-gray-500">{stat.label}</span>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Filters */}
      <section className="border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search applications..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-blue-500"
              />
            </div>
            <div className="flex gap-3">
              <select className="px-4 py-2 border border-gray-300 rounded-lg">
                <option>All Status</option>
                <option>New</option>
                <option>Reviewed</option>
                <option>Interview</option>
                <option>Offered</option>
              </select>
              <select className="px-4 py-2 border border-gray-300 rounded-lg">
                <option>All Positions</option>
                <option>CNA</option>
                <option>Barber</option>
                <option>HVAC Tech</option>
              </select>
            </div>
          </div>
        </div>
      </section>

      {/* Applications List */}
      <section className="py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            {applications.map((app, index) => (
              <div key={app.id} className={`flex items-center gap-4 p-4 hover:bg-white ${index !== applications.length - 1 ? 'border-b border-gray-100' : ''}`}>
                <div className="relative w-12 h-12 rounded-full overflow-hidden flex-shrink-0">
                  <Image
                    src={app.candidate.image}
                    alt={app.candidate.name}
                    fill
                    className="object-cover"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3">
                    <h3 className="font-semibold text-gray-900">{app.candidate.name}</h3>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColors[app.status]}`}>
                      {app.status}
                    </span>
                  </div>
                  <p className="text-gray-600 text-sm">{app.position}</p>
                  <div className="flex items-center gap-4 mt-1 text-sm text-gray-500">
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3 h-3" />
                      {app.location}
                    </span>
                    <span className="flex items-center gap-1">
                      <Star className="w-3 h-3 text-yellow-400" />
                      {app.rating}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {app.appliedDate}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button className="p-2 hover:bg-white rounded-lg" title="View">
                    <Eye className="w-5 h-5 text-gray-400" />
                  </button>
                  <button className="p-2 hover:bg-white rounded-lg" title="Message">
                    <MessageSquare className="w-5 h-5 text-gray-400" />
                  </button>
                  <button className="p-2 hover:bg-white rounded-lg" title="Schedule">
                    <Calendar className="w-5 h-5 text-gray-400" />
                  </button>
                  <Link
                    href={`/employer-portal/applications/${app.id}`}
                    className="px-4 py-2 bg-brand-blue-600 text-white text-sm font-medium rounded-lg hover:bg-brand-blue-700"
                  >
                    Review
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
