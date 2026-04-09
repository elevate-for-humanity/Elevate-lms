import { Metadata } from 'next';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import {
  TrendingUp, Users, MessageSquare,
  Flame, Award, BookOpen, Heart,
  ThumbsUp, MessageCircle, Share2,
} from 'lucide-react';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  robots: { index: false, follow: false },
  title: 'Trending Topics | Social | LMS | Elevate For Humanity',
  description: 'Discover trending discussions and popular topics in the community.',
};

export default async function TrendingPage() {
  const supabase = await createClient();


  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login?redirect=/lms/social/trending');
  }

  // Fetch recent social posts ordered by engagement
  let trendingPosts: any[] = [];
  try {
    const { data } = await supabase
      .from('social_posts')
      .select('id, title, content, like_count, comment_count, share_count, created_at, profiles!social_posts_author_id_fkey(full_name)')
      .order('like_count', { ascending: false })
      .limit(10);
    trendingPosts = data || [];
  } catch {
    // Table may not exist yet
  }

  // Fetch popular forum threads as trending topics
  let trendingThreads: any[] = [];
  try {
    const { data } = await supabase
      .from('forum_threads')
      .select('id, title, forum_id, reply_count, view_count, created_at, profiles!forum_threads_author_id_fkey(full_name)')
      .order('view_count', { ascending: false })
      .limit(6);
    trendingThreads = data || [];
  } catch {
    // Table may not exist yet
  }

  const hasContent = trendingPosts.length > 0 || trendingThreads.length > 0;

  return (
    <div className="min-h-screen bg-white">
      <div className="bg-white border-b">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <Breadcrumbs items={[
            { label: 'LMS', href: '/lms/dashboard' },
            { label: 'Social', href: '/lms/social' },
            { label: 'Trending' },
          ]} />
        </div>
      </div>

      {/* Hero */}
      <div className="bg-gradient-to-r from-amber-500 to-brand-orange-600 text-white">
        <div className="max-w-6xl mx-auto px-4 py-12">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center">
              <TrendingUp className="w-8 h-8" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">Trending Topics</h1>
              <p className="text-amber-100 mt-1">Discover what the community is talking about</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8">
        {hasContent ? (
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6">
              {/* Trending Posts */}
              {trendingPosts.length > 0 && (
                <div className="bg-white rounded-xl shadow-sm border">
                  <div className="p-6 border-b">
                    <h2 className="font-semibold text-gray-900 flex items-center gap-2">
                      <Award className="w-5 h-5 text-amber-500" />
                      Top Posts
                    </h2>
                  </div>
                  <div className="divide-y">
                    {trendingPosts.map((post: any) => (
                      <div key={post.id} className="p-6 hover:bg-white">
                        <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
                          <span>{post.profiles?.full_name || 'Anonymous'}</span>
                          <span>•</span>
                          <span>{new Date(post.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                        </div>
                        <h3 className="font-semibold text-gray-900 text-lg">{post.title || 'Untitled Post'}</h3>
                        {post.content && (
                          <p className="text-gray-600 mt-2 line-clamp-2">{post.content}</p>
                        )}
                        <div className="flex items-center gap-6 mt-4">
                          <span className="flex items-center gap-2 text-gray-500">
                            <ThumbsUp className="w-5 h-5" />
                            <span className="font-medium">{post.like_count || 0}</span>
                          </span>
                          <span className="flex items-center gap-2 text-gray-500">
                            <MessageCircle className="w-5 h-5" />
                            <span>{post.comment_count || 0}</span>
                          </span>
                          <span className="flex items-center gap-2 text-gray-500">
                            <Share2 className="w-5 h-5" />
                            <span>{post.share_count || 0}</span>
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Trending Threads */}
              {trendingThreads.length > 0 && (
                <div className="bg-white rounded-xl shadow-sm border">
                  <div className="p-6 border-b">
                    <h2 className="font-semibold text-gray-900 flex items-center gap-2">
                      <Flame className="w-5 h-5 text-brand-orange-500" />
                      Popular Discussions
                    </h2>
                  </div>
                  <div className="divide-y">
                    {trendingThreads.map((thread: any) => (
                      <Link key={thread.id} href={`/lms/forums/${thread.forum_id}/threads/${thread.id}`}
                        className="block p-4 hover:bg-white">
                        <h4 className="font-medium text-gray-900">{thread.title}</h4>
                        <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                          <span>by {thread.profiles?.full_name || 'Anonymous'}</span>
                          <span>{thread.reply_count || 0} replies</span>
                          <span>{thread.view_count || 0} views</span>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              <div className="bg-white rounded-xl shadow-sm border p-6">
                <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <Users className="w-5 h-5 text-brand-blue-500" />
                  Active Groups
                </h3>
                <div className="space-y-3">
                  <Link href="/lms/social/groups/healthcare" className="flex items-center gap-3 p-3 rounded-lg hover:bg-white">
                    <div className="w-10 h-10 bg-brand-red-100 rounded-lg flex items-center justify-center">
                      <Heart className="w-5 h-5 text-brand-red-600" />
                    </div>
                    <div>
                      <div className="font-medium text-gray-900 text-sm">Healthcare Professionals</div>
                    </div>
                  </Link>
                  <Link href="/lms/social/groups/trades" className="flex items-center gap-3 p-3 rounded-lg hover:bg-white">
                    <div className="w-10 h-10 bg-brand-orange-100 rounded-lg flex items-center justify-center">
                      <TrendingUp className="w-5 h-5 text-brand-orange-600" />
                    </div>
                    <div>
                      <div className="font-medium text-gray-900 text-sm">Skilled Trades Network</div>
                    </div>
                  </Link>
                  <Link href="/lms/social/groups/career" className="flex items-center gap-3 p-3 rounded-lg hover:bg-white">
                    <div className="w-10 h-10 bg-brand-blue-100 rounded-lg flex items-center justify-center">
                      <TrendingUp className="w-5 h-5 text-brand-blue-600" />
                    </div>
                    <div>
                      <div className="font-medium text-gray-900 text-sm">Career Changers</div>
                    </div>
                  </Link>
                </div>
                <Link href="/lms/social/groups"
                  className="block text-center text-brand-orange-600 hover:text-brand-orange-700 text-sm font-medium mt-4 pt-4 border-t">
                  Browse All Groups
                </Link>
              </div>

              <div className="bg-amber-50 rounded-xl p-6">
                <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-amber-600" />
                  Explore Courses
                </h3>
                <p className="text-sm text-gray-600 mb-4">Browse our training programs and start your career journey.</p>
                <Link href="/lms/courses" className="inline-flex items-center gap-2 px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 text-sm font-medium">
                  View Courses
                </Link>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-sm border p-12 text-center">
            <MessageSquare className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-gray-900 mb-2">No trending content yet</h3>
            <p className="text-gray-600 mb-6">Be the first to start a discussion in the community!</p>
            <Link href="/lms/social" className="inline-flex items-center gap-2 px-6 py-3 bg-brand-orange-600 text-white rounded-lg hover:bg-brand-orange-700 font-medium">
              Go to Social Feed
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
