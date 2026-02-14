import { Metadata } from 'next';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { 
  Users, MessageSquare, Heart, Share2, Image as ImageIcon,
  Plus, Search, Bell, UserPlus, TrendingUp, Trophy, Flame, Award
} from 'lucide-react';
import { StreakTracker } from '@/components/gamification/StreakTracker';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  robots: { index: false, follow: false },
  title: 'Social Feed | LMS | Elevate For Humanity',
  description: 'Connect with fellow learners, share achievements, and engage with the community.',
};

export default async function SocialPage() {
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
    redirect('/login?redirect=/lms/social');
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Breadcrumbs */}
      <div className="bg-white border-b">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <Breadcrumbs items={[
            { label: 'LMS', href: '/lms/dashboard' },
            { label: 'Social Feed' }
          ]} />
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-4 gap-8">
          {/* Left Sidebar */}
          <div className="lg:col-span-1">
            {/* Profile Card */}
            <div className="bg-white rounded-xl shadow-sm border overflow-hidden mb-6">
              <div className="h-20 bg-brand-blue-500"></div>
              <div className="px-4 pb-4">
                <div className="w-16 h-16 bg-gray-200 rounded-full border-4 border-white -mt-8 flex items-center justify-center">
                  {profile?.avatar_url ? (
                    <img src={profile.avatar_url} alt={profile?.full_name || 'Your profile'} className="w-full h-full rounded-full object-cover" />
                  ) : (
                    <Users className="w-8 h-8 text-gray-400" />
                  )}
                </div>
                <h3 className="font-semibold text-gray-900 mt-2">
                  {profile?.full_name || 'Student'}
                </h3>
                <p className="text-sm text-gray-600">
                  {profile?.headline || 'Elevate Learner'}
                </p>
                <div className="flex gap-4 mt-4 text-sm">
                  <div>
                    <span className="font-semibold text-gray-900">0</span>
                    <span className="text-gray-600 ml-1">Connections</span>
                  </div>
                  <div>
                    <span className="font-semibold text-gray-900">0</span>
                    <span className="text-gray-600 ml-1">Posts</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Links */}
            <div className="bg-white rounded-xl p-4 shadow-sm border">
              <h3 className="font-semibold text-gray-900 mb-3">Quick Links</h3>
              <nav className="space-y-1">
                <Link href="/lms/social/connections" className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-50 text-gray-700">
                  <UserPlus className="w-5 h-5 text-gray-400" />
                  Find Connections
                </Link>
                <Link href="/lms/social/groups" className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-50 text-gray-700">
                  <Users className="w-5 h-5 text-gray-400" />
                  Study Groups
                </Link>
                <Link href="/lms/social/trending" className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-50 text-gray-700">
                  <TrendingUp className="w-5 h-5 text-gray-400" />
                  Trending Topics
                </Link>
              </nav>
            </div>
          </div>

          {/* Main Feed */}
          <div className="lg:col-span-2">
            {/* Create Post */}
            <div className="bg-white rounded-xl p-4 shadow-sm border mb-6">
              <div className="flex gap-4">
                <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center flex-shrink-0">
                  {profile?.avatar_url ? (
                    <img src={profile.avatar_url} alt={profile?.full_name || 'Your profile'} className="w-full h-full rounded-full object-cover" />
                  ) : (
                    <Users className="w-5 h-5 text-gray-400" />
                  )}
                </div>
                <button className="flex-1 text-left px-4 py-3 bg-gray-100 rounded-full text-gray-500 hover:bg-gray-200 transition-colors">
                  Share an update or achievement...
                </button>
              </div>
              <div className="flex gap-2 mt-4 pt-4 border-t">
                <button className="flex items-center gap-2 px-4 py-2 rounded-lg hover:bg-gray-100 text-gray-600">
                  <ImageIcon className="w-5 h-5 text-green-600" />
                  Photo
                </button>
                <button className="flex items-center gap-2 px-4 py-2 rounded-lg hover:bg-gray-100 text-gray-600">
                  <MessageSquare className="w-5 h-5 text-brand-blue-600" />
                  Article
                </button>
              </div>
            </div>

            {/* Empty State */}
            <div className="bg-white rounded-xl p-12 shadow-sm border text-center">
              <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Welcome to the Community!
              </h3>
              <p className="text-gray-600 mb-6 max-w-md mx-auto">
                Connect with fellow learners, share your achievements, and engage in discussions. 
                Start by finding connections or joining a study group.
              </p>
              <div className="flex gap-4 justify-center">
                <Link
                  href="/lms/social/connections"
                  className="inline-flex items-center gap-2 px-6 py-3 bg-brand-blue-600 text-white rounded-lg hover:bg-brand-blue-700 font-medium"
                >
                  <UserPlus className="w-5 h-5" />
                  Find Connections
                </Link>
                <Link
                  href="/lms/social/groups"
                  className="inline-flex items-center gap-2 px-6 py-3 bg-white border rounded-lg hover:bg-gray-50 text-gray-700 font-medium"
                >
                  <Users className="w-5 h-5" />
                  Browse Groups
                </Link>
              </div>
            </div>
          </div>

          {/* Right Sidebar */}
          <div className="lg:col-span-1">
            {/* Suggested Connections */}
            <div className="bg-white rounded-xl p-4 shadow-sm border mb-6">
              <h3 className="font-semibold text-gray-900 mb-4">People You May Know</h3>
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-gray-900 truncate">Fellow Learner</div>
                    <div className="text-sm text-gray-500 truncate">Healthcare Program</div>
                  </div>
                  <button className="p-2 text-brand-blue-600 hover:bg-brand-blue-50 rounded-lg">
                    <UserPlus className="w-5 h-5" />
                  </button>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-gray-900 truncate">Study Partner</div>
                    <div className="text-sm text-gray-500 truncate">IT Certification</div>
                  </div>
                  <button className="p-2 text-brand-blue-600 hover:bg-brand-blue-50 rounded-lg">
                    <UserPlus className="w-5 h-5" />
                  </button>
                </div>
              </div>
              <Link
                href="/lms/social/connections"
                className="block text-center text-brand-blue-600 hover:text-brand-blue-700 text-sm font-medium mt-4 pt-4 border-t"
              >
                See All Suggestions
              </Link>
            </div>

            {/* Active Groups */}
            <div className="bg-white rounded-xl p-4 shadow-sm border">
              <h3 className="font-semibold text-gray-900 mb-4">Popular Groups</h3>
              <div className="space-y-3">
                <Link href="/lms/social/groups/healthcare" className="block p-3 rounded-lg hover:bg-gray-50">
                  <div className="font-medium text-gray-900">Healthcare Professionals</div>
                  <div className="text-sm text-gray-500">234 members</div>
                </Link>
                <Link href="/lms/social/groups/trades" className="block p-3 rounded-lg hover:bg-gray-50">
                  <div className="font-medium text-gray-900">Skilled Trades Network</div>
                  <div className="text-sm text-gray-500">189 members</div>
                </Link>
                <Link href="/lms/social/groups/career" className="block p-3 rounded-lg hover:bg-gray-50">
                  <div className="font-medium text-gray-900">Career Changers</div>
                  <div className="text-sm text-gray-500">156 members</div>
                </Link>
              </div>
              <Link
                href="/lms/social/groups"
                className="block text-center text-brand-blue-600 hover:text-brand-blue-700 text-sm font-medium mt-4 pt-4 border-t"
              >
                Browse All Groups
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
