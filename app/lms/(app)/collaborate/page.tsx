import { Metadata } from 'next';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { 
  Users, Video, FileText, Calendar, Plus, 
  MessageSquare, Share2, Clock, ChevronRight
} from 'lucide-react';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  robots: { index: false, follow: false },
  title: 'Collaborate | LMS | Elevate For Humanity',
  description: 'Work together with classmates on projects, study sessions, and group assignments.',
};

const collaborationTools = [
  {
    title: 'Study Groups',
    description: 'Join or create study groups for your courses',
    icon: Users,
    href: '/lms/study-groups',
    color: 'blue',
  },
  {
    title: 'Video Meetings',
    description: 'Schedule and join virtual study sessions',
    icon: Video,
    href: '/lms/collaborate/meetings',
    color: 'green',
  },
  {
    title: 'Shared Documents',
    description: 'Collaborate on notes and study materials',
    icon: FileText,
    href: '/lms/collaborate/documents',
    color: 'purple',
  },
  {
    title: 'Group Calendar',
    description: 'Coordinate schedules with your study partners',
    icon: Calendar,
    href: '/lms/collaborate/calendar',
    color: 'orange',
  },
];

export default async function CollaboratePage() {
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
    redirect('/login?redirect=/lms/collaborate');
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Breadcrumbs */}
      <div className="bg-white border-b">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <Breadcrumbs items={[
            { label: 'LMS', href: '/lms/dashboard' },
            { label: 'Collaborate' }
          ]} />
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
              <Users className="w-8 h-8 text-blue-600" />
              Collaborate
            </h1>
            <p className="text-gray-600 mt-1">
              Work together with classmates on projects and study sessions
            </p>
          </div>
          <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
            <Plus className="w-5 h-5" />
            Create Group
          </button>
        </div>

        {/* Collaboration Tools */}
        <div className="grid md:grid-cols-2 gap-6 mb-12">
          {collaborationTools.map((tool, index) => (
            <Link
              key={index}
              href={tool.href}
              className="bg-white rounded-xl p-6 shadow-sm border hover:border-blue-300 hover:shadow-md transition-all"
            >
              <div className="flex items-start gap-4">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${
                  tool.color === 'blue' ? 'bg-blue-100' :
                  tool.color === 'green' ? 'bg-green-100' :
                  tool.color === 'purple' ? 'bg-blue-100' : 'bg-orange-100'
                }`}>
                  <tool.icon className={`w-6 h-6 ${
                    tool.color === 'blue' ? 'text-blue-600' :
                    tool.color === 'green' ? 'text-green-600' :
                    tool.color === 'purple' ? 'text-blue-600' : 'text-orange-600'
                  }`} />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900">{tool.title}</h3>
                  <p className="text-gray-600 text-sm mt-1">{tool.description}</p>
                </div>
                <ChevronRight className="w-5 h-5 text-gray-400" />
              </div>
            </Link>
          ))}
        </div>

        {/* Active Collaborations */}
        <div className="grid lg:grid-cols-2 gap-8">
          {/* My Groups */}
          <div className="bg-white rounded-xl shadow-sm border">
            <div className="p-6 border-b flex items-center justify-between">
              <h2 className="font-semibold text-gray-900">My Study Groups</h2>
              <Link href="/lms/study-groups" className="text-blue-600 hover:text-blue-700 text-sm font-medium">
                View All
              </Link>
            </div>
            <div className="p-6">
              <div className="text-center py-8">
                <Users className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <h3 className="font-medium text-gray-900 mb-2">No groups yet</h3>
                <p className="text-gray-600 text-sm mb-4">
                  Join a study group or create your own
                </p>
                <Link
                  href="/lms/study-groups"
                  className="text-blue-600 hover:text-blue-700 font-medium text-sm"
                >
                  Browse Study Groups →
                </Link>
              </div>
            </div>
          </div>

          {/* Upcoming Sessions */}
          <div className="bg-white rounded-xl shadow-sm border">
            <div className="p-6 border-b flex items-center justify-between">
              <h2 className="font-semibold text-gray-900">Upcoming Sessions</h2>
              <Link href="/lms/collaborate/meetings" className="text-blue-600 hover:text-blue-700 text-sm font-medium">
                Schedule
              </Link>
            </div>
            <div className="p-6">
              <div className="text-center py-8">
                <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <h3 className="font-medium text-gray-900 mb-2">No upcoming sessions</h3>
                <p className="text-gray-600 text-sm mb-4">
                  Schedule a study session with your group
                </p>
                <button className="text-blue-600 hover:text-blue-700 font-medium text-sm">
                  Schedule Session →
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Tips */}
        <div className="mt-8 bg-blue-50 rounded-xl p-6">
          <h3 className="font-semibold text-gray-900 mb-4">Collaboration Tips</h3>
          <div className="grid md:grid-cols-3 gap-4 text-sm text-gray-700">
            <div className="flex items-start gap-2">
              <MessageSquare className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <span>Use the chat feature to stay connected with your study partners</span>
            </div>
            <div className="flex items-start gap-2">
              <Share2 className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <span>Share notes and resources in your group's shared documents</span>
            </div>
            <div className="flex items-start gap-2">
              <Clock className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <span>Schedule regular study sessions to stay on track</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
