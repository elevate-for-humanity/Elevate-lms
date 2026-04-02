import { Breadcrumbs } from '@/components/ui/Breadcrumbs';

import { Metadata } from 'next';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  alternates: {
    canonical: 'https://www.elevateforhumanity.org/lms/community',
  },
  title: 'Community | LMS | Elevate For Humanity',
  description: 'Connect with fellow learners and join study groups.',
};

export default async function CommunityPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login?redirect=/lms/community');
  }

  return (
    <div className="min-h-screen bg-white py-8">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <Breadcrumbs items={[{ label: "LMS", href: "/lms/courses" }, { label: "Community" }]} />
        </div>
      <div className="container mx-auto px-4">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-3xl font-bold mb-8">Community</h1>

          {/* Quick Links */}
          <div className="grid md:grid-cols-3 gap-6 mb-8">
            <Link
              href="/lms/forums"
              className="bg-white rounded-lg shadow-sm border p-6 hover:shadow-md transition-shadow"
            >
              <div className="w-12 h-12 bg-brand-blue-100 rounded-lg flex items-center justify-center mb-4">
                <svg
                  className="w-6 h-6 text-brand-blue-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z"
                  />
                </svg>
              </div>
              <h2 className="text-lg font-semibold mb-2">Forums</h2>
              <p className="text-gray-600 text-sm">
                Discuss topics with fellow learners
              </p>
            </Link>

            <Link
              href="/lms/groups"
              className="bg-white rounded-lg shadow-sm border p-6 hover:shadow-md transition-shadow"
            >
              <div className="w-12 h-12 bg-brand-green-100 rounded-lg flex items-center justify-center mb-4">
                <svg
                  className="w-6 h-6 text-brand-green-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                  />
                </svg>
              </div>
              <h2 className="text-lg font-semibold mb-2">Study Groups</h2>
              <p className="text-gray-600 text-sm">
                Join or create study groups
              </p>
            </Link>

            <Link
              href="/lms/leaderboard"
              className="bg-white rounded-lg shadow-sm border p-6 hover:shadow-md transition-shadow"
            >
              <div className="w-12 h-12 bg-brand-blue-100 rounded-lg flex items-center justify-center mb-4">
                <svg
                  className="w-6 h-6 text-brand-blue-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                  />
                </svg>
              </div>
              <h2 className="text-lg font-semibold mb-2">Leaderboard</h2>
              <p className="text-gray-600 text-sm">
                See top learners and achievements
              </p>
            </Link>
          </div>

          {/* Recent Activity */}
          <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4">Recent Activity</h2>
            <div className="space-y-4">
              <div className="flex items-start gap-4 p-4 bg-white rounded-lg">
                <div className="w-10 h-10 bg-brand-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-brand-blue-600 font-semibold">C</span>
                </div>
                <div>
                  <p className="font-medium">Community Discussion</p>
                  <p className="text-sm text-gray-600">
                    Join the conversation in our forums
                  </p>
                  <Link
                    href="/lms/forums"
                    className="text-sm text-brand-blue-600 hover:text-brand-blue-700"
                  >
                    View Forums →
                  </Link>
                </div>
              </div>
            </div>
          </div>

          {/* Featured Groups */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Featured Groups</h2>
              <Link
                href="/lms/groups"
                className="text-brand-blue-600 hover:text-brand-blue-700 font-medium text-sm"
              >
                View All →
              </Link>
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="p-4 bg-white rounded-lg">
                <h3 className="font-medium mb-1">General Discussion</h3>
                <p className="text-sm text-gray-600 mb-2">
                  Connect with all learners
                </p>
                <Link
                  href="/lms/groups"
                  className="text-sm text-brand-blue-600"
                >
                  Join Group
                </Link>
              </div>
              <div className="p-4 bg-white rounded-lg">
                <h3 className="font-medium mb-1">Study Partners</h3>
                <p className="text-sm text-gray-600 mb-2">
                  Find study partners for your courses
                </p>
                <Link
                  href="/lms/groups"
                  className="text-sm text-brand-blue-600"
                >
                  Join Group
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
