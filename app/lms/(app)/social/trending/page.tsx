import { Metadata } from 'next';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { 
  TrendingUp, Hash, Users, MessageSquare, 
  Flame, Award, BookOpen, Briefcase, Heart,
  ThumbsUp, MessageCircle, Share2, ArrowUp
} from 'lucide-react';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  robots: { index: false, follow: false },
  title: 'Trending Topics | Social | LMS | Elevate For Humanity',
  description: 'Discover trending discussions and popular topics in the community.',
};

const trendingTopics = [
  { tag: 'CNACertification', posts: 156, trend: '+23%' },
  { tag: 'CareerChange', posts: 134, trend: '+18%' },
  { tag: 'CDLTraining', posts: 98, trend: '+45%' },
  { tag: 'InterviewTips', posts: 87, trend: '+12%' },
  { tag: 'BarberLife', posts: 76, trend: '+31%' },
  { tag: 'HVACCareers', posts: 65, trend: '+28%' },
];

const trendingPosts = [
  {
    id: 1,
    author: 'Amanda K.',
    group: 'Healthcare Professionals',
    groupIcon: Heart,
    groupColor: 'red',
    title: 'From fast food to healthcare: My 6-month journey',
    preview: 'I never thought I could work in healthcare, but the CNA program changed everything...',
    likes: 234,
    comments: 67,
    shares: 45,
    time: '6 hours ago',
  },
  {
    id: 2,
    author: 'Robert M.',
    group: 'Skilled Trades Network',
    groupIcon: Briefcase,
    groupColor: 'orange',
    title: 'Why I left my desk job for electrical work',
    preview: 'After 10 years in an office, I made the switch. Best decision of my life...',
    likes: 189,
    comments: 54,
    shares: 32,
    time: '12 hours ago',
  },
  {
    id: 3,
    author: 'Jessica T.',
    group: 'Career Changers',
    groupIcon: TrendingUp,
    groupColor: 'blue',
    title: 'How I negotiated a 40% salary increase after retraining',
    preview: 'The key was positioning my previous experience as an asset, not a liability...',
    likes: 156,
    comments: 89,
    shares: 67,
    time: '1 day ago',
  },
];

const topContributors = [
  { name: 'Sarah M.', posts: 45, helpful: 234 },
  { name: 'Graduate J.', posts: 38, helpful: 198 },
  { name: 'Lisa K.', posts: 32, helpful: 167 },
  { name: 'David L.', posts: 28, helpful: 145 },
];

export default async function TrendingPage() {
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
    redirect('/login?redirect=/lms/social/trending');
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Breadcrumbs */}
      <div className="bg-white border-b">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <Breadcrumbs items={[
            { label: 'LMS', href: '/lms/dashboard' },
            { label: 'Social', href: '/lms/social' },
            { label: 'Trending' }
          ]} />
        </div>
      </div>

      {/* Hero Section */}
      <div className="bg-gradient-to-r from-amber-500 to-orange-600 text-white">
        <div className="max-w-6xl mx-auto px-4 py-12">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center">
              <TrendingUp className="w-8 h-8" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">Trending Topics</h1>
              <p className="text-amber-100 mt-1">
                Discover what the community is talking about
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Trending Hashtags */}
            <div className="bg-white rounded-xl shadow-sm border p-6">
              <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Flame className="w-5 h-5 text-orange-500" />
                Trending Hashtags
              </h2>
              <div className="grid md:grid-cols-2 gap-4">
                {trendingTopics.map((topic, i) => (
                  <Link
                    key={i}
                    href={`/lms/social?tag=${topic.tag}`}
                    className="flex items-center justify-between p-4 rounded-lg border hover:border-orange-300 hover:bg-orange-50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                        <Hash className="w-5 h-5 text-orange-600" />
                      </div>
                      <div>
                        <div className="font-medium text-gray-900">#{topic.tag}</div>
                        <div className="text-sm text-gray-500">{topic.posts} posts</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 text-green-600 text-sm font-medium">
                      <ArrowUp className="w-4 h-4" />
                      {topic.trend}
                    </div>
                  </Link>
                ))}
              </div>
            </div>

            {/* Trending Posts */}
            <div className="bg-white rounded-xl shadow-sm border">
              <div className="p-6 border-b">
                <h2 className="font-semibold text-gray-900 flex items-center gap-2">
                  <Award className="w-5 h-5 text-amber-500" />
                  Top Posts This Week
                </h2>
              </div>
              <div className="divide-y">
                {trendingPosts.map((post) => (
                  <div key={post.id} className="p-6 hover:bg-gray-50">
                    <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
                      <div className={`w-6 h-6 rounded flex items-center justify-center ${
                        post.groupColor === 'red' ? 'bg-red-100' :
                        post.groupColor === 'orange' ? 'bg-orange-100' : 'bg-blue-100'
                      }`}>
                        <post.groupIcon className={`w-4 h-4 ${
                          post.groupColor === 'red' ? 'text-red-600' :
                          post.groupColor === 'orange' ? 'text-orange-600' : 'text-blue-600'
                        }`} />
                      </div>
                      <span>{post.group}</span>
                      <span>•</span>
                      <span>{post.author}</span>
                      <span>•</span>
                      <span>{post.time}</span>
                    </div>
                    <h3 className="font-semibold text-gray-900 text-lg hover:text-orange-600 cursor-pointer">
                      {post.title}
                    </h3>
                    <p className="text-gray-600 mt-2">{post.preview}</p>
                    <div className="flex items-center gap-6 mt-4">
                      <button className="flex items-center gap-2 text-gray-500 hover:text-orange-600">
                        <ThumbsUp className="w-5 h-5" />
                        <span className="font-medium">{post.likes}</span>
                      </button>
                      <button className="flex items-center gap-2 text-gray-500 hover:text-orange-600">
                        <MessageCircle className="w-5 h-5" />
                        <span>{post.comments}</span>
                      </button>
                      <button className="flex items-center gap-2 text-gray-500 hover:text-orange-600">
                        <Share2 className="w-5 h-5" />
                        <span>{post.shares}</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
              <div className="p-4 border-t text-center">
                <button className="text-orange-600 hover:text-orange-700 font-medium">
                  View More Trending Posts
                </button>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Top Contributors */}
            <div className="bg-white rounded-xl shadow-sm border p-6">
              <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Award className="w-5 h-5 text-yellow-500" />
                Top Contributors
              </h3>
              <div className="space-y-4">
                {topContributors.map((contributor, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-amber-400 to-orange-500 rounded-full flex items-center justify-center text-white font-bold">
                      {i + 1}
                    </div>
                    <div className="flex-1">
                      <div className="font-medium text-gray-900">{contributor.name}</div>
                      <div className="text-sm text-gray-500">
                        {contributor.posts} posts • {contributor.helpful} helpful
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <Link
                href="/lms/leaderboard"
                className="block text-center text-orange-600 hover:text-orange-700 text-sm font-medium mt-4 pt-4 border-t"
              >
                View Full Leaderboard
              </Link>
            </div>

            {/* Popular Groups */}
            <div className="bg-white rounded-xl shadow-sm border p-6">
              <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Users className="w-5 h-5 text-blue-500" />
                Active Groups
              </h3>
              <div className="space-y-3">
                <Link href="/lms/social/groups/healthcare" className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50">
                  <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                    <Heart className="w-5 h-5 text-red-600" />
                  </div>
                  <div>
                    <div className="font-medium text-gray-900 text-sm">Healthcare Professionals</div>
                    <div className="text-xs text-gray-500">67 posts this week</div>
                  </div>
                </Link>
                <Link href="/lms/social/groups/trades" className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50">
                  <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                    <Briefcase className="w-5 h-5 text-orange-600" />
                  </div>
                  <div>
                    <div className="font-medium text-gray-900 text-sm">Skilled Trades Network</div>
                    <div className="text-xs text-gray-500">52 posts this week</div>
                  </div>
                </Link>
                <Link href="/lms/social/groups/career" className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                    <TrendingUp className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <div className="font-medium text-gray-900 text-sm">Career Changers</div>
                    <div className="text-xs text-gray-500">45 posts this week</div>
                  </div>
                </Link>
              </div>
              <Link
                href="/lms/social/groups"
                className="block text-center text-orange-600 hover:text-orange-700 text-sm font-medium mt-4 pt-4 border-t"
              >
                Browse All Groups
              </Link>
            </div>

            {/* Learning Resources */}
            <div className="bg-amber-50 rounded-xl p-6">
              <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-amber-600" />
                Popular Courses
              </h3>
              <div className="space-y-3 text-sm">
                <Link href="/courses" className="block p-3 bg-white rounded-lg hover:shadow-sm">
                  <div className="font-medium text-gray-900">CNA Certification Prep</div>
                  <div className="text-xs text-gray-500">1,234 enrolled</div>
                </Link>
                <Link href="/courses" className="block p-3 bg-white rounded-lg hover:shadow-sm">
                  <div className="font-medium text-gray-900">CDL Training Basics</div>
                  <div className="text-xs text-gray-500">987 enrolled</div>
                </Link>
                <Link href="/courses" className="block p-3 bg-white rounded-lg hover:shadow-sm">
                  <div className="font-medium text-gray-900">Interview Skills Workshop</div>
                  <div className="text-xs text-gray-500">756 enrolled</div>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
