import { Metadata } from 'next';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { 
  Briefcase, Users, MessageSquare, Calendar, 
  FileText, Share2, Bell, Settings, Plus,
  ThumbsUp, MessageCircle, Bookmark
} from 'lucide-react';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  robots: { index: false, follow: false },
  title: 'Career Changers | Groups | LMS | Elevate For Humanity',
  description: 'Connect with others transitioning to new careers. Share experiences and support each other.',
};

const groupResources = [
  { title: 'Resume Templates', description: 'Career change resume examples', icon: FileText },
  { title: 'Interview Prep', description: 'Common questions and tips', icon: MessageSquare },
  { title: 'Networking Events', description: 'Upcoming virtual meetups', icon: Calendar },
];

const recentDiscussions = [
  {
    id: 1,
    author: 'Sarah M.',
    avatar: null,
    title: 'Successfully transitioned from retail to healthcare!',
    preview: 'After 6 months of training, I finally got my CNA certification and landed a job...',
    likes: 24,
    comments: 8,
    time: '2 hours ago',
  },
  {
    id: 2,
    author: 'Graduate J.',
    avatar: null,
    title: 'Tips for explaining career gaps in interviews',
    preview: 'I was nervous about my 2-year gap, but here is what worked for me...',
    likes: 18,
    comments: 12,
    time: '5 hours ago',
  },
  {
    id: 3,
    author: 'Lisa K.',
    avatar: null,
    title: 'Starting CDL training next week - any advice?',
    preview: 'Making the switch from office work to trucking. Would love to hear from others...',
    likes: 15,
    comments: 21,
    time: '1 day ago',
  },
];

export default async function CareerGroupPage() {
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
    redirect('/login?redirect=/lms/social/groups/career');
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, avatar_url')
    .eq('id', user.id)
    .single();

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Breadcrumbs */}
      <div className="bg-white border-b">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <Breadcrumbs items={[
            { label: 'LMS', href: '/lms/dashboard' },
            { label: 'Social', href: '/lms/social' },
            { label: 'Groups', href: '/lms/social/groups' },
            { label: 'Career Changers' }
          ]} />
        </div>
      </div>

      {/* Hero Banner */}
      <div className="bg-gradient-to-r from-blue-600 to-cyan-600 text-white">
        <div className="max-w-6xl mx-auto px-4 py-12">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-6">
              <div className="w-20 h-20 bg-white/20 rounded-2xl flex items-center justify-center">
                <Briefcase className="w-10 h-10" />
              </div>
              <div>
                <h1 className="text-3xl font-bold">Career Changers</h1>
                <p className="text-blue-100 mt-2 max-w-xl">
                  A supportive community for those transitioning to new careers. Share your journey, 
                  get advice, and connect with others making similar changes.
                </p>
                <div className="flex items-center gap-6 mt-4 text-sm">
                  <span className="flex items-center gap-2">
                    <Users className="w-4 h-4" />
                    156 members
                  </span>
                  <span className="flex items-center gap-2">
                    <MessageSquare className="w-4 h-4" />
                    45 posts this week
                  </span>
                </div>
              </div>
            </div>
            <div className="flex gap-3">
              <button className="p-2 bg-white/20 rounded-lg hover:bg-white/30">
                <Bell className="w-5 h-5" />
              </button>
              <button className="p-2 bg-white/20 rounded-lg hover:bg-white/30">
                <Settings className="w-5 h-5" />
              </button>
              <button className="px-4 py-2 bg-white text-blue-700 rounded-lg hover:bg-blue-50 font-medium">
                Joined
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Create Post */}
            <div className="bg-white rounded-xl shadow-sm border p-4">
              <div className="flex gap-4">
                <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center flex-shrink-0">
                  {profile?.avatar_url ? (
                    <img src={profile.avatar_url} alt="" className="w-full h-full rounded-full object-cover" />
                  ) : (
                    <Users className="w-5 h-5 text-gray-400" />
                  )}
                </div>
                <button className="flex-1 text-left px-4 py-3 bg-gray-100 rounded-full text-gray-500 hover:bg-gray-200 transition-colors">
                  Share your career journey or ask a question...
                </button>
              </div>
              <div className="flex gap-2 mt-4 pt-4 border-t">
                <button className="flex items-center gap-2 px-4 py-2 rounded-lg hover:bg-gray-100 text-gray-600">
                  <FileText className="w-5 h-5 text-blue-600" />
                  Article
                </button>
                <button className="flex items-center gap-2 px-4 py-2 rounded-lg hover:bg-gray-100 text-gray-600">
                  <Calendar className="w-5 h-5 text-orange-600" />
                  Event
                </button>
                <button className="flex items-center gap-2 px-4 py-2 rounded-lg hover:bg-gray-100 text-gray-600">
                  <MessageSquare className="w-5 h-5 text-green-600" />
                  Question
                </button>
              </div>
            </div>

            {/* Discussions */}
            <div className="bg-white rounded-xl shadow-sm border">
              <div className="p-4 border-b flex items-center justify-between">
                <h2 className="font-semibold text-gray-900">Recent Discussions</h2>
                <select className="text-sm border rounded-lg px-3 py-1.5">
                  <option>Most Recent</option>
                  <option>Most Popular</option>
                  <option>Unanswered</option>
                </select>
              </div>
              <div className="divide-y">
                {recentDiscussions.map((post) => (
                  <div key={post.id} className="p-4 hover:bg-gray-50">
                    <div className="flex gap-4">
                      <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center flex-shrink-0">
                        <Users className="w-5 h-5 text-gray-400" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 text-sm text-gray-500">
                          <span className="font-medium text-gray-900">{post.author}</span>
                          <span>•</span>
                          <span>{post.time}</span>
                        </div>
                        <h3 className="font-semibold text-gray-900 mt-1 hover:text-blue-600 cursor-pointer">
                          {post.title}
                        </h3>
                        <p className="text-gray-600 text-sm mt-1">{post.preview}</p>
                        <div className="flex items-center gap-4 mt-3">
                          <button className="flex items-center gap-1 text-gray-500 hover:text-blue-600 text-sm">
                            <ThumbsUp className="w-4 h-4" />
                            {post.likes}
                          </button>
                          <button className="flex items-center gap-1 text-gray-500 hover:text-blue-600 text-sm">
                            <MessageCircle className="w-4 h-4" />
                            {post.comments}
                          </button>
                          <button className="flex items-center gap-1 text-gray-500 hover:text-blue-600 text-sm">
                            <Share2 className="w-4 h-4" />
                            Share
                          </button>
                          <button className="flex items-center gap-1 text-gray-500 hover:text-blue-600 text-sm ml-auto">
                            <Bookmark className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="p-4 border-t text-center">
                <button className="text-blue-600 hover:text-blue-700 font-medium text-sm">
                  View All Discussions
                </button>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* About */}
            <div className="bg-white rounded-xl shadow-sm border p-6">
              <h3 className="font-semibold text-gray-900 mb-3">About This Group</h3>
              <p className="text-sm text-gray-600 mb-4">
                Whether you&apos;re switching industries, returning to work, or pursuing a completely 
                new path, this group is here to support you. Share experiences, ask questions, 
                and celebrate wins together.
              </p>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Created</span>
                  <span className="text-gray-900">January 2024</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Privacy</span>
                  <span className="text-gray-900">Public</span>
                </div>
              </div>
            </div>

            {/* Resources */}
            <div className="bg-white rounded-xl shadow-sm border p-6">
              <h3 className="font-semibold text-gray-900 mb-4">Group Resources</h3>
              <div className="space-y-3">
                {groupResources.map((resource, i) => (
                  <button key={i} className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 text-left">
                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                      <resource.icon className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <div className="font-medium text-gray-900 text-sm">{resource.title}</div>
                      <div className="text-xs text-gray-500">{resource.description}</div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Members */}
            <div className="bg-white rounded-xl shadow-sm border p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-900">Members</h3>
                <Link href="#" className="text-blue-600 hover:text-blue-700 text-sm">See All</Link>
              </div>
              <div className="flex -space-x-2">
                {[...Array(8)].map((_, i) => (
                  <div key={i} className="w-8 h-8 bg-gray-200 rounded-full border-2 border-white" />
                ))}
                <div className="w-8 h-8 bg-gray-100 rounded-full border-2 border-white flex items-center justify-center text-xs text-gray-600">
                  +148
                </div>
              </div>
              <button className="w-full mt-4 px-4 py-2 border border-blue-600 text-blue-600 rounded-lg hover:bg-blue-50 text-sm font-medium flex items-center justify-center gap-2">
                <Plus className="w-4 h-4" />
                Invite Members
              </button>
            </div>

            {/* Related Groups */}
            <div className="bg-blue-50 rounded-xl p-6">
              <h3 className="font-semibold text-gray-900 mb-3">Related Groups</h3>
              <div className="space-y-3">
                <Link href="/lms/social/groups/healthcare" className="block p-3 bg-white rounded-lg hover:shadow-sm">
                  <div className="font-medium text-gray-900 text-sm">Healthcare Professionals</div>
                  <div className="text-xs text-gray-500">234 members</div>
                </Link>
                <Link href="/lms/social/groups/trades" className="block p-3 bg-white rounded-lg hover:shadow-sm">
                  <div className="font-medium text-gray-900 text-sm">Skilled Trades Network</div>
                  <div className="text-xs text-gray-500">189 members</div>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
