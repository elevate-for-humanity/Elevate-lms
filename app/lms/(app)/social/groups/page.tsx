import { Metadata } from 'next';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { 
  Users, Search, Plus, Heart, Briefcase, 
  Wrench, GraduationCap, Globe, ChevronRight
} from 'lucide-react';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  robots: { index: false, follow: false },
  title: 'Study Groups | Social | LMS | Elevate For Humanity',
  description: 'Join study groups and connect with learners in your field.',
};

const featuredGroups = [
  {
    id: 'healthcare',
    name: 'Healthcare Professionals',
    description: 'Connect with nurses, medical assistants, and healthcare workers',
    members: 234,
    icon: Heart,
    color: 'red',
    href: '/lms/social/groups/healthcare',
  },
  {
    id: 'trades',
    name: 'Skilled Trades Network',
    description: 'Electricians, plumbers, HVAC techs, and construction pros',
    members: 189,
    icon: Wrench,
    color: 'orange',
    href: '/lms/social/groups/trades',
  },
  {
    id: 'career',
    name: 'Career Changers',
    description: 'Support for those transitioning to new careers',
    members: 156,
    icon: Briefcase,
    color: 'blue',
    href: '/lms/social/groups/career',
  },
  {
    id: 'it',
    name: 'IT & Technology',
    description: 'Software developers, IT support, and tech enthusiasts',
    members: 145,
    icon: Globe,
    color: 'purple',
  },
  {
    id: 'business',
    name: 'Business & Entrepreneurship',
    description: 'Aspiring business owners and entrepreneurs',
    members: 112,
    icon: Briefcase,
    color: 'green',
  },
  {
    id: 'education',
    name: 'Education & Training',
    description: 'Teachers, trainers, and education professionals',
    members: 98,
    icon: GraduationCap,
    color: 'indigo',
  },
];

export default async function GroupsPage() {
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
    redirect('/login?redirect=/lms/social/groups');
  }

  // Fetch user's groups
  let myGroups: any[] = [];
  try {
    const { data } = await supabase
      .from('study_groups')
      .select('id, name, description, member_count, category')
      .contains('member_ids', [user.id])
      .limit(6);
    myGroups = data || [];
  } catch {
    // Table may not exist
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Breadcrumbs */}
      <div className="bg-white border-b">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <Breadcrumbs items={[
            { label: 'LMS', href: '/lms/dashboard' },
            { label: 'Social', href: '/lms/social' },
            { label: 'Groups' }
          ]} />
        </div>
      </div>

      {/* Hero Section */}
      <div className="bg-gradient-to-r from-purple-600 to-pink-600 text-white">
        <div className="max-w-6xl mx-auto px-4 py-12">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center">
                <Users className="w-8 h-8" />
              </div>
              <div>
                <h1 className="text-3xl font-bold">Study Groups</h1>
                <p className="text-purple-100 mt-1">
                  Join communities of learners in your field
                </p>
              </div>
            </div>
            <button className="flex items-center gap-2 px-6 py-3 bg-white text-purple-700 rounded-lg hover:bg-purple-50 font-medium">
              <Plus className="w-5 h-5" />
              Create Group
            </button>
          </div>
          
          {/* Search Bar */}
          <div className="mt-8 max-w-2xl">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search groups by name or topic..."
                className="w-full pl-12 pr-4 py-4 rounded-xl text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-white/50"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* My Groups */}
        <div className="bg-white rounded-xl shadow-sm border mb-8">
          <div className="p-6 border-b flex items-center justify-between">
            <h2 className="font-semibold text-gray-900">My Groups</h2>
            <Link href="/lms/study-groups" className="text-purple-600 hover:text-purple-700 text-sm font-medium">
              Manage Groups
            </Link>
          </div>
          {myGroups.length > 0 ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 p-6">
              {myGroups.map((group: any) => (
                <Link
                  key={group.id}
                  href={`/lms/social/groups/${group.id}`}
                  className="border rounded-xl p-4 hover:border-purple-300 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                      <Users className="w-6 h-6 text-purple-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-gray-900 truncate">{group.name}</div>
                      <div className="text-sm text-gray-500">{group.member_count || 0} members</div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-gray-400" />
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="p-8 text-center">
              <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-600">You haven&apos;t joined any groups yet.</p>
              <p className="text-sm text-gray-500 mt-1">Browse the groups below to get started!</p>
            </div>
          )}
        </div>

        {/* Featured Groups */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Featured Groups</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {featuredGroups.map((group) => (
              <Link
                key={group.id}
                href={group.href || `/lms/social/groups/${group.id}`}
                className="bg-white rounded-xl shadow-sm border p-6 hover:border-purple-300 hover:shadow-md transition-all"
              >
                <div className="flex items-start gap-4">
                  <div className={`w-14 h-14 rounded-xl flex items-center justify-center flex-shrink-0 ${
                    group.color === 'red' ? 'bg-red-100' :
                    group.color === 'orange' ? 'bg-orange-100' :
                    group.color === 'blue' ? 'bg-blue-100' :
                    group.color === 'purple' ? 'bg-purple-100' :
                    group.color === 'green' ? 'bg-green-100' : 'bg-indigo-100'
                  }`}>
                    <group.icon className={`w-7 h-7 ${
                      group.color === 'red' ? 'text-red-600' :
                      group.color === 'orange' ? 'text-orange-600' :
                      group.color === 'blue' ? 'text-blue-600' :
                      group.color === 'purple' ? 'text-purple-600' :
                      group.color === 'green' ? 'text-green-600' : 'text-indigo-600'
                    }`} />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900">{group.name}</h3>
                    <p className="text-sm text-gray-600 mt-1">{group.description}</p>
                    <div className="flex items-center gap-2 mt-3 text-sm text-gray-500">
                      <Users className="w-4 h-4" />
                      {group.members} members
                    </div>
                  </div>
                </div>
                <button className="w-full mt-4 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 text-sm font-medium">
                  Join Group
                </button>
              </Link>
            ))}
          </div>
        </div>

        {/* Create Your Own */}
        <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-8 text-center">
          <h3 className="text-xl font-semibold text-gray-900 mb-2">Can&apos;t find what you&apos;re looking for?</h3>
          <p className="text-gray-600 mb-6">Create your own study group and invite others to join!</p>
          <button className="inline-flex items-center gap-2 px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 font-medium">
            <Plus className="w-5 h-5" />
            Create a New Group
          </button>
        </div>
      </div>
    </div>
  );
}
