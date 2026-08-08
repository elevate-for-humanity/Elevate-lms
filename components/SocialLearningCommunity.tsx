'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Heart, MessageSquare, Plus, Trophy, Users } from 'lucide-react';

type Profile = { id: string; full_name: string | null; avatar_url: string | null };
type CommunityPost = {
  id: string;
  user_id: string | null;
  content: string | null;
  created_at: string;
  likes_count: number | null;
  comments_count: number | null;
  tags: string[] | null;
};
type StudyGroup = {
  id: string;
  name: string | null;
  topic: string | null;
  description: string | null;
  next_session: string | null;
  max_members: number | null;
  member_count?: number | null;
};
type ForumTopic = {
  id: string;
  title: string;
  content: string;
  author_id: string | null;
  category_id: string | null;
  reply_count: number | null;
  created_at: string | null;
};
type ForumCategory = { id: string; name: string; slug: string };
type CommentRow = { id: string; post_id: string; user_id: string; content: string; created_at: string };
type LeaderboardRow = { user_id: string; points: number };

type Props = {
  userId: string;
  userName?: string | null;
};

function relativeTime(value?: string | null) {
  if (!value) return '';
  const ms = Date.now() - new Date(value).getTime();
  const minutes = Math.max(1, Math.round(ms / 60000));
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.round(hours / 24)}d ago`;
}

function levelFor(points: number) {
  if (points >= 2000) return 6;
  if (points >= 1000) return 5;
  if (points >= 500) return 4;
  if (points >= 250) return 3;
  if (points >= 100) return 2;
  return 1;
}

export function SocialLearningCommunity({ userId, userName }: Props) {
  const supabase = useMemo(() => createClient(), []);
  const [activeTab, setActiveTab] = useState<'feed' | 'groups' | 'discussions' | 'leaders'>('feed');
  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [groups, setGroups] = useState<StudyGroup[]>([]);
  const [topics, setTopics] = useState<ForumTopic[]>([]);
  const [categories, setCategories] = useState<ForumCategory[]>([]);
  const [profiles, setProfiles] = useState<Record<string, Profile>>({});
  const [likedPostIds, setLikedPostIds] = useState<Set<string>>(new Set());
  const [joinedGroupIds, setJoinedGroupIds] = useState<Set<string>>(new Set());
  const [leaderboard, setLeaderboard] = useState<LeaderboardRow[]>([]);
  const [postDraft, setPostDraft] = useState('');
  const [tagDraft, setTagDraft] = useState('');
  const [commentDrafts, setCommentDrafts] = useState<Record<string, string>>({});
  const [comments, setComments] = useState<Record<string, CommentRow[]>>({});
  const [expandedPostId, setExpandedPostId] = useState<string | null>(null);
  const [showGroupForm, setShowGroupForm] = useState(false);
  const [groupDraft, setGroupDraft] = useState({ name: '', topic: '', description: '' });
  const [showTopicForm, setShowTopicForm] = useState(false);
  const [topicDraft, setTopicDraft] = useState({ title: '', content: '', categoryId: '' });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const reward = useCallback(async (eventType: string, sourceId: string) => {
    try {
      await fetch('/api/community/reward', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ eventType, sourceId }),
      });
    } catch {
      // Community actions succeed independently of optional reward delivery.
    }
  }, []);

  const hydrateProfiles = useCallback(async (ids: Array<string | null | undefined>) => {
    const unique = [...new Set(ids.filter(Boolean) as string[])];
    if (!unique.length) return;
    const { data } = await supabase.from('profiles').select('id, full_name, avatar_url').in('id', unique);
    if (!data) return;
    setProfiles((current) => ({ ...current, ...Object.fromEntries(data.map((p: Profile) => [p.id, p])) }));
  }, [supabase]);

  const loadCommunity = useCallback(async () => {
    setError('');
    const [postsResult, groupsResult, topicsResult, categoriesResult, likesResult, membershipsResult, leadersResult] = await Promise.all([
      supabase.from('community_posts').select('id,user_id,content,created_at,likes_count,comments_count,tags').order('created_at', { ascending: false }).limit(50),
      supabase.from('study_groups').select('id,name,topic,description,next_session,max_members,member_count').eq('is_active', true).order('created_at', { ascending: false }).limit(30),
      supabase.from('forum_topics').select('id,title,content,author_id,category_id,reply_count,created_at').order('is_pinned', { ascending: false }).order('created_at', { ascending: false }).limit(30),
      supabase.from('forum_categories').select('id,name,slug').eq('is_active', true).order('sort_order', { ascending: true }),
      supabase.from('community_post_likes').select('post_id').eq('user_id', userId),
      supabase.from('study_group_members').select('study_group_id').eq('user_id', userId),
      supabase.from('leaderboard_scores').select('user_id,points').is('course_id', null).order('points', { ascending: false }).limit(10),
    ]);

    if (postsResult.error) setError(postsResult.error.message);
    setPosts((postsResult.data ?? []) as CommunityPost[]);
    setGroups((groupsResult.data ?? []) as StudyGroup[]);
    setTopics((topicsResult.data ?? []) as ForumTopic[]);
    setCategories((categoriesResult.data ?? []) as ForumCategory[]);
    setLikedPostIds(new Set((likesResult.data ?? []).map((row: any) => row.post_id)));
    setJoinedGroupIds(new Set((membershipsResult.data ?? []).map((row: any) => row.study_group_id)));
    setLeaderboard((leadersResult.data ?? []) as LeaderboardRow[]);
    await hydrateProfiles([
      ...(postsResult.data ?? []).map((row: any) => row.user_id),
      ...(topicsResult.data ?? []).map((row: any) => row.author_id),
      ...(leadersResult.data ?? []).map((row: any) => row.user_id),
      userId,
    ]);
  }, [hydrateProfiles, supabase, userId]);

  useEffect(() => { void loadCommunity(); }, [loadCommunity]);

  async function createPost() {
    const content = postDraft.trim();
    if (!content || busy) return;
    setBusy(true); setError('');
    const tags = tagDraft.split(',').map((tag) => tag.trim().replace(/^#/, '')).filter(Boolean).slice(0, 8);
    const { data, error: insertError } = await supabase
      .from('community_posts')
      .insert({ user_id: userId, content, tags })
      .select('id')
      .single();
    if (insertError || !data) setError(insertError?.message ?? 'Could not create post.');
    else {
      setPostDraft(''); setTagDraft('');
      void reward('community_post', data.id);
      await loadCommunity();
    }
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
    const { data, error: commentsError } = await supabase
      .from('community_post_comments')
      .select('id,post_id,user_id,content,created_at')
      .eq('post_id', postId)
      .order('created_at', { ascending: true });
    if (commentsError) { setError(commentsError.message); return; }
    const rows = (data ?? []) as CommentRow[];
    setComments((current) => ({ ...current, [postId]: rows }));
    await hydrateProfiles(rows.map((row) => row.user_id));
    setExpandedPostId(postId);
  }

  async function createComment(postId: string) {
    const content = (commentDrafts[postId] ?? '').trim();
    if (!content) return;
    const { data, error: commentError } = await supabase
      .from('community_post_comments')
      .insert({ post_id: postId, user_id: userId, content })
      .select('id')
      .single();
    if (commentError || !data) { setError(commentError?.message ?? 'Could not add comment.'); return; }
    setCommentDrafts((current) => ({ ...current, [postId]: '' }));
    void reward('community_comment', data.id);
    await loadComments(postId);
    await loadCommunity();
  }

  async function createGroup() {
    if (!groupDraft.name.trim() || busy) return;
    setBusy(true); setError('');
    const { data, error: groupError } = await supabase
      .from('study_groups')
      .insert({ name: groupDraft.name.trim(), topic: groupDraft.topic.trim() || null, description: groupDraft.description.trim() || null, created_by: userId, is_active: true })
      .select('id')
      .single();
    if (groupError || !data) setError(groupError?.message ?? 'Could not create group.');
    else {
      await supabase.from('study_group_members').insert({ study_group_id: data.id, user_id: userId });
      void reward('study_group_created', data.id);
      setGroupDraft({ name: '', topic: '', description: '' }); setShowGroupForm(false);
      await loadCommunity();
    }
    setBusy(false);
  }

  async function joinGroup(groupId: string) {
    if (joinedGroupIds.has(groupId)) return;
    const { error: joinError } = await supabase.from('study_group_members').insert({ study_group_id: groupId, user_id: userId });
    if (joinError && joinError.code !== '23505') { setError(joinError.message); return; }
    void reward('study_group_joined', groupId);
    await loadCommunity();
  }

  async function createTopic() {
    if (!topicDraft.title.trim() || !topicDraft.content.trim() || busy) return;
    setBusy(true); setError('');
    const slugBase = topicDraft.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 70) || 'discussion';
    const { data, error: topicError } = await supabase
      .from('forum_topics')
      .insert({ author_id: userId, category_id: topicDraft.categoryId || null, title: topicDraft.title.trim(), content: topicDraft.content.trim(), slug: `${slugBase}-${Date.now().toString(36)}` })
      .select('id')
      .single();
    if (topicError || !data) setError(topicError?.message ?? 'Could not start discussion.');
    else {
      void reward('forum_topic', data.id);
      setTopicDraft({ title: '', content: '', categoryId: '' }); setShowTopicForm(false);
      await loadCommunity();
    }
    setBusy(false);
  }

  const categoryMap = Object.fromEntries(categories.map((category) => [category.id, category.name]));

  return (
    <div className="space-y-6">
      <section className="rounded-3xl bg-slate-950 p-6 text-white md:p-8">
        <p className="text-xs font-black uppercase tracking-[0.2em] text-cyan-300">Community</p>
        <h1 className="mt-2 text-3xl font-black">Learn together, not alone.</h1>
        <p className="mt-2 max-w-2xl text-slate-300">Share progress, ask questions, join study groups, earn points, and recognize the people helping the community move forward.</p>
      </section>

      {error && <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-800">{error}</div>}

      <div className="flex gap-2 overflow-x-auto rounded-2xl border border-slate-200 bg-white p-2">
        {(['feed', 'groups', 'discussions', 'leaders'] as const).map((tab) => (
          <button key={tab} onClick={() => setActiveTab(tab)} className={`whitespace-nowrap rounded-xl px-4 py-2 text-sm font-bold capitalize ${activeTab === tab ? 'bg-slate-950 text-white' : 'text-slate-600 hover:bg-slate-100'}`}>{tab === 'leaders' ? 'Leaderboard' : tab}</button>
        ))}
      </div>

      {activeTab === 'feed' && (
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_300px]">
          <div className="space-y-4">
            <div className="rounded-2xl border border-slate-200 bg-white p-5">
              <p className="mb-3 text-sm font-bold text-slate-800">Post as {userName || profiles[userId]?.full_name || 'Learner'}</p>
              <textarea value={postDraft} onChange={(e) => setPostDraft(e.target.value)} maxLength={4000} rows={3} className="w-full rounded-xl border border-slate-300 p-3 outline-none focus:border-slate-500" placeholder="Share an update, question, milestone, resource, or opportunity…" />
              <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center">
                <input value={tagDraft} onChange={(e) => setTagDraft(e.target.value)} className="flex-1 rounded-xl border border-slate-300 px-3 py-2 text-sm" placeholder="Tags, comma separated (optional)" />
                <button onClick={createPost} disabled={busy || !postDraft.trim()} className="rounded-xl bg-brand-blue-600 px-5 py-2.5 text-sm font-black text-white disabled:opacity-50">Post</button>
              </div>
            </div>

            {!posts.length && <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center"><MessageSquare className="mx-auto h-10 w-10 text-slate-400" /><h2 className="mt-3 font-black text-slate-900">Start the community</h2><p className="mt-1 text-sm text-slate-600">There are no real posts yet. Your post will become the first item in this feed.</p></div>}

            {posts.map((post) => {
              const profile = post.user_id ? profiles[post.user_id] : null;
              const liked = likedPostIds.has(post.id);
              return (
                <article key={post.id} className="rounded-2xl border border-slate-200 bg-white p-5">
                  <div className="flex items-start gap-3">
                    {profile?.avatar_url ? <img src={profile.avatar_url} alt="" className="h-10 w-10 rounded-full object-cover" /> : <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-200 font-black text-slate-700">{(profile?.full_name || 'L')[0]}</div>}
                    <div className="min-w-0 flex-1"><p className="font-black text-slate-900">{profile?.full_name || 'Elevate learner'}</p><p className="text-xs text-slate-500">{relativeTime(post.created_at)}</p></div>
                  </div>
                  <p className="mt-4 whitespace-pre-wrap text-sm leading-6 text-slate-800">{post.content}</p>
                  {!!post.tags?.length && <div className="mt-3 flex flex-wrap gap-2">{post.tags.map((tag) => <span key={tag} className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-600">#{tag}</span>)}</div>}
                  <div className="mt-4 flex gap-2 border-t border-slate-100 pt-3">
                    <button onClick={() => toggleLike(post.id)} className={`inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-bold ${liked ? 'bg-rose-50 text-rose-700' : 'text-slate-600 hover:bg-slate-50'}`}><Heart className={`h-4 w-4 ${liked ? 'fill-current' : ''}`} />{post.likes_count ?? 0}</button>
                    <button onClick={() => loadComments(post.id)} className="inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-bold text-slate-600 hover:bg-slate-50"><MessageSquare className="h-4 w-4" />{post.comments_count ?? 0}</button>
                  </div>
                  {expandedPostId === post.id && (
                    <div className="mt-3 space-y-3 rounded-xl bg-slate-50 p-3">
                      {(comments[post.id] ?? []).map((comment) => <div key={comment.id} className="rounded-lg bg-white p-3"><div className="text-xs font-black text-slate-700">{profiles[comment.user_id]?.full_name || 'Learner'} · {relativeTime(comment.created_at)}</div><p className="mt-1 text-sm text-slate-800">{comment.content}</p></div>)}
                      <div className="flex gap-2"><input value={commentDrafts[post.id] ?? ''} onChange={(e) => setCommentDrafts((current) => ({ ...current, [post.id]: e.target.value }))} onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); void createComment(post.id); } }} className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm" placeholder="Add a comment…" /><button onClick={() => createComment(post.id)} className="rounded-lg bg-slate-950 px-4 py-2 text-sm font-bold text-white">Reply</button></div>
                    </div>
                  )}
                </article>
              );
            })}
          </div>

          <aside className="space-y-4">
            <div className="rounded-2xl border border-slate-200 bg-white p-5"><div className="flex items-center gap-2"><Trophy className="h-5 w-5 text-amber-500" /><h2 className="font-black">Top learners</h2></div><div className="mt-4 space-y-3">{leaderboard.slice(0, 5).map((row, index) => <div key={row.user_id} className="flex items-center justify-between gap-3 text-sm"><span className="truncate font-semibold">{index + 1}. {profiles[row.user_id]?.full_name || 'Learner'}</span><span className="font-black">{row.points} pts</span></div>)}{!leaderboard.length && <p className="text-sm text-slate-500">Points will appear as learners participate.</p>}</div></div>
            <div className="rounded-2xl border border-slate-200 bg-white p-5"><h2 className="font-black">How points work</h2><div className="mt-3 space-y-2 text-sm text-slate-600"><p>Post an update: +10</p><p>Add a helpful comment: +5</p><p>Start a discussion: +10</p><p>Create a study group: +10</p><p>Join a study group or event: +5</p></div></div>
          </aside>
        </div>
      )}

      {activeTab === 'groups' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between"><div><h2 className="text-2xl font-black">Study groups</h2><p className="text-sm text-slate-600">Build cohort support around programs, exams, skills, or career goals.</p></div><button onClick={() => setShowGroupForm((v) => !v)} className="inline-flex items-center gap-2 rounded-xl bg-brand-blue-600 px-4 py-2.5 text-sm font-black text-white"><Plus className="h-4 w-4" />Create group</button></div>
          {showGroupForm && <div className="grid gap-3 rounded-2xl border border-slate-200 bg-white p-5"><input value={groupDraft.name} onChange={(e) => setGroupDraft((d) => ({ ...d, name: e.target.value }))} className="rounded-xl border border-slate-300 px-3 py-2" placeholder="Group name" /><input value={groupDraft.topic} onChange={(e) => setGroupDraft((d) => ({ ...d, topic: e.target.value }))} className="rounded-xl border border-slate-300 px-3 py-2" placeholder="Topic or program" /><textarea value={groupDraft.description} onChange={(e) => setGroupDraft((d) => ({ ...d, description: e.target.value }))} className="rounded-xl border border-slate-300 p-3" placeholder="What is this group for?" /><button onClick={createGroup} className="justify-self-start rounded-xl bg-slate-950 px-5 py-2.5 font-black text-white">Create</button></div>}
          {!groups.length && <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center"><Users className="mx-auto h-10 w-10 text-slate-400" /><h3 className="mt-3 font-black">No study groups yet</h3><p className="text-sm text-slate-600">Create the first group for your program or certification goal.</p></div>}
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{groups.map((group) => <div key={group.id} className="rounded-2xl border border-slate-200 bg-white p-5"><h3 className="text-lg font-black">{group.name || 'Study Group'}</h3><p className="mt-1 text-sm font-semibold text-brand-blue-700">{group.topic || 'Learner collaboration'}</p><p className="mt-3 text-sm text-slate-600">{group.description || 'Connect with other learners, share resources, and prepare together.'}</p><div className="mt-4 flex items-center justify-between text-xs text-slate-500"><span>{group.member_count ?? 0} members</span>{group.next_session && <span>{new Date(group.next_session).toLocaleDateString()}</span>}</div><button onClick={() => joinGroup(group.id)} disabled={joinedGroupIds.has(group.id)} className="mt-4 w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-black disabled:bg-slate-100 disabled:text-slate-500">{joinedGroupIds.has(group.id) ? 'Joined' : 'Join group'}</button></div>)}</div>
        </div>
      )}

      {activeTab === 'discussions' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between"><div><h2 className="text-2xl font-black">Discussions</h2><p className="text-sm text-slate-600">Ask questions and share knowledge across programs.</p></div><button onClick={() => setShowTopicForm((v) => !v)} className="rounded-xl bg-brand-blue-600 px-4 py-2.5 text-sm font-black text-white">New discussion</button></div>
          {showTopicForm && <div className="grid gap-3 rounded-2xl border border-slate-200 bg-white p-5"><select value={topicDraft.categoryId} onChange={(e) => setTopicDraft((d) => ({ ...d, categoryId: e.target.value }))} className="rounded-xl border border-slate-300 px-3 py-2"><option value="">Choose category</option>{categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}</select><input value={topicDraft.title} onChange={(e) => setTopicDraft((d) => ({ ...d, title: e.target.value }))} className="rounded-xl border border-slate-300 px-3 py-2" placeholder="Discussion title" /><textarea value={topicDraft.content} onChange={(e) => setTopicDraft((d) => ({ ...d, content: e.target.value }))} rows={4} className="rounded-xl border border-slate-300 p-3" placeholder="Question, context, or resource…" /><button onClick={createTopic} className="justify-self-start rounded-xl bg-slate-950 px-5 py-2.5 font-black text-white">Publish discussion</button></div>}
          {!topics.length && <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center"><MessageSquare className="mx-auto h-10 w-10 text-slate-400" /><h3 className="mt-3 font-black">No discussions yet</h3><p className="text-sm text-slate-600">Ask the first question or start a resource thread.</p></div>}
          {topics.map((topic) => <article key={topic.id} className="rounded-2xl border border-slate-200 bg-white p-5"><div className="flex flex-wrap items-center gap-2 text-xs font-bold text-slate-500"><span>{categoryMap[topic.category_id || ''] || 'General'}</span><span>•</span><span>{profiles[topic.author_id || '']?.full_name || 'Learner'}</span><span>•</span><span>{relativeTime(topic.created_at)}</span></div><h3 className="mt-2 text-lg font-black text-slate-900">{topic.title}</h3><p className="mt-2 line-clamp-3 text-sm text-slate-600">{topic.content}</p><p className="mt-3 text-xs font-bold text-slate-500">{topic.reply_count ?? 0} replies</p></article>)}
        </div>
      )}

      {activeTab === 'leaders' && (
        <div className="rounded-2xl border border-slate-200 bg-white p-5 md:p-7"><div className="flex items-center gap-3"><Trophy className="h-7 w-7 text-amber-500" /><div><h2 className="text-2xl font-black">Community leaderboard</h2><p className="text-sm text-slate-600">Recognition for constructive participation and learning progress.</p></div></div><div className="mt-6 divide-y divide-slate-100">{leaderboard.map((row, index) => <div key={row.user_id} className="flex items-center gap-4 py-4"><div className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 font-black">{index + 1}</div><div className="min-w-0 flex-1"><p className="truncate font-black">{profiles[row.user_id]?.full_name || 'Learner'}</p><p className="text-xs text-slate-500">Level {levelFor(row.points)}</p></div><div className="font-black">{row.points.toLocaleString()} pts</div></div>)}{!leaderboard.length && <p className="py-10 text-center text-slate-500">The leaderboard is ready. Points will appear after community activity begins.</p>}</div></div>
      )}
    </div>
  );
}

export default SocialLearningCommunity;
