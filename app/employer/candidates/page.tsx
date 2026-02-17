import { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Users, Search, Mail, Phone, Award, MapPin, GraduationCap } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Browse Candidates | Employer Portal',
  description: 'Browse job-ready candidates trained in healthcare, skilled trades, and technology.',
};

export const dynamic = 'force-dynamic';

export default async function CandidatesPage() {
  const supabase = await createClient();

  if (!supabase) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Service Unavailable</h1>
          <p className="text-gray-600">Please try again later.</p>
        </div>
      </div>
    );
  }

  // Auth check
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, verified')
    .eq('id', user.id)
    .single();

  if (!profile || profile.role !== 'employer') {
    redirect('/');
  }

  // Get candidates (students)
  const { data: candidates } = await supabase
    .from('profiles')
    .select('id, full_name, email, phone, city, state, created_at')
    .eq('role', 'student')
    .order('created_at', { ascending: false })
    .limit(50);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Browse Candidates</h1>
              <p className="text-gray-600">Find job-ready workers trained in your industry</p>
            </div>
            <Link
              href="/employer/dashboard"
              className="px-4 py-2 text-gray-600 hover:text-gray-900"
            >
              ← Back to Dashboard
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Search */}
        <div className="bg-white rounded-lg shadow-sm border p-4 mb-6">
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by name, skill, or certification..."
                  className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-brand-blue-500 focus:border-brand-blue-500"
                />
              </div>
            </div>
            <select className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-brand-blue-500">
              <option value="">All Programs</option>
              <option value="healthcare">Healthcare</option>
              <option value="skilled-trades">Skilled Trades</option>
              <option value="technology">Technology</option>
            </select>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow-sm border p-4">
            <div className="flex items-center gap-3">
              <Users className="w-8 h-8 text-brand-blue-600" />
              <div>
                <div className="text-2xl font-bold">{candidates?.length || 0}</div>
                <div className="text-sm text-gray-600">Available Candidates</div>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm border p-4">
            <div className="flex items-center gap-3">
              <Award className="w-8 h-8 text-brand-green-600" />
              <div>
                <div className="text-2xl font-bold">0</div>
                <div className="text-sm text-gray-600">Certified</div>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm border p-4">
            <div className="flex items-center gap-3">
              <GraduationCap className="w-8 h-8 text-brand-blue-600" />
              <div>
                <div className="text-2xl font-bold">0</div>
                <div className="text-sm text-gray-600">Program Graduates</div>
              </div>
            </div>
          </div>
        </div>

        {/* Candidates List */}
        <div className="space-y-4">
          {candidates && candidates.length > 0 ? (
            candidates.map((candidate: any) => (
              <div key={candidate.id} className="bg-white rounded-lg shadow-sm border p-6">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-brand-blue-100 rounded-full flex items-center justify-center">
                      <Users className="w-6 h-6 text-brand-blue-600" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">
                        {candidate.full_name || 'Candidate'}
                      </h3>
                      {(candidate.city || candidate.state) && (
                        <div className="flex items-center gap-1 text-sm text-gray-600 mt-1">
                          <MapPin className="w-4 h-4" />
                          {[candidate.city, candidate.state].filter(Boolean).join(', ')}
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex gap-2">
                    {profile.verified ? (
                      <>
                        {candidate.email && (
                          <a
                            href={`mailto:${candidate.email}`}
                            className="inline-flex items-center gap-2 px-4 py-2 bg-brand-blue-600 text-white rounded-lg hover:bg-brand-blue-700 transition"
                          >
                            <Mail className="w-4 h-4" />
                            Contact
                          </a>
                        )}
                        {candidate.phone && (
                          <a
                            href={`tel:${candidate.phone}`}
                            className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
                          >
                            <Phone className="w-4 h-4" />
                            Call
                          </a>
                        )}
                      </>
                    ) : (
                      <Link
                        href="/employer/verification"
                        className="inline-flex items-center gap-2 px-4 py-2 bg-yellow-100 text-yellow-800 rounded-lg"
                      >
                        Verify to Contact
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="bg-white rounded-lg shadow-sm border p-12 text-center">
              <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No Candidates Yet</h3>
              <p className="text-gray-600 mb-6">
                Candidates will appear here as students complete their training programs.
              </p>
              <Link
                href="/employer/dashboard"
                className="inline-flex items-center gap-2 px-6 py-3 bg-brand-blue-600 text-white rounded-lg hover:bg-brand-blue-700 transition"
              >
                Back to Dashboard
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
