import { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { redirect, notFound } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  MessageSquare,
  Clock,
  ThumbsUp,
  Flag,
  Reply,
  MoreHorizontal,
} from 'lucide-react';
import ThreadReplyForm from './ThreadReplyForm';

export const dynamic = 'force-dynamic';

interface Props {
  params: Promise<{ forumId: string; threadId: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { threadId } = await params;
  const supabase = await createClient();
  const _admin = createAdminClient(); const db = _admin || supabase;

  if (!supabase) {
    return { title: 'Thread | Elevate LMS' };
  }

  const { data: thread } = await db
    .from('forum_threads')
    .select('title')
    .eq('id', threadId)
    .single();

  return {
    title: thread ? `${thread.title} | Forums | Elevate LMS` : 'Thread | Elevate LMS',
  };
}

interface ThreadReply {
  id: string;
  content: string;
  created_at: string;
  user_id: string;
  profiles: { full_name: string | null; avatar_url: string | null } | null;
}

export default async function ThreadPage({ params }: Props) {
  const { forumId, threadId } = await params;
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
    redirect('/login?redirect=/lms/forums/' + forumId + '/threads/' + threadId);
  }

  // Fetch thread with author
  const { data: thread, error } = await db
    .from('forum_threads')
    .select(`
      *,
      profiles (full_name, avatar_url),
      forums (name)
    `)
    .eq('id', threadId)
    .single();

  if (error || !thread) {
    notFound();
  }

  // Fetch replies
  const { data: replies } = await db
    .from('forum_replies')
    .select(`
      *,
      profiles (full_name, avatar_url)
    `)
    .eq('thread_id', threadId)
    .order('created_at', { ascending: true });

  const typedReplies = (replies || []) as ThreadReply[];

  const forum = thread.forums as { name: string } | null;
  const author = thread.profiles as { full_name: string | null; avatar_url: string | null } | null;

  return (
    <div className="min-h-screen bg-slate-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm text-slate-600 mb-6">
          <Link href="/lms/forums" className="hover:text-slate-900">Forums</Link>
          <span>/</span>
          <Link href={`/lms/forums/${forumId}`} className="hover:text-slate-900">
            {forum?.name || 'Forum'}
          </Link>
          <span>/</span>
          <span className="text-slate-900 truncate max-w-[200px]">{thread.title}</span>
        </nav>

        {/* Thread */}
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden mb-6">
          {/* Thread Header */}
          <div className="p-6 border-b border-slate-100">
            <h1 className="text-2xl font-bold text-slate-900 mb-4">{thread.title}</h1>
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-brand-blue-100 rounded-full flex items-center justify-center">
                {author?.avatar_url ? (
                  <img
                    src={author.avatar_url}
                    alt={author?.full_name || 'Thread author'}
                    className="w-10 h-10 rounded-full object-cover"
                  />
                ) : (
                  <span className="text-brand-blue-600 font-semibold">
                    {author?.full_name?.charAt(0) || 'A'}
                  </span>
                )}
              </div>
              <div>
                <p className="font-medium text-slate-900">
                  {author?.full_name || 'Anonymous'}
                </p>
                <p className="text-sm text-slate-500 flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {new Date(thread.created_at).toLocaleDateString('en-US', {
                    month: 'long',
                    day: 'numeric',
                    year: 'numeric',
                    hour: 'numeric',
                    minute: '2-digit',
                  })}
                </p>
              </div>
            </div>
          </div>

          {/* Thread Content */}
          <div className="p-6">
            <div className="prose prose-slate max-w-none">
              {thread.content || 'No content provided.'}
            </div>
          </div>

          {/* Thread Actions */}
          <div className="px-6 py-3 bg-slate-50 border-t border-slate-100 flex items-center gap-4">
            <button className="flex items-center gap-2 text-slate-600 hover:text-brand-blue-600 transition">
              <ThumbsUp className="w-4 h-4" />
              <span className="text-sm">Like</span>
            </button>
            <button className="flex items-center gap-2 text-slate-600 hover:text-slate-900 transition">
              <Flag className="w-4 h-4" />
              <span className="text-sm">Report</span>
            </button>
          </div>
        </div>

        {/* Replies */}
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">
            {typedReplies.length} {typedReplies.length === 1 ? 'Reply' : 'Replies'}
          </h2>

          {typedReplies.length > 0 ? (
            <div className="space-y-4">
              {typedReplies.map((reply) => {
                const replyAuthor = reply.profiles;
                return (
                  <div
                    key={reply.id}
                    className="bg-white rounded-xl border border-slate-200 p-4"
                  >
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center flex-shrink-0">
                        {replyAuthor?.avatar_url ? (
                          <img
                            src={replyAuthor.avatar_url}
                            alt={replyAuthor?.full_name || 'Reply author'}
                            className="w-10 h-10 rounded-full object-cover"
                          />
                        ) : (
                          <span className="text-slate-600 font-semibold">
                            {replyAuthor?.full_name?.charAt(0) || 'A'}
                          </span>
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-2">
                          <div>
                            <span className="font-medium text-slate-900">
                              {replyAuthor?.full_name || 'Anonymous'}
                            </span>
                            <span className="text-sm text-slate-500 ml-2">
                              {new Date(reply.created_at).toLocaleDateString('en-US', {
                                month: 'short',
                                day: 'numeric',
                                hour: 'numeric',
                                minute: '2-digit',
                              })}
                            </span>
                          </div>
                          <button className="text-slate-400 hover:text-slate-600">
                            <MoreHorizontal className="w-4 h-4" />
                          </button>
                        </div>
                        <p className="text-slate-700">{reply.content}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-slate-200 p-8 text-center">
              <MessageSquare className="w-10 h-10 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-600">No replies yet. Be the first to respond!</p>
            </div>
          )}
        </div>

        {/* Reply Form */}
        {!thread.is_locked && (
          <div className="bg-white rounded-2xl border border-slate-200 p-6">
            <h3 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
              <Reply className="w-5 h-5" />
              Post a Reply
            </h3>
            <ThreadReplyForm threadId={threadId} forumId={forumId} />
          </div>
        )}

        {thread.is_locked && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 text-center">
            <p className="text-yellow-800">This thread is locked and no longer accepting replies.</p>
          </div>
        )}
      </div>
    </div>
  );
}
