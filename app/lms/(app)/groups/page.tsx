import { Breadcrumbs } from '@/components/ui/Breadcrumbs';

import { Metadata } from 'next';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import {

export const dynamic = 'force-dynamic';
  Users,
  Plus,
  Search,
  MessageSquare,
  Calendar,
  Video,
  MapPin,
  UserPlus,
  Settings,
  ChevronRight,
} from 'lucide-react';

export const metadata: Metadata = {
  alternates: { canonical: 'https://www.elevateforhumanity.org/lms/groups' },
  title: 'My Groups | LMS | Elevate For Humanity',
  description: 'Join study groups and collaborate with fellow learners.',
};

export default async function GroupsPage() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login?redirect=/lms/groups');

  // Fetch user's group memberships
  const { data: memberships } = await supabase
    .from('study_group_members')
    .select(`
      *,
      study_groups (
        id,
        name,
        description,
        course_id,
        max_members,
        meeting_schedule,
        is_virtual,
        is_active,
        courses (title)
      )
    `)
    .eq('user_id', user.id);

  // Fetch member counts for each group
  const groups = await Promise.all(
    (memberships || []).map(async (membership) => {
      const { count } = await supabase
        .from('study_group_members')
        .select('*', { count: 'exact', head: true })
        .eq('study_group_id', membership.study_group_id);

      return {
        ...membership.study_groups,
        role: membership.role,
        memberCount: count || 0,
        joinedAt: membership.joined_at,
      };
    })
  );

  // Fetch recent group messages
  const groupIds = groups.map(g => g.id);
  const { data: recentMessages } = await supabase
    .from('group_messages')
    .select('*, profiles (first_name, last_name)')
    .in('group_id', groupIds.length > 0 ? groupIds : ['00000000-0000-0000-0000-000000000000'])
    .order('created_at', { ascending: false })
    .limit(10);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <div className="min-h-screen bg-white py-8">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <Breadcrumbs items={[{ label: "LMS", href: "/lms/courses" }, { label: "Groups" }]} />
        </div>
      <div className="max-w-6xl mx-auto px-4">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">My Groups</h1>
            <p className="text-slate-600 mt-1">
              Collaborate and learn with your study groups
            </p>
          </div>
          <div className="mt-4 md:mt-0 flex gap-3">
            <Link
              href="/lms/study-groups"
              className="flex items-center gap-2 px-4 py-2 border border-slate-200 bg-white rounded-lg hover:bg-white transition"
            >
              <Search className="w-4 h-4" />
              Find Groups
            </Link>
            <button className="flex items-center gap-2 px-4 py-2 bg-brand-blue-600 text-white rounded-lg hover:bg-brand-blue-700 transition">
              <Plus className="w-4 h-4" />
              Create Group
            </button>
          </div>
        </div>

        {groups.length > 0 ? (
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Groups List */}
            <div className="lg:col-span-2 space-y-4">
              {groups.map((group) => (
                <Link
                  key={group.id}
                  href={`/lms/groups/${group.id}`}
                  className="block bg-white rounded-xl border border-slate-200 p-6 hover:border-brand-blue-300 hover:shadow-md transition"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 bg-brand-blue-500 rounded-xl flex items-center justify-center text-white font-bold text-xl">
                        {group.name?.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <h2 className="text-lg font-bold text-slate-900">{group.name}</h2>
                        <p className="text-sm text-slate-600">{group.courses?.title}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {group.role === 'admin' && (
                        <span className="px-2 py-1 bg-brand-blue-100 text-brand-blue-700 text-xs font-medium rounded-full">
                          Admin
                        </span>
                      )}
                      <ChevronRight className="w-5 h-5 text-slate-400" />
                    </div>
                  </div>

                  {group.description && (
                    <p className="text-sm text-slate-600 mb-4 line-clamp-2">
                      {group.description}
                    </p>
                  )}

                  <div className="flex flex-wrap gap-4 text-sm text-slate-500">
                    <span className="flex items-center gap-1">
                      <Users className="w-4 h-4" />
                      {group.memberCount} members
                    </span>
                    <span className="flex items-center gap-1">
                      {group.is_virtual ? (
                        <>
                          <Video className="w-4 h-4" />
                          Virtual
                        </>
                      ) : (
                        <>
                          <MapPin className="w-4 h-4" />
                          In-person
                        </>
                      )}
                    </span>
                    {group.meeting_schedule && (
                      <span className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        {group.meeting_schedule}
                      </span>
                    )}
                  </div>
                </Link>
              ))}
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Recent Activity */}
              <div className="bg-white rounded-xl border border-slate-200 p-6">
                <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
                  <MessageSquare className="w-5 h-5 text-brand-blue-600" />
                  Recent Messages
                </h3>
                {recentMessages && recentMessages.length > 0 ? (
                  <div className="space-y-4">
                    {recentMessages.slice(0, 5).map((message) => (
                      <div key={message.id} className="flex items-start gap-3">
                        <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center text-sm font-medium text-slate-600">
                          {message.profiles?.first_name?.charAt(0) || 'U'}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-slate-900 truncate">{message.content}</p>
                          <p className="text-xs text-slate-500">
                            {message.profiles?.first_name} • {formatDate(message.created_at)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-slate-500 text-center py-4">
                    No recent messages
                  </p>
                )}
              </div>

              {/* Quick Actions */}
              <div className="bg-brand-blue-600 rounded-xl p-6 text-white">
                <h3 className="font-bold mb-4">Quick Actions</h3>
                <div className="space-y-2">
                  <Link
                    href="/lms/study-groups"
                    className="flex items-center gap-2 w-full px-4 py-2 bg-white/20 rounded-lg hover:bg-white/30 transition"
                  >
                    <UserPlus className="w-4 h-4" />
                    Join a Group
                  </Link>
                  <Link
                    href="/learner/messages"
                    className="flex items-center gap-2 w-full px-4 py-2 bg-white/20 rounded-lg hover:bg-white/30 transition"
                  >
                    <MessageSquare className="w-4 h-4" />
                    Messages
                  </Link>
                  <Link
                    href="/learner/calendar"
                    className="flex items-center gap-2 w-full px-4 py-2 bg-white/20 rounded-lg hover:bg-white/30 transition"
                  >
                    <Calendar className="w-4 h-4" />
                    Calendar
                  </Link>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-slate-200 p-16 text-center">
            <Users className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-slate-900 mb-2">No Groups Yet</h2>
            <p className="text-slate-600 mb-6 max-w-md mx-auto">
              Join a study group to collaborate with fellow learners, share resources, and stay motivated.
            </p>
            <div className="flex flex-wrap gap-4 justify-center">
              <Link
                href="/lms/study-groups"
                className="inline-flex items-center gap-2 bg-brand-blue-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-brand-blue-700 transition"
              >
                <Search className="w-5 h-5" />
                Find Groups
              </Link>
              <button className="inline-flex items-center gap-2 border border-slate-200 text-slate-700 px-6 py-3 rounded-xl font-bold hover:bg-white transition">
                <Plus className="w-5 h-5" />
                Create Group
              </button>
            </div>
          </div>
        )}

        {/* Back Link */}
        <div className="mt-8 text-center">
          <Link href="/learner/community" className="text-brand-blue-600 hover:text-brand-blue-700 font-medium">
            ← Back to Community
          </Link>
        </div>
      </div>
    </div>
  );
}
