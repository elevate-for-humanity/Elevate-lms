import { Metadata } from 'next';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { 
  Users, Search, Filter, MapPin, Briefcase, GraduationCap,
  Star, MessageSquare, Calendar, Download, ChevronRight
} from 'lucide-react';

export const metadata: Metadata = {
  title: 'Candidates | Employer Portal | Elevate For Humanity',
  description: 'Browse and connect with qualified candidates from our training programs.',
  robots: { index: false, follow: false },
};

export const dynamic = 'force-dynamic';

export default async function CandidatesPage() {
  const supabase = await createClient();
  const _admin = createAdminClient(); const db = _admin || supabase;

  if (!supabase) {
    redirect('/login?redirect=/employer-portal/candidates');
  }

  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login?redirect=/employer-portal/candidates');
  }

  // Fetch real candidates from completed enrollments
  const { data: completedEnrollments } = await db
    .from('program_enrollments')
    .select(`
      id,
      user_id,
      progress,
      created_at,
      profiles!enrollments_user_id_fkey(id, full_name, bio, city, state),
      programs(name)
    `)
    .eq('progress', 100)
    .order('created_at', { ascending: false })
    .limit(20);

  const candidates = completedEnrollments?.map((e: any) => ({
    id: e.user_id,
    name: e.profiles?.full_name || 'Graduate',
    title: e.programs?.name ? `${e.programs.name} Graduate` : 'Program Graduate',
    location: e.profiles?.city && e.profiles?.state ? `${e.profiles.city}, ${e.profiles.state}` : 'Location not specified',
    experience: 'Recent Graduate',
    skills: [],
    rating: 0,
    available: true,
    image: null,
    program: e.programs?.name || 'Training Program',
    graduated: new Date(e.created_at).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
  })) || [];

  const filters = ['All Candidates', 'Healthcare', 'Skilled Trades', 'Transportation', 'Business'];

  return (
    <div className="min-h-screen bg-white">
            <Breadcrumbs items={[{ label: "Employer Portal", href: "/employer-portal" }, { label: "Candidates" }]} />
{/* Hero */}
      <section className="relative h-48 md:h-64 overflow-hidden">
        <Image
          src="/images/pages/employer-portal-page-1.jpg"
          alt="Candidates"
          fill
          className="object-cover"
        />
      </section>

      {/* Search & Filters */}
      <section className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search by name, skill, or location..."
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-green-500"
              />
            </div>
            <div className="flex gap-3">
              <select className="px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-green-500">
                <option>All Programs</option>
                <option>CNA Training</option>
                <option>Barber Apprenticeship</option>
                <option>HVAC Training</option>
                <option>CDL Training</option>
              </select>
              <button className="px-4 py-3 border border-gray-300 rounded-lg hover:bg-white flex items-center gap-2">
                <Filter className="w-4 h-4" />
                Filters
              </button>
            </div>
          </div>
          <div className="flex gap-2 mt-4 overflow-x-auto pb-2">
            {filters.map((filter, index) => (
              <button
                key={index}
                className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap ${
                  index === 0 ? 'bg-brand-green-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-200'
                }`}
              >
                {filter}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Candidates Grid */}
      <section className="py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-6">
            <p className="text-gray-600">{candidates.length} candidates found</p>
            <select className="px-4 py-2 border border-gray-300 rounded-lg text-sm">
              <option>Sort by: Most Relevant</option>
              <option>Sort by: Recently Active</option>
              <option>Sort by: Highest Rated</option>
            </select>
          </div>

          {candidates.length > 0 ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {candidates.map((candidate) => (
              <div key={candidate.id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-lg transition-shadow">
                <div className="p-6">
                  <div className="flex items-start gap-4">
                    <div className="relative w-16 h-16 rounded-full overflow-hidden flex-shrink-0">
                      {candidate.image ? (
                        <Image
                          src={candidate.image}
                          alt={candidate.name}
                          fill
                          className="object-cover"
                        />
                      ) : (
                        <div className="w-full h-full bg-brand-green-500 flex items-center justify-center text-white text-xl font-bold">
                          {candidate.name.charAt(0)}
                        </div>
                      )}
                      {candidate.available && (
                        <div className="absolute bottom-0 right-0 w-4 h-4 bg-brand-green-500 rounded-full border-2 border-white" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-gray-900 truncate">{candidate.name}</h3>
                      <p className="text-gray-600 text-sm">{candidate.title}</p>
                      {candidate.rating > 0 && (
                        <div className="flex items-center gap-1 mt-1">
                          <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                          <span className="font-medium text-gray-900">{candidate.rating}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="mt-4 space-y-2">
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <MapPin className="w-4 h-4" />
                      {candidate.location}
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <Briefcase className="w-4 h-4" />
                      {candidate.experience} experience
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <GraduationCap className="w-4 h-4" />
                      {candidate.program}
                    </div>
                  </div>

                  <div className="mt-4 flex flex-wrap gap-2">
                    {candidate.skills.slice(0, 3).map((skill, index) => (
                      <span key={index} className="px-2 py-1 bg-white text-gray-700 text-xs rounded-full">
                        {skill}
                      </span>
                    ))}
                  </div>

                  <div className="mt-6 flex gap-3">
                    <Link
                      href={`/employer-portal/candidates/${candidate.id}`}
                      className="flex-1 px-4 py-2 bg-brand-green-600 text-white font-medium rounded-lg hover:bg-brand-green-700 transition-colors text-center"
                    >
                      View Profile
                    </Link>
                    <button className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-white transition-colors">
                      <MessageSquare className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
          ) : (
            <div className="bg-white rounded-xl shadow-sm p-12 text-center">
              <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-gray-900 mb-2">No Candidates Yet</h3>
              <p className="text-gray-600">Candidates will appear here as students complete their programs.</p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
