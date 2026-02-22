export const dynamic = 'force-dynamic';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';

import { Metadata } from 'next';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { redirect } from 'next/navigation';
import {
  Users,
  Plus,
  Search,
  Calendar,
  Clock,
  MapPin,
  Video,
  BookOpen,
  MessageSquare,
  UserPlus,
  ChevronRight,
} from 'lucide-react';

interface Course {
  id: string;
  title: string;
}

interface StudyGroup {
  id: string;
  name: string;
  description: string | null;
  course_id: string | null;
  max_members: number | null;
  meeting_schedule: string | null;
  is_virtual: boolean;
  meeting_link: string | null;
  created_at: string;
  courses: Course | null;
  study_group_members?: { user_id: string }[];
}

interface GroupMembership {
  study_group_id: string;
  role: string;
  study_groups: StudyGroup | null;
}

interface MyGroup extends StudyGroup {
  role: string;
  memberCount: number;
}

interface Enrollment {
  courses: Course | null;
}

export const metadata: Metadata = {
  alternates: {
    canonical: 'https://www.elevateforhumanity.org/lms/study-groups',
  },
  title: 'Study Groups | Student Portal',
  description: 'Join or create study groups to learn together with fellow students.',
};

export default async function StudyGroupsPage() {
  const supabase = await createClient();
  const _admin = createAdminClient(); const db = _admin || supabase;

  if (!supabase) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <Breadcrumbs items={[{ label: "LMS", href: "/lms/dashboard" }, { label: "Study Groups" }]} />
        </div>
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Service Unavailable</h1>
          <p className="text-gray-600">Please try again later.</p>
        </div>
      </div>
    );
  }
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // Fetch user's study groups
  const { data: myGroupMemberships } = await db
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
        meeting_link,
        created_at,
        courses (title)
      )
    `)
    .eq('user_id', user.id);

  const typedMemberships = (myGroupMemberships || []) as GroupMembership[];

  // Fetch available study groups (not joined)
  const joinedGroupIds = typedMemberships.map(m => m.study_group_id);
  
  const { data: availableGroups } = await db
    .from('study_groups')
    .select(`
      *,
      courses (title),
      study_group_members (user_id)
    `)
    .eq('is_active', true)
    .not('id', 'in', `(${joinedGroupIds.length > 0 ? joinedGroupIds.join(',') : '00000000-0000-0000-0000-000000000000'})`)
    .order('created_at', { ascending: false })
    .limit(20);

  // Fetch user's enrolled courses for creating groups
  const { data: enrollments } = await db
    .from('program_enrollments')
    .select('courses (id, title)')
    .eq('user_id', user.id)
    .eq('status', 'active');

  const typedEnrollments = (enrollments || []) as Enrollment[];
  const typedAvailableGroups = (availableGroups || []) as StudyGroup[];

  const myGroups: MyGroup[] = typedMemberships
    .filter(m => m.study_groups !== null)
    .map(m => ({
      ...m.study_groups!,
      role: m.role,
      memberCount: 0,
    }));

  // Calculate member counts
  for (const group of myGroups) {
    const { count } = await db
      .from('study_group_members')
      .select('*', { count: 'exact', head: true })
      .eq('study_group_id', group.id);
    group.memberCount = count || 0;
  }

  const formatSchedule = (schedule: string | null) => {
    if (!schedule) return 'Flexible schedule';
    return schedule;
  };

  return (
    <div className="min-h-screen bg-slate-50 py-8">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <Breadcrumbs items={[{ label: "LMS", href: "/lms/dashboard" }, { label: "Study Groups" }]} />
        </div>
      <div className="max-w-6xl mx-auto px-4">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Study Groups</h1>
            <p className="text-slate-600 mt-1">
              Learn together with fellow students
            </p>
          </div>
          <div className="mt-4 md:mt-0">
            <button className="flex items-center gap-2 px-4 py-2 bg-brand-blue-600 text-white rounded-lg hover:bg-brand-blue-700 transition">
              <Plus className="w-4 h-4" />
              Create Group
            </button>
          </div>
        </div>

        {/* Search */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 mb-8">
          <div className="flex gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="text"
                placeholder="Search study groups..."
                className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-blue-500"
              />
            </div>
            <select className="px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-blue-500">
              <option value="">All Courses</option>
              {typedEnrollments.map(e => (
                <option key={e.courses?.id} value={e.courses?.id}>
                  {e.courses?.title}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* My Groups */}
        {myGroups.length > 0 && (
          <div className="mb-8">
            <h2 className="text-xl font-bold text-slate-900 mb-4">My Study Groups</h2>
            <div className="grid md:grid-cols-2 gap-4">
              {myGroups.map((group) => (
                <Link
                  key={group.id}
                  href={`/lms/study-groups/${group.id}`}
                  className="bg-white rounded-xl border border-slate-200 p-6 hover:border-brand-blue-300 hover:shadow-md transition"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-brand-blue-100 rounded-xl flex items-center justify-center">
                        <Users className="w-6 h-6 text-brand-blue-600" />
                      </div>
                      <div>
                        <h3 className="font-bold text-slate-900">{group.name}</h3>
                        <p className="text-sm text-slate-600">{group.courses?.title}</p>
                      </div>
                    </div>
                    {group.role === 'admin' && (
                      <span className="px-2 py-1 bg-brand-blue-100 text-brand-blue-700 text-xs font-medium rounded-full">
                        Admin
                      </span>
                    )}
                  </div>
                  
                  {group.description && (
                    <p className="text-sm text-slate-600 mb-4 line-clamp-2">
                      {group.description}
                    </p>
                  )}

                  <div className="flex flex-wrap gap-4 text-sm text-slate-500">
                    <span className="flex items-center gap-1">
                      <Users className="w-4 h-4" />
                      {group.memberCount}/{group.max_members || '∞'} members
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
                    <span className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      {formatSchedule(group.meeting_schedule)}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Available Groups */}
        <div>
          <h2 className="text-xl font-bold text-slate-900 mb-4">
            {myGroups.length > 0 ? 'Discover More Groups' : 'Available Study Groups'}
          </h2>
          
          {typedAvailableGroups.length > 0 ? (
            <div className="grid md:grid-cols-2 gap-4">
              {typedAvailableGroups.map((group) => {
                const memberCount = group.study_group_members?.length || 0;
                const isFull = group.max_members && memberCount >= group.max_members;

                return (
                  <div
                    key={group.id}
                    className="bg-white rounded-xl border border-slate-200 p-6"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center">
                          <Users className="w-6 h-6 text-slate-600" />
                        </div>
                        <div>
                          <h3 className="font-bold text-slate-900">{group.name}</h3>
                          <p className="text-sm text-slate-600">{group.courses?.title}</p>
                        </div>
                      </div>
                    </div>

                    {group.description && (
                      <p className="text-sm text-slate-600 mb-4 line-clamp-2">
                        {group.description}
                      </p>
                    )}

                    <div className="flex flex-wrap gap-4 text-sm text-slate-500 mb-4">
                      <span className="flex items-center gap-1">
                        <Users className="w-4 h-4" />
                        {memberCount}/{group.max_members || '∞'} members
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
                    </div>

                    <button
                      disabled={isFull}
                      className={`w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg font-medium transition ${
                        isFull
                          ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                          : 'bg-brand-blue-600 text-white hover:bg-brand-blue-700'
                      }`}
                    >
                      {isFull ? (
                        'Group Full'
                      ) : (
                        <>
                          <UserPlus className="w-4 h-4" />
                          Join Group
                        </>
                      )}
                    </button>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-slate-200 p-16 text-center">
              <Users className="w-16 h-16 text-slate-300 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-slate-900 mb-2">No Study Groups Yet</h3>
              <p className="text-slate-600 mb-6 max-w-md mx-auto">
                Be the first to create a study group for your course! Collaborate with classmates to learn together.
              </p>
              <button className="inline-flex items-center gap-2 bg-brand-blue-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-brand-blue-700 transition">
                <Plus className="w-5 h-5" />
                Create Study Group
              </button>
            </div>
          )}
        </div>

        {/* Benefits Section */}
        <div className="mt-12 bg-brand-blue-600 rounded-2xl p-8 text-white">
          <h2 className="text-2xl font-bold mb-6 text-center">Why Join a Study Group?</h2>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center mx-auto mb-3">
                <BookOpen className="w-6 h-6" />
              </div>
              <h3 className="font-semibold mb-2">Learn Together</h3>
              <p className="text-sm text-brand-blue-100">
                Discuss concepts and help each other understand difficult topics
              </p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center mx-auto mb-3">
                <MessageSquare className="w-6 h-6" />
              </div>
              <h3 className="font-semibold mb-2">Stay Motivated</h3>
              <p className="text-sm text-brand-blue-100">
                Regular meetings keep you accountable and on track
              </p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center mx-auto mb-3">
                <Users className="w-6 h-6" />
              </div>
              <h3 className="font-semibold mb-2">Build Connections</h3>
              <p className="text-sm text-brand-blue-100">
                Network with peers who share your learning goals
              </p>
            </div>
          </div>
        </div>

        {/* Back Link */}
        <div className="mt-8 text-center">
          <Link href="/lms/community" className="text-brand-blue-600 hover:text-brand-blue-700 font-medium">
            ← Back to Community
          </Link>
        </div>
      </div>
    </div>
  );
}
