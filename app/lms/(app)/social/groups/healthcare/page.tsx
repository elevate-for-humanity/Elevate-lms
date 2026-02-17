import { Metadata } from 'next';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { 
  Heart, Users, MessageSquare, Calendar, 
  FileText, Share2, Bell, Settings, Plus,
  ThumbsUp, MessageCircle, Bookmark, Stethoscope, Award
} from 'lucide-react';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  robots: { index: false, follow: false },
  title: 'Healthcare Professionals | Groups | LMS | Elevate For Humanity',
  description: 'Connect with nurses, CNAs, medical assistants, and healthcare workers.',
};

const groupResources = [
  { title: 'Certification Guides', description: 'CNA, MA, Phlebotomy prep', icon: Award },
  { title: 'Clinical Tips', description: 'Best practices and procedures', icon: Stethoscope },
  { title: 'Job Board', description: 'Healthcare job opportunities', icon: FileText },
];

const recentDiscussions = [
  {
    id: 1,
    author: 'Jennifer R.',
    title: 'Just passed my CNA state exam!',
    preview: 'After weeks of studying and practice, I finally did it! Here are the resources that helped me...',
    likes: 42,
    comments: 15,
    time: '3 hours ago',
  },
  {
    id: 2,
    author: 'David L.',
    title: 'Tips for handling difficult patients',
    preview: 'Working in long-term care, I have learned some techniques that really help with challenging situations...',
    likes: 31,
    comments: 24,
    time: '8 hours ago',
  },
  {
    id: 3,
    author: 'Maria S.',
    title: 'Transitioning from CNA to LPN - worth it?',
    preview: 'I have been a CNA for 2 years and considering going back to school. Would love to hear experiences...',
    likes: 28,
    comments: 19,
    time: '1 day ago',
  },
];

export default async function HealthcareGroupPage() {
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
    redirect('/login?redirect=/lms/social/groups/healthcare');
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
            { label: 'Healthcare Professionals' }
          ]} />
        </div>
      </div>

      {/* Hero Banner */}
      <div className="bg-gradient-to-r from-red-500 to-pink-600 text-white">
        <div className="max-w-6xl mx-auto px-4 py-12">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-6">
              <div className="w-20 h-20 bg-white/20 rounded-2xl flex items-center justify-center">
                <Heart className="w-10 h-10" />
              </div>
              <div>
                <h1 className="text-3xl font-bold">Healthcare Professionals</h1>
                <p className="text-red-100 mt-2 max-w-xl">
                  A community for CNAs, nurses, medical assistants, and all healthcare workers. 
                  Share knowledge, support each other, and grow in your healthcare career.
                </p>
                <div className="flex items-center gap-6 mt-4 text-sm">
                  <span className="flex items-center gap-2">
                    <Users className="w-4 h-4" />
                    234 members
                  </span>
                  <span className="flex items-center gap-2">
                    <MessageSquare className="w-4 h-4" />
                    67 posts this week
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
              <button className="px-4 py-2 bg-white text-red-600 rounded-lg hover:bg-red-50 font-medium">
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
                  Share a tip, ask a question, or celebrate a win...
                </button>
              </div>
              <div className="flex gap-2 mt-4 pt-4 border-t">
                <button className="flex items-center gap-2 px-4 py-2 rounded-lg hover:bg-gray-100 text-gray-600">
                  <FileText className="w-5 h-5 text-red-600" />
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
                      <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
                        <Heart className="w-5 h-5 text-red-500" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 text-sm text-gray-500">
                          <span className="font-medium text-gray-900">{post.author}</span>
                          <span>•</span>
                          <span>{post.time}</span>
                        </div>
                        <h3 className="font-semibold text-gray-900 mt-1 hover:text-red-600 cursor-pointer">
                          {post.title}
                        </h3>
                        <p className="text-gray-600 text-sm mt-1">{post.preview}</p>
                        <div className="flex items-center gap-4 mt-3">
                          <button className="flex items-center gap-1 text-gray-500 hover:text-red-600 text-sm">
                            <ThumbsUp className="w-4 h-4" />
                            {post.likes}
                          </button>
                          <button className="flex items-center gap-1 text-gray-500 hover:text-red-600 text-sm">
                            <MessageCircle className="w-4 h-4" />
                            {post.comments}
                          </button>
                          <button className="flex items-center gap-1 text-gray-500 hover:text-red-600 text-sm">
                            <Share2 className="w-4 h-4" />
                            Share
                          </button>
                          <button className="flex items-center gap-1 text-gray-500 hover:text-red-600 text-sm ml-auto">
                            <Bookmark className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="p-4 border-t text-center">
                <button className="text-red-600 hover:text-red-700 font-medium text-sm">
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
                Connect with fellow healthcare professionals, share clinical experiences, 
                discuss certifications, and support each other in providing excellent patient care.
              </p>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Created</span>
                  <span className="text-gray-900">December 2023</span>
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
                    <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                      <resource.icon className="w-5 h-5 text-red-600" />
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
                <Link href="#" className="text-red-600 hover:text-red-700 text-sm">See All</Link>
              </div>
              <div className="flex -space-x-2">
                {[...Array(8)].map((_, i) => (
                  <div key={i} className="w-8 h-8 bg-gray-200 rounded-full border-2 border-white" />
                ))}
                <div className="w-8 h-8 bg-gray-100 rounded-full border-2 border-white flex items-center justify-center text-xs text-gray-600">
                  +226
                </div>
              </div>
              <button className="w-full mt-4 px-4 py-2 border border-red-600 text-red-600 rounded-lg hover:bg-red-50 text-sm font-medium flex items-center justify-center gap-2">
                <Plus className="w-4 h-4" />
                Invite Members
              </button>
            </div>

            {/* Related Groups */}
            <div className="bg-red-50 rounded-xl p-6">
              <h3 className="font-semibold text-gray-900 mb-3">Related Groups</h3>
              <div className="space-y-3">
                <Link href="/lms/social/groups/career" className="block p-3 bg-white rounded-lg hover:shadow-sm">
                  <div className="font-medium text-gray-900 text-sm">Career Changers</div>
                  <div className="text-xs text-gray-500">156 members</div>
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
