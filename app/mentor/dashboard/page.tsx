import { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { requireRole } from '@/lib/auth/require-role';
import Link from 'next/link';
import { Users, Calendar, MessageSquare, Award, ChevronRight } from 'lucide-react';

export const metadata: Metadata = { 
  title: 'Mentor Dashboard | Elevate for Humanity',
  description: 'Manage your mentees, schedule sessions, and track your mentoring progress.',
};

export const dynamic = 'force-dynamic';

export default async function MentorDashboardPage() {
  // Require mentor role (admins can view for support)
  const { user } = await requireRole(['mentor', 'admin', 'super_admin']);

  const supabase = await createClient();
  const _admin = createAdminClient(); const db = _admin || supabase;

  let menteeCount = 0;
  let sessionCount = 0;
  let upcomingSessions: any[] = [];
  let recentMentees: any[] = [];

  // Get mentor's mentees
  const { data: mentorships, count } = await db
    .from('mentorships')
    .select(`
      id,
      mentee_id,
      status,
      created_at,
      profiles!mentorships_mentee_id_fkey(id, full_name),
      enrollments!mentorships_mentee_id_fkey(program_id, progress, programs(name))
    `, { count: 'exact' })
    .eq('mentor_id', user.id)
    .eq('status', 'active');

  if (mentorships) {
    menteeCount = count || 0;
    recentMentees = mentorships.slice(0, 4).map((m: any) => ({
      id: m.mentee_id,
      name: m.profiles?.full_name || 'Mentee',
      program: m.enrollments?.[0]?.programs?.name || 'Program',
      progress: m.enrollments?.[0]?.progress || 0,
    }));
  }

  // Get upcoming sessions
  const { data: sessions } = await db
    .from('mentor_sessions')
    .select(`
      id,
      scheduled_at,
      topic,
      mentee_id,
      profiles!mentor_sessions_mentee_id_fkey(full_name)
    `)
    .eq('mentor_id', user.id)
    .gte('scheduled_at', new Date().toISOString())
    .order('scheduled_at', { ascending: true })
    .limit(5);

  if (sessions) {
    upcomingSessions = sessions.map((s: any) => {
      const date = new Date(s.scheduled_at);
      const isToday = date.toDateString() === new Date().toDateString();
      const isTomorrow = date.toDateString() === new Date(Date.now() + 86400000).toDateString();
      return {
        id: s.id,
        mentee: s.profiles?.full_name || 'Mentee',
        date: isToday ? 'Today' : isTomorrow ? 'Tomorrow' : date.toLocaleDateString(),
        time: date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }),
        topic: s.topic || 'Mentoring Session',
      };
    });
  }

  // Get session count this month
  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);
  
  const { count: monthSessions } = await db
    .from('mentor_sessions')
    .select('*', { count: 'exact', head: true })
    .eq('mentor_id', user.id)
    .gte('scheduled_at', startOfMonth.toISOString());

  sessionCount = monthSessions || 0;

  const stats = [
    { label: 'Active Mentees', value: String(menteeCount), icon: Users },
    { label: 'Sessions This Month', value: String(sessionCount), icon: Calendar },
    { label: 'Messages', value: '0', icon: MessageSquare },
    { label: 'Avg Rating', value: '--', icon: Award },
  ];

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <h1 className="text-2xl font-bold text-gray-900">Mentor Dashboard</h1>
        </div>
      </div>
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {stats.map((stat, index) => (
            <div key={index} className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-teal-100 rounded-lg flex items-center justify-center">
                  <stat.icon className="w-6 h-6 text-teal-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                  <p className="text-sm text-gray-600">{stat.label}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
        <div className="grid lg:grid-cols-2 gap-8">
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900">Upcoming Sessions</h2>
              <Link href="/mentor/sessions" className="text-teal-600 hover:underline text-sm">View All</Link>
            </div>
            {upcomingSessions.length > 0 ? (
              <div className="space-y-4">
                {upcomingSessions.map((session) => (
                  <div key={session.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium text-gray-900">{session.mentee}</p>
                      <p className="text-sm text-gray-500">{session.topic}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-gray-900">{session.date}</p>
                      <p className="text-sm text-gray-500">{session.time}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">No upcoming sessions</p>
              </div>
            )}
          </div>
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900">My Mentees</h2>
              <Link href="/mentor/mentees" className="text-teal-600 hover:underline text-sm">View All</Link>
            </div>
            {recentMentees.length > 0 ? (
              <div className="space-y-4">
                {recentMentees.map((mentee) => (
                  <div key={mentee.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-teal-100 rounded-full flex items-center justify-center">
                        <span className="text-teal-600 font-medium">{mentee.name.charAt(0)}</span>
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{mentee.name}</p>
                        <p className="text-sm text-gray-500">{mentee.program}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="flex items-center gap-2">
                        <div className="w-16 h-2 bg-gray-200 rounded-full overflow-hidden">
                          <div className="h-full bg-teal-500 rounded-full" style={{ width: `${mentee.progress}%` }}></div>
                        </div>
                        <span className="text-sm text-gray-600">{mentee.progress}%</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">No mentees assigned yet</p>
              </div>
            )}
          </div>
        </div>
        <div className="mt-8 grid md:grid-cols-3 gap-6">
          <Link href="/mentor/mentees" className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Users className="w-8 h-8 text-teal-600" />
                <span className="font-semibold text-gray-900">Manage Mentees</span>
              </div>
              <ChevronRight className="w-5 h-5 text-gray-400" />
            </div>
          </Link>
          <Link href="/mentor/sessions" className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Calendar className="w-8 h-8 text-teal-600" />
                <span className="font-semibold text-gray-900">Schedule Sessions</span>
              </div>
              <ChevronRight className="w-5 h-5 text-gray-400" />
            </div>
          </Link>
          <Link href="/mentor/resources" className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Award className="w-8 h-8 text-teal-600" />
                <span className="font-semibold text-gray-900">Resources</span>
              </div>
              <ChevronRight className="w-5 h-5 text-gray-400" />
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}
