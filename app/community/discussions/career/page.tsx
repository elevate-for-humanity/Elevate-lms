import { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import { ChevronRight, Briefcase, MessageSquare, ThumbsUp, Clock, User, Plus, Pin } from 'lucide-react';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';

export const metadata: Metadata = {
  title: 'Career Discussions | Community | Elevate For Humanity',
  description: 'Discuss career opportunities and job search tips.',
};

export const dynamic = 'force-dynamic';

export default async function CareerDiscussionsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // Fetch career-related discussions
  const { data: discussions } = await supabase
    .from('discussions')
    .select(`
      id,
      title,
      content,
      is_pinned,
      created_at,
      author:profiles!discussions_author_id_fkey(id, full_name, avatar_url),
      replies:discussion_replies(count),
      likes:discussion_likes(count)
    `)
    .eq('category', 'career')
    .order('is_pinned', { ascending: false })
    .order('created_at', { ascending: false })
    .limit(20);

  const formatTime = (date: string) => {
    const diff = Date.now() - new Date(date).getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    if (hours < 1) return 'Just now';
    if (hours < 24) return `${hours} hours ago`;
    const days = Math.floor(hours / 24);
    if (days === 1) return 'Yesterday';
    return `${days} days ago`;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Breadcrumbs */}
      <div className="bg-slate-50 border-b">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <Breadcrumbs items={[{ label: 'Community', href: '/community' }, { label: 'Discussions', href: '/community/discussions' }, { label: 'Career' }]} />
        </div>
      </div>

      <div className="py-8">
      <div className="max-w-4xl mx-auto px-4">

        <div className="flex items-center gap-4 mb-6">
          <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
            <Briefcase className="w-6 h-6 text-blue-600" />
          </div>
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-gray-900">Career Discussions</h1>
            <p className="text-gray-600">Job search tips, interview advice, and career growth</p>
          </div>
          {user && (
            <Link href="/community/discussions/new?category=career"
              className="flex items-center gap-2 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600">
              <Plus className="w-4 h-4" /> New Discussion
            </Link>
          )}
        </div>

        <div className="bg-white rounded-xl border divide-y">
          {discussions && discussions.length > 0 ? (
            discussions.map((discussion: any) => (
              <Link key={discussion.id} href={`/community/discussions/${discussion.id}`}
                className="block p-4 hover:bg-gray-50 transition">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center flex-shrink-0">
                    {discussion.author?.avatar_url ? (
                      <img src={discussion.author.avatar_url} alt="Author avatar" className="w-full h-full rounded-full object-cover" />
                    ) : (
                      <User className="w-5 h-5 text-gray-400" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      {discussion.is_pinned && (
                        <Pin className="w-4 h-4 text-orange-500" />
                      )}
                      <h3 className="font-medium text-gray-900 truncate">{discussion.title}</h3>
                    </div>
                    <p className="text-sm text-gray-500 mt-1">
                      by {discussion.author?.full_name || 'Anonymous'}
                    </p>
                    <div className="flex items-center gap-4 mt-2 text-sm text-gray-400">
                      <span className="flex items-center gap-1">
                        <MessageSquare className="w-4 h-4" />
                        {discussion.replies?.[0]?.count || 0} replies
                      </span>
                      <span className="flex items-center gap-1">
                        <ThumbsUp className="w-4 h-4" />
                        {discussion.likes?.[0]?.count || 0}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        {formatTime(discussion.created_at)}
                      </span>
                    </div>
                  </div>
                </div>
              </Link>
            ))
          ) : (
            <div className="p-12 text-center">
              <Briefcase className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="font-medium text-gray-900">No discussions yet</p>
              <p className="text-sm text-gray-500 mb-4">Be the first to start a career discussion</p>
              {user && (
                <Link href="/community/discussions/new?category=career"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600">
                  <Plus className="w-4 h-4" /> Start Discussion
                </Link>
              )}
            </div>
          )}
        </div>
      </div>
      </div>
    </div>
  );
}
