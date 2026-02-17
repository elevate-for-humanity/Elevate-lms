import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import { Metadata } from 'next';
import { MessageSquare, Clock, ChevronRight, Plus } from 'lucide-react';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import DiscussionForums from '@/components/forums/DiscussionForums';

export const metadata: Metadata = {
  title: 'Community Discussions | Elevate For Humanity',
  description: 'Join discussions with fellow students and professionals.',
};

export const dynamic = 'force-dynamic';

export default async function DiscussionsPage() {
  const supabase = await createClient();

  // Fetch discussions from database
  const { data: discussions, error } = await supabase
    .from('discussion_threads')
    .select(`
      id,
      title,
      category,
      created_at,
      replies_count,
      views_count,
      author:profiles(full_name)
    `)
    .eq('is_active', true)
    .order('created_at', { ascending: false })
    .limit(20);

  if (error) {
    console.error('Error fetching discussions:', error.message);
  }

  const discussionList = discussions || [];

  // Fetch categories
  const { data: categoriesData } = await supabase
    .from('forums')
    .select('id, name, description')
    .eq('is_active', true)
    .order('name');

  const categories = categoriesData || [];

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffHours < 1) return 'Just now';
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Breadcrumbs */}
      <div className="bg-slate-50 border-b">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <Breadcrumbs items={[{ label: 'Community', href: '/community' }, { label: 'Discussions' }]} />
        </div>
      </div>

      <div className="py-8 max-w-6xl mx-auto px-4">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Community Discussions</h1>
            <p className="text-gray-600 mt-1">Connect, share, and learn with fellow students</p>
          </div>
          <Link
            href="/community/discussions/new"
            className="inline-flex items-center gap-2 px-4 py-2 bg-brand-blue-600 text-white rounded-lg hover:bg-brand-blue-700"
          >
            <Plus className="w-4 h-4" />
            New Discussion
          </Link>
        </div>

        <div className="grid lg:grid-cols-4 gap-8">
          {/* Categories Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl border p-4">
              <h2 className="font-semibold text-gray-900 mb-4">Categories</h2>
              <div className="space-y-2">
                <Link
                  href="/community/discussions"
                  className="block px-3 py-2 rounded-lg bg-brand-blue-50 text-brand-blue-700 font-medium"
                >
                  All Discussions
                </Link>
                {categories.map((cat: any) => (
                  <Link
                    key={cat.id}
                    href={`/community/discussions?category=${cat.id}`}
                    className="block px-3 py-2 rounded-lg text-gray-700 hover:bg-gray-50"
                  >
                    {cat.name}
                  </Link>
                ))}
              </div>
            </div>
          </div>

          {/* Discussions List */}
          <div className="lg:col-span-3">
            {discussionList.length > 0 ? (
              <div className="bg-white rounded-xl border divide-y">
                {discussionList.map((discussion: any) => (
                  <Link
                    key={discussion.id}
                    href={`/community/discussions/${discussion.id}`}
                    className="block p-4 hover:bg-gray-50"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900 hover:text-brand-blue-600">
                          {discussion.title}
                        </h3>
                        <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                          <span>{discussion.author?.full_name || 'Anonymous'}</span>
                          {discussion.category && (
                            <span className="px-2 py-0.5 bg-gray-100 rounded-full text-xs">
                              {discussion.category}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-gray-500">
                        <span className="flex items-center gap-1">
                          <MessageSquare className="w-4 h-4" />
                          {discussion.replies_count || 0}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          {formatDate(discussion.created_at)}
                        </span>
                        <ChevronRight className="w-4 h-4" />
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="bg-white rounded-xl border p-12 text-center">
                <MessageSquare className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h2 className="text-xl font-semibold text-gray-900 mb-2">No discussions yet</h2>
                <p className="text-gray-600 mb-6">Be the first to start a conversation!</p>
                <Link
                  href="/community/discussions/new"
                  className="inline-flex items-center gap-2 px-6 py-3 bg-brand-blue-600 text-white rounded-lg hover:bg-brand-blue-700"
                >
                  <Plus className="w-4 h-4" />
                  Start a Discussion
                </Link>
              </div>
            )}
          </div>

          {/* Full Discussion Forums Component */}
          <div className="mt-12">
            <DiscussionForums />
          </div>
        </div>
      </div>
    </div>
  );
}
