import { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Briefcase, Plus, Search } from 'lucide-react';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  alternates: { canonical: 'https://www.elevateforhumanity.org/employer/opportunities' },
  title: 'Job Opportunities | Employer Portal | Elevate For Humanity',
  description: 'Post and manage job opportunities for Elevate program graduates.',
};

export default async function OpportunitiesPage() {
  const supabase = await createClient();
  const _admin = createAdminClient(); const db = _admin || supabase;

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

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login?redirect=/employer/opportunities');

  const { data: opportunities } = await db
    .from('job_opportunities')
    .select('*')
    .eq('employer_id', user.id)
    .order('created_at', { ascending: false })
    .limit(20);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <section className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <div className="flex items-center gap-3 mb-1">
                <Briefcase className="w-7 h-7 text-brand-blue-600" />
                <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Job Opportunities</h1>
              </div>
              <p className="text-gray-600 ml-10">Post positions and connect with trained, certified graduates.</p>
            </div>
            <Link
              href="/employer/opportunities"
              className="bg-brand-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-brand-blue-700 transition inline-flex items-center gap-2 self-start"
            >
              <Plus className="w-5 h-5" />
              Post New Opportunity
            </Link>
          </div>
        </div>
      </section>

      {/* Opportunities List */}
      <section className="py-8">
        <div className="max-w-7xl mx-auto px-4">
          {opportunities && opportunities.length > 0 ? (
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="text-left px-6 py-3 text-sm font-semibold text-gray-700">Position</th>
                    <th className="text-left px-6 py-3 text-sm font-semibold text-gray-700 hidden md:table-cell">Location</th>
                    <th className="text-left px-6 py-3 text-sm font-semibold text-gray-700 hidden md:table-cell">Status</th>
                    <th className="text-left px-6 py-3 text-sm font-semibold text-gray-700 hidden md:table-cell">Posted</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {opportunities.map((opp: any) => (
                    <tr key={opp.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 font-medium text-gray-900">{opp.title || 'Untitled Position'}</td>
                      <td className="px-6 py-4 text-gray-600 text-sm hidden md:table-cell">{opp.location || '—'}</td>
                      <td className="px-6 py-4 hidden md:table-cell">
                        <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                          opp.status === 'active' ? 'bg-brand-green-50 text-brand-green-700' : 'bg-gray-100 text-gray-600'
                        }`}>
                          {opp.status || 'draft'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-gray-600 text-sm hidden md:table-cell">
                        {opp.created_at ? new Date(opp.created_at).toLocaleDateString() : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
              <Search className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No Opportunities Posted</h3>
              <p className="text-gray-600 mb-6">Post your first job opportunity to connect with trained graduates.</p>
              <Link
                href="/employer/opportunities"
                className="bg-brand-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-brand-blue-700 transition inline-flex items-center gap-2"
              >
                <Plus className="w-5 h-5" />
                Post New Opportunity
              </Link>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
