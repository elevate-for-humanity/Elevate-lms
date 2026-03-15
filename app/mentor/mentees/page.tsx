import { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Search, MessageSquare, Calendar, Users } from 'lucide-react';

export const metadata: Metadata = { 
  title: 'My Mentees | Mentor Portal',
  description: 'View and manage your mentees, track their progress, and schedule sessions.',
};

export const dynamic = 'force-dynamic';

export default async function MenteesPage() {
  const supabase = await createClient();
  const _admin = createAdminClient(); const db = _admin || supabase;
  
  if (!supabase) redirect('/login');

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login?redirect=/mentor/mentees');

  const mentees: any[] = [];

  // Get mentor's mentees
  const { data: mentorships } = await db
    .from('mentorships')
    .select(`
      id,
      mentee_id,
      status,
      created_at,
      profiles!mentorships_mentee_id_fkey(id, full_name),
      enrollments!mentorships_mentee_id_fkey(program_id, programs(name))
    `)
    .eq('mentor_id', user.id);

  if (mentorships) {
    // Get session counts for each mentee
    for (const m of mentorships) {
      const { count } = await db
        .from('mentor_sessions')
        .select('*', { count: 'exact', head: true })
        .eq('mentor_id', user.id)
        .eq('mentee_id', m.mentee_id);

      mentees.push({
        id: m.mentee_id,
        name: m.profiles?.full_name || 'Mentee',
        program: m.enrollments?.[0]?.programs?.name || 'Program',
        startDate: new Date(m.created_at).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
        sessions: count || 0,
        status: m.status || 'active',
      });
    }
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <nav className="flex items-center text-sm text-gray-600">
            <Link href="/mentor/dashboard" className="hover:text-brand-blue-600">Mentor Dashboard</Link>
            <span className="mx-2">/</span>
            <span className="text-gray-900 font-medium">Mentees</span>
          </nav>
        </div>
      </div>
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold text-gray-900">My Mentees</h1>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input type="text" placeholder="Search mentees..." className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg" />
          </div>
        </div>
        
        {mentees.length > 0 ? (
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <table className="w-full">
              <thead className="bg-white">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Name</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Program</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Started</th>
                  <th className="px-6 py-3 text-center text-sm font-semibold text-gray-900">Sessions</th>
                  <th className="px-6 py-3 text-center text-sm font-semibold text-gray-900">Status</th>
                  <th className="px-6 py-3 text-center text-sm font-semibold text-gray-900">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {mentees.map((mentee) => (
                  <tr key={mentee.id} className="hover:bg-white">
                    <td className="px-6 py-4 font-medium text-gray-900">{mentee.name}</td>
                    <td className="px-6 py-4 text-gray-600">{mentee.program}</td>
                    <td className="px-6 py-4 text-gray-600">{mentee.startDate}</td>
                    <td className="px-6 py-4 text-center text-gray-600">{mentee.sessions}</td>
                    <td className="px-6 py-4 text-center">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${mentee.status === 'active' ? 'bg-brand-green-100 text-brand-green-700' : 'bg-white text-gray-700'}`}>
                        {mentee.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button className="p-2 text-brand-blue-600 hover:bg-brand-blue-50 rounded"><MessageSquare className="w-4 h-4" /></button>
                        <button className="p-2 text-brand-green-600 hover:bg-brand-green-50 rounded"><Calendar className="w-4 h-4" /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-sm p-12 text-center">
            <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-gray-900 mb-2">No Mentees Yet</h3>
            <p className="text-gray-600">You haven't been assigned any mentees yet.</p>
          </div>
        )}
      </div>
    </div>
  );
}
