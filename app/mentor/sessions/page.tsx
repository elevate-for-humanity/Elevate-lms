import { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Calendar, Clock, Video, MapPin, Plus } from 'lucide-react';

export const metadata: Metadata = { 
  title: 'Mentoring Sessions | Mentor Portal',
  description: 'Schedule and manage your mentoring sessions with mentees.',
};

export const dynamic = 'force-dynamic';

export default async function MentorSessionsPage() {
  const supabase = await createClient();
  const _admin = createAdminClient(); const db = _admin || supabase;
  
  if (!supabase) redirect('/login');

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login?redirect=/mentor/sessions');

  let upcomingSessions: any[] = [];
  let pastSessions: any[] = [];

  // Get upcoming sessions
  const { data: upcoming } = await db
    .from('mentor_sessions')
    .select(`
      id,
      scheduled_at,
      topic,
      session_type,
      mentee_id,
      profiles!mentor_sessions_mentee_id_fkey(full_name)
    `)
    .eq('mentor_id', user.id)
    .gte('scheduled_at', new Date().toISOString())
    .order('scheduled_at', { ascending: true })
    .limit(10);

  if (upcoming) {
    upcomingSessions = upcoming.map((s: any) => {
      const date = new Date(s.scheduled_at);
      return {
        id: s.id,
        mentee: s.profiles?.full_name || 'Mentee',
        date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
        time: date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }),
        type: s.session_type || 'video',
        topic: s.topic || 'Mentoring Session',
      };
    });
  }

  // Get past sessions
  const { data: past } = await db
    .from('mentor_sessions')
    .select(`
      id,
      scheduled_at,
      topic,
      duration_minutes,
      mentee_id,
      profiles!mentor_sessions_mentee_id_fkey(full_name)
    `)
    .eq('mentor_id', user.id)
    .lt('scheduled_at', new Date().toISOString())
    .order('scheduled_at', { ascending: false })
    .limit(10);

  if (past) {
    pastSessions = past.map((s: any) => {
      const date = new Date(s.scheduled_at);
      return {
        id: s.id,
        mentee: s.profiles?.full_name || 'Mentee',
        date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
        topic: s.topic || 'Mentoring Session',
        duration: s.duration_minutes ? `${s.duration_minutes} min` : '--',
      };
    });
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <nav className="flex items-center text-sm text-gray-600">
            <Link href="/mentor/dashboard" className="hover:text-brand-blue-600">Mentor Dashboard</Link>
            <span className="mx-2">/</span>
            <span className="text-gray-900 font-medium">Sessions</span>
          </nav>
        </div>
      </div>
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Mentoring Sessions</h1>
          <button className="flex items-center gap-2 bg-brand-blue-600 text-white px-4 py-2 rounded-lg hover:bg-brand-blue-700">
            <Plus className="w-5 h-5" /> Schedule Session
          </button>
        </div>
        <div className="mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Upcoming Sessions</h2>
          {upcomingSessions.length > 0 ? (
            <div className="grid md:grid-cols-2 gap-4">
              {upcomingSessions.map((session) => (
                <div key={session.id} className="bg-white rounded-xl shadow-sm p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <p className="font-semibold text-gray-900">{session.mentee}</p>
                      <p className="text-sm text-gray-600">{session.topic}</p>
                    </div>
                    {session.type === 'video' ? <Video className="w-5 h-5 text-brand-blue-600" /> : <MapPin className="w-5 h-5 text-brand-green-600" />}
                  </div>
                  <div className="flex items-center gap-4 text-sm text-gray-600">
                    <span className="flex items-center gap-1"><Calendar className="w-4 h-4" /> {session.date}</span>
                    <span className="flex items-center gap-1"><Clock className="w-4 h-4" /> {session.time}</span>
                  </div>
                  <div className="mt-4 flex gap-2">
                    <button className="flex-1 bg-brand-blue-600 text-white py-2 rounded-lg hover:bg-brand-blue-700">Join</button>
                    <button className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-white">Reschedule</button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-xl shadow-sm p-8 text-center">
              <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">No upcoming sessions scheduled</p>
            </div>
          )}
        </div>
        <div>
          <h2 className="text-xl font-bold text-gray-900 mb-4">Past Sessions</h2>
          {pastSessions.length > 0 ? (
            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
              <table className="w-full">
                <thead className="bg-white">
                  <tr>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Mentee</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Date</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Topic</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Duration</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {pastSessions.map((session) => (
                    <tr key={session.id} className="hover:bg-white">
                      <td className="px-6 py-4 font-medium text-gray-900">{session.mentee}</td>
                      <td className="px-6 py-4 text-gray-600">{session.date}</td>
                      <td className="px-6 py-4 text-gray-600">{session.topic}</td>
                      <td className="px-6 py-4 text-gray-600">{session.duration}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="bg-white rounded-xl shadow-sm p-8 text-center">
              <Clock className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">No past sessions</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
