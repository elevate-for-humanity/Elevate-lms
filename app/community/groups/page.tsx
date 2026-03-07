import { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import Link from 'next/link';
import Image from 'next/image';
import {
  Users,
  Plus,
  Search,
  Globe,
  Lock,
  Calendar,
} from 'lucide-react';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';

export const metadata: Metadata = {
  title: 'Community Groups | Elevate for Humanity',
  description:
    'Join study groups, networking circles, and special interest groups. Connect with peers who share your goals and interests.',
  alternates: {
    canonical: 'https://www.elevateforhumanity.org/community/groups',
  },
};

export const dynamic = 'force-dynamic';

export default async function GroupsPage() {
  const supabase = await createClient();
  const _admin = createAdminClient(); const db = _admin || supabase;

  // Fetch groups from database
  const { data: groups, error } = await db
    .from('community_groups')
    .select('id, name, description, category, image_url, is_public, member_count, created_at')
    .eq('is_active', true)
    .order('member_count', { ascending: false })
    .limit(20);

  if (error) {
    console.error('Error fetching groups:', error.message);
  }

  // Get current user and their group memberships
  const { data: { user } } = await supabase.auth.getUser();
  let userGroups: string[] = [];

  if (user) {
    const { data: memberships } = await db
      .from('community_group_members')
      .select('group_id')
      .eq('user_id', user.id)
      .eq('status', 'active');

    userGroups = memberships?.map((m: any) => m.group_id) || [];
  }

  // Get category counts
  const { data: categoryCounts } = await db
    .from('community_groups')
    .select('category')
    .eq('is_active', true);

  const categoryMap: Record<string, number> = { 'All Groups': 0 };
  if (categoryCounts) {
    categoryCounts.forEach((g: any) => {
      categoryMap['All Groups']++;
      if (g.category) {
        categoryMap[g.category] = (categoryMap[g.category] || 0) + 1;
      }
    });
  }

  const categories = Object.entries(categoryMap).map(([name, count]) => ({ name, count }));
  const groupList = groups || [];

  return (
    <div className="bg-gray-50 min-h-screen">
      {/* Breadcrumbs */}
      <div className="bg-slate-50 border-b">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <Breadcrumbs items={[{ label: 'Community', href: '/community' }, { label: 'Groups' }]} />
        </div>
      </div>

      {/* Header */}
      <div className="bg-brand-blue-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold mb-2">Community Groups</h1>
              <p className="text-brand-blue-100">Find your tribe and grow together</p>
            </div>
            {user && (
              <Link
                href="/community/groups/create"
                className="mt-4 md:mt-0 bg-brand-orange-500 hover:bg-brand-orange-600 text-white px-6 py-3 rounded-lg font-bold transition inline-flex items-center"
              >
                <Plus className="w-5 h-5 mr-2" />
                Create Group
              </Link>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Search */}
        <div className="bg-white rounded-lg shadow-sm p-4 mb-8">
          <div className="relative max-w-xl mx-auto">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search groups..."
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-blue-500 focus:border-brand-blue-500"
            />
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Main Content */}
          <div className="lg:w-2/3">
            {/* Featured Groups */}
            <h2 className="text-xl font-bold text-gray-900 mb-6">Featured Groups</h2>
            <div className="grid md:grid-cols-2 gap-6 mb-8">
              {featuredGroups.map((group) => (
                <Link
                  key={group.id}
                  href={`/community/groups/${group.id}`}
                  className="bg-white rounded-xl shadow-sm overflow-hidden hover:shadow-lg transition"
                >
                  <div className="relative h-32 overflow-hidden">
                    <Image
                      src={group.image}
                      alt={group.name}
                      fill
                      className="object-cover"
                      sizes="(max-width: 768px) 100vw, 50vw"
                    />
                    
                    <div className="absolute bottom-3 left-3 right-3">
                      <span className="bg-white/90 text-gray-800 text-xs font-medium px-2 py-1 rounded">
                        {group.category}
                      </span>
                    </div>
                  </div>
                  <div className="p-4">
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="font-bold text-gray-900">{group.name}</h3>
                      {group.isPublic ? (
                        <Globe className="w-4 h-4 text-brand-green-600" title="Public Group" />
                      ) : (
                        <Lock className="w-4 h-4 text-gray-400" title="Private Group" />
                      )}
                    </div>
                    <p className="text-sm text-gray-600 mb-3 line-clamp-2">{group.description}</p>
                    <div className="flex items-center text-sm text-gray-500">
                      <Users className="w-4 h-4 mr-1" />
                      {group.members} members
                    </div>
                  </div>
                </Link>
              ))}
            </div>

            {groupList.length === 0 ? (
              <div className="text-center py-16 bg-white rounded-2xl border">
                <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-gray-900 mb-2">No Groups Available</h3>
                <p className="text-gray-600 mb-6">Be the first to create a community group!</p>
                {user && (
                  <Link
                    href="/community/groups/create"
                    className="inline-flex items-center gap-2 px-6 py-3 bg-brand-blue-600 text-white font-semibold rounded-lg hover:bg-brand-blue-700"
                  >
                    <Plus className="w-5 h-5" />
                    Create the First Group
                  </Link>
                )}
              </div>
            ) : (
              <div className="grid md:grid-cols-2 gap-6">
                {groupList.map((group: any) => {
                  const isMember = userGroups.includes(group.id);
                  return (
                    <Link
                      key={group.id}
                      href={`/community/groups/${group.id}`}
                      className="bg-white rounded-xl shadow-sm overflow-hidden hover:shadow-lg transition"
                    >
                      <div className="relative h-32 overflow-hidden">
                        {group.image_url ? (
                          <Image
                            src={group.image_url}
                            alt={group.name}
                            fill
                            className="object-cover"
                            sizes="(max-width: 768px) 100vw, 50vw"
                          />
                        ) : (
                          <div className="absolute inset-0 bg-brand-blue-600 flex items-center justify-center">
                            <Users className="w-12 h-12 text-white/50" />
                          </div>
                        )}
                        <div className="absolute bottom-3 left-3 right-3 flex justify-between items-center">
                          <span className="bg-white/90 text-gray-800 text-xs font-medium px-2 py-1 rounded">
                            {group.category || 'General'}
                          </span>
                          {isMember && (
                            <span className="bg-brand-green-500 text-white text-xs font-medium px-2 py-1 rounded">
                              Joined
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="p-4">
                        <div className="flex items-start justify-between mb-2">
                          <h3 className="font-bold text-gray-900">{group.name}</h3>
                          {group.is_public ? (
                            <Globe className="w-4 h-4 text-brand-green-600" title="Public Group" />
                          ) : (
                            <Lock className="w-4 h-4 text-gray-400" title="Private Group" />
                          )}
                        </div>
                        <p className="text-sm text-gray-600 mb-3 line-clamp-2">{group.description}</p>
                        <div className="flex items-center text-sm text-gray-500">
                          <Users className="w-4 h-4 mr-1" />
                          {group.member_count || 0} members
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="lg:w-1/3">
            {/* Categories */}
            <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
              <h2 className="text-lg font-bold text-gray-900 mb-4">Categories</h2>
              {categories.length > 0 ? (
                <ul className="space-y-2">
                  {categories.map((category, index) => (
                    <li key={index}>
                      <Link
                        href={`/community/groups?category=${encodeURIComponent(category.name)}`}
                        className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-gray-50 transition"
                      >
                        <span className="text-gray-700">{category.name}</span>
                        <span className="bg-gray-100 text-gray-600 text-sm px-2 py-1 rounded">
                          {category.count}
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-gray-500 text-sm">No categories yet</p>
              )}
            </div>

            {/* Your Groups */}
            <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
              <h2 className="text-lg font-bold text-gray-900 mb-4">Your Groups</h2>
              {user ? (
                userGroups.length > 0 ? (
                  <p className="text-gray-600 text-sm">You are a member of {userGroups.length} group(s)</p>
                ) : (
                  <div className="text-center py-4">
                    <Users className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                    <p className="text-gray-600 text-sm">You have not joined any groups yet</p>
                  </div>
                )
              ) : (
                <div className="text-center py-4">
                  <Users className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                  <p className="text-gray-600 mb-3">Sign in to join groups</p>
                  <Link
                    href="/login?redirect=/community/groups"
                    className="text-brand-blue-600 font-medium hover:text-brand-blue-700"
                  >
                    Sign In
                  </Link>
                </div>
              )}
            </div>

            {/* Events CTA */}
            <div className="bg-brand-blue-50 rounded-lg p-6 border border-brand-blue-200">
              <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
                <Calendar className="w-5 h-5 mr-2 text-brand-blue-600" />
                Community Events
              </h2>
              <p className="text-gray-600 text-sm mb-4">
                Join live workshops, webinars, and networking events.
              </p>
              <Link
                href="/community/events"
                className="block text-center text-brand-blue-600 font-medium hover:text-brand-blue-700"
              >
                View all events →
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
