'use client';

import { useEffect, useMemo, useRef, useState, useTransition } from 'react';
import { createClient } from '@/lib/supabase/client';
import {
  ChevronDown,
  ChevronUp,
  Clock,
  MessageSquare,
  Send,
  ThumbsUp,
  User,
} from 'lucide-react';

interface Comment {
  id: string;
  content: string;
  created_at: string;
  author_name: string;
  author_avatar: string | null;
}

interface Post {
  id: string;
  content: string;
  created_at: string;
  likes_count: number;
  comments_count: number;
  tags: string[];
  author_name: string;
  author_avatar: string | null;
  liked_by_me: boolean;
}

interface Props {
  /** Slug used as the tag filter. Use "all" for the full community feed. */
  groupSlug: string;
  accentClass?: string;
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export default function GroupDiscussions({
  groupSlug,
  accentClass = 'bg-brand-blue-600 hover:bg-brand-blue-700',
}: Props) {
  const supabase = useMemo(() => createClient(), []);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [draft, setDraft] = useState('');
  const [submitting, startSubmit] = useTransition();
  const [error, setError] = useState('');
  const [userId, setUserId] = useState<string | null>(null);
  const [openComments, setOpenComments] = useState<string | null>(null);
  const [comments, setComments] = useState<Record<string, Comment[]>>({});
  const [commentDrafts, setCommentDrafts] = useState<Record<string, string>>({});
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    void supabase.auth.getUser().then(({ data }) => setUserId(data.user?.id ?? null));
  }, [supabase]);

  async function fetchPosts() {
    setLoading(true);
    setError('');

    let query = supabase
      .from('community_posts')
      .select(
        'id, content, created_at, likes_count, comments_count, tags, profiles:user_id ( full_name, avatar_url )',
      )
      .order('created_at', { ascending: false })
      .limit(50);

    if (groupSlug !== 'all') query = query.contains('tags', [groupSlug]);

    const { data, error: fetchError } = await query;
    if (fetchError) {
      setError('Community feed could not be loaded.');
      setLoading(false);
      return;
    }

    let likedIds = new Set<string>();
    if (userId && data?.length) {
      const postIds = data.map((post: any) => post.id);
      const { data: likes } = await supabase
        .from('community_post_likes')
        .select('post_id')
        .eq('user_id', userId)
        .in('post_id', postIds);
      likedIds = new Set((likes ?? []).map((like: any) => like.post_id));
    }

    setPosts(
      (data ?? []).map((post: any) => ({
        id: post.id,
        content: post.content,
        created_at: post.created_at,
        likes_count: post.likes_count ?? 0,
        comments_count: post.comments_count ?? 0,
        tags: post.tags ?? [],
        author_name: post.profiles?.full_name ?? 'Member',
        author_avatar: post.profiles?.avatar_url ?? null,
        liked_by_me: likedIds.has(post.id),
      })),
    );
    setLoading(false);
  }

  useEffect(() => {
    void fetchPosts();
  }, [groupSlug, userId]); // eslint-disable-line react-hooks/exhaustive-deps

  function handleSubmit() {
    const content = draft.trim();
    if (!content || !userId) return;

    setError('');
    startSubmit(async () => {
      const tags = groupSlug === 'all' ? ['community'] : [groupSlug];
      const { error: insertError } = await supabase
        .from('community_posts')
        .insert({ content, user_id: userId, tags });

      if (insertError) {
        setError('Failed to post. Please try again.');
        return;
      }

      setDraft('');
      await fetchPosts();
    });
  }

  async function handleLike(post: Post) {
    if (!userId) return;
    setError('');

    if (post.liked_by_me) {
      const { error: deleteError } = await supabase
        .from('community_post_likes')
        .delete()
        .eq('post_id', post.id)
        .eq('user_id', userId);

      if (deleteError) {
        setError('Could not update your reaction.');
        return;
      }
    } else {
      const { error: insertError } = await supabase
        .from('community_post_likes')
        .insert({ post_id: post.id, user_id: userId });

      if (insertError) {
        setError('Could not update your reaction.');
        return;
      }
    }

    await fetchPosts();
  }

  async function loadComments(postId: string, force = false) {
    if (!force && comments[postId]) return;

    const { data, error: commentsError } = await supabase
      .from('community_post_comments')
      .select('id, content, created_at, profiles:user_id ( full_name, avatar_url )')
      .eq('post_id', postId)
      .order('created_at', { ascending: true })
      .limit(100);

    if (commentsError) {
      setError('Comments could not be loaded.');
      return;
    }

    setComments((previous) => ({
      ...previous,
      [postId]: (data ?? []).map((comment: any) => ({
        id: comment.id,
        content: comment.content,
        created_at: comment.created_at,
        author_name: comment.profiles?.full_name ?? 'Member',
        author_avatar: comment.profiles?.avatar_url ?? null,
      })),
    }));
  }

  async function toggleComments(postId: string) {
    if (openComments === postId) {
      setOpenComments(null);
      return;
    }

    setOpenComments(postId);
    await loadComments(postId);
  }

  async function submitComment(postId: string) {
    const content = (commentDrafts[postId] ?? '').trim();
    if (!content || !userId) return;

    setError('');
    const { error: insertError } = await supabase
      .from('community_post_comments')
      .insert({ post_id: postId, user_id: userId, content });

    if (insertError) {
      setError('Your comment could not be posted.');
      return;
    }

    setCommentDrafts((previous) => ({ ...previous, [postId]: '' }));
    await Promise.all([loadComments(postId, true), fetchPosts()]);
  }

  return (
    <div className="space-y-4">
      {userId ? (
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <textarea
            ref={textareaRef}
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter' && (event.metaKey || event.ctrlKey)) handleSubmit();
            }}
            placeholder="Share an update, ask a question, or help your community…"
            rows={3}
            maxLength={5000}
            className="w-full resize-none border-0 bg-transparent text-sm text-slate-900 outline-none placeholder-slate-400 focus:ring-0"
          />
          <div className="mt-2 flex items-center justify-between border-t border-slate-100 pt-2">
            <span className="text-xs text-slate-400">Ctrl+Enter to post</span>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={!draft.trim() || submitting}
              className={`inline-flex items-center gap-1.5 rounded-lg px-4 py-1.5 text-sm font-medium text-white transition disabled:opacity-40 ${accentClass}`}
            >
              <Send className="h-3.5 w-3.5" />
              {submitting ? 'Posting…' : 'Post'}
            </button>
          </div>
        </div>
      ) : (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          Sign in to participate in the community.
        </div>
      )}

      {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((item) => (
            <div key={item} className="animate-pulse rounded-xl border border-slate-200 bg-white p-4">
              <div className="flex gap-3">
                <div className="h-8 w-8 flex-shrink-0 rounded-full bg-slate-200" />
                <div className="flex-1 space-y-2">
                  <div className="h-3 w-1/4 rounded bg-slate-200" />
                  <div className="h-3 w-3/4 rounded bg-slate-200" />
                  <div className="h-3 w-1/2 rounded bg-slate-200" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : posts.length === 0 ? (
        <div className="rounded-xl border border-slate-200 bg-white p-10 text-center">
          <MessageSquare className="mx-auto mb-3 h-10 w-10 text-slate-300" />
          <p className="font-medium text-slate-700">No posts yet</p>
          <p className="mt-1 text-sm text-slate-500">Be the first to start the conversation.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {posts.map((post) => (
            <article key={post.id} className="rounded-xl border border-slate-200 bg-white p-4">
              <div className="flex gap-3">
                <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center overflow-hidden rounded-full bg-slate-200">
                  {post.author_avatar ? (
                    // User-uploaded avatar URLs are not constrained to Next Image remote domains.
                    <img src={post.author_avatar} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <User className="h-4 w-4 text-slate-400" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="mb-1 flex flex-wrap items-center gap-2">
                    <span className="text-sm font-semibold text-slate-900">{post.author_name}</span>
                    <span className="flex items-center gap-1 text-xs text-slate-400">
                      <Clock className="h-3 w-3" /> {timeAgo(post.created_at)}
                    </span>
                  </div>
                  <p className="whitespace-pre-wrap break-words text-sm text-slate-700">{post.content}</p>

                  {post.tags.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {post.tags.map((tag) => (
                        <span key={tag} className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">
                          #{tag}
                        </span>
                      ))}
                    </div>
                  )}

                  <div className="mt-3 flex items-center gap-4 border-t border-slate-100 pt-2">
                    <button
                      type="button"
                      onClick={() => void handleLike(post)}
                      disabled={!userId}
                      className={`inline-flex items-center gap-1 text-xs font-medium transition disabled:opacity-40 ${
                        post.liked_by_me
                          ? 'text-brand-blue-600'
                          : 'text-slate-500 hover:text-brand-blue-600'
                      }`}
                    >
                      <ThumbsUp className="h-3.5 w-3.5" />
                      {post.likes_count} {post.likes_count === 1 ? 'Like' : 'Likes'}
                    </button>
                    <button
                      type="button"
                      onClick={() => void toggleComments(post.id)}
                      className="inline-flex items-center gap-1 text-xs font-medium text-slate-500 hover:text-brand-blue-600"
                    >
                      <MessageSquare className="h-3.5 w-3.5" />
                      {post.comments_count} {post.comments_count === 1 ? 'Comment' : 'Comments'}
                      {openComments === post.id ? (
                        <ChevronUp className="h-3 w-3" />
                      ) : (
                        <ChevronDown className="h-3 w-3" />
                      )}
                    </button>
                  </div>

                  {openComments === post.id && (
                    <div className="mt-3 space-y-3 rounded-xl bg-slate-50 p-3">
                      {(comments[post.id] ?? []).map((comment) => (
                        <div key={comment.id} className="flex gap-2">
                          <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center overflow-hidden rounded-full bg-slate-200">
                            {comment.author_avatar ? (
                              <img src={comment.author_avatar} alt="" className="h-full w-full object-cover" />
                            ) : (
                              <User className="h-3.5 w-3.5 text-slate-400" />
                            )}
                          </div>
                          <div className="min-w-0 rounded-lg bg-white px-3 py-2">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-bold text-slate-900">{comment.author_name}</span>
                              <span className="text-[11px] text-slate-400">{timeAgo(comment.created_at)}</span>
                            </div>
                            <p className="mt-0.5 whitespace-pre-wrap break-words text-sm text-slate-700">
                              {comment.content}
                            </p>
                          </div>
                        </div>
                      ))}

                      {userId && (
                        <div className="flex gap-2">
                          <input
                            value={commentDrafts[post.id] ?? ''}
                            onChange={(event) =>
                              setCommentDrafts((previous) => ({
                                ...previous,
                                [post.id]: event.target.value,
                              }))
                            }
                            onKeyDown={(event) => {
                              if (event.key === 'Enter') void submitComment(post.id);
                            }}
                            maxLength={2000}
                            placeholder="Write a comment…"
                            className="min-w-0 flex-1 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-brand-blue-500"
                          />
                          <button
                            type="button"
                            onClick={() => void submitComment(post.id)}
                            disabled={!(commentDrafts[post.id] ?? '').trim()}
                            className="rounded-lg bg-brand-blue-600 px-3 py-2 text-white disabled:opacity-40"
                            aria-label="Post comment"
                          >
                            <Send className="h-4 w-4" />
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
