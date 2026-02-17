import { Metadata } from 'next';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { 
  MessageSquare, Users, Clock, Pin, TrendingUp,
  Search, Plus, ChevronRight, Eye, MessageCircle
} from 'lucide-react';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  robots: { index: false, follow: false },
  title: 'Discussion Forums | LMS | Elevate For Humanity',
  description: 'Join discussions, ask questions, and connect with fellow learners and instructors.',
};

const forumCategories = [
  {
    name: 'General Discussion',
    description: 'Introduce yourself and chat with the community',
    icon: MessageSquare,
    topics: 45,
    posts: 234,
    color: 'blue',
  },
  {
    name: 'Course Help',
    description: 'Get help with course content and assignments',
    icon: Users,
    topics: 89,
    posts: 567,
    color: 'green',
  },
  {
    name: 'Career Advice',
    description: 'Job search tips, resume help, and career guidance',
    icon: TrendingUp,
    topics: 34,
    posts: 189,
    color: 'blue',
  },
  {
    name: 'Technical Support',
    description: 'Platform issues and technical questions',
    icon: MessageCircle,
    topics: 23,
    posts: 98,
    color: 'orange',
  },
];

const recentTopics = [
  {
    title: 'Tips for passing the CNA certification exam',
    author: 'Sarah M.',
    category: 'Course Help',
    replies: 12,
    views: 234,
    lastActivity: '2 hours ago',
    pinned: true,
  },
  {
    title: 'Study group for Healthcare Fundamentals',
    author: 'Michael R.',
    category: 'General Discussion',
    replies: 8,
    views: 156,
    lastActivity: '4 hours ago',
    pinned: false,
  },
  {
    title: 'How to update my profile picture?',
    author: 'Emily K.',
    category: 'Technical Support',
    replies: 3,
    views: 45,
    lastActivity: '1 day ago',
    pinned: false,
  },
  {
    title: 'Best practices for job interviews',
    author: 'David L.',
    category: 'Career Advice',
    replies: 15,
    views: 312,
    lastActivity: '2 days ago',
    pinned: false,
  },
];

export default async function ForumsPage() {
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
    redirect('/login?redirect=/lms/forums');
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Breadcrumbs */}
      <div className="bg-white border-b">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <Breadcrumbs items={[
            { label: 'LMS', href: '/lms/dashboard' },
            { label: 'Discussion Forums' }
          ]} />
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
              <MessageSquare className="w-8 h-8 text-brand-blue-600" />
              Discussion Forums
            </h1>
            <p className="text-gray-600 mt-1">
              Ask questions, share knowledge, and connect with the community
            </p>
          </div>
          <div className="flex gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search forums..."
                className="pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-blue-500"
              />
            </div>
            <button className="flex items-center gap-2 px-4 py-2 bg-brand-blue-600 text-white rounded-lg hover:bg-brand-blue-700">
              <Plus className="w-5 h-5" />
              New Topic
            </button>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Categories */}
          <div className="lg:col-span-2">
            <h2 className="font-semibold text-gray-900 mb-4">Forum Categories</h2>
            <div className="space-y-4">
              {forumCategories.map((category, index) => (
                <Link
                  key={index}
                  href={`/lms/forums/${category.name.toLowerCase().replace(/\s+/g, '-')}`}
                  className="block bg-white rounded-xl p-6 shadow-sm border hover:border-brand-blue-300 hover:shadow-md transition-all"
                >
                  <div className="flex items-start gap-4">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${
                      category.color === 'blue' ? 'bg-brand-blue-100' :
                      category.color === 'green' ? 'bg-brand-green-100' :
                      category.color === 'blue' ? 'bg-brand-blue-100' : 'bg-brand-orange-100'
                    }`}>
                      <category.icon className={`w-6 h-6 ${
                        category.color === 'blue' ? 'text-brand-blue-600' :
                        category.color === 'green' ? 'text-brand-green-600' :
                        category.color === 'blue' ? 'text-brand-blue-600' : 'text-brand-orange-600'
                      }`} />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900">{category.name}</h3>
                      <p className="text-gray-600 text-sm mt-1">{category.description}</p>
                      <div className="flex gap-4 mt-3 text-sm text-gray-500">
                        <span>{category.topics} topics</span>
                        <span>{category.posts} posts</span>
                      </div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-gray-400" />
                  </div>
                </Link>
              ))}
            </div>
          </div>

          {/* Recent Activity */}
          <div className="lg:col-span-1">
            <h2 className="font-semibold text-gray-900 mb-4">Recent Topics</h2>
            <div className="bg-white rounded-xl shadow-sm border divide-y">
              {recentTopics.map((topic, index) => (
                <Link
                  key={index}
                  href={`/lms/forums/topic/${index}`}
                  className="block p-4 hover:bg-gray-50"
                >
                  <div className="flex items-start gap-2">
                    {topic.pinned && (
                      <Pin className="w-4 h-4 text-brand-blue-600 flex-shrink-0 mt-1" />
                    )}
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-gray-900 text-sm truncate">
                        {topic.title}
                      </h4>
                      <p className="text-xs text-gray-500 mt-1">
                        by {topic.author} in {topic.category}
                      </p>
                      <div className="flex items-center gap-3 mt-2 text-xs text-gray-400">
                        <span className="flex items-center gap-1">
                          <MessageCircle className="w-3 h-3" />
                          {topic.replies}
                        </span>
                        <span className="flex items-center gap-1">
                          <Eye className="w-3 h-3" />
                          {topic.views}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {topic.lastActivity}
                        </span>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>

            {/* Forum Stats */}
            <div className="bg-white rounded-xl p-4 shadow-sm border mt-6">
              <h3 className="font-semibold text-gray-900 mb-4">Forum Statistics</h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Total Topics</span>
                  <span className="font-medium text-gray-900">191</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Total Posts</span>
                  <span className="font-medium text-gray-900">1,088</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Members</span>
                  <span className="font-medium text-gray-900">2,456</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Online Now</span>
                  <span className="font-medium text-brand-green-600">34</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
