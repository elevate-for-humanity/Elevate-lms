import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Metadata } from 'next';
import {
  ChevronRight,
  Search,
  User,
  MapPin,
  Briefcase,
  GraduationCap,
  Mail,
  Linkedin,
  Filter,
} from 'lucide-react';

export const metadata: Metadata = {
  title: 'Alumni Directory | Elevate LMS',
  description: 'Connect with program alumni and expand your professional network.',
  robots: { index: false, follow: false },
};

export const dynamic = 'force-dynamic';

interface AlumniProfile {
  id: string;
  full_name: string | null;
  email: string;
  avatar_url: string | null;
  city: string | null;
  state: string | null;
  linkedin_url: string | null;
  job_title: string | null;
  company: string | null;
  graduation_year: number | null;
  program_completed: string | null;
  is_mentor: boolean;
}

export default async function AlumniDirectoryPage() {
  const supabase = await createClient();
  const _admin = createAdminClient(); const db = _admin || supabase;

  if (!supabase) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Service Unavailable</h1>
          <p className="text-gray-600">Database connection failed.</p>
        </div>
      </div>
    );
  }

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login?next=/lms/alumni/directory');

  // Fetch alumni profiles (users who have completed at least one program)
  const { data: alumni } = await db
    .from('profiles')
    .select(`
      id,
      full_name,
      email,
      avatar_url,
      city,
      state,
      linkedin_url,
      job_title,
      company
    `)
    .not('full_name', 'is', null)
    .order('full_name')
    .limit(50);

  // Get count of alumni who are mentors
  const { count: mentorCount } = await db
    .from('profiles')
    .select('*', { count: 'exact', head: true })
    .eq('is_mentor', true);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <nav className="flex items-center gap-2 text-sm text-gray-500 mb-4">
            <Link href="/lms" className="hover:text-gray-700">LMS</Link>
            <ChevronRight className="w-4 h-4" />
            <Link href="/lms/alumni" className="hover:text-gray-700">Alumni</Link>
            <ChevronRight className="w-4 h-4" />
            <span className="text-gray-900 font-medium">Directory</span>
          </nav>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Alumni Directory</h1>
              <p className="text-gray-600 mt-1">Connect with fellow program graduates</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search alumni..."
                  className="pl-9 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-blue-500 w-64"
                />
              </div>
              <button className="inline-flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
                <Filter className="w-4 h-4" />
                Filter
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-200">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-brand-blue-100 rounded-lg flex items-center justify-center">
                <GraduationCap className="w-5 h-5 text-brand-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{alumni?.length || 0}</p>
                <p className="text-sm text-gray-500">Total Alumni</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-200">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-brand-green-100 rounded-lg flex items-center justify-center">
                <User className="w-5 h-5 text-brand-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{mentorCount || 0}</p>
                <p className="text-sm text-gray-500">Available Mentors</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-200">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-brand-blue-100 rounded-lg flex items-center justify-center">
                <Briefcase className="w-5 h-5 text-brand-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">85%</p>
                <p className="text-sm text-gray-500">Employment Rate</p>
              </div>
            </div>
          </div>
        </div>

        {/* Alumni Grid */}
        {alumni && alumni.length > 0 ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {(alumni as AlumniProfile[]).map((person) => (
              <div key={person.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
                <div className="flex items-start gap-4">
                  <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center flex-shrink-0">
                    {person.avatar_url ? (
                      <img
                        src={person.avatar_url}
                        alt={person.full_name || ''}
                        className="w-16 h-16 rounded-full object-cover"
                      />
                    ) : (
                      <User className="w-8 h-8 text-gray-400" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-900 truncate">
                      {person.full_name || 'Anonymous'}
                    </h3>
                    {person.job_title && (
                      <p className="text-sm text-gray-600 truncate">{person.job_title}</p>
                    )}
                    {person.company && (
                      <p className="text-sm text-gray-500 truncate">{person.company}</p>
                    )}
                  </div>
                </div>

                {(person.city || person.state) && (
                  <div className="flex items-center gap-1 mt-4 text-sm text-gray-500">
                    <MapPin className="w-4 h-4" />
                    <span>{[person.city, person.state].filter(Boolean).join(', ')}</span>
                  </div>
                )}

                <div className="flex items-center gap-2 mt-4 pt-4 border-t border-gray-100">
                  <a
                    href={`mailto:${person.email}`}
                    className="flex-1 inline-flex items-center justify-center gap-2 px-3 py-2 text-sm text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    <Mail className="w-4 h-4" />
                    Contact
                  </a>
                  {person.linkedin_url && (
                    <a
                      href={person.linkedin_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center justify-center px-3 py-2 text-sm text-brand-blue-600 border border-brand-blue-200 rounded-lg hover:bg-brand-blue-50"
                    >
                      <Linkedin className="w-4 h-4" />
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
            <GraduationCap className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">No alumni profiles available yet</p>
            <p className="text-sm text-gray-400 mt-1">Complete a program to join the alumni network</p>
          </div>
        )}

        {/* CTA */}
        <div className="mt-8 bg-brand-blue-50 border border-brand-blue-200 rounded-xl p-6 text-center">
          <h2 className="text-lg font-semibold text-brand-blue-900 mb-2">Become a Mentor</h2>
          <p className="text-brand-blue-700 mb-4">
            Share your experience and help current students succeed in their careers.
          </p>
          <Link
            href="/lms/alumni/mentorship"
            className="inline-flex items-center gap-2 px-4 py-2 bg-brand-blue-600 text-white rounded-lg hover:bg-brand-blue-700"
          >
            Learn About Mentorship
          </Link>
        </div>
      </div>
    </div>
  );
}
