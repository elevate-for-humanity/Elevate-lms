import { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import Link from 'next/link';
import { Users, Search, Filter, ArrowRight } from 'lucide-react';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';

export const metadata: Metadata = {
  title: 'Members | Community | Elevate For Humanity',
  description: 'Connect with fellow community members, mentors, and industry professionals.',
};

export const dynamic = 'force-dynamic';

export default async function MembersPage() {
  const supabase = await createClient();
  const _admin = createAdminClient(); const db = _admin || supabase;
  
  if (!supabase) return <div className="min-h-screen bg-gray-50 flex items-center justify-center"><div className="text-center"><h1 className="text-2xl font-bold text-gray-900 mb-4">Service Unavailable</h1><p className="text-gray-600">Please try again later.</p></div></div>;

  // Fetch real member count and data
  const { data: members, count } = await db
    .from('profiles')
    .select('id, full_name, avatar_url, role, bio, points, created_at', { count: 'exact' })
    .order('points', { ascending: false })
    .limit(50);

  // Get role counts for categories
  const { data: roleCounts } = await db
    .from('profiles')
    .select('role')
    .not('role', 'is', null);

  const categoryMap: Record<string, number> = {};
  roleCounts?.forEach((r: any) => {
    const role = r.role || 'student';
    categoryMap[role] = (categoryMap[role] || 0) + 1;
  });

  const getInitial = (name: string | null) => {
    return name?.charAt(0)?.toUpperCase() || 'U';
  };

  const formatRole = (role: string | null) => {
    if (!role) return 'Student';
    return role.charAt(0).toUpperCase() + role.slice(1).replace(/_/g, ' ');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Breadcrumbs */}
      <div className="bg-slate-50 border-b">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <Breadcrumbs items={[{ label: 'Community', href: '/community' }, { label: 'Members' }]} />
        </div>
      </div>

      {/* Hero */}
      <section className="relative bg-brand-orange-600 text-white py-20">
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <div className="flex items-center gap-2 mb-4">
              <Users className="w-6 h-6 text-brand-orange-200" />
              <span className="text-brand-orange-100 font-medium">Member Directory</span>
            </div>
            <h1 className="text-4xl sm:text-5xl font-bold mb-6">
              Connect With<br />{(count || 0).toLocaleString()} Members
            </h1>
            <p className="text-xl text-brand-orange-100 mb-8">
              Find mentors, study partners, and industry professionals who can help you on your journey.
            </p>
            
            {/* Search */}
            <div className="flex gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search members by name or role..."
                  className="w-full pl-12 pr-4 py-4 rounded-full text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-brand-orange-300"
                />
              </div>
              <button className="px-6 py-4 bg-brand-orange-800 text-white font-semibold rounded-full hover:bg-brand-orange-900 transition-colors flex items-center gap-2">
                <Filter className="w-5 h-5" />
                Filters
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="py-8 bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-wrap gap-4">
            <button className="px-6 py-2 rounded-full font-medium bg-brand-orange-600 text-white">
              All Members ({(count || 0).toLocaleString()})
            </button>
            {Object.entries(categoryMap).slice(0, 4).map(([role, roleCount]) => (
              <button
                key={role}
                className="px-6 py-2 rounded-full font-medium bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors"
              >
                {formatRole(role)} ({roleCount})
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Members Grid */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-12">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-2">Community Members</h2>
              <p className="text-gray-600">Ranked by activity and contributions</p>
            </div>
          </div>

          {members && members.length > 0 ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {members.map((member: any) => (
                <div key={member.id} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-lg transition-shadow">
                  <div className="flex items-start gap-4">
                    <div className="w-16 h-16 rounded-full bg-brand-blue-500 flex items-center justify-center text-white text-xl font-bold flex-shrink-0">
                      {getInitial(member.full_name)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-gray-900 truncate">{member.full_name || 'Member'}</h3>
                      <p className="text-gray-600 text-sm">{formatRole(member.role)}</p>
                      {member.bio && (
                        <p className="text-gray-500 text-sm mt-1 line-clamp-2">{member.bio}</p>
                      )}
                    </div>
                  </div>

                  <div className="mt-4 flex items-center justify-between">
                    <span className="text-sm text-gray-500">
                      {(member.points || 0).toLocaleString()} points
                    </span>
                    <span className="text-xs text-gray-400">
                      Joined {new Date(member.created_at).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center">
              <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-gray-900 mb-2">No members yet</h3>
              <p className="text-gray-600 mb-6">Be the first to join the community!</p>
              <Link 
                href="/apply" 
                className="inline-flex items-center gap-2 px-6 py-3 bg-brand-green-600 text-white rounded-lg font-medium hover:bg-brand-green-700"
              >
                Apply Now
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 bg-brand-orange-600">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">Ready to Join?</h2>
          <p className="text-brand-orange-100 mb-8 max-w-2xl mx-auto">
            Start your journey and connect with others working toward career success.
          </p>
          <Link
            href="/programs"
            className="inline-flex items-center gap-2 px-8 py-4 bg-white text-brand-orange-600 font-semibold rounded-full hover:bg-brand-orange-50 transition-colors"
          >
            Browse Programs
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </section>
    </div>
  );
}
