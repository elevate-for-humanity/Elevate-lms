import { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import { requireRole } from '@/lib/auth/require-role';
import Link from 'next/link';
import { Users, Search, Mail, Phone, Award, MapPin, GraduationCap } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Browse Candidates | Employer Portal',
  description: 'Browse job-ready candidates trained in healthcare, skilled trades, and technology.',
};

export const dynamic = 'force-dynamic';

export default async function CandidatesPage() {
  const { user } = await requireRole(['employer', 'admin']);
  const supabase = await createClient();

  // Get completed/graduated candidates only
  const { data: enrollments } = await supabase
    .from('program_enrollments')
    .select(`
      id,
      user_id,
      progress_percent,
      completed_at,
      training_courses:course_id (
        id,
        title
      )
    `)
    .eq('progress_percent', 100)
    .order('completed_at', { ascending: false })
    .limit(50);

  const userIds = [...new Set((enrollments ?? []).map((e: any) => e.user_id).filter(Boolean))];
  
  // Hydrate profiles
  const { data: profileRows } = userIds.length
    ? await supabase
        .from('profiles')
        .select('id, full_name, email, phone, city, state, is_certified')
        .in('id', userIds)
    : { data: [] };
  
  const profileMap = Object.fromEntries((profileRows ?? []).map((p: any) => [p.id, p]));

  const candidates = (enrollments ?? []).map((e: any) => {
    const profile = profileMap[e.user_id] || {};
    return {
      ...profile,
      course_title: e.training_courses?.title ?? 'Completed Program',
      completed_at: e.completed_at,
      certified: !!profile.is_certified,
    };
  });

  const certifiedCount = candidates.filter(c => c.certified).length;
  const graduateCount = candidates.length;

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Browse Candidates</h1>
              <p className="text-slate-700">Find job-ready workers trained in your industry</p>
            </div>
            <Link
              href="/employer/dashboard"
              className="px-4 py-2 text-slate-700 hover:text-slate-900"
            >
              ← Back to Dashboard
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow-sm border p-4">
            <div className="flex items-center gap-3">
              <Users className="w-8 h-8 text-brand-blue-600" />
              <div>
                <div className="text-2xl font-bold">{candidates.length}</div>
                <div className="text-sm text-slate-700">Available Candidates</div>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm border p-4">
            <div className="flex items-center gap-3">
              <Award aria-label="award" className="w-8 h-8 text-brand-green-600" />
              <div>
                <div className="text-2xl font-bold">{certifiedCount}</div>
                <div className="text-sm text-slate-700">Certified</div>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm border p-4">
            <div className="flex items-center gap-3">
              <GraduationCap aria-label="graduationcap" className="w-8 h-8 text-brand-blue-600" />
              <div>
                <div className="text-2xl font-bold">{graduateCount}</div>
                <div className="text-sm text-slate-700">Program Graduates</div>
              </div>
            </div>
          </div>
        </div>

        {/* Search */}
        <div className="bg-white rounded-lg shadow-sm border p-4 mb-6">
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-700" />
                <input
                  type="text"
                  placeholder="Search by name, skill, or certification..."
                  className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-brand-blue-500"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Candidates List */}
        <div className="space-y-4">
          {candidates.length > 0 ? (
            candidates.map((candidate: any) => (
              <div key={candidate.id || Math.random()} className="bg-white rounded-lg shadow-sm border p-6">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-brand-blue-100 rounded-full flex items-center justify-center">
                      <Users className="w-6 h-6 text-brand-blue-600" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-slate-900">
                        {candidate.full_name || 'Candidate'}
                      </h3>
                      <p className="text-sm text-brand-blue-600 font-medium">{candidate.course_title}</p>
                      {(candidate.city || candidate.state) && (
                        <div className="flex items-center gap-1 text-sm text-slate-700 mt-1">
                          <MapPin className="w-4 h-4" />
                          {[candidate.city, candidate.state].filter(Boolean).join(', ')}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <button className="inline-flex items-center gap-2 px-4 py-2 bg-brand-blue-600 text-white rounded-lg hover:bg-brand-blue-700 transition">
                      <Mail className="w-4 h-4" />
                      View Portfolio
                    </button>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="bg-white rounded-lg shadow-sm border p-12 text-center">
              <Users className="w-16 h-16 text-slate-700 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-slate-900 mb-2">No Candidates Yet</h3>
              <p className="text-slate-700">Candidates will appear here once students complete their training.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
