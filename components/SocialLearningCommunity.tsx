'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  AlertTriangle,
  FileText,
  Heart,
  Image as ImageIcon,
  LogOut,
  MessageSquare,
  Paperclip,
  Plus,
  Search,
  Send,
  ThumbsUp,
  Trash2,
  Trophy,
  User,
  UserPlus,
  Users,
  Video,
  X,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

type SafeMember = {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  role: string | null;
  community_show_role: boolean;
  community_allow_messages: boolean;
  community_allow_follow: boolean;
};

type CommunityPost = {
  id: string;
  user_id: string | null;
  content: string | null;
  created_at: string;
  likes_count: number | null;
  comments_count: number | null;
  tags: string[] | null;
  media_path: string | null;
  media_type: 'image' | 'video' | 'file' | null;
  media_alt: string | null;
};

type CommentRow = { id: string; post_id: string; user_id: string; content: string; created_at: string };
type StudyGroup = { id: string; name: string; topic: string | null; description: string | null; next_session: string | null; max_members: number | null; member_count: number | null; created_by: string | null };
type ForumCategory = { id: string; name: string; slug: string };
type ForumTopic = { id: string; title: string; content: string; author_id: string | null; category_id: string | null; reply_count: number | null; is_locked: boolean | null; created_at: string | null };
type ForumReply = { id: string; topic_id: string; author_id: string | null; content: string; upvotes: number | null; created_at: string | null };
type LeaderboardRow = { user_id: string; points: number };
type Tab = 'feed' | 'groups' | 'discussions' | 'leaders';
type ReportTarget = { type: 'post' | 'comment' | 'topic' | 'reply' | 'group' | 'member'; id: string } | null;

type Props = { userId: string; userName?: string | null };

function relativeTime(value?: string | null) {
  if (!value) return '';
  const ms = Date.now() - new Date(value).getTime();
  const minutes = Math.max(1, Math.floor(ms / 60000));
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(value).toLocaleDateString();
}

function levelFor(points: number) {
  if (points >= 2000) return 6;
  if (points >= 1000) return 5;
  if (points >= 500) return 4;
  if (points >= 250) return 3;
  if (points >= 100) return 2;
  return 1;
}

function safeFileName(name: string) {
  return name.toLowerCase().replace(/[^a-z0-9._-]+/g, '-').replace(/^-+|-+$/g, '').slice(-100) || 'upload';
}

export function SocialLearningCommunity({ userId, userName }: Props) {
  const supabase = useMemo(() => createClient(), []);
  const [activeTab, setActiveTab] = useState<Tab>('feed');
  const [search, setSearch] = useState('');
  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [groups, setGroups] = useState<StudyGroup[]>([]);
  const [topics, setTopics] = useState<ForumTopic[]>([]);
  const [categories, setCategories] = useState<ForumCategory[]>([]);
  const [members, setMembers] = useState<Record<string, SafeMember>>({});
  const [likedPostIds, setLikedPostIds] = useState<Set<string>>(new Set());
  const [joinedGroupIds, setJoinedGroupIds] = useState<Set<string>>(new Set());
  const [leaderboard, setLeaderboard] = useState<LeaderboardRow[]>([]);
  const [mediaUrls, setMediaUrls] = useState<Record<string, string>>({});
  const [postDraft, setPostDraft] = useState('');
  const [tagDraft, setTagDraft] = useState('');
  const [postFile, setPostFile] = useState<File | null>(null);
  const [mediaAlt, setMediaAlt] = useState('');
  const [mentionId, setMentionId] = useState('');
  const [comments, setComments] = useState<Record<string, CommentRow[]>>({});
  const [commentDrafts, setCommentDrafts] = useState<Record<string, string>>({});
  const [expandedPostId, setExpandedPostId] = useState<string | null>(null);
  const [showGroupForm, setShowGroupForm] = useState(false);
  const [groupDraft, setGroupDraft] = useState({ name: '', topic: '', description: '' });
  const [showTopicForm, setShowTopicForm] = useState(false);
  const [topicDraft, setTopicDraft] = useState({ title: '', content: '', categoryId: '' });
  const [expandedTopicId, setExpandedTopicId] = useState<string | null>(null);
  const [replies, setReplies] = useState<Record<string, ForumReply[]>>({});
  const [replyDrafts, setReplyDrafts] = useState<Record<string, string>>({});
  const [upvotedReplyIds, setUpvotedReplyIds] = useState<Set<string>>(new Set());
  const [reportTarget, setReportTarget] = useState<ReportTarget>(null);
  const [reportReason, setReportReason] = useState('spam');
  const [reportDetails, setReportDetails] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const reward = useCallback(async (eventType: string, sourceId: string) => {
    try {
      await fetch('/api/community/reward', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ eventType, sourceId }) });
    } catch {
      // Social actions do not fail when optional rewards are unavailable.
    }
  }, []);

  const loadSafeMembers = useCallback(async () => {
    const [{ data: visible }, { data: selfRows }] = await Promise.all([
      supabase.rpc('get_community_members', { p_search: null }),
      supabase.rpc('get_community_member', { p_member_id: userId }),
    ]);
    const all = [...(visible ?? []), ...(selfRows ?? [])] as SafeMember[];
    setMembers(Object.fromEntries(all.map((m) => [m.id, m])));
  }, [supabase, userId]);

  const signMedia = useCallback(async (rows: CommunityPost[]) => {
    const pairs = await Promise.all(rows.filter((p) => p.media_path).map(async (post) => {
      const { data } = await supabase.storage.from('community-media').createSignedUrl(post.media_path!, 3600);
      return [post.id, data?.signedUrl ?? ''] as const;
    }));
    setMediaUrls(Object.fromEntries(pairs.filter(([, url]) => !!url)));
  }, [supabase]);

  const loadCommunity = useCallback(async () => {
    setError('');
    const [postsResult, groupsResult, topicsResult, categoriesResult, likesResult, membershipsResult, leadersResult] = await Promise.all([
      supabase.from('community_posts').select('id,user_id,content,created_at,likes_count,comments_count,tags,media_path,media_type,media_alt').order('created_at', { ascending: false }).limit(100),
      supabase.from('study_groups').select('id,name,topic,description,next_session,max_members,member_count,created_by').eq('is_active', true).order('created_at', { ascending: false }).limit(60),
      supabase.from('forum_topics').select('id,title,content,author_id,category_id,reply_count,is_locked,created_at').order('is_pinned', { ascending: false }).order('created_at', { ascending: false }).limit(60),
      supabase.from('forum_categories').select('id,name,slug').eq('is_active', true).order('sort_order', { ascending: true }),
      supabase.from('community_post_likes').select('post_id').eq('user_id', userId),
      supabase.from('study_group_members').select('study_group_id').eq('user_id', userId),
      supabase.from('leaderboard_scores').select('user_id,points').is('course_id', null).order('points', { ascending: false }).limit(25),
    ]);

    const nextPosts = (postsResult.data ?? []) as CommunityPost[];
    setPosts(nextPosts);
    setGroups((groupsResult.data ?? []) as StudyGroup[]);
    setTopics((topicsResult.data ?? []) as ForumTopic[]);
    setCategories((categoriesResult.data ?? []) as ForumCategory[]);
    setLikedPostIds(new Set((likesResult.data ?? []).map((row: any) => row.post_id)));
    setJoinedGroupIds(new Set((membershipsResult.data ?? []).map((row: any) => row.study_group_id)));
    setLeaderboard((leadersResult.data ?? []) as LeaderboardRow[]);
    if (postsResult.error) setError(postsResult.error.message);
    await Promise.all([loadSafeMembers(), signMedia(nextPosts)]);
  }, [loadSafeMembers, signMedia, supabase, userId]);

  useEffect(() => { void loadCommunity(); }, [loadCommunity]);

  async function createPost() {
    const content = postDraft.trim();
    if ((!content && !postFile) || busy) return;
    setBusy(true); setError('');
    let mediaPath: string | null = null;
    let mediaType: 'image' | 'video' | 'file' | null = null;

    if (postFile) {
      if (postFile.size > 10 * 1024 * 1024) { setError('Attachments must be 10 MB or smaller.'); setBusy(false); return; }
      mediaPath = `${userId}/${crypto.randomUUID()}-${safeFileName(postFile.name)}`;
      mediaType = postFile.type.startsWith('image/') ? 'image' : postFile.type.startsWith('video/') ? 'video' : 'file';
      const upload = await supabase.storage.from('community-media').upload(mediaPath, postFile, { contentType: postFile.type, upsert: false });
      if (upload.error) { setError(upload.error.message); setBusy(false); return; }
    }

    const tags = tagDraft.split(',').map((tag) => tag.trim().replace(/^#/, '')).filter(Boolean).slice(0, 8);
    const { data, error: insertError } = await supabase.from('community_posts').insert({
      user_id: userId,
      content: content || 'Shared an attachment',
      tags,
      media_path: mediaPath,
      media_type: mediaType,
      media_alt: mediaAlt.trim() || null,
    }).select('id').single();

    if (insertError || !data) {
      if (mediaPath) await supabase.storage.from('community-media').remove([mediaPath]);
      setError(insertError?.message ?? 'Could not create post.');
      setBusy(false); return;
    }

    if (mentionId) await supabase.from('community_mentions').insert({ post_id: data.id, mentioned_user_id: mentionId, created_by: userId });
    setPostDraft(''); setTagDraft(''); setPostFile(null); setMediaAlt(''); setMentionId('');
    void reward('community_post', data.id);
    await loadCommunity();
    setBusy(false);
  }

  async function deletePost(post: CommunityPost) {
    if (post.user_id !== userId || busy) return;
    setBusy(true);
    const { error: deleteError } = await supabase.from('community_posts').delete().eq('id', post.id).eq('user_id', userId);
    if (!deleteError && post.media_path) await supabase.storage.from('community-media').remove([post.media_path]);
    if (deleteError) setError(deleteError.message);
    await loadCommunity();
    setBusy(false);
  }

  async function toggleLike(postId: string) {
    if (likedPostIds.has(postId)) {
      const { error: likeError } = await supabase.from('community_post_likes').delete().eq('post_id', postId).eq('user_id', userId);
      if (likeError) { setError(likeError.message); return; }
    } else {
      const { error: likeError } = await supabase.from('community_post_likes').insert({ post_id: postId, user_id: userId });
      if (likeError && likeError.code !== '23505') { setError(likeError.message); return; }
    }
    await loadCommunity();
  }

  async function loadComments(postId: string) {
    if (expandedPostId === postId) { setExpandedPostId(null); return; }
    const { data, error: commentsError } = await supabase.from('community_post_comments').select('id,post_id,user_id,content,created_at').eq('post_id', postId).order('created_at', { ascending: true });
    if (commentsError) { setError(commentsError.message); return; }
    setComments((current) => ({ ...current, [postId]: (data ?? []) as CommentRow[] }));
    setExpandedPostId(postId);
  }

  async function createComment(postId: string) {
    const content = (commentDrafts[postId] ?? '').trim();
    if (!content || busy) return;
    setBusy(true);
    const { data, error: commentError } = await supabase.from('community_post_comments').insert({ post_id: postId, user_id: userId, content }).select('id').single();
    if (commentError || !data) setError(commentError?.message ?? 'Could not add comment.');
    else {
      setCommentDrafts((current) => ({ ...current, [postId]: '' }));
      void reward('community_comment', data.id);
      await loadComments(postId);
      await loadCommunity();
    }
    setBusy(false);
  }

  async function deleteComment(comment: CommentRow) {
    if (comment.user_id !== userId) return;
    const { error: deleteError } = await supabase.from('community_post_comments').delete().eq('id', comment.id).eq('user_id', userId);
    if (deleteError) setError(deleteError.message);
    await loadComments(comment.post_id);
    await loadCommunity();
  }

  async function createGroup() {
    if (!groupDraft.name.trim() || busy) return;
    setBusy(true); setError('');
    const { data, error: groupError } = await supabase.from('study_groups').insert({
      name: groupDraft.name.trim(), topic: groupDraft.topic.trim() || null, description: groupDraft.description.trim() || null, created_by: userId, is_active: true,
    }).select('id').single();
    if (groupError || !data) setError(groupError?.message ?? 'Could not create group.');
    else {
      await supabase.from('study_group_members').insert({ study_group_id: data.id, user_id: userId });
      void reward('study_group_created', data.id);
      setGroupDraft({ name: '', topic: '', description: '' }); setShowGroupForm(false);
      await loadCommunity();
    }
    setBusy(false);
  }

  async function toggleGroup(groupId: string) {
    const joined = joinedGroupIds.has(groupId);
    const result = joined
      ? await supabase.from('study_group_members').delete().eq('study_group_id', groupId).eq('user_id', userId)
      : await supabase.from('study_group_members').insert({ study_group_id: groupId, user_id: userId });
    if (result.error && result.error.code !== '23505') { setError(result.error.message); return; }
    if (!joined) void reward('study_group_joined', groupId);
    await loadCommunity();
  }

  async function createTopic() {
    if (!topicDraft.title.trim() || !topicDraft.content.trim() || busy) return;
    setBusy(true); setError('');
    const slugBase = topicDraft.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 70) || 'discussion';
    const { data, error: topicError } = await supabase.from('forum_topics').insert({
      author_id: userId, category_id: topicDraft.categoryId || null, title: topicDraft.title.trim(), content: topicDraft.content.trim(), slug: `${slugBase}-${Date.now().toString(36)}`,
    }).select('id').single();
    if (topicError || !data) setError(topicError?.message ?? 'Could not start discussion.');
    else { void reward('forum_topic', data.id); setTopicDraft({ title: '', content: '', categoryId: '' }); setShowTopicForm(false); await loadCommunity(); }
    setBusy(false);
  }

  async function loadReplies(topicId: string) {
    if (expandedTopicId === topicId) { setExpandedTopicId(null); return; }
    const [{ data: replyRows, error: replyError }, { data: votes }] = await Promise.all([
      supabase.from('forum_replies').select('id,topic_id,author_id,content,upvotes,created_at').eq('topic_id', topicId).order('created_at', { ascending: true }),
      supabase.from('forum_upvotes').select('reply_id').eq('user_id', userId),
    ]);
    if (replyError) { setError(replyError.message); return; }
    setReplies((current) => ({ ...current, [topicId]: (replyRows ?? []) as ForumReply[] }));
    setUpvotedReplyIds(new Set((votes ?? []).map((v: any) => v.reply_id)));
    setExpandedTopicId(topicId);
  }

  async function createReply(topicId: string) {
    const content = (replyDrafts[topicId] ?? '').trim();
    if (!content || busy) return;
    setBusy(true);
    const { data, error: replyError } = await supabase.from('forum_replies').insert({ topic_id: topicId, author_id: userId, content }).select('id').single();
    if (replyError || !data) setError(replyError?.message ?? 'Could not add reply.');
    else { setReplyDrafts((current) => ({ ...current, [topicId]: '' })); void reward('forum_reply', data.id); await loadReplies(topicId); await loadCommunity(); }
    setBusy(false);
  }

  async function toggleUpvote(reply: ForumReply) {
    const active = upvotedReplyIds.has(reply.id);
    const result = active
      ? await supabase.from('forum_upvotes').delete().eq('reply_id', reply.id).eq('user_id', userId)
      : await supabase.from('forum_upvotes').insert({ reply_id: reply.id, user_id: userId });
    if (result.error && result.error.code !== '23505') { setError(result.error.message); return; }
    if (expandedTopicId) await loadReplies(expandedTopicId);
  }

  async function submitReport() {
    if (!reportTarget || busy) return;
    setBusy(true);
    const { error: reportError } = await supabase.from('community_reports').insert({ reporter_id: userId, target_type: reportTarget.type, target_id: reportTarget.id, reason: reportReason, details: reportDetails.trim() || null });
    if (reportError && reportError.code !== '23505') setError(reportError.message);
    setReportTarget(null); setReportReason('spam'); setReportDetails(''); setBusy(false);
  }

  const query = search.trim().toLowerCase();
  const visiblePosts = posts.filter((p) => !query || `${p.content ?? ''} ${(p.tags ?? []).join(' ')}`.toLowerCase().includes(query));
  const visibleGroups = groups.filter((g) => !query || `${g.name} ${g.topic ?? ''} ${g.description ?? ''}`.toLowerCase().includes(query));
  const visibleTopics = topics.filter((t) => !query || `${t.title} ${t.content}`.toLowerCase().includes(query));
  const categoryMap = Object.fromEntries(categories.map((c) => [c.id, c.name]));
  const memberList = Object.values(members).filter((m) => m.id !== userId);

  return (
    <div className="space-y-6">
      <section className="rounded-3xl bg-slate-950 p-6 text-white md:p-8">
        <p className="text-xs font-black uppercase tracking-[0.2em] text-cyan-300">Elevate Community</p>
        <h1 className="mt-2 text-3xl font-black">Learn together. Build your network. Move your career forward.</h1>
        <p className="mt-2 max-w-3xl text-slate-300">Feed, study groups, discussions, events, member networking, points, achievements, private messaging, career opportunities, and the AI Team all stay inside the same authenticated learner experience.</p>
        <div className="mt-5 flex flex-wrap gap-2"><Link href="/lms/members" className="rounded-xl bg-white px-4 py-2 text-sm font-black text-slate-950">Members</Link><Link href="/lms/events" className="rounded-xl border border-white/30 px-4 py-2 text-sm font-black text-white">Events</Link><Link href="/lms/jobs" className="rounded-xl border border-white/30 px-4 py-2 text-sm font-black text-white">Career opportunities</Link><Link href="/lms/ai-team" className="rounded-xl border border-white/30 px-4 py-2 text-sm font-black text-white">AI Team</Link></div>
      </section>

      {error && <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-800"><AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0" /><span>{error}</span><button onClick={() => setError('')} className="ml-auto"><X className="h-4 w-4" /></button></div>}

      <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex gap-2 overflow-x-auto">{(['feed','groups','discussions','leaders'] as Tab[]).map((tab) => <button key={tab} onClick={() => setActiveTab(tab)} className={`whitespace-nowrap rounded-xl px-4 py-2 text-sm font-black capitalize ${activeTab === tab ? 'bg-slate-950 text-white' : 'text-slate-600 hover:bg-slate-100'}`}>{tab === 'leaders' ? 'Leaderboard' : tab}</button>)}</div>
        <div className="relative min-w-0 lg:w-80"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" /><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search community" className="w-full rounded-xl border border-slate-200 py-2 pl-9 pr-3 text-sm outline-none focus:border-brand-blue-400" /></div>
      </div>

      {activeTab === 'feed' && <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_300px]">
        <div className="space-y-4">
          <div className="rounded-2xl border border-slate-200 bg-white p-5">
            <p className="mb-3 text-sm font-black text-slate-800">Post as {userName || members[userId]?.full_name || 'Learner'}</p>
            <textarea value={postDraft} onChange={(e) => setPostDraft(e.target.value)} maxLength={4000} rows={3} className="w-full rounded-xl border border-slate-300 p-3 outline-none focus:border-brand-blue-500" placeholder="Share an update, question, milestone, resource, or opportunity…" />
            <div className="mt-3 grid gap-2 md:grid-cols-2"><input value={tagDraft} onChange={(e) => setTagDraft(e.target.value)} className="rounded-xl border border-slate-300 px-3 py-2 text-sm" placeholder="Tags, comma separated" /><select value={mentionId} onChange={(e) => setMentionId(e.target.value)} className="rounded-xl border border-slate-300 px-3 py-2 text-sm"><option value="">Mention a member (optional)</option>{memberList.map((m) => <option key={m.id} value={m.id}>@{m.full_name ?? 'Member'}</option>)}</select></div>
            <div className="mt-3 flex flex-col gap-3 rounded-xl bg-slate-50 p-3 sm:flex-row sm:items-center">
              <label className="inline-flex cursor-pointer items-center gap-2 text-sm font-bold text-slate-700"><Paperclip className="h-4 w-4" /><span>{postFile ? postFile.name : 'Add image, video, or PDF'}</span><input type="file" accept="image/jpeg,image/png,image/webp,image/gif,video/mp4,video/webm,application/pdf" className="sr-only" onChange={(e) => setPostFile(e.target.files?.[0] ?? null)} /></label>
              {postFile && <input value={mediaAlt} onChange={(e) => setMediaAlt(e.target.value)} maxLength={240} className="min-w-0 flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm" placeholder="Describe attachment for accessibility" />}
              <button onClick={createPost} disabled={busy || (!postDraft.trim() && !postFile)} className="ml-auto rounded-xl bg-brand-blue-600 px-5 py-2.5 text-sm font-black text-white disabled:opacity-50">{busy ? 'Posting…' : 'Post'}</button>
            </div>
          </div>

          {!visiblePosts.length && <Empty icon={MessageSquare} title="No matching posts" text={query ? 'Try a different search.' : 'Start the community with the first post.'} />}
          {visiblePosts.map((post) => {
            const author = post.user_id ? members[post.user_id] : null;
            const liked = likedPostIds.has(post.id);
            return <article key={post.id} className="rounded-2xl border border-slate-200 bg-white p-5">
              <div className="flex items-start gap-3"><Avatar member={author} /><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-x-2 gap-y-1"><span className="font-black text-slate-900">{author?.full_name ?? (post.user_id === userId ? userName ?? 'You' : 'Community member')}</span><span className="text-xs text-slate-400">{relativeTime(post.created_at)}</span></div><p className="mt-2 whitespace-pre-wrap break-words text-sm leading-6 text-slate-700">{post.content}</p>{post.tags?.length ? <div className="mt-3 flex flex-wrap gap-1.5">{post.tags.map((tag) => <span key={tag} className="rounded-full bg-slate-100 px-2 py-1 text-xs font-bold text-slate-600">#{tag}</span>)}</div> : null}
                {post.media_path && mediaUrls[post.id] && <MediaPreview post={post} url={mediaUrls[post.id]!} />}
                <div className="mt-4 flex flex-wrap items-center gap-4 text-xs font-bold text-slate-500"><button onClick={() => toggleLike(post.id)} className={`inline-flex items-center gap-1.5 ${liked ? 'text-red-600' : 'hover:text-brand-blue-600'}`}><Heart className={`h-4 w-4 ${liked ? 'fill-current' : ''}`} />{post.likes_count ?? 0}</button><button onClick={() => loadComments(post.id)} className="inline-flex items-center gap-1.5 hover:text-brand-blue-600"><MessageSquare className="h-4 w-4" />{post.comments_count ?? 0}</button>{post.user_id === userId ? <button onClick={() => deletePost(post)} className="ml-auto inline-flex items-center gap-1 text-red-600"><Trash2 className="h-3.5 w-3.5" />Delete</button> : <button onClick={() => setReportTarget({ type: 'post', id: post.id })} className="ml-auto text-slate-400 hover:text-red-600">Report</button>}</div>
                {expandedPostId === post.id && <div className="mt-4 space-y-3 border-t border-slate-100 pt-4">{(comments[post.id] ?? []).map((comment) => { const commenter = members[comment.user_id]; return <div key={comment.id} className="flex gap-2"><Avatar member={commenter} small /><div className="min-w-0 flex-1 rounded-xl bg-slate-50 p-3"><div className="flex items-center gap-2"><span className="text-xs font-black text-slate-800">{commenter?.full_name ?? (comment.user_id === userId ? 'You' : 'Community member')}</span><span className="text-[11px] text-slate-400">{relativeTime(comment.created_at)}</span>{comment.user_id === userId && <button onClick={() => deleteComment(comment)} className="ml-auto text-red-500"><Trash2 className="h-3 w-3" /></button>}</div><p className="mt-1 whitespace-pre-wrap text-sm text-slate-700">{comment.content}</p></div></div>; })}<div className="flex gap-2"><input value={commentDrafts[post.id] ?? ''} onChange={(e) => setCommentDrafts((c) => ({ ...c, [post.id]: e.target.value }))} maxLength={4000} placeholder="Write a comment" className="min-w-0 flex-1 rounded-xl border border-slate-300 px-3 py-2 text-sm" /><button onClick={() => createComment(post.id)} className="rounded-xl bg-slate-950 px-4 py-2 text-white"><Send className="h-4 w-4" /></button></div></div>}
              </div></div>
            </article>;
          })}
        </div>
        <aside className="space-y-4"><div className="rounded-2xl border border-slate-200 bg-white p-5"><h2 className="font-black text-slate-900">Community shortcuts</h2><div className="mt-3 space-y-2 text-sm font-bold"><Link href="/lms/members" className="flex items-center gap-2 rounded-lg p-2 hover:bg-slate-50"><Users className="h-4 w-4" />Member directory</Link><Link href="/lms/messages" className="flex items-center gap-2 rounded-lg p-2 hover:bg-slate-50"><MessageSquare className="h-4 w-4" />Messages</Link><Link href="/lms/events" className="flex items-center gap-2 rounded-lg p-2 hover:bg-slate-50"><UserPlus className="h-4 w-4" />Events & networking</Link></div></div><div className="rounded-2xl border border-slate-200 bg-white p-5"><h2 className="font-black text-slate-900">Your privacy</h2><p className="mt-2 text-sm leading-6 text-slate-600">The member directory is opt-in. Workforce, funding, eligibility, case-management, and compliance data never appear in the social profile.</p><Link href="/lms/settings/privacy" className="mt-3 inline-block text-sm font-black text-brand-blue-600">Manage privacy →</Link></div></aside>
      </div>}

      {activeTab === 'groups' && <div className="space-y-5"><div className="flex justify-end"><button onClick={() => setShowGroupForm(!showGroupForm)} className="inline-flex items-center gap-2 rounded-xl bg-brand-blue-600 px-4 py-2.5 text-sm font-black text-white"><Plus className="h-4 w-4" />Create group</button></div>{showGroupForm && <div className="grid gap-3 rounded-2xl border border-slate-200 bg-white p-5"><input value={groupDraft.name} onChange={(e) => setGroupDraft({ ...groupDraft, name: e.target.value })} maxLength={120} placeholder="Group name" className="rounded-xl border p-3" /><input value={groupDraft.topic} onChange={(e) => setGroupDraft({ ...groupDraft, topic: e.target.value })} maxLength={160} placeholder="Topic/program" className="rounded-xl border p-3" /><textarea value={groupDraft.description} onChange={(e) => setGroupDraft({ ...groupDraft, description: e.target.value })} maxLength={1000} placeholder="Description" className="rounded-xl border p-3" /><button onClick={createGroup} disabled={busy || !groupDraft.name.trim()} className="justify-self-start rounded-xl bg-slate-950 px-5 py-2.5 font-black text-white">Create group</button></div>}<div className="grid gap-4 md:grid-cols-2">{visibleGroups.map((group) => { const joined = joinedGroupIds.has(group.id); return <article key={group.id} className="rounded-2xl border border-slate-200 bg-white p-5"><div className="flex items-start justify-between gap-3"><div><h2 className="font-black text-slate-900">{group.name}</h2><p className="mt-1 text-sm text-brand-blue-700">{group.topic ?? 'General'}</p></div><Users className="h-5 w-5 text-slate-400" /></div>{group.description && <p className="mt-3 text-sm leading-6 text-slate-600">{group.description}</p>}<div className="mt-4 flex items-center justify-between"><span className="text-xs font-bold text-slate-500">{group.member_count ?? 0} members</span><button onClick={() => toggleGroup(group.id)} className={`rounded-xl px-4 py-2 text-sm font-black ${joined ? 'border border-slate-300 bg-white text-slate-700' : 'bg-brand-blue-600 text-white'}`}>{joined ? <span className="inline-flex items-center gap-1"><LogOut className="h-3.5 w-3.5" />Leave</span> : 'Join'}</button></div></article>; })}</div>{!visibleGroups.length && <Empty icon={Users} title="No matching groups" text="Create a study group for your program, certification, or career goal." />}</div>}

      {activeTab === 'discussions' && <div className="space-y-5"><div className="flex justify-end"><button onClick={() => setShowTopicForm(!showTopicForm)} className="inline-flex items-center gap-2 rounded-xl bg-brand-blue-600 px-4 py-2.5 text-sm font-black text-white"><Plus className="h-4 w-4" />Start discussion</button></div>{showTopicForm && <div className="grid gap-3 rounded-2xl border border-slate-200 bg-white p-5"><select value={topicDraft.categoryId} onChange={(e) => setTopicDraft({ ...topicDraft, categoryId: e.target.value })} className="rounded-xl border p-3"><option value="">Choose category</option>{categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select><input value={topicDraft.title} onChange={(e) => setTopicDraft({ ...topicDraft, title: e.target.value })} maxLength={180} placeholder="Discussion title" className="rounded-xl border p-3" /><textarea value={topicDraft.content} onChange={(e) => setTopicDraft({ ...topicDraft, content: e.target.value })} maxLength={8000} rows={5} placeholder="Question, resource, or discussion" className="rounded-xl border p-3" /><button onClick={createTopic} disabled={busy || !topicDraft.title.trim() || !topicDraft.content.trim()} className="justify-self-start rounded-xl bg-slate-950 px-5 py-2.5 font-black text-white">Publish discussion</button></div>}{visibleTopics.map((topic) => { const author = topic.author_id ? members[topic.author_id] : null; return <article key={topic.id} className="rounded-2xl border border-slate-200 bg-white p-5"><div className="flex items-start gap-3"><Avatar member={author} /><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><span className="text-xs font-black uppercase tracking-wide text-brand-blue-700">{topic.category_id ? categoryMap[topic.category_id] ?? 'Discussion' : 'Discussion'}</span><span className="text-xs text-slate-400">{relativeTime(topic.created_at)}</span></div><h2 className="mt-1 text-lg font-black text-slate-900">{topic.title}</h2><p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-700">{topic.content}</p><div className="mt-4 flex items-center gap-4"><button onClick={() => loadReplies(topic.id)} className="inline-flex items-center gap-1.5 text-sm font-bold text-slate-600 hover:text-brand-blue-600"><MessageSquare className="h-4 w-4" />{topic.reply_count ?? 0} replies</button>{topic.author_id !== userId && <button onClick={() => setReportTarget({ type: 'topic', id: topic.id })} className="text-xs font-bold text-slate-400 hover:text-red-600">Report</button>}</div>{expandedTopicId === topic.id && <div className="mt-4 space-y-3 border-t border-slate-100 pt-4">{(replies[topic.id] ?? []).map((reply) => { const replyAuthor = reply.author_id ? members[reply.author_id] : null; const upvoted = upvotedReplyIds.has(reply.id); return <div key={reply.id} className="flex gap-2"><Avatar member={replyAuthor} small /><div className="min-w-0 flex-1 rounded-xl bg-slate-50 p-3"><div className="flex items-center gap-2"><span className="text-xs font-black">{replyAuthor?.full_name ?? (reply.author_id === userId ? 'You' : 'Community member')}</span><span className="text-[11px] text-slate-400">{relativeTime(reply.created_at)}</span></div><p className="mt-1 whitespace-pre-wrap text-sm text-slate-700">{reply.content}</p><button onClick={() => toggleUpvote(reply)} className={`mt-2 inline-flex items-center gap-1 text-xs font-bold ${upvoted ? 'text-brand-blue-700' : 'text-slate-500'}`}><ThumbsUp className="h-3.5 w-3.5" />{reply.upvotes ?? 0}</button></div></div>; })}{!topic.is_locked && <div className="flex gap-2"><input value={replyDrafts[topic.id] ?? ''} onChange={(e) => setReplyDrafts((r) => ({ ...r, [topic.id]: e.target.value }))} maxLength={8000} placeholder="Write a reply" className="min-w-0 flex-1 rounded-xl border border-slate-300 px-3 py-2 text-sm" /><button onClick={() => createReply(topic.id)} className="rounded-xl bg-slate-950 px-4 py-2 text-white"><Send className="h-4 w-4" /></button></div>}</div>}</div></div></article>; })}{!visibleTopics.length && <Empty icon={MessageSquare} title="No matching discussions" text="Start a discussion for questions, resources, or career advice." />}</div>}

      {activeTab === 'leaders' && <div className="rounded-2xl border border-slate-200 bg-white p-5"><div className="mb-5 flex items-center gap-3"><Trophy className="h-7 w-7 text-amber-500" /><div><h2 className="text-xl font-black text-slate-900">Community leaderboard</h2><p className="text-sm text-slate-600">Points come from verified learning and constructive engagement events.</p></div></div><div className="divide-y divide-slate-100">{leaderboard.map((row, index) => { const member = members[row.user_id]; return <div key={row.user_id} className="flex items-center gap-4 py-4"><span className="w-8 text-center text-lg font-black text-slate-400">{index + 1}</span><Avatar member={member} /><div className="min-w-0 flex-1"><p className="truncate font-black text-slate-900">{member?.full_name ?? (row.user_id === userId ? userName ?? 'You' : 'Private member')}</p><p className="text-xs text-slate-500">Level {levelFor(row.points)}</p></div><strong className="text-brand-blue-700">{row.points} pts</strong></div>; })}{!leaderboard.length && <div className="p-10 text-center text-slate-500">No points have been awarded yet.</div>}</div></div>}

      {reportTarget && <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4"><div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl"><div className="flex items-start justify-between"><div><h2 className="text-xl font-black text-slate-900">Report community content</h2><p className="mt-1 text-sm text-slate-600">Reports go to authorized Elevate staff for review.</p></div><button onClick={() => setReportTarget(null)}><X className="h-5 w-5" /></button></div><select value={reportReason} onChange={(e) => setReportReason(e.target.value)} className="mt-5 w-full rounded-xl border border-slate-300 p-3"><option value="spam">Spam</option><option value="harassment">Harassment</option><option value="unsafe">Unsafe content</option><option value="privacy">Privacy concern</option><option value="misinformation">Misinformation</option><option value="other">Other</option></select><textarea value={reportDetails} onChange={(e) => setReportDetails(e.target.value)} maxLength={1000} rows={4} placeholder="Additional details (optional)" className="mt-3 w-full rounded-xl border border-slate-300 p-3" /><button onClick={submitReport} disabled={busy} className="mt-4 w-full rounded-xl bg-red-600 px-5 py-3 font-black text-white disabled:opacity-50">Submit report</button></div></div>}
    </div>
  );
}

function Avatar({ member, small = false }: { member?: SafeMember | null | undefined; small?: boolean }) {
  const size = small ? 'h-8 w-8' : 'h-10 w-10';
  return <div className={`flex ${size} flex-shrink-0 items-center justify-center overflow-hidden rounded-full bg-slate-100`}>{member?.avatar_url ? <img src={member.avatar_url} alt="" className="h-full w-full object-cover" /> : <User className={`${small ? 'h-3.5 w-3.5' : 'h-4 w-4'} text-slate-400`} />}</div>;
}

function MediaPreview({ post, url }: { post: CommunityPost; url: string }) {
  if (post.media_type === 'image') return <img src={url} alt={post.media_alt ?? ''} className="mt-4 max-h-[520px] w-full rounded-xl object-contain bg-slate-50" />;
  if (post.media_type === 'video') return <video controls preload="metadata" className="mt-4 max-h-[520px] w-full rounded-xl bg-black" aria-label={post.media_alt ?? 'Community video'}><source src={url} /></video>;
  return <a href={url} target="_blank" rel="noreferrer" className="mt-4 flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4 font-bold text-brand-blue-700"><FileText className="h-5 w-5" />Open attached file</a>;
}

function Empty({ icon: Icon, title, text }: { icon: typeof Users; title: string; text: string }) {
  return <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center"><Icon className="mx-auto h-10 w-10 text-slate-300" /><h2 className="mt-3 font-black text-slate-900">{title}</h2><p className="mt-1 text-sm text-slate-600">{text}</p></div>;
}

export default SocialLearningCommunity;
