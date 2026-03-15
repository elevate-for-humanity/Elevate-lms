import { Metadata } from 'next';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import {
  MessageSquare, Pin, Eye, MessageCircle,
  Clock, ChevronRight, Plus,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  robots: { index: false, follow: false },
  title: 'Discussion Forums | LMS | Elevate For Humanity',
  description: 'Ask questions, share knowledge, and connect with fellow learners and instructors.',
};

// Icon map for category icon field (stored as string)
const ICON_COLOR: Record<string, string> = {
  blue:   'bg-brand-blue-100 text-brand-blue-600',
  green:  'bg-brand-green-100 text-brand-green-700',
  orange: 'bg-brand-orange-100 text-brand-orange-700',
  purple: 'bg-purple-100 text-purple-700',
  teal:   'bg-teal-100 text-teal-700',
  red:    'bg-brand-red-100 text-brand-red-700',
};

export default async function ForumsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login?redirect=/lms/forums');

  const db = createAdminClient() || supabase;

  // Fetch categories with topic counts
  const { data: categories } = await db
    .from('forum_categories')
    .select('id, name, slug, description, icon, color, sort_order')
    .eq('is_active', true)
    .order('sort_order', { ascending: true });

  // Fetch recent topics across all categories
  const { data: recentTopics } = await db
    .from('forum_topics')
    .select('id, title, category_id, is_pinned, reply_count, view_count, created_at, author_id')
    .order('created_at', { ascending: false })
    .limit(8);

  // Fetch topic counts per category
  const { data: topicCounts } = await db
    .from('forum_topics')
    .select('category_id');

  const countMap: Record<string, number> = {};
  for (const row of topicCounts ?? []) {
    countMap[row.category_id] = (countMap[row.category_id] ?? 0) + 1;
  }

  const totalTopics = topicCounts?.length ?? 0;
  const totalReplies = (recentTopics ?? []).reduce((s, t) => s + (t.reply_count ?? 0), 0);

  return (
    <div className="min-h-screen bg-white">
      <div className="bg-white border-b border-slate-200">
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
            <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
              <MessageSquare className="w-7 h-7 text-brand-blue-600" />
              Discussion Forums
            </h1>
            <p className="text-slate-500 mt-1 text-sm">Ask questions, share knowledge, and connect with the community.</p>
          </div>
          <Link
            href="/lms/forums/new"
            className="flex items-center gap-2 px-4 py-2 bg-brand-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-brand-blue-700 transition-colors"
          >
            <Plus className="w-4 h-4" /> New Topic
          </Link>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Categories */}
          <div className="lg:col-span-2 space-y-4">
            <h2 className="font-semibold text-slate-700 text-sm uppercase tracking-wide">Categories</h2>

            {!categories || categories.length === 0 ? (
              <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-12 text-center">
                <MessageSquare className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                <p className="text-slate-600 font-medium">No forum categories yet.</p>
                <p className="text-slate-500 text-sm mt-1">Categories will appear here once set up by an administrator.</p>
              </div>
            ) : (
              categories.map(cat => (
                <Link
                  key={cat.id}
                  href={`/lms/forums/${cat.slug ?? cat.id}`}
                  className="group block bg-white rounded-2xl border border-slate-200 p-5 hover:border-brand-blue-200 hover:shadow-md transition-all"
                >
                  <div className="flex items-start gap-4">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${ICON_COLOR[cat.color ?? 'blue'] ?? ICON_COLOR.blue}`}>
                      <MessageSquare className="w-6 h-6" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-slate-900 group-hover:text-brand-blue-700 transition-colors">
                        {cat.name}
                      </h3>
                      {cat.description && (
                        <p className="text-slate-500 text-sm mt-0.5 line-clamp-2">{cat.description}</p>
                      )}
                      <p className="text-xs text-slate-400 mt-2">
                        {countMap[cat.id] ?? 0} topic{(countMap[cat.id] ?? 0) !== 1 ? 's' : ''}
                      </p>
                    </div>
                    <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-brand-blue-400 transition-colors flex-shrink-0 mt-1" />
                  </div>
                </Link>
              ))
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Recent topics */}
            <div>
              <h2 className="font-semibold text-slate-700 text-sm uppercase tracking-wide mb-3">Recent Topics</h2>
              {!recentTopics || recentTopics.length === 0 ? (
                <div className="bg-white rounded-2xl border border-slate-200 p-6 text-center">
                  <p className="text-slate-500 text-sm">No topics yet. Start the first discussion!</p>
                </div>
              ) : (
                <div className="bg-white rounded-2xl border border-slate-200 divide-y divide-slate-100 overflow-hidden">
                  {recentTopics.map(topic => (
                    <Link
                      key={topic.id}
                      href={`/lms/forums/topics/${topic.id}`}
                      className="block p-4 hover:bg-white transition-colors"
                    >
                      <div className="flex items-start gap-2">
                        {topic.is_pinned && <Pin className="w-3.5 h-3.5 text-brand-blue-500 flex-shrink-0 mt-0.5" />}
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-slate-900 line-clamp-2 leading-snug">
                            {topic.title}
                          </p>
                          <div className="flex items-center gap-3 mt-1.5 text-xs text-slate-400">
                            <span className="flex items-center gap-1">
                              <MessageCircle className="w-3 h-3" /> {topic.reply_count ?? 0}
                            </span>
                            <span className="flex items-center gap-1">
                              <Eye className="w-3 h-3" /> {topic.view_count ?? 0}
                            </span>
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {new Date(topic.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                            </span>
                          </div>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>

            {/* Stats */}
            <div className="bg-white rounded-2xl border border-slate-200 p-5">
              <h3 className="font-semibold text-slate-900 text-sm mb-4">Forum Stats</h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-500">Categories</span>
                  <span className="font-semibold text-slate-900">{categories?.length ?? 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Total Topics</span>
                  <span className="font-semibold text-slate-900">{totalTopics}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Total Replies</span>
                  <span className="font-semibold text-slate-900">{totalReplies}</span>
                </div>
              </div>
            </div>

            {/* Guidelines */}
            <div className="bg-brand-blue-50 rounded-2xl border border-brand-blue-100 p-5">
              <h3 className="font-semibold text-slate-900 text-sm mb-2">Community Guidelines</h3>
              <ul className="text-xs text-slate-600 space-y-1.5">
                <li>• Be respectful and constructive</li>
                <li>• Stay on topic within each category</li>
                <li>• Search before posting a new topic</li>
                <li>• Mark helpful replies as solutions</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
