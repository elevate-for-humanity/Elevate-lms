import { Metadata } from 'next';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import {
  MessageSquare, Users, Clock, Pin, TrendingUp,
  Search, Plus, ChevronRight, Eye, MessageCircle,
} from 'lucide-react';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  robots: { index: false, follow: false },
  title: 'Discussion Forums | LMS | Elevate For Humanity',
  description: 'Join discussions, ask questions, and connect with fellow learners and instructors.',
};

export default async function ForumsPage() {
  const supabase = await createClient();
  const _admin = createAdminClient(); const db = _admin || supabase;

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

  // Fetch real forum categories
  let forums: any[] = [];
  try {
    const { data } = await db
      .from('forums')
      .select('id, name, description, thread_count, post_count')
      .order('name');
    forums = data || [];
  } catch {
    // Table may not exist yet
  }

  // Fetch recent threads
  let recentThreads: any[] = [];
  try {
    const { data } = await db
      .from('forum_threads')
      .select('id, title, forum_id, is_pinned, reply_count, view_count, created_at, profiles!forum_threads_author_id_fkey(full_name)')
      .order('created_at', { ascending: false })
      .limit(6);
    recentThreads = data || [];
  } catch {
    // Table may not exist yet
  }

  // Get total stats
  const totalTopics = forums.reduce((sum, f) => sum + (f.thread_count || 0), 0);
  const totalPosts = forums.reduce((sum, f) => sum + (f.post_count || 0), 0);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <Breadcrumbs items={[
            { label: 'LMS', href: '/lms/dashboard' },
            { label: 'Discussion Forums' },
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
            <p className="text-gray-600 mt-1">Ask questions, share knowledge, and connect with the community</p>
          </div>
          <div className="flex gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input type="text" placeholder="Search forums..."
                className="pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-blue-500" />
            </div>
            <button className="flex items-center gap-2 px-4 py-2 bg-brand-blue-600 text-white rounded-lg hover:bg-brand-blue-700">
              <Plus className="w-5 h-5" /> New Topic
            </button>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Categories */}
          <div className="lg:col-span-2">
            <h2 className="font-semibold text-gray-900 mb-4">Forum Categories</h2>
            {forums.length > 0 ? (
              <div className="space-y-4">
                {forums.map((forum) => (
                  <Link key={forum.id} href={`/lms/forums/${forum.id}`}
                    className="block bg-white rounded-xl p-6 shadow-sm border hover:border-brand-blue-300 hover:shadow-md transition-all">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 bg-brand-blue-100">
                        <MessageSquare className="w-6 h-6 text-brand-blue-600" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900">{forum.name}</h3>
                        <p className="text-gray-600 text-sm mt-1">{forum.description || 'Join the discussion'}</p>
                        <div className="flex gap-4 mt-3 text-sm text-gray-500">
                          <span>{forum.thread_count || 0} topics</span>
                          <span>{forum.post_count || 0} posts</span>
                        </div>
                      </div>
                      <ChevronRight className="w-5 h-5 text-gray-400" />
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="bg-white rounded-xl p-12 shadow-sm border text-center">
                <MessageSquare className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No forums yet</h3>
                <p className="text-gray-600">Discussion forums will be available soon.</p>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <h2 className="font-semibold text-gray-900 mb-4">Recent Topics</h2>
            {recentThreads.length > 0 ? (
              <div className="bg-white rounded-xl shadow-sm border divide-y">
                {recentThreads.map((thread: any) => (
                  <Link key={thread.id} href={`/lms/forums/${thread.forum_id}/threads/${thread.id}`}
                    className="block p-4 hover:bg-gray-50">
                    <div className="flex items-start gap-2">
                      {thread.is_pinned && <Pin className="w-4 h-4 text-brand-blue-600 flex-shrink-0 mt-1" />}
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-gray-900 text-sm truncate">{thread.title}</h4>
                        <p className="text-xs text-gray-500 mt-1">
                          by {thread.profiles?.full_name || 'Anonymous'}
                        </p>
                        <div className="flex items-center gap-3 mt-2 text-xs text-gray-400">
                          <span className="flex items-center gap-1">
                            <MessageCircle className="w-3 h-3" /> {thread.reply_count || 0}
                          </span>
                          <span className="flex items-center gap-1">
                            <Eye className="w-3 h-3" /> {thread.view_count || 0}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {new Date(thread.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                          </span>
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="bg-white rounded-xl shadow-sm border p-6 text-center">
                <p className="text-gray-500 text-sm">No topics yet. Be the first to start a discussion!</p>
              </div>
            )}

            {/* Forum Stats */}
            <div className="bg-white rounded-xl p-4 shadow-sm border mt-6">
              <h3 className="font-semibold text-gray-900 mb-4">Forum Statistics</h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Total Topics</span>
                  <span className="font-medium text-gray-900">{totalTopics}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Total Posts</span>
                  <span className="font-medium text-gray-900">{totalPosts}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
