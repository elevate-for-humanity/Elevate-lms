import { Metadata } from 'next';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { 
  Video, Plus, Calendar, Clock, Users, 
  ExternalLink, Copy, Settings, ChevronRight
} from 'lucide-react';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  robots: { index: false, follow: false },
  title: 'Video Meetings | Collaborate | LMS | Elevate For Humanity',
  description: 'Schedule and join virtual study sessions with your classmates.',
};

export default async function MeetingsPage() {
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

  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login?redirect=/lms/collaborate/meetings');
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, avatar_url')
    .eq('id', user.id)
    .single();

  // Fetch user's scheduled meetings from study_sessions if table exists
  let upcomingMeetings: any[] = [];
  try {
    const { data: meetings } = await supabase
      .from('study_sessions')
      .select('id, title, description, scheduled_at, duration_minutes, meeting_url, host_id')
      .or(`host_id.eq.${user.id}`)
      .gte('scheduled_at', new Date().toISOString())
      .order('scheduled_at', { ascending: true })
      .limit(10);
    upcomingMeetings = meetings || [];
  } catch {
    // Table may not exist yet
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Breadcrumbs */}
      <div className="bg-white border-b">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <Breadcrumbs items={[
            { label: 'LMS', href: '/lms/dashboard' },
            { label: 'Collaborate', href: '/lms/collaborate' },
            { label: 'Meetings' }
          ]} />
        </div>
      </div>

      {/* Hero Section */}
      <div className="bg-gradient-to-r from-green-600 to-teal-600 text-white">
        <div className="max-w-6xl mx-auto px-4 py-12">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center">
              <Video className="w-8 h-8" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">Video Meetings</h1>
              <p className="text-green-100 mt-1">
                Schedule and join virtual study sessions
              </p>
            </div>
          </div>
          <div className="flex gap-4 mt-6">
            <button className="flex items-center gap-2 px-6 py-3 bg-white text-green-700 rounded-lg hover:bg-green-50 font-medium">
              <Plus className="w-5 h-5" />
              Schedule Meeting
            </button>
            <button className="flex items-center gap-2 px-6 py-3 bg-white/20 text-white rounded-lg hover:bg-white/30 font-medium">
              <Video className="w-5 h-5" />
              Start Instant Meeting
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Upcoming Meetings */}
            <div className="bg-white rounded-xl shadow-sm border">
              <div className="p-6 border-b flex items-center justify-between">
                <h2 className="font-semibold text-gray-900">Upcoming Meetings</h2>
                <Link href="/lms/collaborate/calendar" className="text-green-600 hover:text-green-700 text-sm font-medium">
                  View Calendar
                </Link>
              </div>
              
              {upcomingMeetings.length > 0 ? (
                <div className="divide-y">
                  {upcomingMeetings.map((meeting: any) => (
                    <div key={meeting.id} className="p-6 hover:bg-gray-50">
                      <div className="flex items-start justify-between">
                        <div className="flex gap-4">
                          <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center flex-shrink-0">
                            <Video className="w-6 h-6 text-green-600" />
                          </div>
                          <div>
                            <h3 className="font-semibold text-gray-900">{meeting.title}</h3>
                            <p className="text-sm text-gray-600 mt-1">{meeting.description}</p>
                            <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                              <span className="flex items-center gap-1">
                                <Calendar className="w-4 h-4" />
                                {new Date(meeting.scheduled_at).toLocaleDateString()}
                              </span>
                              <span className="flex items-center gap-1">
                                <Clock className="w-4 h-4" />
                                {new Date(meeting.scheduled_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </div>
                          </div>
                        </div>
                        <button className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm font-medium">
                          Join
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-12 text-center">
                  <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">No upcoming meetings</h3>
                  <p className="text-gray-600 mb-6">
                    Schedule a study session with your classmates or join an existing one.
                  </p>
                  <button className="inline-flex items-center gap-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium">
                    <Plus className="w-5 h-5" />
                    Schedule Your First Meeting
                  </button>
                </div>
              )}
            </div>

            {/* Past Meetings */}
            <div className="bg-white rounded-xl shadow-sm border">
              <div className="p-6 border-b">
                <h2 className="font-semibold text-gray-900">Recent Meetings</h2>
              </div>
              <div className="p-6 text-center text-gray-500">
                <p>Your past meetings will appear here.</p>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Quick Actions */}
            <div className="bg-white rounded-xl shadow-sm border p-6">
              <h3 className="font-semibold text-gray-900 mb-4">Quick Actions</h3>
              <div className="space-y-3">
                <button className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 text-left">
                  <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                    <Plus className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <div className="font-medium text-gray-900">New Meeting</div>
                    <div className="text-sm text-gray-500">Schedule a study session</div>
                  </div>
                </button>
                <button className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 text-left">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                    <ExternalLink className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <div className="font-medium text-gray-900">Join with Code</div>
                    <div className="text-sm text-gray-500">Enter meeting ID</div>
                  </div>
                </button>
                <button className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 text-left">
                  <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                    <Copy className="w-5 h-5 text-purple-600" />
                  </div>
                  <div>
                    <div className="font-medium text-gray-900">Copy Personal Link</div>
                    <div className="text-sm text-gray-500">Share your meeting room</div>
                  </div>
                </button>
              </div>
            </div>

            {/* Meeting Tips */}
            <div className="bg-green-50 rounded-xl p-6">
              <h3 className="font-semibold text-gray-900 mb-3">Meeting Tips</h3>
              <ul className="space-y-2 text-sm text-gray-700">
                <li className="flex items-start gap-2">
                  <span className="text-green-600 mt-0.5">•</span>
                  Test your audio and video before joining
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-600 mt-0.5">•</span>
                  Find a quiet space with good lighting
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-600 mt-0.5">•</span>
                  Have your study materials ready
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-600 mt-0.5">•</span>
                  Use screen share to collaborate on notes
                </li>
              </ul>
            </div>

            {/* Settings Link */}
            <Link 
              href="/account/settings" 
              className="flex items-center justify-between p-4 bg-white rounded-xl shadow-sm border hover:border-gray-300"
            >
              <div className="flex items-center gap-3">
                <Settings className="w-5 h-5 text-gray-400" />
                <span className="font-medium text-gray-900">Meeting Settings</span>
              </div>
              <ChevronRight className="w-5 h-5 text-gray-400" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
