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

export default async function CandidatesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; program?: string }>;
}) {
  const { user } = await requireRole(['employer', 'recruiter', 'admin']);
  const supabase = await createClient();
  const filters = await searchParams;
  const query = filters.q?.trim() ?? '';
  const program = filters.program?.trim() ?? '';

  const { data: employerProfile } = await supabase
    .from('profiles')
    .select('verified')
    .eq('id', user.id)
    .maybeSingle();
  const canContact = Boolean(employerProfile?.verified);

  let candidateQuery = supabase
    .from('candidate_employment_profiles')
    .select('id,display_name,headline,city,state,program_name,skills,credential_names,contact_email,contact_phone,resume_url,updated_at')
    .eq('available_for_employment', true)
    .eq('consent_status', 'granted')
    .order('updated_at', { ascending: false })
    .limit(50);
  if (query) candidateQuery = candidateQuery.or(`display_name.ilike.%${query.replace(/[%_,]/g, '')}%,headline.ilike.%${query.replace(/[%_,]/g, '')}%`);
  if (program) candidateQuery = candidateQuery.ilike('program_name', `%${program.replace(/[%_,]/g, '')}%`);
  const { data: candidates } = await candidateQuery;
  const certifiedCount = (candidates ?? []).filter((candidate: any) => candidate.credential_names?.length).length;
  const graduatesCount = candidates?.length ?? 0;

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
        {/* Search */}
        <form method="get" className="bg-white rounded-lg shadow-sm border p-4 mb-6">
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-700" />
                <input
                  name="q"
                  defaultValue={query}
                  type="text"
                  placeholder="Search by name, skill, or certification..."
                  className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-brand-blue-500 focus:border-brand-blue-500"
                />
              </div>
            </div>
            <select name="program" defaultValue={program} className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-brand-blue-500">
              <option value="">All Programs</option>
              <option value="healthcare">Healthcare</option>
              <option value="skilled-trades">Skilled Trades</option>
              <option value="technology">Technology</option>
            </select>
            <button className="rounded-lg bg-brand-blue-700 px-5 py-2 font-semibold text-white" type="submit">Search</button>
          </div>
        </form>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow-sm border p-4">
            <div className="flex items-center gap-3">
              <Users className="w-8 h-8 text-brand-blue-600" />
              <div>
                <div className="text-2xl font-bold">{candidates?.length || 0}</div>
                <div className="text-sm text-slate-700">Available Candidates</div>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm border p-4">
            <div className="flex items-center gap-3">
              <Award aria-label="award" className="w-8 h-8 text-brand-green-600" />
              <div>
                <div className="text-2xl font-bold">{certifiedCount || 0}</div>
                <div className="text-sm text-slate-700">Certified</div>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm border p-4">
            <div className="flex items-center gap-3">
              <GraduationCap aria-label="graduationcap" className="w-8 h-8 text-brand-blue-600" />
              <div>
                <div className="text-2xl font-bold">{graduatesCount || 0}</div>
                <div className="text-sm text-slate-700">Program Graduates</div>
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
                      <h3 className="text-lg font-semibold text-slate-900">
                        {candidate.display_name || 'Candidate'}
                      </h3>
                      {(candidate.city || candidate.state) && (
                        <div className="flex items-center gap-1 text-sm text-slate-700 mt-1">
                          <MapPin className="w-4 h-4" />
                          {[candidate.city, candidate.state].filter(Boolean).join(', ')}
                        </div>
                      )}
                    </div>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {[...(candidate.skills ?? []), ...(candidate.credential_names ?? [])].map((item: string) => (
                        <span key={item} className="rounded-full bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-700">{item}</span>
                      ))}
                    </div>
                  </div>

                  <div className="flex gap-2">
                    {canContact ? (
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
                            className="inline-flex items-center gap-2 px-4 py-2 border border-slate-300 rounded-lg hover:bg-white transition"
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
              <Users className="w-16 h-16 text-slate-700 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-slate-900 mb-2">No Candidates Yet</h3>
              <p className="text-slate-700 mb-6">
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
