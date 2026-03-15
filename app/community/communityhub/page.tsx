import { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import Link from 'next/link';
import { Users, MessageSquare, Calendar, BookOpen, ArrowRight } from 'lucide-react';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';

export const metadata: Metadata = {
  alternates: {
    canonical: 'https://www.elevateforhumanity.org/community/communityhub',
  },
  title: 'Community Hub | Elevate For Humanity',
  description: 'Connect with fellow learners, instructors, and industry professionals.',
};

export const dynamic = 'force-dynamic';

export default async function CommunityHubPage() {
  const supabase = await createClient();
  const _admin = createAdminClient(); const db = _admin || supabase;
  if (!supabase) { return <div className="min-h-screen bg-white flex items-center justify-center"><div className="text-center"><h1 className="text-2xl font-bold text-gray-900 mb-4">Service Unavailable</h1><p className="text-gray-600">Please try again later.</p></div></div>; }
  const { data: { user } } = await supabase.auth.getUser();

  // Get community groups
  const { data: groups } = await db
    .from('community_groups')
    .select('*')
    .eq('is_active', true)
    .order('member_count', { ascending: false })
    .limit(6);

  // Get upcoming community events
  const { data: events } = await db
    .from('community_events')
    .select('*')
    .eq('is_active', true)
    .gte('date', new Date().toISOString())
    .order('date', { ascending: true })
    .limit(4);

  // Get recent discussions
  const { data: discussions } = await db
    .from('discussions')
    .select(`
      id,
      title,
      created_at,
      reply_count,
      author:author_id(full_name)
    `)
    .eq('is_active', true)
    .order('created_at', { ascending: false })
    .limit(5);

  const defaultGroups = [
    { id: 1, name: 'Healthcare Professionals', member_count: 245, description: 'Connect with CNA, phlebotomy, and healthcare students' },
    { id: 2, name: 'Skilled Trades', member_count: 189, description: 'HVAC, electrical, and construction professionals' },
    { id: 3, name: 'Career Changers', member_count: 312, description: 'Support for those transitioning careers' },
    { id: 4, name: 'Alumni Network', member_count: 567, description: 'Stay connected after graduation' },
  ];

  const displayGroups = groups && groups.length > 0 ? groups : defaultGroups;

  return (
    <div className="min-h-screen bg-white">
      <Breadcrumbs
        items={[
          { label: 'Community', href: '/community' },
          { label: 'Community Hub' },
        ]}
      />
      {/* Hero */}
      <section className="bg-white text-white py-16">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <Users className="w-16 h-16 mx-auto mb-6" />
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Community Hub</h1>
          <p className="text-xl text-brand-blue-100 max-w-2xl mx-auto">
            Connect with fellow learners, instructors, and industry professionals
          </p>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 py-12">
        {/* Quick Actions */}
        {!user && (
          <div className="bg-brand-blue-50 border border-brand-blue-200 rounded-xl p-6 mb-12 text-center">
            <p className="text-brand-blue-800 mb-4">Sign in to join discussions and connect with the community</p>
            <Link
              href="/login?redirect=/community/communityhub"
              className="inline-block bg-brand-blue-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-brand-blue-700 transition"
            >
              Sign In
            </Link>
          </div>
        )}

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Groups */}
            <section>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold">Community Groups</h2>
                <Link href="/community/groups" className="text-brand-blue-600 font-medium hover:underline">
                  View All
                </Link>
              </div>
              <div className="grid md:grid-cols-2 gap-4">
                {displayGroups.map((group: any) => (
                  <Link
                    key={group.id}
                    href={`/community/groups/${group.id}`}
                    className="bg-white rounded-xl p-6 border hover:shadow-md transition"
                  >
                    <h3 className="font-bold text-lg mb-2">{group.name}</h3>
                    <p className="text-gray-600 text-sm mb-3">{group.description}</p>
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <Users className="w-4 h-4" />
                      {group.member_count} members
                    </div>
                  </Link>
                ))}
              </div>
            </section>

            {/* Recent Discussions */}
            <section>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold">Recent Discussions</h2>
                <Link href="/community/discussions" className="text-brand-blue-600 font-medium hover:underline">
                  View All
                </Link>
              </div>
              <div className="bg-white rounded-xl border divide-y">
                {discussions && discussions.length > 0 ? (
                  discussions.map((discussion: any) => (
                    <Link
                      key={discussion.id}
                      href={`/community/discussions/${discussion.id}`}
                      className="block p-4 hover:bg-white transition"
                    >
                      <h3 className="font-medium mb-1">{discussion.title}</h3>
                      <div className="flex items-center gap-4 text-sm text-gray-500">
                        <span>by {discussion.author?.full_name || 'Anonymous'}</span>
                        <span>{discussion.reply_count || 0} replies</span>
                      </div>
                    </Link>
                  ))
                ) : (
                  <div className="p-8 text-center text-gray-500">
                    <MessageSquare className="w-10 h-10 mx-auto mb-3 text-gray-300" />
                    <p>No discussions yet. Start one!</p>
                  </div>
                )}
              </div>
            </section>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Upcoming Events */}
            <section className="bg-white rounded-xl border p-6">
              <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-brand-blue-600" />
                Upcoming Events
              </h3>
              {events && events.length > 0 ? (
                <div className="space-y-4">
                  {events.map((event: any) => (
                    <Link
                      key={event.id}
                      href={`/events/${event.id}`}
                      className="block hover:bg-white p-2 -mx-2 rounded transition"
                    >
                      <div className="text-sm text-brand-blue-600 font-medium">
                        {new Date(event.date).toLocaleDateString()}
                      </div>
                      <div className="font-medium">{event.title}</div>
                    </Link>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-sm">No upcoming events</p>
              )}
              <Link
                href="/events"
                className="inline-flex items-center gap-1 text-brand-blue-600 text-sm font-medium mt-4 hover:underline"
              >
                View all events <ArrowRight className="w-4 h-4" />
              </Link>
            </section>

            {/* Resources */}
            <section className="bg-white rounded-xl border p-6">
              <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-brand-blue-600" />
                Resources
              </h3>
              <ul className="space-y-3">
                <li>
                  <Link href="/community/teachers" className="text-brand-blue-600 hover:underline">
                    For Teachers
                  </Link>
                </li>
                <li>
                  <Link href="/community/admins" className="text-brand-blue-600 hover:underline">
                    For Administrators
                  </Link>
                </li>
                <li>
                  <Link href="/community/developers" className="text-brand-blue-600 hover:underline">
                    For Developers
                  </Link>
                </li>
              </ul>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
